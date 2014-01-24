// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

function getID(uShortView,i){
    return uShortView[SHORT_PER_SPRITE * i];
};

function swapSprite(uShortView, uShortTempView, i, j){
    if(i!==j){
        var si = SHORT_PER_SPRITE * i;
        var sj = SHORT_PER_SPRITE * j;
        uShortTempView[0] = uShortView[si];
        uShortTempView[1] = uShortView[si+1];
        uShortTempView[2] = uShortView[si+2];
        uShortTempView[3] = uShortView[si+3];
        uShortTempView[4] = uShortView[si+4];
        uShortTempView[5] = uShortView[si+5];
        uShortTempView[6] = uShortView[si+6];
        uShortTempView[7] = uShortView[si+7];
        uShortTempView[8] = uShortView[si+8];
        // --
        uShortView[si] = uShortView[sj];
        uShortView[si+1] = uShortView[sj+1];
        uShortView[si+2] = uShortView[sj+2];
        uShortView[si+3] = uShortView[sj+3];
        uShortView[si+4] = uShortView[sj+4];
        uShortView[si+5] = uShortView[sj+5];
        uShortView[si+6] = uShortView[sj+6];
        uShortView[si+7] = uShortView[sj+7];
        uShortView[si+8] = uShortView[sj+8];
        // --
        uShortView[sj] = uShortTempView[0];
        uShortView[sj+1] = uShortTempView[1];
        uShortView[sj+2] = uShortTempView[2];
        uShortView[sj+3] = uShortTempView[3];
        uShortView[sj+4] = uShortTempView[4];
        uShortView[sj+5] = uShortTempView[5];
        uShortView[sj+6] = uShortTempView[6];
        uShortView[sj+7] = uShortTempView[7];
        uShortView[sj+8] = uShortTempView[8];
    }
};

/**
 * returns the whole sprite Data
 * @return {Object}
 */
function getSpriteFromRaw(uShortView, byteView, i){
    var si = SHORT_PER_SPRITE * i;
    var bi = BYTE_PER_SPRITE * i;
    return {
        id : uShortView[si],
        x : uShortView[si+1],
        y : uShortView[si+2],
        sx : uShortView[si+3],
        sy : uShortView[si+4],
        w : uShortView[si+5],
        h : uShortView[si+6],
        spid : uShortView[si+7],
        dx : byteView[bi+16],
        dy : byteView[bi+17]
    };
}

/**
 * Sets the sprite data to the raw
 */
function setSpriteToRaw(uShortView, byteView, i,id,x,y,sx,sy,w,h,spid,dx,dy){
    var si = SHORT_PER_SPRITE * i;
    var bi = BYTE_PER_SPRITE * i;
    if(arguments.length === 4){
        uShortView[si] = id.id;
        uShortView[si+1] = id.x;
        uShortView[si+2] = id.y;
        uShortView[si+3] = id.sx;
        uShortView[si+4] = id.sy;
        uShortView[si+5] = id.w;
        uShortView[si+6] = id.h;
        uShortView[si+7] = id.spid;
        byteView[bi+16] = id.dx;
        byteView[bi+17] = id.dy;
    }else{
        uShortView[si] = id;
        uShortView[si+1] = x;
        uShortView[si+2] = y;
        uShortView[si+3] = sx;
        uShortView[si+4] = sy;
        uShortView[si+5] = w;
        uShortView[si+6] = h;
        uShortView[si+7] = spid;
        byteView[bi+16] = dx;
        byteView[bi+17] = dy;
    }
}
// +++++++++++++++++++++++++++++++++++