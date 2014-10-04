/**
 * Impl overtime-swaps
 *
 * Name: smila2
 * User: Julian
 * Date: 23.01.14
 * Time: 23:00
 */
window.Smila = function () {

    var VERBOSE = true;

    function log(msg) {
        if (VERBOSE) {
            console.log("[smila2][" + new Date().toISOString().substring(12) + "]" + msg);
        }
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Sprite
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



    // POLYFILLS

    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;


    return Smila;
}();