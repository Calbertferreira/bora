import { ArrowRight, Lightbulb, Palmtree, PartyPopper, Sparkles } from "lucide-react";

const choices = [
  { title: "Festejar", text: "Do local ao último detalhe, sua celebração completa.", icon: PartyPopper, tone: "coral" },
  { title: "Relaxar", text: "Casas, flats e pousadas para sair da rotina.", icon: Palmtree, tone: "green" },
  { title: "Sugestões", text: "Conte sua ideia e criamos experiências do seu jeito.", icon: Lightbulb, tone: "yellow" },
];

export default function Home() {
  return <main>
    <nav><a className="brand" href="#">bora<span>.</span></a><div className="navlinks"><a href="#como">Como funciona</a><a href="#parceiros">Seja parceiro</a><button>Entrar</button></div></nav>
    <section className="hero">
      <div className="eyebrow"><Sparkles size={16}/> experiências feitas para você</div>
      <h1>Seu momento<br/><em>começa aqui.</em></h1>
      <p>Planeje, reserve e viva experiências completas.<br/>A gente reúne o lugar, os serviços e toda a diversão.</p>
      <div className="question">O que vamos fazer?</div>
      <div className="cards">{choices.map(({ title, text, icon: Icon, tone }) => <button className={`card ${tone}`} key={title}><span className="icon"><Icon/></span><span><strong>{title}</strong><small>{text}</small></span><ArrowRight className="arrow"/></button>)}</div>
      <div className="trust"><span>✓ Planejamento simples</span><span>✓ Fornecedores selecionados</span><span>✓ Tudo em um só lugar</span></div>
    </section>
    <section id="como" className="steps"><span>DO SONHO À EXPERIÊNCIA</span><h2>Você imagina. O BORA organiza.</h2><div><article><b>01</b><h3>Conte seus planos</h3><p>Responda algumas perguntas rápidas sobre o seu momento.</p></article><article><b>02</b><h3>Compare opções</h3><p>Receba locais e serviços que combinam com você.</p></article><article><b>03</b><h3>Viva sem preocupação</h3><p>Reserve tudo em um só lugar e aproveite cada instante.</p></article></div></section>
    <footer><a className="brand" href="#">bora<span>.</span></a><p>Seu momento começa aqui.</p><small>© 2026 BORA Experiências</small></footer>
  </main>;
}
