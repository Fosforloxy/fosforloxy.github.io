let spheres = [];
const sphereCount = 3;
const sphereRadius = 120; // fixed radius
const sphereCenter = {x: 0, y: 0, z: 0}; // fixed center
let camZ = 500; // Fixed Camera position in Z axis

function setup() {
  createCanvas(800, 800, WEBGL); // Enable WEBGL mode
  colorMode(HSB, 255, 255, 255, 1); // Use HSBA color mode
  background(200, 100, 100); // Fixed background color

  for (let i = 0; i < sphereCount; i++) {
    spheres.push({
      r: sphereRadius,
      rotation: {x: random(TWO_PI), y: random(TWO_PI), z: random(TWO_PI)} // random rotation angles
    });
  }
}

function draw() {
  // Adjust the camera position
  camera(0, 0, camZ, 0, 0, 0, 0, 1, 0);

  for(let i = 0; i < spheres.length; i++) {
    let sphere = spheres[i];

    // Add slow independent rotation
    sphere.rotation.x += 0.01;
    sphere.rotation.y += 0.01;
    sphere.rotation.z += 0.01;

    for (let lon = 0; lon <= TWO_PI; lon += PI/50) {
      push();
      rotateX(sphere.rotation.x); // Rotate on random plane
      rotateY(sphere.rotation.y);
      rotateZ(sphere.rotation.z);

      stroke((frameCount / 2 + i * 120) % 255, 255, 255, 0.5); // Color circles with a changing hue
      strokeWeight(1); // Constant Stroke Weight

      let r = sphere.r; // Constant radius
      let x = sphereCenter.x + r * cos(lon);
      let y = sphereCenter.y + r * sin(lon);
      let z = sphereCenter.z;
      point(x, y, z);

      // Occasionally leave a static dot behind
      if (random() < 0.0001) {
        stroke((frameCount / 2 + i * 120) % 255, 255, 255, 1);
        point(x, y, z);
      }

      pop();
    }
  }
}
