Smila

- 2D-rendering-library

Getting started:

```javascript

// start the renderer:
Smila.Renderer.start();

// load a map (you can also use an array of objects!)
Smila.DataStore.putMap({
    src : "res/maps/map.json",
    key : "map",
    imgFolder: "res/img/"
    }, function(){

    // load sprites (you can also use an array of objects!)
    Smila.DataStore.put({
        src : "res/img/character.png",
        w : 64,             // width of a single frame
        h : 64,             // height of a single frame
        key : "character",  // key, with which you can retrieve the img
        o : true,           // when true the sprite can have an outline {Optional}
        ocol : {r:125,g:0,b:0,a:255 }, // outline color  {Optional}
        bm : true           // bitmask, when true, the mouse collision is pixel perfect {Optional}
    }, function(){



    });

});

```
