export function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  if (normalized.length < 12 || normalized.length > 15) throw new Error("Informe um WhatsApp válido com DDD.");
  return `+${normalized}`;
}

export function whatsappDigits(value: string) {
  return normalizeWhatsapp(value).slice(1);
}
