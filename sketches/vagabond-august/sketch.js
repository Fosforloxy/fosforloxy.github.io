let x = 0;
let y = 0;
let spacing = 50;

// Define a retro color palette
let palette = ['#FFB447', '#FF3428', '#3A91AA', '#35477D'];

function setup() {
  createCanvas(400, 400);
  background('#F9EACD');  // Retro background color
  strokeWeight(3);  // Thicker lines for a more retro look
}

function draw() {
  let colorIndex = floor(random(palette.length));  // Randomly select a color from the palette
  stroke(palette[colorIndex]);
  fill(palette[colorIndex]);

  if (random(1) < 0.5) {
    line(x + noise(frameCount)*5, y + noise(frameCount)*5, x + spacing, y + spacing);  // Add some noise
    rect(x, y, spacing / 2, spacing / 2);
  } else {
    line(x + noise(frameCount)*5, y + spacing + noise(frameCount)*5, x + spacing, y);  // Add some noise
    rect(x + spacing / 2, y + spacing / 2, spacing / 2, spacing / 2);
  }

  x = x + spacing;
  if (x > width) {
    x = 0;
    y = y + spacing;
  }

  if (y > height) {
    background('#F9EACD');  // Reset the background to the retro color
    x = 0;
    y = 0;
  }
}
