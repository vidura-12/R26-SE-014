export default function KnowledgeSources({
  sources = [],
  passages = [],
}) {
  return (
    <section className="large-card knowledge-card">
      <div className="card-title-row">
        <div>
          <span className="eyebrow">
            RAG KNOWLEDGE BASE
          </span>

          <h2>Knowledge Sources</h2>
        </div>

        <span className="source-count">
          {sources.length}
        </span>
      </div>

      <div className="source-list">
        {sources.length === 0 ? (
          <p className="empty-text">
            No sources returned.
          </p>
        ) : (
          sources.map((source, index) => (
            <div
              className="source-item"
              key={index}
            >
              <div className="source-icon">
                📚
              </div>

              <div>
                <strong>{source}</strong>

                <span>
                  Retrieved from knowledge
                  base
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {passages.length > 0 && (
        <details className="passages">
          <summary>
            View retrieved knowledge passages
          </summary>

          {passages.map(
            (passage, index) => (
              <div
                key={index}
                className="passage"
              >
                {passage}
              </div>
            )
          )}
        </details>
      )}
    </section>
  );
}