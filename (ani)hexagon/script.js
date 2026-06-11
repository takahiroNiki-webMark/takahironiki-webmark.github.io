const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let hexagons = [];
const mouse = { x: null, y: null };

// 画面サイズ調整
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

resize();

class Hexagon {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 20 + 10;
        this.baseSize = this.size;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        this.angle = 0;
        this.spin = Math.random() * 0.05;
        this.opacity = 0;
        this.fadeSpeed = Math.random() * 0.01 + 0.005;
        this.fadingIn = true;
        this.scale = 1;
        this.scaleStep = Math.random() * 0.02;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            ctx.lineTo(
                (this.size * this.scale) * Math.cos(i * Math.PI / 3),
                (this.size * this.scale) * Math.sin(i * Math.PI / 3)
            );
        }
        ctx.closePath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    update() {
        // 移動
        this.x += this.speedX;
        this.y += this.speedY;

        // 画面外判定
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

        // 回転と拡縮
        this.angle += this.spin;
        this.scale = 1 + Math.sin(Date.now() * 0.002 + this.size) * 0.3;

        // フェードイン・アウト
        if (this.fadingIn) {
            this.opacity += this.fadeSpeed;
            if (this.opacity >= 0.8) this.fadingIn = false;
        } else {
            this.opacity -= this.fadeSpeed;
            if (this.opacity <= 0) this.init(); // 消えたら再配置
        }

        // マウスへの反応（避ける動き）
        if (mouse.x && mouse.y) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 100) {
                this.x -= dx * 0.02;
                this.y -= dy * 0.02;
            }
        }
    }
}

// 初期化
for (let i = 0; i < 40; i++) {
    hexagons.push(new Hexagon());
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexagons.forEach(hex => {
        hex.update();
        hex.draw();
    });
    requestAnimationFrame(animate);
}

animate();