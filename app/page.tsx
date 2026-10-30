import Link from "next/link";
import { QuoteWorkbench } from "./QuoteWorkbench";

const REPOSITORY_URL = "https://github.com/thibaudlepan77-svg/devis-agent-nebius";

const STEPS = [
  {
    title: "Nemotron plans the research",
    body: "NVIDIA Nemotron 3 Super, served by Nebius Token Factory, reads the request and decides what it needs to know before it prices anything.",
  },
  {
    title: "Tavily searches, then reads",
    body: "Through tool calls, the agent searches the client's market for hourly rates, the APIs the build would rely on and the regulation that applies, then reads its best source in full with Tavily Extract.",
  },
  {
    title: "The draft is checked, not trusted",
    body: "Nemotron writes the quote as structured output. A strict schema validates it and every citation is matched against a source the agent actually retrieved.",
  },
  {
    title: "Code does the arithmetic",
    body: "Hours times rate, rounded per market, inside a guard band. The model never writes an amount, so every figure on the quote can be traced.",
  },
];

function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--accent-strong)" />
      <path d="M10 9h8l4 4v10H10z" fill="none" stroke="var(--on-accent)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13.5 17.5l2 2 3.5-4" fill="none" stroke="var(--on-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to the quoting agent
      </a>
      <div className="shell">
        <header className="topbar">
          <Link className="brand" href="/">
            <Mark />
            Devis Agent
          </Link>
          <nav aria-label="Project">
            <a href="#how-it-works">How it works</a>
            <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
              Source on GitHub
            </a>
          </nav>
        </header>

        <main id="main">
          <section className="hero" aria-labelledby="hero-title">
            <ul className="eyebrow" aria-label="Built with">
              <li>NVIDIA Nemotron 3 Super</li>
              <li>Nebius Token Factory</li>
              <li>Tavily web search</li>
            </ul>
            <h1 id="hero-title">
              From a one-line request to a <em>sourced, priced</em> quote.
            </h1>
            <p>
              Small agencies lose hours turning a vague client request into a first quote. Devis Agent researches
              the market on the live web, drafts the scope, and prices it with arithmetic you can check, every
              figure backed by a cited source.
            </p>
          </section>

          <QuoteWorkbench />

          <section className="how" id="how-it-works" aria-labelledby="how-title">
            <h2 id="how-title">How the agent works</h2>
            <p>
              A real multi-step agent, not a single prompt. Each step below shows up live in the trace while the
              quote is being prepared.
            </p>
            <ol>
              {STEPS.map((step) => (
                <li key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </section>
        </main>

        <footer className="site-foot">
          <p>
            Built for the Nebius x NVIDIA Global AI Hackathon, Best Apps and Agents track. MIT licensed,{" "}
            <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
              source on GitHub
            </a>
            .
          </p>
          <p>
            Every quote is a draft for a consultant to review before it reaches a client. This public demo is capped
            at 3 quotes per hour per visitor and 40 per day in total.
          </p>
        </footer>
      </div>
    </>
  );
}
