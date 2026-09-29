"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginSchema } from "@/lib/validators";

type LoginInput = z.input<typeof loginSchema>;
type LoginValues = z.output<typeof loginSchema>;

async function csrfToken() {
  const response = await fetch("/api/auth/csrf", { credentials: "include" });
  const json = await response.json();
  return json.data.token as string;
}

export function LoginForm({ locale, labels }: { locale: string; labels: Record<string, string> }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });
  const loginPlaceholder =
    locale === "vi" ? "Email hoặc tên đăng nhập" : locale === "ja" ? "メールまたはユーザー名" : "Email or username";

  async function onSubmit(values: LoginValues) {
    setMessage("");
    const token = await csrfToken();
    const response = await fetch("/api/auth/login", {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input type="text" placeholder={loginPlaceholder} autoComplete="username" {...register("email")} />
        {errors.email ? <p className="mt-1 text-xs text-red-200">{errors.email.message}</p> : null}
      </div>
      <div>
        <Input type="password" placeholder={labels.password} autoComplete="current-password" {...register("password")} />
        {errors.password ? <p className="mt-1 text-xs text-red-200">{errors.password.message}</p> : null}
      </div>
      <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-cyan-300" {...register("remember")} />
          {labels.remember}
        </label>
        <Link className="text-cyan-200 hover:text-white" href={`/${locale}/register`}>
          {labels.forgot}
        </Link>
      </div>
      {message ? <p className="rounded-md border border-red-200/20 bg-red-500/10 px-3 py-2 text-sm text-red-100">{message}</p> : null}
      <Button className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {labels.login}
      </Button>
      <p className="text-center text-sm text-slate-400">
        <Link className="text-cyan-200 hover:text-white" href={`/${locale}/register`}>
          {labels.register}
        </Link>
      </p>
    </form>
  );
}
