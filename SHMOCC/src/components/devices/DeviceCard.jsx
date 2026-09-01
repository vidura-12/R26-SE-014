export default function DeviceCard({
  device,
  onEdit,
  onRemove,
  selected,
  onSelect,
}) {
  return (
    <div
      className={`device-card ${
        selected ? "selected" : ""
      }`}
    >
      <div className="device-card-header">
        <div className="device-avatar">
          ⌁
        </div>

        <div>
          <h3>{device.name}</h3>

          <span>
            {device.deviceId}
          </span>
        </div>

        <div
          className={`online-dot ${
            device.status === "online"
              ? "online"
              : "offline"
          }`}
        />
      </div>

      <div className="device-info">
        <div>
          <span>District</span>
          <strong>
            {device.district || "—"}
          </strong>
        </div>

        <div>
          <span>Location</span>
          <strong>
            {device.fieldLocation ||
              "—"}
          </strong>
        </div>

        <div>
          <span>Sensor</span>
          <strong>
            {device.type || "Sensor"}
          </strong>
        </div>

        <div>
          <span>Battery</span>
          <strong>
            {device.battery ?? 100}%
          </strong>
        </div>
      </div>

      <div className="device-actions">
        <button
          className={
            selected
              ? "device-selected"
              : "device-primary"
          }
          onClick={onSelect}
        >
          {selected
            ? "Selected"
            : "Use Device"}
        </button>

        <button
          className="device-secondary"
          onClick={() =>
            onEdit(device)
          }
        >
          Edit
        </button>

        <button
          className="device-danger"
          onClick={() =>
            onRemove(device.firestoreId)
          }
        >
          Remove
        </button>
      </div>
    </div>
  );
}