# AI Sandbox Builder - System Architecture

## Scene Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         GAME STARTUP                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   BootScene      │
                    │                  │
                    │ • Load settings  │
                    │ • Validate token │
                    │ • Init services  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ MainMenuScene    │
                    │                  │
                    │ • Show menu      │
                    │ • Start game     │
                    └────────┬─────────┘
                             │
                             ▼
        ┌────────────────────┴────────────────────┐
        │                                          │
        ▼                                          ▼
┌──────────────────┐                    ┌──────────────────┐
│   GameScene      │◄───────events─────►│    UIScene       │
│                  │                    │                  │
│ • Player         │                    │ • Toolbar        │
│ • World          │                    │ • Modals         │
│ • Physics        │                    │ • HUD            │
│ • Managers       │                    │ • Tooltips       │
└────────┬─────────┘                    └────────┬─────────┘
         │                                       │
         │                                       │
         ▼                                       ▼
┌─────────────────────────────────────────────────────────┐
│                    SHARED SERVICES                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Pixellab API │  │   Storage    │  │ Asset Manager│ │
│  │   Service    │  │   Service    │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │    World     │  │    Input     │                    │
│  │   Manager    │  │  Controller  │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## Event Communication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        EVENT SYSTEM                              │
└─────────────────────────────────────────────────────────────────┘

UIScene Events (Emitted)                GameScene Events (Emitted)
─────────────────────                   ──────────────────────────
• generate-asset                        • game-started
• place-asset                           • asset-placed
• delete-asset                          • asset-selected
• toolbar-action                        • asset-deleted
• export-world                          • world-saved
• import-world

        │                                       │
        │                                       │
        └───────────────┬───────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   Event Listeners     │
            │                       │
            │ Both scenes listen    │
            │ to each other's       │
            │ events for sync       │
            └───────────────────────┘

WorldManager Events                     UIManager Events
───────────────────                     ────────────────
• asset-limit-warning                   • (emits to scene.events)
• asset-limit-reached                   • All UI interactions
```

## Manager Initialization Sequence

```
1. BootScene.create()
   │
   ├─► StorageService.new()
   ├─► PixellabAPIService.new(token)
   └─► Registry.set('apiService', 'storageService')

2. GameScene.create()
   │
   ├─► Get services from registry
   ├─► AssetManager.new(scene, apiService, storageService)
   ├─► WorldManager.new(scene, storageService)
   ├─► InputController.new(scene)
   └─► Load world state

3. UIScene.create()
   │
   ├─► Get GameScene reference
   ├─► Get managers from GameScene
   ├─► UIManager.new(scene)
   ├─► Create toolbar
   └─► Setup event listeners

4. GameScene.startGame()
   │
   ├─► InputController.setReferences(player, worldManager, uiManager, assetManager)
   ├─► InputController.enableCameraFollow()
   ├─► WorldManager.setupPlayerCollision(player)
   └─► Emit 'game-started' event
```

## Data Flow: Asset Generation

```
User clicks "Generate" button
        │
        ▼
UIManager.showGenerationModal()
        │
        ▼
User fills form and submits
        │
        ▼
UIManager._handleGenerationSubmit()
        │
        ▼
Emit 'generate-asset' event with params
        │
        ▼
UIScene.handleAssetGeneration(params, callback)
        │
        ▼
AssetManager.generateAsset(params)
        │
        ▼
PixellabAPIService.generateImage(params)
        │
        ▼
API returns base64 image data
        │
        ▼
AssetManager.addAsset(assetData)
        │
        ▼
StorageService.saveAssetLibrary(assets)
        │
        ▼
UIScene updates credits display
        │
        ▼
Callback(success=true)
        │
        ▼
UIManager hides modal and shows success
```

## Data Flow: Asset Placement

```
User clicks asset in library
        │
        ▼
UIManager._handleAssetPlace(asset)
        │
        ▼
Emit 'place-asset' event
        │
        ▼
UIScene.handleAssetPlacement(assetId)
        │
        ▼
AssetManager.prepareAssetForPlacement(assetId)
        │
        ├─► Load texture if needed
        └─► Create animation if needed
        │
        ▼
WorldManager.enterPlacementMode(assetData)
        │
        ├─► Create preview sprite
        └─► Setup input listeners
        │
        ▼
User clicks in world
        │
        ▼
WorldManager._handlePlacementClick(pointer)
        │
        ▼
WorldManager.addPlacedAsset(params)
        │
        ├─► Create sprite from pool
        ├─► Setup physics body
        ├─► Add to placedAssets array
        └─► Trigger auto-save
        │
        ▼
WorldManager.debouncedSave()
        │
        ▼
StorageService.saveWorldState(worldData)
```

## Service Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEPENDENCY GRAPH                            │
└─────────────────────────────────────────────────────────────────┘

BootScene
    └─► StorageService
    └─► PixellabAPIService

GameScene
    ├─► AssetManager
    │   ├─► PixellabAPIService
    │   └─► StorageService
    ├─► WorldManager
    │   └─► StorageService
    └─► InputController

UIScene
    ├─► UIManager
    ├─► AssetManager (from GameScene)
    └─► WorldManager (from GameScene)

InputController
    ├─► Player (sprite)
    ├─► WorldManager
    ├─► UIManager
    └─► AssetManager
```

## Key Design Patterns

### 1. Service Registry Pattern
- Services initialized once in BootScene
- Stored in Phaser registry
- Retrieved by other scenes as needed
- Ensures single source of truth

### 2. Event-Driven Architecture
- Scenes communicate via events
- Loose coupling between components
- Easy to add new listeners
- Supports parallel scene execution

### 3. Manager Pattern
- Each manager handles specific domain
- Clear separation of concerns
- Managers can be tested independently
- Easy to extend functionality

### 4. Observer Pattern
- UI observes game state changes
- Game observes user interactions
- Automatic updates on state changes
- Reduces direct dependencies

### 5. Callback Pattern
- Used for async operations
- Provides immediate feedback
- Allows error handling
- Complements event system

## Performance Optimizations

### Sprite Pooling
```
WorldManager
    └─► SpritePool
        ├─► Reuses sprites instead of creating new
        ├─► Reduces garbage collection
        └─► Improves performance with many assets
```

### Culling System
```
WorldManager.updateCulling()
    ├─► Hides off-screen sprites
    ├─► Disables physics for culled sprites
    ├─► Runs every frame
    └─► Configurable margin
```

### Debounced Saves
```
WorldManager.debouncedSave()
    ├─► Max once per 2 seconds
    ├─► Prevents excessive storage writes
    └─► Triggered on world modifications
```

### Texture Caching
```
AssetManager.textureCache
    ├─► Prevents duplicate texture loads
    ├─► Maps assetId to textureKey
    └─► Checks Phaser texture manager
```

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                              │
└─────────────────────────────────────────────────────────────────┘

API Errors
    ├─► Caught in AssetManager
    ├─► Formatted by PixellabAPIService.handleAPIError()
    ├─► Passed to callback or thrown
    └─► Displayed by UIManager.showErrorModal()

Storage Errors
    ├─► Caught in managers
    ├─► Logged to console
    ├─► Graceful degradation
    └─► User notified if critical

Validation Errors
    ├─► Caught in UIManager
    ├─► Displayed inline in forms
    ├─► Prevents invalid submissions
    └─► Clear error messages

Network Errors
    ├─► Retry logic in PixellabAPIService
    ├─► Max 3 attempts with backoff
    ├─► User notified after retries
    └─► Option to retry manually
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                      STATE STORAGE                               │
└─────────────────────────────────────────────────────────────────┘

LocalStorage Keys:
    ├─► pixellab_api_token      (API authentication)
    ├─► asset_library           (Generated assets)
    ├─► world_state             (Placed assets and world data)
    └─► game_settings           (User preferences)

In-Memory State:
    ├─► AssetManager.assets     (Asset library cache)
    ├─► WorldManager.placedAssets (Placed asset instances)
    ├─► UIManager.credits       (Current credits)
    └─► InputController state   (Input and camera state)

Phaser Registry:
    ├─► apiService              (Shared API service)
    └─► storageService          (Shared storage service)
```

This architecture provides a solid foundation for the AI Sandbox Builder game with clear separation of concerns, robust event communication, and efficient state management.
