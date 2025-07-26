import { CONFIG } from '../config.js';
import { MathUtils } from '../utils/math-utils.js';

export class UIRenderer {
  constructor(ctx, scaleFactor) {
    this.ctx = ctx;
    this.scaleFactor = scaleFactor;
  }

  updateScale(scaleFactor) {
    this.scaleFactor = scaleFactor;
  }

  render(tank, victorySystem, weapons, fuelMessage, bulletTimeMessage, generalMessage) {
    this.ctx.save();
    this.ctx.font = MathUtils.getScaledFont(CONFIG.ui.baseFontSize, 'Arial', 'bold', this.scaleFactor);
    this.ctx.fillStyle = CONFIG.colors.ui.text;
    this.ctx.shadowColor = CONFIG.colors.ui.shadow;
    this.ctx.shadowBlur = MathUtils.getScaledSize(3, this.scaleFactor);
    
    const uiMargin = MathUtils.getScaledSize(CONFIG.ui.margin, this.scaleFactor);
    const uiLineHeight = MathUtils.getScaledSize(CONFIG.ui.lineHeight, this.scaleFactor);
    
    // Display tank stats
    const tankStats = tank.getStats();
    this.ctx.fillText(`HP: ${tankStats.hp}/${tankStats.maxHp}`, uiMargin, uiLineHeight);
    this.ctx.fillText(`Tiêu diệt: ${victorySystem.enemiesKilled}/${victorySystem.targetKills}`, uiMargin, uiLineHeight * 2);
    
    // Display weapon system states
    this.renderWeaponStates(weapons, uiMargin, uiLineHeight);
    
    // Display messages
    this.renderMessages(fuelMessage, bulletTimeMessage, generalMessage, uiMargin, uiLineHeight);
    
    // Display auto aim and auto shoot status
    this.renderAutoFeatures(tankStats, uiMargin, uiLineHeight);
    
    this.ctx.restore();
  }

  renderWeaponStates(weapons, uiMargin, uiLineHeight) {
    const systemStates = weapons.getSystemStates();
    
    // Display fuel cooldown
    if (!systemStates.fuel.isReady) {
      let cooldownSeconds = Math.ceil(systemStates.fuel.cooldown / 1000);
      this.ctx.fillStyle = CONFIG.colors.tank.main;
      this.ctx.fillText(`⛽ Nhiên liệu: ${cooldownSeconds}s`, uiMargin, uiLineHeight * 3);
    } else {
      this.ctx.fillStyle = CONFIG.colors.tank.main;
      this.ctx.fillText(`⛽ Nhiên liệu: Sẵn sàng`, uiMargin, uiLineHeight * 3);
    }
    
    // Display electric wave cooldown
    if (!systemStates.electricWave.isReady) {
      let cooldownSeconds = Math.ceil(systemStates.electricWave.cooldown / 1000);
      this.ctx.fillStyle = CONFIG.colors.electricWave;
      this.ctx.fillText(`⚡ Sóng điện: ${cooldownSeconds}s`, uiMargin, uiLineHeight * 4);
    } else {
      this.ctx.fillStyle = CONFIG.colors.electricWave;
      this.ctx.fillText(`⚡ Sóng điện: Sẵn sàng`, uiMargin, uiLineHeight * 4);
    }
    
    // Display missile cooldown
    if (!systemStates.missile.isReady) {
      let cooldownSeconds = Math.ceil(systemStates.missile.cooldown / 1000);
      this.ctx.fillStyle = CONFIG.colors.missile;
      this.ctx.fillText(`🚀 Tên lửa: ${cooldownSeconds}s`, uiMargin, uiLineHeight * 5);
    } else {
      this.ctx.fillStyle = CONFIG.colors.missile;
      this.ctx.fillText(`🚀 Tên lửa: Sẵn sàng`, uiMargin, uiLineHeight * 5);
    }
    
    // Display bullet time status
    if (systemStates.bulletTime.isActive) {
      let durationSeconds = Math.ceil(systemStates.bulletTime.duration / 1000);
      this.ctx.fillStyle = CONFIG.colors.laser.core;
      this.ctx.fillText(`🔴 Bullet Time: ${durationSeconds}s`, uiMargin, uiLineHeight * 6);
    } else if (!systemStates.bulletTime.isReady) {
      let cooldownSeconds = Math.ceil(systemStates.bulletTime.cooldown / 1000);
      this.ctx.fillStyle = CONFIG.colors.ui.health.low;
      this.ctx.fillText(`🔴 Bullet Time: ${cooldownSeconds}s`, uiMargin, uiLineHeight * 6);
    } else {
      this.ctx.fillStyle = CONFIG.colors.laser.core;
      this.ctx.fillText(`🔴 Bullet Time: Sẵn sàng`, uiMargin, uiLineHeight * 6);
    }
  }

  renderMessages(fuelMessage, bulletTimeMessage, generalMessage, uiMargin, uiLineHeight) {
    // Display fuel message
    if (fuelMessage.time > 0) {
      this.ctx.fillStyle = CONFIG.colors.tank.main;
      this.ctx.fillText(fuelMessage.text, uiMargin, uiLineHeight * 7);
      fuelMessage.time--;
    }
    
    // Display bullet time message
    if (bulletTimeMessage.time > 0) {
      this.ctx.fillStyle = CONFIG.colors.supportTank.main;
      this.ctx.fillText(bulletTimeMessage.text, uiMargin, uiLineHeight * 8);
      bulletTimeMessage.time--;
    }
    
    // Display general message
    if (generalMessage.time > 0) {
      this.ctx.fillStyle = CONFIG.colors.bullet;
      this.ctx.fillText(generalMessage.text, uiMargin, uiLineHeight * 9);
      generalMessage.time--;
    }
  }

  renderAutoFeatures(tankStats, uiMargin, uiLineHeight) {
    // Display auto aim status
    this.ctx.fillStyle = tankStats.autoAim ? CONFIG.colors.ui.health.high : CONFIG.colors.ui.health.low;
    this.ctx.fillText(`🎯 Tự động nhắm: ${tankStats.autoAim ? 'BẬT' : 'TẮT'} (A)`, uiMargin, uiLineHeight * 10);
    
    // Display auto shoot status
    this.ctx.fillStyle = tankStats.autoShoot ? CONFIG.colors.ui.health.high : CONFIG.colors.ui.health.low;
    this.ctx.fillText(`🔫 Bắn tự động: ${tankStats.autoShoot ? 'BẬT' : 'TẮT'} (Z)`, uiMargin, uiLineHeight * 11);
  }

  renderGameOverScreen(victorySystem) {
    this.ctx.save();
    
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Game over text
    this.ctx.fillStyle = '#fff';
    this.ctx.font = MathUtils.getScaledFont(48, 'Arial', 'bold', this.scaleFactor);
    this.ctx.textAlign = 'center';
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    if (victorySystem.gameWon) {
      this.ctx.fillText('CHIẾN THẮNG!', centerX, centerY - 50);
      this.ctx.font = MathUtils.getScaledFont(24, 'Arial', 'normal', this.scaleFactor);
      this.ctx.fillText(`Bạn đã tiêu diệt ${victorySystem.enemiesKilled} kẻ thù!`, centerX, centerY);
    } else {
      this.ctx.fillText('GAME OVER', centerX, centerY - 50);
      this.ctx.font = MathUtils.getScaledFont(24, 'Arial', 'normal', this.scaleFactor);
      this.ctx.fillText(`Tiêu diệt được: ${victorySystem.enemiesKilled}/${victorySystem.targetKills}`, centerX, centerY);
    }
    
    this.ctx.font = MathUtils.getScaledFont(18, 'Arial', 'normal', this.scaleFactor);
    this.ctx.fillText('Nhấn R để chơi lại', centerX, centerY + 50);
    
    this.ctx.restore();
  }

  renderLoadingScreen() {
    this.ctx.save();
    
    // Background
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Loading text
    this.ctx.fillStyle = '#fff';
    this.ctx.font = MathUtils.getScaledFont(32, 'Arial', 'bold', this.scaleFactor);
    this.ctx.textAlign = 'center';
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    this.ctx.fillText('ĐANG TẢI...', centerX, centerY);
    
    // Loading bar
    const barWidth = 300;
    const barHeight = 20;
    const barX = centerX - barWidth / 2;
    const barY = centerY + 50;
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Animated loading progress
    const progress = (Date.now() % 2000) / 2000; // 2 second cycle
    this.ctx.fillStyle = CONFIG.colors.tank.main;
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    this.ctx.restore();
  }

  renderPauseScreen() {
    this.ctx.save();
    
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Pause text
    this.ctx.fillStyle = '#fff';
    this.ctx.font = MathUtils.getScaledFont(48, 'Arial', 'bold', this.scaleFactor);
    this.ctx.textAlign = 'center';
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    this.ctx.fillText('TẠM DỪNG', centerX, centerY);
    
    this.ctx.font = MathUtils.getScaledFont(18, 'Arial', 'normal', this.scaleFactor);
    this.ctx.fillText('Nhấn P để tiếp tục', centerX, centerY + 50);
    
    this.ctx.restore();
  }
}