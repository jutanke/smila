!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Smila=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Julian on 2/24/2015.
 */
"use strict";

var Future = require('future-callbacks');
var Utils = require('./Utils.js');

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
        setTimeout(function () {
            future.execSuccess();
        }, 1);
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
    }

};
},{"./Utils.js":6,"future-callbacks":7}],2:[function(require,module,exports){
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



}

/**
 * @type {Object} {
 *      scene_name : { ... }
 * }
 */
var sceneCache = {};

/**
 *
 * @param name
 * @param options
 * @returns {Scene|*}
 */
Renderer.prototype.putScene = function (name, options) {
    var future = Future.create();
    if (name in sceneCache) {
        future.execSuccess(sceneCache[name]);
    } else {
        var scene = new Scene(options, function () {
            future.execSuccess(scene);
        });
        sceneCache[name] = scene;
    }
    return future;
};

module.exports = Renderer;

},{"./Scene.js":3,"yutils":8}],3:[function(require,module,exports){
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
function Scene(options, callback) {
    Utils.assertLength(arguments, 2);
    if ("map" in options) {
        // LOAD FROM MAP

    } else {
        // DEFAULT

    }
};

Scene.prototype.play = function () {
    console.log("play scene");
};

module.exports = Scene;
},{"yutils":8}],4:[function(require,module,exports){
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
        var scene = new Scene(options);
        cache[name] = scene;
        return scene;
    }

};
},{"./Scene.js":3,"yutils":8}],5:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
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


})(typeof exports === 'undefined' ? this['yUtils'] = {} : exports);
},{}]},{},[5])(5)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcQmFrYVxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsImxpYlxcRGF0YVN0b3JlLmpzIiwibGliXFxSZW5kZXJlci5qcyIsImxpYlxcU2NlbmUuanMiLCJsaWJcXFNjZW5lTG9hZGVyLmpzIiwibGliXFxTbWlsYS5qcyIsImxpYlxcVXRpbHMuanMiLCJub2RlX21vZHVsZXNcXGZ1dHVyZS1jYWxsYmFja3NcXGxpYlxcZnV0dXJlLmpzIiwibm9kZV9tb2R1bGVzXFx5dXRpbHNcXHl1dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXHJcbiAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBGdXR1cmUgPSByZXF1aXJlKCdmdXR1cmUtY2FsbGJhY2tzJyk7XHJcbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcclxuXHJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8vIFAgUiBJIFYgQSBUIEVcclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbnZhciBzcHJpdGVDYWNoZSA9IHt9O1xyXG5cclxudmFyIFNQUklURV9MT0FEX1RJTUVPVVQgPSAyMDAwOyAvLyBtc1xyXG5cclxuLyoqXHJcbiAqXHJcbiAqIEBwYXJhbSBzcHJpdGVEYXRhXHJcbiAqIEBwYXJhbSBmdXR1cmVcclxuICovXHJcbmZ1bmN0aW9uIGxvYWRTcHJpdGUoc3ByaXRlRGF0YSwgZnV0dXJlKSB7XHJcbiAgICBVdGlscy5sb2coXCJsb2FkaW5nIHNwcml0ZSBcIiArIHNwcml0ZURhdGEua2V5KTtcclxuICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuXHJcbiAgICBpZiAoc3ByaXRlRGF0YS5rZXkgaW4gc3ByaXRlQ2FjaGUpIHtcclxuICAgICAgICBVdGlscy5sb2coXCJsb2FkIHNwcml0ZSBcIiArIHNwcml0ZURhdGEua2V5ICsgXCIgZnJvbSBDYWNoZVwiKTtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnV0dXJlLmV4ZWNTdWNjZXNzKCk7XHJcbiAgICAgICAgfSwgMSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIFV0aWxzLmxvZyhcInNwcml0ZSBcIiArIHNwcml0ZURhdGEua2V5ICsgXCJsb2FkZWRcIik7XHJcbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gaW1nLndpZHRoO1xyXG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodDtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaW1nLCAwLCAwKTtcclxuICAgICAgICAgICAgc3ByaXRlQ2FjaGVbc3ByaXRlRGF0YS5rZXldID0gY2FudmFzO1xyXG4gICAgICAgICAgICBmdXR1cmUuZXhlY1N1Y2Nlc3MoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGltZy5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICBVdGlscy5sb2coXCJjb3VsZCBub3QgbG9hZCBpbWcgXCIgKyBzcHJpdGVEYXRhLmtleSwgZXJyKTtcclxuICAgICAgICAgICAgZnV0dXJlLmV4ZWNGYWlsdXJlKGVycik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBzcHJpdGVEYXRhLmJhc2U2NCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgVXRpbHMubG9nKFwibG9hZCBzcHJpdGUgXCIgKyBzcHJpdGVEYXRhLmtleSArIFwiIGZyb20gYmFzZTY0XCIpO1xyXG4gICAgICAgICAgICBpbWcuc3JjID0gc3ByaXRlRGF0YS5iYXNlNjQ7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgVXRpbHMubG9nKFwibG9hZCBzcHJpdGUgXCIgKyBzcHJpdGVEYXRhLmtleSArIFwiIGZyb20gVVJMOiBcIiArIHNwcml0ZURhdGEudXJsKTtcclxuICAgICAgICAgICAgaW1nLnNyYyA9IHNwcml0ZURhdGEuc3JjO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuLy8gUCBVIEIgTCBJIENcclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICAgIHB1dDogZnVuY3Rpb24gKHNwcml0ZURhdGEpIHtcclxuICAgICAgICB2YXIgZnV0dXJlO1xyXG5cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzcHJpdGVEYXRhKSkge1xyXG4gICAgICAgICAgICBmdXR1cmUgPSBGdXR1cmUuY3JlYXRlKHRoaXMsIHNwcml0ZURhdGEubGVuZ3RoLCBTUFJJVEVfTE9BRF9USU1FT1VUKTtcclxuICAgICAgICAgICAgc3ByaXRlRGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICBsb2FkU3ByaXRlKGVsZW1lbnQsIGZ1dHVyZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZ1dHVyZSA9IEZ1dHVyZS5jcmVhdGUoKTtcclxuICAgICAgICAgICAgbG9hZFNwcml0ZShzcHJpdGVEYXRhLCBmdXR1cmUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZ1dHVyZTtcclxuICAgIH1cclxuXHJcbn07IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDIvMjQvMjAxNS5cclxuICovXHJcblxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xyXG4vL3ZhciBGdXR1cmUgPSByZXF1aXJlKCdmdXR1cmUtY2FsbGJhY2tzJyk7XHJcblxyXG52YXIgU2NlbmUgPSByZXF1aXJlKCcuL1NjZW5lLmpzJyk7XHJcblxyXG4vKipcclxuICpcclxuICogQHBhcmFtIGRvbUlkIHtTdHJpbmd9XHJcbiAqIEBwYXJhbSBvcHRpb25zXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gUmVuZGVyZXIoZG9tSWQsIG9wdGlvbnMpIHtcclxuICAgIGlmICghVXRpbHMuaXNTdHJpbmcoZG9tSWQpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRG9tSUQgbXVzdCBiZSBhIFN0cmluZ1wiKTtcclxuICAgIH1cclxuICAgIGlmICghVXRpbHMuaXNEZWZpbmVkKG9wdGlvbnMpKSB7XHJcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB2ZXJib3NlID0gKFwidmVyYm9zZVwiIGluIG9wdGlvbnMpID8gb3B0aW9ucy52ZXJib3NlIDogZmFsc2U7XHJcblxyXG4gICAgdmFyIHBhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRvbUlkKTtcclxuICAgIHZhciBwb3NpdGlvbiA9IHBhcmVudC5zdHlsZS5wb3NpdGlvbjtcclxuICAgIGlmIChwb3NpdGlvbi5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBwYXJlbnQuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IHBhcmVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICBjYW52YXMud2lkdGggPSBwYXJlbnQuY2xpZW50V2lkdGg7XHJcblxyXG4gICAgdGhpcy5tb3VzZVBvc2l0aW9uID0ge1xyXG4gICAgICAgIHg6IDAsXHJcbiAgICAgICAgeTogMFxyXG4gICAgfTtcclxuICAgIHRoaXMuZGltZW5zaW9uID0ge1xyXG4gICAgICAgIHc6IHBhcmVudC5jbGllbnRXaWR0aCxcclxuICAgICAgICBoOiBwYXJlbnQuY2xpZW50SGVpZ2h0XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc3RhdGUgPSBudWxsO1xyXG4gICAgaWYgKHZlcmJvc2UgJiYgdHlwZW9mIFN0YXRlICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHRoaXMuc3RhdHMgPSBuZXcgU3RhdGUoKTtcclxuICAgICAgICB0aGlzLnN0YXRzLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgIHRoaXMuc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gJzBweCc7XHJcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnRvcCA9ICcwcHgnO1xyXG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZCh0aGlzLnN0YXRzLmRvbUVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGNhbnZhcyk7XHJcblxyXG5cclxuXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAdHlwZSB7T2JqZWN0fSB7XHJcbiAqICAgICAgc2NlbmVfbmFtZSA6IHsgLi4uIH1cclxuICogfVxyXG4gKi9cclxudmFyIHNjZW5lQ2FjaGUgPSB7fTtcclxuXHJcbi8qKlxyXG4gKlxyXG4gKiBAcGFyYW0gbmFtZVxyXG4gKiBAcGFyYW0gb3B0aW9uc1xyXG4gKiBAcmV0dXJucyB7U2NlbmV8Kn1cclxuICovXHJcblJlbmRlcmVyLnByb3RvdHlwZS5wdXRTY2VuZSA9IGZ1bmN0aW9uIChuYW1lLCBvcHRpb25zKSB7XHJcbiAgICB2YXIgZnV0dXJlID0gRnV0dXJlLmNyZWF0ZSgpO1xyXG4gICAgaWYgKG5hbWUgaW4gc2NlbmVDYWNoZSkge1xyXG4gICAgICAgIGZ1dHVyZS5leGVjU3VjY2VzcyhzY2VuZUNhY2hlW25hbWVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIHNjZW5lID0gbmV3IFNjZW5lKG9wdGlvbnMsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnV0dXJlLmV4ZWNTdWNjZXNzKHNjZW5lKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBzY2VuZUNhY2hlW25hbWVdID0gc2NlbmU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZnV0dXJlO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjtcclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDIvMjQvMjAxNS5cclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFV0aWxzID0gcmVxdWlyZSgneXV0aWxzJyk7XHJcblxyXG4vKipcclxuICogQHBhcmFtIG9wdGlvbnNcclxuICogQHBhcmFtIGNhbGxiYWNrIHtmdW5jdGlvbn1cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBTY2VuZShvcHRpb25zLCBjYWxsYmFjaykge1xyXG4gICAgVXRpbHMuYXNzZXJ0TGVuZ3RoKGFyZ3VtZW50cywgMik7XHJcbiAgICBpZiAoXCJtYXBcIiBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gTE9BRCBGUk9NIE1BUFxyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gREVGQVVMVFxyXG5cclxuICAgIH1cclxufTtcclxuXHJcblNjZW5lLnByb3RvdHlwZS5wbGF5ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJwbGF5IHNjZW5lXCIpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMi8yNC8yMDE1LlxyXG4gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgU2NlbmUgPSByZXF1aXJlKCcuL1NjZW5lLmpzJyk7XHJcbnZhciBVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xyXG5cclxudmFyIGNhY2hlID0ge307XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSBuYW1lIHtTdHJpbmd9IHVuaXF1ZSBpZGVudGlmaWVyXHJcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyB7T2JqZWN0fVxyXG4gICAgICogQHJldHVybnMge1NjZW5lfVxyXG4gICAgICovXHJcbiAgICBjcmVhdGU6IGZ1bmN0aW9uIChuYW1lLCBvcHRpb25zKSB7XHJcbiAgICAgICAgVXRpbHMuYXNzZXJ0TGVuZ3RoKGFyZ3VtZW50cywgMik7XHJcbiAgICAgICAgaWYgKCFVdGlscy5pc1N0cmluZyhuYW1lKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmaXJzdCBwYXJhbWV0ZXIgbXVzdCBiZSBhIHN0cmluZ1wiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHNjZW5lID0gbmV3IFNjZW5lKG9wdGlvbnMpO1xyXG4gICAgICAgIGNhY2hlW25hbWVdID0gc2NlbmU7XHJcbiAgICAgICAgcmV0dXJuIHNjZW5lO1xyXG4gICAgfVxyXG5cclxufTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBqdWxpYW4gb24gMi8yMi8xNS5cclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFNjZW5lTG9hZGVyID0gcmVxdWlyZSgnLi9TY2VuZUxvYWRlci5qcycpO1xyXG52YXIgUmVuZGVyZXIgPSByZXF1aXJlKCcuL1JlbmRlcmVyLmpzJyk7XHJcbnZhciBEYXRhU3RvcmUgPSByZXF1aXJlKCcuL0RhdGFTdG9yZS5qcycpO1xyXG5cclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4vLyBTIE0gSSBMIEFcclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGRlYnVnOiBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coc3RyKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1NjZW5lTG9hZGVyfVxyXG4gICAgICovXHJcbiAgICBzY2VuZUxvYWRlciA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gU2NlbmVMb2FkZXI7XHJcbiAgICB9LFxyXG5cclxuICAgIGRhdGFTdG9yZSA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gRGF0YVN0b3JlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gZG9tSWRcclxuICAgICAqIEBwYXJhbSBvcHRpb25zXHJcbiAgICAgKiBAcmV0dXJucyB7UmVuZGVyZXJ9XHJcbiAgICAgKi9cclxuICAgIHJlbmRlcmVyIDogZnVuY3Rpb24gKGRvbUlkLCBvcHRpb25zKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJlcihkb21JZCwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG59IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDMvMi8yMDE1LlxyXG4gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGxvZzogZnVuY3Rpb24gKHN0ciwgZGF0YSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coc3RyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzdHIsIGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAzLzEvMjAxNS5cclxuICovXHJcbmZ1bmN0aW9uIEZ1dHVyZShvYmosIG1heENvdW50LCB0aW1lb3V0KSB7XHJcbiAgICB0aGlzLm9iaiA9IHR5cGVvZiBvYmogPT09IFwidW5kZWZpbmVkXCIgPyB7fSA6IG9iajtcclxuICAgIHRoaXMuc3VjY2Vzc0hhbmRsZXIgPSBudWxsO1xyXG4gICAgdGhpcy5mYWlsdXJlSGFuZGxlciA9IG51bGw7XHJcbiAgICB0aGlzLmZpbmFsbHlIYW5kbGVyID0gbnVsbDtcclxuICAgIHRoaXMuZmluYWxseUNvdW50ID0gMDtcclxuICAgIHRoaXMudGltZW91dCA9IDA7XHJcbiAgICBpZiAodHlwZW9mIG1heENvdW50ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGltZW91dCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0aW1lb3V0IG11c3QgYmUgZGVmaW5lZCEnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gdGltZW91dDtcclxuICAgICAgICB0aGlzLm1heENvdW50ID0gbWF4Q291bnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubWF4Q291bnQgPSAxO1xyXG4gICAgfVxyXG4gICAgdGhpcy50aW1lb3V0VGhyZWFkID0gbnVsbDtcclxufTtcclxuXHJcbkZ1dHVyZS5wcm90b3R5cGUuZXhlY1N1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuICAgIGlmICh0aGlzLnN1Y2Nlc3NIYW5kbGVyID09PSBudWxsKSB7XHJcbiAgICAgICAgLy8gZGVsZWdhdGUgYSBzZWNvbmQgdHJ5XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxmLnN1Y2Nlc3NIYW5kbGVyID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJzdWNjZXNzIG9uIGZ1bmN0aW9uIHdpdGggbm8gc3VjY2VzcyBoYW5kbGVyXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZShzZWxmLCBcInN1Y2Nlc3NIYW5kbGVyXCIsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgMSk7IC8vIE5FWFQgRVhFQ1VUSU9OXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGV4ZWN1dGUodGhpcywgXCJzdWNjZXNzSGFuZGxlclwiLCBhcmd1bWVudHMpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gZXhlY3V0ZShmdXR1cmUsIGhhbmRsZXJOYW1lLCBhcmdzKSB7XHJcbiAgICBmdXR1cmUuZmluYWxseUNvdW50ICs9IDE7XHJcbiAgICBmdXR1cmVbaGFuZGxlck5hbWVdLmFwcGx5KGZ1dHVyZS5vYmosIGFyZ3MpO1xyXG4gICAgaWYgKGZ1dHVyZS5maW5hbGx5Q291bnQgPT09IGZ1dHVyZS5tYXhDb3VudCAmJiBmdXR1cmUuZmluYWxseUhhbmRsZXIgIT09IG51bGwpIHtcclxuICAgICAgICBjbGVhckludGVydmFsKGZ1dHVyZS50aW1lb3V0VGhyZWFkKTtcclxuICAgICAgICBmdXR1cmUuZmluYWxseUhhbmRsZXIuY2FsbChmdXR1cmUub2JqKTtcclxuICAgICAgICBmdXR1cmUuc3VjY2Vzc0hhbmRsZXIgPSBudWxsO1xyXG4gICAgICAgIGZ1dHVyZS5mYWlsdXJlSGFuZGxlciA9IG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbkZ1dHVyZS5wcm90b3R5cGUuZXhlY0ZhaWx1cmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuICAgIGlmICh0aGlzLmZhaWx1cmVIYW5kbGVyID09IG51bGwpIHtcclxuICAgICAgICAvLyBkZWxlZ2F0ZSBhIHNlY29uZCB0cnlcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGYuZmFpbHVyZUhhbmRsZXIgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVuaGFuZGxlZCBmYWlsdXJlXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZSh0aGlzLCBcImZhaWx1cmVIYW5kbGVyXCIsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgMSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGV4ZWN1dGUodGhpcywgXCJmYWlsdXJlSGFuZGxlclwiLCBhcmd1bWVudHMpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuRnV0dXJlLnByb3RvdHlwZS5zdWNjZXNzID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICBpZiAodGhpcy5zdWNjZXNzSGFuZGxlciA9PSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5zdWNjZXNzSGFuZGxlciA9IGNhbGxiYWNrO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0ZW5lciBpcyBhbHJlYWR5IHNldCFcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbkZ1dHVyZS5wcm90b3R5cGUuZmFpbHVyZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgaWYgKHRoaXMuZmFpbHVyZUhhbmRsZXIgPT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMuZmFpbHVyZUhhbmRsZXIgPSBjYWxsYmFjaztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTGlzdGVuZXIgaXMgYWxyZWFkeSBzZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5GdXR1cmUucHJvdG90eXBlLmZpbmFsbHkgPSBmdW5jdGlvbiAoYSwgYiwgYykge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgaWYgKHRoaXMuZmluYWxseUhhbmRsZXIgIT0gbnVsbCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkxpc3RlbmVyIGlzIGFscmVhZHkgc2V0IVwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oYSkpIHtcclxuICAgICAgICAgICAgdGhpcy5maW5hbGx5SGFuZGxlciA9IGE7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRUaHJlYWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmZpbmFsbHlIYW5kbGVyLmNhbGwoc2VsZi5vYmopO1xyXG4gICAgICAgICAgICAgICAgfSwgdGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9IGVsc2UgaWYgKGlzTnVtYmVyKGEpICYmIGEgPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWF4Q291bnQgPSBhO1xyXG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIoYikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dFRocmVhZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZmluYWxseUhhbmRsZXIuY2FsbChzZWxmLm9iaik7XHJcbiAgICAgICAgICAgICAgICB9LCBiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRpbWVvdXQgcGFyYW1ldGVyIGlzIG1pc3NpbmchXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKGMpKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmZpbmFsbHlIYW5kbGVyID0gYztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRUaHJlYWQpO1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uIVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImZpcnN0IHBhcmFtIG11c3QgYmUgbnVtYmVyIG9yIGZ1bmN0aW9uIVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBpc051bWJlcihuKSB7XHJcbiAgICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGZ1bmN0aW9uVG9DaGVjaykge1xyXG4gICAgdmFyIGdldFR5cGUgPSB7fTtcclxuICAgIHJldHVybiBmdW5jdGlvblRvQ2hlY2sgJiYgZ2V0VHlwZS50b1N0cmluZy5jYWxsKGZ1bmN0aW9uVG9DaGVjaykgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIChvYmosIGksIHQpIHtcclxuICAgIHJldHVybiBuZXcgRnV0dXJlKG9iaiwgaSwgdCk7XHJcbn07IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDEyLzEwLzIwMTQuXHJcbiAqL1xyXG4oZnVuY3Rpb24gKGV4cG9ydHMpIHtcclxuXHJcbiAgICAvLyBwZXJmb3JtYW5jZS5ub3cgcG9seWZpbGxcclxuICAgIHZhciBwZXJmID0gbnVsbDtcclxuICAgIGlmICh0eXBlb2YgcGVyZm9ybWFuY2UgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgcGVyZiA9IHt9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBwZXJmID0gcGVyZm9ybWFuY2U7XHJcbiAgICB9XHJcblxyXG4gICAgcGVyZi5ub3cgPSBwZXJmLm5vdyB8fCBwZXJmLm1vek5vdyB8fCBwZXJmLm1zTm93IHx8IHBlcmYub05vdyB8fCBwZXJmLndlYmtpdE5vdyB8fCBEYXRlLm5vdyB8fFxyXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gc3dhcChhcnJheSwgaSwgaikge1xyXG4gICAgICAgIGlmIChpICE9PSBqKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wID0gYXJyYXlbaV07XHJcbiAgICAgICAgICAgIGFycmF5W2ldID0gYXJyYXlbal07XHJcbiAgICAgICAgICAgIGFycmF5W2pdID0gdGVtcDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICB+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+flxyXG4gICAgICovXHJcblxyXG4gICAgdmFyIGdldFJhbmRvbUludCA9IGV4cG9ydHMuZ2V0UmFuZG9tSW50ID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7XHJcbiAgICAgICAgaWYgKG1pbiA+IG1heCkgdGhyb3cgbmV3IEVycm9yKFwibWluIG11c3QgYmUgc21hbGxlciB0aGFuIG1heCEge1wiICsgbWluICsgXCI+XCIgKyBtYXggKyBcIn1cIik7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XHJcbiAgICB9O1xyXG5cclxuICAgIGV4cG9ydHMuc2FtcGxlID0gZnVuY3Rpb24gKGxpc3QsIG4pIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sIGosIGkgPSAwLCBMID0gbiA+IGxpc3QubGVuZ3RoID8gbGlzdC5sZW5ndGggOiBuLCBzID0gbGlzdC5sZW5ndGggLSAxO1xyXG4gICAgICAgIGZvciAoOyBpIDwgTDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGogPSBnZXRSYW5kb21JbnQoaSwgcyk7XHJcbiAgICAgICAgICAgIHN3YXAobGlzdCwgaSwgaik7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGxpc3RbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgaXNTdHJpbmcgPSBleHBvcnRzLmlzU3RyaW5nID0gZnVuY3Rpb24gKG15VmFyKSB7XHJcbiAgICAgICAgcmV0dXJuICh0eXBlb2YgbXlWYXIgPT09ICdzdHJpbmcnIHx8IG15VmFyIGluc3RhbmNlb2YgU3RyaW5nKVxyXG4gICAgfTtcclxuXHJcbiAgICBleHBvcnRzLmFzc2VydExlbmd0aCA9IGZ1bmN0aW9uIChhcmcsIG5icikge1xyXG4gICAgICAgIGlmIChhcmcubGVuZ3RoID09PSBuYnIpIHJldHVybiB0cnVlO1xyXG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiV3JvbmcgbnVtYmVyIG9mIGFyZ3VtZW50czogZXhwZWN0ZWQ6XCIgKyBuYnIgKyBcIiwgYnV0IGdvdDogXCIgKyBhcmcubGVuZ3RoKTtcclxuICAgIH07XHJcblxyXG4gICAgZXhwb3J0cy5ndWlkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBkID0gcGVyZi5ub3coKTtcclxuICAgICAgICB2YXIgZ3VpZCA9ICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcclxuICAgICAgICAgICAgdmFyIHIgPSAoZCArIE1hdGgucmFuZG9tKCkgKiAxNikgJSAxNiB8IDA7XHJcbiAgICAgICAgICAgIGQgPSBNYXRoLmZsb29yKGQgLyAxNik7XHJcbiAgICAgICAgICAgIHJldHVybiAoYyA9PT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KSkudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBndWlkO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHBvcnRzLnRpbWVEaWZmZXJlbmNlSW5NcyA9IGZ1bmN0aW9uICh0c0EsIHRzQikge1xyXG4gICAgICAgIGlmICh0c0EgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgICAgIHRzQSA9IHRzQS5nZXRUaW1lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0c0IgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgICAgIHRzQiA9IHRzQi5nZXRUaW1lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBNYXRoLmFicyh0c0EgLSB0c0IpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIG1pbGxpc2Vjb25kcyB0byBzZWNvbmRzXHJcbiAgICAgKiBAcGFyYW0gbXMge051bWJlcn0gTWlsbGlzXHJcbiAgICAgKi9cclxuICAgIGV4cG9ydHMubXNUb1MgPSBmdW5jdGlvbiAobXMpIHtcclxuICAgICAgICByZXR1cm4gbXMgLyAxMDAwO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHBvcnRzLmlzRGVmaW5lZCA9IGZ1bmN0aW9uIChvKSB7XHJcbiAgICAgICAgaWYgKG8gPT09IG51bGwpIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAodHlwZW9mIG8gPT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBmYWxzZTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaGFsbG93IGNsb25lXHJcbiAgICAgKiBAcGFyYW0gbGlzdFxyXG4gICAgICogQHJldHVybnMge0FycmF5fHN0cmluZ3xCbG9ifVxyXG4gICAgICovXHJcbiAgICBleHBvcnRzLmNsb25lQXJyYXkgPSBmdW5jdGlvbiAobGlzdCkge1xyXG4gICAgICAgIHJldHVybiBsaXN0LnNsaWNlKDApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlbW92ZXMgdGhlIGl0ZW0gYXQgdGhlIHBvc2l0aW9uIGFuZCByZWluZGV4ZXMgdGhlIGxpc3RcclxuICAgICAqIEBwYXJhbSBsaXN0XHJcbiAgICAgKiBAcGFyYW0gaVxyXG4gICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgKi9cclxuICAgIGV4cG9ydHMuZGVsZXRlUG9zaXRpb24gPSBmdW5jdGlvbiAobGlzdCwgaSkge1xyXG4gICAgICAgIGlmIChpIDwgMCB8fCBpID49IGxpc3QubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoXCJPdXQgb2YgYm91bmRzXCIpO1xyXG4gICAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xyXG4gICAgICAgIHJldHVybiBsaXN0O1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrcyB3ZWF0aGVyIHRoZSB0aGUgb2JqZWN0IGltcGxlbWVudHMgdGhlIGZ1bGwgaW50ZXJmYWNlIG9yIG5vdFxyXG4gICAgICogQHBhcmFtIG8ge09iamVjdH1cclxuICAgICAqL1xyXG4gICAgdmFyIGltcGxlbWVudHMgPSBleHBvcnRzLmltcGxlbWVudHMgPSBmdW5jdGlvbiAobywgYSkge1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpbXBsZW1lbnRzLmFwcGx5KHt9LCBbb10uY29uY2F0KGEpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGkgPSAxLCBtZXRob2ROYW1lO1xyXG4gICAgICAgIHdoaWxlICgobWV0aG9kTmFtZSA9IGFyZ3VtZW50c1tpKytdKSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9bbWV0aG9kTmFtZV0gIT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgaXNOdW1iZXIgPSBleHBvcnRzLmlzTnVtYmVyID0gZnVuY3Rpb24gKG8pIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcobykpIHJldHVybiBmYWxzZTtcclxuICAgICAgICByZXR1cm4gIWlzTmFOKG8gLSAwKSAmJiBvICE9PSBudWxsICYmIHR5cGVvZiBvICE9PSAndW5kZWZpbmVkJyAmJiBvICE9PSBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gbm90KGwpIHtcclxuICAgICAgICByZXR1cm4gIWw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVja3MgaWYgdGhlIG9iamVjdCBlcXVhbHMgdGhlIGRlZmluaXRpb25cclxuICAgICAqIEBwYXJhbSBvYmoge09iamVjdH1cclxuICAgICAqIEBwYXJhbSBkZWZpbml0aW9uIHtPYmplY3R9IHtcclxuICAgICAqICAgICAgJ2tleTEnOiBTdHJpbmcsXHJcbiAgICAgKiAgICAgICdrZXkyJzogQW55Q2xhc3MsXHJcbiAgICAgKiAgICAgICdrZXkzJzogTnVtYmVyXHJcbiAgICAgKlxyXG4gICAgICogfVxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHZhciBkZWZpbmVzID0gZXhwb3J0cy5kZWZpbmVzID0gZnVuY3Rpb24gKG9iaiwgZGVmaW5pdGlvbikge1xyXG4gICAgICAgIHZhciBrZXkgPSBudWxsLCB0eXBlLCBpID0gMCwgTDtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgICAgIEwgPSBvYmoubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDtpPEw7aSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWRlZmluZXMob2JqW2ldLCBkZWZpbml0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZvciAoa2V5IGluIGRlZmluaXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHR5cGUgPSBkZWZpbml0aW9uW2tleV07XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFN0cmluZzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vdChpc1N0cmluZyhvYmpba2V5XSkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdvYmplY3RAJyArIGtleSArICcgZG9lcyBub3QgaW1wbGVtZW50ICcgKyB0eXBlICsgJzonLCBvYmopO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgTnVtYmVyOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm90KGlzTnVtYmVyKG9ialtrZXldKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ29iamVjdEAnICsga2V5ICsgJyBkb2VzIG5vdCBpbXBsZW1lbnQgJyArIHR5cGUgKyAnOicsIG9iaik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm90KG9ialtrZXldIGluc3RhbmNlb2YgdHlwZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ29iamVjdEAnICsga2V5ICsgJyBkb2VzIG5vdCBpbXBsZW1lbnQgJyArIHR5cGUgKyAnOicsIG9iaik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5oZXJpdCBzdHVmZiBmcm9tIHBhcmVudFxyXG4gICAgICogQHBhcmFtIGNoaWxkXHJcbiAgICAgKiBAcGFyYW0gcGFyZW50XHJcbiAgICAgKi9cclxuICAgIGV4cG9ydHMuaW5oZXJpdCA9IGZ1bmN0aW9uIChjaGlsZCwgcGFyZW50KSB7XHJcbiAgICAgICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShwYXJlbnQucHJvdG90eXBlKTtcclxuICAgIH07XHJcblxyXG5cclxufSkodHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gdGhpc1sneVV0aWxzJ10gPSB7fSA6IGV4cG9ydHMpOyJdfQ==
