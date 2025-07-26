// Main game entry point - now using modular architecture
// This file serves as the main entry point and imports all the modular components

import './core/game-core.js';

// The GameCore class is automatically initialized when the DOM is loaded
// All game functionality is now organized into separate modules:

// Core Systems:
// - core/game-core.js - Main game loop, initialization, and core state
// - core/camera-system.js - Camera and world coordinate system  
// - core/world-system.js - World generation, terrain, and decorations

// Input & Controls:
// - input/input-manager.js - Keyboard and touch input handling
// - input/joystick-controller.js - Mobile joystick controls

// Game Entities:
// - entities/tank.js - Main tank and support tank logic
// - entities/enemies.js - Enemy spawning and AI
// - entities/bullets.js - Bullet management and physics
// - entities/weapons.js - Special weapons (missiles, electric wave, etc.)

// Rendering:
// - rendering/renderer.js - Main rendering system
// - rendering/ui-renderer.js - UI and HUD rendering
// - rendering/effects-renderer.js - Visual effects and explosions

// Utilities:
// - utils/math-utils.js - Mathematical utilities and helpers
// - utils/performance.js - Performance optimization

console.log('🎮 Tank Shooter Game - Modular Architecture Loaded');
console.log('📁 Game organized into dedicated modules for better maintainability');