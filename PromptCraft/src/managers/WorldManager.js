/**
 * World Manager
 * Manages placed assets and world state
 * Handles placement, transformations, physics, and persistence
 */

import { generateUUID, debounce } from '../utils/helpers.js';
import SpritePool from './SpritePool.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

export default class WorldManager {
  constructor(scene, storageService) {
    this.scene = scene;
    this.storageService = storageService;
    
    // Initialize sprite pool for performance
    this.spritePool = new SpritePool(scene);
    
    // Array to track all placed assets
    this.placedAssets = [];
    
    // Currently selected asset reference
    this.selectedAsset = null;
    
    // Sprite group for managing placed asset sprites
    this.spriteGroup = this.scene.physics.add.group({
      immovable: true,
      allowGravity: false
    });
    
    // Placement mode state
    this.placementMode = false;
    this.placementPreview = null;
    this.placementAssetData = null;
    
    // Transformation state
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    // Transformation handles
    this.transformHandles = null;
    
    // Debounced save function (max once per 2 seconds)
    this.debouncedSave = debounce(() => this.saveWorld(), 2000);
    
    // Culling system
    this.cullingEnabled = true;
    this.cullingMargin = 100; // Extra pixels around camera bounds
    
    console.log('WorldManager initialized');
  }

  // ==================== Culling System ====================

  /**
   * Update culling for all placed assets
   * Hides sprites outside camera bounds for performance
   * Called each frame by the scene
   */
  updateCulling() {
    if (!this.cullingEnabled || this.placedAssets.length === 0) {
      return;
    }

    // Get camera bounds
    const camera = this.scene.cameras.main;
    const bounds = {
      left: camera.worldView.x - this.cullingMargin,
      right: camera.worldView.x + camera.worldView.width + this.cullingMargin,
      top: camera.worldView.y - this.cullingMargin,
      bottom: camera.worldView.y + camera.worldView.height + this.cullingMargin
    };

    // Check each placed asset
    this.placedAssets.forEach(asset => {
      if (!asset.sprite || !asset.sprite.active) {
        return;
      }

      const sprite = asset.sprite;
      const spriteX = sprite.x;
      const spriteY = sprite.y;

      // Get sprite bounds (accounting for scale)
      const spriteWidth = sprite.width * Math.abs(sprite.scaleX);
      const spriteHeight = sprite.height * Math.abs(sprite.scaleY);
      const halfWidth = spriteWidth / 2;
      const halfHeight = spriteHeight / 2;

      // Check if sprite is within camera bounds
      const isVisible = (
        spriteX + halfWidth >= bounds.left &&
        spriteX - halfWidth <= bounds.right &&
        spriteY + halfHeight >= bounds.top &&
        spriteY - halfHeight <= bounds.bottom
      );

      // Update visibility
      sprite.setVisible(isVisible);
      
      // Also disable physics body for culled sprites to save performance
      if (sprite.body) {
        sprite.body.enable = isVisible && asset.collisionEnabled;
      }
    });
  }

  /**
   * Enable or disable culling system
   * @param {boolean} enabled - True to enable culling
   */
  setCullingEnabled(enabled) {
    this.cullingEnabled = enabled;
    
    // If disabling, make all sprites visible
    if (!enabled) {
      this.placedAssets.forEach(asset => {
        if (asset.sprite && asset.sprite.active) {
          asset.sprite.setVisible(true);
          if (asset.sprite.body && asset.collisionEnabled) {
            asset.sprite.body.enable = true;
          }
        }
      });
    }
    
    console.log(`Culling ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set culling margin (extra pixels around camera)
   * @param {number} margin - Margin in pixels
   */
  setCullingMargin(margin) {
    this.cullingMargin = Math.max(0, margin);
    console.log(`Culling margin set to ${this.cullingMargin}px`);
  }

  /**
   * Get culling statistics
   * @returns {Object} Culling stats
   */
  getCullingStats() {
    let visibleCount = 0;
    let culledCount = 0;

    this.placedAssets.forEach(asset => {
      if (asset.sprite && asset.sprite.active) {
        if (asset.sprite.visible) {
          visibleCount++;
        } else {
          culledCount++;
        }
      }
    });

    return {
      total: this.placedAssets.length,
      visible: visibleCount,
      culled: culledCount,
      cullingEnabled: this.cullingEnabled
    };
  }

  // ==================== Placed Asset Management ====================

  /**
   * Add a placed asset to the world
   * Creates sprite and physics body at specified position
   * @param {Object} params - Placement parameters
   * @returns {Object} Placed asset data or null if limit reached
   */
  addPlacedAsset(params) {
    // Check asset count limit
    if (this.placedAssets.length >= GAME_CONFIG.MAX_ASSETS) {
      console.error(`Cannot place asset: Maximum asset limit (${GAME_CONFIG.MAX_ASSETS}) reached`);
      
      // Emit event for UI to show error
      this.scene.events.emit('asset-limit-reached', {
        current: this.placedAssets.length,
        max: GAME_CONFIG.MAX_ASSETS
      });
      
      return null;
    }

    // Show warning if approaching limit
    if (this.placedAssets.length >= GAME_CONFIG.ASSET_WARNING_THRESHOLD) {
      console.warn(`Warning: Approaching asset limit (${this.placedAssets.length}/${GAME_CONFIG.MAX_ASSETS})`);
      
      // Emit event for UI to show warning
      this.scene.events.emit('asset-limit-warning', {
        current: this.placedAssets.length,
        max: GAME_CONFIG.MAX_ASSETS,
        threshold: GAME_CONFIG.ASSET_WARNING_THRESHOLD
      });
    }

    const {
      assetId,
      textureKey,
      position,
      rotation = 0,
      scale = { x: 1, y: 1 },
      collisionEnabled = false,
      zIndex = 0,
      animationKey = null,
      animationConfig = null
    } = params;

    // Generate unique instance ID
    const instanceId = generateUUID();

    // Get sprite from pool instead of creating new one
    const sprite = this.spritePool.getFromPool(textureKey, position.x, position.y);
    
    // Set sprite properties
    sprite.setRotation(rotation);
    sprite.setScale(scale.x, scale.y);
    sprite.setDepth(zIndex);
    
    // Store instance ID on sprite for reference
    sprite.setData('instanceId', instanceId);
    sprite.setData('assetId', assetId);
    
    // Play animation if provided
    if (animationKey && this.scene.anims.exists(animationKey)) {
      sprite.play(animationKey);
      sprite.setData('animationKey', animationKey);
      console.log(`Playing animation: ${animationKey}`);
    }
    
    // Configure physics body
    sprite.body.setAllowGravity(false);
    sprite.body.setImmovable(true);
    
    // Set collision based on parameter
    if (collisionEnabled) {
      sprite.body.enable = true;
    } else {
      sprite.body.enable = false;
    }
    
    // Add to sprite group
    this.spriteGroup.add(sprite);
    
    // Make sprite interactive for selection
    sprite.setInteractive();
    
    // Create placed asset data structure
    const placedAsset = {
      instanceId,
      assetId,
      position: { x: position.x, y: position.y },
      rotation,
      scale: { x: scale.x, y: scale.y },
      collisionEnabled,
      zIndex,
      animationKey,
      animationConfig,
      sprite // Keep reference to sprite
    };
    
    // Add to placed assets array
    this.placedAssets.push(placedAsset);
    
    console.log(`Asset placed: ${instanceId} at (${position.x}, ${position.y})`);
    
    // Trigger auto-save
    this.debouncedSave();
    
    return placedAsset;
  }

  /**
   * Get all placed assets
   * @returns {Array} Array of placed asset data
   */
  getAllPlacedAssets() {
    return [...this.placedAssets];
  }

  /**
   * Get a placed asset by instance ID
   * @param {string} instanceId - Instance ID
   * @returns {Object|null} Placed asset data or null
   */
  getPlacedAsset(instanceId) {
    return this.placedAssets.find(asset => asset.instanceId === instanceId) || null;
  }

  /**
   * Get sprite by instance ID
   * @param {string} instanceId - Instance ID
   * @returns {Phaser.GameObjects.Sprite|null} Sprite or null
   */
  getSprite(instanceId) {
    const asset = this.getPlacedAsset(instanceId);
    return asset ? asset.sprite : null;
  }

  // ==================== Selection Management ====================

  /**
   * Select an asset and show transformation handles
   * @param {string} instanceId - Instance ID to select
   */
  selectAsset(instanceId) {
    // Deselect current asset first
    if (this.selectedAsset) {
      this.deselectAsset();
    }
    
    const asset = this.getPlacedAsset(instanceId);
    
    if (!asset) {
      console.warn(`Cannot select asset: ${instanceId} not found`);
      return;
    }
    
    this.selectedAsset = asset;
    
    // Highlight the sprite
    asset.sprite.setTint(0x00ff00);
    
    // Show transformation handles
    this._showTransformHandles(asset);
    
    console.log(`Asset selected: ${instanceId}`);
  }

  /**
   * Deselect current asset and hide handles
   */
  deselectAsset() {
    if (!this.selectedAsset) {
      return;
    }
    
    // Remove tint
    this.selectedAsset.sprite.clearTint();
    
    // Hide transformation handles
    this._hideTransformHandles();
    
    console.log(`Asset deselected: ${this.selectedAsset.instanceId}`);
    
    this.selectedAsset = null;
  }

  /**
   * Get currently selected asset
   * @returns {Object|null} Selected asset data or null
   */
  getSelectedAsset() {
    return this.selectedAsset;
  }

  // ==================== Placement Mode ====================

  /**
   * Enter placement mode with an asset
   * Shows preview that follows mouse cursor
   * @param {Object} assetData - Asset data including textureKey, animationKey, and animationConfig
   */
  enterPlacementMode(assetData) {
    // Exit any existing placement mode
    this.exitPlacementMode();
    
    // Deselect any selected asset
    if (this.selectedAsset) {
      this.deselectAsset();
    }
    
    this.placementMode = true;
    this.placementAssetData = assetData;
    
    // Create preview sprite
    this.placementPreview = this.scene.add.sprite(0, 0, assetData.textureKey);
    this.placementPreview.setAlpha(0.6);
    this.placementPreview.setDepth(9999); // Always on top
    this.placementPreview.setTint(0x00ff00);
    
    // Play animation on preview if available
    if (assetData.animationKey && this.scene.anims.exists(assetData.animationKey)) {
      this.placementPreview.play(assetData.animationKey);
      console.log(`Playing animation on preview: ${assetData.animationKey}`);
    }
    
    // Set up pointer move listener for preview
    this.scene.input.on('pointermove', this._handlePlacementPreview, this);
    
    // Set up click listener for placement
    this.scene.input.on('pointerdown', this._handlePlacementClick, this);
    
    console.log('Entered placement mode for asset:', assetData.assetId);
  }

  /**
   * Exit placement mode and clear preview
   */
  exitPlacementMode() {
    if (!this.placementMode) {
      return;
    }
    
    this.placementMode = false;
    
    // Destroy preview sprite
    if (this.placementPreview) {
      this.placementPreview.destroy();
      this.placementPreview = null;
    }
    
    // Remove input listeners
    this.scene.input.off('pointermove', this._handlePlacementPreview, this);
    this.scene.input.off('pointerdown', this._handlePlacementClick, this);
    
    this.placementAssetData = null;
    
    console.log('Exited placement mode');
  }

  /**
   * Check if in placement mode
   * @returns {boolean} True if in placement mode
   */
  isInPlacementMode() {
    return this.placementMode;
  }

  /**
   * Handle placement preview movement
   * @private
   */
  _handlePlacementPreview(pointer) {
    if (!this.placementPreview) {
      return;
    }
    
    // Convert screen coordinates to world coordinates
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Update preview position
    this.placementPreview.setPosition(worldPoint.x, worldPoint.y);
  }

  /**
   * Handle placement click to place asset
   * @private
   */
  _handlePlacementClick(pointer) {
    if (!this.placementMode || !this.placementAssetData) {
      return;
    }
    
    // Ignore right-click (used for canceling)
    if (pointer.rightButtonDown()) {
      this.exitPlacementMode();
      return;
    }
    
    // Convert screen coordinates to world coordinates
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Place the asset at cursor position with animation support
    this.addPlacedAsset({
      assetId: this.placementAssetData.assetId,
      textureKey: this.placementAssetData.textureKey,
      position: { x: worldPoint.x, y: worldPoint.y },
      rotation: 0,
      scale: { x: 1, y: 1 },
      collisionEnabled: false,
      zIndex: 0,
      animationKey: this.placementAssetData.animationKey || null,
      animationConfig: this.placementAssetData.animationConfig || null
    });
    
    // Stay in placement mode to allow multiple placements
    // User can exit with ESC or right-click
  }

  // ==================== Physics and Collision ====================

  /**
   * Set collision enabled/disabled for an asset
   * @param {string} instanceId - Instance ID
   * @param {boolean} enabled - True to enable collision
   */
  setCollisionEnabled(instanceId, enabled) {
    const asset = this.getPlacedAsset(instanceId);
    
    if (!asset) {
      console.warn(`Cannot set collision: ${instanceId} not found`);
      return;
    }
    
    // Update collision state
    asset.collisionEnabled = enabled;
    
    // Update physics body
    if (enabled) {
      asset.sprite.body.enable = true;
      this.updatePhysicsBody(instanceId);
    } else {
      asset.sprite.body.enable = false;
    }
    
    console.log(`Collision ${enabled ? 'enabled' : 'disabled'} for asset: ${instanceId}`);
    
    // Trigger auto-save
    this.debouncedSave();
  }

  /**
   * Toggle collision for selected asset
   */
  toggleCollisionForSelected() {
    if (!this.selectedAsset) {
      return;
    }
    
    const newState = !this.selectedAsset.collisionEnabled;
    this.setCollisionEnabled(this.selectedAsset.instanceId, newState);
  }

  /**
   * Update physics body to match sprite dimensions and transformations
   * @param {string} instanceId - Instance ID
   */
  updatePhysicsBody(instanceId) {
    const asset = this.getPlacedAsset(instanceId);
    
    if (!asset || !asset.collisionEnabled) {
      return;
    }
    
    const sprite = asset.sprite;
    
    // Get sprite dimensions after scaling
    const width = sprite.width * Math.abs(asset.scale.x);
    const height = sprite.height * Math.abs(asset.scale.y);
    
    // Update physics body size
    sprite.body.setSize(width, height);
    
    // Refresh body to apply changes
    sprite.body.updateFromGameObject();
  }

  /**
   * Set up collision between placed assets and player
   * @param {Phaser.GameObjects.Sprite} player - Player sprite
   */
  setupPlayerCollision(player) {
    if (!player) {
      console.warn('Cannot setup player collision: player is null');
      return;
    }
    
    // Add collider between player and all placed assets
    this.scene.physics.add.collider(player, this.spriteGroup);
    
    console.log('Player collision with placed assets enabled');
  }

  /**
   * Get all assets with collision enabled
   * @returns {Array} Array of assets with collision
   */
  getCollidableAssets() {
    return this.placedAssets.filter(asset => asset.collisionEnabled);
  }

  // ==================== Asset Deletion ====================

  /**
   * Remove a placed asset from the world
   * @param {string} instanceId - Instance ID to remove
   * @param {boolean} skipConfirmation - Skip confirmation dialog
   * @returns {boolean} True if removed successfully
   */
  removePlacedAsset(instanceId, skipConfirmation = false) {
    const asset = this.getPlacedAsset(instanceId);
    
    if (!asset) {
      console.warn(`Cannot remove asset: ${instanceId} not found`);
      return false;
    }
    
    // Show confirmation dialog if not skipped
    if (!skipConfirmation) {
      const confirmed = confirm('Are you sure you want to delete this asset?');
      if (!confirmed) {
        return false;
      }
    }
    
    // Deselect if this is the selected asset
    if (this.selectedAsset && this.selectedAsset.instanceId === instanceId) {
      this.deselectAsset();
    }
    
    // Return sprite to pool instead of destroying
    if (asset.sprite) {
      const textureKey = asset.sprite.texture.key;
      this.spritePool.returnToPool(asset.sprite, textureKey);
    }
    
    // Remove from placed assets array
    const index = this.placedAssets.findIndex(a => a.instanceId === instanceId);
    if (index !== -1) {
      this.placedAssets.splice(index, 1);
    }
    
    console.log(`Asset removed: ${instanceId}`);
    
    // Trigger auto-save
    this.debouncedSave();
    
    return true;
  }

  /**
   * Remove selected asset (called by delete key handler)
   * @returns {boolean} True if removed successfully
   */
  removeSelectedAsset() {
    if (!this.selectedAsset) {
      console.warn('No asset selected to remove');
      return false;
    }
    
    return this.removePlacedAsset(this.selectedAsset.instanceId, false);
  }

  // ==================== Transformation Controls ====================

  /**
   * Move an asset to a new position
   * @param {string} instanceId - Instance ID
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  moveAsset(instanceId, x, y) {
    const asset = this.getPlacedAsset(instanceId);
    
    if (!asset) {
      console.warn(`Cannot move asset: ${instanceId} not found`);
      return;
    }
    
    // Update position
    asset.position.x = x;
    asset.position.y = y;
    
    // Update sprite
    asset.sprite.setPosition(x, y);
    
    // Update transform handles if this is the selected asset
    if (this.selectedAsset && this.selectedAsset.instanceId === instanceId) {
      this._updateTransformHandles();
    }
    
    // Trigger auto-save
    this.debouncedSave();
  }

  /**
   * Rotate an asset
   * @param {string} instanceId - Instance ID
   * @param {number} angle - Rotation angle in radians
   */
  rotateAsset(instanceId, angle) {
    const asset = this.getPlacedAsset(instanceId);
    
    if (!asset) {
      console.warn(`Cannot rotate asset: ${instanceId} not found`);
      return;
    }
    
    // Update rotation
    asset.rotation = angle;
    
    // Update sprite
    asset.sprite.setRotation(angle);
    
    // Update physics body if collision is enabled
    if (asset.collisionEnabled) {
      this.updatePhysicsBody(instanceId);
    }
    
    // Trigger auto-save
    this.debouncedSave();
  }

  /**
   * Scale an asset
   * @param {string} instanceId - Instance ID
   * @param {number} scaleX - X scale factor
   * @param {number} scaleY - Y scale factor
   */
  scaleAsset(instanceId, scaleX, scaleY) {
    const asset = this.getPlacedAsset(instanceId);
    
    if (!asset) {
      console.warn(`Cannot scale asset: ${instanceId} not found`);
      return;
    }
    
    // Update scale
    asset.scale.x = scaleX;
    asset.scale.y = scaleY;
    
    // Update sprite
    asset.sprite.setScale(scaleX, scaleY);
    
    // Update physics body if collision is enabled
    if (asset.collisionEnabled) {
      this.updatePhysicsBody(instanceId);
    }
    
    // Update transform handles if this is the selected asset
    if (this.selectedAsset && this.selectedAsset.instanceId === instanceId) {
      this._updateTransformHandles();
    }
    
    // Trigger auto-save
    this.debouncedSave();
  }

  /**
   * Start dragging an asset
   * @param {string} instanceId - Instance ID
   * @param {number} pointerX - Pointer X position
   * @param {number} pointerY - Pointer Y position
   */
  startDrag(instanceId, pointerX, pointerY) {
    const asset = this.getPlacedAsset(instanceId);
    
    if (!asset) {
      return;
    }
    
    // Select the asset if not already selected
    if (!this.selectedAsset || this.selectedAsset.instanceId !== instanceId) {
      this.selectAsset(instanceId);
    }
    
    this.isDragging = true;
    
    // Calculate offset from pointer to asset position
    this.dragOffset.x = asset.position.x - pointerX;
    this.dragOffset.y = asset.position.y - pointerY;
  }

  /**
   * Update drag position
   * @param {number} pointerX - Pointer X position
   * @param {number} pointerY - Pointer Y position
   */
  updateDrag(pointerX, pointerY) {
    if (!this.isDragging || !this.selectedAsset) {
      return;
    }
    
    // Calculate new position with offset
    const newX = pointerX + this.dragOffset.x;
    const newY = pointerY + this.dragOffset.y;
    
    // Move the asset
    this.moveAsset(this.selectedAsset.instanceId, newX, newY);
  }

  /**
   * Stop dragging
   */
  stopDrag() {
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
  }

  /**
   * Handle keyboard rotation (Q/E keys)
   * @param {string} direction - 'left' or 'right'
   */
  rotateSelectedAsset(direction) {
    if (!this.selectedAsset) {
      return;
    }
    
    const rotationStep = Math.PI / 8; // 22.5 degrees
    const currentRotation = this.selectedAsset.rotation;
    
    let newRotation;
    if (direction === 'left') {
      newRotation = currentRotation - rotationStep;
    } else if (direction === 'right') {
      newRotation = currentRotation + rotationStep;
    } else {
      return;
    }
    
    this.rotateAsset(this.selectedAsset.instanceId, newRotation);
  }

  /**
   * Handle keyboard scaling (+ / - keys)
   * @param {string} direction - 'up' or 'down'
   */
  scaleSelectedAsset(direction) {
    if (!this.selectedAsset) {
      return;
    }
    
    const scaleStep = 0.1;
    const currentScale = this.selectedAsset.scale;
    
    let newScaleX, newScaleY;
    if (direction === 'up') {
      newScaleX = Math.min(currentScale.x + scaleStep, 5); // Max 5x
      newScaleY = Math.min(currentScale.y + scaleStep, 5);
    } else if (direction === 'down') {
      newScaleX = Math.max(currentScale.x - scaleStep, 0.1); // Min 0.1x
      newScaleY = Math.max(currentScale.y - scaleStep, 0.1);
    } else {
      return;
    }
    
    this.scaleAsset(this.selectedAsset.instanceId, newScaleX, newScaleY);
  }

  // ==================== Private Helper Methods ====================

  /**
   * Show transformation handles for selected asset
   * @private
   */
  _showTransformHandles(asset) {
    // Clean up existing handles
    this._hideTransformHandles();
    
    // Create container for handles
    this.transformHandles = this.scene.add.container(asset.position.x, asset.position.y);
    this.transformHandles.setDepth(10000); // Always on top
    
    // Create visual indicators (simple circles for now)
    const handleSize = 8;
    const handleColor = 0xffff00;
    
    // Get sprite bounds
    const bounds = asset.sprite.getBounds();
    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;
    
    // Corner handles for scaling
    const corners = [
      { x: -halfWidth, y: -halfHeight, type: 'scale-tl' },
      { x: halfWidth, y: -halfHeight, type: 'scale-tr' },
      { x: -halfWidth, y: halfHeight, type: 'scale-bl' },
      { x: halfWidth, y: halfHeight, type: 'scale-br' }
    ];
    
    corners.forEach(corner => {
      const handle = this.scene.add.circle(corner.x, corner.y, handleSize, handleColor);
      handle.setStrokeStyle(2, 0x000000);
      handle.setData('handleType', corner.type);
      this.transformHandles.add(handle);
    });
    
    // Rotation handle at top center
    const rotationHandle = this.scene.add.circle(0, -halfHeight - 20, handleSize, 0xff00ff);
    rotationHandle.setStrokeStyle(2, 0x000000);
    rotationHandle.setData('handleType', 'rotate');
    this.transformHandles.add(rotationHandle);
  }

  /**
   * Update transformation handles position
   * @private
   */
  _updateTransformHandles() {
    if (!this.transformHandles || !this.selectedAsset) {
      return;
    }
    
    // Update container position
    this.transformHandles.setPosition(
      this.selectedAsset.position.x,
      this.selectedAsset.position.y
    );
    
    // Update handle positions based on sprite bounds
    const bounds = this.selectedAsset.sprite.getBounds();
    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;
    
    const handles = this.transformHandles.list;
    
    // Update corner handles
    if (handles[0]) handles[0].setPosition(-halfWidth, -halfHeight);
    if (handles[1]) handles[1].setPosition(halfWidth, -halfHeight);
    if (handles[2]) handles[2].setPosition(-halfWidth, halfHeight);
    if (handles[3]) handles[3].setPosition(halfWidth, halfHeight);
    
    // Update rotation handle
    if (handles[4]) handles[4].setPosition(0, -halfHeight - 20);
  }

  /**
   * Hide transformation handles
   * @private
   */
  _hideTransformHandles() {
    if (this.transformHandles) {
      this.transformHandles.destroy();
      this.transformHandles = null;
    }
  }

  // ==================== World State Persistence ====================

  /**
   * Save world state to storage
   * Serializes all placed assets to JSON
   */
  saveWorld() {
    try {
      // Serialize placed assets (exclude sprite references)
      const serializedAssets = this.placedAssets.map(asset => ({
        instanceId: asset.instanceId,
        assetId: asset.assetId,
        position: { ...asset.position },
        rotation: asset.rotation,
        scale: { ...asset.scale },
        collisionEnabled: asset.collisionEnabled,
        zIndex: asset.zIndex,
        animationKey: asset.animationKey || null,
        animationConfig: asset.animationConfig || null
      }));

      // Get camera position and zoom
      const camera = this.scene.cameras.main;
      const cameraPosition = {
        x: camera.scrollX,
        y: camera.scrollY,
        zoom: camera.zoom
      };

      // Get player spawn position if player exists
      let playerSpawn = { x: 100, y: 300 };
      if (this.scene.player) {
        playerSpawn = {
          x: this.scene.player.x,
          y: this.scene.player.y
        };
      }

      // Create world state object
      const worldData = {
        worldName: 'My World',
        createdAt: new Date().toISOString(),
        worldSize: {
          width: this.scene.physics.world.bounds.width,
          height: this.scene.physics.world.bounds.height
        },
        placedAssets: serializedAssets,
        playerSpawn,
        cameraPosition
      };

      // Save to storage
      const success = this.storageService.saveWorldState(worldData);

      if (success) {
        console.log(`World saved: ${serializedAssets.length} assets`);
        // Emit success event
        if (this.scene && this.scene.events) {
          this.scene.events.emit('world-saved', {
            assetCount: serializedAssets.length,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.error('Failed to save world state');
        // Emit error event
        if (this.scene && this.scene.events) {
          this.scene.events.emit('world-save-error', {
            error: 'Storage operation failed',
            assetCount: serializedAssets.length
          });
        }
      }

      return success;
    } catch (error) {
      console.error('Error saving world:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        assetCount: this.placedAssets.length,
        timestamp: new Date().toISOString()
      });
      
      // Emit error event for UI to handle
      if (this.scene && this.scene.events) {
        this.scene.events.emit('world-save-error', {
          error: error.message || 'Failed to save world',
          assetCount: this.placedAssets.length
        });
      }
      
      return false;
    }
  }

  /**
   * Load world state from storage
   * Deserializes and recreates all placed assets
   * @param {Object} assetManager - AssetManager instance for loading textures
   * @returns {Promise<boolean>} True if loaded successfully
   */
  async loadWorld(assetManager) {
    try {
      // Load world state from storage
      const worldData = this.storageService.loadWorldState();

      if (!worldData) {
        console.log('No saved world state found');
        return false;
      }

      console.log(`Loading world: ${worldData.placedAssets.length} assets`);

      // Clear existing world first
      this.clearWorld(true);

      // Recreate each placed asset
      for (const assetData of worldData.placedAssets) {
        // Get asset from library
        const asset = assetManager.getAsset(assetData.assetId);

        if (!asset) {
          console.warn(`Asset not found in library: ${assetData.assetId}, skipping`);
          continue;
        }

        // Load texture if not already loaded
        let textureKey = assetManager.getTextureKey(assetData.assetId);
        let animationKey = null;
        
        if (!textureKey) {
          textureKey = await assetManager.loadAssetTexture(asset);
        }

        // Load animation if asset has frames
        if (asset.frames && asset.frames.length > 1) {
          animationKey = `anim_${asset.id}`;
          
          // Check if animation already exists
          if (!this.scene.anims.exists(animationKey)) {
            // Get animation config from saved data, asset data, or use defaults
            const animConfig = assetData.animationConfig || asset.animationConfig || {
              frameRate: 8,
              repeat: -1,
              yoyo: false
            };
            
            // Create animation from frames
            await assetManager.createAnimationFromFrames(
              asset.frames,
              animationKey,
              animConfig
            );
          }
        }

        // Recreate placed asset with saved properties
        const placedAsset = this.addPlacedAsset({
          assetId: assetData.assetId,
          textureKey: textureKey,
          position: assetData.position,
          rotation: assetData.rotation,
          scale: assetData.scale,
          collisionEnabled: assetData.collisionEnabled,
          zIndex: assetData.zIndex,
          animationKey: animationKey,
          animationConfig: assetData.animationConfig
        });

        // Override the generated instanceId with the saved one
        placedAsset.instanceId = assetData.instanceId;
        placedAsset.sprite.setData('instanceId', assetData.instanceId);
      }

      // Restore camera position if available
      if (worldData.cameraPosition) {
        this.scene.cameras.main.setScroll(
          worldData.cameraPosition.x,
          worldData.cameraPosition.y
        );
        this.scene.cameras.main.setZoom(worldData.cameraPosition.zoom);
      }

      // Restore player spawn if available and player exists
      if (worldData.playerSpawn && this.scene.player) {
        this.scene.player.setPosition(
          worldData.playerSpawn.x,
          worldData.playerSpawn.y
        );
      }

      console.log('World loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading world:', error);
      return false;
    }
  }

  /**
   * Clear all placed assets from the world
   * @param {boolean} skipConfirmation - Skip confirmation dialog
   * @param {boolean} skipSave - Skip saving after clear
   */
  clearWorld(skipConfirmation = false, skipSave = false) {
    // Show confirmation dialog if not skipped
    if (!skipConfirmation) {
      const confirmed = confirm('Are you sure you want to clear the entire world? This cannot be undone.');
      if (!confirmed) {
        return;
      }
    }

    // Deselect any selected asset
    if (this.selectedAsset) {
      this.deselectAsset();
    }

    // Return all sprites to pool instead of destroying
    this.placedAssets.forEach(asset => {
      if (asset.sprite) {
        const textureKey = asset.sprite.texture.key;
        this.spritePool.returnToPool(asset.sprite, textureKey);
      }
    });

    // Clear the array
    this.placedAssets = [];

    // Clear sprite group (don't destroy sprites, just remove from group)
    this.spriteGroup.clear(false, false);

    console.log('World cleared');

    // Save empty world state unless skipped
    if (!skipSave) {
      this.saveWorld();
    }
  }

  /**
   * Get world statistics
   * @returns {Object} World stats
   */
  getWorldStats() {
    return {
      totalAssets: this.placedAssets.length,
      collidableAssets: this.getCollidableAssets().length,
      selectedAsset: this.selectedAsset ? this.selectedAsset.instanceId : null,
      placementMode: this.placementMode
    };
  }

  // ==================== Asset Count Management ====================

  /**
   * Get current asset count
   * @returns {number} Number of placed assets
   */
  getAssetCount() {
    return this.placedAssets.length;
  }

  /**
   * Check if asset limit is reached
   * @returns {boolean} True if at or over limit
   */
  isAtAssetLimit() {
    return this.placedAssets.length >= GAME_CONFIG.MAX_ASSETS;
  }

  /**
   * Check if approaching asset limit (warning threshold)
   * @returns {boolean} True if at or over warning threshold
   */
  isApproachingAssetLimit() {
    return this.placedAssets.length >= GAME_CONFIG.ASSET_WARNING_THRESHOLD;
  }

  /**
   * Get asset count info
   * @returns {Object} Asset count information
   */
  getAssetCountInfo() {
    const count = this.placedAssets.length;
    const max = GAME_CONFIG.MAX_ASSETS;
    const threshold = GAME_CONFIG.ASSET_WARNING_THRESHOLD;
    
    return {
      current: count,
      max: max,
      threshold: threshold,
      remaining: max - count,
      percentage: Math.round((count / max) * 100),
      isAtLimit: count >= max,
      isWarning: count >= threshold
    };
  }

  /**
   * Can place more assets
   * @returns {boolean} True if can place more assets
   */
  canPlaceAsset() {
    return this.placedAssets.length < GAME_CONFIG.MAX_ASSETS;
  }

  // ==================== World Export/Import ====================

  /**
   * Export world to a portable JSON format
   * Includes all placed assets and their image data for portability
   * @param {Object} assetManager - AssetManager instance to get asset data
   * @returns {Object} Exportable world data
   */
  exportWorld(assetManager) {
    try {
      // Get current world state
      const camera = this.scene.cameras.main;
      const cameraPosition = {
        x: camera.scrollX,
        y: camera.scrollY,
        zoom: camera.zoom
      };

      // Get player spawn position if player exists
      let playerSpawn = { x: 100, y: 300 };
      if (this.scene.player) {
        playerSpawn = {
          x: this.scene.player.x,
          y: this.scene.player.y
        };
      }

      // Serialize placed assets with full asset data for portability
      const exportedAssets = this.placedAssets.map(placedAsset => {
        // Get the full asset data from asset manager
        const assetData = assetManager.getAsset(placedAsset.assetId);
        
        return {
          instanceId: placedAsset.instanceId,
          assetId: placedAsset.assetId,
          position: { ...placedAsset.position },
          rotation: placedAsset.rotation,
          scale: { ...placedAsset.scale },
          collisionEnabled: placedAsset.collisionEnabled,
          zIndex: placedAsset.zIndex,
          // Include asset data for portability
          assetData: assetData ? {
            id: assetData.id,
            name: assetData.name,
            description: assetData.description,
            category: assetData.category,
            imageData: assetData.imageData,
            frames: assetData.frames || [],
            generationParams: assetData.generationParams,
            createdAt: assetData.createdAt
          } : null
        };
      });

      // Create export data structure
      const exportData = {
        version: '1.0',
        worldName: 'My World',
        createdAt: new Date().toISOString(),
        exportedAt: new Date().toISOString(),
        worldSize: {
          width: this.scene.physics.world.bounds.width,
          height: this.scene.physics.world.bounds.height
        },
        placedAssets: exportedAssets,
        playerSpawn,
        cameraPosition,
        metadata: {
          assetCount: this.placedAssets.length,
          collidableAssetCount: this.getCollidableAssets().length
        }
      };

      console.log(`World exported: ${exportedAssets.length} assets`);
      return exportData;
    } catch (error) {
      console.error('Error exporting world:', error);
      throw new Error('Failed to export world: ' + error.message);
    }
  }

  /**
   * Import world from exported data
   * Recreates all placed assets from the imported data
   * @param {Object} worldData - Exported world data
   * @param {Object} assetManager - AssetManager instance for loading textures
   * @returns {Promise<boolean>} True if imported successfully
   */
  async importWorld(worldData, assetManager) {
    try {
      // Validate world data structure
      if (!worldData) {
        throw new Error('Invalid world data: data is null or undefined');
      }

      if (!worldData.version) {
        throw new Error('Invalid world data: missing version field');
      }

      // Check version compatibility
      if (worldData.version !== '1.0') {
        console.warn(`World version ${worldData.version} may not be fully compatible with current version 1.0`);
      }

      if (!worldData.placedAssets) {
        throw new Error('Invalid world data: missing placedAssets field');
      }

      if (!Array.isArray(worldData.placedAssets)) {
        throw new Error('Invalid world data: placedAssets must be an array');
      }

      console.log(`Importing world: ${worldData.placedAssets.length} assets`);

      // Clear existing world first
      this.clearWorld(true, true);

      // Import each placed asset
      for (const placedAssetData of worldData.placedAssets) {
        try {
          // Check if asset data is embedded
          let asset = assetManager.getAsset(placedAssetData.assetId);
          
          if (!asset && placedAssetData.assetData) {
            // Asset not in library, add it from embedded data
            console.log(`Adding embedded asset to library: ${placedAssetData.assetData.name}`);
            await assetManager.addAsset(placedAssetData.assetData);
            asset = assetManager.getAsset(placedAssetData.assetId);
          }

          // Verify asset exists
          if (!asset) {
            asset = assetManager.getAsset(placedAssetData.assetId);
          }

          if (!asset) {
            console.warn(`Asset not found: ${placedAssetData.assetId}, skipping`);
            continue;
          }

          // Load texture if not already loaded
          let textureKey = assetManager.getTextureKey(placedAssetData.assetId);
          
          if (!textureKey) {
            textureKey = await assetManager.loadAssetTexture(asset);
          }

          // Recreate placed asset with saved properties
          const newPlacedAsset = this.addPlacedAsset({
            assetId: placedAssetData.assetId,
            textureKey: textureKey,
            position: placedAssetData.position,
            rotation: placedAssetData.rotation,
            scale: placedAssetData.scale,
            collisionEnabled: placedAssetData.collisionEnabled,
            zIndex: placedAssetData.zIndex
          });

          // Override the generated instanceId with the imported one
          newPlacedAsset.instanceId = placedAssetData.instanceId;
          newPlacedAsset.sprite.setData('instanceId', placedAssetData.instanceId);
        } catch (assetError) {
          console.error(`Error importing asset ${placedAssetData.assetId}:`, assetError);
          // Continue with other assets
        }
      }

      // Restore camera position if available
      if (worldData.cameraPosition) {
        this.scene.cameras.main.setScroll(
          worldData.cameraPosition.x,
          worldData.cameraPosition.y
        );
        this.scene.cameras.main.setZoom(worldData.cameraPosition.zoom);
      }

      // Restore player spawn if available and player exists
      if (worldData.playerSpawn && this.scene.player) {
        this.scene.player.setPosition(
          worldData.playerSpawn.x,
          worldData.playerSpawn.y
        );
      }

      // Save the imported world
      this.saveWorld();

      console.log('World imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing world:', error);
      throw new Error('Failed to import world: ' + error.message);
    }
  }
}
