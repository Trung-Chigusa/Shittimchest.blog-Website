"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registerSchema } from "@/lib/validators";

type RegisterValues = z.infer<typeof registerSchema>;

async function csrfToken() {
  const response = await fetch("/api/auth/csrf", { credentials: "include" });
  const json = await response.json();
  return json.data.token as string;
}

export function RegisterForm({ locale, labels }: { locale: string; labels: Record<string, string> }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterValues) {
    setMessage("");
    const token = await csrfToken();
    const response = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", "x-csrf-token": token },
      body: JSON.stringify(values),
    });
    const json = await response.json();
    if (!json.success) {
      setMessage(json.message);
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  const submitLabel =
    locale === "vi" ? "Tạo tài khoản" : locale === "ja" ? "アカウント作成" : "Create account";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input placeholder={labels.displayName} autoComplete="name" {...register("displayName")} />
        {errors.displayName ? <p className="mt-1 text-xs text-red-200">{errors.displayName.message}</p> : null}
      </div>
      <div>
        <Input type="email" placeholder={labels.email} autoComplete="email" {...register("email")} />
        {errors.email ? <p className="mt-1 text-xs text-red-200">{errors.email.message}</p> : null}
      </div>
      <Input type="password" placeholder={labels.password} autoComplete="new-password" {...register("password")} />
      {errors.password ? <p className="text-xs text-red-200">{errors.password.message}</p> : null}
      <Input type="password" placeholder={labels.confirmPassword} autoComplete="new-password" {...register("confirmPassword")} />
      {errors.confirmPassword ? <p className="text-xs text-red-200">{errors.confirmPassword.message}</p> : null}
      {message ? <p className="rounded-md border border-cyan-200/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">{message}</p> : null}
      <Button className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {submitLabel}
      </Button>
    </form>
  );
}
