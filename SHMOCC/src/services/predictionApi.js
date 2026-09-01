const API_BASE_URL =
  "https://wrr-backend.thankfultree-9347156a.southeastasia.azurecontainerapps.io";


/*
 * =========================================================
 * GET PREDICTION
 * =========================================================
 */

export async function getPrediction(sensorData) {
  if (!sensorData) {
    throw new Error(
      "Sensor data is not available."
    );
  }

  /*
   * Accept BOTH formats:
   *
   * Frontend format:
   * soilPH
   * soilMoistureVWC
   * soilTempC
   *
   * Backend format:
   * Soil_pH
   * Soil_Moisture_VWC
   * Soil_Temp_C
   */

  const ph = Number(
    sensorData.soilPH ??
      sensorData.Soil_pH
  );

  const moisture = Number(
    sensorData.soilMoistureVWC ??
      sensorData.Soil_Moisture_VWC
  );

  const temperature = Number(
    sensorData.soilTempC ??
      sensorData.Soil_Temp_C
  );


  /*
   * =======================================================
   * VALIDATE VALUES
   * =======================================================
   */

  if (
    !Number.isFinite(ph) ||
    !Number.isFinite(moisture) ||
    !Number.isFinite(temperature)
  ) {
    console.error(
      "Invalid prediction input:",
      {
        sensorData,
        ph,
        moisture,
        temperature,
      }
    );

    throw new Error(
      "Invalid sensor values. Please enter valid pH, moisture and temperature."
    );
  }


  /*
   * =======================================================
   * CREATE BACKEND PAYLOAD
   *
   * These names MUST match FastAPI.
   * =======================================================
   */

  const payload = {
    Soil_pH: ph,
    Soil_Moisture_VWC: moisture,
    Soil_Temp_C: temperature,
  };


  console.log(
    "Sending prediction request:",
    payload
  );


  /*
   * =======================================================
   * CALL AZURE FASTAPI BACKEND
   * =======================================================
   */

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/predict`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      }
    );
  } catch (error) {
    console.error(
      "Backend connection error:",
      error
    );

    throw new Error(
      "Unable to connect to the disease prediction backend."
    );
  }


  /*
   * =======================================================
   * HANDLE BACKEND ERROR
   * =======================================================
   */

  if (!response.ok) {
    let errorMessage = "";

    try {
      const errorData =
        await response.json();

      errorMessage =
        errorData?.detail ||
        errorData?.message ||
        JSON.stringify(errorData);
    } catch {
      errorMessage =
        await response.text();
    }

    console.error(
      "Backend prediction error:",
      response.status,
      errorMessage
    );

    throw new Error(
      errorMessage ||
        `Backend returned ${response.status}`
    );
  }


  /*
   * =======================================================
   * READ RESPONSE
   * =======================================================
   */

  const result =
    await response.json();


  console.log(
    "Prediction response:",
    result
  );


  /*
   * =======================================================
   * RETURN COMPLETE BACKEND RESPONSE
   * =======================================================
   */

  return result;
}


/*
 * =========================================================
 * PREDICT DISEASE RISK
 *
 * SensorData.jsx uses this function.
 * =========================================================
 */

export async function predictDiseaseRisk(
  sensorData
) {
  return getPrediction(sensorData);
}


/*
 * =========================================================
 * EXPORT API URL
 * =========================================================
 */

export {
  API_BASE_URL,
};