"use client";

import { useState } from "react";
import { labelsFor, quoteToMarkdown } from "@/lib/markdown";
import { MARKETS, formatMoney } from "@/lib/markets";
import type { PricedQuote } from "@/lib/quoteSchema";

const DOC_LABELS = {
  en: {
    setupHint: (rate: string) => `at ${rate} per hour`,
    monthlyHint: (hours: number) => `${hours} h of support a month`,
    effort: "Estimated effort",
    effortHint: "one experienced developer",
    basis: "Every line amount and total is computed in code from the hours and the hourly rate, never written by the model.",
    clamped: "The proposed rate was outside the market guard band and was brought back inside it.",
  },
  fr: {
    setupHint: (rate: string) => `à ${rate} de l'heure`,
    monthlyHint: (hours: number) => `${hours} h de support par mois`,
    effort: "Charge estimée",
    effortHint: "un développeur expérimenté",
    basis: "Chaque montant de ligne et chaque total sont calculés par le code à partir des heures et du taux horaire, jamais écrits par le modèle.",
    clamped: "Le taux proposé sortait de la fourchette de garde du marché et y a été ramené.",
  },
} as const;

function Cites({ ids }: { ids: number[] }) {
  if (ids.length === 0) return null;
  return (
    <>
      {ids.map((id) => (
        <sup className="cite" key={id}>
          <a href={`#source-${id}`} aria-label={`Source ${id}`}>
            [{id}]
          </a>
        </sup>
      ))}
    </>
  );
}

function slug(title: string): string {
  return (
    title
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "quote"
  );
}

export function QuoteDocument({ quote }: { quote: PricedQuote }) {
  const [status, setStatus] = useState("");
  const market = MARKETS[quote.market];
  const t = labelsFor(quote);
  const d = DOC_LABELS[quote.language];
  const money = (amount: number) => formatMoney(amount, market);
  const range = (low: number, high: number) => (low === high ? money(low) : `${money(low)} – ${money(high)}`);
  const date = new Intl.DateTimeFormat(quote.language === "fr" ? "fr-FR" : "en-GB", { dateStyle: "long" }).format(
    new Date(quote.generatedAt),
  );

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(quoteToMarkdown(quote));
      setStatus("Markdown copied to the clipboard.");
    } catch {
      setStatus("Copy was blocked by the browser, use the download instead.");
    }
  }

  function downloadMarkdown() {
    const url = URL.createObjectURL(new Blob([quoteToMarkdown(quote)], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug(quote.title)}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Markdown file downloaded.");
  }

  return (
    <article className="panel doc" aria-labelledby="quote-title">
      <div className="doc-meta">
        <span className="badge badge-accent">{t.draft}</span>
        <span className="badge">
          {market.label} · {market.currency}
        </span>
        <span>{date}</span>
      </div>
      <h2 id="quote-title">{quote.title}</h2>
      <p className="doc-summary">{quote.summary}</p>

      <dl className="figures">
        <div className="figure figure-main">
          <dt>{t.setup}</dt>
          <dd>
            {range(quote.totals.setupLow, quote.totals.setupHigh)}
            <small>{d.setupHint(range(quote.rate.low, quote.rate.high))}</small>
          </dd>
        </div>
        <div className="figure">
          <dt>{t.monthly}</dt>
          <dd>
            {money(quote.totals.monthly)}
            <small>{d.monthlyHint(quote.totals.monthlySupportHours)}</small>
          </dd>
        </div>
        <div className="figure">
          <dt>{d.effort}</dt>
          <dd>
            {quote.totals.hoursLow}–{quote.totals.hoursHigh} h<small>{d.effortHint}</small>
          </dd>
        </div>
      </dl>
      <p className="basis">
        {d.basis} {quote.rate.clamped ? d.clamped : null}
      </p>

      <h3>{t.scope}</h3>
      <table className="scope">
        <thead>
          <tr>
            <th scope="col">{t.module}</th>
            <th scope="col" className="num">
              {t.hours}
            </th>
            <th scope="col" className="num">
              {t.amount}
            </th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.map((line) => (
            <tr key={line.name}>
              <td>
                <strong>
                  {line.name}
                  <Cites ids={line.sources} />
                </strong>
                <p>{line.description}</p>
              </td>
              <td className="num">
                {line.hoursLow}–{line.hoursHigh} h
              </td>
              <td className="num">{range(line.amountLow, line.amountHigh)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>{t.total}</td>
            <td className="num">
              {quote.totals.hoursLow}–{quote.totals.hoursHigh} h
            </td>
            <td className="num">{range(quote.totals.setupLow, quote.totals.setupHigh)}</td>
          </tr>
        </tfoot>
      </table>

      <h3>{t.rate}</h3>
      <p>
        <strong>{range(quote.rate.low, quote.rate.high)}</strong>. {quote.rate.rationale}
        <Cites ids={quote.rate.sources} />
      </p>

      {quote.tools.length > 0 ? (
        <>
          <h3>{t.tools}</h3>
          <ul>
            {quote.tools.map((tool) => (
              <li key={tool.name}>
                <strong>{tool.name}</strong>, {tool.role}
                <Cites ids={tool.sources} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {quote.compliance.length > 0 ? (
        <>
          <h3>{t.compliance}</h3>
          <ul>
            {quote.compliance.map((item) => (
              <li key={item.note}>
                {item.note}
                <Cites ids={item.sources} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {quote.assumptions.length > 0 ? (
        <>
          <h3>{t.assumptions}</h3>
          <ul>
            {quote.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </>
      ) : null}

      <h3>{t.questions}</h3>
      <ol>
        {quote.questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ol>

      <h3>{t.nextStep}</h3>
      <p className="next-step">{quote.nextStep}</p>

      <h3>{t.sources}</h3>
      {quote.sources.length > 0 ? (
        <ol className="sources">
          {quote.sources.map((source) => (
            <li key={source.id} id={`source-${source.id}`}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title}
              </a>{" "}
              <span>{source.domain}</span>
              {source.readInFull ? <span className="read-badge">{t.readInFull}</span> : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="notice">{t.unverified}</p>
      )}

      <p className="notice notice-review">
        {t.review}
      </p>

      <div className="doc-actions">
        <button type="button" className="secondary" onClick={copyMarkdown}>
          Copy as Markdown
        </button>
        <button type="button" className="secondary" onClick={downloadMarkdown}>
          Download .md
        </button>
        <button type="button" className="secondary" onClick={() => window.print()}>
          Print or save as PDF
        </button>
        <span className="action-status" role="status" aria-live="polite">
          {status}
        </span>
      </div>
    </article>
  );
}
