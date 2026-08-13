import { z } from "zod";

const listingTypeSchema = z.enum(["VENUE", "BUFFET", "DECORATION_THEME", "SERVICE"]);
const priceUnitSchema = z.enum(["PER_EVENT", "PER_PERSON", "PER_DAY", "STARTING_AT"]);
const listingStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

export const listingImageSchema = z.object({
  url: z.string().url().refine((value) => {
    try {
      return new URL(value).hostname.endsWith(".blob.vercel-storage.com");
    } catch {
      return false;
    }
  }, "Imagem fora do armazenamento autorizado."),
  pathname: z.string().trim().min(5).max(500),
  altText: z.string().trim().max(180).optional(),
});

export const listingDetailsSchema = z.object({
  type: listingTypeSchema,
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(2500),
  priceCents: z.number().int().min(1).max(100_000_000_00),
  priceUnit: priceUnitSchema,
  capacity: z.number().int().min(1).max(100_000).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()).nullable().optional(),
  status: listingStatusSchema,
}).superRefine((data, context) => {
  if (data.type === "VENUE") {
    if (!data.capacity) context.addIssue({ code: "custom", path: ["capacity"], message: "Informe a capacidade do espaço." });
    if (!data.city) context.addIssue({ code: "custom", path: ["city"], message: "Informe a cidade do espaço." });
    if (!data.state) context.addIssue({ code: "custom", path: ["state"], message: "Informe o estado do espaço." });
  }
});

export const listingCreateSchema = listingDetailsSchema.and(z.object({
  images: z.array(listingImageSchema).min(1).max(8),
}));

export const listingPatchSchema = z.object({
  type: listingTypeSchema.optional(),
  name: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().min(20).max(2500).optional(),
  priceCents: z.number().int().min(1).max(100_000_000_00).optional(),
  priceUnit: priceUnitSchema.optional(),
  capacity: z.number().int().min(1).max(100_000).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()).nullable().optional(),
  status: listingStatusSchema.optional(),
  newImages: z.array(listingImageSchema).max(8).optional(),
  removedImageIds: z.array(z.string().uuid()).max(8).optional(),
});
