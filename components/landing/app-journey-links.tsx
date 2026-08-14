import { ArrowRight, Palmtree, PartyPopper, Sparkles } from "lucide-react";

const appJourneys = [
  { href: "/planejar?experiencia=festejar", title: "Festejar", text: "Casamentos, aniversários, 15 anos e outras celebrações.", icon: PartyPopper, tone: "coral" },
  { href: "/planejar?experiencia=viajar", title: "Viajar e relaxar", text: "Casas, flats, hotéis, pousadas e refúgios para sair da rotina.", icon: Palmtree, tone: "green" },
  { href: "/planejar?experiencia=sugestoes", title: "Sugestões sob medida", text: "Conte sua ideia e deixe o Assistente BORA organizar os caminhos.", icon: Sparkles, tone: "yellow" },
];

export function AppJourneyLinks() {
  return <div className="cards app-journey-links">
    {appJourneys.map(({ href, title, text, icon: Icon, tone }) => <a className={`card ${tone}`} href={href} key={href}>
      <span className="icon"><Icon /></span>
      <span><strong>{title}</strong><small>{text}</small></span>
      <ArrowRight className="arrow" />
    </a>)}
  </div>;
}
