export default function ActionList({
  title,
  items = [],
  icon = "✓",
  type = "normal",
}) {
  return (
    <section
      className={`large-card action-card ${type}`}
    >
      <div className="card-title-row">
        <h2>{title}</h2>

        <span className="action-count">
          {items.length}
        </span>
      </div>

      <div className="action-list">
        {items.length === 0 ? (
          <div className="empty-text">
            No actions available.
          </div>
        ) : (
          items.map((item, index) => (
            <div
              className="action-item"
              key={index}
            >
              <div className="action-icon">
                {icon}
              </div>

              <span>{item}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}