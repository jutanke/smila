/**
 * Created by julian on 2/23/15.
 */
"use strict";

var Utils = require('yutils');

var lastId = 0;

/**
 *
 * @param canvas
 * @param w of the sub image
 * @param h of the sub image
 * @constructor
 */
function Sprite(canvas, w, h) {
    Utils.assertLength(arguments, 3);
    this.id = lastId++;
    this.img = canvas;
    this.w = w | 0;
    this.h = h | 0;
    this.w_2 = Math.floor(this.w / 2) | 0;
    this.h_2 = Math.floor(this.h / 2) | 0;
    this.ox = 0 | 0;
    this.oy = 0 | 0;
    this.x = 0 | 0;
    this.y = 0 | 0;
    this.angleInRadians = 0;
    this.tl_x = this.x - this.w_2; // TOP-LEFT-X
    this.tl_y = this.y - this.h_2; // TOP-LEFT-Y
    this.mirrory = false;
    this.mirrorx = false;
}

/**
 * Centered sprite position
 * @param x
 * @param y
 */
Sprite.prototype.positionCenter = function (x, y) {
    this.x = x | 0;
    this.y = y | 0;
    this.tl_x = (x - this.w_2)  | 0;
    this.tl_y = (y - this.h_2)  | 0;
};

/**
 * Top-Left sprite position
 * @param x
 * @param y
 * @returns {Sprite}
 */
Sprite.prototype.position = function (x, y) {
    this.tl_x = x | 0;
    this.tl_y = y | 0;
    this.x = (x + this.w_2) | 0;
    this.y = (y + this.h_2) | 0;
    return this;
};

/**
 *
 * @param context
 */
Sprite.prototype.render = function (context) {
    var mirrorx = this.mirrorx;
    var mirrory = this.mirrory;
    var x = this.x;
    var y = this.y;
    var w = this.w;
    var h = this.h;
    var wh = this.w_2;
    var hh = this.h_2;
    context.translate(x,y);
    if (this.angleInRadians !== 0) context.rotate(this.angleInRadians);
    if (mirrory && mirrorx) context.scale(-1,-1);
    else if (mirrory) context.scale(-1,1);
    else if (mirrorx) context.scale(1,-1);
    context.drawImage(this.img,this.ox,this.oy,w,h,-wh,-hh,w,h);
    if (mirrory && mirrorx) context.scale(1,1);
    else if (mirrory) context.scale(-1,1);
    else if (mirrorx) context.scale(1,-1);
    if (this.angleInRadians !== 0) context.rotate(-this.angleInRadians);
    context.translate(-x, -y);
};

Sprite.prototype.subimage = function(x,y){
    this.ox = x * this.w;
    this.oy = y * this.h;
    return this;
};

Sprite.prototype.directImage = function(ox,oy, w,h){
    this.ox = ox;
    this.oy = oy;
    this.width(w);
    this.height(h);
};

Sprite.prototype.verticalMirror = function(mirror){
    this.mirrory = mirror;
};

Sprite.prototype.horizontalMirror = function(mirror){
    this.mirrorx = mirror;
};

module.exports = Sprite;