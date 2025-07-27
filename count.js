// Main game logic with CountAPI integration

// Select DOM elements
const canvas = document.getElementById('overtourismCanvas');
const ctx = canvas.getContext('2d');
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const clearButton = document.getElementById('clearButton');
const allTimeStatsDisplay = document.getElementById('allTimeStatsDisplay');
const screenshotButton = document.getElementById('screenshotButton');
const screenshotButtonContainer = document.getElementById('screenshotButtonContainer');
const clearButtonWrapper = document.getElementById('clearButtonWrapper');

// CountAPI configuration
const COUNT_API_NAMESPACE = 'overtourissimus.com';
const COUNT_API_KEY       = 'touris';
const COUNT_API_BASE      = 'https://api.countapi.xyz';

/**
 * Liest den aktuellen Wert aus CountAPI (get).
 * @returns {Promise<number>}
 */
async function fetchAllTimeCount() {
  try {
    const res  = await fetch(`${COUNT_API_BASE}/get/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}`);
    const data = await res.json();
    return data.value ?? 0;
  } catch (err) {
    console.error('CountAPI GET failed:', err);
    return 0;
  }
}

/**
 * Erhöht den Zähler um 1 und liefert den neuen Wert (hit).
 * @returns {Promise<number>}
 */
async function hitAllTimeCount() {
  try {
    const res  = await fetch(`${COUNT_API_BASE}/hit/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}`);
    const data = await res.json();
    return data.value ?? 0;
  } catch (err) {
    console.error('CountAPI HIT failed:', err);
    return 0;
  }
}

let isDrawing = false;
let touristCount = 0;
let allTimeTouristCount = 0;
let lastKnownX = 0;
let lastKnownY = 0;
let gameLoopTimeoutId = null;

const GAME_LOOP_INTERVAL = 18; // Interval for continuous drawing
const HOLD_TO_START_LOOP_DELAY = 150; // Delay before holding counts as continuous drawing

function showMessage(message) {
  if (messageText) {
    messageText.textContent = message;
  }
  if (messageBox) {
    messageBox.classList.remove('hidden');
  }
}

function updateClearButtonText() {
  if (clearButton) {
    clearButton.textContent = `clear ${touristCount.toLocaleString('de-DE')} touris`;
  }
}

function updateAllTimeStatsDisplay() {
  if (allTimeStatsDisplay) {
    allTimeStatsDisplay.textContent = `${allTimeTouristCount.toLocaleString('de-DE')} all time generated touris`;
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  touristCount = 0;
  updateClearButtonText();
}

if (clearButton) {
  clearButton.addEventListener('click', clearCanvas);
}

const skinTones = ['#FAD2A5', '#E0B49A', '#C89F82', '#A9816B', '#8B6A56', '#6F5444'];
const hairColors = ['#4A2C2A', '#6D4C41', '#B7A68E', '#D1C29B', '#F5E6CC', '#2C2C2C', '#A52A2A', '#FFDB58', '#E6E6FA'];
const topColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#82E0AA', '#FFA07A', '#20B2AA', '#DDA0DD'];
const pantColors = ['#5D4037', '#795548', '#3E2723', '#1E88E5', '#424242', '#607D8B', '#2c3e50', '#95a5a6'];

function drawMannequin(x, y) {
  const rect = canvas.getBoundingClientRect();
  const canvasX = x - rect.left;
  const canvasY = y - rect.top;
  const baseScale = 0.4 + Math.random() * 0.35;
  const personLimbColor = skinTones[Math.floor(Math.random() * skinTones.length)];
  const personHeadColor = hairColors[Math.floor(Math.random() * hairColors.length)];
  const personTopColor = topColors[Math.floor(Math.random() * topColors.length)];
  const personPantColor = pantColors[Math.floor(Math.random() * pantColors.length)];

  ctx.save();
  ctx.translate(canvasX, canvasY);
  ctx.scale(baseScale, baseScale);

  const headRadius = 15;
  const headY = -35;
  const bodyWidth = 22;
  const bodyHeight = 38;
  const bodyY = headY + headRadius - 5;
  const limbThickness = 7;

  const pantsStartY = bodyY + bodyHeight;
  const pantsWidth = bodyWidth;

  const clothingRoll = Math.random();
  let clothingType;
  let currentPantsHeight;
  const shortPantsHeight = 15;
  const longPantsHeight = 30;
  const longGarmentHeight = 40;

  if (clothingRoll < 1 / 3) {
    clothingType = 'short';
    currentPantsHeight = shortPantsHeight;
  } else if (clothingRoll < 1 / 3 + 1 / 2) {
    clothingType = 'longPants';
    currentPantsHeight = longPantsHeight;
  } else {
    clothingType = 'longGarment';
    currentPantsHeight = longGarmentHeight;
  }

  ctx.strokeStyle = personLimbColor;
  ctx.lineWidth = limbThickness;
  ctx.lineCap = 'round';

  if (clothingType === 'short') {
    const legOriginY = pantsStartY;
    const legLineLengthBelowPants = 25;
    const totalLegLengthFromOrigin = currentPantsHeight + legLineLengthBelowPants;
    const legBaseXOffset = bodyWidth / 4;
    const legSpreadAtBottom = 8;
    const footXLeft = -legBaseXOffset - legSpreadAtBottom;
    const footXRight = legBaseXOffset + legSpreadAtBottom;
    const legLineEndY = legOriginY + totalLegLengthFromOrigin;

    ctx.beginPath();
    ctx.moveTo(-legBaseXOffset, legOriginY);
    ctx.lineTo(footXLeft, legLineEndY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(legBaseXOffset, legOriginY);
    ctx.lineTo(footXRight, legLineEndY);
    ctx.stroke();
  }

  ctx.fillStyle = personPantColor;
  ctx.fillRect(-pantsWidth / 2, pantsStartY, pantsWidth, currentPantsHeight);

  if (clothingType === 'longPants') {
    const footStubLength = 5;
    const footStubY = pantsStartY + currentPantsHeight;
    const footStubXOffset = pantsWidth / 4.2;

    ctx.strokeStyle = personLimbColor;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-footStubXOffset, footStubY);
    ctx.lineTo(-footStubXOffset, footStubY + footStubLength);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(footStubXOffset, footStubY);
    ctx.lineTo(footStubXOffset, footStubY + footStubLength);
    ctx.stroke();
  } else if (clothingType === 'longGarment') {
    const footPeekLength = 4;
    const footPeekY = pantsStartY + currentPantsHeight;
    const footPeekXOffset = pantsWidth / 4.5;

    ctx.strokeStyle = personLimbColor;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-footPeekXOffset, footPeekY);
    ctx.lineTo(-footPeekXOffset, footPeekY + footPeekLength);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(footPeekXOffset, footPeekY);
    ctx.lineTo(footPeekXOffset, footPeekY + footPeekLength);
    ctx.stroke();
  }

  ctx.fillStyle = personTopColor;
  ctx.fillRect(-bodyWidth / 2, bodyY, bodyWidth, bodyHeight);

  ctx.strokeStyle = personLimbColor;
  const armShoulderOffsetY = bodyY + bodyHeight * 0.2;
  const maxArmHorizontalOffset = 20;
  const armVerticalComponentAtMaxHorizontal = 15;
  const armLengthWhenStraightDown = 28;
  const angleRandomFactor = Math.random();
  const currentArmXEndOffset = angleRandomFactor * maxArmHorizontalOffset;
  const currentArmYEndOffset =
    (1 - angleRandomFactor) * armLengthWhenStraightDown + angleRandomFactor * armVerticalComponentAtMaxHorizontal;

  ctx.beginPath();
  ctx.moveTo(-bodyWidth / 2, armShoulderOffsetY);
  ctx.lineTo(-bodyWidth / 2 - currentArmXEndOffset, armShoulderOffsetY + currentArmYEndOffset);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bodyWidth / 2, armShoulderOffsetY);
  ctx.lineTo(bodyWidth / 2 + currentArmXEndOffset, armShoulderOffsetY + currentArmYEndOffset);
  ctx.stroke();

  ctx.fillStyle = personHeadColor;
  ctx.beginPath();
  ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();

  ctx.restore();

  hitAllTimeCount().then(newVal => {
    allTimeTouristCount = newVal;
    updateAllTimeStatsDisplay();
  });
  touristCount++;
  updateClearButtonText();
}

function gameLoop() {
  if (!isDrawing) {
    gameLoopTimeoutId = null;
    return;
  }
  drawMannequin(lastKnownX, lastKnownY);
  gameLoopTimeoutId = setTimeout(gameLoop, GAME_LOOP_INTERVAL);
}

function updateLastKnownPosition(event) {
  if (event.touches && event.touches.length > 0) {
    lastKnownX = event.touches[0].clientX;
    lastKnownY = event.touches[0].clientY;
  } else {
    lastKnownX = event.clientX;
    lastKnownY = event.clientY;
  }
}

function startDrawingInteraction(event) {
  if (event.target === screenshotButton || event.target.closest('#screenshotButton')) {
    return;
  }

  if (event.target !== canvas) {
    return;
  }
  isDrawing = true;
  updateLastKnownPosition(event);
  drawMannequin(lastKnownX, lastKnownY);

  clearTimeout(gameLoopTimeoutId);
  gameLoopTimeoutId = setTimeout(() => {
    if (isDrawing) {
      gameLoop();
    }
  }, HOLD_TO_START_LOOP_DELAY);

  window.addEventListener('mousemove', handleDrawingMove);
  window.addEventListener('touchmove', handleDrawingMove, { passive: false });
  window.addEventListener('mouseup', stopDrawingInteraction);
  window.addEventListener('touchend', stopDrawingInteraction);
  window.addEventListener('touchcancel', stopDrawingInteraction);
  window.addEventListener('mouseleave', stopDrawingInteraction);
}

function handleDrawingMove(event) {
  if (!isDrawing) return;

  if (event.type === 'touchmove') {
    event.preventDefault();
  }
  updateLastKnownPosition(event);

  clearTimeout(gameLoopTimeoutId);
  gameLoopTimeoutId = null;

  if (isDrawing && gameLoopTimeoutId === null) {
    gameLoop();
  }
}

function stopDrawingInteraction() {
  if (!isDrawing) return;
  isDrawing = false;
  clearTimeout(gameLoopTimeoutId);
  gameLoopTimeoutId = null;

  window.removeEventListener('mousemove', handleDrawingMove);
  window.removeEventListener('touchmove', handleDrawingMove);
  window.removeEventListener('mouseup', stopDrawingInteraction);
  window.removeEventListener('touchend', stopDrawingInteraction);
  window.removeEventListener('touchcancel', stopDrawingInteraction);
  window.removeEventListener('mouseleave', stopDrawingInteraction);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  touristCount = 0;
  updateClearButtonText();
  updateAllTimeStatsDisplay();
}

function takeScreenshot() {
  const wasMessageBoxHidden = messageBox.classList.contains('hidden');
  if (!wasMessageBoxHidden) {
    messageBox.classList.add('hidden');
  }

  clearButtonWrapper.style.display = 'none';
  screenshotButtonContainer.style.display = 'none';

  allTimeStatsDisplay.style.backgroundColor = 'transparent';
  allTimeStatsDisplay.style.border = 'none';
  allTimeStatsDisplay.style.color = 'white';

  requestAnimationFrame(() => {
    html2canvas(document.body, {
      useCORS: true,
      allowTaint: true,
    })
      .then((canvas) => {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'overtourissimus_screenshot.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((error) => {
        console.error('Fehler beim Erstellen des Screenshots:', error);
        showMessage('Screenshot konnte nicht erstellt werden.');
      })
      .finally(() => {
        if (!wasMessageBoxHidden) {
          messageBox.classList.remove('hidden');
        }

        clearButtonWrapper.style.display = 'block';
        screenshotButtonContainer.style.display = 'flex';

        allTimeStatsDisplay.style.backgroundColor = '';
        allTimeStatsDisplay.style.border = '';
        allTimeStatsDisplay.style.color = '';
      });
  });
}

canvas.addEventListener('touchstart', startDrawingInteraction, { passive: false });
canvas.addEventListener('mousedown', startDrawingInteraction);

if (screenshotButton) {
  screenshotButton.addEventListener('click', takeScreenshot);
}

window.addEventListener('load', async () => {
  resizeCanvas();
  allTimeTouristCount = await fetchAllTimeCount();
  updateAllTimeStatsDisplay();
});
window.addEventListener('resize', resizeCanvas);

if (!ctx) {
  console.error('Error: 2D context could not be retrieved from canvas.');
  if (messageBox && messageText) {
    showMessage('Error: Canvas is not supported.');
  }
}

