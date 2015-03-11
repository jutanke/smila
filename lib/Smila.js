/**
 * Created by julian on 2/22/15.
 */
"use strict";

var SceneLoader = require('./SceneLoader.js');
var Renderer = require('./Renderer.js');
var DataStore = require('./DataStore.js');

// =====================================
// S M I L A
// =====================================
module.exports = {
    debug: function (str) {
        console.log(str);
    },

    /**
     *
     * @returns {SceneLoader}
     */
    sceneLoader : function () {
        return SceneLoader;
    },

    dataStore : function () {
        return DataStore;
    },

    /**
     *
     * @param domId
     * @param options
     * @returns {Renderer}
     */
    renderer : function (domId, options) {
        return new Renderer(domId, options);
    }

}