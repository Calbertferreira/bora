"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, Sparkles } from "lucide-react";

type ShowcaseItem = {
  kind: "image" | "video";
  src: string;
  poster?: string;
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  appHref: string;
};

const showcaseItems: ShowcaseItem[] = [
  { kind: "video", src: "/media/aviao-voando.mp4", poster: "/media/viagem-aviao.webp", eyebrow: "A viagem também faz parte da experiência", title: "Bora conhecer", accent: "novos lugares?", description: "Transporte, hospedagem e momentos especiais reunidos em um só planejamento.", appHref: "/planejar?experiencia=viajar" },
  { kind: "image", src: "/media/espaco-cachoeira.webp", eyebrow: "Espaços que surpreendem", title: "Celebre cercado", accent: "pela natureza.", description: "Encontre lugares únicos para transformar sua ideia em uma experiência inesquecível.", appHref: "/planejar?experiencia=festejar" },
  { kind: "video", src: "/media/piscina-tropical.mp4", poster: "/media/piscina-cascata.webp", eyebrow: "Pausa merecida", title: "Um fim de semana", accent: "fora da rotina.", description: "Casas, pousadas e refúgios para relaxar com quem faz seus dias melhores.", appHref: "/planejar?experiencia=viajar" },
  { kind: "image", src: "/media/festa-casamento.webp", eyebrow: "Do sim ao último brinde", title: "Seu casamento,", accent: "do seu jeito.", description: "Espaço, buffet, decoração, música, fotografia e transporte em um só lugar.", appHref: "/planejar?experiencia=festejar" },
  { kind: "image", src: "/media/festa-infantil.webp", eyebrow: "Festa infantil", title: "A alegria deles", accent: "começa aqui.", description: "Temas, espaços e serviços para uma comemoração cheia de boas lembranças.", appHref: "/planejar?experiencia=festejar" },
  { kind: "image", src: "/media/festa-15-anos.webp", eyebrow: "Uma noite para sempre", title: "15 anos de sonhos.", accent: "Bora realizar?", description: "Combine cada detalhe da celebração e acompanhe o planejamento com tranquilidade.", appHref: "/planejar?experiencia=festejar" },
];

export function MediaShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const activeItem = showcaseItems[activeIndex];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % showcaseItems.length), 6500);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const showPrevious = () => setActiveIndex((activeIndex - 1 + showcaseItems.length) % showcaseItems.length);
  const showNext = () => setActiveIndex((activeIndex + 1) % showcaseItems.length);

  return (
    <section className="media-showcase" id="inicio" aria-roledescription="carrossel" aria-label="Experiências do bora curtir bora?">
      <div className="showcase-media" key={`${activeItem.kind}-${activeItem.src}`} aria-hidden="true">
        {activeItem.kind === "video" ? (
          <video autoPlay={isPlaying} muted loop playsInline preload="metadata" poster={activeItem.poster}>
            <source src={activeItem.src} type="video/mp4" />
          </video>
        ) : <img src={activeItem.src} alt="" fetchPriority={activeIndex === 0 ? "high" : "auto"} />}
      </div>
      <div className="showcase-shade" aria-hidden="true" />

      <div className="showcase-content" aria-live="polite">
        <div className="showcase-kicker"><Sparkles size={15} /> {activeItem.eyebrow}</div>
        <h1>{activeItem.title}<br /><em>{activeItem.accent}</em></h1>
        <p>{activeItem.description}</p>
        <div className="showcase-actions">
          <a className="showcase-primary" href={activeItem.appHref}>Abrir no aplicativo <ArrowRight size={18} /></a>
          <a className="showcase-secondary" href="/cadastro?perfil=fornecedor">Quero ser fornecedor</a>
        </div>
      </div>

      <div className="showcase-controls">
        <button type="button" onClick={showPrevious} aria-label="Experiência anterior"><ArrowLeft /></button>
        <div className="showcase-dots" aria-label={`Experiência ${activeIndex + 1} de ${showcaseItems.length}`}>
          {showcaseItems.map((item, index) => <button type="button" key={`${item.src}-dot`} className={index === activeIndex ? "active" : ""} onClick={() => setActiveIndex(index)} aria-label={`Mostrar experiência ${index + 1}: ${item.eyebrow}`} aria-current={index === activeIndex ? "true" : undefined} />)}
        </div>
        <button type="button" onClick={showNext} aria-label="Próxima experiência"><ArrowRight /></button>
        <button type="button" onClick={() => setIsPlaying((current) => !current)} aria-label={isPlaying ? "Pausar apresentação" : "Continuar apresentação"}>{isPlaying ? <Pause /> : <Play />}</button>
      </div>
    </section>
  );
}
