// Blur texture vertex shader

attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
varying vec2 vTextureCoord;

void main()
{
    gl_Position = uPMatrix * uMVMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
}
