"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { authSchemas } from "@/components/auth/auth-schemas";
import { Field, PasswordInput, StrengthMeter } from "@/components/auth/Field";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiRequest, errorMessage } from "@/lib/client-api";

/** Two steps: request a 6-digit code by email, then set a new password with it. */
export function ForgotPasswordForm() {
  const { locale, t } = useI18n();
  const schemas = useMemo(() => authSchemas(t), [t]);
  const [email, setEmail] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  const requestForm = useForm<z.infer<typeof schemas.forgot>>({
    resolver: zodResolver(schemas.forgot),
    defaultValues: { email: "" },
  });
  const resetForm = useForm<z.infer<typeof schemas.reset>>({
    resolver: zodResolver(schemas.reset),
    defaultValues: { otpCode: "", password: "", confirmPassword: "" },
  });
  const password = useWatch({ control: resetForm.control, name: "password" });

  async function requestCode(values: z.infer<typeof schemas.forgot>) {
    setMessage("");
    try {
      await apiRequest("/api/auth/forgot-password", { json: values });
      setEmail(values.email.toLowerCase());
    } catch (error) {
      setMessage(errorMessage(error, t));
    }
  }

  async function reset(values: z.infer<typeof schemas.reset>) {
    setMessage("");
    try {
      await apiRequest("/api/auth/reset-password", { json: { ...values, email } });
      setDone(true);
    } catch (error) {
      setMessage(errorMessage(error, t));
    }
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <p className="mt-4 font-medium text-fg">{t.auth.resetDone}</p>
        <Link href={`/${locale}/login`} className={buttonClasses({ className: "mt-6 w-full" })}>
          {t.auth.login}
        </Link>
      </div>
    );
  }

  const alert = message ? (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-3 text-sm text-danger">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  ) : null;

  if (!email) {
    const { register, handleSubmit, formState } = requestForm;
    return (
      <form onSubmit={handleSubmit(requestCode)} className="space-y-5" noValidate>
        {alert}
        <Field id="email" label={t.auth.email} error={formState.errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder={t.auth.emailPlaceholder}
            aria-invalid={Boolean(formState.errors.email)}
            {...register("email")}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Mail />}
          {t.auth.sendCode}
        </Button>
      </form>
    );
  }

  const { register, handleSubmit, formState } = resetForm;
  return (
    <form onSubmit={handleSubmit(reset)} className="space-y-5" noValidate>
      <p className="rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-3 text-sm text-primary">{t.auth.codeSent}</p>
      {alert}
      <Field id="otpCode" label={t.auth.otp} error={formState.errors.otpCode?.message}>
        <Input
          id="otpCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          placeholder="••••••"
          className="text-center font-mono text-lg tracking-[0.5em]"
          aria-invalid={Boolean(formState.errors.otpCode)}
          {...register("otpCode")}
        />
      </Field>
      <Field id="password" label={t.auth.newPassword} error={formState.errors.password?.message}>
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={Boolean(formState.errors.password)} {...register("password")} />
        {formState.errors.password ? null : <StrengthMeter value={password} />}
      </Field>
      <Field id="confirmPassword" label={t.auth.confirmPassword} error={formState.errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={Boolean(formState.errors.confirmPassword)}
          {...register("confirmPassword")}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />}
        {t.auth.resetPassword}
      </Button>
    </form>
  );
}
