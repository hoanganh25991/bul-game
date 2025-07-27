import { CONFIG } from '../config.js';
import { MathUtils } from '../utils/math-utils.js';

export class Bosses {
  constructor() {
    this.bosses = [];
    this.bossIdCounter = 0;
    this.bossTypes = [
      {
        name: 'Tank Commander',
        hp: 50,
        maxHp: 50,
        speed: 1.5,
        size: 1.5, // Scale multiplier
        shootInterval: 30,
        specialAbility: 'rapid_fire',
        color: '#8B0000', // Dark red
        turretColor: '#A52A2A',
        abilities: {
          rapidFire: {
            duration: 180, // 3 seconds at 60fps
            cooldown: 300,  // 5 seconds
            shootInterval: 8 // Much faster shooting
          }
        }
      },
      {
        name: 'Heavy Artillery',
        hp: 80,
        maxHp: 80,
        speed: 0.8,
        size: 2.0,
        shootInterval: 60,
        specialAbility: 'explosive_shells',
        color: '#4B0082', // Indigo
        turretColor: '#6A0DAD',
        abilities: {
          explosiveShells: {
            damage: 3,
            explosionRadius: 60,
            cooldown: 240
          }
        }
      },
      {
        name: 'Lightning Tank',
        hp: 35,
        maxHp: 35,
        speed: 2.5,
        size: 1.2,
        shootInterval: 45,
        specialAbility: 'electric_burst',
        color: '#FFD700', // Gold
        turretColor: '#FFA500',
        abilities: {
          electricBurst: {
            range: 200,
            damage: 2,
            cooldown: 360, // 6 seconds
            chainCount: 3
          }
        }
      },
      {
        name: 'Shield Guardian',
        hp: 60,
        maxHp: 60,
        speed: 1.0,
        size: 1.8,
        shootInterval: 40,
        specialAbility: 'energy_shield',
        color: '#00CED1', // Dark turquoise
        turretColor: '#20B2AA',
        abilities: {
          energyShield: {
            duration: 240, // 4 seconds
            cooldown: 480, // 8 seconds
            damageReduction: 0.5
          }
        }
      }
    ];
  }

  update(tank, cameraSystem, frameCount) {
    // Update existing bosses
    this.updateBosses(tank, cameraSystem, frameCount);
  }

  spawnBoss(tank, cameraSystem, bossLevel = 1) {
    // Choose boss type based on level
    const bossTypeIndex = (bossLevel - 1) % this.bossTypes.length;
    const bossType = this.bossTypes[bossTypeIndex];
    
    // Spawn boss at a distance from tank
    const spawnDistance = 400;
    const angle = Math.random() * Math.PI * 2;
    const worldX = tank.worldX + Math.cos(angle) * spawnDistance;
    const worldY = tank.worldY + Math.sin(angle) * spawnDistance;
    
    // Scale HP based on boss level
    const scaledHp = Math.floor(bossType.hp * (1 + (bossLevel - 1) * 0.3));
    
    const boss = {
      id: this.bossIdCounter++,
      type: bossType.name,
      worldX: worldX,
      worldY: worldY,
      x: 0, // Will be calculated by worldToScreen
      y: 0, // Will be calculated by worldToScreen
      hp: scaledHp,
      maxHp: scaledHp,
      speed: bossType.speed,
      size: bossType.size,
      shootCooldown: 0,
      shootInterval: bossType.shootInterval,
      specialAbility: bossType.specialAbility,
      color: bossType.color,
      turretColor: bossType.turretColor,
      abilities: JSON.parse(JSON.stringify(bossType.abilities)), // Deep copy
      specialCooldown: 0,
      specialActive: false,
      specialDuration: 0,
      level: bossLevel,
      angle: 0,
      turretAngle: 0,
      // Special ability states
      shieldActive: false,
      rapidFireActive: false
    };
    
    this.bosses.push(boss);
    console.log(`Boss spawned: ${boss.type} (Level ${bossLevel}) with ${boss.hp} HP at (${worldX}, ${worldY})`);
    
    return boss;
  }

  updateBosses(tank, cameraSystem, frameCount) {
    for (let i = this.bosses.length - 1; i >= 0; i--) {
      let boss = this.bosses[i];
      
      // Update boss screen position
      const screenPos = cameraSystem.worldToScreen(boss.worldX, boss.worldY);
      boss.x = screenPos.x;
      boss.y = screenPos.y;
      
      // Move boss towards tank
      const dx = tank.worldX - boss.worldX;
      const dy = tank.worldY - boss.worldY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        // Update movement angle
        boss.angle = Math.atan2(dy, dx);
        
        // Move towards tank but maintain some distance
        const minDistance = 150;
        if (distance > minDistance) {
          boss.worldX += (dx / distance) * boss.speed;
          boss.worldY += (dy / distance) * boss.speed;
        }
        
        // Update turret angle to face tank
        boss.turretAngle = Math.atan2(dy, dx);
      }
      
      // Update special abilities
      this.updateBossAbilities(boss, tank, frameCount);
      
      // Boss shooting
      if (boss.shootCooldown <= 0) {
        this.bossShoot(boss, tank);
        const currentInterval = boss.rapidFireActive ? 
          boss.abilities.rapidFire?.shootInterval || boss.shootInterval : 
          boss.shootInterval;
        boss.shootCooldown = currentInterval;
      } else {
        boss.shootCooldown--;
      }
      
      // Remove bosses that are too far from camera
      const distanceFromCamera = Math.sqrt(
        Math.pow(boss.worldX - cameraSystem.x, 2) + 
        Math.pow(boss.worldY - cameraSystem.y, 2)
      );
      
      if (distanceFromCamera > Math.max(window.innerWidth, window.innerHeight) + 1000) {
        this.bosses.splice(i, 1);
        continue;
      }
      
      // Check collision with tank
      if (this.checkTankCollision(boss, tank)) {
        const damage = boss.size >= 2.0 ? 3 : 2; // Heavy bosses do more damage
        if (tank.takeDamage(damage)) {
          console.log('Tank destroyed by boss!');
        }
        // Boss doesn't die from collision, just damages tank
      }
    }
  }

  updateBossAbilities(boss, tank, frameCount) {
    // Update special ability cooldowns
    if (boss.specialCooldown > 0) {
      boss.specialCooldown--;
    }
    
    // Update special ability duration
    if (boss.specialDuration > 0) {
      boss.specialDuration--;
      if (boss.specialDuration <= 0) {
        this.deactivateSpecialAbility(boss);
      }
    }
    
    // Activate special abilities when off cooldown
    if (boss.specialCooldown <= 0 && !boss.specialActive) {
      this.activateSpecialAbility(boss, tank);
    }
  }

  activateSpecialAbility(boss, tank) {
    switch (boss.specialAbility) {
      case 'rapid_fire':
        boss.rapidFireActive = true;
        boss.specialActive = true;
        boss.specialDuration = boss.abilities.rapidFire.duration;
        boss.specialCooldown = boss.abilities.rapidFire.cooldown;
        console.log(`${boss.type} activated Rapid Fire!`);
        break;
        
      case 'explosive_shells':
        // This is handled in shooting logic
        boss.specialCooldown = boss.abilities.explosiveShells.cooldown;
        console.log(`${boss.type} will fire explosive shells!`);
        break;
        
      case 'electric_burst':
        this.performElectricBurst(boss, tank);
        boss.specialCooldown = boss.abilities.electricBurst.cooldown;
        console.log(`${boss.type} performed Electric Burst!`);
        break;
        
      case 'energy_shield':
        boss.shieldActive = true;
        boss.specialActive = true;
        boss.specialDuration = boss.abilities.energyShield.duration;
        boss.specialCooldown = boss.abilities.energyShield.cooldown;
        console.log(`${boss.type} activated Energy Shield!`);
        break;
    }
  }

  deactivateSpecialAbility(boss) {
    boss.specialActive = false;
    boss.rapidFireActive = false;
    boss.shieldActive = false;
    console.log(`${boss.type} special ability deactivated`);
  }

  performElectricBurst(boss, tank) {
    const dx = tank.worldX - boss.worldX;
    const dy = tank.worldY - boss.worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= boss.abilities.electricBurst.range) {
      // Damage tank if in range
      const damage = boss.abilities.electricBurst.damage;
      tank.takeDamage(damage);
      console.log(`Tank hit by electric burst for ${damage} damage!`);
      
      // Create visual effect (will be handled by renderer)
      boss.electricBurstEffect = {
        active: true,
        duration: 30, // 0.5 seconds
        targetX: tank.worldX,
        targetY: tank.worldY
      };
    }
  }

  bossShoot(boss, tank) {
    // Calculate direction to tank
    const dx = tank.worldX - boss.worldX;
    const dy = tank.worldY - boss.worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const bulletSpeed = CONFIG.bullets.enemySpeed * 0.8; // Boss bullets slightly slower
      
      // Check for explosive shells
      const isExplosive = boss.specialAbility === 'explosive_shells' && boss.specialCooldown <= 0;
      
      const bullet = {
        worldX: boss.worldX,
        worldY: boss.worldY,
        x: boss.x,
        y: boss.y,
        dx: (dx / distance) * bulletSpeed,
        dy: (dy / distance) * bulletSpeed,
        isBoss: true,
        bossId: boss.id,
        isExplosive: isExplosive,
        damage: isExplosive ? boss.abilities.explosiveShells?.damage || 2 : 2
      };
      
      // Add to boss bullets array (we'll need to create this)
      if (!this.bossBullets) {
        this.bossBullets = [];
      }
      this.bossBullets.push(bullet);
      
      console.log(`Boss ${boss.type} fired ${isExplosive ? 'explosive' : 'normal'} bullet!`);
    }
  }

  updateBossBullets(tank, cameraSystem) {
    if (!this.bossBullets) {
      this.bossBullets = [];
      return;
    }
    
    for (let i = this.bossBullets.length - 1; i >= 0; i--) {
      let bullet = this.bossBullets[i];
      
      // Update bullet world position
      bullet.worldX += bullet.dx;
      bullet.worldY += bullet.dy;
      
      // Update bullet screen position
      const screenPos = cameraSystem.worldToScreen(bullet.worldX, bullet.worldY);
      bullet.x = screenPos.x;
      bullet.y = screenPos.y;
      
      // Check collision with tank
      if (this.checkBulletTankCollision(bullet, tank)) {
        const damage = bullet.damage || 2;
        if (tank.takeDamage(damage)) {
          console.log('Tank destroyed by boss bullet!');
        }
        
        // Create explosion effect for explosive bullets
        if (bullet.isExplosive) {
          this.createExplosion(bullet.worldX, bullet.worldY, tank);
        }
        
        this.bossBullets.splice(i, 1);
        continue;
      }
      
      // Remove bullets that are off screen
      if (bullet.x < -50 || bullet.x > window.innerWidth + 50 || 
          bullet.y < -50 || bullet.y > window.innerHeight + 50) {
        this.bossBullets.splice(i, 1);
      }
    }
  }

  createExplosion(worldX, worldY, tank) {
    // Check if tank is in explosion radius
    const dx = tank.worldX - worldX;
    const dy = tank.worldY - worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const explosionRadius = 60;
    if (distance <= explosionRadius) {
      tank.takeDamage(1); // Additional explosion damage
      console.log('Tank hit by explosion!');
    }
    
    // Create visual explosion effect
    if (!this.explosions) {
      this.explosions = [];
    }
    
    this.explosions.push({
      worldX: worldX,
      worldY: worldY,
      x: 0, // Will be updated
      y: 0, // Will be updated
      radius: explosionRadius,
      duration: 30, // 0.5 seconds
      maxDuration: 30
    });
  }

  updateExplosions(cameraSystem) {
    if (!this.explosions) {
      this.explosions = [];
      return;
    }
    
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      let explosion = this.explosions[i];
      
      // Update screen position
      const screenPos = cameraSystem.worldToScreen(explosion.worldX, explosion.worldY);
      explosion.x = screenPos.x;
      explosion.y = screenPos.y;
      
      explosion.duration--;
      if (explosion.duration <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  checkTankCollision(boss, tank) {
    const bossSize = 60 * boss.size;
    const dx = boss.x + (bossSize / 2) - (tank.x + 30);
    const dy = boss.y + (bossSize / 2) - (tank.y + 35);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (bossSize / 2 + 30); // Boss radius + tank radius
  }

  checkBulletTankCollision(bullet, tank) {
    const dx = bullet.x - (tank.x + 30);
    const dy = bullet.y - (tank.y + 35);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 25;
  }

  damageBoss(index, damage) {
    if (index >= 0 && index < this.bosses.length) {
      const boss = this.bosses[index];
      
      // Apply shield damage reduction
      if (boss.shieldActive && boss.abilities.energyShield) {
        damage = Math.ceil(damage * boss.abilities.energyShield.damageReduction);
        console.log(`Shield absorbed damage! Reduced to ${damage}`);
      }
      
      boss.hp -= damage;
      console.log(`Boss ${boss.type} took ${damage} damage! HP: ${boss.hp}/${boss.maxHp}`);
      
      if (boss.hp <= 0) {
        console.log(`Boss ${boss.type} defeated!`);
        this.bosses.splice(index, 1);
        return true; // Boss destroyed
      }
    }
    return false; // Boss still alive
  }

  damageBossById(id, damage) {
    const index = this.bosses.findIndex(boss => boss.id === id);
    if (index !== -1) {
      return this.damageBoss(index, damage);
    }
    return false;
  }

  reset() {
    this.bosses = [];
    this.bossBullets = [];
    this.explosions = [];
    this.bossIdCounter = 0;
  }

  // Getters
  getBosses() {
    return this.bosses;
  }

  getBossBullets() {
    return this.bossBullets || [];
  }

  getExplosions() {
    return this.explosions || [];
  }

  getBossCount() {
    return this.bosses.length;
  }

  hasBoss() {
    return this.bosses.length > 0;
  }
}