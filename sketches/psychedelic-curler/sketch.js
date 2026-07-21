let agents = [];
let numAgents = 50; // Number of agents
let minTerritoryRadius = 5; // Minimum initial territory radius
let maxTerritoryRadius = 10; // Maximum initial territory radius
let territoryChangeOnFight = 1; // Change in territory size after a fight

let paths = [
  t => createVector(t, height / 2 + 100 * sin(t / 100)), // Sine wave path
  t => createVector(t, height / 2 + 100 * cos(t / 100)), // Cosine wave path
  t => createVector(width / 2 + 100 * sin(t / 100), height / 2 + 100 * cos(t / 100)), // Circular path
  t => createVector(t, t), // Diagonal path
  // Add more paths here...
];

class Agent {
  constructor(path, color) {
    this.path = path;
    this.color = color;
    this.territoryRadius = random(minTerritoryRadius, maxTerritoryRadius);
    this.t = 0; // Parameter for the path function
  }

  move() {
    this.pos = this.path(this.t);
    this.t++;
    if (this.t > width) {
      this.t = 0; // Reset the parameter when it exceeds the canvas width
    }
  }

  fight(other) {
    let distance = this.pos.dist(other.pos);
    if (distance < this.territoryRadius + other.territoryRadius) {
      let winner = random([this, other]);
      let loser = (winner === this) ? other : this;

      winner.territoryRadius += territoryChangeOnFight;
      loser.territoryRadius -= territoryChangeOnFight;
      if (loser.territoryRadius < 0) {
        loser.territoryRadius = 0;
      }
    }
  }

  draw() {
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.territoryRadius * 2);
    fill(255);
    ellipse(this.pos.x, this.pos.y, 10);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < numAgents; i++) {
    let path = paths[i % paths.length]; // Assign a path to the agent
    let color = [random(255), random(255), random(255)];
    agents.push(new Agent(path, color));
  }
}

function draw() {
  background(0);

  for (let agent of agents) {
    agent.move();
    agent.draw();
  }

  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      agents[i].fight(agents[j]);
    }
  }
}
