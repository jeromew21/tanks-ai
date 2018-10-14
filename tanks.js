class Tank {
    constructor(color, coords, label) {
        this.color = color;
        this.rotation = 0;
        this.size = cellSize*0.6;
        this.x = coords[0];
        this.y = coords[1];
        this.speed = 1;
        this.angularSpeed = this.speed;
        this.pointQueue = [];
        this.currentMovement = null;
        this.wantedDestination = null;
        this.label = label;
        this.p = null; //the point straight ahead of the ai tank
    }

    pointOnGrid() {
        var cellSize = canvas.width / grid[0].length;
        return [Math.floor(this.x / cellSize), Math.floor(this.y / cellSize)]
    }

    stepToPoint(point) {
        var pog = this.pointOnGrid();
        if (isSame(point, pog)) {
            return;
        }
        var destCoords = pointToCoords(point);
        var myX = pog[0];
        var myY = pog[1];
        var rotationFrames, movementFrames,
            rotationVelo, xvelo, yvelo;
        var angle = 0;
        if (point[0] > myX) {
            angle = 0;
        } else if (point[0] < myX) {
            angle = 180;
        } else if (point[1] < myY) {
            angle = -90;
        } else if (point[1] > myY) {
            angle = 90;
        }
        if (angle - this.rotation > 0) {
            rotationVelo = 1;
            rotationFrames = Math.abs(angle - this.rotation%360)
        } else if (angle - this.rotation < 0) {
            rotationVelo = -1;
            rotationFrames = Math.abs(angle - this.rotation%360)
        } else {
            rotationVelo = 0;
            rotationFrames = 0;
        }

        rotationVelo *= this.angularSpeed;
        rotationFrames /= this.angularSpeed;

        xvelo = destCoords[0] - this.x;
        yvelo = destCoords[1] - this.y;
        movementFrames = Math.sqrt(xvelo*xvelo + yvelo*yvelo)/this.speed;
        xvelo /= movementFrames;
        yvelo /= movementFrames;
        this.currentMovement = [
            rotationFrames + movementFrames, 
            movementFrames,
            [
                rotationVelo,
                [xvelo, yvelo]
            ]
        ]
    }

    startMoving() {
        this.p = this.pointQueue.shift();
        if (this.pointQueue.length < 1) {
            return
        }
        this.stepToPoint(this.p);
    }

    startOnPath(path) {
        if (path == false) {
            return
        }
        //assumes already at path origin
        this.pointQueue = copyList(path);
        this.pointQueue.shift()
        if (this.pointQueue.length < 1) {
            return
        }
        this.startMoving()
    }

    goToPoint(point) {
        if (isSame(point, this.pointOnGrid())) {
            return
        }
        this.wantedDestination = point;
    }

    turn(direction) {
        if (direction == "right") {
            this.rotation += this.angularSpeed;
        } else {
            this.rotation -= this.angularSpeed;
        }
    }

    moveForward(steps) {
        this.x = this.x + steps * Math.cos(this.rotation*Math.PI/180) * this.speed;
        this.y = this.y + steps * Math.sin(this.rotation*Math.PI/180) * this.speed;
    }

    aiUpdate() {
        //Called every frame
        if (this.currentMovement != null) {
            var movement = this.currentMovement;
            movement[0] = movement[0] - 1;
            if (movement[0] < 0) {
                //We completely have reached a point.
                this.currentMovement = null;
                if (this.wantedDestination != null) {
                    this.startOnPath(
                        shortestPathAStar(grid, this.pointOnGrid(), this.wantedDestination)
                    );
                    this.wantedDestination = null;
                } else if (this.pointQueue.length > 0) {
                    this.startMoving();
                }
            } else if (movement[0] >= movement[1]){
                this.rotation += movement[2][0];
                //console.log(this.rotation)
            } else {
                this.x += movement[2][1][0];
                this.y += movement[2][1][1];
            }
        } else if (this.wantedDestination != null) {
            this.startOnPath(
                shortestPathAStar(grid, this.pointOnGrid(), this.wantedDestination)
            );
            this.wantedDestination = null;
        }
        
        //Call draw
        this.draw();
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation*Math.PI/180);
        ctx.fillRect(-1*(this.size/2), -1*(this.size/2), this.size, this.size);
        ctx.fillRect(0, -1*(this.size/2)+this.size/4, this.size, this.size/2);
        ctx.font = Math.floor(this.size/2) + "px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle"; 
        ctx.fillStyle = "black";
        ctx.fillText(this.label, 0, 0) 
        ctx.restore();
    }
}

var aiTank = new Tank("#4286f4", pointToCoords([0, 0]), "A");
aiTank.startOnPath(path);

var playerTank = new Tank("#123456", pointToCoords([gridSize-1, gridSize-1]), "B");

canvas.addEventListener("click", function(e) {
    var x = e.pageX - canvasLeftOffset;
    var y = e.pageY - canvasTopOffset;
    var gridX = Math.floor(x / cellSize);
    var gridY = Math.floor(y / cellSize);
    //aiTank.goToPoint([gridX, gridY]);
}, false);

var keyRegister = [];

document.onkeydown = function(e) {
    keyRegister[e.keyCode] = true;
}

document.onkeyup = function(e) {
    keyRegister[e.keyCode] = false;
}

var handleKeys = function() {
    if (keyRegister[68]) {
        playerTank.turn("right");
    }
    if (keyRegister[65]) {
        playerTank.turn("left");
    }
    if (keyRegister[87]) {
        playerTank.moveForward(1);
    }
    if (keyRegister[83]) {
        playerTank.moveForward(-1);
    }
}


var update = function() {
    window.requestAnimationFrame(update);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleKeys();
    drawGrid(grid, true, hoverCoords);
    //drawPath(grid, [aiTank.pointOnGrid(), aiTank.p].concat(aiTank.pointQueue), "orange");
    aiTank.aiUpdate();
    playerTank.draw();
}

update();

setInterval(function() {
    aiTank.goToPoint(playerTank.pointOnGrid());
}, 3000); //every 3 seconds, try to go to player tank