var startFunc = function () {
	window.addEventListener("click", app.goFullscreen);

	initTextures();
	initShaders();
	
	firstFrame = true;
};

initTextures = function() {
	app.loadTexture("spray", "images/spray16.png");
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

		for (var i = 0; i < 1; i++){
			var x = app.xResolution * Math.random();
			var y = app.xResolution * Math.random();
			var rotation = 360.0 * Math.random();
			app.texturedQuad2D(x, 40, 50, rotation);
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
			app.gl.uniform4f(app.shaders["blur"].uClearColor, 0.0, 0.0, 0.0, 0.05);

			// Draw fullscreen quad
			app.gl.uniformMatrix4fv(app.shaders["blur"].uPMatrix, false, app.orthoProjMatrix);
			app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
			app.gl.vertexAttribPointer(app.shaders["blur"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
			app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
			app.gl.vertexAttribPointer(app.shaders["blur"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
			app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.screenVertexBuffer.numItems);
		}
		
		// Palette FBO2 -> FBO1
		app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, app.rttFramebuffer1);

		app.gl.activeTexture(app.gl.TEXTURE0);
		app.gl.bindTexture(app.gl.TEXTURE_2D, app.rttTexture2);
		if (app.shaders["palette"] !== undefined) {
			app.gl.useProgram(app.shaders["palette"]);

			app.gl.uniform1i(app.shaders["palette"].uSampler, 0);
			app.gl.uniform1f(app.shaders["palette"].uSelectedPalette, 0);
			app.gl.uniform1f(app.shaders["palette"].uPalettesRows, 8);

			// Draw fullscreen quad
			app.gl.uniformMatrix4fv(app.shaders["palette"].uPMatrix, false, app.orthoProjMatrix);
			app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
			app.gl.vertexAttribPointer(app.shaders["palette"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
			app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
			app.gl.vertexAttribPointer(app.shaders["palette"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
		}
		else {
			app.gl.useProgram(app.shaders["texture"]);        
			app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.orthoProjMatrix);

			app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
			app.gl.vertexAttribPointer(app.shaders["texture"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
			app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
			app.gl.vertexAttribPointer(app.shaders["texture"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
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

			app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
			app.gl.vertexAttribPointer(app.shaders["CRT"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
			app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
			app.gl.vertexAttribPointer(app.shaders["CRT"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
		}
		else {
			app.gl.useProgram(app.shaders["texture"]);        
			app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.orthoProjMatrix);

			app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
			app.gl.vertexAttribPointer(app.shaders["texture"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
			app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
			app.gl.vertexAttribPointer(app.shaders["texture"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
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
