document.addEventListener("keydown", handleKeyDown);

const gameCanvas = document.getElementById("game");
const ctxGame = gameCanvas.getContext("2d");

const gameMenuCanvas = document.getElementById("gameMenu");
const ctxGameMenu = gameMenuCanvas.getContext("2d");

const sidePanelCanvas = document.getElementById("sidePanel");
const ctxSidePanel = sidePanelCanvas.getContext("2d");

const pipes = [
    {pipe:"A", pipePos:0, holePos:0, pipeW:0, spacing:0, isCollision:false, isScore:false},
    {pipe:"B", pipePos:0, holePos:0, pipeW:0, spacing:0, isCollision:false, isScore:false},
    {pipe:"C", pipePos:0, holePos:0, pipeW:0, spacing:0, isCollision:false, isScore:false},
    {minWidth:20, maxWidth:100, minHolePos:50, maxHolePos:350, minSpacing:250, maxSpacing:350}
]

const gameStat = [
    {gameScore:0, hiScore:0, xBirds:0, newHiScore:false},
    {level:"Newbie", flutterForce:-6, gravity:0.5, pipeSpeed:3, holeSize:200, birds:4},
    {level:"Stoic", flutterForce:-4.5, gravity:0.3, pipeSpeed:3, holeSize:100, birds:3},
    {level:"Hardened", flutterForce:-8, gravity:0.5, pipeSpeed:8, holeSize:200, birds:2},
    {isRunning:false, isPaused:false, isGameOver:false, isReset:false, isNewGame:true}
]

let level = gameStat.at(1);

let lastFrameStamp, deltaTime;
let counting = false;
let seconds = 0;
let vy = 0;
let trailingPipe = 2;

let boxBirdX = 200;
let boxBirdY = 160;


function start() {
    sidePanel();
    gameMenu();
    gameLoop();
}
        
function reStart() {
    boxBirdY = 160;
    ctxSidePanel.clearRect(15,206,225,131); 
    Object.assign(gameStat.at(4), {isRunning:true, isReset:false});
}

function handleKeyDown(e) {
    if (e.code == "Space") {
        if (!gameStat.at(4).isPaused && gameStat.at(4).isRunning) {
            vy = level.flutterForce;
        }
    }
    if (e.code == "KeyP") {
        if (gameStat.at(4).isRunning) {
            gameStat.at(4).isPaused ? gameStat.at(4).isPaused = false : gameStat.at(4).isPaused = true;
            sidePanelEvents("pause");
        }
    }
    if (e.code == "KeyR") {
        if (!gameStat.at(4).isReset && !gameStat.at(4).isNewGame) {
            Object.assign(gameStat.at(4), {isRunning:false, isPaused:false, isNewGame:true, isGameOver:false});
            Object.assign(gameStat.at(0), {gameScore:0, xBirds:0, newHiScore:false});
            gameMenuCanvas.style.opacity = 1;
            sidePanelEvents("reset");
        }
    }
    if (e.code == "Digit1" || e.code == "Numpad1") {
        if (gameStat.at(4).isNewGame) {
            setGame(1);
        }
    }
    if (e.code == "Digit2" || e.code == "Numpad2") {
        if (gameStat.at(4).isNewGame) {
            setGame(2);
        }
    }
    if (e.code == "Digit3" || e.code == "Numpad3") {
        if (gameStat.at(4).isNewGame) {
            setGame(3);
        }
    }
    if (e.code == "ArrowUp") {
        if (gameStat.at(4).isPaused && boxBirdY >= 0) {
            boxBirdY -= 10;
        }
    }
    if (e.code == "ArrowDown") {
        if (gameStat.at(4).isPaused && boxBirdY <= gameCanvas.height -40) {
            boxBirdY += 10;
        }
    }
}

function setGame(choice) {
    gameMenuCanvas.style.opacity = 0;
    level = gameStat.at(choice);
    ctxSidePanel.textAlign = "start";
    ctxSidePanel.clearRect(15, sidePanelCanvas.height - 58, 150, 20);
    drawText("- " + level.level + " -", 15, sidePanelCanvas.height - 40, 20, "black", ctxSidePanel);
    drawBoxBirds();
    Object.assign(gameStat.at(4), {isReset:true, isNewGame:false});
    timer(3000);
    sidePanelEvents("countdown");
    pipes.forEach(item => {
        if (item.pipe === "A"||"B"||"C") {
            Object.assign(item, {pipePos:-item.pipeW, isCollision:false, isScore:false});
        }
    })
}

function enableGravity() {
    vy += level.gravity;
    boxBirdY += vy;
    if (boxBirdY > gameCanvas.height - 40) {
        boxBirdY = gameCanvas.height - 40;
        vy = -vy * 0.35;
    }
}

function timer(duration) {
    counting = true;
    let endTime = Date.now() + duration;
    let timer = setInterval(() => {
        let timeLeft = endTime - Date.now();
        seconds = Math.ceil(timeLeft / 1000);
        if (timeLeft <= 0) {
            clearInterval(timer);
            counting = false;
            reStart();
        }
    }, 100);
    sidePanelEvents("countdown");
}

function pipeUpdater(iD) {
    if (pipes.at(trailingPipe).pipePos + pipes.at(trailingPipe).pipeW + pipes.at(trailingPipe).spacing >= gameCanvas.width) {
        pipes.at(iD).pipePos <= -pipes.at(iD).pipeW ? pipes.at(iD).pipePos = -pipes.at(iD).pipeW : pipes.at(iD).pipePos -= level.pipeSpeed; 
    } else {
        trailingPipe = iD;
        Object.assign(pipes.at(iD), {
            holePos:Math.floor(Math.random() * (pipes.at(3).maxHolePos - pipes.at(3).minHolePos)) + pipes.at(3).minHolePos,
            pipeW:Math.floor(Math.random() * (pipes.at(3).maxWidth - pipes.at(3).minWidth)) + pipes.at(3).minWidth,
            spacing:Math.floor(Math.random() * (pipes.at(3).maxSpacing - pipes.at(3).minSpacing)) + pipes.at(3).minSpacing,
            pipePos:gameCanvas.width 
        })
    }
}

function pipePair(iD) {
    let topPipeL = pipes.at(iD).holePos;
    let bottomPipeL = gameCanvas.height - topPipeL - level.holeSize;
    let bottomPipeY = topPipeL + level.holeSize;
    
    ctxGame.fillStyle = "black";
    ctxGame.fillRect(pipes.at(iD).pipePos, 0, pipes.at(iD).pipeW, topPipeL);
    ctxGame.fillRect(pipes.at(iD).pipePos, bottomPipeY, pipes.at(iD).pipeW, bottomPipeL);
}

function detectCollision(iD) {
    if (boxBirdX + 40 >= pipes.at(iD).pipePos && boxBirdX <= pipes.at(iD).pipePos + pipes.at(iD).pipeW && !pipes.at(iD).isCollision  && gameStat.at(4).isRunning) {
        if (boxBirdY <= pipes.at(iD).holePos || boxBirdY +40 >= pipes.at(iD).holePos + level.holeSize) {
            pipes.at(iD).isCollision = true;
            gameStat.at(0).xBirds++;
            drawBoxBirds();
            if (gameStat.at(0).xBirds == level.birds) {
                Object.assign(gameStat.at(4), {isGameOver:true, isRunning:false})
                sidePanelEvents("gameover");
            }
        }
    } else if (pipes.at(iD).pipePos < -pipes.at(iD).pipeW) {
        pipes.at(iD).isCollision = false;
    }
}

function detectScore(iD) {
    if (boxBirdX >= pipes.at(iD).pipePos + pipes.at(iD).pipeW && pipes.at(iD).pipePos > 0 && !pipes.at(iD).isCollision && !pipes.at(iD).isScore && gameStat.at(4).isRunning) {
        pipes.at(iD).isScore = true;
        gameStat.at(0).gameScore += 5;
        sidePanelEvents("score");
    } else if (pipes.at(iD).isScore && pipes.at(iD).pipePos <= -pipes.at(iD).pipeW) {
        pipes.at(iD).isScore = false;
    }
    if (gameStat.at(0).gameScore > gameStat.at(0).hiScore) {
        Object.assign(gameStat.at(0), {hiScore:gameStat.at(0).gameScore, newHiScore:true});
    }
}

function boxBird(birdX, birdY, birdSizeX, birdSizeY, color, theBird) {
    if (theBird) {
        ctxGame.fillRect(birdX, birdY, birdSizeX, birdSizeY);
        ctxGame.strokeRect(birdX -1, birdY -1, 42, 42)
        ctxGame.fillStyle = color;
        ctxGame.strokeStyle = "red"
    } else {
        ctxSidePanel.fillStyle = color;
        ctxSidePanel.fillRect(birdX, birdY, birdSizeX, birdSizeY);
    }
}

function drawBoxBirds() {
    let i = (level.birds - gameStat.at(0).xBirds);
    let topSpacing = -45;
    let bottomSpacing = -45;
    console.log(gameStat.at(0).xBirds)
    
    ctxSidePanel.clearRect(sidePanelCanvas.width - 100, sidePanelCanvas.height - 100, 100, 100);
    while (i > 0) {
        if (i >= 3) {
            boxBird(sidePanelCanvas.width + topSpacing, sidePanelCanvas.height -90, 30, 30, "black");
            topSpacing -= 45;
            i--;
        } else {
            boxBird(sidePanelCanvas.width + bottomSpacing, sidePanelCanvas.height -45, 30, 30, "black");
            bottomSpacing -= 45;
            i--;
        }
    }
}

function drawText(text, x, y, fontSize, color, canvas) {
    canvas.fillStyle = color;
    canvas.font = fontSize + "px monospace"; 
    canvas.fillText(text, x, y);
}

function gameMenu() {
    drawText("1: " + gameStat.at(1).level, gameMenuCanvas.width/4, 120, 20, "black", ctxGameMenu);
    drawText("2: " + gameStat.at(2).level, gameMenuCanvas.width/4, 155, 20, "black", ctxGameMenu);
    drawText("3: " + gameStat.at(3).level, gameMenuCanvas.width/4, 195, 20, "black", ctxGameMenu);
    ctxGameMenu.fillStyle = "black";
    ctxGameMenu.fillRect(250,100,100,100); 
    boxBird(gameMenuCanvas.width -50, gameMenuCanvas.height -50, 30, 30, "black");
    ctxGameMenu.textAlign = "center";
    drawText("- Menu of challenge -", gameMenuCanvas.width/2, 50, 35, "black", ctxGameMenu);
    gameMenuCanvas.style.opacity = 1;
}


function sidePanel() {
    drawText("A .js learning experience.", 15, 110, 20,"black", ctxSidePanel);
    drawText("press <space> to flutter", 15, sidePanelCanvas.height - 140, 13, "black",ctxSidePanel);
    drawText("press <p> to pause", 15, sidePanelCanvas.height - 120, 13, "black",ctxSidePanel);
    drawText("press <r> to restart", 15, sidePanelCanvas.height - 100, 13, "black",ctxSidePanel);
    drawText("score: " + gameStat.at(0).gameScore, 15, sidePanelCanvas.height - 10, 20, "black", ctxSidePanel);
    ctxSidePanel.textAlign = "center";
    drawText("- BoxBird -", sidePanelCanvas.width/2, 50, 35, "black", ctxSidePanel);
}

function sidePanelEvents(panelEvent) {
    if (panelEvent == "pause") {
        ctxSidePanel.textAlign = "center";
        ctxSidePanel.textBaseline = "middle";
        gameStat.at(4).isPaused ? drawText("Pause", sidePanelCanvas.width /2, sidePanelCanvas.height/2, 50, "black", ctxSidePanel) : ctxSidePanel.clearRect(15, 206, 225, 131);
    } else if (panelEvent == "score") {
        ctxSidePanel.textAlign = "start";
        ctxSidePanel.textBaseline = "alphabetic";
        ctxSidePanel.clearRect(15, sidePanelCanvas.height - 28, 100, 20);
        drawText("score: " + gameStat.at(0).gameScore, 15, sidePanelCanvas.height - 10, 20, "black",ctxSidePanel);
    } else if (panelEvent == "gameover") {
        ctxSidePanel.textAlign = "center";
        ctxSidePanel.textBaseline = "middle";
        ctxSidePanel.clearRect(15, 206, 225, 131);
        drawText("GameOver", sidePanelCanvas.width /2, sidePanelCanvas.height/2, 50, "black", ctxSidePanel);
    } else if (panelEvent == "reset") {
        ctxSidePanel.clearRect(41, 206, 217, 131);
        ctxSidePanel.clearRect(15, sidePanelCanvas.height - 58, 150, 20);
        ctxSidePanel.clearRect(15, sidePanelCanvas.height - 28, 100, 20);
        ctxSidePanel.clearRect(sidePanelCanvas.width - 100, sidePanelCanvas.height - 100, 100, 100);
        ctxSidePanel.textAlign = "start";
        ctxSidePanel.textBaseline = "alphabetic";
        drawText("score: " + gameStat.at(0).gameScore, 15, sidePanelCanvas.height - 10, 20, "black",ctxSidePanel);
        }
    }

function update() {
    if (!gameStat.at(4).isReset && !gameStat.at(4).isPaused) {
        enableGravity();
        pipeUpdater(0);
        pipeUpdater(1);
        pipeUpdater(2);
        detectCollision(0);
        detectCollision(1);
        detectCollision(2);
        detectScore(0);
        detectScore(1);
        detectScore(2);
    }
}

function draw() {
    ctxGame.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    pipePair(0);
    pipePair(1);
    pipePair(2);
    if (!gameStat.at(4).isNewGame && !gameStat.at(4).isReset) {
        let boxColor;
        gameStat.at(0).newHiScore ? boxColor = "yellow" : boxColor = "black";
        boxBird(boxBirdX, boxBirdY, 40, 40, boxColor, true);
    }
}

function gameLoop(time) {
    lastFrameStamp === undefined ? deltaTime = 10 : deltaTime = time - lastFrameStamp;
    if (deltaTime >= 10) {
        update();
        draw();
        if (seconds > 0 && counting) {
            ctxSidePanel.clearRect(15, 206, 225, 131);
            ctxSidePanel.textAlign = "center";
            ctxSidePanel.textBaseline = "middle";
            drawText(seconds, sidePanelCanvas.width/2, sidePanelCanvas.height/2, 150, "black", ctxSidePanel);
        }
        lastFrameStamp = time;
    }
    requestAnimationFrame(gameLoop);
};
