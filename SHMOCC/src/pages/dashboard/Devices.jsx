import { useEffect, useState } from "react";

import useDevices from "../../hooks/useDevices";

import DeviceCard from "../../components/devices/DeviceCard";
import DeviceRegistrationModal from "../../components/devices/DeviceRegistrationModal";

export default function Devices() {
  const {
    devices,
    loading,
    error,
    showRegister,
    setShowRegister,
    form,
    setForm,
    formError,
    registering,
    registerDevice,
    removeDevice,
    startEdit,
  } = useDevices();

  const [
    selectedDevice,
    setSelectedDevice,
  ] = useState(
    localStorage.getItem(
      "selectedDeviceId"
    )
  );

  useEffect(() => {
    if (
      !selectedDevice &&
      devices.length > 0
    ) {
      setSelectedDevice(
        devices[0].deviceId
      );

      localStorage.setItem(
        "selectedDeviceId",
        devices[0].deviceId
      );
    }
  }, [devices, selectedDevice]);

  const selectDevice = (deviceId) => {
    setSelectedDevice(deviceId);

    localStorage.setItem(
      "selectedDeviceId",
      deviceId
    );
  };

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">
        <div>
          <div className="breadcrumb">
            CINNAPREDICT / DEVICES
          </div>

          <h1>
            Device Management
          </h1>

          <p>
            Register and manage your field
            monitoring devices.
          </p>
        </div>

        <button
          className="primary-header-button"
          onClick={() =>
            setShowRegister(true)
          }
        >
          + Register Device
        </button>
      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      <div className="device-summary">
        <div>
          <span>Total Devices</span>
          <strong>{devices.length}</strong>
        </div>

        <div>
          <span>Online</span>

          <strong>
            {
              devices.filter(
                (d) =>
                  d.status ===
                  "online"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>Offline</span>

          <strong>
            {
              devices.filter(
                (d) =>
                  d.status !==
                  "online"
              ).length
            }
          </strong>
        </div>
      </div>

      {loading ? (
        <div className="loading-box">
          Loading devices...
        </div>
      ) : devices.length === 0 ? (
        <div className="empty-devices">
          <div className="empty-large-icon">
            ⌁
          </div>

          <h2>
            No devices registered
          </h2>

          <p>
            Register your first ESP32
            sensor to start monitoring
            plantation conditions.
          </p>

          <button
            className="primary-header-button"
            onClick={() =>
              setShowRegister(true)
            }
          >
            Register First Device
          </button>
        </div>
      ) : (
        <div className="device-grid">
          {devices.map((device) => (
            <DeviceCard
              key={device.firestoreId}
              device={device}
              selected={
                selectedDevice ===
                device.deviceId
              }
              onSelect={() =>
                selectDevice(
                  device.deviceId
                )
              }
              onEdit={startEdit}
              onRemove={removeDevice}
            />
          ))}
        </div>
      )}

      <DeviceRegistrationModal
        open={showRegister}
        onClose={() =>
          setShowRegister(false)
        }
        form={form}
        setForm={setForm}
        onSubmit={registerDevice}
        error={formError}
        loading={registering}
      />

    </div>
  );
}