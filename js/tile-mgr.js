var TileMgr = function (glMgrObject) {
	this.glMgr = glMgrObject;
	this.maps = [];
	this.mapRenderer = new MapRenderer();
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
	this.tiles = [];
	this.layers = [];
}

var Tileset = function() {
	this.name = "";
	this.textureName = "";
	this.tileWidth = 0;
	this.tileHeight = 0;
	this.margin = 0;
	this.spacing = 0;
	this.firstId = 0;
	this.tileCount = 0;
	this.imageFile = "";
	this.imageWidth = 0;
	this.imageHeight = 0;
	this.textureLoaded = false;
}

var Tile = function() {
	this.x = 0;
	this.y = 0;
	this.tileset = null;
}

var Layer = function() {
	this.name = "";
	this.width = 0;
	this.height = 0;
	this.data = [];
	this.bufferValid = false;
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

			// Tilesets (only embedded for now)
			var xmlTileSets = xmlMap.getElementsByTagName("tileset");
			for (var iTs = 0; iTs < xmlTileSets.length; ++iTs)
			{
				var tileset = new Tileset();
				tileset.name =        xmlTileSets[iTs].getAttribute("name");
				tileset.tileWidth =   parseInt(xmlTileSets[iTs].getAttribute("tilewidth"));
				tileset.tileHeight =  parseInt(xmlTileSets[iTs].getAttribute("tileheight"));
				tileset.margin =      parseInt(xmlTileSets[iTs].getAttribute("margin"));
				tileset.spacing =     parseInt(xmlTileSets[iTs].getAttribute("spacing"));
				tileset.firstId =     parseInt(xmlTileSets[iTs].getAttribute("firstgid"));
				tileset.tileCount =   parseInt(xmlTileSets[iTs].getAttribute("tilecount"));

				var xmlImage = xmlTileSets[iTs].getElementsByTagName("image")[0];
				tileset.imageFile =   xmlFilePath + xmlImage.getAttribute("source");
				tileset.imageWidth =  parseInt(xmlImage.getAttribute("width"));
				tileset.imageHeight = parseInt(xmlImage.getAttribute("height"));

				if (tileset.margin != tileset.margin) // NaN if attribute is missing
					tileset.margin =  0;
				if (tileset.spacing != tileset.spacing) // NaN if attribute is missing
					tileset.spacing = 0;

				// load textures in a second step

				// Create tiles
				// Image coordinates go right, down while WebGL's go right, up
				var curX = tileset.margin;
				var curY = tileset.margin;
				var iTile = 0; // tileset.firstId will be used when postprocessing the map
				while (iTile < tileset.tileCount) {
					// Check if we are past last row
					if ((curY + tileset.tileHeight) > tileset.imageHeight)
						break;

					// Add tile
					var tile = new Tile();
					tile.x = curX;
					tile.y = tileset.imageHeight - (curY + tileset.tileHeight);
					tile.tileset = tileset;
					map.tiles[iTile] = tile;
					//tileset.tiles[iTile] = tile;
					
					// Position for next tile
					++iTile;
					curX += (tileset.tileWidth + tileset.spacing);
					if ((curX + tileset.tileWidth) > tileset.imageWidth) {
						// past last column
						curX = tileset.margin;
						curY += (tileset.tileHeight + tileset.spacing);
					}
				}

				map.tilesets.push(tileset);
				map.tilesets[tileset.name] = tileset;
			}

			// Layers
			var xmlLayers = xmlMap.getElementsByTagName("layer");
			for (var iLa = 0; iLa < xmlLayers.length; ++iLa) {
				var layer = new Layer();
				layer.name =    xmlLayers[iLa].getAttribute("name");
				layer.width =   parseInt(xmlLayers[iLa].getAttribute("width"));
				layer.height =  parseInt(xmlLayers[iLa].getAttribute("height"));

				// Map data. I expect this to be zlib compressed, base64 encoded
				var xmlData =      xmlLayers[iLa].getElementsByTagName("data")[0];
				var compression =  xmlData.getAttribute("compression");
				var encoding =     xmlData.getAttribute("encoding");
				if ((encoding === "base64") && (compression === "zlib")) {
					var b64Data = xmlData.firstChild.nodeValue.trim();
					var strData = atob(b64Data);

					// Convert binary string to character-number array
					var charData = strData.split('').map(function(x){return x.charCodeAt(0);});
					// Turn number array into byte-array
					var binData = new Uint8Array(charData);

					var data8 = pako.inflate(binData); // Returned as Uint8Array
					
					layer.data = new Uint32Array(data8.buffer); // Copy array packing each 4 bytes in a Uint32
				}
				map.layers.push(layer);
				map.layers[layer.name] = layer;
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

TileMgr.prototype.loadMapsTextures = function() {
	for (var iMap = 0; iMap < this.maps.length; ++iMap) {
		for (var iTs = 0; iTs < this.maps[iMap].tilesets.length; ++iTs) {
			if (this.maps[iMap].tilesets[iTs].textureLoaded === true)
				continue;
			this.maps[iMap].tilesets[iTs].textureName = "Tileset-texture-" + this.maps[iMap].tilesets[iTs].name;
			this.glMgr.loadTexture(this.maps[iMap].tilesets[iTs].textureName, this.maps[iMap].tilesets[iTs].imageFile);
			this.maps[iMap].tilesets[iTs].textureLoaded = true;
		}
	}
}

var MapRenderer = function() {
	// set viewport size
	// set camera position
	// draw layer(n) -> on current fbo, with set blending (?)
	//   -> also updates each layer's texture, checking for changed camera position, tiles and animations
	//   -> camera movement affected by parallax parameter
	//   -> maybe leave animation for something else and make it update the tiles and sprites?
	
	
}