/**
 * Library essz:
 * https://github.com/justayak/essz/blob/master/js/essz2.min.js
 */
(function(e){var f=e.BitMatrix2D=function(a,c){var b=a%8;0!==b&&(a=a+8-b);a=Math.ceil(a/8);b=new ArrayBuffer(a*c);this.data=new Uint8Array(b);this.bytePerRow=a;this.h=c};f.prototype.set=function(a,c){var b=this.bytePerRow*c,d=a/8,b=b+(d|d),d=this.data[b];this.data[b]=d|1<<a%8;return this};f.prototype.clear=function(a,c){var b=this.bytePerRow*c,d=a/8,b=b+(d|d),d=this.data[b];this.data[b]=d&~(1<<a%8);return this};f.prototype.test=function(a,c){var b=this.bytePerRow*c,d=a/8;return 0!==(this.data[b+(d|
    d)]&1<<a%8)};f.prototype.debug=function(a){"undefined"===typeof a&&(a={});var c=a.lineBreak||"\n";a=a.bit4||"";for(var b="",d=0;d<this.h;d++){for(var g=0;g<8*this.bytePerRow;g++)0===g%8?b+=" ":0===g%4&&(b+=a),b+=this.test(g,d)?"1":"0";b+=c}return b};e=e.IntMatrix2D=function(a,c){var b=new ArrayBuffer(a*c*4);this.data=new Int32Array(b);this.w=a;this.h=c};e.prototype.get=function(a,c){return this.data[c*this.w+a]};e.prototype.set=function(a,c,b){this.data[c*this.w+a]=b;return this};e.prototype.setField=
    function(a,c,b,d,g){for(var e=this.data,k=this.w,f=0;f<d;f++)for(var h=0;h<b;h++)e[(c+f)*k+(a+h)]=g};e.prototype.hasValue=function(a,c,b,d,g){if(void 0===d||void 0===g||1===d&&1===g)return this.get(c,b)===a;for(var e=0;e<g;e++)for(var f=0;f<d;f++)if(this.get(c+f,b+e)===a)return!0;return!1};e.prototype.debug=function(){for(var a="",c=-1;c<this.h;c++){for(var b=-1;b<this.w;b++)a=-1===c&&-1===b?"\t\t":-1===c?a+("|\t<"+b+">\t"):-1===b?a+("|\t<"+c+">\t"):a+("|\t"+this.data[c*this.w+b]+"\t");a+="\n"}return a}})("undefined"===
    typeof exports?this.essz={}:exports);

/**
 * Created by Julian on 10/5/2014.
 */
(function(){

    var VERBOSE = true;

    if (typeof Smila === "undefined") {
        throw logStr("Smila2 must be loaded!");
    }

    var UniformSprite = Smila.UniformSprite;
    var log = Smila.log;
    var logStr = Smila.logStr;
    var isDefined = Smila.isDefined;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Map
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var TileSet = function(canvas, options) {
        if (!isDefined(options)) throw logStr("Entity needs options");
        if (!isDefined(options.firstgid)) throw logStr("Entity needs animations");
        UniformSprite.call(this, canvas, options);
        this.firstgid = options.firstgid;
        this.tileSetWidth = canvas.width / options.w;
        this.options = options;
    };
    TileSet.prototype = Object.create(UniformSprite.prototype);

    /**
     *
     * @param id
     * @return {Boolean} When True, the tile is actually set!
     */
    TileSet.prototype.setTile = function (id) {
        //if (id < this.firstgid) throw "ERROR: [Smila::TileSet->setTile] Cannot apply id {" + id + "}";
        if (id === 0) return false;
        if (id >= this.firstgid){
            var lastRow = id % this.tileSetWidth === 0;
            var row = Math.floor((id - (this.firstgid - 1)) / this.tileSetWidth);
            if (lastRow) row -= 1;
            var column = lastRow ? (this.tileSetWidth - 1) : (id % this.tileSetWidth) - 1;
            this.subimage(column,row);
            return true;
        }
        return false;
    };

    /**
     * Creates a sprite form the tileset that points to a specific
     */
    TileSet.prototype.splice = function(){
        return new TileSet(this.img, this.options);
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Map
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var MAP_TILE_SIZE = 50;

    /**
     * This is a Tiled-Map (http://www.mapeditor.org/)
     * The map needs to be squared and split into 4 layers
     *  ______
     * | Background (0) - Gets rendered behind all other elements (static)
     * |  _______
     * | | Background (1) - Gets rendered behind all other elements but before the 0-Background (static)
     * | |  ____________
     * | | | Dymamic (2) - Gets rendered and interacts with other entities based on its y-value (dynamic)
     * | | |  ______________
     * | | | | Top (3) - Gets rendered over all other elements, even Particles (static)
     * | | | |  __________
     * | | | | | Events (4) - Event system: subtracts the grid id with its tilesets firstgid. 0 Means no event, 1 means "non-movable", all others get triggered
     * | | | | |
     * | | | | |    ************************
     * | | | | |    * Event-Objects (5) - Event system: Key-Value-Stores to events!
     * | | | | |    *
     * | | | | |    *
     * @type {Function}
     */
    var Map = Smila.Map = function(json, imgFolder, callback){
        this.w = json.width;
        this.h = json.height;
        var ts = json.tilesets[0];
        var tileSetOptions = {
            w : json.tilewidth,
            h : json.tileheight,
            firstgid: ts.firstgid
        };
        this.sprites = [];
        var self = this;
        var key = ts.name;
        Smila.DataStore.put({
            src: imgFolder + ts.image.replace(/^.*[\\\/]/, ''),
            key:key
        }, function(){
            self.tileset = new TileSet(Smila.DataStore._get_raw_(key), tileSetOptions);
            _mapInit(self, json);
            callback.call(self);
        });

        this.subtiles = [];     // Background
        this.subtilesTop = [];    // Topground

        this.currentX = 0;
        this.currentY = 0;
        this.currentLX = 1;
        this.currentLY = 1;
        this.tilewidth = json.tilewidth;
        this.tileheight = json.tileheight;

        this.w = json.width;
        this.h = json.height;

        this.subtileWidth = MAP_TILE_SIZE * json.tilewidth;
        this.subtileHeight = MAP_TILE_SIZE * json.tileheight;

        var xSteps = Math.ceil((json.width * json.tilewidth) / this.subtileWidth);
        var ySteps = Math.ceil((json.height * json.tileheight) / this.subtileHeight);

        log("Map: create subs: " + xSteps + " x " + ySteps + "  {" + this.subtileWidth + " x " + this.subtileHeight + "} per Element");

        for (var x = 0; x < xSteps; x++) {
            this.subtiles[x] = [];
            this.subtilesTop[x] = [];
            for (var y = 0; y < ySteps; y++) {
                var canvas = document.createElement("canvas");
                canvas.width = this.subtileWidth;
                canvas.height = this.subtileHeight;
                this.subtiles[x][y] = canvas;
                var canvast = document.createElement("canvas");
                canvast.width = this.subtileWidth;
                canvast.height = this.subtileHeight;
                this.subtilesTop[x][y] = canvast;
            }
        };

    };

    /**
     *
     * @param map
     * @param json
     * @private
     */
    function _mapInit(map, json){
        var bottom = json.layers[0];
        var bottom2 = json.layers[1];
        var top = json.layers[3];
        var dyn = json.layers[2];
        _mapLayerToCanvas([bottom,bottom2],map.subtiles, map.tileset,json.tilewidth, json.tileheight, json.width, map.subtileWidth,map.subtileHeight);
        _mapLayerToCanvas(top,map.subtilesTop, map.tileset,json.tilewidth, json.tileheight, json.width, map.subtileWidth,map.subtileHeight);
        map.sprites = _createSpritesFromDynamicLayer(dyn, map.tileset, json.width,json.tilewidth, json.tileheight);
        log("Map: load dynamic sprites onto map: {" + map.sprites.length + "}");
        if (json.layers.length > 4 && json.tilesets.length > 1){
            var events = json.layers[4].data;
            var eventFGID = (json.tilesets[1].firstgid) - 1;

            // Key-Value-store with: x_y : { .. }, like: 10_4 : { name: "Jul" }
            var eventDataLookup = {};
            if (json.layers.length > 5){
                var tileWidth = json.tilewidth;
                var tileHeight = json.tileheight;
                var objs = json.layers[5];
                if(objs.type === "objectgroup"){
                    for(var i = 0; i < objs.objects.length; i++){
                        var current = objs.objects[i];
                        var x = Math.floor(current.x / tileWidth);
                        var y = Math.floor(current.y / tileHeight);
                        eventDataLookup[x + "_" + y] = {
                            name : current.name,
                            properties : current.properties
                        }
                    }
                }
            }

            map.eventLayer = [];
            for(var x = 0; x < json.width; x++){
                map.eventLayer[x] = [];
                for (var y = 0; y < json.height; y++){
                    var i = y * json.width + x;
                    if (events[i] === 0) map.eventLayer[x][y] = 0;
                    else{
                        var key = x + "_" + y;
                        var data = {};
                        var value = events[i] - eventFGID;
                        if (key in eventDataLookup){
                            data = eventDataLookup[key];
                        }
                        map.eventLayer[x][y] = {
                            id : events[i] - eventFGID,
                            data : data
                        };
                    }
                }
            }
        }
    };

    Map.prototype.renderBackground = function (ctx, cameraX, cameraY, viewport_w, viewport_h) {
        var x = Math.floor(cameraX / this.subtileWidth);
        var y = Math.floor(cameraY / this.subtileHeight);
        var rx = (x * this.subtileWidth) + (this.subtileWidth - (x % this.subtileWidth)) + viewport_w;
        var by = (y * this.subtileHeight) + (this.subtileHeight - (y % this.subtileHeight)) + viewport_h;
        var X = Math.ceil(rx / this.subtileWidth);
        var Y = Math.ceil(by / this.subtileHeight);
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x >= X) X = x + 1;
        if (y >= Y) Y = y + 1;
        X = Math.min(X, this.subtiles.length);
        Y = Math.min(Y, this.subtiles[0].length);
        this.currentX = x;
        this.currentY = y;
        this.currentLX = X;
        this.currentLY = Y;
        for (; x < X; x++) {
            for (var ty = y; ty < Y; ty++) {
                if (this.subtiles[x][ty] !== null) {
                    ctx.drawImage(this.subtiles[x][ty], x * this.subtileWidth, ty * this.subtileHeight);
                } else {
                    console.log("null at " + x + "|" + ty);
                }

            }
        }
    };

    Map.prototype.renderTopLayer = function(ctx){
        // we calculated the positions for this round inside of the method "renderBackground" already,
        // so we dont need to get them back!
        var x = this.currentX;
        var X = this.currentLX;
        var Y = this.currentLY;
        for(; x < X;x++){
            for (var y = this.currentY; y < Y; y++){
                if (this.subtilesTop[x][y] !== null) {
                    ctx.drawImage(this.subtilesTop[x][y], x * this.subtileWidth, y * this.subtileHeight);
                } else {
                    console.log("null at " + x + "|" + y);
                }
            }
        }
    };

    /**
     *
     * @param x
     * @param y
     */
    Map.prototype.getEvent = function(x,y){
        return this.eventLayer[x][y];
    };

    function _mapLayerToCanvas(layer,canvasMatrix, tileset, tilewidth, tileheight, width,subtileWidth,subtileHeight){
        var sec = null; // currently only 2 extra layers are supported
        if (Array.isArray(layer)){
            sec = layer[1];
            layer = layer[0];
        }

        for (var X = 0; X < canvasMatrix.length; X++) {
            for (var Y = 0; Y < canvasMatrix[0].length; Y++) {
                var ctx = canvasMatrix[X][Y].getContext("2d");
                var ctxX = 0;
                var ctxY = 0;
                for (var x = X * subtileWidth; x < ((X + 1) * subtileWidth) - 1; x += tilewidth) {
                    ctxY = 0;
                    for (var y = Y * subtileHeight; y < ((Y + 1) * subtileHeight) - 1; y += tileheight) {
                        var tx = x / tilewidth;
                        var ty = y / tileheight;
                        var i = ty * width + tx;
                        if(i < layer.data.length){
                            if (tx < width){
                                tileset.position(ctxX,ctxY);
                                if(tileset.setTile(layer.data[i])){
                                    tileset.render(ctx);
                                }
                                if (sec !== null){
                                    if (tileset.setTile(sec.data[i])){
                                        tileset.render(ctx);
                                    }
                                }
                            }
                        }
                        ctxY += tileheight;
                    }
                    ctxX += tilewidth;
                }
            }
        }
    };

    function _createSpritesFromDynamicLayer(layer, tileset, width, tilewidth, tileheight){
        var sprites = [];
        for (var i = 0; i < layer.data.length;i++){
            var j = layer.data[i];
            if (j !== 0){
                var ts = tileset.splice();
                ts.setTile(j);
                var y = (Math.floor(i / width)) * tileheight;
                var x = (i % width) * tilewidth;
                ts.position(x,y);
                sprites.push(ts);
            }
        }
        return sprites;
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // MapLoader
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var mapCache = {};

    var MapLoader = Smila.MapLoader = {

        put : function(mapData, callback) {
            if (mapData instanceof Array) {

            } else {
                loadMap(mapData, function(json){
                    if (typeof json === 'string' || json instanceof String) {
                        json = JSON.parse(json);
                    }
                    mapCache[mapData.key] = new Map(json, mapData.imgFolder, function(){
                        callback.call(MapLoader);
                    });
                });
            }
        },

        get : function(key){
            if (key in mapCache) {
                return mapCache[key];
            } else {
                throw logStr(" Map: Could not find map {" +key+"}");
            }
        }

    };

    /**
     *
     * @param mapData { key, src, imgFolder }
     * @param callback {function}
     */
    function loadMap(mapData, callback){
        log("... start loading {" + mapData.key + "}");
        var xobj = new XMLHttpRequest();
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4) {
                callback(xobj.responseText);
            }
        };
        xobj.open("GET", mapData.src, true);
        xobj.send(null);
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // MapEntity
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var MapEntity = Smila.MapEntity = function(canvas, options){
        Smila.MapEntity.call(this,canvas,options);
        this.mx = 0;
        this.my = 0;

    };

    MapEntity.prototype = Object.create(Smila.MapEntity.prototype);

    /**
     *
     * @param x {Integer}
     * @param y {Integer}
     */
    MapEntity.prototype.put = function(x,y){

    };

})();