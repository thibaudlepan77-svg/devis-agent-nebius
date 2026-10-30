import { z } from "zod";
import { NEED_MAX_LENGTH, NEED_MIN_LENGTH } from "./limits";
import { MARKET_IDS, type MarketId } from "./markets";

export const quoteRequestSchema = z.object({
  need: z
    .string()
    .trim()
    .min(NEED_MIN_LENGTH, `Describe the need in at least ${NEED_MIN_LENGTH} characters.`)
    .max(NEED_MAX_LENGTH, `Describe the need in ${NEED_MAX_LENGTH} characters or fewer.`),
  market: z.enum(MARKET_IDS),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

const citations = z
  .array(z.number().int().nonnegative())
  .max(6)
  .describe("Ids of the sources that support this line, empty if none does.");

const text = (max: number) => z.string().trim().min(1).max(max);

// What Nemotron is asked to write. It never states a total or a price: it
// estimates hours and proposes a rate band, the code does the arithmetic.
export const quoteDraftSchema = z.object({
  language: z.enum(["en", "fr"]).describe("Language of the business need, the whole draft is written in it."),
  title: text(120).describe("Short project title, no client name."),
  summary: text(700),
  modules: z
    .array(
      z.object({
        name: text(90),
        description: text(320),
        hoursLow: z.number().min(1).max(200),
        hoursHigh: z.number().min(1).max(240),
        sources: citations,
      }),
    )
    .min(2)
    .max(6),
  rate: z.object({
    low: z.number().min(1),
    high: z.number().min(1),
    rationale: text(520),
    sources: citations,
  }),
  monthlySupportHours: z.number().min(0).max(24),
  tools: z
    .array(z.object({ name: text(70), role: text(240), sources: citations }))
    .max(4),
  compliance: z.array(z.object({ note: text(320), sources: citations })).max(3),
  assumptions: z.array(text(240)).max(4),
  questions: z.array(text(240)).min(1).max(4),
  nextStep: text(320),
});

export type QuoteDraft = z.infer<typeof quoteDraftSchema>;

export type Source = {
  id: number;
  title: string;
  url: string;
  domain: string;
  readInFull?: boolean;
};

export type PricedLine = {
  name: string;
  description: string;
  hoursLow: number;
  hoursHigh: number;
  amountLow: number;
  amountHigh: number;
  sources: number[];
};

export type PricedQuote = {
  market: MarketId;
  language: QuoteDraft["language"];
  title: string;
  summary: string;
  lines: PricedLine[];
  rate: {
    low: number;
    high: number;
    rationale: string;
    sources: number[];
    clamped: boolean;
  };
  totals: {
    hoursLow: number;
    hoursHigh: number;
    setupLow: number;
    setupHigh: number;
    monthly: number;
    monthlySupportHours: number;
  };
  tools: { name: string; role: string; sources: number[] }[];
  compliance: { note: string; sources: number[] }[];
  assumptions: string[];
  questions: string[];
  nextStep: string;
  sources: Source[];
  grounded: boolean;
  generatedAt: string;
};

export type TraceState = "running" | "done" | "failed" | "skipped";

export type TraceEntry = {
  id: string;
  kind: "plan" | "search" | "read" | "draft" | "check" | "price";
  state: TraceState;
  title: string;
  detail?: string;
  sources?: Source[];
  durationMs?: number;
};

export type RunStats = {
  model: string;
  modelCalls: number;
  searches: number;
  pagesRead: number;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
};

export type AgentEvent =
  | { type: "trace"; entry: TraceEntry }
  | { type: "quote"; quote: PricedQuote; stats: RunStats }
  | { type: "error"; message: string };
