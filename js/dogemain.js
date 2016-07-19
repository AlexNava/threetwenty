var startFunc = function () {
	window.addEventListener("click", app.goFullscreen);

	angle = 0.0;
	blurriness = 0.5;
	blurShiftX = 1.0;
	blurShiftY = 1.0;

	app.gl.enable(app.gl.DEPTH_TEST);

	app.mvMatrix = mat4.create();
	app.perspectiveProjMatrix = mat4.create();

	initTextures();
	initShaders();
	app.createFrameBuffer('stoca');
	app.createFrameBuffer('stami');
};

initTextures = function() {
	app.loadTexture("snoop", "images/SnoopDogeTransp.png");
	app.loadTexture("code", "images/code64.png");
	app.loadTexture("bezel", "shaders/crt_images/bezel.png");
	app.loadTexture("glow", "shaders/crt_images/glow.png");
};

initShaders = function() {
	// Blur
	app.loadShaderFiles("blur", "shaders/blurVs.c", "shaders/blurFs.c", function() {
		app.shaderAttributeArrays("blur", ["aVertexPosition", "aTextureCoord"]);
		app.shaderUniforms("blur", ["uPMatrix", "uSampler", "uTextureW", "uTextureH", "uBlurAmount", "uBlurShift", "uClearColor"]);
	});
	
	// CRT
	app.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
		app.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
		app.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion", "uVignette", "uSampler", "uBezelSampler", "uGlowSampler", "uPhosphorSampler"]);
	});
};

var displayFunc = function (elapsed) {
	animateFun(elapsed);

	// draw scene on 1st FBO
	app.useFrameBuffer('stoca');
	app.gl.viewport(0, 0, app.xResolution, app.yResolution);
	app.gl.enable(app.gl.DEPTH_TEST);

	//app.gl.clearColor(0.5, 0.5, 0.5, 1.0);
	//app.gl.clear(app.gl.COLOR_BUFFER_BIT | app.gl.DEPTH_BUFFER_BIT);

	// Instead of clearing color buffer, put the previous frame on it (blurred)
	app.gl.disable(app.gl.DEPTH_TEST);

	var identityMv = mat4.create();

	if (app.shaders["blur"] !== undefined) {
		app.gl.useProgram(app.shaders["blur"]);

		app.useTextureFromFrameBuffer('stami');
		app.gl.uniform1i(app.shaders["blur"].uSampler, 0);
		app.gl.uniform1f(app.shaders["blur"].uTextureW, app.xResolution);
		app.gl.uniform1f(app.shaders["blur"].uTextureH, app.yResolution);
		app.gl.uniform1f(app.shaders["blur"].uBlurAmount, blurriness);
		app.gl.uniform2f(app.shaders["blur"].uBlurShift, blurShiftX, blurShiftY);
		app.gl.uniform4f(app.shaders["blur"].uClearColor, 0.5, 0.5, 0.5, 0.25);

		app.gl.uniformMatrix4fv(app.shaders["blur"].uPMatrix, false, app.orthoProjMatrix);

		// Draw stuff
		app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
		app.gl.vertexAttribPointer(app.shaders["blur"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
		app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
		app.gl.vertexAttribPointer(app.shaders["blur"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
		app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.screenVertexBuffer.numItems);
	}

	app.gl.disable(app.gl.DEPTH_TEST);
	//app.gl.clear(app.gl.DEPTH_BUFFER_BIT);
	// End of blur-out

	app.gl.enable(app.gl.BLEND);
	app.gl.blendFunc(app.gl.SRC_ALPHA, app.gl.ONE_MINUS_SRC_ALPHA);
	app.gl.uniform1i(app.shaders["quad2d"].uSampler, 0);

	app.useTexture("snoop");
	app.quad2DColor(1.0, 1.0, 1.0, 1.0);
	app.texturedQuad2D(160, 120, 120, (angle * 3.14159 / 180.0));

	app.rect2DColor(1.0, 1.0, 1.0, 1.0);
	app.texturedRect2D(10, 110, 73, 14,
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
	app.useFrameBuffer('stami');
	app.gl.disable(app.gl.DEPTH_TEST);

	identityMv = mat4.create();

	app.gl.useProgram(app.shaders["texture"]);

	app.useTextureFromFrameBuffer('stoca');
	app.gl.uniform1i(app.shaders["texture"].uSampler, 0);
	app.gl.uniform1f(app.shaders["texture"].uTextureW, app.xResolution);
	app.gl.uniform1f(app.shaders["texture"].uTextureH, app.yResolution);

	app.gl.uniformMatrix4fv(app.shaders["texture"].uMVMatrix, false, identityMv);
	app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.orthoProjMatrix);

	// Draw stuff
	app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
	app.gl.vertexAttribPointer(app.shaders["texture"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
	app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
	app.gl.vertexAttribPointer(app.shaders["texture"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);

	app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.screenVertexBuffer.numItems);

	//----------------------------------------------------------------------------------------------
	// draw textured quad from second FBO to screen
	app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, null);
	app.gl.viewport(0, 0, app.mainCanvas.width, app.mainCanvas.height);
	
	if (app.shaders["CRT"] !== undefined) {
		app.gl.useProgram(app.shaders["CRT"]); // check for loading if source is in external files!
		//app.gl.useProgram(app.shaders["texture"]);

		app.useTextureFromFrameBuffer('stami');
		app.useTexture('bezel', 1);
		app.useTexture('glow', 2);

		app.gl.uniform1i(app.shaders["CRT"].uScanlines, app.yResolution);
		app.gl.uniform1f(app.shaders["CRT"].uBarrelDistortion, 0.15);
		app.gl.uniform1f(app.shaders["CRT"].uVignette, 8.0);
		
		app.gl.uniform1i(app.shaders["CRT"].uSampler, 0);
		app.gl.uniform1i(app.shaders["CRT"].uBezelSampler, 1);
		app.gl.uniform1i(app.shaders["CRT"].uGlowSampler, 2);

		app.gl.uniformMatrix4fv(app.shaders["CRT"].uPMatrix, false, app.orthoProjMatrix);

		// Draw stuff
		app.fullscreenRectangle("CRT");
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

var app = new WebGlMgr();
app.init("MainCanvas", 320, 240);
app.setStartFunc(startFunc);
app.setDisplayFunc(displayFunc);
window.addEventListener("resize", app.checkResize.bind(app));

var input = new InputMgr(app);

var font = new FontMgr(app);
font.loadFontFiles("nokia", "fonts/nokia8xml.fnt", "fonts/nokia8xml_0.png");

app.start();
