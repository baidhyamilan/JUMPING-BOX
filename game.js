const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const overlay = document.getElementById('overlay');
const menu = document.getElementById('menu');
const gameOverScreen = document.getElementById('game-over');

// Game Constants
const GRAVITY = 0.9;
const JUMP_FORCE = -10;
const SPEED_INCREMENT = 0.0005;
const INITIAL_SPEED = 5;

// Game State
let gameActive = false;
let score = 0;
let highScore = localStorage.getItem('neonDashHighScore') || 0;
let gameSpeed = INITIAL_SPEED;
let animationId;

let player = {
  x: 50,
  y: 0,
  width: 35,
  height: 35,
  vy: 0,
  color: '#ffcc00'
};

let obstacles = [];
let particles = [];

highScoreEl.innerText = `High: ${highScore}`;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  player.y = canvas.height / 2;
}

window.addEventListener('resize', resize);
resize();

// Input handling
function handleInput(e) {
  if (e.type === 'touchstart' || e.type === 'mousedown') {
    if (gameActive) {
      player.vy = JUMP_FORCE;
    }
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') handleInput(e);
});
window.addEventListener('mousedown', handleInput);
window.addEventListener('touchstart', handleInput, { passive: false });

function createObstacle() {
  const minGap = 200;
  const size = Math.random() * (canvas.height / 3) + 50;
  const isTop = Math.random() > 0.5;
  
  const obstacle = {
    x: canvas.width,
    y: isTop ? 0 : canvas.height - size,
    width: 40,
    height: size,
    color: '#cca300'
  };
  
  obstacles.push(obstacle);
}

function createParticle(x, y, color) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      size: Math.random() * 4 + 2,
      life: 1.0,
      color
    });
  }
}

function update() {
  if (!gameActive) return;
  
  // Player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  
  // Boundary check
  if (player.y + player.height > canvas.height || player.y < 0) {
    gameOver();
  }
  
  // Obstacles
  if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - (Math.random() * 200 + 300)) {
    createObstacle();
  }
  
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= gameSpeed;
    
    // Collision detection
    if (
      player.x < obstacles[i].x + obstacles[i].width &&
      player.x + player.width > obstacles[i].x &&
      player.y < obstacles[i].y + obstacles[i].height &&
      player.y + player.height > obstacles[i].y
    ) {
      gameOver();
    }
    
    // Score & Removal
    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
      score += 10;
      scoreEl.innerText = `Score: ${score}`;
    }
  }
  
  // Speed up
  gameSpeed += SPEED_INCREMENT;
  
  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].x += particles[i].vx;
    particles[i].y += particles[i].vy;
    particles[i].life -= 0.02;
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
  
  // Player trail particles
  if (Math.random() > 0.5) {
    createParticle(player.x, player.y + player.height / 2, player.color);
  }
  
  draw();
  animationId = requestAnimationFrame(update);
}

function draw() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw background grid (simple)
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 50) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i < canvas.height; i += 50) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }
  
  // Draw particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;
  
  // Draw player
  ctx.shadowBlur = 15;
  ctx.shadowColor = player.color;
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.shadowBlur = 0;
  
  // Draw obstacles
  obstacles.forEach(obstacle => {
    ctx.shadowBlur = 15;
    ctx.shadowColor = obstacle.color;
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.shadowBlur = 0;
  });
}

function startGame() {
  gameActive = true;
  score = 0;
  gameSpeed = INITIAL_SPEED;
  player.y = canvas.height / 2;
  player.vy = 0;
  obstacles = [];
  particles = [];
  scoreEl.innerText = `Score: 0`;
  overlay.classList.add('hidden');
  menu.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  update();
}

function gameOver() {
  gameActive = false;
  cancelAnimationFrame(animationId);
  
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('neonDashHighScore', highScore);
    highScoreEl.innerText = `High: ${highScore}`;
  }
  
  finalScoreEl.innerText = `Score: ${score}`;
  overlay.classList.remove('hidden');
  gameOverScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

restartBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

// Initial draw
draw();