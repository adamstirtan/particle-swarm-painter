/**
 * Main Application Logic
 */

class PSOImagePainter {
    constructor() {
        this.pso = null;
        this.sourceImage = null;
        this.isRunning = false;
        this.animationFrameId = null;
        this.maxCanvasSize = 400; // Maximum canvas dimension for performance
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateStatus('Ready - Upload an image to begin');
    }

    initializeElements() {
        // Canvas elements
        this.sourceCanvas = document.getElementById('sourceCanvas');
        this.reconstructionCanvas = document.getElementById('reconstructionCanvas');
        this.sourceCtx = this.sourceCanvas.getContext('2d');
        this.reconstructionCtx = this.reconstructionCanvas.getContext('2d');
        
        // Control elements
        this.imageUpload = document.getElementById('imageUpload');
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.resetButton = document.getElementById('resetButton');
        this.saveButton = document.getElementById('saveButton');
        
        // Parameter sliders
        this.numTrianglesSlider = document.getElementById('numTriangles');
        this.swarmSizeSlider = document.getElementById('swarmSize');
        this.inertiaSlider = document.getElementById('inertia');
        this.cognitiveSlider = document.getElementById('cognitive');
        this.socialSlider = document.getElementById('social');
        
        // Display elements
        this.iterationDisplay = document.getElementById('iteration');
        this.fitnessDisplay = document.getElementById('fitness');
        this.statusDisplay = document.getElementById('status');
    }

    attachEventListeners() {
        // Image upload
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Control buttons
        this.startButton.addEventListener('click', () => this.start());
        this.pauseButton.addEventListener('click', () => this.pause());
        this.resetButton.addEventListener('click', () => this.reset());
        this.saveButton.addEventListener('click', () => this.saveImage());
        
        // Parameter sliders
        this.numTrianglesSlider.addEventListener('input', (e) => {
            document.getElementById('numTrianglesValue').textContent = e.target.value;
        });
        
        this.swarmSizeSlider.addEventListener('input', (e) => {
            document.getElementById('swarmSizeValue').textContent = e.target.value;
        });
        
        this.inertiaSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('inertiaValue').textContent = value.toFixed(1);
            if (this.pso) {
                this.pso.updateConfig({ inertia: value });
            }
        });
        
        this.cognitiveSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('cognitiveValue').textContent = value.toFixed(1);
            if (this.pso) {
                this.pso.updateConfig({ cognitive: value });
            }
        });
        
        this.socialSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('socialValue').textContent = value.toFixed(1);
            if (this.pso) {
                this.pso.updateConfig({ social: value });
            }
        });
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.sourceImage = img;
                this.setupCanvases(img);
                this.initializePSO();
                this.updateStatus('Image loaded - Ready to start optimization');
                this.startButton.disabled = false;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    setupCanvases(img) {
        // Calculate scaled dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        const scale = Math.min(
            this.maxCanvasSize / width,
            this.maxCanvasSize / height,
            1 // Don't upscale
        );
        
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
        
        // Set canvas dimensions
        this.sourceCanvas.width = width;
        this.sourceCanvas.height = height;
        this.reconstructionCanvas.width = width;
        this.reconstructionCanvas.height = height;
        
        // Draw source image
        this.sourceCtx.drawImage(img, 0, 0, width, height);
        
        // Clear reconstruction canvas
        this.reconstructionCtx.fillStyle = 'white';
        this.reconstructionCtx.fillRect(0, 0, width, height);
    }

    initializePSO() {
        const config = {
            numTriangles: parseInt(this.numTrianglesSlider.value),
            swarmSize: parseInt(this.swarmSizeSlider.value),
            inertia: parseFloat(this.inertiaSlider.value),
            cognitive: parseFloat(this.cognitiveSlider.value),
            social: parseFloat(this.socialSlider.value),
            width: this.sourceCanvas.width,
            height: this.sourceCanvas.height
        };
        
        this.pso = new PSO(config);
        
        // Set source image data for fitness calculation
        const imageData = this.sourceCtx.getImageData(
            0, 0, 
            this.sourceCanvas.width, 
            this.sourceCanvas.height
        );
        this.pso.setSourceImage(imageData);
        
        this.updateDisplay();
    }

    start() {
        if (!this.pso) {
            alert('Please upload an image first!');
            return;
        }
        
        this.isRunning = true;
        this.startButton.disabled = true;
        this.pauseButton.disabled = false;
        this.updateStatus('Optimizing...');
        
        this.runOptimization();
    }

    pause() {
        this.isRunning = false;
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.updateStatus('Paused');
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    reset() {
        this.pause();
        
        if (this.pso) {
            this.pso.reset();
            this.updateDisplay();
            
            // Clear reconstruction canvas
            this.reconstructionCtx.fillStyle = 'white';
            this.reconstructionCtx.fillRect(
                0, 0, 
                this.reconstructionCanvas.width, 
                this.reconstructionCanvas.height
            );
        }
        
        this.updateStatus('Reset - Ready to start');
    }

    runOptimization() {
        if (!this.isRunning) return;
        
        // Perform PSO step
        this.pso.step();
        
        // Update display
        this.updateDisplay();
        this.renderBestSolution();
        
        // Continue optimization
        this.animationFrameId = requestAnimationFrame(() => this.runOptimization());
    }

    renderBestSolution() {
        const bestTriangles = this.pso.getBestTriangles();
        if (!bestTriangles) return;
        
        const ctx = this.reconstructionCtx;
        const width = this.reconstructionCanvas.width;
        const height = this.reconstructionCanvas.height;
        
        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw all triangles
        bestTriangles.forEach(t => {
            ctx.beginPath();
            ctx.moveTo(t.x1, t.y1);
            ctx.lineTo(t.x2, t.y2);
            ctx.lineTo(t.x3, t.y3);
            ctx.closePath();
            ctx.fillStyle = `rgba(${Math.floor(t.r)}, ${Math.floor(t.g)}, ${Math.floor(t.b)}, ${t.a})`;
            ctx.fill();
        });
    }

    updateDisplay() {
        if (!this.pso) return;
        
        this.iterationDisplay.textContent = this.pso.getIteration();
        
        const fitness = this.pso.getBestFitness();
        if (fitness !== Infinity) {
            this.fitnessDisplay.textContent = fitness.toFixed(2);
        } else {
            this.fitnessDisplay.textContent = 'N/A';
        }
    }

    updateStatus(message) {
        this.statusDisplay.textContent = message;
    }

    saveImage() {
        if (!this.pso || !this.pso.getBestTriangles()) {
            alert('No reconstruction available to save!');
            return;
        }
        
        // Create a download link
        const link = document.createElement('a');
        link.download = 'pso-reconstruction.png';
        link.href = this.reconstructionCanvas.toDataURL('image/png');
        link.click();
        
        this.updateStatus('Image saved!');
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PSOImagePainter();
});
