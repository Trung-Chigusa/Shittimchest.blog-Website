import { ok } from "@/lib/api-response";
import { createCsrfToken, setCsrfCookie } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = createCsrfToken();
  const response = ok({ token });
  setCsrfCookie(response, token);
  return response;
}
