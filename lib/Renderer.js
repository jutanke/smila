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

    start(this);
}

/**
 * start..
 * @param renderer
 */
function start(renderer) {
    var ctx = renderer.context;
    function update() {

        if (renderer.currentScene !== null) {
            renderer.currentScene.render(ctx);
        }

        requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
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


// =====================

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
            || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());