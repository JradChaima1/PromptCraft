# WorldManager

The WorldManager handles all world-related functionality including asset placement, transformations, physics, and persistence.

## Features

### 1. Asset Placement
- Enter placement mode with an asset
- Preview follows mouse cursor
- Click to place assets
- Multiple placements supported
- Right-click or ESC to exit placement mode

### 2. Asset Selection
- Click on placed assets to select them
- Selected assets show green tint
- Transformation handles appear on selection
- Only one asset can be selected at a time

### 3. Asset Transformations
- **Move**: Drag selected assets with mouse
- **Rotate**: Use Q/E keys or rotation handle
- **Scale**: Use +/- keys or corner handles
- All transformations auto-save

### 4. Physics & Collision
- Toggle collision on/off for each asset
- Collision bodies match sprite dimensions
- Automatic collision with player
- Physics bodies update with transformations

### 5. World Persistence
- Auto-save after every change (debounced to 2 seconds)
- Save/load complete world state
- Preserves positions, rotations, scales, collision settings
- Clear world functionality

## Usage Example

```javascript
import WorldManager from './managers/WorldManager.js';
import AssetManager from './managers/AssetManager.js';
import StorageService from './services/StorageService.js';

// In your scene's create() method:
const storageService = new StorageService();
const worldManager = new WorldManager(this, storageService);

// Set up player collision
worldManager.setupPlayerCollision(this.player);

// Load saved world
const assetManager = new AssetManager(this, apiService, storageService);
await worldManager.loadWorld(assetManager);

// Enter placement mode
const asset = assetManager.getAsset('some-asset-id');
const textureKey = await assetManager.loadAssetTexture(asset);
worldManager.enterPlacementMode({
  assetId: asset.id,
  textureKey: textureKey
});

// Exit placement mode
worldManager.exitPlacementMode();

// Select an asset
worldManager.selectAsset('instance-id');

// Transform selected asset
worldManager.rotateSelectedAsset('right'); // Q/E keys
worldManager.scaleSelectedAsset('up'); // +/- keys

// Toggle collision
worldManager.toggleCollisionForSelected();

// Delete selected asset
worldManager.removeSelectedAsset();

// Save world manually
worldManager.saveWorld();

// Clear world
worldManager.clearWorld();
```

## Input Handling

The WorldManager needs to be integrated with input handlers:

```javascript
// In your scene's create() method:

// Handle asset selection on click
this.input.on('gameobjectdown', (pointer, gameObject) => {
  const instanceId = gameObject.getData('instanceId');
  if (instanceId) {
    worldManager.selectAsset(instanceId);
  }
});

// Handle dragging
this.input.on('dragstart', (pointer, gameObject) => {
  const instanceId = gameObject.getData('instanceId');
  if (instanceId) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    worldManager.startDrag(instanceId, worldPoint.x, worldPoint.y);
  }
});

this.input.on('drag', (pointer) => {
  const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  worldManager.updateDrag(worldPoint.x, worldPoint.y);
});

this.input.on('dragend', () => {
  worldManager.stopDrag();
});

// Keyboard shortcuts
const qKey = this.input.keyboard.addKey('Q');
const eKey = this.input.keyboard.addKey('E');
const plusKey = this.input.keyboard.addKey('PLUS');
const minusKey = this.input.keyboard.addKey('MINUS');
const deleteKey = this.input.keyboard.addKey('DELETE');
const escKey = this.input.keyboard.addKey('ESC');

qKey.on('down', () => worldManager.rotateSelectedAsset('left'));
eKey.on('down', () => worldManager.rotateSelectedAsset('right'));
plusKey.on('down', () => worldManager.scaleSelectedAsset('up'));
minusKey.on('down', () => worldManager.scaleSelectedAsset('down'));
deleteKey.on('down', () => worldManager.removeSelectedAsset());
escKey.on('down', () => {
  if (worldManager.isInPlacementMode()) {
    worldManager.exitPlacementMode();
  } else {
    worldManager.deselectAsset();
  }
});
```

## API Reference

### Constructor
- `constructor(scene, storageService)` - Initialize WorldManager

### Placement Mode
- `enterPlacementMode(assetData)` - Enter placement mode with asset
- `exitPlacementMode()` - Exit placement mode
- `isInPlacementMode()` - Check if in placement mode

### Asset Management
- `addPlacedAsset(params)` - Add asset to world
- `removePlacedAsset(instanceId, skipConfirmation)` - Remove asset
- `removeSelectedAsset()` - Remove currently selected asset
- `getAllPlacedAssets()` - Get all placed assets
- `getPlacedAsset(instanceId)` - Get specific asset
- `getSprite(instanceId)` - Get sprite for asset

### Selection
- `selectAsset(instanceId)` - Select an asset
- `deselectAsset()` - Deselect current asset
- `getSelectedAsset()` - Get selected asset

### Transformations
- `moveAsset(instanceId, x, y)` - Move asset
- `rotateAsset(instanceId, angle)` - Rotate asset (radians)
- `scaleAsset(instanceId, scaleX, scaleY)` - Scale asset
- `startDrag(instanceId, pointerX, pointerY)` - Start dragging
- `updateDrag(pointerX, pointerY)` - Update drag position
- `stopDrag()` - Stop dragging
- `rotateSelectedAsset(direction)` - Rotate selected ('left'/'right')
- `scaleSelectedAsset(direction)` - Scale selected ('up'/'down')

### Physics & Collision
- `setCollisionEnabled(instanceId, enabled)` - Toggle collision
- `toggleCollisionForSelected()` - Toggle collision for selected
- `updatePhysicsBody(instanceId)` - Update physics body
- `setupPlayerCollision(player)` - Set up player collision
- `getCollidableAssets()` - Get assets with collision

### Persistence
- `saveWorld()` - Save world state
- `loadWorld(assetManager)` - Load world state (async)
- `clearWorld(skipConfirmation, skipSave)` - Clear all assets
- `getWorldStats()` - Get world statistics

## Data Structures

### Placed Asset
```javascript
{
  instanceId: "uuid-string",
  assetId: "asset-library-id",
  position: { x: number, y: number },
  rotation: number, // radians
  scale: { x: number, y: number },
  collisionEnabled: boolean,
  zIndex: number,
  sprite: Phaser.GameObjects.Sprite
}
```

### World State (Saved)
```javascript
{
  version: "1.0",
  worldName: "string",
  createdAt: "ISO-8601",
  lastModified: "ISO-8601",
  worldSize: { width: number, height: number },
  placedAssets: [
    {
      instanceId: "uuid",
      assetId: "uuid",
      position: { x: number, y: number },
      rotation: number,
      scale: { x: number, y: number },
      collisionEnabled: boolean,
      zIndex: number
    }
  ],
  playerSpawn: { x: number, y: number },
  cameraPosition: { x: number, y: number, zoom: number }
}
```

## Notes

- Auto-save is debounced to max once per 2 seconds
- Sprite references are not saved (only asset IDs)
- Textures must be loaded before placing assets
- Collision bodies automatically update with transformations
- Transform handles are visual indicators only (not interactive yet)
- Right-click cancels placement mode
- ESC key exits placement mode or deselects asset
