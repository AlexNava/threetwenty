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
	varying vec4 vScreenCoord; /* useful for border scaling */\
	uniform float uBorder;\
	uniform sampler2D uSampler;\
	uniform vec4 uBaseColor;\
	uniform highp vec2 uTextureSize; /* width, heigth. highp necessary in fragment shader (in vertex it is implicitly highp) */\
	\
	void main()\
	{\
		vec4 fragmentColor;\
		\
		if (uBorder == 0.0) {\
			fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\
			gl_FragColor = fragmentColor * uBaseColor;\
		}\
		else {\
			vec2 stocaz = uTextureSize;\
			float a;\
			float b;\
			if ((vScreenCoord.x >= uBorder) && (vScreenCoord.x <= vScreenCoord.z - uBorder)) {\
				a = 1.0;\
			}\
			else {\
				a = 0.0;\
			}\
			if ((vScreenCoord.y >= uBorder) && (vScreenCoord.y <= vScreenCoord.w - uBorder)) {\
				b = 1.0;\
			}\
			else {\
				b = 0.0;\
			}\
			gl_FragColor = vec4(a, 0.0, b, 1.0);\
		}\
	}";

// Adaptation for centered quads (or any other geometry)
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
var Rect2DTextureVertexShader = "\
	attribute vec4 aVertexPosition;\
	attribute vec2 aTextureCoord;\
	\
	uniform mat4 uPMatrix;\
	uniform vec2 uCornerPosition; /* bottom left */\
	uniform vec2 uSize; /* width, heigth */\
	uniform vec2 uTextureCornerPosition; /* bottom left */\
	uniform vec2 uTextureSelectionSize; /* width, heigth */\
	uniform highp vec2 uTextureSize; /* width, heigth */\
	varying vec2 vTextureCoord;\
	varying vec4 vScreenCoord; /* for border scaling, zand w are size */\
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
		vec4 finalPos = mvMatrix * aVertexPosition;\
		gl_Position = uPMatrix * finalPos;\
		vec2 normalizedTextureCorner = uTextureCornerPosition / uTextureSize;\
		vec2 textureScale = uTextureSelectionSize / uTextureSize;\
		vTextureCoord = normalizedTextureCorner + aTextureCoord * textureScale;\
		vScreenCoord.xy = finalPos.xy - uCornerPosition.xy;\
		vScreenCoord.zw = uSize.xy;\
	}";
