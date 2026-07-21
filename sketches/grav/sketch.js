class CelestialBody {
  constructor(parent = null, isStar = false) {
    this.cubes = [];
    this.color1 = color(random(255), random(255), random(255));
    this.color2 = color(random(255), random(255), random(255));
    this.grid = new Array(gridResolution).fill(null).map(() =>
      new Array(gridResolution).fill(null).map(() =>
        new Array(gridResolution).fill(false)
      )
    );
    this.sizeFactor = random(0.25, 1.75);
    this.collisionRadius = sphereRadius * this.sizeFactor;
    this.parent = parent;
    this.isStar = isStar;
    this.hasRing = false;
    this.mass = isStar ? 1000 : random(10, 50);
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    
    if (!isStar) {
      const initialVelocity = random(1, 3);
      this.orbitRadius = random(minOrbit, maxOrbit);
      this.orbitSpeed = random(minSpeed, maxSpeed);
      this.orbitAngle = random(TWO_PI);
      this.vx = -initialVelocity * sin(this.orbitAngle);
      this.vy = initialVelocity * cos(this.orbitAngle);
       this.x = this.orbitRadius * cos(this.orbitAngle);
  this.y = this.orbitRadius * sin(this.orbitAngle);
      if (random(1) < 0.1) this.hasRing = true;
    }

    if (isStar) {
      this.sizeFactor = random(2, 3);
      this.collisionRadius = sphereRadius * this.sizeFactor;
      this.color1 = color(255, 204, 0);
      this.color2 = color(255, 204, 0);
    }

    this.rotateYAngle = random(TWO_PI);
    this.rotateYSpeed = random(0.01, 0.03);
    // ... rest of the constructor code ...
  }

  
  
  calculateGravitationalForce(other) {
    const G = 1;
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const r = sqrt(dx * dx + dy * dy);
    const F = (G * this.mass * other.mass) / (r * r);
    const angle = atan2(dy, dx);
    const Fx = F * cos(angle);
    const Fy = F * sin(angle);
    return { Fx, Fy };
  }

  updateAcceleration(bodies) {
    this.ax = 0;
    this.ay = 0;
    for (const body of bodies) {
      if (body !== this) {
        const { Fx, Fy } = this.calculateGravitationalForce(body);
        this.ax += Fx / this.mass;
        this.ay += Fy / this.mass;
      }
    }
  }

  updateVelocityAndPosition(dt) {
    this.vx += this.ax * dt;
    this.vy += this.ay * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

draw() {
  push();
  if (this.parent && !this.isStar) {
    console.log('x:', this.x, 'y:', this.y); // Log the values
    translate(this.x, this.y, 0); // Use 0 for z
  } else {
    console.log('Star x:', this.x, 'y:', this.y); // Log the values for the star
    translate(this.x, this.y, this.z);
  }

  rotateY(this.rotateYAngle);
  scale(this.sizeFactor);
  if (this.hasRing) {
    rotateX(PI / 4);
    noFill();
    stroke(ringColor);
    ellipse(0, 0, this.collisionRadius + ringWidth);
  }
  for (const cube of this.cubes) {
    push();
    translate(cube.x, cube.y, cube.z);
    fill(cube.cubeColor);
    box(cube.sizeX, cube.sizeY, cube.sizeZ);
    pop();
  }
  if (this.cubes.length < maxCubes) {
    for (let i = 0; i < 10; i++) {
      this.addRectangularPrism();
    }
  }
  this.rotateYAngle += this.rotateYSpeed;
  pop();
}


 addRectangularPrism() {
    const sizeX = random(minSize, maxSize);
    const sizeY = random(minSize, maxSize);
    const sizeZ = random(minSize, maxSize);

    const i = floor(random(gridResolution));
    const j = floor(random(gridResolution));
    const k = floor(random(gridResolution));

    const cellsX = ceil(sizeX / (sphereRadius * 2) * gridResolution);
    const cellsY = ceil(sizeY / (sphereRadius * 2) * gridResolution);
    const cellsZ = ceil(sizeZ / (sphereRadius * 2) * gridResolution);

    if (i + cellsX <= gridResolution && j + cellsY <= gridResolution && k + cellsZ <= gridResolution) {
      const x = map(i, 0, gridResolution, -sphereRadius, sphereRadius);
      const y = map(j, 0, gridResolution, -sphereRadius, sphereRadius);
      const z = map(k, 0, gridResolution, -sphereRadius, sphereRadius);

      if (
        dist(0, 0, 0, x + sizeX / 2, y, z) < sphereRadius &&
        dist(0, 0, 0, x - sizeX / 2, y, z) < sphereRadius &&
        dist(0, 0, 0, x, y + sizeY / 2, z) < sphereRadius &&
        dist(0, 0, 0, x, y - sizeY / 2, z) < sphereRadius &&
        dist(0, 0, 0, x, y, z + sizeZ / 2) < sphereRadius &&
        dist(0, 0, 0, x, y, z - sizeZ / 2) < sphereRadius
      ) {
        for (let x = 0; x < cellsX; x++) {
          for (let y = 0; y < cellsY; y++) {
            for (let z = 0; z < cellsZ; z++) {
              this.grid[i + x][j + y][k + z] = true;
            }
          }
        }

        const noiseValue = noise(i / 100, j / 100, k / 100);
        let baseColor;

        if (noiseValue < 0.4) {
          baseColor = this.color1;
        } else {
          baseColor = this.color2;
        }

        let cubeColor = color(
          red(baseColor) + random(-20, 20),
          green(baseColor) + random(-20, 20),
          blue(baseColor) + random(-20, 20)
        );

        this.cubes.push({ x, y, z, cubeColor, sizeX, sizeY, sizeZ });
      }
    }
  }

}

// Global variables
let centralStar;
let celestialBodies = [];
let cameraRotationX = 0;
const sphereRadius = 70;
const minSize = 15;
const maxSize = 20;
const gridResolution = 50;
const maxCubes = 100;
const minOrbit = 400;
const maxOrbit = 800;
const ringWidth = 50;
const minSpeed = 0.05;
const maxSpeed = 0.02;
let zoom = -700;
let cameraRotation = 0;
let ringColor;
const dt = 1; // Time step for the simulation

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noiseDetail(8, 0.5);
  ringColor = color(255, 255, 255);
  centralStar = new CelestialBody(null, true);
  celestialBodies.push(centralStar);
}

function draw() {
  background(200);
  if (keyIsDown(87)) zoom += 50;
  else if (keyIsDown(83)) zoom -= 50;
  else if (keyIsDown(LEFT_ARROW)) cameraRotation -= 0.05;
  else if (keyIsDown(RIGHT_ARROW)) cameraRotation += 0.05;
  if (keyIsDown(UP_ARROW)) cameraRotationX += 0.05;
  else if (keyIsDown(DOWN_ARROW)) cameraRotationX -= 0.05;
  translate(0, 0, zoom);
  rotateX(cameraRotationX);
  rotateY(cameraRotation);
  for (const body of celestialBodies) {
    body.updateAcceleration(celestialBodies);
    body.updateVelocityAndPosition(dt);
  }
  for (const body of celestialBodies) {
    body.draw();
  }
}

function keyPressed() {
  if (keyCode === 32) {
    const newBody = new CelestialBody(centralStar);
    celestialBodies.push(newBody);
  }
}
