export default function AdvisoryCard({
  advisory,
}) {
  const report =
    advisory?.report ||
    "No AI advisory is available yet.";

  return (
    <section className="large-card advisory-card">
      <div className="card-heading">
        <div>
          <span className="heading-icon">
            ✦
          </span>

          <div>
            <span className="eyebrow">
              AI-POWERED ANALYSIS
            </span>

            <h2>AI Advisory</h2>
          </div>
        </div>

        <span className="ai-badge">
          RAG + LLM
        </span>
      </div>

      <div className="advisory-message">
        <p>
          {report
            .replace(
              /={3,}/g,
              ""
            )
            .replace(
              /CINNAMON WHITE ROOT ROT — INTELLIGENT ADVISORY REPORT/gi,
              ""
            )
            .trim()}
        </p>
      </div>
    </section>
  );
}