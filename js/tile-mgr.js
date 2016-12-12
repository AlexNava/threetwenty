var TileMgr = function (glMgrObject) {
	this.glMgr = glMgrObject;
	this.maps = [];
};

RenderOrder = {
	INVALID:    -1,
	RIGHT_DOWN: 1,
	RIGHT_UP:   2,
	LEFT_DOWN:  3,
	LEFT_UP:    4
};

var Map = function() {
	this.renderOrder = RenderOrder.INVALID;
	this.width = 0;
	this.height = 0;
	this.tileWidth = 0;
	this.tileHeight = 0;
	this.tilesets = [];
}

var Tileset = function() {
	this.texture = null;
	this.textureName = "";
	this.tileWidth = 0;
	this.tileHeight = 0;
	this.margin = 0;
	this.spacing = 0;
	this.tileCount = 0;
	this.tiles = [];
	this.imageFile = "";
	this.imageWidth = 0;
	this.imageHeight = 0;
}

var Tile = function() {
	this.x = 0;
	this.y = 0;
}

TileMgr.prototype.loadMap = function (alias, xmlFile) {
	// load file, manage in callback
	$.get(xmlFile,
		function(data) {
			xmlContent = data;
			var xmlFilePath = xmlFile.substring(0, Math.max(xmlFile.lastIndexOf("/"), xmlFile.lastIndexOf("\\")));
			if (xmlFilePath.length > 0)
				xmlFilePath = xmlFilePath + "/";

			var xmlParse = $.parseXML(xmlContent);
			
			var map = new Map();
			var xmlMap = xmlParse.getElementsByTagName("map")[0];

			map.height =      parseInt(xmlMap.getAttribute("height"));
			map.width  =      parseInt(xmlMap.getAttribute("width"));
			map.tileHeight =  parseInt(xmlMap.getAttribute("tileheight"));
			map.tileWidth  =  parseInt(xmlMap.getAttribute("tilewidth"));
			var renderOrder = xmlMap.getAttribute("renderorder");
			if (renderOrder == "right-down")
				map.renderOrder = RenderOrder.RIGHT_DOWN;
			else if (renderOrder == "right-up")
				map.renderOrder = RenderOrder.RIGHT_UP;
			else if (renderOrder == "left-down")
				map.renderOrder = RenderOrder.LEFT_DOWN;
			else if (renderOrder == "left-up")
				map.renderOrder = RenderOrder.LEFT_UP;

			var xmlTileSets = xmlMap.getElementsByTagName("tileset");
			for (var iTs = 0; iTs < xmlTileSets.length; ++iTs)
			{
				var tileset = new Tileset();
				tileset.tileWidth =   parseInt(xmlTileSets[iTs].getAttribute("tilewidth"));
				tileset.tileHeight =  parseInt(xmlTileSets[iTs].getAttribute("tileheight"));
				tileset.margin =      parseInt(xmlTileSets[iTs].getAttribute("margin"));
				tileset.spacing =     parseInt(xmlTileSets[iTs].getAttribute("spacing"));
				tileset.tileCount =   parseInt(xmlTileSets[iTs].getAttribute("tilecount"));

				tileset.textureName = "Tileset-texture-" + xmlTileSets[iTs].getAttribute("name");
				
				var xmlImage = xmlTileSets[iTs].getElementsByTagName("image")[0];
				tileset.imageFile =   xmlImage.getAttribute("source");
				tileset.imageWidth =  parseInt(xmlImage.getAttribute("width"));
				tileset.imageHeight = parseInt(xmlImage.getAttribute("height"));

				this.glMgr.loadTexture(tileset.textureName, xmlFilePath + tileset.imageFile);
				
				// Create tiles
				// Image coordinates go right, down while WebGL's go right, up
				var curX = tileset.margin;
				var curY = tileset.margin;
				while (tileset.tiles.length < tileset.tileCount) {
					// Check if we are past last row
					if ((curY + tileset.tileHeight) > tileset.imageHeight)
						break;

					// Add tile
					var tile = new Tile();
					tile.x = curX;
					tile.y = tileset.imageHeight - (curY + tileset.tileHeight);
					tileset.tiles.push(tile);
					
					// Position for next tile
					curX += (tileset.tileWidth + tileset.spacing);
					if ((curX + tileset.tileWidth) > tileset.imageWidth) {
						// past last column
						curX = tileset.margin;
						curY += (tileset.tileHeight + tileset.spacing);
					}
				}
				
				map.tilesets.push(tileset);
			}
		
			this.maps[alias] = map;
			/*
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
			*/
		}.bind(this),
		"text"
	);

	// do this for each tileset
	//this.glMgr.loadTexture("Font-texture-" + alias, bitmapFile);
};