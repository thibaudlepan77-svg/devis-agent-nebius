# Demo video script

Target length: 2:30 to 2:45, hard limit under 3:00 (judges are not required to watch past three minutes). English narration over a screen recording of the live deployment, https://devis-agent-nebius.vercel.app. No music, no third-party logos beyond what the app itself shows.

## Before recording

- Browser window at 1440 x 900 (or 1920 x 1080 with 125 % zoom), a fresh profile, a single tab, the URL bar visible, light system theme.
- Load the page once and wait until the fonts have rendered.
- **Budget.** Every click on "Draft the quote" is a real generation. The demo allows 3 per hour per visitor and 40 per day in total, shared with the judges. Plan one live take for the main run (shots 3 to 6) and at most one retake. Do not test the button off camera.
- **Numbers change on every run.** The searches, sources, hours and prices on screen come from the live web. Never read figures from this script: read what is on screen, or keep the narration general where marked.
- **Pace.** Every narration block below is timed at about 150 words per minute. Read it at a calm, even pace; if a block runs long, let the shot run long rather than speed up the voice, and take the time back from the slack in shots 4, 5 and 7.
- **Citation marks.** The quote no longer shows raw citation marks such as `【1†Loxala】` in its text. If they appear on the take, the deployment is out of date: report it before publishing that take.
- A run takes about 15 to 20 seconds. Record it at real speed. In editing, the waiting segment may be sped up to 1.5x at most, with no cut inside the trace, so viewers can see every step appear.

## Shot 1, 0:00 to 0:20, the problem

Screen: the landing page, top of the page, nothing clicked. Slowly move the cursor across the headline.

Narration:
"Every small agency gets this message: one sentence about a business problem, and a client waiting for a price. Before answering, someone has to scope it, check this year's rates in that country, find the right API and the privacy rules. A chatbot skips all that and invents a number."

## Shot 2, 0:20 to 0:32, the product in one line

Screen: hover the three pills above the headline, one after the other: "NVIDIA Nemotron 3 Super", "Nebius Token Factory", "Tavily web search".

Narration:
"Devis Agent researches first. It runs NVIDIA Nemotron 3 Super on Nebius Token Factory, gives it Tavily to search and read the live web, then prices with arithmetic you can check."

## Shot 3, 0:32 to 0:45, start a real run

Screen:
1. Click the example chip **"EN Dental clinics, no-show reminders"**. The text area fills and the market switches to **United States, USD** on its own. Pause one second so both are readable.
2. Click **"Draft the quote"**. The page scrolls to the workspace: the agent trace on the left, a skeleton of the quote on the right, the button reads "Agent at work…".

Narration:
"Here is a real request from a dental clinic in the US. One click, and the agent starts. On the left, its trace, live. On the right, the quote it is building."

## Shot 4, 0:45 to 1:20, the agent at work

Screen: do not scroll. Let the trace fill in. As each step appears, move the cursor next to it (do not click the source links).
- "Nemotron · plan": point at the italic **Reasoning** box.
- "Tavily · web search": point at the quoted query, then at the numbered sources [1], [2] under it.
- The next plan and search steps: same, quickly.
- "Nemotron picked the source to read in full", then **"Tavily · extract"**: point at the passage quoted under it.
- "Nemotron · draft": the quote replaces the skeleton.

Narration (adapt the topics to what appears, keep the structure):
"Nemotron plans before it prices. You can read its reasoning here. It calls Tavily search for current developer rates in the US. It reviews the results, then searches for the SMS API it would build on, and for the regulation on patient data. Now it picks the best source, and Tavily Extract reads that page, pulling out only the passages about hourly rates. Every source gets a number. Then Nemotron writes the quote."

## Shot 5, 1:20 to 1:50, the quote

Screen:
1. Scroll the right panel slowly from the title down to the three figures: one-time setup, monthly support, estimated effort. Pause.
2. Point at the sentence under the figures: "Every line amount and total is computed in code…".
3. Continue to the scope table. Point at one module and its small citation number.
4. Click that citation number. The page jumps to the **Sources** list. Point at the source that carries the **"read in full"** badge.

Narration:
"A complete first draft: setup range, monthly support, effort. Each module has an hour range and a citation. Click one, and you land on the source it came from, including the page the agent read in full. The model never computes a price. It proposes hours and a rate band, and the code does the multiplication."

## Shot 6, 1:50 to 2:08, why you can trust it

Screen: scroll back up to the trace and point at its last three items.
- "Check": its line, for example "6 of 8 retrieved sources cited, every citation checked".
- "Pricing": its line, hours times rate.
- The footer: number of Nemotron calls, Tavily searches, pages extracted, tokens, model id.

Narration:
"The code checks the draft. It validates the structure, drops any citation to a page the agent never retrieved, keeps the rate inside a sane market band, and computes every total. The footer shows the run: Nemotron calls on Token Factory, Tavily searches, the page read."

## Shot 7, 2:08 to 2:22, ready to send

Screen: scroll to the bottom of the quote.
1. Point at "Questions to clarify" and "Next step".
2. Click **"Copy as Markdown"**, the status line confirms the copy.
3. Click **"Print or save as PDF"**, show the print preview for two seconds (a clean, single-column document), then press Escape.

Narration:
"It even lists the questions to ask the client before sending anything. Copy it as Markdown, or print a clean PDF. It stays a draft, for a consultant to review."

## Shot 8, 2:22 to 2:36, impact

Screen: scroll back to the form. Hover the four market options in turn: France EUR, Senegal XOF, Switzerland CHF, United States USD. Then hover the two French example chips. Do not click "Draft the quote".

Narration:
"We built it for agencies like ours, across France, Senegal and Switzerland, where rates and rules differ. Fifteen seconds, and every price in the quote traces back to a source."

## Shot 9, 2:36 to 2:45, close

Screen: scroll to the top of the page and hold on the headline, or a title card with "Devis Agent", the demo URL and the GitHub URL.

Narration:
"Devis Agent. NVIDIA Nemotron on Nebius Token Factory, researching with Tavily. Open source, MIT licensed. Try it at devis-agent-nebius dot vercel dot app."

## If something goes wrong on the take

- **A step shows as failed** (red marker): keep it. The agent carries on and the narration can say "a search timed out, the agent moves on without it". That is part of the design.
- **"This demo allows 3 quotes per hour per visitor"**: wait for the hour to pass, or record from another network.
- **The run takes longer than 30 seconds**: keep recording, the trace is still moving, and speed up that segment in editing within the 1.5x limit.

## After the take, no extra generation

- While the finished quote is still on screen, capture two screenshots of the live page at 1440 px wide and replace the files in `docs/screenshots/`: `desktop-quote.png` (viewport, trace on the left and the top of the quote on the right) and `desktop-quote-full.png` (full page). The current ones predate the citation-mark fix.
- Do not click "Draft the quote" again for the screenshots.

## Upload

- Export 1080p. Upload to YouTube as **Public** (unlisted is not enough), title "Devis Agent, Nebius x NVIDIA Global AI Hackathon demo", then paste the link into the Devpost submission and the README.
