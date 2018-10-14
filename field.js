var canvas = document.getElementById("canvas1");
var ctx = canvas.getContext("2d");

var canvasWidth = 900;
var canvasHeight = 900;

canvas.height = canvasHeight;
canvas.width = canvasWidth;
var canvasLeftOffset = canvas.offsetLeft;
var canvasTopOffset = canvas.offsetTop;

var createGrid = function(size) {
    //A 2d array of 0 (represents an empty square)
    var grid = [];
    var row;
    for (var i = 0; i < size; i++) {
        row = [];
        for (var k = 0; k < size; k++) {
            row.push(0);
        }
        grid.push(row);
    }
    return grid;
}

var drawGrid = function(grid, drawLines, hoverCoords) {
    var cellSize = canvas.width / grid[0].length;
    var cellValue, centerX, centerY;
    var count = 0;
    ctx.strokeStyle = "orange";
    for (var y = 0; y < grid.length; y++) {
        for (var x = 0; x < grid[0].length; x++) {
            //Go thru each space
            cellValue = grid[y][x];
            centerX = x*cellSize + cellSize/2;
            centerY = y*cellSize + cellSize/2
            if (cellValue == 1) {
                ctx.fillStyle = "green";
                ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
            }
            /*
            ctx.font = "20px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle"; 
            ctx.fillStyle = "black";
            ctx.fillText(count + "", centerX, centerY);
            */
            count++;
        }
    }
    if (drawLines) {
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var i = 1; i < grid[0].length; i++) {
            ctx.moveTo(i*cellSize, 0);
            ctx.lineTo(i*cellSize, canvas.height);
        }
        for (var i = 1; i < grid.length; i++) {
            ctx.moveTo(0, i*cellSize);
            ctx.lineTo(canvas.width, i*cellSize);
        }
        ctx.stroke();
    }
    if (hoverCoords != null) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.rect(hoverCoords[0]*cellSize, hoverCoords[1]*cellSize, cellSize, cellSize);
        ctx.stroke();
    }
}

var makeTerrain = function(grid, dial) {
    //Modify grid to include random terrain.
    for (var y = 0; y < grid.length; y++) {
        for (var x = 0; x < grid[0].length; x++) {
            if (Math.random() < dial) {
                grid[y][x] = 1;
            }
        }
    }
    //Remove terrain from starting areas (and later, make sure paths exist)
    grid[0][0] = 0;
    grid[grid.length-1][grid[0].length-1] = 0;
    grid[grid.length-1][0] = 0;
    grid[0][grid[0].length-1] = 0;
}

var drawPath = function(grid, path, color) {
    if (path == false) {
        return
    }
    /*Path = [
        [x1, y1],
        [x2, y2],
        ...
    ]
    */
    var cellSize = canvas.width / grid[0].length;
    var cellOffset = cellSize / 2;
    var x, y;
    ctx.lineWidth = 10;
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (var i = 0; i < path.length; i++) {
        x = path[i][0]*cellSize + cellOffset;
        y = path[i][1]*cellSize + cellOffset;

        if (i == 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

var neighbors = function(grid, cell) {
    //helper that returns a list of neighbors adjoining a cell
    var x = cell[0];
    var y = cell[1];
    var result = []
    var newX, newY;
    for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
            if (!(dx == 0 && dy == 0) && (dx == 0 || dy == 0)) {
                newX = x + dx;
                newY = y + dy;
                if (newX >= 0 && newX < grid[0].length) {
                    if (newY >= 0 && newY < grid.length) {
                        if (grid[newY][newX] == 0) {
                            result.push([newX, newY]);
                        }
                    }
                }
            }
        }
    }
    return result;
}

var notIn = function(arr, pair) {
    for (var i = 0; i < arr.length; i++) {
        if (pair[0] == arr[i][0] && pair[1] == arr[i][1]) {
            return false;
        }
    }
    return true;
}

var isIn = function(arr, pair) {
    return !notIn(arr, pair);
}

var isSame = function(pair1, pair2) {
    return pair1[0] == pair2[0] && pair1[1] == pair2[1]
}

var copyPair = function(pair) {
    return [pair[0], pair[1]];
}

var copyList = function(points) {
    var res = []
    for (var i = 0; i < points.length; i++) {
        res.push(copyPair(points[i]))
    }
    return res;
}

function TNode(coords, parent) {
    this.parent = parent;
    this.coords = coords;
}

var shortestPathBFS = function(grid, start, dest) {
    //this is gurateed to find the best path
    //no heuristic though, so it's kinda slow
    //same as djikstra with equal edge weights
    var visited = [];
    var q = [];
    q.push(new TNode(start, null));
    var node, children, child;
    var countLimit = 0;
    while (true) {
        if (q.length < 1) {
            console.log("dead end");
            return false;
        }
        node = q.shift();
        if (isSame(node.coords, dest)) {
            console.log("found end")
            break;
        }
        if (countLimit > 10000) {
            console.log("too long of a path")
            return false
        }
        visited.push(node.coords);
        children = neighbors(grid, node.coords);
        for (var i = 0; i < children.length; i++) {
            child = new TNode(children[i], node);
            if (notIn(visited, child.coords)) {
                q.push(child);
            }
        }
        countLimit++;
    }
    var path = [];
    //var countLimit = 0
    while (node != null) {
        path.push(node.coords);
        node = node.parent;
    }
    path.reverse();
    return path;
}

var heuristicEuclidean = function(from, to) {
    //Euclidean
    //Very squiggly but does the right thing
    //Slower for tanks bc more turns
    return Math.sqrt((from[0]-to[0])*(from[0]-to[0]) + (from[1]-to[1])*(from[1]-to[1]));
}

var heuristic = function(from, to) {
    //Manhatten
    //Straighter (so faster for tanks) but less accurate
    return Math.abs(from[0]-to[0]) + Math.abs(from[1]-to[1]);
}

var shortestPathAStar = function(grid, start, dest) {
    //A star is faster than BFS, but accuracy is sus and depends on the heuristic
    //If the H function never overestimates the distance, then it is perfect
    //However it isn't
    //But we sacrifice perfection for performance
    var visited = [];
    var q = new PriorityQueue(function(a, b) {
        return a[1] < b[1];
    })
    q.push([new TNode(start, null), 0]);
    var node, children, child;
    var countLimit = 0;
    while (true) {
        if (q.size() < 1) {
            console.log("dead end");
            return false;
        }
        node = q.pop()[0];
        if (isSame(node.coords, dest)) {
            console.log("found end")
            break;
        }
        if (countLimit > 10000) {
            console.log("too long of a path")
            return false
        }
        visited.push(node.coords);
        children = neighbors(grid, node.coords);
        for (var i = 0; i < children.length; i++) {
            child = new TNode(children[i], node);
            if (notIn(visited, child.coords)) {
                q.push([child, heuristic(child.coords, dest)]);
            }
        }
        countLimit++;
    }
    var path = [];
    //var countLimit = 0
    while (node != null) {
        path.push(node.coords);
        node = node.parent;
    }
    path.reverse();
    return path
}

var gridSize = 12;
var path = false;
var path2 = false;
var path3;
//Make sure there is at least a path from each corner to each other
while (path == false || path2 == false) {
    grid = createGrid(gridSize);
    makeTerrain(grid, 0.29); //Make a bit less than 1/3 be terrain
    path = shortestPathAStar(grid, [0, 0], [gridSize-1, gridSize-1]);
    path2 = shortestPathAStar(grid, [0, gridSize-1], [gridSize-1, 0]);
}
var cellSize = canvas.width / grid[0].length;

canvas.addEventListener("click", function(e) {
    var x = e.pageX - canvasLeftOffset;
    var y = e.pageY - canvasTopOffset;
    var gridX = Math.floor(x / cellSize);
    var gridY = Math.floor(y / cellSize);
    path = shortestPathAStar(grid, [0, 0], [gridX, gridY]);
    path3 = shortestPathAStar(grid, [0, 0], [gridX, gridY]);
}, false);

var hoverCoords = null;

canvas.addEventListener("mousemove", function(e) {
    var x = e.pageX - canvasLeftOffset;
    var y = e.pageY - canvasTopOffset;
    var gridX = Math.floor(x / cellSize);
    var gridY = Math.floor(y / cellSize);
    hoverCoords = [gridX, gridY];
}, false);

canvas.addEventListener("mouseout", function(e) {
    hoverCoords = null;
}, false);

var pointToCoords = function(point) {
    //[2, 3] ---> [34.55, 67.4] (the center point of the cell)
    return [
        (point[0] * cellSize) + cellSize/2, 
        (point[1] * cellSize) + cellSize/2
    ]
}
