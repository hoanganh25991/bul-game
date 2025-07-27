import { CONFIG } from '../config.js';
import { MathUtils } from '../utils/math-utils.js';

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

    this.canShootWhileMoving = CONFIG.tank.canShootWhileMoving;
    this.autoShoot = CONFIG.tank.autoShoot;
    this.scaleFactor = scaleFactor;
    this.hasTriangularBullets = false; // New property for triangular bullets

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

  update(inputManager, cameraSystem) {
    // Update tank movement in world coordinates
    const movement = inputManager.getMovementVector();
    this.worldX += movement.dx * this.speed;
    this.worldY += movement.dy * this.speed;

    // Update shooting
    if (inputManager.isShootKeyPressed()) {
      this.shoot();
    }
    
    // Auto-shooting functionality
    if (this.autoShoot && window.gameCore?.enemies) {
      const enemies = window.gameCore.enemies.getEnemies();
      if (enemies.length > 0) {
        this.shoot();
        // Also make support tank shoot automatically
        this.supportTankShoot();
      }
    }

    // Update cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;

    // Update support tank
    this.updateSupportTank(cameraSystem);
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
      // Fire from the center of the tank (middle of main gun) at the cannon tip
      const gunCenterX = this.worldX + 30; // Tank center X (tank width is 60px, so center is +30)
      const gunTipY = this.worldY - 12; // Cannon tip Y position
      
      let dx = 0;
      let dy = -CONFIG.bullets.speed;
      
      // Auto-aim functionality
      if (CONFIG.tank.autoAim && window.gameCore?.enemies) {
        const nearestEnemy = this.findNearestEnemy(window.gameCore.enemies.getEnemies());
        if (nearestEnemy) {
          const targetPos = this.calculatePredictiveAim(gunCenterX, gunTipY, nearestEnemy, CONFIG.bullets.speed);
          const angle = MathUtils.angle(gunCenterX, gunTipY, targetPos.x, targetPos.y);
          const bulletVector = MathUtils.vectorFromAngle(angle, CONFIG.bullets.speed);
          dx = bulletVector.x;
          dy = bulletVector.y;
          
          // Update turret angle for visual feedback with smooth rotation
          if (CONFIG.tank.autoAimSmoothness > 0) {
            const angleDiff = angle - this.turretAngle;
            // Normalize angle difference to [-π, π]
            let normalizedDiff = angleDiff;
            while (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI;
            while (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;
            
            this.turretAngle += normalizedDiff * CONFIG.tank.autoAimSmoothness;
          } else {
            this.turretAngle = angle;
          }
        }
      }
      
      window.gameCore.bullets.addBullet({
        worldX: gunCenterX,
        worldY: gunTipY,
        x: this.x + 30, // Screen position (will be updated)
        y: this.y - 12, // Screen position (will be updated)
        dx: dx,
        dy: dy,
        isTriangular: this.hasTriangularBullets
      });
      this.shootCooldown = this.shootInterval;
    }
  }

  supportTankShoot() {
    if (this.supportTank.shootCooldown <= 0 && window.gameCore?.bullets) {
      // Fire from the center of the support tank (middle of main gun) at the cannon tip
      const gunCenterX = this.supportTank.worldX + 18; // Support tank center X (tank width is 36px, so center is +18)
      const gunTipY = this.supportTank.worldY - 7; // Support tank cannon tip Y position
      
      let dx = 0;
      let dy = -CONFIG.bullets.speed;
      
      // Auto-aim functionality for support tank
      if (CONFIG.tank.autoAim && window.gameCore?.enemies) {
        const nearestEnemy = this.findNearestEnemyForSupport(window.gameCore.enemies.getEnemies());
        if (nearestEnemy) {
          const targetPos = this.calculatePredictiveAim(gunCenterX, gunTipY, nearestEnemy, CONFIG.bullets.speed);
          const angle = MathUtils.angle(gunCenterX, gunTipY, targetPos.x, targetPos.y);
          const bulletVector = MathUtils.vectorFromAngle(angle, CONFIG.bullets.speed);
          dx = bulletVector.x;
          dy = bulletVector.y;
        }
      }
      
      window.gameCore.bullets.addSupportBullet({
        worldX: gunCenterX,
        worldY: gunTipY,
        x: this.supportTank.x + 18, // Screen position (will be updated)
        y: this.supportTank.y - 7, // Screen position (will be updated)
        dx: dx,
        dy: dy
      });
      this.supportTank.shootCooldown = this.supportTank.shootInterval;
    }
  }

  // Find the nearest enemy to the main tank for auto-aim
  findNearestEnemy(enemies) {
    if (!enemies || enemies.length === 0) return null;
    
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    for (const enemy of enemies) {
      const distance = MathUtils.distance(
        this.worldX + 30, this.worldY + 35, // Tank center
        enemy.worldX + 30, enemy.worldY + 35 // Enemy center
      );
      
      // Only consider enemies within auto-aim range
      if (distance < nearestDistance && distance <= CONFIG.tank.autoAimRange) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    return nearestEnemy;
  }
  
  // Find the nearest enemy to the support tank for auto-aim
  findNearestEnemyForSupport(enemies) {
    if (!enemies || enemies.length === 0) return null;
    
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    for (const enemy of enemies) {
      const distance = MathUtils.distance(
        this.supportTank.worldX + 18, this.supportTank.worldY + 18, // Support tank center
        enemy.worldX + 30, enemy.worldY + 35 // Enemy center
      );
      
      // Only consider enemies within auto-aim range
      if (distance < nearestDistance && distance <= CONFIG.tank.autoAimRange) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    return nearestEnemy;
  }
  
  // Calculate predictive aim position for moving enemies
  calculatePredictiveAim(shooterX, shooterY, enemy, bulletSpeed) {
    if (!CONFIG.tank.autoAimPrediction) {
      return { x: enemy.worldX + 30, y: enemy.worldY + 35 };
    }
    
    // Calculate enemy velocity (direction towards tank)
    const tankX = this.worldX + 30;
    const tankY = this.worldY + 35;
    const enemyToTankDx = tankX - enemy.worldX;
    const enemyToTankDy = tankY - enemy.worldY;
    const enemyToTankDistance = Math.sqrt(enemyToTankDx * enemyToTankDx + enemyToTankDy * enemyToTankDy);
    
    // Enemy velocity components (enemies move towards tank)
    const enemyVx = enemyToTankDistance > 0 ? (enemyToTankDx / enemyToTankDistance) * enemy.speed : 0;
    const enemyVy = enemyToTankDistance > 0 ? (enemyToTankDy / enemyToTankDistance) * enemy.speed : 0;
    
    // Calculate time for bullet to reach enemy
    const dx = enemy.worldX + 30 - shooterX;
    const dy = enemy.worldY + 35 - shooterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const timeToHit = distance / bulletSpeed;
    
    // Predict enemy position
    const predictedX = enemy.worldX + 30 + enemyVx * timeToHit;
    const predictedY = enemy.worldY + 35 + enemyVy * timeToHit;
    
    return { x: predictedX, y: predictedY };
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



  toggleAutoShoot() {
    this.autoShoot = !this.autoShoot;
  }

  setTriangularBullets(enabled) {
    this.hasTriangularBullets = enabled;
  }

  reset() {
    this.hp = this.maxHp;
    this.worldX = 0;
    this.worldY = 0;
    this.shootCooldown = 0;
    this.angle = -Math.PI / 2;
    this.turretAngle = -Math.PI / 2;
    this.hasTriangularBullets = false;

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
      autoShoot: this.autoShoot
    };
  }
}