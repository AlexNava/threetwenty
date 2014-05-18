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
    attribute vec2 aTextureCoord;\
    \
    uniform mat4 uMVMatrix;\
    uniform mat4 uPMatrix;\
    varying vec2 vTextureCoord;\
    \
    void main()\
    {\
        gl_Position = uPMatrix * uMVMatrix * aVertexPosition;\
        vTextureCoord = aTextureCoord;\
    }";

// Simple fragment shader with texture support (with some blur just in case)
var BasicTextureFragmentShader = "\
    precision mediump float;\
    \
    varying vec2 vTextureCoord;\
    uniform sampler2D uSampler;\
    uniform float uTextureW;\
    uniform float uTextureH;\
    uniform float uBlurAmount;\
    \
    void main()\
    {\
        float OneX = 1.0 / uTextureW;\
        float OneY = 1.0 / uTextureH;\
        vec4 fragmentColor;\
        \
        fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\
        fragmentColor += uBlurAmount * texture2D(uSampler, vec2(vTextureCoord.s - OneX, vTextureCoord.t));\
        fragmentColor += uBlurAmount * texture2D(uSampler, vec2(vTextureCoord.s + OneX, vTextureCoord.t));\
        fragmentColor += uBlurAmount * texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t - OneY));\
        fragmentColor += uBlurAmount * texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t + OneY));\
        gl_FragColor = fragmentColor / (1.0 + uBlurAmount * 4.0);\
    }";

// Another vertex shader with texture support
var CrtVertexShader2 = "\
    attribute vec4 aVertexPosition;\
    attribute vec2 aTextureCoord;\
    \
    uniform mat4 uMVMatrix;\
    uniform mat4 uPMatrix;\
    varying vec2 vTextureCoord;\
    \
    void main()\
    {\
        gl_Position = uPMatrix * uMVMatrix * aVertexPosition;\
        vTextureCoord = aTextureCoord;\
    }";

// Another fragment shader with texture support
var CrtFragmentShader2 = "\
    precision mediump float;\
    \
    varying vec2 vTextureCoord;\
    uniform sampler2D uSampler;\
    uniform float uTextureW;\
    uniform float uTextureH;\
    \
    void main()\
    {\
        float multW = 1.0 / uTextureW;\
        float multH = 1.0 / uTextureH;\
        vec4 fragmentColor;\
        \
        fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s * multW, vTextureCoord.t * multH));\
        gl_FragColor = fragmentColor + vec4(1.0, 0.0, 0.0, 1.0);\
    }";
