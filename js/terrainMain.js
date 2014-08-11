var startFunc = function () {

    app.gl.enable(app.gl.DEPTH_TEST);

    app.mvMatrix = mat4.create();
    app.perspectiveProjMatrix = mat4.create();

    initTextures();
    initShaders();
};

initTextures = function() {
    app.loadTexture("terrainTiles", "images/terrainTiles64.png");
};

initShaders = function() {
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
    //app.gl.enable(app.gl.DEPTH_TEST);

    app.gl.clearColor(0.5, 0.5, 0.5, 1.0);
    app.gl.clear(app.gl.COLOR_BUFFER_BIT | app.gl.DEPTH_BUFFER_BIT);

    app.gl.disable(app.gl.DEPTH_TEST);

    
    var identityMv = mat4.create();
    app.gl.uniform1f(app.shaders["texture"].uTextureW, app.X_RESOLUTION);
    app.gl.uniform1f(app.shaders["texture"].uTextureH, app.Y_RESOLUTION);

    app.gl.uniformMatrix4fv(app.shaders["texture"].uMVMatrix, false, identityMv);
    app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.orthoProjMatrix);
    
    app.useTexture("terrainTiles");

    app.gl.enable(app.gl.BLEND);
    app.gl.blendFunc(app.gl.SRC_ALPHA, app.gl.ONE_MINUS_SRC_ALPHA);

    app.texturedRectangle(10, 10, 128, 128,
                          0, 0, 64, 64,
                          64, 64);

    for (var i = 0; i < input.touchPoints.length; i++) {
        if (input.touchPoints[i].lastX !== undefined) {
            font.drawTextXy("touch " + i + ": " + input.touchPoints[i].lastX + ", " + input.touchPoints[i].lastY,
                            10,
                            140 + i * 9, "nokia");
        }
    }

    //----------------------------------------------------------------------------------------------
    // draw textured quad from first FBO to screen
    app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, null);
    app.gl.viewport(0, 0, app.mainCanvas.width, app.mainCanvas.height);

    //app.gl.useProgram(app.shaders["CRT"]); // check for loading if source is in external files!
    app.gl.useProgram(app.shaders["texture"]);

    app.gl.activeTexture(app.gl.TEXTURE0);
    app.gl.bindTexture(app.gl.TEXTURE_2D, app.rttTexture1);

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
    //angle += 180.0 * 0.001;

    input.pollTouchGestures();
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


var app = new WebGlMgr();
app.init("MainCanvas", 320, 240);
app.setStartFunc(startFunc);
app.setDisplayFunc(displayFunc);

var input = new InputMgr();

var font = new FontMgr(app);
font.loadFontFiles("nokia", "fonts/nokia8xml.fnt", "fonts/nokia8xml_0.png");

app.start();
