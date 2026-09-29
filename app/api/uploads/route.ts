import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    await requireUser(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("INVALID_INPUT", "Image file is required.", 400);
    const ext = allowed.get(file.type);
    if (!ext) throw new ApiError("INVALID_INPUT", "Only PNG, JPEG and WEBP images are allowed.", 400);
    if (file.size > 2 * 1024 * 1024) throw new ApiError("INVALID_INPUT", "Image must be 2MB or smaller.", 400);

    const bytes = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filename = `${crypto.randomUUID()}.${ext}`;
    await writeFile(path.join(uploadDir, filename), bytes);
    return ok({ url: `/uploads/${filename}` }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
