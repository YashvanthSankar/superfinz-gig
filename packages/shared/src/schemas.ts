import { z } from "zod";

export const transactionInputSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  category: z.string().min(1).max(50),
  description: z.string().min(1).max(200),
  date: z.string().datetime().optional(),
});

export const goalInputSchema = z.object({
  title: z.string().min(1).max(100),
  targetAmount: z.number().positive().max(100_000_000),
  deadline: z.string().optional(),
  isEssential: z.boolean().optional().default(false),
});

export const budgetInputSchema = z.object({
  category: z.string().min(1), limit: z.number().positive(),
  month: z.number().int().min(1).max(12), year: z.number().int().min(2020),
});

export const mobileGoogleAuthSchema = z.object({
  idToken: z.string().min(20), deviceLabel: z.string().max(100).optional(),
});
export const refreshTokenSchema = z.object({ refreshToken: z.string().min(32) });
