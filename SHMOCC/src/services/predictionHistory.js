// ============================================================
// PREDICTION HISTORY SERVICE
// ============================================================

import {
  ref,
  push,
  set,
  remove,
  onValue,
} from "firebase/database";

import { rtdb } from "./firebase";

// ============================================================
// FIREBASE PATH
// ============================================================

const HISTORY_PATH = "predictionHistory";

// Maximum number of records to return
const MAX_RECORDS = 300;

// ============================================================
// GET ALL PREDICTION HISTORY
// ============================================================

export async function getPredictionHistory() {
  return new Promise((resolve, reject) => {
    const historyRef = ref(rtdb, HISTORY_PATH);

    const unsubscribe = onValue(
      historyRef,
      (snapshot) => {
        const data = snapshot.val();

        unsubscribe();

        if (!data) {
          resolve([]);
          return;
        }

        const records = Object.entries(data).map(
          ([id, value]) => ({
            id,
            ...value,
          })
        );

        records.sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        );

        resolve(records.slice(0, MAX_RECORDS));
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

// ============================================================
// ADD PREDICTION RECORD
// ============================================================

export async function addPredictionRecord(record) {
  try {
    const historyRef = ref(rtdb, HISTORY_PATH);
    const newRecordRef = push(historyRef);

    const predictionRecord = {
      ...record,

      createdAt:
        record.createdAt ||
        new Date().toISOString(),
    };

    await set(
      newRecordRef,
      predictionRecord
    );

    return {
      id: newRecordRef.key,
      ...predictionRecord,
    };
  } catch (error) {
    console.error(
      "Failed to save prediction history:",
      error
    );

    throw error;
  }
}

// ============================================================
// DELETE SINGLE PREDICTION RECORD
// ============================================================

export async function deletePredictionRecord(id) {
  if (!id) {
    throw new Error(
      "Prediction record ID is required."
    );
  }

  try {
    const recordRef = ref(
      rtdb,
      `${HISTORY_PATH}/${id}`
    );

    await remove(recordRef);

    return true;
  } catch (error) {
    console.error(
      "Failed to delete prediction record:",
      error
    );

    throw error;
  }
}

// ============================================================
// CLEAR ALL PREDICTION HISTORY
// ============================================================

export async function clearPredictionHistory() {
  try {
    const historyRef = ref(
      rtdb,
      HISTORY_PATH
    );

    await remove(historyRef);

    return true;
  } catch (error) {
    console.error(
      "Failed to clear prediction history:",
      error
    );

    throw error;
  }
}

// ============================================================
// REAL-TIME PREDICTION HISTORY LISTENER
// ============================================================

export function subscribeToPredictionHistory(
  callback
) {
  const historyRef = ref(
    rtdb,
    HISTORY_PATH
  );

  const unsubscribe = onValue(
    historyRef,
    (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        callback([]);
        return;
      }

      const records = Object.entries(data).map(
        ([id, value]) => ({
          id,
          ...value,
        })
      );

      records.sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );

      callback(
        records.slice(0, MAX_RECORDS)
      );
    },
    (error) => {
      console.error(
        "Prediction history listener error:",
        error
      );

      callback([]);
    }
  );

  return unsubscribe;
}