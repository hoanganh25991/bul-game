export class MathUtils {
  // Helper function to darken colors
  static darkenColor(color, amount) {
    // Simple color darkening - convert hex to rgb and darken
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) + amount);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) + amount); 
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Helper function to lighten colors
  static lightenColor(color, amount) {
    return this.darkenColor(color, Math.abs(amount));
  }

  // Get scaled font string
  static getScaledFont(baseSize, fontFamily = 'Arial', weight = 'normal', scaleFactor = 1) {
    const scaledSize = Math.max(baseSize * scaleFactor, 12);
    return `${weight} ${scaledSize}px ${fontFamily}`;
  }

  // Get scaled size
  static getScaledSize(baseSize, scaleFactor = 1) {
    return Math.max(baseSize * scaleFactor, baseSize * 0.5);
  }

  // Calculate distance between two points
  static distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Calculate angle between two points
  static angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  // Normalize angle to 0-2π range
  static normalizeAngle(angle) {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
  }

  // Linear interpolation
  static lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // Clamp value between min and max
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // Check if point is inside circle
  static pointInCircle(px, py, cx, cy, radius) {
    return this.distance(px, py, cx, cy) <= radius;
  }

  // Check if point is inside rectangle
  static pointInRect(px, py, rx, ry, width, height) {
    return px >= rx && px <= rx + width && py >= ry && py <= ry + height;
  }

  // Check if two circles intersect
  static circlesIntersect(x1, y1, r1, x2, y2, r2) {
    return this.distance(x1, y1, x2, y2) <= (r1 + r2);
  }

  // Check if two rectangles intersect
  static rectsIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
  }

  // Generate random number between min and max
  static random(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Generate random integer between min and max (inclusive)
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Convert degrees to radians
  static degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Convert radians to degrees
  static radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  // Get vector from angle and magnitude
  static vectorFromAngle(angle, magnitude = 1) {
    return {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude
    };
  }

  // Get magnitude of vector
  static vectorMagnitude(x, y) {
    return Math.sqrt(x * x + y * y);
  }

  // Normalize vector
  static normalizeVector(x, y) {
    const magnitude = this.vectorMagnitude(x, y);
    if (magnitude === 0) return { x: 0, y: 0 };
    return {
      x: x / magnitude,
      y: y / magnitude
    };
  }

  // Rotate point around center
  static rotatePoint(px, py, cx, cy, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = px - cx;
    const dy = py - cy;
    
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos
    };
  }

  // Smooth step function (ease in/out)
  static smoothStep(t) {
    return t * t * (3 - 2 * t);
  }

  // Ease in function
  static easeIn(t) {
    return t * t;
  }

  // Ease out function
  static easeOut(t) {
    return 1 - (1 - t) * (1 - t);
  }

  // Ease in-out function
  static easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
  }

  // Map value from one range to another
  static map(value, fromMin, fromMax, toMin, toMax) {
    return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
  }

  // Check if value is approximately equal (within epsilon)
  static approximately(a, b, epsilon = 0.001) {
    return Math.abs(a - b) < epsilon;
  }

  // Get sign of number (-1, 0, or 1)
  static sign(value) {
    return value > 0 ? 1 : value < 0 ? -1 : 0;
  }

  // Round to specified decimal places
  static roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}