const riskColors = {
  Low: "#16a34a",
  Medium: "#ca8a04",
  High: "#ea580c",
  Critical: "#dc2626",
};

export default function RiskCard({
  riskLevel = "Low",
  confidence = 0,
  loading = false,
}) {
  const color =
    riskColors[riskLevel] ||
    riskColors.Low;

  const severity = {
    Low: 25,
    Medium: 50,
    High: 75,
    Critical: 95,
  }[riskLevel] || 25;

  return (
    <div
      className="risk-card"
      style={{
        "--risk-color": color,
      }}
    >
      <div className="section-label">
        <span>●</span>
        DISEASE RISK
      </div>

      <div className="risk-content">
        <div
          className="risk-ring"
          style={{
            background: `conic-gradient(
              ${color} ${severity}%,
              #e5e7eb ${severity}% 100%
            )`,
          }}
        >
          <div className="risk-ring-inner">
            <strong>
              {loading ? "..." : riskLevel}
            </strong>

            <small>
              WHITE ROOT ROT
            </small>
          </div>
        </div>

        <div className="risk-details">
          <div
            className="risk-level"
            style={{ color }}
          >
            {riskLevel} Risk
          </div>

          <div className="risk-confidence">
            Model confidence:{" "}
            <strong>{confidence}%</strong>
          </div>

          <p>
            {riskLevel === "Low" &&
              "Current conditions show low disease risk."}

            {riskLevel === "Medium" &&
              "Early warning conditions detected. Preventive action is recommended."}

            {riskLevel === "High" &&
              "Environmental conditions are favorable for disease development."}

            {riskLevel === "Critical" &&
              "Critical conditions detected. Immediate intervention is required."}
          </p>
        </div>
      </div>
    </div>
  );
}