import React from "react";
import { useDevices } from "../../hooks/useDevices";

export default function DeviceTable() {
  const {
    devices,
    loading,
    error,
    removeDevice,
    openEdit,
  } = useDevices();

  if (loading) {
    return (
      <div className="device-table-card">
        <div className="device-table-header">
          <div>
            <h2>Registered Devices</h2>
            <p>Manage your connected field monitoring devices</p>
          </div>
        </div>

        <div className="device-loading">
          <div className="loading-spinner"></div>
          <span>Loading devices...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="device-table-card">
        <div className="device-error">
          <span className="error-icon">⚠️</span>
          <div>
            <h3>Unable to load devices</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="device-table-card">

      {/* HEADER */}
      <div className="device-table-header">

        <div>
          <div className="section-label">
            DEVICE MANAGEMENT
          </div>

          <h2>Registered Devices</h2>

          <p>
            Manage and monitor your connected field sensors
          </p>
        </div>

        <div className="device-count">
          <span className="device-count-dot"></span>
          {devices.length}{" "}
          {devices.length === 1 ? "Device" : "Devices"}
        </div>

      </div>


      {/* EMPTY STATE */}
      {devices.length === 0 ? (
        <div className="device-empty">

          <div className="device-empty-icon">
            📡
          </div>

          <h3>No devices registered</h3>

          <p>
            Register your first field monitoring device
            to start receiving real-time sensor data.
          </p>

        </div>
      ) : (

        /* TABLE */
        <div className="device-table-wrapper">

          <table className="device-table">

            <thead>
              <tr>
                <th>DEVICE</th>
                <th>DEVICE ID</th>
                <th>LOCATION</th>
                <th>TYPE</th>
                <th>STATUS</th>
                <th>BATTERY</th>
                <th>LAST SEEN</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {devices.map((device) => (

                <tr key={device.firestoreId || device.id}>

                  {/* DEVICE */}
                  <td>
                    <div className="device-name-cell">

                      <div className="device-icon">
                        📡
                      </div>

                      <div>
                        <strong>
                          {device.name || "Unnamed Device"}
                        </strong>

                        <span>
                          {device.type ||
                            "Temperature & Humidity"}
                        </span>
                      </div>

                    </div>
                  </td>


                  {/* DEVICE ID */}
                  <td>
                    <span className="device-id">
                      {device.deviceId || "—"}
                    </span>
                  </td>


                  {/* LOCATION */}
                  <td>
                    <div className="location-cell">

                      <span className="location-icon">
                        📍
                      </span>

                      <div>
                        <strong>
                          {device.district || "Unknown"}
                        </strong>

                        {device.fieldLocation && (
                          <span>
                            {device.fieldLocation}
                          </span>
                        )}
                      </div>

                    </div>
                  </td>


                  {/* TYPE */}
                  <td>
                    <span className="type-badge">
                      {device.type ||
                        "Temperature & Humidity"}
                    </span>
                  </td>


                  {/* STATUS */}
                  <td>

                    <div
                      className={`status-badge ${
                        device.status === "online"
                          ? "status-online"
                          : "status-offline"
                      }`}
                    >

                      <span className="status-dot"></span>

                      {device.status === "online"
                        ? "Online"
                        : "Offline"}

                    </div>

                  </td>


                  {/* BATTERY */}
                  <td>

                    <div className="battery-cell">

                      <div className="battery-bar">

                        <div
                          className="battery-fill"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                Number(
                                  device.battery ?? 100
                                )
                              )
                            )}%`,
                          }}
                        ></div>

                      </div>

                      <span>
                        {device.battery ?? 100}%
                      </span>

                    </div>

                  </td>


                  {/* LAST SEEN */}
                  <td>

                    <span className="last-seen">
                      {device.lastSeen || "Unknown"}
                    </span>

                  </td>


                  {/* ACTIONS */}
                  <td>

                    <div className="device-actions">

                      <button
                        type="button"
                        className="device-action edit"
                        onClick={() => openEdit(device)}
                        title="Edit device"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        className="device-action delete"
                        onClick={() => {

                          const confirmed =
                            window.confirm(
                              `Are you sure you want to remove "${device.name}"?`
                            );

                          if (confirmed) {
                            removeDevice(
                              device.firestoreId ||
                                device.id
                            );
                          }

                        }}
                        title="Remove device"
                      >
                        🗑️
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}