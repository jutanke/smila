var Sprite = require('./../lib/Sprite.js');

describe("Sprite", function () {

    it("should have correct settings", function () {

        var sprite = new Sprite({
          "w": 10,
          "h": 15
        });

        expect(sprite.w).toBe(10);
        expect(sprite.h).toBe(15);
    });

});
