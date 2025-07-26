import { CONFIG } from '../config.js';

export class Performance {
  constructor() {
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.avgFPS = 60;
    this.fpsHistory = [];
    this.maxFPSHistory = 60; // Keep last 60 frames for average
    this.performanceMode = 'auto'; // 'auto', 'performance', 'quality'
    this.adaptiveQuality = true;
  }

  optimize(scaleFactor, updateScaleCallback) {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Calculate current FPS
    const currentFPS = 1000 / deltaTime;
    
    // Update FPS history
    this.fpsHistory.push(currentFPS);
    if (this.fpsHistory.length > this.maxFPSHistory) {
      this.fpsHistory.shift();
    }
    
    // Calculate average FPS
    this.avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    
    // Adaptive quality adjustment
    if (this.adaptiveQuality && this.performanceMode === 'auto') {
      this.adjustQuality(scaleFactor, updateScaleCallback);
    }
    
    this.frameCount++;
  }

  adjustQuality(currentScaleFactor, updateScaleCallback) {
    // Only adjust every 30 frames to avoid rapid changes
    if (this.frameCount % 30 !== 0) return;
    
    let newScaleFactor = currentScaleFactor;
    
    // If FPS is too low, reduce quality
    if (this.avgFPS < CONFIG.performance.minFPS && currentScaleFactor > 0.5) {
      newScaleFactor = Math.max(0.5, currentScaleFactor * 0.95);
      console.log(`Performance: Reducing quality to ${newScaleFactor.toFixed(2)} (FPS: ${this.avgFPS.toFixed(1)})`);
    }
    // If FPS is good, try to increase quality
    else if (this.avgFPS > CONFIG.performance.maxFPS && currentScaleFactor < CONFIG.canvas.maxScaleFactor) {
      newScaleFactor = Math.min(CONFIG.canvas.maxScaleFactor, currentScaleFactor * 1.01);
      console.log(`Performance: Increasing quality to ${newScaleFactor.toFixed(2)} (FPS: ${this.avgFPS.toFixed(1)})`);
    }
    
    // Apply the new scale factor if it changed significantly
    if (Math.abs(newScaleFactor - currentScaleFactor) > 0.01) {
      updateScaleCallback(newScaleFactor);
    }
  }

  setPerformanceMode(mode) {
    this.performanceMode = mode;
    
    switch (mode) {
      case 'performance':
        this.adaptiveQuality = false;
        console.log('Performance: Switched to performance mode');
        break;
      case 'quality':
        this.adaptiveQuality = false;
        console.log('Performance: Switched to quality mode');
        break;
      case 'auto':
        this.adaptiveQuality = true;
        console.log('Performance: Switched to auto mode');
        break;
    }
  }

  getPerformanceStats() {
    return {
      currentFPS: this.fpsHistory.length > 0 ? this.fpsHistory[this.fpsHistory.length - 1] : 0,
      averageFPS: this.avgFPS,
      minFPS: Math.min(...this.fpsHistory),
      maxFPS: Math.max(...this.fpsHistory),
      frameCount: this.frameCount,
      performanceMode: this.performanceMode,
      adaptiveQuality: this.adaptiveQuality
    };
  }

  // Memory management helpers
  static cleanupArrays(...arrays) {
    arrays.forEach(array => {
      if (Array.isArray(array)) {
        array.length = 0;
      }
    });
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static debounce(func, delay) {
    let timeoutId;
    return function() {
      const args = arguments;
      const context = this;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(context, args), delay);
    };
  }

  // Object pooling for frequently created/destroyed objects
  static createObjectPool(createFn, resetFn, initialSize = 10) {
    const pool = [];
    const active = [];
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      pool.push(createFn());
    }
    
    return {
      get() {
        let obj = pool.pop();
        if (!obj) {
          obj = createFn();
        }
        active.push(obj);
        return obj;
      },
      
      release(obj) {
        const index = active.indexOf(obj);
        if (index !== -1) {
          active.splice(index, 1);
          resetFn(obj);
          pool.push(obj);
        }
      },
      
      releaseAll() {
        while (active.length > 0) {
          const obj = active.pop();
          resetFn(obj);
          pool.push(obj);
        }
      },
      
      getStats() {
        return {
          poolSize: pool.length,
          activeCount: active.length,
          totalCreated: pool.length + active.length
        };
      }
    };
  }

  // Viewport culling helper
  static isInViewport(x, y, width, height, margin = 50) {
    return !(x + width < -margin || 
             x > window.innerWidth + margin || 
             y + height < -margin || 
             y > window.innerHeight + margin);
  }

  // Distance-based level of detail
  static getLODLevel(distance, thresholds = [100, 300, 600]) {
    if (distance < thresholds[0]) return 'high';
    if (distance < thresholds[1]) return 'medium';
    if (distance < thresholds[2]) return 'low';
    return 'minimal';
  }

  // Frame rate independent timing
  static getDeltaTime() {
    const now = performance.now();
    const deltaTime = (now - (this.lastTime || now)) / 1000; // Convert to seconds
    this.lastTime = now;
    return Math.min(deltaTime, 1/30); // Cap at 30 FPS to prevent large jumps
  }

  // Memory usage monitoring (if available)
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }

  // Performance monitoring
  startProfiling(name) {
    performance.mark(`${name}-start`);
  }

  endProfiling(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    if (measure) {
      console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
    }
  }

  // Clear performance entries to prevent memory leaks
  clearPerformanceEntries() {
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }

  reset() {
    this.frameCount = 0;
    this.fpsHistory = [];
    this.avgFPS = 60;
    this.lastFrameTime = performance.now();
  }
}