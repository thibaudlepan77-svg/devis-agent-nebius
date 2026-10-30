"use client";

import { useState } from "react";
import type { QuoteResponse } from "@/lib/quoteSchema";

type Market = "senegal" | "france" | "suisse";

const MARKET_LABEL: Record<Market, string> = {
  senegal: "Sénégal (FCFA)",
  france: "France (EUR)",
  suisse: "Suisse (CHF)",
};

export function QuoteForm() {
  const [need, setNeed] = useState("");
  const [market, setMarket] = useState<Market>("senegal");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setQuote(null);

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ need, market }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Erreur serveur.");
      }
      setQuote(data as QuoteResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <textarea
          value={need}
          onChange={(event) => setNeed(event.target.value)}
          placeholder="Exemple, nous recevons les demandes de devis par WhatsApp et les retapons à la main dans un tableau, nous aimerions automatiser la relance des clients qui ne répondent pas après trois jours."
          required
          minLength={20}
          maxLength={2000}
        />
        <select value={market} onChange={(event) => setMarket(event.target.value as Market)}>
          {Object.entries(MARKET_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Génération en cours..." : "Générer le brouillon de devis"}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </form>

      {quote ? (
        <section className="result">
          <h2>Brouillon de devis</h2>
          <p>{quote.summary}</p>
          <p className="price">
            {quote.setupPriceLow.toLocaleString("fr-FR")} à {quote.setupPriceHigh.toLocaleString("fr-FR")}{" "}
            {quote.currency} de mise en place, puis {quote.monthlySubscription.toLocaleString("fr-FR")}{" "}
            {quote.currency} par mois.
          </p>

          {quote.modules.map((module) => (
            <article className="module" key={module.name}>
              <h3>{module.name}</h3>
              <p>{module.description}</p>
              <p className="hours">Estimation, environ {module.estimatedHours} heures de travail.</p>
            </article>
          ))}

          {quote.clarifyingQuestions.length > 0 ? (
            <>
              <h2>Questions à clarifier avant envoi</h2>
              <ul className="questions">
                {quote.clarifyingQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </>
          ) : null}

          <h2>Prochaine étape</h2>
          <p>{quote.nextStep}</p>
        </section>
      ) : null}
    </>
  );
}
