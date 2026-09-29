import type { NextRequest } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  return ok({ user });
}
