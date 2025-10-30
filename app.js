/**
 * Particle Swarm Optimization for Image Reconstruction
 * Each particle represents a set of triangles that approximate an image
 */

class PSOImagePainter {
  constructor() {
    this.pso = null;
    this.sourceImage = null;
    this.isRunning = false;
    this.animationFrameId = null;
    this.maxCanvasSize = 400; // Maximum canvas dimension for performance
    this.lastTrianglesSynced = null; // Track last PSO triangle count reflected in the UI

    // Fitness chart state
    this.fitnessHistory = [];
    this.fitnessChart = null;
    this.lastChartedIteration = -1;

    this.initializeElements();
    this.attachEventListeners();
    this.initializeChart();
    this.updateStatus("Ready - Upload an image to begin");

    // Only update displayed image when we beat the best-so-far fitness
    this.displayedBestFitness = Infinity;
    this.displayedBestTriangles = null;
  }

  initializeElements() {
    // Canvas elements
    this.sourceCanvas = document.getElementById("sourceCanvas");
    this.reconstructionCanvas = document.getElementById("reconstructionCanvas");
    this.sourceCtx = this.sourceCanvas.getContext("2d");
    this.reconstructionCtx = this.reconstructionCanvas.getContext("2d");

    // Control elements
    this.imageUpload = document.getElementById("imageUpload");
    this.startButton = document.getElementById("startButton");
    this.pauseButton = document.getElementById("pauseButton");
    this.resetButton = document.getElementById("resetButton");
    this.saveButton = document.getElementById("saveButton");

    // Parameter sliders
    this.numTrianglesSlider = document.getElementById("numTriangles");
    this.swarmSizeSlider = document.getElementById("swarmSize");
    this.inertiaSlider = document.getElementById("inertia");
    this.cognitiveSlider = document.getElementById("cognitive");
    this.socialSlider = document.getElementById("social");
    this.maxAlphaSlider = document.getElementById("maxAlpha");
    this.incrementalTrianglesCheckbox =
      document.getElementById("incrementTriangles");
    this.triangleStagnationThresholdSlider = document.getElementById(
      "triangleStagnationThreshold"
    );
    this.triangleStagnationPercentSlider = document.getElementById(
      "triangleStagnationPercent"
    );

    // Display elements
    this.iterationDisplay = document.getElementById("iteration");
    this.fitnessDisplay = document.getElementById("fitness");
    this.statusDisplay = document.getElementById("status");

    // Chart elements
    this.fitnessChartCanvas = document.getElementById("fitnessChart");
  }

  attachEventListeners() {
    // Image upload
    this.imageUpload.addEventListener("change", (e) =>
      this.handleImageUpload(e)
    );

    // Control buttons
    this.startButton.addEventListener("click", () => this.start());
    this.pauseButton.addEventListener("click", () => this.pause());
    this.resetButton.addEventListener("click", () => this.reset());
    this.saveButton.addEventListener("click", () => this.saveImage());

    // Parameter sliders
    this.numTrianglesSlider.addEventListener("input", (e) => {
      document.getElementById("numTrianglesValue").textContent = e.target.value;
    });

    this.swarmSizeSlider.addEventListener("input", (e) => {
      document.getElementById("swarmSizeValue").textContent = e.target.value;
    });

    this.inertiaSlider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById("inertiaValue").textContent = value.toFixed(1);
      if (this.pso) {
        this.pso.updateConfig({ inertia: value });
      }
    });

    this.cognitiveSlider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById("cognitiveValue").textContent = value.toFixed(1);
      if (this.pso) {
        this.pso.updateConfig({ cognitive: value });
      }
    });

    this.socialSlider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById("socialValue").textContent = value.toFixed(1);
      if (this.pso) {
        this.pso.updateConfig({ social: value });
      }
    });

    this.maxAlphaSlider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById("maxAlphaValue").textContent = value.toFixed(2);
      if (this.pso) {
        this.pso.updateConfig({ maxAlpha: value });
      }
    });
    this.incrementalTrianglesCheckbox.addEventListener("change", (e) => {
      if (this.pso) {
        this.pso.updateConfig({ incrementalTriangles: e.target.checked });
      }
    });
    this.triangleStagnationThresholdSlider.addEventListener("input", (e) => {
      const value = parseInt(e.target.value, 10);
      document.getElementById("triangleStagnationThresholdValue").textContent =
        String(value);
      if (this.pso) {
        this.pso.updateConfig({ triangleStagnationThreshold: value });
      }
    });
    this.triangleStagnationPercentSlider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById("triangleStagnationPercentValue").textContent =
        value.toFixed(1);
      if (this.pso) {
        this.pso.updateConfig({ triangleStagnationPercent: value });
      }
    });
  }

  initializeChart() {
    try {
      if (!this.fitnessChartCanvas || typeof Chart === "undefined") return;
      const ctx = this.fitnessChartCanvas.getContext("2d");
      this.fitnessChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Best Fitness",
              data: [],
              borderColor: "#5cf2c7",
              backgroundColor: "rgba(92, 242, 199, 0.15)",
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.15,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { color: "rgba(231, 237, 246, 0.06)" },
              ticks: { color: "#a7b1c2" },
            },
            y: {
              grid: { color: "rgba(231, 237, 246, 0.06)" },
              ticks: { color: "#a7b1c2" },
            },
          },
          animation: false,
          plugins: {
            legend: { labels: { color: "#e7edf6" } },
            tooltip: { mode: "index", intersect: false },
          },
        },
      });
    } catch (e) {
      // Fail safe: no chart
      this.fitnessChart = null;
    }
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
        this.updateStatus("Image loaded - Ready to start optimization");
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
    this.reconstructionCtx.fillStyle = "white";
    this.reconstructionCtx.fillRect(0, 0, width, height);
  }

  initializePSO() {
    const config = {
      numTriangles: parseInt(this.numTrianglesSlider.value),
      swarmSize: parseInt(this.swarmSizeSlider.value),
      inertia: parseFloat(this.inertiaSlider.value),
      cognitive: parseFloat(this.cognitiveSlider.value),
      social: parseFloat(this.socialSlider.value),
      maxAlpha: parseFloat(this.maxAlphaSlider.value),
      incrementalTriangles: this.incrementalTrianglesCheckbox.checked,
      triangleStagnationThreshold: parseInt(
        this.triangleStagnationThresholdSlider.value,
        10
      ),
      triangleStagnationPercent: parseFloat(
        this.triangleStagnationPercentSlider.value
      ),
      width: this.sourceCanvas.width,
      height: this.sourceCanvas.height,
    };

    this.pso = new PSO(config);
    // Remember the current triangles count so we only sync UI when PSO changes it
    this.lastTrianglesSynced = this.pso.config.numTriangles;

    // Set source image data for fitness calculation
    const imageData = this.sourceCtx.getImageData(
      0,
      0,
      this.sourceCanvas.width,
      this.sourceCanvas.height
    );
    this.pso.setSourceImage(imageData);

    this.updateDisplay();
  }

  start() {
    if (!this.pso) {
      alert("Please upload an image first!");
      return;
    }

    // Ensure PSO reflects current slider values before starting
    const desiredTriangles = parseInt(this.numTrianglesSlider.value, 10);
    const desiredSwarm = parseInt(this.swarmSizeSlider.value, 10);
    if (
      !this.pso ||
      this.pso.config.numTriangles !== desiredTriangles ||
      this.pso.config.swarmSize !== desiredSwarm
    ) {
      this.initializePSO();
    }

    this.isRunning = true;
    this.startButton.disabled = true;
    this.pauseButton.disabled = false;
    this.updateStatus("Optimizing...");

    this.runOptimization();
  }

  pause() {
    this.isRunning = false;
    this.startButton.disabled = false;
    this.pauseButton.disabled = true;
    this.updateStatus("Paused");

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
      this.reconstructionCtx.fillStyle = "white";
      this.reconstructionCtx.fillRect(
        0,
        0,
        this.reconstructionCanvas.width,
        this.reconstructionCanvas.height
      );
    }

    // Reset displayed best tracking
    this.displayedBestFitness = Infinity;
    this.displayedBestTriangles = null;

    this.updateStatus("Reset - Ready to start");

    // Reset chart
    this.fitnessHistory = [];
    this.lastChartedIteration = -1;
    if (this.fitnessChart) {
      this.fitnessChart.data.labels = [];
      this.fitnessChart.data.datasets[0].data = [];
      this.fitnessChart.update("none");
    }
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
    // Only draw the best-so-far triangles we've approved for display
    const bestTriangles = this.displayedBestTriangles;
    if (!bestTriangles) return;

    const ctx = this.reconstructionCtx;
    const width = this.reconstructionCanvas.width;
    const height = this.reconstructionCanvas.height;

    // Clear canvas with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // Draw all triangles
    bestTriangles.forEach((t) => {
      ctx.beginPath();
      ctx.moveTo(t.x1, t.y1);
      ctx.lineTo(t.x2, t.y2);
      ctx.lineTo(t.x3, t.y3);
      ctx.closePath();
      ctx.fillStyle = `rgba(${Math.floor(t.r)}, ${Math.floor(
        t.g
      )}, ${Math.floor(t.b)}, ${t.a})`;
      ctx.fill();
    });
  }

  updateDisplay() {
    if (!this.pso) return;

    this.iterationDisplay.textContent = this.pso.getIteration();

    // Reflect dynamic triangle count increases in the UI slider/label
    // Only sync when the PSO's count actually changes (e.g., due to increments)
    const currentTriangles = this.pso.config?.numTriangles;
    if (
      typeof currentTriangles === "number" &&
      currentTriangles !== this.lastTrianglesSynced
    ) {
      this.numTrianglesSlider.value = String(currentTriangles);
      const labelEl = document.getElementById("numTrianglesValue");
      if (labelEl) labelEl.textContent = String(currentTriangles);
      this.lastTrianglesSynced = currentTriangles;
    }

    const fitness = this.pso.getBestFitness();
    if (fitness !== Infinity) {
      this.fitnessDisplay.textContent = fitness.toFixed(2);

      // Update displayed best image only if we beat all-time best
      if (fitness < this.displayedBestFitness && this.pso.getBestTriangles()) {
        const src = this.pso.getBestTriangles();
        // Deep copy triangles to avoid later mutation
        this.displayedBestTriangles = src.map((t) => t.clone());
        this.displayedBestFitness = fitness;
      }
      // Update chart once per iteration
      const iter = this.pso.getIteration();
      if (
        this.fitnessChart &&
        iter !== this.lastChartedIteration &&
        isFinite(fitness)
      ) {
        this.fitnessHistory.push({ x: iter, y: fitness });
        // Keep last N points to avoid unbounded growth
        const MAX_POINTS = 1000;
        if (this.fitnessHistory.length > MAX_POINTS) {
          this.fitnessHistory.splice(
            0,
            this.fitnessHistory.length - MAX_POINTS
          );
        }
        // Rebuild chart data from history
        this.fitnessChart.data.labels = this.fitnessHistory.map((p) => p.x);
        this.fitnessChart.data.datasets[0].data = this.fitnessHistory.map(
          (p) => p.y
        );
        this.fitnessChart.update("none");
        this.lastChartedIteration = iter;
      }
    } else {
      this.fitnessDisplay.textContent = "N/A";
    }

    // Optional status nudge when triangle growth occurs
    const lgIter = this.pso.lastGrowthIteration;
    if (typeof lgIter === "number" && lgIter === this.pso.getIteration()) {
      const det = this.pso.lastGrowthDetails || {};
      const relPct =
        det.relImprovement != null ? (det.relImprovement * 100).toFixed(2) : "";
      const reqPct =
        det.minRequired != null ? (det.minRequired * 100).toFixed(2) : "";
      this.updateStatus(
        `Triangles increased by +${this.pso.lastGrowthAmount} at iter ${lgIter} (Δ% ${relPct} < ${reqPct})`
      );
    }
  }

  updateStatus(message) {
    this.statusDisplay.textContent = message;
  }

  saveImage() {
    if (!this.pso || !this.pso.getBestTriangles()) {
      alert("No reconstruction available to save!");
      return;
    }

    // Create a download link
    const link = document.createElement("a");
    link.download = "pso-reconstruction.png";
    link.href = this.reconstructionCanvas.toDataURL("image/png");
    link.click();

    this.updateStatus("Image saved!");
  }
}

// Initialize the application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new PSOImagePainter();
});
