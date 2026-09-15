export function calculateEmbeddedCommission(subtotalCents: number, commissionBps: number) {
  const safeBps = Math.max(0, Math.min(commissionBps, 9_500));
  const totalCents = safeBps === 0 ? subtotalCents : Math.round(subtotalCents * 10_000 / (10_000 - safeBps));
  return { subtotalCents, commissionCents: totalCents - subtotalCents, totalCents };
}

export function allocateClientFacingAmounts<T extends { amountCents: number }>(items: T[], totalCents: number) {
  const subtotalCents = items.reduce((sum, item) => sum + item.amountCents, 0);
  if (!items.length || subtotalCents <= 0) return items.map((item) => ({ ...item, clientAmountCents: item.amountCents }));
  const allocated = items.map((item) => Math.floor(item.amountCents * totalCents / subtotalCents));
  let remainder = totalCents - allocated.reduce((sum, amount) => sum + amount, 0);
  for (let index = 0; remainder > 0; index = (index + 1) % allocated.length) {
    allocated[index] += 1;
    remainder -= 1;
  }
  return items.map((item, index) => ({ ...item, clientAmountCents: allocated[index] }));
}
