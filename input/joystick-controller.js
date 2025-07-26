import { CONFIG } from '../config.js';

export class JoystickController {
  constructor() {
    this.joystick = {
      active: false,
      baseX: 0,
      baseY: 0,
      handleX: 0,
      handleY: 0,
      limitRadius: 0,
      dx: 0,
      dy: 0
    };

    // DOM elements
    this.joystickContainer = null;
    this.joystickBase = null;
    this.joystickHandle = null;
    this.shootControls = null;
    this.fuelBtn = null;
    this.electricWaveBtn = null;
    this.missileBtn = null;
    this.bulletTimeBtn = null;
    this.shootButton = null;

    this.initializeDOM();
  }

  initializeDOM() {
    this.joystickContainer = document.getElementById('joystickContainer');
    this.joystickBase = document.getElementById('joystickBase');
    this.joystickHandle = document.getElementById('joystickHandle');
    this.shootControls = document.getElementById('shootControls');
    this.fuelBtn = document.getElementById('fuelBtn');
    this.electricWaveBtn = document.getElementById('electricWaveBtn');
    this.missileBtn = document.getElementById('missileBtn');
    this.bulletTimeBtn = document.getElementById('bulletTimeBtn');
    this.shootButton = document.getElementById('shootBtn');
  }

  updateControlsScale(scaleFactor) {
    const isMobile = window.innerWidth <= CONFIG.mobile.breakpoint;
    const baseSize = isMobile ? CONFIG.ui.mobileButtonSize : CONFIG.ui.baseButtonSize;
    const scaledSize = Math.max(baseSize * scaleFactor, CONFIG.ui.minButtonSize);
    
    // Update joystick
    if (this.joystickContainer) {
      const joystickSize = Math.max(CONFIG.ui.joystickSize * scaleFactor, 100);
      this.joystickContainer.style.width = joystickSize + 'px';
      this.joystickContainer.style.height = joystickSize + 'px';
      
      const handleSize = Math.max(CONFIG.ui.joystickHandleSize * scaleFactor, 35);
      if (this.joystickHandle) {
        this.joystickHandle.style.width = handleSize + 'px';
        this.joystickHandle.style.height = handleSize + 'px';
      }
    }
    
    // Update control buttons
    const buttons = [this.shootButton, this.fuelBtn, this.electricWaveBtn, this.missileBtn, this.bulletTimeBtn];
    buttons.forEach(btn => {
      if (btn) {
        btn.style.width = scaledSize + 'px';
        btn.style.height = scaledSize + 'px';
        btn.style.fontSize = Math.max(24 * scaleFactor, 18) + 'px';
      }
    });
  }

  showControls() {
    if (this.joystickContainer) {
      this.joystickContainer.style.display = 'block';
    }
    if (this.shootControls) {
      this.shootControls.style.display = 'flex';
    }
  }

  setupControls() {
    // Initialize joystick
    const baseRect = this.joystickBase.getBoundingClientRect();
    this.joystick.baseX = baseRect.left + baseRect.width / 2;
    this.joystick.baseY = baseRect.top + baseRect.height / 2;
    this.joystick.limitRadius = baseRect.width / 2 - this.joystickHandle.offsetWidth / 2;
    
    // Set handle to center
    this.joystick.handleX = this.joystick.baseX;
    this.joystick.handleY = this.joystick.baseY;
    this.updateJoystickPosition();
    
    // Mouse events for joystick
    this.joystickHandle.addEventListener('mousedown', (e) => this.startJoystick(e));
    document.addEventListener('mousemove', (e) => this.moveJoystick(e));
    document.addEventListener('mouseup', (e) => this.endJoystick(e));
    
    // Touch events for joystick
    this.joystickHandle.addEventListener('touchstart', (e) => this.startJoystick(e));
    document.addEventListener('touchmove', (e) => this.moveJoystick(e));
    document.addEventListener('touchend', (e) => this.endJoystick(e));
    
    // Shoot button events
    this.shootButton.addEventListener('click', () => this.shoot());
    this.shootButton.addEventListener('touchstart', (e) => { e.preventDefault(); this.shoot(); });
    
    // Fuel button
    this.fuelBtn.addEventListener('click', () => window.gameCore?.weapons?.useFuel());
    this.fuelBtn.addEventListener('touchstart', (e) => { e.preventDefault(); window.gameCore?.weapons?.useFuel(); });
    
    // Electric wave button
    this.electricWaveBtn.addEventListener('click', () => window.gameCore?.weapons?.useElectricWave());
    this.electricWaveBtn.addEventListener('touchstart', (e) => { e.preventDefault(); window.gameCore?.weapons?.useElectricWave(); });
    
    // Missile button
    this.missileBtn.addEventListener('click', () => window.gameCore?.weapons?.useMissile());
    this.missileBtn.addEventListener('touchstart', (e) => { e.preventDefault(); window.gameCore?.weapons?.useMissile(); });
    
    // Bullet time button
    this.bulletTimeBtn.addEventListener('click', () => window.gameCore?.weapons?.useBulletTime());
    this.bulletTimeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); window.gameCore?.weapons?.useBulletTime(); });
  }

  startJoystick(e) {
    e.preventDefault();
    this.joystick.active = true;
    
    // Recalculate base position in case of screen resize
    const baseRect = this.joystickBase.getBoundingClientRect();
    this.joystick.baseX = baseRect.left + baseRect.width / 2;
    this.joystick.baseY = baseRect.top + baseRect.height / 2;
    this.joystick.limitRadius = baseRect.width / 2 - this.joystickHandle.offsetWidth / 2;
  }

  moveJoystick(e) {
    if (!this.joystick.active) return;
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
    let dx = clientX - this.joystick.baseX;
    let dy = clientY - this.joystick.baseY;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    // Limit to circle
    if (distance > this.joystick.limitRadius) {
      dx = dx * this.joystick.limitRadius / distance;
      dy = dy * this.joystick.limitRadius / distance;
    }
    
    // Update handle position
    this.joystick.handleX = this.joystick.baseX + dx;
    this.joystick.handleY = this.joystick.baseY + dy;
    
    // Update joystick values for game controls
    this.joystick.dx = dx / this.joystick.limitRadius; // -1 to 1
    this.joystick.dy = dy / this.joystick.limitRadius; // -1 to 1
    
    // Update visual position
    this.updateJoystickPosition();
    
    // Update key states based on joystick position
    this.updateKeyStates();
  }

  endJoystick(e) {
    if (!this.joystick.active) return;
    e.preventDefault();
    this.joystick.active = false;
    
    // Reset joystick to center
    this.joystick.handleX = this.joystick.baseX;
    this.joystick.handleY = this.joystick.baseY;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
    
    // Update visual position
    this.updateJoystickPosition();
    
    // Reset all direction keys
    if (window.gameCore) {
      const keys = window.gameCore.getKeys();
      keys['ArrowUp'] = false;
      keys['ArrowDown'] = false;
      keys['ArrowLeft'] = false;
      keys['ArrowRight'] = false;
    }
  }

  updateJoystickPosition() {
    this.joystickHandle.style.transform = `translate(${this.joystick.handleX - this.joystick.baseX}px, ${this.joystick.handleY - this.joystick.baseY}px)`;
  }

  updateKeyStates() {
    if (!window.gameCore) return;
    
    // Convert joystick position to key presses
    const deadzone = CONFIG.controls.joystickDeadzone;
    const keys = window.gameCore.getKeys();
    
    keys['ArrowUp'] = this.joystick.dy < -deadzone;
    keys['ArrowDown'] = this.joystick.dy > deadzone;
    keys['ArrowLeft'] = this.joystick.dx < -deadzone;
    keys['ArrowRight'] = this.joystick.dx > deadzone;
  }

  shoot() {
    if (window.gameCore?.tank) {
      window.gameCore.tank.shoot();
    }
  }
}