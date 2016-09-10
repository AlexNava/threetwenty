var puppa = 0;

var incPuppa = function() {
	++puppa;
};

var moveView = function(x, y) {
	wgl.viewCenter.xSpeed = - x / wgl.viewScale;
	wgl.viewCenter.ySpeed = - y / wgl.viewScale;
};

var startFunc = function () {
	wgl.checkResize();
	
	wgl.terraingrid = new Array(100);
	for (var row = 0; row < 100; row++) {
		wgl.terraingrid[row] = new Array(100);
			for (var col = 0; col < 100; col++) {
				var test = Math.random();
				if (test < 0.6)
					wgl.terraingrid[row][col] = 0;
				else
					wgl.terraingrid[row][col] = 1;                    
			}
	}

	wgl.viewCenter = {};
	wgl.viewCenter.x = 50;
	wgl.viewCenter.y = 50;
	wgl.viewCenter.xSpeed = 0;
	wgl.viewCenter.ySpeed = 0;
	wgl.viewScale = 16; // pixels x unit

	wgl.mvMatrix = mat4.create();
	wgl.perspectiveProjMatrix = mat4.create();

	wgl.createFrameBuffer('Pippa');
	initTextures();
	initShaders();

	var puppaCtrl = ui.UiControl;
	puppaCtrl.type = ui.controlType.AREA;
	puppaCtrl.x = 0;
	puppaCtrl.y = 0;
	puppaCtrl.width = 320;
	puppaCtrl.height = 240;
	puppaCtrl.onClick = incPuppa;
	puppaCtrl.onDrag = moveView;
	
	ui.addControl('Puppa', puppaCtrl);
	
};

initTextures = function() {
	wgl.loadTexture("terrainTiles", "images/terraintiles64.png");
	wgl.loadTexture("mouse", "images/pointer.png");
	wgl.loadTexture("bezel", "shaders/crt_images/bezel.png");
	wgl.loadTexture("glow", "shaders/crt_images/glow.png");
	wgl.loadTexture("phosphor", "shaders/crt_images/tv-coarse-1536.png");

	input.setPointer("mouse", 0, 0, 8, 8, 0, 7);
};

initShaders = function() {
	// CRT
	wgl.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
		wgl.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
		wgl.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion", "uVignette", "uSampler", "uBezelSampler", "uGlowSampler", "uPhosphorSampler"]);
	});
};

var tileCorner = function(downLeft, downRight, upRight, upLeft, textureSize) {
	var ret = {x: 0,
	           y: 0}
	var sum = downLeft + downRight * 2 + upRight * 4 + upLeft * 8;

	switch (sum) {
		case 0:
			ret.x = 0.75;
			ret.y = 0.75;
			break;
		case 1:
			ret.x = 0.75;
			ret.y = 0.5;
			break;
		case 2:
			ret.x = 0.25;
			ret.y = 0.5;
			break;
		case 3:
			ret.x = 0.5;
			ret.y = 0.5;
			break;
		case 4:
			ret.x = 0.25;
			ret.y = 0;
			break;
		case 5:
			ret.x = 0.5;
			ret.y = 0.75;
			break;
		case 6:
			ret.x = 0.25;
			ret.y = 0.25;
			break;
		case 7:
			ret.x = 0;
			ret.y = 0;
			break;
		case 8:
			ret.x = 0.75;
			ret.y = 0;
			break;
		case 9:
			ret.x = 0.75;
			ret.y = 0.25;
			break;
		case 10:
			ret.x = 0.25;
			ret.y = 0.75;
			break;
		case 11:
			ret.x = 0;
			ret.y = 0.5;
			break;
		case 12:
			ret.x = 0.5;
			ret.y = 0;
			break;
		case 13:
			ret.x = 0;
			ret.y = 0.75;
			break;
		case 14:
			ret.x = 0;
			ret.y = 0.25;
			break;
		case 15:
			ret.x = 0.5;
			ret.y = 0.25;
			break;
	}
	ret.x *= textureSize;
	ret.y *= textureSize;

	return ret;
}

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

	var firstRow = Math.round(wgl.viewCenter.y - (120 / wgl.viewScale)) - 1;
	var firstCol = Math.round(wgl.viewCenter.x - (160 / wgl.viewScale)) - 1;
	var lastRow = Math.round(wgl.viewCenter.y + (120 / wgl.viewScale)) + 1;
	var lastCol = Math.round(wgl.viewCenter.x + (160 / wgl.viewScale)) + 1;
	
	if (firstRow < 0)
		firstRow = 0;
	if (lastRow >= 99)
		lastRow = 99;
	if (firstCol < 0)
		firstCol = 0;
	if (lastCol >= 99)
		lastCol = 99;
	
	for (var row = firstRow; row < lastRow; row++) {
		for (var col = firstCol; col < lastCol; col++) {
			var x = Math.round(160 + (col - wgl.viewCenter.x) * wgl.viewScale);
			var y = Math.round(120 + (row - wgl.viewCenter.y) * wgl.viewScale);
			wgl.useTexture("terrainTiles");
			var texCoord = tileCorner(wgl.terraingrid[row    ][col],
			                          wgl.terraingrid[row    ][col + 1],
			                          wgl.terraingrid[row + 1][col + 1],
			                          wgl.terraingrid[row + 1][col],
			                          64);

			wgl.texturedRect2D(x, y, wgl.viewScale, wgl.viewScale,
			                   texCoord.x, texCoord.y, 16, 16);
			//font.drawTextXy(row + "," + col,
			//x, y,
			//"nokia");
		}
	}

	//font.drawTextXy("Canvas size: " + wgl.mainCanvas.width + "x" + wgl.mainCanvas.height,
	//                10, 130, "nokia");
	
	for (var i = 0; i < input.touchPoints.length; i++) {
		if ((input.touchPoints[i] !== undefined) && (input.touchPoints[i].pixelX !== undefined)) {
			font.drawTextXy("touch " + i + ": " + input.touchPoints[i].pixelX + ", " + input.touchPoints[i].pixelY,
			                10,
			                140 + i * 9, "nokia");
		}
	}

	
	font.drawTextXy(wgl.viewCenter.x + "," + wgl.viewCenter.y,
	                0, 0, "nokia");
	font.drawTextXy(input.pointer.pixelX + "," + input.pointer.pixelY,
	                0, 10, "nokia");
	font.drawTextXy("Status: " + input.pointer.status,
	                0, 20, "nokia");
	
	font.drawTextXy("puppa = " + puppa,
	                0, 30, "nokia");
	
	ui.checkUI();
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


	if (wgl.shaders["CRT"] !== undefined) {
		wgl.gl.useProgram(wgl.shaders["CRT"]); // check for loading if source is in external files!        
		wgl.gl.uniform1i(wgl.shaders["CRT"].uScanlines, wgl.yResolution);
		wgl.gl.uniform1f(wgl.shaders["CRT"].uBarrelDistortion, 0.15);
		wgl.gl.uniform1f(wgl.shaders["CRT"].uVignette, 10.0);

		wgl.gl.uniform1i(wgl.shaders["CRT"].uSampler, 0);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uBezelSampler, 1);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uGlowSampler, 2);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uPhosphorSampler, 3);

		wgl.gl.uniformMatrix4fv(wgl.shaders["CRT"].uPMatrix, false, wgl.orthoProjMatrix);
	}
	else {
		wgl.gl.useProgram(wgl.shaders["texture"]);        
		wgl.gl.uniformMatrix4fv(wgl.shaders["texture"].uPMatrix, false, wgl.orthoProjMatrix);
	}

	// Draw stuff
	if (wgl.shaders["CRT"] !== undefined) {
		wgl.fullscreenRectangle("CRT");
	}
	else {
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

	wgl.viewCenter.x += wgl.viewCenter.xSpeed;
	wgl.viewCenter.y += wgl.viewCenter.ySpeed;

	if (wgl.viewCenter.x < 0)
		wgl.viewCenter.x = 0;
	if (wgl.viewCenter.y < 0)
		wgl.viewCenter.y = 0;
	if (wgl.viewCenter.x > 100)
		wgl.viewCenter.x = 100;
	if (wgl.viewCenter.y > 100)
		wgl.viewCenter.y = 100;

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

var app = new AppMgr();
app.setGlMgr(wgl);
app.setInputMgr(input);
app.start();
