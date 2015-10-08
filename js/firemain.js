var startFunc = function () {
	window.addEventListener("click", app.goFullscreen);

	initTextures();
	initShaders();
	
	firstFrame = true;
};

initTextures = function() {
	app.loadTexture("spray", "images/spray8.png");
	app.loadTexture("palette", "images/palettes.png");
};

initShaders = function() {
	// CRT
	app.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
		app.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
		app.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion", "uVignette"]);
	});
	// Blur
	app.loadShaderFiles("blur", "shaders/blurVs.c", "shaders/blurFs.c", function() {
		app.shaderAttributeArrays("blur", ["aVertexPosition", "aTextureCoord"]);
		app.shaderUniforms("blur", ["uPMatrix", "uSampler", "uTextureW", "uTextureH", "uBlurAmount", "uBlurShift", "uClearColor"]);
	});
	// Palette
	app.loadShaderFiles("palette", "shaders/paletteVs.c", "shaders/paletteFs.c", function() {
		app.shaderAttributeArrays("palette", ["aVertexPosition", "aTextureCoord"]);
		app.shaderUniforms("palette", ["uPMatrix", "uBufSampler", "uPalSampler", "uTextureW", "uTextureH", "uSelectedPalette", "uPaletteRows"]);
	});
};

var displayFunc = function(elapsed) {

	app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, app.rttFramebuffer1);
	app.gl.viewport(0, 0, app.xResolution, app.yResolution);

	app.gl.disable(app.gl.DEPTH_TEST);
	app.gl.enable(app.gl.BLEND);
	app.gl.blendFunc(app.gl.SRC_ALPHA, app.gl.ONE_MINUS_SRC_ALPHA);

	if (firstFrame)
	{
		// clear this FBO
		app.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		app.gl.clear(app.gl.COLOR_BUFFER_BIT | app.gl.DEPTH_BUFFER_BIT);

		firstFrame = false;
	}
	else
	{
		// Draw random sprites on FBO1
		app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, app.rttFramebuffer1);

		app.useTexture("spray");
		app.quad2DColor(1.0, 1.0, 1.0, 1.0);

		for (var i = 0; i < 20; i++){
			var x = app.xResolution * Math.random();
			var y = Math.random();
			var rotation = 360.0 * Math.random();
			var size = (1 - y) * 50;
			y *= (0.5 * app.yResolution) - 50;
			app.texturedQuad2D(x, y, size, rotation);
		}

		app.quad2DColor(0.0, 0.0, 0.0, 1.0);

		for (var i = 0; i < 4; i++){
			var x = app.xResolution * Math.random();
			var y = Math.random();
			var rotation = 360.0 * Math.random();
			var size = y * 50;
			var alpha = 1.0 - y;
			y *= (0.5 * app.yResolution);

			app.quad2DColor(0.0, 0.0, 0.0, alpha);
			app.texturedQuad2D(x, y, size, rotation);
		}

		// Blur FBO1 -> FBO2
		app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, app.rttFramebuffer2);
		var identityMv = mat4.create();

		app.gl.activeTexture(app.gl.TEXTURE0);
		app.gl.bindTexture(app.gl.TEXTURE_2D, app.rttTexture1);

		if (app.shaders["blur"] !== undefined) {
			app.gl.useProgram(app.shaders["blur"]);

			app.gl.uniform1i(app.shaders["blur"].uSampler, 0);
			app.gl.uniform1f(app.shaders["blur"].uTextureW, app.xResolution);
			app.gl.uniform1f(app.shaders["blur"].uTextureH, app.yResolution);
			app.gl.uniform1f(app.shaders["blur"].uBlurAmount, 0.1);
			app.gl.uniform2f(app.shaders["blur"].uBlurShift, 0, 2.0);
			app.gl.uniform4f(app.shaders["blur"].uClearColor, 0.0, 0.0, 0.0, 0.025);
			app.gl.uniformMatrix4fv(app.shaders["blur"].uPMatrix, false, app.orthoProjMatrix);

			// Draw fullscreen quad
			app.fullscreenRectangle("blur");
		}
		
		// Palette FBO2 -> FBO1
		app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, app.rttFramebuffer1);

		app.gl.activeTexture(app.gl.TEXTURE0);
		app.gl.bindTexture(app.gl.TEXTURE_2D, app.rttTexture2);
		
		app.useTexture("palette", 1);

		if (app.shaders["palette"] !== undefined) {
			app.gl.useProgram(app.shaders["palette"]);

			app.gl.uniform1i(app.shaders["palette"].uBufSampler, 0);
			app.gl.uniform1i(app.shaders["palette"].uPalSampler, 1);
			app.gl.uniform1f(app.shaders["palette"].uTextureW, app.xResolution);
			app.gl.uniform1f(app.shaders["palette"].uTextureH, app.yResolution);
			app.gl.uniform1f(app.shaders["palette"].uSelectedPalette, 2.0);
			app.gl.uniform1f(app.shaders["palette"].uPaletteRows, 8.0);
			app.gl.uniformMatrix4fv(app.shaders["palette"].uPMatrix, false, app.orthoProjMatrix);
			
			// Draw fullscreen quad
			app.fullscreenRectangle("palette");
		}
		else {
			app.gl.useProgram(app.shaders["texture"]);        
			app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.orthoProjMatrix);

			app.fullscreenRectangle("texture");
		}
		app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.screenVertexBuffer.numItems);

		//----------------------------------------------------------------------------------------------
		// output FBO1 -> screen
		app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, null);
		app.gl.viewport(0, 0, app.mainCanvas.width, app.mainCanvas.height);

		app.gl.activeTexture(app.gl.TEXTURE0);
		app.gl.bindTexture(app.gl.TEXTURE_2D, app.rttTexture1);

		if ((false) && (app.shaders["CRT"] !== undefined)) {
			app.gl.useProgram(app.shaders["CRT"]); // check for loading if source is in external files!        
			app.gl.uniform1i(app.shaders["CRT"].uScanlines, app.yResolution);
			app.gl.uniform1f(app.shaders["CRT"].uBarrelDistortion, 0.25);
			app.gl.uniform1f(app.shaders["CRT"].uVignette, 8.0);
			app.gl.uniformMatrix4fv(app.shaders["CRT"].uPMatrix, false, app.orthoProjMatrix);

			app.fullscreenRectangle("CRT");
		}
		else {
			app.gl.useProgram(app.shaders["texture"]);        
			app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.orthoProjMatrix);

			app.fullscreenRectangle("texture");
		}

		// Draw stuff
		app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.screenVertexBuffer.numItems);

		// Swap FBO1 <-> FBO2 references cause we have the blurred image on FBO2
		var tempTexture = app.rttTexture1;
		var tempFramebuffer = app.rttFramebuffer1;
		app.rttTexture1 = app.rttTexture2;
		app.rttFramebuffer1 = app.rttFramebuffer2;
		app.rttTexture2 = tempTexture;
		app.rttFramebuffer2 = tempFramebuffer;
	}

};

var animateFun = function (elapsed) {
	//input.pollTouchGestures();
};

var app = new WebGlMgr();
app.init("MainCanvas", 320, 240);
app.setStartFunc(startFunc);
app.setDisplayFunc(displayFunc);
window.addEventListener("resize", app.checkResize.bind(app));

//var input = new InputMgr();

var font = new FontMgr(app);
font.loadFontFiles("nokia", "fonts/nokia8xml.fnt", "fonts/nokia8xml_0.png");

app.start();
