import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { RefTracker } from "@/app/ref-tracker";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { DM_Mono, DM_Sans, DM_Serif_Display } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Habitando · o simulador que fecha venda",
    template: "%s · Habitando",
  },
  description:
    "Habitando é o simulador imobiliário para corretores. Mostra o número real ao cliente, com a sua marca, captura de leads e PDF profissional. Cliente que entende, fecha.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${dmSans.variable} ${dmSerif.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        <AuthBootstrap />
        <NuqsAdapter>{children}</NuqsAdapter>
        <Analytics />
        <RefTracker />
      </body>
    </html>
  );
}
