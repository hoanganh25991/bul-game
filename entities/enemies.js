import { CONFIG } from '../config.js';

export class Enemies {
  constructor() {
    this.enemies = [];
    this.enemyBullets = [];
    this.enemyIdCounter = 0;
  }

  update(tank, cameraSystem, frameCount, enemyIdCounter) {
    this.enemyIdCounter = enemyIdCounter;
    
    // Spawn enemies
    this.spawnEnemies(tank, cameraSystem, frameCount);
    
    // Update existing enemies
    this.updateEnemies(tank, cameraSystem);
    
    // Update enemy bullets
    this.updateEnemyBullets(tank, cameraSystem);
  }

  spawnEnemies(tank, cameraSystem, frameCount) {
    // Spawn enemies based on frame count
    if (frameCount % CONFIG.enemies.spawnInterval === 0 && frameCount > 0) {
      // Spawn enemies around the camera view in world coordinates
      const spawnDistance = Math.max(window.innerWidth, window.innerHeight) / 2 + 200;
      let worldX, worldY;
      let edge = Math.floor(Math.random() * 4);
      
      switch (edge) {
        case 0: // Top
          worldX = cameraSystem.x + (Math.random() - 0.5) * window.innerWidth;
          worldY = cameraSystem.y - spawnDistance;
          break;
        case 1: // Right
          worldX = cameraSystem.x + spawnDistance;
          worldY = cameraSystem.y + (Math.random() - 0.5) * window.innerHeight;
          break;
        case 2: // Bottom
          worldX = cameraSystem.x + (Math.random() - 0.5) * window.innerWidth;
          worldY = cameraSystem.y + spawnDistance;
          break;
        case 3: // Left
          worldX = cameraSystem.x - spawnDistance;
          worldY = cameraSystem.y + (Math.random() - 0.5) * window.innerHeight;
          break;
      }
      
      this.enemies.push({
        id: this.enemyIdCounter++,
        worldX: worldX,
        worldY: worldY,
        x: 0, // Will be calculated by worldToScreen
        y: 0, // Will be calculated by worldToScreen
        hp: CONFIG.enemies.hp,
        maxHp: CONFIG.enemies.maxHp,
        speed: CONFIG.enemies.speed,
        shootCooldown: 0,
        shootInterval: CONFIG.enemies.shootInterval || 120
      });
    }
  }

  updateEnemies(tank, cameraSystem) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      let enemy = this.enemies[i];
      
      // Update enemy screen position
      const screenPos = cameraSystem.worldToScreen(enemy.worldX, enemy.worldY);
      enemy.x = screenPos.x;
      enemy.y = screenPos.y;
      
      // Move enemy towards tank
      const dx = tank.worldX - enemy.worldX;
      const dy = tank.worldY - enemy.worldY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        enemy.worldX += (dx / distance) * enemy.speed;
        enemy.worldY += (dy / distance) * enemy.speed;
      }
      
      // Enemy shooting
      if (enemy.shootCooldown <= 0) {
        this.enemyShoot(enemy, tank);
        enemy.shootCooldown = enemy.shootInterval;
      } else {
        enemy.shootCooldown--;
      }
      
      // Remove enemies that are too far from camera
      const distanceFromCamera = Math.sqrt(
        Math.pow(enemy.worldX - cameraSystem.x, 2) + 
        Math.pow(enemy.worldY - cameraSystem.y, 2)
      );
      
      if (distanceFromCamera > Math.max(window.innerWidth, window.innerHeight) + 500) {
        this.enemies.splice(i, 1);
        continue;
      }
      
      // Check collision with tank
      if (this.checkTankCollision(enemy, tank)) {
        if (tank.takeDamage(1)) {
          // Tank destroyed - handle game over
          console.log('Tank destroyed!');
        }
        this.enemies.splice(i, 1);
      }
    }
  }

  enemyShoot(enemy, tank) {
    // Calculate direction to tank
    const dx = tank.worldX - enemy.worldX;
    const dy = tank.worldY - enemy.worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const bulletSpeed = CONFIG.bullets.speed * 0.7; // Enemy bullets slower
      this.enemyBullets.push({
        worldX: enemy.worldX,
        worldY: enemy.worldY,
        x: enemy.x,
        y: enemy.y,
        dx: (dx / distance) * bulletSpeed,
        dy: (dy / distance) * bulletSpeed
      });
    }
  }

  updateEnemyBullets(tank, cameraSystem) {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      let bullet = this.enemyBullets[i];
      
      // Update bullet world position
      bullet.worldX += bullet.dx;
      bullet.worldY += bullet.dy;
      
      // Update bullet screen position
      const screenPos = cameraSystem.worldToScreen(bullet.worldX, bullet.worldY);
      bullet.x = screenPos.x;
      bullet.y = screenPos.y;
      
      // Check collision with tank
      if (this.checkBulletTankCollision(bullet, tank)) {
        if (tank.takeDamage(1)) {
          // Tank destroyed - handle game over
          console.log('Tank destroyed by bullet!');
        }
        this.enemyBullets.splice(i, 1);
        continue;
      }
      
      // Remove bullets that are off screen
      if (bullet.x < -50 || bullet.x > window.innerWidth + 50 || 
          bullet.y < -50 || bullet.y > window.innerHeight + 50) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  checkTankCollision(enemy, tank) {
    const dx = enemy.x + 30 - (tank.x + 30);
    const dy = enemy.y + 35 - (tank.y + 35);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 50; // Collision threshold
  }

  checkBulletTankCollision(bullet, tank) {
    const dx = bullet.x - (tank.x + 30);
    const dy = bullet.y - (tank.y + 35);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 25; // Bullet collision threshold
  }

  removeEnemy(index) {
    if (index >= 0 && index < this.enemies.length) {
      this.enemies.splice(index, 1);
    }
  }

  removeEnemyById(id) {
    const index = this.enemies.findIndex(enemy => enemy.id === id);
    if (index !== -1) {
      this.enemies.splice(index, 1);
    }
  }

  damageEnemy(index, damage) {
    if (index >= 0 && index < this.enemies.length) {
      this.enemies[index].hp -= damage;
      if (this.enemies[index].hp <= 0) {
        this.enemies.splice(index, 1);
        return true; // Enemy destroyed
      }
    }
    return false; // Enemy still alive
  }

  damageEnemyById(id, damage) {
    const index = this.enemies.findIndex(enemy => enemy.id === id);
    if (index !== -1) {
      return this.damageEnemy(index, damage);
    }
    return false;
  }

  reset() {
    this.enemies = [];
    this.enemyBullets = [];
    this.enemyIdCounter = 0;
  }

  // Getters for external access
  getEnemies() {
    return this.enemies;
  }

  getEnemyBullets() {
    return this.enemyBullets;
  }

  getEnemyIdCounter() {
    return this.enemyIdCounter;
  }

  getEnemyCount() {
    return this.enemies.length;
  }
}