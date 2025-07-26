import { CONFIG } from '../config.js';
import { MathUtils } from '../utils/math-utils.js';

export class Bullets {
  constructor() {
    this.bullets = [];
    this.supportBullets = [];
  }

  update(enemies, cameraSystem, victorySystem) {
    this.updateBullets(enemies, cameraSystem, victorySystem);
    this.updateSupportBullets(enemies, cameraSystem, victorySystem);
  }

  updateBullets(enemies, cameraSystem, victorySystem) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      let bullet = this.bullets[i];
      
      // Update bullet world position
      bullet.worldY += bullet.dy;
      bullet.worldX += bullet.dx;
      
      // Update bullet screen position
      const screenPos = cameraSystem.worldToScreen(bullet.worldX, bullet.worldY);
      bullet.x = screenPos.x;
      bullet.y = screenPos.y;
      
      // Check collision with enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        let enemy = enemies[j];
        let dx = bullet.x - (enemy.x + 30);
        let dy = bullet.y - (enemy.y + 35);
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30) {
          // Hit enemy
          enemy.hp -= CONFIG.bullets.damage;
          this.bullets.splice(i, 1);
          
          if (enemy.hp <= 0) {
            enemies.splice(j, 1);
            victorySystem.enemiesKilled++;
            console.log('Enemy killed by main bullet! Total kills:', victorySystem.enemiesKilled, '/', victorySystem.targetKills);
          }
          break;
        }
      }
      
      // Remove bullets that are off screen
      if (bullet.x < -50 || bullet.x > window.innerWidth + 50 || 
          bullet.y < -50 || bullet.y > window.innerHeight + 50) {
        this.bullets.splice(i, 1);
      }
    }
  }

  updateSupportBullets(enemies, cameraSystem, victorySystem) {
    for (let i = this.supportBullets.length - 1; i >= 0; i--) {
      let bullet = this.supportBullets[i];
      
      // Update bullet world position
      bullet.worldY += bullet.dy;
      bullet.worldX += bullet.dx;
      
      // Update bullet screen position
      const screenPos = cameraSystem.worldToScreen(bullet.worldX, bullet.worldY);
      bullet.x = screenPos.x;
      bullet.y = screenPos.y;
      
      // Check collision with enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        let enemy = enemies[j];
        let dx = bullet.x - (enemy.x + 30);
        let dy = bullet.y - (enemy.y + 35);
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30) {
          // Hit enemy
          enemy.hp -= CONFIG.bullets.damage;
          this.supportBullets.splice(i, 1);
          
          if (enemy.hp <= 0) {
            enemies.splice(j, 1);
            victorySystem.enemiesKilled++;
            console.log('Enemy killed by support bullet! Total kills:', victorySystem.enemiesKilled, '/', victorySystem.targetKills);
          }
          break;
        }
      }
      
      // Remove bullets that are off screen
      if (bullet.x < -50 || bullet.x > window.innerWidth + 50 || 
          bullet.y < -50 || bullet.y > window.innerHeight + 50) {
        this.supportBullets.splice(i, 1);
      }
    }
  }

  addBullet(bulletData) {
    this.bullets.push({
      worldX: bulletData.worldX,
      worldY: bulletData.worldY,
      x: bulletData.x,
      y: bulletData.y,
      dx: bulletData.dx,
      dy: bulletData.dy,
      isLaser: bulletData.isLaser || false
    });
  }

  addSupportBullet(bulletData) {
    this.supportBullets.push({
      worldX: bulletData.worldX,
      worldY: bulletData.worldY,
      x: bulletData.x,
      y: bulletData.y,
      dx: bulletData.dx,
      dy: bulletData.dy
    });
  }

  addLaserBullet(tank) {
    // Fire laser from the center of the tank (middle of main gun) at the cannon tip
    const gunCenterX = tank.worldX + 30; // Tank center X (tank width is 60px, so center is +30)
    const gunTipY = tank.worldY - 12; // Cannon tip Y position (same as regular bullets)
    
    let dx = 0;
    let dy = -CONFIG.bullets.speed * 2; // Faster bullets during bullet time
    
    // Auto-aim functionality for laser (same as regular bullets)
    if (CONFIG.tank.autoAim && window.gameCore?.enemies) {
      const nearestEnemy = tank.findNearestEnemy(window.gameCore.enemies.getEnemies());
      if (nearestEnemy) {
        const targetPos = tank.calculatePredictiveAim(gunCenterX, gunTipY, nearestEnemy, CONFIG.bullets.speed * 2);
        const angle = MathUtils.angle(gunCenterX, gunTipY, targetPos.x, targetPos.y);
        const bulletVector = MathUtils.vectorFromAngle(angle, CONFIG.bullets.speed * 2);
        dx = bulletVector.x;
        dy = bulletVector.y;
      }
    }
    
    this.bullets.push({
      worldX: gunCenterX,
      worldY: gunTipY,
      x: tank.x + 30, // Screen position (will be updated)
      y: tank.y - 12, // Screen position (will be updated)
      dx: dx,
      dy: dy,
      isLaser: true
    });
  }

  checkBulletEnemyCollision(bullet, enemy) {
    const dx = bullet.x - (enemy.x + 30);
    const dy = bullet.y - (enemy.y + 35);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 30;
  }

  removeBullet(index) {
    if (index >= 0 && index < this.bullets.length) {
      this.bullets.splice(index, 1);
    }
  }

  removeSupportBullet(index) {
    if (index >= 0 && index < this.supportBullets.length) {
      this.supportBullets.splice(index, 1);
    }
  }

  reset() {
    this.bullets = [];
    this.supportBullets = [];
  }

  // Getters for external access
  getBullets() {
    return this.bullets;
  }

  getSupportBullets() {
    return this.supportBullets;
  }

  getAllBullets() {
    return [...this.bullets, ...this.supportBullets];
  }

  getBulletCount() {
    return this.bullets.length + this.supportBullets.length;
  }
}