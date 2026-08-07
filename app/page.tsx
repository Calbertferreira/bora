import { Sparkles } from "lucide-react";
import { ExperiencePlanner } from "@/components/experience-planner";

export default function Home() {
  return <main>
    <nav className="site-nav"><a className="brand" href="#">bora<span>.</span></a><div className="navlinks"><a className="desktop-only" href="#como">Como funciona</a><a className="desktop-only" href="/cadastro?perfil=fornecedor">Seja parceiro</a><a className="login-link" href="/entrar">Acessar</a></div></nav>
    <section className="hero">
      <div className="eyebrow"><Sparkles size={16}/> seu próximo momento começa aqui</div>
      <h1>Bora curtir,<br/><em>bora?</em></h1>
      <p>Planeje, reserve e viva experiências inesquecíveis.<br/>{"\u00a0"}Locais, hospedagens e serviços reunidos em um só lugar.</p>
      <div className="question">O que vamos fazer?</div>
      <ExperiencePlanner />
      <div className="trust"><span>✓ Planejamento simples</span><span>✓ Fornecedores selecionados</span><span>✓ Tudo em um só lugar</span></div>
    </section>
    <section id="como" className="steps"><span>DO SONHO À EXPERIÊNCIA</span><h2>Você imagina. O BORA organiza.</h2><div><article><b>01</b><h3>Conte seus planos</h3><p>Responda algumas perguntas rápidas sobre o seu momento.</p></article><article><b>02</b><h3>Compare opções</h3><p>Receba locais e serviços que combinam com você.</p></article><article><b>03</b><h3>Viva sem preocupação</h3><p>Reserve tudo em um só lugar e aproveite cada instante.</p></article></div></section>
    <footer><a className="brand" href="#">bora<span>.</span></a><p>Planeje. Reserve. Curta.</p><small>© 2026 BORA Experiências</small></footer>
  </main>;
}
