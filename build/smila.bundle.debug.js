!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Smila=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Julian on 2/24/2015.
 */
"use strict";
function Camera() {
    this.offset = {x:0,y:0};
    this.real = {x:0,y:0};
}

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

Camera.prototype.set = function(x,y, context){
    var transX = this.real.x - x;
    var transY = this.real.y - y;
    this.translate(transX, transY);
    this.render(context);
    this.translate(0,0);
};

module.exports = Camera;
},{}],2:[function(require,module,exports){
/**
 * Created by Julian on 2/24/2015.
 */
"use strict";

var Future = require('future-callbacks');
var Utils = require('./Utils.js');
var YUtils = require('yutils');
var Sprite = require('./Sprite.js');

// ================================
// P R I V A T E
// ================================

var spriteCache = {};

var SPRITE_LOAD_TIMEOUT = 2000; // ms

/**
 *
 * @param spriteData
 * @param future
 */
function loadSprite(spriteData, future) {
    Utils.log("loading sprite " + spriteData.key);
    var img = new Image();

    if (spriteData.key in spriteCache) {
        Utils.log("load sprite " + spriteData.key + " from Cache");
        future.execSuccess();
    } else {
        img.onload = function () {
            Utils.log("sprite " + spriteData.key + "loaded");
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);
            spriteCache[spriteData.key] = canvas;
            future.execSuccess();
        };
        img.onerror = function (err) {
            Utils.log("could not load img " + spriteData.key, err);
            future.execFailure(err);
        };

        if (typeof spriteData.base64 !== 'undefined') {
            Utils.log("load sprite " + spriteData.key + " from base64");
            img.src = spriteData.base64;
        } else {
            Utils.log("load sprite " + spriteData.key + " from URL: " + spriteData.url);
            img.src = spriteData.src;
        }
    }
}

// ================================
// P U B L I C
// ================================

module.exports = {

    /**
     * @param spriteData {Object} {
     *
     *      key: name,
     *
     *      < base64: {String} || src: {String} url >
     *
     * }
     * @returns {Future}
     */
    put: function (spriteData) {
        var future;

        if (Array.isArray(spriteData)) {
            future = Future.create(this, spriteData.length, SPRITE_LOAD_TIMEOUT);
            spriteData.forEach(function (element) {
                loadSprite(element, future);
            });
        } else {
            future = Future.create();
            loadSprite(spriteData, future);
        }

        return future;
    },

    /**
     *
     * @param name
     * @param w
     * @param h
     * @returns {Sprite}
     */
    getSprite: function (name, w, h) {
        YUtils.assertLength(arguments, 3);
        if (name in spriteCache) {
            return new Sprite(spriteCache[name], w, h);
        } else {
            throw new Error("Indentifier {" + name + "} is not present in DataStore");
        }
    }

};
},{"./Sprite.js":7,"./Utils.js":8,"future-callbacks":9,"yutils":10}],3:[function(require,module,exports){
/**
 * Created by Julian on 2/24/2015.
 */

"use strict";

var Utils = require('yutils');
//var Future = require('future-callbacks');

var Scene = require('./Scene.js');

/**
 *
 * @param domId {String}
 * @param options
 * @constructor
 */
function Renderer(domId, options) {
    if (!Utils.isString(domId)) {
        throw new Error("DomID must be a String");
    }
    if (!Utils.isDefined(options)) {
        options = {};
    }

    var verbose = ("verbose" in options) ? options.verbose : false;

    var parent = document.getElementById(domId);
    var position = parent.style.position;
    if (position.length === 0) {
        parent.style.position = "relative";
    }

    var canvas = document.createElement('canvas');
    canvas.height = parent.clientHeight;
    canvas.width = parent.clientWidth;
    this.w = parent.clientWidth;
    this.h = parent.clientHeight;

    this.mousePosition = {
        x: 0,
        y: 0
    };
    this.dimension = {
        w: parent.clientWidth,
        h: parent.clientHeight
    };

    this.stats = null;
    if (verbose && typeof Stats !== 'undefined') {
        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.left = '0px';
        this.stats.domElement.style.top = '0px';
        parent.appendChild(this.stats.domElement);
    }

    this.context = canvas.getContext("2d");

    parent.appendChild(canvas);

    this.currentScene = null;

    start(this);
}

/**
 * start..
 * @param renderer
 */
function start(renderer) {
    var ctx = renderer.context;
    var stats = renderer.stats;
    var w = renderer.w;
    var h = renderer.h;
    function update() {
        if (stats !== null) {
            stats.begin();
        }

        if (renderer.currentScene !== null) {
            renderer.currentScene.render(ctx, w, h);
        }

        if (stats !== null) {
            stats.end();
        }
        requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

/**
 *
 * @param name
 * @param options
 * @returns {Scene|*}
 */
Renderer.prototype.putScene = function (scene) {
    Utils.assertLength(arguments, 1);
    if (this.currentScene !== null) {
        if (this.currentScene.name === scene.name) {
            throw new Error("Must not put the same Scene twice!");
        }
        Utils.executeCallbacks(this.currentScene.onrendererdetachedCbs, this);
    }
    this.currentScene = scene;
    Utils.executeCallbacks(scene.onrendererattachedCbs, this);

};

Renderer.prototype.close = function () {
    Utils.assertLength(arguments, 0);
    if (this.currentScene !== null) {
        Utils.executeCallbacks(this.currentScene.onrendererdetachedCbs, this);
    }
};

module.exports = Renderer;


// =====================

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
},{"./Scene.js":4,"yutils":10}],4:[function(require,module,exports){
/**
 * Created by Julian on 2/24/2015.
 */
"use strict";

var Utils = require('yutils');
var Camera = require('./Camera.js');

/**
 * @param options
 * @param callback {function}
 * @constructor
 */
function Scene(name, options) {
    Utils.assertLength(arguments, 2);
    this.name = name;
    var self = this;
    this.readyCallbacks = [];
    this.onrendererattachedCbs = [];
    this.onrendererdetachedCbs = [];
    this.isReady = false;
    this.lastTime = -1;
    this.map = null;
    this.camera = new Camera();
    this.renderingFunc = null;
    this.renderItems = [];
    if ("map" in options) {
        // LOAD FROM MAP
        var map = options["map"];
        if (!Utils.implements(map, "renderFront", "getRenderItems", "renderBack")) {
            throw new Error("Map does not implement needed functions");
        }
        this.map = map;
        var renderItems = map.getRenderItems();
        var i = 0, L = renderItems.length;
        for (;i<L;i++) {
            this.renderItems.push(renderItems[i]);
        }

    } else {
        // DEFAULT
        setTimeout(function () {
            applyReady(self);
        }, 1);
    }
}

var EXPECTED_ELAPSED_MILLIS = Math.floor(1000 / 60);

Scene.prototype.render = function (context, viewportW, viewportH) {

    var now = Date.now();
    var elapsed = 0;
    if (this.lastTime !== -1) {
        elapsed = now - this.lastTime;
    }
    this.lastTime = now;
    var dt = elapsed / EXPECTED_ELAPSED_MILLIS;

    var camera = this.camera;
    var map = this.map;
    var renderingFunc = this.renderingFunc;

    var cameraX = camera.real.x;
    var cameraY= camera.real.y;

    context.clearRect(cameraX, cameraY, viewportW, viewportH);

    if (renderingFunc != null) {
        this.renderingFunc(camera, dt);
    }

    camera.render(context);

    if (map !== null) {
        map.renderBack(context, cameraX, cameraY, viewportW, viewportH);
    }

    var i = 0, L = this.renderItems.length;
    var renderItems = this.renderItems;

    for (;i < L; i++) {
        renderItems[i].render(context);
    }

    if (map !== null) {
        map.renderFront(context, cameraX, cameraY, viewportW, viewportH);
    }
};

Scene.prototype.addRenderItem = function (renderItem) {
    if (!Utils.implements(renderItem, "render")) {
        throw new Error("gave non-RenderItem to function");
    }
    var pos = findRenderItemPosition(this, renderItem);
    if (pos !== -1) {
        throw new Error("Cannot add the same sprite multiple times");
    }
    this.renderItems.push(renderItem);
};

Scene.prototype.removeRenderItem = function (renderItem) {
    if (!Utils.implements(renderItem, "render")) {
        throw new Error("gave non-RenderItem to function");
    }
    var pos = findRenderItemPosition(this, renderItem);
    if (pos > -1) {
        Utils.deletePosition(this.renderItems, pos);
    }
};

Scene.prototype.onrender = function (callback) {
    this.renderingFunc = callback;
};

Scene.prototype.onready = function (callback) {
    if (this.isReady) {
        setTimeout(function () {
            callback();
        }, 1);
    } else {
        this.readyCallbacks.push(callback);
    }
};

Scene.prototype.onrendererattached = function (callback) {
    // this callbacks are called from the Renderer
    this.onrendererattachedCbs.push(callback);
};

Scene.prototype.onrendererdetached = function (callback) {
    // this callbacks are called from the Renderer
    this.onrendererdetachedCbs.push(callback);
};

// ==================================
// P R I V A T E
// ==================================

/**
 * Finds the position of the renderItem, if not -> -1
 * @param scene
 * @param renderItem
 * @returns {number}
 */
function findRenderItemPosition(scene, renderItem) {
    for (var i = 0; i < scene.renderItems.length; i++) {
        if (scene.renderItems[i].id === renderItem.id) {
            return i;
        }
    }
    return -1;
}

function applyReady(scene) {
    if (scene.isReady) {
        throw new Error("A Scene can only be ready ONCE!");
    }
    scene.isReady = true;
    Utils.executeCallbacks(scene.readyCallbacks);
}


module.exports = Scene;
},{"./Camera.js":1,"yutils":10}],5:[function(require,module,exports){
/**
 * Created by Julian on 2/24/2015.
 */
"use strict";

var Scene = require('./Scene.js');
var Utils = require('yutils');

var cache = {};

module.exports = {

    /**
     * @param name {String} unique identifier
     * @param options {Object}
     * @returns {Scene}
     */
    create: function (name, options) {
        Utils.assertLength(arguments, 2);
        if (!Utils.isString(name)) {
            throw new Error("first parameter must be a string");
        }
        var scene = new Scene(name, options);
        cache[name] = scene;
        return scene;
    },

    /**
     *
     * @param name
     * @returns {*}
     */
    get: function (name) {
        Utils.assertLength(arguments, 1);
        if (!Utils.isString(name)) throw new Error("The identifier for a Scene must be a String");
        if (name in cache) {
            return cache[name];
        } else {
            throw new Error("Could not find identifier for Scene");
        }
    }

};
},{"./Scene.js":4,"yutils":10}],6:[function(require,module,exports){
/**
 * Created by julian on 2/22/15.
 */
"use strict";

var SceneLoader = require('./SceneLoader.js');
var Renderer = require('./Renderer.js');
var DataStore = require('./DataStore.js');

// =====================================
// S M I L A
// =====================================
module.exports = {
    debug: function (str) {
        console.log(str);
    },

    /**
     *
     * @returns {SceneLoader}
     */
    sceneLoader : function () {
        return SceneLoader;
    },

    dataStore : function () {
        return DataStore;
    },

    /**
     *
     * @param domId
     * @param options
     * @returns {Renderer}
     */
    renderer : function (domId, options) {
        return new Renderer(domId, options);
    }

}
},{"./DataStore.js":2,"./Renderer.js":3,"./SceneLoader.js":5}],7:[function(require,module,exports){
/**
 * Created by julian on 2/23/15.
 */
"use strict";

var Utils = require('yutils');

var lastId = 0;

/**
 *
 * @param canvas
 * @param w of the sub image
 * @param h of the sub image
 * @constructor
 */
function Sprite(canvas, w, h) {
    Utils.assertLength(arguments, 3);
    this.id = lastId++;
    this.img = canvas;
    this.w = w | 0;
    this.h = h | 0;
    this.w_2 = Math.floor(this.w / 2) | 0;
    this.h_2 = Math.floor(this.h / 2) | 0;
    this.ox = 0 | 0;
    this.oy = 0 | 0;
    this.x = 0 | 0;
    this.y = 0 | 0;
    this.angleInRadians = 0;
    this.tl_x = this.x - this.w_2; // TOP-LEFT-X
    this.tl_y = this.y - this.h_2; // TOP-LEFT-Y
    this.mirrory = false;
    this.mirrorx = false;
}

/**
 * Centered sprite position
 * @param x
 * @param y
 */
Sprite.prototype.positionCenter = function (x, y) {
    this.x = x | 0;
    this.y = y | 0;
    this.tl_x = (x - this.w_2)  | 0;
    this.tl_y = (y - this.h_2)  | 0;
};

/**
 * Top-Left sprite position
 * @param x
 * @param y
 * @returns {Sprite}
 */
Sprite.prototype.position = function (x, y) {
    this.tl_x = x | 0;
    this.tl_y = y | 0;
    this.x = (x + this.w_2) | 0;
    this.y = (y + this.h_2) | 0;
    return this;
};

/**
 *
 * @param context
 */
Sprite.prototype.render = function (context) {
    var mirrorx = this.mirrorx;
    var mirrory = this.mirrory;
    var x = this.x;
    var y = this.y;
    var w = this.w;
    var h = this.h;
    var wh = this.w_2;
    var hh = this.h_2;
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

module.exports = Sprite;
},{"yutils":10}],8:[function(require,module,exports){
/**
 * Created by Julian on 3/2/2015.
 */
"use strict";

module.exports = {
    log: function (str, data) {
        if (typeof data === 'undefined') {
            console.log(str);
        } else {
            console.log(str, data);
        }
    }
}
},{}],9:[function(require,module,exports){
/**
 * Created by Julian on 3/1/2015.
 */
function Future(obj, maxCount, timeout) {
    this.obj = typeof obj === "undefined" ? {} : obj;
    this.successHandler = null;
    this.failureHandler = null;
    this.finallyHandler = null;
    this.finallyCount = 0;
    this.timeout = 0;
    if (typeof maxCount !== 'undefined') {
        if (typeof timeout === 'undefined') {
            throw new Error('timeout must be defined!');
        }
        this.timeout = timeout;
        this.maxCount = maxCount;
    } else {
        this.maxCount = 1;
    }
    this.timeoutThread = null;
};

Future.prototype.execSuccess = function () {
    var self = this;
    var args = arguments;
    if (this.successHandler === null) {
        // delegate a second try
        setTimeout(function () {
            if (self.successHandler === null) {
                console.warn("success on function with no success handler");
            } else {
                execute(self, "successHandler", args);
            }
        }, 1); // NEXT EXECUTION
    } else {
        execute(this, "successHandler", arguments);
    }
};

function execute(future, handlerName, args) {
    future.finallyCount += 1;
    future[handlerName].apply(future.obj, args);
    if (future.finallyCount === future.maxCount && future.finallyHandler !== null) {
        clearInterval(future.timeoutThread);
        future.finallyHandler.call(future.obj);
        future.successHandler = null;
        future.failureHandler = null;
    }
}

Future.prototype.execFailure = function () {
    var self = this;
    var args = arguments;
    if (this.failureHandler == null) {
        // delegate a second try
        setTimeout(function () {
            if (self.failureHandler === null) {
                throw new Error("unhandled failure");
            } else {
                execute(this, "failureHandler", args);
            }
        }, 1);
    } else {
        execute(this, "failureHandler", arguments);
    }
};

Future.prototype.success = function (callback) {
    if (this.successHandler == null) {
        this.successHandler = callback;
    } else {
        throw new Error("Listener is already set!");
    }
    return this;
};

Future.prototype.failure = function (callback) {
    if (this.failureHandler == null) {
        this.failureHandler = callback;
    } else {
        throw new Error("Listener is already set!");
    }
    return this;
};

Future.prototype.finally = function (a, b, c) {
    var self = this;
    if (this.finallyHandler != null) {
        throw new Error("Listener is already set!");
    } else {
        if (isFunction(a)) {
            this.finallyHandler = a;
            if (this.timeout > 0) {
                this.timeoutThread = setTimeout(function () {
                    self.finallyHandler.call(self.obj);
                }, this.timeout);
            }
            return this;
        } else if (isNumber(a) && a > 0) {
            this.maxCount = a;
            if (isNumber(b)) {
                this.timeoutThread = setTimeout(function () {
                    self.finallyHandler.call(self.obj);
                }, b);
            } else {
                throw new Error("timeout parameter is missing!");
            }
            if (isFunction(c)) {
                self.finallyHandler = c;
            } else {
                clearTimeout(this.timeoutThread);
                throw new Error("callback must be a function!");
            }
        } else {
            throw new Error("first param must be number or function!");
        }
    }
};

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

module.exports.create = function (obj, i, t) {
    return new Future(obj, i, t);
};
},{}],10:[function(require,module,exports){
/**
 * Created by Julian on 12/10/2014.
 */
(function (exports) {

    // performance.now polyfill
    var perf = null;
    if (typeof performance === 'undefined') {
        perf = {};
    } else {
        perf = performance;
    }

    perf.now = perf.now || perf.mozNow || perf.msNow || perf.oNow || perf.webkitNow || Date.now ||
        function () {
            return new Date().getTime();
        };

    function swap(array, i, j) {
        if (i !== j) {
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    /*
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */

    var getRandomInt = exports.getRandomInt = function (min, max) {
        if (min > max) throw new Error("min must be smaller than max! {" + min + ">" + max + "}");
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    exports.sample = function (list, n) {
        var result = [], j, i = 0, L = n > list.length ? list.length : n, s = list.length - 1;
        for (; i < L; i++) {
            j = getRandomInt(i, s);
            swap(list, i, j);
            result.push(list[i]);
        }
        return result;
    };

    var isString = exports.isString = function (myVar) {
        return (typeof myVar === 'string' || myVar instanceof String)
    };

    exports.assertLength = function (arg, nbr) {
        if (arg.length === nbr) return true;
        else throw new Error("Wrong number of arguments: expected:" + nbr + ", but got: " + arg.length);
    };

    exports.guid = function () {
        var d = perf.now();
        var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return guid;
    };

    exports.timeDifferenceInMs = function (tsA, tsB) {
        if (tsA instanceof Date) {
            tsA = tsA.getTime();
        }
        if (tsB instanceof Date) {
            tsB = tsB.getTime();
        }
        return Math.abs(tsA - tsB);
    };

    /**
     * milliseconds to seconds
     * @param ms {Number} Millis
     */
    exports.msToS = function (ms) {
        return ms / 1000;
    };

    exports.isDefined = function (o) {
        if (o === null) return false;
        if (typeof o === "undefined") return false;
        return true;
    };

    /**
     * Shallow clone
     * @param list
     * @returns {Array|string|Blob}
     */
    exports.cloneArray = function (list) {
        return list.slice(0);
    };

    /**
     * removes the item at the position and reindexes the list
     * @param list
     * @param i
     * @returns {*}
     */
    exports.deletePosition = function (list, i) {
        if (i < 0 || i >= list.length) throw new Error("Out of bounds");
        list.splice(i, 1);
        return list;
    };

    /**
     * Checks weather the the object implements the full interface or not
     * @param o {Object}
     */
    var implements = exports.implements = function (o, a) {
        if (Array.isArray(a)) {
            return implements.apply({}, [o].concat(a));
        }
        var i = 1, methodName;
        while ((methodName = arguments[i++])) {
            if (typeof o[methodName] !== "function") {
                return false;
            }
        }
        return true;
    };

    var isNumber = exports.isNumber = function (o) {
        if (isString(o)) return false;
        return !isNaN(o - 0) && o !== null && typeof o !== 'undefined' && o !== false;
    };

    function not(l) {
        return !l;
    }

    /**
     * Checks if the object equals the definition
     * @param obj {Object}
     * @param definition {Object} {
     *      'key1': String,
     *      'key2': AnyClass,
     *      'key3': Number
     *
     * }
     * @returns {boolean}
     */
    var defines = exports.defines = function (obj, definition) {
        var key = null, type, i = 0, L;
        if (Array.isArray(obj)) {
            L = obj.length;
            for (;i<L;i++) {
                if (!defines(obj[i], definition)) {
                    return false;
                }
            }
        } else {
            for (key in definition) {
                type = definition[key];
                switch (type) {
                    case String:
                        if (not(isString(obj[key]))) {
                            console.error('object@' + key + ' does not implement ' + type + ':', obj);
                            return false;
                        }
                        break;
                    case Number:
                        if (not(isNumber(obj[key]))) {
                            console.error('object@' + key + ' does not implement ' + type + ':', obj);
                            return false
                        }
                        break;
                    default:
                        if (not(obj[key] instanceof type)) {
                            console.error('object@' + key + ' does not implement ' + type + ':', obj);
                            return false;
                        }
                        break;
                }
            }
        }
        return true;
    };

    /**
     * Inherit stuff from parent
     * @param child
     * @param parent
     */
    exports.inherit = function (child, parent) {
        child.prototype = Object.create(parent.prototype);
    };

    /**
     *
     * @param callbacks
     */
    exports.executeCallbacks = function (callbacks) {
        var args = null;
        if (arguments.length > 1) {
            args = Array.prototype.slice.call(arguments, 1, arguments.length);
        }
        var i = 0, L = callbacks.length;
        if (args == null) {
            for (; i < L; i++) {
                callbacks[i]();
            }
        } else {
            for (; i < L; i++) {
                callbacks[i].apply(this, args);
            }
        }
    };


})(typeof exports === 'undefined' ? this['yUtils'] = {} : exports);
},{}]},{},[6])(6)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImxpYi9DYW1lcmEuanMiLCJsaWIvRGF0YVN0b3JlLmpzIiwibGliL1JlbmRlcmVyLmpzIiwibGliL1NjZW5lLmpzIiwibGliL1NjZW5lTG9hZGVyLmpzIiwibGliL1NtaWxhLmpzIiwibGliL1Nwcml0ZS5qcyIsImxpYi9VdGlscy5qcyIsIm5vZGVfbW9kdWxlcy9mdXR1cmUtY2FsbGJhY2tzL2xpYi9mdXR1cmUuanMiLCJub2RlX21vZHVsZXMveXV0aWxzL3l1dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gQ2FtZXJhKCkge1xuICAgIHRoaXMub2Zmc2V0ID0ge3g6MCx5OjB9O1xuICAgIHRoaXMucmVhbCA9IHt4OjAseTowfTtcbn1cblxuQ2FtZXJhLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihvZmZzZXRYLCBvZmZzZXRZKXtcbiAgICB0aGlzLm9mZnNldC54ID0gb2Zmc2V0WDtcbiAgICB0aGlzLm9mZnNldC55ID0gb2Zmc2V0WTtcbiAgICBpZiAob2Zmc2V0WCA9PT0gMCAmJiBvZmZzZXRZID09PSAwKXtcbiAgICAgICAgdGhpcy5yZWFsLnggPSBNYXRoLnJvdW5kKHRoaXMucmVhbC54KTtcbiAgICAgICAgdGhpcy5yZWFsLnkgPSBNYXRoLnJvdW5kKHRoaXMucmVhbC55KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlYWwueCAtPSBvZmZzZXRYO1xuICAgICAgICB0aGlzLnJlYWwueSAtPSBvZmZzZXRZO1xuICAgIH1cbn07XG5cbkNhbWVyYS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCl7XG4gICAgY29udGV4dC50cmFuc2xhdGUodGhpcy5vZmZzZXQueCwgdGhpcy5vZmZzZXQueSk7XG59O1xuXG5DYW1lcmEucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKHgseSwgY29udGV4dCl7XG4gICAgdmFyIHRyYW5zWCA9IHRoaXMucmVhbC54IC0geDtcbiAgICB2YXIgdHJhbnNZID0gdGhpcy5yZWFsLnkgLSB5O1xuICAgIHRoaXMudHJhbnNsYXRlKHRyYW5zWCwgdHJhbnNZKTtcbiAgICB0aGlzLnJlbmRlcihjb250ZXh0KTtcbiAgICB0aGlzLnRyYW5zbGF0ZSgwLDApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgRnV0dXJlID0gcmVxdWlyZSgnZnV0dXJlLWNhbGxiYWNrcycpO1xudmFyIFV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xudmFyIFlVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xudmFyIFNwcml0ZSA9IHJlcXVpcmUoJy4vU3ByaXRlLmpzJyk7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBQIFIgSSBWIEEgVCBFXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG52YXIgc3ByaXRlQ2FjaGUgPSB7fTtcblxudmFyIFNQUklURV9MT0FEX1RJTUVPVVQgPSAyMDAwOyAvLyBtc1xuXG4vKipcbiAqXG4gKiBAcGFyYW0gc3ByaXRlRGF0YVxuICogQHBhcmFtIGZ1dHVyZVxuICovXG5mdW5jdGlvbiBsb2FkU3ByaXRlKHNwcml0ZURhdGEsIGZ1dHVyZSkge1xuICAgIFV0aWxzLmxvZyhcImxvYWRpbmcgc3ByaXRlIFwiICsgc3ByaXRlRGF0YS5rZXkpO1xuICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGlmIChzcHJpdGVEYXRhLmtleSBpbiBzcHJpdGVDYWNoZSkge1xuICAgICAgICBVdGlscy5sb2coXCJsb2FkIHNwcml0ZSBcIiArIHNwcml0ZURhdGEua2V5ICsgXCIgZnJvbSBDYWNoZVwiKTtcbiAgICAgICAgZnV0dXJlLmV4ZWNTdWNjZXNzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFV0aWxzLmxvZyhcInNwcml0ZSBcIiArIHNwcml0ZURhdGEua2V5ICsgXCJsb2FkZWRcIik7XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWcud2lkdGg7XG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodDtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWcsIDAsIDApO1xuICAgICAgICAgICAgc3ByaXRlQ2FjaGVbc3ByaXRlRGF0YS5rZXldID0gY2FudmFzO1xuICAgICAgICAgICAgZnV0dXJlLmV4ZWNTdWNjZXNzKCk7XG4gICAgICAgIH07XG4gICAgICAgIGltZy5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgVXRpbHMubG9nKFwiY291bGQgbm90IGxvYWQgaW1nIFwiICsgc3ByaXRlRGF0YS5rZXksIGVycik7XG4gICAgICAgICAgICBmdXR1cmUuZXhlY0ZhaWx1cmUoZXJyKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZW9mIHNwcml0ZURhdGEuYmFzZTY0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgVXRpbHMubG9nKFwibG9hZCBzcHJpdGUgXCIgKyBzcHJpdGVEYXRhLmtleSArIFwiIGZyb20gYmFzZTY0XCIpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNwcml0ZURhdGEuYmFzZTY0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgVXRpbHMubG9nKFwibG9hZCBzcHJpdGUgXCIgKyBzcHJpdGVEYXRhLmtleSArIFwiIGZyb20gVVJMOiBcIiArIHNwcml0ZURhdGEudXJsKTtcbiAgICAgICAgICAgIGltZy5zcmMgPSBzcHJpdGVEYXRhLnNyYztcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFAgVSBCIEwgSSBDXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBzcHJpdGVEYXRhIHtPYmplY3R9IHtcbiAgICAgKlxuICAgICAqICAgICAga2V5OiBuYW1lLFxuICAgICAqXG4gICAgICogICAgICA8IGJhc2U2NDoge1N0cmluZ30gfHwgc3JjOiB7U3RyaW5nfSB1cmwgPlxuICAgICAqXG4gICAgICogfVxuICAgICAqIEByZXR1cm5zIHtGdXR1cmV9XG4gICAgICovXG4gICAgcHV0OiBmdW5jdGlvbiAoc3ByaXRlRGF0YSkge1xuICAgICAgICB2YXIgZnV0dXJlO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNwcml0ZURhdGEpKSB7XG4gICAgICAgICAgICBmdXR1cmUgPSBGdXR1cmUuY3JlYXRlKHRoaXMsIHNwcml0ZURhdGEubGVuZ3RoLCBTUFJJVEVfTE9BRF9USU1FT1VUKTtcbiAgICAgICAgICAgIHNwcml0ZURhdGEuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGxvYWRTcHJpdGUoZWxlbWVudCwgZnV0dXJlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnV0dXJlID0gRnV0dXJlLmNyZWF0ZSgpO1xuICAgICAgICAgICAgbG9hZFNwcml0ZShzcHJpdGVEYXRhLCBmdXR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1dHVyZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZVxuICAgICAqIEBwYXJhbSB3XG4gICAgICogQHBhcmFtIGhcbiAgICAgKiBAcmV0dXJucyB7U3ByaXRlfVxuICAgICAqL1xuICAgIGdldFNwcml0ZTogZnVuY3Rpb24gKG5hbWUsIHcsIGgpIHtcbiAgICAgICAgWVV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDMpO1xuICAgICAgICBpZiAobmFtZSBpbiBzcHJpdGVDYWNoZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTcHJpdGUoc3ByaXRlQ2FjaGVbbmFtZV0sIHcsIGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5kZW50aWZpZXIge1wiICsgbmFtZSArIFwifSBpcyBub3QgcHJlc2VudCBpbiBEYXRhU3RvcmVcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbn07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xuLy92YXIgRnV0dXJlID0gcmVxdWlyZSgnZnV0dXJlLWNhbGxiYWNrcycpO1xuXG52YXIgU2NlbmUgPSByZXF1aXJlKCcuL1NjZW5lLmpzJyk7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBkb21JZCB7U3RyaW5nfVxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBSZW5kZXJlcihkb21JZCwgb3B0aW9ucykge1xuICAgIGlmICghVXRpbHMuaXNTdHJpbmcoZG9tSWQpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRvbUlEIG11c3QgYmUgYSBTdHJpbmdcIik7XG4gICAgfVxuICAgIGlmICghVXRpbHMuaXNEZWZpbmVkKG9wdGlvbnMpKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICB2YXIgdmVyYm9zZSA9IChcInZlcmJvc2VcIiBpbiBvcHRpb25zKSA/IG9wdGlvbnMudmVyYm9zZSA6IGZhbHNlO1xuXG4gICAgdmFyIHBhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRvbUlkKTtcbiAgICB2YXIgcG9zaXRpb24gPSBwYXJlbnQuc3R5bGUucG9zaXRpb247XG4gICAgaWYgKHBvc2l0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBwYXJlbnQuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XG4gICAgfVxuXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBwYXJlbnQuY2xpZW50SGVpZ2h0O1xuICAgIGNhbnZhcy53aWR0aCA9IHBhcmVudC5jbGllbnRXaWR0aDtcbiAgICB0aGlzLncgPSBwYXJlbnQuY2xpZW50V2lkdGg7XG4gICAgdGhpcy5oID0gcGFyZW50LmNsaWVudEhlaWdodDtcblxuICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgIH07XG4gICAgdGhpcy5kaW1lbnNpb24gPSB7XG4gICAgICAgIHc6IHBhcmVudC5jbGllbnRXaWR0aCxcbiAgICAgICAgaDogcGFyZW50LmNsaWVudEhlaWdodFxuICAgIH07XG5cbiAgICB0aGlzLnN0YXRzID0gbnVsbDtcbiAgICBpZiAodmVyYm9zZSAmJiB0eXBlb2YgU3RhdHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuc3RhdHMgPSBuZXcgU3RhdHMoKTtcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAnMHB4JztcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnRvcCA9ICcwcHgnO1xuICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodGhpcy5zdGF0cy5kb21FbGVtZW50KTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICB0aGlzLmN1cnJlbnRTY2VuZSA9IG51bGw7XG5cbiAgICBzdGFydCh0aGlzKTtcbn1cblxuLyoqXG4gKiBzdGFydC4uXG4gKiBAcGFyYW0gcmVuZGVyZXJcbiAqL1xuZnVuY3Rpb24gc3RhcnQocmVuZGVyZXIpIHtcbiAgICB2YXIgY3R4ID0gcmVuZGVyZXIuY29udGV4dDtcbiAgICB2YXIgc3RhdHMgPSByZW5kZXJlci5zdGF0cztcbiAgICB2YXIgdyA9IHJlbmRlcmVyLnc7XG4gICAgdmFyIGggPSByZW5kZXJlci5oO1xuICAgIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAgICAgaWYgKHN0YXRzICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzdGF0cy5iZWdpbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlbmRlcmVyLmN1cnJlbnRTY2VuZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmVuZGVyZXIuY3VycmVudFNjZW5lLnJlbmRlcihjdHgsIHcsIGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0YXRzICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzdGF0cy5lbmQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodXBkYXRlKTtcbiAgICB9XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodXBkYXRlKTtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIG5hbWVcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAcmV0dXJucyB7U2NlbmV8Kn1cbiAqL1xuUmVuZGVyZXIucHJvdG90eXBlLnB1dFNjZW5lID0gZnVuY3Rpb24gKHNjZW5lKSB7XG4gICAgVXRpbHMuYXNzZXJ0TGVuZ3RoKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKHRoaXMuY3VycmVudFNjZW5lICE9PSBudWxsKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTY2VuZS5uYW1lID09PSBzY2VuZS5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IG5vdCBwdXQgdGhlIHNhbWUgU2NlbmUgdHdpY2UhXCIpO1xuICAgICAgICB9XG4gICAgICAgIFV0aWxzLmV4ZWN1dGVDYWxsYmFja3ModGhpcy5jdXJyZW50U2NlbmUub25yZW5kZXJlcmRldGFjaGVkQ2JzLCB0aGlzKTtcbiAgICB9XG4gICAgdGhpcy5jdXJyZW50U2NlbmUgPSBzY2VuZTtcbiAgICBVdGlscy5leGVjdXRlQ2FsbGJhY2tzKHNjZW5lLm9ucmVuZGVyZXJhdHRhY2hlZENicywgdGhpcyk7XG5cbn07XG5cblJlbmRlcmVyLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBVdGlscy5hc3NlcnRMZW5ndGgoYXJndW1lbnRzLCAwKTtcbiAgICBpZiAodGhpcy5jdXJyZW50U2NlbmUgIT09IG51bGwpIHtcbiAgICAgICAgVXRpbHMuZXhlY3V0ZUNhbGxiYWNrcyh0aGlzLmN1cnJlbnRTY2VuZS5vbnJlbmRlcmVyZGV0YWNoZWRDYnMsIHRoaXMpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyZXI7XG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09XG5cbihmdW5jdGlvbigpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHZhciB2ZW5kb3JzID0gWydtcycsICdtb3onLCAnd2Via2l0JywgJ28nXTtcbiAgICBmb3IodmFyIHggPSAwOyB4IDwgdmVuZG9ycy5sZW5ndGggJiYgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsreCkge1xuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0rJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1t4XSsnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXVxuICAgICAgICAgICAgfHwgd2luZG93W3ZlbmRvcnNbeF0rJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgIH1cblxuICAgIGlmICghd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSlcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xuICAgICAgICAgICAgdmFyIGlkID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7IH0sXG4gICAgICAgICAgICAgICAgdGltZVRvQ2FsbCk7XG4gICAgICAgICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcbiAgICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgfTtcblxuICAgIGlmICghd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKVxuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICAgICAgfTtcbn0oKSk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgVXRpbHMgPSByZXF1aXJlKCd5dXRpbHMnKTtcbnZhciBDYW1lcmEgPSByZXF1aXJlKCcuL0NhbWVyYS5qcycpO1xuXG4vKipcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAcGFyYW0gY2FsbGJhY2sge2Z1bmN0aW9ufVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFNjZW5lKG5hbWUsIG9wdGlvbnMpIHtcbiAgICBVdGlscy5hc3NlcnRMZW5ndGgoYXJndW1lbnRzLCAyKTtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnJlYWR5Q2FsbGJhY2tzID0gW107XG4gICAgdGhpcy5vbnJlbmRlcmVyYXR0YWNoZWRDYnMgPSBbXTtcbiAgICB0aGlzLm9ucmVuZGVyZXJkZXRhY2hlZENicyA9IFtdO1xuICAgIHRoaXMuaXNSZWFkeSA9IGZhbHNlO1xuICAgIHRoaXMubGFzdFRpbWUgPSAtMTtcbiAgICB0aGlzLm1hcCA9IG51bGw7XG4gICAgdGhpcy5jYW1lcmEgPSBuZXcgQ2FtZXJhKCk7XG4gICAgdGhpcy5yZW5kZXJpbmdGdW5jID0gbnVsbDtcbiAgICB0aGlzLnJlbmRlckl0ZW1zID0gW107XG4gICAgaWYgKFwibWFwXCIgaW4gb3B0aW9ucykge1xuICAgICAgICAvLyBMT0FEIEZST00gTUFQXG4gICAgICAgIHZhciBtYXAgPSBvcHRpb25zW1wibWFwXCJdO1xuICAgICAgICBpZiAoIVV0aWxzLmltcGxlbWVudHMobWFwLCBcInJlbmRlckZyb250XCIsIFwiZ2V0UmVuZGVySXRlbXNcIiwgXCJyZW5kZXJCYWNrXCIpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNYXAgZG9lcyBub3QgaW1wbGVtZW50IG5lZWRlZCBmdW5jdGlvbnNcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXAgPSBtYXA7XG4gICAgICAgIHZhciByZW5kZXJJdGVtcyA9IG1hcC5nZXRSZW5kZXJJdGVtcygpO1xuICAgICAgICB2YXIgaSA9IDAsIEwgPSByZW5kZXJJdGVtcy5sZW5ndGg7XG4gICAgICAgIGZvciAoO2k8TDtpKyspIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVySXRlbXMucHVzaChyZW5kZXJJdGVtc1tpXSk7XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERFRkFVTFRcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhcHBseVJlYWR5KHNlbGYpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG59XG5cbnZhciBFWFBFQ1RFRF9FTEFQU0VEX01JTExJUyA9IE1hdGguZmxvb3IoMTAwMCAvIDYwKTtcblxuU2NlbmUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIChjb250ZXh0LCB2aWV3cG9ydFcsIHZpZXdwb3J0SCkge1xuXG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgdmFyIGVsYXBzZWQgPSAwO1xuICAgIGlmICh0aGlzLmxhc3RUaW1lICE9PSAtMSkge1xuICAgICAgICBlbGFwc2VkID0gbm93IC0gdGhpcy5sYXN0VGltZTtcbiAgICB9XG4gICAgdGhpcy5sYXN0VGltZSA9IG5vdztcbiAgICB2YXIgZHQgPSBlbGFwc2VkIC8gRVhQRUNURURfRUxBUFNFRF9NSUxMSVM7XG5cbiAgICB2YXIgY2FtZXJhID0gdGhpcy5jYW1lcmE7XG4gICAgdmFyIG1hcCA9IHRoaXMubWFwO1xuICAgIHZhciByZW5kZXJpbmdGdW5jID0gdGhpcy5yZW5kZXJpbmdGdW5jO1xuXG4gICAgdmFyIGNhbWVyYVggPSBjYW1lcmEucmVhbC54O1xuICAgIHZhciBjYW1lcmFZPSBjYW1lcmEucmVhbC55O1xuXG4gICAgY29udGV4dC5jbGVhclJlY3QoY2FtZXJhWCwgY2FtZXJhWSwgdmlld3BvcnRXLCB2aWV3cG9ydEgpO1xuXG4gICAgaWYgKHJlbmRlcmluZ0Z1bmMgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLnJlbmRlcmluZ0Z1bmMoY2FtZXJhLCBkdCk7XG4gICAgfVxuXG4gICAgY2FtZXJhLnJlbmRlcihjb250ZXh0KTtcblxuICAgIGlmIChtYXAgIT09IG51bGwpIHtcbiAgICAgICAgbWFwLnJlbmRlckJhY2soY29udGV4dCwgY2FtZXJhWCwgY2FtZXJhWSwgdmlld3BvcnRXLCB2aWV3cG9ydEgpO1xuICAgIH1cblxuICAgIHZhciBpID0gMCwgTCA9IHRoaXMucmVuZGVySXRlbXMubGVuZ3RoO1xuICAgIHZhciByZW5kZXJJdGVtcyA9IHRoaXMucmVuZGVySXRlbXM7XG5cbiAgICBmb3IgKDtpIDwgTDsgaSsrKSB7XG4gICAgICAgIHJlbmRlckl0ZW1zW2ldLnJlbmRlcihjb250ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAobWFwICE9PSBudWxsKSB7XG4gICAgICAgIG1hcC5yZW5kZXJGcm9udChjb250ZXh0LCBjYW1lcmFYLCBjYW1lcmFZLCB2aWV3cG9ydFcsIHZpZXdwb3J0SCk7XG4gICAgfVxufTtcblxuU2NlbmUucHJvdG90eXBlLmFkZFJlbmRlckl0ZW0gPSBmdW5jdGlvbiAocmVuZGVySXRlbSkge1xuICAgIGlmICghVXRpbHMuaW1wbGVtZW50cyhyZW5kZXJJdGVtLCBcInJlbmRlclwiKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJnYXZlIG5vbi1SZW5kZXJJdGVtIHRvIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgICB2YXIgcG9zID0gZmluZFJlbmRlckl0ZW1Qb3NpdGlvbih0aGlzLCByZW5kZXJJdGVtKTtcbiAgICBpZiAocG9zICE9PSAtMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgYWRkIHRoZSBzYW1lIHNwcml0ZSBtdWx0aXBsZSB0aW1lc1wiKTtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXJJdGVtcy5wdXNoKHJlbmRlckl0ZW0pO1xufTtcblxuU2NlbmUucHJvdG90eXBlLnJlbW92ZVJlbmRlckl0ZW0gPSBmdW5jdGlvbiAocmVuZGVySXRlbSkge1xuICAgIGlmICghVXRpbHMuaW1wbGVtZW50cyhyZW5kZXJJdGVtLCBcInJlbmRlclwiKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJnYXZlIG5vbi1SZW5kZXJJdGVtIHRvIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgICB2YXIgcG9zID0gZmluZFJlbmRlckl0ZW1Qb3NpdGlvbih0aGlzLCByZW5kZXJJdGVtKTtcbiAgICBpZiAocG9zID4gLTEpIHtcbiAgICAgICAgVXRpbHMuZGVsZXRlUG9zaXRpb24odGhpcy5yZW5kZXJJdGVtcywgcG9zKTtcbiAgICB9XG59O1xuXG5TY2VuZS5wcm90b3R5cGUub25yZW5kZXIgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB0aGlzLnJlbmRlcmluZ0Z1bmMgPSBjYWxsYmFjaztcbn07XG5cblNjZW5lLnByb3RvdHlwZS5vbnJlYWR5ID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgaWYgKHRoaXMuaXNSZWFkeSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0sIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVhZHlDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufTtcblxuU2NlbmUucHJvdG90eXBlLm9ucmVuZGVyZXJhdHRhY2hlZCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIC8vIHRoaXMgY2FsbGJhY2tzIGFyZSBjYWxsZWQgZnJvbSB0aGUgUmVuZGVyZXJcbiAgICB0aGlzLm9ucmVuZGVyZXJhdHRhY2hlZENicy5wdXNoKGNhbGxiYWNrKTtcbn07XG5cblNjZW5lLnByb3RvdHlwZS5vbnJlbmRlcmVyZGV0YWNoZWQgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAvLyB0aGlzIGNhbGxiYWNrcyBhcmUgY2FsbGVkIGZyb20gdGhlIFJlbmRlcmVyXG4gICAgdGhpcy5vbnJlbmRlcmVyZGV0YWNoZWRDYnMucHVzaChjYWxsYmFjayk7XG59O1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBQIFIgSSBWIEEgVCBFXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbi8qKlxuICogRmluZHMgdGhlIHBvc2l0aW9uIG9mIHRoZSByZW5kZXJJdGVtLCBpZiBub3QgLT4gLTFcbiAqIEBwYXJhbSBzY2VuZVxuICogQHBhcmFtIHJlbmRlckl0ZW1cbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGZpbmRSZW5kZXJJdGVtUG9zaXRpb24oc2NlbmUsIHJlbmRlckl0ZW0pIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjZW5lLnJlbmRlckl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChzY2VuZS5yZW5kZXJJdGVtc1tpXS5pZCA9PT0gcmVuZGVySXRlbS5pZCkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBhcHBseVJlYWR5KHNjZW5lKSB7XG4gICAgaWYgKHNjZW5lLmlzUmVhZHkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSBTY2VuZSBjYW4gb25seSBiZSByZWFkeSBPTkNFIVwiKTtcbiAgICB9XG4gICAgc2NlbmUuaXNSZWFkeSA9IHRydWU7XG4gICAgVXRpbHMuZXhlY3V0ZUNhbGxiYWNrcyhzY2VuZS5yZWFkeUNhbGxiYWNrcyk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDIvMjQvMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBTY2VuZSA9IHJlcXVpcmUoJy4vU2NlbmUuanMnKTtcbnZhciBVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xuXG52YXIgY2FjaGUgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gbmFtZSB7U3RyaW5nfSB1bmlxdWUgaWRlbnRpZmllclxuICAgICAqIEBwYXJhbSBvcHRpb25zIHtPYmplY3R9XG4gICAgICogQHJldHVybnMge1NjZW5lfVxuICAgICAqL1xuICAgIGNyZWF0ZTogZnVuY3Rpb24gKG5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgVXRpbHMuYXNzZXJ0TGVuZ3RoKGFyZ3VtZW50cywgMik7XG4gICAgICAgIGlmICghVXRpbHMuaXNTdHJpbmcobmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImZpcnN0IHBhcmFtZXRlciBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzY2VuZSA9IG5ldyBTY2VuZShuYW1lLCBvcHRpb25zKTtcbiAgICAgICAgY2FjaGVbbmFtZV0gPSBzY2VuZTtcbiAgICAgICAgcmV0dXJuIHNjZW5lO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBVdGlscy5hc3NlcnRMZW5ndGgoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaWYgKCFVdGlscy5pc1N0cmluZyhuYW1lKSkgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGlkZW50aWZpZXIgZm9yIGEgU2NlbmUgbXVzdCBiZSBhIFN0cmluZ1wiKTtcbiAgICAgICAgaWYgKG5hbWUgaW4gY2FjaGUpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWNoZVtuYW1lXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBmaW5kIGlkZW50aWZpZXIgZm9yIFNjZW5lXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG59OyIsIi8qKlxuICogQ3JlYXRlZCBieSBqdWxpYW4gb24gMi8yMi8xNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBTY2VuZUxvYWRlciA9IHJlcXVpcmUoJy4vU2NlbmVMb2FkZXIuanMnKTtcbnZhciBSZW5kZXJlciA9IHJlcXVpcmUoJy4vUmVuZGVyZXIuanMnKTtcbnZhciBEYXRhU3RvcmUgPSByZXF1aXJlKCcuL0RhdGFTdG9yZS5qcycpO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBTIE0gSSBMIEFcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGRlYnVnOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHN0cik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge1NjZW5lTG9hZGVyfVxuICAgICAqL1xuICAgIHNjZW5lTG9hZGVyIDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gU2NlbmVMb2FkZXI7XG4gICAgfSxcblxuICAgIGRhdGFTdG9yZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIERhdGFTdG9yZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZG9tSWRcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIHtSZW5kZXJlcn1cbiAgICAgKi9cbiAgICByZW5kZXJlciA6IGZ1bmN0aW9uIChkb21JZCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gbmV3IFJlbmRlcmVyKGRvbUlkLCBvcHRpb25zKTtcbiAgICB9XG5cbn0iLCIvKipcbiAqIENyZWF0ZWQgYnkganVsaWFuIG9uIDIvMjMvMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgVXRpbHMgPSByZXF1aXJlKCd5dXRpbHMnKTtcblxudmFyIGxhc3RJZCA9IDA7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBjYW52YXNcbiAqIEBwYXJhbSB3IG9mIHRoZSBzdWIgaW1hZ2VcbiAqIEBwYXJhbSBoIG9mIHRoZSBzdWIgaW1hZ2VcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBTcHJpdGUoY2FudmFzLCB3LCBoKSB7XG4gICAgVXRpbHMuYXNzZXJ0TGVuZ3RoKGFyZ3VtZW50cywgMyk7XG4gICAgdGhpcy5pZCA9IGxhc3RJZCsrO1xuICAgIHRoaXMuaW1nID0gY2FudmFzO1xuICAgIHRoaXMudyA9IHcgfCAwO1xuICAgIHRoaXMuaCA9IGggfCAwO1xuICAgIHRoaXMud18yID0gTWF0aC5mbG9vcih0aGlzLncgLyAyKSB8IDA7XG4gICAgdGhpcy5oXzIgPSBNYXRoLmZsb29yKHRoaXMuaCAvIDIpIHwgMDtcbiAgICB0aGlzLm94ID0gMCB8IDA7XG4gICAgdGhpcy5veSA9IDAgfCAwO1xuICAgIHRoaXMueCA9IDAgfCAwO1xuICAgIHRoaXMueSA9IDAgfCAwO1xuICAgIHRoaXMuYW5nbGVJblJhZGlhbnMgPSAwO1xuICAgIHRoaXMudGxfeCA9IHRoaXMueCAtIHRoaXMud18yOyAvLyBUT1AtTEVGVC1YXG4gICAgdGhpcy50bF95ID0gdGhpcy55IC0gdGhpcy5oXzI7IC8vIFRPUC1MRUZULVlcbiAgICB0aGlzLm1pcnJvcnkgPSBmYWxzZTtcbiAgICB0aGlzLm1pcnJvcnggPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBDZW50ZXJlZCBzcHJpdGUgcG9zaXRpb25cbiAqIEBwYXJhbSB4XG4gKiBAcGFyYW0geVxuICovXG5TcHJpdGUucHJvdG90eXBlLnBvc2l0aW9uQ2VudGVyID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4IHwgMDtcbiAgICB0aGlzLnkgPSB5IHwgMDtcbiAgICB0aGlzLnRsX3ggPSAoeCAtIHRoaXMud18yKSAgfCAwO1xuICAgIHRoaXMudGxfeSA9ICh5IC0gdGhpcy5oXzIpICB8IDA7XG59O1xuXG4vKipcbiAqIFRvcC1MZWZ0IHNwcml0ZSBwb3NpdGlvblxuICogQHBhcmFtIHhcbiAqIEBwYXJhbSB5XG4gKiBAcmV0dXJucyB7U3ByaXRlfVxuICovXG5TcHJpdGUucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB0aGlzLnRsX3ggPSB4IHwgMDtcbiAgICB0aGlzLnRsX3kgPSB5IHwgMDtcbiAgICB0aGlzLnggPSAoeCArIHRoaXMud18yKSB8IDA7XG4gICAgdGhpcy55ID0gKHkgKyB0aGlzLmhfMikgfCAwO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKlxuICogQHBhcmFtIGNvbnRleHRcbiAqL1xuU3ByaXRlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIHZhciBtaXJyb3J4ID0gdGhpcy5taXJyb3J4O1xuICAgIHZhciBtaXJyb3J5ID0gdGhpcy5taXJyb3J5O1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB3ID0gdGhpcy53O1xuICAgIHZhciBoID0gdGhpcy5oO1xuICAgIHZhciB3aCA9IHRoaXMud18yO1xuICAgIHZhciBoaCA9IHRoaXMuaF8yO1xuICAgIGNvbnRleHQudHJhbnNsYXRlKHgseSk7XG4gICAgaWYgKHRoaXMuYW5nbGVJblJhZGlhbnMgIT09IDApIGNvbnRleHQucm90YXRlKHRoaXMuYW5nbGVJblJhZGlhbnMpO1xuICAgIGlmIChtaXJyb3J5ICYmIG1pcnJvcngpIGNvbnRleHQuc2NhbGUoLTEsLTEpO1xuICAgIGVsc2UgaWYgKG1pcnJvcnkpIGNvbnRleHQuc2NhbGUoLTEsMSk7XG4gICAgZWxzZSBpZiAobWlycm9yeCkgY29udGV4dC5zY2FsZSgxLC0xKTtcbiAgICBjb250ZXh0LmRyYXdJbWFnZSh0aGlzLmltZyx0aGlzLm94LHRoaXMub3ksdyxoLC13aCwtaGgsdyxoKTtcbiAgICBpZiAobWlycm9yeSAmJiBtaXJyb3J4KSBjb250ZXh0LnNjYWxlKDEsMSk7XG4gICAgZWxzZSBpZiAobWlycm9yeSkgY29udGV4dC5zY2FsZSgtMSwxKTtcbiAgICBlbHNlIGlmIChtaXJyb3J4KSBjb250ZXh0LnNjYWxlKDEsLTEpO1xuICAgIGlmICh0aGlzLmFuZ2xlSW5SYWRpYW5zICE9PSAwKSBjb250ZXh0LnJvdGF0ZSgtdGhpcy5hbmdsZUluUmFkaWFucyk7XG4gICAgY29udGV4dC50cmFuc2xhdGUoLXgsIC15KTtcbn07XG5cblNwcml0ZS5wcm90b3R5cGUuc3ViaW1hZ2UgPSBmdW5jdGlvbih4LHkpe1xuICAgIHRoaXMub3ggPSB4ICogdGhpcy53O1xuICAgIHRoaXMub3kgPSB5ICogdGhpcy5oO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuU3ByaXRlLnByb3RvdHlwZS5kaXJlY3RJbWFnZSA9IGZ1bmN0aW9uKG94LG95LCB3LGgpe1xuICAgIHRoaXMub3ggPSBveDtcbiAgICB0aGlzLm95ID0gb3k7XG4gICAgdGhpcy53aWR0aCh3KTtcbiAgICB0aGlzLmhlaWdodChoKTtcbn07XG5cblNwcml0ZS5wcm90b3R5cGUudmVydGljYWxNaXJyb3IgPSBmdW5jdGlvbihtaXJyb3Ipe1xuICAgIHRoaXMubWlycm9yeSA9IG1pcnJvcjtcbn07XG5cblNwcml0ZS5wcm90b3R5cGUuaG9yaXpvbnRhbE1pcnJvciA9IGZ1bmN0aW9uKG1pcnJvcil7XG4gICAgdGhpcy5taXJyb3J4ID0gbWlycm9yO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTcHJpdGU7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAzLzIvMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvZzogZnVuY3Rpb24gKHN0ciwgZGF0YSkge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzdHIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coc3RyLCBkYXRhKTtcbiAgICAgICAgfVxuICAgIH1cbn0iLCIvKipcclxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMy8xLzIwMTUuXHJcbiAqL1xyXG5mdW5jdGlvbiBGdXR1cmUob2JqLCBtYXhDb3VudCwgdGltZW91dCkge1xyXG4gICAgdGhpcy5vYmogPSB0eXBlb2Ygb2JqID09PSBcInVuZGVmaW5lZFwiID8ge30gOiBvYmo7XHJcbiAgICB0aGlzLnN1Y2Nlc3NIYW5kbGVyID0gbnVsbDtcclxuICAgIHRoaXMuZmFpbHVyZUhhbmRsZXIgPSBudWxsO1xyXG4gICAgdGhpcy5maW5hbGx5SGFuZGxlciA9IG51bGw7XHJcbiAgICB0aGlzLmZpbmFsbHlDb3VudCA9IDA7XHJcbiAgICB0aGlzLnRpbWVvdXQgPSAwO1xyXG4gICAgaWYgKHR5cGVvZiBtYXhDb3VudCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRpbWVvdXQgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGltZW91dCBtdXN0IGJlIGRlZmluZWQhJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudGltZW91dCA9IHRpbWVvdXQ7XHJcbiAgICAgICAgdGhpcy5tYXhDb3VudCA9IG1heENvdW50O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLm1heENvdW50ID0gMTtcclxuICAgIH1cclxuICAgIHRoaXMudGltZW91dFRocmVhZCA9IG51bGw7XHJcbn07XHJcblxyXG5GdXR1cmUucHJvdG90eXBlLmV4ZWNTdWNjZXNzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICBpZiAodGhpcy5zdWNjZXNzSGFuZGxlciA9PT0gbnVsbCkge1xyXG4gICAgICAgIC8vIGRlbGVnYXRlIGEgc2Vjb25kIHRyeVxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZi5zdWNjZXNzSGFuZGxlciA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwic3VjY2VzcyBvbiBmdW5jdGlvbiB3aXRoIG5vIHN1Y2Nlc3MgaGFuZGxlclwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGV4ZWN1dGUoc2VsZiwgXCJzdWNjZXNzSGFuZGxlclwiLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDEpOyAvLyBORVhUIEVYRUNVVElPTlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBleGVjdXRlKHRoaXMsIFwic3VjY2Vzc0hhbmRsZXJcIiwgYXJndW1lbnRzKTtcclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGV4ZWN1dGUoZnV0dXJlLCBoYW5kbGVyTmFtZSwgYXJncykge1xyXG4gICAgZnV0dXJlLmZpbmFsbHlDb3VudCArPSAxO1xyXG4gICAgZnV0dXJlW2hhbmRsZXJOYW1lXS5hcHBseShmdXR1cmUub2JqLCBhcmdzKTtcclxuICAgIGlmIChmdXR1cmUuZmluYWxseUNvdW50ID09PSBmdXR1cmUubWF4Q291bnQgJiYgZnV0dXJlLmZpbmFsbHlIYW5kbGVyICE9PSBudWxsKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbChmdXR1cmUudGltZW91dFRocmVhZCk7XHJcbiAgICAgICAgZnV0dXJlLmZpbmFsbHlIYW5kbGVyLmNhbGwoZnV0dXJlLm9iaik7XHJcbiAgICAgICAgZnV0dXJlLnN1Y2Nlc3NIYW5kbGVyID0gbnVsbDtcclxuICAgICAgICBmdXR1cmUuZmFpbHVyZUhhbmRsZXIgPSBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5GdXR1cmUucHJvdG90eXBlLmV4ZWNGYWlsdXJlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICBpZiAodGhpcy5mYWlsdXJlSGFuZGxlciA9PSBudWxsKSB7XHJcbiAgICAgICAgLy8gZGVsZWdhdGUgYSBzZWNvbmQgdHJ5XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxmLmZhaWx1cmVIYW5kbGVyID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmhhbmRsZWQgZmFpbHVyZVwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGV4ZWN1dGUodGhpcywgXCJmYWlsdXJlSGFuZGxlclwiLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBleGVjdXRlKHRoaXMsIFwiZmFpbHVyZUhhbmRsZXJcIiwgYXJndW1lbnRzKTtcclxuICAgIH1cclxufTtcclxuXHJcbkZ1dHVyZS5wcm90b3R5cGUuc3VjY2VzcyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgaWYgKHRoaXMuc3VjY2Vzc0hhbmRsZXIgPT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMuc3VjY2Vzc0hhbmRsZXIgPSBjYWxsYmFjaztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTGlzdGVuZXIgaXMgYWxyZWFkeSBzZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5GdXR1cmUucHJvdG90eXBlLmZhaWx1cmUgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgIGlmICh0aGlzLmZhaWx1cmVIYW5kbGVyID09IG51bGwpIHtcclxuICAgICAgICB0aGlzLmZhaWx1cmVIYW5kbGVyID0gY2FsbGJhY2s7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkxpc3RlbmVyIGlzIGFscmVhZHkgc2V0IVwiKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuRnV0dXJlLnByb3RvdHlwZS5maW5hbGx5ID0gZnVuY3Rpb24gKGEsIGIsIGMpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIGlmICh0aGlzLmZpbmFsbHlIYW5kbGVyICE9IG51bGwpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0ZW5lciBpcyBhbHJlYWR5IHNldCFcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKGEpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmluYWxseUhhbmRsZXIgPSBhO1xyXG4gICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0VGhyZWFkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5maW5hbGx5SGFuZGxlci5jYWxsKHNlbGYub2JqKTtcclxuICAgICAgICAgICAgICAgIH0sIHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpc051bWJlcihhKSAmJiBhID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLm1heENvdW50ID0gYTtcclxuICAgICAgICAgICAgaWYgKGlzTnVtYmVyKGIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRUaHJlYWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmZpbmFsbHlIYW5kbGVyLmNhbGwoc2VsZi5vYmopO1xyXG4gICAgICAgICAgICAgICAgfSwgYik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0aW1lb3V0IHBhcmFtZXRlciBpcyBtaXNzaW5nIVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihjKSkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5maW5hbGx5SGFuZGxlciA9IGM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0VGhyZWFkKTtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiFcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmaXJzdCBwYXJhbSBtdXN0IGJlIG51bWJlciBvciBmdW5jdGlvbiFcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gaXNOdW1iZXIobikge1xyXG4gICAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNGdW5jdGlvbihmdW5jdGlvblRvQ2hlY2spIHtcclxuICAgIHZhciBnZXRUeXBlID0ge307XHJcbiAgICByZXR1cm4gZnVuY3Rpb25Ub0NoZWNrICYmIGdldFR5cGUudG9TdHJpbmcuY2FsbChmdW5jdGlvblRvQ2hlY2spID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiAob2JqLCBpLCB0KSB7XHJcbiAgICByZXR1cm4gbmV3IEZ1dHVyZShvYmosIGksIHQpO1xyXG59OyIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMTIvMTAvMjAxNC5cbiAqL1xuKGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cbiAgICAvLyBwZXJmb3JtYW5jZS5ub3cgcG9seWZpbGxcbiAgICB2YXIgcGVyZiA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcGVyZiA9IHt9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHBlcmYgPSBwZXJmb3JtYW5jZTtcbiAgICB9XG5cbiAgICBwZXJmLm5vdyA9IHBlcmYubm93IHx8IHBlcmYubW96Tm93IHx8IHBlcmYubXNOb3cgfHwgcGVyZi5vTm93IHx8IHBlcmYud2Via2l0Tm93IHx8IERhdGUubm93IHx8XG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgfTtcblxuICAgIGZ1bmN0aW9uIHN3YXAoYXJyYXksIGksIGopIHtcbiAgICAgICAgaWYgKGkgIT09IGopIHtcbiAgICAgICAgICAgIHZhciB0ZW1wID0gYXJyYXlbaV07XG4gICAgICAgICAgICBhcnJheVtpXSA9IGFycmF5W2pdO1xuICAgICAgICAgICAgYXJyYXlbal0gPSB0ZW1wO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLypcbiAgICAgfn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5cbiAgICAgKi9cblxuICAgIHZhciBnZXRSYW5kb21JbnQgPSBleHBvcnRzLmdldFJhbmRvbUludCA9IGZ1bmN0aW9uIChtaW4sIG1heCkge1xuICAgICAgICBpZiAobWluID4gbWF4KSB0aHJvdyBuZXcgRXJyb3IoXCJtaW4gbXVzdCBiZSBzbWFsbGVyIHRoYW4gbWF4ISB7XCIgKyBtaW4gKyBcIj5cIiArIG1heCArIFwifVwiKTtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XG4gICAgfTtcblxuICAgIGV4cG9ydHMuc2FtcGxlID0gZnVuY3Rpb24gKGxpc3QsIG4pIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCBqLCBpID0gMCwgTCA9IG4gPiBsaXN0Lmxlbmd0aCA/IGxpc3QubGVuZ3RoIDogbiwgcyA9IGxpc3QubGVuZ3RoIC0gMTtcbiAgICAgICAgZm9yICg7IGkgPCBMOyBpKyspIHtcbiAgICAgICAgICAgIGogPSBnZXRSYW5kb21JbnQoaSwgcyk7XG4gICAgICAgICAgICBzd2FwKGxpc3QsIGksIGopO1xuICAgICAgICAgICAgcmVzdWx0LnB1c2gobGlzdFtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgdmFyIGlzU3RyaW5nID0gZXhwb3J0cy5pc1N0cmluZyA9IGZ1bmN0aW9uIChteVZhcikge1xuICAgICAgICByZXR1cm4gKHR5cGVvZiBteVZhciA9PT0gJ3N0cmluZycgfHwgbXlWYXIgaW5zdGFuY2VvZiBTdHJpbmcpXG4gICAgfTtcblxuICAgIGV4cG9ydHMuYXNzZXJ0TGVuZ3RoID0gZnVuY3Rpb24gKGFyZywgbmJyKSB7XG4gICAgICAgIGlmIChhcmcubGVuZ3RoID09PSBuYnIpIHJldHVybiB0cnVlO1xuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcIldyb25nIG51bWJlciBvZiBhcmd1bWVudHM6IGV4cGVjdGVkOlwiICsgbmJyICsgXCIsIGJ1dCBnb3Q6IFwiICsgYXJnLmxlbmd0aCk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ3VpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGQgPSBwZXJmLm5vdygpO1xuICAgICAgICB2YXIgZ3VpZCA9ICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgIHZhciByID0gKGQgKyBNYXRoLnJhbmRvbSgpICogMTYpICUgMTYgfCAwO1xuICAgICAgICAgICAgZCA9IE1hdGguZmxvb3IoZCAvIDE2KTtcbiAgICAgICAgICAgIHJldHVybiAoYyA9PT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KSkudG9TdHJpbmcoMTYpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGd1aWQ7XG4gICAgfTtcblxuICAgIGV4cG9ydHMudGltZURpZmZlcmVuY2VJbk1zID0gZnVuY3Rpb24gKHRzQSwgdHNCKSB7XG4gICAgICAgIGlmICh0c0EgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgICB0c0EgPSB0c0EuZ2V0VGltZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0c0IgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgICB0c0IgPSB0c0IuZ2V0VGltZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLmFicyh0c0EgLSB0c0IpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBtaWxsaXNlY29uZHMgdG8gc2Vjb25kc1xuICAgICAqIEBwYXJhbSBtcyB7TnVtYmVyfSBNaWxsaXNcbiAgICAgKi9cbiAgICBleHBvcnRzLm1zVG9TID0gZnVuY3Rpb24gKG1zKSB7XG4gICAgICAgIHJldHVybiBtcyAvIDEwMDA7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuaXNEZWZpbmVkID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgaWYgKG8gPT09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKHR5cGVvZiBvID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaGFsbG93IGNsb25lXG4gICAgICogQHBhcmFtIGxpc3RcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl8c3RyaW5nfEJsb2J9XG4gICAgICovXG4gICAgZXhwb3J0cy5jbG9uZUFycmF5ID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIGxpc3Quc2xpY2UoMCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIHJlbW92ZXMgdGhlIGl0ZW0gYXQgdGhlIHBvc2l0aW9uIGFuZCByZWluZGV4ZXMgdGhlIGxpc3RcbiAgICAgKiBAcGFyYW0gbGlzdFxuICAgICAqIEBwYXJhbSBpXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgZXhwb3J0cy5kZWxldGVQb3NpdGlvbiA9IGZ1bmN0aW9uIChsaXN0LCBpKSB7XG4gICAgICAgIGlmIChpIDwgMCB8fCBpID49IGxpc3QubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoXCJPdXQgb2YgYm91bmRzXCIpO1xuICAgICAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENoZWNrcyB3ZWF0aGVyIHRoZSB0aGUgb2JqZWN0IGltcGxlbWVudHMgdGhlIGZ1bGwgaW50ZXJmYWNlIG9yIG5vdFxuICAgICAqIEBwYXJhbSBvIHtPYmplY3R9XG4gICAgICovXG4gICAgdmFyIGltcGxlbWVudHMgPSBleHBvcnRzLmltcGxlbWVudHMgPSBmdW5jdGlvbiAobywgYSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICAgICAgcmV0dXJuIGltcGxlbWVudHMuYXBwbHkoe30sIFtvXS5jb25jYXQoYSkpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpID0gMSwgbWV0aG9kTmFtZTtcbiAgICAgICAgd2hpbGUgKChtZXRob2ROYW1lID0gYXJndW1lbnRzW2krK10pKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9bbWV0aG9kTmFtZV0gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdmFyIGlzTnVtYmVyID0gZXhwb3J0cy5pc051bWJlciA9IGZ1bmN0aW9uIChvKSB7XG4gICAgICAgIGlmIChpc1N0cmluZyhvKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gIWlzTmFOKG8gLSAwKSAmJiBvICE9PSBudWxsICYmIHR5cGVvZiBvICE9PSAndW5kZWZpbmVkJyAmJiBvICE9PSBmYWxzZTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gbm90KGwpIHtcbiAgICAgICAgcmV0dXJuICFsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgb2JqZWN0IGVxdWFscyB0aGUgZGVmaW5pdGlvblxuICAgICAqIEBwYXJhbSBvYmoge09iamVjdH1cbiAgICAgKiBAcGFyYW0gZGVmaW5pdGlvbiB7T2JqZWN0fSB7XG4gICAgICogICAgICAna2V5MSc6IFN0cmluZyxcbiAgICAgKiAgICAgICdrZXkyJzogQW55Q2xhc3MsXG4gICAgICogICAgICAna2V5Myc6IE51bWJlclxuICAgICAqXG4gICAgICogfVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIHZhciBkZWZpbmVzID0gZXhwb3J0cy5kZWZpbmVzID0gZnVuY3Rpb24gKG9iaiwgZGVmaW5pdGlvbikge1xuICAgICAgICB2YXIga2V5ID0gbnVsbCwgdHlwZSwgaSA9IDAsIEw7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgICAgIEwgPSBvYmoubGVuZ3RoO1xuICAgICAgICAgICAgZm9yICg7aTxMO2krKykge1xuICAgICAgICAgICAgICAgIGlmICghZGVmaW5lcyhvYmpbaV0sIGRlZmluaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBkZWZpbml0aW9uKSB7XG4gICAgICAgICAgICAgICAgdHlwZSA9IGRlZmluaXRpb25ba2V5XTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm90KGlzU3RyaW5nKG9ialtrZXldKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdvYmplY3RAJyArIGtleSArICcgZG9lcyBub3QgaW1wbGVtZW50ICcgKyB0eXBlICsgJzonLCBvYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIE51bWJlcjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub3QoaXNOdW1iZXIob2JqW2tleV0pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ29iamVjdEAnICsga2V5ICsgJyBkb2VzIG5vdCBpbXBsZW1lbnQgJyArIHR5cGUgKyAnOicsIG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub3Qob2JqW2tleV0gaW5zdGFuY2VvZiB0eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ29iamVjdEAnICsga2V5ICsgJyBkb2VzIG5vdCBpbXBsZW1lbnQgJyArIHR5cGUgKyAnOicsIG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbmhlcml0IHN0dWZmIGZyb20gcGFyZW50XG4gICAgICogQHBhcmFtIGNoaWxkXG4gICAgICogQHBhcmFtIHBhcmVudFxuICAgICAqL1xuICAgIGV4cG9ydHMuaW5oZXJpdCA9IGZ1bmN0aW9uIChjaGlsZCwgcGFyZW50KSB7XG4gICAgICAgIGNoaWxkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUocGFyZW50LnByb3RvdHlwZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGNhbGxiYWNrc1xuICAgICAqL1xuICAgIGV4cG9ydHMuZXhlY3V0ZUNhbGxiYWNrcyA9IGZ1bmN0aW9uIChjYWxsYmFja3MpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBudWxsO1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEsIGFyZ3VtZW50cy5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpID0gMCwgTCA9IGNhbGxiYWNrcy5sZW5ndGg7XG4gICAgICAgIGlmIChhcmdzID09IG51bGwpIHtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgTDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzW2ldKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IEw7IGkrKykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cblxufSkodHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gdGhpc1sneVV0aWxzJ10gPSB7fSA6IGV4cG9ydHMpOyJdfQ==
