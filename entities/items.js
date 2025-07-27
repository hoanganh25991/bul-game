import { CONFIG } from '../config.js';

export class Items {
  constructor() {
    this.items = [];
  }

  update(tank, cameraSystem) {
    // Update item positions and check for collection
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      
      // Update screen position
      const screenPos = cameraSystem.worldToScreen(item.worldX, item.worldY);
      item.x = screenPos.x;
      item.y = screenPos.y;
      
      // Check if tank collects the item
      const dx = item.x - (tank.x + 30);
      const dy = item.y - (tank.y + 35);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 40) {
        // Tank collected the item
        this.applyItemEffect(item, tank);
        this.items.splice(i, 1);
        continue;
      }
      
      // Remove items that are too far from screen
      if (item.x < -100 || item.x > window.innerWidth + 100 || 
          item.y < -100 || item.y > window.innerHeight + 100) {
        this.items.splice(i, 1);
      }
    }
  }

  applyItemEffect(item, tank) {
    switch (item.type) {
      case 'triangular_bullets':
        tank.setTriangularBullets(true);
        console.log('Triangular bullets activated!');
        break;
    }
  }

  dropItem(worldX, worldY, type = 'triangular_bullets') {
    // Random chance to drop item (25%)
    if (Math.random() < 0.25) {
      this.items.push({
        type: type,
        worldX: worldX,
        worldY: worldY,
        x: 0, // Will be updated in update()
        y: 0, // Will be updated in update()
        createdAt: Date.now()
      });
      console.log(`Item dropped: ${type} at (${worldX}, ${worldY})`);
    }
  }

  getItems() {
    return this.items;
  }

  reset() {
    this.items = [];
  }
}