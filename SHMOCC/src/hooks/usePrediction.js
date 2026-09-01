import { useCallback, useEffect, useState } from "react";
import { getPrediction } from "../services/predictionApi";

export default function usePrediction(sensorData) {
  const [prediction, setPrediction] = useState(null);
  const [advisory, setAdvisory] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const predict = useCallback(async () => {
    if (!sensorData) return;

    setLoading(true);
    setError("");

    try {
      const result = await getPrediction(
        sensorData
      );

      setPrediction(result.prediction || null);
      setAdvisory(result.advisory || null);
    } catch (err) {
      console.error(
        "Prediction failed:",
        err
      );

      setError(
        "Unable to connect to the prediction service."
      );
    } finally {
      setLoading(false);
    }
  }, [sensorData]);

  useEffect(() => {
    if (!sensorData) return;

    const timer = setTimeout(() => {
      predict();
    }, 500);

    return () => clearTimeout(timer);
  }, [sensorData, predict]);

  return {
    prediction,
    advisory,
    loading,
    error,
    refresh: predict,
  };
}