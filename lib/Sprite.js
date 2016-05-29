"use strict";

var Sprite = function(canvas, data) {
  this.img = canvas;
  this.w = data.w;
  this.h = data.h;
}

Sprite.load: function(spriteData, callback, error) {

    var src = spriteData.src || spriteData.base64;
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      var context = canvas.getContext('2d');
      context.drawImage(img, 0, 0);
      var sprite = new Sprite(canvas, spriteData);
      callback.call(sprite);
    }

    if (error) {
      img.onerror = function() {
        error.call("failed to load " + src);
      }
    }

    img.src = src;
  }

};

module.exports = Sprite;
