var bullets = [];
var bulletSpeed = Math.floor(cellSize/10);
var bulletRadius = cellSize/10;

var tanks = [];

class Bullet {
    constructor(x, y, rotation, originTank) {
        this.color = "gray";
        this.x = x;
        this.y = y;
        this.speed = bulletSpeed;
        this.rotation = rotation;
        bullets.push(this);
        var audio = new Audio('cannon.mp3');
        audio.play();
        this.health = 3;
        this.originTank = originTank;
    }

    update() {
        if (this.health <= 0) {
            return
        }
        this.x = this.x + Math.cos(this.rotation*Math.PI/180) * this.speed;
        this.y = this.y + Math.sin(this.rotation*Math.PI/180) * this.speed;   
        
        if (terrainCollision(this.x, this.y, bulletRadius, bulletRadius)) {
            this.y -= Math.sin(this.rotation*Math.PI/180) * this.speed;
            if (terrainCollision(this.x, this.y, bulletRadius, bulletRadius)) { //We are on a vertical edge, so 180 -
                this.rotation = 180 - this.rotation;
            } else {
                this.rotation = -1 * this.rotation; //Its a horizontal edge
            }
            this.y += Math.sin(this.rotation*Math.PI/180) * this.speed;
            this.health -= 1;
        } else {
            for (var i = 0; i < tanks.length; i++) {
                if (tanks[i] != this.originTank && tanks[i].isBulletCollision(this.x, this.y)) {
                    tanks[i].hitWithBullet(10);
                    this.health = 0;
                }
            }
        }

        this.draw();
    }

    draw() {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "gray";
        ctx.fillStyle = "gray";
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation*Math.PI/180 - Math.PI/2);
        ctx.beginPath();
        ctx.arc(0, 0, bulletRadius, 0, Math.PI, false);
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(-1*bulletRadius, -2*bulletRadius + 1, bulletRadius*2, bulletRadius*2)
        ctx.restore();
    }
}

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
        this.canFire = true;
        this.fireBulletTimeout = 0;
        this.health = 100;
        tanks.push(this);
    }

    pointOnGrid() {
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

    isBulletCollision(x, y) {
        if (x < this.x + this.size/2 && x > this.x - this.size/2) {
            if (y < this.y + this.size/2 && y > this.y - this.size/2) {
                return true;
            }
        }
        return false
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
        var newX = this.x + steps * Math.cos(this.rotation*Math.PI/180) * this.speed,
            newY = this.y + steps * Math.sin(this.rotation*Math.PI/180) * this.speed;
        if (!terrainCollision(newX-this.size/2, newY-this.size/2, this.size, this.size)) {
            this.x = newX;
            this.y = newY;
        }
    }

    hitWithBullet(damage) {
        this.takeDamage(damage);
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) {
            this.canFire = false;
            var i = tanks.indexOf(this);
            if (i > -1) {
                tanks.splice(i, 1);
            }
        }
    }

    fireBullet() {
        if (this.canFire) {
            var bullet = new Bullet(this.x, this.y, this.rotation, this);
            this.canFire = false;
            this.fireBulletTimeout = 30; //30 frames
        }
    }

    fullPath() {
        return [this.pointOnGrid(), this.p].concat(this.pointQueue)
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
        
        this.update();
    }

    update() {
        if (this.health >= 0) {
            if (!this.canFire) {
                this.fireBulletTimeout -= 1;
                if (this.fireBulletTimeout <= 0) {
                    this.canFire = true;
                }
            }
            this.draw();
        }
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
var aiTank2 = new Tank("#4286f4", pointToCoords([gridSize-1, 0]), "C");

var playerTank = new Tank("#123456", pointToCoords([gridSize-1, gridSize-1]), "B");
playerTank.rotation = 180;

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
    if (keyRegister[81]) {
        playerTank.fireBullet();
    }
}

var updateSecondaryCanvas = function() {
    
}

var update = function() {
    window.requestAnimationFrame(update);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx2.clearRect(0, 0, secondaryCanvas.width, secondaryCanvas.height);
    handleKeys();
    drawGrid(grid, true, hoverCoords);
    drawPath(grid, aiTank.fullPath, "orange");
    drawPath(grid, aiTank2.fullPath, "purple");
    for (var i = 0; i < bullets.length; i++) {
        bullets[i].update();
    }
    aiTank.aiUpdate();
    aiTank2.aiUpdate();
    playerTank.update();
    updateSecondaryCanvas();
}

update();

setInterval(function() {
    aiTank.goToPoint(playerTank.pointOnGrid());
    aiTank2.goToPoint(playerTank.pointOnGrid());
    aiTank.fireBullet();
    aiTank2.fireBullet();
}, 3000); //every 3 seconds, try to go to player tank
