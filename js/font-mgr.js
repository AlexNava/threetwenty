var FontMgr = function (glMgrObject) {
    this.glMgr = glMgrObject;
    this.fonts = [];
    this.currentFont = "";
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

FontMgr.prototype.drawTextXy = function (text, x, y, fontAlias) {
    var currentFont = this.fonts[fontAlias];
    if (currentFont === undefined) {
        return;
    }
    
    var currentX = x;
    
    this.glMgr.useTexture("Font-texture-" + fontAlias);
    for (var i = 0; i < text.length; i++) {
        var id = text.charCodeAt(i);
        var currentChar = currentFont.charArray[id];
        if (currentChar !== undefined) {
            this.glMgr.texturedRectangle(currentX, y,
                                         currentChar.width, currentChar.height,
                                         currentChar.x, currentChar.y,
                                         currentChar.width, currentChar.height,
                                         currentFont.scaleW, currentFont.scaleH);
                                         
            currentX += currentChar.xadvance;
        }
    }
}