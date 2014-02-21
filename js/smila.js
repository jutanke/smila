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
        this._mouseIsOver = false;
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
        try {
            if (this._outline) {
                console.log("yaa")
                context.drawImage(this.imgOutlined, sx, sy, this.frameWidth, this.frameHeight, 0, 0, this.frameWidth, this.frameHeight);
            } else {
                context.drawImage(this.img, sx, sy, this.frameWidth, this.frameHeight, 0, 0, this.frameWidth, this.frameHeight);
            }
        } catch (e) {
            console.error(e);
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

    var camera = null;

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
            sortFunction = SORT_BY_Y_VALUE
        },

        isRunning:function () {
            return rendererIsRunning;
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
            for (var i = 0; i < particleEmitters.length;i++) {
                particleEmitters[i].update(context, dt, elapsed, cameraRealX, cameraRealY, rightOuterBound, bottomBound);
            }

            thread = requestAnimationFrame(Renderer.update);
            if (stats !== null) stats.update();
        },

        /**
         *
         * @param e {
         *      point : {x, y}
         *      velocity : {x, y}
         *      spread : double
         *      emissionRate : Integer
         *      lifetimeMs : Integer
         *      color : String || [String]
         *      totalLifetime : Integer { OPTIONAL }
         * }
         * @return {Smila.ParticleEmitter}
         */
        createParticleEmitter:function(e){
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
        this.velocity = e.velocity || e.v;
        this.spread = e.spread || e.s;
        this.emissionRate = e.emissionRate || e.e;
        this.lifetimeMs = e.lifetimeMs || e.ttl || 10000;
        this.color = e.color || "#99CCFF";
        this.totalLifetime = e.totalLifetime || e.tlt ||  null;
        this.elapsed = 0;
        this.colorPointer = 0;
        this.angle = Math.atan2(this.velocity.y, this.velocity.x)
        this.magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        var data = new ArrayBuffer(particleCount * PARTICLE_BYTE_SIZE);
        this.view = new Float32Array(data);
        this.pointer = 0;
        this.isActive = true;
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

    // DELETE ME!
    ParticleEmitter.prototype.setEmitter = function (point, velocity, spread, emissionRate, lifetimeMs, color) {
        this.emitter = {
            point:point,
            velocity:velocity,
            spread:spread,
            emissionRate:emissionRate || 4,
            lifetimeMs:lifetimeMs || 10000,
            color:color || "#99CCFF",
            elapsed:0,
            colorPointer:0,
            angle:Math.atan2(velocity.y, velocity.x),
            magnitude:Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
        };
    };


    ParticleEmitter.prototype.update = function (ctx, dt, elapsedMillis, viewX, viewY, viewWidthX, viewHeightY) {
        if (this.isActive) {
            if (this.totalLifetime !== null){
                if (this.totalLifetime < 0){
                    this.isActive = false;
                    return;
                }else{
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
            if (this.elapsed > 100) {
                this.elapsed = 0;
                for (var i = 0; i < this.emissionRate; i++) {
                    var angle = this.angle + this.spread - (Math.random() * this.spread * 2);
                    var x = this.magnitude * Math.cos(angle);
                    var y = this.magnitude * Math.sin(angle);
                    this.createParticle(this.point, {x:x, y:y}, this.lifetimeMs);
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

    // Array-Helpers


    // Array-Helpers End

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