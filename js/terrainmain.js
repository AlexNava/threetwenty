var puppa = 0;

var incPuppa = function() {
	++puppa;
};

var moveView = function(x, y) {
	app.viewCenter.xSpeed = - x / app.viewScale;
	app.viewCenter.ySpeed = - y / app.viewScale;
};

var startFunc = function () {
	
	app.terraingrid = new Array(100);
	for (var row = 0; row < 100; row++) {
		app.terraingrid[row] = new Array(100);
			for (var col = 0; col < 100; col++) {
				var test = Math.random();
				if (test < 0.6)
					app.terraingrid[row][col] = 0;
				else
					app.terraingrid[row][col] = 1;                    
			}
	}

	app.viewCenter = {};
	app.viewCenter.x = 50;
	app.viewCenter.y = 50;
	app.viewCenter.xSpeed = 0;
	app.viewCenter.ySpeed = 0;
	app.viewScale = 16; // pixels x unit

	app.mvMatrix = mat4.create();
	app.perspectiveProjMatrix = mat4.create();

	app.createFrameBuffer('Pippa');
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
	app.loadTexture("terrainTiles", "images/terraintiles64.png");
	app.loadTexture("mouse", "images/pointer.png");
	app.loadTexture("bezel", "shaders/crt_images/bezel.png");
	app.loadTexture("glow", "shaders/crt_images/glow.png");
	app.loadTexture("phosphor", "shaders/crt_images/tv-coarse-1536.png");

	input.setPointer("mouse", 0, 0, 8, 8, 0, 7);
};

initShaders = function() {
	// CRT
	app.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
		app.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
		app.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion", "uVignette", "uSampler", "uBezelSampler", "uGlowSampler", "uPhosphorSampler"]);
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
	app.useFrameBuffer('Pippa');
	app.gl.viewport(0, 0, app.xResolution, app.yResolution);
	//app.gl.enable(app.gl.DEPTH_TEST);

	app.gl.clearColor(0.5, 0.5, 0.5, 1.0);
	app.gl.clear(app.gl.COLOR_BUFFER_BIT | app.gl.DEPTH_BUFFER_BIT);

	app.gl.disable(app.gl.DEPTH_TEST);

	app.gl.enable(app.gl.BLEND);
	app.gl.blendFunc(app.gl.SRC_ALPHA, app.gl.ONE_MINUS_SRC_ALPHA);

	var firstRow = Math.round(app.viewCenter.y - (120 / app.viewScale)) - 1;
	var firstCol = Math.round(app.viewCenter.x - (160 / app.viewScale)) - 1;
	var lastRow = Math.round(app.viewCenter.y + (120 / app.viewScale)) + 1;
	var lastCol = Math.round(app.viewCenter.x + (160 / app.viewScale)) + 1;
	
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
			var x = Math.round(160 + (col - app.viewCenter.x) * app.viewScale);
			var y = Math.round(120 + (row - app.viewCenter.y) * app.viewScale);
			app.useTexture("terrainTiles");
			var texCoord = tileCorner(app.terraingrid[row    ][col],
			                          app.terraingrid[row    ][col + 1],
			                          app.terraingrid[row + 1][col + 1],
			                          app.terraingrid[row + 1][col],
			                          64);

			app.texturedRect2D(x, y, app.viewScale, app.viewScale,
			                   texCoord.x, texCoord.y, 16, 16);
			//font.drawTextXy(row + "," + col,
			//x, y,
			//"nokia");
		}
	}

	//font.drawTextXy("Canvas size: " + app.mainCanvas.width + "x" + app.mainCanvas.height,
	//                10, 130, "nokia");
	
	for (var i = 0; i < input.touchPoints.length; i++) {
		if ((input.touchPoints[i] !== undefined) && (input.touchPoints[i].pixelX !== undefined)) {
			font.drawTextXy("touch " + i + ": " + input.touchPoints[i].pixelX + ", " + input.touchPoints[i].pixelY,
			                10,
			                140 + i * 9, "nokia");
		}
	}

	
	font.drawTextXy(app.viewCenter.x + "," + app.viewCenter.y,
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
	app.useFrameBuffer(null);
	app.gl.viewport(0, 0, app.mainCanvas.width, app.mainCanvas.height);
	
	app.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	app.gl.clear(app.gl.COLOR_BUFFER_BIT);

	app.useTextureFromFrameBuffer('Pippa');
	app.useTexture('bezel', 1);
	app.useTexture('glow', 2);
	//app.useTexture('phosphor', 3);
	//app.gl.texParameteri(app.gl.TEXTURE_2D, app.gl.TEXTURE_MAG_FILTER, app.gl.LINEAR);
	//app.gl.texParameteri(app.gl.TEXTURE_2D, app.gl.TEXTURE_MIN_FILTER, app.gl.LINEAR);


	if (app.shaders["CRT"] !== undefined) {
		app.gl.useProgram(app.shaders["CRT"]); // check for loading if source is in external files!        
		app.gl.uniform1i(app.shaders["CRT"].uScanlines, app.yResolution);
		app.gl.uniform1f(app.shaders["CRT"].uBarrelDistortion, 0.15);
		app.gl.uniform1f(app.shaders["CRT"].uVignette, 8.0);

		app.gl.uniform1i(app.shaders["CRT"].uSampler, 0);
		app.gl.uniform1i(app.shaders["CRT"].uBezelSampler, 1);
		app.gl.uniform1i(app.shaders["CRT"].uGlowSampler, 2);
		app.gl.uniform1i(app.shaders["CRT"].uPhosphorSampler, 3);

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

//	if (input.touchPoints[0] != undefined) {
//		if (input.touchPoints[0].checked === false) {
//			app.viewCenter.xSpeed = input.touchPoints[0].lastX - input.touchPoints[0].currentX;
//			app.viewCenter.ySpeed = - input.touchPoints[0].lastY + input.touchPoints[0].currentY;
//			app.viewCenter.xSpeed *= (app.xResolution / document.body.clientWidth) / app.viewScale;
//			app.viewCenter.ySpeed *= (app.yResolution / document.body.clientHeight) / app.viewScale;
//		}
//		else {
//			app.viewCenter.xSpeed = 0;
//			app.viewCenter.ySpeed = 0;
//		}
//	}

	app.viewCenter.x += app.viewCenter.xSpeed;
	app.viewCenter.y += app.viewCenter.ySpeed;

	if (app.viewCenter.x < 0)
		app.viewCenter.x = 0;
	if (app.viewCenter.y < 0)
		app.viewCenter.y = 0;
	if (app.viewCenter.x > 100)
		app.viewCenter.x = 100;
	if (app.viewCenter.y > 100)
		app.viewCenter.y = 100;

	input.pollTouchGestures();
};

var app = new WebGlMgr();
app.init("MainCanvas", 320, 240);
app.setStartFunc(startFunc);
app.setDisplayFunc(displayFunc);
window.addEventListener("resize", app.checkResize.bind(app));

var input = new InputMgr(app);
var font = new FontMgr(app);
var ui = new UiMgr(app, input, font);

font.loadFontFiles("nokia", "fonts/nokia8xml.fnt", "fonts/nokia8xml_0.png");

app.start();
