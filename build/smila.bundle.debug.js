!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Smila=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./Sprite.js":6,"./Utils.js":7,"future-callbacks":8,"yutils":9}],2:[function(require,module,exports){
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

    this.mousePosition = {
        x: 0,
        y: 0
    };
    this.dimension = {
        w: parent.clientWidth,
        h: parent.clientHeight
    };

    this.state = null;
    if (verbose && typeof State !== 'undefined') {
        this.stats = new State();
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
    function update() {

        if (renderer.currentScene !== null) {
            renderer.currentScene.render(ctx);
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
},{"./Scene.js":3,"yutils":9}],3:[function(require,module,exports){
/**
 * Created by Julian on 2/24/2015.
 */
"use strict";

var Utils = require('yutils');

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
    this.renderItems = [];
    if ("map" in options) {
        // LOAD FROM MAP

        // deduct map type


    } else {
        // DEFAULT
        setTimeout(function () {
            applyReady(self);
        }, 1);
    }
}

Scene.prototype.render = function (context) {

    //TODO APPLY CAMERA
    var i = 0, L = this.renderItems.length;
    var renderItems = this.renderItems;

    for (;i < L; i++) {
        renderItems[i].render(context);
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
},{"yutils":9}],4:[function(require,module,exports){
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
},{"./Scene.js":3,"yutils":9}],5:[function(require,module,exports){
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
},{"./DataStore.js":1,"./Renderer.js":2,"./SceneLoader.js":4}],6:[function(require,module,exports){
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
},{"yutils":9}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
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
},{}]},{},[5])(5)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImxpYi9EYXRhU3RvcmUuanMiLCJsaWIvUmVuZGVyZXIuanMiLCJsaWIvU2NlbmUuanMiLCJsaWIvU2NlbmVMb2FkZXIuanMiLCJsaWIvU21pbGEuanMiLCJsaWIvU3ByaXRlLmpzIiwibGliL1V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2Z1dHVyZS1jYWxsYmFja3MvbGliL2Z1dHVyZS5qcyIsIm5vZGVfbW9kdWxlcy95dXRpbHMveXV0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgRnV0dXJlID0gcmVxdWlyZSgnZnV0dXJlLWNhbGxiYWNrcycpO1xudmFyIFV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xudmFyIFlVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xudmFyIFNwcml0ZSA9IHJlcXVpcmUoJy4vU3ByaXRlLmpzJyk7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBQIFIgSSBWIEEgVCBFXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG52YXIgc3ByaXRlQ2FjaGUgPSB7fTtcblxudmFyIFNQUklURV9MT0FEX1RJTUVPVVQgPSAyMDAwOyAvLyBtc1xuXG4vKipcbiAqXG4gKiBAcGFyYW0gc3ByaXRlRGF0YVxuICogQHBhcmFtIGZ1dHVyZVxuICovXG5mdW5jdGlvbiBsb2FkU3ByaXRlKHNwcml0ZURhdGEsIGZ1dHVyZSkge1xuICAgIFV0aWxzLmxvZyhcImxvYWRpbmcgc3ByaXRlIFwiICsgc3ByaXRlRGF0YS5rZXkpO1xuICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGlmIChzcHJpdGVEYXRhLmtleSBpbiBzcHJpdGVDYWNoZSkge1xuICAgICAgICBVdGlscy5sb2coXCJsb2FkIHNwcml0ZSBcIiArIHNwcml0ZURhdGEua2V5ICsgXCIgZnJvbSBDYWNoZVwiKTtcbiAgICAgICAgZnV0dXJlLmV4ZWNTdWNjZXNzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFV0aWxzLmxvZyhcInNwcml0ZSBcIiArIHNwcml0ZURhdGEua2V5ICsgXCJsb2FkZWRcIik7XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWcud2lkdGg7XG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodDtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWcsIDAsIDApO1xuICAgICAgICAgICAgc3ByaXRlQ2FjaGVbc3ByaXRlRGF0YS5rZXldID0gY2FudmFzO1xuICAgICAgICAgICAgZnV0dXJlLmV4ZWNTdWNjZXNzKCk7XG4gICAgICAgIH07XG4gICAgICAgIGltZy5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgVXRpbHMubG9nKFwiY291bGQgbm90IGxvYWQgaW1nIFwiICsgc3ByaXRlRGF0YS5rZXksIGVycik7XG4gICAgICAgICAgICBmdXR1cmUuZXhlY0ZhaWx1cmUoZXJyKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZW9mIHNwcml0ZURhdGEuYmFzZTY0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgVXRpbHMubG9nKFwibG9hZCBzcHJpdGUgXCIgKyBzcHJpdGVEYXRhLmtleSArIFwiIGZyb20gYmFzZTY0XCIpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNwcml0ZURhdGEuYmFzZTY0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgVXRpbHMubG9nKFwibG9hZCBzcHJpdGUgXCIgKyBzcHJpdGVEYXRhLmtleSArIFwiIGZyb20gVVJMOiBcIiArIHNwcml0ZURhdGEudXJsKTtcbiAgICAgICAgICAgIGltZy5zcmMgPSBzcHJpdGVEYXRhLnNyYztcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFAgVSBCIEwgSSBDXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBzcHJpdGVEYXRhIHtPYmplY3R9IHtcbiAgICAgKlxuICAgICAqICAgICAga2V5OiBuYW1lLFxuICAgICAqXG4gICAgICogICAgICA8IGJhc2U2NDoge1N0cmluZ30gfHwgc3JjOiB7U3RyaW5nfSB1cmwgPlxuICAgICAqXG4gICAgICogfVxuICAgICAqIEByZXR1cm5zIHtGdXR1cmV9XG4gICAgICovXG4gICAgcHV0OiBmdW5jdGlvbiAoc3ByaXRlRGF0YSkge1xuICAgICAgICB2YXIgZnV0dXJlO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNwcml0ZURhdGEpKSB7XG4gICAgICAgICAgICBmdXR1cmUgPSBGdXR1cmUuY3JlYXRlKHRoaXMsIHNwcml0ZURhdGEubGVuZ3RoLCBTUFJJVEVfTE9BRF9USU1FT1VUKTtcbiAgICAgICAgICAgIHNwcml0ZURhdGEuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGxvYWRTcHJpdGUoZWxlbWVudCwgZnV0dXJlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnV0dXJlID0gRnV0dXJlLmNyZWF0ZSgpO1xuICAgICAgICAgICAgbG9hZFNwcml0ZShzcHJpdGVEYXRhLCBmdXR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1dHVyZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZVxuICAgICAqIEBwYXJhbSB3XG4gICAgICogQHBhcmFtIGhcbiAgICAgKiBAcmV0dXJucyB7U3ByaXRlfVxuICAgICAqL1xuICAgIGdldFNwcml0ZTogZnVuY3Rpb24gKG5hbWUsIHcsIGgpIHtcbiAgICAgICAgWVV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDMpO1xuICAgICAgICBpZiAobmFtZSBpbiBzcHJpdGVDYWNoZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTcHJpdGUoc3ByaXRlQ2FjaGVbbmFtZV0sIHcsIGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5kZW50aWZpZXIge1wiICsgbmFtZSArIFwifSBpcyBub3QgcHJlc2VudCBpbiBEYXRhU3RvcmVcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbn07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xuLy92YXIgRnV0dXJlID0gcmVxdWlyZSgnZnV0dXJlLWNhbGxiYWNrcycpO1xuXG52YXIgU2NlbmUgPSByZXF1aXJlKCcuL1NjZW5lLmpzJyk7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBkb21JZCB7U3RyaW5nfVxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBSZW5kZXJlcihkb21JZCwgb3B0aW9ucykge1xuICAgIGlmICghVXRpbHMuaXNTdHJpbmcoZG9tSWQpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRvbUlEIG11c3QgYmUgYSBTdHJpbmdcIik7XG4gICAgfVxuICAgIGlmICghVXRpbHMuaXNEZWZpbmVkKG9wdGlvbnMpKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICB2YXIgdmVyYm9zZSA9IChcInZlcmJvc2VcIiBpbiBvcHRpb25zKSA/IG9wdGlvbnMudmVyYm9zZSA6IGZhbHNlO1xuXG4gICAgdmFyIHBhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRvbUlkKTtcbiAgICB2YXIgcG9zaXRpb24gPSBwYXJlbnQuc3R5bGUucG9zaXRpb247XG4gICAgaWYgKHBvc2l0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBwYXJlbnQuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XG4gICAgfVxuXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBwYXJlbnQuY2xpZW50SGVpZ2h0O1xuICAgIGNhbnZhcy53aWR0aCA9IHBhcmVudC5jbGllbnRXaWR0aDtcblxuICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgIH07XG4gICAgdGhpcy5kaW1lbnNpb24gPSB7XG4gICAgICAgIHc6IHBhcmVudC5jbGllbnRXaWR0aCxcbiAgICAgICAgaDogcGFyZW50LmNsaWVudEhlaWdodFxuICAgIH07XG5cbiAgICB0aGlzLnN0YXRlID0gbnVsbDtcbiAgICBpZiAodmVyYm9zZSAmJiB0eXBlb2YgU3RhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuc3RhdHMgPSBuZXcgU3RhdGUoKTtcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAnMHB4JztcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnRvcCA9ICcwcHgnO1xuICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodGhpcy5zdGF0cy5kb21FbGVtZW50KTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICB0aGlzLmN1cnJlbnRTY2VuZSA9IG51bGw7XG5cbiAgICBzdGFydCh0aGlzKTtcbn1cblxuLyoqXG4gKiBzdGFydC4uXG4gKiBAcGFyYW0gcmVuZGVyZXJcbiAqL1xuZnVuY3Rpb24gc3RhcnQocmVuZGVyZXIpIHtcbiAgICB2YXIgY3R4ID0gcmVuZGVyZXIuY29udGV4dDtcbiAgICBmdW5jdGlvbiB1cGRhdGUoKSB7XG5cbiAgICAgICAgaWYgKHJlbmRlcmVyLmN1cnJlbnRTY2VuZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmVuZGVyZXIuY3VycmVudFNjZW5lLnJlbmRlcihjdHgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHVwZGF0ZSk7XG4gICAgfVxuXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHVwZGF0ZSk7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBuYW1lXG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQHJldHVybnMge1NjZW5lfCp9XG4gKi9cblJlbmRlcmVyLnByb3RvdHlwZS5wdXRTY2VuZSA9IGZ1bmN0aW9uIChzY2VuZSkge1xuICAgIFV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDEpO1xuICAgIGlmICh0aGlzLmN1cnJlbnRTY2VuZSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50U2NlbmUubmFtZSA9PT0gc2NlbmUubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBub3QgcHV0IHRoZSBzYW1lIFNjZW5lIHR3aWNlIVwiKTtcbiAgICAgICAgfVxuICAgICAgICBVdGlscy5leGVjdXRlQ2FsbGJhY2tzKHRoaXMuY3VycmVudFNjZW5lLm9ucmVuZGVyZXJkZXRhY2hlZENicywgdGhpcyk7XG4gICAgfVxuICAgIHRoaXMuY3VycmVudFNjZW5lID0gc2NlbmU7XG4gICAgVXRpbHMuZXhlY3V0ZUNhbGxiYWNrcyhzY2VuZS5vbnJlbmRlcmVyYXR0YWNoZWRDYnMsIHRoaXMpO1xuXG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgVXRpbHMuYXNzZXJ0TGVuZ3RoKGFyZ3VtZW50cywgMCk7XG4gICAgaWYgKHRoaXMuY3VycmVudFNjZW5lICE9PSBudWxsKSB7XG4gICAgICAgIFV0aWxzLmV4ZWN1dGVDYWxsYmFja3ModGhpcy5jdXJyZW50U2NlbmUub25yZW5kZXJlcmRldGFjaGVkQ2JzLCB0aGlzKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyO1xuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PVxuXG4oZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhc3RUaW1lID0gMDtcbiAgICB2YXIgdmVuZG9ycyA9IFsnbXMnLCAnbW96JywgJ3dlYmtpdCcsICdvJ107XG4gICAgZm9yKHZhciB4ID0gMDsgeCA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK3gpIHtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0rJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cbiAgICAgICAgICAgIHx8IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICB9XG5cbiAgICBpZiAoIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpXG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaywgZWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB2YXIgdGltZVRvQ2FsbCA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKTtcbiAgICAgICAgICAgIHZhciBpZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpOyB9LFxuICAgICAgICAgICAgICAgIHRpbWVUb0NhbGwpO1xuICAgICAgICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XG4gICAgICAgICAgICByZXR1cm4gaWQ7XG4gICAgICAgIH07XG5cbiAgICBpZiAoIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSlcbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgICAgIH07XG59KCkpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMi8yNC8yMDE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFV0aWxzID0gcmVxdWlyZSgneXV0aWxzJyk7XG5cbi8qKlxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEBwYXJhbSBjYWxsYmFjayB7ZnVuY3Rpb259XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gU2NlbmUobmFtZSwgb3B0aW9ucykge1xuICAgIFV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDIpO1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMucmVhZHlDYWxsYmFja3MgPSBbXTtcbiAgICB0aGlzLm9ucmVuZGVyZXJhdHRhY2hlZENicyA9IFtdO1xuICAgIHRoaXMub25yZW5kZXJlcmRldGFjaGVkQ2JzID0gW107XG4gICAgdGhpcy5pc1JlYWR5ID0gZmFsc2U7XG4gICAgdGhpcy5yZW5kZXJJdGVtcyA9IFtdO1xuICAgIGlmIChcIm1hcFwiIGluIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gTE9BRCBGUk9NIE1BUFxuXG4gICAgICAgIC8vIGRlZHVjdCBtYXAgdHlwZVxuXG5cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBERUZBVUxUXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYXBwbHlSZWFkeShzZWxmKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxufVxuXG5TY2VuZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcblxuICAgIC8vVE9ETyBBUFBMWSBDQU1FUkFcbiAgICB2YXIgaSA9IDAsIEwgPSB0aGlzLnJlbmRlckl0ZW1zLmxlbmd0aDtcbiAgICB2YXIgcmVuZGVySXRlbXMgPSB0aGlzLnJlbmRlckl0ZW1zO1xuXG4gICAgZm9yICg7aSA8IEw7IGkrKykge1xuICAgICAgICByZW5kZXJJdGVtc1tpXS5yZW5kZXIoY29udGV4dCk7XG4gICAgfVxufTtcblxuU2NlbmUucHJvdG90eXBlLmFkZFJlbmRlckl0ZW0gPSBmdW5jdGlvbiAocmVuZGVySXRlbSkge1xuICAgIGlmICghVXRpbHMuaW1wbGVtZW50cyhyZW5kZXJJdGVtLCBcInJlbmRlclwiKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJnYXZlIG5vbi1SZW5kZXJJdGVtIHRvIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgICB2YXIgcG9zID0gZmluZFJlbmRlckl0ZW1Qb3NpdGlvbih0aGlzLCByZW5kZXJJdGVtKTtcbiAgICBpZiAocG9zICE9PSAtMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgYWRkIHRoZSBzYW1lIHNwcml0ZSBtdWx0aXBsZSB0aW1lc1wiKTtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXJJdGVtcy5wdXNoKHJlbmRlckl0ZW0pO1xufTtcblxuU2NlbmUucHJvdG90eXBlLnJlbW92ZVJlbmRlckl0ZW0gPSBmdW5jdGlvbiAocmVuZGVySXRlbSkge1xuICAgIGlmICghVXRpbHMuaW1wbGVtZW50cyhyZW5kZXJJdGVtLCBcInJlbmRlclwiKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJnYXZlIG5vbi1SZW5kZXJJdGVtIHRvIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgICB2YXIgcG9zID0gZmluZFJlbmRlckl0ZW1Qb3NpdGlvbih0aGlzLCByZW5kZXJJdGVtKTtcbiAgICBpZiAocG9zID4gLTEpIHtcbiAgICAgICAgVXRpbHMuZGVsZXRlUG9zaXRpb24odGhpcy5yZW5kZXJJdGVtcywgcG9zKTtcbiAgICB9XG59O1xuXG5TY2VuZS5wcm90b3R5cGUub25yZWFkeSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIGlmICh0aGlzLmlzUmVhZHkpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9LCAxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlYWR5Q2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn07XG5cblNjZW5lLnByb3RvdHlwZS5vbnJlbmRlcmVyYXR0YWNoZWQgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAvLyB0aGlzIGNhbGxiYWNrcyBhcmUgY2FsbGVkIGZyb20gdGhlIFJlbmRlcmVyXG4gICAgdGhpcy5vbnJlbmRlcmVyYXR0YWNoZWRDYnMucHVzaChjYWxsYmFjayk7XG59O1xuXG5TY2VuZS5wcm90b3R5cGUub25yZW5kZXJlcmRldGFjaGVkID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgLy8gdGhpcyBjYWxsYmFja3MgYXJlIGNhbGxlZCBmcm9tIHRoZSBSZW5kZXJlclxuICAgIHRoaXMub25yZW5kZXJlcmRldGFjaGVkQ2JzLnB1c2goY2FsbGJhY2spO1xufTtcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gUCBSIEkgViBBIFQgRVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vKipcbiAqIEZpbmRzIHRoZSBwb3NpdGlvbiBvZiB0aGUgcmVuZGVySXRlbSwgaWYgbm90IC0+IC0xXG4gKiBAcGFyYW0gc2NlbmVcbiAqIEBwYXJhbSByZW5kZXJJdGVtXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBmaW5kUmVuZGVySXRlbVBvc2l0aW9uKHNjZW5lLCByZW5kZXJJdGVtKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY2VuZS5yZW5kZXJJdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoc2NlbmUucmVuZGVySXRlbXNbaV0uaWQgPT09IHJlbmRlckl0ZW0uaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gYXBwbHlSZWFkeShzY2VuZSkge1xuICAgIGlmIChzY2VuZS5pc1JlYWR5KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkEgU2NlbmUgY2FuIG9ubHkgYmUgcmVhZHkgT05DRSFcIik7XG4gICAgfVxuICAgIHNjZW5lLmlzUmVhZHkgPSB0cnVlO1xuICAgIFV0aWxzLmV4ZWN1dGVDYWxsYmFja3Moc2NlbmUucmVhZHlDYWxsYmFja3MpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gU2NlbmU7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgU2NlbmUgPSByZXF1aXJlKCcuL1NjZW5lLmpzJyk7XG52YXIgVXRpbHMgPSByZXF1aXJlKCd5dXRpbHMnKTtcblxudmFyIGNhY2hlID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIG5hbWUge1N0cmluZ30gdW5pcXVlIGlkZW50aWZpZXJcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyB7T2JqZWN0fVxuICAgICAqIEByZXR1cm5zIHtTY2VuZX1cbiAgICAgKi9cbiAgICBjcmVhdGU6IGZ1bmN0aW9uIChuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIFV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDIpO1xuICAgICAgICBpZiAoIVV0aWxzLmlzU3RyaW5nKG5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmaXJzdCBwYXJhbWV0ZXIgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2NlbmUgPSBuZXcgU2NlbmUobmFtZSwgb3B0aW9ucyk7XG4gICAgICAgIGNhY2hlW25hbWVdID0gc2NlbmU7XG4gICAgICAgIHJldHVybiBzY2VuZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZVxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGdldDogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgVXRpbHMuYXNzZXJ0TGVuZ3RoKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGlmICghVXRpbHMuaXNTdHJpbmcobmFtZSkpIHRocm93IG5ldyBFcnJvcihcIlRoZSBpZGVudGlmaWVyIGZvciBhIFNjZW5lIG11c3QgYmUgYSBTdHJpbmdcIik7XG4gICAgICAgIGlmIChuYW1lIGluIGNhY2hlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVbbmFtZV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgZmluZCBpZGVudGlmaWVyIGZvciBTY2VuZVwiKTtcbiAgICAgICAgfVxuICAgIH1cblxufTsiLCIvKipcbiAqIENyZWF0ZWQgYnkganVsaWFuIG9uIDIvMjIvMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgU2NlbmVMb2FkZXIgPSByZXF1aXJlKCcuL1NjZW5lTG9hZGVyLmpzJyk7XG52YXIgUmVuZGVyZXIgPSByZXF1aXJlKCcuL1JlbmRlcmVyLmpzJyk7XG52YXIgRGF0YVN0b3JlID0gcmVxdWlyZSgnLi9EYXRhU3RvcmUuanMnKTtcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gUyBNIEkgTCBBXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBkZWJ1ZzogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBjb25zb2xlLmxvZyhzdHIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtTY2VuZUxvYWRlcn1cbiAgICAgKi9cbiAgICBzY2VuZUxvYWRlciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFNjZW5lTG9hZGVyO1xuICAgIH0sXG5cbiAgICBkYXRhU3RvcmUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBEYXRhU3RvcmU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGRvbUlkXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7UmVuZGVyZXJ9XG4gICAgICovXG4gICAgcmVuZGVyZXIgOiBmdW5jdGlvbiAoZG9tSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJlcihkb21JZCwgb3B0aW9ucyk7XG4gICAgfVxuXG59IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGp1bGlhbiBvbiAyLzIzLzE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFV0aWxzID0gcmVxdWlyZSgneXV0aWxzJyk7XG5cbnZhciBsYXN0SWQgPSAwO1xuXG4vKipcbiAqXG4gKiBAcGFyYW0gY2FudmFzXG4gKiBAcGFyYW0gdyBvZiB0aGUgc3ViIGltYWdlXG4gKiBAcGFyYW0gaCBvZiB0aGUgc3ViIGltYWdlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gU3ByaXRlKGNhbnZhcywgdywgaCkge1xuICAgIFV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDMpO1xuICAgIHRoaXMuaWQgPSBsYXN0SWQrKztcbiAgICB0aGlzLmltZyA9IGNhbnZhcztcbiAgICB0aGlzLncgPSB3IHwgMDtcbiAgICB0aGlzLmggPSBoIHwgMDtcbiAgICB0aGlzLndfMiA9IE1hdGguZmxvb3IodGhpcy53IC8gMikgfCAwO1xuICAgIHRoaXMuaF8yID0gTWF0aC5mbG9vcih0aGlzLmggLyAyKSB8IDA7XG4gICAgdGhpcy5veCA9IDAgfCAwO1xuICAgIHRoaXMub3kgPSAwIHwgMDtcbiAgICB0aGlzLnggPSAwIHwgMDtcbiAgICB0aGlzLnkgPSAwIHwgMDtcbiAgICB0aGlzLmFuZ2xlSW5SYWRpYW5zID0gMDtcbiAgICB0aGlzLnRsX3ggPSB0aGlzLnggLSB0aGlzLndfMjsgLy8gVE9QLUxFRlQtWFxuICAgIHRoaXMudGxfeSA9IHRoaXMueSAtIHRoaXMuaF8yOyAvLyBUT1AtTEVGVC1ZXG4gICAgdGhpcy5taXJyb3J5ID0gZmFsc2U7XG4gICAgdGhpcy5taXJyb3J4ID0gZmFsc2U7XG59XG5cbi8qKlxuICogQ2VudGVyZWQgc3ByaXRlIHBvc2l0aW9uXG4gKiBAcGFyYW0geFxuICogQHBhcmFtIHlcbiAqL1xuU3ByaXRlLnByb3RvdHlwZS5wb3NpdGlvbkNlbnRlciA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgdGhpcy54ID0geCB8IDA7XG4gICAgdGhpcy55ID0geSB8IDA7XG4gICAgdGhpcy50bF94ID0gKHggLSB0aGlzLndfMikgIHwgMDtcbiAgICB0aGlzLnRsX3kgPSAoeSAtIHRoaXMuaF8yKSAgfCAwO1xufTtcblxuLyoqXG4gKiBUb3AtTGVmdCBzcHJpdGUgcG9zaXRpb25cbiAqIEBwYXJhbSB4XG4gKiBAcGFyYW0geVxuICogQHJldHVybnMge1Nwcml0ZX1cbiAqL1xuU3ByaXRlLnByb3RvdHlwZS5wb3NpdGlvbiA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgdGhpcy50bF94ID0geCB8IDA7XG4gICAgdGhpcy50bF95ID0geSB8IDA7XG4gICAgdGhpcy54ID0gKHggKyB0aGlzLndfMikgfCAwO1xuICAgIHRoaXMueSA9ICh5ICsgdGhpcy5oXzIpIHwgMDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBjb250ZXh0XG4gKi9cblNwcml0ZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICB2YXIgbWlycm9yeCA9IHRoaXMubWlycm9yeDtcbiAgICB2YXIgbWlycm9yeSA9IHRoaXMubWlycm9yeTtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgdyA9IHRoaXMudztcbiAgICB2YXIgaCA9IHRoaXMuaDtcbiAgICB2YXIgd2ggPSB0aGlzLndfMjtcbiAgICB2YXIgaGggPSB0aGlzLmhfMjtcbiAgICBjb250ZXh0LnRyYW5zbGF0ZSh4LHkpO1xuICAgIGlmICh0aGlzLmFuZ2xlSW5SYWRpYW5zICE9PSAwKSBjb250ZXh0LnJvdGF0ZSh0aGlzLmFuZ2xlSW5SYWRpYW5zKTtcbiAgICBpZiAobWlycm9yeSAmJiBtaXJyb3J4KSBjb250ZXh0LnNjYWxlKC0xLC0xKTtcbiAgICBlbHNlIGlmIChtaXJyb3J5KSBjb250ZXh0LnNjYWxlKC0xLDEpO1xuICAgIGVsc2UgaWYgKG1pcnJvcngpIGNvbnRleHQuc2NhbGUoMSwtMSk7XG4gICAgY29udGV4dC5kcmF3SW1hZ2UodGhpcy5pbWcsdGhpcy5veCx0aGlzLm95LHcsaCwtd2gsLWhoLHcsaCk7XG4gICAgaWYgKG1pcnJvcnkgJiYgbWlycm9yeCkgY29udGV4dC5zY2FsZSgxLDEpO1xuICAgIGVsc2UgaWYgKG1pcnJvcnkpIGNvbnRleHQuc2NhbGUoLTEsMSk7XG4gICAgZWxzZSBpZiAobWlycm9yeCkgY29udGV4dC5zY2FsZSgxLC0xKTtcbiAgICBpZiAodGhpcy5hbmdsZUluUmFkaWFucyAhPT0gMCkgY29udGV4dC5yb3RhdGUoLXRoaXMuYW5nbGVJblJhZGlhbnMpO1xuICAgIGNvbnRleHQudHJhbnNsYXRlKC14LCAteSk7XG59O1xuXG5TcHJpdGUucHJvdG90eXBlLnN1YmltYWdlID0gZnVuY3Rpb24oeCx5KXtcbiAgICB0aGlzLm94ID0geCAqIHRoaXMudztcbiAgICB0aGlzLm95ID0geSAqIHRoaXMuaDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblNwcml0ZS5wcm90b3R5cGUuZGlyZWN0SW1hZ2UgPSBmdW5jdGlvbihveCxveSwgdyxoKXtcbiAgICB0aGlzLm94ID0gb3g7XG4gICAgdGhpcy5veSA9IG95O1xuICAgIHRoaXMud2lkdGgodyk7XG4gICAgdGhpcy5oZWlnaHQoaCk7XG59O1xuXG5TcHJpdGUucHJvdG90eXBlLnZlcnRpY2FsTWlycm9yID0gZnVuY3Rpb24obWlycm9yKXtcbiAgICB0aGlzLm1pcnJvcnkgPSBtaXJyb3I7XG59O1xuXG5TcHJpdGUucHJvdG90eXBlLmhvcml6b250YWxNaXJyb3IgPSBmdW5jdGlvbihtaXJyb3Ipe1xuICAgIHRoaXMubWlycm9yeCA9IG1pcnJvcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3ByaXRlOyIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMy8yLzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2c6IGZ1bmN0aW9uIChzdHIsIGRhdGEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coc3RyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0ciwgZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG59IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDMvMS8yMDE1LlxyXG4gKi9cclxuZnVuY3Rpb24gRnV0dXJlKG9iaiwgbWF4Q291bnQsIHRpbWVvdXQpIHtcclxuICAgIHRoaXMub2JqID0gdHlwZW9mIG9iaiA9PT0gXCJ1bmRlZmluZWRcIiA/IHt9IDogb2JqO1xyXG4gICAgdGhpcy5zdWNjZXNzSGFuZGxlciA9IG51bGw7XHJcbiAgICB0aGlzLmZhaWx1cmVIYW5kbGVyID0gbnVsbDtcclxuICAgIHRoaXMuZmluYWxseUhhbmRsZXIgPSBudWxsO1xyXG4gICAgdGhpcy5maW5hbGx5Q291bnQgPSAwO1xyXG4gICAgdGhpcy50aW1lb3V0ID0gMDtcclxuICAgIGlmICh0eXBlb2YgbWF4Q291bnQgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aW1lb3V0ID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RpbWVvdXQgbXVzdCBiZSBkZWZpbmVkIScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRpbWVvdXQgPSB0aW1lb3V0O1xyXG4gICAgICAgIHRoaXMubWF4Q291bnQgPSBtYXhDb3VudDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5tYXhDb3VudCA9IDE7XHJcbiAgICB9XHJcbiAgICB0aGlzLnRpbWVvdXRUaHJlYWQgPSBudWxsO1xyXG59O1xyXG5cclxuRnV0dXJlLnByb3RvdHlwZS5leGVjU3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgaWYgKHRoaXMuc3VjY2Vzc0hhbmRsZXIgPT09IG51bGwpIHtcclxuICAgICAgICAvLyBkZWxlZ2F0ZSBhIHNlY29uZCB0cnlcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGYuc3VjY2Vzc0hhbmRsZXIgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInN1Y2Nlc3Mgb24gZnVuY3Rpb24gd2l0aCBubyBzdWNjZXNzIGhhbmRsZXJcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBleGVjdXRlKHNlbGYsIFwic3VjY2Vzc0hhbmRsZXJcIiwgYXJncyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCAxKTsgLy8gTkVYVCBFWEVDVVRJT05cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZXhlY3V0ZSh0aGlzLCBcInN1Y2Nlc3NIYW5kbGVyXCIsIGFyZ3VtZW50cyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBleGVjdXRlKGZ1dHVyZSwgaGFuZGxlck5hbWUsIGFyZ3MpIHtcclxuICAgIGZ1dHVyZS5maW5hbGx5Q291bnQgKz0gMTtcclxuICAgIGZ1dHVyZVtoYW5kbGVyTmFtZV0uYXBwbHkoZnV0dXJlLm9iaiwgYXJncyk7XHJcbiAgICBpZiAoZnV0dXJlLmZpbmFsbHlDb3VudCA9PT0gZnV0dXJlLm1heENvdW50ICYmIGZ1dHVyZS5maW5hbGx5SGFuZGxlciAhPT0gbnVsbCkge1xyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwoZnV0dXJlLnRpbWVvdXRUaHJlYWQpO1xyXG4gICAgICAgIGZ1dHVyZS5maW5hbGx5SGFuZGxlci5jYWxsKGZ1dHVyZS5vYmopO1xyXG4gICAgICAgIGZ1dHVyZS5zdWNjZXNzSGFuZGxlciA9IG51bGw7XHJcbiAgICAgICAgZnV0dXJlLmZhaWx1cmVIYW5kbGVyID0gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxuRnV0dXJlLnByb3RvdHlwZS5leGVjRmFpbHVyZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgaWYgKHRoaXMuZmFpbHVyZUhhbmRsZXIgPT0gbnVsbCkge1xyXG4gICAgICAgIC8vIGRlbGVnYXRlIGEgc2Vjb25kIHRyeVxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZi5mYWlsdXJlSGFuZGxlciA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5oYW5kbGVkIGZhaWx1cmVcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBleGVjdXRlKHRoaXMsIFwiZmFpbHVyZUhhbmRsZXJcIiwgYXJncyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCAxKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZXhlY3V0ZSh0aGlzLCBcImZhaWx1cmVIYW5kbGVyXCIsIGFyZ3VtZW50cyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5GdXR1cmUucHJvdG90eXBlLnN1Y2Nlc3MgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgIGlmICh0aGlzLnN1Y2Nlc3NIYW5kbGVyID09IG51bGwpIHtcclxuICAgICAgICB0aGlzLnN1Y2Nlc3NIYW5kbGVyID0gY2FsbGJhY2s7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkxpc3RlbmVyIGlzIGFscmVhZHkgc2V0IVwiKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuRnV0dXJlLnByb3RvdHlwZS5mYWlsdXJlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICBpZiAodGhpcy5mYWlsdXJlSGFuZGxlciA9PSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5mYWlsdXJlSGFuZGxlciA9IGNhbGxiYWNrO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0ZW5lciBpcyBhbHJlYWR5IHNldCFcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbkZ1dHVyZS5wcm90b3R5cGUuZmluYWxseSA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBpZiAodGhpcy5maW5hbGx5SGFuZGxlciAhPSBudWxsKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTGlzdGVuZXIgaXMgYWxyZWFkeSBzZXQhXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihhKSkge1xyXG4gICAgICAgICAgICB0aGlzLmZpbmFsbHlIYW5kbGVyID0gYTtcclxuICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dFRocmVhZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZmluYWxseUhhbmRsZXIuY2FsbChzZWxmLm9iaik7XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzLnRpbWVvdXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoaXNOdW1iZXIoYSkgJiYgYSA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5tYXhDb3VudCA9IGE7XHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcihiKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0VGhyZWFkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5maW5hbGx5SGFuZGxlci5jYWxsKHNlbGYub2JqKTtcclxuICAgICAgICAgICAgICAgIH0sIGIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGltZW91dCBwYXJhbWV0ZXIgaXMgbWlzc2luZyFcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24oYykpIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZmluYWxseUhhbmRsZXIgPSBjO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dFRocmVhZCk7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24hXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZmlyc3QgcGFyYW0gbXVzdCBiZSBudW1iZXIgb3IgZnVuY3Rpb24hXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGlzTnVtYmVyKG4pIHtcclxuICAgIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzRnVuY3Rpb24oZnVuY3Rpb25Ub0NoZWNrKSB7XHJcbiAgICB2YXIgZ2V0VHlwZSA9IHt9O1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uVG9DaGVjayAmJiBnZXRUeXBlLnRvU3RyaW5nLmNhbGwoZnVuY3Rpb25Ub0NoZWNrKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gKG9iaiwgaSwgdCkge1xyXG4gICAgcmV0dXJuIG5ldyBGdXR1cmUob2JqLCBpLCB0KTtcclxufTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDEyLzEwLzIwMTQuXG4gKi9cbihmdW5jdGlvbiAoZXhwb3J0cykge1xuXG4gICAgLy8gcGVyZm9ybWFuY2Uubm93IHBvbHlmaWxsXG4gICAgdmFyIHBlcmYgPSBudWxsO1xuICAgIGlmICh0eXBlb2YgcGVyZm9ybWFuY2UgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHBlcmYgPSB7fTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwZXJmID0gcGVyZm9ybWFuY2U7XG4gICAgfVxuXG4gICAgcGVyZi5ub3cgPSBwZXJmLm5vdyB8fCBwZXJmLm1vek5vdyB8fCBwZXJmLm1zTm93IHx8IHBlcmYub05vdyB8fCBwZXJmLndlYmtpdE5vdyB8fCBEYXRlLm5vdyB8fFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIH07XG5cbiAgICBmdW5jdGlvbiBzd2FwKGFycmF5LCBpLCBqKSB7XG4gICAgICAgIGlmIChpICE9PSBqKSB7XG4gICAgICAgICAgICB2YXIgdGVtcCA9IGFycmF5W2ldO1xuICAgICAgICAgICAgYXJyYXlbaV0gPSBhcnJheVtqXTtcbiAgICAgICAgICAgIGFycmF5W2pdID0gdGVtcDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qXG4gICAgIH5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+XG4gICAgICovXG5cbiAgICB2YXIgZ2V0UmFuZG9tSW50ID0gZXhwb3J0cy5nZXRSYW5kb21JbnQgPSBmdW5jdGlvbiAobWluLCBtYXgpIHtcbiAgICAgICAgaWYgKG1pbiA+IG1heCkgdGhyb3cgbmV3IEVycm9yKFwibWluIG11c3QgYmUgc21hbGxlciB0aGFuIG1heCEge1wiICsgbWluICsgXCI+XCIgKyBtYXggKyBcIn1cIik7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xuICAgIH07XG5cbiAgICBleHBvcnRzLnNhbXBsZSA9IGZ1bmN0aW9uIChsaXN0LCBuKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXSwgaiwgaSA9IDAsIEwgPSBuID4gbGlzdC5sZW5ndGggPyBsaXN0Lmxlbmd0aCA6IG4sIHMgPSBsaXN0Lmxlbmd0aCAtIDE7XG4gICAgICAgIGZvciAoOyBpIDwgTDsgaSsrKSB7XG4gICAgICAgICAgICBqID0gZ2V0UmFuZG9tSW50KGksIHMpO1xuICAgICAgICAgICAgc3dhcChsaXN0LCBpLCBqKTtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGxpc3RbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIHZhciBpc1N0cmluZyA9IGV4cG9ydHMuaXNTdHJpbmcgPSBmdW5jdGlvbiAobXlWYXIpIHtcbiAgICAgICAgcmV0dXJuICh0eXBlb2YgbXlWYXIgPT09ICdzdHJpbmcnIHx8IG15VmFyIGluc3RhbmNlb2YgU3RyaW5nKVxuICAgIH07XG5cbiAgICBleHBvcnRzLmFzc2VydExlbmd0aCA9IGZ1bmN0aW9uIChhcmcsIG5icikge1xuICAgICAgICBpZiAoYXJnLmxlbmd0aCA9PT0gbmJyKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJXcm9uZyBudW1iZXIgb2YgYXJndW1lbnRzOiBleHBlY3RlZDpcIiArIG5iciArIFwiLCBidXQgZ290OiBcIiArIGFyZy5sZW5ndGgpO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmd1aWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkID0gcGVyZi5ub3coKTtcbiAgICAgICAgdmFyIGd1aWQgPSAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICB2YXIgciA9IChkICsgTWF0aC5yYW5kb20oKSAqIDE2KSAlIDE2IHwgMDtcbiAgICAgICAgICAgIGQgPSBNYXRoLmZsb29yKGQgLyAxNik7XG4gICAgICAgICAgICByZXR1cm4gKGMgPT09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBndWlkO1xuICAgIH07XG5cbiAgICBleHBvcnRzLnRpbWVEaWZmZXJlbmNlSW5NcyA9IGZ1bmN0aW9uICh0c0EsIHRzQikge1xuICAgICAgICBpZiAodHNBIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICAgICAgdHNBID0gdHNBLmdldFRpbWUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHNCIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICAgICAgdHNCID0gdHNCLmdldFRpbWUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWF0aC5hYnModHNBIC0gdHNCKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogbWlsbGlzZWNvbmRzIHRvIHNlY29uZHNcbiAgICAgKiBAcGFyYW0gbXMge051bWJlcn0gTWlsbGlzXG4gICAgICovXG4gICAgZXhwb3J0cy5tc1RvUyA9IGZ1bmN0aW9uIChtcykge1xuICAgICAgICByZXR1cm4gbXMgLyAxMDAwO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmlzRGVmaW5lZCA9IGZ1bmN0aW9uIChvKSB7XG4gICAgICAgIGlmIChvID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICh0eXBlb2YgbyA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2hhbGxvdyBjbG9uZVxuICAgICAqIEBwYXJhbSBsaXN0XG4gICAgICogQHJldHVybnMge0FycmF5fHN0cmluZ3xCbG9ifVxuICAgICAqL1xuICAgIGV4cG9ydHMuY2xvbmVBcnJheSA9IGZ1bmN0aW9uIChsaXN0KSB7XG4gICAgICAgIHJldHVybiBsaXN0LnNsaWNlKDApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiByZW1vdmVzIHRoZSBpdGVtIGF0IHRoZSBwb3NpdGlvbiBhbmQgcmVpbmRleGVzIHRoZSBsaXN0XG4gICAgICogQHBhcmFtIGxpc3RcbiAgICAgKiBAcGFyYW0gaVxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGV4cG9ydHMuZGVsZXRlUG9zaXRpb24gPSBmdW5jdGlvbiAobGlzdCwgaSkge1xuICAgICAgICBpZiAoaSA8IDAgfHwgaSA+PSBsaXN0Lmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKFwiT3V0IG9mIGJvdW5kc1wiKTtcbiAgICAgICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybiBsaXN0O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3Mgd2VhdGhlciB0aGUgdGhlIG9iamVjdCBpbXBsZW1lbnRzIHRoZSBmdWxsIGludGVyZmFjZSBvciBub3RcbiAgICAgKiBAcGFyYW0gbyB7T2JqZWN0fVxuICAgICAqL1xuICAgIHZhciBpbXBsZW1lbnRzID0gZXhwb3J0cy5pbXBsZW1lbnRzID0gZnVuY3Rpb24gKG8sIGEpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpbXBsZW1lbnRzLmFwcGx5KHt9LCBbb10uY29uY2F0KGEpKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaSA9IDEsIG1ldGhvZE5hbWU7XG4gICAgICAgIHdoaWxlICgobWV0aG9kTmFtZSA9IGFyZ3VtZW50c1tpKytdKSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvW21ldGhvZE5hbWVdICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHZhciBpc051bWJlciA9IGV4cG9ydHMuaXNOdW1iZXIgPSBmdW5jdGlvbiAobykge1xuICAgICAgICBpZiAoaXNTdHJpbmcobykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuICFpc05hTihvIC0gMCkgJiYgbyAhPT0gbnVsbCAmJiB0eXBlb2YgbyAhPT0gJ3VuZGVmaW5lZCcgJiYgbyAhPT0gZmFsc2U7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG5vdChsKSB7XG4gICAgICAgIHJldHVybiAhbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgdGhlIG9iamVjdCBlcXVhbHMgdGhlIGRlZmluaXRpb25cbiAgICAgKiBAcGFyYW0gb2JqIHtPYmplY3R9XG4gICAgICogQHBhcmFtIGRlZmluaXRpb24ge09iamVjdH0ge1xuICAgICAqICAgICAgJ2tleTEnOiBTdHJpbmcsXG4gICAgICogICAgICAna2V5Mic6IEFueUNsYXNzLFxuICAgICAqICAgICAgJ2tleTMnOiBOdW1iZXJcbiAgICAgKlxuICAgICAqIH1cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICB2YXIgZGVmaW5lcyA9IGV4cG9ydHMuZGVmaW5lcyA9IGZ1bmN0aW9uIChvYmosIGRlZmluaXRpb24pIHtcbiAgICAgICAgdmFyIGtleSA9IG51bGwsIHR5cGUsIGkgPSAwLCBMO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgICAgICAgICBMID0gb2JqLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAoO2k8TDtpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIWRlZmluZXMob2JqW2ldLCBkZWZpbml0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gZGVmaW5pdGlvbikge1xuICAgICAgICAgICAgICAgIHR5cGUgPSBkZWZpbml0aW9uW2tleV07XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU3RyaW5nOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vdChpc1N0cmluZyhvYmpba2V5XSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignb2JqZWN0QCcgKyBrZXkgKyAnIGRvZXMgbm90IGltcGxlbWVudCAnICsgdHlwZSArICc6Jywgb2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBOdW1iZXI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm90KGlzTnVtYmVyKG9ialtrZXldKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdvYmplY3RAJyArIGtleSArICcgZG9lcyBub3QgaW1wbGVtZW50ICcgKyB0eXBlICsgJzonLCBvYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm90KG9ialtrZXldIGluc3RhbmNlb2YgdHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdvYmplY3RAJyArIGtleSArICcgZG9lcyBub3QgaW1wbGVtZW50ICcgKyB0eXBlICsgJzonLCBvYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSW5oZXJpdCBzdHVmZiBmcm9tIHBhcmVudFxuICAgICAqIEBwYXJhbSBjaGlsZFxuICAgICAqIEBwYXJhbSBwYXJlbnRcbiAgICAgKi9cbiAgICBleHBvcnRzLmluaGVyaXQgPSBmdW5jdGlvbiAoY2hpbGQsIHBhcmVudCkge1xuICAgICAgICBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHBhcmVudC5wcm90b3R5cGUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjYWxsYmFja3NcbiAgICAgKi9cbiAgICBleHBvcnRzLmV4ZWN1dGVDYWxsYmFja3MgPSBmdW5jdGlvbiAoY2FsbGJhY2tzKSB7XG4gICAgICAgIHZhciBhcmdzID0gbnVsbDtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxLCBhcmd1bWVudHMubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaSA9IDAsIEwgPSBjYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICBpZiAoYXJncyA9PSBudWxsKSB7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IEw7IGkrKykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tpXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICg7IGkgPCBMOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFja3NbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbn0pKHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/IHRoaXNbJ3lVdGlscyddID0ge30gOiBleHBvcnRzKTsiXX0=
