let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  background(20);
  particles.forEach(particle => {
    particle.update();
    particle.display();
  });
}

class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D();
    this.size = random(5, 15);
  }
  
  update() {
    this.pos.add(this.vel);
    let mouse = createVector(mouseX, mouseY);
    let d = dist(mouseX, mouseY, this.pos.x, this.pos.y);
    if (d < 100) {
      let flee = p5.Vector.sub(this.pos, mouse);
      flee.setMag(10);
      this.pos.add(flee);
    }
    
    this.edges();
  }
  
  display() {
    noStroke();
    fill(255, 150);
    circle(this.pos.x, this.pos.y, this.size);
  }
  
  edges() {
    if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;
  }
}
