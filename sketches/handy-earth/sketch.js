let yoff = 0.0; // 2nd dimension of perlin noise

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(255);

  fill(50);
  // We're going to draw a polygon out of the wave points
  beginShape();

  let xoff = 0; // Option #1: 2D Noise
  // Iterate over horizontal pixels
  for (let x = 0; x < width; x += 10) {
    // Calculate a y value according to noise, map to
    let y = map(noise(xoff, yoff), 0, 1, 200, 300);
    // Set the vertex
    vertex(x, y);
    // Increment x dimension for noise
    xoff += 0.05;
  }
  // Increment y dimension for noise
  yoff += 0.01;
  vertex(width, height);
  vertex(0, height);
  endShape(CLOSE);
}
