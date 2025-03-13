let hasAttempted = false;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let backgroundAspectRatio = 1;
const backgroundImg = new Image();
backgroundImg.src = "6.jpg"; // 背景图片路径
backgroundImg.onload = () => {
    backgroundAspectRatio = backgroundImg.width / backgroundImg.height;
    resizeCanvas();
};

// 动态调整画布大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = canvas.width / backgroundAspectRatio;
    updatePositions();
    redraw();
}

// 重绘画布
function redraw() {
    if (backgroundImg.complete) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    }
}

const playerImg = new Image();
playerImg.src = "1.png";

const itemImgs = [
    { img: "2.png", widthMultiplier: 2 },
    { img: "3.png", widthMultiplier: 1 },
    { img: "4.png", widthMultiplier: 1 }
].map(data => {
    const img = new Image();
    img.src = data.img;
    img.widthMultiplier = data.widthMultiplier;
    return img;
});

let player = {
    x: canvas.width / 2 - 50,
    y: canvas.height * 4 / 5 - 50,
    width: 100,
    height: 100,
    speed: 10
};

let items = [];
let score = 0;

const relativePositions = [0.25, 0.5, 0.75];
let positions = [];

function updatePositions() {
    positions = relativePositions.map(ratio => canvas.width * ratio);
    player.y = canvas.height * 4 / 5 - player.height / 2;
}

function checkLogin() {
    if (hasAttempted) return;

    const input = document.getElementById("loginInput").value;
    const errorMessage = document.getElementById("errorMessage");

    if (input === "黑花99") {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("gameRules").style.display = "block";
    } else {
        errorMessage.textContent = "答案错误，您已失去游戏资格！";
        document.getElementById("loginInput").disabled = true;
        hasAttempted = true;
    }
}

function startGame() {
    document.getElementById("gameRules").style.display = "none";
    canvas.style.display = "block";
    resizeCanvas();

    // 播放背景音乐
    const backgroundMusic = document.getElementById("backgroundMusic");
    backgroundMusic.play();

    generateItems();
    updateGame();
}

function generateItems() {
    setInterval(() => {
        const type = Math.floor(Math.random() * itemImgs.length);
        let x;

        if (type === 0) {
            x = Math.random() < 0.5
                ? positions[0] - 50 / 2
                : positions[1] - 50 / 2;
        } else {
            x = positions[Math.floor(Math.random() * positions.length)] - 25;
        }

        const sizeMultiplier = itemImgs[type].widthMultiplier;
        items.push({
            x,
            y: 0,
            type,
            speed: 5,
            width: 50 * sizeMultiplier,
            height: 50 * sizeMultiplier
        });
    }, 800);
}

let moveLeft = false;
let moveRight = false;

window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") moveLeft = true;
    if (event.key === "ArrowRight") moveRight = true;
});

window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") moveLeft = false;
    if (event.key === "ArrowRight") moveRight = false;
});

canvas.addEventListener("touchstart", (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    touchStartX = touch.clientX;
});

canvas.addEventListener("touchmove", (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    const touchCurrentX = touch.clientX;
    const touchOffsetX = touchCurrentX - touchStartX;
    player.x += touchOffsetX;
    touchStartX = touchCurrentX;

    if (player.x < 0) player.x = 0;
    else if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
});

function displayScore() {
    ctx.font = "20px CustomFont";
    ctx.fillStyle = "#f7f1b3";

    const xPosition = canvas.width * 0.25; // 画布宽度的 1/4 处
    const yPosition = 30; // 距顶部 30 像素
    if (score >= 99) {
        ctx.fillText("分数: 黑花99", xPosition, yPosition); // 如果分数超过 99
    } else {
        ctx.fillText(`分数: ${score}`, xPosition, yPosition); // 否则显示当前分数
    }
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redraw();

    // 玩家移动逻辑（键盘）
    if (moveLeft && player.x > 0) player.x -= player.speed;
    if (moveRight && player.x < canvas.width - player.width) player.x += player.speed;

    // 绘制玩家
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // 道具逻辑更新
    items.forEach((item, index) => {
        if (item.type === 0 && item.stopped) {
            // 特殊道具逻辑 (2.png)
        } else {
            item.y += item.speed; // 常规道具下落
        }

        // 绘制道具
        ctx.drawImage(itemImgs[item.type], item.x, item.y, item.width, item.height);

        // 碰撞检测
        if (
            item.x < player.x + player.width &&
            item.x + item.width > player.x &&
            item.y < player.y + player.height &&
            item.y + item.height > player.y
        ) {
            // 新增中心高度对齐的逻辑
            const playerCenterY = player.y + player.height / 2;
            const itemCenterY = item.y + item.height / 2;
            const heightTolerance = 10; // 容许误差范围，单位为像素

            if (Math.abs(playerCenterY - itemCenterY) <= heightTolerance) {
                // 碰撞处理逻辑
                if (item.type === 0 && !item.stopped) {
                    // 处理 2.png 接触逻辑
                    item.stopped = true;
                    item.speed = 0;

                    const targetX = canvas.width * 0.75 - item.width / 2;
                    const startX = item.x;
                    const animationDuration = 1000;
                    const startTime = Date.now();

                    function animate() {
                        const elapsed = Date.now() - startTime;
                        if (elapsed < animationDuration) {
                            const progress = elapsed / animationDuration;
                            item.x = startX + progress * (targetX - startX);
                            requestAnimationFrame(animate);
                        } else {
                            item.x = targetX;
                            setTimeout(() => {
                                items = items.filter(i => i !== item);
                                score += 3;
                            }, 1500);
                        }
                    }
                    animate();
                } else if (item.type === 1) {
                    // 处理 3.png 接触逻辑 (+1分)
                    score += 1;
                    items.splice(index, 1);
                } else if (item.type === 2) {
                    // 处理 4.png 接触逻辑 (-1分)
                    score -= 1;
                    items.splice(index, 1);
                }
            }
        }


        // 删除超出屏幕的道具
        if (item.y > canvas.height) {
            items.splice(index, 1);
        }
    });

    // 显示分数（已更新显示逻辑）
    displayScore();

    // 游戏结束条件
    if (score >= 99) {
        endGame();
        return;
    }

    requestAnimationFrame(updateGame);
}

function endGame() {
    // 显示游戏结束界面
    const endScreen = document.getElementById("endScreen");
    endScreen.style.display = "block";

    // 隐藏画布
    const canvas = document.getElementById("gameCanvas");
    canvas.style.display = "none";

    /// 设置 2 秒后切换到最终界面
    setTimeout(() => {
        endScreen.style.display = "none"; // 隐藏结束界面
        finalScreen.style.display = "block"; // 显示最终界面
    }, 2000); // 延时 2000 毫秒 (2 秒)
}
