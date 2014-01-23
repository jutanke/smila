(function (){
    "use strict"

    var Quo = function(){

    };

    var Grid = Quo.Grid = function(cellw, cellh,w,h){
        this.cellWidth = cellw;
        this.cellHeight = cellh;
        this.w = w;
        this.h = h;
        this.isstopped = false;
        this.outOfBoundsCell = null;
        this.data = [];
        for (var x = 0; x < w; x++){
            this.data[x] = [];
            for (var y = 0; y < h; y++){
                this.data[x][y] = new Cell(x,y,new AABB(x*cellw,y*cellh,cellw,cellh));
            }
        }
        this.active = {};
        this.lastItemId = 0;
        this.thread = -1;
    };

    Grid.prototype.startUpdate = function(){
        this.thread = updateBuilder(this);
    };

    Grid.prototype.stopUpdate = function(){
        clearInterval(this.thread);
    };

    Grid.prototype.add = function(item, isActive){
        var pos = getCellXY(item,this);
        if(typeof item.$quo_id === 'undefined'){
            item.$quo_id = this.lastItemId++;
        }
        var cell = null;
        if (pos.x > this.w || pos.y > this.h){
            // pos is out of bounds
            if (this.outOfBoundsCell === null){
                this.outOfBoundsCell = new Cell(-1,-1,new AABB(0,0,Number.MAX_VALUE,Number.MAX_VALUE));
            }
            this.outOfBoundsCell.add(item);
            cell = this.outOfBoundsCell;
        }else{
            cell = this.data[pos.x][pos.y];
            cell.add(item);
        }
        if(isActive){
            this.active[item.$quo_id] = {item:item, cell:cell};
        }
        return cell;
    };

    Grid.prototype.query = function(dimension){
        var x = Math.max(Math.floor(dimension.x / this.cellWidth),0);
        var mx = Math.min(Math.floor((dimension.x + dimension.w) / this.cellWidth),this.w);
        var y = Math.max(Math.floor(dimension.y / this.cellHeight), 0);
        var my = Math.min(Math.floor((dimension.y + dimension.h) / this.cellHeight),this.h);
        if(x>mx || y>my){
            if(this.outOfBoundsCell === null) return [];
            var result = [];
            for(var key in this.outOfBoundsCell.data){
                // todo: maybe check, if element is in the query
                result.push(this.outOfBoundsCell[key]);
            }
            return result;
        }
        if (mx == x && my == y){
            var cell = this.data[x][y];
            var result = [];
            if(cell.count > 0){
                for(var key in cell.data){
                    result.push(cell.data[key]);
                }
                return result;
            }
            return [];
        }
        var result = [];
        for(var X = x; X < mx+1; X++){
            for(var Y = y; Y < my+1; Y++){
                var cell = this.data[X][Y];
                if (cell.count > 0){
                    var data = cell.data;
                    for(var key in data){
                        result.push(data[key]);
                    }
                }
            }
        }
        if(this.outOfBoundsCell !== null){
            for(var key in this.outOfBoundsCell.data){
                // todo: maybe check, if element is in the query
                result.push(this.outOfBoundsCell[key]);
            }
        }
        return result;
    };

    /**
     * Injects the AABB-Functionality into the Object.
     * @param object
     * @param x
     * @param y
     * @param w
     * @param h
     * @constructor
     */
    Quo.AABBify = function(object,x,y,w,h){
        object.x = typeof object.x === 'undefined' ? x || 0 : object.x;
        object.y = typeof object.y === 'undefined' ? y || 0 : object.y;
        object.mx = object.x + (typeof object.w === 'undefined' ? w || 100 : object.w);
        object.my = y + (typeof object.h === 'undefined' ? h || 100 : object.h);
        object.AABBmoveTo = AABB.prototype.AABBmoveTo;
        object.touch = AABB.prototype.touch;
    };

    /**
     * AABB-Bounding-Box
     */
    var AABB = Quo.AABB = function(x,y,w,h){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.mx = x + w;
        this.my = y + h;
    };

    AABB.prototype.AABBmoveTo = function(x,y){
        this.x = x;
        this.y = y;
        this.mx = x + this.w;
        this.my = y + this.h;
    };

    /**
     * @param other {AABB}
     * @return {Boolean} True, when the two AABB's touch in any way, else False
     */
    AABB.prototype.touch = function(other){
        if(this.x <= other.x && this.mx >= other.x){
            if (this.y <= other.y && this.my >= other.y){
                return true;
            }
            if(this.y <= other.my && this.my >= other.my){
                return true;
            }
        }
        if (this.x <= other.mx && this.mx >= other.mx){
            if (this.y < other.y && this.my > other.y){
                return true;
            }
            if(this.y <= other.my && this.my >= other.my){
                return true;
            }
        }
        if (this.x >= other.x && this.x <= other.mx){
            if (this.y >= other.y && this.y <= other.my){
                return true;
            }
        }
        return false;
    };


    //=============================================
    var root = this;
    var isNode = false;
    if (typeof module !== 'undefined' && module.exports){
        module.exports = Quo;
        if (root) root.Quo = Quo;
        isNode = true;
    }else{
        if (root) root.Quo = Quo;
        window.Quo = Quo;
    }
    //============================================

    // P R I V A T E   F U N C T I O N

    var Cell = function(x,y,aabb){
        this.data = {};
        this.count = 0;
        this.aabb = aabb;
    };

    Cell.prototype.contains = function(aabb){
        return this.aabb.touch(aabb);
    }

    Cell.prototype.add=function(item){
        this.data[item.$quo_id] = item;
        this.count += 1;
    };

    Cell.prototype.rem=function(item){
        delete this.data[item.$quo_id];
        this.count -= 1;
    };

    function getCellXY(item, raster){
        var x = Math.floor(item.x / raster.cellWidth);
        var y = Math.floor(item.y / raster.cellHeight);
        return {x:x,y:y};
    }

    function updateBuilder (grid){
        var active = grid.active;
        return setInterval(function(){
            for(var key in active){
                var current = active[key];
                if(!current.cell.contains(current.item)){
                    // position changed out of cell
                    current.cell.rem(current.item);
                    //var newcell = getCellXY(current.item,grid);
                    //newcell.add(current.item);
                    //current.cell = newcell;
                    current.cell = grid.add(current.item);
                }
            }
        },400);
    }

})();