"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { authSchemas } from "@/components/auth/auth-schemas";
import { Field, PasswordInput, StrengthMeter } from "@/components/auth/Field";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiRequest, errorMessage } from "@/lib/client-api";

export function RegisterForm() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [message, setMessage] = useState("");
  const schema = useMemo(() => authSchemas(t).register, [t]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: z.infer<typeof schema>) {
    setMessage("");
    try {
      await apiRequest("/api/auth/register", { json: values });
      toast(t.auth.accountCreated, "success");
      router.push(`/${locale}/dashboard`);
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
      <Field id="displayName" label={t.auth.displayName} error={errors.displayName?.message}>
        <Input
          id="displayName"
          autoComplete="nickname"
          autoFocus
          placeholder={t.auth.displayNamePlaceholder}
          aria-invalid={Boolean(errors.displayName)}
          {...register("displayName")}
        />
      </Field>
      <Field id="email" label={t.auth.email} error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t.auth.emailPlaceholder}
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
      </Field>
      <Field id="password" label={t.auth.password} error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register("password")} />
        {errors.password ? null : <StrengthMeter value={password} />}
      </Field>
      <Field id="confirmPassword" label={t.auth.confirmPassword} error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register("confirmPassword")}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
        {t.auth.register}
      </Button>
    </form>
  );
}
