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

// Simple fragment shader with texture support
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
        gl_FragColor = vec4(fragmentColor.rgb, 1.0);\
    }";

// Blur texture vertex shader
var BlurVertexShader = "\
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

// Blur texture fragment shader
var BlurFragmentShader = "\
    precision mediump float;\
    \
    varying vec2 vTextureCoord;\
    uniform sampler2D uSampler;\
    uniform float uTextureW;\
    uniform float uTextureH;\
    uniform float uBlurAmount;\
    uniform vec2 uBlurShift;\
    uniform vec4 uClearColor;\
    \
    void main()\
    {\
        float OneX = 1.0 / uTextureW;\
        float OneY = 1.0 / uTextureH;\
        vec2 targetPos = vec2(vTextureCoord.s - uBlurShift.s * OneX, vTextureCoord.t - uBlurShift.t * OneY);\
        vec4 fragmentColor;\
        \
        fragmentColor = texture2D(uSampler, vec2(targetPos.s, targetPos.t));\
        fragmentColor += uBlurAmount * texture2D(uSampler, vec2(targetPos.s - OneX, targetPos.t));\
        fragmentColor += uBlurAmount * texture2D(uSampler, vec2(targetPos.s + OneX, targetPos.t));\
        fragmentColor += uBlurAmount * texture2D(uSampler, vec2(targetPos.s, targetPos.t - OneY));\
        fragmentColor += uBlurAmount * texture2D(uSampler, vec2(targetPos.s, targetPos.t + OneY));\
        gl_FragColor = vec4(uClearColor.a * uClearColor.rgb + (1.0 - uClearColor.a) * fragmentColor.rgb / (1.0 + uBlurAmount * 4.0), 1.0);\
    }";

// Another vertex shader with texture support
var CrtVertexShader = "\
    attribute vec4 aVertexPosition;\
    attribute vec2 aTextureCoord;\
    \
    uniform mat4 uPMatrix;\
    varying vec2 vTextureCoord;\
    \
    void main()\
    {\
        gl_Position = uPMatrix * aVertexPosition;\
        vTextureCoord = aTextureCoord;\
    }";

// Another fragment shader with texture support
var CrtFragmentShader = "\
    precision mediump float;\
    \
    varying vec2 vTextureCoord;\
    uniform sampler2D uSampler;\
    uniform int uScanlines;\
    uniform float uBarrelDistortion;\
    \
    void main()\
    {\
        float ramp = fract(vTextureCoord.t * float(uScanlines) * 0.5 + 0.5) - 0.5;\
        float scanlineNear = 2.0 * abs(ramp);\
        bool evenLine = (ramp > 0.0);\
		float discretizedTextureT = floor(vTextureCoord.t * float(uScanlines)) / float(uScanlines);\
        /*scanlineNear = pow(scanlineNear, 1.0)*/;\
        vec4 fragmentColor;\
        \
        fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, discretizedTextureT));\
        /*gl_FragColor = vec4(fragmentColor.rgb * scanlineNear * 2.0, 1.0);*/\
        if (evenLine)\
            gl_FragColor = vec4(fragmentColor.rgb * 1.1, 1.0);\
        else\
            gl_FragColor = vec4(fragmentColor.rgb * 0.9, 1.0);\
    }";
