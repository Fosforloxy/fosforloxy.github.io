let trail = [];
let rotationAngle;
let edgeLength;
let numCubes;

function setup() {
  createCanvas(600, 600, WEBGL);
  rotationAngle = 0;
  edgeLength = 75; // You can change the edge length here
  numCubes = 3; // You can change the number of cubes here
}

function draw() {
  background(220);
  let totalLength = numCubes * edgeLength;
  let halfTotalLength = totalLength / 2;
  
  // Increment the rotation angle
  rotationAngle += radians(1); // You can adjust the value inside radians() to control the rotation speed
  
  // Loop through and draw the cubes in a grid layout
  for (let i = 0; i < numCubes; i++) {
    for (let j = 0; j < numCubes; j++) {
      for (let k = 0; k < numCubes; k++) {
        push();
        translate(i * edgeLength - halfTotalLength, j * edgeLength - halfTotalLength, k * edgeLength - halfTotalLength);
        rotateX(rotationAngle);
        rotateY(rotationAngle);
        rotateZ(rotationAngle);
        drawCube(edgeLength);
        pop();
      }
    }
  }
}

function drawCube(edgeLength) {
  let halfEdgeLength = edgeLength / 2;
  
  // Draw the edges of the cube with the triple line effect
  drawEdge(-halfEdgeLength, -halfEdgeLength, -halfEdgeLength,  halfEdgeLength, -halfEdgeLength, -halfEdgeLength);
  drawEdge( halfEdgeLength, -halfEdgeLength, -halfEdgeLength,  halfEdgeLength,  halfEdgeLength, -halfEdgeLength);
  drawEdge( halfEdgeLength,  halfEdgeLength, -halfEdgeLength, -halfEdgeLength,  halfEdgeLength, -halfEdgeLength);
  drawEdge(-halfEdgeLength,  halfEdgeLength, -halfEdgeLength, -halfEdgeLength, -halfEdgeLength, -halfEdgeLength);
  drawEdge(-halfEdgeLength, -halfEdgeLength,  halfEdgeLength,  halfEdgeLength, -halfEdgeLength,  halfEdgeLength);
  drawEdge( halfEdgeLength, -halfEdgeLength,  halfEdgeLength,  halfEdgeLength,  halfEdgeLength,  halfEdgeLength);
  drawEdge( halfEdgeLength,  halfEdgeLength,  halfEdgeLength, -halfEdgeLength,  halfEdgeLength,  halfEdgeLength);
  drawEdge(-halfEdgeLength,  halfEdgeLength,  halfEdgeLength, -halfEdgeLength, -halfEdgeLength,  halfEdgeLength);
  drawEdge(-halfEdgeLength, -halfEdgeLength, -halfEdgeLength, -halfEdgeLength, -halfEdgeLength,  halfEdgeLength);
  drawEdge( halfEdgeLength, -halfEdgeLength, -halfEdgeLength,  halfEdgeLength, -halfEdgeLength,  halfEdgeLength);
  drawEdge( halfEdgeLength,  halfEdgeLength, -halfEdgeLength,  halfEdgeLength,  halfEdgeLength,  halfEdgeLength);
  drawEdge(-halfEdgeLength,  halfEdgeLength, -halfEdgeLength, -halfEdgeLength,  halfEdgeLength,  halfEdgeLength);
}

function drawEdge(x1, y1, z1, x2, y2, z2) {
  let trailThickness = 5;
  let trailOffset = 50;
  
  stroke(0); // black color
  strokeWeight(trailThickness); // Set line width
  line(x1 - trailOffset, y1, z1, x2 - trailOffset, y2, z2);
  line(x1 + trailOffset, y1, z1, x2 + trailOffset, y2, z2);

  stroke(255); // white color
  strokeWeight(trailThickness / 5); // Set line width
  line(x1, y1, z1, x2, y2, z2);
}
