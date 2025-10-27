class Triangle {
  constructor(width, height, maxAlpha = 1) {
    // Initialize triangle with random vertices and color
    this.x1 = Math.random() * width;
    this.y1 = Math.random() * height;
    this.x2 = Math.random() * width;
    this.y2 = Math.random() * height;
    this.x3 = Math.random() * width;
    this.y3 = Math.random() * height;
    this.r = Math.random() * 255;
    this.g = Math.random() * 255;
    this.b = Math.random() * 255;
    const maxA = Math.max(0.1, Math.min(1, maxAlpha));
    // Alpha initialized between 0.1 and maxAlpha
    this.a = 0.1 + Math.random() * (maxA - 0.1);
  }

  toArray() {
    return [
      this.x1,
      this.y1,
      this.x2,
      this.y2,
      this.x3,
      this.y3,
      this.r,
      this.g,
      this.b,
      this.a,
    ];
  }

  fromArray(arr) {
    [
      this.x1,
      this.y1,
      this.x2,
      this.y2,
      this.x3,
      this.y3,
      this.r,
      this.g,
      this.b,
      this.a,
    ] = arr;
  }

  clone() {
    const t = new Triangle(0, 0);
    t.fromArray(this.toArray());
    return t;
  }
}

class Particle {
  constructor(numTriangles, width, height, margin = 0, maxAlpha = 1) {
    this.width = width;
    this.height = height;
    this.numTriangles = numTriangles;
    this.margin = margin;
    this.maxAlpha = Math.max(0.1, Math.min(1, maxAlpha));

    // Current position (triangles)
    this.triangles = [];
    for (let i = 0; i < numTriangles; i++) {
      this.triangles.push(new Triangle(width, height, this.maxAlpha));
    }

    // Velocity for each parameter of each triangle
    this.velocity = [];
    for (let i = 0; i < numTriangles * 10; i++) {
      this.velocity.push((Math.random() - 0.5) * 10);
    }

    // Personal best
    this.bestTriangles = this.triangles.map((t) => t.clone());
    this.bestFitness = Infinity;

    // Current fitness
    this.fitness = Infinity;
  }

  getPosition() {
    const pos = [];
    this.triangles.forEach((t) => {
      pos.push(...t.toArray());
    });
    return pos;
  }

  setPosition(pos) {
    for (let i = 0; i < this.numTriangles; i++) {
      const offset = i * 10;
      this.triangles[i].fromArray(pos.slice(offset, offset + 10));
    }
  }

  updatePersonalBest() {
    if (this.fitness < this.bestFitness) {
      this.bestFitness = this.fitness;
      this.bestTriangles = this.triangles.map((t) => t.clone());
    }
  }

  clampPosition() {
    this.triangles.forEach((t) => {
      // Clamp vertices to canvas bounds
      const minX = -this.margin;
      const maxX = this.width + this.margin;
      const minY = -this.margin;
      const maxY = this.height + this.margin;

      t.x1 = Math.max(minX, Math.min(maxX, t.x1));
      t.y1 = Math.max(minY, Math.min(maxY, t.y1));
      t.x2 = Math.max(minX, Math.min(maxX, t.x2));
      t.y2 = Math.max(minY, Math.min(maxY, t.y2));
      t.x3 = Math.max(minX, Math.min(maxX, t.x3));
      t.y3 = Math.max(minY, Math.min(maxY, t.y3));

      // Clamp colors
      t.r = Math.max(0, Math.min(255, t.r));
      t.g = Math.max(0, Math.min(255, t.g));
      t.b = Math.max(0, Math.min(255, t.b));
      t.a = Math.max(0.1, Math.min(this.maxAlpha, t.a));
    });
  }
}

class PSO {
  constructor(config) {
    this.config = {
      // Use explicit checks so 0 values are respected and not replaced by defaults
      numTriangles:
        typeof config.numTriangles === "number" ? config.numTriangles : 50,
      swarmSize: typeof config.swarmSize === "number" ? config.swarmSize : 20,
      inertia: typeof config.inertia === "number" ? config.inertia : 0.7,
      cognitive: typeof config.cognitive === "number" ? config.cognitive : 1.5,
      social: typeof config.social === "number" ? config.social : 1.5,
      width: config.width,
      height: config.height,
      maxAlpha: typeof config.maxAlpha === "number" ? config.maxAlpha : 0.8,
      // Incremental triangle growth
      incrementalTriangles:
        typeof config.incrementalTriangles === "boolean"
          ? config.incrementalTriangles
          : false,
      trianglesIncrementInterval:
        typeof config.trianglesIncrementInterval === "number"
          ? config.trianglesIncrementInterval
          : 100,
      trianglesIncrementAmount:
        typeof config.trianglesIncrementAmount === "number"
          ? config.trianglesIncrementAmount
          : 10,
      triangleStagnationThreshold:
        typeof config.triangleStagnationThreshold === "number"
          ? config.triangleStagnationThreshold
          : 25,
      triangleStagnationPercent:
        typeof config.triangleStagnationPercent === "number"
          ? config.triangleStagnationPercent
          : 2.0,
      maxTrianglesCap:
        typeof config.maxTrianglesCap === "number"
          ? config.maxTrianglesCap
          : 1000,
      // Anti-stagnation defaults
      stagnationWindow:
        typeof config.stagnationWindow === "number"
          ? config.stagnationWindow
          : 150, // iterations with no improvement before a kick
      reseedFraction:
        typeof config.reseedFraction === "number" ? config.reseedFraction : 0.2, // fraction of worst particles to reseed on kick
      velocityResetOnKick:
        typeof config.velocityResetOnKick === "boolean"
          ? config.velocityResetOnKick
          : true,
      offscreenMargin:
        typeof config.offscreenMargin === "number"
          ? config.offscreenMargin
          : 50,
    };

    this.particles = [];
    this.globalBestTriangles = null;
    this.globalBestFitness = Infinity;
    this.iteration = 0;
    this.noImproveIterations = 0;
    this.stagnationWindowStartIteration = 0;
    this.stagnationWindowStartBest = Infinity;
    this.lastGrowthIteration = null;
    this.lastGrowthAmount = 0;
    this.lastGrowthDetails = null; // {relImprovement, minRequired}

    // Source image data
    this.sourceImageData = null;

    // Canvas for rendering particles
    this.renderCanvas = document.createElement("canvas");
    this.renderCanvas.width = this.config.width;
    this.renderCanvas.height = this.config.height;
    this.renderCtx = this.renderCanvas.getContext("2d");

    this.initializeSwarm();
  }

  initializeSwarm() {
    this.particles = [];
    for (let i = 0; i < this.config.swarmSize; i++) {
      this.particles.push(
        new Particle(
          this.config.numTriangles,
          this.config.width,
          this.config.height,
          this.config.offscreenMargin,
          this.config.maxAlpha
        )
      );
    }
  }

  setSourceImage(imageData) {
    this.sourceImageData = imageData;
  }

  renderTriangles(triangles) {
    const ctx = this.renderCtx;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    triangles.forEach((t) => {
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

    return ctx.getImageData(0, 0, this.config.width, this.config.height);
  }

  calculateFitness(particle) {
    const renderedData = this.renderTriangles(particle.triangles);
    const sourceData = this.sourceImageData.data;
    const renderedPixels = renderedData.data;

    let sumSquaredError = 0;
    const numPixels = this.config.width * this.config.height;

    // Compare RGB values (skip alpha channel at index 3)
    for (let i = 0; i < sourceData.length; i += 4) {
      const rDiff = sourceData[i] - renderedPixels[i];
      const gDiff = sourceData[i + 1] - renderedPixels[i + 1];
      const bDiff = sourceData[i + 2] - renderedPixels[i + 2];

      sumSquaredError += rDiff * rDiff + gDiff * gDiff + bDiff * bDiff;
    }

    return sumSquaredError / numPixels;
  }

  updateVelocityAndPosition(particle) {
    const position = particle.getPosition();
    const personalBestPos = [];
    particle.bestTriangles.forEach((t) => {
      personalBestPos.push(...t.toArray());
    });

    const globalBestPos = [];
    this.globalBestTriangles.forEach((t) => {
      globalBestPos.push(...t.toArray());
    });

    // Update velocity and position for each dimension
    for (let i = 0; i < position.length; i++) {
      const r1 = Math.random();
      const r2 = Math.random();

      // PSO velocity update formula
      particle.velocity[i] =
        this.config.inertia * particle.velocity[i] +
        this.config.cognitive * r1 * (personalBestPos[i] - position[i]) +
        this.config.social * r2 * (globalBestPos[i] - position[i]);

      // Update position
      position[i] += particle.velocity[i];
    }

    particle.setPosition(position);
    particle.clampPosition();
  }

  step() {
    // Evaluate fitness for all particles
    let improved = false;
    this.particles.forEach((particle) => {
      particle.fitness = this.calculateFitness(particle);
      particle.updatePersonalBest();

      // Update global best
      if (particle.fitness < this.globalBestFitness) {
        this.globalBestFitness = particle.fitness;
        this.globalBestTriangles = particle.triangles.map((t) => t.clone());
        improved = true;
      }
    });

    // Update velocities and positions
    this.particles.forEach((particle) => {
      this.updateVelocityAndPosition(particle);
    });

    this.iteration++;

    // Track stagnation and apply mitigation
    if (improved) {
      this.noImproveIterations = 0;
    } else {
      this.noImproveIterations++;
      if (this.noImproveIterations >= this.config.stagnationWindow) {
        this.kickSwarm();
        this.noImproveIterations = 0;
      }
    }

    // Initialize window baseline on first finite best
    if (
      this.config.incrementalTriangles &&
      isFinite(this.globalBestFitness) &&
      !isFinite(this.stagnationWindowStartBest)
    ) {
      this.stagnationWindowStartBest = this.globalBestFitness;
      this.stagnationWindowStartIteration = this.iteration;
    }

    // Stagnation-based triangle growth based on percent improvement over a window
    if (
      this.config.incrementalTriangles &&
      isFinite(this.stagnationWindowStartBest)
    ) {
      const windowLen = this.iteration - this.stagnationWindowStartIteration;
      if (windowLen >= this.config.triangleStagnationThreshold) {
        const startBest = this.stagnationWindowStartBest;
        const currentBest = this.globalBestFitness;
        if (startBest > 0 && isFinite(currentBest)) {
          const relImprovement = (startBest - currentBest) / startBest;
          const minRequired = Math.max(
            0,
            this.config.triangleStagnationPercent / 100
          );
          if (relImprovement < minRequired) {
            const currentCount = this.config.numTriangles;
            if (currentCount < this.config.maxTrianglesCap) {
              const remaining = this.config.maxTrianglesCap - currentCount;
              const inc = Math.max(
                1,
                Math.min(
                  remaining,
                  Math.floor(this.config.trianglesIncrementAmount)
                )
              );
              this.increaseTrianglesBy(inc);
              this.config.numTriangles = currentCount + inc;
              this.lastGrowthIteration = this.iteration;
              this.lastGrowthAmount = inc;
              this.lastGrowthDetails = {
                relImprovement,
                minRequired,
              };
            }
          }
        }
        // Reset window baseline after evaluation
        this.stagnationWindowStartBest = this.globalBestFitness;
        this.stagnationWindowStartIteration = this.iteration;
        this.noImproveIterations = 0;
      }
    }
  }

  getBestTriangles() {
    return this.globalBestTriangles;
  }

  getBestFitness() {
    return this.globalBestFitness;
  }

  getIteration() {
    return this.iteration;
  }

  reset() {
    this.iteration = 0;
    this.globalBestFitness = Infinity;
    this.globalBestTriangles = null;
    this.initializeSwarm();
  }

  updateConfig(config) {
    if (config && typeof config === "object") {
      if (typeof config.inertia === "number") {
        this.config.inertia = config.inertia;
      }
      if (typeof config.cognitive === "number") {
        this.config.cognitive = config.cognitive;
      }
      if (typeof config.social === "number") {
        this.config.social = config.social;
      }
      if (typeof config.maxAlpha === "number") {
        // Clamp to [0.1, 1]
        this.config.maxAlpha = Math.max(0.1, Math.min(1, config.maxAlpha));
        // Propagate to existing particles and clamp their positions
        this.particles.forEach((p) => {
          p.maxAlpha = this.config.maxAlpha;
          p.clampPosition();
        });
      }
      if (typeof config.incrementalTriangles === "boolean") {
        this.config.incrementalTriangles = config.incrementalTriangles;
      }
      if (typeof config.trianglesIncrementInterval === "number") {
        this.config.trianglesIncrementInterval = Math.max(
          1,
          Math.floor(config.trianglesIncrementInterval)
        );
      }
      if (typeof config.trianglesIncrementAmount === "number") {
        this.config.trianglesIncrementAmount = Math.max(
          1,
          Math.floor(config.trianglesIncrementAmount)
        );
      }
      if (typeof config.triangleStagnationThreshold === "number") {
        this.config.triangleStagnationThreshold = Math.max(
          1,
          Math.floor(config.triangleStagnationThreshold)
        );
      }
      if (typeof config.triangleStagnationPercent === "number") {
        this.config.triangleStagnationPercent = Math.max(
          0,
          Math.min(100, config.triangleStagnationPercent)
        );
      }
      if (typeof config.maxTrianglesCap === "number") {
        this.config.maxTrianglesCap = Math.max(
          1,
          Math.floor(config.maxTrianglesCap)
        );
      }
      if (typeof config.stagnationWindow === "number") {
        this.config.stagnationWindow = config.stagnationWindow;
      }
      if (typeof config.reseedFraction === "number") {
        this.config.reseedFraction = config.reseedFraction;
      }
      if (typeof config.velocityResetOnKick === "boolean") {
        this.config.velocityResetOnKick = config.velocityResetOnKick;
      }
      if (typeof config.offscreenMargin === "number") {
        this.config.offscreenMargin = config.offscreenMargin;
        // Propagate to existing particles
        this.particles.forEach((p) => (p.margin = this.config.offscreenMargin));
      }
    }
  }

  // Add k triangles to all particles and extend global best
  increaseTrianglesBy(k) {
    try {
      // Extend each particle
      this.particles.forEach((p) => {
        for (let i = 0; i < k; i++) {
          const nt = new Triangle(p.width, p.height, p.maxAlpha);
          p.triangles.push(nt);
          p.numTriangles += 1;
          // Extend velocity with 10 new components
          for (let v = 0; v < 10; v++) {
            p.velocity.push((Math.random() - 0.5) * 10);
          }
          // Extend personal best with a clone of the new triangle
          p.bestTriangles.push(nt.clone());
        }
        // Allow re-discovery of best in the new space for this particle
        p.bestFitness = Infinity;
        p.fitness = Infinity;
      });

      // Extend global best representation and reset fitness so it can be re-established
      if (!this.globalBestTriangles) {
        // Initialize from first particle if needed
        this.globalBestTriangles = this.particles[0].triangles.map((t) =>
          t.clone()
        );
      } else {
        for (let i = 0; i < k; i++) {
          const nt = new Triangle(
            this.config.width,
            this.config.height,
            this.config.maxAlpha
          );
          this.globalBestTriangles.push(nt);
        }
      }
      this.globalBestFitness = Infinity;
    } catch (e) {
      // Fail-safe: ignore errors
    }
  }

  // Reseed worst fraction of particles and optionally reset velocities
  kickSwarm() {
    try {
      const k = Math.max(
        1,
        Math.floor(this.config.swarmSize * this.config.reseedFraction)
      );

      // Sort indices of particles by fitness descending (worst first)
      const indices = this.particles
        .map((p, idx) => ({ idx, fitness: p.fitness }))
        .sort((a, b) => b.fitness - a.fitness)
        .map((x) => x.idx);

      for (let i = 0; i < k; i++) {
        const p = this.particles[indices[i]];
        // Reinitialize triangles
        p.triangles = [];
        for (let t = 0; t < p.numTriangles; t++) {
          p.triangles.push(new Triangle(p.width, p.height, p.maxAlpha));
        }
        // Reset velocities
        p.velocity = [];
        for (let v = 0; v < p.numTriangles * 10; v++) {
          p.velocity.push((Math.random() - 0.5) * 10);
        }
        // Reset fitness tracking
        p.fitness = Infinity;
        p.bestFitness = Infinity;
        p.bestTriangles = p.triangles.map((t) => t.clone());
      }

      if (this.config.velocityResetOnKick) {
        // Give everyone a fresh velocity nudge
        this.particles.forEach((p) => {
          for (let v = 0; v < p.velocity.length; v++) {
            p.velocity[v] = (Math.random() - 0.5) * 10;
          }
        });
      }

      // Keep current globalBest as an anchor; particles will start exploring again
      // Optional: console log to aid debugging
      // console.log('Stagnation detected. Swarm kick applied.');
    } catch (e) {
      // Fail-safe: do nothing on error to avoid breaking the loop
      // console.warn('kickSwarm error', e);
    }
  }
}
