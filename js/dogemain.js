var startFunc = function () {
    angle = 0.0;
    blurriness = 0.5;
    blurShiftX = 1.0;
    blurShiftY = 1.0;

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

    // draw scene on 1st FBO
    app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, app.rttFramebuffer1);
    app.gl.viewport(0, 0, app.xResolution, app.yResolution);
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
        app.gl.uniform1f(app.shaders["blur"].uTextureW, app.xResolution);
        app.gl.uniform1f(app.shaders["blur"].uTextureH, app.yResolution);
        app.gl.uniform1f(app.shaders["blur"].uBlurAmount, blurriness);
        app.gl.uniform2f(app.shaders["blur"].uBlurShift, blurShiftX, blurShiftY);
        app.gl.uniform4f(app.shaders["blur"].uClearColor, 0.5, 0.5, 0.5, 0.1);

        app.gl.uniformMatrix4fv(app.shaders["blur"].uMVMatrix, false, identityMv);
        app.gl.uniformMatrix4fv(app.shaders["blur"].uPMatrix, false, app.orthoProjMatrix);

        // Draw stuff
        app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
        app.gl.vertexAttribPointer(app.shaders["blur"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
        app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
        app.gl.vertexAttribPointer(app.shaders["blur"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
        app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.screenVertexBuffer.numItems);
    }

    app.gl.disable(app.gl.DEPTH_TEST);
    //app.gl.clear(app.gl.DEPTH_BUFFER_BIT);
    // End of blur-out

    app.useTexture("snoop");

    app.gl.enable(app.gl.BLEND);
    app.gl.blendFunc(app.gl.SRC_ALPHA, app.gl.ONE_MINUS_SRC_ALPHA);
    app.gl.uniform1i(app.shaders["quad2d"].uSampler, 0);

    app.texturedQuad2D(160, 120, 120, (angle * 3.14159 / 180.0));

    app.texturedRectangle(10, 10, 73, 14,
                          55, 210, 73, 14,
                          512, 512);

    font.drawTextXy("Nokia font 8pt :)", 10, 40, "nokia");
    font.drawTextXy("Very brown fox, much quick, such jump, concern...", 40, 110, "nokia");
    
    

    //----------------------------------------------------------------------------------------------
    // Intermediate step: draw textured quad from first FBO to second FBO
    app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, app.rttFramebuffer2);
    app.gl.viewport(0, 0, app.xResolution, app.yResolution);
    app.gl.disable(app.gl.DEPTH_TEST);

    identityMv = mat4.create();

    app.gl.useProgram(app.shaders["texture"]);

    app.gl.activeTexture(app.gl.TEXTURE0);
    app.gl.bindTexture(app.gl.TEXTURE_2D, app.rttTexture1);
    app.gl.uniform1i(app.shaders["texture"].uSampler, 0);
    app.gl.uniform1f(app.shaders["texture"].uTextureW, app.xResolution);
    app.gl.uniform1f(app.shaders["texture"].uTextureH, app.yResolution);

    app.gl.uniformMatrix4fv(app.shaders["texture"].uMVMatrix, false, identityMv);
    app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.orthoProjMatrix);

    // Draw stuff
    app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
    app.gl.vertexAttribPointer(app.shaders["texture"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
    app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
    app.gl.vertexAttribPointer(app.shaders["texture"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);

    app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.screenVertexBuffer.numItems);

    //----------------------------------------------------------------------------------------------
    // draw textured quad from second FBO to screen
    app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, null);
    app.gl.viewport(0, 0, app.mainCanvas.width, app.mainCanvas.height);

    //app.gl.useProgram(app.shaders["CRT"]); // check for loading if source is in external files!
    app.gl.useProgram(app.shaders["texture"]);

    app.gl.activeTexture(app.gl.TEXTURE0);
    app.gl.bindTexture(app.gl.TEXTURE_2D, app.rttTexture2);

//    app.gl.uniform1i(app.shaders["CRT"].uScanlines, app.yResolution);
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
    angle += 180.0 * 0.001;

    input.pollTouchGestures();

    if ((input.keyPressed[37] === true) || (input.gestureLeft === true)) {
        // left
//        angle += elapsed * 60.0 * 0.001;
        blurShiftX -= elapsed * 4.0 * 0.001;
        if (blurShiftX <= -5) {
            blurShiftX = -5;
        }
    } else if ((input.keyPressed[39] === true) || (input.gestureRight === true)) {
        // right
//        angle -= elapsed * 60.0 * 0.001;
        blurShiftX += elapsed * 4.0 * 0.001;
        if (blurShiftX >= 5) {
            blurShiftX = 5;
        }
    }

    if ((input.keyPressed[38] === true) || (input.gestureUp === true)) {
        // up
//        blurriness += elapsed * 0.001;
//        if (blurriness >= 1.5)
//            blurriness = 1.5;
        blurShiftY += elapsed * 4.0 * 0.001;
        if (blurShiftY >= 5) {
            blurShiftY = 5;
        }
    } else if ((input.keyPressed[40] === true) || (input.gestureDown === true)) {
        // down
//        blurriness -= elapsed * 0.001;
//        if (blurriness <= 0.0)
//            blurriness = 0.0;
        blurShiftY -= elapsed * 4.0 * 0.001;
        if (blurShiftY <= -5) {
            blurShiftY = -5;
        }
    }
};

var app = new WebGlMgr();
app.init("MainCanvas", 320, 240);
app.setStartFunc(startFunc);
app.setDisplayFunc(displayFunc);
window.addEventListener("resize", app.checkResize.bind(app));

var input = new InputMgr();

var font = new FontMgr(app);
font.loadFontFiles("nokia", "fonts/nokia8xml.fnt", "fonts/nokia8xml_0.png");

app.start();
