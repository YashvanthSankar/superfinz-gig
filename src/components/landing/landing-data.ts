/** One month of a delivery partner's settlements. Rupees, per day. */
export const DAILY_INCOME = [
  640, 1840, 720, 0, 1120, 2380, 2610, 880, 940, 0, 1260, 1090, 2240, 2750, 610,
  0, 1380, 1170, 920, 2410, 2560, 730, 1010, 1330, 0, 860, 2190, 2480, 1140, 970,
] as const;

export const MONTH_TOTAL = DAILY_INCOME.reduce<number>((a, b) => a + b, 0);
export const DAILY_AVERAGE = Math.round(MONTH_TOTAL / DAILY_INCOME.length);

export const BILLS = [
  { day: 5, name: "Rent", amount: 9000 },
  { day: 8, name: "Bike EMI", amount: 3200 },
  { day: 14, name: "Electricity", amount: 1150 },
  { day: 20, name: "School fee", amount: 2500 },
  { day: 26, name: "Phone", amount: 499 },
] as const;

export const BILLS_TOTAL = BILLS.reduce<number>((a, b) => a + b.amount, 0);

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
