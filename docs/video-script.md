# Demo video script

Target length: under 2 minutes 45 seconds. Screen recording of the live
deployment at https://devis-agent-nebius.vercel.app, narrated in English.

## Shot 1, 0:00 to 0:20, problem

Visual: face to camera or a simple title card, "Devis Agent".

Narration:
"At small agencies, a quote starts the same way every time. A prospect
writes one messy sentence about a problem, and someone has to turn that into
modules, hours, and a price before the real conversation even starts. That
first pass takes longer than it should."

## Shot 2, 0:20 to 0:35, solution in one line

Visual: cut to the live app in the browser, empty form, URL bar visible.

Narration:
"This is Devis Agent. You describe the business need in a sentence, and an
NVIDIA Nemotron model, served on Nebius Token Factory, drafts the quote for
you."

## Shot 3, 0:35 to 1:10, live demo, happy path

Visual: type a real example into the textarea on screen, for instance, "We
get quote requests on WhatsApp and retype them by hand into a spreadsheet,
we'd like to automatically follow up with clients who don't reply after
three days." Select "France (EUR)" from the market dropdown. Click "Générer
le brouillon de devis". Show the loading state briefly, then the result.

Narration (while typing and waiting):
"I describe the need, pick a market for the right currency, and send it.
Behind this button, the app calls nvidia/nemotron-3-super-120b-a12b through
Nebius Token Factory's API."

Narration (once the result renders):
"In a few seconds, Nemotron returns a structured draft, modules with
realistic hour estimates, a setup price range, a monthly subscription, and
the questions a human consultant would still want answered before this goes
anywhere near a client."

## Shot 4, 1:10 to 1:35, show the structure, not just the text

Visual: scroll slowly through the result, pause on the modules list, the
price line, and the clarifying questions.

Narration:
"Nothing here is free text. Every field is validated against a schema
before it reaches the browser, so if the model ever returns something
malformed, the app fails loudly instead of showing garbage to a client."

## Shot 5, 1:35 to 1:55, the code, briefly

Visual: switch to the editor, show `lib/nebius.ts` for two or three seconds
(the base URL and model string), then `lib/quoteSchema.ts`.

Narration:
"The whole integration is a small, typed client, one base URL pointing at
Token Factory, one Nemotron model id, and a Zod schema on both sides of the
call."

## Shot 6, 1:55 to 2:15, guardrails

Visual: show `lib/ratelimit.ts` briefly, then back to the browser, trigger
the rate limit message if time allows (or describe it over the running
demo).

Narration:
"Because this demo runs on a real key, it's locked down, three requests per
hour per visitor, forty requests a day total, and a capped response length.
Hit the limit and you get a clear message, not a silent failure."

## Shot 7, 2:15 to 2:35, who this is for and wrap

Visual: back to the live app, full page view.

Narration:
"This is built for small agencies and freelancers who get the same kind of
request over and over, and want the first draft done before they even open
a spreadsheet. Code's public on GitHub, MIT licensed, link in the
submission."

## Shot 8, 2:35 to 2:45, closing card

Visual: title card again, "Devis Agent, built on Nebius Token Factory and
NVIDIA Nemotron."

Narration: (silent, or a one-line restatement of the tagline)

## Recording notes

- Record at 1080p, keep the browser window clean (no other tabs visible).
- Use the real deployment, not localhost, so the URL bar shows
  devis-agent-nebius.vercel.app.
- If the live model call is slow on the recording take, it is fine to speed
  up the loading segment in editing, keep the rest at real pace.
- Upload as a public, unlisted-is-not-enough, fully public YouTube video,
  title it clearly (e.g. "Devis Agent, Nebius x NVIDIA Global AI Hackathon
  demo"), and paste the link into the Devpost submission form.
