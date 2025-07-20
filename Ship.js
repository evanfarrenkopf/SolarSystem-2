function Ship(gl, shaderProgram) {
    this.gl = gl;
    this.shaderProgram = shaderProgram;

    this.position = vec3(0, 1, 10);

    this.yaw = 180;

    // Triangle geometry
    this.shipArray = new Float32Array([
        0.0,  0.0, 0.0,  0.0, 1.0, 0.0, // Tip
       -0.75, 0.0, -2,  0.0, 1.0, 0.0, // Left
        0.71, 0.0, -2,  0.0, 1.0, 0.0,  // Right
    ]);

    // Create interleaved buffer
    this.shipBuffer = gl.createBuffer();
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // attribute locations
    this.vPosition = gl.getAttribLocation(shaderProgram, "vPosition");
    this.vNormal = gl.getAttribLocation(shaderProgram, "vNormal");

    // unifrom locations
    this.uModel = gl.getUniformLocation(shaderProgram, "modelMat");
    this.uView =  gl.getUniformLocation(shaderProgram, "viewMat");
    this.uProj =  gl.getUniformLocation(shaderProgram, "projectionMat");


    // Bind buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.shipBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.shipArray, gl.STATIC_DRAW);

    const stride = 6 * 4;

    gl.vertexAttribPointer(this.vPosition, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.vPosition);

    gl.vertexAttribPointer(this.vNormal, 3, gl.FLOAT, false, stride, 3 * 4);
    gl.enableVertexAttribArray(this.vNormal);

    this.ambientFactor = gl.getUniformLocation(shaderProgram, "ambientFactor");
    this.uEmissive = gl.getUniformLocation(shaderProgram, "emissive");

    // Unbind VAO and buffer
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Uniform Location
    this.transformMat = gl.getUniformLocation(shaderProgram, "transformMat");
}

// movement
Ship.prototype.moveBackward = function() {
    const rad = radians(this.yaw);
    const forward = vec3(Math.sin(rad), 0, Math.cos(rad));
    this.position = add(this.position, forward);
};

Ship.prototype.moveForward = function() {
    const rad = radians(this.yaw);
    const forward = vec3(Math.sin(rad)*-1, 0, Math.cos(rad)*-1);
    this.position = add(this.position, forward);
}

Ship.prototype.moveUp = function(delta) {
    const tran = vec3(0, delta, 0);
    this.position = add(this.position, tran);
}

Ship.prototype.moveLeft = function() {
    const rad = radians(this.yaw);
    const left = vec3(-1*Math.cos(rad), 0, Math.sin(rad));
    this.position = add(this.position, left);
};

Ship.prototype.moveRight = function() {
    const rad = radians(this.yaw);
    const right = vec3(Math.cos(rad), 0, -1*Math.sin(rad));
    this.position = add(this.position, right);
}

Ship.prototype.rotate = function(theta) {
    this.yaw += theta;
};

// view matrix for camera
Ship.prototype.viewMatrix = function() {
    const rad = radians(this.yaw);
    const forward = vec3(Math.sin(rad), 0, Math.cos(rad));
    const at = add(this.position, forward);
    const up = vec3(0, 1, 0);
    return lookAt(this.position, at, up);
};

// render ship for orthographic view
Ship.prototype.Render = function(viewMat, projMat) {
    const gl = this.gl;
    gl.useProgram(this.shaderProgram);

    const model = mult(
        translate(this.position[0], this.position[1], this.position[2]),
        rotateY(this.yaw)
    );
    // const mv = mult(viewMat, model);

    gl.uniformMatrix4fv(this.uModel, false, flatten(model));
    gl.uniformMatrix4fv(this.uView, false, flatten(viewMat));
    gl.uniformMatrix4fv(this.uProj, false, flatten(projMat));

    const ambientFactor = 1.0;
    gl.uniform1f(this.ambientFactor, ambientFactor);
    gl.uniform1f(this.uEmissive, true);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
};
