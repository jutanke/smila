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