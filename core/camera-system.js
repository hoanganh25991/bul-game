export class CameraSystem {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.smoothness = 0.1; // Lower = smoother but slower, Higher = more responsive
    this.boundaries = {
      enabled: false,
      minX: -1000,
      maxX: 1000,
      minY: -1000,
      maxY: 1000
    };
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  update(tankWorldX, tankWorldY) {
    // Set camera target to tank position
    this.targetX = tankWorldX;
    this.targetY = tankWorldY;
    
    // Smoothly interpolate camera position toward target
    this.x += (this.targetX - this.x) * this.smoothness;
    this.y += (this.targetY - this.y) * this.smoothness;
    
    // Apply camera boundaries if enabled
    if (this.boundaries.enabled) {
      this.x = Math.max(this.boundaries.minX, 
                       Math.min(this.boundaries.maxX, this.x));
      this.y = Math.max(this.boundaries.minY, 
                       Math.min(this.boundaries.maxY, this.y));
    }
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x + (window.innerWidth / 2),
      y: worldY - this.y + (window.innerHeight / 2)
    };
  }

  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x - (window.innerWidth / 2),
      y: screenY + this.y - (window.innerHeight / 2)
    };
  }

  setBoundaries(enabled, minX = -1000, maxX = 1000, minY = -1000, maxY = 1000) {
    this.boundaries = {
      enabled,
      minX,
      maxX,
      minY,
      maxY
    };
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  getTarget() {
    return { x: this.targetX, y: this.targetY };
  }
}