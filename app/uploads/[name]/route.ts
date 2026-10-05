import { readFile } from "fs/promises";
import type { NextRequest } from "next/server";
import { UPLOAD_TYPES, parseStoredName, uploadPath } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves member uploads from disk. `next start` only serves files that were already in
 * public/ when the server booted, so images uploaded at runtime would otherwise 404
 * until the next restart.
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const extension = parseStoredName(name);
  if (!extension) return new Response("Not found", { status: 404 });

  try {
    const bytes = await readFile(uploadPath(name));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": UPLOAD_TYPES[extension],
        "Content-Length": String(bytes.byteLength),
        // Names are random UUIDs and never overwritten, so they can be cached forever.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
