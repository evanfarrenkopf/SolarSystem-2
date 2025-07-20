"use strict";

const TAU_SEGMENTS = 360;
const TAU = Math.PI * 2;
function arc(x0, y0, innerRadius, outerRadius, startAng = 0, endAng = TAU) {
    const ang = Math.min(TAU, endAng - startAng);
    const position = [];
    const normal = [];
    const segments = Math.round(TAU_SEGMENTS * ang / TAU);

    for (let i = 0; i <= segments; i++) {
        const angle = startAng + ang * i / segments;

        const x1 = x0 + innerRadius * Math.cos(angle);
        const y1 = y0 + innerRadius * Math.sin(angle);
        const x2 = x0 + outerRadius * Math.cos(angle);
        const y2 = y0 + outerRadius * Math.sin(angle);

        position.push(x1, 0, y1);
        position.push(x2, 0, y2);

        normal.push(0, 1, 0);
        normal.push(0, 1, 0);
    }

    return {
        position: new Float32Array(position),
        normal: new Float32Array(normal)
    };
}

function Ring(gl, shaderProgram, innerRadius, outerRadius){
    var t = this;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;

    this.gl = gl;

    // Compile and link shaders
    this.shaderProgram = shaderProgram;
    if(this.shaderProgram === null) return;

    gl.useProgram(this.shaderProgram);
    // Attribute Locations
    this.vPosition = gl.getAttribLocation(this.shaderProgram, "vPosition");
    this.vNormal = gl.getAttribLocation(this.shaderProgram, "vNormal");
    // Uniform Locations

    this.ringData = arc(0, 0, innerRadius, outerRadius);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.ringData.position, gl.STATIC_DRAW);

    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.ringData.normal, gl.STATIC_DRAW);

    // setup vao
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(this.vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(this.vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.vNormal);

    this.uProj = gl.getUniformLocation(shaderProgram, "projectionMat");
    this.uView = gl.getUniformLocation(shaderProgram, "viewMat");
    this.uModel = gl.getUniformLocation(shaderProgram, "modelMat");
    this.materialColor = gl.getUniformLocation(shaderProgram, "materialColor");

    this.ambientFactor = gl.getUniformLocation(shaderProgram, "ambientFactor");
    this.uEmissive = gl.getUniformLocation(shaderProgram, "emissive");


    // unbind vao
    gl.bindVertexArray(null)
    // get uniform location
    this.transformMat = gl.getUniformLocation(this.shaderProgram, "transformMat");

    var render = function () {
        t.Render(mat4(), mat4(), mat4());
    }

    requestAnimationFrame(render);
}

Ring.prototype.Render = function(modelMat, viewMat, projMat){
    var gl = this.gl;

    gl.useProgram(this.shaderProgram);
    gl.uniformMatrix4fv(this.uModel, false, flatten(modelMat));
    gl.uniformMatrix4fv(this.uView, false, flatten(viewMat));
    gl.uniformMatrix4fv(this.uProj, false, flatten(projMat));

    // ONLY AMBIENT
    var ambientFactor = 0.8;  
    var mColor = vec3(0.5, 0.5, 1);
    // Pass in the light info
    gl.uniform3fv(this.materialColor, flatten(mColor));
    gl.uniform1f(this.ambientFactor, ambientFactor);
    gl.uniform1f(this.uEmissive, true);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.ringData.position.length / 3);
    gl.bindVertexArray(null);
}