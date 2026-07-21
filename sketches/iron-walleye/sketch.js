let spheres = [];
const sphereCount = 3;
let t = 0; // time variable for evolution

function setup() {
  createCanvas(800, 800, WEBGL); // Enable WEBGL mode
  colorMode(HSB, 360, 100, 100, 100);
  background(0);
  
  for (let i = 0; i < sphereCount; i++) {
    spheres.push({
      x: random(-width/2 + 100, width/2 - 100), 
      y: random(-height/2 + 100, height/2 - 100), 
      z: random(-width/2 + 100, width/2 - 100), 
      r: random(60, 120),
      rotation: {x: random(TWO_PI), y: random(TWO_PI), z: random(TWO_PI)} // random rotation angles
    });
  }
}

function draw() {
  background(0);
  ambientLight(100);
  pointLight(frameCount % 255, 255, 255, mouseX - width / 2, mouseY - height / 2, 200);

  rotateX(sin(frameCount * 0.01) * PI); // Rotate the whole canvas
  rotateY(sin(frameCount * 0.01) * PI);
  
  for(let i = 0; i < spheres.length; i++) {
    let sphere = spheres[i];
    
    // Change Sphere size over time, but cap at 200
    if (sphere.r < 200) {
      sphere.r += sin(frameCount * 0.01) * 2;
    }

    for (let lat = 0; lat <= PI; lat += PI/50) {
      for(let rot = 0; rot < 2; rot++) {
        push();
        if(rot == 1) {
          rotateX(sphere.rotation.x); // Rotate on random plane
          rotateY(sphere.rotation.y);
          rotateZ(sphere.rotation.z);
        }
        beginShape();
        for (let lon = 0; lon <= TWO_PI; lon += PI/50) {
          let hue = noise(t) * 360; // Modified Color Mapping
          let alpha = map(sin(frameCount * 0.01), -1, 1, 20, 100); // Modified Alpha Mapping
          stroke(hue, 100, 100, alpha);
          strokeWeight(random(1, 3)); // Randomized Stroke Weight

          let r = sphere.r; // Constant radius
          let x = sphere.x + r * sin(lat) * cos(lon);
          let y = sphere.y + r * sin(lat) * sin(lon);
          let z = sphere.z + r * cos(lat);
          vertex(x, y, z);
        }
        endShape(CLOSE);
        pop();
      }
    }
  }

  t += 0.01; // Increment the time
  
  // Increase Sphere Count Dynamically
  if (frameCount % 60 == 0 && spheres.length < 10) { 
    spheres.push({
      x: random(-width/2 + 100, width/2 - 100), 
      y: random(-height/2 + 100, height/2 - 100), 
      z: random(-width/2 + 100, width/2 - 100), 
      r: random(60, 120),
      rotation: {x: random(TWO_PI), y: random(TWO_PI), z: random(TWO_PI)}
    });
  }
}
