import type { Metadata } from "next";
import "./globals.css";
import "./landing.css";
import "./planner.css";
import "./auth.css";
import "./admin.css";
import "./supplier.css";
import "./responsive.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://boracurtirbora.com.br"),
  title: "bora curtir bora? — Planeje experiências completas",
  description: "Festas, hospedagens e experiências sob medida. Encontre lugares, fornecedores e serviços completos em um só lugar.",
  openGraph: {
    title: "bora curtir bora?",
    description: "Você imagina. A gente ajuda a tornar real.",
    url: "https://boracurtirbora.com.br",
    siteName: "bora curtir bora?",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og.png", width: 1792, height: 936, alt: "bora curtir bora? — Você imagina. A gente ajuda a tornar real." }],
  },
  twitter: { card: "summary_large_image", title: "bora curtir bora?", description: "Você imagina. A gente ajuda a tornar real.", images: ["/og.png"] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
