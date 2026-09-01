export default function ConfidenceCard({
  confidence = 0,
}) {
  return (
    <div className="confidence-card">
      <div className="section-label">
        <span>◉</span>
        MODEL CONFIDENCE
      </div>

      <div className="confidence-number">
        {confidence}%
      </div>

      <div className="confidence-bar">
        <div
          style={{
            width: `${Math.min(
              100,
              Math.max(0, confidence)
            )}%`,
          }}
        />
      </div>

      <p>
        Confidence returned by the disease
        prediction model.
      </p>
    </div>
  );
}