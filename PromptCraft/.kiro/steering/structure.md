# Project Structure & Conventions

## Architecture Pattern

**Scene-Manager-Service Architecture**

- **Scenes**: Phaser lifecycle containers (BootScene → MainMenuScene → GameScene + UIScene)
- **Managers**: Domain-specific logic (AssetManager, WorldManager, UIManager)
- **Services**: External integrations (API, Storage)
- **Controllers**: Input handling (InputController)

## Key Patterns

### 1. Service Registry
Services initialized once in BootScene, stored in Phaser registry, retrieved by other scenes:
```javascript
// BootScene
this.registry.set('apiService', apiService);

// GameScene
const apiService = this.registry.get('apiService');
```

### 2. Event-Driven Communication
Scenes communicate via events, not direct references:
```javascript
// UIScene emits
this.scene.get('GameScene').events.emit('generate-asset', params);

// GameScene listens
this.events.on('generate-asset', this.handleGeneration, this);
```

### 3. Manager Pattern
Each manager owns a specific domain:
- **AssetManager**: Generation, library, textures
- **WorldManager**: Placement, transforms, physics, persistence
- **UIManager**: Modals, toolbar, HUD
- **SpritePool**: Sprite reuse for performance

### 4. Centralized Configuration
All constants in `src/config/gameConfig.js`:
```javascript
import { PHYSICS_CONFIG, CAMERA_CONFIG } from './config/gameConfig.js';
```

## Code Conventions

### File Organization
- One class per file
- File name matches class name (PascalCase)
- README.md alongside complex managers
- Test files in project root as `test-*.html`

### Import Style
```javascript
// ES6 imports with .js extension
import Phaser from 'phaser';
import AssetManager from './managers/AssetManager.js';
import { GAME_CONFIG } from './config/gameConfig.js';
```

### Class Structure
```javascript
export default class ManagerName {
  constructor(scene, dependencies) {
    this.scene = scene;
    // Initialize
  }

  // Public methods (camelCase)
  publicMethod() {}

  // Private methods (underscore prefix)
  _privateMethod() {}

  // Cleanup
  destroy() {
    // Remove listeners, clear references
  }
}
```

### Naming Conventions
- **Classes**: PascalCase (`AssetManager`)
- **Files**: PascalCase for classes, camelCase for configs
- **Methods**: camelCase (`generateAsset`)
- **Private methods**: `_prefixWithUnderscore`
- **Constants**: UPPER_SNAKE_CASE (`MAX_ASSETS`)
- **Events**: kebab-case (`'generate-asset'`)

### Error Handling
- Try-catch in async operations
- Return `{ success, error, data }` objects
- Display user-friendly messages via UIManager
- Log detailed errors to console

### Comments
- JSDoc for public methods
- Inline comments for complex logic
- README.md for manager documentation
- No redundant comments

## Data Flow Examples

### Asset Generation
```
User Input → UIManager → Event → GameScene → AssetManager → API Service
                                                    ↓
                                            StorageService
                                                    ↓
                                            Update UI
```

### Asset Placement
```
User Click → InputController → WorldManager → SpritePool → Physics
                                      ↓
                              StorageService (auto-save)
```

## Performance Considerations

- **Sprite Pooling**: Reuse sprites via SpritePool
- **Culling**: Hide off-screen sprites (WorldManager)
- **Debounced Saves**: Max once per 2 seconds
- **Texture Caching**: Check before loading duplicates
- **Asset Limit**: 500 max, warning at 400

## State Management

### localStorage Keys
- `asset_library` - Generated assets
- `world_state` - Placed assets and world data
- `game_settings` - User preferences

### In-Memory State
- Managers maintain their own state
- No global state object
- Phaser registry for shared services only

## Testing Approach

- Manual testing via standalone HTML files
- Each test file focuses on one feature
- No automated test framework
- Test files include inline documentation
