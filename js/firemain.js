var startFunc = function () {
	window.addEventListener("click", wgl.goFullscreen);

	initFBs();
	initTextures();
	initShaders();
	
	firstFrame = true;
};

initFBs = function() {
	wgl.createFrameBuffer('First');
	wgl.createFrameBuffer('Second');
};

initTextures = function() {
	wgl.loadTexture("spray", "images/spray8.png");
	wgl.loadTexture("palette", "images/palettes.png");
};

initShaders = function() {
	// CRT
	wgl.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
		wgl.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
		wgl.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion", "uVignette"]);
	});
	// Blur
	wgl.loadShaderFiles("blur", "shaders/blurVs.c", "shaders/blurFs.c", function() {
		wgl.shaderAttributeArrays("blur", ["aVertexPosition", "aTextureCoord"]);
		wgl.shaderUniforms("blur", ["uPMatrix", "uSampler", "uTextureW", "uTextureH", "uBlurAmount", "uBlurShift", "uClearColor"]);
	});
	// Palette
	wgl.loadShaderFiles("palette", "shaders/paletteVs.c", "shaders/paletteFs.c", function() {
		wgl.shaderAttributeArrays("palette", ["aVertexPosition", "aTextureCoord"]);
		wgl.shaderUniforms("palette", ["uPMatrix", "uBufSampler", "uPalSampler", "uTextureW", "uTextureH", "uSelectedPalette", "uPaletteRows"]);
	});
};

var displayFunc = function(elapsed) {

	wgl.useFrameBuffer('First');
	wgl.gl.viewport(0, 0, wgl.xResolution, wgl.yResolution);
	wgl.gl.disable(wgl.gl.DEPTH_TEST);
	wgl.gl.enable(wgl.gl.BLEND);
	wgl.gl.blendFunc(wgl.gl.SRC_ALPHA, wgl.gl.ONE_MINUS_SRC_ALPHA);

	if (firstFrame)
	{
		// clear FBO1
		wgl.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		wgl.gl.clear(wgl.gl.COLOR_BUFFER_BIT | wgl.gl.DEPTH_BUFFER_BIT);

		firstFrame = false;
	}
	else
	{
		// Draw random sprites on FBO1
		wgl.useTexture("spray");
		wgl.quad2DColor(1.0, 1.0, 1.0, 1.0);

		for (var i = 0; i < 20; i++){
			var x = wgl.xResolution * Math.random();
			var y = Math.random();
			var rotation = 360.0 * Math.random();
			var size = (1 - y) * 50;
			y *= (0.5 * wgl.yResolution) - 50;
			wgl.texturedQuad2D(x, y, size, rotation);
		}

		wgl.quad2DColor(0.0, 0.0, 0.0, 1.0);

		for (var i = 0; i < 6; i++){
			var x = wgl.xResolution * Math.random();
			var y = Math.random();
			var rotation = 360.0 * Math.random();
			var size = y * 50;
			var alpha = 0.5 * (1.0 - y);
			y *= (0.5 * wgl.yResolution);

			wgl.quad2DColor(0.0, 0.0, 0.0, alpha);
			wgl.texturedQuad2D(x, y + 15, size, rotation);
		}

		// Blur FBO1 -> FBO2
		wgl.useFrameBuffer('Second');

		wgl.useTextureFromFrameBuffer('First');

		if (wgl.shaders["blur"] !== undefined) {
			wgl.gl.useProgram(wgl.shaders["blur"]);

			wgl.gl.uniform1i(wgl.shaders["blur"].uSampler, 0);
			wgl.gl.uniform1f(wgl.shaders["blur"].uTextureW, wgl.xResolution);
			wgl.gl.uniform1f(wgl.shaders["blur"].uTextureH, wgl.yResolution);
			wgl.gl.uniform1f(wgl.shaders["blur"].uBlurAmount, 0.1);
			wgl.gl.uniform2f(wgl.shaders["blur"].uBlurShift, 0, 2.0);
			wgl.gl.uniform4f(wgl.shaders["blur"].uClearColor, 0.0, 0.0, 0.0, 0.025);
			wgl.gl.uniformMatrix4fv(wgl.shaders["blur"].uPMatrix, false, wgl.orthoProjMatrix);

			// Draw fullscreen quad
			wgl.fullscreenRectangle("blur");
		}
		
		// Palette FBO2 -> FBO1
		wgl.useFrameBuffer('First');

		wgl.useTextureFromFrameBuffer('Second');
		
		wgl.useTexture("palette", 1);

		if (wgl.shaders["palette"] !== undefined) {
			wgl.gl.useProgram(wgl.shaders["palette"]);

			wgl.gl.uniform1i(wgl.shaders["palette"].uBufSampler, 0);
			wgl.gl.uniform1i(wgl.shaders["palette"].uPalSampler, 1);
			wgl.gl.uniform1f(wgl.shaders["palette"].uTextureW, wgl.xResolution);
			wgl.gl.uniform1f(wgl.shaders["palette"].uTextureH, wgl.yResolution);
			wgl.gl.uniform1f(wgl.shaders["palette"].uSelectedPalette, 2.0);
			wgl.gl.uniform1f(wgl.shaders["palette"].uPaletteRows, 8.0);
			wgl.gl.uniformMatrix4fv(wgl.shaders["palette"].uPMatrix, false, wgl.orthoProjMatrix);
			
			// Draw fullscreen quad
			wgl.fullscreenRectangle("palette");
		}
		else {
			wgl.gl.useProgram(wgl.shaders["texture"]);        
			wgl.gl.uniformMatrix4fv(wgl.shaders["texture"].uPMatrix, false, wgl.orthoProjMatrix);

			wgl.fullscreenRectangle("texture");
		}

		//----------------------------------------------------------------------------------------------
		// output FBO1 -> screen
		wgl.useFrameBuffer(null);
		wgl.gl.viewport(0, 0, wgl.mainCanvas.width, wgl.mainCanvas.height);

		wgl.useTextureFromFrameBuffer('First');

		// Draw stuff
		if ((false) && (wgl.shaders["CRT"] !== undefined)) {
			wgl.gl.useProgram(wgl.shaders["CRT"]); // check for loading if source is in external files!        
			wgl.gl.uniform1i(wgl.shaders["CRT"].uScanlines, wgl.yResolution);
			wgl.gl.uniform1f(wgl.shaders["CRT"].uBarrelDistortion, 0.25);
			wgl.gl.uniform1f(wgl.shaders["CRT"].uVignette, 8.0);
			wgl.gl.uniformMatrix4fv(wgl.shaders["CRT"].uPMatrix, false, wgl.orthoProjMatrix);

			wgl.fullscreenRectangle("CRT");
		}
		else {
			wgl.gl.useProgram(wgl.shaders["texture"]);        
			wgl.gl.uniformMatrix4fv(wgl.shaders["texture"].uPMatrix, false, wgl.orthoProjMatrix);

			wgl.fullscreenRectangle("texture");
		}

		// Swap FBO1 <-> FBO2 references cause we have the blurred image on FBO2
		var tempFramebuffer = wgl.frameBuffers['First'];
		wgl.frameBuffers['First'] = wgl.frameBuffers['Second'];
		wgl.frameBuffers['Second'] = tempFramebuffer;
	}

};

var animateFun = function (elapsed) {
	//input.pollTouchGestures();
};

var wgl = new WebGlMgr();
wgl.init("MainCanvas", 320, 240);
wgl.setStartFunc(startFunc);
wgl.setDisplayFunc(displayFunc);
window.addEventListener("resize", wgl.checkResize.bind(wgl));

//var input = new InputMgr();

var font = new FontMgr(wgl);
font.loadFontFiles("nokia", "fonts/nokia8xml.fnt", "fonts/nokia8xml_0.png");

var app = new AppMgr();
app.setGlMgr(wgl);
app.start();
