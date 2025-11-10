# Performance Monitor Integration Guide

## Quick Start

### 1. Import PerformanceMonitor

```javascript
import PerformanceMonitor from '../utils/PerformanceMonitor.js';
```

### 2. Initialize in GameScene

```javascript
export default class GameScene extends Phaser.Scene {
  create() {
    // ... existing code ...
    
    // Initialize performance monitor
    this.perfMonitor = new PerformanceMonitor();
    this.perfMonitor.enable();
    
    // Optional: Set custom thresholds
    this.perfMonitor.setThresholds({
      minFPS: 30,
      maxFrameTime: 33,
      maxMemory: 500 * 1024 * 1024, // 500 MB
      maxAssets: 500
    });
    
    // Optional: Listen for performance warnings
    this.perfMonitor.onWarning((warning) => {
      console.warn(`⚠️ Performance Warning: ${warning.message}`);
      
      // Show warning in UI
      if (this.scene.get('UIScene')) {
        this.scene.get('UIScene').events.emit('show-warning', warning.message);
      }
    });
  }
  
  update(time, delta) {
    // ... existing code ...
    
    // Update performance monitor
    if (this.perfMonitor) {
      this.perfMonitor.update(delta);
      
      // Update asset counts
      if (this.worldManager) {
        const cullingStats = this.worldManager.getCullingStats();
        const assetInfo = this.worldManager.getAssetCountInfo();
        
        this.perfMonitor.updateAssetCounts(
          assetInfo.current,
          cullingStats.visible,
          cullingStats.culled
        );
      }
    }
    
    // Optional: Log performance report every 10 seconds
    if (time % 10000 < delta) {
      this.perfMonitor.logReport();
    }
  }
}
```

### 3. Display Metrics in UIScene

```javascript
export default class UIScene extends Phaser.Scene {
  create() {
    // ... existing code ...
    
    // Create performance display (optional)
    this.createPerformanceDisplay();
    
    // Update every second
    this.time.addEvent({
      delay: 1000,
      callback: this.updatePerformanceDisplay,
      callbackScope: this,
      loop: true
    });
  }
  
  createPerformanceDisplay() {
    // Create FPS counter in top-right corner
    this.fpsText = this.add.text(
      this.cameras.main.width - 10,
      10,
      'FPS: --',
      {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
      }
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);
  }
  
  updatePerformanceDisplay() {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene || !gameScene.perfMonitor) return;
    
    const metrics = gameScene.perfMonitor.getMetrics();
    
    // Update FPS text with color coding
    const fps = metrics.fps.average;
    let color = '#90ee90'; // Green
    if (fps < 30) color = '#ff6b6b'; // Red
    else if (fps < 45) color = '#ffd700'; // Yellow
    
    this.fpsText.setText(`FPS: ${fps}`);
    this.fpsText.setColor(color);
    
    // Show warnings if any
    if (metrics.warnings.length > 0) {
      const warning = metrics.warnings[0];
      this.showPerformanceWarning(warning.message);
    }
  }
  
  showPerformanceWarning(message) {
    // Show warning toast or modal
    console.warn('Performance Warning:', message);
    // Implement your UI warning display here
  }
}
```

## API Reference

### PerformanceMonitor Methods

#### enable()
Enable performance monitoring.

```javascript
perfMonitor.enable();
```

#### disable()
Disable performance monitoring.

```javascript
perfMonitor.disable();
```

#### update(delta)
Update performance metrics. Call every frame.

```javascript
update(time, delta) {
  perfMonitor.update(delta);
}
```

#### updateAssetCounts(total, visible, culled)
Update asset count metrics.

```javascript
const cullingStats = worldManager.getCullingStats();
const assetInfo = worldManager.getAssetCountInfo();

perfMonitor.updateAssetCounts(
  assetInfo.current,
  cullingStats.visible,
  cullingStats.culled
);
```

#### getMetrics()
Get all performance metrics.

```javascript
const metrics = perfMonitor.getMetrics();
console.log('FPS:', metrics.fps.average);
console.log('Memory:', metrics.memory.currentMB, 'MB');
console.log('Assets:', metrics.assets.total);
```

#### getReport()
Get formatted performance report.

```javascript
const report = perfMonitor.getReport();
console.log(report);
```

#### logReport()
Log performance report to console.

```javascript
perfMonitor.logReport();
```

#### setThresholds(thresholds)
Set custom performance thresholds.

```javascript
perfMonitor.setThresholds({
  minFPS: 30,
  maxFrameTime: 33,
  maxMemory: 500 * 1024 * 1024,
  maxAssets: 500
});
```

#### onWarning(callback)
Register callback for performance warnings.

```javascript
perfMonitor.onWarning((warning) => {
  console.warn(warning.message);
  // Handle warning
});
```

#### isPerformanceAcceptable()
Check if performance meets all thresholds.

```javascript
if (!perfMonitor.isPerformanceAcceptable()) {
  console.warn('Performance below acceptable levels');
}
```

#### getPerformanceGrade()
Get performance grade (A-F).

```javascript
const grade = perfMonitor.getPerformanceGrade();
console.log('Performance Grade:', grade);
```

#### reset()
Reset all metrics.

```javascript
perfMonitor.reset();
```

#### destroy()
Destroy the performance monitor.

```javascript
perfMonitor.destroy();
```

## Metrics Object Structure

```javascript
{
  fps: {
    current: 60,      // Current FPS
    average: 58,      // Average FPS
    min: 45,          // Minimum FPS
    max: 60           // Maximum FPS
  },
  frameTime: {
    current: 16.7,    // Current frame time (ms)
    average: 17.2     // Average frame time (ms)
  },
  memory: {
    current: 314572800,  // Current memory (bytes)
    currentMB: "300.00"  // Current memory (MB)
  },
  assets: {
    total: 250,       // Total assets placed
    visible: 75,      // Visible assets
    culled: 175       // Culled assets
  },
  warnings: [
    {
      type: "low-fps",
      message: "Low FPS: 25 (target: 30+)",
      count: 3,
      firstSeen: 1705334400000,
      lastSeen: 1705334403000
    }
  ]
}
```

## Warning Types

| Type | Description | Threshold |
|------|-------------|-----------|
| `low-fps` | FPS below minimum | <30 FPS |
| `high-frame-time` | Frame time too high | >33ms |
| `high-memory` | Memory usage too high | >500MB |
| `too-many-assets` | Too many assets placed | >500 assets |

## Performance Grades

| Grade | FPS Range | Description |
|-------|-----------|-------------|
| A | 60+ | Excellent |
| B | 50-59 | Good |
| C | 40-49 | Acceptable |
| D | 30-39 | Poor |
| F | <30 | Unacceptable |

## Example: Debug Mode

```javascript
export default class GameScene extends Phaser.Scene {
  create() {
    // ... existing code ...
    
    // Enable debug mode with keyboard shortcut
    this.input.keyboard.on('keydown-F3', () => {
      this.toggleDebugMode();
    });
  }
  
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    
    if (this.debugMode) {
      // Enable performance monitor
      if (!this.perfMonitor) {
        this.perfMonitor = new PerformanceMonitor();
      }
      this.perfMonitor.enable();
      
      // Show debug overlay
      this.createDebugOverlay();
      
      console.log('Debug mode enabled');
    } else {
      // Disable performance monitor
      if (this.perfMonitor) {
        this.perfMonitor.disable();
      }
      
      // Hide debug overlay
      if (this.debugOverlay) {
        this.debugOverlay.destroy();
      }
      
      console.log('Debug mode disabled');
    }
  }
  
  createDebugOverlay() {
    // Create debug text overlay
    this.debugOverlay = this.add.text(10, 10, '', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    }).setScrollFactor(0).setDepth(1000);
    
    // Update every frame
    this.debugUpdateEvent = this.time.addEvent({
      delay: 100,
      callback: this.updateDebugOverlay,
      callbackScope: this,
      loop: true
    });
  }
  
  updateDebugOverlay() {
    if (!this.debugOverlay || !this.perfMonitor) return;
    
    const metrics = this.perfMonitor.getMetrics();
    const grade = this.perfMonitor.getPerformanceGrade();
    
    let text = '=== DEBUG INFO ===\n';
    text += `FPS: ${metrics.fps.average} (${metrics.fps.min}-${metrics.fps.max})\n`;
    text += `Frame Time: ${metrics.frameTime.average.toFixed(2)}ms\n`;
    
    if (performance.memory) {
      text += `Memory: ${metrics.memory.currentMB}MB\n`;
    }
    
    text += `Assets: ${metrics.assets.total} (V:${metrics.assets.visible} C:${metrics.assets.culled})\n`;
    text += `Grade: ${grade}\n`;
    
    if (metrics.warnings.length > 0) {
      text += '\nWARNINGS:\n';
      metrics.warnings.forEach(w => {
        text += `- ${w.message}\n`;
      });
    }
    
    this.debugOverlay.setText(text);
  }
}
```

## Testing

### Manual Testing

1. **Enable Performance Monitor**
   ```javascript
   // In browser console
   game.scene.scenes[0].perfMonitor.enable();
   ```

2. **Check Metrics**
   ```javascript
   // Get current metrics
   const metrics = game.scene.scenes[0].perfMonitor.getMetrics();
   console.log(metrics);
   ```

3. **Get Report**
   ```javascript
   // Log performance report
   game.scene.scenes[0].perfMonitor.logReport();
   ```

4. **Export Metrics**
   ```javascript
   // Export to JSON
   const json = game.scene.scenes[0].perfMonitor.exportMetrics();
   console.log(json);
   ```

### Automated Testing

Use the performance profiling tool:
```
test-performance-profiling.html
```

## Best Practices

1. **Enable Only When Needed**
   - Don't enable in production by default
   - Use debug mode or development builds
   - Disable for release builds

2. **Monitor Periodically**
   - Update metrics every frame
   - Log reports every 10 seconds
   - Check warnings regularly

3. **Set Appropriate Thresholds**
   - Adjust based on target hardware
   - Consider minimum requirements
   - Test on various devices

4. **Handle Warnings**
   - Show user-friendly messages
   - Suggest optimizations
   - Provide options to reduce quality

5. **Profile Regularly**
   - Test with various asset counts
   - Test different scenarios
   - Monitor over time

## Troubleshooting

### Performance Monitor Not Working

```javascript
// Check if enabled
console.log(perfMonitor.enabled); // Should be true

// Check if updating
console.log(perfMonitor.metrics.fps.length); // Should increase

// Check for errors
console.log(perfMonitor.warnings);
```

### Metrics Not Updating

```javascript
// Ensure update() is called every frame
update(time, delta) {
  perfMonitor.update(delta); // Must be called
}

// Check delta value
console.log(delta); // Should be ~16-17ms at 60 FPS
```

### Memory API Not Available

```javascript
// Check browser support
if (performance.memory) {
  console.log('Memory API available');
} else {
  console.warn('Memory API not available (Firefox/Safari)');
}
```

## Conclusion

The PerformanceMonitor provides comprehensive performance tracking and monitoring for the game. Use it during development and testing to ensure optimal performance across all scenarios.

---

**See Also:**
- test-performance-profiling.html - Interactive testing tool
- BROWSER_COMPATIBILITY_TEST.md - Browser testing guide
- PERFORMANCE_OPTIMIZATIONS.md - Optimization guide
