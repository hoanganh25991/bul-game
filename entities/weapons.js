import { CONFIG } from '../config.js';

export class Weapons {
  constructor(scaleFactor) {
    this.scaleFactor = scaleFactor;
    
    // Electric wave system
    this.electricWaveSystem = {
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
    this.missileSystem = {
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
    this.fuelSystem = {
      isReady: true,
      cooldownTime: CONFIG.fuel.cooldownTime,
      currentCooldown: 0
    };

    // Bullet time system
    this.bulletTimeSystem = {
      isActive: false,
      isReady: true,
      duration: CONFIG.bulletTime.duration,
      cooldownTime: CONFIG.bulletTime.cooldownTime,
      currentDuration: 0,
      currentCooldown: 0,
      originalShootCooldown: CONFIG.bulletTime.originalShootCooldown,
      laserActive: false
    };

    // DOM elements
    this.fuelBtn = document.getElementById('fuelBtn');
    this.electricWaveBtn = document.getElementById('electricWaveBtn');
    this.missileBtn = document.getElementById('missileBtn');
    this.bulletTimeBtn = document.getElementById('bulletTimeBtn');
  }

  updateScale(scaleFactor) {
    this.scaleFactor = scaleFactor;
  }

  update(tank, enemies, victorySystem) {
    this.updateElectricWaves(enemies, victorySystem);
    this.updateMissiles(enemies, victorySystem);
    this.updateBulletTimeSystem(tank);
    this.updateCooldowns();
  }

  updateElectricWaves(enemies, victorySystem) {
    // Update electric waves
    for (let i = this.electricWaveSystem.waves.length - 1; i >= 0; i--) {
      let wave = this.electricWaveSystem.waves[i];
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
          
          // Add electric sparkle effects when hitting enemy
          if (window.gameCore?.effectsRenderer) {
            window.gameCore.effectsRenderer.addSparkle(
              enemy.x + 30, enemy.y + 35, 
              '#00ffff', 8
            );
          }
          
          if (enemy.hp <= 0) {
            // Add explosion effect for killed enemy
            if (window.gameCore?.effectsRenderer) {
              window.gameCore.effectsRenderer.addExplosion(
                enemy.x + 30, enemy.y + 35, 
                'medium', '#8a2be2'
              );
            }
            enemies.splice(j, 1);
            victorySystem.enemiesKilled++;
            console.log('Enemy killed by electric wave! Total kills:', victorySystem.enemiesKilled, '/', victorySystem.targetKills);
          }
        }
      }
      
      // Fade out and remove when too big
      wave.opacity -= 0.02;
      if (wave.radius > wave.maxRadius || wave.opacity <= 0) {
        this.electricWaveSystem.waves.splice(i, 1);
      }
    }
  }

  updateMissiles(enemies, victorySystem) {
    // Update missiles
    for (let i = this.missileSystem.missiles.length - 1; i >= 0; i--) {
      let missile = this.missileSystem.missiles[i];
      
      // Find nearest enemy for homing
      let nearestEnemy = null;
      let nearestDistance = Infinity;
      
      for (let enemy of enemies) {
        let dx = enemy.x + 30 - missile.x;
        let dy = enemy.y + 35 - missile.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestDistance && distance < this.missileSystem.homingRange) {
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
          if (speed > this.missileSystem.missileSpeed) {
            missile.vx = (missile.vx / speed) * this.missileSystem.missileSpeed;
            missile.vy = (missile.vy / speed) * this.missileSystem.missileSpeed;
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
          this.explodeMissile(missile, i, enemies, victorySystem);
          break;
        }
      }
      
      // Remove if off screen
      if (missile.x < -100 || missile.x > window.innerWidth + 100 || 
          missile.y < -100 || missile.y > window.innerHeight + 100) {
        this.missileSystem.missiles.splice(i, 1);
      }
    }
  }

  explodeMissile(missile, index, enemies, victorySystem) {
    // Create explosion effect and damage enemies in radius
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      let dx = missile.x - (enemy.x + 30);
      let dy = missile.y - (enemy.y + 35);
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.missileSystem.explosionRadius) {
        enemy.hp -= this.missileSystem.missileDamage;
        if (enemy.hp <= 0) {
          enemies.splice(j, 1);
          victorySystem.enemiesKilled++;
          console.log('Enemy killed by missile! Total kills:', victorySystem.enemiesKilled, '/', victorySystem.targetKills);
        }
      }
    }
    
    // Remove missile
    this.missileSystem.missiles.splice(index, 1);
  }

  updateBulletTimeSystem(tank) {
    if (this.bulletTimeSystem.isActive) {
      // Enable laser shooting
      if (window.gameCore?.inputManager?.isShootKeyPressed()) {
        // Create laser bullet
        window.gameCore.bullets.addLaserBullet(tank);
      }
    }
  }

  updateCooldowns() {
    // Update fuel system cooldown
    if (!this.fuelSystem.isReady) {
      this.fuelSystem.currentCooldown -= 16.67; // Assuming 60 FPS
      if (this.fuelSystem.currentCooldown <= 0) {
        this.fuelSystem.isReady = true;
        this.updateFuelButton();
      }
    }
    
    // Update electric wave system cooldown
    if (!this.electricWaveSystem.isReady) {
      this.electricWaveSystem.currentCooldown -= 16.67;
      if (this.electricWaveSystem.currentCooldown <= 0) {
        this.electricWaveSystem.isReady = true;
        this.updateElectricWaveButton();
      }
    }
    
    // Update missile system cooldown
    if (!this.missileSystem.isReady) {
      this.missileSystem.currentCooldown -= 16.67;
      if (this.missileSystem.currentCooldown <= 0) {
        this.missileSystem.isReady = true;
        this.updateMissileButton();
      }
    }
    
    // Update bullet time system
    if (this.bulletTimeSystem.isActive) {
      this.bulletTimeSystem.currentDuration -= 16.67;
      if (this.bulletTimeSystem.currentDuration <= 0) {
        this.bulletTimeSystem.isActive = false;
        this.bulletTimeSystem.currentCooldown = this.bulletTimeSystem.cooldownTime;
        this.updateBulletTimeButton();
      }
    } else if (!this.bulletTimeSystem.isReady) {
      this.bulletTimeSystem.currentCooldown -= 16.67;
      if (this.bulletTimeSystem.currentCooldown <= 0) {
        this.bulletTimeSystem.isReady = true;
        this.updateBulletTimeButton();
      }
    }
  }

  // Weapon usage functions
  useFuel() {
    console.log('useFuel() called');
    console.log('fuelSystem.isReady:', this.fuelSystem.isReady);
    console.log('window.gameCore?.tank exists:', !!window.gameCore?.tank);
    
    if (this.fuelSystem.isReady && window.gameCore?.tank) {
      let fuelUsed = false;
      const tank = window.gameCore.tank;
      
      console.log('Tank HP:', tank.hp, '/', tank.maxHp);
      console.log('Support Tank HP:', tank.supportTank.hp, '/', tank.supportTank.maxHp);
      
      // Priority: main tank first
      if (tank.hp < tank.maxHp) {
        const oldHp = tank.hp;
        tank.heal(CONFIG.fuel.healAmount);
        console.log('Healed main tank from', oldHp, 'to', tank.hp);
        window.gameCore.showFuelMessage("Bơm máu xe tăng chính +2 ❤️");
        fuelUsed = true;
      }
      // If main tank is full, heal support tank
      else if (tank.supportTank.hp > 0 && tank.supportTank.hp < tank.supportTank.maxHp) {
        const oldHp = tank.supportTank.hp;
        tank.supportTankHeal(CONFIG.fuel.healAmount);
        console.log('Healed support tank from', oldHp, 'to', tank.supportTank.hp);
        window.gameCore.showFuelMessage("Bơm máu xe tăng nhỏ +2 💙");
        fuelUsed = true;
      } else {
        console.log('No healing needed - both tanks at full HP');
        window.gameCore.showFuelMessage("Cả hai xe tăng đều đã đầy máu! 💚");
      }
      
      // If fuel was used, start cooldown
      if (fuelUsed) {
        this.fuelSystem.isReady = false;
        this.fuelSystem.currentCooldown = this.fuelSystem.cooldownTime;
        console.log('Fuel cooldown started:', this.fuelSystem.cooldownTime, 'ms');
      }
      
      this.updateFuelButton();
    } else {
      console.log('Fuel not ready or tank not available');
      if (!this.fuelSystem.isReady) {
        console.log('Fuel cooldown remaining:', this.fuelSystem.currentCooldown, 'ms');
      }
    }
  }

  useElectricWave() {
    if (!this.electricWaveSystem.isReady || !window.gameCore?.tank) return;
    
    const tank = window.gameCore.tank;
    
    // Create new electric wave with enhanced properties
    this.electricWaveSystem.waves.push({
      x: tank.x + 30,
      y: tank.y + 35,
      worldX: tank.worldX + 30,
      worldY: tank.worldY + 35,
      radius: 0,
      maxRadius: this.electricWaveSystem.waveRadius,
      speed: this.electricWaveSystem.waveSpeed,
      damage: this.electricWaveSystem.waveDamage,
      opacity: 1,
      hitEnemies: [],
      createdTime: Date.now() // For animation timing
    });
    
    // Add initial screen shake when wave is created
    if (window.gameCore?.effectsRenderer) {
      window.gameCore.effectsRenderer.addScreenShake(5, 200);
      
      // Add initial sparkles at tank position
      window.gameCore.effectsRenderer.addSparkle(
        tank.x + 30, tank.y + 35, 
        '#8a2be2', 12
      );
    }
    
    // Show enhanced message
    if (window.gameCore) {
      window.gameCore.showGeneralMessage("⚡ SÓNG ĐIỆN KHỔNG LỒ! ⚡");
    }
    
    // Start cooldown
    this.electricWaveSystem.isReady = false;
    this.electricWaveSystem.currentCooldown = this.electricWaveSystem.cooldownTime;
    this.updateElectricWaveButton();
  }

  useMissile() {
    if (!this.missileSystem.isReady || !window.gameCore?.tank) return;
    
    const tank = window.gameCore.tank;
    
    // Create new missile
    this.missileSystem.missiles.push({
      x: tank.x + 30,
      y: tank.y + 35,
      worldX: tank.worldX + 30,
      worldY: tank.worldY + 35,
      vx: 0,
      vy: -this.missileSystem.missileSpeed,
      target: null,
      hasExploded: false,
      trailPoints: []
    });
    
    // Start cooldown
    this.missileSystem.isReady = false;
    this.missileSystem.currentCooldown = this.missileSystem.cooldownTime;
    this.updateMissileButton();
  }

  useBulletTime() {
    if (this.bulletTimeSystem.isReady && !this.bulletTimeSystem.isActive) {
      this.bulletTimeSystem.isActive = true;
      this.bulletTimeSystem.isReady = false;
      this.bulletTimeSystem.currentDuration = this.bulletTimeSystem.duration;
      
      // Update button interface
      this.updateBulletTimeButton();
      
      // Show message
      if (window.gameCore) {
        window.gameCore.showBulletTimeMessage("🔴 Bắn laser kích hoạt!");
      }
    }
  }

  // Button update functions
  updateFuelButton() {
    if (!window.gameCore?.tank || !this.fuelBtn) return;
    
    const tank = window.gameCore.tank;
    // Check if can refuel main tank or support tank
    const canRefuelMainTank = tank.hp < tank.maxHp;
    const canRefuelSupportTank = tank.supportTank.hp > 0 && tank.supportTank.hp < tank.supportTank.maxHp;
    
    if (this.fuelSystem.isReady && (canRefuelMainTank || canRefuelSupportTank)) {
      this.fuelBtn.classList.remove('disabled');
      this.fuelBtn.style.opacity = '1';
    } else {
      this.fuelBtn.classList.add('disabled');
      this.fuelBtn.style.opacity = '0.5';
    }
  }

  updateElectricWaveButton() {
    if (!this.electricWaveBtn) return;
    
    if (this.electricWaveSystem.isReady) {
      this.electricWaveBtn.classList.remove('disabled');
      this.electricWaveBtn.classList.remove('cooldown');
      this.electricWaveBtn.style.opacity = '1';
    } else {
      this.electricWaveBtn.classList.add('disabled');
      this.electricWaveBtn.classList.add('cooldown');
      this.electricWaveBtn.style.opacity = '0.5';
    }
  }

  updateMissileButton() {
    if (!this.missileBtn) return;
    
    if (this.missileSystem.isReady) {
      this.missileBtn.classList.remove('disabled');
      this.missileBtn.classList.remove('cooldown');
      this.missileBtn.style.opacity = '1';
    } else {
      this.missileBtn.classList.add('disabled');
      this.missileBtn.classList.add('cooldown');
      this.missileBtn.style.opacity = '0.5';
    }
  }

  updateBulletTimeButton() {
    if (!this.bulletTimeBtn) return;
    
    if (this.bulletTimeSystem.isActive) {
      this.bulletTimeBtn.classList.add('active');
      this.bulletTimeBtn.classList.remove('disabled');
      this.bulletTimeBtn.style.opacity = '1';
    } else if (this.bulletTimeSystem.isReady) {
      this.bulletTimeBtn.classList.remove('active');
      this.bulletTimeBtn.classList.remove('disabled');
      this.bulletTimeBtn.style.opacity = '1';
    } else {
      this.bulletTimeBtn.classList.remove('active');
      this.bulletTimeBtn.classList.add('disabled');
      this.bulletTimeBtn.style.opacity = '0.5';
    }
  }

  updateAllButtons() {
    this.updateFuelButton();
    this.updateElectricWaveButton();
    this.updateMissileButton();
    this.updateBulletTimeButton();
  }

  reset() {
    // Reset fuel system
    this.fuelSystem.isReady = true;
    this.fuelSystem.currentCooldown = 0;
    
    // Reset electric wave system
    this.electricWaveSystem.isReady = true;
    this.electricWaveSystem.currentCooldown = 0;
    this.electricWaveSystem.waves = [];
    
    // Reset missile system
    this.missileSystem.isReady = true;
    this.missileSystem.currentCooldown = 0;
    this.missileSystem.missiles = [];
    
    // Reset bullet time system
    this.bulletTimeSystem.isActive = false;
    this.bulletTimeSystem.isReady = true;
    this.bulletTimeSystem.currentDuration = 0;
    this.bulletTimeSystem.currentCooldown = 0;
    
    this.updateAllButtons();
  }

  // Getters for external access
  getEffects() {
    return {
      electricWaves: this.electricWaveSystem.waves,
      missiles: this.missileSystem.missiles,
      bulletTimeActive: this.bulletTimeSystem.isActive
    };
  }

  getSystemStates() {
    return {
      fuel: {
        isReady: this.fuelSystem.isReady,
        cooldown: this.fuelSystem.currentCooldown
      },
      electricWave: {
        isReady: this.electricWaveSystem.isReady,
        cooldown: this.electricWaveSystem.currentCooldown
      },
      missile: {
        isReady: this.missileSystem.isReady,
        cooldown: this.missileSystem.currentCooldown
      },
      bulletTime: {
        isActive: this.bulletTimeSystem.isActive,
        isReady: this.bulletTimeSystem.isReady,
        duration: this.bulletTimeSystem.currentDuration,
        cooldown: this.bulletTimeSystem.currentCooldown
      }
    };
  }
}