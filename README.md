# Particle Swarm Painter

A web application that uses Particle Swarm Optimization (PSO) to reconstruct images by evolving a set of semi-transparent triangles on an HTML canvas.

## Overview

This application demonstrates the power of swarm intelligence by reconstructing uploaded images using an evolutionary algorithm. Each particle in the swarm represents a potential solution composed of multiple triangles. Over time, the PSO algorithm evolves these triangles to collectively approximate the source image.

## Features

- **Image Upload**: Upload any image to reconstruct
- **Real-time Visualization**: Watch the optimization process in real-time
- **Adjustable Parameters**:
  - Number of triangles (10-200)
  - Swarm size (5-50 particles)
  - Inertia weight (w)
  - Cognitive coefficient (c1)
  - Social coefficient (c2)
- **Controls**: Start, pause, and reset the optimization
- **Progress Tracking**: Monitor iteration count and best fitness score
- **Save Output**: Download the reconstructed image

## How It Works

### Particle Swarm Optimization

Each particle represents one possible image composed of N triangles. The algorithm iteratively:
1. Evaluates each particle's fitness (similarity to source image)
2. Updates each particle's personal best position
3. Updates the global best position (best solution found by any particle)
4. Adjusts particle velocities based on:
   - Inertia (tendency to maintain current direction)
   - Cognitive component (attraction to personal best)
   - Social component (attraction to global best)

### Triangle Encoding

Each triangle is encoded as a 10-dimensional vector:
- `x1, y1`: First vertex coordinates
- `x2, y2`: Second vertex coordinates
- `x3, y3`: Third vertex coordinates
- `r, g, b`: Color (red, green, blue)
- `a`: Alpha (transparency)

### Fitness Function

Fitness is calculated as the Mean Squared Error (MSE) between the source image and the reconstructed image:

```
fitness = sum((pixel_color_generated - pixel_color_source)²) / total_pixels
```

Lower fitness scores indicate better reconstructions.

## Usage

1. Open `index.html` in a modern web browser
2. Click "Choose File" to upload an image
3. Adjust PSO parameters if desired (default values work well)
4. Click "Start" to begin the optimization
5. Watch as the algorithm evolves triangles to reconstruct your image
6. Click "Pause" to pause the optimization
7. Click "Save Image" to download the reconstructed image
8. Click "Reset" to start over with different parameters

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript (no external dependencies)
- **Canvas API**: Used for rendering triangles and image comparison
- **Performance**: Images are automatically scaled to a maximum of 400x400 pixels for optimal performance
- **Responsive Design**: Works on desktop and mobile devices

## Parameters Guide

- **Number of Triangles**: More triangles = better detail but slower convergence
- **Swarm Size**: Larger swarms explore the solution space better but are slower
- **Inertia (w)**: Controls momentum (0.5-0.9 recommended)
- **Cognitive Coefficient (c1)**: Controls attraction to personal best (1.0-2.0 recommended)
- **Social Coefficient (c2)**: Controls attraction to global best (1.0-2.0 recommended)

## Browser Compatibility

This application works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript
- FileReader API

## License

MIT License