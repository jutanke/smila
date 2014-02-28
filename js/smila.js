window.Smila = function () {

    function Smila() {
    };

    // SETTINGS
    var useWebGL = false;
    var imagePath = "";
    var defaultOutlineColor = {r:255, g:0, b:0, a:255};
    var verbose;

    var EXPECTED_ELAPSED_MILLIS = Math.floor(1000 / 60);

    /**
     *
     * @param options {object}
     * {
     *      useWebGL : {Boolean}
     *      imagePath : {String}
     * }
     */
    Smila.Settings = function (options) {
        useWebGL = options.useWebGL || false;
        imagePath = options.imagePath || "";
        defaultOutlineColor = options.defaultOutlineColor || {r:255, g:0, b:0, a:255};
        verbose = options.verbose || false;
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //       C L A S S E S
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    /**
     *
     * @type {Function}
     */
    var Sprite = Smila.Sprite = function (canvas, spriteData) {
        this.img = canvas;
        this.frameHeight = spriteData.h;
        this.frameWidth = spriteData.w;
        if (spriteData.o == true) {
            // when a outline for this sprite is specified, we will take it
            this.imgOutlined = spriteCache[spriteData.key + "_outline"].canvas;
        }
        if (spriteData.bm) {
            // if a bitmask for this sprite is specified, we will take it
            this.bitmask = spriteCache[spriteData.key + "_bitmask"];
        } else {
            this.bitmask = null;
        }
        this.ox = 0 | 0;
        this.oy = 0 | 0;
        this.zIndexByYPos = true;
        this.x = 0 | 0;
        this.y = 0 | 0;
        this.z = 0 | 0;
        this.mouseEnter = null;
        this.mouseLeave = null;
        this._mouseIsActive = false;
        this._outline = false;
        this.angleInRadians = 0;
    };

    Sprite.prototype.onmouseenter = function (callback) {
        this._mouseIsActive = true;
        this.mouseEnter = callback;
        return this;
    };

    Sprite.prototype.onmouseleave = function (callback) {
        this._mouseIsActive = true;
        this.mouseLeave = callback;
        return this;
    };

    /**
     * @param outline {Boolean}
     * @return {Sprite}
     */
    Sprite.prototype.outline = function (outline) {
        this._outline = outline;
        return this;
    };

    Sprite.prototype.subimage = function (x, y) {
        this.ox = x;
        this.oy = y;
        return this;
    };

    /**
     * If no parameters are passed, this function gives the position of the sprite, else it sets its position
     * @param x
     * @param y
     * @return {Sprite} || {Position}
     */
    Sprite.prototype.position = function (x, y) {
        if (arguments.length > 0) {
            this.x = x;
            this.y = y;
            return this;
        }
        return {x:this.x, y:this.y};
    };

    Sprite.prototype.toCanvas = function () {
        var canvas = document.createElement('canvas');
        canvas.height = this.frameHeight;
        canvas.width = this.frameWidth;
        var ctx = canvas.getContext('2d');
        var oldX = this.x;
        var oldY = this.y;
        this.x = 0;
        this.y = 0;
        this.render(ctx);
        this.x = oldX;
        this.y = oldY;
        return canvas;
    };

    Sprite.prototype.toBase64 = function () {
        return this.img.toDataURL();
    };

    Sprite.prototype.render = function (context) {
        if (this._mouseIsActive) {
            if (this.mouseEnter !== null || this.mouseLeave !== null) {
                var mousePos = getAbsoluteMousePosition();
                var currentMouseIsOver = false;
                if (mousePos.x >= this.x && mousePos.y >= this.y) {
                    if (mousePos.x <= (this.x + this.frameWidth) && mousePos.y <= (this.y + this.frameHeight)) {
                        if (this.bitmask === null) {
                            currentMouseIsOver = true;
                        } else {
                            if (this.isPixel(mousePos.x, mousePos.y)) {
                                currentMouseIsOver = true;
                            }
                        }
                    }
                }
                if (mousePos.x)
                    if (this._mouseIsOver !== currentMouseIsOver) {
                        if (currentMouseIsOver) {
                            if (this.mouseEnter !== null) this.mouseEnter.call(this);
                        } else {
                            if (this.mouseLeave !== null) this.mouseLeave.call(this);
                        }
                        this._mouseIsOver = currentMouseIsOver;
                    }
            }
        }

        var sx = this.ox * this.frameWidth;
        var sy = this.oy * this.frameHeight;
        var x = (0.5 + this.x) << 0;
        var y = (0.5 + this.y) << 0;
        if (this.zIndexByYPos) this.z = y + (this.frameHeight / 2);
        context.translate(x, y);
        context.rotate(this.angleInRadians);
        if (this._outline) {
            context.drawImage(this.imgOutlined, sx, sy, this.frameWidth, this.frameHeight, 0, 0, this.frameWidth, this.frameHeight);
        } else {
            context.drawImage(this.img, sx, sy, this.frameWidth, this.frameHeight, 0, 0, this.frameWidth, this.frameHeight);
            //context.drawImage(this.img, sx, sy, this.frameWidth, this.frameHeight, minusx, minusy, this.frameWidth, this.frameHeight);
        }
        context.rotate(-this.angleInRadians);
        context.translate(-x, -y);
    };

    /**
     *  Tests, if a pixel got hit by absolute x y
     */
    Sprite.prototype.isPixel = function (x, y) {
        var normalizedX = x - this.x + (this.ox * this.frameWidth);
        var normalizedY = y - this.y + (this.oy * this.frameHeight);
        return this.bitmask.test(normalizedX, normalizedY);
    };

    var TileSet = function (canvas, spriteData, firstgid) {
        Sprite.call(this, canvas, spriteData);
        this.spriteData = spriteData;
        this.firstgid = firstgid;
        this.tileSetWidth = canvas.width / spriteData.w;
    };

    TileSet.prototype = Object.create(Sprite.prototype);

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
        return new TileSet(this.img, this.spriteData,this.firstgid);
    };

    /**
     * @param sprite {Sprite}
     * @param animations {Array}
     * @param durationPerStep {Number}
     * @param type {Animation.Type}
     * @type {Function}
     */
    var Animation = Smila.Animation = function (canvas, spriteData, animations, durationPerStep, type) {
        Sprite.call(this, canvas, spriteData);
        this.animations = animations;
        this.durationPerStepInMs = durationPerStep;
        var atype = typeof type === 'undefined' ? Animation.Type.ONCE : type;
        this.pointer = 0;
        this.isStoped = true;
        this.elapsedTime = 0;
        this.forward = true;
        switch (atype) {
            case Animation.Type.BOUNCE:
                this.subupdate = BOUNCE_UPDATE;
                break;
            case Animation.Type.ENDLESS:
                this.subupdate = ENDLESS_UPDATE;
                break;
            case Animation.Type.ONCE:
                this.subupdate = ONCE_UPDATE;
                break;
        }
    };

    Animation.prototype = Object.create(Sprite.prototype);

    Animation.prototype.play = function () {
        this.isStoped = false;
        return this;
    };

    Animation.prototype.pause = function () {
        this.isStoped = true;
        return this;
    };

    Animation.prototype.reset = function () {
        this.isStoped = true;
        this.pointer = 0;
        return this;
    };

    Animation.prototype.update = function (dt, elapsedMillis) {
        if (!this.isStoped) {
            if (this.animations.length === 1) {
                this.subimage(this.animations[0].x, this.animations[0].y);
            } else {
                if (this.elapsedTime > this.durationPerStepInMs) {
                    this.elapsedTime = 0;
                    this.subupdate();
                    var current = this.animations[this.pointer];
                    this.subimage(current.x, current.y);
                }
                this.elapsedTime += elapsedMillis;
            }
        }
    };

    var ONCE_UPDATE = function () {
        if (this.pointer < this.animations.length - 1) this.pointer += 1;
    };

    var ENDLESS_UPDATE = function () {
        if (this.pointer < (this.animations.length - 1)) this.pointer += 1;
        else this.pointer = 0;
    };

    var BOUNCE_UPDATE = function () {
        if (this.pointer == 0) this.forward = true;
        else if (this.pointer === (this.animations.length - 1)) this.forward = false;
        if (this.forward) this.pointer += 1;
        else this.pointer -= 1;
    };

    Animation.Type = {
        BOUNCE:0,
        ONCE:1,
        ENDLESS:2
    };

    /**
     * A more complex Animation-Sprite. Allows to use more than one animation-type
     * @param canvas {Canvas} used for SpriteData
     * @param spriteData {spriteData} used for SpriteData
     * @param animations {Object}
     * {
     *     "up" : {anims:[], durationPerFrame:66, type:Animation.BOUNCE  },
     *     "down" : {anims:[], durationPerFrame:66, type:Animation.BOUNCE  }
     * }
     * @type {Function}
     */
    var Entity = Smila.Entity = function (canvas, spriteData, animations) {
        Sprite.call(this, canvas, spriteData);
        this.animations = [];
        this.durationPerStepInMs = 0;
        this.elapsedTime = 0;
        this.pointer = 0;
        this.currentState = "";
        this.allanimations = animations;
        this.updateCallback = null;
        this.subupdate = function () {
        };
    };

    Entity.prototype = Object.create(Sprite.prototype);

    Entity.prototype.onUpdate = function (callback) {
        this.updateCallback = callback;
        return this;
    };

    Entity.prototype.animate = function (key) {
        if (key === this.currentState) return;
        var anim = this.allanimations[key];
        if (anim) {
            this.currentState = key;
            this.pointer = 0;
            this.animations = anim.anims;
            this.durationPerStepInMs = anim.durationPerFrame;
            switch (anim.type) {
                case Animation.Type.BOUNCE:
                    this.subupdate = BOUNCE_UPDATE;
                    break;
                case Animation.Type.ENDLESS:
                    this.subupdate = ENDLESS_UPDATE;
                    break;
                case Animation.Type.ONCE:
                    this.subupdate = ONCE_UPDATE;
                    break;
            }
        }
        return this;
    };

    Entity.prototype.update = function (dt, elapsedMillis) {
        // TODO remove duplicated code with Animation
        if (this.updateCallback !== null) this.updateCallback.call(this, dt, elapsedMillis);
        if (this.animations.length === 0) return;
        if (this.animations.length === 1) {
            this.subimage(this.animations[0].x, this.animations[0].y);
        } else {
            if (this.elapsedTime > this.durationPerStepInMs) {
                this.elapsedTime = 0;
                this.subupdate();
                var current = this.animations[this.pointer];
                this.subimage(current.x, current.y);
            }
            this.elapsedTime += elapsedMillis;
        }
    };

    var MAP_TILE_SIZE = 100;

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
    var Map = Smila.Map = function (json, mapData) {
        var allTilesetsAreLoaded = true;
        this.tilesets = [];
        this.subtiles = [];     // Background
        this.subtilesTop = [];    // Topground

        this.currentX = 0;
        this.currentY = 0;
        this.currentLX = 1;
        this.currentLY = 1;

        this.subtileWidth = MAP_TILE_SIZE * json.tilewidth;
        this.subtileHeight = MAP_TILE_SIZE * json.tileheight;

        var xSteps = Math.ceil((json.width * json.tilewidth) / this.subtileWidth);
        var ySteps = Math.ceil((json.height * json.tileheight) / this.subtileHeight);

        log("[Smila::Map->Ctor] create subs: " + xSteps + " x " + ySteps + "  {" + this.subtileWidth + " x " + this.subtileHeight + "} per Element")

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
        }
        var self = this;
        for (var i = 0; i < json.tilesets.length && i < 1; i++) { // only load the first!
            var key = json.tilesets[i].name;
            if (key in spriteCache) {
                var ctx = spriteCache[key];
                //this.tilesets.push(new TileSet(ctx.canvas, ctx.meta, json.tilesets[i].firstgid));
                this.tileset = new TileSet(ctx.canvas, ctx.meta, json.tilesets[0].firstgid);
                this.init(json);
            } else {
                var ts = json.tilesets[i];
                allTilesetsAreLoaded = false;
                DataStore.put({
                    src:mapData.imgFolder + ts.image.replace(/^.*[\\\/]/, ''),
                    w:ts.tilewidth,
                    h:ts.tileheight,
                    key:ts.name
                }, function () {
                    //todo: When more then 1 tileset is loaded, this code won't work!
                    var ctx = spriteCache[ts.name];
                    self.tileset = new TileSet(ctx.canvas, ctx.meta, json.tilesets[0].firstgid);
                    self.isready = true;
                    self.init(json);
                });
            }
        }
        this.isready = allTilesetsAreLoaded;
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
    }

    Map.prototype.onReady = function (callback) {
        if (this.isready) callback();
        else {
            var self = this;
            setTimeout(function () {
                self.onReady(callback);
            }, 100);
        }
        return this;
    };

    Map.prototype.init = function (json) {
        var bottom = json.layers[0];
        var bottom2 = json.layers[1];
        var top = json.layers[3];
        var dyn = json.layers[2];
        _mapLayerToCanvas([bottom,bottom2],this.subtiles, this.tileset,json.tilewidth, json.tileheight, json.width, this.subtileWidth,this.subtileHeight);
        _mapLayerToCanvas(top,this.subtilesTop, this.tileset,json.tilewidth, json.tileheight, json.width, this.subtileWidth,this.subtileHeight);
        this.sprites = _createSpritesFromDynamicLayer(dyn, this.tileset, json.width,json.tilewidth, json.tileheight);
        log("[Smila::Map->init] load dynamic sprites onto map: {" + this.sprites.length + "}");
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



            this.eventLayer = [];
            for(var x = 0; x < json.width; x++){
                this.eventLayer[x] = [];
                for (var y = 0; y < json.height; y++){
                    var i = y * json.width + x;
                    if (events[i] === 0) this.eventLayer[x][y] = 0;
                    else{
                        var key = x + "_" + y;
                        var data = {};
                        var value = events[i] - eventFGID;
                        if (key in eventDataLookup){
                            data = eventDataLookup[key];
                        }
                        this.eventLayer[x][y] = {
                            id : events[i] - eventFGID,
                            data : data
                        };
                    }
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
                        ctxY += tileheight;
                    }
                    ctxX += tilewidth;
                }
            }
        }
    };

    /**
     *
     * @type {Function}
     */
    var Camera = Smila.Camera = function () {
        this.offset = {x:0, y:0};
        this.realPosition = {x:0, y:0};
    };

    Camera.prototype.translate = function (offsetX, offsetY) {
        this.offset.x = offsetX;
        this.offset.y = offsetY;
        if (offsetX === 0 && offsetY === 0) {
            this.realPosition.x = Math.round(this.realPosition.x);
            this.realPosition.y = Math.round(this.realPosition.y);
        } else {
            this.realPosition.x -= offsetX;
            this.realPosition.y -= offsetY;
        }
    };

    Camera.prototype.render = function () {
        context.translate(this.offset.x, this.offset.y);
    };

    Camera.prototype.set = function (x, y) {
        var transX = this.realPosition.x - x;
        var transY = this.realPosition.y - y;
        this.translate(transX, transY);
        this.render();
        this.translate(0, 0);
    };

    /**
     * Private Cache for DataStore
     * @type {Object}
     * {
     *      key : { meta: { .. }, canvas: { HTMLCanvas } }
     *      ...
     * }
     */
    var spriteCache = {};

    /**
     * Private Cache for
     * @type {Object}
     */
    var mapCache = {};

    var camera = null;

    var DataStore = Smila.DataStore = {

        /**
         * puts maps into the Datastore
         * @param mapData {Object} or {Array} of Objects:
         * {
         *      src: "/res/maps/map.json", {String}
         *      imgFolder: "/res/img/", {String}
         *      key : "map01" {String}
         * }
         * @param callback {function}
         */
        putMap:function (mapData, callback) {
            if (mapData instanceof Array) {
                var c = 0;
                var funcLoadHelper = function (element) {
                    return function (json) {
                        if (typeof json === 'string' || json instanceof String) {
                            json = JSON.parse(json);
                        }
                        c += 1;
                        mapCache[element.key] = new Map(json, element);
                        if (c === mapData.length) {
                            callback();
                        }
                        ;
                    };
                };
                mapData.forEach(function (element) {
                    loadMap(element, funcLoadHelper(element));
                });
            } else {
                loadMap(mapData, function (json) {
                    if (typeof json === 'string' || json instanceof String) {
                        json = JSON.parse(json);
                    }
                    mapCache[mapData.key] = new Map(json, mapData);
                    callback();
                });
            }
        },

        getMap:function (key) {
            if (key in mapCache) {
                return mapCache[key];
            } else {
                throw "[Smila::DataStore->getMap] Cannot find key {" + key + "}";
            }
        },

        /**
         * puts one or multiple Sprite-Layouts (
         * {
         *      src : "/res/image.png",   {String}
         *      base64 : "base64/png...",   {String}
         *      w : width : 64   {Integer}
         *      h : height : 64   {Integer}
         *      o : outline : true  {Boolean} // optional
         *      bm : bitmask : true  {Boolean} // optional
         *      key : "character"  {String}
         *      ocol : outlineColor : {r:125, g:0, b:0, a:255 }  {Object} // optional
         * }
         * @param spriteData {Object} or {Array} of Sprite-Layouts
         * @param callback {function} gets called, when all spriteData is loaded
         * @return {Smila.DataStore}
         */
        put:function (spriteData, callback) {
            if (spriteData instanceof Array) {
                var acc = [];
                spriteData.forEach(function (element) {
                    loadSprite(element, function () {
                        acc.push(0);
                        if (acc.length === spriteData.length) {
                            callback();
                        }
                    }, function () {
                        throw "[Smila::Datastore->put] cannot put element into Datastore";
                    });
                });

            } else {
                loadSprite(spriteData, function () {
                    callback();
                }, function () {
                    throw "[Smila::Datastore->put] cannot put element into Datastore";
                })
            }

            return DataStore;
        },

        /**
         * gets the loaded Sprite
         * @param key {String}
         * @return {Smila.Sprite}
         */
        get:function (key) {
            if (key in spriteCache) {
                var data = spriteCache[key];
                return new Sprite(data.canvas, data.meta);
            }
            throw "[Smila::DataStore->get] cannot find {" + key + "}";
        },

        /**
         *
         * @param key {String}
         * @param animations {Array} : [{x:0,y:1},{x:2,y:0},..]
         * @param durationPerFrameInMs {Integer}
         * @param type {Animation.Type}
         */
        getAnimation:function (key, animations, durationPerFrameInMs, type) {
            if (key in spriteCache) {
                var data = spriteCache[key];
                return new Animation(data.canvas, data.meta, animations, durationPerFrameInMs, type);
            }
            throw "[Smila::DataStore->getAnimation] cannot find {" + key + "}";
        },

        /**
         *
         * @param key {String}
         * @param animations {Object}
         * {
         *    "up" : {anims:[], durationPerFrame:66, type:Animation.BOUNCE  },
         *    "down" : {anims:[], durationPerFrame:66, type:Animation.BOUNCE  }
         * }
         */
        getEntity:function (key, animations) {
            if (key in spriteCache) {
                var data = spriteCache[key];
                return new Entity(data.canvas, data.meta, animations);
            }
            throw "[Smila::DataStore->getAnimation] cannot find {" + key + "}";
        }

    };


    var updateCallbacks = {};
    var renderItems = [];
    var onUpdateCallbackPointer = 0;
    var map = null;

    var rendererIsRunning = false;

    var stats = null;
    var dimension = {w:-1, h:-1};

    /**
     * The global Canvas, on that all content is renderered
     * @type {HTML5Canvas}
     */
    var canvas = null;

    var context = null;

    /**
     * The requestanimationframe-Thread
     * @type {Number}
     */
    var thread = -1;

    var mousePosition = {x:-1, y:-1};

    /**
     * @type {Boolean} It is not allowed to start the renderer twice
     */
    var isStarted = false;

    var ELEMENT_NAME = "smila";

    /**
     * Default sort function. Sorts sprites after there y values.
     * @param sprites
     * @constructor
     */
    var SORT_BY_Y_VALUE = function (sprites) {
        return quickSort(sprites, 0, sprites.length);
    };

    // ---------------
    // -- QUICKSORT --
    // ---------------
    //TODO remove recursion

    function partition(array, left, right) {
        var cmp = array[right - 1].y, minEnd = left, maxEnd;
        for (maxEnd = left; maxEnd < right - 1; maxEnd += 1) {
            if (array[maxEnd].y <= cmp) {
                swap(array, maxEnd, minEnd);
                minEnd += 1;
            }
        }
        swap(array, minEnd, right - 1);
        return minEnd;
    };

    function swap(array, i, j) {
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
        return array;
    };

    function quickSort(array, left, right) {
        if (left < right) {
            var p = partition(array, left, right);
            quickSort(array, left, p);
            quickSort(array, p + 1, right);
        }
        return array;
    };


    // ---------------
    // -- QUICKSORT --
    // ---------------

    var sortFunction = SORT_BY_Y_VALUE;

    var renderLoopIndex = 0;

    var sortingThread;

    var particleEmitters = [];

    // Renderer update variables (to not create new objects all the time!)
    var cameraRealX = 0;
    var elapsed = 0;
    var now = 0;
    var dt = 0;
    var cameraRealY = 0;
    var clearRect_h = 0;
    var clearRect_w = 0;
    var clearX = 0;
    var clearY = 0;
    var rightOuterBound = 0;
    var bottomBound = 0;
    // -------------------------

    var lastI = 0;
    var MAX_SORT_INDEX = 250;

    /**
     * sort sprites after its Y-Value
     * @constructor
     */
    var YsortSprites = function () {
        if (renderItems.length < MAX_SORT_INDEX) {
            // if the number of sprites is low we dont need to split our sorting
            // Insertionsort: we assume that our list is almost sorted
            for (var i = 1; i < renderItems.length; i++) {
                var elem = renderItems[i];
                var j = i;
                while (j > 1 && renderItems[j - 1].y > elem.y) {
                    renderItems[j] = renderItems[j - 1];
                    j--;
                }
                renderItems[j] = elem;
            }
        } else {
            var l = Math.min((renderItems.length - 1), (lastI + MAX_SORT_INDEX));
            for (var i = lastI; i < l; i++) {
                var elem = renderItems[i];
                var j = i;
                while (j > 1 && renderItems[j - 1].y > elem.y) {
                    renderItems[j] = renderItems[j - 1];
                    j--;
                }
                renderItems[j] = elem;
            }
            lastI += Math.floor(MAX_SORT_INDEX / 2);
            if (lastI > renderItems.length) {
                lastI = 1;
            }
        }
    };

    var Renderer = Smila.Renderer = {

        /**
         * gets called every time the renderer updates
         * @param callback {function} with function(dt, elapsed) { ... }
         */
        onUpdate:function (callback) {
            callback.$smilaId = onUpdateCallbackPointer++;
            updateCallbacks[callback.$smilaId] = callback;
        },

        offUpdate:function (callback) {
            if ('$smilaId' in callback) {
                delete updateCallbacks[callback.$smilaId];
            } else {
                throw "[Smila::DataStore->offUpdate] cannot find the ID for the callback given at {onCallback}";
            }
        },

        /**
         * the function gets called every time the engine returns a new set of sprites that should be rendered
         * onto the screen. The callback has one parameter which holds the array of sprites that will be rendered
         * onto the screen. The return-value of the callback will be the sorted list
         * @param callback {function} [Sprite]->[Sprite]  //sorted
         */
        onSortSprites:function (callback) {
            sortFunction = callback;
        },

        reset:function () {
            updateCallbacks = {};
            renderItems = [];
            map = null;
            sortFunction = SORT_BY_Y_VALUE;
            clearInterval(sortingThread);
        },

        isRunning:function () {
            return rendererIsRunning;
        },

        setMap:function (m) {
            map = m;
            map.onReady(function(){
                for(var i = 0; i < map.sprites.length; i++){
                    renderItems.push(map.sprites[i]);
                }
            });
            return this;
        },

        /**
         * Add a dynamic sprite to the Renderer. Position changes
         * will always be tracked though this is more performance-
         * sensitive
         * @param sprite
         */
        add:function (sprite) {
            renderItems.push(sprite);
        },

        start:function () {
            log("[Smila::Renderer->start]");
            if (isStarted) {
                throw "[Smila::Renderer->start] The Renderer is already started!";
            } else {

                if (window.CanvasRenderingContext2D) {
                    renderItems = [];
                    var parent = document.getElementById(ELEMENT_NAME);
                    canvas = document.createElement('canvas');
                    canvas.style.position = "absolute";
                    canvas.height = parent.clientHeight;
                    canvas.width = parent.clientWidth;
                    dimension.h = canvas.height;
                    dimension.w = canvas.width;
                    parent.appendChild(canvas);

                    canvas.onmousemove = function (evt) {
                        var rect = canvas.getBoundingClientRect();
                        mousePosition.x = evt.clientX - rect.left;
                        mousePosition.y = evt.clientY - rect.top;
                    };
                    context = canvas.getContext('2d');
                    if (verbose) {
                        if (typeof Stats !== 'undefined') {
                            stats = new Stats();
                            document.body.appendChild(stats.domElement);
                        }
                    }
                    thread = requestAnimationFrame(this.update);

                    sortingThread = setInterval(YsortSprites, 500);

                    camera = new Camera();

                    log("[Smila::Renderer->start] = success");
                } else {
                    document.getElementById(ELEMENT_NAME).innerHTML = "[smila] is not supported!";
                    log("[Smila::Renderer->start] = failed");
                }

                rendererIsRunning = true;
                isStarted = true;
            }
        },

        camera:function () {
            return camera;
        },

        update:function () {
            now = new Date().getTime();
            elapsed = now - (Renderer.time || now);
            Renderer.time = now;
            dt = elapsed / EXPECTED_ELAPSED_MILLIS;
            cameraRealX = camera.realPosition.x;
            cameraRealY = camera.realPosition.y;
            clearRect_w = dimension.w + 20;
            clearRect_h = dimension.h + 20;
            clearX = cameraRealX - 10;
            clearY = cameraRealY - 10;
            rightOuterBound = cameraRealX + dimension.w;
            bottomBound = cameraRealY + dimension.h;

            context.clearRect(clearX, clearY, clearRect_w, clearRect_h);

            // -- sprite-sort!


            camera.render();

            for (var key in updateCallbacks) {
                var callback = updateCallbacks[key];
                callback.call(callback, elapsed, dt);
            }

            if (map !== null) {
                map.renderBackground(context, cameraRealX, cameraRealY, clearRect_w, clearRect_h);
            }

            // Idee für die RenderItems:
            // Sortiere die Items nach einem neuen Wert z=x+y
            // Damit kann eine Sprite-Sortierung + Regionalisierung aufgebaut werden!
            for (var i = 0; i < renderItems.length; i += 1) {
                var drawable = renderItems[i];
                if (drawable.update) {
                    drawable.update(dt, elapsed);
                }
                if ((drawable.x + drawable.frameWidth | drawable.width) >= cameraRealX && drawable.x <= rightOuterBound) {
                    if ((drawable.y + drawable.frameHeight | drawable.height) >= cameraRealY && drawable.y <= bottomBound) {
                        drawable.render(context);
                    }
                }
            }

            // LAST
            for (var i = 0; i < particleEmitters.length; i++) {
                particleEmitters[i].update(context, dt, elapsed, cameraRealX, cameraRealY, rightOuterBound, bottomBound);
            }

            if (map !== null) {
                map.renderTopLayer(context);
            }

            thread = requestAnimationFrame(Renderer.update);
            if (stats !== null) stats.update();
        },

        /**
         *
         * @param e {
         *      point : {x, y}
         *      spread : double
         *      emissionRate : Integer
         *      lifetimeMs : Integer
         *      color : String || [String]
         *      direction : {x, y}
         *
         *      velocity : {x, y} { OPTIONAL }
         *      totalLifetime : Integer { OPTIONAL }
         * }
         * @return {Smila.ParticleEmitter}
         */
        createParticleEmitter:function (e) {
            var emitter = new ParticleEmitter(e);
            particleEmitters.push(emitter);
            return emitter;
        }
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // P A R T I C L E  S Y S T E M
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var PARTICLE_BYTE_SIZE = 28 | 0;
    var DEFAULT_PARTICLE_COUNT = 100 | 0;

    /**
     *
     * @type {Function}{
     *
     *
     *
     * }
     */
    var ParticleEmitter = Smila.ParticleEmitter = function (e) {
        var particleCount = (typeof e === 'undefined') ? DEFAULT_PARTICLE_COUNT : e.particleCount || DEFAULT_PARTICLE_COUNT;
        this.point = e.point || e.p;
        this.velocity = e.velocity || e.v || {x:0, y:0};
        this.direction = e.dir || e.direction;
        this.spread = e.spread || e.s;
        this.emissionRate = e.emissionRate || e.e;
        this.lifetimeMs = e.lifetimeMs || e.ttl || 10000;
        this.color = e.color || "#99CCFF";
        this.totalLifetime = e.totalLifetime || e.tlt || null;
        this.elapsed = 0;
        this.colorPointer = 0;
        this.angle = Math.atan2(this.direction.y, this.direction.x)
        this.magnitude = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
        var data = new ArrayBuffer(particleCount * PARTICLE_BYTE_SIZE);
        this.view = new Float32Array(data);
        this.pointer = 0;
        this.isActive = typeof e.active === 'undefined' ? true : e.active;
        this.particleCount = 0;
    };

    ParticleEmitter.prototype.createParticle = function (point, velocity, ttl, acc) {
        if (this.pointer >= this.view.length) {
            this.pointer = 0; // circle...
        }
        this.view[this.pointer] = point.x;
        this.view[this.pointer + 1] = point.y;
        this.view[this.pointer + 2] = velocity.x;
        this.view[this.pointer + 3] = velocity.y;
        this.view[this.pointer + 4] = (typeof acc !== 'undefined') ? acc.x : 0;
        this.view[this.pointer + 5] = (typeof acc !== 'undefined') ? acc.y : 0;
        this.view[this.pointer + 6] = ttl;
        var result = this.pointer;
        this.particleCount += 1;
        this.pointer += 7;
        return result;
    };

    ParticleEmitter.prototype.update = function (ctx, dt, elapsedMillis, viewX, viewY, viewWidthX, viewHeightY) {
        if (this.isActive) {
            if (this.totalLifetime !== null) {
                if (this.totalLifetime < 0) {
                    this.isActive = false;
                    return;
                } else {
                    this.totalLifetime -= elapsedMillis;
                }
            }
            if (Array.isArray(this.color)) {
                ctx.fillStyle = this.color[this.colorPointer];
                if (this.colorPointer === this.color.length) {
                    this.colorPointer = 0;
                } else {
                    this.colorPointer += 1;
                }
            } else {
                ctx.fillStyle = this.color;
            }
            this.elapsed += elapsedMillis;
            if (this.elapsed > 50) {
                this.elapsed = 0;
                var angle = 0;
                for (var i = 0; i < this.emissionRate / 2; i++) {
                    angle = this.angle + this.spread - (Math.random() * this.spread * 2);
                    this.createParticle(this.point, {
                            x:this.magnitude * Math.cos(angle),
                            y:this.magnitude * Math.sin(angle)},
                        this.lifetimeMs);
                }
            }

            // render particles
            var pos = 0;
            var lastActive = 0;
            var view = this.view;
            for (var i = 0; i < this.particleCount; i++) {
                pos = i * 7;
                if (view[pos + 6] > 0) {
                    lastActive = i;
                    view[pos + 6] -= elapsedMillis;
                    addVectors(view, pos, pos + 2); // add velocity to position
                    addVectors(view, pos + 2, pos + 4); // add acceleration to velocity
                    if (view[pos] >= viewX && view[pos] <= viewWidthX && view[pos + 1] >= viewY && view[pos + 1] <= viewHeightY) {
                        ctx.fillRect(view[pos], view[pos + 1], 2, 2);
                    }
                }
            }
            this.particleCount = lastActive;

            this.point.x += this.velocity.x;
            this.point.y += this.velocity.y;
        }
    };

    /**
     * Adds the vector b on the vector a
     * @param view {Int16Array}
     * @param a {Integer} Position of the first Vectors x-position
     * @param b {Integer} Position of the second Vector x-position
     */
    function addVectors(view, a, b) {
        view[a] = view[a] + view[b];
        view[a + 1] = view[a + 1] + view[b + 1];
    };

    /**
     *
     * @param view {Int16View}
     * @param vector {Integer}
     */
    function getVectorMagnitude(view, vector) {
        var x = view[vector];
        var y = view[vector + 1]
        return Math.sqrt(x * x + y * y);
    };

    /**
     *
     * @param view {Int16View}
     * @param vector {Integer}
     * @return {Number}
     */
    function getVectorAngle(view, vector) {
        return Math.atan2(view[vector + 1], view[vector]);
    };

    function getVectorAngle2() {

    }

    function VectorfromAngle(view, angle, magnitude, destination) {
        view[destination] = magnitude * Math.cos
    };


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // P A R T I C L E  S Y S T E M  E N D
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // P R I V A T E   H E L P E R   F U N C T I O N S
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    //
    // ++++++++++  B I T M A T R I X ++++++++++
    //
    var BitMatrix2D = function (width, height) {
        var rest = width % 8;
        if (rest !== 0) {
            width = width + 8 - rest;
        }
        width = Math.ceil(width / 8);
        var buffer = new ArrayBuffer(width * height);
        this.data = new Uint8Array(buffer);
        this.bytePerRow = width | 0;
        this.width = width;
        this.height = height;
    };

    BitMatrix2D.prototype.set = function (x, y) {
        var bytePosition = this.bytePerRow * y;
        var lineAdd = x / 8;
        lineAdd = lineAdd | lineAdd; // fast floor to 32bit integer
        var bit = x % 8;
        var pos = bytePosition + lineAdd;
        var n = this.data[pos];
        var mask = 1 << bit;
        n |= mask;
        this.data[pos] = n;
        return this;
    };

    BitMatrix2D.prototype.clear = function (x, y) {
        var bytePosition = this.bytePerRow * y;
        var lineAdd = x / 8;
        lineAdd = lineAdd | lineAdd; // fast floor to 32bit integer
        var bit = x % 8;
        var pos = bytePosition + lineAdd;
        var n = this.data[pos];
        var mask = 1 << bit;
        n &= ~mask;
        this.data[pos] = n;
        return this;
    }

    BitMatrix2D.prototype.test = function (x, y) {
        var bytePos = this.bytePerRow * y;
        var lineAdd = x / 8.0;
        lineAdd = lineAdd | lineAdd;// fast floor (only 32bit integer!)
        var bit = x % 8;
        var pos = bytePos + lineAdd;
        var n = this.data[pos];
        var mask = 1 << bit;
        return ((n & mask) != 0);
    }
    //
    // ++++++++++  B I T M A T R I X  END ++++++++++
    //


    var loadMap = function (mapData, callback) {
        log("[Smila::*->loadMap] ... start loading map ...");
        var xobj = new XMLHttpRequest();
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4) {
                callback(xobj.responseText);
            }
        };
        xobj.open("GET", mapData.src, true);
        xobj.send(null);

    };

    /**
     * @param spriteData
     *{
     *      src : "/res/image.png",   {String}
     *      base64 : "base64/png...",   {String}
     *      w : width : 64   {Integer}
     *      h : height : 64   {Integer}
     *      o : outline : true  {Boolean} // optional
     *      bm : bitmask : true  {Boolean} // optional
     *      key : "character"  {String}
     *      ocol : outlineColor : {r:125, g:0, b:0, a:255 }  {Object} // optional
     * }
     * @param callback {function}
     * @param error {function}
     */
    var loadSprite = function (spriteData, callback, error) {
        log("[Smila::*->loadSprite] {" + spriteData.key + "}");
        spriteData.w = spriteData.w || spriteData.width;
        spriteData.h = spriteData.h || spriteData.height;
        spriteData.o = spriteData.o || spriteData.outline | false;
        spriteData.bm = spriteData.bm || spriteData.bitmask | false;
        if (typeof spriteData.outlineColor !== 'undefined' || typeof spriteData.ocol !== 'undefined') {
            spriteData.ocol = spriteData.outlineColor || spriteData.ocol;
        }

        var img = new Image();
        img.onload = function () {
            log("[Smila::*->loadSprite] Image is loaded {" + spriteData.key + "}");
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);

            spriteCache[spriteData.key] = {meta:spriteData, canvas:canvas};
            // ~~~ outline? ~~~
            if (spriteData.o) {
                var key = spriteData.key + "_outline";
                if (!(key in spriteCache)) {
                    var outlined = document.createElement('canvas');
                    outlined.width = img.width;
                    outlined.height = img.height;
                    var outlinedContext = outlined.getContext('2d');
                    outlinedContext.drawImage(canvas, 0, 0);
                    var data = outlinedContext.getImageData(0, 0, img.width, img.height);
                    var color = spriteData.ocol || defaultOutlineColor;
                    data = outlineFunction(img.width, img.height, data, color);
                    data = outlineFunction(img.width, img.height, data, color);// todo: fix this... (needed for 2px outline
                    outlinedContext.putImageData(data, 0, 0);
                    spriteCache[key] = {meta:spriteData, canvas:outlined};
                }
            }

            if (spriteData.bm) {
                var key = spriteData.key + "_bitmask";
                if (!(key in spriteCache)) {
                    var bitmask = new BitMatrix2D(img.width, img.height);
                    var data = context.getImageData(0, 0, img.width, img.height);
                    for (var x = 0; x < img.width; x++) {
                        for (var y = 0; y < img.height; y++) {
                            var pixel = getPixel(data, x, y);
                            if (pixel.a !== 0) {
                                bitmask.set(x, y);
                            }
                        }
                    }
                    spriteCache[key] = bitmask;
                }
            }

            callback();
        };

        img.onerror = function () {
            log("[Smila::*->loadSprite] Could not load Image {" + spriteData.key + "}");
            error();
        };

        if (spriteData.key in spriteCache) {
            log("[Smila::*->loadSprite] load from Cache: {" + spriteData.key + "}");
            callback();
        } else if (spriteData.base64 !== undefined) {
            log("[Smila::*->loadSprite] load from base64: {" + spriteData.key + "}");
            img.src = spriteData.base64;
        } else {
            log("[Smila::*->loadSprite] load from URL: {" + spriteData.key + "} {" + spriteData.src + "}");
            img.src = imagePath + spriteData.src;
        }

    };

    var setPixel = function (imageData, x, y, r, g, b, a) {
        var index = (x + y * imageData.width) * 4;
        imageData.data[index + 0] = r;
        imageData.data[index + 1] = g;
        imageData.data[index + 2] = b;
        imageData.data[index + 3] = a;
    };

    var getPixel = function (imageData, x, y) {
        var index = (x + y * imageData.width) * 4;
        var r = imageData.data[index + 0];
        var g = imageData.data[index + 1];
        var b = imageData.data[index + 2];
        var a = imageData.data[index + 3];
        return {r:r, g:g, b:b, a:a};
    };

    /**
     * Copied function from pxyu.
     * todo: Fix this function in the future..
     * @param w
     * @param h
     * @param data
     * @param color
     * @return {*}
     */
    var outlineFunction = function (w, h, data, color) {
        var skipY = {};
        for (var y = 1; y <= h; y++) {
            for (var x = 1; x <= w; x++) {
                var currentPixel = getPixel(data, x, y);
                if (currentPixel.a === 0) { // is free
                    // check if right and/or leftcheck possible
                    var doLeftcheck = x != 1;
                    var doRightcheck = x != w - 1;
                    //var doTopCheck = y != 1;
                    var doBottomCheck = y != h - 1;

                    // first do up-down-check..
                    /*if (doTopCheck ){
                     var topPixel = drw.spriteStore.getPixel(data,x,y-1);
                     if (topPixel.a !== 0){
                     drw.spriteStore.setPixel(data,x,y, color.r, color.g, color.b, color.a);
                     skipY[x] = skipY[x] | {};
                     skipY[x][y] = true;
                     }
                     }*/
                    if (doBottomCheck) {
                        var bottomPixel = getPixel(data, x, y + 1);
                        if (bottomPixel.a !== 0) {
                            setPixel(data, x, y, color.r, color.g, color.b, color.a);
                            continue;
                        }
                    }

                    // then left-right.. (so the up-down gets not confused with the left-right)
                    if (doLeftcheck) {
                        var leftPixel = getPixel(data, x - 1, y);
                        if (leftPixel.a !== 0) {
                            setPixel(data, x, y, color.r, color.g, color.b, color.a);
                            x += 1;
                            continue;
                        }
                    }
                    if (doRightcheck) {
                        var rightPixel = getPixel(data, x + 1, y);
                        if (rightPixel.a !== 0) {
                            setPixel(data, x, y, color.r, color.g, color.b, color.a);
                            continue;
                        }
                    }
                }
            }
        }
        return data;
    };

    /**
     * Gets the absolute mouse position..
     * @return {Object} { x: ..., y: ... }
     */
    var getAbsoluteMousePosition = function () {
        if (camera !== null) {
            return {
                x:(camera.realPosition.x + mousePosition.x),
                y:(camera.realPosition.y + mousePosition.y)
            };
        } else {
            return mousePosition;
        }
    };

    var loadDataStoreFromLocalStorage = function () {

    };

    var polyFill = function () {
        var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        window.requestAnimationFrame = requestAnimationFrame;
    };

    var log = function (message) {
        console.log(message);
    };


    loadDataStoreFromLocalStorage();
    polyFill();

    return Smila;
}();