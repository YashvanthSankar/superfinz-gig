export function calculateSip(monthly: number, annualRate: number, years: number) {
  const months = Math.max(0, Math.round(years * 12));
  const rate = annualRate / 1200;
  const invested = monthly * months;
  const value = rate === 0 ? invested : monthly * (((1 + rate) ** months - 1) / rate) * (1 + rate);
  return { invested, returns: Math.max(0, value - invested), value };
}
export function calculateFd(principal: number, annualRate: number, years: number) {
  const value = principal * (1 + annualRate / 400) ** (years * 4);
  return { invested: principal, returns: value - principal, value };
}
export function calculateFire(monthlyExpenses: number) { return monthlyExpenses * 12 * 25; }
