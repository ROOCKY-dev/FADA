import type { Metadata } from "next";
import localFont from "next/font/local";
import "../styles/globals.css";
import { IntlProvider } from "@/components/providers/IntlProvider";

const sans = localFont({
  src: [
    {
      path: "../public/fonts/IBMPlexSansArabic-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/IBMPlexSansArabic-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/IBMPlexSansArabic-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/IBMPlexSansArabic-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const mono = localFont({
  src: [
    {
      path: "../public/fonts/IBMPlexMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "FADA | فضاء",
  description: "بوابة عربية بدون إعلانات، مفتوحة المصدر للأفلام والمسلسلات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html dir="rtl" lang="ar" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:bg-[var(--color-bg-surface)] focus:text-[var(--color-fg-primary)] focus:px-3 focus:py-2 focus:rounded-md focus:outline focus:outline-2 focus:outline-[var(--color-accent-gold)]"
        >
          تخطّى إلى المحتوى الرئيسي
        </a>
        <IntlProvider>
          <main id="main">
            {children}
          </main>
        </IntlProvider>
      </body>
    </html>
  );
}
