let x = 0;
let y = 0;
let spacing = 50;

function setup() {
  createCanvas(400, 400);
  background(0);
}

function draw() {
  let r = random(255);
  let g = random(255);
  let b = random(255);
  stroke(r, g, b);
  fill(r, g, b, 100);  // Adding some transparency to the fill color

  if (random(1) < 0.5) {
    line(x, y, x + spacing, y + spacing);
    rect(x, y, spacing / 2, spacing / 2);
  } else {
    line(x, y + spacing, x + spacing, y);
    rect(x + spacing / 2, y + spacing / 2, spacing / 2, spacing / 2);
  }

  x = x + spacing;
  if (x > width) {
    x = 0;
    y = y + spacing;
  }

  if (y > height) {
    background(0);
    x = 0;
    y = 0;
  }
}
