/**
 * Created by Julian on 3/2/2015.
 */
"use strict";

module.exports = {
    log: function (str, data) {
        if (typeof data === 'undefined') {
            console.log(str);
        } else {
            console.log(str, data);
        }
    }
}