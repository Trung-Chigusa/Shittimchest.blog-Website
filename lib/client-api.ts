"use client";

import type { Dictionary } from "@/lib/i18n";

export class ClientApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function csrfToken() {
  const response = await fetch("/api/auth/csrf", { credentials: "include", cache: "no-store" });
  const json = await response.json();
  return json.data.token as string;
}

/**
 * Calls a JSON API route with the CSRF double-submit token attached.
 * Throws ClientApiError on `{ success: false }` or network failure.
 */
export async function apiRequest<T = unknown>(
  url: string,
  { method = "POST", json, form }: { method?: string; json?: unknown; form?: FormData } = {},
): Promise<T> {
  let response: Response;
  try {
    const token = await csrfToken();
    response = await fetch(url, {
      method,
      credentials: "include",
      headers: {
        "x-csrf-token": token,
        ...(json !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: form ?? (json !== undefined ? JSON.stringify(json) : undefined),
    });
  } catch {
    throw new ClientApiError("NETWORK", "Network error");
  }

  const payload = await response.json().catch(() => null);
  if (!payload?.success) {
    throw new ClientApiError(payload?.code ?? "SERVER_ERROR", payload?.message ?? "Request failed");
  }
  return payload.data as T;
}

/** Localised message for an error thrown by apiRequest. */
export function errorMessage(error: unknown, t: Dictionary) {
  if (error instanceof ClientApiError) {
    // INVALID_INPUT carries a specific validation message from the server, so show it as-is.
    if (error.code !== "INVALID_INPUT" && error.code in t.errors) {
      return t.errors[error.code as keyof Dictionary["errors"]];
    }
    return error.message;
  }
  return t.errors.SERVER_ERROR;
}
