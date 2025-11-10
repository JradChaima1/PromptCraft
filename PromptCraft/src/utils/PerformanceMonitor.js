/**
 * Performance Monitor
 * Tracks and reports performance metrics for the game
 */

export default class PerformanceMonitor {
  constructor() {
    this.enabled = false;
    this.metrics = {
      fps: [],
      frameTime: [],
      memory: [],
      assetCount: 0,
      culledCount: 0,
      visibleCount: 0
    };
    
    this.maxHistorySize = 60; // Keep last 60 samples
    this.updateInterval = 1000; // Update every second
    this.lastUpdate = 0;
    
    // Performance thresholds
    this.thresholds = {
      minFPS: 30,
      maxFrameTime: 33, // ~30 FPS
      maxMemory: 500 * 1024 * 1024, // 500 MB
      maxAssets: 500
    };
    
    // Warnings
    this.warnings = [];
    this.warningCallbacks = [];
    
    console.log('PerformanceMonitor initialized');
  }

  /**
   * Enable performance monitoring
   */
  enable() {
    this.enabled = true;
    console.log('Performance monitoring enabled');
  }

  /**
   * Disable performance monitoring
   */
  disable() {
    this.enabled = false;
    console.log('Performance monitoring disabled');
  }

  /**
   * Update performance metrics
   * Call this every frame from scene update
   * @param {number} delta - Frame delta time in ms
   */
  update(delta) {
    if (!this.enabled) return;

    const now = Date.now();
    
    // Calculate FPS
    const fps = Math.round(1000 / delta);
    this.metrics.fps.push(fps);
    if (this.metrics.fps.length > this.maxHistorySize) {
      this.metrics.fps.shift();
    }

    // Track frame time
    this.metrics.frameTime.push(delta);
    if (this.metrics.frameTime.length > this.maxHistorySize) {
      this.metrics.frameTime.shift();
    }

    // Update memory (if available)
    if (performance.memory) {
      this.metrics.memory.push(performance.memory.usedJSHeapSize);
      if (this.metrics.memory.length > this.maxHistorySize) {
        this.metrics.memory.shift();
      }
    }

    // Check for performance issues periodically
    if (now - this.lastUpdate >= this.updateInterval) {
      this.checkPerformance();
      this.lastUpdate = now;
    }
  }

  /**
   * Update asset counts
   * @param {number} total - Total assets placed
   * @param {number} visible - Visible assets
   * @param {number} culled - Culled assets
   */
  updateAssetCounts(total, visible, culled) {
    this.metrics.assetCount = total;
    this.metrics.visibleCount = visible;
    this.metrics.culledCount = culled;
  }

  /**
   * Check for performance issues
   */
  checkPerformance() {
    const avgFPS = this.getAverageFPS();
    const avgFrameTime = this.getAverageFrameTime();
    const currentMemory = this.getCurrentMemory();

    // Check FPS
    if (avgFPS < this.thresholds.minFPS) {
      this.addWarning('low-fps', `Low FPS: ${avgFPS} (target: ${this.thresholds.minFPS}+)`);
    }

    // Check frame time
    if (avgFrameTime > this.thresholds.maxFrameTime) {
      this.addWarning('high-frame-time', `High frame time: ${avgFrameTime.toFixed(2)}ms (target: <${this.thresholds.maxFrameTime}ms)`);
    }

    // Check memory
    if (currentMemory > this.thresholds.maxMemory) {
      const memoryMB = (currentMemory / 1024 / 1024).toFixed(2);
      const maxMB = (this.thresholds.maxMemory / 1024 / 1024).toFixed(2);
      this.addWarning('high-memory', `High memory usage: ${memoryMB}MB (target: <${maxMB}MB)`);
    }

    // Check asset count
    if (this.metrics.assetCount > this.thresholds.maxAssets) {
      this.addWarning('too-many-assets', `Too many assets: ${this.metrics.assetCount} (max: ${this.thresholds.maxAssets})`);
    }
  }

  /**
   * Add a performance warning
   * @param {string} type - Warning type
   * @param {string} message - Warning message
   */
  addWarning(type, message) {
    // Check if warning already exists
    const existing = this.warnings.find(w => w.type === type);
    if (existing) {
      existing.count++;
      existing.lastSeen = Date.now();
      return;
    }

    // Add new warning
    const warning = {
      type,
      message,
      count: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now()
    };

    this.warnings.push(warning);
    console.warn(`[Performance] ${message}`);

    // Notify callbacks
    this.warningCallbacks.forEach(callback => callback(warning));
  }

  /**
   * Clear a specific warning
   * @param {string} type - Warning type
   */
  clearWarning(type) {
    this.warnings = this.warnings.filter(w => w.type !== type);
  }

  /**
   * Clear all warnings
   */
  clearAllWarnings() {
    this.warnings = [];
  }

  /**
   * Register a callback for warnings
   * @param {Function} callback - Callback function
   */
  onWarning(callback) {
    this.warningCallbacks.push(callback);
  }

  /**
   * Get average FPS
   * @returns {number} Average FPS
   */
  getAverageFPS() {
    if (this.metrics.fps.length === 0) return 0;
    const sum = this.metrics.fps.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.fps.length);
  }

  /**
   * Get minimum FPS
   * @returns {number} Minimum FPS
   */
  getMinFPS() {
    if (this.metrics.fps.length === 0) return 0;
    return Math.min(...this.metrics.fps);
  }

  /**
   * Get maximum FPS
   * @returns {number} Maximum FPS
   */
  getMaxFPS() {
    if (this.metrics.fps.length === 0) return 0;
    return Math.max(...this.metrics.fps);
  }

  /**
   * Get average frame time
   * @returns {number} Average frame time in ms
   */
  getAverageFrameTime() {
    if (this.metrics.frameTime.length === 0) return 0;
    const sum = this.metrics.frameTime.reduce((a, b) => a + b, 0);
    return sum / this.metrics.frameTime.length;
  }

  /**
   * Get current memory usage
   * @returns {number} Memory usage in bytes
   */
  getCurrentMemory() {
    if (!performance.memory) return 0;
    return performance.memory.usedJSHeapSize;
  }

  /**
   * Get memory usage in MB
   * @returns {number} Memory usage in MB
   */
  getMemoryMB() {
    return (this.getCurrentMemory() / 1024 / 1024).toFixed(2);
  }

  /**
   * Get all metrics
   * @returns {Object} All performance metrics
   */
  getMetrics() {
    return {
      fps: {
        current: this.metrics.fps[this.metrics.fps.length - 1] || 0,
        average: this.getAverageFPS(),
        min: this.getMinFPS(),
        max: this.getMaxFPS()
      },
      frameTime: {
        current: this.metrics.frameTime[this.metrics.frameTime.length - 1] || 0,
        average: this.getAverageFrameTime()
      },
      memory: {
        current: this.getCurrentMemory(),
        currentMB: this.getMemoryMB()
      },
      assets: {
        total: this.metrics.assetCount,
        visible: this.metrics.visibleCount,
        culled: this.metrics.culledCount
      },
      warnings: this.warnings
    };
  }

  /**
   * Get performance report
   * @returns {string} Formatted performance report
   */
  getReport() {
    const metrics = this.getMetrics();
    
    let report = '=== Performance Report ===\n';
    report += `FPS: ${metrics.fps.average} (min: ${metrics.fps.min}, max: ${metrics.fps.max})\n`;
    report += `Frame Time: ${metrics.frameTime.average.toFixed(2)}ms\n`;
    
    if (performance.memory) {
      report += `Memory: ${metrics.memory.currentMB}MB\n`;
    }
    
    report += `Assets: ${metrics.assets.total} (visible: ${metrics.assets.visible}, culled: ${metrics.assets.culled})\n`;
    
    if (this.warnings.length > 0) {
      report += '\nWarnings:\n';
      this.warnings.forEach(w => {
        report += `  - ${w.message} (count: ${w.count})\n`;
      });
    } else {
      report += '\nNo performance warnings\n';
    }
    
    return report;
  }

  /**
   * Log performance report to console
   */
  logReport() {
    console.log(this.getReport());
  }

  /**
   * Export metrics to JSON
   * @returns {string} JSON string of metrics
   */
  exportMetrics() {
    return JSON.stringify(this.getMetrics(), null, 2);
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      fps: [],
      frameTime: [],
      memory: [],
      assetCount: 0,
      culledCount: 0,
      visibleCount: 0
    };
    this.clearAllWarnings();
    console.log('Performance metrics reset');
  }

  /**
   * Set custom thresholds
   * @param {Object} thresholds - Custom threshold values
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
    console.log('Performance thresholds updated:', this.thresholds);
  }

  /**
   * Check if performance is acceptable
   * @returns {boolean} True if performance meets all thresholds
   */
  isPerformanceAcceptable() {
    const avgFPS = this.getAverageFPS();
    const avgFrameTime = this.getAverageFrameTime();
    const currentMemory = this.getCurrentMemory();

    return (
      avgFPS >= this.thresholds.minFPS &&
      avgFrameTime <= this.thresholds.maxFrameTime &&
      currentMemory <= this.thresholds.maxMemory &&
      this.metrics.assetCount <= this.thresholds.maxAssets
    );
  }

  /**
   * Get performance grade
   * @returns {string} Performance grade (A-F)
   */
  getPerformanceGrade() {
    const avgFPS = this.getAverageFPS();
    
    if (avgFPS >= 60) return 'A';
    if (avgFPS >= 50) return 'B';
    if (avgFPS >= 40) return 'C';
    if (avgFPS >= 30) return 'D';
    return 'F';
  }

  /**
   * Destroy the performance monitor
   */
  destroy() {
    this.enabled = false;
    this.reset();
    this.warningCallbacks = [];
    console.log('PerformanceMonitor destroyed');
  }
}
