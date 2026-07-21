let cellSize = 5;
let cols, rows;
let grid, nextGrid;

function setup() {
  createCanvas(800, 800);
  cols = floor(width / cellSize);
  rows = floor(height / cellSize);
  grid = make2DArray(cols, rows);
  nextGrid = make2DArray(cols, rows);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = floor(random(2));
    }
  }
}

function draw() {
  background(0);
  generate();
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if ((grid[i][j] == 1)) fill(0);
      else fill(255);
      stroke(0);
      rect(i * cellSize, j * cellSize, cellSize - 1, cellSize - 1);
    }
  }
}

function make2DArray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
  }
  return arr;
}

function generate() {
  for (let x = 1; x < cols - 1; x++) {
    for (let y = 1; y < rows - 1; y++) {
      let neighbors = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          neighbors += grid[x+i][y+j];
        }
      }
      neighbors -= grid[x][y];
      if (neighbors > 4) nextGrid[x][y] = 1;
      else if (neighbors < 4) nextGrid[x][y] = 0;
      else nextGrid[x][y] = grid[x][y];
    }
  }
  let temp = grid;
  grid = nextGrid;
  nextGrid = temp;
}
