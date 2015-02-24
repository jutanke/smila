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