let spheres = [];
const sphereCount = 3;
const sphereRadius = [100, 120, 130, 110, 140, 150]; //Random radius for each sphere
let camZ = 800;

function setup() {
  createCanvas(800, 800, WEBGL);
  colorMode(HSB, 255, 255, 255, 1);
  background(200, 100, 100);

  let baseHues = [0, 30, 125, 180, 240, 300];

  let colorSchemes = [
    [baseHues[0], (baseHues[0]+30)%255],
    [baseHues[1], (baseHues[1]+30)%255],
    [baseHues[2], (baseHues[2]+180)%255],
    [baseHues[3], (baseHues[3]+150)%255, (baseHues[3]+210)%255],
    [baseHues[4], (baseHues[4]+120)%255, (baseHues[4]+240)%255],
    [baseHues[5], (baseHues[5]+90)%255, (baseHues[5]+180)%255, (baseHues[5]+270)%255]
  ];

  let offsets = [{x: 0, y: 0, z: 0},
                 {x: 0, y: 0, z: 0},
                 {x: 0, y: 0, z: 0},
                 {x: 0, y: 0, z: 0},
                 {x: 0, y: 0, z: 0},
                 {x: 0, y: 0, z: 0}];

  for (let i = 0; i < sphereCount; i++) {
    spheres.push({
      x: offsets[i].x,
      y: offsets[i].y,
      z: offsets[i].z,
      r: sphereRadius[i], // random size for each sphere
      rotation: {x: random(TWO_PI), y: random(TWO_PI), z: random(TWO_PI)},
      colors: colorSchemes[i]
    });
  }
}

function draw() {
  camera(0, 0, camZ, 0, 0, 0, 0, 1, 0);

  for(let i = 0; i < spheres.length; i++) {
    let sphere = spheres[i];
    sphere.rotation.x += 0.25;
    sphere.rotation.y += 0.01;
    sphere.rotation.z += 0.01;

    for (let lon = 0; lon <= TWO_PI; lon += PI/5) {
      push();
      translate(sphere.x, sphere.y, sphere.z);
      rotateX(sphere.rotation.x);
      rotateY(sphere.rotation.y);
      rotateZ(sphere.rotation.z);

      let colorIndex = floor((lon / TWO_PI) * sphere.colors.length);
      let nextColorIndex = (colorIndex + 1) % sphere.colors.length;
      let amt = (lon % (TWO_PI * sphere.colors.length)) / (TWO_PI / sphere.colors.length);
      let c1 = color(sphere.colors[colorIndex], 255, 255, 25); // 50% less opacity
      let c2 = color(sphere.colors[nextColorIndex], 255, 255, 25);
      let c = lerpColor(c1, c2, amt);
      stroke(c);
      strokeWeight(100);

      let r = sphere.r;
      let x = r * cos(lon);
      let y = r * sin(lon);
      let z = 10;
      point(x, y, z);

      if (random() < 0.01) {  // increase the frequency
        stroke(sphere.colors[colorIndex], 255, 255, 0.5); // 50% less opacity
        point(x, y, z);
      }
      
      pop();
    }
  }
}
