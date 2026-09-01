import { useEffect, useState } from "react";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  name: "",
  deviceId: "",
  location: "",
  district: "",
  type: "Temperature & Humidity",
};

export default function useDevices() {
  const { currentUser } = useAuth();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [registering, setRegistering] = useState(false);

  const [editingDevice, setEditingDevice] = useState(null);

  const loadDevices = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError("");

    try {
      const devicesRef = collection(
        db,
        "users",
        currentUser.uid,
        "devices"
      );

      const snapshot = await getDocs(devicesRef);

      const list = snapshot.docs
        .map((item) => ({
          firestoreId: item.id,
          ...item.data(),
        }))
        .sort(
          (a, b) =>
            (b.createdAt?.seconds || 0) -
            (a.createdAt?.seconds || 0)
        );

      setDevices(list);
    } catch (err) {
      console.error(err);
      setError("Failed to load devices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, [currentUser]);

  const registerDevice = async () => {
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Device name is required.");
      return;
    }

    if (!form.deviceId.trim()) {
      setFormError("Device ID is required.");
      return;
    }

    if (!form.district) {
      setFormError("Please select a district.");
      return;
    }

    const duplicate = devices.find(
      (device) =>
        device.deviceId === form.deviceId.trim()
    );

    if (duplicate) {
      setFormError("This device is already registered.");
      return;
    }

    setRegistering(true);

    try {
      const deviceData = {
        name: form.name.trim(),
        deviceId: form.deviceId.trim(),

        rtdbPath:
          `/devices/${form.deviceId.trim()}/sensorData`,

        location:
          form.district +
          (form.location
            ? ` — ${form.location}`
            : ""),

        district: form.district,

        fieldLocation: form.location.trim(),

        type: form.type,

        status: "online",

        battery: 100,

        lastSeen: "just now",

        createdAt: serverTimestamp(),
      };

      const devicesRef = collection(
        db,
        "users",
        currentUser.uid,
        "devices"
      );

      const document = await addDoc(
        devicesRef,
        deviceData
      );

      setDevices((previous) => [
        {
          firestoreId: document.id,
          ...deviceData,
        },
        ...previous,
      ]);

      setForm(EMPTY_FORM);
      setShowRegister(false);
    } catch (err) {
      console.error(err);
      setFormError(
        "Unable to register device. Please try again."
      );
    } finally {
      setRegistering(false);
    }
  };

  const removeDevice = async (firestoreId) => {
    if (!currentUser) return;

    const confirmed = window.confirm(
      "Remove this device?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(
          db,
          "users",
          currentUser.uid,
          "devices",
          firestoreId
        )
      );

      setDevices((previous) =>
        previous.filter(
          (device) =>
            device.firestoreId !== firestoreId
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to remove device.");
    }
  };

  const startEdit = (device) => {
    setEditingDevice({
      ...device,
    });
  };

  const saveEdit = async (updates) => {
    if (!currentUser || !editingDevice) return;

    try {
      const deviceRef = doc(
        db,
        "users",
        currentUser.uid,
        "devices",
        editingDevice.firestoreId
      );

      await updateDoc(deviceRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      setDevices((previous) =>
        previous.map((device) =>
          device.firestoreId ===
          editingDevice.firestoreId
            ? {
                ...device,
                ...updates,
              }
            : device
        )
      );

      setEditingDevice(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update device.");
    }
  };

  return {
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

    editingDevice,
    startEdit,
    saveEdit,
    setEditingDevice,

    reload: loadDevices,
  };
}