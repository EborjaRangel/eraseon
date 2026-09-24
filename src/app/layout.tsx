import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EraseOn",
  description: "Registro de bardas con brocha mágica, fotos de antes y después, mapa y área.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2e1065",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-dvh font-[family-name:var(--font-body)] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
