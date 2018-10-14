class Tank {
    constructor(color, coords) {
        this.color = color;
        this.rotation = 0;
        this.size = 50;
        this.x = coords[0];
        this.y = coords[1];
        this.speed = 3;
        this.pointQueue = [];
        this.currentMovement = null;
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
            angle = 270;
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
        console.log("angle: " + angle)
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
        var p = this.pointQueue.shift();
        this.stepToPoint(p);
    }

    startOnPath(path) {
        //assumes already at path origin
        this.pointQueue = copyList(path);
        this.pointQueue.shift()
        this.startMoving()
    }

    update() {
        //Called every frame
        if (this.currentMovement != null) {
            var movement = this.currentMovement;
            movement[0] = movement[0] - 1;
            if (movement[0] < 0) {
                this.currentMovement = null;
                if (this.pointQueue.length > 0) {
                    this.startMoving();
                }
            } else if (movement[0] >= movement[1]){
                this.rotation += movement[2][0];
                //console.log(this.rotation)
            } else {
                this.x += movement[2][1][0];
                this.y += movement[2][1][1];
            }
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
        ctx.fillRect(-1*(this.size/2) + 15, -1*(this.size/2) + 15, this.size, this.size/2);   
        ctx.restore();
    }
}

var aiTank = new Tank("blue", pointToCoords([0, 0]));
aiTank.startOnPath(path);

var update = function() {
    window.requestAnimationFrame(update);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(grid, true, hoverCoords);
    drawPath(grid, path, "orange");
    aiTank.update();
}

update();