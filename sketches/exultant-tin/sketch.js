let agents = [];
let numAgents = 30; // Number of agents
let minTerritoryRadius = 5; // Minimum initial territory radius
let maxTerritoryRadius = 10; // Maximum initial territory radius
let territoryChangeOnFight = 1; // Change in territory size after a fight

class Agent {
  constructor(x, y, color) {
    this.pos = createVector(x, y);
    this.color = color;
    this.territoryRadius = random(minTerritoryRadius, maxTerritoryRadius);
  }

  move() {
    let randomAngle = random(TWO_PI);
    this.pos.x += cos(randomAngle);
    this.pos.y += sin(randomAngle);
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
    let x = random(width);
    let y = random(height);
    let color = [random(255), random(255), random(255)];
    agents.push(new Agent(x, y, color));
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
