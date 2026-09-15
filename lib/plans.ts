import { z } from "zod";

export const planStatuses = [
  "DRAFT", "SUBMITTED", "IN_REVIEW", "PROPOSALS_AVAILABLE", "SELECTED",
  "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED",
] as const;

export type PlanStatus = (typeof planStatuses)[number];

export const planStatusLabels: Record<PlanStatus, string> = {
  DRAFT: "Rascunho",
  SUBMITTED: "Enviado",
  IN_REVIEW: "Em análise",
  PROPOSALS_AVAILABLE: "Opções disponíveis",
  SELECTED: "Opção escolhida",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em realização",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const planCreateSchema = z.object({
  type: z.enum(["celebrate", "relax", "suggest"]),
  occasion: z.string().trim().max(120).optional().default(""),
  idea: z.string().trim().max(2000).optional().default(""),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().max(2).optional().default(""),
  startDate: z.iso.date(),
  endDate: z.iso.date().optional().or(z.literal("")),
  guests: z.coerce.number().int().min(1).max(100000),
  budgetLabel: z.string().trim().min(2).max(100),
  services: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
}).superRefine((value, context) => {
  if (value.type !== "suggest" && !value.occasion) context.addIssue({ code: "custom", path: ["occasion"], message: "Escolha o tipo de experiência." });
  if (value.type === "suggest" && value.idea.length < 10) context.addIssue({ code: "custom", path: ["idea"], message: "Conte um pouco mais sobre sua ideia." });
  if (value.endDate && value.endDate < value.startDate) context.addIssue({ code: "custom", path: ["endDate"], message: "A data final deve ser posterior à inicial." });
});

export function planTitle(type: "celebrate" | "relax" | "suggest", occasion: string) {
  if (occasion) return occasion;
  return type === "suggest" ? "Experiência sob medida" : type === "relax" ? "Momento para relaxar" : "Celebração";
}
