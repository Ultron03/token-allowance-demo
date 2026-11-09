import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

export const metadata: Metadata = {
  title: "Token Allowance demo",
  description: "Watch Token Allowance enforce user, plan, tenant and per-request budgets on a Spring AI app.",
};

export const viewport: Viewport = {
  themeColor: "#f5f6f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
