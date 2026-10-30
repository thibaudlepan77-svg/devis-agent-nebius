import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runQuoteAgent } from "../lib/agent";
import type { ChatModel, Completion } from "../lib/nebius";
import type { AgentEvent, PricedQuote } from "../lib/quoteSchema";
import type { PageReader, WebResearch, WebSearch } from "../lib/tavily";

const draft = {
  language: "en",
  title: "WhatsApp follow-up automation",
  summary: "Log every WhatsApp quote request and chase silent prospects.",
  modules: [
    { name: "Request capture", description: "Webhook into a sheet", hoursLow: 10, hoursHigh: 14, sources: [2, 99] },
    { name: "Follow-up scheduler", description: "Day three reminder", hoursLow: 12, hoursHigh: 8, sources: [] },
  ],
  rate: { low: 15_000, high: 900_000, rationale: "Market rate from [1].", sources: [1] },
  monthlySupportHours: 3,
  tools: [{ name: "WhatsApp Cloud API", role: "Messaging", sources: [2] }],
  compliance: [],
  assumptions: ["A single business number"],
  questions: ["Which spreadsheet is the source of truth?"],
  nextStep: "Book a scoping call.",
};

const plannedSearches = [
  { id: "a", query: '{"query":"developer hourly rate Senegal 2026"}' },
  { id: "b", query: '{"query":"WhatsApp Cloud API pricing"}' },
  { id: "c", query: "not json" },
  { id: "d", query: '{"query":"search that fails"}' },
  { id: "e", query: '{"query":"one search too many"}' },
];

const plannedReads = [
  { id: "r1", url: "https://unknown.example.com/rates", focus: "hourly rate" },
  { id: "r2", url: "https://rates.example.com/senegal", focus: "developer hourly rate" },
  { id: "r3", url: "https://rates.example.com/senegal", focus: "a second read is over budget" },
];

function reply(message: Completion["choices"][number]["message"]): Completion {
  return {
    choices: [{ finish_reason: "stop", message }],
    usage: { prompt_tokens: 100, completion_tokens: 10 },
  };
}

async function run(research: WebResearch | null, drafts: string[]) {
  let researchCalls = 0;
  const model: ChatModel = async (params) => {
    if (params.tools) {
      researchCalls += 1;
      if (researchCalls > 2) return reply({ content: "Enough.", tool_calls: [] });
      if (researchCalls === 2) {
        return reply({
          content: null,
          tool_calls: plannedReads.map(({ id, url, focus }) => ({
            id,
            type: "function",
            function: { name: "read_page", arguments: JSON.stringify({ url, focus }) },
          })),
        });
      }
      return reply({
        content: null,
        reasoning_content: "Need market rates and the messaging API price.",
        tool_calls: plannedSearches.map(({ id, query }) => ({
          id,
          type: "function",
          function: { name: "web_search", arguments: query },
        })),
      });
    }
    return reply({ content: drafts.shift() ?? "" });
  };
  const events: AgentEvent[] = [];
  await runQuoteAgent(
    { need: "We retype WhatsApp quote requests by hand into a sheet.", market: "senegal" },
    { model, modelName: "test-model", research, now: () => new Date("2026-10-30T08:00:00Z") },
    (event) => events.push(event),
    new AbortController().signal,
  );
  return { events, researchCalls };
}

const fakeSearch: WebSearch = async (query) => {
  if (query === "search that fails") throw new Error("timeout");
  return [
    { title: "Developer rates", url: "https://rates.example.com/senegal", excerpt: "15 000 XOF per hour" },
    { title: "Pricing page", url: `https://api.example.com/${encodeURIComponent(query)}`, excerpt: "pricing" },
  ];
};

const readCalls: string[] = [];
const fakeRead: PageReader = async (url, focus) => {
  readCalls.push(url);
  return `Passages about ${focus}: senior developers bill 15 000 to 25 000 XOF per hour.`;
};

const failingRead: PageReader = async () => {
  throw new Error("extract timed out");
};

function stepsOf(events: AgentEvent[], kind: string) {
  return events.flatMap((event) =>
    event.type === "trace" && event.entry.kind === kind && event.entry.state !== "running" ? [event.entry] : [],
  );
}

function quoteOf(events: AgentEvent[]): PricedQuote {
  const event = events.find((candidate) => candidate.type === "quote");
  assert.ok(event?.type === "quote", "a quote is emitted");
  return event.quote;
}

describe("runQuoteAgent", () => {
  it("caps searches, survives a failed one and prices the draft in code", async () => {
    const { events } = await run({ search: fakeSearch, read: fakeRead }, ["```json\n" + JSON.stringify(draft) + "\n```"]);
    const finished = stepsOf(events, "search");
    assert.equal(finished.length, 3);
    assert.equal(finished.filter((entry) => entry.state === "failed").length, 1);

    const quote = quoteOf(events);
    assert.equal(quote.sources.length, 3, "duplicate URLs share one source id");
    assert.deepEqual([quote.rate.low, quote.rate.high, quote.rate.clamped], [15_000, 60_000, true]);
    assert.deepEqual(quote.lines.map((line) => [line.hoursLow, line.hoursHigh]), [[10, 14], [8, 12]]);
    assert.deepEqual(quote.lines[0]?.sources, [2], "a citation to an unknown source is dropped");
    assert.deepEqual(quote.totals, {
      hoursLow: 18,
      hoursHigh: 26,
      setupLow: 275_000,
      setupHigh: 1_550_000,
      monthly: 115_000,
      monthlySupportHours: 3,
    });
    assert.equal(quote.grounded, true);
  });

  it("reads one retrieved page in full and refuses unknown URLs", async () => {
    readCalls.length = 0;
    const { events, researchCalls } = await run({ search: fakeSearch, read: fakeRead }, [JSON.stringify(draft)]);
    assert.deepEqual(readCalls, ["https://rates.example.com/senegal"]);
    assert.equal(researchCalls, 2, "research stops after the page is read");
    assert.equal(stepsOf(events, "read")[0]?.state, "done");
    const quote = quoteOf(events);
    assert.equal(quote.sources.find((source) => source.id === 1)?.readInFull, true);
    const done = events.find((event) => event.type === "quote");
    assert.equal(done?.type === "quote" ? done.stats.pagesRead : -1, 1);
  });

  it("keeps the quote when the page cannot be read", async () => {
    const { events } = await run({ search: fakeSearch, read: failingRead }, [JSON.stringify(draft)]);
    assert.equal(stepsOf(events, "read")[0]?.state, "failed");
    assert.ok(quoteOf(events).sources.every((source) => !source.readInFull));
  });

  it("repairs an invalid draft once and flags an ungrounded quote", async () => {
    const { events } = await run(null, ["not json", JSON.stringify(draft)]);
    assert.equal(quoteOf(events).grounded, false);
    assert.ok(events.some((event) => event.type === "trace" && event.entry.state === "skipped"));
  });

  it("ends with a clean error after two invalid drafts", async () => {
    const { events } = await run({ search: fakeSearch, read: fakeRead }, ["{}", "{}"]);
    assert.equal(events.at(-1)?.type, "error");
    assert.ok(!events.some((event) => event.type === "quote"));
  });
});
