# Devis Agent

Agentic quoting assistant for small web and automation agencies, built for the
Nebius x NVIDIA Global AI Hackathon (Best Apps and Agents track).

A prospect describes a business problem in one or two sentences, in French or
English. The app sends that description to an NVIDIA Nemotron model served on
Nebius Token Factory, which turns it into a structured, believable quote
draft, modules, estimated hours, a setup price range, a monthly subscription,
and the clarifying questions a human consultant would still ask before
sending it to the client.

This mirrors a real, recurring task at small agencies, including the one this
project was built around, turning a vague automation request into a first
pass quote in minutes instead of hours, while keeping a human reviewer firmly
in the loop before anything goes out.

## How it uses Nebius and NVIDIA

- Inference runs through Nebius Token Factory's OpenAI-compatible endpoint
  (`https://api.tokenfactory.us-central1.nebius.com/v1/`), configured in
  `lib/nebius.ts`.
- The model is an NVIDIA Nemotron open source model (`NEBIUS_MODEL`,
  defaults to `nvidia/nemotron-3-super`), chosen for the reasoning needed to
  turn an unstructured business need into a consistent module breakdown.
- The server route (`app/api/quote/route.ts`) validates the model's JSON
  output against a strict Zod schema before it ever reaches the browser, so a
  malformed generation fails loudly instead of rendering garbage.

## Stack

- Next.js 15 (App Router), TypeScript strict
- Zod for both the inbound request and the model's structured output
- A minimal in-memory rate limiter on the API route
- Security headers set in `next.config.ts` (no inline frames, no sniffing,
  restrictive `Permissions-Policy`)

## Run locally

```bash
npm install
cp .env.example .env.local
# edit .env.local and set NEBIUS_API_KEY to a real Token Factory key
npm run dev
```

Open `http://localhost:3000`, describe a business need, pick a market, and
generate a draft quote.

## Deploy

The project is a standard Next.js app and deploys as-is to Vercel's free
tier (or any Node 20+ host). Set `NEBIUS_API_KEY` (and optionally
`NEBIUS_MODEL`) as environment variables on the platform, never in the repo.

```bash
npx vercel deploy --prod
```

## Project structure

```
app/
  page.tsx          Landing page, server component
  QuoteForm.tsx      Client component, form + result rendering
  api/quote/route.ts  Server route calling Nebius Token Factory
lib/
  nebius.ts          Token Factory client and prompt
  quoteSchema.ts      Zod schemas for request and response
  ratelimit.ts        In-memory fixed-window rate limiter
```

## Feedback on Nebius Token Factory and NVIDIA Nemotron

The OpenAI-compatible endpoint made swapping in an NVIDIA Nemotron model a
one-line change from a generic Nebius demo, which is the right default for
anyone coming from existing OpenAI SDK code. The main friction during the
hackathon was account onboarding, the contact details step sits behind a
Cloudflare Turnstile check that would not clear in an automated browser
session, which meant the final signup click had to be done by hand rather
than scripted end to end.

## License

MIT, see `LICENSE`.
