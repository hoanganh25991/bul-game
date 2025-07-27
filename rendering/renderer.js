import { CONFIG } from '../config.js';
import { MathUtils } from '../utils/math-utils.js';

export class Renderer {
  constructor(ctx, scaleFactor) {
    this.ctx = ctx;
    this.scaleFactor = scaleFactor;
  }

  updateScale(scaleFactor) {
    this.scaleFactor = scaleFactor;
  }

  render(worldSystem, cameraSystem, tank, enemies, bullets, weapons, enemyBullets = [], items = null, bosses = null) {
    // Draw terrain and decorations
    this.drawTerrain(worldSystem, cameraSystem);
    this.drawDecorations(worldSystem, cameraSystem);
    
    // Draw game entities
    this.drawTank(tank.x, tank.y, CONFIG.colors.tank.main, CONFIG.colors.tank.turret, false, tank.hp, tank.maxHp, tank.angle, tank.turretAngle);
    this.drawSupportTank(tank.getSupportTank());
    
    // Draw enemies
    enemies.forEach(enemy => {
      this.drawTank(enemy.x, enemy.y, CONFIG.colors.enemy.main, CONFIG.colors.enemy.turret, true, enemy.hp, enemy.maxHp);
    });
    
    // Draw bosses
    if (bosses) {
      bosses.getBosses().forEach(boss => {
        this.drawBoss(boss);
      });
    }
    
    // Draw bullets
    bullets.getBullets().forEach(bullet => {
      this.drawBullet(bullet, CONFIG.colors.bullet);
    });
    
    bullets.getSupportBullets().forEach(bullet => {
      this.drawBullet(bullet, CONFIG.colors.supportBullet);
    });
    
    // Draw enemy bullets
    if (enemyBullets.length > 0) {
      console.log('Rendering', enemyBullets.length, 'enemy bullets');
    }
    enemyBullets.forEach(bullet => {
      this.drawBullet(bullet, CONFIG.colors.enemyBullet);
    });
    
    // Draw boss bullets
    if (bosses) {
      bosses.getBossBullets().forEach(bullet => {
        this.drawBossBullet(bullet);
      });
    }
    
    // Draw boss explosions
    if (bosses) {
      bosses.getExplosions().forEach(explosion => {
        this.drawBossExplosion(explosion);
      });
    }
    
    // Draw items
    if (items) {
      items.getItems().forEach(item => {
        this.drawItem(item);
      });
    }
    
    // Draw weapon effects
    this.drawWeaponEffects(weapons);
    
    // Draw boss effects
    if (bosses) {
      this.drawBossEffects(bosses);
    }
    
    // Draw auto-aim indicators
    if (CONFIG.tank.autoAim && CONFIG.tank.autoAimVisualIndicators) {
      this.drawAutoAimIndicators(tank, enemies);
    }
  }

  drawTerrain(worldSystem, cameraSystem) {
    const visibleTerrain = worldSystem.getVisibleTerrain(cameraSystem);
    
    // Draw terrain
    for (let x = visibleTerrain.startTileX; x < visibleTerrain.endTileX; x++) {
      for (let y = visibleTerrain.startTileY; y < visibleTerrain.endTileY; y++) {
        let key = `${x},${y}`;
        let terrain = visibleTerrain.terrain[key];
        if (terrain) {
          // Convert world position to screen position
          let worldTileX = x * worldSystem.tileSize;
          let worldTileY = y * worldSystem.tileSize;
          let screenPos = cameraSystem.worldToScreen(worldTileX, worldTileY);
          let screenX = screenPos.x;
          let screenY = screenPos.y;
          
          switch (terrain.type) {
            case 'grass':
              this.ctx.fillStyle = CONFIG.colors.terrain.grass;
              break;
            case 'dirt':
              this.ctx.fillStyle = CONFIG.colors.terrain.dirt;
              break;
            case 'stone':
              this.ctx.fillStyle = CONFIG.colors.terrain.stone;
              break;
          }
          this.ctx.fillRect(screenX, screenY, worldSystem.tileSize, worldSystem.tileSize);
        }
      }
    }
  }

  drawDecorations(worldSystem, cameraSystem) {
    const visibleDecorations = worldSystem.getVisibleDecorations(cameraSystem);
    
    for (let decoration of visibleDecorations) {
      let screenPos = cameraSystem.worldToScreen(decoration.x, decoration.y);
      let screenX = screenPos.x;
      let screenY = screenPos.y;
      
      this.ctx.save();
      let size = decoration.size * 20;
      
      switch (decoration.type) {
        case 'grass_tuft':
          this.ctx.fillStyle = '#228B22';
          this.ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            let angle = (i / 5) * Math.PI * 2;
            let x = screenX + Math.cos(angle) * size * 0.3;
            let y = screenY + Math.sin(angle) * size * 0.2;
            this.ctx.lineTo(x, y);
          }
          this.ctx.fill();
          break;
          
        case 'small_rock':
          this.ctx.fillStyle = '#A0A0A0';
          this.ctx.beginPath();
          this.ctx.arc(screenX, screenY, size * 0.4, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#808080';
          this.ctx.beginPath();
          this.ctx.arc(screenX - size * 0.1, screenY - size * 0.1, size * 0.2, 0, Math.PI * 2);
          this.ctx.fill();
          break;
          
        case 'tree':
          // Tree trunk
          this.ctx.fillStyle = '#8B4513';
          this.ctx.fillRect(screenX - size * 0.1, screenY - size * 0.3, size * 0.2, size * 0.6);
          // Tree leaves
          this.ctx.fillStyle = '#228B22';
          this.ctx.beginPath();
          this.ctx.arc(screenX, screenY - size * 0.3, size * 0.4, 0, Math.PI * 2);
          this.ctx.fill();
          break;
          
        case 'bush':
          this.ctx.fillStyle = '#32CD32';
          this.ctx.beginPath();
          this.ctx.arc(screenX, screenY, size * 0.3, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#228B22';
          this.ctx.beginPath();
          this.ctx.arc(screenX - size * 0.1, screenY - size * 0.1, size * 0.2, 0, Math.PI * 2);
          this.ctx.fill();
          break;
      }
      this.ctx.restore();
    }
  }

  drawTank(x, y, color = CONFIG.colors.tank.main, turretColor = CONFIG.colors.tank.turret, isEnemy = false, hp, maxHp, angle = 0, turretAngle = 0) {
    this.ctx.save();
    
    // Draw health bar if hp and maxHp are provided
    if (typeof hp === 'number' && typeof maxHp === 'number') {
      const healthBarWidth = isEnemy ? 40 : 50;
      const healthBarHeight = isEnemy ? 6 : 8;
      const healthBarY = y - (isEnemy ? 18 : 22);
      
      this.ctx.strokeStyle = CONFIG.colors.ui.text;
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(x + (60 - healthBarWidth) / 2, healthBarY, healthBarWidth, healthBarHeight);
      
      // Background health bar
      this.ctx.fillStyle = CONFIG.colors.ui.health.low;
      this.ctx.fillRect(x + (60 - healthBarWidth) / 2, healthBarY, healthBarWidth, healthBarHeight);
      
      // Health bar color based on percentage
      let percent = Math.max(0, Math.min(1, hp / maxHp));
      if (percent > 0.6) this.ctx.fillStyle = CONFIG.colors.ui.health.high;
      else if (percent > 0.3) this.ctx.fillStyle = CONFIG.colors.ui.health.medium;
      else this.ctx.fillStyle = CONFIG.colors.ui.health.low;
      this.ctx.fillRect(x + (60 - healthBarWidth) / 2, healthBarY, healthBarWidth * percent, healthBarHeight);
    }
    
    const centerX = x + 30;
    const centerY = y + 35;  
    
    // Tank tracks/treads
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x + 5, y + 15, 50, 35);
    this.ctx.fillRect(x + 10, y + 10, 40, 45);
    
    // Track details
    this.ctx.fillStyle = '#444';
    for (let i = 0; i < 6; i++) {
      this.ctx.fillRect(x + 8 + i * 7, y + 12, 4, 41);
    }
    
    // Main tank body (hull)
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x + 12, y + 20, 36, 25);
    
    // Body shading
    const gradient = this.ctx.createLinearGradient(x + 12, y + 20, x + 48, y + 45);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, MathUtils.darkenColor(color, -40));
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x + 12, y + 20, 36, 25);
    
    // Hull details
    this.ctx.fillStyle = MathUtils.darkenColor(color, -20);
    this.ctx.fillRect(x + 15, y + 23, 30, 3);
    this.ctx.fillRect(x + 15, y + 39, 30, 3);
    
    // Turret base
    this.ctx.fillStyle = turretColor;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - 5, 18, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Turret top
    this.ctx.fillStyle = turretColor;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - 8, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Turret shading
    const turretGradient = this.ctx.createRadialGradient(centerX - 5, centerY - 10, 0, centerX, centerY - 8, 15);
    turretGradient.addColorStop(0, turretColor);
    turretGradient.addColorStop(1, MathUtils.darkenColor(turretColor, -30));
    this.ctx.fillStyle = turretGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - 8, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Main cannon (rotated based on turret angle)
    this.ctx.save();
    this.ctx.translate(centerX, centerY - 8);
    this.ctx.rotate(turretAngle);
    
    // Cannon barrel
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(-2, -24, 4, 32);
    
    // Cannon tip
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(-1.5, -24, 3, 4);
    
    // Cannon details
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-2.5, 0, 5, 8);
    
    this.ctx.restore();
    
    // Road wheels (improved)
    this.ctx.fillStyle = '#1a1a1a';
    const wheelPositions = [x + 18, x + 30, x + 42];
    wheelPositions.forEach(wheelX => {
      // Outer wheel
      this.ctx.beginPath();
      this.ctx.arc(wheelX, y + 52, 7, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Wheel rim
      this.ctx.fillStyle = '#333';
      this.ctx.beginPath();
      this.ctx.arc(wheelX, y + 52, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Wheel center
      this.ctx.fillStyle = '#555';
      this.ctx.beginPath();
      this.ctx.arc(wheelX, y + 52, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#1a1a1a';
    });
    
    // Drive sprockets (front and back)
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.beginPath();
    this.ctx.arc(x + 8, y + 52, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(x + 52, y + 52, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Antenna (for main tank only)
    if (!isEnemy && color === CONFIG.colors.tank.main) {
      this.ctx.strokeStyle = '#666';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX + 10, centerY - 8);
      this.ctx.lineTo(centerX + 15, centerY - 18);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  drawSupportTank(supportTank) {
    const { x, y, hp, maxHp } = supportTank;
    const color = CONFIG.colors.supportTank.main;
    const turretColor = CONFIG.colors.supportTank.turret;
    
    this.ctx.save();
    
    // Draw health bar if hp and maxHp are provided
    if (typeof hp === 'number' && typeof maxHp === 'number') {
      this.ctx.strokeStyle = CONFIG.colors.ui.text;
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(x + 3, y - 12, 30, 5);
      // Background health bar
      this.ctx.fillStyle = CONFIG.colors.ui.health.low;
      this.ctx.fillRect(x + 3, y - 12, 30, 5);
      // Change health bar color based on percentage
      let percent = Math.max(0, Math.min(1, hp / maxHp));
      if (percent > 0.6) this.ctx.fillStyle = CONFIG.colors.ui.health.high;
      else if (percent > 0.3) this.ctx.fillStyle = CONFIG.colors.ui.health.medium;
      else this.ctx.fillStyle = CONFIG.colors.ui.health.low;
      this.ctx.fillRect(x + 3, y - 12, 30 * percent, 5);
    }
    
    const centerX = x + 18;
    const centerY = y + 21;
    
    // Tank tracks/treads (smaller)
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x + 3, y + 9, 30, 21);
    this.ctx.fillRect(x + 6, y + 6, 24, 27);
    
    // Track details
    this.ctx.fillStyle = '#444';
    for (let i = 0; i < 4; i++) {
      this.ctx.fillRect(x + 5 + i * 5, y + 8, 3, 25);
    }
    
    // Main tank body (hull) - smaller
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x + 7, y + 12, 22, 15);
    
    // Body shading
    const gradient = this.ctx.createLinearGradient(x + 7, y + 12, x + 29, y + 27);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, MathUtils.darkenColor(color, -40));
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x + 7, y + 12, 22, 15);
    
    // Hull details
    this.ctx.fillStyle = MathUtils.darkenColor(color, -20);
    this.ctx.fillRect(x + 9, y + 14, 18, 2);
    this.ctx.fillRect(x + 9, y + 23, 18, 2);
    
    // Turret base (smaller)
    this.ctx.fillStyle = turretColor;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - 3, 11, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Turret top (smaller)
    this.ctx.fillStyle = turretColor;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - 5, 9, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Turret shading
    const turretGradient = this.ctx.createRadialGradient(centerX - 3, centerY - 6, 0, centerX, centerY - 5, 9);
    turretGradient.addColorStop(0, turretColor);
    turretGradient.addColorStop(1, MathUtils.darkenColor(turretColor, -30));
    this.ctx.fillStyle = turretGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - 5, 9, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Main cannon (smaller)
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(centerX - 1.5, y - 7, 3, 19);
    
    // Cannon tip
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(centerX - 1, y - 7, 2, 3);
    
    // Cannon details
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(centerX - 2, y + 5, 4, 5);
    
    // Road wheels (smaller)
    this.ctx.fillStyle = '#1a1a1a';
    const wheelPositions = [x + 11, x + 25];
    wheelPositions.forEach(wheelX => {
      // Outer wheel
      this.ctx.beginPath();
      this.ctx.arc(wheelX, y + 31, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Wheel rim
      this.ctx.fillStyle = '#333';
      this.ctx.beginPath();
      this.ctx.arc(wheelX, y + 31, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Wheel center
      this.ctx.fillStyle = '#555';
      this.ctx.beginPath();
      this.ctx.arc(wheelX, y + 31, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#1a1a1a';
    });
    
    // Drive sprockets (smaller)
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.beginPath();
    this.ctx.arc(x + 5, y + 31, 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(x + 31, y + 31, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  drawBullet(bullet, color = CONFIG.colors.bullet) {
    // If it's a laser, draw laser beam instead of round bullet
    if (bullet.isLaser) {
      this.drawLaser(bullet);
    } else if (bullet.isTriangular) {
      this.drawTriangularBullet(bullet);
    } else {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      const bulletRadius = MathUtils.getScaledSize(CONFIG.bullets.radius, this.scaleFactor);
      this.ctx.arc(bullet.x, bullet.y, bulletRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawTriangularBullet(bullet) {
    this.ctx.save();
    this.ctx.fillStyle = CONFIG.colors.triangularBullet;
    
    const size = MathUtils.getScaledSize(CONFIG.bullets.triangularSize, this.scaleFactor);
    
    // Calculate rotation angle based on bullet direction
    const angle = Math.atan2(bullet.dy, bullet.dx) + Math.PI / 2;
    
    this.ctx.translate(bullet.x, bullet.y);
    this.ctx.rotate(angle);
    
    // Draw triangle
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size);
    this.ctx.lineTo(-size * 0.6, size * 0.5);
    this.ctx.lineTo(size * 0.6, size * 0.5);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Add glow effect
    this.ctx.shadowColor = CONFIG.colors.triangularBullet;
    this.ctx.shadowBlur = 8;
    this.ctx.fill();
    
    this.ctx.restore();
  }

  drawItem(item) {
    this.ctx.save();
    
    switch (item.type) {
      case 'triangular_bullets':
        this.drawTriangularBulletsItem(item);
        break;
    }
    
    this.ctx.restore();
  }

  drawTriangularBulletsItem(item) {
    const size = 25;
    const time = Date.now() * 0.005;
    
    // Floating animation
    const floatOffset = Math.sin(time + item.x * 0.01) * 3;
    const y = item.y + floatOffset;
    
    // Rotation animation
    const rotation = time * 2;
    
    // Draw glow effect
    this.ctx.shadowColor = CONFIG.colors.items.triangularBullets;
    this.ctx.shadowBlur = 15;
    
    // Draw outer cage (lồng pháo)
    this.ctx.strokeStyle = CONFIG.colors.items.triangularBullets;
    this.ctx.lineWidth = 3;
    this.ctx.translate(item.x, y);
    this.ctx.rotate(rotation);
    
    // Draw cage bars (vertical)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x1 = Math.cos(angle) * size * 0.8;
      const y1 = Math.sin(angle) * size * 0.8;
      const x2 = Math.cos(angle) * size * 1.2;
      const y2 = Math.sin(angle) * size * 1.2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1 - size * 0.3);
      this.ctx.lineTo(x1, y1 + size * 0.3);
      this.ctx.stroke();
    }
    
    // Draw cage rings (horizontal)
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.2, size, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(0, size * 0.2, size, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw triangular bullet inside cage
    this.ctx.fillStyle = CONFIG.colors.triangularBullet;
    this.ctx.shadowBlur = 8;
    
    // Draw triangle
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size * 0.4);
    this.ctx.lineTo(-size * 0.3, size * 0.2);
    this.ctx.lineTo(size * 0.3, size * 0.2);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawLaser(bullet) {
    this.ctx.save();
    
    // Calculate starting point from tank center (middle of main gun)
    const startX = bullet.x;
    const startY = bullet.y;
    
    // Calculate laser direction based on bullet velocity
    const laserLength = window.innerHeight + 100; // Laser length to end of screen
    const bulletSpeed = Math.sqrt(bullet.dx * bullet.dx + bullet.dy * bullet.dy);
    const directionX = bulletSpeed > 0 ? bullet.dx / bulletSpeed : 0;
    const directionY = bulletSpeed > 0 ? bullet.dy / bulletSpeed : -1;
    
    // Calculate end point of laser beam
    const endX = startX + directionX * laserLength;
    const endY = startY + directionY * laserLength;
    
    // Draw outer laser beam (dark blue with glow effect)
    this.ctx.strokeStyle = CONFIG.colors.laser.outer;
    this.ctx.lineWidth = 12;
    this.ctx.lineCap = 'round';
    this.ctx.shadowColor = CONFIG.colors.laser.outer;
    this.ctx.shadowBlur = 20;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    // Draw middle laser beam (bright blue)
    this.ctx.strokeStyle = CONFIG.colors.laser.middle;
    this.ctx.lineWidth = 8;
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    // Draw laser core (white)
    this.ctx.strokeStyle = CONFIG.colors.laser.core;
    this.ctx.lineWidth = 4;
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    // Draw sparkle effects along the laser beam
    for (let i = 0; i < 8; i++) {
      const sparkDistance = i * 80 + Math.random() * 60;
      const sparkX = startX + directionX * sparkDistance + (Math.random() - 0.5) * 20;
      const sparkY = startY + directionY * sparkDistance + (Math.random() - 0.5) * 20;
      
      this.ctx.fillStyle = CONFIG.colors.laser.core;
      this.ctx.shadowColor = CONFIG.colors.laser.middle;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(sparkX, sparkY, 1 + Math.random() * 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Draw energy effect at gun tip (positioned at the center of the tank's main gun)
    this.ctx.fillStyle = CONFIG.colors.laser.core;
    this.ctx.shadowColor = CONFIG.colors.laser.middle;
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(startX, startY, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  drawWeaponEffects(weapons) {
    const effects = weapons.getEffects();
    
    // Draw electric waves
    effects.electricWaves.forEach(wave => {
      this.ctx.save();
      this.ctx.strokeStyle = CONFIG.colors.electricWave;
      this.ctx.lineWidth = 3;
      this.ctx.globalAlpha = wave.opacity;
      this.ctx.beginPath();
      this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    });
    
    // Draw missiles
    effects.missiles.forEach(missile => {
      // Draw missile trail
      if (missile.trailPoints.length > 1) {
        this.ctx.save();
        this.ctx.strokeStyle = CONFIG.colors.missile;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.6;
        this.ctx.beginPath();
        this.ctx.moveTo(missile.trailPoints[0].x, missile.trailPoints[0].y);
        for (let point of missile.trailPoints) {
          this.ctx.lineTo(point.x, point.y);
        }
        this.ctx.stroke();
        this.ctx.restore();
      }
      
      // Draw missile
      this.ctx.save();
      this.ctx.fillStyle = CONFIG.colors.missile;
      this.ctx.beginPath();
      this.ctx.arc(missile.x, missile.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawExplosion(x, y) {
    this.ctx.save();
    const explosionCenterX = MathUtils.getScaledSize(30, this.scaleFactor);
    const explosionCenterY = MathUtils.getScaledSize(35, this.scaleFactor);
    const outerRadius = MathUtils.getScaledSize(25, this.scaleFactor);
    const innerRadius = MathUtils.getScaledSize(12, this.scaleFactor);
    
    this.ctx.beginPath();
    this.ctx.arc(x + explosionCenterX, y + explosionCenterY, outerRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'orange';
    this.ctx.globalAlpha = 0.7;
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(x + explosionCenterX, y + explosionCenterY, innerRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'yellow';
    this.ctx.globalAlpha = 0.9;
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  drawAutoAimIndicators(tank, enemies) {
    if (!enemies || enemies.length === 0) return;
    
    this.ctx.save();
    
    // Find the nearest enemy for main tank
    const nearestEnemy = tank.findNearestEnemy(enemies);
    if (nearestEnemy) {
      // Draw targeting reticle on nearest enemy
      this.drawTargetingReticle(nearestEnemy.x + 30, nearestEnemy.y + 35, '#ffeb3b', 'Main');
      
      // Draw aim line from tank to target
      this.drawAimLine(tank.x + 30, tank.y + 35, nearestEnemy.x + 30, nearestEnemy.y + 35, '#ffeb3b');
    }
    
    // Find the nearest enemy for support tank
    const supportTank = tank.getSupportTank();
    const nearestEnemyForSupport = tank.findNearestEnemyForSupport(enemies);
    if (nearestEnemyForSupport && supportTank.hp > 0) {
      // Draw targeting reticle on nearest enemy for support tank
      this.drawTargetingReticle(nearestEnemyForSupport.x + 30, nearestEnemyForSupport.y + 35, '#2196f3', 'Support');
      
      // Draw aim line from support tank to target
      this.drawAimLine(supportTank.x + 18, supportTank.y + 18, nearestEnemyForSupport.x + 30, nearestEnemyForSupport.y + 35, '#2196f3');
    }
    
    this.ctx.restore();
  }

  drawTargetingReticle(x, y, color, type) {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.8;
    
    const size = 25;
    const innerSize = 8;
    
    // Draw outer circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw inner circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, innerSize, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw crosshairs
    this.ctx.beginPath();
    // Top
    this.ctx.moveTo(x, y - size - 5);
    this.ctx.lineTo(x, y - size + 5);
    // Bottom
    this.ctx.moveTo(x, y + size - 5);
    this.ctx.lineTo(x, y + size + 5);
    // Left
    this.ctx.moveTo(x - size - 5, y);
    this.ctx.lineTo(x - size + 5, y);
    // Right
    this.ctx.moveTo(x + size - 5, y);
    this.ctx.lineTo(x + size + 5, y);
    this.ctx.stroke();
    
    // Draw label
    this.ctx.fillStyle = color;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(type, x, y - size - 15);
    
    this.ctx.restore();
  }

  drawAimLine(fromX, fromY, toX, toY, color) {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.4;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  drawBoss(boss) {
    this.ctx.save();
    
    // Calculate boss size
    const bossSize = 60 * boss.size;
    const centerX = boss.x + bossSize / 2;
    const centerY = boss.y + bossSize / 2;
    
    // Draw boss name above health bar
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(boss.type, centerX, boss.y - 35);
    
    // Draw health bar
    const healthBarWidth = bossSize * 0.8;
    const healthBarHeight = 8;
    const healthBarY = boss.y - 25;
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(centerX - healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    
    // Background health bar
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(centerX - healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    
    // Health bar color based on percentage
    let percent = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
    if (percent > 0.6) this.ctx.fillStyle = '#76ff03';
    else if (percent > 0.3) this.ctx.fillStyle = '#ffeb3b';
    else this.ctx.fillStyle = '#f44336';
    this.ctx.fillRect(centerX - healthBarWidth / 2, healthBarY, healthBarWidth * percent, healthBarHeight);
    
    // Draw shield effect if active
    if (boss.shieldActive) {
      this.ctx.strokeStyle = '#00CED1';
      this.ctx.lineWidth = 4;
      this.ctx.globalAlpha = 0.7;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, bossSize / 2 + 10, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
    }
    
    // Draw boss tank (scaled up)
    this.ctx.scale(boss.size, boss.size);
    const scaledX = boss.x / boss.size;
    const scaledY = boss.y / boss.size;
    
    this.drawTank(scaledX, scaledY, boss.color, boss.turretColor, true, boss.hp, boss.maxHp, boss.angle, boss.turretAngle);
    
    this.ctx.restore();
    
    // Draw special ability indicators
    this.drawBossAbilityIndicators(boss, centerX, centerY);
  }

  drawBossAbilityIndicators(boss, centerX, centerY) {
    this.ctx.save();
    
    // Draw rapid fire indicator
    if (boss.rapidFireActive) {
      this.ctx.fillStyle = '#ff6b35';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('RAPID FIRE!', centerX, centerY - 40);
    }
    
    // Draw electric burst charging indicator
    if (boss.specialAbility === 'electric_burst' && boss.specialCooldown <= 60 && boss.specialCooldown > 0) {
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 3;
      this.ctx.globalAlpha = 0.8;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
    }
    
    this.ctx.restore();
  }

  drawBossBullet(bullet) {
    this.ctx.save();
    
    if (bullet.isExplosive) {
      // Draw explosive bullet
      this.ctx.fillStyle = '#ff5722';
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, 8, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw explosive glow
      this.ctx.shadowColor = '#ff5722';
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = '#ffab00';
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Draw normal boss bullet (larger than regular enemy bullets)
      this.ctx.fillStyle = '#8B0000';
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }

  drawBossExplosion(explosion) {
    this.ctx.save();
    
    const progress = 1 - (explosion.duration / explosion.maxDuration);
    const currentRadius = explosion.radius * progress;
    const alpha = explosion.duration / explosion.maxDuration;
    
    // Outer explosion
    this.ctx.globalAlpha = alpha * 0.7;
    this.ctx.fillStyle = '#ff5722';
    this.ctx.beginPath();
    this.ctx.arc(explosion.x, explosion.y, currentRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Inner explosion
    this.ctx.globalAlpha = alpha * 0.9;
    this.ctx.fillStyle = '#ffab00';
    this.ctx.beginPath();
    this.ctx.arc(explosion.x, explosion.y, currentRadius * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Core explosion
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(explosion.x, explosion.y, currentRadius * 0.3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  drawBossEffects(bosses) {
    this.ctx.save();
    
    bosses.getBosses().forEach(boss => {
      // Draw electric burst effect
      if (boss.electricBurstEffect && boss.electricBurstEffect.active) {
        const centerX = boss.x + (60 * boss.size) / 2;
        const centerY = boss.y + (60 * boss.size) / 2;
        
        // Draw lightning bolt to target
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 4;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        
        // Create zigzag lightning effect
        const dx = boss.electricBurstEffect.targetX - boss.worldX;
        const dy = boss.electricBurstEffect.targetY - boss.worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = 8;
        
        for (let i = 1; i <= steps; i++) {
          const progress = i / steps;
          const x = centerX + (dx * progress) + (Math.random() - 0.5) * 20;
          const y = centerY + (dy * progress) + (Math.random() - 0.5) * 20;
          this.ctx.lineTo(x, y);
        }
        
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
        
        // Decrease effect duration
        boss.electricBurstEffect.duration--;
        if (boss.electricBurstEffect.duration <= 0) {
          boss.electricBurstEffect.active = false;
        }
      }
    });
    
    this.ctx.restore();
  }
}