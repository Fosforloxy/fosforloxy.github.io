let randomX;
let randomY;
let centerPoints = []; // Array to store center points of rectangles

function setup() {
  createCanvas(400, 400);

  let minX = width / 4;
  let maxX = 2 * width / 4;
  let minY = height / 4;
  let maxY = 2 * height / 4;

  randomX = random(minX, maxX);
  randomY = random(minY, maxY);
}

function draw() {
  background(255);

  stroke(0);
  strokeWeight(2);

  // Draw the primary vertical and horizontal lines
  line(randomX, 0, randomX, height);
  line(0, randomY, width, randomY);

  // Initial boundaries representing the whole canvas
  let initialQuadrants = [{
    minX: 0, maxX: randomX, minY: 0, maxY: randomY
  }, {
    minX: randomX, maxX: width, minY: 0, maxY: randomY
  }, {
    minX: 0, maxX: randomX, minY: randomY, maxY: height
  }, {
    minX: randomX, maxX: width, minY: randomY, maxY: height
  }];

  // Repeat the process three times
  let quadrants = subdivideQuadrants(initialQuadrants, 1);
  quadrants = quadrants.concat(subdivideQuadrants(quadrants, 2));
  quadrants = quadrants.concat(subdivideQuadrants(quadrants, 3));
  
  // Calculate center points of rectangles
  calculateCenterPoints(quadrants);
  
  // Randomly pick a point on the edge of the canvas
  let edgePoint = randomPointOnEdge();
  ellipse(edgePoint.x, edgePoint.y, 10); // Draw the point as an ellipse
  
  // Draw dotted lines from the edgePoint
  drawDottedLines(edgePoint);
  
  noLoop();
}

function subdivideQuadrants(quadrants, iteration) {
  let newQuadrants = [];
  let selectedQuadrants = [];

  while (selectedQuadrants.length < 2) {
    let q = floor(random(quadrants.length));
    if (!selectedQuadrants.includes(q)) {
      selectedQuadrants.push(q);
    }
  }

  for (let index of selectedQuadrants) {
    let bounds = quadrants[index];
    let subX = random(bounds.minX + (bounds.maxX - bounds.minX) / 6, bounds.maxX - (bounds.maxX - bounds.minX) / 6);
    let subY = random(bounds.minY + (bounds.maxY - bounds.minY) / 6, bounds.maxY - (bounds.maxY - bounds.minY) / 6);

    if (iteration >= 3) {
      if (random() < 0.5) {
        line(subX, bounds.minY, subX, bounds.maxY);
        newQuadrants.push({minX: bounds.minX, maxX: subX, minY: bounds.minY, maxY: bounds.maxY});
        newQuadrants.push({minX: subX, maxX: bounds.maxX, minY: bounds.minY, maxY: bounds.maxY});
      } else {
        line(bounds.minX, subY, bounds.maxX, subY);
        newQuadrants.push({minX: bounds.minX, maxX: bounds.maxX, minY: bounds.minY, maxY: subY});
        newQuadrants.push({minX: bounds.minX, maxX: bounds.maxX, minY: subY, maxY: bounds.maxY});
      }
    } else {
      line(subX, bounds.minY, subX, bounds.maxY);
      line(bounds.minX, subY, bounds.maxX, subY);

      newQuadrants.push({minX: bounds.minX, maxX: subX, minY: bounds.minY, maxY: subY});
      newQuadrants.push({minX: subX, maxX: bounds.maxX, minY: bounds.minY, maxY: subY});
      newQuadrants.push({minX: bounds.minX, maxX: subX, minY: subY, maxY: bounds.maxY});
      newQuadrants.push({minX: subX, maxX: bounds.maxX, minY: subY, maxY: bounds.maxY});
    }
  }

  return newQuadrants;
}

function randomPointOnEdge() {
  let side = floor(random(4));
  switch (side) {
    case 0: // Top edge
      return {x: random(width), y: 0};
    case 1: // Right edge
      return {x: width, y: random(height)};
    case 2: // Bottom edge
      return {x: random(width), y: height};
    case 3: // Left edge
      return {x: 0, y: random(height)};
  }
}

function calculateCenterPoints(quadrants) {
  for (let q of quadrants) {
    let centerX = (q.minX + q.maxX) / 2;
    let centerY = (q.minY + q.maxY) / 2;
    centerPoints.push({x: centerX, y: centerY});
  }
}

function drawDottedLines(startPoint) {
  let currentPoint = startPoint;
  while (centerPoints.length > 0) {
    // Find the nearest center point
    let minDist = Infinity;
    let minIndex = -1;
    for (let i = 0; i < centerPoints.length; i++) {
      let d = dist(currentPoint.x, currentPoint.y, centerPoints[i].x, centerPoints[i].y);
      if (d < minDist) {
        minDist = d;
        minIndex = i;
      }
    }

    // Draw a dotted line to the nearest center point
    let nextPoint = centerPoints[minIndex];
    let segments = floor(dist(currentPoint.x, currentPoint.y, nextPoint.x, nextPoint.y) / 10);
    for (let i = 0; i < segments; i++) {
      let t1 = i / segments;
      let t2 = (i + 0.5) / segments;
      let x1 = lerp(currentPoint.x, nextPoint.x, t1);
      let y1 = lerp(currentPoint.y, nextPoint.y, t1);
      let x2 = lerp(currentPoint.x, nextPoint.x, t2);
      let y2 = lerp(currentPoint.y, nextPoint.y, t2);
      line(x1, y1, x2, y2);
    }

    // Set the nearest center point as the current point and remove it from the list
    currentPoint = centerPoints.splice(minIndex, 1)[0];
  }
}
