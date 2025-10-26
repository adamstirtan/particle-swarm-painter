/**
 * Particle class represents one solution in the swarm
 * Each particle has a position (set of triangles), velocity, and tracks its best position
 */
class Particle {
    /**
     * @param {number} numTriangles - Number of triangles in this particle's solution
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    constructor(numTriangles, width, height) {
        this.numTriangles = numTriangles;
        this.width = width;
        this.height = height;
        
        // Current position (array of triangles)
        this.position = [];
        for (let i = 0; i < numTriangles; i++) {
            this.position.push(new Triangle(width, height));
        }
        
        // Velocity for each gene of each triangle
        this.velocity = [];
        for (let i = 0; i < numTriangles; i++) {
            this.velocity.push(new Array(10).fill(0).map(() => (Math.random() - 0.5) * 0.1));
        }
        
        // Personal best
        this.bestPosition = this.position.map(t => t.clone());
        this.bestFitness = Infinity;
        
        // Current fitness
        this.fitness = Infinity;
    }

    /**
     * Update velocity and position based on PSO rules
     * @param {Array<Triangle>} globalBest - Global best position found by swarm
     * @param {number} w - Inertia weight
     * @param {number} c1 - Cognitive coefficient
     * @param {number} c2 - Social coefficient
     */
    update(globalBest, w, c1, c2) {
        for (let i = 0; i < this.numTriangles; i++) {
            for (let j = 0; j < 10; j++) {
                const r1 = Math.random();
                const r2 = Math.random();
                
                // PSO velocity update formula
                const cognitive = c1 * r1 * (this.bestPosition[i].genes[j] - this.position[i].genes[j]);
                const social = c2 * r2 * (globalBest[i].genes[j] - this.position[i].genes[j]);
                
                this.velocity[i][j] = w * this.velocity[i][j] + cognitive + social;
                
                // Limit velocity to prevent overshooting
                this.velocity[i][j] = Math.max(-0.1, Math.min(0.1, this.velocity[i][j]));
            }
            
            // Update position
            this.position[i].mutate(this.velocity[i]);
        }
    }

    /**
     * Render this particle's triangles to a canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, this.width, this.height);
        
        for (let triangle of this.position) {
            triangle.draw(ctx);
        }
    }

    /**
     * Update personal best if current fitness is better
     */
    updateBest() {
        if (this.fitness < this.bestFitness) {
            this.bestFitness = this.fitness;
            this.bestPosition = this.position.map(t => t.clone());
        }
    }
}

/**
 * Swarm class manages the PSO algorithm
 */
class Swarm {
    /**
     * @param {number} swarmSize - Number of particles
     * @param {number} numTriangles - Number of triangles per particle
     * @param {HTMLCanvasElement} sourceCanvas - Source image canvas
     * @param {HTMLCanvasElement} reconstructionCanvas - Reconstruction canvas
     */
    constructor(swarmSize, numTriangles, sourceCanvas, reconstructionCanvas) {
        this.swarmSize = swarmSize;
        this.numTriangles = numTriangles;
        this.sourceCanvas = sourceCanvas;
        this.reconstructionCanvas = reconstructionCanvas;
        
        this.width = sourceCanvas.width;
        this.height = sourceCanvas.height;
        
        // Initialize particles
        this.particles = [];
        for (let i = 0; i < swarmSize; i++) {
            this.particles.push(new Particle(numTriangles, this.width, this.height));
        }
        
        // Global best
        this.globalBest = null;
        this.globalBestFitness = Infinity;
        
        // PSO parameters
        this.w = 0.7;  // Inertia
        this.c1 = 1.5; // Cognitive coefficient
        this.c2 = 1.5; // Social coefficient
        
        // Source image data
        const sourceCtx = sourceCanvas.getContext('2d');
        this.sourceImageData = sourceCtx.getImageData(0, 0, this.width, this.height);
        
        // Temporary canvas for fitness calculation
        this.tempCanvas = document.createElement('canvas');
        this.tempCanvas.width = this.width;
        this.tempCanvas.height = this.height;
        this.tempCtx = this.tempCanvas.getContext('2d');
        
        this.iteration = 0;
    }

    /**
     * Set PSO parameters
     */
    setParameters(w, c1, c2) {
        this.w = w;
        this.c1 = c1;
        this.c2 = c2;
    }

    /**
     * Calculate fitness for a particle
     * Fitness = Mean Squared Error between source and reconstructed image
     * @param {Particle} particle
     * @returns {number} fitness score (lower is better)
     */
    calculateFitness(particle) {
        // Render particle to temporary canvas
        particle.render(this.tempCtx);
        
        // Get image data
        const renderedImageData = this.tempCtx.getImageData(0, 0, this.width, this.height);
        
        // Calculate MSE
        let error = 0;
        const data1 = this.sourceImageData.data;
        const data2 = renderedImageData.data;
        
        for (let i = 0; i < data1.length; i += 4) {
            // Compare RGB channels (ignore alpha)
            const rDiff = data1[i] - data2[i];
            const gDiff = data1[i + 1] - data2[i + 1];
            const bDiff = data1[i + 2] - data2[i + 2];
            
            error += rDiff * rDiff + gDiff * gDiff + bDiff * bDiff;
        }
        
        // Return normalized MSE
        return error / (this.width * this.height * 3);
    }

    /**
     * Perform one iteration of PSO
     */
    iterate() {
        let bestParticleThisIteration = null;
        
        // Evaluate fitness for all particles
        for (let particle of this.particles) {
            particle.fitness = this.calculateFitness(particle);
            particle.updateBest();
            
            // Track best particle in this iteration
            if (particle.fitness < this.globalBestFitness) {
                this.globalBestFitness = particle.fitness;
                bestParticleThisIteration = particle;
            }
        }
        
        // Clone global best only once per iteration if we found a better solution
        if (bestParticleThisIteration) {
            this.globalBest = bestParticleThisIteration.position.map(t => t.clone());
        }
        
        // Update all particles
        for (let particle of this.particles) {
            particle.update(this.globalBest, this.w, this.c1, this.c2);
        }
        
        this.iteration++;
    }

    /**
     * Render the global best solution to the reconstruction canvas
     */
    renderBest() {
        if (!this.globalBest) return;
        
        const ctx = this.reconstructionCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, this.width, this.height);
        
        for (let triangle of this.globalBest) {
            triangle.draw(ctx);
        }
    }

    /**
     * Get current best fitness
     */
    getBestFitness() {
        return this.globalBestFitness;
    }

    /**
     * Get current iteration count
     */
    getIteration() {
        return this.iteration;
    }
}
