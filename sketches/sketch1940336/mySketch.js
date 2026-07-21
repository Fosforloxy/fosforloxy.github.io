let poles = [];
let wires = [];
const polesNum = 200;
const polesHeight = 60;
const radius = 300;
const viewAngle = -0.5;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  poles = Array(polesNum).fill().map(e=>{
    const r = random(2 * PI);
    const d = random(2) < 1 
    ? random(radius*.7, radius*.9) 
    : random(radius*1.1, radius*1.2);
    const pos = createVector(cos(r) * d, sin(r) * d);
    return pos;
  })

  for (let i = polesNum; i--; ) {
    const current = poles[i];
    for (let j = i; j--; ) {
      const other = poles[j];
      const delta = other.copy().sub(current);
      const dst = delta.mag();

      if (!poles.some((any) => 
        dst > any.dist(current) && dst > any.dist(other))
      ) {
        const pos = current.copy().add(other).div(2);
        const length = current.dist(other);
        const angle = atan2(other.y - current.y, other.x - current.x);
        wires.push({ pos, length, angle });
      }
    }
  }
}

function draw() {
  background('white');

// Railway track
  noFill();
  stroke('black')
  torus(radius*1.05, 1);
  torus(radius*0.95, 1);

// Railway sleepers
  fill('white');
  stroke('black')
  for (r = 0; r < 2 * PI; r += 0.06) {
    push();
    rotateZ(r);
    translate(radius*.995, 0, 0);
    box(radius*0.15, 5, 2);
    pop();
  }

// Poles
  fill('white');
  stroke('black')
  for (p of poles) {
    push();
    translate(p.x, p.y, polesHeight / 2);
    box(2, 2, polesHeight);
    pop();
  }
  
// Wires
  fill('black');
  noStroke();
  for (w of wires) {
    push();
    translate(w.pos);
    translate(0, 0, polesHeight * 0.95);
    rotate(w.angle);
    box(w.length, 1, 1);
    pop();
  }

// Camera setting
  const t = frameCount / 150;
  camera(
    cos(t) * radius, sin(t) * radius, radius/3,
    cos(t + viewAngle) * radius, sin(t + viewAngle) * radius, 0,
    0, 0,-1
  );
}
