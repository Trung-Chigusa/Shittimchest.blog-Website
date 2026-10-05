import path from "path";

/** Image types members may upload, keyed by the extension we store them under. */
export const UPLOAD_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
} as const;

export type UploadExtension = keyof typeof UPLOAD_TYPES;

export const UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

// The ignore hints stop the bundler from tracing the whole project into the route bundles
// just because a path is built at runtime.
export function uploadDir() {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");
}

/** Absolute path for a stored upload. Callers must validate `name` with parseStoredName first. */
export function uploadPath(name: string) {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads", name);
}

/** Stored names are always `<uuid>.<ext>`; anything else is rejected before touching the disk. */
const STORED_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/;

export function parseStoredName(name: string): UploadExtension | null {
  const match = STORED_NAME.exec(name);
  return match ? (match[1] as UploadExtension) : null;
}

export function extensionForMime(mime: string): UploadExtension | null {
  const entry = Object.entries(UPLOAD_TYPES).find(([, type]) => type === mime);
  return entry ? (entry[0] as UploadExtension) : null;
}

/**
 * Checks the file's leading bytes against its claimed format. The Content-Type header is
 * chosen by the client, so it cannot be trusted on its own.
 */
export function matchesSignature(bytes: Uint8Array, extension: UploadExtension) {
  const startsWith = (signature: number[], offset = 0) => signature.every((value, index) => bytes[offset + index] === value);
  switch (extension) {
    case "png":
      return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "jpg":
      return startsWith([0xff, 0xd8, 0xff]);
    case "webp":
      // "RIFF" <size> "WEBP"
      return startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8);
  }
}
