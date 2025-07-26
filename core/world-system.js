import { CONFIG } from '../config.js';

export class WorldSystem {
  constructor(scaleFactor) {
    this.offsetX = 0;
    this.offsetY = 0;
    this.scaleFactor = scaleFactor;
    this.terrain = [];
    this.decorations = [];
  }

  get tileSize() { 
    return Math.max(CONFIG.world.tileSize * this.scaleFactor, 20); 
  }

  updateScale(scaleFactor) {
    this.scaleFactor = scaleFactor;
  }

  init(tankWorldX, tankWorldY, canvasWidth, canvasHeight) {
    // Set initial offset to center tank on screen
    this.offsetX = tankWorldX - (canvasWidth / 2 - 30);
    this.offsetY = tankWorldY - (canvasHeight / 2 - 25);
  }

  // Terrain generation
  generateTerrain(startX, startY, width, height) {
    for (let x = startX; x < startX + width; x++) {
      for (let y = startY; y < startY + height; y++) {
        let key = `${x},${y}`;
        if (!this.terrain[key]) {
          // Generate basic terrain
          let terrainType = 'grass';
          if (Math.random() < 0.1) terrainType = 'dirt';
          else if (Math.random() < 0.05) terrainType = 'stone';
          
          this.terrain[key] = {
            type: terrainType,
            x: x,
            y: y
          };
          
          // Generate decorations
          if (Math.random() < 0.08) {
            let decorationType = 'grass_tuft';
            if (Math.random() < 0.3) decorationType = 'small_rock';
            else if (Math.random() < 0.1) decorationType = 'tree';
            else if (Math.random() < 0.2) decorationType = 'bush';
            
            this.decorations.push({
              type: decorationType,
              x: x * this.tileSize + Math.random() * this.tileSize,
              y: y * this.tileSize + Math.random() * this.tileSize,
              size: 0.5 + Math.random() * 0.5
            });
          }
        }
      }
    }
  }

  getVisibleTerrain(cameraSystem) {
    // Calculate visible terrain based on camera position
    const startTileX = Math.floor((cameraSystem.x - window.innerWidth/2) / this.tileSize) - 1;
    const startTileY = Math.floor((cameraSystem.y - window.innerHeight/2) / this.tileSize) - 1;
    const endTileX = startTileX + Math.ceil(window.innerWidth / this.tileSize) + 2;
    const endTileY = startTileY + Math.ceil(window.innerHeight / this.tileSize) + 2;
    
    // Generate more terrain if needed
    this.generateTerrain(startTileX, startTileY, endTileX - startTileX, endTileY - startTileY);
    
    return {
      startTileX,
      startTileY,
      endTileX,
      endTileY,
      terrain: this.terrain
    };
  }

  getVisibleDecorations(cameraSystem) {
    return this.decorations.filter(decoration => {
      let screenPos = cameraSystem.worldToScreen(decoration.x, decoration.y);
      return screenPos.x > -50 && screenPos.x < window.innerWidth + 50 && 
             screenPos.y > -50 && screenPos.y < window.innerHeight + 50;
    });
  }

  reset() {
    this.terrain = [];
    this.decorations = [];
    this.offsetX = 0;
    this.offsetY = 0;
  }
}