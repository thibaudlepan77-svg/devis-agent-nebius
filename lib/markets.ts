export const MARKET_IDS = ["france", "senegal", "switzerland", "united-states"] as const;

export type MarketId = (typeof MARKET_IDS)[number];

export type Market = {
  id: MarketId;
  label: string;
  country: string;
  currency: "EUR" | "XOF" | "CHF" | "USD";
  locale: string;
  searchCountry: string;
  // Sanity rails for the blended hourly rate. They are deliberately wide: the
  // model picks the rate from what it found, these only catch a hallucinated
  // order of magnitude (a rate in the wrong currency, a missing zero).
  rateFloor: number;
  rateCeiling: number;
  rateStep: number;
  setupStep: number;
  monthlyStep: number;
};

export const MARKETS: Record<MarketId, Market> = {
  france: {
    id: "france",
    label: "France",
    country: "France",
    currency: "EUR",
    locale: "fr-FR",
    searchCountry: "france",
    rateFloor: 25,
    rateCeiling: 180,
    rateStep: 5,
    setupStep: 50,
    monthlyStep: 10,
  },
  senegal: {
    id: "senegal",
    label: "Senegal",
    country: "Senegal",
    currency: "XOF",
    locale: "fr-SN",
    searchCountry: "senegal",
    rateFloor: 3_000,
    rateCeiling: 60_000,
    rateStep: 500,
    setupStep: 25_000,
    monthlyStep: 5_000,
  },
  switzerland: {
    id: "switzerland",
    label: "Switzerland",
    country: "Switzerland",
    currency: "CHF",
    locale: "de-CH",
    searchCountry: "switzerland",
    rateFloor: 50,
    rateCeiling: 250,
    rateStep: 5,
    setupStep: 50,
    monthlyStep: 10,
  },
  "united-states": {
    id: "united-states",
    label: "United States",
    country: "the United States",
    currency: "USD",
    locale: "en-US",
    searchCountry: "united states",
    rateFloor: 30,
    rateCeiling: 250,
    rateStep: 5,
    setupStep: 50,
    monthlyStep: 10,
  },
};

export function formatMoney(amount: number, market: Market): string {
  return new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency: market.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
