"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

async function csrfToken() {
  const response = await fetch("/api/auth/csrf", { credentials: "include" });
  const json = await response.json();
  return json.data.token as string;
}

export function LogoutButton({ label, locale }: { label: string; locale: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    const token = await csrfToken();
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "x-csrf-token": token },
    });
    router.push(`/${locale}`);
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" className="hidden h-9 px-3 sm:inline-flex" disabled={pending} onClick={logout}>
      <LogOut className="h-4 w-4" />
      {label}
    </Button>
  );
}
