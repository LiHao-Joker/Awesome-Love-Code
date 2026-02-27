var canvas = document.getElementById("cas");
var ocas = document.createElement("canvas");
var octx = ocas.getContext("2d");
var ctx = canvas.getContext("2d");
ocas.width = canvas.width = window.innerWidth;
ocas.height = canvas.height = window.innerHeight;
var bigbooms = [];

document.getElementById("iframMusic").onload = function(){
    var music = document.getElementById("music");
    music.src = 'music.mp3';
    music.oncanplay = function(){
        music.play();
    };
};

function initAnimate() {
    drawBg();
    lastTime = new Date();
    animate()
}
var lastTime;
function animate() {
    ctx.save();
    ctx.fillStyle = "rgba(0,5,24,0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    var newTime = new Date();
    // 增大烟花生成频率：减小时间间隔基数，让烟花更密集
    if (newTime - lastTime > 400 + (window.innerHeight - 767) / 3) {
        // 移除形状烟花逻辑，只生成普通烟花
        var x = getRandom(canvas.width / 5, canvas.width * 4 / 5);
        var y = getRandom(50, 200);
        // 只创建普通烟花，不再传递shape参数
        var bigboom = new Boom(getRandom(canvas.width / 3, canvas.width * 2 / 3), 2, "#FFF", {
            x: x,
            y: y
        });
        bigbooms.push(bigboom)
        lastTime = newTime;
        console.log(bigbooms)
    }
    // 修复foreach拼写错误（原代码的语法错误）
    stars.forEach(function() {
        this.paint()
    });
    drawMoon();
    // 修复foreach拼写错误，同时移除形状烟花相关的清理逻辑
    bigbooms.forEach(function(index) {
        var that = this;
        if (!this.dead) {
            this._move();
            this._drawLight()
        } else {
            this.booms.forEach(function(index) {
                if (!this.dead) {
                    this.moveTo(index)
                } else {
                    if (index === that.booms.length - 1) {
                        bigbooms[bigbooms.indexOf(that)] = null
                    }
                }
            })
        }
    });
    raf(animate)
}
function drawMoon() {
    var moon = document.getElementById("moon");
    var centerX = canvas.width - 200,
        centerY = 100,
        width = 80;
    if (moon.complete) {
        ctx.drawImage(moon, centerX, centerY, width, width)
    } else {
        moon.onload = function() {
            ctx.drawImage(moon, centerX, centerY, width, width)
        }
    }
    var index = 0;
    for (var i = 0; i < 10; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX + width / 2, centerY + width / 2, width / 2 + index, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(240,219,120,0.005)";
        index += 2;
        ctx.fill();
        ctx.restore()
    }
}
// 修复foreach拼写错误为标准的forEach
Array.prototype.forEach = function(callback) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] !== null) {
            callback.apply(this[i], [i])
        }
    }
};
var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60)
    };
canvas.onclick = function() {
    var x = event.clientX;
    var y = event.clientY;
    // 点击只生成普通烟花
    var bigboom = new Boom(getRandom(canvas.width / 3, canvas.width * 2 / 3), 2, "#FFF", {
        x: x,
        y: y
    });
    bigbooms.push(bigboom)
};
var Boom = function(x, r, c, boomArea) {
    // 移除shape参数，不再初始化shape相关属性
    this.booms = [];
    this.x = x;
    this.y = (canvas.height + r);
    this.r = r;
    this.c = c;
    this.boomArea = boomArea;
    this.theta = 0;
    this.dead = false;
    // 继续增大爆炸判定阈值，使烟花在更早阶段爆炸
    this.ba = parseInt(getRandom(200, 400))
};
Boom.prototype = {
    _paint: function() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = this.c;
        ctx.fill();
        ctx.restore()
    },
    _move: function() {
        var dx = this.boomArea.x - this.x,
            dy = this.boomArea.y - this.y;
        this.x = this.x + dx * 0.01;
        this.y = this.y + dy * 0.01;
        if (Math.abs(dx) <= this.ba && Math.abs(dy) <= this.ba) {
            // 移除shape判断，只执行普通爆炸逻辑
            this._boom();
            this.dead = true
        } else {
            this._paint()
        }
    },
    _drawLight: function() {
        ctx.save();
        ctx.fillStyle = "rgba(255,228,150,0.3)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 5 * Math.random() + 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore()
    },
    _boom: function() {
        // 大幅增加粒子数量：200 ~ 800
        var fragNum = getRandom(200, 800);
        var style = getRandom(0, 10) >= 5 ? 1 : 2;
        var color;
        if (style === 1) {
            color = {
                a: parseInt(getRandom(128, 255)),
                b: parseInt(getRandom(128, 255)),
                c: parseInt(getRandom(128, 255))
            }
        }
        // 扩大爆炸范围：800 ~ 1200
        var fanwei = parseInt(getRandom(800, 1200));
        for (var i = 0; i < fragNum; i++) {
            if (style === 2) {
                color = {
                    a: parseInt(getRandom(128, 255)),
                    b: parseInt(getRandom(128, 255)),
                    c: parseInt(getRandom(128, 255))
                }
            }
            var a = getRandom( - Math.PI, Math.PI);
            var x = getRandom(0, fanwei) * Math.cos(a) + this.x;
            var y = getRandom(0, fanwei) * Math.sin(a) + this.y;
            // 加大粒子半径：1 ~ 4
            var radius = getRandom(1, 4);
            var frag = new Frag(this.x, this.y, radius, color, x, y);
            this.booms.push(frag)
        }
    }
    // 彻底移除_shapBoom方法
};
// 移除形状烟花相关的辅助函数（putValue/imgload/getimgData），这些不再需要
function getRandom(a, b) {
    return Math.random() * (b - a) + a
}
var maxRadius = 1,
    stars = [];
function drawBg() {
    for (var i = 0; i < 100; i++) {
        var r = Math.random() * maxRadius;
        var x = Math.random() * canvas.width;
        var y = Math.random() * 2 * canvas.height - canvas.height;
        var star = new Star(x, y, r);
        stars.push(star);
        star.paint()
    }
}
var Star = function(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r
};
Star.prototype = {
    paint: function() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255,255,255," + this.r + ")";
        ctx.fill();
        ctx.restore()
    }
};
var focallength = 250;
var Frag = function(centerX, centerY, radius, color, tx, ty) {
    this.tx = tx;
    this.ty = ty;
    this.x = centerX;
    this.y = centerY;
    this.dead = false;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.color = color
};
Frag.prototype = {
    paint: function() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(" + this.color.a + "," + this.color.b + "," + this.color.c + ",1)";
        ctx.fill();
        ctx.restore()
    },
    moveTo: function(index) {
        // 增加下落速度：0.8，让烟花扩散更迅速、更张扬
        this.ty = this.ty + 0.8;
        var dx = this.tx - this.x,
            dy = this.ty - this.y;
        this.x = Math.abs(dx) < 0.1 ? this.tx: (this.x + dx * 0.1);
        this.y = Math.abs(dy) < 0.1 ? this.ty: (this.y + dy * 0.1);
        if (dx === 0 && Math.abs(dy) <= 80) {
            this.dead = true
        }
        this.paint()
    }
};

// 初始化动画
initAnimate();
