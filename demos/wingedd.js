var startFunc = function () {
	wgl.checkResize();
	wgl.createFrameBuffer('mainFB');
	initTextures();
	initShaders();
    
    sprite.loadSpriteFiles("emy", "walk", "emy walk/emy walk.json", "emy walk/emy walk.png");
};

initTextures = function() {
/*
	wgl.loadTexture("bezel", "shaders/crt_images/bezel.png");
	wgl.loadTexture("glow", "shaders/crt_images/glow.png");
*/
	wgl.loadTexture("mouse", "images/pointer.png");
	input.setPointer("mouse", 0, 0, 8, 8, 0, 7);

};

initShaders = function() {
/*
	// CRT
	wgl.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
		wgl.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
		wgl.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion", "uVignette", "uSampler", "uBezelSampler", "uGlowSampler", "uPhosphorSampler"]);
	});
*/
};

var displayFunc = function(elapsed) {
	animateFun(elapsed);
/*
	// draw scene on 1st FBO
	wgl.useFrameBuffer('macheoh');
	wgl.gl.viewport(0, 0, wgl.xResolution, wgl.yResolution);
	//wgl.gl.enable(wgl.gl.DEPTH_TEST);

	wgl.gl.clearColor(0.5, 0.5, 0.5, 1.0);
	wgl.gl.clear(wgl.gl.COLOR_BUFFER_BIT | wgl.gl.DEPTH_BUFFER_BIT);

	wgl.gl.disable(wgl.gl.DEPTH_TEST);

	wgl.gl.enable(wgl.gl.BLEND);
	wgl.gl.blendFunc(wgl.gl.SRC_ALPHA, wgl.gl.ONE_MINUS_SRC_ALPHA);

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
	font.drawTextXy("Canvas size: " + wgl.mainCanvas.width + "x" + wgl.mainCanvas.height,
	                0, 0, "nokia");
	font.drawTextXy("Document body size: " + document.body.clientWidth + "x" + document.body.clientHeight,
	                0, 10, "nokia");
	
	input.drawPointer();

	//----------------------------------------------------------------------------------------------
	// draw textured quad from first FBO to screen
	wgl.useFrameBuffer(null);
	wgl.gl.viewport(0, 0, wgl.mainCanvas.width, wgl.mainCanvas.height);

	wgl.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	wgl.gl.clear(wgl.gl.COLOR_BUFFER_BIT);

	wgl.useTextureFromFrameBuffer('macheoh');
	wgl.useTexture('bezel', 1);
	wgl.useTexture('glow', 2);

	if (wgl.shaders["CRT"] !== undefined) {
		wgl.gl.useProgram(wgl.shaders["CRT"]); // check for loading if source is in external files!        
		wgl.gl.uniform1i(wgl.shaders["CRT"].uScanlines, wgl.yResolution);
		wgl.gl.uniform1f(wgl.shaders["CRT"].uBarrelDistortion, 0.15);
		wgl.gl.uniform1f(wgl.shaders["CRT"].uVignette, 10.0);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uSampler, 0);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uBezelSampler, 1);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uGlowSampler, 2);

		wgl.gl.uniformMatrix4fv(wgl.shaders["CRT"].uPMatrix, false, wgl.orthoProjMatrix);
	}
	else {
		wgl.gl.useProgram(wgl.shaders["texture"]);        
		wgl.gl.uniformMatrix4fv(wgl.shaders["texture"].uPMatrix, false, wgl.orthoProjMatrix);
	}
*/
	// draw scene on 1st FBO
	wgl.useFrameBuffer('mainFB');
	wgl.gl.viewport(0, 0, wgl.xResolution, wgl.yResolution);

	wgl.gl.clearColor(0.3, 0.4, 0.5, 1.0);
	wgl.gl.clear(wgl.gl.COLOR_BUFFER_BIT | wgl.gl.DEPTH_BUFFER_BIT);

	wgl.gl.disable(wgl.gl.DEPTH_TEST);

	wgl.gl.enable(wgl.gl.BLEND);
	wgl.gl.blendFunc(wgl.gl.SRC_ALPHA, wgl.gl.ONE_MINUS_SRC_ALPHA);

    font.setAlignment('LEFT');
    font.setColor(0, 0.5, 1, 1);
    font.drawTextXy('Frame ' + Math.floor(cnt / 10), 10, 10, 'nokia');

    sprite.setColor(1, 1, 1, 1);
    sprite.setScale(2);
    sprite.drawSprite(10, 25, "emy", "walk", Math.floor(cnt / 10));
    
    cnt++;
    if (cnt >= 60)
        cnt = 0;
    // draw textured quad from first FBO to screen
	wgl.useFrameBuffer(null);
	wgl.gl.viewport(0, 0, wgl.mainCanvas.width, wgl.mainCanvas.height);

	wgl.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	wgl.gl.clear(wgl.gl.COLOR_BUFFER_BIT);

	wgl.useTextureFromFrameBuffer('mainFB');

    if (wgl.shaders["CRT"] !== undefined) {
		wgl.fullscreenRectangle("CRT");
	}
	else {
		wgl.gl.useProgram(wgl.shaders["texture"]);
		wgl.gl.uniformMatrix4fv(wgl.shaders["texture"].uPMatrix, false, wgl.orthoProjMatrix);

        wgl.fullscreenRectangle("texture");
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

var input = new InputMgr(wgl);

var font = new FontMgr(wgl);
font.loadFontFiles("nokia", "../fonts/nokia8xml.fnt", "../fonts/nokia8xml_0.png");

var sprite = new SpriteMgr(wgl);

var app = new AppMgr();
app.setGlMgr(wgl);

var cnt = 0;

app.start();
