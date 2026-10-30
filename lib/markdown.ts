import { MARKETS, formatMoney } from "./markets";
import type { PricedQuote } from "./quoteSchema";

const LABELS = {
  en: {
    draft: "Quote draft",
    review: "Draft prepared by an AI agent, to be reviewed by a consultant before it is sent.",
    scope: "Scope",
    module: "Module",
    hours: "Hours",
    amount: "Amount",
    total: "Total",
    setup: "One-time setup",
    monthly: "Monthly support",
    perMonth: "h per month",
    rate: "Hourly rate",
    tools: "Tools and integrations",
    compliance: "Compliance",
    assumptions: "Assumptions",
    questions: "Questions to clarify",
    nextStep: "Next step",
    sources: "Sources",
    readInFull: "read in full",
    unverified: "No web source could be retrieved, rates are not checked against current market data.",
  },
  fr: {
    draft: "Brouillon de devis",
    review: "Brouillon préparé par un agent IA, à relire par un consultant avant tout envoi.",
    scope: "Périmètre",
    module: "Module",
    hours: "Heures",
    amount: "Montant",
    total: "Total",
    setup: "Mise en place",
    monthly: "Support mensuel",
    perMonth: "h par mois",
    rate: "Taux horaire",
    tools: "Outils et intégrations",
    compliance: "Conformité",
    assumptions: "Hypothèses",
    questions: "Questions à clarifier",
    nextStep: "Prochaine étape",
    sources: "Sources",
    readInFull: "lue en entier",
    unverified: "Aucune source web n'a pu être consultée, les taux ne sont pas vérifiés.",
  },
} as const;

export function labelsFor(quote: PricedQuote) {
  return LABELS[quote.language];
}

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\s+/g, " ");
}

function cites(ids: number[]): string {
  return ids.map((id) => `[${id}]`).join("");
}

export function quoteToMarkdown(quote: PricedQuote): string {
  const market = MARKETS[quote.market];
  const t = labelsFor(quote);
  const money = (amount: number) => formatMoney(amount, market);
  const range = (low: number, high: number) => (low === high ? money(low) : `${money(low)} – ${money(high)}`);
  const lines: string[] = [
    `# ${quote.title}`,
    "",
    `*${t.draft}, ${market.label}, ${market.currency}, ${quote.generatedAt.slice(0, 10)}. ${t.review}*`,
    "",
    quote.summary,
    "",
    `## ${t.scope}`,
    "",
    `| ${t.module} | ${t.hours} | ${t.amount} |`,
    "| --- | ---: | ---: |",
    ...quote.lines.map(
      (line) =>
        `| **${cell(line.name)}** ${cites(line.sources)}<br>${cell(line.description)} | ${line.hoursLow}–${line.hoursHigh} | ${range(line.amountLow, line.amountHigh)} |`,
    ),
    `| **${t.total}** | **${quote.totals.hoursLow}–${quote.totals.hoursHigh}** | **${range(quote.totals.setupLow, quote.totals.setupHigh)}** |`,
    "",
    `- **${t.setup}**: ${range(quote.totals.setupLow, quote.totals.setupHigh)}`,
    `- **${t.monthly}**: ${money(quote.totals.monthly)} (${quote.totals.monthlySupportHours} ${t.perMonth})`,
    `- **${t.rate}**: ${range(quote.rate.low, quote.rate.high)} ${cites(quote.rate.sources)}. ${quote.rate.rationale}`,
  ];

  const section = (title: string, items: string[]) => {
    if (items.length === 0) return;
    lines.push("", `## ${title}`, "", ...items.map((item) => `- ${item}`));
  };
  section(t.tools, quote.tools.map((tool) => `**${tool.name}**, ${tool.role} ${cites(tool.sources)}`.trim()));
  section(t.compliance, quote.compliance.map((item) => `${item.note} ${cites(item.sources)}`.trim()));
  section(t.assumptions, quote.assumptions);
  section(t.questions, quote.questions);
  lines.push("", `## ${t.nextStep}`, "", quote.nextStep);

  lines.push("", `## ${t.sources}`, "");
  if (quote.sources.length === 0) {
    lines.push(t.unverified);
  } else {
    lines.push(
      ...quote.sources.map(
        (source) => `${source.id}. [${source.title}](${source.url})${source.readInFull ? `, ${t.readInFull}` : ""}`,
      ),
    );
  }
  return `${lines.join("\n")}\n`;
}
