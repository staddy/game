var fpsmeter = new FPSMeter({ decimals: 0, graph: true, theme: 'dark', left: '5px' });

PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;

var WIDTH = 800, HEIGHT = 600, DELTA = 150;
var gunX = 10, gunY = 590;
var bulletSpeed = 64.0;

var KEY = { SPACE: 32, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 , W: 87, S: 83};

var renderer = PIXI.autoDetectRenderer(WIDTH, HEIGHT,{backgroundColor : 0x1099bb});
document.body.appendChild(renderer.view);

// create the root of the scene graph
var stage;
var gameScene, gameOverScene;
// current game state
var state;

// filter
var filter;

PIXI.loader.add('images/fighter.json').load(onAssetsLoaded);

var plane;
var planeSpeed;
var planeTick;

function onAssetsLoaded()
{
    // create an array of textures from an image path
    var frames = [];

    for (var i = 0; i < 30; i++) {
        var val = i < 10 ? '0' + i : i;

        // magically works since the spritesheet was loaded with the pixi loader
        frames.push(PIXI.Texture.fromFrame('rollSequence00' + val + '.png'));
    }


    // create a MovieClip (brings back memories from the days of Flash, right ?)
    plane = new PIXI.extras.MovieClip(frames);

    plane.position.set(500);

    plane.anchor.set(0.5);
    plane.animationSpeed = 0.0;
    plane.scale.x = 0.2;
    plane.scale.y = 0.2;

    plane.gotoAndPlay(9);

    stage.addChild(plane);
}

var bullets, balloons, planes, blood;

var tick;
var filtertime;

var input;

var t1, t2, s;

function setup() {
    stage = new PIXI.Container();

    gameScene = new PIXI.Container();
    stage.addChild(gameScene);

    gameOverScene = new PIXI.Container();
    stage.addChild(gameOverScene);

    gameOverScene.visible = false;

    bullets = [];
    balloons = [];
    planes = [];
    blood = [];

    input = [false, false, false];

    tick = 0;

    // events
    stage.interactive = true;
    stage.hitArea = new PIXI.Rectangle(0, 0, WIDTH, HEIGHT);
    stage.mousedown = onMouseDown;
    stage.touchstart = onTouch;
    stage.onkeydown = function(e) {planeTick += 60};

    // filter
    filter = new PIXI.filters.ColorMatrixFilter();
    filtertime = 0;

    //Create sprites
    // background
    var background = new PIXI.Graphics();
    background.fillStyle = "#1099BB"
    background.drawRect(0, 0, WIDTH, HEIGHT);
    background.x = 0;
    background.y = 0;
    gameScene.addChild(background);

    var tower = PIXI.Texture.fromImage('images/tower.png');
    t1 = new PIXI.Sprite(tower);
    t1.x = 200;
    t1.y = 300;
    gameScene.addChild(t1);
    t2 = new PIXI.Sprite(tower);
    t2.x = 300;
    t2.y = 330;
    gameScene.addChild(t2);

    var smoke = PIXI.Texture.fromImage('images/smoke.png');
    s = new PIXI.Sprite(smoke);
    s.x = -108;
    s.y = 250;
    //s.scale.x = s.scale.y = 4;
    s.visible = false;
    gameScene.addChild(s);

    // plane
    planeSpeed = 4.0;
    planeTick = 0;

    //Create interface

    //Add some text
    var style = {
        font : 'bold italic 36px Arial',
        fill : '#F7EDCA',
        stroke : '#4a1850',
        strokeThickness : 5,
        dropShadow : true,
        dropShadowColor : '#000000',
        dropShadowAngle : Math.PI / 6,
        dropShadowDistance : 6,
        wordWrap : true,
        wordWrapWidth : 440
    };

    var richText = new PIXI.Text('Space - make a barrel roll and shoot; up/down or W/S - control plane...', style);
    richText.x = 30;
    richText.y = 180;

    gameScene.addChild(richText);

    //Assign the player's keyboard controllers

    //set the game state to `play`
    state = play;

    //Start fps-meter
    fpsmeter.tickStart();
    //Start the game loop
    gameLoop();
}

function gameLoop() {
    fpsmeter.tick();
    requestAnimationFrame(gameLoop);

    // update
    state();

    // render the root container
    renderer.render(stage);
}

function play() {
    if(areCollide(plane, t1) || areCollide(plane, t2)) {
        for (var i = 0; i < 10; i++) {
            if (Math.random() > 0.3) {
                var drop = new PIXI.Graphics();
                drop.beginFill(Math.random() > 0.5 ? 0xFFFF11 : 0x000000, 1);
                drop.drawRect(0, 0, 3, 3);
                drop.x = plane.x;
                drop.y = plane.y;
                drop.vx = -5.0 + 10.0 * Math.random();
                drop.vy = -5.0 + 10.0 * Math.random();
                blood.push(drop);
                gameScene.addChild(drop);
            }
        }
        s.visible = true;
    }
    for(var j = 0; j < balloons.length; j ++) {
        var balloon = balloons[j];
        if(balloon.visible) {
            for(var k = 0; k < bullets.length; k++) {
                var bullet = bullets[k];
                if (bullet.visible && areCollide(bullet, balloon)) {
                    bullet.visible = false;
                    bullet.vx = 0;
                    bullet.vy = 0;
                    balloon.visible = false;
                    balloon.vx = 0;
                    balloon.vy = 0;
                    for (var i = 0; i < 20; i++) {
                        if (Math.random() > 0.3) {
                            var drop = new PIXI.Graphics();
                            drop.beginFill(0xFF1111, 1);
                            drop.drawRect(0, 0, 3, 3);
                            drop.x = bullet.x;
                            drop.y = bullet.y;
                            drop.vx = -5.0 + 10.0 * Math.random();
                            drop.vy = -5.0 + 10.0 * Math.random();
                            blood.push(drop);
                            gameScene.addChild(drop);
                        }
                    }
                    filtertime = 60 * 0.2;
                    bullets.splice(k--, 1);
                    //balloons.splice(j--, 1); // ???
                    gameScene.removeChild(bullet);
                    gameScene.removeChild(balloon);
                }
            }
            balloon.x += balloon.vx;
            balloon.y += balloon.vy;
            if (Math.random() > 0.99) {
                balloon.vx += (-0.5 + Math.random() * 1.0);
                balloon.vy += (-0.0 + Math.random() * 1.0);
                if (balloon.vy > -0.4)
                    balloon.vy = -0.4;
            }
            if(balloon.x < -DELTA || balloon.x > WIDTH + DELTA || balloon.y < -DELTA || balloon.y > HEIGHT + DELTA) {
                balloon.visible = false;
                balloon.vx = 0;
                balloon.vy = 0;
            }
        } else {
            balloons.splice(j--, 1);
            gameScene.removeChild(balloon);
        }
    }
    for(var j = 0; j < bullets.length; j++) {
        var bullet = bullets[j];
        if(bullet.visible) {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            if (bullet.x < -DELTA || bullet.x > WIDTH + DELTA || bullet.y < -DELTA || bullet.y > HEIGHT + DELTA) {
                bullet.visible = false;
                bullet.vx = 0;
                bullet.vy = 0;
            }
        } else {
            bullets.splice(j--, 1);
            gameScene.removeChild(bullet);
        }
    }
    if(tick % (60 * 2) == 0) {
        for(var i = 0; i < 5; i++) {
            if(Math.random() > 0.5) {
                var texture = PIXI.Texture.fromImage('images/red_balloon.png');
                var balloon = new PIXI.Sprite(texture);
                balloon.x = WIDTH * Math.random();
                balloon.y = HEIGHT + 100 * Math.random();
                balloon.vy = -0.5;
                balloon.vx = 0.0;
                balloon.scale.x = 0.2;
                balloon.scale.y = 0.2;
                balloons.push(balloon);
                gameScene.addChild(balloon);
            }
        }
    }
    for(var j = 0; j < blood.length; j++) {
        var drop = blood[j];
        if(drop.visible) {
            if(drop.x < -DELTA || drop.x > WIDTH + DELTA || drop.y < -DELTA || drop.y > HEIGHT + DELTA) {
                drop.visible = false;
                drop.vx = 0;
                drop.vy = 0;
            }
            drop.x += drop.vx;
            drop.y += drop.vy;
            drop.vy += 0.1;
        } else {
            blood.splice(j--, 1);
            gameScene.removeChild(drop);
        }
    }
    if(filtertime != 0) {
        var matrix = filter.matrix;

        matrix[1] = Math.sin(filtertime) * 3;
        matrix[2] = Math.cos(filtertime);
        matrix[3] = Math.cos(filtertime) * 1.5;
        matrix[4] = Math.sin(filtertime / 3) * 2;
        matrix[5] = Math.sin(filtertime / 2);
        matrix[6] = Math.sin(filtertime / 4);
        stage.filters = [filter];
        filtertime--;
    } else {
        stage.filters = null;
    }
    if(planeTick != 0) {
        //plane.animationSpeed = 0.5;
        planeTick--;
    } else {
        //plane.animationSpeed = 0.0;
    }
    plane.vx = Math.cos(plane.rotation - Math.PI * 1.0/2) * planeSpeed;
    plane.vy = Math.sin(plane.rotation - Math.PI * 1.0/2) * planeSpeed;
    plane.x += plane.vx;
    plane.y += plane.vy;
    if(plane.x < 0)
        plane.x = WIDTH;
    if(plane.x > WIDTH)
        plane.x = 0;
    if(plane.y < 0)
        plane.y = HEIGHT;
    if(plane.y > HEIGHT)
        plane.y = 0;

    if(input[0]) {
        var px = plane.x;
        var py = plane.y;

        var k = ((plane.vy) / (plane.vx));
        //alert(Math.atan(k) / Math.PI * 180);
        var bxa = Math.sqrt(bulletSpeed / (1 + k*k)) * (plane.vx > 0 ? 1 : -1);
        var bya = bxa * k;
        var line = new PIXI.Graphics();
        line.lineStyle(2, 0xFFFFFF, 1);
        line.moveTo(0, 0);
        line.lineTo(5, 0);
        line.x = plane.x;
        line.y = plane.y;
        line.rotation = Math.atan(k);
        line.vx = bxa;
        line.vy = bya;
        bullets.push(line);
        gameScene.addChild(line);
        if(planeTick == 0)
            planeTick += 30;
    }

    if(input[1])
        plane.rotation += 0.1;
    else if(input[2])
        plane.rotation -= 0.1;

    tick++;
}

function end() {
    //All the code that should run at the end of the game
}

//The game's helper functions:
//`keyboard`, `hitTestRectangle`, `contain` and `randomInt`
function areCollide(r1, r2) {
    //Define the variables we'll need to calculate
    var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

    //hit will determine whether there's a collision
    hit = false;

    //Find the center points of each sprite
    r1.centerX = r1.x + r1.width / 2;
    r1.centerY = r1.y + r1.height / 2;
    r2.centerX = r2.x + r2.width / 2;
    r2.centerY = r2.y + r2.height / 2;

    //Find the half-widths and half-heights of each sprite
    r1.halfWidth = r1.width / 2;
    r1.halfHeight = r1.height / 2;
    r2.halfWidth = r2.width / 2;
    r2.halfHeight = r2.height / 2;

    //Calculate the distance vector between the sprites
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;

    //Figure out the combined half-widths and half-heights
    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;

    //Check for a collision on the x axis
    if (Math.abs(vx) < combinedHalfWidths) {

        //A collision might be occuring. Check for a collision on the y axis
        if (Math.abs(vy) < combinedHalfHeights) {

            //There's definitely a collision happening
            hit = true;
        } else {

            //There's no collision on the y axis
            hit = false;
        }
    } else {

        //There's no collision on the x axis
        hit = false;
    }

    //`hit` will be either `true` or `false`
    return hit;
};

function onMouseDown(eventData) {
    //eventData.preventDefault();

    var ex = eventData.data.originalEvent.offsetX;
    var ey = eventData.data.originalEvent.offsetY;
    onDown(ex, ey);
}

function onTouch(eventData) {
    //eventData.preventDefault();

    var ex = eventData.data.originalEvent.touches[0].pageX;
    var ey = eventData.data.originalEvent.touches[0].pageY;
    onDown(ex, ey);
}

function onDown(ex, ey) {

}

document.addEventListener('keydown', function(ev) { return onkey(ev, ev.keyCode, true);  }, false);
document.addEventListener('keyup',   function(ev) { return onkey(ev, ev.keyCode, false); }, false);

function onkey(ev, key, down) {
    switch(key) {
        case KEY.SPACE:
            input[0] = down;
            plane.animationSpeed = down ? 0.5 : 0.0;
            ev.preventDefault();
            return false;
        case KEY.W:
        case KEY.UP:
            input[1] = down;
            ev.preventDefault();
            return false;
        case KEY.S:
        case KEY.DOWN:
            input[2] = down;
            ev.preventDefault();
            return false;
    }
}

setup();