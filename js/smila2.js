
/**
 * Impl overtime-swaps
 *
 * Name: smila2
 * User: Baka (Julian)
 * Date: 23.01.14
 * Time: 23:00
 */
window.Smila = function(){

    var VERBOSE = true;

    function Smila(){};

    // :::::::::::::::::::::::
    // Smila.Renderer::PRIVATE
    // :::::::::::::::::::::::

    var rendererIsStarted = false;

    Smila.Renderer = {

        /**
         * Amount of Sprites the Renderer can take for the beginning
         */
        startSize : 100,

        start : function(){
            log("[Smila::Renderer]->start")
            if(rendererIsStarted) throw "[Smila::Renderer]->start : Already started!";
            else{
                if(window.CanvasRenderingContext2D){

                }else{
                    log("[Smila::Renderer]->start | failed, canvas2d not supported");
                }
            }

        }
    };

    // =====================================================
    //
    // ~~~~~~~ private Renderer-Functions
    // =====================================================
    // Sprite-Layout:
    // [ID:2][X:2][Y:2][SX:2][SY:2][W:2][H:2][SPID:2][dX:1][dY:1]
    var BYTE_PER_SPRITE = 18|0;
    var SHORT_PER_SPRITE = (BYTE_PER_SPRITE/2)|0;

    /**
     *
     * @param n {Integer} Number of Sprites
     * @param oldRaw {ArrayBuffer}
     * @param oldShort {Uint16Array}
     * @param oldByte {Int8Array}
     * @return {Object}
     */
    function createRaw(n, oldRaw, oldShort, oldByte){
        var raw = new ArrayBuffer(n*BYTE_PER_SPRITE);
        var rawTemp = new ArrayBuffer(BYTE_PER_SPRITE);
        var uShortView = new Uint16Array(raw);
        var byteView = new Int8Array(raw);
        var uShortTempView = new Uint16Array(rawTemp);
        if(typeof oldRaw !== 'undefined' ){
            var l = oldRaw.byteLength / BYTE_PER_SPRITE;
            for(var i = 0; i < l; i = i++){
                setSpriteToRaw(uShortView,byteView,i,getSpriteFromRaw(oldShort,oldByte,i));
            }
        }
        return {
            uShortView : uShortView,
            byteView : byteView,
            uShortTempView : uShortTempView,
            raw : raw
        };
    };

    // getID(uShortView, i)
    // swapSprite(uShortView, uShortTempView,i,j)
    // getSpriteFromRaw(uShortView, byteView, i)
    // setSpriteToRaw(uShortView,byteView,i,id,x,y,sx,sy,w,h,spid,dx,dy)

    function getID(a,d){return a[SHORT_PER_SPRITE*d]}function swapSprite(a,d,c,b){c!==b&&(c*=SHORT_PER_SPRITE,b*=SHORT_PER_SPRITE,d[0]=a[c],d[1]=a[c+1],d[2]=a[c+2],d[3]=a[c+3],d[4]=a[c+4],d[5]=a[c+5],d[6]=a[c+6],d[7]=a[c+7],d[8]=a[c+8],a[c]=a[b],a[c+1]=a[b+1],a[c+2]=a[b+2],a[c+3]=a[b+3],a[c+4]=a[b+4],a[c+5]=a[b+5],a[c+6]=a[b+6],a[c+7]=a[b+7],a[c+8]=a[b+8],a[b]=d[0],a[b+1]=d[1],a[b+2]=d[2],a[b+3]=d[3],a[b+4]=d[4],a[b+5]=d[5],a[b+6]=d[6],a[b+7]=d[7],a[b+8]=d[8])}
    function getSpriteFromRaw(a,d,c){var b=SHORT_PER_SPRITE*c;c*=BYTE_PER_SPRITE;return{id:a[b],x:a[b+1],y:a[b+2],sx:a[b+3],sy:a[b+4],w:a[b+5],h:a[b+6],spid:a[b+7],dx:d[c+16],dy:d[c+17]}}
    function setSpriteToRaw(a,d,c,b,g,h,k,l,m,n,p,q,r){var e=SHORT_PER_SPRITE*c,f=BYTE_PER_SPRITE*c;4===arguments.length?(a[e]=b.id,a[e+1]=b.x,a[e+2]=b.y,a[e+3]=b.sx,a[e+4]=b.sy,a[e+5]=b.w,a[e+6]=b.h,a[e+7]=b.spid,d[f+16]=b.dx,d[f+17]=b.dy):(a[e]=b,a[e+1]=g,a[e+2]=h,a[e+3]=k,a[e+4]=l,a[e+5]=m,a[e+6]=n,a[e+7]=p,d[f+16]=q,d[f+17]=r)};


    // =====================================================
    // ~~~~~~~ private Renderer-Functions End
    //
    // =====================================================

    var log = function (message) {
        if(VERBOSE) console.log(message);
    };

    // POLYFILLS

    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;

    return Smila;
}();