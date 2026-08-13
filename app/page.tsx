import {
  ArrowRight,
  CalendarCheck,
  Check,
  Heart,
  MapPinned,
  Palmtree,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import { ExperiencePlanner } from "@/components/experience-planner";

const benefits = [
  { icon: MapPinned, title: "Locais que combinam com você", text: "Espaços para festas, casas de praia, flats, hotéis e pousadas em uma única busca." },
  { icon: WandSparkles, title: "Serviços para completar", text: "Buffet, decoração, música, fotografia, transporte e muito mais no mesmo planejamento." },
  { icon: CalendarCheck, title: "Tudo organizado", text: "Preferências, datas, fornecedores e orçamento reunidos para você decidir com tranquilidade." },
  { icon: ShieldCheck, title: "Fornecedores selecionados", text: "Parceiros passam por análise antes de publicar serviços, fotos e preços na plataforma." },
];

const questions = [
  { title: "O que é o bora curtir bora?", text: "É uma plataforma para planejar experiências completas, reunindo lugares, hospedagens e serviços em um só ambiente." },
  { title: "Posso contratar apenas parte do pacote?", text: "Sim. Você poderá escolher somente o local ou combinar buffet, decoração, transporte, hospedagem e outros serviços." },
  { title: "Como os fornecedores participam?", text: "O fornecedor cria seu perfil, informa todos os serviços da empresa e, após aprovação, publica seu portfólio com fotos e preços." },
];

export default function Home() {
  return <main className="landing-page">
    <nav className="landing-nav" aria-label="Navegação principal">
      <a className="full-brand" href="#inicio" aria-label="bora curtir bora? — início"><span>bora curtir</span><strong>bora?</strong></a>
      <div className="landing-nav-links">
        <a className="desktop-only" href="#como-funciona">Como funciona</a>
        <a className="desktop-only" href="#para-fornecedores">Para fornecedores</a>
        <a className="landing-login" href="/entrar">Entrar</a>
        <a className="landing-nav-cta" href="#planejar">Quero planejar</a>
      </div>
    </nav>

    <section className="landing-hero" id="inicio">
      <div className="hero-copy">
        <div className="landing-eyebrow"><Sparkles size={15} /> Seu momento começa aqui</div>
        <h1>Você imagina.<br/><em>A gente ajuda</em><br/>a tornar real.</h1>
        <p>Festas, momentos de descanso e experiências sob medida. Encontre o lugar, combine os serviços e organize tudo em um só lugar.</p>
        <div className="hero-actions">
          <a className="hero-primary" href="#planejar">Começar meu planejamento <ArrowRight size={18} /></a>
          <a className="hero-secondary" href="/cadastro?perfil=fornecedor"><Store size={17} /> Quero ser fornecedor</a>
        </div>
        <div className="hero-trust">
          <span><Check size={14} /> Planejamento gratuito</span>
          <span><Check size={14} /> Escolhas personalizadas</span>
        </div>
      </div>

      <div className="hero-experiences" aria-label="Experiências disponíveis">
        <article className="experience-tile celebrate-tile">
          <span><PartyPopper /></span><small>FESTEJAR</small><strong>Do espaço<br/>ao último brinde.</strong>
          <div className="people-dots" aria-hidden="true"><i/><i/><i/><i/></div>
        </article>
        <article className="experience-tile relax-tile">
          <span><Palmtree /></span><small>RELAXAR</small><strong>Um fim de semana<br/>fora da rotina.</strong>
          <div className="sun-shape" aria-hidden="true" />
        </article>
        <article className="experience-tile suggest-tile">
          <span><WandSparkles /></span><div><small>SUGESTÕES SOB MEDIDA</small><strong>Conte sua ideia.<br/>A gente monta os caminhos.</strong></div>
          <ArrowRight size={24} />
        </article>
        <div className="hero-seal" aria-hidden="true"><Heart size={19} fill="currentColor"/><b>curta<br/>mais</b></div>
      </div>
    </section>

    <section className="landing-proof" aria-label="Diferenciais da plataforma">
      <p>Uma experiência pode reunir</p>
      <div><span>Espaços</span><i>•</i><span>Buffet</span><i>•</i><span>Decoração</span><i>•</i><span>Hospedagem</span><i>•</i><span>Transporte</span></div>
    </section>

    <section className="planner-section" id="planejar">
      <div className="section-heading centered">
        <span>BORA COMEÇAR?</span>
        <h2>O que você quer viver?</h2>
        <p>Escolha um caminho. Em poucos passos, organizamos as informações essenciais do seu momento.</p>
      </div>
      <ExperiencePlanner />
    </section>

    <section className="benefits-section">
      <div className="section-heading">
        <span>TUDO EM UM SÓ LUGAR</span>
        <h2>Menos tempo procurando.<br/>Mais tempo para curtir.</h2>
      </div>
      <div className="benefit-grid">
        {benefits.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon /></span><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </section>

    <section className="how-section" id="como-funciona">
      <div className="how-intro">
        <div className="section-heading"><span>DO PLANO À EXPERIÊNCIA</span><h2>Simples para escolher.<br/>Completo para organizar.</h2></div>
        <p>Você não precisa abrir vários sites, conversar com dezenas de fornecedores e montar planilhas para fazer um momento especial acontecer.</p>
      </div>
      <div className="how-steps">
        <article><b>01</b><span><Sparkles /></span><h3>Conte seus planos</h3><p>Informe o tipo de momento, a cidade, a data, o número de pessoas e o orçamento.</p></article>
        <article><b>02</b><span><UsersRound /></span><h3>Compare combinações</h3><p>Descubra locais e serviços compatíveis e monte a experiência do seu jeito.</p></article>
        <article><b>03</b><span><Heart /></span><h3>Escolha e curta</h3><p>Acompanhe o planejamento em um só ambiente e aproveite o que realmente importa.</p></article>
      </div>
    </section>

    <section className="supplier-section" id="para-fornecedores">
      <div className="supplier-visual" aria-hidden="true">
        <div className="supplier-card card-one"><span>Espaço para eventos</span><b>Fotos, capacidade e diária</b></div>
        <div className="supplier-card card-two"><span>Buffet e alimentação</span><b>Cardápios e preço por pessoa</b></div>
        <div className="supplier-card card-three"><span>Temas de decoração</span><b>Portfólio e preço por evento</b></div>
        <div className="supplier-avatar"><Store /></div>
      </div>
      <div className="supplier-copy">
        <span>PARA QUEM FAZ ACONTECER</span>
        <h2>Sua empresa oferece vários serviços? Perfeito.</h2>
        <p>No <strong>bora curtir bora?</strong>, uma empresa pode atuar com espaço, buffet, decoração, transporte e quantos serviços fizerem sentido — cada oferta com suas fotos e preços.</p>
        <ul><li><Check /> Apresente todo o seu portfólio</li><li><Check /> Organize diferentes tipos de serviços</li><li><Check /> Receba oportunidades compatíveis</li></ul>
        <a href="/cadastro?perfil=fornecedor">Cadastrar minha empresa <ArrowRight size={18} /></a>
      </div>
    </section>

    <section className="faq-section">
      <div className="section-heading"><span>PERGUNTAS FREQUENTES</span><h2>Antes de dizer “bora”,<br/>tire suas dúvidas.</h2></div>
      <div className="faq-list">{questions.map(({ title, text }) => <details key={title}><summary>{title}<span>+</span></summary><p>{text}</p></details>)}</div>
    </section>

    <section className="final-cta">
      <div><span><Sparkles /></span><small>SEU PRÓXIMO MOMENTO</small><h2>Então...<br/>bora curtir bora?</h2><p>Comece agora e transforme uma ideia em uma experiência completa.</p><a href="#planejar">Planejar meu momento <ArrowRight size={18}/></a></div>
    </section>

    <footer className="landing-footer">
      <a className="full-brand light" href="#inicio"><span>bora curtir</span><strong>bora?</strong></a>
      <p>Planeje. Reserve. Curta.</p>
      <nav aria-label="Links do rodapé"><a href="#como-funciona">Como funciona</a><a href="#para-fornecedores">Fornecedores</a><a href="/entrar">Entrar</a></nav>
      <small>© 2026 bora curtir bora? · boracurtirbora.com.br</small>
    </footer>
  </main>;
}
