"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { authSchemas } from "@/components/auth/auth-schemas";
import { Field, PasswordInput } from "@/components/auth/Field";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiRequest, errorMessage } from "@/lib/client-api";

/** Only allow same-site, same-locale redirects after sign-in. */
export function safeNext(next: string | null, locale: string) {
  return next && next.startsWith(`/${locale}/`) && !next.startsWith("//") ? next : `/${locale}/dashboard`;
}

export function LoginForm() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [message, setMessage] = useState("");
  const schema = useMemo(() => authSchemas(t).login, [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setMessage("");
    try {
      await apiRequest("/api/auth/login", { json: values });
      toast(t.auth.welcomeBack, "success");
      router.push(safeNext(params.get("next"), locale));
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error, t));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {message ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
      ) : null}
      <Field id="email" label={t.auth.email} error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder={t.auth.emailPlaceholder}
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
      </Field>
      <Field
        id="password"
        label={t.auth.password}
        error={errors.password?.message}
        action={
          <Link href={`/${locale}/forgot-password`} className="text-xs font-semibold text-primary hover:underline">
            {t.auth.forgot}
          </Link>
        }
      >
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder={t.auth.passwordPlaceholder}
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
      </Field>
      <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-muted">
        <input type="checkbox" className="h-4 w-4 rounded accent-[rgb(var(--primary))]" {...register("remember")} />
        {t.auth.remember}
      </label>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}
        {t.auth.login}
      </Button>
    </form>
  );
}
