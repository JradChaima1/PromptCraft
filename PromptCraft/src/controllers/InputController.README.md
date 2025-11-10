# InputController

The `InputController` class handles all player input, camera controls, and asset interactions for the AI Sandbox Builder game.

## Overview

This controller centralizes all input handling including:
- Player movement (keyboard)
- Camera controls (mouse wheel zoom, middle-click pan)
- Asset interaction (click to select, drag to move)
- Placement mode (preview and place assets)
- Keyboard shortcuts

## Usage

### Basic Setup

```javascript
import InputController from './controllers/InputController.js';

// In your Phaser scene's create() method
this.inputController = new InputController(this);

// Set references to game objects
this.inputController.setReferences(
  this.player,
  this.worldManager,
  this.uiManager,
  this.assetManager
);

// In your scene's update() method
this.inputController.update();
```

### Player Movement

The controller automatically handles player movement when `update()` is called:
- **Arrow Keys / WASD**: Move left/right
- **Spacebar**: Jump (when on ground)
- Velocity: 200 pixels/second horizontal, -400 pixels/second jump

### Camera Controls

#### Zoom
- **Mouse Wheel**: Zoom in/out
- Zoom range: 0.5x to 2.0x
- Zoom increment: 0.1 per scroll

#### Pan
- **Middle Mouse Button + Drag**: Pan camera
- Pan speed: 1.0 (configurable in CAMERA_CONFIG)

#### Follow Player
- **Double-click on player**: Center and follow player
- Smooth following with lerp factor 0.1

```javascript
// Programmatically control camera following
inputController.enableCameraFollow();
inputController.disableCameraFollow();
inputController.centerCameraOnPlayer();
```

### Asset Interaction

#### Select and Move Assets
- **Left Click on Asset**: Select asset
- **Drag Selected Asset**: Move asset position
- **Release Mouse**: Finalize position and save world

The controller automatically:
- Converts screen coordinates to world coordinates
- Detects clicks on asset sprites
- Handles drag offset for smooth movement
- Saves world state after moving

### Placement Mode

#### Enter Placement Mode
```javascript
const assetData = {
  textureKey: 'my-asset',
  imageData: 'base64...'
};
inputController.enterPlacementMode('asset-id-123', assetData);
```

#### Placement Controls
- **Mouse Move**: Preview follows cursor (semi-transparent)
- **Left Click**: Place asset at cursor position
- **Right Click / ESC**: Cancel placement mode

#### Exit Placement Mode
```javascript
inputController.exitPlacementMode();
```

### Keyboard Shortcuts

The controller registers these shortcuts automatically:

| Key | Action |
|-----|--------|
| G | Open asset generator modal |
| L | Open asset library modal |
| ESC | Close modals / Deselect / Cancel placement |
| Delete | Remove selected asset |
| Ctrl+S | Save world manually |
| Ctrl+E | Export world |

## API Reference

### Constructor

```javascript
new InputController(scene)
```

**Parameters:**
- `scene` (Phaser.Scene): The Phaser scene instance

### Methods

#### setReferences(player, worldManager, uiManager, assetManager)
Set references to game objects that the controller interacts with.

**Parameters:**
- `player` (Phaser.GameObjects.Sprite): The player sprite
- `worldManager` (WorldManager): World management instance
- `uiManager` (UIManager): UI management instance
- `assetManager` (AssetManager): Asset management instance

#### update()
Update method to be called every frame. Handles player movement.

#### handlePlayerMovement()
Process keyboard input for player movement and jumping.

#### handleCameraZoom(deltaY)
Handle mouse wheel zoom.

**Parameters:**
- `deltaY` (number): Mouse wheel delta

#### handleCameraPan(pointer)
Handle middle-click camera panning.

**Parameters:**
- `pointer` (Phaser.Input.Pointer): Mouse pointer

#### centerCameraOnPlayer()
Center camera on player with smooth following.

#### enableCameraFollow()
Enable smooth camera following of player.

#### disableCameraFollow()
Disable camera following.

#### handleAssetClick(pointer)
Handle clicking on assets to select them.

**Parameters:**
- `pointer` (Phaser.Input.Pointer): Mouse pointer

#### handleAssetDrag(pointer)
Handle dragging selected assets.

**Parameters:**
- `pointer` (Phaser.Input.Pointer): Mouse pointer

#### handleAssetRelease(pointer)
Handle releasing dragged assets and saving world state.

**Parameters:**
- `pointer` (Phaser.Input.Pointer): Mouse pointer

#### enterPlacementMode(assetId, assetData)
Enter placement mode for placing assets.

**Parameters:**
- `assetId` (string): ID of asset to place
- `assetData` (object): Asset data including textureKey and imageData

#### exitPlacementMode()
Exit placement mode and clean up preview sprite.

#### handlePlacementPreview(pointer)
Update placement preview position to follow cursor.

**Parameters:**
- `pointer` (Phaser.Input.Pointer): Mouse pointer

#### handlePlacementClick(pointer)
Place asset at cursor position.

**Parameters:**
- `pointer` (Phaser.Input.Pointer): Mouse pointer

#### destroy()
Clean up event listeners and references.

## Configuration

The controller uses configuration from `src/config/gameConfig.js`:

### PHYSICS_CONFIG
```javascript
{
  PLAYER_SPEED: 200,      // Horizontal movement speed
  JUMP_VELOCITY: -400     // Jump velocity (negative = up)
}
```

### CAMERA_CONFIG
```javascript
{
  MIN_ZOOM: 0.5,          // Minimum zoom level
  MAX_ZOOM: 2.0,          // Maximum zoom level
  LERP_FACTOR: 0.1,       // Smooth following factor
  PAN_SPEED: 1.0          // Camera pan speed multiplier
}
```

## State Management

The controller maintains several state properties:

### Camera State
- `isPanning`: Whether camera is being panned
- `panStartX/Y`: Pan start position
- `cameraStartX/Y`: Camera position at pan start

### Asset Interaction State
- `isDraggingAsset`: Whether an asset is being dragged
- `draggedAsset`: Reference to dragged asset
- `dragOffsetX/Y`: Offset for smooth dragging

### Placement Mode State
- `isPlacementMode`: Whether in placement mode
- `placementPreview`: Preview sprite reference
- `placementAssetId`: ID of asset being placed

## Requirements Fulfilled

This implementation fulfills the following requirements:

- **Requirement 10.1**: Player movement with arrow keys/WASD at 200 px/s
- **Requirement 10.2**: Camera zoom with mouse wheel (0.5x - 2.0x)
- **Requirement 10.3**: Camera pan with middle-click drag
- **Requirement 10.4**: Center camera on player with double-click
- **Requirement 10.5**: Smooth camera following with lerp 0.1
- **Requirement 4.1**: Click to select assets
- **Requirement 4.2**: Drag to move assets
- **Requirement 3.1**: Placement mode with preview
- **Requirement 3.2**: Click to place, right-click/ESC to cancel
- **Requirement 9.3**: Keyboard shortcuts (G, L, ESC, Delete, Ctrl+S, Ctrl+E)

## Example Integration

```javascript
import Phaser from 'phaser';
import InputController from '../controllers/InputController.js';
import WorldManager from '../managers/WorldManager.js';
import UIManager from '../managers/UIManager.js';
import AssetManager from '../managers/AssetManager.js';

export default class GameScene extends Phaser.Scene {
  create() {
    // Create player
    this.player = this.physics.add.sprite(400, 300, 'player');
    
    // Create managers
    this.worldManager = new WorldManager(this, storageService);
    this.uiManager = new UIManager(this);
    this.assetManager = new AssetManager(this, apiService, storageService);
    
    // Create input controller
    this.inputController = new InputController(this);
    this.inputController.setReferences(
      this.player,
      this.worldManager,
      this.uiManager,
      this.assetManager
    );
    
    // Enable camera following
    this.inputController.enableCameraFollow();
  }
  
  update() {
    // Update input controller every frame
    this.inputController.update();
  }
  
  shutdown() {
    // Clean up
    this.inputController.destroy();
  }
}
```

## Notes

- The controller automatically handles coordinate conversion between screen and world space
- All mouse interactions respect the current camera position and zoom
- Keyboard shortcuts are only active when appropriate (e.g., G/L disabled during placement mode)
- The controller saves world state automatically after asset movements
- Event listeners are properly cleaned up in the `destroy()` method
