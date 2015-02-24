/**
 * Created by julian on 2/22/15.
 */
"use strict";

var SceneLoader = require('./SceneLoader.js');

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
    sceneLoader: function () {
        return SceneLoader;
    }

}