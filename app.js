/**
 * Main Application Logic
 */

// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const sourceCanvas = document.getElementById('sourceCanvas');
const reconstructionCanvas = document.getElementById('reconstructionCanvas');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn');

// Parameter inputs
const numTrianglesInput = document.getElementById('numTriangles');
const swarmSizeInput = document.getElementById('swarmSize');
const inertiaInput = document.getElementById('inertia');
const cognitiveInput = document.getElementById('cognitive');
const socialInput = document.getElementById('social');

// Value displays
const numTrianglesValue = document.getElementById('numTrianglesValue');
const swarmSizeValue = document.getElementById('swarmSizeValue');
const inertiaValue = document.getElementById('inertiaValue');
const cognitiveValue = document.getElementById('cognitiveValue');
const socialValue = document.getElementById('socialValue');

// Progress displays
const iterationDisplay = document.getElementById('iteration');
const bestFitnessDisplay = document.getElementById('bestFitness');
const statusDisplay = document.getElementById('status');

// Application state
let swarm = null;
let isRunning = false;
let animationFrameId = null;
let sourceImage = null;
let lastFrameTime = 0;

// Constants
const MAX_CANVAS_SIZE = 400;
const FRAME_INTERVAL = 50; // Milliseconds between frames (~20 FPS for smoother performance)

/**
 * Initialize event listeners
 */
function init() {
    // Image upload
    imageUpload.addEventListener('change', handleImageUpload);
    
    // Control buttons
    startBtn.addEventListener('click', startOptimization);
    pauseBtn.addEventListener('click', pauseOptimization);
    resetBtn.addEventListener('click', resetOptimization);
    saveBtn.addEventListener('click', saveImage);
    
    // Parameter updates
    numTrianglesInput.addEventListener('input', (e) => {
        numTrianglesValue.textContent = e.target.value;
    });
    
    swarmSizeInput.addEventListener('input', (e) => {
        swarmSizeValue.textContent = e.target.value;
    });
    
    inertiaInput.addEventListener('input', (e) => {
        inertiaValue.textContent = e.target.value;
        if (swarm) {
            swarm.setParameters(
                parseFloat(inertiaInput.value),
                parseFloat(cognitiveInput.value),
                parseFloat(socialInput.value)
            );
        }
    });
    
    cognitiveInput.addEventListener('input', (e) => {
        cognitiveValue.textContent = e.target.value;
        if (swarm) {
            swarm.setParameters(
                parseFloat(inertiaInput.value),
                parseFloat(cognitiveInput.value),
                parseFloat(socialInput.value)
            );
        }
    });
    
    socialInput.addEventListener('input', (e) => {
        socialValue.textContent = e.target.value;
        if (swarm) {
            swarm.setParameters(
                parseFloat(inertiaInput.value),
                parseFloat(cognitiveInput.value),
                parseFloat(socialInput.value)
            );
        }
    });
}

/**
 * Handle image upload
 */
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            sourceImage = img;
            setupCanvases(img);
            statusDisplay.textContent = 'Image loaded. Click Start to begin optimization.';
            startBtn.disabled = false;
            resetBtn.disabled = false;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Setup canvases with loaded image
 */
function setupCanvases(img) {
    // Calculate scaled dimensions
    let width = img.width;
    let height = img.height;
    
    // Scale down if too large
    if (width > MAX_CANVAS_SIZE || height > MAX_CANVAS_SIZE) {
        const scale = Math.min(MAX_CANVAS_SIZE / width, MAX_CANVAS_SIZE / height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
    }
    
    // Set up source canvas
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    const sourceCtx = sourceCanvas.getContext('2d');
    sourceCtx.drawImage(img, 0, 0, width, height);
    
    // Set up reconstruction canvas
    reconstructionCanvas.width = width;
    reconstructionCanvas.height = height;
    const reconstructionCtx = reconstructionCanvas.getContext('2d');
    reconstructionCtx.fillStyle = 'white';
    reconstructionCtx.fillRect(0, 0, width, height);
    
    // Reset swarm
    swarm = null;
    iterationDisplay.textContent = '0';
    bestFitnessDisplay.textContent = 'N/A';
}

/**
 * Start the optimization process
 */
function startOptimization() {
    if (!sourceImage) return;
    
    // Create new swarm if needed
    if (!swarm) {
        const numTriangles = parseInt(numTrianglesInput.value);
        const swarmSize = parseInt(swarmSizeInput.value);
        
        statusDisplay.textContent = 'Initializing swarm...';
        
        // Use setTimeout to allow UI to update
        setTimeout(() => {
            swarm = new Swarm(swarmSize, numTriangles, sourceCanvas, reconstructionCanvas);
            swarm.setParameters(
                parseFloat(inertiaInput.value),
                parseFloat(cognitiveInput.value),
                parseFloat(socialInput.value)
            );
            
            statusDisplay.textContent = 'Optimizing...';
            isRunning = true;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            saveBtn.disabled = false;
            
            // Disable parameter changes during optimization
            numTrianglesInput.disabled = true;
            swarmSizeInput.disabled = true;
            
            lastFrameTime = Date.now();
            runOptimization();
        }, 100);
    } else {
        // Resume optimization
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        statusDisplay.textContent = 'Optimizing...';
        lastFrameTime = Date.now();
        runOptimization();
    }
}

/**
 * Main optimization loop
 */
function runOptimization() {
    if (!isRunning) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - lastFrameTime;
    
    // Throttle to avoid excessive computation
    if (elapsed >= FRAME_INTERVAL) {
        // Perform PSO iteration
        swarm.iterate();
        
        // Update display
        iterationDisplay.textContent = swarm.getIteration();
        bestFitnessDisplay.textContent = swarm.getBestFitness().toFixed(2);
        
        // Render best solution
        swarm.renderBest();
        
        lastFrameTime = currentTime;
    }
    
    // Continue loop
    animationFrameId = requestAnimationFrame(runOptimization);
}

/**
 * Pause the optimization
 */
function pauseOptimization() {
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    statusDisplay.textContent = 'Paused';
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Reset the optimization
 */
function resetOptimization() {
    // Stop if running
    if (isRunning) {
        pauseOptimization();
    }
    
    // Reset swarm
    swarm = null;
    
    // Clear reconstruction canvas
    const ctx = reconstructionCanvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, reconstructionCanvas.width, reconstructionCanvas.height);
    
    // Reset displays
    iterationDisplay.textContent = '0';
    bestFitnessDisplay.textContent = 'N/A';
    statusDisplay.textContent = 'Reset. Click Start to begin optimization.';
    
    // Re-enable parameter inputs
    numTrianglesInput.disabled = false;
    swarmSizeInput.disabled = false;
    
    // Update button states
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    saveBtn.disabled = false;
}

/**
 * Save the reconstructed image
 */
function saveImage() {
    if (!reconstructionCanvas) return;
    
    reconstructionCanvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'pso-reconstruction.png';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    });
}

// Initialize the application
init();
