let cubes = [];
const sphereRadius = 350;
const minSize = 30;
const maxSize = 60;
const gridResolution = 300;
const maxCubes = 1500;
let color1, color2;

// Initialize the 3D grid
let grid = new Array(gridResolution).fill(null).map(() =>
  new Array(gridResolution).fill(null).map(() =>
    new Array(gridResolution).fill(false)
  )
);

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noiseDetail(8, 0.5);
  color1 = color(random(255), random(255), random(255));
  color2 = color(random(255), random(255), random(255));
}

function draw() {
  background(200);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);

  // Draw the rectangular prisms
  for (const cube of cubes) {
    push();
    translate(cube.x, cube.y, cube.z);
    fill(cube.cubeColor);
    box(cube.sizeX, cube.sizeY, cube.sizeZ);
    pop();
  }

  if (cubes.length < maxCubes) {
    for (let i = 0; i < 10; i++) {
      addRectangularPrism();
    }
  }
}

function addRectangularPrism() {
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
            grid[i + x][j + y][k + z] = true;
          }
        }
      }

      const noiseValue = noise(i / 100, j / 100, k / 100);
      let baseColor;

      if (noiseValue < 0.4) {
        baseColor = color1;
      } else {
        baseColor = color2;
      }

      // Create a similar shade of the chosen base color
      let cubeColor = color(
        red(baseColor) + random(-20, 20),
        green(baseColor) + random(-20, 20),
        blue(baseColor) + random(-20, 20)
      );

      cubes.push({ x, y, z, cubeColor, sizeX, sizeY, sizeZ });
    }
  }
}
