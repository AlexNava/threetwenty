var SpriteMgr = function (glMgrObject) {
	/*
    this.alignments = {
		LEFT: 1,
		CENTER: 2,
		RIGHT: 3
	};*/

	this.glMgr = glMgrObject;
	this.sprites = [];
    
    // Desired features:
    // - multiple spritesheets per sprite
    // - handle different frame times (really?)
    // - handle automatic transitions (e.g. back to idle) (really?)
    // - define state machine per animations (just states are fine)
    // - handle several objects, each with its own state and render them simultaneously (sort by texture?)
    
	this.currentScale = 1.0;
	this.currentRotation = 0.0;
	this.currentColor = [1, 1, 1, 1];
};

SpriteMgr.prototype.loadSpriteFiles = function (spriteAlias, animAlias, jsonFile, bitmapFile) { // add framerate, repeat?
	var tempSprite = this.sprites[spriteAlias];
    if (tempSprite === undefined) {
        tempSprite = {};
        this.sprites[spriteAlias] = tempSprite;
    }
    
    var tempAnim = {};
    tempAnim.frames = [];
    if (tempSprite.animations === undefined) {
        tempSprite.animations = {};
    }
    tempSprite.animations[animAlias] = tempAnim;
	
    var slashPos = bitmapFile.lastIndexOf("/");
    var dotPos = bitmapFile.lastIndexOf(".");
    // lastIndexOf returns -1 if not found
    var bitmapName = bitmapFile.substring(slashPos + 1, dotPos);
    var bitmapExt = bitmapFile.substring(dotPos); // i want the dot
    
	// load file, manage in callback
	$.get(jsonFile,
		function(data) {
			var jsonContent = data;

			//var xmlParse = $.parseXML(xmlContent);
            var jsonParse = JSON.parse(jsonContent)
            jsonParse.frames; // just add everything to tempAnim?

            var i = 0;
            while (jsonParse.frames[bitmapName + i + bitmapExt] != undefined) {
                // append element
                var tempFrame = {};
                tempFrame.x = jsonParse.frames[bitmapName + i + bitmapExt].frame.x;
                tempFrame.y = jsonParse.frames[bitmapName + i + bitmapExt].frame.y;
                tempFrame.w = jsonParse.frames[bitmapName + i + bitmapExt].frame.w;
                tempFrame.h = jsonParse.frames[bitmapName + i + bitmapExt].frame.h;
                
                tempAnim.frames[i] = tempFrame;
                ++i;
            }
			
			this.glMgr.loadTexture("Sprite-texture-" + spriteAlias + "-" + animAlias, bitmapFile);
			
		}.bind(this),
		"text"
	);

	//this.glMgr.loadTexture("Font-texture-" + alias, bitmapFile);
};

SpriteMgr.prototype.setScale = function(scale) {
	this.currentScale = scale;
}

SpriteMgr.prototype.setRotation = function(rotation) {
	this.currentRotation = rotation;
}

SpriteMgr.prototype.setColor = function(r, g, b, a) {
	this.currentColor = [r, g, b, a];
}

SpriteMgr.prototype.drawSprite = function (x, y, spriteAlias, animAlias, frame) {
	var currentAnim = this.sprites[spriteAlias].animations[animAlias]; // aka texture
	if (currentAnim === undefined) {
		return;
	}

	// Draw text
	this.glMgr.rect2DColor(this.currentColor[0], this.currentColor[1], this.currentColor[2], this.currentColor[3]);
	//this.glMgr.rect2DRotation(this.currentRotation);
	this.glMgr.useTexture("Sprite-texture-" + spriteAlias + "-" + animAlias);

    this.glMgr.texturedRect2D(x, y,
        this.currentScale * currentAnim.frames[frame].w, this.currentScale * currentAnim.frames[frame].h,
        currentAnim.frames[frame].x, currentAnim.frames[frame].y,
        currentAnim.frames[frame].w, currentAnim.frames[frame].h,);

}