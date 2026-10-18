
export const API_BASE_URL =
  "https://wrr-backend.thankfultree-9347156a.southeastasia.azurecontainerapps.io";

const SUPPORTED_LANGUAGES = ["en", "si", "ta"];

/**
 * Get disease-risk prediction and advisory report from the backend.
 *
 * @param {Object} sensorData - Sensor readings from the frontend.
 * @param {string} language - Selected language: en, si, or ta.
 * @returns {Promise<Object>} Prediction and advisory response.
 */
export async function getPrediction(sensorData, language = "en") {
  // 1. Validate sensor data
  if (!sensorData || typeof sensorData !== "object") {
    throw new Error("Sensor data is not available.");
  }

  // 2. Support both camelCase and backend field names
  const ph = Number(
    sensorData.soilPH ?? sensorData.Soil_pH
  );

  const moisture = Number(
    sensorData.soilMoistureVWC ??
      sensorData.Soil_Moisture_VWC
  );

  const temperature = Number(
    sensorData.soilTempC ?? sensorData.Soil_Temp_C
  );

  // 3. Ensure all sensor readings are valid numbers
  if (
    !Number.isFinite(ph) ||
    !Number.isFinite(moisture) ||
    !Number.isFinite(temperature)
  ) {
    console.error("Invalid prediction input:", {
      sensorData,
      ph,
      moisture,
      temperature,
    });

    throw new Error(
      "Invalid sensor values. Please enter valid pH, moisture and temperature."
    );
  }

  // 4. Validate selected language
  const selectedLanguage = SUPPORTED_LANGUAGES.includes(
    String(language).toLowerCase().split("-")[0]
  )
    ? String(language).toLowerCase().split("-")[0]
    : "en";

  // 5. Prepare request payload for FastAPI
  const payload = {
    Soil_pH: ph,
    Soil_Moisture_VWC: moisture,
    Soil_Temp_C: temperature,
    language: selectedLanguage,
  };

  console.log("Sending prediction request:", payload);

  // 6. Send request to the backend
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Backend connection error:", error);

    throw new Error(
      "Unable to connect to the disease prediction backend. Please check your internet connection and try again."
    );
  }

  // 7. Handle unsuccessful HTTP responses
  if (!response.ok) {
    let errorMessage = "";

    try {
      const errorData = await response.json();

      errorMessage =
        errorData?.detail ||
        errorData?.message ||
        JSON.stringify(errorData);
    } catch {
      errorMessage = await response.text();
    }

    console.error(
      "Backend prediction error:",
      response.status,
      errorMessage
    );

    throw new Error(
      errorMessage ||
        `Backend request failed with status ${response.status}.`
    );
  }

  // 8. Parse backend response
  let result;

  try {
    result = await response.json();
  } catch (error) {
    console.error("Invalid backend JSON response:", error);

    throw new Error(
      "The backend returned an invalid response."
    );
  }

  // 9. Validate the response structure
  if (!result || typeof result !== "object") {
    throw new Error(
      "The backend returned an unexpected response."
    );
  }

  if (!result.prediction || !result.advisory) {
    console.error("Unexpected prediction response:", result);

    throw new Error(
      "The backend response is missing prediction or advisory data."
    );
  }

  // 10. Log results for development and debugging
  console.log(
    "FULL PREDICTION RESPONSE:",
    JSON.stringify(result, null, 2)
  );

  console.log(
    "PREDICTED RISK:",
    result.prediction?.risk_level
  );

  console.log(
    "RISK CONFIDENCE:",
    result.prediction?.confidence
  );

  console.log(
    "ADVISORY REPORT:",
    result.advisory?.report
  );

  console.log(
    "IMMEDIATE ACTIONS:",
    result.advisory?.immediate_actions
  );

  console.log(
    "PREVENTIVE MEASURES:",
    result.advisory?.preventive_measures
  );

  console.log(
    "MONITORING PLAN:",
    result.advisory?.monitoring_plan
  );

  console.log(
    "RESPONSE LANGUAGE:",
    result.advisory?.language ?? selectedLanguage
  );

  // 11. Return complete response to the React components
  return result;
}

/**
 * Backward-compatible function for existing components.
 * Defaults to English if no language is supplied.
 */
export async function predictDiseaseRisk(
  sensorData,
  language = "en"
) {
  return getPrediction(sensorData, language);
}
