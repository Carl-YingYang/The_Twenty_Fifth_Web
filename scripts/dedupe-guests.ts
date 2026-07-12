// ──────────────────────────────────────────────────────────────────────────
// scripts/dedupe-guests.ts
// P1 — Database integrity: merge duplicate Guest rows by email before
// adding the @unique constraint on Guest.email.
//
// Idempotent: safe to re-run. If there are no duplicates, it prints a
// no-op summary and exits 0.
//
// Run BEFORE `bunx prisma db push` (which applies the @unique constraint).
//
//   bun run dedupe:guests
//   bunx prisma db push
// ──────────────────────────────────────────────────────────────────────────

import { db } from "../src/lib/db";

interface GuestRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  createdAt: Date;
}

/** Count non-null fields on a guest record — used to pick the "most complete" primary. */
function completenessScore(g: GuestRow): number {
  return [
    g.firstName,
    g.lastName,
    g.email,
    g.phone,
    g.address,
    g.city,
    g.country,
    g.notes,
  ].filter((v) => v !== null && v !== undefined && String(v).trim() !== "").length;
}

async function main() {
  console.log("[dedupe-guests] Fetching all guests...");
  const guests = (await db.guest.findMany({
    orderBy: { createdAt: "asc" },
  })) as GuestRow[];

  console.log(`[dedupe-guests] Total guests: ${guests.length}`);

  // Group by lowercased email (skip null/empty emails).
  const groups = new Map<string, GuestRow[]>();
  for (const g of guests) {
    const key = (g.email || "").toLowerCase().trim();
    if (!key) continue;
    const arr = groups.get(key);
    if (arr) arr.push(g);
    else groups.set(key, [g]);
  }

  // Filter to only groups with duplicates.
  const dupGroups = Array.from(groups.entries()).filter(([, arr]) => arr.length > 1);

  console.log(
    `[dedupe-guests] Found ${dupGroups.length} email group(s) with duplicates.`
  );

  if (dupGroups.length === 0) {
    console.log("[dedupe-guests] No duplicates found. Nothing to do.");
    return;
  }

  let totalMerged = 0;

  for (const [email, group] of dupGroups) {
    // Pick the primary = most complete record; tiebreak by most recent createdAt.
    const primary = group.reduce((best, g) => {
      const score = completenessScore(g);
      const bestScore = completenessScore(best);
      if (score > bestScore) return g;
      if (score === bestScore && g.createdAt > best.createdAt) return g;
      return best;
    }, group[0]);

    const duplicates = group.filter((g) => g.id !== primary.id);

    console.log(
      `[dedupe-guests] email="${email}" — keeping ${primary.id} (score ${completenessScore(
        primary
      )}), merging ${duplicates.length} duplicate(s).`
    );

    // Merge each duplicate into the primary inside a transaction.
    for (const dup of duplicates) {
      await db.$transaction(async (tx) => {
        // 1. Re-point all reservations from the duplicate to the primary.
        await tx.reservation.updateMany({
          where: { guestId: dup.id },
          data: { guestId: primary.id },
        });

        // 2. Delete the duplicate guest row.
        await tx.guest.delete({ where: { id: dup.id } });
      });

      totalMerged++;
    }
  }

  console.log(
    `\n[dedupe-guests] Done. Deduplicated ${totalMerged} guest record(s) across ${dupGroups.length} email group(s).`
  );
  console.log(
    "[dedupe-guests] You can now safely run: bunx prisma db push"
  );
}

main()
  .catch((err) => {
    console.error("[dedupe-guests] FATAL:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
