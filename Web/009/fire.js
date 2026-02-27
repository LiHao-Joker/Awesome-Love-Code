var canvas = document.getElementById("cas");
var ocas = document.createElement("canvas");
var octx = ocas.getContext("2d");
var ctx = canvas.getContext("2d");
ocas.width = canvas.width = window.innerWidth;
ocas.height = canvas.height = window.innerHeight;
var bigbooms = [];

// 音乐加载逻辑（保持原有）
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
    // 优化背景渐变效果，让残影更自然
    ctx.save();
    ctx.fillStyle = "rgba(0,5,24,0.08)"; // 调整透明度，让拖尾更明显
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    var newTime = new Date();
    // 缩短烟花发射间隔，增加出现频率
    if (newTime - lastTime > 300 + (window.innerHeight - 767) / 4) {
        var random = Math.random() > 0.3; // 提高随机烟花概率
        var x = getRandom(canvas.width / 5, canvas.width * 4 / 5);
        var y = getRandom(50, 300); // 提高随机烟花的Y轴范围
        if (random) {
            var bigboom = new Boom(getRandom(canvas.width / 3, canvas.width * 2 / 3), 3, getRandomColor(), { // 增大初始半径，随机颜色
                x: x,
                y: y
            });
            bigbooms.push(bigboom)
        } else {
            var bigboom = new Boom(getRandom(canvas.width / 3, canvas.width * 2 / 3), 3, getRandomColor(), { // 增大初始半径，随机颜色
                    x: canvas.width / 2,
                    y: 200
                },
                document.querySelectorAll(".shape")[parseInt(getRandom(0, document.querySelectorAll(".shape").length))]);
            bigbooms.push(bigboom)
        }
        lastTime = newTime;
    }
    
    // 修复forEach拼写错误（原foreach）
    stars.forEach(function(star) {
        star.paint();
        star.twinkle(); // 星星闪烁效果
    });
    drawMoon();
    
    // 遍历烟花数组，优化清理逻辑
    for (var i = bigbooms.length - 1; i >= 0; i--) {
        var boom = bigbooms[i];
        if (!boom) {
            bigbooms.splice(i, 1);
            continue;
        }
        if (!boom.dead) {
            boom._move();
            boom._drawLight();
            boom._drawTail(); // 新增烟花上升拖尾
        } else {
            var allDead = true;
            boom.booms.forEach(function(frag, idx) {
                if (!frag.dead) {
                    frag.moveTo(idx);
                    allDead = false;
                }
            });
            // 清理完全消失的烟花
            if (allDead) {
                bigbooms.splice(i, 1);
            }
        }
    }
    raf(animate)
}

// 优化月亮光晕效果，更柔和
function drawMoon() {
    var moon = document.getElementById("moon");
    var centerX = canvas.width - 200,
        centerY = 100,
        width = 100; // 增大月亮尺寸
    if (moon.complete) {
        ctx.drawImage(moon, centerX, centerY, width, width)
    } else {
        moon.onload = function() {
            ctx.drawImage(moon, centerX, centerY, width, width)
        }
    }
    var index = 0;
    for (var i = 0; i < 20; i++) { // 增加光晕层数
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX + width / 2, centerY + width / 2, width / 2 + index, 0, 2 * Math.PI);
        // 优化光晕透明度渐变
        ctx.fillStyle = `rgba(240,219,120,${0.008 - index * 0.0003})`;
        index += 3; // 增大光晕间距
        ctx.fill();
        ctx.restore()
    }
}

// 修复自定义forEach方法的拼写和逻辑
Array.prototype.forEach = function(callback) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] !== null && this[i] !== undefined) {
            callback(this[i], i, this);
        }
    }
};

var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60)
    };

// 点击生成更大更绚烂的烟花
canvas.onclick = function(event) {
    var x = event.clientX;
    var y = event.clientY;
    // 点击生成超大烟花
    var bigboom = new Boom(getRandom(canvas.width / 3, canvas.width * 2 / 3), 5, getRandomColor(), { // 更大的初始半径
        x: x,
        y: y
    });
    bigbooms.push(bigboom)
};

// 烟花主类 - 全面增强视觉效果
var Boom = function(x, r, c, boomArea, shape) {
    this.booms = [];
    this.x = x;
    this.y = (canvas.height + r);
    this.r = r;
    this.c = c;
    this.shape = shape || false;
    this.boomArea = boomArea;
    this.theta = 0;
    this.dead = false;
    // 1. 大幅增大爆炸判定距离，让烟花在更高位置爆炸
    this.ba = parseInt(getRandom(200, 400));
    // 新增：记录上升轨迹，用于绘制拖尾
    this.trail = [];
};

Boom.prototype = {
    _paint: function() {
        ctx.save();
        ctx.beginPath();
        // 绘制渐变圆形，让烟花弹更有质感
        var gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, this.c);
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
        // 记录轨迹点
        this.trail.push({x: this.x, y: this.y, alpha: 1});
        if (this.trail.length > 15) this.trail.shift(); // 限制拖尾长度
    },
    // 新增：绘制烟花上升拖尾
    _drawTail: function() {
        ctx.save();
        for (var i = 0; i < this.trail.length; i++) {
            var p = this.trail[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, this.r * (i / this.trail.length), 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(255,255,255,${p.alpha * 0.5})`;
            ctx.fill();
            p.alpha -= 0.05; // 拖尾逐渐消失
        }
        ctx.restore();
    },
    _move: function() {
        var dx = this.boomArea.x - this.x,
            dy = this.boomArea.y - this.y;
        // 加快上升速度，让烟花更快到达爆炸点
        this.x = this.x + dx * 0.02;
        this.y = this.y + dy * 0.02;
        if (Math.abs(dx) <= this.ba && Math.abs(dy) <= this.ba) {
            if (this.shape) {
                this._shapBoom()
            } else {
                this._boom()
            }
            this.dead = true
        } else {
            this._paint()
        }
    },
    // 2. 增强光晕效果，更大更亮
    _drawLight: function() {
        ctx.save();
        // 外层大光晕
        ctx.fillStyle = `rgba(255,228,150,0.2)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 10 * Math.random() + 5, 0, 2 * Math.PI);
        ctx.fill();
        // 内层小光晕
        ctx.fillStyle = `rgba(255,240,180,0.4)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 5 * Math.random() + 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore()
    },
    // 3. 大幅增加粒子数量，优化色彩和范围
    _boom: function() {
        // 粒子数量从100-500增加到300-1000
        var fragNum = parseInt(getRandom(300, 1000));
        var style = getRandom(0, 10) >= 3 ? 1 : 2; // 调整颜色样式概率
        var baseColor = this.c.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/) || 
                        [0, 'FF', 'FF', 'FF'];
        var color;
        
        for (var i = 0; i < fragNum; i++) {
            if (style === 1) {
                // 基于烟花主色的渐变色彩，更协调
                color = {
                    a: Math.min(255, parseInt(baseColor[1], 16) + getRandom(-50, 50)),
                    b: Math.min(255, parseInt(baseColor[2], 16) + getRandom(-50, 50)),
                    c: Math.min(255, parseInt(baseColor[3], 16) + getRandom(-50, 50))
                }
            } else {
                // 随机高饱和度色彩
                color = {
                    a: parseInt(getRandom(150, 255)),
                    b: parseInt(getRandom(100, 255)),
                    c: parseInt(getRandom(100, 255))
                }
            }
            var a = getRandom( - Math.PI, Math.PI);
            // 爆炸范围从600-800增加到800-1500
            var fanwei = parseInt(getRandom(800, 1500));
            var x = getRandom(0, fanwei) * Math.cos(a) + this.x;
            var y = getRandom(0, fanwei) * Math.sin(a) + this.y;
            // 粒子半径从0-2调整为0.5-3，大小更丰富
            var radius = getRandom(0.5, 3);
            var frag = new Frag(this.x, this.y, radius, color, x, y);
            this.booms.push(frag)
        }
    },
    // 4. 优化形状烟花，粒子更密集
    _shapBoom: function() {
        var that = this;
        // 采样间隔从2减小到1，粒子密度翻倍
        putValue(ocas, octx, this.shape, 1,
            function(dots) {
                var dx = canvas.width / 2 - that.x;
                var dy = canvas.height / 2 - that.y;
                for (var i = 0; i < dots.length; i++) {
                    // 形状烟花也使用渐变色彩
                    color = {
                        a: parseInt(getRandom(dots[i].a - 30, dots[i].a + 30)),
                        b: parseInt(getRandom(dots[i].b - 30, dots[i].b + 30)),
                        c: parseInt(getRandom(dots[i].c - 30, dots[i].c + 30))
                    };
                    var x = dots[i].x;
                    var y = dots[i].y;
                    var radius = getRandom(1, 2); // 增大形状粒子半径
                    var frag = new Frag(that.x, that.y, radius, color, x - dx, y - dy);
                    that.booms.push(frag)
                }
            })
    }
};

// 随机生成好看的烟花主色
function getRandomColor() {
    var colors = [
        "#FF5E5E", "#FFD166", "#06D6A0", "#118AB2", "#073B4C",
        "#FF6B6B", "#4ECDC4", "#FFE66D", "#FF8C42", "#A77DC2"
    ];
    return colors[parseInt(getRandom(0, colors.length))];
}

// 保持原有方法，优化性能
function putValue(canvas, context, ele, dr, callback) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    var img = new Image();
    if (ele.innerHTML.indexOf("img") >= 0) {
        img.src = ele.getElementsByTagName("img")[0].src;
        imgload(img,
            function() {
                context.drawImage(img, canvas.width / 2 - img.width / 2, canvas.height / 2 - img.width / 2);
                dots = getimgData(canvas, context, dr);
                callback(dots)
            })
    } else {
        var text = ele.innerHTML;
        context.save();
        var fontSize = 250; // 增大形状文字尺寸
        context.font = fontSize + "px 微软雅黑 bold";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = getRandomColor(); // 使用随机主色
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        context.restore();
        dots = getimgData(canvas, context, dr);
        callback(dots)
    }
}

function imgload(img, callback) {
    if (img.complete) {
        callback.call(img)
    } else {
        img.onload = function() {
            callback.call(this)
        }
    }
}

function getimgData(canvas, context, dr) {
    var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    context.clearRect(0, 0, canvas.width, canvas.height);
    var dots = [];
    for (var x = 0; x < imgData.width; x += dr) {
        for (var y = 0; y < imgData.height; y += dr) {
            var i = (y * imgData.width + x) * 4;
            if (imgData.data[i + 3] > 128) {
                var dot = {
                    x: x,
                    y: y,
                    a: imgData.data[i],
                    b: imgData.data[i + 1],
                    c: imgData.data[i + 2]
                };
                dots.push(dot)
            }
        }
    }
    return dots
}

function getRandom(a, b) {
    return Math.random() * (b - a) + a
}

// 5. 增强星星背景效果
var maxRadius = 1.5, // 增大星星最大半径
    stars = [];
function drawBg() {
    // 星星数量从100增加到300，更密集
    for (var i = 0; i < 300; i++) {
        var r = Math.random() * maxRadius;
        var x = Math.random() * canvas.width;
        var y = Math.random() * canvas.height; // 调整星星分布范围
        var star = new Star(x, y, r);
        stars.push(star);
    }
}

// 星星类 - 新增闪烁效果
var Star = function(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.alpha = Math.random(); // 初始透明度
    this.speed = getRandom(0.005, 0.01); // 闪烁速度
};

Star.prototype = {
    paint: function() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
        ctx.fill();
        ctx.restore()
    },
    // 新增：星星闪烁动画
    twinkle: function() {
        this.alpha += this.speed;
        if (this.alpha > 1) {
            this.alpha = 1;
            this.speed = -this.speed;
        } else if (this.alpha < 0.2) {
            this.alpha = 0.2;
            this.speed = -this.speed;
        }
    }
};

var focallength = 250;
// 6. 优化粒子运动和消失效果
var Frag = function(centerX, centerY, radius, color, tx, ty) {
    this.tx = tx;
    this.ty = ty;
    this.x = centerX;
    this.y = centerY;
    this.dead = false;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.color = color;
    this.alpha = 1; // 新增：粒子透明度
    this.gravity = 0.08; // 新增：重力加速度
    this.decay = getRandom(0.005, 0.01); // 新增：透明度衰减速度
};

Frag.prototype = {
    // 优化粒子绘制，增加透明度渐变
    paint: function() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        // 粒子透明度渐变消失
        ctx.fillStyle = `rgba(${this.color.a},${this.color.b},${this.color.c},${this.alpha})`;
        ctx.fill();
        // 粒子外发光效果
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 1, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(${this.color.a},${this.color.b},${this.color.c},${this.alpha * 0.2})`;
        ctx.fill();
        ctx.restore()
    },
    // 优化粒子运动物理效果
    moveTo: function(index) {
        // 重力影响，粒子下落加速
        this.ty += this.gravity;
        // 增加空气阻力，让粒子运动更自然
        var dx = this.tx - this.x,
            dy = this.ty - this.y;
        this.x = Math.abs(dx) < 0.1 ? this.tx : (this.x + dx * 0.08); // 调整移动速度
        this.y = Math.abs(dy) < 0.1 ? this.ty : (this.y + dy * 0.08);
        
        // 透明度逐渐衰减
        this.alpha -= this.decay;
        if (this.alpha <= 0 || this.y > canvas.height) { // 超出画布也判定为消失
            this.dead = true;
        }
        this.paint()
    }
};

// 初始化动画
initAnimate();

// 窗口大小变化时重置画布尺寸
window.addEventListener('resize', function() {
    ocas.width = canvas.width = window.innerWidth;
    ocas.height = canvas.height = window.innerHeight;
    // 重新绘制背景星星
    stars = [];
    drawBg();
});
