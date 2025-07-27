// Game Configuration
export const CONFIG = {
  // Canvas and scaling
  canvas: {
    baseWidth: 1920,
    baseHeight: 1080,
    maxScaleFactor: 0.4
  },

  // Tank configuration
  tank: {
    speed: 15,
    hp: 30,
    maxHp: 30,
    shootInterval: 10, // frames between shots
    autoAim: true,
    canShootWhileMoving: true,
    autoShoot: false,
    autoAimRange: 1200, // Maximum range for auto-aim (3x increased from 400)
    autoAimPrediction: true, // Enable predictive aiming
    autoAimVisualIndicators: true, // Show targeting reticles and aim lines
    autoAimSmoothness: 0.8 // How smooth the turret rotation is (0-1)
  },

  // Support tank configuration
  supportTank: {
    speed: 2.5,
    hp: 5,
    maxHp: 5,
    targetDistance: 80,
    followAngle: Math.PI * 1.25,
    shootInterval: 45 // frames between shots
  },

  // Bullet configuration
  bullets: {
    speed: 10,
    supportSpeed: 8,
    enemySpeed: 5,
    radius: 12,
    damage: 1,
    triangularDamage: 5, // Triangular bullets do more damage
    triangularSize: 15   // Triangular bullets are slightly larger
  },

  // Enemy configuration
  enemies: {
    speed: 2,
    spawnInterval: 60, // frames (spawn every second at 60fps)
    hp: 3,
    maxHp: 3
  },

  // Victory system
  victory: {
    targetKills: 30
  },

  // Boss system
  boss: {
    spawnInterval: 10, // Spawn boss every 10 enemy kills
    maxBosses: 1, // Maximum number of bosses on screen
    levelScaling: 0.3 // HP increase per boss level (30%)
  },

  // Electric wave system
  electricWave: {
    cooldownTime: 4000, // Giảm từ 5000 xuống 4000ms (4 giây)
    waveRadius: 600, // Tăng từ 300 lên 600 (gấp đôi)
    waveDamage: 8, // Tăng damage từ 5 lên 8
    waveSpeed: 12 // Tăng tốc độ từ 8 lên 12
  },

  // Missile system
  missile: {
    cooldownTime: 1000, // milliseconds
    speed: 6,
    damage: 10,
    explosionRadius: 80,
    homingRange: 200
  },

  // Fuel system
  fuel: {
    cooldownTime: 3000, // milliseconds
    healAmount: 2
  },

  // Bullet time system
  bulletTime: {
    duration: 30000, // milliseconds
    cooldownTime: 10000, // milliseconds
    originalShootCooldown: 10
  },

  // World system
  world: {
    tileSize: 40
  },

  // Performance
  performance: {
    targetFPS: 60,
    minFPS: 30,
    maxFPS: 55
  },

  // UI scaling
  ui: {
    baseFontSize: 19,
    baseButtonSize: 80,
    mobileButtonSize: 70,
    minButtonSize: 50,
    joystickSize: 130,
    joystickHandleSize: 50,
    margin: 20,
    lineHeight: 20
  },

  // Colors
  colors: {
    tank: {
      main: '#4caf50',
      turret: '#388e3c'
    },
    supportTank: {
      main: '#2196f3',
      turret: '#1976d2'
    },
    enemy: {
      main: '#f44336',
      turret: '#d32f2f'
    },
    bullet: '#ffeb3b',
    triangularBullet: '#ff6b35', // Orange-red for triangular bullets
    supportBullet: '#2196f3',
    enemyBullet: '#ff5722',
    laser: {
      outer: '#0080ff',
      middle: '#00bfff',
      core: '#ffffff'
    },
    electricWave: 'rgba(138, 43, 226, 1)',
    missile: '#ff5722',
    items: {
      triangularBullets: '#ffd700' // Gold color for triangular bullet powerup
    },
    terrain: {
      grass: '#4a7c59',
      dirt: '#8b4513',
      stone: '#696969'
    },
    ui: {
      text: '#fff',
      shadow: '#000',
      health: {
        high: '#76ff03',
        medium: '#ffeb3b',
        low: '#f44336'
      }
    }
  },

  // Controls
  controls: {
    joystickDeadzone: 0.3,
    keys: {
      // Movement keys
      moveUp: ['ArrowUp', 'w', 'W'],
      moveDown: ['ArrowDown', 's', 'S'],
      moveLeft: ['ArrowLeft', 'a', 'A'],
      moveRight: ['ArrowRight', 'd', 'D'],
      
      // Action keys
      fuel: ['f', 'F'],
      electricWave: ['e', 'E'],
      missile: ['1'],
      bulletTime: ['t', 'T'],

      autoShoot: ['z', 'Z'],
      start: ['Enter', ' ']
    }
  },

  // Audio
  audio: {
    backgroundMusic: 'my-love-don-t-let-love-fade.mp3'
  },

  // Mobile detection
  mobile: {
    breakpoint: 768,
    smallBreakpoint: 480,
    tinyBreakpoint: 360
  }
};