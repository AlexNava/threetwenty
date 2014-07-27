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

// Adaptation for centered quads (or any other geometry)
// Todo: arbitrary rectangle selection?
var Quad2DTextureVertexShader = "\
    attribute vec4 aVertexPosition;\
    attribute vec2 aTextureCoord;\
    \
    uniform mat4 uPMatrix;\
    uniform vec2 uCenterPosition;\
    uniform float uScale;\
    uniform float uRotation;\
    varying vec2 vTextureCoord;\
    \
    /* Matrix expressed as columns */\
    mat4 mvMatrix = mat4(\
        uScale * cos(uRotation), uScale * sin(uRotation), 0.0, 0.0,\
        -uScale * sin(uRotation), uScale * cos(uRotation), 0.0, 0.0,\
        0.0, 0.0, 1.0, 0.0,\
        uCenterPosition.x, uCenterPosition.y, 0.0, 1.0\
    );\
    \
    void main()\
    {\
        gl_Position = uPMatrix * mvMatrix * aVertexPosition;\
        vTextureCoord = aTextureCoord;\
    }";

// Adaptation for aligned rectangles (like text...)
// Todo: arbitrary rectangle selection
var Rect2DTextureVertexShader = "\
    attribute vec4 aVertexPosition;\
    attribute vec2 aTextureCoord;\
    \
    uniform mat4 uPMatrix;\
    uniform vec2 uCornerPosition; /* bottom left */\
    uniform vec2 uSize; /* width, heigth */\
    uniform vec2 uTextureCornerPosition; /* bottom left */\
    uniform vec2 uTextureSelectionSize; /* width, heigth */\
    uniform vec2 uTextureSize; /* width, heigth */\
    varying vec2 vTextureCoord;\
    \
    /* Matrix expressed as columns */\
    mat4 mvMatrix = mat4(\
        uSize.x, 0.0, 0.0, 0.0,\
        0.0, uSize.y, 0.0, 0.0,\
        0.0, 0.0, 1.0, 0.0,\
        uCornerPosition.x, uCornerPosition.y, 0.0, 1.0\
    );\
    \
    void main()\
    {\
        gl_Position = uPMatrix * mvMatrix * aVertexPosition;\
        vec2 normalizedTextureCorner = uTextureCornerPosition / uTextureSize;\
        vec2 textureScale = uTextureSelectionSize / uTextureSize;\
        vTextureCoord = normalizedTextureCorner + aTextureCoord * textureScale;\
    }";

// Simple fragment shader with texture support
var BasicTextureFragmentShader = "\
    precision mediump float;\
    \
    varying vec2 vTextureCoord;\
    uniform sampler2D uSampler;\
    \
    void main()\
    {\
        vec4 fragmentColor;\
        \
        fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\
        gl_FragColor = fragmentColor.rgba;\
    }";
