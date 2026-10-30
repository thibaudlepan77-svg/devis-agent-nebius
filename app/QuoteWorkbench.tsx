"use client";

import { useEffect, useRef, useState } from "react";
import { MARKET_IDS, MARKETS, type MarketId } from "@/lib/markets";
import { NEED_MAX_LENGTH, NEED_MIN_LENGTH } from "@/lib/limits";
import type { AgentEvent, PricedQuote, RunStats, TraceEntry } from "@/lib/quoteSchema";
import { AgentTrace } from "./AgentTrace";
import { QuoteDocument } from "./QuoteDocument";
import { QuoteSkeleton } from "./QuoteSkeleton";

type Example = { tag: string; label: string; market: MarketId; need: string };

const EXAMPLES: Example[] = [
  {
    tag: "EN",
    label: "Dental clinics, no-show reminders",
    market: "united-states",
    need: "We run two dental clinics. Patients book by phone and no-shows are costing us chair time. We want automatic SMS reminders, one-tap confirmation, and freed slots offered to our waitlist.",
  },
  {
    tag: "FR",
    label: "WhatsApp quote requests, Dakar",
    market: "senegal",
    need: "Nous recevons les demandes de devis par WhatsApp et les recopions à la main dans un tableur. Nous voulons enregistrer chaque demande automatiquement et relancer les clients qui n'ont pas répondu après trois jours.",
  },
  {
    tag: "FR",
    label: "Accounting firm client portal, Geneva",
    market: "switzerland",
    need: "Fiduciaire à Genève, nos clients nous envoient leurs pièces comptables par email, en vrac. Nous voulons un portail sécurisé qui les reçoit, les classe par client et par exercice, et relance ceux qui n'ont pas tout envoyé.",
  },
];

type Phase = "idle" | "running" | "done" | "failed";

function upsert(trace: TraceEntry[], entry: TraceEntry): TraceEntry[] {
  const index = trace.findIndex((existing) => existing.id === entry.id);
  if (index === -1) return [...trace, entry];
  const next = trace.slice();
  next[index] = entry;
  return next;
}

async function errorMessageOf(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // Not JSON, fall through to the generic message.
  }
  return `The server answered ${response.status}. Please try again.`;
}

export function QuoteWorkbench() {
  const [need, setNeed] = useState("");
  const [market, setMarket] = useState<MarketId>("france");
  const [phase, setPhase] = useState<Phase>("idle");
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [quote, setQuote] = useState<PricedQuote | null>(null);
  const [stats, setStats] = useState<RunStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const needRef = useRef<HTMLTextAreaElement>(null);

  const running = phase === "running";
  const needLength = need.trim().length;
  const canSubmit = !running && needLength >= NEED_MIN_LENGTH && needLength <= NEED_MAX_LENGTH;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  function loadExample(example: Example) {
    setNeed(example.need);
    setMarket(example.market);
    needRef.current?.focus();
  }

  function handle(event: AgentEvent) {
    if (event.type === "trace") {
      setTrace((current) => upsert(current, event.entry));
    } else if (event.type === "quote") {
      setQuote(event.quote);
      setStats(event.stats);
      setPhase("done");
    } else {
      setError(event.message);
      setPhase("failed");
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const started = Date.now();
    setPhase("running");
    setTrace([]);
    setQuote(null);
    setStats(null);
    setError(null);
    setStartedAt(started);
    setNow(started);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() =>
      workspaceRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }),
    );

    let settled = false;
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ need, market }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        setError(await errorMessageOf(response));
        setPhase("failed");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        let newline = buffer.indexOf("\n");
        while (newline !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (line) {
            const agentEvent = JSON.parse(line) as AgentEvent;
            if (agentEvent.type !== "trace") settled = true;
            handle(agentEvent);
          }
          newline = buffer.indexOf("\n");
        }
        if (done) break;
      }
      if (!settled) {
        setError("The connection closed before the quote was ready. Please try again.");
        setPhase("failed");
      }
    } catch {
      if (controller.signal.aborted) return;
      setError("The connection to the agent was lost. Please check your network and try again.");
      setPhase("failed");
    } finally {
      setNow(Date.now());
    }
  }

  const showWorkspace = phase !== "idle" && !(phase === "failed" && trace.length === 0);
  const elapsedMs = startedAt === null ? 0 : (stats?.durationMs ?? Math.max(0, now - startedAt));

  return (
    <>
      <form className="composer" onSubmit={submit} aria-busy={running} noValidate>
        <div>
          <label className="field-label" htmlFor="need">
            What does the client need? <span className="field-hint">In English or French</span>
          </label>
          <textarea
            id="need"
            ref={needRef}
            value={need}
            onChange={(event) => setNeed(event.target.value)}
            placeholder="Describe the business problem the way the client would, in a sentence or two."
            maxLength={NEED_MAX_LENGTH}
            aria-describedby="need-counter"
            required
          />
          <div className="counter" id="need-counter">
            {needLength < NEED_MIN_LENGTH
              ? `${NEED_MIN_LENGTH - needLength} more characters needed`
              : `${need.length} / ${NEED_MAX_LENGTH}`}
          </div>
        </div>

        <div className="examples">
          <span className="examples-label" id="examples-label">
            Try an example
          </span>
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              className="chip"
              onClick={() => loadExample(example)}
              disabled={running}
              aria-describedby="examples-label"
            >
              <span className="chip-tag">{example.tag}</span>
              {example.label}
            </button>
          ))}
        </div>

        <fieldset className="markets" disabled={running}>
          <legend>Client market</legend>
          <div className="market-options">
            {MARKET_IDS.map((id) => (
              <label key={id} className="market-option">
                <input
                  type="radio"
                  name="market"
                  value={id}
                  checked={market === id}
                  onChange={() => setMarket(id)}
                />
                <span>
                  <strong>{MARKETS[id].label}</strong>
                  <small>{MARKETS[id].currency}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="composer-actions">
          <button type="submit" className="primary" disabled={!canSubmit}>
            {running ? "Agent at work…" : "Draft the quote"}
          </button>
          <p className="composer-note">Takes about 20 seconds. Public demo, 3 quotes per hour per visitor.</p>
        </div>

        {error && phase === "failed" && trace.length === 0 ? (
          <p className="alert" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <div className="workspace" ref={workspaceRef} hidden={!showWorkspace}>
        {showWorkspace ? (
          <>
            <AgentTrace entries={trace} running={running} elapsedMs={elapsedMs} stats={stats} />
            {quote ? (
              <QuoteDocument quote={quote} />
            ) : phase === "failed" ? (
              <div className="panel doc">
                <p className="alert" role="alert">
                  {error}
                </p>
              </div>
            ) : (
              <QuoteSkeleton />
            )}
          </>
        ) : null}
      </div>
    </>
  );
}
