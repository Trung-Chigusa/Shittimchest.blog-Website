import { mkdir, writeFile } from "fs/promises";
import type { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { UPLOAD_MAX_BYTES, extensionForMime, matchesSignature, uploadDir, uploadPath } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    await requireUser(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("INVALID_INPUT", "Image file is required.", 400);
    const ext = extensionForMime(file.type);
    if (!ext) throw new ApiError("INVALID_INPUT", "Only PNG, JPEG and WEBP images are allowed.", 400);
    if (file.size > UPLOAD_MAX_BYTES) throw new ApiError("INVALID_INPUT", "Image must be 2MB or smaller.", 400);

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!matchesSignature(bytes, ext)) {
      throw new ApiError("INVALID_INPUT", "The file content does not match its image type.", 400);
    }

    await mkdir(uploadDir(), { recursive: true });
    // Server-generated name: never reuse the client's filename.
    const filename = `${crypto.randomUUID()}.${ext}`;
    await writeFile(uploadPath(filename), bytes);
    return ok({ url: `/uploads/${filename}` }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
