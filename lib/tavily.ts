import { z } from "zod";
import { excerpt } from "./text";

const TAVILY_API_URL = "https://api.tavily.com";
const SEARCH_TIMEOUT_MS = 8_000;
const EXTRACT_TIMEOUT_MS = 10_000;
const RESULTS_PER_SEARCH = 4;
const EXCERPT_LENGTH = 600;
const PASSAGES_PER_PAGE = 3;
const PASSAGES_LENGTH = 2_400;

const searchResponseSchema = z.object({ results: z.array(z.unknown()) });

const searchHitSchema = z.object({
  title: z.string(),
  url: z.url({ protocol: /^https?$/ }),
  content: z.string(),
});

const extractResponseSchema = z.object({
  results: z.array(z.object({ url: z.string(), raw_content: z.string().nullish() })),
});

export type SearchHit = {
  title: string;
  url: string;
  excerpt: string;
};

// Tavily boosts results from one country when told which. Values are the
// lowercase English country names its API accepts.
export type SearchScope = { country: string };

export type WebSearch = (query: string, scope: SearchScope, signal: AbortSignal) => Promise<SearchHit[]>;

// Reads one page through Tavily Extract and keeps only the passages that
// answer `focus`, so the model gets the rate table rather than the whole page.
export type PageReader = (url: string, focus: string, signal: AbortSignal) => Promise<string>;

export class SearchUnavailableError extends Error {}

async function post(apiKey: string, endpoint: string, body: object, timeoutMs: number, signal: AbortSignal) {
  const response = await fetch(`${TAVILY_API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]),
  });
  if (!response.ok) {
    throw new SearchUnavailableError(`Tavily ${endpoint} answered ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

export function createTavilySearch(apiKey: string): WebSearch {
  return async (query, scope, signal) => {
    const payload = await post(
      apiKey,
      "search",
      {
        query,
        country: scope.country,
        search_depth: "basic",
        max_results: RESULTS_PER_SEARCH,
        include_answer: false,
        include_raw_content: false,
      },
      SEARCH_TIMEOUT_MS,
      signal,
    );
    const parsed = searchResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new SearchUnavailableError("Tavily search returned an unexpected payload");
    }
    return parsed.data.results.flatMap((raw) => {
      const hit = searchHitSchema.safeParse(raw);
      if (!hit.success) return [];
      return {
        title: excerpt(hit.data.title, 140) || new URL(hit.data.url).hostname,
        url: hit.data.url,
        excerpt: excerpt(hit.data.content, EXCERPT_LENGTH),
      };
    });
  };
}

export function createTavilyReader(apiKey: string): PageReader {
  return async (url, focus, signal) => {
    const payload = await post(
      apiKey,
      "extract",
      {
        urls: [url],
        query: focus,
        chunks_per_source: PASSAGES_PER_PAGE,
        extract_depth: "basic",
        format: "text",
        timeout: EXTRACT_TIMEOUT_MS / 1000 - 1,
      },
      EXTRACT_TIMEOUT_MS,
      signal,
    );
    const parsed = extractResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new SearchUnavailableError("Tavily extract returned an unexpected payload");
    }
    const page = parsed.data.results.find((result) => result.url === url) ?? parsed.data.results[0];
    const passages = page?.raw_content ?? "";
    if (!passages.trim()) {
      throw new SearchUnavailableError("Tavily could not read that page");
    }
    return excerpt(passages, PASSAGES_LENGTH);
  };
}

export type WebResearch = { search: WebSearch; read: PageReader };

export function researchFromEnv(): WebResearch | null {
  const apiKey = process.env.TAVILY_API_KEY;
  return apiKey ? { search: createTavilySearch(apiKey), read: createTavilyReader(apiKey) } : null;
}
