export default function SensorCard({
  icon,
  title,
  value,
  unit,
  description,
  status,
}) {
  return (
    <div className="sensor-card">
      <div className="sensor-card-top">
        <div className="sensor-icon">
          {icon}
        </div>

        <span className="sensor-status">
          ● LIVE
        </span>
      </div>

      <div className="sensor-title">
        {title}
      </div>

      <div className="sensor-value">
        {value}
        <span>{unit}</span>
      </div>

      <div className="sensor-description">
        <span>•</span> {description}
      </div>

      {status && (
        <div className="sensor-footer">
          {status}
        </div>
      )}
    </div>
  );
}