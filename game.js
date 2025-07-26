import { CONFIG } from './config.js';

// Game state variables
let gameStarted = false;
let scaleFactor = 1;
let lastFrameTime = performance.now();
let frameCount = 0;
let avgFPS = 60;
let enemyIdCounter = 0;

// DOM elements
let canvas, ctx, bgm;
let joystickContainer, joystickBase, joystickHandle, shootControls;
let fuelBtn, electricWaveBtn, missileBtn, bulletTimeBtn, shootButton;

// Game objects
let tank, supportTank;
let bullets = [];
let supportBullets = [];
let enemyBullets = [];
let enemies = [];

// Game systems
let victorySystem, electricWaveSystem, missileSystem, fuelSystem, bulletTimeSystem, worldSystem;
let joystick;

// Messages
let fuelMessage = { text: '', time: 0 };
let bulletTimeMessage = { text: '', time: 0 };
let generalMessage = { text: '', time: 0 };

// Key states
const keys = {};

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeDOM();
  initializeGame();
  setupEventListeners();
});

function initializeDOM() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  bgm = document.getElementById('bgm');
  joystickContainer = document.getElementById('joystickContainer');
  joystickBase = document.getElementById('joystickBase');
  joystickHandle = document.getElementById('joystickHandle');
  shootControls = document.getElementById('shootControls');
  fuelBtn = document.getElementById('fuelBtn');
  electricWaveBtn = document.getElementById('electricWaveBtn');
  missileBtn = document.getElementById('missileBtn');
  bulletTimeBtn = document.getElementById('bulletTimeBtn');
  shootButton = document.getElementById('shootBtn');

  // Check for critical elements
  const startBtn = document.getElementById('startBtn');
  if (!startBtn) {
    console.error('Start button not found!');
    alert('Lỗi: Không tìm thấy nút Bắt đầu!');
  }
  if (!canvas) {
    console.error('Canvas not found!');
    alert('Lỗi: Không tìm thấy canvas!');
  }
}

function initializeGame() {
  // Initialize canvas
  resizeCanvas();
  
  // Initialize game systems
  initializeGameSystems();
  
  // Initialize game objects
  initializeGameObjects();
  
  // Initialize joystick
  initializeJoystick();
  
  // Setup resize handler
  window.addEventListener('resize', handleResize);
}

function initializeGameSystems() {
  // Victory system
  victorySystem = {
    enemiesKilled: 0,
    targetKills: CONFIG.victory.targetKills,
    gameWon: false
  };

  // Electric wave system
  electricWaveSystem = {
    isReady: true,
    cooldownTime: CONFIG.electricWave.cooldownTime,
    currentCooldown: 0,
    waves: [],
    get waveRadius() { 
      return Math.max(CONFIG.electricWave.waveRadius * scaleFactor, 150); 
    },
    waveDamage: CONFIG.electricWave.waveDamage,
    get waveSpeed() { 
      return Math.max(CONFIG.electricWave.waveSpeed * scaleFactor, 4); 
    }
  };

  // Missile system
  missileSystem = {
    isReady: true,
    cooldownTime: CONFIG.missile.cooldownTime,
    currentCooldown: 0,
    missiles: [],
    get missileSpeed() { 
      return Math.max(CONFIG.missile.speed * scaleFactor, 3); 
    },
    missileDamage: CONFIG.missile.damage,
    get explosionRadius() { 
      return Math.max(CONFIG.missile.explosionRadius * scaleFactor, 40); 
    },
    get homingRange() { 
      return Math.max(CONFIG.missile.homingRange * scaleFactor, 100); 
    }
  };

  // Fuel system
  fuelSystem = {
    isReady: true,
    cooldownTime: CONFIG.fuel.cooldownTime,
    currentCooldown: 0
  };

  // Bullet time system
  bulletTimeSystem = {
    isActive: false,
    isReady: true,
    duration: CONFIG.bulletTime.duration,
    cooldownTime: CONFIG.bulletTime.cooldownTime,
    currentDuration: 0,
    currentCooldown: 0,
    originalShootCooldown: CONFIG.bulletTime.originalShootCooldown,
    laserActive: false
  };

  // World system
  worldSystem = {
    offsetX: 0,
    offsetY: 0,
    get tileSize() { 
      return Math.max(CONFIG.world.tileSize * scaleFactor, 20); 
    },
    terrain: [],
    decorations: []
  };
}

function initializeGameObjects() {
  // Initialize tank
  tank = {
    x: window.innerWidth/2 - 30,
    y: window.innerHeight/2 - 30,
    speed: CONFIG.tank.speed,
    hp: CONFIG.tank.hp,
    maxHp: CONFIG.tank.maxHp,
    worldX: window.innerWidth/2 - 30,
    worldY: window.innerHeight/2 - 30,
    shootCooldown: 0,
    shootInterval: CONFIG.tank.shootInterval,
    angle: -Math.PI / 2,
    turretAngle: -Math.PI / 2,
    autoAim: CONFIG.tank.autoAim,
    canShootWhileMoving: CONFIG.tank.canShootWhileMoving,
    autoShoot: CONFIG.tank.autoShoot
  };

  // Initialize support tank
  supportTank = {
    x: 350,
    y: 350,
    speed: CONFIG.supportTank.speed,
    hp: CONFIG.supportTank.hp,
    maxHp: CONFIG.supportTank.maxHp,
    worldX: 350,
    worldY: 350,
    targetDistance: CONFIG.supportTank.targetDistance,
    followAngle: CONFIG.supportTank.followAngle,
    shootCooldown: 0,
    shootInterval: CONFIG.supportTank.shootInterval
  };

  updateControlsScale();
}

function initializeJoystick() {
  joystick = {
    active: false,
    baseX: 0,
    baseY: 0,
    handleX: 0,
    handleY: 0,
    limitRadius: 0,
    dx: 0,
    dy: 0
  };
}

function resizeCanvas() {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;
  
  // Calculate scale factor based on screen size
  const scaleX = displayWidth / CONFIG.canvas.baseWidth;
  const scaleY = displayHeight / CONFIG.canvas.baseHeight;
  scaleFactor = Math.min(scaleX, scaleY, CONFIG.canvas.maxScaleFactor);
  
  // Set canvas size to actual pixels
  canvas.width = displayWidth * devicePixelRatio;
  canvas.height = displayHeight * devicePixelRatio;
  
  // Set display size
  canvas.style.width = displayWidth + 'px';
  canvas.style.height = displayHeight + 'px';
  
  // Scale context to match device pixel ratio
  ctx.scale(devicePixelRatio, devicePixelRatio);
  
  // Update controls scale
  updateControlsScale();
}

function getScaledFont(baseSize, fontFamily = 'Arial', weight = 'normal') {
  const scale = scaleFactor || 1;
  const scaledSize = Math.max(baseSize * scale, 12);
  return `${weight} ${scaledSize}px ${fontFamily}`;
}

function getScaledSize(baseSize) {
  const scale = scaleFactor || 1;
  return Math.max(baseSize * scale, baseSize * 0.5);
}

function updateControlsScale() {
  const isMobile = window.innerWidth <= CONFIG.mobile.breakpoint;
  const baseSize = isMobile ? CONFIG.ui.mobileButtonSize : CONFIG.ui.baseButtonSize;
  const scaledSize = Math.max(baseSize * scaleFactor, CONFIG.ui.minButtonSize);
  
  // Update joystick
  if (joystickContainer) {
    const joystickSize = Math.max(CONFIG.ui.joystickSize * scaleFactor, 100);
    joystickContainer.style.width = joystickSize + 'px';
    joystickContainer.style.height = joystickSize + 'px';
    
    const handleSize = Math.max(CONFIG.ui.joystickHandleSize * scaleFactor, 35);
    if (joystickHandle) {
      joystickHandle.style.width = handleSize + 'px';
      joystickHandle.style.height = handleSize + 'px';
    }
  }
  
  // Update control buttons
  const buttons = [shootButton, fuelBtn, electricWaveBtn, missileBtn, bulletTimeBtn];
  buttons.forEach(btn => {
    if (btn) {
      btn.style.width = scaledSize + 'px';
      btn.style.height = scaledSize + 'px';
      btn.style.fontSize = Math.max(24 * scaleFactor, 18) + 'px';
    }
  });
  
  // Update tank speed according to scale
  if (tank) {
    tank.speed = getScaledSize(CONFIG.tank.speed);
  }
}

function handleResize() {
  resizeCanvas();
  if (gameStarted && tank) {
    // Adjust tank position to maintain ratio
    tank.x = Math.min(tank.x, window.innerWidth - 60);
    tank.y = Math.min(tank.y, window.innerHeight - 60);
  }
}

function optimizePerformance() {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastFrameTime;
  lastFrameTime = currentTime;
  
  // Calculate average FPS
  const currentFPS = 1000 / deltaTime;
  avgFPS = avgFPS * 0.9 + currentFPS * 0.1;
  
  // Adjust scaleFactor if FPS is too low
  if (avgFPS < CONFIG.performance.minFPS && scaleFactor > 0.5) {
    scaleFactor *= 0.95;
    updateControlsScale();
  } else if (avgFPS > CONFIG.performance.maxFPS && scaleFactor < CONFIG.canvas.maxScaleFactor) {
    scaleFactor *= 1.01;
    updateControlsScale();
  }
}

// Terrain generation
function generateTerrain(startX, startY, width, height) {
  for (let x = startX; x < startX + width; x++) {
    for (let y = startY; y < startY + height; y++) {
      let key = `${x},${y}`;
      if (!worldSystem.terrain[key]) {
        // Generate basic terrain
        let terrainType = 'grass';
        if (Math.random() < 0.1) terrainType = 'dirt';
        else if (Math.random() < 0.05) terrainType = 'stone';
        
        worldSystem.terrain[key] = {
          type: terrainType,
          x: x,
          y: y
        };
        
        // Generate decorations
        if (Math.random() < 0.08) {
          let decorationType = 'grass_tuft';
          if (Math.random() < 0.3) decorationType = 'small_rock';
          else if (Math.random() < 0.1) decorationType = 'tree';
          else if (Math.random() < 0.2) decorationType = 'bush';
          
          worldSystem.decorations.push({
            type: decorationType,
            x: x * worldSystem.tileSize + Math.random() * worldSystem.tileSize,
            y: y * worldSystem.tileSize + Math.random() * worldSystem.tileSize,
            size: 0.5 + Math.random() * 0.5
          });
        }
      }
    }
  }
}

// Drawing functions
function drawTerrain() {
  const startTileX = Math.floor(worldSystem.offsetX / worldSystem.tileSize) - 1;
  const startTileY = Math.floor(worldSystem.offsetY / worldSystem.tileSize) - 1;
  const endTileX = startTileX + Math.ceil(canvas.width / worldSystem.tileSize) + 2;
  const endTileY = startTileY + Math.ceil(canvas.height / worldSystem.tileSize) + 2;
  
  // Generate more terrain if needed
  generateTerrain(startTileX, startTileY, endTileX - startTileX, endTileY - startTileY);
  
  // Draw terrain
  for (let x = startTileX; x < endTileX; x++) {
    for (let y = startTileY; y < endTileY; y++) {
      let key = `${x},${y}`;
      let terrain = worldSystem.terrain[key];
      if (terrain) {
        let screenX = x * worldSystem.tileSize - worldSystem.offsetX;
        let screenY = y * worldSystem.tileSize - worldSystem.offsetY;
        
        switch (terrain.type) {
          case 'grass':
            ctx.fillStyle = CONFIG.colors.terrain.grass;
            break;
          case 'dirt':
            ctx.fillStyle = CONFIG.colors.terrain.dirt;
            break;
          case 'stone':
            ctx.fillStyle = CONFIG.colors.terrain.stone;
            break;
        }
        ctx.fillRect(screenX, screenY, worldSystem.tileSize, worldSystem.tileSize);
      }
    }
  }
}

function drawDecorations() {
  for (let decoration of worldSystem.decorations) {
    let screenX = decoration.x - worldSystem.offsetX;
    let screenY = decoration.y - worldSystem.offsetY;
    
    // Only draw if within screen bounds
    if (screenX > -50 && screenX < canvas.width + 50 && 
        screenY > -50 && screenY < canvas.height + 50) {
      
      ctx.save();
      let size = decoration.size * 20;
      
      switch (decoration.type) {
        case 'grass_tuft':
          ctx.fillStyle = '#228B22';
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            let angle = (i / 5) * Math.PI * 2;
            let x = screenX + Math.cos(angle) * size * 0.3;
            let y = screenY + Math.sin(angle) * size * 0.2;
            ctx.lineTo(x, y);
          }
          ctx.fill();
          break;
          
        case 'small_rock':
          ctx.fillStyle = '#A0A0A0';
          ctx.beginPath();
          ctx.arc(screenX, screenY, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#808080';
          ctx.beginPath();
          ctx.arc(screenX - size * 0.1, screenY - size * 0.1, size * 0.2, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'tree':
          // Tree trunk
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(screenX - size * 0.1, screenY - size * 0.3, size * 0.2, size * 0.6);
          // Tree leaves
          ctx.fillStyle = '#228B22';
          ctx.beginPath();
          ctx.arc(screenX, screenY - size * 0.3, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'bush':
          ctx.fillStyle = '#32CD32';
          ctx.beginPath();
          ctx.arc(screenX, screenY, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#228B22';
          ctx.beginPath();
          ctx.arc(screenX - size * 0.1, screenY - size * 0.1, size * 0.2, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      ctx.restore();
    }
  }
}

function drawTank(x, y, color = CONFIG.colors.tank.main, turretColor = CONFIG.colors.tank.turret, isEnemy = false, hp, maxHp, angle = 0, turretAngle = 0) {
  ctx.save();
  
  // Draw health bar if hp and maxHp are provided
  if (typeof hp === 'number' && typeof maxHp === 'number') {
    ctx.strokeStyle = CONFIG.colors.ui.text;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 5, y - 15, 50, 8);
    // Background health bar
    ctx.fillStyle = CONFIG.colors.ui.health.low;
    ctx.fillRect(x + 5, y - 15, 50, 8);
    // Change health bar color based on percentage
    let percent = Math.max(0, Math.min(1, hp / maxHp));
    if (percent > 0.6) ctx.fillStyle = CONFIG.colors.ui.health.high;
    else if (percent > 0.3) ctx.fillStyle = CONFIG.colors.ui.health.medium;
    else ctx.fillStyle = CONFIG.colors.ui.health.low;
    ctx.fillRect(x + 5, y - 15, 50 * percent, 8);
  }
  
  // Tank body
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 20, getScaledSize(60), getScaledSize(30));
  
  // Turret
  ctx.fillStyle = turretColor;
  ctx.fillRect(x + getScaledSize(15), y, getScaledSize(30), getScaledSize(30));
  
  // Cannon
  ctx.fillStyle = '#222';
  ctx.fillRect(x + getScaledSize(27), y - getScaledSize(20), getScaledSize(6), getScaledSize(20));
  
  // Wheels
  ctx.fillStyle = '#222';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + getScaledSize(15) + i * getScaledSize(15), y + getScaledSize(50), getScaledSize(8), 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawSupportTank(x, y, color = CONFIG.colors.supportTank.main, turretColor = CONFIG.colors.supportTank.turret, hp, maxHp) {
  ctx.save();
  
  // Draw health bar if hp and maxHp are provided
  if (typeof hp === 'number' && typeof maxHp === 'number') {
    ctx.strokeStyle = CONFIG.colors.ui.text;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 3, y - 12, 30, 5);
    // Background health bar
    ctx.fillStyle = CONFIG.colors.ui.health.low;
    ctx.fillRect(x + 3, y - 12, 30, 5);
    // Change health bar color based on percentage
    let percent = Math.max(0, Math.min(1, hp / maxHp));
    if (percent > 0.6) ctx.fillStyle = CONFIG.colors.ui.health.high;
    else if (percent > 0.3) ctx.fillStyle = CONFIG.colors.ui.health.medium;
    else ctx.fillStyle = CONFIG.colors.ui.health.low;
    ctx.fillRect(x + 3, y - 12, 30 * percent, 5);
  }
  
  // Tank body (60% size)
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 12, 36, 18);
  
  // Turret (60% size)
  ctx.fillStyle = turretColor;
  ctx.fillRect(x + 9, y, 18, 18);
  
  // Cannon (60% size)
  ctx.fillStyle = '#222';
  ctx.fillRect(x + 16, y - 12, 4, 12);
  
  // Wheels (60% size)
  ctx.fillStyle = '#222';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + 9 + i * 9, y + 30, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawBullet(bullet, color = CONFIG.colors.bullet) {
  // If it's a laser, draw laser beam instead of round bullet
  if (bullet.isLaser) {
    drawLaser(bullet);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    const bulletRadius = getScaledSize(CONFIG.bullets.radius);
    ctx.arc(bullet.x, bullet.y, bulletRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLaser(bullet) {
  ctx.save();
  
  // Calculate starting point from tank
  const startX = tank.x + 30; // Center of tank
  const startY = tank.y + 10; // Front of tank
  
  // Calculate end point of laser beam (shoot straight up)
  const laserLength = canvas.height + 100; // Laser length to end of screen
  const endX = startX;
  const endY = startY - laserLength;
  
  // Draw outer laser beam (dark blue with glow effect)
  ctx.strokeStyle = CONFIG.colors.laser.outer;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.shadowColor = CONFIG.colors.laser.outer;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  
  // Draw middle laser beam (bright blue)
  ctx.strokeStyle = CONFIG.colors.laser.middle;
  ctx.lineWidth = 8;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  
  // Draw laser core (white)
  ctx.strokeStyle = CONFIG.colors.laser.core;
  ctx.lineWidth = 4;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  
  // Draw sparkle effects along the laser beam
  for (let i = 0; i < 8; i++) {
    const sparkY = startY - (i * 80 + Math.random() * 60);
    const sparkX = startX + (Math.random() - 0.5) * 20;
    
    ctx.fillStyle = CONFIG.colors.laser.core;
    ctx.shadowColor = CONFIG.colors.laser.middle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw energy effect at gun tip
  ctx.fillStyle = CONFIG.colors.laser.core;
  ctx.shadowColor = CONFIG.colors.laser.middle;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(startX, startY, 8, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawExplosion(x, y) {
  ctx.save();
  const explosionCenterX = getScaledSize(30);
  const explosionCenterY = getScaledSize(35);
  const outerRadius = getScaledSize(25);
  const innerRadius = getScaledSize(12);
  
  ctx.beginPath();
  ctx.arc(x + explosionCenterX, y + explosionCenterY, outerRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'orange';
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + explosionCenterX, y + explosionCenterY, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Export functions and variables that need to be accessed globally
window.gameModule = {
  startGame,
  resetGame,
  useFuel,
  useElectricWave,
  useMissile,
  useBulletTime,
  keys,
  gameStarted: () => gameStarted
};

function setupEventListeners() {
  // Service worker registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('sw.js').then(function(reg) {
        // Service worker registered
      }, function(err) {
        // Registration failed
      });
    });
  }

  // Keyboard events
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // Start button event
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }

  // Keyboard shortcuts for starting game
  document.addEventListener('keydown', function(e) {
    if (CONFIG.controls.keys.start.includes(e.key) && !gameStarted) {
      if (startBtn && startBtn.style.display !== 'none') {
        startBtn.click();
      }
    }
  });

  // Fallback click handler
  setTimeout(function() {
    if (!gameStarted) {
      document.body.addEventListener('click', function(e) {
        if (!gameStarted && e.target !== startBtn) {
          if (startBtn) {
            startBtn.click();
          }
        }
      });
    }
  }, 3000);
}

function handleKeyDown(e) {
  keys[e.key] = true;
  
  // Fuel key
  if (CONFIG.controls.keys.fuel.includes(e.key)) {
    useFuel();
  }
  
  // Electric wave key
  if (CONFIG.controls.keys.electricWave.includes(e.key)) {
    useElectricWave();
  }
  
  // Missile key
  if (CONFIG.controls.keys.missile.includes(e.key)) {
    useMissile();
  }
  
  // Bullet time key
  if (CONFIG.controls.keys.bulletTime.includes(e.key)) {
    useBulletTime();
  }
  
  // Auto aim toggle
  if (CONFIG.controls.keys.autoAim.includes(e.key)) {
    tank.autoAim = !tank.autoAim;
    showMessage(tank.autoAim ? "🎯 Tự động nhắm: BẬT" : "🎯 Tự động nhắm: TẮT");
  }
  
  // Auto shoot toggle
  if (CONFIG.controls.keys.autoShoot.includes(e.key)) {
    tank.autoShoot = !tank.autoShoot;
    showMessage(tank.autoShoot ? "🔫 Bắn tự động: BẬT" : "🔫 Bắn tự động: TẮT");
  }
}

function handleKeyUp(e) {
  keys[e.key] = false;
}

function startGame(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  const startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.style.display = 'none';
  
  // Hide instructions
  const instructions = document.getElementById('instructions');
  if (instructions) {
    instructions.style.display = 'none';
  }
  
  canvas.style.display = 'block';
  
  // Add game-started class to game container
  const gameContainer = document.querySelector('.game-container');
  if (gameContainer) {
    gameContainer.classList.add('game-started');
  }
  
  // Show controls safely
  if (joystickContainer) {
    joystickContainer.style.display = 'block';
  }
  if (shootControls) {
    shootControls.style.display = 'flex';
  }
  
  gameStarted = true;
  
  // Ensure canvas fullscreen
  resizeCanvas();
  
  // Initialize world system
  initWorldSystem();
  
  // Setup controls
  setupControls();
  
  // Initialize button states
  updateFuelButton();
  updateElectricWaveButton();
  updateMissileButton();
  updateBulletTimeButton();
  
  // Start background music
  bgm.currentTime = 0;
  bgm.play().then(() => {
    // success
  }).catch(() => {
    alert('Click anywhere to enable game music!');
    document.body.addEventListener('click', function tryPlay() {
      bgm.play();
      document.body.removeEventListener('click', tryPlay);
    });
  });
  
  gameLoop();
}

function initWorldSystem() {
  // Set initial offset to center tank on screen
  worldSystem.offsetX = tank.worldX - (canvas.width / 2 - 30);
  worldSystem.offsetY = tank.worldY - (canvas.height / 2 - 25);
  
  // Update tank position on screen
  tank.x = tank.worldX - worldSystem.offsetX;
  tank.y = tank.worldY - worldSystem.offsetY;
}

function setupControls() {
  // Initialize joystick
  const baseRect = joystickBase.getBoundingClientRect();
  joystick.baseX = baseRect.left + baseRect.width / 2;
  joystick.baseY = baseRect.top + baseRect.height / 2;
  joystick.limitRadius = baseRect.width / 2 - joystickHandle.offsetWidth / 2;
  
  // Set handle to center
  joystick.handleX = joystick.baseX;
  joystick.handleY = joystick.baseY;
  updateJoystickPosition();
  
  // Mouse events for joystick
  joystickHandle.addEventListener('mousedown', startJoystick);
  document.addEventListener('mousemove', moveJoystick);
  document.addEventListener('mouseup', endJoystick);
  
  // Touch events for joystick
  joystickHandle.addEventListener('touchstart', startJoystick);
  document.addEventListener('touchmove', moveJoystick);
  document.addEventListener('touchend', endJoystick);
  
  // Shoot button events
  shootButton.addEventListener('click', shoot);
  shootButton.addEventListener('touchstart', (e) => { e.preventDefault(); shoot(); });
  
  // Fuel button
  fuelBtn.addEventListener('click', useFuel);
  fuelBtn.addEventListener('touchstart', (e) => { e.preventDefault(); useFuel(); });
  
  // Electric wave button
  electricWaveBtn.addEventListener('click', useElectricWave);
  electricWaveBtn.addEventListener('touchstart', (e) => { e.preventDefault(); useElectricWave(); });
  
  // Missile button
  missileBtn.addEventListener('click', useMissile);
  missileBtn.addEventListener('touchstart', (e) => { e.preventDefault(); useMissile(); });
  
  // Bullet time button
  bulletTimeBtn.addEventListener('click', useBulletTime);
  bulletTimeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); useBulletTime(); });
}

function startJoystick(e) {
  e.preventDefault();
  joystick.active = true;
  
  // Recalculate base position in case of screen resize
  const baseRect = joystickBase.getBoundingClientRect();
  joystick.baseX = baseRect.left + baseRect.width / 2;
  joystick.baseY = baseRect.top + baseRect.height / 2;
  joystick.limitRadius = baseRect.width / 2 - joystickHandle.offsetWidth / 2;
}

function moveJoystick(e) {
  if (!joystick.active) return;
  e.preventDefault();
  
  let clientX, clientY;
  
  if (e.type === 'touchmove') {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  
  // Calculate distance from center
  let dx = clientX - joystick.baseX;
  let dy = clientY - joystick.baseY;
  let distance = Math.sqrt(dx * dx + dy * dy);
  
  // Limit to circle
  if (distance > joystick.limitRadius) {
    dx = dx * joystick.limitRadius / distance;
    dy = dy * joystick.limitRadius / distance;
  }
  
  // Update handle position
  joystick.handleX = joystick.baseX + dx;
  joystick.handleY = joystick.baseY + dy;
  
  // Update joystick values for game controls
  joystick.dx = dx / joystick.limitRadius; // -1 to 1
  joystick.dy = dy / joystick.limitRadius; // -1 to 1
  
  // Update visual position
  updateJoystickPosition();
  
  // Update key states based on joystick position
  updateKeyStates();
}

function endJoystick(e) {
  if (!joystick.active) return;
  e.preventDefault();
  joystick.active = false;
  
  // Reset joystick to center
  joystick.handleX = joystick.baseX;
  joystick.handleY = joystick.baseY;
  joystick.dx = 0;
  joystick.dy = 0;
  
  // Update visual position
  updateJoystickPosition();
  
  // Reset all direction keys
  keys['ArrowUp'] = false;
  keys['ArrowDown'] = false;
  keys['ArrowLeft'] = false;
  keys['ArrowRight'] = false;
}

function updateJoystickPosition() {
  joystickHandle.style.transform = `translate(${joystick.handleX - joystick.baseX}px, ${joystick.handleY - joystick.baseY}px)`;
}

function updateKeyStates() {
  // Convert joystick position to key presses
  const deadzone = CONFIG.controls.joystickDeadzone;
  
  keys['ArrowUp'] = joystick.dy < -deadzone;
  keys['ArrowDown'] = joystick.dy > deadzone;
  keys['ArrowLeft'] = joystick.dx < -deadzone;
  keys['ArrowRight'] = joystick.dx > deadzone;
}

// Game functions
function shoot() {
  if (tank.shootCooldown <= 0) {
    bullets.push({
      x: tank.x + 30,
      y: tank.y,
      worldX: tank.worldX + 30,
      worldY: tank.worldY,
      dx: 0,
      dy: -CONFIG.bullets.speed
    });
    tank.shootCooldown = tank.shootInterval;
  }
}

function useFuel() {
  if (fuelSystem.isReady) {
    let fuelUsed = false;
    
    // Priority: main tank first
    if (tank.hp < tank.maxHp) {
      tank.hp = Math.min(tank.hp + CONFIG.fuel.healAmount, tank.maxHp);
      showFuelMessage("Bơm máu xe tăng chính +2 ❤️");
      fuelUsed = true;
    }
    // If main tank is full, heal support tank
    else if (supportTank.hp > 0 && supportTank.hp < supportTank.maxHp) {
      supportTank.hp = Math.min(supportTank.hp + CONFIG.fuel.healAmount, supportTank.maxHp);
      showFuelMessage("Bơm máu xe tăng nhỏ +2 💙");
      fuelUsed = true;
    }
    
    // If fuel was used, start cooldown
    if (fuelUsed) {
      fuelSystem.isReady = false;
      fuelSystem.currentCooldown = fuelSystem.cooldownTime;
    }
    
    updateFuelButton();
  }
}

function useElectricWave() {
  console.log('Electric wave clicked! Ready:', electricWaveSystem.isReady);
  if (!electricWaveSystem.isReady) return;
  
  // Create new electric wave
  electricWaveSystem.waves.push({
    x: tank.x + 30,
    y: tank.y + 35,
    worldX: tank.worldX + 30,
    worldY: tank.worldY + 35,
    radius: 0,
    maxRadius: electricWaveSystem.waveRadius,
    speed: electricWaveSystem.waveSpeed,
    damage: electricWaveSystem.waveDamage,
    opacity: 1,
    hitEnemies: []
  });
  
  console.log('Electric wave created!');
  
  // Start cooldown
  electricWaveSystem.isReady = false;
  electricWaveSystem.currentCooldown = electricWaveSystem.cooldownTime;
  updateElectricWaveButton();
}

function useMissile() {
  if (!missileSystem.isReady) return;
  
  // Create new missile
  missileSystem.missiles.push({
    x: tank.x + 30,
    y: tank.y + 35,
    worldX: tank.worldX + 30,
    worldY: tank.worldY + 35,
    vx: 0,
    vy: -missileSystem.missileSpeed,
    target: null,
    hasExploded: false,
    trailPoints: []
  });
  
  // Start cooldown
  missileSystem.isReady = false;
  missileSystem.currentCooldown = missileSystem.cooldownTime;
  updateMissileButton();
}

function useBulletTime() {
  if (bulletTimeSystem.isReady && !bulletTimeSystem.isActive) {
    bulletTimeSystem.isActive = true;
    bulletTimeSystem.isReady = false;
    bulletTimeSystem.currentDuration = bulletTimeSystem.duration;
    
    // Save original shoot cooldown and set to 0 (continuous shooting)
    bulletTimeSystem.originalShootCooldown = tank.shootInterval;
    
    // Update button interface
    updateBulletTimeButton();
    
    // Show message
    showBulletTimeMessage("🔴 Bắn laser kích hoạt!");
  }
}

// Message functions
function showFuelMessage(text) {
  fuelMessage.text = text;
  fuelMessage.time = 60; // Display for 60 frames (1 second)
}

function showBulletTimeMessage(text) {
  bulletTimeMessage.text = text;
  bulletTimeMessage.time = 120; // Display for 120 frames (2 seconds)
}

function showMessage(text) {
  generalMessage.text = text;
  generalMessage.time = 120; // Display for 120 frames (2 seconds)
}

// Button update functions
function updateFuelButton() {
  // Check if can refuel main tank or support tank
  const canRefuelMainTank = tank.hp < tank.maxHp;
  const canRefuelSupportTank = supportTank.hp > 0 && supportTank.hp < supportTank.maxHp;
  
  if (fuelSystem.isReady && (canRefuelMainTank || canRefuelSupportTank)) {
    fuelBtn.classList.remove('disabled');
    fuelBtn.style.opacity = '1';
  } else {
    fuelBtn.classList.add('disabled');
    fuelBtn.style.opacity = '0.5';
  }
}

function updateElectricWaveButton() {
  if (electricWaveSystem.isReady) {
    electricWaveBtn.classList.remove('disabled');
    electricWaveBtn.classList.remove('cooldown');
    electricWaveBtn.style.opacity = '1';
  } else {
    electricWaveBtn.classList.add('disabled');
    electricWaveBtn.classList.add('cooldown');
    electricWaveBtn.style.opacity = '0.5';
  }
}

function updateMissileButton() {
  if (missileSystem.isReady) {
    missileBtn.classList.remove('disabled');
    missileBtn.classList.remove('cooldown');
    missileBtn.style.opacity = '1';
  } else {
    missileBtn.classList.add('disabled');
    missileBtn.classList.add('cooldown');
    missileBtn.style.opacity = '0.5';
  }
}

function updateBulletTimeButton() {
  if (bulletTimeSystem.isActive) {
    bulletTimeBtn.classList.add('active');
    bulletTimeBtn.classList.remove('disabled');
    bulletTimeBtn.style.opacity = '1';
  } else if (bulletTimeSystem.isReady) {
    bulletTimeBtn.classList.remove('active');
    bulletTimeBtn.classList.remove('disabled');
    bulletTimeBtn.style.opacity = '1';
  } else {
    bulletTimeBtn.classList.remove('active');
    bulletTimeBtn.classList.add('disabled');
    bulletTimeBtn.style.opacity = '0.5';
  }
}

function resetGame() {
  // Reset game variables
  tank.hp = tank.maxHp;
  tank.x = canvas.width/2 - 30;
  tank.y = canvas.height - 120;
  if (typeof tank.worldX !== 'undefined') tank.worldX = 0;
  if (typeof tank.worldY !== 'undefined') tank.worldY = 0;
  bullets = [];
  enemyBullets = [];
  enemies = [];
  window.explosions = [];
  window.tankExplosions = [];
  window.tankHitExplosions = [];
  window.electricExplosions = [];
  window.missileExplosions = [];
  frameCount = 0;
  enemyIdCounter = 0;
  gameStarted = true;
  
  // Reset fuel system
  fuelSystem.isReady = true;
  fuelSystem.currentCooldown = 0;
  updateFuelButton();
  
  // Reset electric wave system
  electricWaveSystem.isReady = true;
  electricWaveSystem.currentCooldown = 0;
  electricWaveSystem.waves = [];
  updateElectricWaveButton();
  
  // Reset missile system
  missileSystem.isReady = true;
  missileSystem.currentCooldown = 0;
  missileSystem.missiles = [];
  updateMissileButton();
  
  // Reset bullet time system
  bulletTimeSystem.isActive = false;
  bulletTimeSystem.isReady = true;
  bulletTimeSystem.currentDuration = 0;
  bulletTimeSystem.currentCooldown = 0;
  updateBulletTimeButton();
  
  // Reset victory system
  victorySystem.enemiesKilled = 0;
  victorySystem.gameWon = false;
  
  // Hide replay button if exists
  let btn = document.getElementById('replayBtn');
  if (btn) btn.style.display = 'none';
  
  // Show controls again if available
  if (joystickContainer) joystickContainer.style.display = 'block';
  if (shootControls) shootControls.style.display = 'block';
  
  // Restart background music
  bgm.currentTime = 0;
  bgm.play();
  
  // Restart game loop
  requestAnimationFrame(gameLoop);
}

function spawnEnemies() {
  // Spawn enemies based on frame count
  if (frameCount % CONFIG.enemies.spawnInterval === 0 && frameCount > 0) {
    // Random spawn position on edges
    let x, y;
    let edge = Math.floor(Math.random() * 4);
    
    switch (edge) {
      case 0: // Top
        x = Math.random() * canvas.width;
        y = -60;
        break;
      case 1: // Right
        x = canvas.width + 60;
        y = Math.random() * canvas.height;
        break;
      case 2: // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 60;
        break;
      case 3: // Left
        x = -60;
        y = Math.random() * canvas.height;
        break;
    }
    
    enemies.push({
      id: enemyIdCounter++,
      x: x,
      y: y,
      hp: CONFIG.enemies.hp,
      maxHp: CONFIG.enemies.maxHp,
      speed: CONFIG.enemies.speed
    });
    
    console.log(`Enemy spawned! Total enemies: ${enemies.length}`);
  }
  
  frameCount++;
}

function updateElectricWaves() {
  // Update electric waves
  for (let i = electricWaveSystem.waves.length - 1; i >= 0; i--) {
    let wave = electricWaveSystem.waves[i];
    wave.radius += wave.speed;
    
    // Check collision with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      
      // Skip if already hit by this wave
      if (wave.hitEnemies.includes(enemy.id)) continue;
      
      let dx = enemy.x + 30 - wave.x;
      let dy = enemy.y + 35 - wave.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= wave.radius && distance >= wave.radius - wave.speed) {
        // Hit enemy
        enemy.hp -= wave.damage;
        wave.hitEnemies.push(enemy.id);
        
        if (enemy.hp <= 0) {
          enemies.splice(j, 1);
          victorySystem.enemiesKilled++;
        }
      }
    }
    
    // Draw wave
    ctx.save();
    ctx.strokeStyle = CONFIG.colors.electricWave;
    ctx.lineWidth = 3;
    ctx.globalAlpha = wave.opacity;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
    // Fade out and remove when too big
    wave.opacity -= 0.02;
    if (wave.radius > wave.maxRadius || wave.opacity <= 0) {
      electricWaveSystem.waves.splice(i, 1);
    }
  }
}

function updateMissiles() {
  // Update missiles
  for (let i = missileSystem.missiles.length - 1; i >= 0; i--) {
    let missile = missileSystem.missiles[i];
    
    // Find nearest enemy for homing
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    for (let enemy of enemies) {
      let dx = enemy.x + 30 - missile.x;
      let dy = enemy.y + 35 - missile.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < nearestDistance && distance < missileSystem.homingRange) {
        nearestEnemy = enemy;
        nearestDistance = distance;
      }
    }
    
    // Adjust velocity towards target
    if (nearestEnemy) {
      let dx = nearestEnemy.x + 30 - missile.x;
      let dy = nearestEnemy.y + 35 - missile.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        missile.vx += (dx / distance) * 0.3;
        missile.vy += (dy / distance) * 0.3;
        
        // Limit speed
        let speed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
        if (speed > missileSystem.missileSpeed) {
          missile.vx = (missile.vx / speed) * missileSystem.missileSpeed;
          missile.vy = (missile.vy / speed) * missileSystem.missileSpeed;
        }
      }
    }
    
    // Update position
    missile.x += missile.vx;
    missile.y += missile.vy;
    
    // Add trail point
    missile.trailPoints.push({ x: missile.x, y: missile.y });
    if (missile.trailPoints.length > 10) {
      missile.trailPoints.shift();
    }
    
    // Check collision with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      let dx = missile.x - (enemy.x + 30);
      let dy = missile.y - (enemy.y + 35);
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 30) {
        // Explode missile
        explodeMissile(missile, i);
        break;
      }
    }
    
    // Remove if off screen
    if (missile.x < -100 || missile.x > canvas.width + 100 || 
        missile.y < -100 || missile.y > canvas.height + 100) {
      missileSystem.missiles.splice(i, 1);
      continue;
    }
    
    // Draw missile trail
    if (missile.trailPoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = CONFIG.colors.missile;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(missile.trailPoints[0].x, missile.trailPoints[0].y);
      for (let point of missile.trailPoints) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw missile
    ctx.save();
    ctx.fillStyle = CONFIG.colors.missile;
    ctx.beginPath();
    ctx.arc(missile.x, missile.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function explodeMissile(missile, index) {
  // Create explosion effect and damage enemies in radius
  for (let j = enemies.length - 1; j >= 0; j--) {
    let enemy = enemies[j];
    let dx = missile.x - (enemy.x + 30);
    let dy = missile.y - (enemy.y + 35);
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < missileSystem.explosionRadius) {
      enemy.hp -= missileSystem.missileDamage;
      if (enemy.hp <= 0) {
        enemies.splice(j, 1);
        victorySystem.enemiesKilled++;
      }
    }
  }
  
  // Draw explosion effect
  ctx.save();
  ctx.fillStyle = CONFIG.colors.missile;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(missile.x, missile.y, missileSystem.explosionRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Remove missile
  missileSystem.missiles.splice(index, 1);
}

function updateBulletTimeSystem() {
  if (bulletTimeSystem.isActive) {
    // Enable laser shooting
    if (keys[' '] || keys['Space']) {
      // Create laser bullet
      bullets.push({
        x: tank.x + 30,
        y: tank.y,
        worldX: tank.worldX + 30,
        worldY: tank.worldY,
        dx: 0,
        dy: -CONFIG.bullets.speed * 2, // Faster bullets during bullet time
        isLaser: true
      });
    }
  }
}

function gameLoop() {
  if (gameStarted) {
    optimizePerformance();
    update();
    requestAnimationFrame(gameLoop);
  }
}

// Main game update function - simplified for now
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw terrain and decorations
  drawTerrain();
  drawDecorations();
  
  // Update tank movement
  if (keys['ArrowUp']) tank.y -= tank.speed;
  if (keys['ArrowDown']) tank.y += tank.speed;
  if (keys['ArrowLeft']) tank.x -= tank.speed;
  if (keys['ArrowRight']) tank.x += tank.speed;
  
  // Update shooting
  if (keys[' '] || keys['Space']) {
    shoot();
  }
  
  // Update cooldowns
  if (tank.shootCooldown > 0) tank.shootCooldown--;
  
  // Spawn enemies
  spawnEnemies();
  
  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.y += bullet.dy;
    bullet.x += bullet.dx;
    
    // Remove bullets that are off screen
    if (bullet.y < -10 || bullet.y > canvas.height + 10 || 
        bullet.x < -10 || bullet.x > canvas.width + 10) {
      bullets.splice(i, 1);
      continue;
    }
    
    // Check bullet-enemy collision
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      let dx = bullet.x - (enemy.x + 30);
      let dy = bullet.y - (enemy.y + 35);
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 30) {
        // Hit enemy
        enemy.hp--;
        bullets.splice(i, 1);
        
        if (enemy.hp <= 0) {
          // Enemy destroyed
          enemies.splice(j, 1);
          victorySystem.enemiesKilled++;
        }
        break;
      }
    }
    
    if (i >= 0 && bullets[i]) {
      drawBullet(bullets[i]);
    }
  }
  
  // Update and draw enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    
    // Move enemy towards tank
    let dx = tank.x - enemy.x;
    let dy = tank.y - enemy.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      enemy.x += (dx / distance) * CONFIG.enemies.speed;
      enemy.y += (dy / distance) * CONFIG.enemies.speed;
    }
    
    // Check tank-enemy collision
    if (distance < 50) {
      tank.hp--;
      enemies.splice(i, 1);
      if (tank.hp <= 0) {
        // Game over
        gameStarted = false;
        alert('Game Over! Enemies killed: ' + victorySystem.enemiesKilled);
        location.reload();
      }
      continue;
    }
    
    // Draw enemy
    drawTank(enemy.x, enemy.y, CONFIG.colors.enemy.main, CONFIG.colors.enemy.turret, true, enemy.hp, enemy.maxHp);
  }
  
  // Draw tank
  if (tank.hp > 0) {
    drawTank(tank.x, tank.y, CONFIG.colors.tank.main, CONFIG.colors.tank.turret, false, tank.hp, tank.maxHp, tank.angle, tank.turretAngle);
  }
  
  // Draw support tank
  if (supportTank.hp > 0) {
    drawSupportTank(supportTank.x, supportTank.y, CONFIG.colors.supportTank.main, CONFIG.colors.supportTank.turret, supportTank.hp, supportTank.maxHp);
  }
  
  // Update and draw electric waves
  updateElectricWaves();
  
  // Update and draw missiles
  updateMissiles();
  
  // Update bullet time system
  updateBulletTimeSystem();
  
  // Display UI
  ctx.save();
  ctx.font = getScaledFont(CONFIG.ui.baseFontSize, 'Arial', 'bold');
  ctx.fillStyle = CONFIG.colors.ui.text;
  ctx.shadowColor = CONFIG.colors.ui.shadow;
  ctx.shadowBlur = getScaledSize(3);
  const uiMargin = getScaledSize(CONFIG.ui.margin);
  const uiLineHeight = getScaledSize(CONFIG.ui.lineHeight);
  
  ctx.fillText(`HP: ${tank.hp}/${tank.maxHp}`, uiMargin, uiLineHeight);
  ctx.fillText(`Tiêu diệt: ${victorySystem.enemiesKilled}/${victorySystem.targetKills}`, uiMargin, uiLineHeight * 2);
  
  // Display fuel cooldown
  if (!fuelSystem.isReady) {
    let cooldownSeconds = Math.ceil(fuelSystem.currentCooldown / 1000);
    ctx.fillStyle = CONFIG.colors.tank.main;
    ctx.fillText(`⛽ Nhiên liệu: ${cooldownSeconds}s`, uiMargin, uiLineHeight * 3);
  } else {
    ctx.fillStyle = CONFIG.colors.tank.main;
    ctx.fillText(`⛽ Nhiên liệu: Sẵn sàng`, uiMargin, uiLineHeight * 3);
  }
  
  // Display messages
  if (fuelMessage.time > 0) {
    ctx.fillStyle = CONFIG.colors.tank.main;
    ctx.fillText(fuelMessage.text, uiMargin, uiLineHeight * 4);
    fuelMessage.time--;
  }
  
  if (bulletTimeMessage.time > 0) {
    ctx.fillStyle = CONFIG.colors.supportTank.main;
    ctx.fillText(bulletTimeMessage.text, uiMargin, uiLineHeight * 8);
    bulletTimeMessage.time--;
  }
  
  if (generalMessage.time > 0) {
    ctx.fillStyle = CONFIG.colors.bullet;
    ctx.fillText(generalMessage.text, uiMargin, uiLineHeight * 9);
    generalMessage.time--;
  }
  
  // Display auto aim and auto shoot status
  ctx.fillStyle = tank.autoAim ? CONFIG.colors.ui.health.high : CONFIG.colors.ui.health.low;
  ctx.fillText(`🎯 Tự động nhắm: ${tank.autoAim ? 'BẬT' : 'TẮT'} (A)`, uiMargin, uiLineHeight * 10);
  
  ctx.fillStyle = tank.autoShoot ? CONFIG.colors.ui.health.high : CONFIG.colors.ui.health.low;
  ctx.fillText(`🔫 Bắn tự động: ${tank.autoShoot ? 'BẬT' : 'TẮT'} (Z)`, uiMargin, uiLineHeight * 11);
  
  ctx.restore();
  
  // Update cooldowns
  if (!fuelSystem.isReady) {
    fuelSystem.currentCooldown -= 16.67; // Assuming 60 FPS
    if (fuelSystem.currentCooldown <= 0) {
      fuelSystem.isReady = true;
      updateFuelButton();
    }
  }
  
  if (!electricWaveSystem.isReady) {
    electricWaveSystem.currentCooldown -= 16.67;
    if (electricWaveSystem.currentCooldown <= 0) {
      electricWaveSystem.isReady = true;
      updateElectricWaveButton();
    }
  }
  
  if (!missileSystem.isReady) {
    missileSystem.currentCooldown -= 16.67;
    if (missileSystem.currentCooldown <= 0) {
      missileSystem.isReady = true;
      updateMissileButton();
    }
  }
  
  if (bulletTimeSystem.isActive) {
    bulletTimeSystem.currentDuration -= 16.67;
    if (bulletTimeSystem.currentDuration <= 0) {
      bulletTimeSystem.isActive = false;
      bulletTimeSystem.currentCooldown = bulletTimeSystem.cooldownTime;
      updateBulletTimeButton();
    }
  } else if (!bulletTimeSystem.isReady) {
    bulletTimeSystem.currentCooldown -= 16.67;
    if (bulletTimeSystem.currentCooldown <= 0) {
      bulletTimeSystem.isReady = true;
      updateBulletTimeButton();
    }
  }
}