import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireRole } from "@/app/api/_lib/auth-helpers";
import { ApiError, apiError } from "@/lib/api";

// ============================================================
// POST /api/upload — admin-only image upload to local disk.
//
// Saves files to public/uploads/ and returns the publicly
// accessible URL { url: "/uploads/<unique-name>.<ext>" }.
//
// Free-tier friendly: no S3 / Cloudinary dependency. Files are
// served directly by Next.js's static file handler from /public.
//
// Constraints:
//   - ADMIN role only (requireRole enforces this)
//   - Images only (jpeg, png, webp, gif, avif)
//   - Max 8 MB per file
//   - Unique filename via timestamp + random hex (collision-safe)
// ============================================================

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(req: NextRequest) {
  try {
    // Auth: admin-only. Uploads let the admin add room/gallery images,
    // so we gate tightly — a logged-in guest must not be able to write
    // arbitrary files into /public.
    await requireRole(req, "ADMIN");

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new ApiError(400, "No file provided. Attach a 'file' field in the form data.");
    }

    // ── Validate MIME type ──
    const ext = ALLOWED_MIME[file.type];
    if (!ext) {
      throw new ApiError(
        400,
        `Unsupported file type: ${file.type}. Allowed: JPG, PNG, WebP, GIF, AVIF.`
      );
    }

    // ── Validate size ──
    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError(
        413,
        `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 8 MB.`
      );
    }

    if (file.size === 0) {
      throw new ApiError(400, "File is empty.");
    }

    // ── Build a collision-safe filename ──
    // Format: <timestamp>-<8-hex>.<ext>
    // The timestamp sorts naturally on disk; the random hex prevents
    // collisions when two uploads land in the same millisecond.
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString("hex");
    const filename = `${timestamp}-${random}.${ext}`;

    // ── Ensure the uploads directory exists ──
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // ── Write the file to disk ──
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return the publicly-accessible relative URL. Next.js serves
    // /public/* at the root, so /uploads/<file> resolves correctly.
    const url = `/uploads/${filename}`;

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("Upload error:", err);
    return apiError(err);
  }
}
