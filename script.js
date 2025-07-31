// --- DOM Element Selection ---
const canvas = document.getElementById('overtourismCanvas');
const ctx = canvas.getContext('2d');
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const messageBoxOkButton = document.getElementById('messageBoxOkButton');
const clearButton = document.getElementById('clearButton');
const allTimeStatsDisplay = document.getElementById('allTimeStatsDisplay');
const worldwideStatsDisplay = document.getElementById('worldwideStatsDisplay');
const screenshotButton = document.getElementById('screenshotButton');
const screenshotButtonContainer = document.getElementById('screenshotButtonContainer');
const clearButtonWrapper = document.getElementById('clearButtonWrapper');

// --- State and Configuration ---
let isDrawing = false;
let touristCount = 0;
let allTimeTouristCount = 0;
let lastKnownX = 0;
let lastKnownY = 0;
let gameLoopTimeoutId = null;

const GAME_LOOP_INTERVAL = 18; // Interval for continuous drawing
const HOLD_TO_START_LOOP_DELAY = 150; // Delay before continuous drawing starts

// --- Mannequin Colors ---
const skinTones = ['#FAD2A5', '#E0B49A', '#C89F82', '#A9816B', '#8B6A56', '#6F5444'];
const hairColors = ['#4A2C2A', '#6D4C41', '#B7A68E', '#D1C29B', '#F5E6CC', '#2C2C2C', '#A52A2A', '#FFDB58', '#E6E6FA'];
const topColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#82E0AA', '#FFA07A', '#20B2AA', '#DDA0DD'];
const pantColors = ['#5D4037', '#795548', '#3E2723', '#1E88E5', '#424242', '#607D8B', '#2c3e50', '#95a5a6'];

// --- Functions ---

/**
 * Fetches the initial global counter value from stats.json.
 * @returns {Promise<number>} The number of tourists.
 */
async function getInitialCounterValue() {
    try {
        const response = await fetch('stats.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.touristCount || 0;
    } catch (err) {
        console.error("Error fetching initial stats:", err);
        showMessage("Could not load global statistics.");
        return 0; // Fallback
    }
}

/**
 * Displays a message in the custom message box.
 * @param {string} message - The message to display.
 */
function showMessage(message) {
    if (messageText) messageText.textContent = message;
    if (messageBox) messageBox.style.display = 'block';
}

/**
 * Hides the message box.
 */
function hideMessageBox() {
    if (messageBox) messageBox.style.display = 'none';
}

/**
 * Updates the text of the "Remove" button with the current tourist count.
 */
function updateClearButtonText() {
    if (clearButton) {
        const buttonLabel = touristCount === 1 ? 'touri' : 'touris';
        clearButton.textContent = `remove ${touristCount.toLocaleString('de-DE')} ${buttonLabel}`;
    }
}

/**
 * Updates the display for tourists generated in the current session.
 */
function updateAllTimeStatsDisplay() {
    if (allTimeStatsDisplay) {
        const label = allTimeTouristCount === 1 ? 'touri generated' : 'touris generated';
        allTimeStatsDisplay.textContent = `${allTimeTouristCount.toLocaleString('de-DE')} ${label}`;
    }
}

/**
 * Clears the canvas and updates the global stats display.
 */
function clearCanvasAndSync() {
    if (touristCount <= 0) return;

    // Clear canvas and reset local counts
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const countToRemove = touristCount;
    touristCount = 0;
    updateClearButtonText();

    // Update the global display optimistically
    const currentGlobalText = worldwideStatsDisplay.textContent;
    const currentGlobalCount = parseInt(currentGlobalText.replace(/[^0-9]/g, ''), 10) || 0;
    const newGlobalCount = currentGlobalCount + countToRemove;

    const label = newGlobalCount === 1 ? 'touri removed globally' : 'touris removed globally';
    worldwideStatsDisplay.textContent = `${newGlobalCount.toLocaleString('de-DE')} ${label}`;
}

/**
 * Draws a mannequin on the canvas at the specified position.
 * @param {number} x - The clientX coordinate.
 * @param {number} y - The clientY coordinate.
 */
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
    } else if (clothingRoll < (1 / 3 + 1 / 2)) {
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
    const armShoulderOffsetY = bodyY + bodyHeight * 0.20;
    const maxArmHorizontalOffset = 20;
    const armVerticalComponentAtMaxHorizontal = 15;
    const armLengthWhenStraightDown = 28;
    const angleRandomFactor = Math.random();
    const currentArmXEndOffset = angleRandomFactor * maxArmHorizontalOffset;
    const currentArmYEndOffset = (1 - angleRandomFactor) * armLengthWhenStraightDown + angleRandomFactor * armVerticalComponentAtMaxHorizontal;

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

    // Update local counters
    touristCount++;
    allTimeTouristCount++;
    updateClearButtonText();
    updateAllTimeStatsDisplay();
}

/**
 * The main game loop for continuous drawing.
 */
function gameLoop() {
    if (!isDrawing) {
        gameLoopTimeoutId = null;
        return;
    }
    drawMannequin(lastKnownX, lastKnownY);
    gameLoopTimeoutId = setTimeout(gameLoop, GAME_LOOP_INTERVAL);
}

/**
 * Updates the last known mouse/touch position.
 * @param {Event} event - The mouse or touch event.
 */
function updateLastKnownPosition(event) {
    if (event.touches && event.touches.length > 0) {
        lastKnownX = event.touches[0].clientX;
        lastKnownY = event.touches[0].clientY;
    } else {
        lastKnownX = event.clientX;
        lastKnownY = event.clientY;
    }
}

/**
 * Starts the drawing interaction.
 * @param {Event} event - The mouse or touch event.
 */
function startDrawingInteraction(event) {
    if (event.target.closest('#screenshotButton')) return;
    if (event.target !== canvas) return;

    isDrawing = true;
    updateLastKnownPosition(event);
    drawMannequin(lastKnownX, lastKnownY);

    clearTimeout(gameLoopTimeoutId);
    gameLoopTimeoutId = setTimeout(() => {
        if (isDrawing) gameLoop();
    }, HOLD_TO_START_LOOP_DELAY);

    window.addEventListener('mousemove', handleDrawingMove);
    window.addEventListener('touchmove', handleDrawingMove, { passive: false });
    window.addEventListener('mouseup', stopDrawingInteraction);
    window.addEventListener('touchend', stopDrawingInteraction);
    window.addEventListener('touchcancel', stopDrawingInteraction);
    window.addEventListener('mouseleave', stopDrawingInteraction);
}

/**
 * Handles mouse/touch move events during drawing.
 * @param {Event} event - The mouse or touch event.
 */
function handleDrawingMove(event) {
    if (!isDrawing) return;
    if (event.type === 'touchmove') event.preventDefault();
    
    updateLastKnownPosition(event);
    
    if (gameLoopTimeoutId === null) {
        gameLoop();
    }
}

/**
 * Stops the drawing interaction.
 */
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

/**
 * Resizes the canvas to fit the window and resets the scene.
 */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    touristCount = 0;
    allTimeTouristCount = 0;
    updateClearButtonText();
    updateAllTimeStatsDisplay();
}

/**
 * Takes a screenshot and initiates download or sharing.
 */
async function takeScreenshot() {
    const wasMessageBoxHidden = messageBox.style.display === 'none';
    if (!wasMessageBoxHidden) hideMessageBox();
    
    // Temporarily hide UI elements for a clean screenshot
    clearButtonWrapper.style.display = 'none';
    screenshotButtonContainer.style.display = 'none';
    
    allTimeStatsDisplay.style.backgroundColor = 'transparent';
    allTimeStatsDisplay.style.border = 'none';
    allTimeStatsDisplay.style.color = 'white';
    worldwideStatsDisplay.style.backgroundColor = 'transparent';
    worldwideStatsDisplay.style.border = 'none';
    worldwideStatsDisplay.style.color = 'white';

    await new Promise(resolve => setTimeout(resolve, 50)); // Wait for styles to apply

    try {
        const canvasElement = await html2canvas(document.body, {
            useCORS: true,
            allowTaint: true,
        });

        const image = canvasElement.toDataURL('image/png');
        const blob = await (await fetch(image)).blob();
        const file = new File([blob], 'overtourissimus_screenshot.png', { type: 'image/png' });

        // Use Web Share API if available (mobile)
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Overtourissimus',
                text: 'My overtourissimus creation.',
            });
        } else { // Fallback to download (desktop)
            const link = document.createElement('a');
            link.href = image;
            link.download = 'overtourissimus_screenshot.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    } catch (error) {
        if (error.name !== 'AbortError') { // Ignore user-cancelled share action
            console.error("Error creating or sharing screenshot:", error);
            showMessage("Screenshot could not be created.");
        }
    } finally {
        // Restore UI elements
        if (!wasMessageBoxHidden) showMessage(messageText.textContent);
        
        clearButtonWrapper.style.display = 'block';
        screenshotButtonContainer.style.display = 'flex';
        
        allTimeStatsDisplay.style.backgroundColor = '';
        allTimeStatsDisplay.style.border = '';
        allTimeStatsDisplay.style.color = '';
        worldwideStatsDisplay.style.backgroundColor = '';
        worldwideStatsDisplay.style.border = '';
        worldwideStatsDisplay.style.color = '';
    }
}


// --- Event Listeners ---
canvas.addEventListener('touchstart', startDrawingInteraction, { passive: false });
canvas.addEventListener('mousedown', startDrawingInteraction);
clearButton.addEventListener('click', clearCanvasAndSync);
screenshotButton.addEventListener('click', takeScreenshot);
messageBoxOkButton.addEventListener('click', hideMessageBox);
window.addEventListener('resize', resizeCanvas);

// --- Initialization ---
window.addEventListener('load', async () => {
    resizeCanvas();
    
    if (!ctx) {
        console.error("Error: 2D context could not be retrieved from canvas.");
        showMessage("Error: Canvas is not supported.");
        return;
    }

    // Load and display initial global stats
    const globalCount = await getInitialCounterValue();
    const label = globalCount === 1 ? 'touri removed globally' : 'touris removed globally';
    worldwideStatsDisplay.textContent = `${globalCount.toLocaleString('de-DE')} ${label}`;
});
