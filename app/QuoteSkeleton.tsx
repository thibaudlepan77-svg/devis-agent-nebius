const ROWS = ["r1", "r2", "r3", "r4"];

export function QuoteSkeleton() {
  return (
    <div className="panel doc skeleton">
      <p className="sr-only" role="status">
        Nemotron is researching and drafting the quote.
      </p>
      <div aria-hidden="true">
        <div className="doc-meta">
          <span className="bone" style={{ width: 110, height: 22, borderRadius: 999 }} />
          <span className="bone" style={{ width: 120, height: 22, borderRadius: 999, marginTop: 0 }} />
        </div>
        <span className="bone bone-title" />
        <span className="bone" style={{ width: "96%" }} />
        <span className="bone" style={{ width: "88%" }} />
        <span className="bone" style={{ width: "54%", marginBottom: 22 }} />
        <div className="figures">
          <span className="bone bone-figure" />
          <span className="bone bone-figure" style={{ marginTop: 0 }} />
          <span className="bone bone-figure" style={{ marginTop: 0 }} />
        </div>
        <span className="bone" style={{ width: "70%", margin: "6px 0 30px" }} />
        <span className="bone" style={{ width: 80, height: 10, marginBottom: 14 }} />
        {ROWS.map((row) => (
          <span key={row} className="bone bone-row" />
        ))}
        <span className="bone" style={{ width: 120, height: 10, margin: "30px 0 14px" }} />
        <span className="bone" style={{ width: "92%" }} />
        <span className="bone" style={{ width: "76%" }} />
      </div>
    </div>
  );
}
