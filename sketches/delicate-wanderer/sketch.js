function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop(); // Since it's a still image
  noStroke();
  drawBackground();
  drawWaves();
  drawFish();
  drawBubbles();
}

function drawBackground() {
  // Draw a gradient background from dark blue at the top to lighter blue at the bottom
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color(0, 0, 102), color(0, 153, 204), inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawWaves() {
  // Draw waves using sin functions
  stroke(255, 255, 255, 50);
  noFill();
  for (let i = 0; i < 5; i++) {
    let yOffset = random(height);
    beginShape();
    for (let x = 0; x <= width; x += 10) {
      let y = yOffset + 20 * sin(TWO_PI * x / 200 + random(TWO_PI));
      curveVertex(x, y);
    }
    endShape();
  }
}

function drawFish() {
  // Draw fish at random positions
  for (let i = 0; i < 10; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(20, 50);
    let col = color(random(200, 255), random(100, 150), random(0, 50), 200);
    drawFishAt(x, y, size, col);
  }
}

function drawFishAt(x, y, size, col) {
  push();
  translate(x, y);
  fill(col);
  noStroke();
  ellipse(0, 0, size * 1.5, size); // Body
  triangle(size * 0.75, 0, size * 1.5, size * 0.5, size * 1.5, -size * 0.5); // Tail
  fill(0);
  ellipse(-size * 0.4, -size * 0.2, size * 0.1, size * 0.1); // Eye
  pop();
}

function drawBubbles() {
  // Draw bubbles rising up
  for (let i = 0; i < 50; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(5, 15);
    fill(255, 255, 255, 100);
    noStroke();
    ellipse(x, y, size, size);
  }
}

function mousePressed() {
  redraw();
}
