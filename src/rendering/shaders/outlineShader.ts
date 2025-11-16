/**
 * Outline Shader - WebGL shader for sprite outlines
 * Detects edges by sampling neighboring pixels and draws outline around opaque areas
 */

export const OUTLINE_VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    vec4 positionVec4 = vec4(aPosition, 1.0);
    positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
    gl_Position = positionVec4;
}
`;

export const OUTLINE_FRAGMENT_SHADER = `
precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D uTexture;
uniform vec2 uTexelSize;      // Size of one pixel in texture coordinates
uniform vec3 uOutlineColor;   // RGB outline color (0-1)
uniform float uOutlineWidth;  // Thickness in pixels

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    
    // If pixel is already opaque, just draw it normally
    if (color.a > 0.5) {
        gl_FragColor = color;
        return;
    }
    
    // Check neighboring pixels to detect edges
    float alpha = 0.0;
    float samples = 0.0;
    
    // Sample in a circle around the current pixel
    for (float angle = 0.0; angle < 6.28318; angle += 0.785398) { // 8 samples
        for (float dist = 1.0; dist <= uOutlineWidth; dist += 1.0) {
            vec2 offset = vec2(cos(angle), sin(angle)) * dist * uTexelSize;
            vec4 sample = texture2D(uTexture, vTexCoord + offset);
            
            if (sample.a > 0.5) {
                alpha = 1.0;
                samples += 1.0;
            }
        }
    }
    
    // If we found opaque neighbors, draw outline
    if (alpha > 0.0) {
        gl_FragColor = vec4(uOutlineColor, 1.0);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
`;
