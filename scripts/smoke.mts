// Runs one real generation from the command line, against the live Token
// Factory and Tavily APIs, and prints the trace as it streams. Costs one
// generation: NEBIUS_API_KEY and TAVILY_API_KEY must be set.
//
//   npx tsx scripts/smoke.mts senegal "We retype WhatsApp quote requests by hand..."

import { runQuoteAgent } from "../lib/agent";
import { MARKET_IDS } from "../lib/markets";
import { NEMOTRON_MODEL, nemotronFromEnv } from "../lib/nebius";
import { quoteRequestSchema } from "../lib/quoteSchema";
import { researchFromEnv } from "../lib/tavily";

const [market, need] = process.argv.slice(2);
const request = quoteRequestSchema.safeParse({ market, need });
if (!request.success) {
  console.error(`Usage: smoke.mts <${MARKET_IDS.join("|")}> "<business need>"`);
  process.exit(1);
}

await runQuoteAgent(
  request.data,
  { model: nemotronFromEnv(), modelName: NEMOTRON_MODEL, research: researchFromEnv(), now: () => new Date() },
  (event) => {
    if (event.type === "trace") {
      const { state, title, detail, sources, durationMs } = event.entry;
      console.log(`[${state}] ${title}${durationMs ? ` (${durationMs} ms)` : ""}`);
      if (detail) console.log(`         ${detail}`);
      for (const source of sources ?? []) console.log(`         [${source.id}] ${source.domain}`);
    } else if (event.type === "quote") {
      console.log(JSON.stringify(event, null, 2));
    } else {
      console.error(event.message);
    }
  },
  new AbortController().signal,
);
