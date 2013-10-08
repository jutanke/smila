window.Smila = function () {

    function Smila() {
    };

    // SETTINGS
    var useWebGL = false;
    var imagePath = "";
    var defaultOutlineColor = {r:255, g:0, b:0, a:255};
    var verbose;

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

    };

    Sprite.prototype.render = function (context) {

    };

    /**
     *
     * @type {Function}
     */
    var Animation = Smila.Animation = function () {

    };

    /**
     *
     * @type {Function}
     */
    var Map = Smila.Map = function () {

    };

    /**
     *
     * @type {Function}
     */
    var Camera = Smila.Camera = function () {

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
                    })
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
                return spriteCache[key];
            }
            throw "[Smila::DataStore->get] cannot find {" + key + "}";
        }

    };


    var onUpdateCallbacks = {};
    var onUpdateCallbackPointer = 0;

    var rendererIsRunning = false;

    var stats = null;
    var dimension = {w:-1,h:-1};

    /**
     * The global Canvas, on that all content is renderered
     * @type {HTML5Canvas}
     */
    var canvas = null;

    /**
     * The requestanimationframe-Thread
     * @type {Number}
     */
    var thread = -1;

    var mousePosition = {x:-1,y:-1};

    /**
     * @type {Boolean} It is not allowed to start the renderer twice
     */
    var isStarted = false;

    var ELEMENT_NAME = "smila";

    var Renderer = Smila.Renderer = {

        /**
         * gets called every time the renderer updates
         * @param callback {function} with function(dt, elapsed) { ... }
         */
        onUpdate:function (callback) {
            callback.$smilaId = onUpdateCallbackPointer++;
            onUpdateCallbacks[callback.$smilaId] = callback;
        },

        offUpdate:function (callback) {
            if ('$smilaId' in callback) {
                delete onUpdateCallbacks[callback.$smilaId];
            } else {
                throw "[Smila::DataStore->offUpdate] cannot find the ID for the callback given at {onCallback}";
            }
        },

        isRunning : function(){
            return rendererIsRunning;
        },

        start : function(){
            log("[Smila::Renderer->start]");
            if (isStarted){
                throw "[Smila::Renderer->start] The Renderer is already started!";
            }else{

                if (window.CanvasRenderingContext2D){

                    var parent = document.getElementById(ELEMENT_NAME);
                    canvas = document.createElement('canvas');
                    canvas.style.position = "absolute";
                    canvas.height = parent.clientHeight;
                    canvas.width = parent.clientWidth;
                    dimension.h = canvas.height;
                    dimension.w = canvas.width;
                    parent.appendChild(canvas);

                    canvas.onmousemove = function(target,evt){
                        var rect = canvas.getBoundingClientRect();
                        mousePosition.x = evt.clientX - rect.left;
                        mousePosition.y = evt.clientY - rect.top;
                    };

                    if(verbose){
                        if (typeof Stats !== 'undefined'){
                            stats = new Stats();
                            document.body.appendChild(stats.domElement);
                        }
                    }

                    thread = requestAnimationFrame.call(Renderer, this.update);

                    log("[Smila::Renderer->start] = success");
                }else{
                    document.getElementById(ELEMENT_NAME).innerHTML = "[smila] is not supported!";
                    log("[Smila::Renderer->start] = failed");
                }

                rendererIsRunning = true;
                isStarted = true;
            }
        },

        bla : "hallowelt",

        update : function(){
            console.log(this.bla);
        }

    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // P R I V A T E   H E L P E R   F U N C T I O N S
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var INTEGER_BYTESIZE = 4;

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
        spriteData.w = spriteData.w | spriteData.width;
        spriteData.h = spriteData.h | spriteData.height;
        spriteData.o = spriteData.o | spriteData.outline | false;
        spriteData.bm = spriteData.bm | spriteData.bitmask | false;
        spriteData.ocol = spriteData.outlineColor | spriteData.ocol | null;

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
                    context = outlined.getContext('2d');
                    context.drawImage(canvas, 0, 0);
                    var data = context.getImageData(0, 0, img.width, img.height);
                    var color = spriteData.ocol | defaultOutlineColor;
                    data = outlineFunction(img.width, img.height, data, color);
                    data = outlineFunction(img.width, img.height, data, color);// todo: fix this... (needed for 2px outline
                    spriteCache[key] = {meta:spriteData, canvas:outlined};
                }
            }

            if (spriteData.bm) {
                var key = spriteData.key + "_bitmask";
                if (!(key in spriteCache)) {
                    var bitmask = new BitMatrix2D(img.width, img.height);
                    var data = canvas.getImageData(0, 0, img.width, img.height);
                    for (var x = 0; x < img.width; x++) {
                        for (var y = 0; y < img.height; y++) {
                            var pixel = getPixel(data,x,y);
                            if(pixel.a !== 0){
                                bitmask.set(x,y);
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
            log("[Smila::*->loadSprite] load from URL: {" + spriteData.key + "}");
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
                        var bottomPixel = pxyu.tools.getPixel(data, x, y + 1);
                        if (bottomPixel.a !== 0) {
                            setPixel(data, x, y, color.r, color.g, color.b, color.a);
                            continue;
                        }
                    }

                    // then left-right.. (so the up-down gets not confused with the left-right)
                    if (doLeftcheck) {
                        var leftPixel = pxyu.tools.getPixel(data, x - 1, y);
                        if (leftPixel.a !== 0) {
                            setPixel(data, x, y, color.r, color.g, color.b, color.a);
                            x += 1;
                            continue;
                        }
                    }
                    if (doRightcheck) {
                        var rightPixel = pxyu.tools.getPixel(data, x + 1, y);
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

    var loadDataStoreFromLocalStorage = function () {

    };

    var polyfills = function () {

    };

    var log = function (message) {
        console.log(message);
    };


    loadDataStoreFromLocalStorage();
    polyfills();

    return Smila;
}();