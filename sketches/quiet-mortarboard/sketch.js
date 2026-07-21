// Generative Artwork: Dynamic 3D Sculpture with Randomized Elements and Performance Optimization

let maxDepth = 4;
let angle = 0;
let colors;
let easingFunctions = [];
let time = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  noStroke();
  colors = [
    color(33, 150, 243), // Blue
    color(156, 39, 176), // Purple
    color(255, 193, 7),  // Amber
    color(76, 175, 80),  // Green
    color(244, 67, 54),  // Red
    color(255, 235, 59), // Yellow
  ];

  // Shuffle colors for more variation
  shuffleColors();

  // Initialize a list of easing functions
  easingFunctions = [
    Easing.easeInOutSine,
    Easing.easeInOutQuad,
    Easing.easeInOutCubic,
    Easing.easeInOutQuart,
    Easing.easeInOutQuint,
    Easing.easeInOutExpo,
    Easing.easeInOutCirc,
    Easing.easeInOutBack,
    Easing.easeInOutElastic,
    Easing.easeInOutBounce,
  ];
}

function draw() {
  background(20);
  orbitControl();
  ambientLight(100);
  pointLight(255, 255, 255, 0, -height / 2, 200);

  angle += 0.01;
  time += 0.005;

  push();
  rotateY(angle);
  rotateX(angle / 2);
  recursiveShape(0, 0, 0, height / 2, 0);
  pop();
}

function recursiveShape(x, y, z, size, depth) {
  if (depth > maxDepth) return;

  push();
  translate(x, y, z);

  // Select an easing function randomly for more variation
  let easingFunction = easingFunctions[int(random(easingFunctions.length))];
  let t = random(); // Use random value for more variation
  let easedT = easingFunction(t);

  // Apply transformations
  rotateX(easedT * PI * 2);
  rotateY(easedT * PI * 2);
  rotateZ(easedT * PI * 2);

  // Randomize shape and color
  fill(colors[int(random(colors.length))]);

  let shapeType = int(random(3));

  if (shapeType === 0) {
    box(size * easedT);
  } else if (shapeType === 1) {
    sphere(size * easedT, 24, 16);
  } else {
    torus(size * easedT * 0.5, size * easedT * 0.2, 24, 16);
  }

  // Recursive calls with fewer children to reduce object count
  if (depth < maxDepth) {
    let newSize = size * 0.5;
    // Reduce the number of offsets for fewer objects
    let offsets = [
      createVector(newSize, newSize, newSize),
      createVector(-newSize, -newSize, -newSize),
    ];

    for (let offset of offsets) {
      recursiveShape(offset.x, offset.y, offset.z, newSize, depth + 1);
    }
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Shuffle the colors array for variation
function shuffleColors() {
  for (let i = colors.length - 1; i > 0; i--) {
    let j = int(random(i + 1));
    let temp = colors[i];
    colors[i] = colors[j];
    colors[j] = temp;
  }
}

// Easing functions
class Easing {
  static easeInOutSine(x) {
    return -(cos(PI * x) - 1) / 2;
  }

  static easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2;
  }

  static easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
  }

  static easeInOutQuart(x) {
    return x < 0.5 ? 8 * x * x * x * x : 1 - pow(-2 * x + 2, 4) / 2;
  }

  static easeInOutQuint(x) {
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - pow(-2 * x + 2, 5) / 2;
  }

  static easeInOutExpo(x) {
    return x === 0
      ? 0
      : x === 1
      ? 1
      : x < 0.5
      ? pow(2, 20 * x - 10) / 2
      : (2 - pow(2, -20 * x + 10)) / 2;
  }

  static easeInOutCirc(x) {
    return x < 0.5
      ? (1 - sqrt(1 - pow(2 * x, 2))) / 2
      : (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2;
  }

  static easeInOutBack(x) {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return x < 0.5
      ? (pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
      : (pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
  }

  static easeInOutElastic(x) {
    const c5 = (2 * PI) / 4.5;
    return x === 0
      ? 0
      : x === 1
      ? 1
      : x < 0.5
      ? -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2
      : (pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5)) / 2 + 1;
  }

  static easeInOutBounce(x) {
    return x < 0.5
      ? (1 - Easing.easeOutBounce(1 - 2 * x)) / 2
      : (1 + Easing.easeOutBounce(2 * x - 1)) / 2;
  }

  static easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
      return n1 * x * x;
    } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
  }
}
