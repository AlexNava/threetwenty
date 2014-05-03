// A very simple vertex shader
var BasicVertexShader = "\
    attribute vec4 aVertexPosition;\
    attribute vec4 aVertexColor;\
    \
    uniform mat4 uMVMatrix;\
    uniform mat4 uPMatrix;\
    \
    varying vec4 vColor;\
    \
    void main()\
    {\
        gl_Position = uPMatrix * uMVMatrix * aVertexPosition;\
        vColor = aVertexColor;\
    }";

// A very simple fragment shader
var BasicFragmentShader = "\
    precision mediump float;\
    \
    varying vec4 vColor;\
    \
    void main()\
    {\
        gl_FragColor = vColor;\
    }";

// Simple vertex shader with texture support
var BasicTextureVertexShader = "\
    attribute vec4 aVertexPosition;\
    attribute vec4 aVertexColor;\
    attribute vec2 aTextureCoord;\
    \
    uniform mat4 uMVMatrix;\
    uniform mat4 uPMatrix;\
    varying vec2 vTextureCoord;\
    \
    varying vec4 vColor;\
    \
    void main()\
    {\
        gl_Position = uPMatrix * uMVMatrix * aVertexPosition;\
        vTextureCoord = aTextureCoord;\
        vColor = aVertexColor;\
    }";

// Simple fragment shader with texture support
var BasicTextureFragmentShader = "\
    precision mediump float;\
    \
    varying vec4 vColor;\
    varying vec2 vTextureCoord;\
    uniform sampler2D uSampler;\
    \
    void main()\
    {\
        vec4 fragmentColor;\
        fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\
        gl_FragColor = vColor * fragmentColor;\
    }";

