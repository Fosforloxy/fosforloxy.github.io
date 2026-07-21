let trail = [];
let agentSpeed; // Variable to control the speed
let turnFrequency; // Variable to control the frequency of turns
let numAngles; // Variable to specify number of potential angles
let x, y;
let circleRadius = 300; // radius of the circle
let circleX, circleY; // coordinates of the center of the circle

function setup() {
  createCanvas(1000 , 1000);
  x = width / 2;
  y = height / 2;
  
  // Center of the circle
  circleX = width / 2;
  circleY = height / 2;
  
  agentSpeed = 5; // You can change this value
  turnFrequency = 0.99; // Values closer to 1 will make more frequent turns, closer to 0 will make less frequent turns
  numAngles = 4; // Number of potential angles to turn to (e.g., 4 for up, down, left, right; 8 for adding diagonals)
}

function draw() {
  background(220);

  // Draw the circle
  noFill();
  stroke(100);
  ellipse(circleX, circleY, circleRadius * 2);

  // Move agent based on agentSpeed, turn frequency, and number of angles
  if (random(1) < turnFrequency) {
    let angle = TWO_PI / numAngles * floor(random(numAngles));
    let dx = cos(angle) * agentSpeed;
    let dy = sin(angle) * agentSpeed;
    let newX = x + dx;
    let newY = y + dy;
    if (dist(newX, newY, circleX, circleY) <= circleRadius) {
      x = newX;
      y = newY;
    }
  }

  // Add current position to the trail
  trail.push({x: x, y: y});

  // Draw the trail
  noFill();

  // Set thickness of trail
  let trailThickness = 1; // Increase trail thickness
  let trailOffset = 1; // Increase offset for black lines

  // Draw black lines (offset to either side of the white line)
  stroke(0); // black color
  strokeWeight(trailThickness); // Set line width
  beginShape();
  for (let i = 0; i < trail.length; i++) {
    vertex(trail[i].x - trailOffset, trail[i].y);
  }
  endShape();

  beginShape();
  for (let i = 0; i < trail.length; i++) {
    vertex(trail[i].x + trailOffset, trail[i].y);
  }
  endShape();

  // Draw white line in the center
  stroke(255); // white color
  strokeWeight(trailThickness / 5); // Set line width
  beginShape();
  for (let i = 0; i < trail.length; i++) {
    vertex(trail[i].x, trail[i].y);
  }
  endShape();
}
