"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { setSfx, sfxEnabled, subscribeSfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

export function SoundToggle() {
  const { t } = useI18n();
  const on = useSyncExternalStore(subscribeSfx, sfxEnabled, () => false);
  return (
    <button
      type="button"
      onClick={() => setSfx(!on)}
      aria-pressed={on}
      aria-label={t.fx.sound}
      title={t.fx.sound}
      className={cn(
        "grid h-9 w-9 place-items-center text-muted transition hover:text-primary",
        on && "text-primary",
      )}
    >
      {on ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
    </button>
  );
}
