import { CONFIG } from '../config.js';

export class InputManager {
  constructor() {
    this.keys = {};
  }

  setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  handleKeyDown(e) {
    this.keys[e.key] = true;
    
    // Handle special key actions through game core
    if (window.gameCore) {
      // Fuel key
      if (CONFIG.controls.keys.fuel.includes(e.key)) {
        console.log('Fuel key pressed:', e.key);
        window.gameCore.weapons.useFuel();
      }
      
      // Electric wave key
      if (CONFIG.controls.keys.electricWave.includes(e.key)) {
        window.gameCore.weapons.useElectricWave();
      }
      
      // Missile key
      if (CONFIG.controls.keys.missile.includes(e.key)) {
        window.gameCore.weapons.useMissile();
      }
      
      // Bullet time key
      if (CONFIG.controls.keys.bulletTime.includes(e.key)) {
        window.gameCore.weapons.useBulletTime();
      }
      

      
      // Auto shoot toggle
      if (CONFIG.controls.keys.autoShoot.includes(e.key)) {
        window.gameCore.tank.toggleAutoShoot();
        const message = window.gameCore.tank.autoShoot ? "🔫 Bắn tự động: BẬT" : "🔫 Bắn tự động: TẮT";
        window.gameCore.showMessage(message);
      }
    }
  }

  handleKeyUp(e) {
    this.keys[e.key] = false;
  }

  isKeyPressed(key) {
    return !!this.keys[key];
  }

  isAnyKeyPressed(keyArray) {
    return keyArray.some(key => this.keys[key]);
  }

  isMovementKeyPressed() {
    return this.isAnyKeyPressed(CONFIG.controls.keys.moveUp) ||
           this.isAnyKeyPressed(CONFIG.controls.keys.moveDown) ||
           this.isAnyKeyPressed(CONFIG.controls.keys.moveLeft) ||
           this.isAnyKeyPressed(CONFIG.controls.keys.moveRight);
  }

  isShootKeyPressed() {
    return this.keys[' '] || this.keys['Space'];
  }

  getMovementVector() {
    let dx = 0;
    let dy = 0;
    
    if (this.isAnyKeyPressed(CONFIG.controls.keys.moveLeft)) dx -= 1;
    if (this.isAnyKeyPressed(CONFIG.controls.keys.moveRight)) dx += 1;
    if (this.isAnyKeyPressed(CONFIG.controls.keys.moveUp)) dy -= 1;
    if (this.isAnyKeyPressed(CONFIG.controls.keys.moveDown)) dy += 1;
    
    return { dx, dy };
  }

  reset() {
    this.keys = {};
  }
}