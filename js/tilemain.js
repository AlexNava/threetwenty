var viewCenter = {};
viewCenter.x = 50;
viewCenter.y = 50;
viewCenter.xSpeed = 0;
viewCenter.ySpeed = 0;
var viewScale = 16; // pixels x unit

var moveView = function(x, y) {
	viewCenter.xSpeed = - x / viewScale;
	viewCenter.ySpeed = - y / viewScale;
};

var startFunc = function () {
	wgl.checkResize();
	
	wgl.mvMatrix = mat4.create();
	wgl.perspectiveProjMatrix = mat4.create();

	wgl.createFrameBuffer('Pippa');
	initTextures();
	initShaders();

};

initTextures = function() {
	wgl.loadTexture("mouse", "images/pointer.png");
	wgl.loadTexture("bezel", "shaders/crt_images/bezel.png");
	wgl.loadTexture("glow", "shaders/crt_images/glow.png");
	wgl.loadTexture("phosphor", "shaders/crt_images/tv-coarse-1536.png");
	wgl.loadTexture("button", "images/BasicButton.png");
	wgl.loadTexture("roundButton", "images/RoundButton.png");

	input.setPointer("mouse", 0, 0, 8, 8, 0, 7);
};

initShaders = function() {
	// CRT
	wgl.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
		wgl.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
		wgl.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion", "uVignette", "uSampler", "uBezelSampler", "uGlowSampler", "uPhosphorSampler"]);
	});
};


var displayFunc = function(elapsed) {
	animateFun(elapsed);

	// draw scene on 1st FBO
	wgl.useFrameBuffer('Pippa');
	wgl.gl.viewport(0, 0, wgl.xResolution, wgl.yResolution);
	//wgl.gl.enable(wgl.gl.DEPTH_TEST);

	wgl.gl.clearColor(0.5, 0.5, 0.5, 1.0);
	wgl.gl.clear(wgl.gl.COLOR_BUFFER_BIT | wgl.gl.DEPTH_BUFFER_BIT);

	wgl.gl.disable(wgl.gl.DEPTH_TEST);

	wgl.gl.enable(wgl.gl.BLEND);
	wgl.gl.blendFunc(wgl.gl.SRC_ALPHA, wgl.gl.ONE_MINUS_SRC_ALPHA);

	//font.drawTextXy("Canvas size: " + wgl.mainCanvas.width + "x" + wgl.mainCanvas.height,
	//                10, 130, "nokia");
	
	for (var i = 0; i < input.touchPoints.length; i++) {
		if ((input.touchPoints[i] !== undefined) && (input.touchPoints[i].pixelX !== undefined)) {
			font.drawTextXy("touch " + i + ": " + input.touchPoints[i].pixelX + ", " + input.touchPoints[i].pixelY,
			                10,
			                140 + i * 9, "nokia");
		}
	}

	
	font.drawTextXy(viewCenter.x + "," + viewCenter.y,
	                10, 10, "nokia");

	//ui.checkUI();
	input.drawPointer();
	
	//----------------------------------------------------------------------------------------------
	// draw textured quad from first FBO to screen
	wgl.useFrameBuffer(null);
	wgl.gl.viewport(0, 0, wgl.mainCanvas.width, wgl.mainCanvas.height);
	
	wgl.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	wgl.gl.clear(wgl.gl.COLOR_BUFFER_BIT);

	wgl.useTextureFromFrameBuffer('Pippa');
	wgl.useTexture('bezel', 1);
	wgl.useTexture('glow', 2);
	//wgl.useTexture('phosphor', 3);
	//wgl.gl.texParameteri(wgl.gl.TEXTURE_2D, wgl.gl.TEXTURE_MAG_FILTER, wgl.gl.LINEAR);
	//wgl.gl.texParameteri(wgl.gl.TEXTURE_2D, wgl.gl.TEXTURE_MIN_FILTER, wgl.gl.LINEAR);


	if (false && wgl.shaders["CRT"] !== undefined) {
		wgl.gl.useProgram(wgl.shaders["CRT"]); // check for loading if source is in external files!        
		wgl.gl.uniform1i(wgl.shaders["CRT"].uScanlines, wgl.yResolution);
		wgl.gl.uniform1f(wgl.shaders["CRT"].uBarrelDistortion, 0.15);
		wgl.gl.uniform1f(wgl.shaders["CRT"].uVignette, 8.0);

		wgl.gl.uniform1i(wgl.shaders["CRT"].uSampler, 0);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uBezelSampler, 1);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uGlowSampler, 2);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uPhosphorSampler, 3);

		wgl.gl.uniformMatrix4fv(wgl.shaders["CRT"].uPMatrix, false, wgl.orthoProjMatrix);

		wgl.fullscreenRectangle("CRT");
	}
	else {
		wgl.gl.useProgram(wgl.shaders["texture"]);
		wgl.gl.uniformMatrix4fv(wgl.shaders["texture"].uPMatrix, false, wgl.orthoProjMatrix);

		wgl.fullscreenRectangle("texture");
	}

};

var animateFun = function (elapsed) {

//	if (input.touchPoints[0] != undefined) {
//		if (input.touchPoints[0].checked === false) {
//			wgl.viewCenter.xSpeed = input.touchPoints[0].lastX - input.touchPoints[0].currentX;
//			wgl.viewCenter.ySpeed = - input.touchPoints[0].lastY + input.touchPoints[0].currentY;
//			wgl.viewCenter.xSpeed *= (wgl.xResolution / document.body.clientWidth) / wgl.viewScale;
//			wgl.viewCenter.ySpeed *= (wgl.yResolution / document.body.clientHeight) / wgl.viewScale;
//		}
//		else {
//			wgl.viewCenter.xSpeed = 0;
//			wgl.viewCenter.ySpeed = 0;
//		}
//	}

	viewCenter.x += viewCenter.xSpeed;
	viewCenter.y += viewCenter.ySpeed;

	if (viewCenter.x < 0)
		viewCenter.x = 0;
	if (viewCenter.y < 0)
		viewCenter.y = 0;
	if (viewCenter.x > 100)
		viewCenter.x = 100;
	if (viewCenter.y > 100)
		viewCenter.y = 100;

	input.pollTouchGestures();
};

var wgl = new WebGlMgr();
wgl.init("MainCanvas", 320, 240);
wgl.setStartFunc(startFunc);
wgl.setDisplayFunc(displayFunc);
window.addEventListener("resize", wgl.checkResize.bind(wgl));

var input = new InputMgr(wgl);
var font = new FontMgr(wgl);
var ui = new UiMgr(wgl, input, font);

font.loadFontFiles("nokia", "fonts/nokia8xml.fnt", "fonts/nokia8xml_0.png");

var tiler = new TileMgr(wgl);
tiler.loadMap("desert", "tiled/desertmix.tmx");
	
var app = new AppMgr();
app.setGlMgr(wgl);
app.setInputMgr(input);
app.setUiMgr(ui);
app.start();
