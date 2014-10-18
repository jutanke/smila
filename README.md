#Smila

- 2D-rendering-library

Getting started:
the Top-Left is 0|0

New library (smila2.js) is recommended

##API (smila2.js)

```javascript



##API - Old library (smila.js)

###HTML

```html
<div id="smila" style="width:340px;height:500px">
</div>
```

###JavaScript

```javascript
// Create a View for rendering inside of the div "smila"
var renderer = new Smila.Renderer("smila", {
   trackMouse: true /* track the mouse */
});
```

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

        // create a entity that has different animations.
        // You can name the animations however you want (for example: up, down and dance)
        var entity = Smila.DataStore.getEntity("character", {
            up : {
                anims : [{x:2,y:0},{x:0,y:1}],
                durationPerFrame : 300,
                type : Smila.Animation.Type.BOUNCE
            },
            down : {
                anims : [{x:2,y:2},{x:1,y:1}],
                durationPerFrame: 300,
                type : Smila.Animation.Type.ONCE
            },
            dance : {
                anims : [{x:1,y:0},{x:3,y:0},{x:1,y:2}],
                durationPerFrame: 400,
                type : Smila.Animation.Type.ENDLESS
            }
        });

        // attach the entity to the update cycle
        entity.onUpdate(function(dt,elapsed){
            ... do stuff
        });

        // let the animation "up" play
        entity.animate("up");

        // set position in Pixel
        entity.position(10,5);

        // outlines the entity when the mouse enters the sprite
        entity.onmouseenter(function(){
            this.outline(true);
        });

        // get the render-dimension:
        var dimension = Smila.Renderer.dimension();

        // removes the entity when the mouse leaves the sprite
        entity.onmouseleave(function(){
            this.outline(false);
        });

        // adds the entity to the render system. From this point on the sprite is visible on screen
        Smila.Renderer.add(entity);

        // get the map
        var map = Smila.DataStore.getMap("map");

        // set a map to the renderer
        Smila.Renderer.setMap(map);

        // translates the viewport to 10x10
        Smila.Renderer.camera().translate(10,10);

        // Particle System:
        var emitter = Smila.Renderer.createParticleEmitter({
            particleCount : 100,
            p : {x:100,y:50},  // position of the emitter (this value can be changed later!)
            v : {x:0, y:0},
            dir : {x:0, y:.6},
            s : Math.PI,
            e : 20,
            ttl: .2 * 1000,
            color: ["#FF0033","#FFFF33"]
        });

        // moves the emitter 10 pixel to the right
        emitter.point.x += 10;

    });

});

```
