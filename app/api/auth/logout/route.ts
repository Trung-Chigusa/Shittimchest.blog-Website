import { NextResponse, type NextRequest } from "next/server";
import { auditLog } from "@/lib/audit";
import { clearSessionCookie, getCurrentUserFromRequest } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    const user = await getCurrentUserFromRequest(request);
    const response = NextResponse.json({ success: true, data: { loggedOut: true } });
    clearSessionCookie(response);
    if (user) {
      await auditLog({ request, actorId: user.id, action: "LOGOUT", entityType: "User", entityId: user.id });
    }
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
