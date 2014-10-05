/**
 * Impl overtime-swaps
 *
 * Name: smila2
 * User: Julian
 * Date: 23.01.14
 * Time: 23:00
 */
window.Smila = function () {

    if (!window.CanvasRenderingContext2D) {
        throw logStr("Smila-Rendering is not supported by the browser! (#1)");
    }

    if (!isDefined(performance) && !isDefined(performance.now)){
        throw logStr("Smila-Rendering is not supported by the browser! (#2)");
    }

    var VERBOSE = true;

    function logStr(msg) {
        return "[smila2][" + new Date().toISOString().substring(12) + "]" + msg;
    }

    function log(msg) {
        if (VERBOSE) {
            console.log(logStr(msg));
        }
    }

    function isDefined(obj) {
        return typeof obj !== 'undefined';
    }

    var Smila = {};

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Renderer
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var EXPECTED_ELAPSED_MILLIS = Math.floor(1000 / 60);

    /**
     *
     * @params domId {String} where to put the canvas
     * @params options {Object}
     * {
     *      trackMouse : true, {Boolean}
     * }
     *
     * @type {Renderer}
     */
    var Renderer = Smila.Renderer = function(domId, options){
        if (!isDefined(options)) {
            options = {};
        }
        var parent = document.getElementById(domId);
        var canvas = document.createElement('canvas');
        canvas.height = parent.clientHeight;
        canvas.width = parent.clientWidth;
        this.renderItems = [];
        this.mousePosition = {
            x: 0,
            y: 0
        }
        this.dimension = {
            w: parent.clientWidth,
            h: parent.clientHeight
        };
        this.context = canvas.getContext('2d');
        this._ispaused = false;
        this.lastTime = -1;
        this.thread = -1;
        this.sortThread = -1;
        this.onUpdate = null;
        parent.appendChild(canvas);

        if ("trackMouse" in options && options.trackMouse) {
            var self = this;
            canvas.onmousemove = function(evt){
                var rect = canvas.getBoundingClientRect();
                self.mousePosition.x = evt.clientX - rect.left;
                self.mousePosition.y = evt.clientY - rect.top;
            };
        }

        this._camera = new Camera(this);

        // start
        startUpdate(this);
    };

    /**
     * Run the update loop (technically we need to do this like here
     * because raf must run in window context...
     * @param renderer
     */
    function startUpdate(renderer) {

        function update(){
            var now = Date.now(); // afaik faster than performance.now
            var elapsed = 0;
            if (renderer.lastTime !== -1){
                elapsed = now - renderer.lastTime;
            }
            renderer.lastTime = now;
            var dt = elapsed / EXPECTED_ELAPSED_MILLIS;
            var context = renderer.context;
            var renderItems = renderer.renderItems;
            var camera = renderer.camera();

            var cameraRealX = camera.real.x;
            var cameraRealY = camera.real.y;
            var clearRect_w = renderer.dimension.w + 20;
            var clearRect_h = renderer.dimension.h + 20;
            var clearX = cameraRealX - 10;
            var clearY = cameraRealY - 10;
            var rightOutherBound = cameraRealX + renderer.dimension.w;
            var bottomBound = cameraRealY + renderer.dimension.h;

            context.clearRect(clearX, clearY, clearRect_w, clearRect_h);

            camera.render(context);

            if (renderer.onUpdate !== null) {
                renderer.onUpdate.call(this, dt, elapsed);
            }

            for(var i = 0; i < renderItems.length; i+=1){
                var d = renderItems[i];
                if (d.update){
                    d.update(dt, elapsed);
                }
                // check, if in frame!
                d.render(context);
            }

            if (!renderer._ispaused){
                renderer.thread = requestAnimationFrame(update);
            }
        };
        renderer.thread = requestAnimationFrame(update);
        function sort(){
            // Insertionsort
            var renderItems = renderer.renderItems;
            var current, j, currentz;
            for (var i = 1; i < renderItems.length; i++) {
                current = renderItems[i];
                currentz = current.z;
                j = i;
                while(j > 0 && renderItems[j-1].z > currentz) {
                    renderItems[j] = renderItems[j-1];
                    j = j-1;
                }
                renderItems[j] = current;
            }

            if (!renderer._ispaused){
                renderer.sortThread = setTimeout(sort, 250);
            }
        };
        renderer.sortThread = setTimeout(sort, 250);
    };

    Renderer.prototype.camera = function(){
        return this._camera;
    }

    /**
     * stops the update process completely
     */
    Renderer.prototype.pause = function(){
        this._ispaused = true;
        cancelAnimationFrame(this.thread);
        clearTimeout(this.sortThread);
    };

    /**
     * resumes the previously paused update process
     */
    Renderer.prototype.resume = function(){
        if (!this._ispaused) {
            throw logStr("Cannot resume unpaused Renderer!");
        }
        cancelAnimationFrame(this.thread);
        clearTimeout(this.sortThread);
        this._ispaused = false;
        startUpdate(this);
    };

    /**
     * adds a renderable item
     * @param sprite
     */
    Renderer.prototype.add = function(sprite) {
        this.renderItems.push(sprite);
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Sprite
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var Sprite = Smila.Sprite = function(canvas, options){
        if (!isDefined(options)) options = {};
        this.img = canvas;
        this.w = isDefined(options.h) ? options.h : canvas.height;
        this.h = isDefined(options.w) ? options.w : canvas.width;
        this.w_2 = Math.floor(this.w / 2);
        this.h_2 = Math.floor(this.h / 2);
        this.ox = 0 | 0;
        this.oy = 0 | 0;
        this.zIndexByYPos = isDefined(options.zIndexByYPos) ?
            options.zIndexByYPos : false;
        this.x = 0 | 0;
        this.y = 0 | 0;
        this.z = isDefined(options.z) ? options.z |0 : 0| 0;
        this.angleInRadians = 0;
        this.tl_x = this.x - this.w_2; // TOP-LEFT-X
        this.tl_y = this.y - this.h_2; // TOP-LEFT-Y
        this.mirrory = false;
        this.mirrorx = false;
    };

    /**
     *
     * @param w
     * @returns {*}
     */
    Sprite.prototype.width = function(w){
        if(arguments.length > 0) {
            this.w = w;
            this.w_2 = Math.floor(w/2);
            return this;
        }  else {
            return this.w;
        }
    };

    /**
     *
     * @param h
     * @returns {*}
     */
    Sprite.prototype.height = function(h){
        if(arguments.length > 0) {
            this.h = h;
            this.h_2 = Math.floor(h/2);
            return this;
        }  else {
            return this.h;
        }
    };

    /**
     * Position on the Renderer.
     * X-Y are the center position of the sprite
     * @param x
     * @param y
     * @returns {*}
     */
    Sprite.prototype.positionCenter = function(x,y){
        if (arguments.length > 0) {
            this.x = x;
            this.y = y;
            this.tl_x = x - this.w_2;
            this.tl_y = y - this.h_2;
            return this;
        } else {
            return {x : this.x, y : this.y};
        }
    };

    /**
     * Top-Left sprite position
     * @param x
     * @param y
     * @returns {{x: (number|*), y: (number|*)}}
     */
    Sprite.prototype.position = function(x,y){
        if (arguments.length > 0){
            this.tl_x = x;
            this.tl_y = y;
            this.x = x + this.w_2;
            this.y = y + this.h_2;
            return this;
        } else {
            return {x: this.tl_x, y: this.tl_y};
        }
    }

    Sprite.prototype.render = function(context){
        var x = this.x;
        var y = this.y;
        var w = this.w;
        var h = this.h;
        var wh = (0.5 + w/2) << 0;
        var hh = (0.5 + h/2) << 0;
        var mirrorx = this.mirrorx;
        var mirrory = this.mirrory;
        context.translate(x,y);
        if (this.angleInRadians !== 0) context.rotate(this.angleInRadians);
        if (mirrory && mirrorx) context.scale(-1,-1);
        else if (mirrory) context.scale(-1,1);
        else if (mirrorx) context.scale(1,-1);

        context.drawImage(this.img,this.ox,this.oy,w,h,-wh,-hh,w,h);

        if (mirrory && mirrorx) context.scale(1,1);
        else if (mirrory) context.scale(-1,1);
        else if (mirrorx) context.scale(1,-1);
        if (this.angleInRadians !== 0) context.rotate(-this.angleInRadians);
        context.translate(-x, -y);
    };

    Sprite.prototype.subimage = function(x,y){
        this.ox = x * this.w;
        this.oy = y * this.h;
        return this;
    };

    Sprite.prototype.directImage = function(ox,oy, w,h){
        this.ox = ox;
        this.oy = oy;
        this.width(w);
        this.height(h);
    };

    Sprite.prototype.verticalMirror = function(mirror){
        this.mirrory = mirror;
    };

    Sprite.prototype.horizontalMirror = function(mirror){
        this.mirrorx = mirror;
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Animation
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    function ONCE_UPDATE() {
        if (this.pointer < this.animations.length - 1) this.pointer += 1;
    };

    function ENDLESS_UPDATE() {
        if (this.pointer < (this.animations.length - 1)) this.pointer += 1;
        else this.pointer = 0;
    };

    function BOUNCE_UPDATE() {
        if (this.pointer == 0) this.forward = true;
        else if (this.pointer === (this.animations.length - 1)) this.forward = false;
        if (this.forward) this.pointer += 1;
        else this.pointer -= 1;
    };

    /**
     * options: {
     *      animations: [
     *          {ox:33, oy:100, w:32, h:32, time:1000},
     *          {ox:133, oy:10, w:32, h:64, time:322}
     *      ],
     *      animationType: Smila.Animation.Type.BOUNCE
     * }
     * @type {Animation}
     */
    var Animation = Smila.Animation = function(canvas, options){
        if (!isDefined(options)) throw logStr("Animation needs options");
        if (!isDefined(options.animations)) throw logStr("Animation needs animations");
        options.w = options.animations[0].w;
        options.h = options.animations[0].h;
        Sprite.call(this,canvas,options);
        this.forward = true;
        this.elapsedTime = 0;
        this.isStoped = true;
        this.pointer = 0;
        this.animations = options.animations;
        var type = isDefined(options.animationType) ?
            options.animationType : Animation.Type.ONCE;
        switch (type){
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

    Animation.prototype.play = function(){
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

    Animation.prototype.update = function(dt, elapsed){
        if (!this.isStoped){
            if (this.animations.length === 1){
                this.directImage(
                    this.animations[0].ox,
                    this.animations[0].oy,
                    this.animations[0].w,
                    this.animations[0].h
                );
            } else {
                var current = this.animations[this.pointer];
                this.width(current.w);
                this.height(current.h);
                this.directImage(current.ox, current.oy, current.w, current.h);
                if (this.elapsedTime >= current.time) {
                    this.elapsedTime = 0;
                    this.subupdate();
                }
                this.elapsedTime += elapsed;
            }
        }
    };

    Animation.Type = {
        BOUNCE:0,
        ONCE:1,
        ENDLESS:2
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Uniform Sprite
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var UniformSprite = Smila.UniformSprite = function(canvas, options){
        if (!isDefined(options)) throw logStr("Uniform Sprite needs options");
        if (!isDefined(options.w)) throw logStr("Uniform Sprite needs width option");
        if (!isDefined(options.h)) throw logStr("Uniform Sprite needs height option");
        Sprite.call(this,canvas,options);
    };

    UniformSprite.prototype = Object.create(Sprite.prototype);

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Uniform Animation
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var UniformAnimation = Smila.UniformAnimation = function(canvas, options){
        // Check needed data
        UniformSprite.call(this, canvas, options);
    };

    UniformAnimation.prototype = Object.create(UniformSprite.prototype);

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Camera
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var Camera = Smila.Camera = function(renderer){
        this.offset = {x:0,y:0};
        this.real = {x:0,y:0};
        this.renderer = renderer;
    };

    Camera.prototype.translate = function(offsetX, offsetY){
        this.offset.x = offsetX;
        this.offset.y = offsetY;
        if (offsetX === 0 && offsetY === 0){
            this.real.x = Math.round(this.real.x);
            this.real.y = Math.round(this.real.y);
        } else {
            this.real.x -= offsetX;
            this.real.y -= offsetY;
        }
    };

    Camera.prototype.render = function(context){
        context.translate(this.offset.x, this.offset.y);
    };

    Camera.prototype.set = function(x,y){
        var transX = this.real.x - x;
        var transY = this.real.y - y;
        this.translate(transX, transY);
        this.render(this.renderer.context);
        this.translate(0,0);
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // DataStore
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var spriteCache = {};

    var DataStore = Smila.DataStore = {

        /**
         *
         * @param spriteData: Either:
         * { key: "test", src: "res/img/test.png" }
         * Or:
         * [
         *      { key: "test", src: "res/img/test.png" },
         *      { key: "test1", src: "res/img/test2.png" }
         * ]
         */
        put : function(spriteData, callback){
            var acc = [];
            if (spriteData instanceof Array) {
                spriteData.forEach(function(element){
                   loadSprite(element, function () {
                       acc.push(0);
                       if (acc.length === spriteData.length){
                           callback();
                       }
                   }, function(){
                       throw logStr("Cannot load url: " + element.src);
                   })
                });
            } else {
                loadSprite(spriteData, callback, function(){
                    throw logStr("Cannot load url: " + spriteData.src);
                });
            }
        },

        get : function(key, options){
            if (key in spriteCache) {
                return new Sprite(spriteCache[key], options);
            } else {
                throw logStr("Could not find key {" + key + "}");
            }
        },

        getAnimation : function(key, options){
            if (key in spriteCache) {
                return new Animation(spriteCache[key], options);
            } else {
                throw logStr("Could not find key {" + key + "}");
            }
        },

        getUniform: function(key, options){
            if (key in spriteCache) {
                return new UniformSprite(spriteCache[key], options);
            } else {
                throw logStr("Could not find key {" + key + "}");
            }
        }
    };

    /**
     * private helper function to load images
     */
    function loadSprite(spriteData, callback, error){
        log("loading Sprite {" + spriteData.key + "}");
        var img = new Image();
        img.onload = function () {
            log("loaded Sprite {" + spriteData.key + "}");
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);
            spriteCache[spriteData.key] = canvas;
            callback.call(DataStore);
        };
        img.onerror = function(){
            log("Could not load Sprite {" + spriteData.key + "}");
        }

        if (spriteData.key in spriteCache) {
            log("Load Sprite " + spriteData.key +" from Cache");
            callback.call(DataStore);
        } else if (typeof spriteData.base64 !== "undefined") {
            log("Load Sprite " + spriteData.key +" from base64");
            img.src = spriteData.base64;
        } else {
            log("Load Sprite " + spriteData.key +" from URL: {" + spriteData.src + "}");
            img.src = spriteData.src;
        }
    };

    return Smila;
}();
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
            || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());