# Devpost submission content

Track: Best Apps and Agents. Also eligible for Best Use of Tavily and Most Valuable Feedback.

- Demo: https://devis-agent-nebius.vercel.app
- Code: https://github.com/thibaudlepan77-svg/devis-agent-nebius (MIT)
- New project, built from scratch during the submission period: the repository and its first commit date from 30 October 2026.

## Title

Devis Agent

## Tagline

From a one-line client request to a sourced, priced quote: Nemotron researches the market through Tavily, the code does the arithmetic.

## Inspiration

This comes out of running a small web and automation agency. A prospect writes one sentence, "patients book by phone and no-shows are costing us chair time", and before anyone can answer with a number, someone has to break the need into modules, estimate hours, check what developers charge in that country this year, find which API the build would sit on, and remember which data protection rules apply. The research is the slow part. A plain chatbot skips it and invents a rate and a total, which is worse than no answer, because it looks finished.

We wanted the opposite: an agent that looks things up before it prices anything, shows its work while it does it, cites what it found, and is never trusted with the arithmetic.

## What it does

A visitor describes a client's need in English or French, or clicks one of three examples, and picks the client's market: France (EUR), Senegal (XOF), Switzerland (CHF) or the United States (USD).

The agent then works in the open. A live trace shows each step as it happens:

1. **Nemotron plans the research** and its short reasoning is shown.
2. **Tavily searches the live web**, one topic at a time: developer rates in that country this year, the products or APIs the build would rely on and their pricing, the regulation that applies to the data involved (HIPAA for a US dental clinic, GDPR and the CNIL for a French one).
3. **Nemotron picks the most useful source** and **Tavily Extract reads it**, returning the passages that answer the model's question rather than a snippet.
4. **Nemotron writes the quote** as strict structured output.
5. **The code checks it**: schema validation, and every citation matched against a source the agent actually retrieved.
6. **The code prices it**: hours times rate, inside a per-market guard band, rounded per currency.

The result, in about 15 to 20 seconds, is a quote draft with modules and hour ranges, a one-time setup range, monthly support, the hourly rate with its rationale, tools and integrations, compliance points, assumptions, questions to ask the client, and numbered sources, the one read in full marked as such. It is written in the language of the request and can be copied as Markdown, downloaded, or printed to a clean PDF. It is labelled as a draft for a consultant to review, because that is what it is.

## How we built it

- **Nebius Token Factory and NVIDIA Nemotron.** `nvidia/nemotron-3-super-120b-a12b` through the OpenAI-compatible `chat/completions` endpoint, called with plain `fetch`, every response validated with Zod. The agent loop uses Nemotron's native tool calling with two tools, `web_search` and `read_page`. Each call sets `chat_template_kwargs: { enable_thinking: true, low_effort: true }`, so Nemotron keeps a short thought that the trace can show, without a full reasoning pass on every turn. The draft uses `response_format` with a strict JSON schema generated from the same Zod schema that validates it afterwards, with one automatic repair round if validation fails.
- **Tavily.** Search runs with the `country` parameter set from the chosen market. Extract runs with `query` and `chunks_per_source`, so only the relevant passages of the chosen page reach the model. `read_page` only accepts a URL that a search returned, and only unlocks after two searches. Results are treated as untrusted data in the prompt, and citations are verified in code.
- **Deterministic pricing.** The model proposes hour ranges and a rate band, nothing else. `lib/pricing.ts` lifts the inline citation marks Nemotron sometimes writes into its prose, drops citations to unknown sources, clamps the rate into a wide per-market band, multiplies, and rounds per currency. No line amount or total comes from the model.
- **Bounded agent.** At most 3 searches, 1 page read, 4 planning rounds, 25 seconds of research, 500 output tokens per research turn, 2,200 for the draft, 30 second timeouts on model calls, 8 and 10 seconds on Tavily. A failed search or extract becomes a failed step in the trace and the agent carries on.
- **Product.** Next.js 15 App Router, TypeScript strict, the route streams NDJSON events that the client renders as a live trace next to a skeleton shaped like the quote. Responsive down to 390 px, keyboard and screen reader friendly (live region for trace progress, labelled controls, skip link), print stylesheet, Open Graph card.
- **Cost and abuse controls.** Same-origin check, 4 KB body limit, Zod input validation, 3 quotes per hour per IP and 40 per day in total, CSP and security headers, keys server side only.
- **Tests.** `node:test` suites cover the tool budgets, a failed search, a refused extract URL, a failed extract, citation filtering, the rate guard band, the repair round and language detection. A smoke script runs one real end-to-end generation from the command line.

## Challenges we ran into

- **One tool call per turn.** We asked Nemotron for parallel searches in its first turn. In every real run it issued one call per turn, reasoning about what was still missing before the next. We rebuilt the loop around rounds, which also made the trace more readable: you can watch it decide.
- **Language drift.** An English request for a French clinic came back in French: the model followed the client's country rather than the request. Language is now detected in code and imposed in the prompt and on the output.
- **Thin research.** Our first real run did a single search, went straight to reading a page, and concluded that patient reminders needed no compliance section. Unlocking `read_page` only after two searches, and stating plainly that patient records and phone numbers are personal data, fixed both: the next runs searched rates, the messaging API and the regulation, and cited the CNIL and HIPAA sources.
- **Citation marks in the prose.** On top of the citation arrays the schema asks for, Nemotron sometimes annotated its sentences with its own marks, `【1†Loxala】`, which showed verbatim on the quote. The code now lifts them out of every text field and folds their ids into the line's citations, where the usual check against retrieved sources applies.
- **Account setup.** The hackathon promo code `NEBIUS-DEVPOST-GLOBAL26` returned `error-no-event` on our Token Factory account, and the onboarding step after Google sign-in sits behind a Cloudflare Turnstile check that an automated browser could not clear (details in the feedback section).

## Accomplishments that we're proud of

- A real agent, not a prompt: the model decides what to search, what to read, and when it has enough, and every decision is visible.
- Numbers you can audit. Each amount traces back to hours and a rate, each rate to a cited source, and each citation to a page the agent actually retrieved.
- A finished product rather than a notebook: four markets and currencies, two languages, export, print, mobile, loading states, accessibility, and a public demo that is protected against draining a paid key.

## What we learned

- Pairing a reasoning model with a search tool is not enough on its own. The quality came from the guard rails around it: tool budgets, an order of operations enforced in code, citations checked against what was really retrieved, and arithmetic taken away from the model.
- Tavily Extract with a `query` is the difference between "the model saw a snippet" and "the model read the rate table".
- Showing the model's short reasoning in the UI does more for trust than any disclaimer.

## What's next

- Calibrate hour estimates against the agency's own delivery history, so each module range reflects real past projects.
- Let the consultant edit the draft inline and keep a version history before anything is sent.
- More markets and languages, starting with other West African francophone countries, where the XOF pricing already applies.
- Route the short research turns to a smaller Nemotron model and keep Nemotron 3 Super for the draft, as the track suggests, once we have measured that the smaller model plans searches as well.

## Built With

- Nebius Token Factory
- NVIDIA Nemotron 3 Super (`nvidia/nemotron-3-super-120b-a12b`)
- Tavily Search API and Tavily Extract API
- Next.js 15
- TypeScript
- Zod
- Vercel

## Impact

Who it is for: small web and automation agencies and freelancers who answer inbound requests every week, in markets where rates and rules differ, which is our own situation across France, Senegal and Switzerland.

What the demo shows, measured on the production deployment on 30 October 2026: a complete, sourced quote draft in about 15 seconds, with 5 Nemotron calls, 3 Tavily searches, 1 page extract and about 11,000 tokens. That is the research and first-pass structuring that a consultant otherwise does by hand before a first reply. At our own agency, a first quote done by hand, from the client's message to the quote sent, rates and tooling research included, takes up to an hour. Devis Agent turns the research and first-pass structuring into seconds and leaves the review to a person, by design.

## Feedback on Nebius Token Factory and NVIDIA Nemotron

**What worked well**

- The OpenAI-compatible endpoint meant no SDK at all: one base URL, one model id, and `fetch`. Tool calling, `response_format` with a strict JSON schema, and `chat_template_kwargs` all went through the same request shape.
- Nemotron 3 Super's tool calling was reliable in our runs: valid arguments every time, sensible queries with the right year and country, and it chose the page with the rate table when asked to pick a source.
- Strict structured output validated against our Zod schema on the first attempt in every real run; the repair round has not been needed yet in production.
- `low_effort` thinking is a great fit for agents: a one or two sentence plan before each tool call, short enough to show to end users, and calls that come back in about a second during research.

**What was rough**

- The hackathon promo code `NEBIUS-DEVPOST-GLOBAL26` failed with `error-no-event` on our Token Factory account during the submission window, so the advertised hackathon credit could not be redeemed and the project runs on regular paid credit.
- The "Contact details" step right after Google sign-in sits behind a Cloudflare Turnstile check that did not clear for an automated browser session. A human had to click through. For a platform that targets agent builders, scripted onboarding is worth supporting, or at least documenting.
- Parallel tool calls: despite explicit instructions, Nemotron always issued one tool call per turn. That may be intended, but a sentence in the model card or the Token Factory docs about parallel tool call support would save builders a redesign.
- In one run the model followed the client's country instead of the language of the request when choosing the output language. Worth knowing for anyone building multilingual apps.
- Inside strict `json_schema` output, Nemotron 3 Super sometimes wrote its own citation marks into string fields, in the form `【3†twilio.com】`, on top of the citation arrays the schema defines. Easy to strip once known, but worth a line in the model card for anyone building cited answers.
- The `chat_template_kwargs` options for Nemotron 3 Super (`enable_thinking`, `low_effort`) are powerful but easy to miss. A short "agent recipe" in the Token Factory docs showing them together with tools and `response_format` would help.

**Nebius AI Cloud and other NVIDIA tools**

- We did not use Nebius AI Cloud, Serverless Endpoints or Serverless Jobs: the app only needs hosted inference, which Token Factory provides, and its Next.js front end runs on Vercel. A short guide to hosting a Next.js app that streams from Token Factory on Serverless Endpoints would make it an easier choice for app builders.

## Feedback on Tavily

- **Search with `country`** keeps the evidence local. With it set from the market, our French runs cited French sources (weepo.fr, lehibou.com, cnil.fr) and the US run cited US pricing guides and HIPAA sources.
- **Extract with `query` and `chunks_per_source`** is the feature that made the agent credible. The model asks for "freelance developer hourly rate" and receives the passages with the actual rates, small enough to fit in a tight prompt budget. Extract answered in well under a second in our runs.
- **Rough edge.** The top chunk can still start with page navigation text ("Case Studies Pricing About Sign In") before the relevant content. Easy to live with, but a cleaner first chunk would save prompt tokens.

## Testing instructions

- Open https://devis-agent-nebius.vercel.app, click one of the three examples, then "Draft the quote". No account and no key are needed.
- The public demo runs on paid API keys, so it allows 3 quotes per hour per visitor and 40 per day in total. If you reach a cap, the page says so; the code can also be run locally with your own Nebius Token Factory and Tavily keys (README, "Run it locally").
- `npm install && npm test` runs the agent loop end to end against scripted model and search responses, with no key at all.
