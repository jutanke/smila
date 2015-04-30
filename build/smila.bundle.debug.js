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
    if (!Utils.implements(renderItem, "id", "render")) {
        throw new Error("gave non-RenderItem to function");
    }
    var pos = findRenderItemPosition(this, renderItem);
    if (pos !== -1) {
        throw new Error("Cannot add the same sprite multiple times");
    }
    this.renderItems.push(renderItem);
};

Scene.prototype.removeRenderItem = function (renderItem) {
    if (!Utils.implements(renderItem, "id", "render")) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImxpYi9EYXRhU3RvcmUuanMiLCJsaWIvUmVuZGVyZXIuanMiLCJsaWIvU2NlbmUuanMiLCJsaWIvU2NlbmVMb2FkZXIuanMiLCJsaWIvU21pbGEuanMiLCJsaWIvU3ByaXRlLmpzIiwibGliL1V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2Z1dHVyZS1jYWxsYmFja3MvbGliL2Z1dHVyZS5qcyIsIm5vZGVfbW9kdWxlcy95dXRpbHMveXV0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgRnV0dXJlID0gcmVxdWlyZSgnZnV0dXJlLWNhbGxiYWNrcycpO1xudmFyIFV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xudmFyIFlVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xudmFyIFNwcml0ZSA9IHJlcXVpcmUoJy4vU3ByaXRlLmpzJyk7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBQIFIgSSBWIEEgVCBFXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG52YXIgc3ByaXRlQ2FjaGUgPSB7fTtcblxudmFyIFNQUklURV9MT0FEX1RJTUVPVVQgPSAyMDAwOyAvLyBtc1xuXG4vKipcbiAqXG4gKiBAcGFyYW0gc3ByaXRlRGF0YVxuICogQHBhcmFtIGZ1dHVyZVxuICovXG5mdW5jdGlvbiBsb2FkU3ByaXRlKHNwcml0ZURhdGEsIGZ1dHVyZSkge1xuICAgIFV0aWxzLmxvZyhcImxvYWRpbmcgc3ByaXRlIFwiICsgc3ByaXRlRGF0YS5rZXkpO1xuICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGlmIChzcHJpdGVEYXRhLmtleSBpbiBzcHJpdGVDYWNoZSkge1xuICAgICAgICBVdGlscy5sb2coXCJsb2FkIHNwcml0ZSBcIiArIHNwcml0ZURhdGEua2V5ICsgXCIgZnJvbSBDYWNoZVwiKTtcbiAgICAgICAgZnV0dXJlLmV4ZWNTdWNjZXNzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFV0aWxzLmxvZyhcInNwcml0ZSBcIiArIHNwcml0ZURhdGEua2V5ICsgXCJsb2FkZWRcIik7XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWcud2lkdGg7XG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodDtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWcsIDAsIDApO1xuICAgICAgICAgICAgc3ByaXRlQ2FjaGVbc3ByaXRlRGF0YS5rZXldID0gY2FudmFzO1xuICAgICAgICAgICAgZnV0dXJlLmV4ZWNTdWNjZXNzKCk7XG4gICAgICAgIH07XG4gICAgICAgIGltZy5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgVXRpbHMubG9nKFwiY291bGQgbm90IGxvYWQgaW1nIFwiICsgc3ByaXRlRGF0YS5rZXksIGVycik7XG4gICAgICAgICAgICBmdXR1cmUuZXhlY0ZhaWx1cmUoZXJyKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZW9mIHNwcml0ZURhdGEuYmFzZTY0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgVXRpbHMubG9nKFwibG9hZCBzcHJpdGUgXCIgKyBzcHJpdGVEYXRhLmtleSArIFwiIGZyb20gYmFzZTY0XCIpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNwcml0ZURhdGEuYmFzZTY0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgVXRpbHMubG9nKFwibG9hZCBzcHJpdGUgXCIgKyBzcHJpdGVEYXRhLmtleSArIFwiIGZyb20gVVJMOiBcIiArIHNwcml0ZURhdGEudXJsKTtcbiAgICAgICAgICAgIGltZy5zcmMgPSBzcHJpdGVEYXRhLnNyYztcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFAgVSBCIEwgSSBDXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBzcHJpdGVEYXRhIHtPYmplY3R9IHtcbiAgICAgKlxuICAgICAqICAgICAga2V5OiBuYW1lLFxuICAgICAqXG4gICAgICogICAgICA8IGJhc2U2NDoge1N0cmluZ30gfHwgc3JjOiB7U3RyaW5nfSB1cmwgPlxuICAgICAqXG4gICAgICogfVxuICAgICAqIEByZXR1cm5zIHtGdXR1cmV9XG4gICAgICovXG4gICAgcHV0OiBmdW5jdGlvbiAoc3ByaXRlRGF0YSkge1xuICAgICAgICB2YXIgZnV0dXJlO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNwcml0ZURhdGEpKSB7XG4gICAgICAgICAgICBmdXR1cmUgPSBGdXR1cmUuY3JlYXRlKHRoaXMsIHNwcml0ZURhdGEubGVuZ3RoLCBTUFJJVEVfTE9BRF9USU1FT1VUKTtcbiAgICAgICAgICAgIHNwcml0ZURhdGEuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGxvYWRTcHJpdGUoZWxlbWVudCwgZnV0dXJlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnV0dXJlID0gRnV0dXJlLmNyZWF0ZSgpO1xuICAgICAgICAgICAgbG9hZFNwcml0ZShzcHJpdGVEYXRhLCBmdXR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1dHVyZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZVxuICAgICAqIEBwYXJhbSB3XG4gICAgICogQHBhcmFtIGhcbiAgICAgKiBAcmV0dXJucyB7U3ByaXRlfVxuICAgICAqL1xuICAgIGdldFNwcml0ZTogZnVuY3Rpb24gKG5hbWUsIHcsIGgpIHtcbiAgICAgICAgWVV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDMpO1xuICAgICAgICBpZiAobmFtZSBpbiBzcHJpdGVDYWNoZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTcHJpdGUoc3ByaXRlQ2FjaGVbbmFtZV0sIHcsIGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5kZW50aWZpZXIge1wiICsgbmFtZSArIFwifSBpcyBub3QgcHJlc2VudCBpbiBEYXRhU3RvcmVcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbn07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xuLy92YXIgRnV0dXJlID0gcmVxdWlyZSgnZnV0dXJlLWNhbGxiYWNrcycpO1xuXG52YXIgU2NlbmUgPSByZXF1aXJlKCcuL1NjZW5lLmpzJyk7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBkb21JZCB7U3RyaW5nfVxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBSZW5kZXJlcihkb21JZCwgb3B0aW9ucykge1xuICAgIGlmICghVXRpbHMuaXNTdHJpbmcoZG9tSWQpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRvbUlEIG11c3QgYmUgYSBTdHJpbmdcIik7XG4gICAgfVxuICAgIGlmICghVXRpbHMuaXNEZWZpbmVkKG9wdGlvbnMpKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICB2YXIgdmVyYm9zZSA9IChcInZlcmJvc2VcIiBpbiBvcHRpb25zKSA/IG9wdGlvbnMudmVyYm9zZSA6IGZhbHNlO1xuXG4gICAgdmFyIHBhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRvbUlkKTtcbiAgICB2YXIgcG9zaXRpb24gPSBwYXJlbnQuc3R5bGUucG9zaXRpb247XG4gICAgaWYgKHBvc2l0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBwYXJlbnQuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XG4gICAgfVxuXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBwYXJlbnQuY2xpZW50SGVpZ2h0O1xuICAgIGNhbnZhcy53aWR0aCA9IHBhcmVudC5jbGllbnRXaWR0aDtcblxuICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgIH07XG4gICAgdGhpcy5kaW1lbnNpb24gPSB7XG4gICAgICAgIHc6IHBhcmVudC5jbGllbnRXaWR0aCxcbiAgICAgICAgaDogcGFyZW50LmNsaWVudEhlaWdodFxuICAgIH07XG5cbiAgICB0aGlzLnN0YXRlID0gbnVsbDtcbiAgICBpZiAodmVyYm9zZSAmJiB0eXBlb2YgU3RhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuc3RhdHMgPSBuZXcgU3RhdGUoKTtcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAnMHB4JztcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnRvcCA9ICcwcHgnO1xuICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodGhpcy5zdGF0cy5kb21FbGVtZW50KTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICB0aGlzLmN1cnJlbnRTY2VuZSA9IG51bGw7XG5cblxufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gbmFtZVxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEByZXR1cm5zIHtTY2VuZXwqfVxuICovXG5SZW5kZXJlci5wcm90b3R5cGUucHV0U2NlbmUgPSBmdW5jdGlvbiAoc2NlbmUpIHtcbiAgICBVdGlscy5hc3NlcnRMZW5ndGgoYXJndW1lbnRzLCAxKTtcbiAgICBpZiAodGhpcy5jdXJyZW50U2NlbmUgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFNjZW5lLm5hbWUgPT09IHNjZW5lLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk11c3Qgbm90IHB1dCB0aGUgc2FtZSBTY2VuZSB0d2ljZSFcIik7XG4gICAgICAgIH1cbiAgICAgICAgVXRpbHMuZXhlY3V0ZUNhbGxiYWNrcyh0aGlzLmN1cnJlbnRTY2VuZS5vbnJlbmRlcmVyZGV0YWNoZWRDYnMsIHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLmN1cnJlbnRTY2VuZSA9IHNjZW5lO1xuICAgIFV0aWxzLmV4ZWN1dGVDYWxsYmFja3Moc2NlbmUub25yZW5kZXJlcmF0dGFjaGVkQ2JzLCB0aGlzKTtcblxufTtcblxuUmVuZGVyZXIucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgIFV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDApO1xuICAgIGlmICh0aGlzLmN1cnJlbnRTY2VuZSAhPT0gbnVsbCkge1xuICAgICAgICBVdGlscy5leGVjdXRlQ2FsbGJhY2tzKHRoaXMuY3VycmVudFNjZW5lLm9ucmVuZGVyZXJkZXRhY2hlZENicywgdGhpcyk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMi8yNC8yMDE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFV0aWxzID0gcmVxdWlyZSgneXV0aWxzJyk7XG5cbi8qKlxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEBwYXJhbSBjYWxsYmFjayB7ZnVuY3Rpb259XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gU2NlbmUobmFtZSwgb3B0aW9ucykge1xuICAgIFV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDIpO1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMucmVhZHlDYWxsYmFja3MgPSBbXTtcbiAgICB0aGlzLm9ucmVuZGVyZXJhdHRhY2hlZENicyA9IFtdO1xuICAgIHRoaXMub25yZW5kZXJlcmRldGFjaGVkQ2JzID0gW107XG4gICAgdGhpcy5pc1JlYWR5ID0gZmFsc2U7XG4gICAgdGhpcy5yZW5kZXJJdGVtcyA9IFtdO1xuICAgIGlmIChcIm1hcFwiIGluIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gTE9BRCBGUk9NIE1BUFxuXG4gICAgICAgIC8vIGRlZHVjdCBtYXAgdHlwZVxuXG5cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBERUZBVUxUXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYXBwbHlSZWFkeShzZWxmKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxufVxuXG5TY2VuZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcblxuICAgIC8vVE9ETyBBUFBMWSBDQU1FUkFcbiAgICB2YXIgaSA9IDAsIEwgPSB0aGlzLnJlbmRlckl0ZW1zLmxlbmd0aDtcbiAgICB2YXIgcmVuZGVySXRlbXMgPSB0aGlzLnJlbmRlckl0ZW1zO1xuXG4gICAgZm9yICg7aSA8IEw7IGkrKykge1xuICAgICAgICByZW5kZXJJdGVtc1tpXS5yZW5kZXIoY29udGV4dCk7XG4gICAgfVxufTtcblxuU2NlbmUucHJvdG90eXBlLmFkZFJlbmRlckl0ZW0gPSBmdW5jdGlvbiAocmVuZGVySXRlbSkge1xuICAgIGlmICghVXRpbHMuaW1wbGVtZW50cyhyZW5kZXJJdGVtLCBcImlkXCIsIFwicmVuZGVyXCIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImdhdmUgbm9uLVJlbmRlckl0ZW0gdG8gZnVuY3Rpb25cIik7XG4gICAgfVxuICAgIHZhciBwb3MgPSBmaW5kUmVuZGVySXRlbVBvc2l0aW9uKHRoaXMsIHJlbmRlckl0ZW0pO1xuICAgIGlmIChwb3MgIT09IC0xKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBhZGQgdGhlIHNhbWUgc3ByaXRlIG11bHRpcGxlIHRpbWVzXCIpO1xuICAgIH1cbiAgICB0aGlzLnJlbmRlckl0ZW1zLnB1c2gocmVuZGVySXRlbSk7XG59O1xuXG5TY2VuZS5wcm90b3R5cGUucmVtb3ZlUmVuZGVySXRlbSA9IGZ1bmN0aW9uIChyZW5kZXJJdGVtKSB7XG4gICAgaWYgKCFVdGlscy5pbXBsZW1lbnRzKHJlbmRlckl0ZW0sIFwiaWRcIiwgXCJyZW5kZXJcIikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZ2F2ZSBub24tUmVuZGVySXRlbSB0byBmdW5jdGlvblwiKTtcbiAgICB9XG4gICAgdmFyIHBvcyA9IGZpbmRSZW5kZXJJdGVtUG9zaXRpb24odGhpcywgcmVuZGVySXRlbSk7XG4gICAgaWYgKHBvcyA+IC0xKSB7XG4gICAgICAgIFV0aWxzLmRlbGV0ZVBvc2l0aW9uKHRoaXMucmVuZGVySXRlbXMsIHBvcyk7XG4gICAgfVxufTtcblxuU2NlbmUucHJvdG90eXBlLm9ucmVhZHkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5pc1JlYWR5KSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZWFkeUNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59O1xuXG5TY2VuZS5wcm90b3R5cGUub25yZW5kZXJlcmF0dGFjaGVkID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgLy8gdGhpcyBjYWxsYmFja3MgYXJlIGNhbGxlZCBmcm9tIHRoZSBSZW5kZXJlclxuICAgIHRoaXMub25yZW5kZXJlcmF0dGFjaGVkQ2JzLnB1c2goY2FsbGJhY2spO1xufTtcblxuU2NlbmUucHJvdG90eXBlLm9ucmVuZGVyZXJkZXRhY2hlZCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIC8vIHRoaXMgY2FsbGJhY2tzIGFyZSBjYWxsZWQgZnJvbSB0aGUgUmVuZGVyZXJcbiAgICB0aGlzLm9ucmVuZGVyZXJkZXRhY2hlZENicy5wdXNoKGNhbGxiYWNrKTtcbn07XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFAgUiBJIFYgQSBUIEVcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuLyoqXG4gKiBGaW5kcyB0aGUgcG9zaXRpb24gb2YgdGhlIHJlbmRlckl0ZW0sIGlmIG5vdCAtPiAtMVxuICogQHBhcmFtIHNjZW5lXG4gKiBAcGFyYW0gcmVuZGVySXRlbVxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gZmluZFJlbmRlckl0ZW1Qb3NpdGlvbihzY2VuZSwgcmVuZGVySXRlbSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NlbmUucmVuZGVySXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHNjZW5lLnJlbmRlckl0ZW1zW2ldLmlkID09PSByZW5kZXJJdGVtLmlkKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGFwcGx5UmVhZHkoc2NlbmUpIHtcbiAgICBpZiAoc2NlbmUuaXNSZWFkeSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBIFNjZW5lIGNhbiBvbmx5IGJlIHJlYWR5IE9OQ0UhXCIpO1xuICAgIH1cbiAgICBzY2VuZS5pc1JlYWR5ID0gdHJ1ZTtcbiAgICBVdGlscy5leGVjdXRlQ2FsbGJhY2tzKHNjZW5lLnJlYWR5Q2FsbGJhY2tzKTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5lOyIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMi8yNC8yMDE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFNjZW5lID0gcmVxdWlyZSgnLi9TY2VuZS5qcycpO1xudmFyIFV0aWxzID0gcmVxdWlyZSgneXV0aWxzJyk7XG5cbnZhciBjYWNoZSA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBuYW1lIHtTdHJpbmd9IHVuaXF1ZSBpZGVudGlmaWVyXG4gICAgICogQHBhcmFtIG9wdGlvbnMge09iamVjdH1cbiAgICAgKiBAcmV0dXJucyB7U2NlbmV9XG4gICAgICovXG4gICAgY3JlYXRlOiBmdW5jdGlvbiAobmFtZSwgb3B0aW9ucykge1xuICAgICAgICBVdGlscy5hc3NlcnRMZW5ndGgoYXJndW1lbnRzLCAyKTtcbiAgICAgICAgaWYgKCFVdGlscy5pc1N0cmluZyhuYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZmlyc3QgcGFyYW1ldGVyIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNjZW5lID0gbmV3IFNjZW5lKG5hbWUsIG9wdGlvbnMpO1xuICAgICAgICBjYWNoZVtuYW1lXSA9IHNjZW5lO1xuICAgICAgICByZXR1cm4gc2NlbmU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIG5hbWVcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBnZXQ6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIFV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDEpO1xuICAgICAgICBpZiAoIVV0aWxzLmlzU3RyaW5nKG5hbWUpKSB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgaWRlbnRpZmllciBmb3IgYSBTY2VuZSBtdXN0IGJlIGEgU3RyaW5nXCIpO1xuICAgICAgICBpZiAobmFtZSBpbiBjYWNoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhY2hlW25hbWVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGZpbmQgaWRlbnRpZmllciBmb3IgU2NlbmVcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbn07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGp1bGlhbiBvbiAyLzIyLzE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFNjZW5lTG9hZGVyID0gcmVxdWlyZSgnLi9TY2VuZUxvYWRlci5qcycpO1xudmFyIFJlbmRlcmVyID0gcmVxdWlyZSgnLi9SZW5kZXJlci5qcycpO1xudmFyIERhdGFTdG9yZSA9IHJlcXVpcmUoJy4vRGF0YVN0b3JlLmpzJyk7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFMgTSBJIEwgQVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZGVidWc6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgY29uc29sZS5sb2coc3RyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7U2NlbmVMb2FkZXJ9XG4gICAgICovXG4gICAgc2NlbmVMb2FkZXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBTY2VuZUxvYWRlcjtcbiAgICB9LFxuXG4gICAgZGF0YVN0b3JlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gRGF0YVN0b3JlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBkb21JZFxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICogQHJldHVybnMge1JlbmRlcmVyfVxuICAgICAqL1xuICAgIHJlbmRlcmVyIDogZnVuY3Rpb24gKGRvbUlkLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVuZGVyZXIoZG9tSWQsIG9wdGlvbnMpO1xuICAgIH1cblxufSIsIi8qKlxuICogQ3JlYXRlZCBieSBqdWxpYW4gb24gMi8yMy8xNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xuXG52YXIgbGFzdElkID0gMDtcblxuLyoqXG4gKlxuICogQHBhcmFtIGNhbnZhc1xuICogQHBhcmFtIHcgb2YgdGhlIHN1YiBpbWFnZVxuICogQHBhcmFtIGggb2YgdGhlIHN1YiBpbWFnZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFNwcml0ZShjYW52YXMsIHcsIGgpIHtcbiAgICBVdGlscy5hc3NlcnRMZW5ndGgoYXJndW1lbnRzLCAzKTtcbiAgICB0aGlzLmlkID0gbGFzdElkKys7XG4gICAgdGhpcy5pbWcgPSBjYW52YXM7XG4gICAgdGhpcy53ID0gdyB8IDA7XG4gICAgdGhpcy5oID0gaCB8IDA7XG4gICAgdGhpcy53XzIgPSBNYXRoLmZsb29yKHRoaXMudyAvIDIpIHwgMDtcbiAgICB0aGlzLmhfMiA9IE1hdGguZmxvb3IodGhpcy5oIC8gMikgfCAwO1xuICAgIHRoaXMub3ggPSAwIHwgMDtcbiAgICB0aGlzLm95ID0gMCB8IDA7XG4gICAgdGhpcy54ID0gMCB8IDA7XG4gICAgdGhpcy55ID0gMCB8IDA7XG4gICAgdGhpcy5hbmdsZUluUmFkaWFucyA9IDA7XG4gICAgdGhpcy50bF94ID0gdGhpcy54IC0gdGhpcy53XzI7IC8vIFRPUC1MRUZULVhcbiAgICB0aGlzLnRsX3kgPSB0aGlzLnkgLSB0aGlzLmhfMjsgLy8gVE9QLUxFRlQtWVxuICAgIHRoaXMubWlycm9yeSA9IGZhbHNlO1xuICAgIHRoaXMubWlycm9yeCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIENlbnRlcmVkIHNwcml0ZSBwb3NpdGlvblxuICogQHBhcmFtIHhcbiAqIEBwYXJhbSB5XG4gKi9cblNwcml0ZS5wcm90b3R5cGUucG9zaXRpb25DZW50ZXIgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHRoaXMueCA9IHggfCAwO1xuICAgIHRoaXMueSA9IHkgfCAwO1xuICAgIHRoaXMudGxfeCA9ICh4IC0gdGhpcy53XzIpICB8IDA7XG4gICAgdGhpcy50bF95ID0gKHkgLSB0aGlzLmhfMikgIHwgMDtcbn07XG5cbi8qKlxuICogVG9wLUxlZnQgc3ByaXRlIHBvc2l0aW9uXG4gKiBAcGFyYW0geFxuICogQHBhcmFtIHlcbiAqIEByZXR1cm5zIHtTcHJpdGV9XG4gKi9cblNwcml0ZS5wcm90b3R5cGUucG9zaXRpb24gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHRoaXMudGxfeCA9IHggfCAwO1xuICAgIHRoaXMudGxfeSA9IHkgfCAwO1xuICAgIHRoaXMueCA9ICh4ICsgdGhpcy53XzIpIHwgMDtcbiAgICB0aGlzLnkgPSAoeSArIHRoaXMuaF8yKSB8IDA7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0gY29udGV4dFxuICovXG5TcHJpdGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgdmFyIG1pcnJvcnggPSB0aGlzLm1pcnJvcng7XG4gICAgdmFyIG1pcnJvcnkgPSB0aGlzLm1pcnJvcnk7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHcgPSB0aGlzLnc7XG4gICAgdmFyIGggPSB0aGlzLmg7XG4gICAgdmFyIHdoID0gdGhpcy53XzI7XG4gICAgdmFyIGhoID0gdGhpcy5oXzI7XG4gICAgY29udGV4dC50cmFuc2xhdGUoeCx5KTtcbiAgICBpZiAodGhpcy5hbmdsZUluUmFkaWFucyAhPT0gMCkgY29udGV4dC5yb3RhdGUodGhpcy5hbmdsZUluUmFkaWFucyk7XG4gICAgaWYgKG1pcnJvcnkgJiYgbWlycm9yeCkgY29udGV4dC5zY2FsZSgtMSwtMSk7XG4gICAgZWxzZSBpZiAobWlycm9yeSkgY29udGV4dC5zY2FsZSgtMSwxKTtcbiAgICBlbHNlIGlmIChtaXJyb3J4KSBjb250ZXh0LnNjYWxlKDEsLTEpO1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKHRoaXMuaW1nLHRoaXMub3gsdGhpcy5veSx3LGgsLXdoLC1oaCx3LGgpO1xuICAgIGlmIChtaXJyb3J5ICYmIG1pcnJvcngpIGNvbnRleHQuc2NhbGUoMSwxKTtcbiAgICBlbHNlIGlmIChtaXJyb3J5KSBjb250ZXh0LnNjYWxlKC0xLDEpO1xuICAgIGVsc2UgaWYgKG1pcnJvcngpIGNvbnRleHQuc2NhbGUoMSwtMSk7XG4gICAgaWYgKHRoaXMuYW5nbGVJblJhZGlhbnMgIT09IDApIGNvbnRleHQucm90YXRlKC10aGlzLmFuZ2xlSW5SYWRpYW5zKTtcbiAgICBjb250ZXh0LnRyYW5zbGF0ZSgteCwgLXkpO1xufTtcblxuU3ByaXRlLnByb3RvdHlwZS5zdWJpbWFnZSA9IGZ1bmN0aW9uKHgseSl7XG4gICAgdGhpcy5veCA9IHggKiB0aGlzLnc7XG4gICAgdGhpcy5veSA9IHkgKiB0aGlzLmg7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5TcHJpdGUucHJvdG90eXBlLmRpcmVjdEltYWdlID0gZnVuY3Rpb24ob3gsb3ksIHcsaCl7XG4gICAgdGhpcy5veCA9IG94O1xuICAgIHRoaXMub3kgPSBveTtcbiAgICB0aGlzLndpZHRoKHcpO1xuICAgIHRoaXMuaGVpZ2h0KGgpO1xufTtcblxuU3ByaXRlLnByb3RvdHlwZS52ZXJ0aWNhbE1pcnJvciA9IGZ1bmN0aW9uKG1pcnJvcil7XG4gICAgdGhpcy5taXJyb3J5ID0gbWlycm9yO1xufTtcblxuU3ByaXRlLnByb3RvdHlwZS5ob3Jpem9udGFsTWlycm9yID0gZnVuY3Rpb24obWlycm9yKXtcbiAgICB0aGlzLm1pcnJvcnggPSBtaXJyb3I7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNwcml0ZTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDMvMi8yMDE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9nOiBmdW5jdGlvbiAoc3RyLCBkYXRhKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0cik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzdHIsIGRhdGEpO1xuICAgICAgICB9XG4gICAgfVxufSIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAzLzEvMjAxNS5cclxuICovXHJcbmZ1bmN0aW9uIEZ1dHVyZShvYmosIG1heENvdW50LCB0aW1lb3V0KSB7XHJcbiAgICB0aGlzLm9iaiA9IHR5cGVvZiBvYmogPT09IFwidW5kZWZpbmVkXCIgPyB7fSA6IG9iajtcclxuICAgIHRoaXMuc3VjY2Vzc0hhbmRsZXIgPSBudWxsO1xyXG4gICAgdGhpcy5mYWlsdXJlSGFuZGxlciA9IG51bGw7XHJcbiAgICB0aGlzLmZpbmFsbHlIYW5kbGVyID0gbnVsbDtcclxuICAgIHRoaXMuZmluYWxseUNvdW50ID0gMDtcclxuICAgIHRoaXMudGltZW91dCA9IDA7XHJcbiAgICBpZiAodHlwZW9mIG1heENvdW50ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGltZW91dCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0aW1lb3V0IG11c3QgYmUgZGVmaW5lZCEnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gdGltZW91dDtcclxuICAgICAgICB0aGlzLm1heENvdW50ID0gbWF4Q291bnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubWF4Q291bnQgPSAxO1xyXG4gICAgfVxyXG4gICAgdGhpcy50aW1lb3V0VGhyZWFkID0gbnVsbDtcclxufTtcclxuXHJcbkZ1dHVyZS5wcm90b3R5cGUuZXhlY1N1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuICAgIGlmICh0aGlzLnN1Y2Nlc3NIYW5kbGVyID09PSBudWxsKSB7XHJcbiAgICAgICAgLy8gZGVsZWdhdGUgYSBzZWNvbmQgdHJ5XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxmLnN1Y2Nlc3NIYW5kbGVyID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJzdWNjZXNzIG9uIGZ1bmN0aW9uIHdpdGggbm8gc3VjY2VzcyBoYW5kbGVyXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZShzZWxmLCBcInN1Y2Nlc3NIYW5kbGVyXCIsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgMSk7IC8vIE5FWFQgRVhFQ1VUSU9OXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGV4ZWN1dGUodGhpcywgXCJzdWNjZXNzSGFuZGxlclwiLCBhcmd1bWVudHMpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gZXhlY3V0ZShmdXR1cmUsIGhhbmRsZXJOYW1lLCBhcmdzKSB7XHJcbiAgICBmdXR1cmUuZmluYWxseUNvdW50ICs9IDE7XHJcbiAgICBmdXR1cmVbaGFuZGxlck5hbWVdLmFwcGx5KGZ1dHVyZS5vYmosIGFyZ3MpO1xyXG4gICAgaWYgKGZ1dHVyZS5maW5hbGx5Q291bnQgPT09IGZ1dHVyZS5tYXhDb3VudCAmJiBmdXR1cmUuZmluYWxseUhhbmRsZXIgIT09IG51bGwpIHtcclxuICAgICAgICBjbGVhckludGVydmFsKGZ1dHVyZS50aW1lb3V0VGhyZWFkKTtcclxuICAgICAgICBmdXR1cmUuZmluYWxseUhhbmRsZXIuY2FsbChmdXR1cmUub2JqKTtcclxuICAgICAgICBmdXR1cmUuc3VjY2Vzc0hhbmRsZXIgPSBudWxsO1xyXG4gICAgICAgIGZ1dHVyZS5mYWlsdXJlSGFuZGxlciA9IG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbkZ1dHVyZS5wcm90b3R5cGUuZXhlY0ZhaWx1cmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuICAgIGlmICh0aGlzLmZhaWx1cmVIYW5kbGVyID09IG51bGwpIHtcclxuICAgICAgICAvLyBkZWxlZ2F0ZSBhIHNlY29uZCB0cnlcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGYuZmFpbHVyZUhhbmRsZXIgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVuaGFuZGxlZCBmYWlsdXJlXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZSh0aGlzLCBcImZhaWx1cmVIYW5kbGVyXCIsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgMSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGV4ZWN1dGUodGhpcywgXCJmYWlsdXJlSGFuZGxlclwiLCBhcmd1bWVudHMpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuRnV0dXJlLnByb3RvdHlwZS5zdWNjZXNzID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICBpZiAodGhpcy5zdWNjZXNzSGFuZGxlciA9PSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5zdWNjZXNzSGFuZGxlciA9IGNhbGxiYWNrO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0ZW5lciBpcyBhbHJlYWR5IHNldCFcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbkZ1dHVyZS5wcm90b3R5cGUuZmFpbHVyZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgaWYgKHRoaXMuZmFpbHVyZUhhbmRsZXIgPT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMuZmFpbHVyZUhhbmRsZXIgPSBjYWxsYmFjaztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTGlzdGVuZXIgaXMgYWxyZWFkeSBzZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5GdXR1cmUucHJvdG90eXBlLmZpbmFsbHkgPSBmdW5jdGlvbiAoYSwgYiwgYykge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgaWYgKHRoaXMuZmluYWxseUhhbmRsZXIgIT0gbnVsbCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkxpc3RlbmVyIGlzIGFscmVhZHkgc2V0IVwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oYSkpIHtcclxuICAgICAgICAgICAgdGhpcy5maW5hbGx5SGFuZGxlciA9IGE7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRUaHJlYWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmZpbmFsbHlIYW5kbGVyLmNhbGwoc2VsZi5vYmopO1xyXG4gICAgICAgICAgICAgICAgfSwgdGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9IGVsc2UgaWYgKGlzTnVtYmVyKGEpICYmIGEgPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWF4Q291bnQgPSBhO1xyXG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIoYikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dFRocmVhZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZmluYWxseUhhbmRsZXIuY2FsbChzZWxmLm9iaik7XHJcbiAgICAgICAgICAgICAgICB9LCBiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRpbWVvdXQgcGFyYW1ldGVyIGlzIG1pc3NpbmchXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKGMpKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmZpbmFsbHlIYW5kbGVyID0gYztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRUaHJlYWQpO1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uIVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImZpcnN0IHBhcmFtIG11c3QgYmUgbnVtYmVyIG9yIGZ1bmN0aW9uIVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBpc051bWJlcihuKSB7XHJcbiAgICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGZ1bmN0aW9uVG9DaGVjaykge1xyXG4gICAgdmFyIGdldFR5cGUgPSB7fTtcclxuICAgIHJldHVybiBmdW5jdGlvblRvQ2hlY2sgJiYgZ2V0VHlwZS50b1N0cmluZy5jYWxsKGZ1bmN0aW9uVG9DaGVjaykgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIChvYmosIGksIHQpIHtcclxuICAgIHJldHVybiBuZXcgRnV0dXJlKG9iaiwgaSwgdCk7XHJcbn07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAxMi8xMC8yMDE0LlxuICovXG4oZnVuY3Rpb24gKGV4cG9ydHMpIHtcblxuICAgIC8vIHBlcmZvcm1hbmNlLm5vdyBwb2x5ZmlsbFxuICAgIHZhciBwZXJmID0gbnVsbDtcbiAgICBpZiAodHlwZW9mIHBlcmZvcm1hbmNlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBwZXJmID0ge307XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGVyZiA9IHBlcmZvcm1hbmNlO1xuICAgIH1cblxuICAgIHBlcmYubm93ID0gcGVyZi5ub3cgfHwgcGVyZi5tb3pOb3cgfHwgcGVyZi5tc05vdyB8fCBwZXJmLm9Ob3cgfHwgcGVyZi53ZWJraXROb3cgfHwgRGF0ZS5ub3cgfHxcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICB9O1xuXG4gICAgZnVuY3Rpb24gc3dhcChhcnJheSwgaSwgaikge1xuICAgICAgICBpZiAoaSAhPT0gaikge1xuICAgICAgICAgICAgdmFyIHRlbXAgPSBhcnJheVtpXTtcbiAgICAgICAgICAgIGFycmF5W2ldID0gYXJyYXlbal07XG4gICAgICAgICAgICBhcnJheVtqXSA9IHRlbXA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKlxuICAgICB+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+flxuICAgICAqL1xuXG4gICAgdmFyIGdldFJhbmRvbUludCA9IGV4cG9ydHMuZ2V0UmFuZG9tSW50ID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7XG4gICAgICAgIGlmIChtaW4gPiBtYXgpIHRocm93IG5ldyBFcnJvcihcIm1pbiBtdXN0IGJlIHNtYWxsZXIgdGhhbiBtYXghIHtcIiArIG1pbiArIFwiPlwiICsgbWF4ICsgXCJ9XCIpO1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5zYW1wbGUgPSBmdW5jdGlvbiAobGlzdCwgbikge1xuICAgICAgICB2YXIgcmVzdWx0ID0gW10sIGosIGkgPSAwLCBMID0gbiA+IGxpc3QubGVuZ3RoID8gbGlzdC5sZW5ndGggOiBuLCBzID0gbGlzdC5sZW5ndGggLSAxO1xuICAgICAgICBmb3IgKDsgaSA8IEw7IGkrKykge1xuICAgICAgICAgICAgaiA9IGdldFJhbmRvbUludChpLCBzKTtcbiAgICAgICAgICAgIHN3YXAobGlzdCwgaSwgaik7XG4gICAgICAgICAgICByZXN1bHQucHVzaChsaXN0W2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICB2YXIgaXNTdHJpbmcgPSBleHBvcnRzLmlzU3RyaW5nID0gZnVuY3Rpb24gKG15VmFyKSB7XG4gICAgICAgIHJldHVybiAodHlwZW9mIG15VmFyID09PSAnc3RyaW5nJyB8fCBteVZhciBpbnN0YW5jZW9mIFN0cmluZylcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5hc3NlcnRMZW5ndGggPSBmdW5jdGlvbiAoYXJnLCBuYnIpIHtcbiAgICAgICAgaWYgKGFyZy5sZW5ndGggPT09IG5icikgcmV0dXJuIHRydWU7XG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiV3JvbmcgbnVtYmVyIG9mIGFyZ3VtZW50czogZXhwZWN0ZWQ6XCIgKyBuYnIgKyBcIiwgYnV0IGdvdDogXCIgKyBhcmcubGVuZ3RoKTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5ndWlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZCA9IHBlcmYubm93KCk7XG4gICAgICAgIHZhciBndWlkID0gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgdmFyIHIgPSAoZCArIE1hdGgucmFuZG9tKCkgKiAxNikgJSAxNiB8IDA7XG4gICAgICAgICAgICBkID0gTWF0aC5mbG9vcihkIC8gMTYpO1xuICAgICAgICAgICAgcmV0dXJuIChjID09PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpKS50b1N0cmluZygxNik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZ3VpZDtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy50aW1lRGlmZmVyZW5jZUluTXMgPSBmdW5jdGlvbiAodHNBLCB0c0IpIHtcbiAgICAgICAgaWYgKHRzQSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICAgIHRzQSA9IHRzQS5nZXRUaW1lKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRzQiBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICAgIHRzQiA9IHRzQi5nZXRUaW1lKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGguYWJzKHRzQSAtIHRzQik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIG1pbGxpc2Vjb25kcyB0byBzZWNvbmRzXG4gICAgICogQHBhcmFtIG1zIHtOdW1iZXJ9IE1pbGxpc1xuICAgICAqL1xuICAgIGV4cG9ydHMubXNUb1MgPSBmdW5jdGlvbiAobXMpIHtcbiAgICAgICAgcmV0dXJuIG1zIC8gMTAwMDtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5pc0RlZmluZWQgPSBmdW5jdGlvbiAobykge1xuICAgICAgICBpZiAobyA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAodHlwZW9mIG8gPT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNoYWxsb3cgY2xvbmVcbiAgICAgKiBAcGFyYW0gbGlzdFxuICAgICAqIEByZXR1cm5zIHtBcnJheXxzdHJpbmd8QmxvYn1cbiAgICAgKi9cbiAgICBleHBvcnRzLmNsb25lQXJyYXkgPSBmdW5jdGlvbiAobGlzdCkge1xuICAgICAgICByZXR1cm4gbGlzdC5zbGljZSgwKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogcmVtb3ZlcyB0aGUgaXRlbSBhdCB0aGUgcG9zaXRpb24gYW5kIHJlaW5kZXhlcyB0aGUgbGlzdFxuICAgICAqIEBwYXJhbSBsaXN0XG4gICAgICogQHBhcmFtIGlcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBleHBvcnRzLmRlbGV0ZVBvc2l0aW9uID0gZnVuY3Rpb24gKGxpc3QsIGkpIHtcbiAgICAgICAgaWYgKGkgPCAwIHx8IGkgPj0gbGlzdC5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIk91dCBvZiBib3VuZHNcIik7XG4gICAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdlYXRoZXIgdGhlIHRoZSBvYmplY3QgaW1wbGVtZW50cyB0aGUgZnVsbCBpbnRlcmZhY2Ugb3Igbm90XG4gICAgICogQHBhcmFtIG8ge09iamVjdH1cbiAgICAgKi9cbiAgICB2YXIgaW1wbGVtZW50cyA9IGV4cG9ydHMuaW1wbGVtZW50cyA9IGZ1bmN0aW9uIChvLCBhKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICAgICAgICByZXR1cm4gaW1wbGVtZW50cy5hcHBseSh7fSwgW29dLmNvbmNhdChhKSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGkgPSAxLCBtZXRob2ROYW1lO1xuICAgICAgICB3aGlsZSAoKG1ldGhvZE5hbWUgPSBhcmd1bWVudHNbaSsrXSkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb1ttZXRob2ROYW1lXSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICB2YXIgaXNOdW1iZXIgPSBleHBvcnRzLmlzTnVtYmVyID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgaWYgKGlzU3RyaW5nKG8pKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiAhaXNOYU4obyAtIDApICYmIG8gIT09IG51bGwgJiYgdHlwZW9mIG8gIT09ICd1bmRlZmluZWQnICYmIG8gIT09IGZhbHNlO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBub3QobCkge1xuICAgICAgICByZXR1cm4gIWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSBvYmplY3QgZXF1YWxzIHRoZSBkZWZpbml0aW9uXG4gICAgICogQHBhcmFtIG9iaiB7T2JqZWN0fVxuICAgICAqIEBwYXJhbSBkZWZpbml0aW9uIHtPYmplY3R9IHtcbiAgICAgKiAgICAgICdrZXkxJzogU3RyaW5nLFxuICAgICAqICAgICAgJ2tleTInOiBBbnlDbGFzcyxcbiAgICAgKiAgICAgICdrZXkzJzogTnVtYmVyXG4gICAgICpcbiAgICAgKiB9XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgdmFyIGRlZmluZXMgPSBleHBvcnRzLmRlZmluZXMgPSBmdW5jdGlvbiAob2JqLCBkZWZpbml0aW9uKSB7XG4gICAgICAgIHZhciBrZXkgPSBudWxsLCB0eXBlLCBpID0gMCwgTDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgICAgICAgTCA9IG9iai5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKDtpPEw7aSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFkZWZpbmVzKG9ialtpXSwgZGVmaW5pdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIGRlZmluaXRpb24pIHtcbiAgICAgICAgICAgICAgICB0eXBlID0gZGVmaW5pdGlvbltrZXldO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFN0cmluZzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub3QoaXNTdHJpbmcob2JqW2tleV0pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ29iamVjdEAnICsga2V5ICsgJyBkb2VzIG5vdCBpbXBsZW1lbnQgJyArIHR5cGUgKyAnOicsIG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgTnVtYmVyOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vdChpc051bWJlcihvYmpba2V5XSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignb2JqZWN0QCcgKyBrZXkgKyAnIGRvZXMgbm90IGltcGxlbWVudCAnICsgdHlwZSArICc6Jywgb2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vdChvYmpba2V5XSBpbnN0YW5jZW9mIHR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignb2JqZWN0QCcgKyBrZXkgKyAnIGRvZXMgbm90IGltcGxlbWVudCAnICsgdHlwZSArICc6Jywgb2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEluaGVyaXQgc3R1ZmYgZnJvbSBwYXJlbnRcbiAgICAgKiBAcGFyYW0gY2hpbGRcbiAgICAgKiBAcGFyYW0gcGFyZW50XG4gICAgICovXG4gICAgZXhwb3J0cy5pbmhlcml0ID0gZnVuY3Rpb24gKGNoaWxkLCBwYXJlbnQpIHtcbiAgICAgICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShwYXJlbnQucHJvdG90eXBlKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tzXG4gICAgICovXG4gICAgZXhwb3J0cy5leGVjdXRlQ2FsbGJhY2tzID0gZnVuY3Rpb24gKGNhbGxiYWNrcykge1xuICAgICAgICB2YXIgYXJncyA9IG51bGw7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSwgYXJndW1lbnRzLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGkgPSAwLCBMID0gY2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgaWYgKGFyZ3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgZm9yICg7IGkgPCBMOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFja3NbaV0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgTDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuXG59KSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyB0aGlzWyd5VXRpbHMnXSA9IHt9IDogZXhwb3J0cyk7Il19
