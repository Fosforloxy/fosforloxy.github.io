function setup() {
    createCanvas(400, 400, WEBGL);
}

function draw() {
    background(200);

    // Camera position (X, Y, Z)
    let camX = map(mouseX, 0, width, -200, 200);
    let camY = map(mouseY, 0, height, -200, 200);
    camera(camX, camY, (height/2) / tan(PI/6), 0, 0, 0, 0, 1, 0);

    // Create a 3D sphere and project it onto 2D space
    rotateX(frameCount * 0.01);
    rotateY(frameCount * 0.01);

    // 5-Point star pattern on the sphere
    beginShape();
    let radius = 100;
    for (let lat = 0; lat < PI; lat += PI/5) {
        for (let lon = 0; lon < TWO_PI; lon += PI/5) {
            let x = radius * sin(lat) * cos(lon);
            let y = radius * sin(lat) * sin(lon);
            let z = radius * cos(lat);
            vertex(x, y, z);
        }
    }
    endShape(CLOSE);

    // Draw the sphere
    noFill();
    stroke(0, 0, 255);
    strokeWeight(3);
    sphere(100);
}
