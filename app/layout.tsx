import type { Metadata } from "next";
import "./globals.css";
import "./planner.css";
import "./auth.css";
import "./admin.css";
import "./responsive.css";

export const metadata: Metadata = { title: "BORA — Planeje. Reserve. Curta.", description: "Planeje, reserve e viva experiências inesquecíveis em um só lugar." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
