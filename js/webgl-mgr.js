"use strict";
var WebGlMgr = function () {

	this.mainCanvas = null;
	this.xResolution = 0;
	this.yResolution = 0;

	this.startFunc = function() {};
	this.displayFunc = function() {};

	this.setStartFunc = function(startFunction) {
		this.startFunc = startFunction;
	};

	this.setDisplayFunc = function(displayFunction) {
		this.displayFunc = displayFunction;
	};


	this.checkResize = function() {
		var width = window.innerWidth;
		var height = window.innerHeight;
		var pixelRatio = window.devicePixelRatio;

		this.mainCanvas.width = width * pixelRatio;
		this.mainCanvas.height = height * pixelRatio;

		this.mainCanvas.style.width = width + 'px';
		this.mainCanvas.style.height = height + 'px';
	};

	this.goFullscreen = function() {
		var elem = document.documentElement;
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if (elem.msRequestFullscreen) {
			elem.msRequestFullscreen();
		} else if (elem.mozRequestFullScreen) {
			elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) {
			elem.webkitRequestFullscreen();
		}
	};

	// Initialization ------------------
	this.init = function (canvasName, hResolution, vResolution) {
		this.xResolution = hResolution;
		this.yResolution = vResolution;

		this.mainCanvas = document.getElementById(canvasName);

		try {
			this.initGL(this.mainCanvas);
		} catch (exception) {
			alert('Error while initializing WebGL: ' + exception);
		}

		// Builtin matrices ----------------
		this.mvMatrix = mat4.create();
		this.perspectiveProjMatrix = mat4.create();
		this.orthoProjMatrix = mat4.create();
		mat4.ortho(this.orthoProjMatrix, 0, this.xResolution, 0, this.yResolution, -1, 1);

		// Builtin vertex buffers ----------
		this.triangleVertexPosBuffer = null;
		this.triangleVertexColBuffer = null;
		this.screenVertexBuffer = null;
		this.screenCoordBuffer = null;

		this.initVertexBuffers();
		this.initBuiltinShaders();
	};

	this.initGL = function() {
		this.gl = this.mainCanvas.getContext("webgl", { alpha: false })
			|| this.mainCanvas.getContext("experimental-webgl", { alpha: false });
		this.gl.viewportWidth = this.mainCanvas.width;
		this.gl.viewportHeight = this.mainCanvas.height;

		if (!this.gl)
		{
			alert("Could not initialise WebGL");
		}
	};

	this.initVertexBuffers = function() {
		// Init triangle buffer
		this.triangleVertexPosBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexPosBuffer);
		var vertices = [
			 0.0,  1.0, 0.0, 1.0,
			-0.87, -0.5, 0.0, 1.0,
			 0.87, -0.5, 0.0, 1.0
		];
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		this.triangleVertexPosBuffer.itemSize = 4;
		this.triangleVertexPosBuffer.numItems = 3;

		this.triangleVertexColBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexColBuffer);
		var colors = [
			1.0, 0.0, 0.0, 1.0,
			0.0, 1.0, 0.0, 1.0,
			0.0, 0.0, 1.0, 1.0
		];
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
		this.triangleVertexColBuffer.itemSize = 4;
		this.triangleVertexColBuffer.numItems = 3;

		// Init generic textured quad buffer
		this.quadVertexPosBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadVertexPosBuffer);
		var quadVertices = [
			-0.5, -0.5, 0.0, 1.0,
			-0.5, 0.5, 0.0, 1.0,
			0.5, -0.5, 0.0, 1.0,
			0.5, 0.5, 0.0, 1.0
		];
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadVertices), this.gl.STATIC_DRAW);
		this.quadVertexPosBuffer.itemSize = 4;
		this.quadVertexPosBuffer.numItems = 4;

		this.quadCoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadCoordBuffer);
		var quadCoords = [
			0.0, 0.0,
			0.0, 1.0,
			1.0, 0.0,
			1.0, 1.0
		];
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadCoords), this.gl.STATIC_DRAW);
		this.quadCoordBuffer.itemSize = 2;
		this.quadCoordBuffer.numItems = 4;

		// Init generic unit rectangle buffer, to be used with aligned "sprites"
		this.rectVertexPosBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectVertexPosBuffer);
		quadVertices = [
			0.0, 0.0, 0.0, 1.0,
			0.0, 1.0, 0.0, 1.0,
			1.0, 0.0, 0.0, 1.0,
			1.0, 1.0, 0.0, 1.0
		];
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadVertices), this.gl.STATIC_DRAW);
		this.rectVertexPosBuffer.itemSize = 4;
		this.rectVertexPosBuffer.numItems = 4;

		this.rectCoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectCoordBuffer);
		quadCoords = [
			0.0, 0.0,
			0.0, 1.0,
			1.0, 0.0,
			1.0, 1.0
		];
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadCoords), this.gl.STATIC_DRAW);
		this.rectCoordBuffer.itemSize = 2;
		this.rectCoordBuffer.numItems = 4;

		// Init fullscreen quad buffer
		this.screenVertexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenVertexBuffer);
		quadVertices = [
			0.0, 0.0, 0.0, 1.0,
			0.0, this.yResolution, 0.0, 1.0,
			this.xResolution, 0.0, 0.0, 1.0,
			this.xResolution, this.yResolution, 0.0, 1.0
		];
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadVertices), this.gl.STATIC_DRAW);
		this.screenVertexBuffer.itemSize = 4;
		this.screenVertexBuffer.numItems = 4;

		this.screenCoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenCoordBuffer);
		quadCoords = [
			0.0, 0.0,
			0.0, 1.0,
			1.0, 0.0,
			1.0, 1.0
		];
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadCoords), this.gl.STATIC_DRAW);
		this.screenCoordBuffer.itemSize = 2;
		this.screenCoordBuffer.numItems = 4;
	};

	this.initBuiltinShaders = function() {    
		// Init basic gouraud shader
		this.loadShaderSources("base", BasicVertexShader, BasicFragmentShader);
		this.shaderAttributeArrays("base", ["aVertexPosition", "aVertexColor"]);
		this.shaderUniforms("base", ["uPMatrix", "uMVMatrix"]);

		// Init basic texture shader
		this.loadShaderSources("texture", BasicTextureVertexShader, BasicTextureFragmentShader);
		this.shaderAttributeArrays("texture", ["aVertexPosition", "aTextureCoord"]);
		this.shaderUniforms("texture", ["uPMatrix", "uMVMatrix", "uSampler", "uBaseColor"]);

		// Init textured quads shader
		this.loadShaderSources("quad2d", Quad2DTextureVertexShader, BasicTextureFragmentShader);
		this.shaderAttributeArrays("quad2d", ["aVertexPosition", "aTextureCoord"]);
		this.shaderUniforms("quad2d", ["uPMatrix", "uCenterPosition", "uScale", "uRotation", "uSampler", "uBaseColor"]);
	
		// Init textured aligned rectangle shader
		this.loadShaderSources("rect2d", Rect2DTextureVertexShader, BasicTextureFragmentShader);
		this.shaderAttributeArrays("rect2d", ["aVertexPosition", "aTextureCoord"]);
		this.shaderUniforms("rect2d", ["uPMatrix", "uCornerPosition", "uSize", "uTextureCornerPosition", "uTextureSelectionSize", "uTextureSize", "uSampler", "uBaseColor", "uBorder"]);

		var identityMv = mat4.create();

		this.gl.useProgram(this.shaders["texture"]);
		this.gl.uniformMatrix4fv(this.shaders["texture"].uMVMatrix, false, identityMv);
		this.gl.uniformMatrix4fv(this.shaders["texture"].uPMatrix, false, this.orthoProjMatrix);        
		this.gl.uniform4fv(this.shaders["texture"].uBaseColor, [1.0, 1.0, 1.0, 1.0]);

		this.gl.useProgram(this.shaders["quad2d"]);
		this.gl.uniformMatrix4fv(this.shaders["quad2d"].uPMatrix, false, this.orthoProjMatrix);        
		this.gl.uniform4fv(this.shaders["quad2d"].uBaseColor, [1.0, 1.0, 1.0, 1.0]);

		this.gl.useProgram(this.shaders["rect2d"]);
		this.gl.uniformMatrix4fv(this.shaders["rect2d"].uPMatrix, false, this.orthoProjMatrix);        
		this.gl.uniform4fv(this.shaders["rect2d"].uBaseColor, [1.0, 1.0, 1.0, 1.0]);
	};

	// Shader utils --------------------
	this.shaders = [];

	this.loadShaderSources = function(shaderName, vertexSource, fragmentSource) {
		var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
		var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

		this.gl.shaderSource(vertexShader, vertexSource);
		this.gl.compileShader(vertexShader);
		if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
			alert("Error compiling vertex shader: " + shaderName + "\n" + this.gl.getShaderInfoLog(vertexShader));
		}

		this.gl.shaderSource(fragmentShader, fragmentSource);
		this.gl.compileShader(fragmentShader);
		if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
			alert("Error compiling fragment shader: " + shaderName + "\n" + this.gl.getShaderInfoLog(fragmentShader));
		}

		var shaderProgram = this.gl.createProgram();
		this.gl.attachShader(shaderProgram, vertexShader);
		this.gl.attachShader(shaderProgram, fragmentShader);
		this.gl.linkProgram(shaderProgram);
		
		if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
			alert("Error linking shader program:\n" + shaderProgram.error);
		}

		this.shaders[shaderName] = shaderProgram;
		this.shaders[shaderName].linked = true;
	};

	this.loadShaderFiles = function(shaderName, vertexFile, fragmentFile, completedFunc) {
		var vertexSource = "", fragmentSource = "";

		$.get(vertexFile,
			function(data) {
				vertexSource = data;

				// load fragment source right after vertex source
				$.get(fragmentFile,
					function(data) {
						fragmentSource = data;

						this.loadShaderSources(shaderName, vertexSource, fragmentSource);
						completedFunc();
					}.bind(this),
					"text"
				);
			}.bind(this),
			"text"
		);
	};
	
	this.shaderAttributes = function(shaderName, attributesList) {
		this.gl.useProgram(this.shaders[shaderName]);
		
		for (var i = 0; i <attributesList.length; i++) {
			this.shaders[shaderName][attributesList[i]] = this.gl.getAttribLocation(this.shaders[shaderName], attributesList[i]);
		}
	};
	
	this.shaderAttributeArrays = function(shaderName, attributeArraysList) {
		this.gl.useProgram(this.shaders[shaderName]);
		
		for (var i = 0; i <attributeArraysList.length; i++) {
			this.shaders[shaderName][attributeArraysList[i]] = this.gl.getAttribLocation(this.shaders[shaderName], attributeArraysList[i]);
			this.gl.enableVertexAttribArray(this.shaders[shaderName][attributeArraysList[i]]);
		}
	};
	
	this.shaderUniforms = function(shaderName, uniformsList) {
		this.gl.useProgram(this.shaders[shaderName]);
		
		for (var i = 0; i <uniformsList.length; i++) {
			this.shaders[shaderName][uniformsList[i]] = this.gl.getUniformLocation(this.shaders[shaderName], uniformsList[i]);
		}
	}

	// Framebuffer utils ---------------
	this.frameBuffers = [];
	this.createFrameBuffer = function(fbName) {
		var tempFb = this.gl.createFramebuffer();
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, tempFb);
		tempFb.width = this.xResolution;
		tempFb.height = this.yResolution;

		// Texture for color
		var tempTexture = this.gl.createTexture();
		tempTexture.width = tempFb.width;
		tempTexture.height = tempFb.height;
		
		this.gl.bindTexture(this.gl.TEXTURE_2D, tempTexture);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		// Must specify CLAMP_TO_EDGE and no mipmap because the texture will be non-powered-of-two sized
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, tempFb.width, tempFb.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

		// Renderbuffers
		var tempRenderBuf = this.gl.createRenderbuffer();
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, tempRenderBuf);
		// Renderbuffer is only used to store DEPTH
		this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, tempFb.width, tempFb.height);

		// Bind to 1st FBO
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, tempTexture, 0);
		this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, tempRenderBuf);

		// Switch to default texture/renderbuff/framebuff
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		
		tempFb.texture = tempTexture;
		this.frameBuffers[fbName] = tempFb;
	}

	this.useFrameBuffer = function(fbName) {
		if (fbName === null)
		{
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		}
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffers[fbName]);
	}

	this.useTextureFromFrameBuffer = function(fbName, textureUnit) {
		if (textureUnit == undefined){
			textureUnit = 0;
		}
		this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.frameBuffers[fbName].texture);
		
		if (textureUnit === 0)
			this.textureInUse = this.frameBuffers[fbName].texture;
	}

	// Texture utils -------------------
	this.textures = [];
	this.loadTexture = function(textureName, fileName) {
		var tempTexture = this.gl.createTexture();
		var tempImage = new Image();
		var WebGlMgrContext = this;
		tempImage.onload = function() {
			WebGlMgrContext.textureLoadHandler(textureName, tempImage, tempTexture);
		}
		tempImage.src = fileName;
	};

	this.textureLoadHandler = function(textureName, image, texture) {
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE); // Necessary for npot textures
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE); //

		this.gl.generateMipmap(this.gl.TEXTURE_2D); // works even with npot textures
		texture.width = image.width;
		texture.height = image.height;
		this.textures[textureName] = texture;
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
	};

	this.textureInUse = undefined;

	this.useTexture = function(textureName, textureUnit) {
		if (textureUnit == undefined){
			textureUnit = 0;
		}
		this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[textureName.toString()]);

		if (textureUnit === 0) {
			this.textureInUse = this.textures[textureName.toString()];
		}
	};

	// Miscellaneous 2D drawing --------
	this.drawFunctions = {
		QUAD2D:           0,
		RECT2D:           1,
		FULLSCREEN_RECT:  2,
		INVALID:         -1
	};
		
	this.lastFunction = this.drawFunctions.INVALID;

	this.quad2DColor = function(r, g, b, a) {
		var shad = this.shaders["quad2d"];
		
		this.gl.useProgram(shad);    

		this.gl.uniform4fv(shad.uBaseColor, [r, g, b, a]);
	};
	
	this.texturedQuad2D = function(centerX, centerY, size, rotation) {
		var shad = this.shaders["quad2d"];
		
		if (this.lastFunction !== this.drawFunctions.QUAD2D)
		{
			this.gl.useProgram(shad);    

			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadVertexPosBuffer);
			this.gl.vertexAttribPointer(shad.aVertexPosition, this.quadVertexPosBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadCoordBuffer);
			this.gl.vertexAttribPointer(shad.aTextureCoord, this.quadCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

			// Set only proj matrix
			this.gl.uniformMatrix4fv(shad.uPMatrix, false, this.orthoProjMatrix);
			this.gl.uniform1i(shad.uSampler, 0);
		}

		this.gl.uniform2fv(shad.uCenterPosition, [centerX, centerY]);
		this.gl.uniform1f(shad.uScale, size);
		this.gl.uniform1f(shad.uRotation, rotation);
	
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.quadVertexPosBuffer.numItems);
		
		this.lastFunction = this.drawFunctions.QUAD2D;
	};

	this.rect2DColor = function(r, g, b, a) {
		var shad = this.shaders["rect2d"];
		
		this.gl.useProgram(shad);

		this.gl.uniform4fv(shad.uBaseColor, [r, g, b, a]);
	};

	this.texturedRect2D = function(bottomLeftX, bottomLeftY, width, height,
	                               bottomLeftTextureX, bottomLeftTextureY, textureSelectionWidth, textureSelectionHeight, border) {
		var shad = this.shaders["rect2d"];
		if (border === undefined) {
			border = 0.0;
		}
		
		if (this.lastFunction !== this.drawFunctions.RECT2D)
		{
			this.gl.useProgram(shad);

			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectVertexPosBuffer);
			this.gl.vertexAttribPointer(shad.aVertexPosition, this.rectVertexPosBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadCoordBuffer);
			this.gl.vertexAttribPointer(shad.aTextureCoord, this.rectCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

			// Set only proj matrix
			this.gl.uniformMatrix4fv(shad.uPMatrix, false, this.orthoProjMatrix);
			this.gl.uniform1i(shad.uSampler, 0);
		}
		
		this.gl.uniform2fv(shad.uCornerPosition, [bottomLeftX, bottomLeftY]);
		this.gl.uniform2fv(shad.uSize, [width, height]);
		this.gl.uniform2fv(shad.uTextureCornerPosition, [bottomLeftTextureX, bottomLeftTextureY]);
		this.gl.uniform2fv(shad.uTextureSelectionSize, [textureSelectionWidth, textureSelectionHeight]);
		this.gl.uniform1f(shad.uBorder, border);

		if (this.textureInUse !== undefined) {
			this.gl.uniform2fv(shad.uTextureSize, [this.textureInUse.width, this.textureInUse.height]);
		}

		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.rectVertexPosBuffer.numItems);

		this.lastFunction = this.drawFunctions.RECT2D;
	};

	this.fullscreenRectangle = function(shaderId) {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenVertexBuffer);
		this.gl.vertexAttribPointer(this.shaders[shaderId].aVertexPosition, this.screenVertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenCoordBuffer);
		this.gl.vertexAttribPointer(this.shaders[shaderId].aTextureCoord, this.screenCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.screenVertexBuffer.numItems);

		this.lastFunction = this.drawFunctions.FULLSCREEN_RECT;
	};

};
