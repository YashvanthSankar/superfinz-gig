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

export function calculateEmi(principal: number, annualRate: number, years: number) {
  const months = Math.max(1, Math.round(years * 12));
  const rate = annualRate / 1200;
  const emi = rate === 0 ? principal / months : (principal * rate * (1 + rate) ** months) / ((1 + rate) ** months - 1);
  const total = emi * months;
  return { emi, total, interest: Math.max(0, total - principal) };
}

export type RetirementInput = {
  currentAge: number; retirementAge: number; monthlyInvestment: number; monthlyExpenses: number;
  currentSavings: number; annualReturn: number; inflation: number;
};

export function calculateRetirement(input: RetirementInput) {
  const years = Math.max(1, input.retirementAge - input.currentAge);
  const monthlyRate = Math.max(0, input.annualReturn) / 1200;
  const months = years * 12;
  const inflatedAnnualExpenses = Math.max(0, input.monthlyExpenses) * 12 * (1 + Math.max(0, input.inflation) / 100) ** years;
  const targetCorpus = inflatedAnnualExpenses * 25;
  const existingFutureValue = Math.max(0, input.currentSavings) * (1 + monthlyRate) ** months;
  const investmentFutureValue = monthlyRate === 0
    ? Math.max(0, input.monthlyInvestment) * months
    : Math.max(0, input.monthlyInvestment) * (((1 + monthlyRate) ** months - 1) / monthlyRate);
  const projectedCorpus = existingFutureValue + investmentFutureValue;
  const amountStillNeeded = Math.max(0, targetCorpus - existingFutureValue);
  const requiredMonthlyInvestment = monthlyRate === 0
    ? amountStillNeeded / months
    : amountStillNeeded * monthlyRate / ((1 + monthlyRate) ** months - 1);
  return { years, targetCorpus, projectedCorpus, requiredMonthlyInvestment, corpusGap: Math.max(0, targetCorpus - projectedCorpus), onTrack: projectedCorpus >= targetCorpus };
}
