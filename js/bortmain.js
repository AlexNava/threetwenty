var startFunc = function () {
	window.addEventListener("click", app.goFullscreen);

	app.createFrameBuffer('macheoh');
	initTextures();
	initShaders();
};

initTextures = function() {
	app.loadTexture("bezel", "shaders/crt_images/bezel.png");
	app.loadTexture("glow", "shaders/crt_images/glow.png");
	
	app.loadTexture("mouse", "images/pointer.png");
	input.setPointer("mouse", 0, 0, 8, 8, 0, 7);

};

initShaders = function() {
	// CRT
	app.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
		app.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
		app.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion", "uVignette", "uSampler", "uBezelSampler", "uGlowSampler", "uPhosphorSampler"]);
	});
};

var displayFunc = function(elapsed) {
	animateFun(elapsed);

	// draw scene on 1st FBO
	app.useFrameBuffer('macheoh');
	app.gl.viewport(0, 0, app.xResolution, app.yResolution);
	//app.gl.enable(app.gl.DEPTH_TEST);

	app.gl.clearColor(0.5, 0.5, 0.5, 1.0);
	app.gl.clear(app.gl.COLOR_BUFFER_BIT | app.gl.DEPTH_BUFFER_BIT);

	app.gl.disable(app.gl.DEPTH_TEST);

	app.gl.enable(app.gl.BLEND);
	app.gl.blendFunc(app.gl.SRC_ALPHA, app.gl.ONE_MINUS_SRC_ALPHA);

	font.setAlignment("CENTER");
	if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
		font.drawTextXy("Go fullscreen",
		                160, 100, "nokia");
	}
	else {
		font.drawTextXy("Canvas is fullscreen",
		                160, 100, "nokia");
	}

	font.setAlignment("LEFT");
	font.drawTextXy("Canvas size: " + app.mainCanvas.width + "x" + app.mainCanvas.height,
	                0, 0, "nokia");
	font.drawTextXy("Document body size: " + document.body.clientWidth + "x" + document.body.clientHeight,
	                0, 10, "nokia");
	
	input.drawPointer();

	//----------------------------------------------------------------------------------------------
	// draw textured quad from first FBO to screen
	app.useFrameBuffer(null);
	app.gl.viewport(0, 0, app.mainCanvas.width, app.mainCanvas.height);

	app.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	app.gl.clear(app.gl.COLOR_BUFFER_BIT);

	app.useTextureFromFrameBuffer('macheoh');
	app.useTexture('bezel', 1);
	app.useTexture('glow', 2);

	if (app.shaders["CRT"] !== undefined) {
		app.gl.useProgram(app.shaders["CRT"]); // check for loading if source is in external files!        
		app.gl.uniform1i(app.shaders["CRT"].uScanlines, app.yResolution);
		app.gl.uniform1f(app.shaders["CRT"].uBarrelDistortion, 0.15);
		app.gl.uniform1f(app.shaders["CRT"].uVignette, 10.0);
		app.gl.uniform1i(app.shaders["CRT"].uSampler, 0);
		app.gl.uniform1i(app.shaders["CRT"].uBezelSampler, 1);
		app.gl.uniform1i(app.shaders["CRT"].uGlowSampler, 2);

		app.gl.uniformMatrix4fv(app.shaders["CRT"].uPMatrix, false, app.orthoProjMatrix);
	}
	else {
		app.gl.useProgram(app.shaders["texture"]);        
		app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.orthoProjMatrix);
	}

	// Draw stuff
	if (app.shaders["CRT"] !== undefined) {
		app.fullscreenRectangle("CRT");
	}
	else {
		app.fullscreenRectangle("texture");
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

var input = new InputMgr(app);

var font = new FontMgr(app);
font.loadFontFiles("nokia", "fonts/nokia8xml.fnt", "fonts/nokia8xml_0.png");

app.start();
