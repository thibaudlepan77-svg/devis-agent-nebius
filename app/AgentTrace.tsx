import type { RunStats, TraceEntry } from "@/lib/quoteSchema";

const KIND_LABEL: Record<TraceEntry["kind"], string> = {
  plan: "Nemotron · plan",
  search: "Tavily · web search",
  read: "Tavily · extract",
  draft: "Nemotron · draft",
  check: "Check",
  price: "Pricing",
};

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

function announcement(entries: TraceEntry[], running: boolean): string {
  const last = entries.at(-1);
  if (!last) return running ? "The agent is starting." : "";
  if (last.kind === "search") {
    return last.state === "running" ? `Searching the web for ${last.title}` : `Search finished for ${last.title}`;
  }
  if (last.kind === "read") {
    return last.state === "running" ? `Reading ${last.title}` : `Finished reading ${last.title}`;
  }
  return last.title;
}

type Props = {
  entries: TraceEntry[];
  running: boolean;
  elapsedMs: number;
  stats: RunStats | null;
};

export function AgentTrace({ entries, running, elapsedMs, stats }: Props) {
  return (
    <section className="panel trace" aria-labelledby="trace-title">
      <div className="trace-head">
        <h2 id="trace-title">Agent trace</h2>
        <span className="elapsed">{seconds(elapsedMs)}</span>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement(entries, running)}
      </p>

      <ol className="steps">
        {entries.map((entry) => (
          <li key={entry.id} className={`step step-${entry.state}`}>
            <span className="marker" aria-hidden="true" />
            <div>
              <p className="step-kind">{KIND_LABEL[entry.kind]}</p>
              <p className="step-title">
                {entry.kind === "search" ? `“${entry.title}”` : entry.title}
                {entry.durationMs !== undefined ? <span className="step-meta">{seconds(entry.durationMs)}</span> : null}
              </p>
              {entry.detail ? (
                entry.kind === "plan" || entry.kind === "draft" ? (
                  <p className="thought">
                    <b>Reasoning </b>
                    {entry.detail}
                  </p>
                ) : entry.kind === "read" && entry.state === "done" ? (
                  <blockquote className="passage">{entry.detail}</blockquote>
                ) : (
                  <p className="step-detail">{entry.detail}</p>
                )
              ) : null}
              {entry.sources && entry.sources.length > 0 ? (
                <ul className="found" aria-label="Sources found">
                  {entry.sources.map((source) => (
                    <li key={source.id}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" title={source.title}>
                        <span className="found-id">[{source.id}]</span>
                        <span>
                          {source.domain}, {source.title}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
        {running && entries.length === 0 ? (
          <li className="step step-running">
            <span className="marker" aria-hidden="true" />
            <div>
              <p className="step-kind">Agent</p>
              <p className="step-title">Starting</p>
            </div>
          </li>
        ) : null}
      </ol>

      {stats ? (
        <p className="trace-foot">
          {stats.modelCalls} Nemotron calls · {stats.searches} Tavily searches · {stats.pagesRead}{" "}
          {stats.pagesRead === 1 ? "page" : "pages"} extracted ·{" "}
          {(stats.promptTokens + stats.completionTokens).toLocaleString("en-US")} tokens · {stats.model}
        </p>
      ) : null}
    </section>
  );
}
