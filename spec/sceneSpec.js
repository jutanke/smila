/**
 * Created by julian on 4/30/15.
 */
var Scene = require("./../lib/Scene.js");

describe("Scene", function () {

    it("should insert", function () {
        var scene = new Scene("a", {});
        var renderItemDummy = {id: 0, render: function () { }};
        scene.addRenderItem(renderItemDummy);
        expect(scene.renderItems.length).toBe(1);
    });

    it("should delete", function () {
        var scene = new Scene("a", {});
        var renderItemDummy = {id: 0, render: function () { }};
        scene.addRenderItem(renderItemDummy);
        scene.removeRenderItem(renderItemDummy);
        expect(scene.renderItems.length).toBe(0);
    });

    it("should not allow multiple inserts", function () {
        var scene = new Scene("a", {});
        var renderItemDummy = {id: 0, render: function () { }};
        scene.addRenderItem(renderItemDummy);
        try {
            scene.addRenderItem(renderItemDummy);
        } catch (e) {

        }
        expect(scene.renderItems.length).toBe(1);
    });

    it("should insert a map", function () {
        var map = {
            renderFront: function() {},
            getRenderItems: function() {return [];},
            renderBack: function() {}

        };
        var scene = new Scene("a", {map:map});
        expect(scene.map).toBe(map);
    });

    it("should not insert a broken map", function () {
        var map = {
            renderFront: function() {},
            renderBack: function() {}
        };
        try {
            var scene = new Scene("a", {map: map});
        } catch (e) {
            expect(5).toBe(5);
            return;
        }
        expect(5).toBe(1);
    });

});