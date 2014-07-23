var input = new InputMgr();
var app = new WebGlMgr();

// Redefinition of library functions: drawScene, animate

var startFunc = function () {
    app.angle = 0.0;
    app.blurriness = 0.0;
    app.blurShiftX = 1.0;
    app.blurShiftY = 1.0;

    app.gl.enable(app.gl.DEPTH_TEST);

    app.mvMatrix = mat4.create();
    app.perspectiveProjMatrix = mat4.create();

    initTextures();
    initShaders();
};

initTextures = function() {
    app.loadTexture("snoop", "images/SnoopDogeTransp.png");
    app.loadTexture("code", "images/code64.png");
};

initShaders = function() {
    // Blur
    app.loadShaderFiles("blur", "shaders/blurVs.c", "shaders/blurFs.c", function() {
        app.shaderAttributeArrays("blur", ["aVertexPosition", "aTextureCoord"]);
        app.shaderUniforms("blur", ["uPMatrix", "uMVMatrix", "uSampler", "uTextureW", "uTextureH", "uBlurAmount", "uBlurShift", "uClearColor"]);
    });
    
    // CRT
    app.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
        app.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
        app.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion"]);
    });
};

var displayFunc = function (elapsed) {
    animateFun(elapsed);
    checkResize(app.mainCanvas, app.perspectiveProjMatrix);

    // draw scene on 1st FBO
    app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, app.rttFramebuffer1);
    app.gl.viewport(0, 0, app.X_RESOLUTION, app.Y_RESOLUTION);
    app.gl.enable(app.gl.DEPTH_TEST);

//    app.gl.clearColor(0.5, 0.5, 0.5, 1.0);
//    app.gl.clear(app.gl.COLOR_BUFFER_BIT | app.gl.DEPTH_BUFFER_BIT);

    // Instead of clearing color buffer, put the previous frame on it (blurred)
    app.gl.disable(app.gl.DEPTH_TEST);

    var identityMv = mat4.create();

    if (app.shaders["blur"] !== undefined) {
        app.gl.useProgram(app.shaders["blur"]);

        app.gl.activeTexture(app.gl.TEXTURE0);
        app.gl.bindTexture(app.gl.TEXTURE_2D, app.rttTexture2);
        app.gl.uniform1i(app.shaders["blur"].uSampler, 0);
        app.gl.uniform1f(app.shaders["blur"].uTextureW, app.X_RESOLUTION);
        app.gl.uniform1f(app.shaders["blur"].uTextureH, app.Y_RESOLUTION);
        app.gl.uniform1f(app.shaders["blur"].uBlurAmount, 0.25);
        app.gl.uniform2f(app.shaders["blur"].uBlurShift, app.blurShiftX, app.blurShiftY);
        app.gl.uniform4f(app.shaders["blur"].uClearColor, 0.5, 0.5, 0.5, 0.05);

        app.gl.uniformMatrix4fv(app.shaders["blur"].uMVMatrix, false, identityMv);
        app.gl.uniformMatrix4fv(app.shaders["blur"].uPMatrix, false, app.orthoProjMatrix);

        // Draw stuff
        app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
        app.gl.vertexAttribPointer(app.shaders["blur"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
        app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
        app.gl.vertexAttribPointer(app.shaders["blur"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
        app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.screenVertexBuffer.numItems);
    }

    app.gl.enable(app.gl.DEPTH_TEST);
    app.gl.clear(app.gl.DEPTH_BUFFER_BIT);
    // End of blur-out

    mat4.identity(app.perspectiveProjMatrix);
    mat4.perspective(app.perspectiveProjMatrix, 45, 4.0 / 3.0, 0.1, 100.0);

    mat4.identity(app.mvMatrix);
    mat4.translate(app.mvMatrix, app.mvMatrix, [0.0, 0.0, -1.5]);
    mat4.rotate(app.mvMatrix, app.mvMatrix, (app.angle * 3.14159 / 180.0), [0, 0, 1]);

//    app.gl.useProgram(app.basicShaderProgram);

//    // Set shader matrices to those calculated
//    app.gl.uniformMatrix4fv(app.basicShaderProgram.mvMatrixUniform, false, app.mvMatrix);
//    app.gl.uniformMatrix4fv(app.basicShaderProgram.pMatrixUniform, false, app.perspectiveProjMatrix);

//    app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.triangleVertexPosBuffer);
//    app.gl.vertexAttribPointer(app.basicShaderProgram.vertexPositionAttribute, app.triangleVertexPosBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
//    app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.triangleVertexColBuffer);
//    app.gl.vertexAttribPointer(app.basicShaderProgram.vertexColorAttribute, app.triangleVertexColBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
//
//    app.gl.drawArrays(app.gl.TRIANGLES, 0, app.triangleVertexPosBuffer.numItems);

    app.gl.useProgram(app.shaders["texture"]);    

    app.useTexture("snoop");
    app.useTexture("code", 1);  // not currently used in the shader
    app.gl.enable(app.gl.BLEND);
    app.gl.blendFunc(app.gl.SRC_ALPHA, app.gl.ONE_MINUS_SRC_ALPHA);
    app.gl.uniform1i(app.shaders["texture"].uSampler, 0);

    // Set shader matrices to those calculated
    app.gl.uniformMatrix4fv(app.shaders["texture"].uMVMatrix, false, app.mvMatrix);
    app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.perspectiveProjMatrix);

    app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.quadVertexPosBuffer);
    app.gl.vertexAttribPointer(app.shaders["texture"].aVertexPosition, app.quadVertexPosBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
    app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.quadCoordBuffer);
    app.gl.vertexAttribPointer(app.shaders["texture"].aTextureCoord, app.quadCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);

    app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.quadVertexPosBuffer.numItems);

    //----------------------------------------------------------------------------------------------
    // Intermediate step: draw textured quad from first FBO to second FBO
    app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, app.rttFramebuffer2);
    app.gl.viewport(0, 0, app.X_RESOLUTION, app.Y_RESOLUTION);
    app.gl.disable(app.gl.DEPTH_TEST);

    identityMv = mat4.create();

    app.gl.useProgram(app.shaders["texture"]);

    app.gl.activeTexture(app.gl.TEXTURE0);
    app.gl.bindTexture(app.gl.TEXTURE_2D, app.rttTexture1);
    app.gl.uniform1i(app.shaders["texture"].uSampler, 0);
    app.gl.uniform1f(app.shaders["texture"].uTextureW, app.X_RESOLUTION);
    app.gl.uniform1f(app.shaders["texture"].uTextureH, app.Y_RESOLUTION);
    app.gl.uniform1f(app.shaders["texture"].uBlurAmount, app.blurriness);

    app.gl.uniformMatrix4fv(app.shaders["texture"].uMVMatrix, false, identityMv);
    app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.orthoProjMatrix);

    // Draw stuff
    app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
    app.gl.vertexAttribPointer(app.shaders["texture"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
    app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
    app.gl.vertexAttribPointer(app.shaders["texture"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);

    app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.screenVertexBuffer.numItems);
    
    app.texturedQuad2D(160, 120, 80, 1.57);

    //----------------------------------------------------------------------------------------------
    // draw textured quad from second FBO to screen
    app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, null);
    app.gl.viewport(0, 0, app.mainCanvas.width, app.mainCanvas.height);

    //app.gl.useProgram(app.shaders["CRT"]); // check for loading if source is in external files!
    app.gl.useProgram(app.shaders["texture"]);

    app.gl.activeTexture(app.gl.TEXTURE0);
    app.gl.bindTexture(app.gl.TEXTURE_2D, app.rttTexture2);

//    app.gl.uniform1i(app.shaders["CRT"].uScanlines, app.Y_RESOLUTION);
//    app.gl.uniform1f(app.shaders["CRT"].uBarrel, 0.0);

    app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.orthoProjMatrix);

    // Draw stuff
    app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
    app.gl.vertexAttribPointer(app.shaders["texture"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
    app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
    app.gl.vertexAttribPointer(app.shaders["texture"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);

    app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.screenVertexBuffer.numItems);
};

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
