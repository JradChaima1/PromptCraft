# Design Document

## Overview

The AI-Powered 2D Sandbox Building Game is a creative browser-based game built with Phaser 3 that integrates the Pixellab API for AI-generated pixel art assets. The architecture follows a modular design with clear separation between game logic, API integration, asset management, and UI systems. The game leverages browser local storage for persistence and implements efficient rendering and physics systems to support large-scale world building.

### Technology Stack

- **Game Engine**: Phaser 3.90.0 (already integrated)
- **Build Tool**: Vite 7.2.2 (already configured)
- **API Integration**: Pixellab API v2 (REST API with Bearer token authentication)
- **Storage**: Browser LocalStorage API for persistence
- **Language**: JavaScript (ES6+ modules)
- **Graphics**: HTML5 Canvas via Phaser renderer

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Game Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │  Game Scene  │  │ Asset Manager│      │
│  │              │  │              │  │              │      │
│  │ - Toolbars   │  │ - Player     │  │ - Library    │      │
│  │ - Modals     │  │ - World      │  │ - Generation │      │
│  │ - Menus      │  │ - Camera     │  │ - Placement  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│  ┌─────────────────────────┴──────────────────────────┐     │
│  │              Core Systems Layer                     │     │
│  ├─────────────────────────────────────────────────────┤     │
│  │                                                      │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │     │
│  │  │ Pixellab API │  │   Storage    │  │ Physics  │ │     │
│  │  │   Service    │  │   Service    │  │ Manager  │ │     │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │     │
│  │                                                      │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   External Services   │
                ├───────────────────────┤
                │  Pixellab API v2      │
                │  Browser LocalStorage │
                └───────────────────────┘
```

### Scene Architecture

The game will use multiple Phaser scenes for different game states:

1. **BootScene**: Initial loading and API token validation
2. **MainMenuScene**: Game start menu and settings
3. **GameScene**: Primary gameplay scene (already exists, will be enhanced)
4. **UIScene**: Overlay scene for toolbars and modals (runs parallel to GameScene)

## Components and Interfaces

### 1. Pixellab API Service

**Purpose**: Centralized service for all Pixellab API interactions

**File**: `src/services/PixellabAPIService.js`

**Interface**:
```javascript
class PixellabAPIService {
  constructor(apiToken)
  
  // Authentication
  setApiToken(token)
  validateToken() // Returns Promise<boolean>
  getBalance() // Returns Promise<{credits, generations}>
  
  // Image Generation
  generateImage(params) // Returns Promise<{imageData, usage}>
  // params: {description, imageSize, textGuidanceScale, outline, shading, detail, view, direction, isometric, noBackground, seed}
  
  // Animation Generation
  generateAnimation(params) // Returns Promise<{frames[], usage}>
  // params: {description, actionDescription, imageSize, textGuidanceScale, nFrames, view, direction, seed}
  
  // Character Generation
  generateCharacter(params) // Returns Promise<{jobId, characterId}>
  // params: {description, imageSize, directions, outline, shading, detail, view, isometric, seed}
  
  // Job Status
  checkJobStatus(jobId) // Returns Promise<{status, result}>
  
  // Error Handling
  handleAPIError(error) // Returns formatted error message
}
```

**Implementation Details**:
- Base URL: `https://api.pixellab.ai/v2`
- All requests include `Authorization: Bearer ${token}` header
- Implements retry logic for network failures (max 3 attempts)
- Converts base64 responses to Blob URLs for Phaser texture loading
- Tracks usage data from API responses

### 2. Asset Manager

**Purpose**: Manages asset library, generation, and placement

**File**: `src/managers/AssetManager.js`

**Interface**:
```javascript
class AssetManager {
  constructor(scene, apiService, storageService)
  
  // Library Management
  getAssets() // Returns array of asset metadata
  addAsset(assetData) // Adds to library and storage
  removeAsset(assetId) // Removes from library and storage
  getAsset(assetId) // Returns single asset data
  
  // Generation
  async generateAsset(params) // Creates asset via API
  async generateAnimatedAsset(params) // Creates animated asset
  
  // Placement
  enterPlacementMode(assetId)
  exitPlacementMode()
  placeAsset(x, y, assetId) // Creates sprite in world
  
  // Texture Management
  loadAssetTexture(assetData) // Loads base64 into Phaser
  createAnimationFromFrames(frames, animKey)
}
```

**Data Structures**:
```javascript
// Asset metadata structure
{
  id: "uuid-string",
  name: "Asset Name",
  description: "generation prompt",
  category: "character|object|terrain|decoration|building",
  imageData: "base64-string" or "blob-url",
  frames: [], // For animations
  generationParams: {
    textGuidanceScale: 8.0,
    outline: "medium",
    shading: "soft",
    detail: "medium",
    view: "side",
    imageSize: {width: 64, height: 64}
  },
  createdAt: timestamp,
  usageCredits: number
}
```

### 3. Storage Service

**Purpose**: Handles all browser storage operations

**File**: `src/services/StorageService.js`

**Interface**:
```javascript
class StorageService {
  // API Token
  saveAPIToken(token)
  getAPIToken()
  clearAPIToken()
  
  // Asset Library
  saveAssetLibrary(assets)
  loadAssetLibrary() // Returns array of assets
  
  // World State
  saveWorldState(worldData)
  loadWorldState() // Returns world data
  clearWorldState()
  
  // Settings
  saveSettings(settings)
  loadSettings()
  
  // Export/Import
  exportToFile(data, filename)
  importFromFile() // Returns Promise<data>
}
```

**Storage Keys**:
- `pixellab_api_token`: API authentication token
- `asset_library`: JSON array of asset metadata
- `world_state`: JSON object with placed assets
- `game_settings`: JSON object with user preferences

**Storage Optimization**:
- Compress large base64 strings using LZ-string library (optional enhancement)
- Implement storage quota checking before saves
- Provide cleanup utilities for old/unused assets

### 4. World Manager

**Purpose**: Manages placed assets and world state

**File**: `src/managers/WorldManager.js`

**Interface**:
```javascript
class WorldManager {
  constructor(scene, storageService)
  
  // Placed Assets
  addPlacedAsset(assetData) // Creates sprite and physics body
  removePlacedAsset(instanceId)
  getPlacedAsset(instanceId)
  getAllPlacedAssets()
  
  // Transformations
  moveAsset(instanceId, x, y)
  rotateAsset(instanceId, angle)
  scaleAsset(instanceId, scaleX, scaleY)
  
  // Selection
  selectAsset(instanceId)
  deselectAsset()
  getSelectedAsset()
  
  // Physics
  setCollisionEnabled(instanceId, enabled)
  updatePhysicsBody(instanceId)
  
  // Persistence
  saveWorld()
  loadWorld()
  clearWorld()
  
  // Export/Import
  exportWorld() // Returns JSON
  importWorld(worldData)
}
```

**Placed Asset Data Structure**:
```javascript
{
  instanceId: "uuid-string",
  assetId: "reference-to-library-asset",
  position: {x: number, y: number},
  rotation: number, // radians
  scale: {x: number, y: number},
  collisionEnabled: boolean,
  zIndex: number,
  customProperties: {} // For future extensions
}
```

### 5. UI Manager

**Purpose**: Manages all UI elements and interactions

**File**: `src/managers/UIManager.js`

**Interface**:
```javascript
class UIManager {
  constructor(scene)
  
  // Toolbars
  createMainToolbar()
  createAssetGeneratorPanel()
  createAssetLibraryPanel()
  createTransformControls()
  
  // Modals
  showGenerationModal()
  showLibraryModal()
  showSettingsModal()
  showErrorModal(message)
  showLoadingModal(message)
  hideAllModals()
  
  // HUD
  updateCreditsDisplay(credits, generations)
  updateAssetCountDisplay(count)
  showTooltip(text, x, y)
  hideTooltip()
  
  // Input Handling
  handleToolbarClick(button)
  handleModalInput(modalId, inputData)
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│  [Generate] [Library] [Settings] [Help]   Credits: 100│ ← Top Toolbar
├─────────────────────────────────────────────────────┤
│                                                       │
│                                                       │
│                  Game World View                     │
│                                                       │
│                                                       │
├─────────────────────────────────────────────────────┤
│  [Move] [Rotate] [Scale] [Delete]  Assets: 45/500   │ ← Bottom Toolbar
└─────────────────────────────────────────────────────┘
```

### 6. Input Controller

**Purpose**: Handles all player input and camera controls

**File**: `src/controllers/InputController.js`

**Interface**:
```javascript
class InputController {
  constructor(scene)
  
  // Player Movement
  handlePlayerMovement()
  
  // Camera Controls
  handleCameraZoom(delta)
  handleCameraPan(x, y)
  centerCameraOnPlayer()
  
  // Asset Interaction
  handleAssetClick(pointer)
  handleAssetDrag(pointer)
  handleAssetRelease(pointer)
  
  // Keyboard Shortcuts
  registerShortcuts()
  handleShortcut(key)
  
  // Placement Mode
  handlePlacementPreview(pointer)
  handlePlacementClick(pointer)
}
```

**Keyboard Shortcuts**:
- `Arrow Keys / WASD`: Move player
- `Space`: Jump
- `G`: Open asset generator
- `L`: Open asset library
- `ESC`: Close modals / Deselect
- `Delete`: Remove selected asset
- `Ctrl+S`: Save world
- `Ctrl+E`: Export world
- `Ctrl+Z`: Undo last action (future enhancement)
- `Mouse Wheel`: Zoom camera
- `Middle Mouse Drag`: Pan camera

## Data Models

### Asset Library Schema

```javascript
{
  version: "1.0",
  assets: [
    {
      id: "uuid",
      name: "string",
      description: "string",
      category: "enum",
      imageData: "base64 | blob-url",
      frames: [], // For animations
      generationParams: {},
      createdAt: "ISO-8601",
      usageCredits: number
    }
  ]
}
```

### World State Schema

```javascript
{
  version: "1.0",
  worldName: "string",
  createdAt: "ISO-8601",
  lastModified: "ISO-8601",
  worldSize: {width: number, height: number},
  placedAssets: [
    {
      instanceId: "uuid",
      assetId: "uuid",
      position: {x: number, y: number},
      rotation: number,
      scale: {x: number, y: number},
      collisionEnabled: boolean,
      zIndex: number
    }
  ],
  playerSpawn: {x: number, y: number},
  cameraPosition: {x: number, y: number, zoom: number}
}
```

## Error Handling

### Error Categories and Responses

1. **API Authentication Errors (401)**
   - Display: "Invalid API token. Please check your credentials."
   - Action: Prompt for token re-entry
   - Log: Token validation failure

2. **Insufficient Credits (402)**
   - Display: "Insufficient credits. Visit pixellab.ai to purchase more."
   - Action: Disable generation buttons, show credit purchase link
   - Log: Credit exhaustion event

3. **Validation Errors (422)**
   - Display: Specific validation message from API
   - Action: Highlight invalid input fields
   - Log: Validation details

4. **Rate Limiting (429, 529)**
   - Display: "Too many requests. Please wait before trying again."
   - Action: Implement exponential backoff, disable generation temporarily
   - Log: Rate limit hit with retry time

5. **Network Errors**
   - Display: "Network error. Check your connection and try again."
   - Action: Offer retry button
   - Log: Network failure details

6. **Storage Quota Exceeded**
   - Display: "Storage full. Please delete some assets to continue."
   - Action: Show storage usage, offer cleanup tools
   - Log: Storage quota details

### Error Handling Flow

```javascript
try {
  const result = await apiService.generateImage(params);
  // Success handling
} catch (error) {
  const errorMessage = apiService.handleAPIError(error);
  uiManager.showErrorModal(errorMessage);
  
  // Log for debugging
  console.error('Generation failed:', {
    error,
    params,
    timestamp: new Date().toISOString()
  });
  
  // Specific error handling
  if (error.status === 401) {
    // Prompt for new token
  } else if (error.status === 402) {
    // Show credit purchase info
  }
}
```

## Testing Strategy

### Unit Testing

**Test Files Structure**:
```
tests/
├── services/
│   ├── PixellabAPIService.test.js
│   └── StorageService.test.js
├── managers/
│   ├── AssetManager.test.js
│   └── WorldManager.test.js
└── utils/
    └── helpers.test.js
```

**Key Test Cases**:

1. **PixellabAPIService**
   - Token validation with valid/invalid tokens
   - Image generation with various parameters
   - Error handling for all API error codes
   - Base64 to Blob conversion
   - Retry logic for network failures

2. **StorageService**
   - Save and load operations for all data types
   - Storage quota handling
   - Data corruption recovery
   - Export/import functionality

3. **AssetManager**
   - Asset library CRUD operations
   - Texture loading from base64
   - Animation creation from frames
   - Placement mode state management

4. **WorldManager**
   - Placed asset management
   - Transform operations (move, rotate, scale)
   - Physics body updates
   - World serialization/deserialization

### Integration Testing

**Test Scenarios**:

1. **Complete Asset Generation Flow**
   - User enters description → API call → Texture creation → Library addition → Storage persistence

2. **Asset Placement and Transformation**
   - Select from library → Enter placement mode → Place in world → Transform → Save state

3. **World Persistence**
   - Create world → Place assets → Save → Reload page → Verify world restored

4. **Error Recovery**
   - Trigger API errors → Verify error messages → Verify graceful degradation

### Manual Testing Checklist

- [ ] Generate assets with various descriptions and parameters
- [ ] Test all asset categories (character, object, terrain, etc.)
- [ ] Place multiple instances of same asset
- [ ] Transform assets (move, rotate, scale)
- [ ] Enable/disable collision on assets
- [ ] Save and load world state
- [ ] Export and import world files
- [ ] Test with invalid API token
- [ ] Test with insufficient credits
- [ ] Test storage quota limits
- [ ] Test camera controls (zoom, pan)
- [ ] Test keyboard shortcuts
- [ ] Test UI responsiveness on different screen sizes
- [ ] Test performance with 300+ placed assets

### Performance Testing

**Metrics to Monitor**:
- Frame rate (target: 60 FPS with 300 assets)
- Memory usage (target: < 500MB)
- API response times (target: < 5 seconds for image generation)
- Storage operations (target: < 100ms for save/load)
- Texture loading time (target: < 500ms per asset)

**Performance Optimization Techniques**:
1. Sprite pooling for frequently placed/removed assets
2. Texture atlas for small assets
3. Off-screen culling for rendering
4. Lazy loading for asset library thumbnails
5. Debounced world state saves (save max once per 2 seconds)

## Implementation Phases

### Phase 1: Core API Integration (Foundation)
- Implement PixellabAPIService
- Implement StorageService
- Create API token input and validation UI
- Test basic image generation

### Phase 2: Asset Management (Library System)
- Implement AssetManager
- Create asset library UI
- Implement asset generation modal
- Add asset storage and retrieval

### Phase 3: World Building (Placement System)
- Implement WorldManager
- Create placement mode functionality
- Add asset transformation controls
- Implement world state persistence

### Phase 4: Enhanced Features (Polish)
- Add animated asset support
- Implement export/import functionality
- Add advanced generation parameters UI
- Implement performance optimizations

### Phase 5: Testing and Refinement
- Comprehensive testing
- Bug fixes
- Performance optimization
- User experience improvements

## Security Considerations

1. **API Token Storage**
   - Store in localStorage (acceptable for client-side app)
   - Never log token in console
   - Clear token on logout
   - Consider encryption for sensitive deployments

2. **Input Validation**
   - Sanitize all user inputs before API calls
   - Validate image sizes and parameters
   - Limit description length to prevent abuse

3. **Storage Security**
   - Validate data structure before loading from storage
   - Handle corrupted storage data gracefully
   - Implement storage versioning for migrations

4. **API Rate Limiting**
   - Implement client-side rate limiting
   - Queue requests to prevent spam
   - Respect API rate limit headers

## Deployment Considerations

### Build Configuration

**Vite Configuration** (`vite.config.js`):
```javascript
export default {
  base: './', // For relative paths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable for production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
}
```

### Environment Variables

Create `.env` file for configuration:
```
VITE_PIXELLAB_API_URL=https://api.pixellab.ai/v2
VITE_MAX_ASSETS=500
VITE_WORLD_WIDTH=4000
VITE_WORLD_HEIGHT=600
```

### Hosting Options

1. **Static Hosting** (Recommended)
   - Netlify, Vercel, GitHub Pages
   - No server required
   - CDN distribution
   - HTTPS by default

2. **Self-Hosted**
   - Any web server (nginx, Apache)
   - Serve from `dist/` folder after build
   - Configure CORS if needed

### Browser Compatibility

**Minimum Requirements**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required APIs**:
- LocalStorage
- Canvas
- Fetch API
- ES6 Modules

## Future Enhancements

1. **Multiplayer Collaboration**
   - Real-time world editing with multiple players
   - WebSocket integration for live updates

2. **Advanced Physics**
   - Dynamic physics bodies
   - Destructible terrain
   - Particle effects

3. **Tileset Generation**
   - Use Pixellab tileset API
   - Seamless terrain generation
   - Isometric tile support

4. **Character Animation Templates**
   - Use Pixellab character templates
   - Pre-built animation sets (walk, run, jump)
   - Multi-directional character support

5. **World Scripting**
   - Visual scripting for interactions
   - Trigger zones and events
   - NPC behavior programming

6. **Asset Marketplace**
   - Share worlds and assets with community
   - Import assets from other players
   - Rating and discovery system

7. **Mobile Support**
   - Touch controls for placement
   - Responsive UI for tablets
   - Gesture-based transformations

8. **Undo/Redo System**
   - Command pattern implementation
   - History stack for all actions
   - Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
