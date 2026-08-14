import { ArrowLeft, Sparkles } from "lucide-react";
import { ExperiencePlanner, type Journey } from "@/components/experience-planner";

const journeyByQuery: Record<string, Journey> = {
  festejar: "celebrate",
  viajar: "relax",
  relaxar: "relax",
  sugestoes: "suggest",
};

export default async function PlannerAppPage({ searchParams }: { searchParams: Promise<{ experiencia?: string }> }) {
  const { experiencia } = await searchParams;
  const initialJourney = experiencia ? journeyByQuery[experiencia] ?? null : null;

  return <main className="planner-app-page">
    <header className="planner-app-nav">
      <a className="full-brand" href="/" aria-label="Voltar ao site bora curtir bora?"><span>bora curtir</span><strong>bora?</strong></a>
      <div><a href="/"><ArrowLeft size={16} /> Voltar ao site</a><a className="planner-app-login" href="/entrar">Entrar</a></div>
    </header>

    <section className="planner-app-intro">
      <div className="landing-eyebrow"><Sparkles size={15} /> APLICATIVO BORA</div>
      <h1>Vamos transformar sua ideia<br />em um <em>momento completo.</em></h1>
      <p>Escolha por onde começar. O BORA organiza as informações essenciais e prepara seu planejamento.</p>
      <ExperiencePlanner initialJourney={initialJourney} />
    </section>
  </main>;
}
