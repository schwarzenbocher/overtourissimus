// countapi.js

// Passe diese Werte an deine GitHub-Pages-Domain/Key an:
const COUNT_NAMESPACE = "meinusername.github.io";
const COUNT_KEY       = "touris";
const COUNT_API_BASE  = "https://api.countapi.xyz";

/**
 * Liest den aktuellen All-Time-Zähler aus.
 * @returns {Promise<number>} Der Zählerstand (oder 0 bei Fehler)
 */
export async function fetchAllTimeCount() {
  try {
    const res  = await fetch(`${COUNT_API_BASE}/get/${COUNT_NAMESPACE}/${COUNT_KEY}`);
    const data = await res.json();
    return data.value ?? 0;
  } catch (err) {
    console.error("CountAPI get failed:", err);
    return 0;
  }
}

/**
 * Erhöht den All-Time-Zähler um 1 und gibt den neuen Wert zurück.
 * @returns {Promise<number>} Neuer Zählerstand (oder vorheriger Stand bei Fehler)
 */
export async function hitAllTimeCount() {
  try {
    const res  = await fetch(`${COUNT_API_BASE}/hit/${COUNT_NAMESPACE}/${COUNT_KEY}`);
    const data = await res.json();
    return data.value ?? 0;
  } catch (err) {
    console.error("CountAPI hit failed:", err);
    // Du könntest hier auch den vorherigen allTimeTouristCount zurückgeben,
    // den du in index.js zwischenspeicherst.
    return 0;
  }
}
