#version 300 es
precision highp float;

in vec3 fColor;           // Light intensity (not hue)
in vec2 fTexCoord;

uniform sampler2D fTexSampler;
out vec4 final_color;

void main() {
    vec4 texColor = texture(fTexSampler, fTexCoord);
    final_color = vec4(fColor, 1.0) * texColor; // Apply lighting as brightness
}