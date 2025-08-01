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
    this.ctx.fillText(`❤️ HP: ${tankStats.hp}/${tankStats.maxHp}`, uiMargin, uiLineHeight);
    this.ctx.fillText(`💀 Tiêu diệt: ${victorySystem.enemiesKilled}/${victorySystem.targetKills}`, uiMargin, uiLineHeight * 2);
    
    // Display boss information
    if (victorySystem.bossesKilled > 0) {
      this.ctx.fillText(`👑 Boss: ${victorySystem.bossesKilled}`, uiMargin, uiLineHeight * 2.5);
    }
    
    // Display next boss countdown
    const nextBossKills = victorySystem.currentBossLevel * CONFIG.boss.spawnInterval;
    const killsUntilBoss = nextBossKills - victorySystem.enemiesKilled;
    if (killsUntilBoss > 0) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText(`⚡ Boss tiếp theo: ${killsUntilBoss} kills`, uiMargin, uiLineHeight * 3);
      this.ctx.fillStyle = CONFIG.colors.ui.text;
    }
    
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
      this.ctx.fillStyle = CONFIG.colors.ui.text;
      this.ctx.fillText(`⛽ Nhiên liệu: ${cooldownSeconds}s`, uiMargin, uiLineHeight * 4);
    } else {
      this.ctx.fillStyle = CONFIG.colors.ui.text;
      this.ctx.fillText(`⛽ Nhiên liệu: Sẵn sàng`, uiMargin, uiLineHeight * 4);
    }
    
    // Display electric wave cooldown
    if (!systemStates.electricWave.isReady) {
      let cooldownSeconds = Math.ceil(systemStates.electricWave.cooldown / 1000);
      this.ctx.fillStyle = CONFIG.colors.ui.text;
      this.ctx.fillText(`⚡ Sóng điện: ${cooldownSeconds}s`, uiMargin, uiLineHeight * 5);
    } else {
      this.ctx.fillStyle = CONFIG.colors.ui.text;
      this.ctx.fillText(`⚡ Sóng điện: Sẵn sàng`, uiMargin, uiLineHeight * 5);
    }
    
    // Display missile cooldown
    if (!systemStates.missile.isReady) {
      let cooldownSeconds = Math.ceil(systemStates.missile.cooldown / 1000);
      this.ctx.fillStyle = CONFIG.colors.ui.text;
      this.ctx.fillText(`🚀 Tên lửa: ${cooldownSeconds}s`, uiMargin, uiLineHeight * 6);
    } else {
      this.ctx.fillStyle = CONFIG.colors.ui.text;
      this.ctx.fillText(`🚀 Tên lửa: Sẵn sàng`, uiMargin, uiLineHeight * 6);
    }
    
    // Display bullet time status
    if (systemStates.bulletTime.isActive) {
      let durationSeconds = Math.ceil(systemStates.bulletTime.duration / 1000);
      this.ctx.fillStyle = CONFIG.colors.ui.text;
      this.ctx.fillText(`🔴 Bullet Time: ${durationSeconds}s`, uiMargin, uiLineHeight * 7);
    } else if (!systemStates.bulletTime.isReady) {
      let cooldownSeconds = Math.ceil(systemStates.bulletTime.cooldown / 1000);
      this.ctx.fillStyle = CONFIG.colors.ui.health.low;
      this.ctx.fillText(`🔴 Bullet Time: ${cooldownSeconds}s`, uiMargin, uiLineHeight * 7);
    } else {
      this.ctx.fillStyle = CONFIG.colors.ui.text;
      this.ctx.fillText(`🔴 Bullet Time: Sẵn sàng`, uiMargin, uiLineHeight * 7);
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
    // Display auto shoot status
    this.ctx.fillStyle = tankStats.autoShoot ? CONFIG.colors.ui.health.high : CONFIG.colors.ui.health.low;
    this.ctx.fillText(`🔫 Bắn tự động: ${tankStats.autoShoot ? 'BẬT' : 'TẮT'} (Z)`, uiMargin, uiLineHeight * 10);
  }

  renderGameOverScreen(isVictory, victorySystem) {
    this.ctx.save();
    
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Set text alignment
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    if (isVictory) {
      // Victory screen
      this.ctx.fillStyle = '#4caf50';
      this.ctx.font = MathUtils.getScaledFont(64, 'Arial', 'bold', this.scaleFactor);
      this.ctx.fillText('🎉 CHIẾN THẮNG! 🎉', centerX, centerY - 80);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = MathUtils.getScaledFont(28, 'Arial', 'normal', this.scaleFactor);
      this.ctx.fillText(`Bạn đã tiêu diệt thành công ${victorySystem.enemiesKilled} kẻ thù!`, centerX, centerY - 20);
      
      this.ctx.fillStyle = '#ffeb3b';
      this.ctx.font = MathUtils.getScaledFont(24, 'Arial', 'bold', this.scaleFactor);
      this.ctx.fillText('🏆 Xuất sắc! Bạn đã hoàn thành nhiệm vụ! 🏆', centerX, centerY + 20);
      
    } else {
      // Game over screen
      this.ctx.fillStyle = '#f44336';
      this.ctx.font = MathUtils.getScaledFont(64, 'Arial', 'bold', this.scaleFactor);
      this.ctx.fillText('💥 THẤT BẠI 💥', centerX, centerY - 80);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = MathUtils.getScaledFont(28, 'Arial', 'normal', this.scaleFactor);
      this.ctx.fillText('Xe tăng của bạn đã bị phá hủy!', centerX, centerY - 20);
      
      this.ctx.fillStyle = '#ffeb3b';
      this.ctx.font = MathUtils.getScaledFont(24, 'Arial', 'normal', this.scaleFactor);
      this.ctx.fillText(`Tiêu diệt được: ${victorySystem.enemiesKilled}/${victorySystem.targetKills} kẻ thù`, centerX, centerY + 20);
    }
    
    // Restart instructions
    this.ctx.fillStyle = '#2196f3';
    this.ctx.font = MathUtils.getScaledFont(22, 'Arial', 'bold', this.scaleFactor);
    this.ctx.fillText('🔄 Nhấn R, Enter, Space hoặc chạm màn hình để chơi lại 🔄', centerX, centerY + 80);
    
    // Add a subtle border effect
    this.ctx.strokeStyle = isVictory ? '#4caf50' : '#f44336';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(50, centerY - 150, window.innerWidth - 100, 300);
    
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