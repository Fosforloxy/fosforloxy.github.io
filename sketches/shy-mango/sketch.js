let gridSize = 20;
let cellSize = 20;
let grid, nextGrid, energy, environment;
let neighborOffsets = [];
let angleX = 0, angleY = 0, zoom = 500;
let graphics;
let gui;

const maxStates = 10;

let params = {
  updateSpeed: 10,
  gridSize: 20,
  birthConditions: '5',
  survivalConditions: '4,5',
  initialDensity: 0.1,
  automataType: 'Conway',
  numStates: 3,
  conversionThreshold: 3,
  randomizeGrid: randomizeGrid,
  resetGrid: function() {
    initGrids();
    initNeighborOffsets();
    randomizeGrid();
    initEnergyGrid();
    initEnvironment();
  },
  resetAutomaton: function() {
    this.resetGrid();
    if (this.automataType === 'Conway') {
      initAgeColors();
    } else if (this.automataType === 'RPS') {
      initStateColors();
      initRenderStates();
    }
  },
  renderStates: []
};

params.birthConditionsArray = parseConditionString(params.birthConditions);
params.survivalConditionsArray = parseConditionString(params.survivalConditions);

let ageColors = {};
let stateColors = {};

function setup() {
  createCanvas(800, 800, WEBGL);
  graphics = createGraphics(width, height, WEBGL);
  frameRate(params.updateSpeed);
  colorMode(HSB, 360, 255, 255);
  graphics.colorMode(HSB, 360, 255, 255);

  if (params.automataType === 'Conway') {
    initAgeColors();
  } else if (params.automataType === 'RPS') {
    initStateColors();
    initRenderStates();
  }

  initGrids();
  initNeighborOffsets();
  initEnergyGrid();
  initEnvironment();
  randomizeGrid();
  setupGUI();
}

function draw() {
  frameRate(params.updateSpeed);
  graphics.push();
  graphics.background(0);
  graphics.rotateX(angleX);
  graphics.rotateY(angleY);
  graphics.translate(-gridSize * cellSize / 2, -gridSize * cellSize / 2, -zoom);

  graphics.ambientLight(100);
  graphics.directionalLight(255, 255, 255, 0, 0, -1);

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        let idx = index(x, y, z);
        let state = grid[idx];
        let glow = energy[idx] / maxStates;
        let envEffect = environment[idx];

        let c = state > 0 ? ageColors[state] : null;

        if (c) {
          graphics.push();
          graphics.translate(x * cellSize, y * cellSize, z * cellSize);
          graphics.emissiveMaterial(
            c.levels[0] * envEffect,
            c.levels[1] * envEffect,
            c.levels[2] * envEffect,
            glow * 255
          );
          graphics.box(cellSize * 0.9);
          graphics.pop();
        }
      }
    }
  }

  graphics.pop();
  image(graphics, -width / 2, -height / 2);
  computeNextGeneration();
}

function keyPressed() {
  let angleStep = PI / 16;
  let zoomStep = 50;
  if (keyCode === LEFT_ARROW) angleY -= angleStep;
  if (keyCode === RIGHT_ARROW) angleY += angleStep;
  if (keyCode === UP_ARROW) angleX -= angleStep;
  if (keyCode === DOWN_ARROW) angleX += angleStep;
  if (key === 'w' || key === 'W') zoom = max(100, zoom - zoomStep);
  if (key === 's' || key === 'S') zoom = min(2000, zoom + zoomStep);
}

function mousePressed() {
  let mx = floor(map(mouseX, 0, width, 0, gridSize));
  let my = floor(map(mouseY, 0, height, 0, gridSize));
  let idx = index(mx, my, floor(gridSize / 2));
  grid[idx] = grid[idx] === 0 ? 1 : 0;
  energy[idx] = grid[idx] === 1 ? 10 : 0;
}

function initGrids() {
  gridSize = params.gridSize;
  let totalCells = gridSize * gridSize * gridSize;
  grid = new Array(totalCells).fill(0);
  nextGrid = new Array(totalCells).fill(0);
}

function initEnergyGrid() {
  let totalCells = gridSize * gridSize * gridSize;
  energy = new Array(totalCells).fill(0);
}

function initEnvironment() {
  let totalCells = gridSize * gridSize * gridSize;
  environment = new Array(totalCells).fill(1);
}

function randomizeGrid() {
  for (let i = 0; i < grid.length; i++) {
    grid[i] = random() < params.initialDensity ? 1 : 0;
    energy[i] = grid[i] === 1 ? 10 : 0;
  }
}

function computeNextGeneration() {
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        let idx = index(x, y, z);
        let neighbors = countNeighbors(x, y, z);
        let state = grid[idx];
        let env = environment[idx];

        if (state > 0) {
          if (params.survivalConditionsArray.includes(neighbors)) {
            nextGrid[idx] = Math.min(state + 1, maxStates);
            energy[idx] = min(energy[idx] + env, maxStates);
          } else {
            nextGrid[idx] = 0;
            energy[idx] = 0;
          }
        } else {
          if (params.birthConditionsArray.includes(neighbors)) {
            nextGrid[idx] = 1;
            energy[idx] = 10 * env;
          } else {
            nextGrid[idx] = 0;
            energy[idx] = max(0, energy[idx] - 1);
          }
        }
      }
    }
  }

  [grid, nextGrid] = [nextGrid, grid];
}

function index(x, y, z) {
  return (
    ((x + gridSize) % gridSize) +
    (((y + gridSize) % gridSize) * gridSize) +
    (((z + gridSize) % gridSize) * gridSize * gridSize)
  );
}

function countNeighbors(x, y, z) {
  let count = 0;
  for (let offset of neighborOffsets) {
    let idx = index(x + offset.dx, y + offset.dy, z + offset.dz);
    if (grid[idx] > 0) count++;
  }
  return count;
}

function setupGUI() {
  gui = new dat.GUI();
  gui.add(params, 'updateSpeed', 1, 60).name('Update Speed');
  gui.add(params, 'gridSize', 10, 50, 1).name('Grid Size').onChange(params.resetGrid);
  gui.add(params, 'initialDensity', 0, 1).name('Initial Density');
  gui.add(params, 'birthConditions').name('Birth Conditions').onFinishChange((value) => {
    params.birthConditionsArray = parseConditionString(value);
  });
  gui.add(params, 'survivalConditions').name('Survival Conditions').onFinishChange((value) => {
    params.survivalConditionsArray = parseConditionString(value);
  });
  gui.add(params, 'automataType', ['Conway', 'RPS']).name('Automaton Type').onChange(params.resetAutomaton);
}

function parseConditionString(value) {
  return value.split(',').map(Number).filter(n => !isNaN(n));
}

function initAgeColors() {
  for (let i = 1; i <= maxStates; i++) {
    ageColors[i] = color(map(i, 1, maxStates, 0, 360), 255, 255);
  }
}

function initStateColors() {
  for (let i = 0; i < params.numStates; i++) {
    stateColors[i] = color(map(i, 0, params.numStates, 0, 360), 255, 255);
  }
}

function initRenderStates() {
  params.renderStates = Array(params.numStates).fill(true);
}

function initNeighborOffsets() {
  neighborOffsets = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx !== 0 || dy !== 0 || dz !== 0) {
          neighborOffsets.push({ dx, dy, dz });
        }
      }
    }
  }
}
