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
  const startBtn = document.getElementById('startBtn');
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
  
  // Show controls safely
  if (joystickContainer) {
    joystickContainer.style.display = 'block';
  }
  if (shootControls) {
    shootControls.style.display = 'block';
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

// Game functions (shoot, useFuel, etc.) will be implemented in the next part
function shoot() {
  if (tank.shootCooldown <= 0) {
    // Shooting logic here
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

function gameLoop() {
  if (gameStarted) {
    optimizePerformance();
    update();
    requestAnimationFrame(gameLoop);
  }
}

// Placeholder for update function - this will contain the main game logic
function update() {
  // Main game update logic will be implemented here
  // This is a simplified version for now
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw game elements
  // ... (game rendering logic)
}