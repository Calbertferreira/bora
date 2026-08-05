import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "BORA — Seu momento começa aqui", description: "Planeje experiências completas em um só lugar." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
