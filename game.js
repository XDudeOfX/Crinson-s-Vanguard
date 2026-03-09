const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player adatok
const player = {
    x: 0, // világ koordináták
    y: 0,
    radius: 20,
    speed: 5,
    angle: 0
};

// Player neve
let playerName = "Unknown";

// Világ objektumok
const worldObjects = [
    {x: 200, y: 100, width: 50, height: 50, color: 'green'},
    {x: -150, y: -200, width: 100, height: 100, color: 'orange'},
    {x: 300, y: -150, width: 60, height: 60, color: 'purple'}
];

// Világ határa
const worldBounds = {
    xMin: -500,
    yMin: -500,
    xMax: 500,
    yMax: 500
};

// WASD input
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Egér pozíció
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Ütközés detektálás objektumokkal
function checkCollision(newX, newY) {
    for (const obj of worldObjects) {
        const closestX = Math.max(obj.x, Math.min(newX, obj.x + obj.width));
        const closestY = Math.max(obj.y, Math.min(newY, obj.y + obj.height));
        const distX = newX - closestX;
        const distY = newY - closestY;
        const distance = Math.sqrt(distX*distX + distY*distY);
        if(distance < player.radius){
            return true;
        }
    }
    return false;
}

// Player mozgatása WASD-vel és kollízió
function movePlayer() {
    let dx = 0, dy = 0;
    if(keys['w']) dy -= player.speed;
    if(keys['s']) dy += player.speed;
    if(keys['a']) dx -= player.speed;
    if(keys['d']) dx += player.speed;

    let newX = player.x + dx;
    let newY = player.y + dy;

    // World border ellenőrzés
    if(newX - player.radius < worldBounds.xMin) newX = worldBounds.xMin + player.radius;
    if(newX + player.radius > worldBounds.xMax) newX = worldBounds.xMax - player.radius;
    if(newY - player.radius < worldBounds.yMin) newY = worldBounds.yMin + player.radius;
    if(newY + player.radius > worldBounds.yMax) newY = worldBounds.yMax - player.radius;

    // Objektumok ellenőrzése
    if(!checkCollision(newX, newY)){
        player.x = newX;
        player.y = newY;
    }
}

function update() {
    movePlayer();

    // Karakter néz az egér felé
    player.angle = Math.atan2(mouseY - canvas.height/2, mouseX - canvas.width/2);

    // Konzol log
    console.clear();
    console.log(`Player X: ${player.x.toFixed(2)}, Y: ${player.y.toFixed(2)}, Angle: ${player.angle.toFixed(2)}`);

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const screenX = canvas.width/2;
    const screenY = canvas.height/2;

    // Világ objektumok rajzolása
    for (const obj of worldObjects) {
        const drawX = obj.x - player.x + screenX;
        const drawY = obj.y - player.y + screenY;
        ctx.fillStyle = obj.color;
        ctx.fillRect(drawX, drawY, obj.width, obj.height);
    }

    // World border kirajzolása
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(
        screenX + worldBounds.xMin - player.x,
        screenY + worldBounds.yMin - player.y,
        worldBounds.xMax - worldBounds.xMin,
        worldBounds.yMax - worldBounds.yMin
    );

    // Karakter felé mutató vonal
    ctx.strokeStyle = 'deepskyblue';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();

    // Player kör
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(player.angle);
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Player neve a kör fölött
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playerName, screenX, screenY - player.radius - 10);
}

// Play gomb esemény
document.getElementById('playBtn').addEventListener('click', () => {
    const input = document.querySelector('.menu input').value.trim();
    playerName = input !== "" ? input : "Unknown";

    document.querySelector('.menu').style.display = 'none';
    canvas.style.display = 'block';
    update();
});

// Ablak átméretezés
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});