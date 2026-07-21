var cols, rows;
var scl = 25; // Initialize scl here
var w, h;
var flying = 0;
var terrain = [];
var noiseSlider, rotationSlider;

function setup() {
  createCanvas(windowWidth, windowHeight - 50, WEBGL);
  w = width;
  h = height;
  createP('Noise Scale:');
  noiseSlider = createSlider(10, 50, scl); // Use initial value of scl
  createP('Rotation Angle:');
  rotationSlider = createSlider(PI / 6, PI / 2, PI / 3, 0.01);
  cols = floor(w / scl);
  rows = floor(h / scl);
  terrain = new Array(cols);
  for (var x = 0; x < cols; x++) {
    terrain[x] = new Array(rows);
  }
}

// Rest of the code remains the same...

function draw() {
  flying -= 0.1;
  scl = noiseSlider.value();
  cols = floor(w / scl);
  rows = floor(h / scl);
  generateTerrain();
  background(200);
  translate(0, -50); // Centering the terrain
  rotateX(rotationSlider.value()); // Adjusting the view angle
  renderTerrain();
}

function generateTerrain() {
  var yoff = flying;
  scl = noiseSlider.value(); // Get the noise scale from the slider
  cols = floor(w / scl);
  rows = floor(h / scl);
  terrain = new Array(cols); // Reinitialize the terrain array with new dimensions
  for (var x = 0; x < cols; x++) {
    terrain[x] = new Array(rows);
  }
  for (var y = 0; y < rows; y++) {
    var xoff = 0;
    for (var x = 0; x < cols; x++) {
      terrain[x][y] = map(noise(xoff, yoff), 0, 1, -100, 100);
      xoff += 0.2;
    }
    yoff += 0.2;
  }
}

function renderTerrain() {
  for (var y = 0; y < rows - 1; y++) {
    beginShape(TRIANGLE_STRIP);
    for (var x = 0; x < cols; x++) {
      fill(getColor(terrain[x][y]));
      vertex(x * scl - w / 2, y * scl - h / 2, terrain[x][y]);
      fill(getColor(terrain[x][y + 1]));
      vertex(x * scl - w / 2, (y + 1) * scl - h / 2, terrain[x][y + 1]);
    }
    endShape();
  }
}



function getColor(elevation) {
  var colors = [
    color(0, 0, 128), // Deep Water
    color(0, 128, 255), // Shallow Water
    color(240, 230, 140), // Beach
    color(34, 139, 34), // Grassland
    color(0, 100, 0), // Forest
    color(139, 69, 19), // Hills
    color(112, 128, 144), // Mountains
    color(255, 255, 255) // Snowy Peaks
  ];
  var index = floor(map(elevation, -100, 100, 0, colors.length));
  return colors[index];
}
