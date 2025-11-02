
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';//'@supabase/supabase-js';

const supabaseUrl = 'https://vrdwnlertivktrgpvdnd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZHdubGVydGl2a3RyZ3B2ZG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5OTM4NTgsImV4cCI6MjA3NzU2OTg1OH0.DnreW6g4QQ663fVK2NmQT4r7a8Pxy0_hOFDggJjhfVM'; //process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey);


// MechanicalTurk entegrasyonu için ------------ şimdilik kullanılmıyor 
/*
function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

const workerId = getParam("workerId");
const assignmentId = getParam("assignmentId");
const hitId = getParam("hitId");

const finalGameData = {
    worker_id: workerId,
    assignment_id: assignmentId,
    hit_id: hitId,
    score: 1400,
    player_position: { x: 2, y: 5 },
    board: [
      [0, 1, 0, 0, 2, 0],
      [0, 0, 3, 0, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 2, 0, 0, 3, 0],
      [0, 0, 0, 0, 0, 0],
      [1, 0, 0, 2, 0, 0],
    ],
};
*/
// ---------------------------




var tCell = new Image(); // tartarus cell
var tBox = new Image(); // a box
var tAgent = new Image(); // bulldozer
var tWall = new Image(); // walls

var posx;
var posy;

tCell.src = "cell.png";
tBox.src = "box.png";
tAgent.src = "agent.png";
tWall.src = "wall.png";

var map = new Array();
var dir = [[1, 0], [-1, 0], [0, 1], [0, -1]];
var curDir; 
var ix = [100, 0, 0, 0, 100, 200, 200, 200];
var iy = [0, 0, 100, 200, 200, 200, 100, 0];

var divInf;
var divMsg;
var numMoves = 80;




const player_result = {
    position: { x: -1, y: -1 },
    score: -1
};

async function saveToSupabase() {
    try {
      const { data, error } = await supabase.from("game_results_score_position").insert([player_result]);
      if (error) throw error;
      console.log("Game data saved:", data);
    } catch (err) {
      console.error("Error saving data:", err.message);
    }
}




function rotateCCW(v, d) {
    x = Math.round(v[0] * Math.cos(Math.PI / d) - v[1] * Math.sin(Math.PI / d));
    y = Math.round(v[0] * Math.sin(Math.PI / d) + v[1] * Math.cos(Math.PI / d));
    return [x, y];
}

function startGame() {
    gameArea.init();
    divInf = document.getElementById("info");
    divMsg = document.getElementById("messages");
    // gameArea.context.drawImage(tAgent, 0, 0, 100, 100);
    for(let i=0;i<6;i++) {
        map[i] = new Array();
        for(let j=0;j<6;j++) {
            map[i][j] = 0;
        }
    }
    
    // generate 6 random boxes in the inner 4x4
    // the index should be between 1 and 4 (both inclusive)

    numboxes = 0;
    while(numboxes < 6) {
        // get a random pos_x and pos_y
        posx = Math.floor(Math.random() * 4) + 1; 
        posy = Math.floor(Math.random() * 4) + 1; 

        if (map[posx][posy] == 0) {
            map[posx][posy] = 1;
            numboxes++;
        }
    }

    // get a random pos for bulldozer
    while(true) {
        posx = Math.floor(Math.random() * 4) + 1; 
        posy = Math.floor(Math.random() * 4) + 1; 

        if (map[posx][posy] == 0) {
            // map[posx][posy] = 2;
            break;
        }
    }

    // get a random direction
    curDir = dir[Math.floor(Math.random()*4)];
    drawArea();
}

function drawArea() {
    // draw bulldozer's view
    temp = curDir;
    for(let i=0;i<8;i++) {
        cx = posx + temp[0];
        cy = posy + temp[1];
        if (cx < 0 || cy < 0 || cx > 5 || cy > 5) {
            gameArea.context.drawImage(tWall, ix[i], iy[i], 100, 100);
        } else if (map[cx][cy] == 1) {
            gameArea.context.drawImage(tBox, ix[i], iy[i], 100, 100);
        } else if(map[cx][cy] == 0) {
            gameArea.context.drawImage(tCell, ix[i], iy[i], 100, 100);
        }
        temp = rotateCCW(temp, 4);
    }

    // draw bulldozer
    gameArea.context.drawImage(tAgent, 100, 100, 100, 100);

    //return;
    // debug
    myStr = "<pre>DEBUG!<br /> Direction:" + curDir + "<br /> Position:" + posx + "," + posy + "<br />";
    for(let i=5;i>=0;i--) {
        for(let j=5;j>=0;j--) {
            if (i == posx && j == posy) {
                myStr = myStr + "B";
            } else {
                myStr = myStr + map[i][j];
            }
        }
        myStr = myStr + "<br />";
    }
    divInf.innerHTML = myStr + "</pre>";
}

function moveAgent(d) {
    switch(d) {
        case "left":
            curDir = rotateCCW(curDir, 2);
            drawArea();
            break;
        case "right":
            curDir = rotateCCW(curDir, 0.66);
            drawArea();
            break;
        case "forward":
            tx = posx + curDir[0];
            ty = posy + curDir[1];
            if (tx < 0 || ty < 0 || tx > 5 || ty > 5) {
                // walls! 
                // do nothing
            }
            else if (map[tx][ty] == 0) {
                // just move forward
                posx = tx;
                posy = ty;
                drawArea();
            } else {
                // check if there is another box behind this box
                qx = tx + curDir[0];
                qy = ty + curDir[1];
                if (qx < 0 || qy < 0 || qx > 5 || qy > 5) {
                    // do nothing, walls.
                }
                else if(map[qx][qy] == 0) {
                    // then we can move... 
                    map[qx][qy] = 1;
                    map[tx][ty] = 0;
                    posx = tx;
                    posy = ty;
                    drawArea();
                }
            }
            break;
        default:
            //alert("no such action!");
            break;
    }
    numMoves--;

    // oyun bitti mi diye kontrol et !!!!!!!!!! ----------------------------
    if(numMoves == 0) {
        document.getElementById("b1").disabled = true;
        document.getElementById("b2").disabled = true;
        document.getElementById("b3").disabled = true;
        
        // calculate SCORE... 
        f = 0;
        for (let i=0;i<6;i++) {
            for(let j=0;j<6;j++) {
                if(map[i][j] == 1) {
                    if(i==0 || i==5) f++;
                    if(j==0 || j==5) f++;
                }
            }
        }
        divMsg.innerHTML = "You have no moves left. Your score is: " + f;

        
        player_result.position.x = posx;
        player_result.position.y = posy;
        player_result.score = f;
        

        saveToSupabase(); // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    }
    else if(numMoves == 15) {
        divMsg.style.color = "red";
    } else {
        divMsg.innerHTML = "Number of moves left: " + numMoves;
    }
}

var gameArea = {
canvas : null,
init : function() {
        this.canvas = document.getElementById("tartarusCanvas");
        this.context = this.canvas.getContext("2d");
    }
}

window.startGame = startGame;

