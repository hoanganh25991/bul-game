import { CONFIG } from '../config.js';

export class Tank {
  constructor(scaleFactor) {
    this.x = 0; // Screen position
    this.y = 0; // Screen position
    this.worldX = 0; // World position
    this.worldY = 0; // World position
    this.speed = CONFIG.tank.speed;
    this.hp = CONFIG.tank.hp;
    this.maxHp = CONFIG.tank.maxHp;
    this.shootCooldown = 0;
    this.shootInterval = CONFIG.tank.shootInterval;
    this.angle = -Math.PI / 2;
    this.turretAngle = -Math.PI / 2;
    this.autoAim = CONFIG.tank.autoAim;
    this.canShootWhileMoving = CONFIG.tank.canShootWhileMoving;
    this.autoShoot = CONFIG.tank.autoShoot;
    this.scaleFactor = scaleFactor;

    // Support tank
    this.supportTank = {
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
  }

  updateScale(scaleFactor) {
    this.scaleFactor = scaleFactor;
    this.speed = this.getScaledSize(CONFIG.tank.speed);
  }

  getScaledSize(baseSize) {
    const scale = this.scaleFactor || 1;
    return Math.max(baseSize * scale, baseSize * 0.5);
  }

  setWorldPosition(x, y) {
    this.worldX = x;
    this.worldY = y;
  }

  setScreenPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  update(keys, cameraSystem) {
    // Update tank movement in world coordinates
    const movement = this.getMovementFromKeys(keys);
    this.worldX += movement.dx * this.speed;
    this.worldY += movement.dy * this.speed;

    // Update shooting
    if (keys[' '] || keys['Space']) {
      this.shoot();
    }

    // Update cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;

    // Update support tank
    this.updateSupportTank(cameraSystem);
  }

  getMovementFromKeys(keys) {
    let dx = 0;
    let dy = 0;
    
    if (keys['ArrowUp']) dy -= 1;
    if (keys['ArrowDown']) dy += 1;
    if (keys['ArrowLeft']) dx -= 1;
    if (keys['ArrowRight']) dx += 1;
    
    return { dx, dy };
  }

  updateSupportTank(cameraSystem) {
    // Update support tank position to follow main tank
    const targetX = this.worldX + Math.cos(this.supportTank.followAngle) * this.supportTank.targetDistance;
    const targetY = this.worldY + Math.sin(this.supportTank.followAngle) * this.supportTank.targetDistance;
    
    // Move support tank towards target position
    const dx = targetX - this.supportTank.worldX;
    const dy = targetY - this.supportTank.worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 10) {
      this.supportTank.worldX += (dx / distance) * this.supportTank.speed;
      this.supportTank.worldY += (dy / distance) * this.supportTank.speed;
    }

    // Update support tank screen position
    const screenPos = cameraSystem.worldToScreen(this.supportTank.worldX, this.supportTank.worldY);
    this.supportTank.x = screenPos.x;
    this.supportTank.y = screenPos.y;

    // Update support tank shooting cooldown
    if (this.supportTank.shootCooldown > 0) this.supportTank.shootCooldown--;
  }

  shoot() {
    if (this.shootCooldown <= 0 && window.gameCore?.bullets) {
      window.gameCore.bullets.addBullet({
        worldX: this.worldX,
        worldY: this.worldY - 20, // Shoot from front of tank
        x: this.x, // Screen position (will be updated)
        y: this.y - 20, // Screen position (will be updated)
        dx: 0,
        dy: -CONFIG.bullets.speed
      });
      this.shootCooldown = this.shootInterval;
    }
  }

  supportTankShoot() {
    if (this.supportTank.shootCooldown <= 0 && window.gameCore?.bullets) {
      window.gameCore.bullets.addSupportBullet({
        worldX: this.supportTank.worldX,
        worldY: this.supportTank.worldY - 15,
        x: this.supportTank.x,
        y: this.supportTank.y - 15,
        dx: 0,
        dy: -CONFIG.bullets.speed
      });
      this.supportTank.shootCooldown = this.supportTank.shootInterval;
    }
  }

  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    return this.hp <= 0;
  }

  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  supportTankHeal(amount) {
    if (this.supportTank.hp > 0) {
      this.supportTank.hp = Math.min(this.supportTank.hp + amount, this.supportTank.maxHp);
    }
  }

  toggleAutoAim() {
    this.autoAim = !this.autoAim;
  }

  toggleAutoShoot() {
    this.autoShoot = !this.autoShoot;
  }

  reset() {
    this.hp = this.maxHp;
    this.worldX = 0;
    this.worldY = 0;
    this.shootCooldown = 0;
    this.angle = -Math.PI / 2;
    this.turretAngle = -Math.PI / 2;

    // Reset support tank
    this.supportTank.hp = this.supportTank.maxHp;
    this.supportTank.worldX = 350;
    this.supportTank.worldY = 350;
    this.supportTank.shootCooldown = 0;
  }

  // Getters for external access
  getPosition() {
    return { x: this.x, y: this.y };
  }

  getWorldPosition() {
    return { x: this.worldX, y: this.worldY };
  }

  getSupportTank() {
    return this.supportTank;
  }

  getStats() {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      autoAim: this.autoAim,
      autoShoot: this.autoShoot
    };
  }
}