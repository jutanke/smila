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