import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: "ok", database: "ok", timestamp: new Date().toISOString() });
  } catch {
    return fail("SERVER_ERROR", "Healthcheck failed.", 503);
  }
}
