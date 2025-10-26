# Particle Swarm Painter

A web application that uses Particle Swarm Optimization (PSO) to reconstruct images using semi-transparent triangles. Watch as an evolutionary algorithm learns to approximate your image through iterative optimization!

## 🎨 What It Does

This application demonstrates particle swarm optimization by:
- Taking an uploaded image as input
- Using a swarm of "particles" (each representing a different arrangement of triangles)
- Evolving these particles over time to find the best triangle arrangement
- Rendering a beautiful, artistic approximation of your original image

## 🚀 Getting Started

### Running Locally

Simply open `index.html` in a modern web browser. No build process or server required!

```bash
# Clone the repository
git clone https://github.com/adamstirtan/particle-swarm-painter.git
cd particle-swarm-painter

# Open in browser (example for macOS)
open index.html

# Or for Linux
xdg-open index.html

# Or for Windows
start index.html
```

### Using the Application

1. **Upload an Image**: Click the "📁 Upload Image" button and select an image file
2. **Configure Parameters** (optional):
   - **Number of Triangles**: How many triangles to use (10-200)
   - **Swarm Size**: Number of particles in the swarm (5-50)
   - **Inertia (w)**: Controls momentum of particles (0-1)
   - **Cognitive (c1)**: How much particles trust their own best position (0-3)
   - **Social (c2)**: How much particles trust the swarm's best position (0-3)
3. **Start Optimization**: Click "▶ Start" to begin the PSO algorithm
4. **Monitor Progress**: Watch the iteration count and fitness score improve
5. **Save Result**: Click "💾 Save Image" to download your reconstruction

## 📊 How It Works

### Particle Swarm Optimization

Each particle represents a complete image composed of N triangles. Each triangle has 10 parameters:
- `(x1, y1)`, `(x2, y2)`, `(x3, y3)`: Vertex coordinates
- `r`, `g`, `b`, `a`: Color (red, green, blue, alpha)

The algorithm:
1. **Initialization**: Creates random particles (triangle arrangements)
2. **Fitness Evaluation**: Compares each particle's rendering to the source image
3. **Update**: Particles move through the search space based on:
   - Their own best position found so far
   - The global best position found by any particle
4. **Iteration**: Steps 2-3 repeat, gradually improving the reconstruction

### Fitness Function

```
fitness = Σ(pixel_generated - pixel_source)² / total_pixels
```

Lower fitness scores indicate better matches to the source image.

## 🎛️ Parameter Guide

### Number of Triangles
- **Low (10-30)**: Fast, abstract results
- **Medium (40-100)**: Balanced detail and performance
- **High (100-200)**: More detail, slower convergence

### Swarm Size
- **Small (5-15)**: Faster iterations, may converge to local optima
- **Large (20-50)**: Slower iterations, better global search

### Inertia (w)
- **Low (0-0.5)**: Quick changes, good for fine-tuning
- **High (0.6-1.0)**: Smoother movement, better exploration

### Cognitive Coefficient (c1)
- Controls individual particle's "memory"
- Higher values make particles trust their own experience more

### Social Coefficient (c2)
- Controls swarm's collective influence
- Higher values make particles follow the best solution more closely

## 💡 Tips for Best Results

- Start with default parameters for most images
- Use fewer triangles for faster initial results
- Increase triangles for more detailed reconstructions
- For abstract art, try low triangle counts (10-30)
- For portraits, use medium to high triangle counts (50-150)
- Let it run! Fitness improves gradually over many iterations

## 🛠️ Technical Details

- **Pure JavaScript**: No external dependencies required
- **HTML5 Canvas**: For efficient rendering
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Uses requestAnimationFrame for smooth visualization

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 🌟 Acknowledgments

Inspired by research in evolutionary algorithms and genetic art generation. PSO was originally developed by Kennedy and Eberhart in 1995.