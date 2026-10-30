import { z } from "zod";

export const quoteRequestSchema = z.object({
  need: z
    .string()
    .trim()
    .min(20, "Décrivez le besoin en au moins 20 caractères.")
    .max(1000, "Décrivez le besoin en 1000 caractères maximum."),
  market: z.enum(["senegal", "france", "suisse"]).default("senegal"),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export const quoteModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  estimatedHours: z.number().positive(),
});

export const quoteResponseSchema = z.object({
  summary: z.string().min(1),
  modules: z.array(quoteModuleSchema).min(1).max(8),
  setupPriceLow: z.number().nonnegative(),
  setupPriceHigh: z.number().nonnegative(),
  monthlySubscription: z.number().nonnegative(),
  currency: z.enum(["FCFA", "EUR", "CHF"]),
  clarifyingQuestions: z.array(z.string()).max(5),
  nextStep: z.string().min(1),
});

export type QuoteResponse = z.infer<typeof quoteResponseSchema>;

export const CURRENCY_BY_MARKET: Record<QuoteRequest["market"], QuoteResponse["currency"]> = {
  senegal: "FCFA",
  france: "EUR",
  suisse: "CHF",
};
