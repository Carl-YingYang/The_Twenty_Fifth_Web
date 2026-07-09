import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

// ============================================================
// POST /api/upload
// Accepts multipart/form-data with a single "file" field.
// Saves to public/uploads/<timestamp>-<slug>.<ext>
// Returns { url: "/uploads/...", filename, size, mimeType }
// Auth required (admin only) — logs to AuditLog.
// ============================================================

const ALLOWED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\.([a-z0-9]+)$/i, "") // strip existing extension
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image"
  );
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Please select an image to upload." },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type || "unknown"}. Allowed: JPG, PNG, WebP, GIF, AVIF.`,
        },
        { status: 415 }
      );
    }

    // Validate size
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 8 MB.`,
        },
        { status: 413 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "File appears to be empty." },
        { status: 400 }
      );
    }

    const ext = EXT_BY_MIME[file.type] ?? "bin";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const slug = slugify(file.name);
    const filename = `${timestamp}-${random}-${slug}.${ext}`;

    // Convert File to Buffer and write to public/uploads
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use dynamic import to avoid bundling fs in edge (this route runs on node)
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "IMAGE_UPLOADED",
        entity: "Upload",
        entityId: filename,
        details: `Uploaded ${filename} (${(file.size / 1024).toFixed(0)} KB, ${file.type})`,
      },
    });

    return NextResponse.json(
      {
        url,
        filename,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file. Please try again." },
      { status: 500 }
    );
  }
}
