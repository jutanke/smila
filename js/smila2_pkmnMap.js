/**
 * Created by Baka on 10/5/2014.
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

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Map
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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
    var Map = Smila.Map = function(json, imgFolder){
        this.tw = json.tilewidth;
        this.th = json.tileheight;
        this.w = json.width;
        this.h = json.height;

        // TODO: mach weiter hier:
        var tileSetOptions = {
            w : json.tilewidth,
            h : json.tileheight

        }

        for (var x = 0; x < json.width; x++) {
            for(var y = 0; y < json.height; y++) {

            }
        }

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
                    mapCache[mapData.key] = new Map(json, mapData.imgFolder);
                    callback.call(MapLoader);
                });
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

})();