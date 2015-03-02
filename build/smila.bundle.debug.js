!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Smila=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Julian on 2/24/2015.
 */
var Utils = require('yutils');

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



};

module.exports = Renderer;

},{"yutils":5}],2:[function(require,module,exports){
/**
 * Created by Julian on 2/24/2015.
 */
"use strict";

var Utils = require('yutils');

/**
 * @param options
 * @constructor
 */
function Scene(options) {
    Utils.assertLength(arguments, 1);
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
},{"yutils":5}],3:[function(require,module,exports){
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
},{"./Scene.js":2,"yutils":5}],4:[function(require,module,exports){
/**
 * Created by julian on 2/22/15.
 */
"use strict";

var SceneLoader = require('./SceneLoader.js');
var Renderer = require('./Renderer.js');

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
},{"./Renderer.js":1,"./SceneLoader.js":3}],5:[function(require,module,exports){
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
},{}]},{},[4])(4)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcQmFrYVxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsImxpYlxcUmVuZGVyZXIuanMiLCJsaWJcXFNjZW5lLmpzIiwibGliXFxTY2VuZUxvYWRlci5qcyIsImxpYlxcU21pbGEuanMiLCJub2RlX21vZHVsZXNcXHl1dGlsc1xceXV0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcclxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMi8yNC8yMDE1LlxyXG4gKi9cclxudmFyIFV0aWxzID0gcmVxdWlyZSgneXV0aWxzJyk7XHJcblxyXG4vKipcclxuICpcclxuICogQHBhcmFtIGRvbUlkIHtTdHJpbmd9XHJcbiAqIEBwYXJhbSBvcHRpb25zXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gUmVuZGVyZXIoZG9tSWQsIG9wdGlvbnMpIHtcclxuICAgIGlmICghVXRpbHMuaXNTdHJpbmcoZG9tSWQpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRG9tSUQgbXVzdCBiZSBhIFN0cmluZ1wiKTtcclxuICAgIH1cclxuICAgIGlmICghVXRpbHMuaXNEZWZpbmVkKG9wdGlvbnMpKSB7XHJcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB2ZXJib3NlID0gKFwidmVyYm9zZVwiIGluIG9wdGlvbnMpID8gb3B0aW9ucy52ZXJib3NlIDogZmFsc2U7XHJcblxyXG4gICAgdmFyIHBhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRvbUlkKTtcclxuICAgIHZhciBwb3NpdGlvbiA9IHBhcmVudC5zdHlsZS5wb3NpdGlvbjtcclxuICAgIGlmIChwb3NpdGlvbi5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBwYXJlbnQuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IHBhcmVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICBjYW52YXMud2lkdGggPSBwYXJlbnQuY2xpZW50V2lkdGg7XHJcblxyXG4gICAgdGhpcy5tb3VzZVBvc2l0aW9uID0ge1xyXG4gICAgICAgIHg6IDAsXHJcbiAgICAgICAgeTogMFxyXG4gICAgfTtcclxuICAgIHRoaXMuZGltZW5zaW9uID0ge1xyXG4gICAgICAgIHc6IHBhcmVudC5jbGllbnRXaWR0aCxcclxuICAgICAgICBoOiBwYXJlbnQuY2xpZW50SGVpZ2h0XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc3RhdGUgPSBudWxsO1xyXG4gICAgaWYgKHZlcmJvc2UgJiYgdHlwZW9mIFN0YXRlICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHRoaXMuc3RhdHMgPSBuZXcgU3RhdGUoKTtcclxuICAgICAgICB0aGlzLnN0YXRzLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgIHRoaXMuc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gJzBweCc7XHJcbiAgICAgICAgdGhpcy5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnRvcCA9ICcwcHgnO1xyXG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZCh0aGlzLnN0YXRzLmRvbUVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGNhbnZhcyk7XHJcblxyXG5cclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyO1xyXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMi8yNC8yMDE1LlxyXG4gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgVXRpbHMgPSByZXF1aXJlKCd5dXRpbHMnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gb3B0aW9uc1xyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFNjZW5lKG9wdGlvbnMpIHtcclxuICAgIFV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDEpO1xyXG4gICAgaWYgKFwibWFwXCIgaW4gb3B0aW9ucykge1xyXG4gICAgICAgIC8vIExPQUQgRlJPTSBNQVBcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIERFRkFVTFRcclxuXHJcbiAgICB9XHJcbn07XHJcblxyXG5TY2VuZS5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnNvbGUubG9nKFwicGxheSBzY2VuZVwiKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2NlbmU7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDIvMjQvMjAxNS5cclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFNjZW5lID0gcmVxdWlyZSgnLi9TY2VuZS5qcycpO1xyXG52YXIgVXRpbHMgPSByZXF1aXJlKCd5dXRpbHMnKTtcclxuXHJcbnZhciBjYWNoZSA9IHt9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0gbmFtZSB7U3RyaW5nfSB1bmlxdWUgaWRlbnRpZmllclxyXG4gICAgICogQHBhcmFtIG9wdGlvbnMge09iamVjdH1cclxuICAgICAqIEByZXR1cm5zIHtTY2VuZX1cclxuICAgICAqL1xyXG4gICAgY3JlYXRlOiBmdW5jdGlvbiAobmFtZSwgb3B0aW9ucykge1xyXG4gICAgICAgIFV0aWxzLmFzc2VydExlbmd0aChhcmd1bWVudHMsIDIpO1xyXG4gICAgICAgIGlmICghVXRpbHMuaXNTdHJpbmcobmFtZSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZmlyc3QgcGFyYW1ldGVyIG11c3QgYmUgYSBzdHJpbmdcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBzY2VuZSA9IG5ldyBTY2VuZShvcHRpb25zKTtcclxuICAgICAgICBjYWNoZVtuYW1lXSA9IHNjZW5lO1xyXG4gICAgICAgIHJldHVybiBzY2VuZTtcclxuICAgIH1cclxuXHJcbn07IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkganVsaWFuIG9uIDIvMjIvMTUuXHJcbiAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBTY2VuZUxvYWRlciA9IHJlcXVpcmUoJy4vU2NlbmVMb2FkZXIuanMnKTtcclxudmFyIFJlbmRlcmVyID0gcmVxdWlyZSgnLi9SZW5kZXJlci5qcycpO1xyXG5cclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4vLyBTIE0gSSBMIEFcclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGRlYnVnOiBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coc3RyKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1NjZW5lTG9hZGVyfVxyXG4gICAgICovXHJcbiAgICBzY2VuZUxvYWRlciA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gU2NlbmVMb2FkZXI7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBkb21JZFxyXG4gICAgICogQHBhcmFtIG9wdGlvbnNcclxuICAgICAqIEByZXR1cm5zIHtSZW5kZXJlcn1cclxuICAgICAqL1xyXG4gICAgcmVuZGVyZXIgOiBmdW5jdGlvbiAoZG9tSWQsIG9wdGlvbnMpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlbmRlcmVyKGRvbUlkLCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbn0iLCIvKipcclxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMTIvMTAvMjAxNC5cclxuICovXHJcbihmdW5jdGlvbiAoZXhwb3J0cykge1xyXG5cclxuICAgIC8vIHBlcmZvcm1hbmNlLm5vdyBwb2x5ZmlsbFxyXG4gICAgdmFyIHBlcmYgPSBudWxsO1xyXG4gICAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBwZXJmID0ge307XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBlcmYgPSBwZXJmb3JtYW5jZTtcclxuICAgIH1cclxuXHJcbiAgICBwZXJmLm5vdyA9IHBlcmYubm93IHx8IHBlcmYubW96Tm93IHx8IHBlcmYubXNOb3cgfHwgcGVyZi5vTm93IHx8IHBlcmYud2Via2l0Tm93IHx8IERhdGUubm93IHx8XHJcbiAgICAgICAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBzd2FwKGFycmF5LCBpLCBqKSB7XHJcbiAgICAgICAgaWYgKGkgIT09IGopIHtcclxuICAgICAgICAgICAgdmFyIHRlbXAgPSBhcnJheVtpXTtcclxuICAgICAgICAgICAgYXJyYXlbaV0gPSBhcnJheVtqXTtcclxuICAgICAgICAgICAgYXJyYXlbal0gPSB0ZW1wO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgIH5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+XHJcbiAgICAgKi9cclxuXHJcbiAgICB2YXIgZ2V0UmFuZG9tSW50ID0gZXhwb3J0cy5nZXRSYW5kb21JbnQgPSBmdW5jdGlvbiAobWluLCBtYXgpIHtcclxuICAgICAgICBpZiAobWluID4gbWF4KSB0aHJvdyBuZXcgRXJyb3IoXCJtaW4gbXVzdCBiZSBzbWFsbGVyIHRoYW4gbWF4ISB7XCIgKyBtaW4gKyBcIj5cIiArIG1heCArIFwifVwiKTtcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcclxuICAgIH07XHJcblxyXG4gICAgZXhwb3J0cy5zYW1wbGUgPSBmdW5jdGlvbiAobGlzdCwgbikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSwgaiwgaSA9IDAsIEwgPSBuID4gbGlzdC5sZW5ndGggPyBsaXN0Lmxlbmd0aCA6IG4sIHMgPSBsaXN0Lmxlbmd0aCAtIDE7XHJcbiAgICAgICAgZm9yICg7IGkgPCBMOyBpKyspIHtcclxuICAgICAgICAgICAgaiA9IGdldFJhbmRvbUludChpLCBzKTtcclxuICAgICAgICAgICAgc3dhcChsaXN0LCBpLCBqKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gobGlzdFtpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBpc1N0cmluZyA9IGV4cG9ydHMuaXNTdHJpbmcgPSBmdW5jdGlvbiAobXlWYXIpIHtcclxuICAgICAgICByZXR1cm4gKHR5cGVvZiBteVZhciA9PT0gJ3N0cmluZycgfHwgbXlWYXIgaW5zdGFuY2VvZiBTdHJpbmcpXHJcbiAgICB9O1xyXG5cclxuICAgIGV4cG9ydHMuYXNzZXJ0TGVuZ3RoID0gZnVuY3Rpb24gKGFyZywgbmJyKSB7XHJcbiAgICAgICAgaWYgKGFyZy5sZW5ndGggPT09IG5icikgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJXcm9uZyBudW1iZXIgb2YgYXJndW1lbnRzOiBleHBlY3RlZDpcIiArIG5iciArIFwiLCBidXQgZ290OiBcIiArIGFyZy5sZW5ndGgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHBvcnRzLmd1aWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGQgPSBwZXJmLm5vdygpO1xyXG4gICAgICAgIHZhciBndWlkID0gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgICAgICB2YXIgciA9IChkICsgTWF0aC5yYW5kb20oKSAqIDE2KSAlIDE2IHwgMDtcclxuICAgICAgICAgICAgZCA9IE1hdGguZmxvb3IoZCAvIDE2KTtcclxuICAgICAgICAgICAgcmV0dXJuIChjID09PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpKS50b1N0cmluZygxNik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGd1aWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIGV4cG9ydHMudGltZURpZmZlcmVuY2VJbk1zID0gZnVuY3Rpb24gKHRzQSwgdHNCKSB7XHJcbiAgICAgICAgaWYgKHRzQSBpbnN0YW5jZW9mIERhdGUpIHtcclxuICAgICAgICAgICAgdHNBID0gdHNBLmdldFRpbWUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRzQiBpbnN0YW5jZW9mIERhdGUpIHtcclxuICAgICAgICAgICAgdHNCID0gdHNCLmdldFRpbWUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE1hdGguYWJzKHRzQSAtIHRzQik7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWlsbGlzZWNvbmRzIHRvIHNlY29uZHNcclxuICAgICAqIEBwYXJhbSBtcyB7TnVtYmVyfSBNaWxsaXNcclxuICAgICAqL1xyXG4gICAgZXhwb3J0cy5tc1RvUyA9IGZ1bmN0aW9uIChtcykge1xyXG4gICAgICAgIHJldHVybiBtcyAvIDEwMDA7XHJcbiAgICB9O1xyXG5cclxuICAgIGV4cG9ydHMuaXNEZWZpbmVkID0gZnVuY3Rpb24gKG8pIHtcclxuICAgICAgICBpZiAobyA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgbyA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNoYWxsb3cgY2xvbmVcclxuICAgICAqIEBwYXJhbSBsaXN0XHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl8c3RyaW5nfEJsb2J9XHJcbiAgICAgKi9cclxuICAgIGV4cG9ydHMuY2xvbmVBcnJheSA9IGZ1bmN0aW9uIChsaXN0KSB7XHJcbiAgICAgICAgcmV0dXJuIGxpc3Quc2xpY2UoMCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVtb3ZlcyB0aGUgaXRlbSBhdCB0aGUgcG9zaXRpb24gYW5kIHJlaW5kZXhlcyB0aGUgbGlzdFxyXG4gICAgICogQHBhcmFtIGxpc3RcclxuICAgICAqIEBwYXJhbSBpXHJcbiAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAqL1xyXG4gICAgZXhwb3J0cy5kZWxldGVQb3NpdGlvbiA9IGZ1bmN0aW9uIChsaXN0LCBpKSB7XHJcbiAgICAgICAgaWYgKGkgPCAwIHx8IGkgPj0gbGlzdC5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIk91dCBvZiBib3VuZHNcIik7XHJcbiAgICAgICAgbGlzdC5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgcmV0dXJuIGxpc3Q7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIHdlYXRoZXIgdGhlIHRoZSBvYmplY3QgaW1wbGVtZW50cyB0aGUgZnVsbCBpbnRlcmZhY2Ugb3Igbm90XHJcbiAgICAgKiBAcGFyYW0gbyB7T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICB2YXIgaW1wbGVtZW50cyA9IGV4cG9ydHMuaW1wbGVtZW50cyA9IGZ1bmN0aW9uIChvLCBhKSB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGltcGxlbWVudHMuYXBwbHkoe30sIFtvXS5jb25jYXQoYSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgaSA9IDEsIG1ldGhvZE5hbWU7XHJcbiAgICAgICAgd2hpbGUgKChtZXRob2ROYW1lID0gYXJndW1lbnRzW2krK10pKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb1ttZXRob2ROYW1lXSAhPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBpc051bWJlciA9IGV4cG9ydHMuaXNOdW1iZXIgPSBmdW5jdGlvbiAobykge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhvKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiAhaXNOYU4obyAtIDApICYmIG8gIT09IG51bGwgJiYgdHlwZW9mIG8gIT09ICd1bmRlZmluZWQnICYmIG8gIT09IGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBub3QobCkge1xyXG4gICAgICAgIHJldHVybiAhbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrcyBpZiB0aGUgb2JqZWN0IGVxdWFscyB0aGUgZGVmaW5pdGlvblxyXG4gICAgICogQHBhcmFtIG9iaiB7T2JqZWN0fVxyXG4gICAgICogQHBhcmFtIGRlZmluaXRpb24ge09iamVjdH0ge1xyXG4gICAgICogICAgICAna2V5MSc6IFN0cmluZyxcclxuICAgICAqICAgICAgJ2tleTInOiBBbnlDbGFzcyxcclxuICAgICAqICAgICAgJ2tleTMnOiBOdW1iZXJcclxuICAgICAqXHJcbiAgICAgKiB9XHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgdmFyIGRlZmluZXMgPSBleHBvcnRzLmRlZmluZXMgPSBmdW5jdGlvbiAob2JqLCBkZWZpbml0aW9uKSB7XHJcbiAgICAgICAgdmFyIGtleSA9IG51bGwsIHR5cGUsIGkgPSAwLCBMO1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcclxuICAgICAgICAgICAgTCA9IG9iai5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoO2k8TDtpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICghZGVmaW5lcyhvYmpbaV0sIGRlZmluaXRpb24pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yIChrZXkgaW4gZGVmaW5pdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdHlwZSA9IGRlZmluaXRpb25ba2V5XTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU3RyaW5nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm90KGlzU3RyaW5nKG9ialtrZXldKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ29iamVjdEAnICsga2V5ICsgJyBkb2VzIG5vdCBpbXBsZW1lbnQgJyArIHR5cGUgKyAnOicsIG9iaik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBOdW1iZXI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub3QoaXNOdW1iZXIob2JqW2tleV0pKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignb2JqZWN0QCcgKyBrZXkgKyAnIGRvZXMgbm90IGltcGxlbWVudCAnICsgdHlwZSArICc6Jywgb2JqKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub3Qob2JqW2tleV0gaW5zdGFuY2VvZiB0eXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignb2JqZWN0QCcgKyBrZXkgKyAnIGRvZXMgbm90IGltcGxlbWVudCAnICsgdHlwZSArICc6Jywgb2JqKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbmhlcml0IHN0dWZmIGZyb20gcGFyZW50XHJcbiAgICAgKiBAcGFyYW0gY2hpbGRcclxuICAgICAqIEBwYXJhbSBwYXJlbnRcclxuICAgICAqL1xyXG4gICAgZXhwb3J0cy5pbmhlcml0ID0gZnVuY3Rpb24gKGNoaWxkLCBwYXJlbnQpIHtcclxuICAgICAgICBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHBhcmVudC5wcm90b3R5cGUpO1xyXG4gICAgfTtcclxuXHJcblxyXG59KSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyB0aGlzWyd5VXRpbHMnXSA9IHt9IDogZXhwb3J0cyk7Il19
