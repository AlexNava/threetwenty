var input = new InputMgr();
var app = new WebGlMgr();

// Redefinition of library functions: drawScene, animate

var startFunc = function () {

    app.angle = 0.0;
    app.blurriness = 0.0;
    app.blurShiftX = 1.0;
    app.blurShiftY = 1.0;

    app.gl.enable(this.gl.DEPTH_TEST);

    app.mvMatrix = mat4.create();
    app.pMatrix = mat4.create();

    initTextures();    
};

initTextures = function() {
    app.loadTexture("snoop", "assets/SnoopDoge.jpg");
    app.loadTexture("code", "assets/code64.png");
};

var displayFunc = function (elapsed) {
    animateFun(elapsed);
    checkResize(this.mainCanvas, this.pMatrix);

    // draw scene on 1st FBO
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.rttFramebuffer1);
    this.gl.viewport(0, 0, this.X_RESOLUTION, this.Y_RESOLUTION);
    this.gl.enable(this.gl.DEPTH_TEST);

//    this.gl.clearColor(0.5, 0.5, 0.5, 1.0);
//    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Instead of clearing color buffer, put the previous frame on it (blurred)
    this.gl.disable(this.gl.DEPTH_TEST);

    // Setup orthographic matrices
    var identityMv = mat4.create();
    var orthoMatrix = mat4.create();
    mat4.ortho(orthoMatrix, 0, this.X_RESOLUTION, 0, this.Y_RESOLUTION, -1, 1);

    this.gl.useProgram(this.blurShaderProgram);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.rttTexture2);
    this.gl.uniform1i(this.blurShaderProgram.samplerUniform, 0);
    this.gl.uniform1f(this.blurShaderProgram.textureWUniform, this.X_RESOLUTION);
    this.gl.uniform1f(this.blurShaderProgram.textureHUniform, this.Y_RESOLUTION);
    this.gl.uniform1f(this.blurShaderProgram.blurAmountUniform, 0.25);
    this.gl.uniform2f(this.blurShaderProgram.blurShiftUniform, this.blurShiftX, this.blurShiftY);
    this.gl.uniform4f(this.blurShaderProgram.clearColorUniform, 0.5, 0.5, 0.5, 0.05);

    this.gl.uniformMatrix4fv(this.blurShaderProgram.mvMatrixUniform, false, identityMv);
    this.gl.uniformMatrix4fv(this.blurShaderProgram.pMatrixUniform, false, orthoMatrix);

    // Draw stuff
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenVertexBuffer);
    this.gl.vertexAttribPointer(this.blurShaderProgram.vertexPositionAttribute, this.screenVertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenCoordBuffer);
    this.gl.vertexAttribPointer(this.blurShaderProgram.textureCoordAttribute, this.screenCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.screenVertexBuffer.numItems);

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    // End of blur-out


    mat4.identity(this.pMatrix);
    mat4.perspective(this.pMatrix, 45, 4.0 / 3.0, 0.1, 100.0);

    mat4.identity(this.mvMatrix);
    mat4.translate(this.mvMatrix, this.mvMatrix, [0.0, 0.0, -1.5]);
    mat4.rotate(this.mvMatrix, this.mvMatrix, (this.angle * 3.14159 / 180.0), [0, 0, 1]);

//    this.gl.useProgram(this.basicShaderProgram);

//    // Set shader matrices to those calculated
//    this.gl.uniformMatrix4fv(this.basicShaderProgram.mvMatrixUniform, false, this.mvMatrix);
//    this.gl.uniformMatrix4fv(this.basicShaderProgram.pMatrixUniform, false, this.pMatrix);

//    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexPosBuffer);
//    this.gl.vertexAttribPointer(this.basicShaderProgram.vertexPositionAttribute, this.triangleVertexPosBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
//    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexColBuffer);
//    this.gl.vertexAttribPointer(this.basicShaderProgram.vertexColorAttribute, this.triangleVertexColBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
//
//    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.triangleVertexPosBuffer.numItems);

    this.gl.useProgram(this.textureShaderProgram);
//    this.gl.activeTexture(this.gl.TEXTURE0);
//    this.gl.bindTexture(this.gl.TEXTURE_2D, this.snoopTexture);
    this.useTexture("snoop");
    this.useTexture("code", 1);
    this.gl.uniform1i(this.textureShaderProgram.samplerUniform, 0);

    // Set shader matrices to those calculated
    this.gl.uniformMatrix4fv(this.textureShaderProgram.mvMatrixUniform, false, this.mvMatrix);
    this.gl.uniformMatrix4fv(this.textureShaderProgram.pMatrixUniform, false, this.pMatrix);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadVertexPosBuffer);
    this.gl.vertexAttribPointer(this.textureShaderProgram.vertexPositionAttribute, this.quadVertexPosBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadCoordBuffer);
    this.gl.vertexAttribPointer(this.textureShaderProgram.textureCoordAttribute, this.quadCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.quadVertexPosBuffer.numItems);

    //----------------------------------------------------------------------------------------------
    // Intermediate step: draw textured quad from first FBO to second FBO
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.rttFramebuffer2);
    this.gl.viewport(0, 0, this.X_RESOLUTION, this.Y_RESOLUTION);
    this.gl.disable(this.gl.DEPTH_TEST);

    // Setup orthographic matrices
    identityMv = mat4.create();
    orthoMatrix = mat4.create();
    mat4.ortho(orthoMatrix, 0, this.X_RESOLUTION, 0, this.Y_RESOLUTION, -1, 1);

    this.gl.useProgram(this.textureShaderProgram);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.rttTexture1);
    this.gl.uniform1i(this.textureShaderProgram.samplerUniform, 0);
    this.gl.uniform1f(this.textureShaderProgram.textureWUniform, this.X_RESOLUTION);
    this.gl.uniform1f(this.textureShaderProgram.textureHUniform, this.Y_RESOLUTION);
    this.gl.uniform1f(this.textureShaderProgram.blurAmountUniform, this.blurriness);

    this.gl.uniformMatrix4fv(this.textureShaderProgram.mvMatrixUniform, false, identityMv);
    this.gl.uniformMatrix4fv(this.textureShaderProgram.pMatrixUniform, false, orthoMatrix);

    // Draw stuff
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenVertexBuffer);
    this.gl.vertexAttribPointer(this.textureShaderProgram.vertexPositionAttribute, this.screenVertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenCoordBuffer);
    this.gl.vertexAttribPointer(this.textureShaderProgram.textureCoordAttribute, this.screenCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.screenVertexBuffer.numItems);

    //----------------------------------------------------------------------------------------------
    // draw textured quad from second FBO to screen
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.mainCanvas.width, this.mainCanvas.height);

    // Setup orthographic matrices
    mat4.identity(orthoMatrix);
    mat4.ortho(orthoMatrix, 0, this.X_RESOLUTION, 0, this.Y_RESOLUTION, -1, 1);

    //this.gl.useProgram(this.crtShaderProgram);
    this.gl.useProgram(this.textureShaderProgram);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.rttTexture2);
    //this.gl.uniform1i(this.crtShaderProgram.scanlinesUniform, this.mainCanvas.height / 2.5);
	this.gl.uniform1i(this.crtShaderProgram.scanlinesUniform, this.Y_RESOLUTION);
    this.gl.uniform1f(this.crtShaderProgram.barrelUniform, 0.0);

    this.gl.uniformMatrix4fv(this.crtShaderProgram.pMatrixUniform, false, orthoMatrix);

    // Draw stuff
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenVertexBuffer);
    this.gl.vertexAttribPointer(this.crtShaderProgram.vertexPositionAttribute, this.screenVertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenCoordBuffer);
    this.gl.vertexAttribPointer(this.crtShaderProgram.textureCoordAttribute, this.screenCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.screenVertexBuffer.numItems);
}.bind(app);

var animateFun = function (elapsed) {

    // Update stuff based on timers and keys
    app.angle += 180.0 * 0.001;

    input.pollTouchGestures();

    if ((input.keyPressed[37] === true) || (input.gestureLeft === true)) {
        // left
//        app.angle += elapsed * 60.0 * 0.001;
        app.blurShiftX -= elapsed * 4.0 * 0.001;
        if (app.blurShiftX <= -5) {
            app.blurShiftX = -5;
        }
    } else if ((input.keyPressed[39] === true) || (input.gestureRight === true)) {
        // right
//        app.angle -= elapsed * 60.0 * 0.001;
        app.blurShiftX += elapsed * 4.0 * 0.001;
        if (app.blurShiftX >= 5) {
            app.blurShiftX = 5;
        }
    }

    if ((input.keyPressed[38] === true) || (input.gestureUp === true)) {
        // up
//        app.blurriness += elapsed * 0.001;
//        if (app.blurriness >= 1.5)
//            app.blurriness = 1.5;
        app.blurShiftY += elapsed * 4.0 * 0.001;
        if (app.blurShiftY >= 5) {
            app.blurShiftY = 5;
        }
    } else if ((input.keyPressed[40] === true) || (input.gestureDown === true)) {
        // down
//        app.blurriness -= elapsed * 0.001;
//        if (app.blurriness <= 0.0)
//            app.blurriness = 0.0;
        app.blurShiftY -= elapsed * 4.0 * 0.001;
        if (app.blurShiftY <= -5) {
            app.blurShiftY = -5;
        }
    }
};

var lastSizeW = 0;
var lastSizeH = 0;

var checkResize = function(canvas, projMatrix) {
    if ((window.innerWidth !== lastSizeW) || (window.innerHeight !== lastSizeH)) {
        lastSizeH = window.innerHeight;
        lastSizeW = window.innerWidth;

        canvas.width = lastSizeW;
        canvas.height = lastSizeH;
    }
};

app.init("MainCanvas", 320, 240);
app.setStartFunc(startFunc);
app.setDisplayFunc(displayFunc);
app.start();
