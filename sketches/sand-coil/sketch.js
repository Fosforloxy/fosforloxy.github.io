let a, b, c;

function setup() {
    createCanvas(600, 600, WEBGL);
    
    // Randomize parameters a, b, and c
    a = random(0.5, 3);
    b = random(0.5, 3);
    c = random(0.5, 3);
}

function draw() {
    background(200);
    
    let rotateSpeed = 0.01;
    
    // Rotation using quaternions (p5.js uses quaternions under the hood in rotate function)
    rotateX(frameCount * rotateSpeed);
    rotateY(frameCount * rotateSpeed);
    
    // Drawing the knot
    beginShape();
    for (let t = 0; t < TWO_PI; t += 0.1) {
        let x = sin(a * t) + 2 * sin(b * t);
        let y = cos(a * t) - 2 * cos(b * t);
        let z = -sin(c * t);
        vertex(x * 50, y * 50, z * 50);
    }
    endShape(CLOSE);
}

// Function for user interaction
function mouseDragged() {
    // Modify parameters a, b, and c based on mouse position
    a = map(mouseX, 0, width, 0.5, 3);
    b = map(mouseY, 0, height, 0.5, 3);
    c = map(mouseX + mouseY, 0, width + height, 0.5, 6);
}
