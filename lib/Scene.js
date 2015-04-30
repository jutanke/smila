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