!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.TouchController=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
    /**
     * Created by Julian on 4/4/2015.
     */
    "use strict";

    var Utils = require('./utils');

    function AnalogStick(domid, position) {

        var topTouchOffset = Utils.topTouchOffset();

        // ============ H E L P E R  F U N C T I O N S ============
        function handleStart(e) {
            self.pressed = true;
            e.preventDefault();
            self.fx = e.changedTouches[0].screenX;
            self.fy = e.changedTouches[0].screenY - topTouchOffset;
            if (self.allowOnClick && self.onClick !== null) self.onClick.call(self);
        }

        function handleEnd(e) {
            self.pressed = false;
            e.preventDefault();
            if (self.allowOnClick && self.onRelease !== null) self.onRelease.call(self);
        }

        function handleMove(e) {
            e.preventDefault();
            self.fx = e.changedTouches[0].screenX;
            self.fy = e.changedTouches[0].screenY - topTouchOffset;
            if (self.allowOnClick && self.onClick !== null) self.onClick.call(self);
        }
        // ============ H E L P E R  F U N C T I O N S ============

        this.allowOnClick = true;
        var el = document.getElementById(domid);
        var style = "";
        var self = this, id;
        var diameter = Utils.diameter();
        if (Utils.isTouchDevice()) {
            if (typeof position === 'undefined') {
                position = {};
            }
            if ("bottom" in position) {
                style += "bottom:" +position.bottom + "px;";
            } else if ("top" in position) {
                style += "top:" +position.top + "px;";
            }
            if ("left" in position){
                style += "left:" +position.left + "px;";
            } else if ("right" in position) {
                style += "right:" +position.right + "px;";
            }
            id = Utils.newId();
            el.innerHTML = '<div style="'+
                style+
                '" id="'+ id
                +'" class="touchController"><div class="innerTouchController"></div></div>';

            this.fx = -1;
            this.fy = -1;
            this.pressed = false;
            this.x = 0;
            this.y = 0;

            this.onClick = null;
            this.onRelease = null;

            el.addEventListener("touchstart", handleStart, false);
            el.addEventListener("touchend", handleEnd, false);
            el.addEventListener("touchmove", handleMove, false);
            el.addEventListener("touchcancel", handleEnd, false);

            setTimeout(function(){
                var el = document.getElementById(id);
                var o = Utils.getOffsetRect(el);
                self.x = o.left + Math.ceil(diameter/2);
                self.y = o.top + Math.ceil(diameter/2);
            },100);

        } else {
            // NON-TOUCH-DEVICE
            el.parentNode.removeChild(el);
        }
    }

    AnalogStick.prototype.isPressed = function(){
        return this.pressed;
    };

    AnalogStick.prototype.getDegree = function(){
        return Utils.getDegree(this.x, this.y, this.fx, this.fy);
    };

    module.exports = AnalogStick;
},{"./utils":7}],2:[function(require,module,exports){
    /**
     * Created by Julian on 4/4/2015.
     */
    "use strict";
    var Utils = require('./utils.js');
    var KeyboardController = require('./keyboardController.js');
    var nextID = 0;

    function Button(domid, name, options) {
        // ============ H E L P E R  F U N C T I O N S ============
        function handleStart(e) {
            document.getElementById(id).className = "touchBtn pressed";
            e.preventDefault();
        }

        function handleEnd(e) {
            if (self.onClick !== null) {
                self.onClick.call(self);
            }
            document.getElementById(id).className = "touchBtn";
            e.preventDefault();
        }

        function handleCancel(e){
            document.getElementById(id).className = "touchBtn";
            e.preventDefault();
        }
        // ============ H E L P E R  F U N C T I O N S ============

        var self = this;
        var el = document.getElementById(domid);
        var keyToButton = KeyboardController.keyToButton();
        if (Utils.isTouchDevice()) {
            var style = "";
            if (typeof options === "undefined") {
                options = {};
            }
            if ("bottom" in options){
                style += "bottom:" +options.bottom + "px;";
            } else if ("top" in options) {
                style += "top:" +options.top + "px;";
            }
            if ("left" in options){
                style += "left:" +options.left + "px;";
            } else if ("right" in options) {
                style += "right:" +options.right + "px;";
            }

            var id = "touchBtn" + nextID++;
            el.innerHTML = '<div style="'+
                style+
                '" id="'+ id
                +'" class="touchBtn"><div class="touchBtnTxt">' + name +'</div></div>';

            el.addEventListener("touchstart", handleStart, false);
            el.addEventListener("touchend", handleEnd, false);
            el.addEventListener("touchcancel", handleCancel, false);

        } else {
            // NON TOUCH DEVICE
            el.parentNode.removeChild(el);
            if ("key" in options) {
                keyToButton[options["key"]] = this;
            }
        }
        this.onClick = null;
    }

    module.exports = Button;
},{"./keyboardController.js":5,"./utils.js":7}],3:[function(require,module,exports){
    /**
     * Created by Julian on 4/4/2015.
     */
    "use strict";
    var Utils = require('./utils.js');
    var KeyboardController = require('./keyboardController.js');
    var AnalogStick = require('./AnalogStick.js');

    var listener = -1;

    function DPad(domid, options) {
        var CLICK_INTERVAL_IN_MS = 500;
        var INTERVAL_SPEED = 125;
        var self = this;
        var lastTimePressedMs = 0;
        var firstClick = true;
        var keyPressCheck = null;
        var iskeydown = false;
        var currentKey = -1;

        AnalogStick.call(this, domid,options);
        if ("WASDEvents" in options && options["WASDEvents"]){
            if (listener !== -1) {
                clearInterval(listener);
            }

            if (Utils.isTouchDevice()) {
                this.onClick = function () {
                    var now = new Date().getTime();
                    if (firstClick) {
                        lastTimePressedMs = now;
                        firstClick = false;
                        switch (self.getDirection()){
                            case DPad.UP:
                                if (self.onUp !== null) self.onUp.call(self);
                                break;
                            case DPad.DOWN:
                                if (self.onDown !== null) self.onDown.call(self);
                                break;
                            case DPad.LEFT:
                                if (self.onLeft !== null) self.onLeft.call(self);
                                break;
                            case DPad.RIGHT:
                                if (self.onRight !== null) self.onRight.call(self);
                                break;
                        }
                    } else {
                        if ((now - lastTimePressedMs) > CLICK_INTERVAL_IN_MS) {
                            lastTimePressedMs = now;
                            switch (self.getDirection()){
                                case DPad.UP:
                                    if (self.onUp !== null) self.onUp.call(self);
                                    break;
                                case DPad.DOWN:
                                    if (self.onDown !== null) self.onDown.call(self);
                                    break;
                                case DPad.LEFT:
                                    if (self.onLeft !== null) self.onLeft.call(self);
                                    break;
                                case DPad.RIGHT:
                                    if (self.onRight !== null) self.onRight.call(self);
                                    break;
                            }
                        }
                    }
                };

                this.onRelease = function(){
                    firstClick = true;
                };

                keyPressCheck = function() {
                    if (self.isPressed()) {
                        var now = new Date().getTime();
                        if ((now - lastTimePressedMs) > CLICK_INTERVAL_IN_MS) {
                            lastTimePressedMs = now;
                            switch (self.getDirection()) {
                                case DPad.UP:
                                    if (self.onUp !== null) self.onUp.call(self);
                                    break;
                                case DPad.DOWN:
                                    if (self.onDown !== null) self.onDown.call(self);
                                    break;
                                case DPad.LEFT:
                                    if (self.onLeft !== null) self.onLeft.call(self);
                                    break;
                                case DPad.RIGHT:
                                    if (self.onRight !== null) self.onRight.call(self);
                                    break;
                            }
                        }
                    }
                };
            } else {
                // NOT TOUCH DEVICE
                var keyPressed = {
                    "87": false,
                    "65": false,
                    "68": false,
                    "83": false
                };
                document.onkeydown = function(e){
                    var keyCode = e.keyCode;
                    if (keyCode === 87 || keyCode === 65 || keyCode === 68 || keyCode === 83) {
                        currentKey = keyCode;
                        keyPressed[""+keyCode] = true;
                        self.keyDirection = currentKey;
                        iskeydown = true;
                        var now = new Date().getTime();
                        if (firstClick) {
                            lastTimePressedMs = now;
                            firstClick = false;
                            switch (keyCode){
                                case DPad.UP:
                                    if (self.onUp !== null) self.onUp.call(self);
                                    break;
                                case DPad.DOWN:
                                    if (self.onDown !== null) self.onDown.call(self);
                                    break;
                                case DPad.LEFT:
                                    if (self.onLeft !== null) self.onLeft.call(self);
                                    break;
                                case DPad.RIGHT:
                                    if (self.onRight !== null) self.onRight.call(self);
                                    break;
                            }
                        } else {
                            if ((now - lastTimePressedMs) > CLICK_INTERVAL_IN_MS) {
                                lastTimePressedMs = now;
                                switch (keyCode){
                                    case DPad.UP:
                                        if (self.onUp !== null) self.onUp.call(self);
                                        break;
                                    case DPad.DOWN:
                                        if (self.onDown !== null) self.onDown.call(self);
                                        break;
                                    case DPad.LEFT:
                                        if (self.onLeft !== null) self.onLeft.call(self);
                                        break;
                                    case DPad.RIGHT:
                                        if (self.onRight !== null) self.onRight.call(self);
                                        break;
                                }
                            }
                        }
                    }
                };
                KeyboardController.onWASDUp(domid, function (keyCode) {
                    if (keyCode === 87 || keyCode === 65 || keyCode === 68 || keyCode === 83) {
                        keyPressed[""+keyCode] = false;
                        if (!keyPressed["87"] && !keyPressed["65"] && !keyPressed["68"] && !keyPressed["83"]){
                            self.keyDirection = DPad.NONE;
                            iskeydown = false;
                            firstClick = true;
                        }
                    }
                });
                keyPressCheck = function() {
                    if (iskeydown) {
                        var now = new Date().getTime();
                        if ((now - lastTimePressedMs) > CLICK_INTERVAL_IN_MS) {
                            lastTimePressedMs = now;
                            switch (currentKey){
                                case DPad.UP:
                                    if (self.onUp !== null) self.onUp.call(self);
                                    break;
                                case DPad.DOWN:
                                    if (self.onDown !== null) self.onDown.call(self);
                                    break;
                                case DPad.LEFT:
                                    if (self.onLeft !== null) self.onLeft.call(self);
                                    break;
                                case DPad.RIGHT:
                                    if (self.onRight !== null) self.onRight.call(self);
                                    break;
                            }
                        }
                    }
                };
            }

            listener = setInterval(keyPressCheck, INTERVAL_SPEED);

            this.onUp = null;
            this.onDown = null;
            this.onLeft = null;
            this.onRight = null;
        }
        this.keyDirection = DPad.NONE;
    }

    DPad.prototype = Object.create(AnalogStick.prototype);

    DPad.UP = 87;
    DPad.DOWN = 83;
    DPad.LEFT = 65;
    DPad.RIGHT = 68;
    DPad.NONE = -1;

    if (Utils.isTouchDevice()) {
        DPad.prototype.getDirection = function(){
            if (this.isPressed()) {
                var deg = this.getDegree();
                if (deg < 45 || deg >= 315){
                    return DPad.LEFT;
                } else if (deg < 315 && deg >= 225) {
                    return DPad.UP;
                } else if (deg < 225 && deg >= 135) {
                    return DPad.RIGHT;
                } else {
                    return DPad.DOWN;
                }
            } else {
                return DPad.NONE;
            }
        };
    } else {
        DPad.prototype.getDirection = function(){
            return this.keyDirection;
        };
    }

    module.exports = DPad;
},{"./AnalogStick.js":1,"./keyboardController.js":5,"./utils.js":7}],4:[function(require,module,exports){
    /**
     * Created by Julian on 4/4/2015.
     */
    "use strict";
    module.exports = {
        SPACE : "sp",
        ENTER : "en",
        ESC : "esc",
        Q : "q",
        E : "e"
    };
},{}],5:[function(require,module,exports){
    /**
     * Created by Julian on 4/4/2015.
     */
    "use strict";

    var Utils = require('./utils.js');
    var KEYS = require('./KEYS.js');

    var _keyToButton = {};

    function testAndExecKey(keycode, expectedKeycode, value) {
        if (expectedKeycode === keycode && value in _keyToButton) {
            var btn = _keyToButton[value];
            if (btn.onClick !== null) {
                btn.onClick.call(btn);
            }
            return true;
        }
        return false;
    }

    if (!Utils.isTouchDevice()) {

        document.onkeyup = function (e) {

            var keyCode = e.keyCode;

            // ignore WASD
            if (keyCode !== 87 && keyCode !== 65 &&
                keyCode !== 83 && keyCode !== 68) {
                if (!testAndExecKey(keyCode, 32, KEYS.SPACE))
                    if (!testAndExecKey(keyCode, 13, KEYS.ENTER))
                        if (!testAndExecKey(keyCode, 27, KEYS.ESC))
                            if (!testAndExecKey(keyCode, 81, KEYS.Q))
                                if (!testAndExecKey(keyCode, 69, KEYS.E)) {
                                }
            } else {
                var i = 0, L = _wasdCallbacks.length;
                for (; i < L; i++) {
                    _wasdCallbacks[i].callback(keyCode);
                }
            }

        };

    }

    var _wasdCallbacks = [];

    function deleteById(domId, list) {
        var i = 0, L = list.length;
        for (; i < L; i++) {
            if (list[i].id === domId) {
                list.splice(i, 1);
                break;
            }
        }
    }

    module.exports = {

        /**
         * Event will be called when a WASD key was pressed and is up again
         * @param domId to make it removable
         * @param callback {function}
         */
        onWASDUp: function (domId, callback) {
            deleteById(domId, _wasdCallbacks);
            _wasdCallbacks.push({id: domId, callback: callback});
        },

        keyToButton: function () {
            return _keyToButton;
        }

    };
},{"./KEYS.js":4,"./utils.js":7}],6:[function(require,module,exports){
    /**
     * Created by Julian on 4/4/2015.
     */
    "use strict";

//require('./touchController.js');

    var Utils = require('./utils.js');
    var AnalogStick = require('./AnalogStick.js');
    var DPad = require('./DPad.js');
    var Button = require('./Button.js');
    var KEYS = require('./KEYS.js');

    var _diameter = Utils.diameter();
    var _btnDiameter = Utils.btnDiameter();

    if (Utils.isTouchDevice()) {
        document.write("<style id='touchControllerStyle'>.touchController{ " +
            "width:"+_diameter+"px;height:"+_diameter+"px;border:2px solid black;position:absolute;border-radius:50%;" +
            " } .innerTouchController {" +
            "width:5px;height:5px;margin-left:auto;margin-right:auto;margin-top:"+(Math.ceil(_diameter/2))+
            "px;background-color:black;}" +
            ".touchBtn{position:absolute;border:2px solid black;position:absolute;border-radius:50%;" +
            "width:"+_btnDiameter+"px;height:"+_btnDiameter+"px;}" +
            ".touchBtnTxt{text-align:center;line-height:"+_btnDiameter+"px;}" +
            ".touchBtn.pressed{background-color:cornflowerblue;}" +
            "</style>");
    }

    module.exports = {

        /**
         * Checks weather the current device can use touch or not
         * @returns {*}
         */
        isTouchDevice: function () {
            return Utils.isTouchDevice();
        },

        /**
         * strips away the default style
         */
        stripStyle: function () {
            var element = document.getElementById('touchControllerStyle');
            element.outerHTML = "";
        },

        AnalogStick: AnalogStick,

        DPad: DPad,

        Button: Button,

        KEYS: KEYS

    };
},{"./AnalogStick.js":1,"./Button.js":2,"./DPad.js":3,"./KEYS.js":4,"./utils.js":7}],7:[function(require,module,exports){
    /**
     * Created by Julian on 4/4/2015.
     */
    "use strict";

    function isTouchDevice() {
        return (('ontouchstart' in window)
            || (navigator.MaxTouchPoints > 0)
            || (navigator.msMaxTouchPoints > 0));
    }

    var _isTouchDevice = isTouchDevice();

    var _isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

    var _toDeg = 180 / Math.PI;

    var _currentId = 0;

    var _topTouchOffset = 0;
    if (_isChrome) {
        _topTouchOffset = 100;
    }

    var _diameter = 140;
    var _btnDiameter = 65;

    module.exports = {

        diameter: function () {
            return _diameter;
        },

        btnDiameter: function () {
            return _btnDiameter;
        },

        /**
         * generates a new unique id
         * @returns {string}
         */
        newId: function () {
            return "touchController" + _currentId++;
        },

        /**
         * Checks weather the device can use touch or not
         * @returns {boolean}
         */
        isTouchDevice: function () {
            return _isTouchDevice;
        },

        /**
         * Returnes true when the renderer is Chrome
         * @returns {boolean}
         */
        isChrome: function () {
            return _isChrome;
        },

        /**
         *
         * @param elem
         * @returns {{top: number, left: number}}
         */
        getOffsetRect: function (elem) {
            // (1)
            var box = elem.getBoundingClientRect();
            var body = document.body;
            var docElem = document.documentElement;
            // (2)
            var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
            var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
            // (3)
            var clientTop = docElem.clientTop || body.clientTop || 0;
            var clientLeft = docElem.clientLeft || body.clientLeft || 0;
            // (4)
            var top = box.top + scrollTop - clientTop;
            var left = box.left + scrollLeft - clientLeft;
            return { top: Math.round(top), left: Math.round(left) };
        },

        /**
         * transforms two points to the degree in between
         * @param x1
         * @param y1
         * @param x2
         * @param y2
         * @returns {number}
         */
        getDegree: function(x1, y1, x2, y2) {
            var x = x1-x2;
            var y = y1-y2;
            var theta = Math.atan2(-y, x);
            if (theta < 0) theta += 2 * Math.PI;
            return theta * _toDeg;
        },

        /**
         * Needed for some offsetting
         * @returns {number}
         */
        topTouchOffset: function () {
            return _topTouchOffset;
        }

    };
},{}]},{},[6])(6)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImxpYi9BbmFsb2dTdGljay5qcyIsImxpYi9CdXR0b24uanMiLCJsaWIvRFBhZC5qcyIsImxpYi9LRVlTLmpzIiwibGliL2tleWJvYXJkQ29udHJvbGxlci5qcyIsImxpYi90b3VjaENvbnRyb2xsZXIuanMiLCJsaWIvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiA0LzQvMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxuZnVuY3Rpb24gQW5hbG9nU3RpY2soZG9taWQsIHBvc2l0aW9uKSB7XG5cbiAgICB2YXIgdG9wVG91Y2hPZmZzZXQgPSBVdGlscy50b3BUb3VjaE9mZnNldCgpO1xuXG4gICAgLy8gPT09PT09PT09PT09IEggRSBMIFAgRSBSICBGIFUgTiBDIFQgSSBPIE4gUyA9PT09PT09PT09PT1cbiAgICBmdW5jdGlvbiBoYW5kbGVTdGFydChlKSB7XG4gICAgICAgIHNlbGYucHJlc3NlZCA9IHRydWU7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc2VsZi5meCA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uc2NyZWVuWDtcbiAgICAgICAgc2VsZi5meSA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uc2NyZWVuWSAtIHRvcFRvdWNoT2Zmc2V0O1xuICAgICAgICBpZiAoc2VsZi5hbGxvd09uQ2xpY2sgJiYgc2VsZi5vbkNsaWNrICE9PSBudWxsKSBzZWxmLm9uQ2xpY2suY2FsbChzZWxmKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVFbmQoZSkge1xuICAgICAgICBzZWxmLnByZXNzZWQgPSBmYWxzZTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoc2VsZi5hbGxvd09uQ2xpY2sgJiYgc2VsZi5vblJlbGVhc2UgIT09IG51bGwpIHNlbGYub25SZWxlYXNlLmNhbGwoc2VsZik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlTW92ZShlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc2VsZi5meCA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uc2NyZWVuWDtcbiAgICAgICAgc2VsZi5meSA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uc2NyZWVuWSAtIHRvcFRvdWNoT2Zmc2V0O1xuICAgICAgICBpZiAoc2VsZi5hbGxvd09uQ2xpY2sgJiYgc2VsZi5vbkNsaWNrICE9PSBudWxsKSBzZWxmLm9uQ2xpY2suY2FsbChzZWxmKTtcbiAgICB9XG4gICAgLy8gPT09PT09PT09PT09IEggRSBMIFAgRSBSICBGIFUgTiBDIFQgSSBPIE4gUyA9PT09PT09PT09PT1cblxuICAgIHRoaXMuYWxsb3dPbkNsaWNrID0gdHJ1ZTtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkb21pZCk7XG4gICAgdmFyIHN0eWxlID0gXCJcIjtcbiAgICB2YXIgc2VsZiA9IHRoaXMsIGlkO1xuICAgIHZhciBkaWFtZXRlciA9IFV0aWxzLmRpYW1ldGVyKCk7XG4gICAgaWYgKFV0aWxzLmlzVG91Y2hEZXZpY2UoKSkge1xuICAgICAgICBpZiAodHlwZW9mIHBvc2l0aW9uID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcG9zaXRpb24gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXCJib3R0b21cIiBpbiBwb3NpdGlvbikge1xuICAgICAgICAgICAgc3R5bGUgKz0gXCJib3R0b206XCIgK3Bvc2l0aW9uLmJvdHRvbSArIFwicHg7XCI7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJ0b3BcIiBpbiBwb3NpdGlvbikge1xuICAgICAgICAgICAgc3R5bGUgKz0gXCJ0b3A6XCIgK3Bvc2l0aW9uLnRvcCArIFwicHg7XCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFwibGVmdFwiIGluIHBvc2l0aW9uKXtcbiAgICAgICAgICAgIHN0eWxlICs9IFwibGVmdDpcIiArcG9zaXRpb24ubGVmdCArIFwicHg7XCI7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJyaWdodFwiIGluIHBvc2l0aW9uKSB7XG4gICAgICAgICAgICBzdHlsZSArPSBcInJpZ2h0OlwiICtwb3NpdGlvbi5yaWdodCArIFwicHg7XCI7XG4gICAgICAgIH1cbiAgICAgICAgaWQgPSBVdGlscy5uZXdJZCgpO1xuICAgICAgICBlbC5pbm5lckhUTUwgPSAnPGRpdiBzdHlsZT1cIicrXG4gICAgICAgICAgICBzdHlsZStcbiAgICAgICAgICAgICdcIiBpZD1cIicrIGlkXG4gICAgICAgICAgICArJ1wiIGNsYXNzPVwidG91Y2hDb250cm9sbGVyXCI+PGRpdiBjbGFzcz1cImlubmVyVG91Y2hDb250cm9sbGVyXCI+PC9kaXY+PC9kaXY+JztcblxuICAgICAgICB0aGlzLmZ4ID0gLTE7XG4gICAgICAgIHRoaXMuZnkgPSAtMTtcbiAgICAgICAgdGhpcy5wcmVzc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMueCA9IDA7XG4gICAgICAgIHRoaXMueSA9IDA7XG5cbiAgICAgICAgdGhpcy5vbkNsaWNrID0gbnVsbDtcbiAgICAgICAgdGhpcy5vblJlbGVhc2UgPSBudWxsO1xuXG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIGhhbmRsZVN0YXJ0LCBmYWxzZSk7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCBoYW5kbGVFbmQsIGZhbHNlKTtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCBoYW5kbGVNb3ZlLCBmYWxzZSk7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGNhbmNlbFwiLCBoYW5kbGVFbmQsIGZhbHNlKTtcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgICAgICB2YXIgbyA9IFV0aWxzLmdldE9mZnNldFJlY3QoZWwpO1xuICAgICAgICAgICAgc2VsZi54ID0gby5sZWZ0ICsgTWF0aC5jZWlsKGRpYW1ldGVyLzIpO1xuICAgICAgICAgICAgc2VsZi55ID0gby50b3AgKyBNYXRoLmNlaWwoZGlhbWV0ZXIvMik7XG4gICAgICAgIH0sMTAwKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE5PTi1UT1VDSC1ERVZJQ0VcbiAgICAgICAgZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbCk7XG4gICAgfVxufVxuXG5BbmFsb2dTdGljay5wcm90b3R5cGUuaXNQcmVzc2VkID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gdGhpcy5wcmVzc2VkO1xufTtcblxuQW5hbG9nU3RpY2sucHJvdG90eXBlLmdldERlZ3JlZSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIFV0aWxzLmdldERlZ3JlZSh0aGlzLngsIHRoaXMueSwgdGhpcy5meCwgdGhpcy5meSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFuYWxvZ1N0aWNrOyIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gNC80LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIFV0aWxzID0gcmVxdWlyZSgnLi91dGlscy5qcycpO1xudmFyIEtleWJvYXJkQ29udHJvbGxlciA9IHJlcXVpcmUoJy4va2V5Ym9hcmRDb250cm9sbGVyLmpzJyk7XG52YXIgbmV4dElEID0gMDtcblxuZnVuY3Rpb24gQnV0dG9uKGRvbWlkLCBuYW1lLCBvcHRpb25zKSB7XG4gICAgLy8gPT09PT09PT09PT09IEggRSBMIFAgRSBSICBGIFUgTiBDIFQgSSBPIE4gUyA9PT09PT09PT09PT1cbiAgICBmdW5jdGlvbiBoYW5kbGVTdGFydChlKSB7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKS5jbGFzc05hbWUgPSBcInRvdWNoQnRuIHByZXNzZWRcIjtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZUVuZChlKSB7XG4gICAgICAgIGlmIChzZWxmLm9uQ2xpY2sgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNlbGYub25DbGljay5jYWxsKHNlbGYpO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKS5jbGFzc05hbWUgPSBcInRvdWNoQnRuXCI7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVDYW5jZWwoZSl7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKS5jbGFzc05hbWUgPSBcInRvdWNoQnRuXCI7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gICAgLy8gPT09PT09PT09PT09IEggRSBMIFAgRSBSICBGIFUgTiBDIFQgSSBPIE4gUyA9PT09PT09PT09PT1cblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkb21pZCk7XG4gICAgdmFyIGtleVRvQnV0dG9uID0gS2V5Ym9hcmRDb250cm9sbGVyLmtleVRvQnV0dG9uKCk7XG4gICAgaWYgKFV0aWxzLmlzVG91Y2hEZXZpY2UoKSkge1xuICAgICAgICB2YXIgc3R5bGUgPSBcIlwiO1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXCJib3R0b21cIiBpbiBvcHRpb25zKXtcbiAgICAgICAgICAgIHN0eWxlICs9IFwiYm90dG9tOlwiICtvcHRpb25zLmJvdHRvbSArIFwicHg7XCI7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJ0b3BcIiBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBzdHlsZSArPSBcInRvcDpcIiArb3B0aW9ucy50b3AgKyBcInB4O1wiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcImxlZnRcIiBpbiBvcHRpb25zKXtcbiAgICAgICAgICAgIHN0eWxlICs9IFwibGVmdDpcIiArb3B0aW9ucy5sZWZ0ICsgXCJweDtcIjtcbiAgICAgICAgfSBlbHNlIGlmIChcInJpZ2h0XCIgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgc3R5bGUgKz0gXCJyaWdodDpcIiArb3B0aW9ucy5yaWdodCArIFwicHg7XCI7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaWQgPSBcInRvdWNoQnRuXCIgKyBuZXh0SUQrKztcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gJzxkaXYgc3R5bGU9XCInK1xuICAgICAgICAgICAgc3R5bGUrXG4gICAgICAgICAgICAnXCIgaWQ9XCInKyBpZFxuICAgICAgICAgICAgKydcIiBjbGFzcz1cInRvdWNoQnRuXCI+PGRpdiBjbGFzcz1cInRvdWNoQnRuVHh0XCI+JyArIG5hbWUgKyc8L2Rpdj48L2Rpdj4nO1xuXG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIGhhbmRsZVN0YXJ0LCBmYWxzZSk7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCBoYW5kbGVFbmQsIGZhbHNlKTtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoY2FuY2VsXCIsIGhhbmRsZUNhbmNlbCwgZmFsc2UpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTk9OIFRPVUNIIERFVklDRVxuICAgICAgICBlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKTtcbiAgICAgICAgaWYgKFwia2V5XCIgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAga2V5VG9CdXR0b25bb3B0aW9uc1tcImtleVwiXV0gPSB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMub25DbGljayA9IG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uOyIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gNC80LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIFV0aWxzID0gcmVxdWlyZSgnLi91dGlscy5qcycpO1xudmFyIEtleWJvYXJkQ29udHJvbGxlciA9IHJlcXVpcmUoJy4va2V5Ym9hcmRDb250cm9sbGVyLmpzJyk7XG52YXIgQW5hbG9nU3RpY2sgPSByZXF1aXJlKCcuL0FuYWxvZ1N0aWNrLmpzJyk7XG5cbnZhciBsaXN0ZW5lciA9IC0xO1xuXG5mdW5jdGlvbiBEUGFkKGRvbWlkLCBvcHRpb25zKSB7XG4gICAgdmFyIENMSUNLX0lOVEVSVkFMX0lOX01TID0gNTAwO1xuICAgIHZhciBJTlRFUlZBTF9TUEVFRCA9IDEyNTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGxhc3RUaW1lUHJlc3NlZE1zID0gMDtcbiAgICB2YXIgZmlyc3RDbGljayA9IHRydWU7XG4gICAgdmFyIGtleVByZXNzQ2hlY2sgPSBudWxsO1xuICAgIHZhciBpc2tleWRvd24gPSBmYWxzZTtcbiAgICB2YXIgY3VycmVudEtleSA9IC0xO1xuXG4gICAgQW5hbG9nU3RpY2suY2FsbCh0aGlzLCBkb21pZCxvcHRpb25zKTtcbiAgICBpZiAoXCJXQVNERXZlbnRzXCIgaW4gb3B0aW9ucyAmJiBvcHRpb25zW1wiV0FTREV2ZW50c1wiXSl7XG4gICAgICAgIGlmIChsaXN0ZW5lciAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwobGlzdGVuZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFV0aWxzLmlzVG91Y2hEZXZpY2UoKSkge1xuICAgICAgICAgICAgdGhpcy5vbkNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3RDbGljaykge1xuICAgICAgICAgICAgICAgICAgICBsYXN0VGltZVByZXNzZWRNcyA9IG5vdztcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RDbGljayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHNlbGYuZ2V0RGlyZWN0aW9uKCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlVQOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uVXAgIT09IG51bGwpIHNlbGYub25VcC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkRPV046XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25Eb3duICE9PSBudWxsKSBzZWxmLm9uRG93bi5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkxFRlQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25MZWZ0ICE9PSBudWxsKSBzZWxmLm9uTGVmdC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlJJR0hUOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uUmlnaHQgIT09IG51bGwpIHNlbGYub25SaWdodC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChub3cgLSBsYXN0VGltZVByZXNzZWRNcykgPiBDTElDS19JTlRFUlZBTF9JTl9NUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFRpbWVQcmVzc2VkTXMgPSBub3c7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHNlbGYuZ2V0RGlyZWN0aW9uKCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5VUDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25VcCAhPT0gbnVsbCkgc2VsZi5vblVwLmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5ET1dOOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkRvd24gIT09IG51bGwpIHNlbGYub25Eb3duLmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5MRUZUOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkxlZnQgIT09IG51bGwpIHNlbGYub25MZWZ0LmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5SSUdIVDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25SaWdodCAhPT0gbnVsbCkgc2VsZi5vblJpZ2h0LmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5vblJlbGVhc2UgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGZpcnN0Q2xpY2sgPSB0cnVlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAga2V5UHJlc3NDaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmlzUHJlc3NlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChub3cgLSBsYXN0VGltZVByZXNzZWRNcykgPiBDTElDS19JTlRFUlZBTF9JTl9NUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFRpbWVQcmVzc2VkTXMgPSBub3c7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHNlbGYuZ2V0RGlyZWN0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuVVA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uVXAgIT09IG51bGwpIHNlbGYub25VcC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuRE9XTjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25Eb3duICE9PSBudWxsKSBzZWxmLm9uRG93bi5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuTEVGVDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25MZWZ0ICE9PSBudWxsKSBzZWxmLm9uTGVmdC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuUklHSFQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uUmlnaHQgIT09IG51bGwpIHNlbGYub25SaWdodC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBOT1QgVE9VQ0ggREVWSUNFXG4gICAgICAgICAgICB2YXIga2V5UHJlc3NlZCA9IHtcbiAgICAgICAgICAgICAgICBcIjg3XCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiNjVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCI2OFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcIjgzXCI6IGZhbHNlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZG9jdW1lbnQub25rZXlkb3duID0gZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIGtleUNvZGUgPSBlLmtleUNvZGU7XG4gICAgICAgICAgICAgICAgaWYgKGtleUNvZGUgPT09IDg3IHx8IGtleUNvZGUgPT09IDY1IHx8IGtleUNvZGUgPT09IDY4IHx8IGtleUNvZGUgPT09IDgzKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRLZXkgPSBrZXlDb2RlO1xuICAgICAgICAgICAgICAgICAgICBrZXlQcmVzc2VkW1wiXCIra2V5Q29kZV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmtleURpcmVjdGlvbiA9IGN1cnJlbnRLZXk7XG4gICAgICAgICAgICAgICAgICAgIGlza2V5ZG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0Q2xpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUaW1lUHJlc3NlZE1zID0gbm93O1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RDbGljayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChrZXlDb2RlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuVVA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uVXAgIT09IG51bGwpIHNlbGYub25VcC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuRE9XTjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25Eb3duICE9PSBudWxsKSBzZWxmLm9uRG93bi5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuTEVGVDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25MZWZ0ICE9PSBudWxsKSBzZWxmLm9uTGVmdC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuUklHSFQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uUmlnaHQgIT09IG51bGwpIHNlbGYub25SaWdodC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgobm93IC0gbGFzdFRpbWVQcmVzc2VkTXMpID4gQ0xJQ0tfSU5URVJWQUxfSU5fTVMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VGltZVByZXNzZWRNcyA9IG5vdztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGtleUNvZGUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuVVA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vblVwICE9PSBudWxsKSBzZWxmLm9uVXAuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuRE9XTjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uRG93biAhPT0gbnVsbCkgc2VsZi5vbkRvd24uY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuTEVGVDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uTGVmdCAhPT0gbnVsbCkgc2VsZi5vbkxlZnQuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuUklHSFQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vblJpZ2h0ICE9PSBudWxsKSBzZWxmLm9uUmlnaHQuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBLZXlib2FyZENvbnRyb2xsZXIub25XQVNEVXAoZG9taWQsIGZ1bmN0aW9uIChrZXlDb2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleUNvZGUgPT09IDg3IHx8IGtleUNvZGUgPT09IDY1IHx8IGtleUNvZGUgPT09IDY4IHx8IGtleUNvZGUgPT09IDgzKSB7XG4gICAgICAgICAgICAgICAgICAgIGtleVByZXNzZWRbXCJcIitrZXlDb2RlXSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWtleVByZXNzZWRbXCI4N1wiXSAmJiAha2V5UHJlc3NlZFtcIjY1XCJdICYmICFrZXlQcmVzc2VkW1wiNjhcIl0gJiYgIWtleVByZXNzZWRbXCI4M1wiXSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmtleURpcmVjdGlvbiA9IERQYWQuTk9ORTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlza2V5ZG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RDbGljayA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGtleVByZXNzQ2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNrZXlkb3duKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChub3cgLSBsYXN0VGltZVByZXNzZWRNcykgPiBDTElDS19JTlRFUlZBTF9JTl9NUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFRpbWVQcmVzc2VkTXMgPSBub3c7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGN1cnJlbnRLZXkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5VUDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25VcCAhPT0gbnVsbCkgc2VsZi5vblVwLmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5ET1dOOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkRvd24gIT09IG51bGwpIHNlbGYub25Eb3duLmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5MRUZUOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkxlZnQgIT09IG51bGwpIHNlbGYub25MZWZ0LmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5SSUdIVDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25SaWdodCAhPT0gbnVsbCkgc2VsZi5vblJpZ2h0LmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpc3RlbmVyID0gc2V0SW50ZXJ2YWwoa2V5UHJlc3NDaGVjaywgSU5URVJWQUxfU1BFRUQpO1xuXG4gICAgICAgIHRoaXMub25VcCA9IG51bGw7XG4gICAgICAgIHRoaXMub25Eb3duID0gbnVsbDtcbiAgICAgICAgdGhpcy5vbkxlZnQgPSBudWxsO1xuICAgICAgICB0aGlzLm9uUmlnaHQgPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLmtleURpcmVjdGlvbiA9IERQYWQuTk9ORTtcbn1cblxuRFBhZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEFuYWxvZ1N0aWNrLnByb3RvdHlwZSk7XG5cbkRQYWQuVVAgPSA4NztcbkRQYWQuRE9XTiA9IDgzO1xuRFBhZC5MRUZUID0gNjU7XG5EUGFkLlJJR0hUID0gNjg7XG5EUGFkLk5PTkUgPSAtMTtcblxuaWYgKFV0aWxzLmlzVG91Y2hEZXZpY2UoKSkge1xuICAgIERQYWQucHJvdG90eXBlLmdldERpcmVjdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmICh0aGlzLmlzUHJlc3NlZCgpKSB7XG4gICAgICAgICAgICB2YXIgZGVnID0gdGhpcy5nZXREZWdyZWUoKTtcbiAgICAgICAgICAgIGlmIChkZWcgPCA0NSB8fCBkZWcgPj0gMzE1KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gRFBhZC5MRUZUO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkZWcgPCAzMTUgJiYgZGVnID49IDIyNSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBEUGFkLlVQO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkZWcgPCAyMjUgJiYgZGVnID49IDEzNSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBEUGFkLlJJR0hUO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRFBhZC5ET1dOO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIERQYWQuTk9ORTtcbiAgICAgICAgfVxuICAgIH07XG59IGVsc2Uge1xuICAgIERQYWQucHJvdG90eXBlLmdldERpcmVjdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmtleURpcmVjdGlvbjtcbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERQYWQ7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiA0LzQvMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBTUEFDRSA6IFwic3BcIixcbiAgICBFTlRFUiA6IFwiZW5cIixcbiAgICBFU0MgOiBcImVzY1wiLFxuICAgIFEgOiBcInFcIixcbiAgICBFIDogXCJlXCJcbn07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiA0LzQvMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcbnZhciBLRVlTID0gcmVxdWlyZSgnLi9LRVlTLmpzJyk7XG5cbnZhciBfa2V5VG9CdXR0b24gPSB7fTtcblxuZnVuY3Rpb24gdGVzdEFuZEV4ZWNLZXkoa2V5Y29kZSwgZXhwZWN0ZWRLZXljb2RlLCB2YWx1ZSkge1xuICAgIGlmIChleHBlY3RlZEtleWNvZGUgPT09IGtleWNvZGUgJiYgdmFsdWUgaW4gX2tleVRvQnV0dG9uKSB7XG4gICAgICAgIHZhciBidG4gPSBfa2V5VG9CdXR0b25bdmFsdWVdO1xuICAgICAgICBpZiAoYnRuLm9uQ2xpY2sgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGJ0bi5vbkNsaWNrLmNhbGwoYnRuKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5pZiAoIVV0aWxzLmlzVG91Y2hEZXZpY2UoKSkge1xuXG4gICAgZG9jdW1lbnQub25rZXl1cCA9IGZ1bmN0aW9uIChlKSB7XG5cbiAgICAgICAgdmFyIGtleUNvZGUgPSBlLmtleUNvZGU7XG5cbiAgICAgICAgLy8gaWdub3JlIFdBU0RcbiAgICAgICAgaWYgKGtleUNvZGUgIT09IDg3ICYmIGtleUNvZGUgIT09IDY1ICYmXG4gICAgICAgICAgICBrZXlDb2RlICE9PSA4MyAmJiBrZXlDb2RlICE9PSA2OCkge1xuICAgICAgICAgICAgaWYgKCF0ZXN0QW5kRXhlY0tleShrZXlDb2RlLCAzMiwgS0VZUy5TUEFDRSkpXG4gICAgICAgICAgICAgICAgaWYgKCF0ZXN0QW5kRXhlY0tleShrZXlDb2RlLCAxMywgS0VZUy5FTlRFUikpXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGVzdEFuZEV4ZWNLZXkoa2V5Q29kZSwgMjcsIEtFWVMuRVNDKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGVzdEFuZEV4ZWNLZXkoa2V5Q29kZSwgODEsIEtFWVMuUSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0ZXN0QW5kRXhlY0tleShrZXlDb2RlLCA2OSwgS0VZUy5FKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpID0gMCwgTCA9IF93YXNkQ2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgTDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgX3dhc2RDYWxsYmFja3NbaV0uY2FsbGJhY2soa2V5Q29kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH07XG5cbn1cblxudmFyIF93YXNkQ2FsbGJhY2tzID0gW107XG5cbmZ1bmN0aW9uIGRlbGV0ZUJ5SWQoZG9tSWQsIGxpc3QpIHtcbiAgICB2YXIgaSA9IDAsIEwgPSBsaXN0Lmxlbmd0aDtcbiAgICBmb3IgKDsgaSA8IEw7IGkrKykge1xuICAgICAgICBpZiAobGlzdFtpXS5pZCA9PT0gZG9tSWQpIHtcbiAgICAgICAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgLyoqXG4gICAgICogRXZlbnQgd2lsbCBiZSBjYWxsZWQgd2hlbiBhIFdBU0Qga2V5IHdhcyBwcmVzc2VkIGFuZCBpcyB1cCBhZ2FpblxuICAgICAqIEBwYXJhbSBkb21JZCB0byBtYWtlIGl0IHJlbW92YWJsZVxuICAgICAqIEBwYXJhbSBjYWxsYmFjayB7ZnVuY3Rpb259XG4gICAgICovXG4gICAgb25XQVNEVXA6IGZ1bmN0aW9uIChkb21JZCwgY2FsbGJhY2spIHtcbiAgICAgICAgZGVsZXRlQnlJZChkb21JZCwgX3dhc2RDYWxsYmFja3MpO1xuICAgICAgICBfd2FzZENhbGxiYWNrcy5wdXNoKHtpZDogZG9tSWQsIGNhbGxiYWNrOiBjYWxsYmFja30pO1xuICAgIH0sXG5cbiAgICBrZXlUb0J1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX2tleVRvQnV0dG9uO1xuICAgIH1cblxufTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDQvNC8yMDE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuLy9yZXF1aXJlKCcuL3RvdWNoQ29udHJvbGxlci5qcycpO1xuXG52YXIgVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG52YXIgQW5hbG9nU3RpY2sgPSByZXF1aXJlKCcuL0FuYWxvZ1N0aWNrLmpzJyk7XG52YXIgRFBhZCA9IHJlcXVpcmUoJy4vRFBhZC5qcycpO1xudmFyIEJ1dHRvbiA9IHJlcXVpcmUoJy4vQnV0dG9uLmpzJyk7XG52YXIgS0VZUyA9IHJlcXVpcmUoJy4vS0VZUy5qcycpO1xuXG52YXIgX2RpYW1ldGVyID0gVXRpbHMuZGlhbWV0ZXIoKTtcbnZhciBfYnRuRGlhbWV0ZXIgPSBVdGlscy5idG5EaWFtZXRlcigpO1xuXG5pZiAoVXRpbHMuaXNUb3VjaERldmljZSgpKSB7XG4gICAgZG9jdW1lbnQud3JpdGUoXCI8c3R5bGUgaWQ9J3RvdWNoQ29udHJvbGxlclN0eWxlJz4udG91Y2hDb250cm9sbGVyeyBcIiArXG4gICAgICAgIFwid2lkdGg6XCIrX2RpYW1ldGVyK1wicHg7aGVpZ2h0OlwiK19kaWFtZXRlcitcInB4O2JvcmRlcjoycHggc29saWQgYmxhY2s7cG9zaXRpb246YWJzb2x1dGU7Ym9yZGVyLXJhZGl1czo1MCU7XCIgK1xuICAgICAgICBcIiB9IC5pbm5lclRvdWNoQ29udHJvbGxlciB7XCIgK1xuICAgICAgICBcIndpZHRoOjVweDtoZWlnaHQ6NXB4O21hcmdpbi1sZWZ0OmF1dG87bWFyZ2luLXJpZ2h0OmF1dG87bWFyZ2luLXRvcDpcIisoTWF0aC5jZWlsKF9kaWFtZXRlci8yKSkrXG4gICAgICAgIFwicHg7YmFja2dyb3VuZC1jb2xvcjpibGFjazt9XCIgK1xuICAgICAgICBcIi50b3VjaEJ0bntwb3NpdGlvbjphYnNvbHV0ZTtib3JkZXI6MnB4IHNvbGlkIGJsYWNrO3Bvc2l0aW9uOmFic29sdXRlO2JvcmRlci1yYWRpdXM6NTAlO1wiICtcbiAgICAgICAgXCJ3aWR0aDpcIitfYnRuRGlhbWV0ZXIrXCJweDtoZWlnaHQ6XCIrX2J0bkRpYW1ldGVyK1wicHg7fVwiICtcbiAgICAgICAgXCIudG91Y2hCdG5UeHR7dGV4dC1hbGlnbjpjZW50ZXI7bGluZS1oZWlnaHQ6XCIrX2J0bkRpYW1ldGVyK1wicHg7fVwiICtcbiAgICAgICAgXCIudG91Y2hCdG4ucHJlc3NlZHtiYWNrZ3JvdW5kLWNvbG9yOmNvcm5mbG93ZXJibHVlO31cIiArXG4gICAgICAgIFwiPC9zdHlsZT5cIik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdlYXRoZXIgdGhlIGN1cnJlbnQgZGV2aWNlIGNhbiB1c2UgdG91Y2ggb3Igbm90XG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgaXNUb3VjaERldmljZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gVXRpbHMuaXNUb3VjaERldmljZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBzdHJpcHMgYXdheSB0aGUgZGVmYXVsdCBzdHlsZVxuICAgICAqL1xuICAgIHN0cmlwU3R5bGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG91Y2hDb250cm9sbGVyU3R5bGUnKTtcbiAgICAgICAgZWxlbWVudC5vdXRlckhUTUwgPSBcIlwiO1xuICAgIH0sXG5cbiAgICBBbmFsb2dTdGljazogQW5hbG9nU3RpY2ssXG5cbiAgICBEUGFkOiBEUGFkLFxuXG4gICAgQnV0dG9uOiBCdXR0b24sXG5cbiAgICBLRVlTOiBLRVlTXG5cbn07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiA0LzQvMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIGlzVG91Y2hEZXZpY2UoKSB7XG4gICAgcmV0dXJuICgoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KVxuICAgICAgICB8fCAobmF2aWdhdG9yLk1heFRvdWNoUG9pbnRzID4gMClcbiAgICAgICAgfHwgKG5hdmlnYXRvci5tc01heFRvdWNoUG9pbnRzID4gMCkpO1xufVxuXG52YXIgX2lzVG91Y2hEZXZpY2UgPSBpc1RvdWNoRGV2aWNlKCk7XG5cbnZhciBfaXNDaHJvbWUgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignY2hyb21lJykgPiAtMTtcblxudmFyIF90b0RlZyA9IDE4MCAvIE1hdGguUEk7XG5cbnZhciBfY3VycmVudElkID0gMDtcblxudmFyIF90b3BUb3VjaE9mZnNldCA9IDA7XG5pZiAoX2lzQ2hyb21lKSB7XG4gICAgX3RvcFRvdWNoT2Zmc2V0ID0gMTAwO1xufVxuXG52YXIgX2RpYW1ldGVyID0gMTQwO1xudmFyIF9idG5EaWFtZXRlciA9IDY1O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIGRpYW1ldGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfZGlhbWV0ZXI7XG4gICAgfSxcblxuICAgIGJ0bkRpYW1ldGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfYnRuRGlhbWV0ZXI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGdlbmVyYXRlcyBhIG5ldyB1bmlxdWUgaWRcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIG5ld0lkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcInRvdWNoQ29udHJvbGxlclwiICsgX2N1cnJlbnRJZCsrO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVja3Mgd2VhdGhlciB0aGUgZGV2aWNlIGNhbiB1c2UgdG91Y2ggb3Igbm90XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNUb3VjaERldmljZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX2lzVG91Y2hEZXZpY2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybmVzIHRydWUgd2hlbiB0aGUgcmVuZGVyZXIgaXMgQ2hyb21lXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNDaHJvbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF9pc0Nocm9tZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZWxlbVxuICAgICAqIEByZXR1cm5zIHt7dG9wOiBudW1iZXIsIGxlZnQ6IG51bWJlcn19XG4gICAgICovXG4gICAgZ2V0T2Zmc2V0UmVjdDogZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgICAgLy8gKDEpXG4gICAgICAgIHZhciBib3ggPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIHZhciBkb2NFbGVtID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICAvLyAoMilcbiAgICAgICAgdmFyIHNjcm9sbFRvcCA9IHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2NFbGVtLnNjcm9sbFRvcCB8fCBib2R5LnNjcm9sbFRvcDtcbiAgICAgICAgdmFyIHNjcm9sbExlZnQgPSB3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jRWxlbS5zY3JvbGxMZWZ0IHx8IGJvZHkuc2Nyb2xsTGVmdDtcbiAgICAgICAgLy8gKDMpXG4gICAgICAgIHZhciBjbGllbnRUb3AgPSBkb2NFbGVtLmNsaWVudFRvcCB8fCBib2R5LmNsaWVudFRvcCB8fCAwO1xuICAgICAgICB2YXIgY2xpZW50TGVmdCA9IGRvY0VsZW0uY2xpZW50TGVmdCB8fCBib2R5LmNsaWVudExlZnQgfHwgMDtcbiAgICAgICAgLy8gKDQpXG4gICAgICAgIHZhciB0b3AgPSBib3gudG9wICsgc2Nyb2xsVG9wIC0gY2xpZW50VG9wO1xuICAgICAgICB2YXIgbGVmdCA9IGJveC5sZWZ0ICsgc2Nyb2xsTGVmdCAtIGNsaWVudExlZnQ7XG4gICAgICAgIHJldHVybiB7IHRvcDogTWF0aC5yb3VuZCh0b3ApLCBsZWZ0OiBNYXRoLnJvdW5kKGxlZnQpIH07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHRyYW5zZm9ybXMgdHdvIHBvaW50cyB0byB0aGUgZGVncmVlIGluIGJldHdlZW5cbiAgICAgKiBAcGFyYW0geDFcbiAgICAgKiBAcGFyYW0geTFcbiAgICAgKiBAcGFyYW0geDJcbiAgICAgKiBAcGFyYW0geTJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldERlZ3JlZTogZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgdmFyIHggPSB4MS14MjtcbiAgICAgICAgdmFyIHkgPSB5MS15MjtcbiAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5hdGFuMigteSwgeCk7XG4gICAgICAgIGlmICh0aGV0YSA8IDApIHRoZXRhICs9IDIgKiBNYXRoLlBJO1xuICAgICAgICByZXR1cm4gdGhldGEgKiBfdG9EZWc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE5lZWRlZCBmb3Igc29tZSBvZmZzZXR0aW5nXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICB0b3BUb3VjaE9mZnNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3RvcFRvdWNoT2Zmc2V0O1xuICAgIH1cblxufTsiXX0=
