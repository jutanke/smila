!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Smila=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by julian on 2/23/15.
 */
"use strict";

function Animation() {

};

module.exports = Animation;
},{}],2:[function(require,module,exports){
/**
 * Created by julian on 2/23/15.
 */
"use strict";
/**
 *
 * @constructor
 */
function Map() {

};

module.exports = Map;
},{}],3:[function(require,module,exports){
/**
 * Created by Julian on 2/24/2015.
 */
"use strict";

/**
 *
 * @constructor
 */
function Scene() {

};

Scene.prototype.play = function () {
    console.log("play scene");
};

module.exports = Scene;
},{}],4:[function(require,module,exports){
/**
 * Created by julian on 2/22/15.
 */
"use strict";

var Scene = require('./Scene.js');
var Sprite = require('./Sprite.js');
var Map = require('./Map.js');
var Animation = require('./Animation.js');

// =====================================
// S M I L A
// =====================================
module.exports = {
    debug: function () {
        console.log("println");
    },

    /**
     *
     * @returns {Scene}
     */
    createScene: function () {
        return new Scene();
    }
}
},{"./Animation.js":1,"./Map.js":2,"./Scene.js":3,"./Sprite.js":5}],5:[function(require,module,exports){
/**
 * Created by julian on 2/23/15.
 */
"use strict";

function Sprite() {

};

module.exports = Sprite;
},{}]},{},[4])(4)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcQmFrYVxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsImxpYlxcQW5pbWF0aW9uLmpzIiwibGliXFxNYXAuanMiLCJsaWJcXFNjZW5lLmpzIiwibGliXFxTbWlsYS5qcyIsImxpYlxcU3ByaXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcclxuICogQ3JlYXRlZCBieSBqdWxpYW4gb24gMi8yMy8xNS5cclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuZnVuY3Rpb24gQW5pbWF0aW9uKCkge1xyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0aW9uOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGp1bGlhbiBvbiAyLzIzLzE1LlxyXG4gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qKlxyXG4gKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIE1hcCgpIHtcclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1hcDsiLCIvKipcclxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gMi8yNC8yMDE1LlxyXG4gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICpcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBTY2VuZSgpIHtcclxuXHJcbn07XHJcblxyXG5TY2VuZS5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnNvbGUubG9nKFwicGxheSBzY2VuZVwiKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2NlbmU7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkganVsaWFuIG9uIDIvMjIvMTUuXHJcbiAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBTY2VuZSA9IHJlcXVpcmUoJy4vU2NlbmUuanMnKTtcclxudmFyIFNwcml0ZSA9IHJlcXVpcmUoJy4vU3ByaXRlLmpzJyk7XHJcbnZhciBNYXAgPSByZXF1aXJlKCcuL01hcC5qcycpO1xyXG52YXIgQW5pbWF0aW9uID0gcmVxdWlyZSgnLi9BbmltYXRpb24uanMnKTtcclxuXHJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuLy8gUyBNIEkgTCBBXHJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBkZWJ1ZzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwicHJpbnRsblwiKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1NjZW5lfVxyXG4gICAgICovXHJcbiAgICBjcmVhdGVTY2VuZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgU2NlbmUoKTtcclxuICAgIH1cclxufSIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGp1bGlhbiBvbiAyLzIzLzE1LlxyXG4gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5mdW5jdGlvbiBTcHJpdGUoKSB7XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTcHJpdGU7Il19
