export default function MonitoringCard({
  plan,
}) {
  return (
    <section className="large-card monitoring-card">
      <div className="card-title-row">
        <div>
          <span className="eyebrow">
            FOLLOW-UP
          </span>

          <h2>Monitoring Plan</h2>
        </div>

        <div className="monitor-icon">
          ◷
        </div>
      </div>

      <div className="monitor-plan">
        {plan ||
          "No monitoring plan available."}
      </div>

      <div className="monitor-timeline">
        <div className="timeline-dot" />

        <div>
          <strong>
            Recommended monitoring
          </strong>

          <p>
            Continue observing soil
            conditions and plant symptoms.
          </p>
        </div>
      </div>
    </section>
  );
}