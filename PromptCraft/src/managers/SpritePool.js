/**
 * Sprite Pool
 * Manages sprite object pooling for performance optimization
 * Reuses sprite objects instead of destroying and creating new ones
 */

export default class SpritePool {
  constructor(scene) {
    this.scene = scene;
    
    // Pool storage: Map<textureKey, Array<sprite>>
    this.pools = new Map();
    
    // Initial pool sizes for common asset types
    this.initialPoolSizes = {
      default: 10,
      character: 5,
      object: 15,
      terrain: 20,
      decoration: 10,
      building: 5
    };
    
    // Track active sprites
    this.activeSprites = new Set();
    
    console.log('SpritePool initialized');
  }

  /**
   * Get a sprite from the pool or create a new one
   * @param {string} textureKey - Texture key for the sprite
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Phaser.GameObjects.Sprite} Sprite instance
   */
  getFromPool(textureKey, x, y) {
    // Initialize pool for this texture if it doesn't exist
    if (!this.pools.has(textureKey)) {
      this.pools.set(textureKey, []);
    }

    const pool = this.pools.get(textureKey);
    let sprite;

    // Try to get an inactive sprite from the pool
    if (pool.length > 0) {
      sprite = pool.pop();
      
      // Reset sprite properties
      sprite.setActive(true);
      sprite.setVisible(true);
      sprite.setPosition(x, y);
      sprite.setRotation(0);
      sprite.setScale(1, 1);
      sprite.setAlpha(1);
      sprite.clearTint();
      sprite.setDepth(0);
      
      // Reset physics body if it exists
      if (sprite.body) {
        sprite.body.enable = true;
        sprite.body.setAllowGravity(false);
        sprite.body.setImmovable(true);
        sprite.body.setVelocity(0, 0);
      }
      
      console.log(`Sprite reused from pool: ${textureKey} (pool size: ${pool.length})`);
    } else {
      // Create new sprite if pool is empty
      sprite = this.scene.physics.add.sprite(x, y, textureKey);
      sprite.body.setAllowGravity(false);
      sprite.body.setImmovable(true);
      
      console.log(`New sprite created: ${textureKey}`);
    }

    // Track as active
    this.activeSprites.add(sprite);

    return sprite;
  }

  /**
   * Return a sprite to the pool for reuse
   * @param {Phaser.GameObjects.Sprite} sprite - Sprite to return
   * @param {string} textureKey - Texture key for the sprite
   */
  returnToPool(sprite, textureKey) {
    if (!sprite) {
      return;
    }

    // Remove from active tracking
    this.activeSprites.delete(sprite);

    // Initialize pool for this texture if it doesn't exist
    if (!this.pools.has(textureKey)) {
      this.pools.set(textureKey, []);
    }

    const pool = this.pools.get(textureKey);

    // Deactivate sprite instead of destroying
    sprite.setActive(false);
    sprite.setVisible(false);
    
    // Stop any animations
    if (sprite.anims && sprite.anims.isPlaying) {
      sprite.anims.stop();
    }
    
    // Disable physics body
    if (sprite.body) {
      sprite.body.enable = false;
    }
    
    // Clear interactive state
    sprite.disableInteractive();
    
    // Clear data
    sprite.data.reset();

    // Add back to pool
    pool.push(sprite);

    console.log(`Sprite returned to pool: ${textureKey} (pool size: ${pool.length})`);
  }

  /**
   * Pre-warm a pool with sprites for a specific texture
   * @param {string} textureKey - Texture key
   * @param {number} count - Number of sprites to create
   */
  prewarmPool(textureKey, count = 10) {
    if (!this.scene.textures.exists(textureKey)) {
      console.warn(`Cannot prewarm pool: texture ${textureKey} does not exist`);
      return;
    }

    if (!this.pools.has(textureKey)) {
      this.pools.set(textureKey, []);
    }

    const pool = this.pools.get(textureKey);

    for (let i = 0; i < count; i++) {
      const sprite = this.scene.physics.add.sprite(0, 0, textureKey);
      sprite.setActive(false);
      sprite.setVisible(false);
      sprite.body.enable = false;
      pool.push(sprite);
    }

    console.log(`Pool prewarmed: ${textureKey} with ${count} sprites`);
  }

  /**
   * Clear a specific pool
   * @param {string} textureKey - Texture key
   */
  clearPool(textureKey) {
    if (!this.pools.has(textureKey)) {
      return;
    }

    const pool = this.pools.get(textureKey);
    
    // Destroy all sprites in the pool
    pool.forEach(sprite => {
      if (sprite && sprite.scene) {
        sprite.destroy();
      }
    });

    this.pools.delete(textureKey);
    console.log(`Pool cleared: ${textureKey}`);
  }

  /**
   * Clear all pools
   */
  clearAllPools() {
    this.pools.forEach((pool, textureKey) => {
      pool.forEach(sprite => {
        if (sprite && sprite.scene) {
          sprite.destroy();
        }
      });
    });

    this.pools.clear();
    this.activeSprites.clear();
    console.log('All pools cleared');
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getStats() {
    const stats = {
      totalPools: this.pools.size,
      totalPooledSprites: 0,
      activeSprites: this.activeSprites.size,
      poolDetails: {}
    };

    this.pools.forEach((pool, textureKey) => {
      stats.totalPooledSprites += pool.length;
      stats.poolDetails[textureKey] = pool.length;
    });

    return stats;
  }

  /**
   * Destroy the sprite pool and all sprites
   */
  destroy() {
    this.clearAllPools();
    console.log('SpritePool destroyed');
  }
}
