// ============================================================
// PREDICTION HISTORY STORE
// ------------------------------------------------------------
// Firebase Realtime Database-backed store.
//
// Used by:
//   - Sensor Data page -> saves prediction records
//   - History page     -> reads and displays prediction records
//
// Firebase structure:
//
// predictionHistory/
//   ├── record-id-1/
//   │   ├── id
//   │   ├── timestamp
//   │   ├── device
//   │   ├── mode
//   │   ├── soilPH
//   │   ├── soilMoistureVWC
//   │   ├── soilTempC
//   │   ├── level
//   │   └── confidence
//   └── record-id-2/
//       └── ...
// ============================================================

import {
  ref,
  push,
  set,
  remove,
  onValue,
} from "firebase/database";

import { rtdb } from "../../firebase";

// ============================================================
// FIREBASE PATH
// ============================================================

const HISTORY_PATH = "predictionHistory";

// ============================================================
// MAX RECORDS
// ------------------------------------------------------------
// Firebase will store all records.
// This value is only used when returning records to the UI.
// ============================================================

const MAX_RECORDS = 300;

// ============================================================
// GET PREDICTION HISTORY
// ------------------------------------------------------------
// This function is kept async because Firebase data is loaded
// asynchronously.
//
// IMPORTANT:
// The History.jsx component currently calls:
//
//   useState(() => getPredictionHistory())
//
// Therefore the initial value will be [] and the real Firebase
// data will arrive through subscribeToPredictionHistory().
// ============================================================

export function getPredictionHistory() {
  // Firebase data is asynchronous, so return an empty array here.
  // The realtime listener below loads the actual records.
  return [];
}

// ============================================================
// ADD PREDICTION RECORD
// ------------------------------------------------------------
// Saves a new prediction to Firebase Realtime Database.
// ============================================================

export async function addPredictionRecord(record) {
  try {
    // Get a new unique Firebase key
    const historyRef = ref(rtdb, HISTORY_PATH);
    const newRecordRef = push(historyRef);

    const entry = {
      id: newRecordRef.key,
      timestamp: Date.now(),

      // Store all values coming from the prediction
      ...record,
    };

    // Save record to Firebase
    await set(newRecordRef, entry);

    console.log("========================================");
    console.log("PREDICTION HISTORY SAVED");
    console.log("========================================");
    console.log("Firebase path:", `${HISTORY_PATH}/${newRecordRef.key}`);
    console.log("Prediction record:", entry);
    console.log("========================================");

    return entry;
  } catch (error) {
    console.error("========================================");
    console.error("FAILED TO SAVE PREDICTION HISTORY");
    console.error("========================================");
    console.error("Firebase error:", error);
    console.error("Prediction record:", record);
    console.error("========================================");

    return null;
  }
}

// ============================================================
// CLEAR PREDICTION HISTORY
// ------------------------------------------------------------
// Deletes ALL prediction history from Firebase.
// ============================================================

export async function clearPredictionHistory() {
  try {
    const historyRef = ref(rtdb, HISTORY_PATH);

    await remove(historyRef);

    console.log("Prediction history cleared from Firebase.");

    return true;
  } catch (error) {
    console.error(
      "Failed to clear prediction history:",
      error
    );

    return false;
  }
}

// ============================================================
// SUBSCRIBE TO PREDICTION HISTORY
// ------------------------------------------------------------
// Realtime Firebase listener.
//
// Whenever a prediction is added/deleted/changed, the History
// page automatically receives the latest data.
// ============================================================

export function subscribeToPredictionHistory(callback) {
  const historyRef = ref(rtdb, HISTORY_PATH);

  console.log("========================================");
  console.log("FIREBASE PREDICTION HISTORY LISTENER");
  console.log("========================================");
  console.log("Firebase path:", `/${HISTORY_PATH}`);
  console.log("========================================");

  const unsubscribe = onValue(
    historyRef,
    (snapshot) => {
      const data = snapshot.val();

      // No records
      if (!data) {
        console.log("No prediction history found in Firebase.");

        callback([]);
        return;
      }

      // Convert Firebase object into array
      const records = Object.entries(data).map(
        ([key, value]) => ({
          id: value?.id || key,
          ...value,
        })
      );

      // Sort newest first
      records.sort(
        (a, b) =>
          Number(b.timestamp || 0) -
          Number(a.timestamp || 0)
      );

      // Limit records displayed by the UI
      const limitedRecords = records.slice(
        0,
        MAX_RECORDS
      );

      console.log("========================================");
      console.log("FIREBASE PREDICTION HISTORY");
      console.log("========================================");
      console.log("Total records:", records.length);
      console.log("Records displayed:", limitedRecords.length);
      console.log("History data:", limitedRecords);
      console.log("========================================");

      callback(limitedRecords);
    },
    (error) => {
      console.error(
        "Firebase prediction history listener error:",
        error
      );

      callback([]);
    }
  );

  // Return Firebase unsubscribe function
  return () => {
    console.log(
      "Removing Firebase prediction history listener."
    );

    unsubscribe();
  };
}