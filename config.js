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
    speed: 3,
    hp: 10,
    maxHp: 10,
    shootInterval: 10, // frames between shots
    autoAim: true,
    canShootWhileMoving: true,
    autoShoot: false
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
    damage: 1
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

  // Electric wave system
  electricWave: {
    cooldownTime: 5000, // milliseconds
    waveRadius: 300,
    waveDamage: 5,
    waveSpeed: 8
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
    supportBullet: '#2196f3',
    laser: {
      outer: '#0080ff',
      middle: '#00bfff',
      core: '#ffffff'
    },
    electricWave: 'rgba(138, 43, 226, 1)',
    missile: '#ff5722',
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
      fuel: ['f', 'F'],
      electricWave: ['e', 'E'],
      missile: ['1'],
      bulletTime: ['t', 'T'],
      autoAim: ['a', 'A'],
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