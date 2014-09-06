var FontMgr = function (glMgrObject) {
    this.alignments = {
        LEFT: 0,
        CENTER: 1,
        RIGHT: 2
    };
    
    this.glMgr = glMgrObject;
    this.fonts = [];
    this.currentFont = "";
    this.currentScale = 1.0;
    this.currentHAlignment = this.alignments.LEFT;
    this.currentColor = [1, 1, 1, 1];
};

FontMgr.prototype.loadFontFiles = function (alias, xmlFile, bitmapFile) {
    var tempFont = {};
    tempFont.charArray = [];
    
    // load file, manage in callback
    $.get(xmlFile,
        function(data) {
            xmlContent = data;

            var xmlParse = $.parseXML(xmlContent);
            var font = xmlParse.getElementsByTagName("font")[0];
            var common = font.getElementsByTagName("common")[0];
            var chars = font.getElementsByTagName("chars")[0];
            var charCount = chars.getElementsByTagName("char").length;
              
            tempFont.scaleW = parseInt(common.getAttribute("scaleW"));
            tempFont.scaleH = parseInt(common.getAttribute("scaleH"));

            for (var i = 0; i < charCount; i++) {
                var xmlChar = chars.getElementsByTagName("char")[i];
                var tempChar = {};
                
                tempChar.id =        parseInt(xmlChar.getAttribute("id"));
                tempChar.width =     parseInt(xmlChar.getAttribute("width"));
                tempChar.height =    parseInt(xmlChar.getAttribute("height"));
                tempChar.x =         parseInt(xmlChar.getAttribute("x"));
                tempChar.y =         tempFont.scaleH - (parseInt(xmlChar.getAttribute("y")) + tempChar.height);
                tempChar.xoffset =   parseInt(xmlChar.getAttribute("xoffset"));
                tempChar.yoffset =   parseInt(xmlChar.getAttribute("yoffset"));
                tempChar.xadvance =  parseInt(xmlChar.getAttribute("xadvance"));
                
                tempFont.charArray[tempChar.id] = tempChar;
            }
            
            this.glMgr.loadTexture("Font-texture-" + alias, bitmapFile);
            
            this.fonts[alias] = tempFont;
            this.currentFont = alias;
        }.bind(this),
        "text"
    );
    
    this.glMgr.loadTexture("Font-texture-" + alias, bitmapFile);
};

FontMgr.prototype.setAlignment = function(alignment) {
    if (alignment.toUpperCase() == "LEFT") {
        this.currentHAlignment = this.alignments.LEFT;
    }
    else if (alignment.toUpperCase() == "CENTER") {
        this.currentHAlignment = this.alignments.CENTER;
    }
    else if (alignment.toUpperCase() == "RIGHT") {
        this.currentHAlignment = this.alignments.RIGHT;
    }
}

FontMgr.prototype.setScale = function(scale) {
    this.currentScale = scale;
}

FontMgr.prototype.setColor = function(r, g, b, a) {
    this.currentColor = [r, g, b, a];
}

FontMgr.prototype.drawTextXy = function (text, x, y, fontAlias) {
    var currentFont = this.fonts[fontAlias];
    if (currentFont === undefined) {
        return;
    }
    
    // Calculate length
    var textLength = 0;
    if (this.currentHAlignment !== this.alignments.LEFT) // Not needed for this
    {
        for (var i = 0; i < text.length; i++) {
            var id = text.charCodeAt(i);
            var currentChar = currentFont.charArray[id];
            if (currentChar !== undefined) {
                textLength += this.currentScale * currentChar.xadvance;
            }
        }
    }

    var currentX;
    if (this.currentHAlignment === this.alignments.LEFT) {
        currentX = x;
    }
    else if (this.currentHAlignment === this.alignments.CENTER) {
        currentX = Math.floor(x - (textLength / 2));
    }
    else if (this.currentHAlignment === this.alignments.RIGHT) {
        currentX = x - textLength;
    }

    // Draw text
    this.glMgr.rect2DColor(this.currentColor[0], this.currentColor[1], this.currentColor[2], this.currentColor[3]);
    this.glMgr.useTexture("Font-texture-" + fontAlias);
    for (var i = 0; i < text.length; i++) {
        var id = text.charCodeAt(i);
        var currentChar = currentFont.charArray[id];
        if (currentChar !== undefined) {
            this.glMgr.texturedRect2D(currentX, y,
                                      this.currentScale * currentChar.width, this.currentScale * currentChar.height,
                                      currentChar.x, currentChar.y,
                                      currentChar.width, currentChar.height,
                                      currentFont.scaleW, currentFont.scaleH);
                                         
            currentX += this.currentScale * currentChar.xadvance;
        }
    }
}