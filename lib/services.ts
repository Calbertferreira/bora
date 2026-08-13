export type ServiceOption = { id: string; name: string };

export function normalizeServiceName(value: string) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").toLowerCase();
}

export function cleanServiceName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
