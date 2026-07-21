var cols, rows;
var scl = 20;
var w = 700;
var h = 1000;
var flying = 0;
var terrain = [];
var noiseScale = 0.1; // Reasonable initial value
var amplitude = 100; // Reasonable initial value
var noiseScaleSlider; // Slider for noiseScale

function setup() {
  createCanvas(600, 600, WEBGL);
  cols = floor(w / scl);
  rows = floor(h / scl);
  terrain = new Array(cols);
  for (var x = 0; x < cols; x++) {
    terrain[x] = new Array(rows);
  }
  
  // Create noiseScale slider
  noiseScaleSlider = createSlider(0.01, 0.5, noiseScale, 0.01);
  noiseScaleSlider.position(width - 120, 10);
}

function draw() {
  noiseScale = noiseScaleSlider.value(); // Read value from the slider
  updateNoiseParameters(); // Update noise parameters
  flying -= 0.1 * 0.3;
  var yoff = flying;
  for (var y = 0; y < rows; y++) {
    var xoff = 0;
    for (var x = 0; x < cols; x++) {
      terrain[x][y] = map(noise(xoff, yoff), 0, 1, -amplitude, amplitude);
      xoff += noiseScale;
    }
    yoff += noiseScale;
  }

  background(20);
  translate(w / 2 - width / 2, h / 2 - height / 2);
  rotateX(PI / 3.5);

  for (var y = 0; y < rows - 1; y++) {
    beginShape(TRIANGLE_STRIP);
    for (var x = 0; x < cols; x++) {
      var elevation_color = getElevationColor(terrain[x][y]);
      fill(elevation_color);
      vertex(x * scl - w / 2, y * scl - h / 2, terrain[x][y]);
      elevation_color = getElevationColor(terrain[x][y + 1]);
      fill(elevation_color);
      vertex(x * scl - w / 2, (y + 1) * scl - h / 2, terrain[x][y + 1]);
    }
    endShape();
  }
  
  // Display noiseScale value
  push();
  fill(255);
  textSize(12);
  text("Noise Scale: " + noiseScale.toFixed(2), width - 120, 30);
  pop();
}

function updateNoiseParameters() {
  // Increase or decrease amplitude based on key presses (removed noiseScale controls)
  if (keyIsDown(RIGHT_ARROW)) {
    amplitude += 5;
  }
  if (keyIsDown(LEFT_ARROW)) {
    amplitude -= 5;
  }
  
  // Constrain the values to reasonable ranges
  amplitude = constrain(amplitude, 10, 200);
}

function getElevationColor(elevation) {
  var t = map(elevation, -100, 100, 0, 1);
  var colors = [color('#025464'), color('#468B97'), color('#E57C23'), color('#B8621B'), color('#EF6262')];

  var segment = 1 / (colors.length - 0.3);
  var index = floor(t / segment);
  index = constrain(index, 0, colors.length - 2);

  return lerpColor(colors[index], colors[index + 1], (t % segment) / segment);
}
