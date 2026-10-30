# Devpost submission content

Track: Best Apps and Agents

## Title

Devis Agent

## Tagline

Turn a one-line automation request into a structured client quote, drafted by an NVIDIA Nemotron model on Nebius Token Factory.

## Inspiration

This comes straight out of running a small web and automation agency. A
prospect describes a problem in a sentence, "we retype every WhatsApp quote
request into a spreadsheet by hand", and turning that into a first-pass
quote, modules, hours, price range, is a slow, repetitive step that still
has to happen before any real conversation starts. Nemotron on Token Factory
looked like the right fit, a reasoning model that is good at turning a messy
business description into a consistent, structured breakdown, served
through an endpoint that drops into an existing OpenAI-style client with one
line changed.

## What it does

A visitor describes a business need in a sentence or two, in French or
English, and picks a market (Senegal, France, Switzerland) for the right
currency. The app sends that description to an NVIDIA Nemotron model on
Nebius Token Factory and gets back a structured quote draft, two to five
modules with a one-line description and an honest hour estimate each, a
setup price range, a monthly subscription, up to three clarifying questions
a human consultant would still want answered, and a suggested next step. The
output is validated against a strict schema before it ever reaches the
browser, so a malformed generation fails loudly instead of rendering
garbage. The app is explicit that this is a draft for a human to review, not
something that gets sent to a client unedited.

## How we built it

- Next.js 15 (App Router), TypeScript strict, no `any`.
- `lib/nebius.ts` talks to Nebius Token Factory's OpenAI-compatible endpoint
  (`https://api.tokenfactory.us-central1.nebius.com/v1/`) using the `openai`
  SDK, calling `nvidia/nemotron-3-super-120b-a12b`.
- `lib/quoteSchema.ts` defines Zod schemas for both the inbound request and
  the model's structured JSON output, so the model's response is validated,
  not trusted.
- `app/api/quote/route.ts` is the only server route, it rate-limits, parses,
  calls the model, validates, and returns.
- Because this demo runs on a real paid API key, the endpoint is locked
  down, a 3-requests-per-hour cap per visitor, a 40-requests-per-day global
  cap shared across all visitors, input capped at 1000 characters (already
  the UI's limit), and model output capped at 1200 tokens. Both caps return
  a clear message once hit instead of a generic failure.
- Deployed on Vercel's free tier, no custom infrastructure.

## Challenges we ran into

- The hackathon's promo activation code (`NEBIUS-DEVPOST-GLOBAL26`) returned
  `error-no-event` on the Token Factory account used for this project, so
  the free hackathon credit never landed. The account onboarding step
  (Contact details, right after Google sign-in) also sits behind a
  Cloudflare Turnstile check that would not clear for a scripted browser
  session, that one click had to be done by a human.
- Getting a model to return clean, schema-matching JSON every time needed a
  tight system prompt and a hard validation step, rather than trusting the
  output and hoping.
- Protecting a demo that calls a real paid key from being drained by
  traffic, without adding a paid shared store (Redis, Edge Config with a
  write-scoped token) just to hold a handful of counters. The in-memory,
  per-instance limiter and its known limits are documented directly in
  `lib/ratelimit.ts`.

## Accomplishments that we're proud of

A small, finished tool that does one real job well, instead of a bigger
demo that half-works. The output is schema-validated end to end, the public
demo is cost-protected rather than left wide open, and the whole thing ships
with a clean TypeScript build and no warnings.

## What we learned

Token Factory's OpenAI-compatible API made swapping an NVIDIA open source
model into existing code a genuinely small change. The rough edges were all
on the account side, promo code activation and an onboarding bot check,
not on the inference API itself.

## What's next

Let a consultant edit the draft inline before it goes out, keep a short
history of past quotes for a given visitor, and add a second Nemotron pass
that cross-checks hour estimates against the agency's own historical
delivery times.

## Built With

- Nebius Token Factory
- NVIDIA Nemotron (`nvidia/nemotron-3-super-120b-a12b`)
- Next.js
- TypeScript
- Zod
- Vercel

## Feedback on Nebius Token Factory and NVIDIA Nemotron

**What worked.** The OpenAI-compatible endpoint is the right default, it
took one base URL and one model string to go from a generic example to
`nvidia/nemotron-3-super-120b-a12b`. The model catalog's per-model pricing
and throughput numbers made it easy to pick Nemotron 3 Super over the
smaller Nano variant for this use case without guessing.

**What's missing or rough.**
- The hackathon's own promo credit code, `NEBIUS-DEVPOST-GLOBAL26`, failed
  with `error-no-event` on this account during the submission window, so
  the advertised free hackathon credit could not be redeemed, and a small
  real charge went on a personal card instead to finish the project in
  time.
- The "Contact details" step right after Google sign-in sits behind a
  Cloudflare Turnstile check that never cleared for a real but automated
  browser session, even after extended waits and natural mouse movement.
  That one click needed a human at the keyboard, which is a rough edge for
  anyone trying to script account setup as part of a CI pipeline or an
  agent-driven workflow, exactly the kind of workflow this hackathon's
  Coding and Agentic Engineering track is encouraging people to build.
- Nothing to report on model quality itself, Nemotron 3 Super produced
  schema-matching JSON on every test run.
