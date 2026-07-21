// By Roni Kaufman
// https://ronikaufman.github.io

const M = 10, N = M;
let backCol, lineCol, ratio;
let path = [], p;

function setup() {
  createCanvas(500, 500, WEBGL);
  noStroke();
  
  let colors = shuffle([250, 5, random(["#f398c3", "#f44e24", "#f4d730", "#23b247", "#2a76d3"])]);
  backCol = colors[0];
  lineCol = colors[1];
  if (random() < 1/2) [backCol, lineCol] = [lineCol, backCol];
  ratio = (2*~~random(6)+1)/28; // determines how thick the line is
  
  p = [2*~~random(M/2), 2*~~random(N/2)]; // starting point
}

function draw() {
  background(backCol);
  translate(-width/2, -height/2);
  
  let eventualNeighbors = shuffle(possibleNeighbors(p, M, N));
    
  let neighbors = [[], []];
  for (let neigh of eventualNeighbors) {
    let projectedPath = [...path, p, neigh];
    let count = countDeadends(projectedPath, possibleNeighbors(neigh, M, N), M, N);
    if (!inArray(neigh, path) && !disjointed(projectedPath, M, N) && count < 2 && !cursedCorners(projectedPath, M, N)) {
      neighbors[count].push(neigh);
    }
  }
  neighbors = neighbors.flat(1);
    
  while (neighbors.length == 0) {
    // backtracking
    let previous = path.pop();
    p = [previous[0], previous[1]];
    neighbors = previous[2];
  }
    
  let pNext = neighbors.shift();
  path.push([...p, neighbors]);
  p = pNext;
  
  let margin = 50;
  drawPath([...path, p], margin, margin, width-2*margin, height-2*margin, M, N, lineCol, ratio);
  
  if (path.length == M*N-1) {
    //path.push(p);
    //console.log(frameCount);
    noLoop();
  }
}

// computing

function possibleNeighbors([i, j], m, n) {
  let possibilities = [];
  if (j < n-1) possibilities.push([i, j+1]);
  if (j > 0) possibilities.push([i, j-1]);
  if (i < m-1) possibilities.push([i+1, j]);
  if (i > 0) possibilities.push([i-1, j]);
  return possibilities;
}

function inArray([i, j], arr) {
  for (let e of arr) {
    if (e[0] == i && e[1] == j) return true;
  }
  return false;
}

// does arr disjoint the m*n grid?
function disjointed(arr, m, n) {
  if (arr.length >= m*n) {
    return false;
  }
  
  // choose initial point
  let p;
  do {
    p = [~~random(m), ~~random(n)];
  } while (inArray(p, arr))
    
  // traverse the m*n grid where arr was removed, through a DFS
  let discovered = [];
  let stack = [p];
  while (stack.length > 0) {
    p = stack.pop();
    if (!inArray(p, discovered)) {
      discovered.push(p);
      let neighbors = possibleNeighbors(p, m, n);
      for (let neigh of neighbors) {
        if (!inArray(neigh, arr)) stack.push(neigh);
      }
    }
  }
  
  return discovered.length != m*n-arr.length;
}

function countDeadends(arr, ignoreMe, m, n) {
  let count = 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (!inArray([i, j], arr) && !inArray([i, j], ignoreMe)) {
        let eventualNeighbors = possibleNeighbors([i, j], m, n);
        let neighbors = [];
        for (let neigh of eventualNeighbors) {
          if (!inArray(neigh, arr)) neighbors.push(neigh);
        }
        if (neighbors.length < 2) {
          count++;
        }
      }
    }
  }
  return count;
}

function cursedCorners(arr, M, N) {
  let corner1 = !inArray([0, 0], arr) && !inArray([1, 0], arr) && !inArray([0, 1], arr) && !inArray([1, 1], arr) && !inArray([2, 0], arr) && !inArray([0, 2], arr) && inArray([2, 1], arr) && inArray([1, 2], arr) && inArray([2, 2], arr);
  let corner2 = !inArray([M-1, 0], arr) && !inArray([M-2, 0], arr) && !inArray([M-1, 1], arr) && !inArray([M-2, 1], arr) && !inArray([M-3, 0], arr) && !inArray([M-1, 2], arr) && inArray([M-3, 1], arr) && inArray([M-2, 2], arr) && inArray([M-3, 2], arr);
  let corner3 = !inArray([M-1, N-1], arr) && !inArray([M-2, N-1], arr) && !inArray([M-1, N-2], arr) && !inArray([M-2, N-2], arr) && !inArray([M-3, N-1], arr) && !inArray([M-1, N-3], arr) && inArray([M-3, N-2], arr) && inArray([M-2, N-3], arr) && inArray([M-3, N-3], arr);
  let corner4 = !inArray([0, N-1], arr) && !inArray([1, N-1], arr) && !inArray([0, N-2], arr) && !inArray([1, N-2], arr) && !inArray([2, N-1], arr) && !inArray([0, N-3], arr) && inArray([2, N-2], arr) && inArray([1, N-3], arr) && inArray([2, N-3], arr);
  
  return corner1 || corner2 || corner3 || corner4;
}

// drawing

function getDirection(pA, pB) {
  if (pA[0] == pB[0]) {
    if (pA[1] > pB[1]) return "down";
    else return "up";
  } else {
    if (pA[0] > pB[0]) return "right";
    else return "left";
  }
}

function drawExtremity(path, i, j, sx, sy, a) {
  let p0 = path[i];
  let p1 = path[j];
  let dir = getDirection(p0, p1);
  if (dir == "down") rect((p0[0]+a)*sx, p0[1]*sy, (1-2*a)*sx, (1-a)*sy);
  else if (dir == "up") rect((p0[0]+a)*sx, (p0[1]+a)*sy, (1-2*a)*sx, (1-a)*sy);
  else if (dir == "left") rect((p0[0]+a)*sx, (p0[1]+a)*sy, (1-a)*sx, (1-2*a)*sy);
  else rect(p0[0]*sx, (p0[1]+a)*sy, (1-a)*sx, (1-2*a)*sy);
}

function drawPath(path, x0, y0, w, h, m, n, lineCol, a) {
  push();
  translate(x0, y0);
  
  let sx = w/m, sy = h/n;
  
  fill(lineCol);
  drawExtremity(path, 0, 1, sx, sy, a);
  drawExtremity(path, path.length-1, path.length-2, sx, sy, a);
  
  for (let k = 0; k < path.length-2; k++) {
    let p0 = path[k];
    let p1 = path[k+1];
    let p2 = path[k+2];
    let dir01 = getDirection(p0, p1);
    let dir12 = getDirection(p1, p2);
    
    fill(lineCol);
    if (dir01 == dir12) {
      if (dir01 == "down" || dir01 == "up") rect((p1[0]+a)*sx, p1[1]*sy, (1-2*a)*sx, sy);
      else rect(p1[0]*sx, (p1[1]+a)*sy, sx, (1-2*a)*sy);
    } else {
      if ((dir01 == "up" && dir12 == "right") || (dir01 == "left" && dir12 == "down")) {
        arc(p1[0]*sx, p1[1]*sy, (2-2*a)*sx, (2-2*a)*sy, 0, PI/2);
        fill(backCol);
        arc(p1[0]*sx, p1[1]*sy, 2*a*sx, 2*a*sy, 0, PI/2);
      } else if ((dir01 == "right" && dir12 == "down") || (dir01 == "up" && dir12 == "left")) {
        arc((p1[0]+1)*sx, p1[1]*sy, (2-2*a)*sx, (2-2*a)*sy, PI/2, PI);
        fill(backCol);
        arc((p1[0]+1)*sx, p1[1]*sy, 2*a*sx, 2*a*sy, PI/2, PI);
      } else if ((dir01 == "down" && dir12 == "left") || (dir01 == "right" && dir12 == "up")) {
        arc((p1[0]+1)*sx, (p1[1]+1)*sy, (2-2*a)*sx, (2-2*a)*sy, PI, 3*PI/2);
        fill(backCol);
        arc((p1[0]+1)*sx, (p1[1]+1)*sy, 2*a*sx, 2*a*sy, PI, 3*PI/2);
      } else {
        arc(p1[0]*sx, (p1[1]+1)*sy, (2-2*a)*sx, (2-2*a)*sy, 3*PI/2, TAU);
        fill(backCol);
        arc(p1[0]*sx, (p1[1]+1)*sy, 2*a*sx, 2*a*sy, 3*PI/2, TAU);
      }
    }
  }
  
  pop();
}