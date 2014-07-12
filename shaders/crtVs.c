// CRT emulation

attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uPMatrix;
varying vec2 vTextureCoord;

void main()
{
    gl_Position = uPMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
}
