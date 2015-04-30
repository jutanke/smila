/**
 * Created by Julian on 2/24/2015.
 */
"use strict";

var Utils = require('yutils');
var Camera = require('./Camera.js');

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
    this.lastTime = -1;
    this.map = null;
    this.camera = new Camera();
    this.renderingFunc = null;
    this.renderItems = [];
    if ("map" in options) {
        // LOAD FROM MAP
        var map = options["map"];
        if (!Utils.implements(map, "renderFront", "getRenderItems", "renderBack")) {
            throw new Error("Map does not implement needed functions");
        }
        this.map = map;
        var renderItems = map.getRenderItems();
        var i = 0, L = renderItems.length;
        for (;i<L;i++) {
            this.renderItems.push(renderItems[i]);
        }

    } else {
        // DEFAULT
        setTimeout(function () {
            applyReady(self);
        }, 1);
    }
}

var EXPECTED_ELAPSED_MILLIS = Math.floor(1000 / 60);

Scene.prototype.render = function (context, viewportW, viewportH) {

    var now = Date.now();
    var elapsed = 0;
    if (this.lastTime !== -1) {
        elapsed = now - this.lastTime;
    }
    this.lastTime = now;
    var dt = elapsed / EXPECTED_ELAPSED_MILLIS;

    var camera = this.camera;
    var map = this.map;
    var renderingFunc = this.renderingFunc;

    var cameraX = camera.real.x;
    var cameraY= camera.real.y;

    context.clearRect(cameraX, cameraY, viewportW, viewportH);

    if (renderingFunc != null) {
        this.renderingFunc(camera, dt);
    }

    camera.render(context);

    if (map !== null) {
        map.renderBack(context, cameraX, cameraY, viewportW, viewportH);
    }

    var i = 0, L = this.renderItems.length;
    var renderItems = this.renderItems;

    for (;i < L; i++) {
        renderItems[i].render(context);
    }

    if (map !== null) {
        map.renderFront(context, cameraX, cameraY, viewportW, viewportH);
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

Scene.prototype.onrender = function (callback) {
    this.renderingFunc = callback;
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