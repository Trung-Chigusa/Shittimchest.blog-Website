"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { apiRequest, errorMessage } from "@/lib/client-api";

export function useLogout() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await apiRequest("/api/auth/logout");
      router.push(`/${locale}`);
      router.refresh();
    } catch (error) {
      toast(errorMessage(error, t), "error");
    } finally {
      setPending(false);
    }
  }

  return { logout, pending };
}
