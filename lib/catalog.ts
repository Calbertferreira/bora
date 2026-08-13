export const listingTypeOptions = [
  { value: "VENUE", label: "Espaço para eventos", itemLabel: "espaço" },
  { value: "BUFFET", label: "Buffet e alimentação", itemLabel: "serviço de buffet" },
  { value: "DECORATION_THEME", label: "Tema de decoração", itemLabel: "tema" },
  { value: "SERVICE", label: "Outro serviço", itemLabel: "serviço" },
] as const;

export const priceUnitOptions = [
  { value: "PER_EVENT", label: "por evento", shortLabel: "/ evento" },
  { value: "PER_PERSON", label: "por pessoa", shortLabel: "/ pessoa" },
  { value: "PER_DAY", label: "por diária", shortLabel: "/ diária" },
  { value: "STARTING_AT", label: "a partir de", shortLabel: "a partir de" },
] as const;

export type SupplierListingType = (typeof listingTypeOptions)[number]["value"];
export type SupplierPriceUnit = (typeof priceUnitOptions)[number]["value"];

export function listingTypeLabel(type: SupplierListingType) {
  return listingTypeOptions.find((option) => option.value === type)?.label ?? type;
}

export function priceUnitLabel(unit: SupplierPriceUnit) {
  return priceUnitOptions.find((option) => option.value === unit)?.shortLabel ?? unit;
}

export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(priceCents / 100);
}
