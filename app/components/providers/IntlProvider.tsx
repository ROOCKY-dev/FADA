"use client";

import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/ar.json";

export function IntlProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextIntlClientProvider locale="ar" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
