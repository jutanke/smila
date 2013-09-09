window.Smila = function(){

    function Smila(){};

    var Sprite = Smila.Sprite = function (){

    };

    var Animation = Smila.Animation = function(){

    };

    var Map = Smila.Map = function(){

    };

    var Camera = Smila.Camera = function(){

    };

    /**
     * Private Cache for DataStore
     * @type {Object}
     */
    var spriteCache = {};

    var DataStore = Smila.DataStore = {

        /**
         * puts one or multiple Sprite-Layouts (
         * {
         *      src : "/res/image.png",   {String}
         *      base64 : "base64/png...",   {String}
         *      w : width : 64   {Integer}
         *      h : height : 64   {Integer}
         *      o : outline : true  {Boolean} // optional
         *      bm : bitmask : true  {Boolean} // optional
         *      key : "character"  {String}  // optional
         * }
         * @param spriteData {Object} or {Array} of Sprite-Layouts
         * @param callback {function} gets called, when all spriteData is loaded
         * @return {Smila.DataStore}
         */
        put : function(spriteData, callback) {


            return DataStore;
        },

        /**
         * gets the loaded Sprite
         * @param key {String}
         * @return {Smila.Sprite}
         */
        get : function(key){
            if (key in spriteCache){
                return spriteCache[key];
            }
            throw "[Smila::DataStore->get] cannot find {" + key + "}";
        }

    };


    var onUpdateCallbacks = {};
    var onUpdateCallbackPointer = 0;

    var Renderer = Smila.Renderer = {

        /**
         * gets called every time the renderer updates
         * @param callback {function} with function(dt, elapsed) { ... }
         */
        onUpdate : function(callback){
            callback.$smilaId = onUpdateCallbackPointer++;
            onUpdateCallbacks[callback.$smilaId] = callback;
        },

        offUpdate : function(callback){
            if ('$smilaId' in callback){
                delete onUpdateCallbacks[callback.$smilaId];
            }else{
                throw "[Smila::DataStore->offUpdate] cannot find the ID for the callback given at {onCallback}";
            }
        }

    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // P R I V A T E  H E L P E R  F U N C T I O N S
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var loadDataStoreFromLocalStorage = function(){

    };


    loadDataStoreFromLocalStorage();

    return Smila;
}();