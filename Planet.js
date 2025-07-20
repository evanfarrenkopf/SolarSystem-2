/**
 * Lab 3 - COMP3801 Spring 2021
 *   ColorCube - draw a rotating cube with six different color faces
 */

"use strict";

/**
 * Constructor
 * 
 * @param canvasID - string containing name of canvas to render.
 */
// Function for generating the sphere with normals, positions, and texture coordinates
function generateUvSphere(radius = 1, latBands = 30, longBands = 30) {
    const positions = [];
    const normals = [];
    const texCoords = [];
    const indices = [];

    for (let lat = 0; lat <= latBands; ++lat) {
        const theta = lat * Math.PI / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= longBands; ++lon) {
            const phi = lon * 2 * Math.PI / longBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta
            
            const u = lon / longBands;
            const v = lat / latBands;

            positions.push(radius * x, radius * y, radius * z);
            texCoords.push(u, 1 - v); // flip V so textures aren't upside down
            normals.push(x, y, z); // Basic RGB coloring
        }
    }

    for (let lat = 0; lat < latBands; ++lat) {
        for (let lon = 0; lon < longBands; ++lon) {
            const first = (lat * (longBands + 1)) + lon;
            const second = first + longBands + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        texCoords: new Float32Array(texCoords),
        indices: new Uint16Array(indices),
    };
}

function Planet(gl, shaderProgram, scale, dayPeriod, yearPeriod, orbitDistance, axisTilt, orbitTilt, textureFile, emissive) {
  var t = this;  // save reference to this object for callbacks

  this.scale = scale;
  this.dayPeriod = dayPeriod;
  this.yearPeriod = yearPeriod;
  this.orbitDistance = orbitDistance;
  this.axisTilt = axisTilt;
  this.orbitTilt = orbitTilt;

  this.emissive = emissive // boolean value - is the object emissive?

  this.texture = textureFile;

  this.rotateDay = 0;
  this.rotateYear = 0;

  var gl = this.gl = gl
  // Compile and link shaders
  this.shaderProgram = shaderProgram;
  if (this.shaderProgram === null) return;
  gl.useProgram(this.shaderProgram);

  // setup shader for planet
  this.vPosition = gl.getAttribLocation(this.shaderProgram, "vPosition");
  this.vNormal = gl.getAttribLocation(this.shaderProgram, "vNormal");
  this.vTexCoord = gl.getAttribLocation(this.shaderProgram, "vTexCoord"); // texture coordinates
  // uniform locations
  this.uModel = gl.getUniformLocation(shaderProgram, "modelMat");
  this.uView = gl.getUniformLocation(shaderProgram, "viewMat");
  this.uProj = gl.getUniformLocation(shaderProgram, "projectionMat");
  
  // create sphere data array
  const sphereData = generateUvSphere(1.0, 30, 30);

  // Create buffers
  this.positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphereData.positions, gl.STATIC_DRAW);

  this.normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphereData.normals, gl.STATIC_DRAW);

  this.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereData.indices, gl.STATIC_DRAW);

  this.texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphereData.texCoords, gl.STATIC_DRAW);

  this.indexCount = sphereData.indices.length;

  // Setup VAO
  this.vao = gl.createVertexArray();
  gl.bindVertexArray(this.vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
  gl.vertexAttribPointer(this.vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.vPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
  gl.vertexAttribPointer(this.vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.vNormal);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
  gl.vertexAttribPointer(this.vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.vTexCoord);

  // Get uniform variable location for transform matrices
  // Reall they need to be separately due to lighting calculations
  this.projectionMat = gl.getUniformLocation(shaderProgram, "projectionMat");
  this.viewMat = gl.getUniformLocation(shaderProgram, "viewMat");
  this.modelMat = gl.getUniformLocation(shaderProgram, "modelMat");
  
  // Get uniform variable locations for light info
  // At the moment, we only send one color and use it for ambient, diffuse and specular
  this.lightPosition = gl.getUniformLocation(shaderProgram, "lightPosition");
  this.lightColor = gl.getUniformLocation(shaderProgram, "lightColor");
  this.ambientFactor = gl.getUniformLocation(shaderProgram, "ambientFactor");
  
  // Get uniform variable locations for material properties (K)
  // At the moment, we only send one color and use it for ambient, diffuse and specular
  this.materialColor = gl.getUniformLocation(shaderProgram, "materialColor");
  this.materialShiny = gl.getUniformLocation(shaderProgram, "shiny");

  // Texture uniform in fragment shader
  this.fTexSampler = gl.getUniformLocation(this.shaderProgram, "fTexSampler");
  this.fShowTexture = gl.getUniformLocation(shaderProgram, "fShowTexture");
  this.fShowColor = gl.getUniformLocation(shaderProgram, "fShowColor");

  // Init the texture map
  this.InitTexture(textureFile);

  // get uniform location of which phong components to use
  this.uEmissive = gl.getUniformLocation(shaderProgram, "emissive");

  gl.bindVertexArray(null); // unbind the vao

  // Get uniform location
  this.transformMat = gl.getUniformLocation(this.shaderProgram, "transformMat");

  this.moons = [];
  this.rings = [];
  this.ringCount = 0;

  // Set up callback to render a frame
  var render = function () {
    t.Render(mat4(), mat4(), mat4());

  };

  // Show the first frame
  requestAnimationFrame(render);
};

Planet.prototype.attachMoon = function(moon) {
  this.moons.push(moon);
};

Planet.prototype.attachRing = function(ring) {
  this.rings.push(ring);
  this.ringCount += 1
}

Planet.prototype.Render = function(modelMat, viewMat, projMat, showPaths) {
  var gl = this.gl;

  var orbitTiltMat = rotateZ(this.orbitTilt);
  var finalModelMat = mult(modelMat, orbitTiltMat);

  var orbitMat = rotateY(this.rotateYear);
  finalModelMat = mult(finalModelMat, orbitMat);

  var fromParentMat = translate(this.orbitDistance, 0, 0);
  finalModelMat = mult(finalModelMat, fromParentMat);

  var moonModelMat = finalModelMat;
  var ringModelMat = finalModelMat;

  var axisTiltMat = rotateZ(this.axisTilt);
  finalModelMat = mult(finalModelMat, axisTiltMat);

  var dayRotMat = rotateY(this.rotateDay);
  finalModelMat = mult(finalModelMat, dayRotMat);

  var scaleMat = scale(this.scale/3, this.scale/3, this.scale/3); // can 'unscale' before sending to child, or can scale in the array
  finalModelMat = mult(finalModelMat, scaleMat); // for this planet. moons use moonModelViewMat

  gl.useProgram(this.shaderProgram);
  gl.uniformMatrix4fv(this.uModel, false, flatten(finalModelMat));
  gl.uniformMatrix4fv(this.uView, false, flatten(viewMat));
  gl.uniformMatrix4fv(this.uProj, false, flatten(projMat));

  gl.uniform3f(gl.getUniformLocation(this.shaderProgram, "lightPosition"), 0.0, 0.0, 0.0);

  // Lighting for planets (non-emissive objects)
  // Light color
  var lColor = vec3(.9, .8, .6);
  var lightPosition = vec3(0.0, 0.0, 0.0);
  if (this.emissive == true){
    var ambientFactor = 1.2 // very bright for emissive objects
  }
  else{
    var ambientFactor = 0.2;  // 20% ambient on everything else
  }
  // Pass in the light info
  gl.uniform3fv(this.lightPosition, flatten(lightPosition));
  gl.uniform3fv(this.lightColor, flatten(lColor));
  gl.uniform1f(this.ambientFactor, ambientFactor);
  
  // Pass in the material color 
  var mColor = vec3(1., 1.0, 1.0);
  var mShiny = 20.0;
  gl.uniform3fv(this.materialColor, flatten(mColor));
  gl.uniform1f(this.materialShiny, mShiny);

  // send emissive status to shader
  gl.uniform1i(this.uEmissive, this.emissive);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texture);  
  gl.uniform1i(this.fTexSampler, 0);

  gl.bindVertexArray(this.vao);
  gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  gl.bindVertexArray(null);

  // render the rings, if any
  if (this.ringCount == 1){
    for (var r of this.rings){
      r.Render(ringModelMat, viewMat, projMat);
    }
  } else if (showPaths == true){
    for (var r of this.rings){
      r.Render(mat4(), viewMat, projMat);
    }
  }

  for (var m of this.moons){
    m.Render(moonModelMat, viewMat, projMat, showPaths); 
  }
};

Planet.prototype.InitTexture = function(textureURL){
  var gl = this.gl;
  
  // First make a white texture for when we don't want to have a texture
  //   This prevents shader warnings even if we don't sample from it
  this.whiteTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, this.whiteTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

  // Load the texture from url (with generated mipmaps)
  this.textureLoaded = false;

  var texture = this.texture = gl.createTexture();
  var textureImage = new Image();
  var t = this;

  // Set up function to run asynchronously after texture image loads
  textureImage.onload = function () {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
    
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
      gl.generateMipmap(gl.TEXTURE_2D);  // incase we need min mipmap
      
      t.textureLoaded = true;  // flag texture load complete
  };

  textureImage.src = textureURL;  // start load of texture image

}