import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Chakra_Petch, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { isLocale } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// Squared, technical letterforms for HUD labels and headings (has Vietnamese glyphs).
const display = Chakra_Petch({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
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
  themeColor: "#08090d",
  colorScheme: "dark",
};

// Runs before paint: enables reveal-on-scroll styling only when JavaScript is available,
// and marks the first page view of a session for the boot intro.
const initScript = `(function(){var h=document.documentElement;h.classList.add('fx');try{if(!sessionStorage.getItem('booted')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)h.classList.add('boot')}catch(e){}})()`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headerLocale = (await headers()).get("x-locale") ?? "vi";
  const lang = isLocale(headerLocale) ? headerLocale : "vi";

  return (
    <html lang={lang} className="dark" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} ${mono.variable}`}>
        <Script id="fx-init" strategy="beforeInteractive">
          {initScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
