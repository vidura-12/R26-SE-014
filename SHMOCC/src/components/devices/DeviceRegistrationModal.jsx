const DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kurunegala",
  "Matara",
  "Ratnapura",
];

export default function DeviceRegistrationModal({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  error,
  loading,
}) {
  if (!open) return null;

  const update = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="register-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              DEVICE MANAGEMENT
            </span>

            <h2>
              Register New Device
            </h2>

            <p>
              Connect an ESP32 sensor to
              your plantation.
            </p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-grid">
          <label>
            Device Name
            <input
              value={form.name}
              onChange={(e) =>
                update(
                  "name",
                  e.target.value
                )
              }
              placeholder="e.g. Field Sensor 01"
            />
          </label>

          <label>
            Device ID
            <input
              value={form.deviceId}
              onChange={(e) =>
                update(
                  "deviceId",
                  e.target.value
                )
              }
              placeholder="e.g. ESP32-001"
            />
          </label>

          <label>
            District
            <select
              value={form.district}
              onChange={(e) =>
                update(
                  "district",
                  e.target.value
                )
              }
            >
              <option value="">
                Select district
              </option>

              {DISTRICTS.map(
                (district) => (
                  <option
                    key={district}
                    value={district}
                  >
                    {district}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Field Location
            <input
              value={form.location}
              onChange={(e) =>
                update(
                  "location",
                  e.target.value
                )
              }
              placeholder="e.g. Block A"
            />
          </label>

          <label className="full-width">
            Sensor Type
            <select
              value={form.type}
              onChange={(e) =>
                update(
                  "type",
                  e.target.value
                )
              }
            >
              <option>
                Temperature & Humidity
              </option>

              <option>
                Soil Monitoring
              </option>

              <option>
                Complete Environmental Sensor
              </option>
            </select>
          </label>
        </div>

        <div className="modal-footer">
          <button
            className="cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="submit-button"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading
              ? "Registering..."
              : "Register Device"}
          </button>
        </div>
      </div>
    </div>
  );
}