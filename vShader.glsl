#version 300 es

// Per-vertex variables from the vertex buffers
in vec3 vPosition;           // position of vertex (x, y, z) in world coords
in vec3 vNormal;             // normal of the vertex in world coords
in vec2 vTexCoord;           // texture coordinates


// We need to separate projection and and location so we can put points into view/camera
//   coordinates to do lighting calculations
uniform mat4 projectionMat;   // projection matrix
uniform mat4 viewMat;         // the view/camera location matrix
uniform mat4 modelMat;   // model matrix

// Light info
uniform vec3 lightPosition; // light position in world coords
uniform vec3 lightColor;
uniform float ambientFactor;

// Material properties (K)
uniform vec3 materialColor;
uniform float shiny;


// Interpolated values for the fragment shader
out vec3 fColor;    // output color to send to fragment shader
out vec2 fTexCoord; // texture coordinates to be interpolated

// boolean for non/emissive objects
uniform bool emissive;

void main() {
      
    // transform the vertex, normal, and light position into viewing/camera coordinates
     // 1 for w since point
    vec4 posVC4 = viewMat * modelMat * vec4(vPosition.xyz, 1.0); 
    // 0 for w since vector - doesn't transform correct with w=1
    vec4 normVC4 = viewMat * modelMat * vec4(vNormal.xyz, 0.0);
    // We will assume point light source so we add 1
    vec4 lightVC4 = viewMat * vec4(lightPosition.xyz, 1.0);
    
    // Always have to assign gl_Position - projected into clip coordinates
    gl_Position = projectionMat * posVC4;
   
    // The normal we were given is probably a unit vector already, but just to be sure
    vec3 normVC3 = normalize(normVC4.xyz); 

    // But we should not normalize these since they are points and not vectors
    vec3 posVC3 = posVC4.xyz;
    vec3 lightVC3 = lightVC4.xyz;
    
    // Calculate the PHONG lighting model
    
    // Ambient calculation
    // use the ambient factor to calculate the ambient color using the
    //   material and light colors
    vec3 ambientComponent = lightColor * ambientFactor * materialColor;
    
    // Diffuse calculation
    vec3 L = normalize(lightVC3 - posVC3);
    float LdotN = max(dot(normVC3, L), 0.0);       // backlighting
    vec3 diffuseComponent = lightColor * LdotN;

    // Specular calculation
    vec3 V = normalize(-posVC3); 
    vec3 H = (L + V)*0.5;
    vec3 normH = normalize(H.xyz);
    float specIntensity = pow(max(dot(normH, normVC3), 0.0), shiny);
    
    vec3 specularComponent = lightColor * specIntensity;
    
    // Add the components together, conditionally based on the boxes the user checked
    vec3 phong = vec3(0,0,0);
    phong += ambientComponent;
    if (!emissive){
        phong += diffuseComponent + specularComponent;
    }

    // Send the final shade from the phong model down to the fragment shader
    fColor = phong;
    fTexCoord = vTexCoord;
}
