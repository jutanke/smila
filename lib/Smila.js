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