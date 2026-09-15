"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Palmtree,
  PartyPopper,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export type Journey = "celebrate" | "relax" | "suggest";

const journeys = [
  { id: "celebrate" as const, title: "Festejar", text: "Do local ao último detalhe, sua celebração completa.", icon: PartyPopper, tone: "coral" },
  { id: "relax" as const, title: "Relaxar", text: "Casas, flats e pousadas para sair da rotina.", icon: Palmtree, tone: "green" },
  { id: "suggest" as const, title: "Sugestões sob medida", text: "Conte sua ideia e criamos experiências do seu jeito.", icon: Sparkles, tone: "yellow" },
];

const occasions = ["Aniversário infantil", "15 ou 16 anos", "Aniversário adulto", "Bodas", "Casamento", "Corporativo", "Outro"];
const stays = ["Casa de praia", "Flat", "Hotel", "Pousada", "Chalé", "Hostel"];
const services = ["Local", "Buffet", "Decoração", "DJ ou banda", "Fotografia", "Bolo e doces", "Transporte", "Hospedagem", "Garçons", "Segurança"];

export function ExperiencePlanner({ initialJourney = null }: { initialJourney?: Journey | null }) {
  const [journey, setJourney] = useState<Journey | null>(initialJourney);
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState("");
  const [budget, setBudget] = useState("");
  const [idea, setIdea] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [createdPlanId, setCreatedPlanId] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("bora_plan_draft");
    if (!stored) return;
    try {
      const draft = JSON.parse(stored);
      setJourney(draft.type); setChoice(draft.occasion ?? ""); setIdea(draft.idea ?? "");
      setCity(draft.city ?? ""); setState(draft.state ?? ""); setStartDate(draft.startDate ?? "");
      setEndDate(draft.endDate ?? ""); setGuests(String(draft.guests ?? "")); setBudget(draft.budgetLabel ?? "");
      setSelectedServices(draft.services ?? []); setStep(draft.type === "suggest" ? 3 : 4);
    } catch { sessionStorage.removeItem("bora_plan_draft"); }
  }, []);

  const selectedJourney = journeys.find((item) => item.id === journey);
  const maxSteps = journey === "suggest" ? 3 : 4;

  function openJourney(id: Journey) {
    setJourney(id);
    setStep(1);
    setChoice("");
    setFinished(false);
    setError("");
    setAuthRequired(false);
  }

  function closeJourney() {
    setJourney(null);
    setFinished(false);
  }

  function toggleService(service: string) {
    setSelectedServices((current) => current.includes(service) ? current.filter((item) => item !== service) : [...current, service]);
  }

  function canContinue() {
    if (step === 1) return journey === "suggest" ? idea.trim().length >= 10 : Boolean(choice);
    if (step === 2) return Boolean(city && startDate && guests && budget && (!endDate || endDate >= startDate));
    if (step === 3 && journey !== "suggest") return selectedServices.length > 0;
    return true;
  }

  async function createPlan() {
    if (!journey) return;
    const payload = { type: journey, occasion: choice, idea, city, state, startDate, endDate, guests: Number(guests), budgetLabel: budget, services: selectedServices };
    setSaving(true); setError(""); setAuthRequired(false);
    const response = await fetch("/api/plans", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(body.error ?? "Não foi possível criar o planejamento.");
      if (response.status === 401) { sessionStorage.setItem("bora_plan_draft", JSON.stringify(payload)); setAuthRequired(true); }
      return;
    }
    sessionStorage.removeItem("bora_plan_draft");
    setCreatedPlanId(body.planId); setFinished(true);
  }

  return <>
    <div className="cards">{journeys.map(({ id, title, text, icon: Icon, tone }) => <button className={`card ${tone}`} key={id} onClick={() => openJourney(id)}><span className="icon"><Icon /></span><span><strong>{title}</strong><small>{text}</small></span><ArrowRight className="arrow" /></button>)}</div>

    {journey && <div className="planner-backdrop" role="presentation">
      <section className="planner" role="dialog" aria-modal="true" aria-labelledby="planner-title">
        <header className="planner-header">
          <div><span className={`mini-icon ${selectedJourney?.tone}`}>{selectedJourney && <selectedJourney.icon size={20} />}</span><div><small>PLANEJAR</small><h2 id="planner-title">{selectedJourney?.title}</h2></div></div>
          <button className="close" aria-label="Fechar planejador" onClick={closeJourney}><X /></button>
        </header>

        {!finished ? <>
          <div className="progress" aria-label={`Etapa ${step} de ${maxSteps}`}><span style={{ width: `${(step / maxSteps) * 100}%` }} /></div>
          <div className="step-label">ETAPA {step} DE {maxSteps}</div>
          <div className="planner-body">
            {step === 1 && journey === "celebrate" && <ChoiceStep title="Qual é o motivo da festa?" subtitle="Escolha a opção que mais combina com o seu momento." values={occasions} selected={choice} onSelect={setChoice} />}
            {step === 1 && journey === "relax" && <ChoiceStep title="Onde você quer relaxar?" subtitle="Depois você poderá ajustar todos os detalhes da estadia." values={stays} selected={choice} onSelect={setChoice} />}
            {step === 1 && journey === "suggest" && <div className="form-step"><h3>Conte o que você está imaginando</h3><p>Escreva do seu jeito. O Assistente BORA organiza a ideia para você.</p><textarea value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Ex.: Quero comemorar 20 anos de casamento em um lugar tranquilo, com jantar e hospedagem para a família..." autoFocus /><span className="hint">Quanto mais detalhes, melhores serão as sugestões.</span></div>}
            {step === 2 && <DetailsStep city={city} state={state} startDate={startDate} endDate={endDate} guests={guests} budget={budget} setCity={setCity} setState={setState} setStartDate={setStartDate} setEndDate={setEndDate} setGuests={setGuests} setBudget={setBudget} />}
            {step === 3 && journey !== "suggest" && <div className="form-step"><h3>O que você quer incluir?</h3><p>Selecione um ou mais itens. Você poderá ajustar tudo depois.</p><div className="service-grid">{services.map((service) => <button key={service} className={selectedServices.includes(service) ? "selected" : ""} onClick={() => toggleService(service)}><span>{selectedServices.includes(service) && <Check size={15} />}</span>{service}</button>)}</div></div>}
            {((step === 4 && journey !== "suggest") || (step === 3 && journey === "suggest")) && <Summary journey={selectedJourney?.title ?? ""} choice={choice} idea={idea} city={city} startDate={startDate} endDate={endDate} guests={guests} budget={budget} selectedServices={selectedServices} />}
            {error && <div className="planner-error" role="alert"><p>{error}</p>{authRequired && <div><a href="/entrar?retorno=/planejar">Entrar</a><a href="/cadastro?retorno=/planejar">Criar conta</a></div>}</div>}
          </div>
          <footer className="planner-actions">
            <button className="back" onClick={() => step === 1 ? closeJourney() : setStep(step - 1)}><ArrowLeft size={17} /> {step === 1 ? "Voltar ao início" : "Voltar"}</button>
            <button className="continue" disabled={!canContinue() || saving} onClick={() => step === maxSteps ? createPlan() : setStep(step + 1)}>{saving ? "Salvando..." : step === maxSteps ? "Criar meu planejamento" : "Continuar"} <ArrowRight size={17} /></button>
          </footer>
        </> : <div className="success">
          <span><Sparkles /></span><small>PLANEJAMENTO INICIADO</small><h3>Seu momento já começou.</h3><p>Suas preferências foram salvas. A equipe BORA poderá acompanhar a solicitação e preparar as melhores opções.</p><div><Check size={17} /> Planejamento salvo com sucesso</div><a className="success-link" href={`/cliente/planejamentos/${createdPlanId}`}>Acompanhar planejamento</a>
        </div>}
      </section>
    </div>}
  </>;
}

function ChoiceStep({ title, subtitle, values, selected, onSelect }: { title: string; subtitle: string; values: string[]; selected: string; onSelect: (value: string) => void }) {
  return <div className="form-step"><h3>{title}</h3><p>{subtitle}</p><div className="choice-grid">{values.map((value) => <button key={value} className={selected === value ? "selected" : ""} onClick={() => onSelect(value)}><span>{selected === value && <Check size={15} />}</span>{value}</button>)}</div></div>;
}

function DetailsStep({ city, state, startDate, endDate, guests, budget, setCity, setState, setStartDate, setEndDate, setGuests, setBudget }: { city: string; state: string; startDate: string; endDate: string; guests: string; budget: string; setCity: (value: string) => void; setState: (value: string) => void; setStartDate: (value: string) => void; setEndDate: (value: string) => void; setGuests: (value: string) => void; setBudget: (value: string) => void }) {
  return <div className="form-step"><h3>Agora, os detalhes principais</h3><p>Essas informações ajudam a encontrar opções realmente compatíveis.</p><div className="field-grid">
    <label><span><MapPin size={15} /> Cidade</span><input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ex.: Fortaleza" /></label>
    <label><span>Estado</span><input value={state} maxLength={2} onChange={(event) => setState(event.target.value.toUpperCase())} placeholder="CE" /></label>
    <label><span><CalendarDays size={15} /> Data inicial</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
    <label><span><CalendarDays size={15} /> Data final</span><input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
    <label><span><Users size={15} /> Quantas pessoas?</span><input type="number" min="1" value={guests} onChange={(event) => setGuests(event.target.value)} placeholder="Ex.: 80" /></label>
    <label><span>R$ Faixa de investimento</span><select value={budget} onChange={(event) => setBudget(event.target.value)}><option value="">Selecione</option><option>Até R$ 3 mil</option><option>R$ 3 mil a R$ 8 mil</option><option>R$ 8 mil a R$ 15 mil</option><option>R$ 15 mil a R$ 30 mil</option><option>Acima de R$ 30 mil</option></select></label>
  </div></div>;
}

function Summary({ journey, choice, idea, city, startDate, endDate, guests, budget, selectedServices }: { journey: string; choice: string; idea: string; city: string; startDate: string; endDate: string; guests: string; budget: string; selectedServices: string[] }) {
  const formatDate = (value: string) => value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "";
  const formattedDate = endDate && endDate !== startDate ? `${formatDate(startDate)} a ${formatDate(endDate)}` : formatDate(startDate);
  return <div className="form-step"><h3>Seu plano está tomando forma</h3><p>Confira as preferências antes de criar o planejamento.</p><div className="summary-card">
    <div className="summary-title"><span><Sparkles size={18} /></span><div><small>{journey.toUpperCase()}</small><strong>{choice || "Experiência personalizada"}</strong></div></div>
    {idea && <blockquote>“{idea}”</blockquote>}
    <dl><div><dt>Local</dt><dd>{city}</dd></div><div><dt>Data</dt><dd>{formattedDate}</dd></div><div><dt>Pessoas</dt><dd>{guests}</dd></div><div><dt>Investimento</dt><dd>{budget}</dd></div></dl>
    {selectedServices.length > 0 && <div className="tags">{selectedServices.map((service) => <span key={service}>{service}</span>)}</div>}
  </div></div>;
}
