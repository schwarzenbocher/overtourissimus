// count.js

// ── 1) CountAPI‑Konfiguration ───────────────────────────────────────
const COUNT_NAMESPACE = "meinusername.github.io";
const COUNT_KEY       = "touris";
const COUNT_API_BASE  = "https://api.countapi.xyz";

export async function fetchAllTimeCount() {
  try {
    const res  = await fetch(`${COUNT_API_BASE}/get/${COUNT_NAMESPACE}/${COUNT_KEY}`);
    const data = await res.json();
    return data.value ?? 0;
  } catch {
    return 0;
  }
}

export async function hitAllTimeCount() {
  try {
    const res  = await fetch(`${COUNT_API_BASE}/hit/${COUNT_NAMESPACE}/${COUNT_KEY}`);
    const data = await res.json();
    return data.value ?? 0;
  } catch {
    return 0;
  }
}

// ── 2) Alles, was vorher im <script>…</script> deiner index.html stand ──
import { fetchAllTimeCount, hitAllTimeCount } from './count.js';

document.addEventListener("DOMContentLoaded", () => {
  // Hier kommen alle deine DOM‑Selektoren, Variablen (canvas, ctx, Buttons, Counters)
  // … plus Funktionen: updateClearButtonText, updateAllTimeStatsDisplay, clearCanvas, drawMannequin, gameLoop, resizeCanvas, takeScreenshot

  // Beispiel für den Start:
  fetchAllTimeCount().then(val => {
    allTimeTouristCount = val;
    updateAllTimeStatsDisplay();
    resizeCanvas();
  });

  // Und in drawMannequin rufst du nur noch hitAllTimeCount() auf statt allTimeTouristCount++:
  function drawMannequin(x, y) {
    // … dein Zeichen‑Code …

    hitAllTimeCount().then(newVal => {
      allTimeTouristCount = newVal;
      updateAllTimeStatsDisplay();
    });

    touristCount++;
    updateClearButtonText();
  }

  // … restliche Event‑Listener wie gehabt …
});
