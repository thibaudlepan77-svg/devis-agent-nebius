import { MARKETS, type MarketId } from "./markets";
import type { PricedQuote, QuoteDraft, Source } from "./quoteSchema";

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clamp(value: number, floor: number, ceiling: number): number {
  return Math.min(Math.max(value, floor), ceiling);
}

function knownCitations(ids: number[], sources: Source[]): number[] {
  const known = new Set(sources.map((source) => source.id));
  return [...new Set(ids)].filter((id) => known.has(id)).sort((a, b) => a - b);
}

export type PricingOutcome = {
  quote: PricedQuote;
  droppedCitations: number;
};

export function priceDraft(
  draft: QuoteDraft,
  marketId: MarketId,
  sources: Source[],
  generatedAt: Date,
): PricingOutcome {
  const market = MARKETS[marketId];
  let droppedCitations = 0;
  const cite = (ids: number[]): number[] => {
    const kept = knownCitations(ids, sources);
    droppedCitations += new Set(ids).size - kept.length;
    return kept;
  };

  const proposedLow = Math.min(draft.rate.low, draft.rate.high);
  const proposedHigh = Math.max(draft.rate.low, draft.rate.high);
  const rateLow = roundTo(clamp(proposedLow, market.rateFloor, market.rateCeiling), market.rateStep);
  const rateHigh = roundTo(clamp(proposedHigh, market.rateFloor, market.rateCeiling), market.rateStep);
  const clamped = rateLow !== roundTo(proposedLow, market.rateStep) || rateHigh !== roundTo(proposedHigh, market.rateStep);

  const lines = draft.modules.map((module) => {
    const hoursLow = Math.round(Math.min(module.hoursLow, module.hoursHigh));
    const hoursHigh = Math.round(Math.max(module.hoursLow, module.hoursHigh));
    return {
      name: module.name,
      description: module.description,
      hoursLow,
      hoursHigh,
      amountLow: hoursLow * rateLow,
      amountHigh: hoursHigh * rateHigh,
      sources: cite(module.sources),
    };
  });

  const hoursLow = lines.reduce((sum, line) => sum + line.hoursLow, 0);
  const hoursHigh = lines.reduce((sum, line) => sum + line.hoursHigh, 0);
  const monthlySupportHours = Math.round(draft.monthlySupportHours * 2) / 2;

  const quote: PricedQuote = {
    market: marketId,
    language: draft.language,
    title: draft.title,
    summary: draft.summary,
    lines,
    rate: {
      low: rateLow,
      high: rateHigh,
      rationale: draft.rate.rationale,
      sources: cite(draft.rate.sources),
      clamped,
    },
    totals: {
      hoursLow,
      hoursHigh,
      setupLow: roundTo(hoursLow * rateLow, market.setupStep),
      setupHigh: roundTo(hoursHigh * rateHigh, market.setupStep),
      monthly: roundTo((monthlySupportHours * (rateLow + rateHigh)) / 2, market.monthlyStep),
      monthlySupportHours,
    },
    tools: draft.tools.map((tool) => ({ ...tool, sources: cite(tool.sources) })),
    compliance: draft.compliance.map((item) => ({ ...item, sources: cite(item.sources) })),
    assumptions: draft.assumptions,
    questions: draft.questions,
    nextStep: draft.nextStep,
    sources,
    grounded: sources.length > 0,
    generatedAt: generatedAt.toISOString(),
  };

  return { quote, droppedCitations };
}
