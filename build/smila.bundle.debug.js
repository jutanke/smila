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
function Scene(options) {
    Utils.assertLength(arguments, 1);
    var self = this;
    this.readyCallbacks = [];
    this.isReady = false;
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

Scene.prototype.onready = function (callback) {
    if (this.isReady) {
        setTimeout(function () {
            callback();
        }, 1);
    } else {
        this.readyCallbacks.push(callback);
    }
};

Scene.prototype.play = function () {
    if (!this.isReady) {
        throw new Error("Scene is not ready and cannot play yet");
    }
    console.log("play scene");
};

// ==================================
// P R I V A T E
// ==================================

function applyReady(scene) {
    if (scene.isReady) {
        throw new Error("A Scene can only be ready ONCE!");
    }
    scene.isReady = true;
    Utils.executeCallbacks(scene.readyCallbacks);
}


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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImxpYi9EYXRhU3RvcmUuanMiLCJsaWIvUmVuZGVyZXIuanMiLCJsaWIvU2NlbmUuanMiLCJsaWIvU2NlbmVMb2FkZXIuanMiLCJsaWIvU21pbGEuanMiLCJsaWIvVXRpbHMuanMiLCJub2RlX21vZHVsZXMvZnV0dXJlLWNhbGxiYWNrcy9saWIvZnV0dXJlLmpzIiwibm9kZV9tb2R1bGVzL3l1dGlscy95dXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMi8yNC8yMDE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEZ1dHVyZSA9IHJlcXVpcmUoJ2Z1dHVyZS1jYWxsYmFja3MnKTtcbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMuanMnKTtcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFAgUiBJIFYgQSBUIEVcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbnZhciBzcHJpdGVDYWNoZSA9IHt9O1xuXG52YXIgU1BSSVRFX0xPQURfVElNRU9VVCA9IDIwMDA7IC8vIG1zXG5cbi8qKlxuICpcbiAqIEBwYXJhbSBzcHJpdGVEYXRhXG4gKiBAcGFyYW0gZnV0dXJlXG4gKi9cbmZ1bmN0aW9uIGxvYWRTcHJpdGUoc3ByaXRlRGF0YSwgZnV0dXJlKSB7XG4gICAgVXRpbHMubG9nKFwibG9hZGluZyBzcHJpdGUgXCIgKyBzcHJpdGVEYXRhLmtleSk7XG4gICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuXG4gICAgaWYgKHNwcml0ZURhdGEua2V5IGluIHNwcml0ZUNhY2hlKSB7XG4gICAgICAgIFV0aWxzLmxvZyhcImxvYWQgc3ByaXRlIFwiICsgc3ByaXRlRGF0YS5rZXkgKyBcIiBmcm9tIENhY2hlXCIpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1dHVyZS5leGVjU3VjY2VzcygpO1xuICAgICAgICB9LCAxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgVXRpbHMubG9nKFwic3ByaXRlIFwiICsgc3ByaXRlRGF0YS5rZXkgKyBcImxvYWRlZFwiKTtcbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGltZy53aWR0aDtcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpbWcuaGVpZ2h0O1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGltZywgMCwgMCk7XG4gICAgICAgICAgICBzcHJpdGVDYWNoZVtzcHJpdGVEYXRhLmtleV0gPSBjYW52YXM7XG4gICAgICAgICAgICBmdXR1cmUuZXhlY1N1Y2Nlc3MoKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBVdGlscy5sb2coXCJjb3VsZCBub3QgbG9hZCBpbWcgXCIgKyBzcHJpdGVEYXRhLmtleSwgZXJyKTtcbiAgICAgICAgICAgIGZ1dHVyZS5leGVjRmFpbHVyZShlcnIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0eXBlb2Ygc3ByaXRlRGF0YS5iYXNlNjQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBVdGlscy5sb2coXCJsb2FkIHNwcml0ZSBcIiArIHNwcml0ZURhdGEua2V5ICsgXCIgZnJvbSBiYXNlNjRcIik7XG4gICAgICAgICAgICBpbWcuc3JjID0gc3ByaXRlRGF0YS5iYXNlNjQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBVdGlscy5sb2coXCJsb2FkIHNwcml0ZSBcIiArIHNwcml0ZURhdGEua2V5ICsgXCIgZnJvbSBVUkw6IFwiICsgc3ByaXRlRGF0YS51cmwpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNwcml0ZURhdGEuc3JjO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gUCBVIEIgTCBJIENcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgcHV0OiBmdW5jdGlvbiAoc3ByaXRlRGF0YSkge1xuICAgICAgICB2YXIgZnV0dXJlO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNwcml0ZURhdGEpKSB7XG4gICAgICAgICAgICBmdXR1cmUgPSBGdXR1cmUuY3JlYXRlKHRoaXMsIHNwcml0ZURhdGEubGVuZ3RoLCBTUFJJVEVfTE9BRF9USU1FT1VUKTtcbiAgICAgICAgICAgIHNwcml0ZURhdGEuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGxvYWRTcHJpdGUoZWxlbWVudCwgZnV0dXJlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnV0dXJlID0gRnV0dXJlLmNyZWF0ZSgpO1xuICAgICAgICAgICAgbG9hZFNwcml0ZShzcHJpdGVEYXRhLCBmdXR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1dHVyZTtcbiAgICB9XG5cbn07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xuLy92YXIgRnV0dXJlID0gcmVxdWlyZSgnZnV0dXJlLWNhbGxiYWNrcycpO1xuXG52YXIgU2NlbmUgPSByZXF1aXJlKCcuL1NjZW5lLmpzJyk7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBkb21JZCB7U3RyaW5nfVxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBSZW5kZXJlcihkb21JZCwgb3B0aW9ucykge1xuICAgIGlmICghVXRpbHMuaXNTdHJpbmcoZG9tSWQpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRvbUlEIG11c3QgYmUgYSBTdHJpbmdcIik7XG4gICAgfVxuICAgIGlmICghVXRpbHMuaXNEZWZpbmVkKG9wdGlvbnMpKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICB2YXIgdmVyYm9zZSA9IChcInZlcmJvc2VcIiBpbiBvcHRpb25zKSA/IG9wdGlvbnMudmVyYm9zZSA6IGZhbHNlO1xuXG4gICAgdmFyIHBhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRvbUlkKTtcbiAgICB2YXIgcG9zaXRpb24gPSBwYXJlbnQuc3R5bGUucG9zaXRpb247XG4gICAgaWYgKHBvc2l0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBwYXJlbnQuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XG4gICAgfVxuXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBwYXJlbnQuY2xpZW50SGVpZ2h0O1xuICAgIGNhbnZhcy53aWR0aCA9IHBhcmVudC5jbGllbnRXaWR0aDtcblxuICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgIH07XG4gICAgdGhpcy5kaW1lbnNpb24gPSB7XG4gICAgICAgIHc6IHBhcmVudC5jbGllbnRXaWR0aCxcbiAgICAgICAgaDogcGFyZW50LmNsaWVudEhlaWdodFxuICAgIH07XG5cbiAgICB0aGlzLnN0YXRlID0gbnVsbDtcbiAgICBpZiAodmVyYm9zZSAmJiB0eXBlb2YgU3RhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuc3RhdHMgPSBuZXcgU3RhdGUoKTtcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAnMHB4JztcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnRvcCA9ICcwcHgnO1xuICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodGhpcy5zdGF0cy5kb21FbGVtZW50KTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cblxuXG59XG5cbi8qKlxuICogQHR5cGUge09iamVjdH0ge1xuICogICAgICBzY2VuZV9uYW1lIDogeyAuLi4gfVxuICogfVxuICovXG52YXIgc2NlbmVDYWNoZSA9IHt9O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0gbmFtZVxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEByZXR1cm5zIHtTY2VuZXwqfVxuICovXG5SZW5kZXJlci5wcm90b3R5cGUucHV0U2NlbmUgPSBmdW5jdGlvbiAobmFtZSwgb3B0aW9ucykge1xuICAgIHZhciBmdXR1cmUgPSBGdXR1cmUuY3JlYXRlKCk7XG4gICAgaWYgKG5hbWUgaW4gc2NlbmVDYWNoZSkge1xuICAgICAgICBmdXR1cmUuZXhlY1N1Y2Nlc3Moc2NlbmVDYWNoZVtuYW1lXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHNjZW5lID0gbmV3IFNjZW5lKG9wdGlvbnMsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1dHVyZS5leGVjU3VjY2VzcyhzY2VuZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBzY2VuZUNhY2hlW25hbWVdID0gc2NlbmU7XG4gICAgfVxuICAgIHJldHVybiBmdXR1cmU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAyLzI0LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgVXRpbHMgPSByZXF1aXJlKCd5dXRpbHMnKTtcblxuLyoqXG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQHBhcmFtIGNhbGxiYWNrIHtmdW5jdGlvbn1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBTY2VuZShvcHRpb25zKSB7XG4gICAgVXRpbHMuYXNzZXJ0TGVuZ3RoKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMucmVhZHlDYWxsYmFja3MgPSBbXTtcbiAgICB0aGlzLmlzUmVhZHkgPSBmYWxzZTtcbiAgICBpZiAoXCJtYXBcIiBpbiBvcHRpb25zKSB7XG4gICAgICAgIC8vIExPQUQgRlJPTSBNQVBcblxuICAgICAgICAvLyBkZWR1Y3QgbWFwIHR5cGVcblxuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gREVGQVVMVFxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFwcGx5UmVhZHkoc2VsZik7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cbn1cblxuU2NlbmUucHJvdG90eXBlLm9ucmVhZHkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5pc1JlYWR5KSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZWFkeUNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59O1xuXG5TY2VuZS5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNSZWFkeSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTY2VuZSBpcyBub3QgcmVhZHkgYW5kIGNhbm5vdCBwbGF5IHlldFwiKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJwbGF5IHNjZW5lXCIpO1xufTtcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gUCBSIEkgViBBIFQgRVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBhcHBseVJlYWR5KHNjZW5lKSB7XG4gICAgaWYgKHNjZW5lLmlzUmVhZHkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSBTY2VuZSBjYW4gb25seSBiZSByZWFkeSBPTkNFIVwiKTtcbiAgICB9XG4gICAgc2NlbmUuaXNSZWFkeSA9IHRydWU7XG4gICAgVXRpbHMuZXhlY3V0ZUNhbGxiYWNrcyhzY2VuZS5yZWFkeUNhbGxiYWNrcyk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDIvMjQvMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBTY2VuZSA9IHJlcXVpcmUoJy4vU2NlbmUuanMnKTtcbnZhciBVdGlscyA9IHJlcXVpcmUoJ3l1dGlscycpO1xuXG52YXIgY2FjaGUgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gbmFtZSB7U3RyaW5nfSB1bmlxdWUgaWRlbnRpZmllclxuICAgICAqIEBwYXJhbSBvcHRpb25zIHtPYmplY3R9XG4gICAgICogQHJldHVybnMge1NjZW5lfVxuICAgICAqL1xuICAgIGNyZWF0ZTogZnVuY3Rpb24gKG5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgVXRpbHMuYXNzZXJ0TGVuZ3RoKGFyZ3VtZW50cywgMik7XG4gICAgICAgIGlmICghVXRpbHMuaXNTdHJpbmcobmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImZpcnN0IHBhcmFtZXRlciBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzY2VuZSA9IG5ldyBTY2VuZShvcHRpb25zKTtcbiAgICAgICAgY2FjaGVbbmFtZV0gPSBzY2VuZTtcbiAgICAgICAgcmV0dXJuIHNjZW5lO1xuICAgIH1cblxufTsiLCIvKipcbiAqIENyZWF0ZWQgYnkganVsaWFuIG9uIDIvMjIvMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgU2NlbmVMb2FkZXIgPSByZXF1aXJlKCcuL1NjZW5lTG9hZGVyLmpzJyk7XG52YXIgUmVuZGVyZXIgPSByZXF1aXJlKCcuL1JlbmRlcmVyLmpzJyk7XG52YXIgRGF0YVN0b3JlID0gcmVxdWlyZSgnLi9EYXRhU3RvcmUuanMnKTtcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gUyBNIEkgTCBBXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBkZWJ1ZzogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBjb25zb2xlLmxvZyhzdHIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtTY2VuZUxvYWRlcn1cbiAgICAgKi9cbiAgICBzY2VuZUxvYWRlciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFNjZW5lTG9hZGVyO1xuICAgIH0sXG5cbiAgICBkYXRhU3RvcmUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBEYXRhU3RvcmU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGRvbUlkXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7UmVuZGVyZXJ9XG4gICAgICovXG4gICAgcmVuZGVyZXIgOiBmdW5jdGlvbiAoZG9tSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJlcihkb21JZCwgb3B0aW9ucyk7XG4gICAgfVxuXG59IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiAzLzIvMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvZzogZnVuY3Rpb24gKHN0ciwgZGF0YSkge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzdHIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coc3RyLCBkYXRhKTtcbiAgICAgICAgfVxuICAgIH1cbn0iLCIvKipcclxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMy8xLzIwMTUuXHJcbiAqL1xyXG5mdW5jdGlvbiBGdXR1cmUob2JqLCBtYXhDb3VudCwgdGltZW91dCkge1xyXG4gICAgdGhpcy5vYmogPSB0eXBlb2Ygb2JqID09PSBcInVuZGVmaW5lZFwiID8ge30gOiBvYmo7XHJcbiAgICB0aGlzLnN1Y2Nlc3NIYW5kbGVyID0gbnVsbDtcclxuICAgIHRoaXMuZmFpbHVyZUhhbmRsZXIgPSBudWxsO1xyXG4gICAgdGhpcy5maW5hbGx5SGFuZGxlciA9IG51bGw7XHJcbiAgICB0aGlzLmZpbmFsbHlDb3VudCA9IDA7XHJcbiAgICB0aGlzLnRpbWVvdXQgPSAwO1xyXG4gICAgaWYgKHR5cGVvZiBtYXhDb3VudCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRpbWVvdXQgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGltZW91dCBtdXN0IGJlIGRlZmluZWQhJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudGltZW91dCA9IHRpbWVvdXQ7XHJcbiAgICAgICAgdGhpcy5tYXhDb3VudCA9IG1heENvdW50O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLm1heENvdW50ID0gMTtcclxuICAgIH1cclxuICAgIHRoaXMudGltZW91dFRocmVhZCA9IG51bGw7XHJcbn07XHJcblxyXG5GdXR1cmUucHJvdG90eXBlLmV4ZWNTdWNjZXNzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICBpZiAodGhpcy5zdWNjZXNzSGFuZGxlciA9PT0gbnVsbCkge1xyXG4gICAgICAgIC8vIGRlbGVnYXRlIGEgc2Vjb25kIHRyeVxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZi5zdWNjZXNzSGFuZGxlciA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwic3VjY2VzcyBvbiBmdW5jdGlvbiB3aXRoIG5vIHN1Y2Nlc3MgaGFuZGxlclwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGV4ZWN1dGUoc2VsZiwgXCJzdWNjZXNzSGFuZGxlclwiLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDEpOyAvLyBORVhUIEVYRUNVVElPTlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBleGVjdXRlKHRoaXMsIFwic3VjY2Vzc0hhbmRsZXJcIiwgYXJndW1lbnRzKTtcclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGV4ZWN1dGUoZnV0dXJlLCBoYW5kbGVyTmFtZSwgYXJncykge1xyXG4gICAgZnV0dXJlLmZpbmFsbHlDb3VudCArPSAxO1xyXG4gICAgZnV0dXJlW2hhbmRsZXJOYW1lXS5hcHBseShmdXR1cmUub2JqLCBhcmdzKTtcclxuICAgIGlmIChmdXR1cmUuZmluYWxseUNvdW50ID09PSBmdXR1cmUubWF4Q291bnQgJiYgZnV0dXJlLmZpbmFsbHlIYW5kbGVyICE9PSBudWxsKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbChmdXR1cmUudGltZW91dFRocmVhZCk7XHJcbiAgICAgICAgZnV0dXJlLmZpbmFsbHlIYW5kbGVyLmNhbGwoZnV0dXJlLm9iaik7XHJcbiAgICAgICAgZnV0dXJlLnN1Y2Nlc3NIYW5kbGVyID0gbnVsbDtcclxuICAgICAgICBmdXR1cmUuZmFpbHVyZUhhbmRsZXIgPSBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5GdXR1cmUucHJvdG90eXBlLmV4ZWNGYWlsdXJlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICBpZiAodGhpcy5mYWlsdXJlSGFuZGxlciA9PSBudWxsKSB7XHJcbiAgICAgICAgLy8gZGVsZWdhdGUgYSBzZWNvbmQgdHJ5XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxmLmZhaWx1cmVIYW5kbGVyID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmhhbmRsZWQgZmFpbHVyZVwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGV4ZWN1dGUodGhpcywgXCJmYWlsdXJlSGFuZGxlclwiLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBleGVjdXRlKHRoaXMsIFwiZmFpbHVyZUhhbmRsZXJcIiwgYXJndW1lbnRzKTtcclxuICAgIH1cclxufTtcclxuXHJcbkZ1dHVyZS5wcm90b3R5cGUuc3VjY2VzcyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgaWYgKHRoaXMuc3VjY2Vzc0hhbmRsZXIgPT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMuc3VjY2Vzc0hhbmRsZXIgPSBjYWxsYmFjaztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTGlzdGVuZXIgaXMgYWxyZWFkeSBzZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5GdXR1cmUucHJvdG90eXBlLmZhaWx1cmUgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgIGlmICh0aGlzLmZhaWx1cmVIYW5kbGVyID09IG51bGwpIHtcclxuICAgICAgICB0aGlzLmZhaWx1cmVIYW5kbGVyID0gY2FsbGJhY2s7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkxpc3RlbmVyIGlzIGFscmVhZHkgc2V0IVwiKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuRnV0dXJlLnByb3RvdHlwZS5maW5hbGx5ID0gZnVuY3Rpb24gKGEsIGIsIGMpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIGlmICh0aGlzLmZpbmFsbHlIYW5kbGVyICE9IG51bGwpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0ZW5lciBpcyBhbHJlYWR5IHNldCFcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKGEpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmluYWxseUhhbmRsZXIgPSBhO1xyXG4gICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0VGhyZWFkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5maW5hbGx5SGFuZGxlci5jYWxsKHNlbGYub2JqKTtcclxuICAgICAgICAgICAgICAgIH0sIHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpc051bWJlcihhKSAmJiBhID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLm1heENvdW50ID0gYTtcclxuICAgICAgICAgICAgaWYgKGlzTnVtYmVyKGIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRUaHJlYWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmZpbmFsbHlIYW5kbGVyLmNhbGwoc2VsZi5vYmopO1xyXG4gICAgICAgICAgICAgICAgfSwgYik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0aW1lb3V0IHBhcmFtZXRlciBpcyBtaXNzaW5nIVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihjKSkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5maW5hbGx5SGFuZGxlciA9IGM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0VGhyZWFkKTtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiFcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmaXJzdCBwYXJhbSBtdXN0IGJlIG51bWJlciBvciBmdW5jdGlvbiFcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gaXNOdW1iZXIobikge1xyXG4gICAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNGdW5jdGlvbihmdW5jdGlvblRvQ2hlY2spIHtcclxuICAgIHZhciBnZXRUeXBlID0ge307XHJcbiAgICByZXR1cm4gZnVuY3Rpb25Ub0NoZWNrICYmIGdldFR5cGUudG9TdHJpbmcuY2FsbChmdW5jdGlvblRvQ2hlY2spID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiAob2JqLCBpLCB0KSB7XHJcbiAgICByZXR1cm4gbmV3IEZ1dHVyZShvYmosIGksIHQpO1xyXG59OyIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMTIvMTAvMjAxNC5cbiAqL1xuKGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cbiAgICAvLyBwZXJmb3JtYW5jZS5ub3cgcG9seWZpbGxcbiAgICB2YXIgcGVyZiA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcGVyZiA9IHt9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHBlcmYgPSBwZXJmb3JtYW5jZTtcbiAgICB9XG5cbiAgICBwZXJmLm5vdyA9IHBlcmYubm93IHx8IHBlcmYubW96Tm93IHx8IHBlcmYubXNOb3cgfHwgcGVyZi5vTm93IHx8IHBlcmYud2Via2l0Tm93IHx8IERhdGUubm93IHx8XG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgfTtcblxuICAgIGZ1bmN0aW9uIHN3YXAoYXJyYXksIGksIGopIHtcbiAgICAgICAgaWYgKGkgIT09IGopIHtcbiAgICAgICAgICAgIHZhciB0ZW1wID0gYXJyYXlbaV07XG4gICAgICAgICAgICBhcnJheVtpXSA9IGFycmF5W2pdO1xuICAgICAgICAgICAgYXJyYXlbal0gPSB0ZW1wO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLypcbiAgICAgfn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5cbiAgICAgKi9cblxuICAgIHZhciBnZXRSYW5kb21JbnQgPSBleHBvcnRzLmdldFJhbmRvbUludCA9IGZ1bmN0aW9uIChtaW4sIG1heCkge1xuICAgICAgICBpZiAobWluID4gbWF4KSB0aHJvdyBuZXcgRXJyb3IoXCJtaW4gbXVzdCBiZSBzbWFsbGVyIHRoYW4gbWF4ISB7XCIgKyBtaW4gKyBcIj5cIiArIG1heCArIFwifVwiKTtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XG4gICAgfTtcblxuICAgIGV4cG9ydHMuc2FtcGxlID0gZnVuY3Rpb24gKGxpc3QsIG4pIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCBqLCBpID0gMCwgTCA9IG4gPiBsaXN0Lmxlbmd0aCA/IGxpc3QubGVuZ3RoIDogbiwgcyA9IGxpc3QubGVuZ3RoIC0gMTtcbiAgICAgICAgZm9yICg7IGkgPCBMOyBpKyspIHtcbiAgICAgICAgICAgIGogPSBnZXRSYW5kb21JbnQoaSwgcyk7XG4gICAgICAgICAgICBzd2FwKGxpc3QsIGksIGopO1xuICAgICAgICAgICAgcmVzdWx0LnB1c2gobGlzdFtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgdmFyIGlzU3RyaW5nID0gZXhwb3J0cy5pc1N0cmluZyA9IGZ1bmN0aW9uIChteVZhcikge1xuICAgICAgICByZXR1cm4gKHR5cGVvZiBteVZhciA9PT0gJ3N0cmluZycgfHwgbXlWYXIgaW5zdGFuY2VvZiBTdHJpbmcpXG4gICAgfTtcblxuICAgIGV4cG9ydHMuYXNzZXJ0TGVuZ3RoID0gZnVuY3Rpb24gKGFyZywgbmJyKSB7XG4gICAgICAgIGlmIChhcmcubGVuZ3RoID09PSBuYnIpIHJldHVybiB0cnVlO1xuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcIldyb25nIG51bWJlciBvZiBhcmd1bWVudHM6IGV4cGVjdGVkOlwiICsgbmJyICsgXCIsIGJ1dCBnb3Q6IFwiICsgYXJnLmxlbmd0aCk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ3VpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGQgPSBwZXJmLm5vdygpO1xuICAgICAgICB2YXIgZ3VpZCA9ICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgIHZhciByID0gKGQgKyBNYXRoLnJhbmRvbSgpICogMTYpICUgMTYgfCAwO1xuICAgICAgICAgICAgZCA9IE1hdGguZmxvb3IoZCAvIDE2KTtcbiAgICAgICAgICAgIHJldHVybiAoYyA9PT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KSkudG9TdHJpbmcoMTYpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGd1aWQ7XG4gICAgfTtcblxuICAgIGV4cG9ydHMudGltZURpZmZlcmVuY2VJbk1zID0gZnVuY3Rpb24gKHRzQSwgdHNCKSB7XG4gICAgICAgIGlmICh0c0EgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgICB0c0EgPSB0c0EuZ2V0VGltZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0c0IgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgICB0c0IgPSB0c0IuZ2V0VGltZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLmFicyh0c0EgLSB0c0IpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBtaWxsaXNlY29uZHMgdG8gc2Vjb25kc1xuICAgICAqIEBwYXJhbSBtcyB7TnVtYmVyfSBNaWxsaXNcbiAgICAgKi9cbiAgICBleHBvcnRzLm1zVG9TID0gZnVuY3Rpb24gKG1zKSB7XG4gICAgICAgIHJldHVybiBtcyAvIDEwMDA7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuaXNEZWZpbmVkID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgaWYgKG8gPT09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKHR5cGVvZiBvID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaGFsbG93IGNsb25lXG4gICAgICogQHBhcmFtIGxpc3RcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl8c3RyaW5nfEJsb2J9XG4gICAgICovXG4gICAgZXhwb3J0cy5jbG9uZUFycmF5ID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIGxpc3Quc2xpY2UoMCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIHJlbW92ZXMgdGhlIGl0ZW0gYXQgdGhlIHBvc2l0aW9uIGFuZCByZWluZGV4ZXMgdGhlIGxpc3RcbiAgICAgKiBAcGFyYW0gbGlzdFxuICAgICAqIEBwYXJhbSBpXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgZXhwb3J0cy5kZWxldGVQb3NpdGlvbiA9IGZ1bmN0aW9uIChsaXN0LCBpKSB7XG4gICAgICAgIGlmIChpIDwgMCB8fCBpID49IGxpc3QubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoXCJPdXQgb2YgYm91bmRzXCIpO1xuICAgICAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENoZWNrcyB3ZWF0aGVyIHRoZSB0aGUgb2JqZWN0IGltcGxlbWVudHMgdGhlIGZ1bGwgaW50ZXJmYWNlIG9yIG5vdFxuICAgICAqIEBwYXJhbSBvIHtPYmplY3R9XG4gICAgICovXG4gICAgdmFyIGltcGxlbWVudHMgPSBleHBvcnRzLmltcGxlbWVudHMgPSBmdW5jdGlvbiAobywgYSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICAgICAgcmV0dXJuIGltcGxlbWVudHMuYXBwbHkoe30sIFtvXS5jb25jYXQoYSkpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpID0gMSwgbWV0aG9kTmFtZTtcbiAgICAgICAgd2hpbGUgKChtZXRob2ROYW1lID0gYXJndW1lbnRzW2krK10pKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9bbWV0aG9kTmFtZV0gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdmFyIGlzTnVtYmVyID0gZXhwb3J0cy5pc051bWJlciA9IGZ1bmN0aW9uIChvKSB7XG4gICAgICAgIGlmIChpc1N0cmluZyhvKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gIWlzTmFOKG8gLSAwKSAmJiBvICE9PSBudWxsICYmIHR5cGVvZiBvICE9PSAndW5kZWZpbmVkJyAmJiBvICE9PSBmYWxzZTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gbm90KGwpIHtcbiAgICAgICAgcmV0dXJuICFsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgb2JqZWN0IGVxdWFscyB0aGUgZGVmaW5pdGlvblxuICAgICAqIEBwYXJhbSBvYmoge09iamVjdH1cbiAgICAgKiBAcGFyYW0gZGVmaW5pdGlvbiB7T2JqZWN0fSB7XG4gICAgICogICAgICAna2V5MSc6IFN0cmluZyxcbiAgICAgKiAgICAgICdrZXkyJzogQW55Q2xhc3MsXG4gICAgICogICAgICAna2V5Myc6IE51bWJlclxuICAgICAqXG4gICAgICogfVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIHZhciBkZWZpbmVzID0gZXhwb3J0cy5kZWZpbmVzID0gZnVuY3Rpb24gKG9iaiwgZGVmaW5pdGlvbikge1xuICAgICAgICB2YXIga2V5ID0gbnVsbCwgdHlwZSwgaSA9IDAsIEw7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgICAgIEwgPSBvYmoubGVuZ3RoO1xuICAgICAgICAgICAgZm9yICg7aTxMO2krKykge1xuICAgICAgICAgICAgICAgIGlmICghZGVmaW5lcyhvYmpbaV0sIGRlZmluaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBkZWZpbml0aW9uKSB7XG4gICAgICAgICAgICAgICAgdHlwZSA9IGRlZmluaXRpb25ba2V5XTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm90KGlzU3RyaW5nKG9ialtrZXldKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdvYmplY3RAJyArIGtleSArICcgZG9lcyBub3QgaW1wbGVtZW50ICcgKyB0eXBlICsgJzonLCBvYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIE51bWJlcjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub3QoaXNOdW1iZXIob2JqW2tleV0pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ29iamVjdEAnICsga2V5ICsgJyBkb2VzIG5vdCBpbXBsZW1lbnQgJyArIHR5cGUgKyAnOicsIG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub3Qob2JqW2tleV0gaW5zdGFuY2VvZiB0eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ29iamVjdEAnICsga2V5ICsgJyBkb2VzIG5vdCBpbXBsZW1lbnQgJyArIHR5cGUgKyAnOicsIG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbmhlcml0IHN0dWZmIGZyb20gcGFyZW50XG4gICAgICogQHBhcmFtIGNoaWxkXG4gICAgICogQHBhcmFtIHBhcmVudFxuICAgICAqL1xuICAgIGV4cG9ydHMuaW5oZXJpdCA9IGZ1bmN0aW9uIChjaGlsZCwgcGFyZW50KSB7XG4gICAgICAgIGNoaWxkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUocGFyZW50LnByb3RvdHlwZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGNhbGxiYWNrc1xuICAgICAqL1xuICAgIGV4cG9ydHMuZXhlY3V0ZUNhbGxiYWNrcyA9IGZ1bmN0aW9uIChjYWxsYmFja3MpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBudWxsO1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEsIGFyZ3VtZW50cy5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpID0gMCwgTCA9IGNhbGxiYWNrcy5sZW5ndGg7XG4gICAgICAgIGlmIChhcmdzID09IG51bGwpIHtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgTDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzW2ldKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IEw7IGkrKykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cblxufSkodHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gdGhpc1sneVV0aWxzJ10gPSB7fSA6IGV4cG9ydHMpOyJdfQ==
