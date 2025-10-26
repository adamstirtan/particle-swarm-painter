/**
 * Particle Swarm Optimization for Image Reconstruction
 * Each particle represents a set of triangles that approximate an image
 */

class Triangle {
    constructor(width, height) {
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
        this.a = Math.random() * 0.6 + 0.2; // Alpha between 0.2 and 0.8
    }

    toArray() {
        return [this.x1, this.y1, this.x2, this.y2, this.x3, this.y3, this.r, this.g, this.b, this.a];
    }

    fromArray(arr) {
        [this.x1, this.y1, this.x2, this.y2, this.x3, this.y3, this.r, this.g, this.b, this.a] = arr;
    }

    clone() {
        const t = new Triangle(0, 0);
        t.fromArray(this.toArray());
        return t;
    }
}

class Particle {
    constructor(numTriangles, width, height) {
        this.width = width;
        this.height = height;
        this.numTriangles = numTriangles;
        
        // Current position (triangles)
        this.triangles = [];
        for (let i = 0; i < numTriangles; i++) {
            this.triangles.push(new Triangle(width, height));
        }
        
        // Velocity for each parameter of each triangle
        this.velocity = [];
        for (let i = 0; i < numTriangles * 10; i++) {
            this.velocity.push((Math.random() - 0.5) * 10);
        }
        
        // Personal best
        this.bestTriangles = this.triangles.map(t => t.clone());
        this.bestFitness = Infinity;
        
        // Current fitness
        this.fitness = Infinity;
    }

    getPosition() {
        const pos = [];
        this.triangles.forEach(t => {
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
            this.bestTriangles = this.triangles.map(t => t.clone());
        }
    }

    clampPosition() {
        this.triangles.forEach(t => {
            // Clamp vertices to canvas bounds
            t.x1 = Math.max(0, Math.min(this.width, t.x1));
            t.y1 = Math.max(0, Math.min(this.height, t.y1));
            t.x2 = Math.max(0, Math.min(this.width, t.x2));
            t.y2 = Math.max(0, Math.min(this.height, t.y2));
            t.x3 = Math.max(0, Math.min(this.width, t.x3));
            t.y3 = Math.max(0, Math.min(this.height, t.y3));
            
            // Clamp colors
            t.r = Math.max(0, Math.min(255, t.r));
            t.g = Math.max(0, Math.min(255, t.g));
            t.b = Math.max(0, Math.min(255, t.b));
            t.a = Math.max(0.1, Math.min(1, t.a));
        });
    }
}

class PSO {
    constructor(config) {
        this.config = {
            numTriangles: config.numTriangles || 50,
            swarmSize: config.swarmSize || 20,
            inertia: config.inertia || 0.7,
            cognitive: config.cognitive || 1.5,
            social: config.social || 1.5,
            width: config.width,
            height: config.height
        };
        
        this.particles = [];
        this.globalBestTriangles = null;
        this.globalBestFitness = Infinity;
        this.iteration = 0;
        
        // Source image data
        this.sourceImageData = null;
        
        // Canvas for rendering particles
        this.renderCanvas = document.createElement('canvas');
        this.renderCanvas.width = this.config.width;
        this.renderCanvas.height = this.config.height;
        this.renderCtx = this.renderCanvas.getContext('2d');
        
        this.initializeSwarm();
    }

    initializeSwarm() {
        this.particles = [];
        for (let i = 0; i < this.config.swarmSize; i++) {
            this.particles.push(new Particle(
                this.config.numTriangles,
                this.config.width,
                this.config.height
            ));
        }
    }

    setSourceImage(imageData) {
        this.sourceImageData = imageData;
    }

    renderTriangles(triangles) {
        const ctx = this.renderCtx;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, this.config.width, this.config.height);
        
        triangles.forEach(t => {
            ctx.beginPath();
            ctx.moveTo(t.x1, t.y1);
            ctx.lineTo(t.x2, t.y2);
            ctx.lineTo(t.x3, t.y3);
            ctx.closePath();
            ctx.fillStyle = `rgba(${Math.floor(t.r)}, ${Math.floor(t.g)}, ${Math.floor(t.b)}, ${t.a})`;
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
        particle.bestTriangles.forEach(t => {
            personalBestPos.push(...t.toArray());
        });
        
        const globalBestPos = [];
        this.globalBestTriangles.forEach(t => {
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
        this.particles.forEach(particle => {
            particle.fitness = this.calculateFitness(particle);
            particle.updatePersonalBest();
            
            // Update global best
            if (particle.fitness < this.globalBestFitness) {
                this.globalBestFitness = particle.fitness;
                this.globalBestTriangles = particle.triangles.map(t => t.clone());
            }
        });
        
        // Update velocities and positions
        this.particles.forEach(particle => {
            this.updateVelocityAndPosition(particle);
        });
        
        this.iteration++;
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
        this.config.inertia = config.inertia;
        this.config.cognitive = config.cognitive;
        this.config.social = config.social;
    }
}
