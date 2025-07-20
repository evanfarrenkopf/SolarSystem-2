"use strict";

function Solar(canvasID) {
    this.timeScale = 100;

    var t = this;  // save reference to this object for callbacks
    this.canvasID = canvasID;
    var canvas = this.canvas = document.getElementById(canvasID);
    if (!canvas) {
        alert("Canvas ID '" + canvasID + "' not found.");
        return;
    }

    var gl = this.gl = this.canvas.getContext("webgl2")
    if (!gl) {
        alert("WebGL isn't available in this browser");
        return;
    }

    var playButtonID = this.canvasID+"-playButton";
    var pauseButtonID = this.canvasID+"-pauseButton";
    var splitButtonID = this.canvasID+"-split";
    var mapButtonID = this.canvasID+"-map";
    var shipButtonID = this.canvasID+"-ship";
    var pathsButtonID = this.canvasID+"-paths";

    this.viewType = "SPLIT";
    this.playAnimation = false;
    this.showPaths = true;

    document.getElementById(playButtonID).addEventListener('click', function() {
        t.playAnimation = true;  // Assuming 'cube' is an instance of ColorCube
    });

    document.getElementById(pauseButtonID).addEventListener('click', function() {
        t.playAnimation = false;  // Assuming 'cube' is an instance of ColorCube
    });

    document.getElementById(splitButtonID).addEventListener('click', function() {
        t.viewType = "SPLIT";  // Set View to Split (Map  and Ship)
    });

    document.getElementById(mapButtonID).addEventListener('click', function() {
        t.viewType = "MAP";  // Set View to MAP
    });

    document.getElementById(shipButtonID).addEventListener('click', function() {
        t.viewType = "SHIP";  // Set View to SHIP
    });

    document.getElementById(pathsButtonID).addEventListener('click', function() {
        t.showPaths = !t.showPaths
    });

    // Compile and link shaders
    this.shaderProgram = initShaders(gl, "vShader.glsl", "fShader.glsl");

    // Create view port
    gl.viewport(0, 0, canvas.width, canvas.height);
    this.aspectRatio = canvas.width / canvas.height;
    if (this.aspectRatio > 1.0) {
        this.aspectScale = scale(1.0/this.aspectRatio, 1.0, 1.0);
    } else {
        this.aspectScale = scale(1.0, this.aspectRatio, 1.0);
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    // Enable hidden-surface removal (draw pixel closest to viewer)
    gl.enable(gl.DEPTH_TEST);

    if (this.shaderProgram === null) return;
    gl.useProgram(this.shaderProgram);

    // Creating and attaching planets
    this.planets = [];

    this.sun = new Planet(this.gl, this.shaderProgram, 8.0, 0, 0, 0, 0, 0, "textures/sun.bmp", true);
    this.mercury = new Planet(this.gl, this.shaderProgram, 1, 10, 100, 5, 0, 7, "textures/mercury.bmp", false);
    this.venus = new Planet(this.gl, this.shaderProgram, 2, 1, 50, 10, 2, 7, "textures/venus.bmp", false);
    this.earth = new Planet(this.gl, this.shaderProgram, 2.0, 200, 15, 15, 24, 7, "textures/earth.bmp", false);
    this.mars = new Planet(this.gl, this.shaderProgram, 2, 210, 50, 20, 25, 7, "textures/mars.bmp", false);
    this.jupiter = new Planet(this.gl, this.shaderProgram, 4, 500, 5, 30, 3, 7, "textures/jupiter.bmp", false);
    this.saturn = new Planet(this.gl, this.shaderProgram, 4, 110, 6, 40, 27, 7, "textures/saturn.bmp", false);
    this.uranus = new Planet(this.gl, this.shaderProgram, 3, 250, 2, 50, 82, 7, "textures/uranus.bmp", false);
    this.neptune = new Planet(this.gl, this.shaderProgram, 3, 260, 1, 60, 28, 7, "textures/neptune.bmp", false);
    
    // moons, using random textures
    this.earthMoon = new Planet(this.gl, this.shaderProgram, 0.5, 100, 100, 4, 7, 80, "textures/uranus.bmp", false);
    // jupiter moons
    this.jupiterIO = new Planet(this.gl, this.shaderProgram, 0.25, 100, 75, 2.5, 0, 40, "textures/jupiter.bmp", false);
    this.jupiterEuropa = new Planet(this.gl, this.shaderProgram, 0.5, 100, 100, 2, 0, 10, "textures/saturn.bmp", false);
    this.jupiterGan = new Planet(this.gl, this.shaderProgram, 0.75, 100, 125, 3, 0, 90, "textures/mercury.bmp", false);
    // Attach Moons
    // TODO: why are jupiter's moons appearing and not earth's?
    this.earth.attachMoon(this.earthMoon);

    this.jupiter.attachMoon(this.jupiterIO);
    this.jupiter.attachMoon(this.jupiterEuropa);
    this.jupiter.attachMoon(this.jupiterGan);

    this.sun.attachMoon(this.earth);
    this.sun.attachMoon(this.mercury);
    this.sun.attachMoon(this.venus);
    this.sun.attachMoon(this.mars);
    this.sun.attachMoon(this.jupiter);
    this.sun.attachMoon(this.saturn);
    this.sun.attachMoon(this.uranus);
    this.sun.attachMoon(this.neptune);

    // rings
    this.saturnRing = new Ring(this.gl, this.shaderProgram, 1.5, 2)
    // saturns ring
    this.saturn.attachRing(this.saturnRing);
    // ORBIT PATHS
    // mercury's
    this.sun.attachRing(new Ring(this.gl, this.shaderProgram, 5, 5.1));
    // venus's
    this.sun.attachRing(new Ring(this.gl, this.shaderProgram, 10, 10.1));
    // earth's
    this.sun.attachRing(new Ring(this.gl, this.shaderProgram, 15, 15.1));
    // mars's
    this.sun.attachRing(new Ring(this.gl, this.shaderProgram, 20, 20.1));
    // jupiter
    this.sun.attachRing(new Ring(this.gl, this.shaderProgram, 30, 30.1));
    // saturn
    this.sun.attachRing(new Ring(this.gl, this.shaderProgram, 40, 40.1));
    // uranus
    this.sun.attachRing(new Ring(this.gl, this.shaderProgram, 50, 50.1));
    // neptune
    this.sun.attachRing(new Ring(this.gl, this.shaderProgram, 60, 60.1));

    this.planets.push(this.sun);
    this.planets.push(this.earth);
    this.planets.push(this.mercury);
    this.planets.push(this.mars);
    this.planets.push(this.venus);
    this.planets.push(this.saturn);
    this.planets.push(this.neptune);
    this.planets.push(this.uranus);
    this.planets.push(this.jupiter);

    // add ship
    this.ship = new Ship(this.gl, this.shaderProgram);

    window.addEventListener('keydown', (event) => {
         switch(event.key.toLowerCase()) {
            case 'z': this.ship.moveForward(); break;
            case 'x': this.ship.moveBackward(); break;
            case 'a': this.ship.moveRight(); break;
            case 'd': this.ship.moveLeft(); break;
            case 'w': this.ship.moveUp(0.5); break;
            case 's': this.ship.moveUp(-0.5); break;
            case 'q': this.ship.rotate(5); break;
            case 'e': this.ship.rotate(-5); break;
        }
    });

    window.addEventListener

    var animate = function () {
        t.Animate();
    }

    requestAnimationFrame(animate);
    
}

Solar.prototype.Render = function(){

    var gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var canvas = this.canvas;
    var width = canvas.width;
    var height = canvas.height;
    var halfHeight = height / 2;

    var near = 0.1;
    var far = 1000;

    if (this.viewType == "SPLIT"){
        // TOP VIEW map
        gl.viewport(0, halfHeight, width, halfHeight); // top half of canvas

        // Orthographic projection for map view
        var orthoSize = 40;  // adjust as needed
        var aspect = width / halfHeight;  // width / height of top half
        var orthoWidth = orthoSize * aspect;
        var projectionMatTop = ortho(-orthoWidth, orthoWidth, -orthoSize, orthoSize, near, far);

        var eyeTop = vec3(0, 40, 0);       // looking down from above
        var centerTop = vec3(0, 0, 0);      // looking at the origin
        var upTop = vec3(0, 0, -1);          // +Y is up

        var viewMatTop = lookAt(eyeTop, centerTop, upTop);

        this.sun.Render(mat4(), viewMatTop, projectionMatTop, this.showPaths);
        this.ship.Render(viewMatTop, projectionMatTop);

        // BOTTOM VIEW ship camera
        gl.viewport(0, 0, width, halfHeight); // bottom half of canvas

        var fov = 90;
        var aspect = width / halfHeight;  // aspect ratio for half-height view
        var projectionMatBottom = perspective(fov, aspect, near, far);

        var viewMatBottom = this.ship.viewMatrix();
        // var vpBottom = mult(projectionMatBottom, viewMatBottom);

        this.sun.Render(mat4(), viewMatBottom, projectionMatBottom, this.showPaths);

    } else if (this.viewType == "MAP"){
        // MAP ONLY
        gl.viewport(0, 0, width, height); // top half of canvas

        // Orthographic projection for map view
        var orthoSize = 40;  // adjust as needed
        var aspect = width / height;  // width / height of top half
        var orthoWidth = orthoSize * aspect;
        var projectionMatTop = ortho(-orthoWidth, orthoWidth, -orthoSize, orthoSize, near, far);

        var eyeTop = vec3(0, 40, 0);       // looking down from above
        var centerTop = vec3(0, 0, 0);      // looking at the origin
        var upTop = vec3(0, 0, -1);          // +Y is up

        var viewMatTop = lookAt(eyeTop, centerTop, upTop);

        this.sun.Render(mat4(), viewMatTop, projectionMatTop, this.showPaths);
        this.ship.Render(viewMatTop, projectionMatTop);

    } else if (this.viewType == "SHIP"){
        // BOTTOM VIEW ship camera
        gl.viewport(0, 0, width, height); // bottom half of canvas

        var fov = 90;
        var aspect = width / height;  // aspect ratio for half-height view
        var projectionMatBottom = perspective(fov, aspect, near, far);

        var viewMatBottom = this.ship.viewMatrix();

        this.sun.Render(mat4(), viewMatBottom, projectionMatBottom, this.showPaths);
    }
};
    

Solar.prototype.Animate = function() {
    if (this.playAnimation){
        for (var p of this.planets){
            p.rotateDay += p.dayPeriod/this.timeScale;
            p.rotateYear += p.yearPeriod/this.timeScale;
        }
    };

    this.Render();
    requestAnimationFrame(() => this.Animate());
}