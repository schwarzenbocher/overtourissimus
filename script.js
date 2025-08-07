// --- Element References ---
const canvas = document.getElementById('overtourismCanvas');
const ctx = canvas.getContext('2d');
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const clearButton = document.getElementById('clearButton');
const allTimeStatsDisplay = document.getElementById('allTimeStatsDisplay');
const worldwideStatsDisplay = document.getElementById('worldwideStatsDisplay');
const screenshotButton = document.getElementById('screenshotButton'); 
const screenshotButtonContainer = document.getElementById('screenshotButtonContainer'); 
const clearButtonWrapper = document.getElementById('clearButtonWrapper'); 

// --- JSONBin.io Configuration ---
const BIN_ID = '688bae8df7e7a370d1f12377';
const API_KEY = '$2a$10$4ml04tUU/v8AeAWTlckjiuKZKaa8PBiqZthe10FEwkHRfzG7Fu3Sy';
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// --- State Variables ---
let isDrawing = false;
let touristCount = 0; 
let allTimeTouristCount = 0; 
let lastKnownX = 0;
let lastKnownY = 0;
let gameLoopTimeoutId = null; 

// --- Constants ---
const GAME_LOOP_INTERVAL = 18; // Interval for continuous drawing
const HOLD_TO_START_LOOP_DELAY = 150; // Delay in ms before holding is considered continuous drawing

/**
 * Fetches the current global counter value from JSONBin.
 * @returns {Promise<number>} The number of tourists.
 */
async function getCounterValue() {
    try {
        const response = await fetch(`${BIN_URL}/latest`, {
            headers: { 
                'X-Master-Key': API_KEY,
                'X-Bin-Meta': 'false' // Get only the record, not metadata
            }
        });
        if (!response.ok) throw new Error(`API GET Error: ${response.statusText}`);
        const data = await response.json();
        return data.touristCount || 0;
    } catch (err) {
        console.error("Error fetching counter value:", err);
        showMessage("Could not load global statistics.");
        return 0; // Fallback
    }
}

/**
 * Updates the global counter on JSONBin.
 * @param {number} newTotalCount - The new, absolute total value.
 * @returns {Promise<boolean>} True on success, false on error.
 */
async function updateCounterValue(newTotalCount) {
    try {
        const response = await fetch(BIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ touristCount: newTotalCount })
        });
        if (!response.ok) throw new Error(`API PUT Error: ${response.statusText}`);
        return true;
    } catch (err) {
        console.error("Error updating counter value:", err);
        showMessage("Save failed. Please try again.");
        return false;
    }
}

/**
 * Displays a message in the custom message box.
 * @param {string} message - The message to display.
 */
function showMessage(message) {
    if (messageText) messageText.textContent = message;
    if (messageBox) messageBox.classList.remove('hidden');
}

/**
 * Updates the text of the "Remove" button with the current number of tourists.
 */
function updateClearButtonText() {
    if (clearButton) {
        const buttonLabel = touristCount === 1 ? 'touri' : 'touris';
        clearButton.textContent = `remove ${touristCount.toLocaleString('de-DE')} ${buttonLabel}`;
    }
}

/**
 * Updates the display of the total generated tourists (for this session only).
 */
function updateAllTimeStatsDisplay() {
    if (allTimeStatsDisplay) {
        const label = allTimeTouristCount === 1 ? 'touri generated' : 'touris generated';
        allTimeStatsDisplay.textContent = `${allTimeTouristCount.toLocaleString('de-DE')} ${label}`;
    }
}

/**
 * Fetches the global count, adds the increment, and puts it back.
 * Updates the UI on success.
 * @param {number} countToIncrement - The number of tourists to add to the global count.
 * @returns {Promise<boolean>} True on success, false on error.
 */
async function syncAndIncrement(countToIncrement) {
    if (countToIncrement <= 0) return true;

    try {
        const currentGlobalCount = await getCounterValue();
        const newGlobalCount = currentGlobalCount + countToIncrement;
        const success = await updateCounterValue(newGlobalCount);

        if (success) {
            worldwideStatsDisplay.textContent = `${newGlobalCount.toLocaleString('de-DE')} touris removed globally`;
        }
        return success;
    } catch (error) {
        console.error("Error during sync and increment:", error);
        return false;
    }
}

/**
 * Starts the process of clearing the canvas and syncing with JSONBin, triggered by the button.
 */
async function clearCanvasAndSync() {
    const countToSync = touristCount;
    if (countToSync <= 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    touristCount = 0;
    updateClearButtonText();

    const previousGlobalText = worldwideStatsDisplay.textContent;
    worldwideStatsDisplay.textContent = 'loading global stats...';

    const success = await syncAndIncrement(countToSync);
    
    if (!success) {
        worldwideStatsDisplay.textContent = previousGlobalText;
        showMessage("Global synchronization failed.");
    }
}

// Colors for the mannequins
const skinTones = ['#FAD2A5', '#E0B49A', '#C89F82', '#A9816B', '#8B6A56', '#6F5444'];
const hairColors = ['#4A2C2A', '#6D4C41', '#B7A68E', '#D1C29B', '#F5E6CC', '#2C2C2C', '#A52A2A', '#FFDB58', '#E6E6FA'];
const topColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#82E0AA', '#FFA07A', '#20B2AA', '#DDA0DD'];
const pantColors = ['#5D4037', '#795548', '#3E2723', '#1E88E5', '#424242', '#607D8B', '#2c3e50', '#95a5a6'];

/**
 * Draws a mannequin on the canvas at the specified position.
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

    if (clothingRoll < 1/3) { 
        clothingType = 'short';
        currentPantsHeight = shortPantsHeight;
    } else if (clothingRoll < (1/3 + 1/2)) { 
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

    touristCount++;
    allTimeTouristCount++; 
    updateClearButtonText();
    updateAllTimeStatsDisplay(); 
}

/**
 * The main game loop function that continuously draws mannequins when isDrawing is true.
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
 * Updates the last known mouse or touch position.
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
 * Starts the drawing interaction on mouse down or touch start.
 */
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

/**
 * Handles mouse move or touch move events for drawing.
 */
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

/**
 * Stops the drawing interaction on mouse up or touch end.
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
 * Adjusts the canvas size to the window size, syncing any existing tourists first.
 */
async function resizeCanvas() {
    const countToSync = touristCount;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    touristCount = 0; 
    allTimeTouristCount = 0; // Reset session counter
    updateClearButtonText();
    updateAllTimeStatsDisplay(); 

    if (countToSync > 0) {
        const success = await syncAndIncrement(countToSync);
        if (!success) {
            showMessage("Could not save your last generated touris on resize.");
        }
    }
}

/**
 * Creates a screenshot and offers it for sharing (mobile) or download (desktop).
 */
async function takeScreenshot() {
    const wasMessageBoxHidden = messageBox.classList.contains('hidden');
    if (!wasMessageBoxHidden) messageBox.classList.add('hidden');
    
    clearButtonWrapper.style.display = 'none';
    screenshotButtonContainer.style.display = 'none'; 
    
    allTimeStatsDisplay.style.backgroundColor = 'transparent';
    allTimeStatsDisplay.style.border = 'none';
    allTimeStatsDisplay.style.color = 'white';
    worldwideStatsDisplay.style.backgroundColor = 'transparent';
    worldwideStatsDisplay.style.border = 'none';
    worldwideStatsDisplay.style.color = 'white';

    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const screenshotCanvas = await html2canvas(document.body, {
            useCORS: true,
            allowTaint: true,
        });

        const image = screenshotCanvas.toDataURL('image/png');
        const blob = await (await fetch(image)).blob();
        const file = new File([blob], 'overtourissimus_screenshot.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Overtourissimus',
                text: 'My overtourissimus creation.',
            });
        } else {
            const link = document.createElement('a');
            link.href = image;
            link.download = 'overtourissimus_screenshot.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error("Error creating or sharing screenshot:", error);
            showMessage("Could not create screenshot.");
        }
    } finally {
        if (!wasMessageBoxHidden) messageBox.classList.remove('hidden');
        
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

/**
 * Tries to sync the tourist count before the page unloads.
 * Uses synchronous XMLHttpRequest because async operations are not reliable in 'beforeunload'.
 */
function syncOnUnload() {
    const countToSync = touristCount;
    if (countToSync <= 0) return;

    const getReq = new XMLHttpRequest();
    getReq.open("GET", `${BIN_URL}/latest`, false); // 'false' makes it synchronous
    getReq.setRequestHeader("X-Master-Key", API_KEY);
    getReq.setRequestHeader("X-Bin-Meta", "false");
    getReq.send(null);

    if (getReq.status === 200) {
        try {
            const currentGlobalCount = JSON.parse(getReq.responseText).touristCount || 0;
            const newGlobalCount = currentGlobalCount + countToSync;

            const putReq = new XMLHttpRequest();
            putReq.open("PUT", BIN_URL, false); // 'false' makes it synchronous
            putReq.setRequestHeader("Content-Type", "application/json");
            putReq.setRequestHeader("X-Master-Key", API_KEY);
            putReq.send(JSON.stringify({ touristCount: newGlobalCount }));

            if (putReq.status === 200) {
                console.log("Sync successful on unload.");
                touristCount = 0;
            } else {
                console.error(`Sync PUT failed on unload with status: ${putReq.status}`);
            }
        } catch (e) {
            console.error("Error parsing response or updating count on unload:", e);
        }
    } else {
        console.error(`Sync GET failed on unload with status: ${getReq.status}`);
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    // Error handling for the canvas context
    if (!ctx) {
        console.error("Error: 2D context could not be retrieved from canvas.");
        if (messageBox && messageText) {
            showMessage("Error: Canvas is not supported.");
        }
        return;
    }
    
    // Initial setup
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateClearButtonText();
    updateAllTimeStatsDisplay();
    
    const globalCount = await getCounterValue();
    worldwideStatsDisplay.textContent = `${globalCount.toLocaleString('de-DE')} touris removed globally`;

    // Attach event listeners
    canvas.addEventListener('touchstart', startDrawingInteraction, { passive: false });
    canvas.addEventListener('mousedown', startDrawingInteraction);
    
    if (screenshotButton) {
        screenshotButton.addEventListener('click', takeScreenshot);
    }
    
    if(clearButton) {
        clearButton.addEventListener('click', clearCanvasAndSync);
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('beforeunload', syncOnUnload); // Sync data before leaving the page
});
