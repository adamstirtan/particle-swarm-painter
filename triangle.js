/**
 * Triangle class represents a single triangle in the image reconstruction
 * Each triangle has 3 vertices (x1,y1), (x2,y2), (x3,y3) and RGBA color
 */
class Triangle {
    /**
     * @param {number} width - Canvas width for normalization
     * @param {number} height - Canvas height for normalization
     * @param {Array<number>} genes - Optional array of 10 values [x1,y1,x2,y2,x3,y3,r,g,b,a]
     */
    constructor(width, height, genes = null) {
        this.width = width;
        this.height = height;
        
        if (genes) {
            this.genes = [...genes];
        } else {
            this.randomize();
        }
    }

    /**
     * Initialize triangle with random values
     */
    randomize() {
        this.genes = [
            Math.random(), // x1 (normalized 0-1)
            Math.random(), // y1 (normalized 0-1)
            Math.random(), // x2 (normalized 0-1)
            Math.random(), // y2 (normalized 0-1)
            Math.random(), // x3 (normalized 0-1)
            Math.random(), // y3 (normalized 0-1)
            Math.random(), // r (0-1)
            Math.random(), // g (0-1)
            Math.random(), // b (0-1)
            Math.random() * 0.5 + 0.3  // a (0.3-0.8 for better blending)
        ];
    }

    /**
     * Get actual pixel coordinates and color values
     */
    getValues() {
        return {
            x1: this.genes[0] * this.width,
            y1: this.genes[1] * this.height,
            x2: this.genes[2] * this.width,
            y2: this.genes[3] * this.height,
            x3: this.genes[4] * this.width,
            y3: this.genes[5] * this.height,
            r: Math.floor(this.genes[6] * 255),
            g: Math.floor(this.genes[7] * 255),
            b: Math.floor(this.genes[8] * 255),
            a: this.genes[9]
        };
    }

    /**
     * Draw this triangle on a canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on
     */
    draw(ctx) {
        const v = this.getValues();
        
        ctx.fillStyle = `rgba(${v.r}, ${v.g}, ${v.b}, ${v.a})`;
        ctx.beginPath();
        ctx.moveTo(v.x1, v.y1);
        ctx.lineTo(v.x2, v.y2);
        ctx.lineTo(v.x3, v.y3);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Clone this triangle
     */
    clone() {
        return new Triangle(this.width, this.height, this.genes);
    }

    /**
     * Mutate genes by adding a delta value (for PSO velocity updates)
     * @param {Array<number>} delta - Array of 10 values to add to genes
     */
    mutate(delta) {
        for (let i = 0; i < this.genes.length; i++) {
            this.genes[i] += delta[i];
            // Clamp values to valid ranges
            if (i < 6) {
                // Position coordinates (0-1)
                this.genes[i] = Math.max(0, Math.min(1, this.genes[i]));
            } else if (i < 9) {
                // RGB values (0-1)
                this.genes[i] = Math.max(0, Math.min(1, this.genes[i]));
            } else {
                // Alpha value (0.3-0.8)
                this.genes[i] = Math.max(0.3, Math.min(0.8, this.genes[i]));
            }
        }
    }
}
