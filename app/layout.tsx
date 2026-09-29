import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { isLocale } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://shittimchest.blog"),
  title: {
    default: `${SITE_NAME} · CTF & Cybersecurity Blog`,
    template: `%s · ${SITE_NAME}`,
  },
  description: "CTF writeups, cybersecurity notes, network & system labs — shared by the Wanna Denia Team community.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#070a14" },
  ],
};

// Runs before paint so the saved theme applies without a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||((!t||t==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headerLocale = (await headers()).get("x-locale") ?? "vi";
  const lang = isLocale(headerLocale) ? headerLocale : "vi";

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable}`} style={{ ["--font-display" as string]: "var(--font-sans)" }}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
