/**
 * Created by Julian on 2/24/2015.
 */
"use strict";
function Camera() {
    this.offset = {x:0,y:0};
    this.real = {x:0,y:0};
}

Camera.prototype.translate = function(offsetX, offsetY){
    this.offset.x = offsetX;
    this.offset.y = offsetY;
    if (offsetX === 0 && offsetY === 0){
        this.real.x = Math.round(this.real.x);
        this.real.y = Math.round(this.real.y);
    } else {
        this.real.x -= offsetX;
        this.real.y -= offsetY;
    }
};

Camera.prototype.render = function(context){
    context.translate(this.offset.x, this.offset.y);
};

Camera.prototype.set = function(x,y, context){
    var transX = this.real.x - x;
    var transY = this.real.y - y;
    this.translate(transX, transY);
    this.render(context);
    this.translate(0,0);
};

module.exports = Camera;