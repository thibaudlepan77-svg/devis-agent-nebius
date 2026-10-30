import OpenAI from "openai";
import {
  CURRENCY_BY_MARKET,
  quoteResponseSchema,
  type QuoteRequest,
  type QuoteResponse,
} from "./quoteSchema";

const NEBIUS_BASE_URL = "https://api.tokenfactory.us-central1.nebius.com/v1/";

function getClient(): OpenAI {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) {
    throw new Error("NEBIUS_API_KEY is not configured on the server.");
  }
  return new OpenAI({ baseURL: NEBIUS_BASE_URL, apiKey });
}

const SYSTEM_PROMPT = `You are a senior solutions consultant at a small web and automation agency.
A prospect describes a business problem in French or English. Turn it into a short,
realistic automation quote draft.

Rules:
- Propose 2 to 5 concrete modules (e.g. "lead capture form", "WhatsApp auto-reply",
  "CRM pipeline sync", "automated invoicing"), each with a one-line description and an
  honest estimated build time in hours.
- Keep prices modest and believable for a small/medium business engagement: a one-time
  setup range and a monthly subscription for hosting and maintenance.
- List up to 3 clarifying questions a human consultant would still need answered before
  confirming the quote.
- Never invent a company name or a client name.
- Respond with JSON only, matching exactly this shape, no markdown fences:
{
  "summary": string,
  "modules": [{ "name": string, "description": string, "estimatedHours": number }],
  "setupPriceLow": number,
  "setupPriceHigh": number,
  "monthlySubscription": number,
  "currency": "FCFA" | "EUR" | "CHF",
  "clarifyingQuestions": string[],
  "nextStep": string
}`;

export async function generateQuote(request: QuoteRequest): Promise<QuoteResponse> {
  const client = getClient();
  const model = process.env.NEBIUS_MODEL ?? "nvidia/nemotron-3-super";
  const currency = CURRENCY_BY_MARKET[request.market];

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    max_tokens: 900,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Market: ${request.market} (use currency ${currency}).\nBusiness need:\n${request.need}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty response from the Nebius Token Factory model.");
  }

  const parsed = JSON.parse(stripCodeFence(raw));
  return quoteResponseSchema.parse(parsed);
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  }
  return trimmed;
}
