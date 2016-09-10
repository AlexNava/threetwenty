var startFunc = function () {
	window.addEventListener("click", WGL.goFullscreen);

	WGL.checkResize();

	angle = 0.0;
	blurriness = 0.5;
	blurShiftX = 1.0;
	blurShiftY = 1.0;

	WGL.gl.enable(WGL.gl.DEPTH_TEST);

	WGL.mvMatrix = mat4.create();
	WGL.perspectiveProjMatrix = mat4.create();

	initTextures();
	initShaders();
	WGL.createFrameBuffer('stoca');
	WGL.createFrameBuffer('stami');
};

initTextures = function() {
	WGL.loadTexture("snoop", "images/SnoopDogeTransp.png");
	WGL.loadTexture("code", "images/code64.png");
	WGL.loadTexture("bezel", "shaders/crt_images/bezel.png");
	WGL.loadTexture("glow", "shaders/crt_images/glow.png");
};

initShaders = function() {
	// Blur
	WGL.loadShaderFiles("blur", "shaders/blurVs.c", "shaders/blurFs.c", function() {
		WGL.shaderAttributeArrays("blur", ["aVertexPosition", "aTextureCoord"]);
		WGL.shaderUniforms("blur", ["uPMatrix", "uSampler", "uTextureW", "uTextureH", "uBlurAmount", "uBlurShift", "uClearColor"]);
	});
	
	// CRT
	WGL.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
		WGL.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
		WGL.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion", "uVignette", "uSampler", "uBezelSampler", "uGlowSampler", "uPhosphorSampler"]);
	});
};

var displayFunc = function (elapsed) {
	animateFun(elapsed);

	// draw scene on 1st FBO
	WGL.useFrameBuffer('stoca');
	WGL.gl.viewport(0, 0, WGL.xResolution, WGL.yResolution);
	WGL.gl.enable(WGL.gl.DEPTH_TEST);

	//WGL.gl.clearColor(0.5, 0.5, 0.5, 1.0);
	//WGL.gl.clear(WGL.gl.COLOR_BUFFER_BIT | WGL.gl.DEPTH_BUFFER_BIT);

	// Instead of clearing color buffer, put the previous frame on it (blurred)
	WGL.gl.disable(WGL.gl.DEPTH_TEST);

	var identityMv = mat4.create();

	if (WGL.shaders["blur"] !== undefined) {
		WGL.gl.useProgram(WGL.shaders["blur"]);

		WGL.useTextureFromFrameBuffer('stami');
		WGL.gl.uniform1i(WGL.shaders["blur"].uSampler, 0);
		WGL.gl.uniform1f(WGL.shaders["blur"].uTextureW, WGL.xResolution);
		WGL.gl.uniform1f(WGL.shaders["blur"].uTextureH, WGL.yResolution);
		WGL.gl.uniform1f(WGL.shaders["blur"].uBlurAmount, blurriness);
		WGL.gl.uniform2f(WGL.shaders["blur"].uBlurShift, blurShiftX, blurShiftY);
		WGL.gl.uniform4f(WGL.shaders["blur"].uClearColor, 0.5, 0.5, 0.5, 0.25);

		WGL.gl.uniformMatrix4fv(WGL.shaders["blur"].uPMatrix, false, WGL.orthoProjMatrix);

		// Draw stuff
		WGL.gl.bindBuffer(WGL.gl.ARRAY_BUFFER, WGL.screenVertexBuffer);
		WGL.gl.vertexAttribPointer(WGL.shaders["blur"].aVertexPosition, WGL.screenVertexBuffer.itemSize, WGL.gl.FLOAT, false, 0, 0);
		WGL.gl.bindBuffer(WGL.gl.ARRAY_BUFFER, WGL.screenCoordBuffer);
		WGL.gl.vertexAttribPointer(WGL.shaders["blur"].aTextureCoord, WGL.screenCoordBuffer.itemSize, WGL.gl.FLOAT, false, 0, 0);
		WGL.gl.drawArrays(WGL.gl.TRIANGLE_STRIP, 0, WGL.screenVertexBuffer.numItems);
	}

	WGL.gl.disable(WGL.gl.DEPTH_TEST);
	//WGL.gl.clear(WGL.gl.DEPTH_BUFFER_BIT);
	// End of blur-out

	WGL.gl.enable(WGL.gl.BLEND);
	WGL.gl.blendFunc(WGL.gl.SRC_ALPHA, WGL.gl.ONE_MINUS_SRC_ALPHA);
	WGL.gl.uniform1i(WGL.shaders["quad2d"].uSampler, 0);

	WGL.useTexture("snoop");
	WGL.quad2DColor(1.0, 1.0, 1.0, 1.0);
	WGL.texturedQuad2D(160, 120, 120, (angle * 3.14159 / 180.0));

	WGL.rect2DColor(1.0, 1.0, 1.0, 1.0);
	WGL.texturedRect2D(10, 110, 73, 14,
	                   55, 210, 73, 14);

	font.setAlignment("center");
	font.setScale(1.0);
	font.setColor(1.0, 1.0, 1.0, 1.0);
	font.drawTextXy("Very brown fox, much quick, such jump...", 160, 210, "nokia");
	font.setScale(4);
	font.setColor(0.0, 0.5, 1.0, 1.0);
	font.drawTextXy("Concern.", 160, 10, "nokia");

	//----------------------------------------------------------------------------------------------
	// Intermediate step: draw textured quad from first FBO to second FBO
	WGL.useFrameBuffer('stami');
	WGL.gl.disable(WGL.gl.DEPTH_TEST);

	identityMv = mat4.create();

	WGL.gl.useProgram(WGL.shaders["texture"]);

	WGL.useTextureFromFrameBuffer('stoca');
	WGL.gl.uniform1i(WGL.shaders["texture"].uSampler, 0);
	WGL.gl.uniform1f(WGL.shaders["texture"].uTextureW, WGL.xResolution);
	WGL.gl.uniform1f(WGL.shaders["texture"].uTextureH, WGL.yResolution);

	WGL.gl.uniformMatrix4fv(WGL.shaders["texture"].uMVMatrix, false, identityMv);
	WGL.gl.uniformMatrix4fv(WGL.shaders["texture"].uPMatrix, false, WGL.orthoProjMatrix);

	// Draw stuff
	WGL.gl.bindBuffer(WGL.gl.ARRAY_BUFFER, WGL.screenVertexBuffer);
	WGL.gl.vertexAttribPointer(WGL.shaders["texture"].aVertexPosition, WGL.screenVertexBuffer.itemSize, WGL.gl.FLOAT, false, 0, 0);
	WGL.gl.bindBuffer(WGL.gl.ARRAY_BUFFER, WGL.screenCoordBuffer);
	WGL.gl.vertexAttribPointer(WGL.shaders["texture"].aTextureCoord, WGL.screenCoordBuffer.itemSize, WGL.gl.FLOAT, false, 0, 0);

	WGL.gl.drawArrays(WGL.gl.TRIANGLE_STRIP, 0, WGL.screenVertexBuffer.numItems);

	//----------------------------------------------------------------------------------------------
	// draw textured quad from second FBO to screen
	WGL.gl.bindFramebuffer(WGL.gl.FRAMEBUFFER, null);
	WGL.gl.viewport(0, 0, WGL.mainCanvas.width, WGL.mainCanvas.height);
	
	if (WGL.shaders["CRT"] !== undefined) {
		WGL.gl.useProgram(WGL.shaders["CRT"]); // check for loading if source is in external files!
		//WGL.gl.useProgram(WGL.shaders["texture"]);

		WGL.useTextureFromFrameBuffer('stami');
		WGL.useTexture('bezel', 1);
		WGL.useTexture('glow', 2);

		WGL.gl.uniform1i(WGL.shaders["CRT"].uScanlines, WGL.yResolution);
		WGL.gl.uniform1f(WGL.shaders["CRT"].uBarrelDistortion, 0.15);
		WGL.gl.uniform1f(WGL.shaders["CRT"].uVignette, 8.0);
		
		WGL.gl.uniform1i(WGL.shaders["CRT"].uSampler, 0);
		WGL.gl.uniform1i(WGL.shaders["CRT"].uBezelSampler, 1);
		WGL.gl.uniform1i(WGL.shaders["CRT"].uGlowSampler, 2);

		WGL.gl.uniformMatrix4fv(WGL.shaders["CRT"].uPMatrix, false, WGL.orthoProjMatrix);

		// Draw stuff
		WGL.fullscreenRectangle("CRT");
	}
};

var animateFun = function (elapsed) {

	// Update stuff based on timers and keys
	angle += 180.0 * 0.001;

	input.pollTouchGestures();

	if ((input.keyPressed[37] === true) || (input.gestureLeft === true)) {
		// left
		//angle += elapsed * 60.0 * 0.001;
		blurShiftX -= elapsed * 4.0 * 0.001;
		if (blurShiftX <= -5) {
			blurShiftX = -5;
		}
	} else if ((input.keyPressed[39] === true) || (input.gestureRight === true)) {
		// right
		//angle -= elapsed * 60.0 * 0.001;
		blurShiftX += elapsed * 4.0 * 0.001;
		if (blurShiftX >= 5) {
			blurShiftX = 5;
		}
	}

	if ((input.keyPressed[38] === true) || (input.gestureUp === true)) {
		// up
		//blurriness += elapsed * 0.001;
		//if (blurriness >= 1.5)
		//	blurriness = 1.5;
		blurShiftY += elapsed * 4.0 * 0.001;
		if (blurShiftY >= 5) {
			blurShiftY = 5;
		}
	} else if ((input.keyPressed[40] === true) || (input.gestureDown === true)) {
		// down
		//blurriness -= elapsed * 0.001;
		//if (blurriness <= 0.0)
		//	blurriness = 0.0;
		blurShiftY -= elapsed * 4.0 * 0.001;
		if (blurShiftY <= -5) {
			blurShiftY = -5;
		}
	}
};

var WGL = new WebGlMgr();
WGL.init("MainCanvas", 320, 240);
WGL.setStartFunc(startFunc);
WGL.setDisplayFunc(displayFunc);
window.addEventListener("resize", WGL.checkResize.bind(WGL));

var input = new InputMgr(WGL);

var font = new FontMgr(WGL);
font.loadFontFiles("nokia", "fonts/nokia8xml.fnt", "fonts/nokia8xml_0.png");

var app = new AppMgr();
app.setGlMgr(WGL);
app.setInputMgr(input);
app.start();