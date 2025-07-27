import { CONFIG } from '../config.js';
import { MathUtils } from '../utils/math-utils.js';

export class EffectsRenderer {
  constructor(ctx, scaleFactor) {
    this.ctx = ctx;
    this.scaleFactor = scaleFactor;
    this.explosions = [];
    this.sparkles = [];
    this.screenShake = { intensity: 0, duration: 0 };
  }

  updateScale(scaleFactor) {
    this.scaleFactor = scaleFactor;
  }

  render(weaponEffects) {
    // Update and render explosions
    this.updateExplosions();
    this.renderExplosions();
    
    // Update and render sparkles
    this.updateSparkles();
    this.renderSparkles();
    
    // Apply screen shake if active
    this.applyScreenShake();
    
    // Render weapon-specific effects
    this.renderWeaponEffects(weaponEffects);
  }

  addExplosion(x, y, size = 'medium', color = 'orange') {
    const explosion = {
      x: x,
      y: y,
      radius: 0,
      maxRadius: this.getExplosionSize(size),
      color: color,
      opacity: 1,
      particles: this.createExplosionParticles(x, y, size)
    };
    this.explosions.push(explosion);
    
    // Add screen shake for larger explosions
    if (size === 'large') {
      this.addScreenShake(8, 300);
    } else if (size === 'medium') {
      this.addScreenShake(4, 200);
    }
  }

  getExplosionSize(size) {
    const baseSize = {
      small: 20,
      medium: 40,
      large: 80
    };
    return MathUtils.getScaledSize(baseSize[size] || baseSize.medium, this.scaleFactor);
  }

  createExplosionParticles(x, y, size) {
    const particleCount = size === 'large' ? 20 : size === 'medium' ? 12 : 8;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00'
      });
    }
    
    return particles;
  }

  updateExplosions() {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      
      // Update explosion radius
      explosion.radius += explosion.maxRadius * 0.1;
      explosion.opacity -= 0.05;
      
      // Update particles
      for (let j = explosion.particles.length - 1; j >= 0; j--) {
        const particle = explosion.particles[j];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= particle.decay;
        particle.vx *= 0.98; // Air resistance
        particle.vy *= 0.98;
        
        if (particle.life <= 0) {
          explosion.particles.splice(j, 1);
        }
      }
      
      // Remove explosion when done
      if (explosion.opacity <= 0 && explosion.particles.length === 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  renderExplosions() {
    for (const explosion of this.explosions) {
      this.ctx.save();
      
      // Draw main explosion circle
      if (explosion.opacity > 0) {
        this.ctx.globalAlpha = explosion.opacity;
        this.ctx.fillStyle = explosion.color;
        this.ctx.beginPath();
        this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner bright core
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(explosion.x, explosion.y, explosion.radius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // Draw particles
      for (const particle of explosion.particles) {
        this.ctx.globalAlpha = particle.life;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    }
  }

  addSparkle(x, y, color = '#ffffff', count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.sparkles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.03 + Math.random() * 0.02,
        size: 1 + Math.random() * 2,
        color: color
      });
    }
  }

  updateSparkles() {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sparkle = this.sparkles[i];
      sparkle.x += sparkle.vx;
      sparkle.y += sparkle.vy;
      sparkle.life -= sparkle.decay;
      sparkle.vx *= 0.95;
      sparkle.vy *= 0.95;
      
      if (sparkle.life <= 0) {
        this.sparkles.splice(i, 1);
      }
    }
  }

  renderSparkles() {
    this.ctx.save();
    for (const sparkle of this.sparkles) {
      this.ctx.globalAlpha = sparkle.life;
      this.ctx.fillStyle = sparkle.color;
      this.ctx.shadowColor = sparkle.color;
      this.ctx.shadowBlur = 5;
      this.ctx.beginPath();
      this.ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  addScreenShake(intensity, duration) {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    this.screenShake.duration = Math.max(this.screenShake.duration, duration);
  }

  applyScreenShake() {
    if (this.screenShake.duration > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
      const shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
      
      this.ctx.save();
      this.ctx.translate(shakeX, shakeY);
      
      this.screenShake.duration -= 16.67; // Assuming 60 FPS
      this.screenShake.intensity *= 0.95; // Fade out shake
      
      if (this.screenShake.duration <= 0) {
        this.screenShake.intensity = 0;
      }
    }
  }

  renderWeaponEffects(weaponEffects) {
    // Render electric wave effects
    if (weaponEffects.electricWaves) {
      for (const wave of weaponEffects.electricWaves) {
        this.renderElectricWave(wave);
      }
    }
    
    // Render missile effects
    if (weaponEffects.missiles) {
      for (const missile of weaponEffects.missiles) {
        this.renderMissileEffects(missile);
      }
    }
    
    // Render bullet time effects
    if (weaponEffects.bulletTimeActive) {
      this.renderBulletTimeEffects();
    }
  }

  renderElectricWave(wave) {
    this.ctx.save();
    
    // Multiple wave rings for more impressive effect
    const ringCount = 3;
    for (let ring = 0; ring < ringCount; ring++) {
      const ringRadius = wave.radius - (ring * 15);
      if (ringRadius <= 0) continue;
      
      // Main wave circle with gradient effect
      this.ctx.strokeStyle = ring === 0 ? CONFIG.colors.electricWave : 
                           ring === 1 ? '#aa2bff' : '#6600cc';
      this.ctx.lineWidth = ring === 0 ? 5 : ring === 1 ? 3 : 2;
      this.ctx.globalAlpha = wave.opacity * (1 - ring * 0.2);
      this.ctx.shadowColor = CONFIG.colors.electricWave;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(wave.x, wave.y, ringRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // Electric arcs - more and more dynamic
    if (wave.opacity > 0.3) {
      this.ctx.strokeStyle = '#00ffff';
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = wave.opacity * 0.8;
      this.ctx.shadowColor = '#00ffff';
      this.ctx.shadowBlur = 5;
      
      // More electric arcs for bigger wave
      const arcCount = Math.min(16, Math.floor(wave.radius / 20));
      for (let i = 0; i < arcCount; i++) {
        const angle = (i / arcCount) * Math.PI * 2 + Date.now() * 0.01;
        const innerRadius = wave.radius * 0.7;
        const outerRadius = wave.radius * 1.3;
        
        // Add some randomness to make it look more electric
        const randomOffset = (Math.sin(Date.now() * 0.02 + i) * 10);
        const startX = wave.x + Math.cos(angle) * (innerRadius + randomOffset);
        const startY = wave.y + Math.sin(angle) * (innerRadius + randomOffset);
        const endX = wave.x + Math.cos(angle) * (outerRadius + randomOffset);
        const endY = wave.y + Math.sin(angle) * (outerRadius + randomOffset);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
      }
      
      // Inner lightning bolts
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.globalAlpha = wave.opacity * 0.6;
      
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Date.now() * 0.005;
        const radius = wave.radius * 0.5;
        
        this.ctx.beginPath();
        this.ctx.moveTo(wave.x, wave.y);
        
        // Create zigzag lightning effect
        const segments = 4;
        for (let s = 1; s <= segments; s++) {
          const segmentAngle = angle + (Math.sin(Date.now() * 0.01 + s) * 0.3);
          const segmentRadius = (radius / segments) * s;
          const zigzag = Math.sin(Date.now() * 0.02 + s) * 10;
          
          const x = wave.x + Math.cos(segmentAngle) * segmentRadius + zigzag;
          const y = wave.y + Math.sin(segmentAngle) * segmentRadius + zigzag;
          this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
      }
    }
    
    // Add screen shake for large waves
    if (wave.radius > 200 && wave.opacity > 0.8) {
      this.addScreenShake(3, 100);
    }
    
    this.ctx.restore();
  }

  renderMissileEffects(missile) {
    // Render missile trail with gradient
    if (missile.trailPoints && missile.trailPoints.length > 1) {
      this.ctx.save();
      
      for (let i = 1; i < missile.trailPoints.length; i++) {
        const alpha = i / missile.trailPoints.length;
        this.ctx.globalAlpha = alpha * 0.6;
        this.ctx.strokeStyle = CONFIG.colors.missile;
        this.ctx.lineWidth = 3 * alpha;
        this.ctx.beginPath();
        this.ctx.moveTo(missile.trailPoints[i-1].x, missile.trailPoints[i-1].y);
        this.ctx.lineTo(missile.trailPoints[i].x, missile.trailPoints[i].y);
        this.ctx.stroke();
      }
      
      this.ctx.restore();
    }
    
    // Add sparkles to missile
    if (Math.random() < 0.3) {
      this.addSparkle(missile.x, missile.y, CONFIG.colors.missile, 2);
    }
  }

  renderBulletTimeEffects() {
    // Add blue tint to screen during bullet time
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Add scanning lines effect
    const time = Date.now() * 0.01;
    for (let i = 0; i < window.innerHeight; i += 4) {
      const alpha = (Math.sin(time + i * 0.1) + 1) * 0.05;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = '#00aaff';
      this.ctx.fillRect(0, i, window.innerWidth, 1);
    }
    
    this.ctx.restore();
  }

  renderMuzzleFlash(x, y, angle = 0) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    
    // Outer flash
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.globalAlpha = 0.8;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Inner flash
    this.ctx.fillStyle = '#ffff00';
    this.ctx.globalAlpha = 1;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  reset() {
    this.explosions = [];
    this.sparkles = [];
    this.screenShake = { intensity: 0, duration: 0 };
  }
}