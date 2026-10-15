
import { useCallback, useEffect, useState } from "react";
import { getPrediction } from "../services/predictionApi";

export default function usePrediction(sensorData, language = "en") {
  const [prediction, setPrediction] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const predict = useCallback(async () => {
    if (!sensorData) {
      setPrediction(null);
      setAdvisory(null);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Send sensor readings and selected language to FastAPI
      const result = await getPrediction(sensorData, language);

      // Save prediction and advisory results
      setPrediction(result?.prediction ?? null);
      setAdvisory(result?.advisory ?? null);

      if (!result?.prediction || !result?.advisory) {
        throw new Error(
          "The prediction service returned incomplete data."
        );
      }
    } catch (err) {
      console.error("Prediction failed:", err);

      setPrediction(null);
      setAdvisory(null);
      setError(
        err?.message ||
          "Unable to connect to the prediction service."
      );
    } finally {
      setLoading(false);
    }
  }, [sensorData, language]);

  useEffect(() => {
    if (!sensorData) {
      setPrediction(null);
      setAdvisory(null);
      setError("");
      setLoading(false);
      return;
    }

    // Debounce requests when sensor data or language changes
    const timer = setTimeout(() => {
      predict();
    }, 500);

    return () => clearTimeout(timer);
  }, [sensorData, language, predict]);

  return {
    prediction,
    advisory,
    loading,
    error,
    refresh: predict,
  };
}
