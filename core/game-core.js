import { CONFIG } from '../config.js';
import { CameraSystem } from './camera-system.js';
import { WorldSystem } from './world-system.js';
import { InputManager } from '../input/input-manager.js';
import { JoystickController } from '../input/joystick-controller.js';
import { Tank } from '../entities/tank.js';
import { Enemies } from '../entities/enemies.js';
import { Bullets } from '../entities/bullets.js';
import { Weapons } from '../entities/weapons.js';
import { Renderer } from '../rendering/renderer.js';
import { UIRenderer } from '../rendering/ui-renderer.js';
import { EffectsRenderer } from '../rendering/effects-renderer.js';
import { Performance } from '../utils/performance.js';

export class GameCore {
  constructor() {
    // Game state variables
    this.gameStarted = false;
    this.scaleFactor = 1;
    this.frameCount = 0;
    this.enemyIdCounter = 0;

    // DOM elements
    this.canvas = null;
    this.ctx = null;
    this.bgm = null;

    // Game systems
    this.cameraSystem = null;
    this.worldSystem = null;
    this.inputManager = null;
    this.joystickController = null;
    this.tank = null;
    this.enemies = null;
    this.bullets = null;
    this.weapons = null;
    this.renderer = null;
    this.uiRenderer = null;
    this.effectsRenderer = null;
    this.performance = null;

    // Victory system
    this.victorySystem = {
      enemiesKilled: 0,
      targetKills: CONFIG.victory.targetKills,
      gameWon: false
    };

    // Game state management
    this.gameState = {
      isGameOver: false,
      isVictory: false,
      showGameOverScreen: false
    };

    // Messages
    this.fuelMessage = { text: '', time: 0 };
    this.bulletTimeMessage = { text: '', time: 0 };
    this.generalMessage = { text: '', time: 0 };
  }

  // Initialize game when DOM is loaded
  init() {
    this.initializeDOM();
    this.initializeGame();
    this.setupEventListeners();
  }

  initializeDOM() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.bgm = document.getElementById('bgm');

    // Check for critical elements
    const startBtn = document.getElementById('startBtn');
    if (!startBtn) {
      console.error('Start button not found!');
    }
    if (!this.canvas) {
      console.error('Canvas not found!');
    }
  }

  initializeGame() {
    // Initialize canvas
    this.resizeCanvas();
    
    // Initialize game systems
    this.initializeGameSystems();
    
    // Setup resize handler
    window.addEventListener('resize', () => this.handleResize());
  }

  initializeGameSystems() {
    // Initialize core systems
    this.cameraSystem = new CameraSystem();
    this.worldSystem = new WorldSystem(this.scaleFactor);
    this.performance = new Performance();
    
    // Initialize input systems
    this.inputManager = new InputManager();
    this.joystickController = new JoystickController();
    
    // Initialize game entities
    this.tank = new Tank(this.scaleFactor);
    this.enemies = new Enemies();
    this.bullets = new Bullets();
    this.weapons = new Weapons(this.scaleFactor);
    
    // Initialize rendering systems
    this.renderer = new Renderer(this.ctx, this.scaleFactor);
    this.uiRenderer = new UIRenderer(this.ctx, this.scaleFactor);
    this.effectsRenderer = new EffectsRenderer(this.ctx, this.scaleFactor);

    // Position tank correctly
    this.positionTank();
  }

  positionTank() {
    // Position tank in world coordinates (start at world center)
    this.tank.setWorldPosition(0, 0);
    
    // Initialize camera to follow tank
    this.cameraSystem.setTarget(this.tank.worldX, this.tank.worldY);
    this.cameraSystem.setPosition(this.tank.worldX, this.tank.worldY);
    
    // Update tank screen position
    this.updateTankScreenPosition();
  }

  updateTankScreenPosition() {
    // Convert world position to screen position based on camera
    const screenPos = this.cameraSystem.worldToScreen(this.tank.worldX, this.tank.worldY);
    this.tank.setScreenPosition(screenPos.x, screenPos.y);
  }

  resizeCanvas() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    
    // Calculate scale factor based on screen size
    const scaleX = displayWidth / CONFIG.canvas.baseWidth;
    const scaleY = displayHeight / CONFIG.canvas.baseHeight;
    this.scaleFactor = Math.min(scaleX, scaleY, CONFIG.canvas.maxScaleFactor);
    
    // Set canvas size to actual pixels
    this.canvas.width = displayWidth * devicePixelRatio;
    this.canvas.height = displayHeight * devicePixelRatio;
    
    // Set display size
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';
    
    // Scale context to match device pixel ratio
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Update systems with new scale factor
    this.updateScaleFactor();
  }

  updateScaleFactor() {
    if (this.worldSystem) this.worldSystem.updateScale(this.scaleFactor);
    if (this.tank) this.tank.updateScale(this.scaleFactor);
    if (this.weapons) this.weapons.updateScale(this.scaleFactor);
    if (this.renderer) this.renderer.updateScale(this.scaleFactor);
    if (this.uiRenderer) this.uiRenderer.updateScale(this.scaleFactor);
    if (this.effectsRenderer) this.effectsRenderer.updateScale(this.scaleFactor);
    if (this.joystickController) this.joystickController.updateControlsScale(this.scaleFactor);
  }

  handleResize() {
    this.resizeCanvas();
    if (this.gameStarted && this.tank) {
      // Re-center tank on screen resize
      this.positionTank();
    }
  }

  setupEventListeners() {
    // Service worker registration - TEMPORARILY DISABLED
    // if ('serviceWorker' in navigator) {
    //   window.addEventListener('load', function() {
    //     navigator.serviceWorker.register('sw.js').then(function(reg) {
    //       // Service worker registered
    //     }, function(err) {
    //       // Registration failed
    //     });
    //   });
    // }

    // Setup input event listeners
    this.inputManager.setupEventListeners();
    
    // Start button event
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', (e) => this.startGame(e));
    }

    // Keyboard shortcuts for starting game
    document.addEventListener('keydown', (e) => {
      if (CONFIG.controls.keys.start.includes(e.key) && !this.gameStarted) {
        if (startBtn && startBtn.style.display !== 'none') {
          startBtn.click();
        }
      }
    });

    // Touch/click handler for game over screen restart
    this.canvas.addEventListener('click', (e) => {
      if (this.gameState.isGameOver) {
        this.restartGame();
      }
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (this.gameState.isGameOver) {
        e.preventDefault();
        this.restartGame();
      }
    });

    // Fallback click handler
    setTimeout(() => {
      if (!this.gameStarted) {
        document.body.addEventListener('click', (e) => {
          if (!this.gameStarted && e.target !== startBtn) {
            if (startBtn) {
              startBtn.click();
            }
          }
        });
      }
    }, 3000);
  }

  startGame(e) {
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
    
    this.canvas.style.display = 'block';
    
    // Add game-started class to game container
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
      gameContainer.classList.add('game-started');
    }
    
    // Show controls
    this.joystickController.showControls();
    
    this.gameStarted = true;
    
    // Ensure canvas fullscreen
    this.resizeCanvas();
    
    // Position tank correctly after canvas resize
    this.positionTank();
    
    // Initialize world system
    this.worldSystem.init(this.tank.worldX, this.tank.worldY, this.canvas.width, this.canvas.height);
    
    // Setup controls
    this.joystickController.setupControls();
    
    // Initialize button states
    this.weapons.updateAllButtons();
    
    // Start background music
    this.bgm.currentTime = 0;
    this.bgm.play().then(() => {
      // success
    }).catch(() => {
      console.log('Music autoplay blocked - will play on user interaction');
      document.body.addEventListener('click', function tryPlay() {
        this.bgm.play();
        document.body.removeEventListener('click', tryPlay);
      });
    });
    
    this.gameLoop();
  }

  gameLoop() {
    if (this.gameStarted) {
      this.performance.optimize(this.scaleFactor, () => this.updateScaleFactor());
      this.update();
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Check for game over conditions
    if (!this.gameState.isGameOver) {
      // Check if tank is destroyed
      if (this.tank.hp <= 0) {
        this.handleGameOver(false);
        return;
      }
      
      // Check if victory condition is met
      if (this.victorySystem.enemiesKilled >= this.victorySystem.targetKills) {
        this.handleGameOver(true);
        return;
      }
      
      // Update camera to follow tank smoothly
      this.cameraSystem.update(this.tank.worldX, this.tank.worldY);
      this.updateTankScreenPosition();
      
      // Update tank movement
      this.tank.update(this.inputManager.keys, this.cameraSystem);
      
      // Update enemies
      this.enemies.update(this.tank, this.cameraSystem, this.frameCount, this.enemyIdCounter);
      this.enemyIdCounter = this.enemies.getEnemyIdCounter();
      
      // Update bullets
      this.bullets.update(this.enemies.getEnemies(), this.cameraSystem, this.victorySystem);
      
      // Update weapons
      this.weapons.update(this.tank, this.enemies.getEnemies(), this.victorySystem);
      
      // Render everything
      this.renderer.render(
        this.worldSystem,
        this.cameraSystem,
        this.tank,
        this.enemies.getEnemies(),
        this.bullets,
        this.weapons
      );
      
      // Render UI
      this.uiRenderer.render(
        this.tank,
        this.victorySystem,
        this.weapons,
        this.fuelMessage,
        this.bulletTimeMessage,
        this.generalMessage
      );
      
      // Render effects
      this.effectsRenderer.render(this.weapons.getEffects());
      
      this.frameCount++;
    } else {
      // Game is over, show game over screen
      this.uiRenderer.renderGameOverScreen(this.gameState.isVictory, this.victorySystem);
      
      // Check for restart input
      if (this.inputManager.keys['r'] || this.inputManager.keys['R'] || 
          this.inputManager.keys['Enter'] || this.inputManager.keys[' ']) {
        this.restartGame();
      }
    }
  }

  handleGameOver(isVictory) {
    this.gameState.isGameOver = true;
    this.gameState.isVictory = isVictory;
    this.gameState.showGameOverScreen = true;
    
    // Stop background music
    this.bgm.pause();
    
    // Hide controls
    this.joystickController.hideControls();
    
    console.log(isVictory ? 'Victory!' : 'Game Over!');
  }

  restartGame() {
    // Reset game state
    this.gameState.isGameOver = false;
    this.gameState.isVictory = false;
    this.gameState.showGameOverScreen = false;
    
    // Reset game variables
    this.tank.reset();
    this.enemies.reset();
    this.bullets.reset();
    this.weapons.reset();
    
    // Re-center tank properly
    this.positionTank();
    
    this.frameCount = 0;
    this.enemyIdCounter = 0;
    this.gameStarted = true;
    
    // Reset victory system
    this.victorySystem.enemiesKilled = 0;
    this.victorySystem.gameWon = false;
    
    // Show controls again
    this.joystickController.showControls();
    
    // Restart background music
    this.bgm.currentTime = 0;
    this.bgm.play();
  }

  resetGame() {
    // Reset game variables
    this.tank.reset();
    this.enemies.reset();
    this.bullets.reset();
    this.weapons.reset();
    
    // Re-center tank properly
    this.positionTank();
    
    this.frameCount = 0;
    this.enemyIdCounter = 0;
    this.gameStarted = true;
    
    // Reset victory system
    this.victorySystem.enemiesKilled = 0;
    this.victorySystem.gameWon = false;
    
    // Hide replay button if exists
    let btn = document.getElementById('replayBtn');
    if (btn) btn.style.display = 'none';
    
    // Show controls again
    this.joystickController.showControls();
    
    // Restart background music
    this.bgm.currentTime = 0;
    this.bgm.play();
    
    // Restart game loop
    requestAnimationFrame(() => this.gameLoop());
  }

  // Message functions
  showFuelMessage(text) {
    this.fuelMessage.text = text;
    this.fuelMessage.time = 60; // Display for 60 frames (1 second)
  }

  showBulletTimeMessage(text) {
    this.bulletTimeMessage.text = text;
    this.bulletTimeMessage.time = 120; // Display for 120 frames (2 seconds)
  }

  showMessage(text) {
    this.generalMessage.text = text;
    this.generalMessage.time = 120; // Display for 120 frames (2 seconds)
  }

  // Getters for external access
  getGameStarted() {
    return this.gameStarted;
  }

  getKeys() {
    return this.inputManager.keys;
  }
}

// Export functions and variables that need to be accessed globally
window.gameModule = {
  startGame: () => window.gameCore?.startGame(),
  resetGame: () => window.gameCore?.resetGame(),
  useFuel: () => window.gameCore?.weapons?.useFuel(),
  useElectricWave: () => window.gameCore?.weapons?.useElectricWave(),
  useMissile: () => window.gameCore?.weapons?.useMissile(),
  useBulletTime: () => window.gameCore?.weapons?.useBulletTime(),
  keys: () => window.gameCore?.getKeys() || {},
  gameStarted: () => window.gameCore?.getGameStarted() || false
};

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.gameCore = new GameCore();
  window.gameCore.init();
});