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
	varying vec2 vTextureScreenCoord;\
	\
	void main()\
	{\
		gl_Position = uPMatrix * uMVMatrix * aVertexPosition;\
		vTextureScreenCoord = aTextureCoord;\
	}";

// Simple fragment shader with texture support
var BasicTextureFragmentShader = "\
	precision mediump float;\
	\
	varying vec2 vTextureScreenCoord;\
	uniform highp float uBorder;\
	uniform sampler2D uSampler;\
	uniform vec4 uBaseColor;\
	uniform highp vec2 uTextureSize; /* width, heigth. highp necessary in fragment shader (in vertex it is implicitly highp) */\
	uniform highp vec2 uSize; /* width, heigth */\
	\
	void main()\
	{\
		vec4 fragmentColor;\
		\
		if (uBorder <= 0.0) {\
			fragmentColor = texture2D(uSampler, vTextureScreenCoord);\
			gl_FragColor = fragmentColor * uBaseColor;\
		}\
		else {\
			vec2 textureCoord;\
			if (vTextureScreenCoord.x < uBorder) {\
				textureCoord.x = vTextureScreenCoord.x;\
			}\
			else if ((vTextureScreenCoord.x >= uBorder) && (vTextureScreenCoord.x <= uSize.x - uBorder)) {\
				textureCoord.x = uBorder + (uTextureSize.x - 2.0 * uBorder) * (vTextureScreenCoord.x - uBorder) / (uSize.x - 2.0 * uBorder);\
			}\
			else {\
				textureCoord.x = uTextureSize.x + vTextureScreenCoord.x - uSize.x ;\
			}\
			if (vTextureScreenCoord.y < uBorder) {\
				textureCoord.y = vTextureScreenCoord.y;\
			}\
			else if ((vTextureScreenCoord.y >= uBorder) && (vTextureScreenCoord.y <= uSize.y - uBorder)) {\
				textureCoord.y = uBorder + (uTextureSize.y - 2.0 * uBorder) * (vTextureScreenCoord.y - uBorder) / (uSize.y - 2.0 * uBorder);\
			}\
			else {\
				textureCoord.y = uTextureSize.y + vTextureScreenCoord.y - uSize.y;\
			}\
			textureCoord /= uTextureSize;\
			fragmentColor = texture2D(uSampler, vec2(textureCoord.x, textureCoord.y));\
			gl_FragColor = fragmentColor * uBaseColor;\
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
	varying vec2 vTextureScreenCoord;\
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
		vTextureScreenCoord = aTextureCoord;\
	}";

// Adaptation for aligned rectangles (like text...)
var Rect2DTextureVertexShader = "\
	attribute vec4 aVertexPosition;\
	attribute vec2 aTextureCoord;\
	\
	uniform mat4 uPMatrix;\
	uniform vec2 uCornerPosition; /* bottom left */\
	uniform highp vec2 uSize; /* width, heigth */\
	uniform vec2 uTextureCornerPosition; /* bottom left */\
	uniform vec2 uTextureSelectionSize; /* width, heigth */\
	uniform highp vec2 uTextureSize; /* width, heigth */\
	uniform highp float uBorder;\
	varying vec2 vTextureScreenCoord; /*normally contains either the texture coords, when specifying a border it's the screen coords*/\
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
		if (uBorder > 0.0)\
		{\
			vTextureScreenCoord = finalPos.xy - uCornerPosition.xy;\
		}\
		else\
		{\
			vec2 normalizedTextureCorner = uTextureCornerPosition / uTextureSize;\
			vec2 textureScale = uTextureSelectionSize / uTextureSize;\
			vTextureScreenCoord = normalizedTextureCorner + aTextureCoord * textureScale;\
		}\
	}";
