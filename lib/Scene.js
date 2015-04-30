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