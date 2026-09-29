"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Input, type InputProps } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { passwordScore } from "@/components/auth/auth-schemas";

export function Field({
  id,
  label,
  error,
  hint,
  action,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? "text" : "password"} className={cn("pr-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-subtle transition hover:bg-surface-2 hover:text-fg"
        aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

const meterColors = ["bg-danger", "bg-danger", "bg-warning", "bg-primary", "bg-success"];

export function StrengthMeter({ value }: { value: string }) {
  const { t } = useI18n();
  const score = passwordScore(value);
  if (!value) return <p className="field-hint">{t.auth.passwordRules}</p>;
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={cn("h-1 flex-1 rounded-full bg-line transition", index < score && meterColors[score])} />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-subtle">
        <span className="font-semibold text-muted">{t.auth.strength[score]}</span> · {t.auth.passwordRules}
      </p>
    </div>
  );
}
