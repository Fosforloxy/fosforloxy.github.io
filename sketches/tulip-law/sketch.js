const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 300;
const COLOR_COUNT = 100;
const PIXEL_DENSITY = 1;
const SCALE_FACTOR = 50;
const ALPHA_VALUE = 255;

let TARGET_COLOR;
let colors = [];

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  pixelDensity(PIXEL_DENSITY);
  
  TARGET_COLOR = color(255, 0, 0); // Red color, value assigned after p5.js has initialized

  scaleCanvas();
  generateColors(COLOR_COUNT);
  createPattern();
}

function scaleCanvas() {
  let canvas = select('canvas');
  canvas.style('width', '400px');
  canvas.style('height', '400px');
}

function generateColors(colorCount) {
  for (let i = 0; i < colorCount; i++) {
    colors.push(color(random(0, 255), random(0, 255), random(0, 255)));
  }
}

function createPattern() {
  loadPixels();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let index = (x + y * width) * 4;

      let colorIndex = floor(noise(x / SCALE_FACTOR, y / SCALE_FACTOR) * colors.length);

      pixels[index] = red(colors[colorIndex]);
      pixels[index + 1] = green(colors[colorIndex]);
      pixels[index + 2] = blue(colors[colorIndex]);
      pixels[index + 3] = ALPHA_VALUE;
    }
  }

  updatePixels();
}

function draw() {
  loadPixels();
  updatePixels();
}

function mousePressed() {
  loop();
}

function mouseReleased() {
  noLoop();
}

function colorDistance(colorA, colorB) {
  let rDiff = red(colorA) - red(colorB);
  let gDiff = green(colorA) - green(colorB);
  let bDiff = blue(colorA) - blue(colorB);
  return sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}
