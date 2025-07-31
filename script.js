// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Element Selectors ---
    const canvas = document.getElementById('overtourismCanvas');
    const ctx = canvas.getContext('2d');
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    const closeMessageBoxButton = document.getElementById('closeMessageBox');
    const clearButton = document.getElementById('clearButton');
    const allTimeStatsDisplay = document.getElementById('allTimeStatsDisplay');
    const worldwideStatsDisplay = document.getElementById('worldwideStatsDisplay');
    const screenshotButton = document.getElementById('screenshotButton');
    const screenshotButtonContainer = document.getElementById('screenshotButtonContainer');
    const clearButtonWrapper = document.getElementById('clearButtonWrapper');

    // --- JSONBin.io Configuration ---
    // This service is used to store and retrieve the global counter.
    const BIN_ID = '688bae8df7e7a370d1f12377';
    const API_KEY = '$2a$10$OJmFOjUkcjTC/ZlvP5LiiecO3/y59vL2BwSnzpcNX1m8TKQPpdGvm';
    const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

    // --- State Variables ---
    let isDrawing = false;
    let touristCount = 0; // Tourists in the current drawing session
    let allTimeTouristCount = 0; // Total tourists generated in this browser session
    let lastKnownX = 0;
    let lastKnownY = 0;
    let gameLoopTimeoutId = null;

    // --- Constants ---
    const GAME_LOOP_INTERVAL = 18; // Interval for continuous drawing in ms
    const HOLD_TO_START_LOOP_DELAY = 150; // Delay in ms before holding is considered continuous drawing

    /**
     * Fetches the current global counter value from JSONBin.
     * @returns {Promise<number>} The number of tourists.
     */
    async function getCounterValue() {
        try {
            const response = await fetch(BIN_URL, {
                headers: { 'X-Master-Key': API_KEY }
            });
            if (!response.ok) throw new Error(`API GET Error: ${response.statusText}`);
            const data = await response.json();
            return data.record.touristCount || 0;
        } catch (err) {
            console.error("Error fetching counter:", err);
            showMessage("Could not load global statistics.");
            return 0; // Fallback value
        }
    }

    /**
     * Updates the global counter value on JSONBin.
     * @param {number} newTotalCount - The new, absolute total value.
     * @returns {Promise<boolean>} True on success, false on failure.
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
            console.error("Error updating counter:", err);
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
     * Updates the text of the "Remove" button with the current tourist count.
     */
    function updateClearButtonText() {
        if (clearButton) {
            const buttonLabel = touristCount === 1 ? 'touri' : 'touris';
            clearButton.textContent = `remove ${touristCount.toLocaleString('de-DE')} ${buttonLabel}`;
        }
    }

    /**
     * Updates the display for total tourists generated in this session.
     */
    function updateAllTimeStatsDisplay() {
        if (allTimeStatsDisplay) {
            const label = allTimeTouristCount === 1 ? 'touri generated' : 'touris generated';
            allTimeStatsDisplay.textContent = `${allTimeTouristCount.toLocaleString('de-DE')} ${label}`;
        }
    }

    /**
     * Clears the canvas and syncs the count with the global counter.
     * The UI updates instantly, while the sync happens in the background.
     */
    async function clearCanvasAndSync() {
        const countToSync = touristCount;
        if (countToSync <= 0) return; // Nothing to do

        // --- Instant UI Updates ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        touristCount = 0;
        updateClearButtonText();

        const previousGlobalText = worldwideStatsDisplay.textContent;
        worldwideStatsDisplay.textContent = 'loading global stats...';

        // --- Asynchronous Background Update ---
        try {
            const currentGlobalCount = await getCounterValue();
            const newGlobalCount = currentGlobalCount + countToSync;
            const success = await updateCounterValue(newGlobalCount);

            if (success) {
                worldwideStatsDisplay.textContent = `${newGlobalCount.toLocaleString('de-DE')} touris removed globally`;
            } else {
                worldwideStatsDisplay.textContent = previousGlobalText; // Revert on failure
            }
        } catch (error) {
            console.error("Error during sync process:", error);
            worldwideStatsDisplay.textContent = previousGlobalText; // Revert on error
            showMessage("Global sync failed.");
        }
    }

    // --- Mannequin Drawing Configuration ---
    const skinTones = ['#FAD2A5', '#E0B49A', '#C89F82', '#A9816B', '#8B6A56', '#6F5444'];
    const hairColors = ['#4A2C2A', '#6D4C41', '#B7A68E', '#D1C29B', '#F5E6CC', '#2C2C2C', '#A52A2A', '#FFDB58', '#E6E6FA'];
    const topColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#82E0AA', '#FFA07A', '#20B2AA', '#DDA0DD'];
    const pantColors = ['#5D4037', '#795548', '#3E2723', '#1E88E5', '#424242', '#607D8B', '#2c3e50', '#95a5a6'];

    /**
     * Draws a mannequin on the canvas at the specified screen position.
     * @param {number} x - The screen X-coordinate.
     * @param {number} y - The screen Y-coordinate.
     */
    function drawMannequin(x, y) {
        const rect = canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;
        
        // Randomize appearance
        const baseScale = 0.4 + Math.random() * 0.35;
        const personLimbColor = skinTones[Math.floor(Math.random() * skinTones.length)];
        const personHeadColor = hairColors[Math.floor(Math.random() * hairColors.length)];
        const personTopColor = topColors[Math.floor(Math.random() * topColors.length)];
        const personPantColor = pantColors[Math.floor(Math.random() * pantColors.length)];

        ctx.save();
        ctx.translate(canvasX, canvasY);
        ctx.scale(baseScale, baseScale);

        // Define body parts dimensions
        const headRadius = 15;
        const headY = -35;
        const bodyWidth = 22;
        const bodyHeight = 38;
        const bodyY = headY + headRadius - 5;
        const limbThickness = 7;
        const pantsStartY = bodyY + bodyHeight;
        const pantsWidth = bodyWidth;

        // Randomize clothing type
        const clothingRoll = Math.random();
        let clothingType, currentPantsHeight;
        const shortPantsHeight = 15, longPantsHeight = 30, longGarmentHeight = 40;

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

        // Draw legs based on clothing type
        if (clothingType === 'short') {
            const legOriginY = pantsStartY;
            const legLineLengthBelowPants = 25;
            const totalLegLengthFromOrigin = currentPantsHeight + legLineLengthBelowPants;
            const legBaseXOffset = bodyWidth / 4;
            const legSpreadAtBottom = 8;
            const footXLeft = -legBaseXOffset - legSpreadAtBottom;
            const footXRight = legBaseXOffset + legSpreadAtBottom;
            const legLineEndY = legOriginY + totalLegLengthFromOrigin;

            ctx.beginPath(); ctx.moveTo(-legBaseXOffset, legOriginY); ctx.lineTo(footXLeft, legLineEndY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(legBaseXOffset, legOriginY); ctx.lineTo(footXRight, legLineEndY); ctx.stroke();
        }

        // Draw pants/garment
        ctx.fillStyle = personPantColor;
        ctx.fillRect(-pantsWidth / 2, pantsStartY, pantsWidth, currentPantsHeight);

        // Draw feet peeking out if necessary
        if (clothingType === 'longPants' || clothingType === 'longGarment') {
            const footPeekLength = (clothingType === 'longPants') ? 5 : 4;
            const footPeekY = pantsStartY + currentPantsHeight;
            const footPeekXOffset = pantsWidth / 4.2;
            
            ctx.strokeStyle = personLimbColor;
            ctx.lineCap = 'round';

            ctx.beginPath(); ctx.moveTo(-footPeekXOffset, footPeekY); ctx.lineTo(-footPeekXOffset, footPeekY + footPeekLength); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(footPeekXOffset, footPeekY); ctx.lineTo(footPeekXOffset, footPeekY + footPeekLength); ctx.stroke();
        }
        
        // Draw torso
        ctx.fillStyle = personTopColor;
        ctx.fillRect(-bodyWidth / 2, bodyY, bodyWidth, bodyHeight);

        // Draw arms with random angle
        ctx.strokeStyle = personLimbColor;
        const armShoulderOffsetY = bodyY + bodyHeight * 0.20;
        const maxArmHorizontalOffset = 20;
        const armVerticalComponentAtMaxHorizontal = 15;
        const armLengthWhenStraightDown = 28;
        const angleRandomFactor = Math.random();
        const currentArmXEndOffset = angleRandomFactor * maxArmHorizontalOffset;
        const currentArmYEndOffset = (1 - angleRandomFactor) * armLengthWhenStraightDown + angleRandomFactor * armVerticalComponentAtMaxHorizontal;

        ctx.beginPath(); ctx.moveTo(-bodyWidth / 2, armShoulderOffsetY); ctx.lineTo(-bodyWidth / 2 - currentArmXEndOffset, armShoulderOffsetY + currentArmYEndOffset); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bodyWidth / 2, armShoulderOffsetY); ctx.lineTo(bodyWidth / 2 + currentArmXEndOffset, armShoulderOffsetY + currentArmYEndOffset); ctx.stroke();

        // Draw head
        ctx.fillStyle = personHeadColor;
        ctx.beginPath();
        ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.restore();

        // Update counters and displays
        touristCount++;
        allTimeTouristCount++;
        updateClearButtonText();
        updateAllTimeStatsDisplay();
    }
    
    /**
     * The main game loop, continuously draws mannequins if drawing is active.
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
     * Starts the drawing interaction on mouse down or touch start.
     * @param {Event} event - The mouse or touch event.
     */
    function startDrawingInteraction(event) {
        // Ignore clicks on buttons
        if (event.target.closest('button')) return;
        if (event.target !== canvas) return;

        isDrawing = true;
        updateLastKnownPosition(event);
        drawMannequin(lastKnownX, lastKnownY); // Draw one immediately

        // Start the continuous drawing loop after a short delay
        clearTimeout(gameLoopTimeoutId);
        gameLoopTimeoutId = setTimeout(() => {
            if (isDrawing) gameLoop();
        }, HOLD_TO_START_LOOP_DELAY);

        // Add listeners to handle movement and release
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
        
        // Ensure the game loop is running
        if (gameLoopTimeoutId === null) {
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
        
        // Clean up event listeners
        window.removeEventListener('mousemove', handleDrawingMove);
        window.removeEventListener('touchmove', handleDrawingMove);
        window.removeEventListener('mouseup', stopDrawingInteraction);
        window.removeEventListener('touchend', stopDrawingInteraction);
        window.removeEventListener('touchcancel', stopDrawingInteraction);
        window.removeEventListener('mouseleave', stopDrawingInteraction);
    }

    /**
     * Resizes the canvas to fit the window and clears it.
     */
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Reset session stats on resize
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        touristCount = 0;
        allTimeTouristCount = 0;
        updateClearButtonText();
        updateAllTimeStatsDisplay();
    }

    /**
     * Takes a screenshot and initiates download or share.
     */
    async function takeScreenshot() {
        // Temporarily hide UI elements for a clean screenshot
        const wasMessageBoxHidden = messageBox.classList.contains('hidden');
        if (!wasMessageBoxHidden) messageBox.classList.add('hidden');
        
        clearButtonWrapper.style.display = 'none';
        screenshotButtonContainer.style.display = 'none';
        
        // Make stats text more visible on the screenshot
        allTimeStatsDisplay.style.backgroundColor = 'transparent';
        allTimeStatsDisplay.style.border = 'none';
        allTimeStatsDisplay.style.color = 'white';
        worldwideStatsDisplay.style.backgroundColor = 'transparent';
        worldwideStatsDisplay.style.border = 'none';
        worldwideStatsDisplay.style.color = 'white';

        await new Promise(resolve => setTimeout(resolve, 50)); // Wait for styles to apply

        try {
            const screenshotCanvas = await html2canvas(document.body, {
                useCORS: true,
                allowTaint: true,
            });

            const image = screenshotCanvas.toDataURL('image/png');
            const blob = await (await fetch(image)).blob();
            const file = new File([blob], 'overtourissimus_screenshot.png', { type: 'image/png' });

            // Use Web Share API if available (mobile), otherwise download
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
                link.click();
            }

        } catch (error) {
            if (error.name !== 'AbortError') { // Ignore user-cancelled share action
                console.error("Error creating or sharing screenshot:", error);
                showMessage("Screenshot could not be created.");
            }
        } finally {
            // Restore UI elements
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
     * Initializes the application, sets up event listeners, and performs initial data load.
     */
    function initialize() {
        if (!ctx) {
            console.error("Error: 2D context could not be retrieved from canvas.");
            showMessage("Error: Canvas is not supported.");
            return;
        }

        // --- Event Listeners Setup ---
        closeMessageBoxButton.addEventListener('click', () => messageBox.classList.add('hidden'));
        clearButton.addEventListener('click', clearCanvasAndSync);
        canvas.addEventListener('touchstart', startDrawingInteraction, { passive: false });
        canvas.addEventListener('mousedown', startDrawingInteraction);
        screenshotButton.addEventListener('click', takeScreenshot);
        window.addEventListener('resize', resizeCanvas);

        // --- Initial Load ---
        (async () => {
            resizeCanvas();
            const globalCount = await getCounterValue();
            worldwideStatsDisplay.textContent = `${globalCount.toLocaleString('de-DE')} touris removed globally`;
        })();
    }

    // Start the application
    initialize();
});
