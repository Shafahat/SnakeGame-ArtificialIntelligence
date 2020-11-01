/*
This Script.js has been written by Our Team

*/

    //these are reinforcement Learning Variables
    var environment,lv_state=[],lv_Act,lv_Reward,lv_Score=0,lv_init='X',q_tab = {},game_Speed=30,started=true,max_Score=0,epochs=0,lv_Reset='';
    document.getElementById("game").innerHTML = '<canvas id="canvas" width="400" height="400"></canvas>';
    
    
    var canv = $("#canvas")[0];
    var ctx = canv.getContext("2d");
    var w = $("#canvas").width();
    var h = $("#canvas").height();

    
    var cw = 10;
    var d;
    var food;
    var score;
     
    
    //this variable creates Snake
    var snake_array; //an array of cells to make up the snake
    
    
   function u1(){
    game_Speed = document.getElementById("gspeed").value;
    }
    
    function u2(){
        environment.alpha = document.getElementById("lrate").value;
    }
    
    function u3(){
        environment.gamma = document.getElementById("dfactor").value;
    }
    
$(document).ready(function() {
    //Canvas stuff
    
    var keys = [];
window.addEventListener("keydown",
    function(e){
        keys[e.keyCode] = true;
        switch(e.keyCode){
            case 37: case 39: case 38:  case 40: 
            case 32: e.preventDefault(); break; 
            default: break; 
        }
    },
false);
window.addEventListener('keyup',
    function(e){
        keys[e.keyCode] = false;
    },
false);
    

    function init() {
        d = "right"; 
        snake_Create();
        food_Create(); 
      
        score = 0;
        

        if (typeof game_loop != "undefined") clearInterval(game_loop);
        game_loop = setInterval(game_Run, game_Speed);
    }
    init();
    

    function snake_Create() {
        var length = 5; //Length of the snake
        snake_array = []; 
        for (var i = length - 1; i >= 0; i--) {
           
            snake_array.push({
                x: i,
                y: 0
            });
        }
    }

    

    function food_Create() {
        food = {
            x: Math.round(Math.random() * (w - cw) / cw),
            y: Math.round(Math.random() * (h - cw) / cw),
        };
       
    }

   
    function game_Run(){
        
        // rl initialize Environment
        if(lv_init){
           lv_init = '';
           environment = new rl_Snake();
          
           paint();
           lv_state   = environment.getState();
           lv_Act = environment.getAction(lv_state);
           environment.implementAction(lv_Act);
           paint();
         
        }
        else{
            if(!lv_Reset){
                environment.reward(lv_state,lv_Act);//Reward and learn
            }
            else{
                paint();
                lv_Reset = '';
            }
            if(started == true){
               lv_state   = environment.getState();
               lv_Act = environment.getAction(lv_state);
               environment.implementAction(lv_Act);
               paint();
               score_Update();
               //checkGame();
            }
            else{
                score_Update();
                game_Check();
                lv_Reset='X';
            }
        }
        
    }
    
    function score_Update(){
        if(score > max_Score){
           max_Score = score;
        }
        if(started==false){
           epochs += 1;
        }
        document.getElementById("hscore").value = max_Score;
        document.getElementById("epoch").value = epochs;
        document.getElementById("rlearnt").value = Object.keys(q_tab).length;
        if(document.getElementById("gspeed").value == "0"){
            document.getElementById("gspeed").value = game_Speed;
            document.getElementById("lrate").value = environment.alpha;
            document.getElementById("dfactor").value = environment.gamma;  
        }
    }
    
    function paint() {
        //To avoid the snake trail we need to paint the BG on every frame
        //Lets paint the canvas now
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "black";
        ctx.strokeRect(0, 0, w, h);
        
        
        
        var nx = snake_array[0].x;
        var ny = snake_array[0].y;
        
        if (d == "right") nx++;
        else if (d == "left") nx--;
        else if (d == "up") ny--;
        else if (d == "down") ny++;

        
        if (nx == -1 || nx == w / cw || ny == -1 || ny == h / cw || collision_Check(nx, ny, snake_array)) {
            //restart game
            started=false;
           
        }

        
        if (nx == food.x && ny == food.y) {
            var tail = {
                x: nx,
                y: ny
            };
            score++;
            //Create new food
            food_Create();
        }
        else {
            var tail = snake_array.pop(); //pops out the last cell
            tail.x = nx;
            tail.y = ny;
        }
        //The snake can now eat the food.
        snake_array.unshift(tail); //puts back the tail as the first cell
        for (var i = 0; i < snake_array.length; i++) {
            var c = snake_array[i];
            //Lets paint 10px wide cells
            paint_cell(c.x, c.y);
        }

        //Lets paint the food
        paint_cell(food.x, food.y);
        //Lets paint the score
        var score_text = "Score: " + score;
        ctx.fillText(score_text, 5, h - 5);
        
    }

    //Lets first create a generic function to paint cells

    function game_Check(){
        if(!started){
            init();
            started = true;
        }
    }
    
    function paint_cell(x, y) {
        ctx.fillStyle = "blue";
        ctx.fillRect(x * cw, y * cw, cw, cw);
        ctx.strokeStyle = "white";
        ctx.strokeRect(x * cw, y * cw, cw, cw);
    }

    function collision_Check(x, y, array) {
        
        for (var i = 0; i < array.length; i++) {
            if (array[i].x == x && array[i].y == y) return true;
        }
        return false;
    }

    //Lets add the keyboard controls now
    $(document).keydown(function(e) {
        var key = e.which;
        //We will add another clause to prevent reverse gear
        if (key == "37" && d != "right") d = "left";
        else if (key == "38" && d != "down") d = "up";
        else if (key == "39" && d != "left") d = "right";
        else if (key == "40" && d != "up") d = "down";
        //The snake is now keyboard controllable
    })
    
    //Snake Class for reinforcement Learning
    var rl_Snake = function() { 
     this.reset();
    }
    rl_Snake.prototype = {
        reset: function(){
          this.alpha = 0.1;//Learning rate 0 -1
          this.gamma = 1;//Discount factor 0-1
          this.aLoop = 0;
          this.food = {};
        },
        getState: function(){
         
            var s=[];
            var px = snake_array[0].x;
            var py = snake_array[0].y;
            var p1=0,p2=0,p3=0;
            
            if(started == false){//Game over state
               return [0,0,0,0,0,0];
            }
            
            //Is it clear left 0 - No 1 - Yes
            if(d=="right"){//ahead:x++;left=y--;right=y++
                p1=px + 1;
                p2=py - 1;
                p3=py + 1;
                s.push(checkIfClear(p1,py));
                s.push(checkIfClear(px,p2));
                s.push(checkIfClear(px,p3));
                
                s = s.concat(checkIfFood(px,py,d));
            }
            if(d=="left"){//ahead:x--;left=y++;right=y--
                p1=px - 1;
                p2=py + 1;
                p3=py - 1;
                s.push(checkIfClear(p1,py));
                s.push(checkIfClear(px,p2));
                s.push(checkIfClear(px,p3));
                
                s = s.concat(checkIfFood(px,py,d));
            } 
            if(d=="up"){//ahead:y--;left=x--;right=x++
                p1=py - 1;
                p2=px - 1;
                p3=px + 1;
                s.push(checkIfClear(px,p1));
                s.push(checkIfClear(p2,py));
                s.push(checkIfClear(p3,py));
                s = s.concat(checkIfFood(px,py,d));//check food
            } 
            if(d=="down"){//ahead:y++;left=x++;right=x--
                p1=py + 1;
                p2=px + 1;
                p3=px - 1;
                s.push(checkIfClear(px,p1));
                s.push(checkIfClear(p2,py));
                s.push(checkIfClear(p3,py));
                
                s = s.concat(checkIfFood(px,py,d));//check food
            }   
            return s;
        },
        getAction: function(state){
                
              var q=[],qmax=0,qf=[];
              for(l=0;l<3;l++){
                 q.push({"a": l,
                         "q": this.getQ(state, l)});
              }
              q = sortByKey(q, 'q');
              q.reverse();
              
              qf.push(q[0]);
              if(q[0]["q"]==q[1]["q"]){
                 qf.push(q[1]);
              }
              if(q[0]["q"]==q[2]["q"]){
                 qf.push(q[2]);
              }
            
              
              if(food.x === this.food.x && food.y === this.food.y ){
                  this.aLoop++;
              }
              else if(food.x != this.food.x || food.y != this.food.y ){
                 this.food = food;
                 this.aLoop=1;
              }
              if(this.aLoop > 100){
                  this.food={};
                  this.aLoop=1;
                  return q[Math.floor(Math.random() * q.length)]["a"];
              }
            
              return qf[Math.floor(Math.random() * qf.length)]["a"];
        },
        implementAction: function(a){
            //Action 0 - ahead, 1 - left, 2 - right
            if(d=="up"){
               if(a==1){
                  d="left";
               }
               if(a==2){
                  d="right";
                }
            }
            else if(d=="down"){
               if(a==1){
                  d="right";
               }
               if(a==2){
                  d="left";
                }
            }
            else if(d=="right"){
               if(a==1){
                  d="up";
               }
               if(a==2){
                  d="down";
                }
            }
            else if(d=="left"){
               if(a==1){
                  d="down";
               }
               if(a==2){
                  d="up";
                }
            }
        },
        getQ: function(s, a){
            var config = s.slice();
            config.push(a);
            if (!(config in q_tab)) {
             
                return 0;
            }
            return q_tab[config];
        },
        setQ: function(s, a, r){
            var config = s.slice();
            config.push(a);
            if (!(config in q_tab)) {
            q_tab[config] = 0;
            }
            q_tab[config] += r;
        },
        reward: function(s, a){
           var rewardForState=0;
           var futureState = this.getState();
           
           var lv_string_c = JSON.stringify(s);
           var lv_string_f = JSON.stringify(futureState);
           if(lv_string_c != lv_string_f){
                   
                    if((s[0]==0 && a==0) || (s[1]==0 && a==1) || (s[2]==0 && a==2)){
                      rewardForState=-1;
                    }
                    if((s[0]==1 && a==0 && s[3]==1) || (s[1]==1 && a==1 && s[4]==1) || (s[2]==1 && a==2 && s[5]==1)){
                      rewardForState=1;
                    }

                    var optimalFutureValue = Math.max(this.getQ(futureState, 0), 
                                                      this.getQ(futureState, 1),
                                                      this.getQ(futureState, 2));
                    var updateValue = this.alpha*(rewardForState + this.gamma * optimalFutureValue - this.getQ(s, a));

                    this.setQ(s, a, updateValue);
           }    
        } 
    }
    
    function sortByKey(array, key) {
        return array.sort(function(a, b) {
            var x = a[key]; var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }
    
    function checkIfClear(x1,y1){
        if (x1 == -1 || x1 == w / cw || y1 == -1 || y1 == h / cw || collision_Check(x1, y1, snake_array)) {
                return 0;
        }
        else{
            return 1;
        }
    }
    
    function checkIfFood(lx1,ly1,j){
        
        var lv_s=[];
        
        if(j=="right"){

            if(food.y == ly1){lv_s.push(1);}
            else{lv_s.push(0);}
          
            if(food.y < ly1){lv_s.push(1);}
            else{lv_s.push(0);}
         
            if(food.y > ly1){lv_s.push(1);}
            else{lv_s.push(0);}
           
        }
        if(j=="left"){

            if(food.y == ly1){lv_s.push(1);}
            else{lv_s.push(0);}
           
            if(food.y > ly1){lv_s.push(1);}
            else{lv_s.push(0);
            }
           
            if(food.y < ly1){lv_s.push(1);}
            else{lv_s.push(0);}
            
        }
        if(j=="up"){

            if(food.x == lx1){lv_s.push(1);}
            else{lv_s.push(0);}
           
            if(food.x < lx1){lv_s.push(1);}
            else{lv_s.push(0);}
           
            if(food.x > lx1){lv_s.push(1);}
            else{lv_s.push(0);}
            
        }
        if(j=="down"){

            if(food.x == lx1){lv_s.push(1);}
            else{lv_s.push(0);
            }
           
            if(food.x > lx1){lv_s.push(1);}
            else{lv_s.push(0);}
         
            if(food.x < lx1){lv_s.push(1);}
            else{lv_s.push(0);}
          
        }
        
        return lv_s;
    }

})
