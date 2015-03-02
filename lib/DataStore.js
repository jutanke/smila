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