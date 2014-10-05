/**
 * Created by Baka on 10/5/2014.
 */
(function(){

    var VERBOSE = true;

    function logStr(msg) {
        return "[smila2_map][" + new Date().toISOString().substring(12) + "]" + msg;
    }

    function log(msg) {
        if (VERBOSE) {
            console.log(logStr(msg));
        }
    }

    if (typeof Smila === "undefined") {
        throw logStr("Smila2 must be loaded!");
    }

    var Sprite = Smila.Sprite;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Map
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var Map = Smila.Map = function(){



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
                    mapCache[mapData.key] = new Map(json);
                });
            }
        }

    };

    /**
     *
     * @param mapData { key, src }
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