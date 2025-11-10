# Asset Manager

The AssetManager is a core system that handles asset library management, AI-powered asset generation, and Phaser texture loading for the AI Sandbox Builder game.

## Features

### 1. Asset Library Management (Task 2.1)
- **getAssets()** - Retrieve all assets from the library
- **addAsset(assetData)** - Add new assets with automatic ID generation
- **removeAsset(assetId)** - Remove assets with texture cleanup
- **getAsset(assetId)** - Get single asset by ID
- Automatic persistence to localStorage via StorageService
- In-memory caching for fast access

### 2. Asset Generation (Task 2.2)
- **generateAsset(params)** - Generate static pixel art assets via Pixellab API
- **generateAnimatedAsset(params)** - Generate animated assets with multiple frames
- **isLoading()** - Check if generation is in progress
- Comprehensive error handling for all API error scenarios:
  - 401: Invalid API token
  - 402: Insufficient credits
  - 422: Validation errors
  - 429/529: Rate limiting
  - Network errors with retry logic
- Automatic addition to library after successful generation
- Usage tracking (credits and generations)

### 3. Texture Loading for Phaser (Task 2.3)
- **loadAssetTexture(assetData)** - Convert base64 to Phaser texture
- **createAnimationFromFrames(frames, animKey, options)** - Create Phaser animations
- **isTextureLoaded(assetId)** - Check if texture is cached
- **getTextureKey(assetId)** - Get Phaser texture key
- Texture caching to prevent duplicate loads
- Automatic Blob URL conversion for Phaser compatibility
- Error handling for texture loading failures

### 4. Asset Category System (Task 2.4)
- **AssetCategory** enum with 5 categories:
  - CHARACTER - Side view, soft shading, 64x64
  - OBJECT - Front view, medium detail, 64x64
  - TERRAIN - Top-down view, flat shading, 32x32 tiles
  - DECORATION - Front view, high detail, 48x48
  - BUILDING - Isometric view, hard shading, 128x128
- **getCategoryDefaults(category)** - Get preset parameters
- **getCategories()** - List all available categories
- **isValidCategory(category)** - Validate category
- **getAssetsByCategory(category)** - Filter assets by category
- **generateAssetWithCategoryDefaults(params)** - Generate with smart defaults

## Asset Metadata Structure

```javascript
{
  id: "uuid-string",
  name: "Asset Name",
  description: "generation prompt",
  category: "character|object|terrain|decoration|building",
  imageData: "base64-string",
  frames: [], // For animations
  generationParams: {
    textGuidanceScale: 8.0,
    outline: "medium",
    shading: "soft",
    detail: "medium",
    view: "side",
    imageSize: {width: 64, height: 64}
  },
  createdAt: "ISO-8601 timestamp",
  usageCredits: 0
}
```

## Dependencies

- **PixellabAPIService** - API integration for asset generation
- **StorageService** - localStorage persistence
- **Phaser Scene** - Texture loading and animation creation
- **helpers.js** - UUID generation utility

## Integration

```javascript
import AssetManager from './managers/AssetManager.js';
import PixellabAPIService from './services/PixellabAPIService.js';
import StorageService from './services/StorageService.js';

// In your Phaser scene
create() {
  const storageService = new StorageService();
  const apiService = new PixellabAPIService(storageService.getAPIToken());
  
  this.assetManager = new AssetManager(this, apiService, storageService);
  
  // Generate an asset
  const result = await this.assetManager.generateAsset({
    description: 'a red brick',
    category: 'object'
  });
  
  // Load texture and create sprite
  const textureKey = await this.assetManager.loadAssetTexture(result.asset);
  const sprite = this.add.sprite(400, 300, textureKey);
}
```

## Requirements Covered

- **1.1, 1.2, 1.3** - Asset generation system
- **2.1, 2.2, 2.3, 2.5** - Asset library management
- **7.1, 7.2, 7.3, 7.4, 7.5** - Category system
- **8.1, 8.2, 8.3** - Animation support
- **13.1, 13.2, 13.3, 13.4** - Error handling

## Next Steps

The AssetManager is now ready for integration with:
- UI Manager (Task 3) - For generation modals and library display
- World Manager (Task 4) - For asset placement in the game world
- Input Controller (Task 5) - For user interactions

