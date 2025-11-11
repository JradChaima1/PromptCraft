import { PHYSICS_CONFIG, CAMERA_CONFIG } from '../config/gameConfig.js';

/**
 * InputController
 * Handles all player input, camera controls, and asset interactions
 */
export default class InputController {
  constructor(scene) {
    this.scene = scene;
    
    // References to game objects (set externally)
    this.player = null;
    this.worldManager = null;
    this.uiManager = null;
    this.assetManager = null;
    
    // Input state
    this.cursors = null;
    this.keys = {};
    this.mousePointer = null;
    
    // Camera state
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.cameraStartX = 0;
    this.cameraStartY = 0;
    
    // Asset interaction state
    this.isDraggingAsset = false;
    this.draggedAsset = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    
    // Placement mode state
    this.isPlacementMode = false;
    this.placementPreview = null;
    this.placementAssetId = null;
    
    // Initialize input listeners
    this.setupInputListeners();
  }
  
  /**
   * Set up all keyboard and mouse input listeners
   */
  setupInputListeners() {
    // Keyboard - arrow keys and WASD
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    // Additional keys
    const keyboard = this.scene.input.keyboard;
    this.keys = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ESC: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      DELETE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE),
      G: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G),
      L: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      Q: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      E: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      X: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      Y: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y),
      PLUS: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
      EQUALS: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EQUALS),
      MINUS: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
      CTRL: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL)
    };
    
    // Mouse pointer
    this.mousePointer = this.scene.input.activePointer;
    
    // Mouse wheel for zoom
    this.scene.input.on('wheel', (_pointer, _gameObjects, _deltaX, deltaY) => {
      this.handleCameraZoom(deltaY);
    });
    
    // Mouse click events
    this.scene.input.on('pointerdown', (pointer) => {
      this.handlePointerDown(pointer);
    });
    
    this.scene.input.on('pointermove', (pointer) => {
      this.handlePointerMove(pointer);
    });
    
    this.scene.input.on('pointerup', (pointer) => {
      this.handlePointerUp(pointer);
    });
    
    // Double-click for centering camera
    this.scene.input.on('pointerdblclick', (pointer) => {
      this.handleDoubleClick(pointer);
    });
    
    // Register keyboard shortcuts
    this.registerShortcuts();
  }
  
  /**
   * Register all keyboard shortcuts
   */
  registerShortcuts() {
    // G key - open asset generator
    this.keys.G.on('down', () => {
      // Don't trigger if modal is already open
      if (this.uiManager && !this.isPlacementMode && !this.uiManager.isModalOpen()) {
        this.uiManager.showGenerationModal();
      }
    });
    
    // L key - open asset library
    this.keys.L.on('down', () => {
      // Don't trigger if modal is already open
      if (this.uiManager && !this.isPlacementMode && !this.uiManager.isModalOpen()) {
        // Get assets from AssetManager
        const assets = this.scene.assetManager?.getAssets() || [];
        this.uiManager.showLibraryModal(assets);
      }
    });
    
    // ESC key - close modals and deselect
    this.keys.ESC.on('down', () => {
      if (this.isPlacementMode) {
        this.exitPlacementMode();
      } else if (this.uiManager) {
        this.uiManager.hideAllModals();
      }
      
      if (this.worldManager) {
        this.worldManager.deselectAsset();
      }
    });
    
    // Delete key - remove selected asset
    this.keys.DELETE.on('down', () => {
      // Don't trigger if modal is open
      if (this.uiManager && this.uiManager.isModalOpen()) {
        return;
      }
      if (this.worldManager && this.worldManager.getSelectedAsset()) {
        const selected = this.worldManager.getSelectedAsset();
        this.worldManager.removePlacedAsset(selected.instanceId);
      }
    });
    
    // Q key - rotate selected asset left
    this.keys.Q.on('down', () => {
      // Don't trigger if modal is open
      if (this.uiManager && this.uiManager.isModalOpen()) {
        return;
      }
      if (this.worldManager && this.worldManager.getSelectedAsset()) {
        this.worldManager.rotateSelectedAsset('left');
      }
    });
    
    // E key - rotate selected asset right
    this.keys.E.on('down', () => {
      // Don't trigger if modal is open (unless it's Ctrl+E for export)
      if (this.uiManager && this.uiManager.isModalOpen() && !this.keys.CTRL.isDown) {
        return;
      }
      if (this.worldManager && this.worldManager.getSelectedAsset() && !this.keys.CTRL.isDown) {
        this.worldManager.rotateSelectedAsset('right');
      }
    });
    
    // X key - flip selected asset horizontally
    this.keys.X.on('down', () => {
      // Don't trigger if modal is open
      if (this.uiManager && this.uiManager.isModalOpen()) {
        return;
      }
      if (this.worldManager && this.worldManager.getSelectedAsset()) {
        this.worldManager.flipSelectedAsset('x');
      }
    });
    
    // Y key - flip selected asset vertically
    this.keys.Y.on('down', () => {
      // Don't trigger if modal is open
      if (this.uiManager && this.uiManager.isModalOpen()) {
        return;
      }
      if (this.worldManager && this.worldManager.getSelectedAsset()) {
        this.worldManager.flipSelectedAsset('y');
      }
    });
    
    // + or = key - scale up selected asset
    this.keys.PLUS.on('down', () => {
      if (this.uiManager && this.uiManager.isModalOpen()) return;
      if (this.worldManager && this.worldManager.getSelectedAsset()) {
        this.worldManager.scaleSelectedAsset('up');
      }
    });
    
    this.keys.EQUALS.on('down', () => {
      if (this.uiManager && this.uiManager.isModalOpen()) return;
      if (this.worldManager && this.worldManager.getSelectedAsset()) {
        this.worldManager.scaleSelectedAsset('up');
      }
    });
    
    // - key - scale down selected asset
    this.keys.MINUS.on('down', () => {
      if (this.uiManager && this.uiManager.isModalOpen()) return;
      if (this.worldManager && this.worldManager.getSelectedAsset()) {
        this.worldManager.scaleSelectedAsset('down');
      }
    });
    
    // Ctrl+S - save world
    this.scene.input.keyboard.on('keydown-S', (event) => {
      if (event.ctrlKey && this.worldManager) {
        event.preventDefault();
        this.worldManager.saveWorld();
        console.log('World saved manually');
      }
    });
    
    // Ctrl+E - export world
    this.scene.input.keyboard.on('keydown-E', (event) => {
      if (event.ctrlKey && this.worldManager) {
        event.preventDefault();
        this.worldManager.exportWorld();
        console.log('World exported');
      }
    });
  }
  
  /**
   * Handle pointer down events
   */
  handlePointerDown(pointer) {
    // Check if clicking on a transformation handle first
    if (this.worldManager && this.worldManager.activeHandle) {
      // Handle is being interacted with, don't process other inputs
      return;
    }
    
    // Middle mouse button - start camera pan
    if (pointer.middleButtonDown()) {
      this.isPanning = true;
      this.panStartX = pointer.x;
      this.panStartY = pointer.y;
      this.cameraStartX = this.scene.cameras.main.scrollX;
      this.cameraStartY = this.scene.cameras.main.scrollY;
      return;
    }
    
    // Left click in placement mode
    if (pointer.leftButtonDown() && this.isPlacementMode) {
      this.handlePlacementClick(pointer);
      return;
    }
    
    // Right click - cancel placement mode
    if (pointer.rightButtonDown() && this.isPlacementMode) {
      this.exitPlacementMode();
      return;
    }
    
    // Left click - asset interaction
    if (pointer.leftButtonDown() && !this.isPlacementMode) {
      this.handleAssetClick(pointer);
    }
  }
  
  /**
   * Handle pointer move events
   */
  handlePointerMove(pointer) {
    // Don't process if a handle is being dragged
    if (this.worldManager && this.worldManager.activeHandle) {
      return;
    }
    
    // Camera panning (but not if handle is active)
    if (this.isPanning && pointer.middleButtonDown()) {
      this.handleCameraPan(pointer);
      return;
    }
    
    // Placement preview
    if (this.isPlacementMode) {
      this.handlePlacementPreview(pointer);
      return;
    }
  }
  
  /**
   * Handle pointer up events
   */
  handlePointerUp(pointer) {
    // Stop camera panning
    if (this.isPanning) {
      this.isPanning = false;
    }
    
    // Note: Asset dragging is now handled by WorldManager's handle system
  }
  
  /**
   * Handle double-click events
   */
  handleDoubleClick(pointer) {
    // Check if clicked on player
    if (this.player) {
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const distance = Phaser.Math.Distance.Between(
        worldPoint.x, worldPoint.y,
        this.player.x, this.player.y
      );
      
      if (distance < 50) {
        this.centerCameraOnPlayer();
      }
    }
  }
  
  /**
   * Get keyboard shortcuts map for display in help UI
   * Requirements: 9.3
   */
  getKeyboardShortcuts() {
    return {
      'G': 'Open Asset Generator',
      'L': 'Open Asset Library',
      'ESC': 'Close Modals / Deselect',
      'Delete': 'Remove Selected Asset',
      'Ctrl+S': 'Save World',
      'Ctrl+E': 'Export World',
      'Arrow Keys / WASD': 'Move Player',
      'Space': 'Jump',
      'Mouse Wheel': 'Zoom Camera',
      'Middle Mouse Drag': 'Pan Camera',
      'Double-Click Player': 'Center Camera'
    };
  }
  
  /**
   * Update method - called every frame
   */
  update() {
    // Don't process game controls if a modal is open
    if (this.uiManager && this.uiManager.isModalOpen()) {
      return;
    }
    
    this.handlePlayerMovement();
  }
  
  /**
   * Set references to game objects
   */
  setReferences(player, worldManager, uiManager, assetManager) {
    this.player = player;
    this.worldManager = worldManager;
    this.uiManager = uiManager;
    this.assetManager = assetManager;
  }

  /**
   * Handle player movement with arrow keys and WASD
   * Requirements: 10.1
   */
  handlePlayerMovement() {
    if (!this.player || !this.player.body) {
      return;
    }
    
    // Horizontal movement
    const leftPressed = this.cursors.left.isDown || this.keys.A.isDown;
    const rightPressed = this.cursors.right.isDown || this.keys.D.isDown;
    
    if (leftPressed) {
      this.player.setVelocityX(-PHYSICS_CONFIG.PLAYER_SPEED);
      
      // Update animation
      if (this.player.anims) {
        this.player.anims.play('walk-left', true);
      }
      this.player.playerDirection = 'left';
    } else if (rightPressed) {
      this.player.setVelocityX(PHYSICS_CONFIG.PLAYER_SPEED);
      
      // Update animation
      if (this.player.anims) {
        this.player.anims.play('walk-right', true);
      }
      this.player.playerDirection = 'right';
    } else {
      this.player.setVelocityX(0);
      
      // Play idle animation based on last direction
      if (this.player.anims) {
        const direction = this.player.playerDirection || 'right';
        this.player.anims.play(`idle-${direction}`, true);
      }
    }
    
    // Jump with spacebar (only if on ground)
    const spacePressed = this.cursors.space.isDown || this.keys.SPACE.isDown;
    if (spacePressed && this.player.body.touching.down) {
      this.player.setVelocityY(PHYSICS_CONFIG.JUMP_VELOCITY);
    }
  }

  /**
   * Handle camera zoom with mouse wheel
   * Requirements: 10.2
   */
  handleCameraZoom(deltaY) {
    const camera = this.scene.cameras.main;
    const zoomChange = deltaY > 0 ? -0.1 : 0.1;
    let newZoom = camera.zoom + zoomChange;
    
    // Clamp zoom between min and max
    newZoom = Phaser.Math.Clamp(newZoom, CAMERA_CONFIG.MIN_ZOOM, CAMERA_CONFIG.MAX_ZOOM);
    
    camera.setZoom(newZoom);
  }
  
  /**
   * Handle camera panning with middle mouse drag
   * Requirements: 10.3
   */
  handleCameraPan(pointer) {
    const camera = this.scene.cameras.main;
    
    // Calculate delta movement
    const deltaX = (pointer.x - this.panStartX) * CAMERA_CONFIG.PAN_SPEED;
    const deltaY = (pointer.y - this.panStartY) * CAMERA_CONFIG.PAN_SPEED;
    
    // Update camera scroll position
    camera.scrollX = this.cameraStartX - deltaX;
    camera.scrollY = this.cameraStartY - deltaY;
  }
  
  /**
   * Center camera on player with smooth transition
   * Requirements: 10.4
   */
  centerCameraOnPlayer() {
    if (!this.player) {
      return;
    }
    
    const camera = this.scene.cameras.main;
    
    // Stop following if currently following
    camera.stopFollow();
    
    // Start following with smooth lerp
    camera.startFollow(this.player, true, CAMERA_CONFIG.LERP_FACTOR, CAMERA_CONFIG.LERP_FACTOR);
  }
  
  /**
   * Enable smooth camera following
   * Requirements: 10.5
   */
  enableCameraFollow() {
    if (!this.player) {
      return;
    }
    
    const camera = this.scene.cameras.main;
    camera.startFollow(this.player, true, CAMERA_CONFIG.LERP_FACTOR, CAMERA_CONFIG.LERP_FACTOR);
  }
  
  /**
   * Disable camera following
   */
  disableCameraFollow() {
    const camera = this.scene.cameras.main;
    camera.stopFollow();
  }

  /**
   * Handle asset click to select assets
   * Requirements: 4.1
   */
  handleAssetClick(pointer) {
    if (!this.worldManager) {
      return;
    }
    
    // Check if clicking on a transformation handle
    if (this.worldManager.activeHandle) {
      // Handle is being dragged, don't process asset click
      return;
    }
    
    // Convert screen coordinates to world coordinates
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Check if clicked on transformation handles first
    if (this.worldManager.transformHandles) {
      const handles = this.worldManager.transformHandles.list;
      for (const handle of handles) {
        if (handle.getBounds && handle.getBounds().contains(worldPoint.x, worldPoint.y)) {
          // Clicked on a handle, don't process asset selection
          return;
        }
      }
    }
    
    // Check if clicked on any placed asset
    const placedAssets = this.worldManager.getAllPlacedAssets();
    let clickedAsset = null;
    
    for (const asset of placedAssets) {
      if (asset.sprite && asset.sprite.getBounds().contains(worldPoint.x, worldPoint.y)) {
        clickedAsset = asset;
        break;
      }
    }
    
    if (clickedAsset) {
      // Select the asset (don't start dragging here, let handles handle it)
      this.worldManager.selectAsset(clickedAsset.instanceId);
    } else {
      // Deselect if clicked on empty space
      this.worldManager.deselectAsset();
    }
  }
  
  /**
   * Handle asset dragging to move selected assets
   * Requirements: 4.2
   * Note: Asset dragging is now handled by transformation handles in WorldManager
   */
  handleAssetDrag(pointer) {
    // Asset dragging is now handled by the move handle in WorldManager
    // This method is kept for backward compatibility but does nothing
    return;
  }
  
  /**
   * Handle asset release to finalize position changes
   * Requirements: 4.2
   * Note: Asset release is now handled by transformation handles in WorldManager
   */
  handleAssetRelease(pointer) {
    // Asset release is now handled by the handle system in WorldManager
    // This method is kept for backward compatibility but does nothing
    return;
  }

  /**
   * Enter placement mode with a specific asset
   * Requirements: 3.1
   */
  enterPlacementMode(assetId, assetData) {
    this.isPlacementMode = true;
    this.placementAssetId = assetId;
    
    // Create preview sprite
    if (assetData && assetData.imageData) {
      // Create a semi-transparent preview sprite
      this.placementPreview = this.scene.add.sprite(0, 0, assetData.textureKey || 'placeholder');
      this.placementPreview.setAlpha(0.6);
      this.placementPreview.setDepth(1000); // Render on top
      
      // Change cursor style
      this.scene.input.setDefaultCursor('crosshair');
    }
  }
  
  /**
   * Exit placement mode
   * Requirements: 3.2
   */
  exitPlacementMode() {
    this.isPlacementMode = false;
    this.placementAssetId = null;
    
    // Destroy preview sprite
    if (this.placementPreview) {
      this.placementPreview.destroy();
      this.placementPreview = null;
    }
    
    // Reset cursor style
    this.scene.input.setDefaultCursor('default');
  }
  
  /**
   * Update placement preview position to follow cursor
   * Requirements: 3.1
   */
  handlePlacementPreview(pointer) {
    if (!this.placementPreview) {
      return;
    }
    
    // Convert screen coordinates to world coordinates
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Update preview position
    this.placementPreview.setPosition(worldPoint.x, worldPoint.y);
  }
  
  /**
   * Handle placement click to place asset at cursor position
   * Requirements: 3.2
   */
  handlePlacementClick(pointer) {
    if (!this.placementAssetId || !this.worldManager || !this.assetManager) {
      return;
    }
    
    // Convert screen coordinates to world coordinates
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Get the asset data from asset manager
    const asset = this.assetManager.getAsset(this.placementAssetId);
    
    if (!asset) {
      console.error('Asset not found:', this.placementAssetId);
      if (this.uiManager) {
        this.uiManager.showErrorModal('Asset not found');
      }
      this.exitPlacementMode();
      return;
    }
    
    // Get texture key for the asset
    const textureKey = this.assetManager.getTextureKey(this.placementAssetId);
    
    if (!textureKey) {
      console.error('Texture not loaded for asset:', this.placementAssetId);
      if (this.uiManager) {
        this.uiManager.showErrorModal('Asset texture not loaded');
      }
      this.exitPlacementMode();
      return;
    }
    
    // Get animation key if asset has frames
    let animationKey = null;
    let animationConfig = null;
    if (asset.frames && asset.frames.length > 1) {
      animationKey = `anim_${asset.id}`;
      animationConfig = asset.animationConfig || {
        frameRate: 8,
        repeat: -1,
        yoyo: false
      };
    }
    
    // Place the asset
    try {
      const placedAsset = this.worldManager.addPlacedAsset({
        assetId: this.placementAssetId,
        textureKey: textureKey,
        position: { x: worldPoint.x, y: worldPoint.y },
        rotation: 0,
        scale: { x: 1, y: 1 },
        collisionEnabled: false,
        zIndex: 0,
        animationKey: animationKey,
        animationConfig: animationConfig
      });
      
      if (!placedAsset) {
        // Asset limit reached
        if (this.uiManager) {
          this.uiManager.showErrorModal('Cannot place asset: Maximum asset limit reached');
        }
        this.exitPlacementMode();
        return;
      }
      
      // Exit placement mode after placing
      this.exitPlacementMode();
    } catch (error) {
      console.error('Failed to place asset:', error);
      if (this.uiManager) {
        this.uiManager.showErrorModal('Failed to place asset: ' + error.message);
      }
      this.exitPlacementMode();
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Remove event listeners
    this.scene.input.off('wheel');
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');
    this.scene.input.off('pointerdblclick');
    
    // Clear references
    this.player = null;
    this.worldManager = null;
    this.uiManager = null;
    this.assetManager = null;
  }
}
