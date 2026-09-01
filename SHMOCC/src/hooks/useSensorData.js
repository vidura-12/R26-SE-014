import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "../services/firebase";

export default function useSensorData(deviceId) {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!deviceId) {
      setSensorData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const sensorRef = ref(
      rtdb,
      `devices/${deviceId}/sensorData`
    );

    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setSensorData(null);
          setError("No sensor data available.");
          setLoading(false);
          return;
        }

        const normalized = {
          soilPH: Number(
            data.soilPH ??
            data.Soil_pH ??
            data.ph ??
            data.pH ??
            0
          ),

          soilMoistureVWC: Number(
            data.soilMoistureVWC ??
            data.Soil_Moisture_VWC ??
            data.moisture ??
            data.moistureVWC ??
            0
          ),

          soilTempC: Number(
            data.soilTempC ??
            data.Soil_Temp_C ??
            data.temp ??
            data.temperature ??
            0
          ),

          humidity: Number(
            data.humidity ?? 0
          ),

          rainfall: Number(
            data.rainfall ?? 0
          ),

          windSpeed: Number(
            data.windSpeed ?? 0
          ),

          uvIndex: Number(
            data.uvIndex ?? 0
          ),

          timestamp:
            data.timestamp ??
            data.lastUpdated ??
            Date.now(),
        };

        setSensorData(normalized);
        setLoading(false);
      },
      (firebaseError) => {
        console.error(firebaseError);
        setError("Unable to read live sensor data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [deviceId]);

  return {
    sensorData,
    loading,
    error,
  };
}