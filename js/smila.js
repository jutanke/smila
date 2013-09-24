window.Smila = function(){

    function Smila(){};

    // SETTINGS
    var useWebGL = false;
    var imagePath = "";
    var defaultOutlineColor = {r:255,g:0,b:0,a:255};

    /**
     *
     * @param options {object}
     * {
     *      useWebGL : {Boolean}
     *      imagePath : {String}
     * }
     */
    Smila.Settings = function(options){
        useWebGL = options.useWebGL || false;
        imagePath = options.imagePath || "";
        defaultOutlineColor = options.defaultOutlineColor || {r:255,g:0,b:0,a:255};
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //       C L A S S E S
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    /**
     *
     * @type {Function}
     */
    var Sprite = Smila.Sprite = function (){

    };

    Sprite.prototype.render = function(context){

    };

    /**
     *
     * @type {Function}
     */
    var Animation = Smila.Animation = function(){

    };

    /**
     *
     * @type {Function}
     */
    var Map = Smila.Map = function(){

    };

    /**
     *
     * @type {Function}
     */
    var Camera = Smila.Camera = function(){

    };

    /**
     * Private Cache for DataStore
     * @type {Object}
     * {
     *      key : { data: { .. }, canvas: { HTMLCanvas } }
     *      ...
     * }
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
            if (spriteData instanceof Array){
                var acc = [];
                spriteData.forEach(function(element){
                    loadSprite(element, function(){
                        acc.push(0);
                        if (acc.length === spriteData.length){
                            callback();
                        }
                    }, function(){
                        throw "[Smila::Datastore->put] cannot put element into Datastore";
                    })
                });

            }else{
                loadSprite(spriteData, function(){
                    callback();
                }, function(){
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
    // P R I V A T E   H E L P E R   F U N C T I O N S
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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
     * }
     * @param callback {function}
     * @param error {function}
     */
    var loadSprite = function(spriteData, callback, error){
        log("[Smila::*->loadSprite] {" + spriteData.key + "}");
        spriteData.w = spriteData.w | spriteData.width;
        spriteData.h = spriteData.h | spriteData.height;
        spriteData.o = spriteData.o | spriteData.outline | false;
        spriteData.bm = spriteData.bm | spriteData.bitmask | false;

        var img = new Image();
        img.onload = function(){
            log("[Smila::*->loadSprite] Image is loaded {" + spriteData.key + "}");
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var context = canvas.getContext('2d');
            context.drawImage(img,0,0);

            spriteCache[spriteData.key] = {meta:spriteData, canvas:canvas};
            // ~~~ outline? ~~~
            if( spriteData.o ){
                var key = spriteData.key + "_outline";

            }


            callback();
        };

        img.onerror = function(){
            log("[Smila::*->loadSprite] Could not load Image {" + spriteData.key + "}");
            error();
        };

        if (spriteData.key in spriteCache){
            log("[Smila::*->loadSprite] load from Cache: {" + spriteData.key + "}");
            callback();
        }else if (spriteData.base64 !== undefined){
            log("[Smila::*->loadSprite] load from base64: {" + spriteData.key + "}");
            img.src = spriteData.base64;
        }else{
            log("[Smila::*->loadSprite] load from URL: {" + spriteData.key + "}");
            img.src = imagePath + spriteData.src;
        }

    };

    var loadDataStoreFromLocalStorage = function(){

    };

    var polyfills = function(){

    };

    var log = function(message){
        console.log(message);
    };


    loadDataStoreFromLocalStorage();
    polyfills();

    return Smila;
}();