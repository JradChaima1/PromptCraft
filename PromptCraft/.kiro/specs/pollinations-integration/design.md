# Design Document

## Overview

This design replaces the Pixellab API integration with Pollinations.ai, simplifying the asset generation system by removing authentication requirements, credit management, and complex parameter configurations. The new implementation uses a straightforward URL-based API that generates images on-demand without requiring API tokens or payment.

### Key Design Goals

1. **Simplification**: Remove authentication, credit tracking, and complex parameters
2. **Free Access**: Enable asset generation without API costs
3. **Backward Compatibility**: Preserve existing assets and functionality
4. **Minimal Changes**: Replace only the API service layer, keeping other systems intact
5. **User Experience**: Maintain familiar workflow with simpler configuration

### Technology Stack Changes

- **Remove**: Pixellab API v2, Bearer token authentication, credit management
- **Add**: Pollinations.ai URL-based API, model selection
- **Keep**: Phaser 3, Vite, LocalStorage, existing managers and UI structure

## Architecture

### High-Level Architecture Changes

```
┌─────────────────────────────────────────────────────────────┐
│                    Game Application                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │  Game Scene  │  │ Asset Manager│      │
│  │              │  │              │  │              │      │
│  │ - Simplified │  │              │  │ - Updated    │      │
│  │   Gen Modal  │  │              │  │   for Pollin.│      │
│  │ - No Credits │  │              │  │              │      │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘      │
│         │                                     │              │
│         └─────────────────────────────────────┘              │
│                            │                                 │
│  ┌─────────────────────────┴──────────────────────────┐     │
│  │         Services Layer (REPLACED)                  │     │
│  ├─────────────────────────────────────────────────────┤     │
│  │                                                      │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │     PollinationsAPIService (NEW)             │  │     │
│  │  │  - URL construction                          │  │     │
│  │  │  - Image fetching                            │  │     │
│  │  │  - Model management                          │  │     │
│  │  │  - No authentication                         │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  │                                                      │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │  PixellabAPIService (REMOVED)                │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  │                                                      │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   External Services   │
                ├───────────────────────┤
                │  Pollinations.ai API  │
                │  Browser LocalStorage │
                └───────────────────────┘
```


## Components and Interfaces

### 1. PollinationsAPIService (NEW - Replaces PixellabAPIService)

**Purpose**: Handle all Pollinations.ai image generation

**File**: `src/services/PollinationsAPIService.js`

**Interface**:
```javascript
class PollinationsAPIService {
  constructor()
  
  // Generation
  async generateImage(params)
  // params: {description, imageSize, model, seed, nologo}
  // returns: Promise<{imageData: base64String, metadata: {model, seed, generationURL}}>
  
  // URL Construction
  buildPollinationsURL(params)
  // returns: string (complete Pollinations URL)
  
  // Image Fetching
  async fetchImageFromURL(url)
  // returns: Promise<base64String>
  
  // Model Management
  getAvailableModels()
  // returns: Array<{name, description}>
  
  getDefaultModel()
  // returns: string ("turbo")
  
  // Error Handling
  handleAPIError(error)
  // returns: string (user-friendly error message)
}
```

**Pollinations URL Format**:
```
https://image.pollinations.ai/prompt/{encodedDescription}?width={w}&height={h}&seed={s}&model={m}&nologo=true
```

**Available Models**:
```javascript
[
  {
    name: 'turbo',
    description: 'Fast generation, good for iteration (default)'
  },
  {
    name: 'flux',
    description: 'Balanced quality and speed'
  },
  {
    name: 'flux-realism',
    description: 'Photorealistic style'
  },
  {
    name: 'flux-anime',
    description: 'Anime and manga style'
  },
  {
    name: 'flux-3d',
    description: '3D rendered style'
  }
]
```

**Implementation Details**:
- No authentication required
- Free to use (rate limited by Pollinations)
- Images generated on-demand via URL
- Supports seeds for reproducibility
- CORS-enabled for browser access
- Returns PNG images
- Typical generation time: 5-15 seconds
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- Timeout: 30 seconds per attempt


### 2. Updated AssetManager

**Purpose**: Use PollinationsAPIService instead of PixellabAPIService

**File**: `src/managers/AssetManager.js` (modified)

**Changes**:
```javascript
class AssetManager {
  constructor(scene, apiService, storageService) {
    // apiService is now PollinationsAPIService instead of PixellabAPIService
    this.apiService = apiService;
    // ... rest remains the same
  }
  
  async generateAsset(params) {
    // Remove animation support check
    // Remove Pixellab-specific parameter handling
    
    // Call Pollinations API
    const result = await this.apiService.generateImage({
      description: params.description,
      imageSize: params.imageSize,
      model: params.model || 'turbo',
      seed: params.seed || null,
      nologo: true
    });
    
    // Create asset metadata
    const assetData = {
      id: generateUUID(),
      name: params.name || params.description.substring(0, 30),
      description: params.description,
      category: params.category || 'object',
      imageData: result.imageData,
      frames: [], // No animation support
      generationParams: {
        description: params.description,
        imageSize: params.imageSize,
        model: result.metadata.model,
        seed: result.metadata.seed
      },
      createdAt: new Date().toISOString(),
      usageCredits: 0 // Free service
    };
    
    return this.addAsset(assetData);
  }
  
  // Remove generateAnimatedAsset method
  // Keep all other methods unchanged
}
```

### 3. Updated UIManager

**Purpose**: Simplify generation modal and remove credit displays

**File**: `src/managers/UIManager.js` (modified)

**Changes**:
```javascript
class UIManager {
  // ... existing methods
  
  // MODIFIED: Simplified generation modal
  showGenerationModal() {
    // Remove: API token status
    // Remove: Credit display
    // Remove: Pixellab parameters (outline, shading, detail, view, direction, textGuidanceScale)
    // Remove: Animation toggle
    
    // Keep: Description input
    // Keep: Image size inputs
    // Keep: Category selector
    
    // Add: Model selector dropdown
    // Add: Seed input (optional)
    // Add: Model descriptions as tooltips
  }
  
  // REMOVE: updateCreditsDisplay method
  // REMOVE: showAPITokenPrompt method
  
  // Keep all other methods unchanged
}
```

**Updated Generation Modal Layout**:
```
┌─────────────────────────────────────────────────────┐
│              Asset Generation                        │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Description: [________________________________]      │
│                                                       │
│  Category: [Object ▼]                                │
│                                                       │
│  Model: [turbo ▼] ⓘ Fast generation (default)       │
│                                                       │
│  Image Size: Width [64] Height [64]                  │
│                                                       │
│  Seed (optional): [_______] ⓘ For reproducibility   │
│                                                       │
│  [Generate]  [Cancel]                                │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### 4. Updated StorageService

**Purpose**: Remove API token storage

**File**: `src/services/StorageService.js` (modified)

**Changes**:
```javascript
class StorageService {
  // REMOVE: saveAPIToken method
  // REMOVE: getAPIToken method
  // REMOVE: clearAPIToken method
  
  // Keep all other methods unchanged
  // Asset library, world state, and settings storage remain the same
}
```

**Updated Storage Keys**:
- Remove: `pixellab_api_token`
- Keep: `asset_library`
- Keep: `world_state`
- Keep: `game_settings`


## Data Models

### Updated Asset Metadata Schema

```javascript
{
  id: "uuid",
  name: "string",
  description: "string",
  category: "character|object|terrain|decoration|building",
  imageData: "base64-string",
  frames: [], // Always empty (no animation support)
  
  generationParams: {
    description: "string",
    imageSize: {width: number, height: number},
    model: "turbo|flux|flux-realism|flux-anime|flux-3d",
    seed: number | null
  },
  
  createdAt: "ISO-8601",
  usageCredits: 0 // Always 0 for Pollinations
}
```

**Changes from Pixellab Schema**:
- Removed: `textGuidanceScale`, `outline`, `shading`, `detail`, `view`, `direction`, `isometric`, `noBackground`
- Added: `model`, `seed`
- Changed: `usageCredits` always 0
- Changed: `frames` always empty array

### Generation Parameters

**Pollinations Parameters**:
```javascript
{
  description: string,        // Required: Text prompt
  imageSize: {                // Required: Image dimensions
    width: number,            // Min: 16, Max: 1024
    height: number            // Min: 16, Max: 1024
  },
  model: string,              // Optional: Default "turbo"
  seed: number | null,        // Optional: For reproducibility
  nologo: boolean             // Always true
}
```

**Removed Pixellab Parameters**:
- `textGuidanceScale` (1.0-20.0)
- `outline` (thin, medium, thick, none)
- `shading` (soft, hard, flat, none)
- `detail` (low, medium, high)
- `view` (side, low top-down, high top-down)
- `direction` (north, south, east, west, etc.)
- `isometric` (boolean)
- `noBackground` (boolean)
- `action` (for animations)
- `nFrames` (for animations)

## Error Handling

### Pollinations-Specific Errors

1. **Rate Limiting**
   - Detection: HTTP 429 or repeated slow responses
   - Message: "Too many requests. Pollinations is experiencing high traffic. Please wait a moment and try again."
   - Action: Exponential backoff, suggest waiting 30-60 seconds

2. **Service Unavailable**
   - Detection: HTTP 503 or connection refused
   - Message: "Image generation service is temporarily unavailable. Please try again in a few minutes."
   - Action: Offer retry button

3. **Network Errors**
   - Detection: Fetch failure, timeout
   - Message: "Network error. Check your connection and try again."
   - Action: Retry up to 3 times, then show error

4. **Timeout**
   - Detection: Request exceeds 30 seconds
   - Message: "Generation timed out. The service may be overloaded. Please try again."
   - Action: Cancel request, offer retry

5. **Invalid Parameters**
   - Detection: Malformed URL or invalid model
   - Message: "Invalid generation parameters. Please check your inputs."
   - Action: Validate before sending request

6. **Image Fetch Failure**
   - Detection: Image URL returns error or invalid data
   - Message: "Failed to retrieve generated image. Please try again."
   - Action: Retry with backoff

### Error Handling Flow

```javascript
async function generateImage(params) {
  try {
    // Validate parameters
    if (!params.description || params.description.trim().length === 0) {
      throw new Error('Description is required');
    }
    
    if (params.imageSize.width < 16 || params.imageSize.width > 1024) {
      throw new Error('Width must be between 16 and 1024 pixels');
    }
    
    // Build URL
    const url = this.buildPollinationsURL(params);
    
    // Fetch image with retry
    const imageData = await this.fetchImageFromURL(url);
    
    return {
      imageData,
      metadata: {
        model: params.model || 'turbo',
        seed: params.seed || null,
        generationURL: url
      }
    };
    
  } catch (error) {
    console.error('Pollinations generation failed:', error);
    const userMessage = this.handleAPIError(error);
    throw new Error(userMessage);
  }
}
```


## Testing Strategy

### Unit Testing

**Test Files**:
```
tests/
├── services/
│   └── PollinationsAPIService.test.js (NEW)
└── managers/
    └── AssetManager.test.js (updated)
```

**Key Test Cases**:

1. **PollinationsAPIService**
   - URL construction with various parameters
   - URL encoding of special characters in description
   - Model validation and default selection
   - Seed handling (null and numeric values)
   - Image fetching from URL
   - Base64 conversion
   - Retry logic for failures
   - Timeout handling
   - Error message formatting

2. **AssetManager**
   - Generation with Pollinations service
   - Asset metadata structure
   - Removal of animation-related code
   - Backward compatibility with existing assets

### Integration Testing

**Test Scenarios**:

1. **Complete Generation Flow**
   - User enters description → URL construction → Image fetch → Base64 conversion → Asset creation → Library storage

2. **Model Selection**
   - Generate with each available model
   - Verify model parameter in URL
   - Verify model stored in asset metadata

3. **Seed Reproducibility**
   - Generate with specific seed
   - Generate again with same seed and parameters
   - Verify identical results

4. **Error Recovery**
   - Simulate network failure → Verify retry logic
   - Simulate timeout → Verify error message
   - Simulate rate limit → Verify appropriate message

5. **Backward Compatibility**
   - Load existing Pixellab assets
   - Verify they display correctly
   - Verify no errors or crashes

### Manual Testing Checklist

- [ ] Generate image with default settings (turbo model)
- [ ] Generate images with each model (turbo, flux, flux-realism, flux-anime, flux-3d)
- [ ] Test seed reproducibility (same seed = same image)
- [ ] Test various image sizes (16x16, 64x64, 128x128, 512x512)
- [ ] Test with long descriptions (100+ characters)
- [ ] Test with special characters in description
- [ ] Verify loading indicators during generation
- [ ] Test error handling (disconnect network, wait for timeout)
- [ ] Load existing world with Pixellab assets
- [ ] Verify no credit displays in UI
- [ ] Verify no API token prompts
- [ ] Test asset library with mixed old/new assets
- [ ] Export and import world with new assets
- [ ] Verify generation works without any setup/authentication

### Performance Testing

**Metrics to Monitor**:
- Image generation time (expect 5-15 seconds)
- Image fetch time (should complete within 30 seconds)
- UI responsiveness during generation
- Memory usage (should not increase significantly)
- Storage size of base64 images

**Performance Expectations**:
- Generation time: 5-15 seconds (depends on Pollinations load)
- Timeout threshold: 30 seconds
- Retry attempts: 3 maximum
- UI should remain responsive during generation
- No memory leaks from repeated generations


## Implementation Phases

### Phase 1: Create Pollinations Service
- Implement PollinationsAPIService class
- Add URL construction logic
- Implement image fetching with retry
- Add model management
- Test basic generation

### Phase 2: Update Asset Manager
- Replace PixellabAPIService with PollinationsAPIService
- Update generateAsset method
- Remove animation support
- Update asset metadata structure
- Test asset generation and storage

### Phase 3: Update UI
- Simplify generation modal
- Add model selector
- Add seed input
- Remove credit displays
- Remove API token settings
- Update help documentation

### Phase 4: Cleanup
- Remove PixellabAPIService file
- Remove unused utility functions
- Remove API token storage methods
- Update code comments
- Remove dead code

### Phase 5: Testing
- Unit tests for PollinationsAPIService
- Integration tests for generation flow
- Backward compatibility testing
- Performance testing
- User acceptance testing

## Migration Strategy

### For Existing Users

1. **Automatic Migration**
   - No user action required
   - Existing assets remain functional
   - No data loss
   - Settings automatically updated

2. **First Launch After Update**
   - Remove API token prompt
   - Show "What's New" message explaining free generation
   - Offer to try Pollinations with sample generation
   - Update help documentation

3. **Backward Compatibility**
   - Existing Pixellab assets display correctly
   - Old asset metadata preserved
   - World save/load works unchanged
   - Export/import maintains compatibility

### Code Removal Checklist

**Files to Remove**:
- `src/services/PixellabAPIService.js`
- `src/services/API_USAGE.md` (Pixellab-specific)

**Code to Remove**:
- API token storage methods in StorageService
- Credit display methods in UIManager
- Animation generation methods in AssetManager
- Pixellab-specific parameter handling
- Authentication error handling (401, 402)

**Code to Update**:
- AssetManager constructor (accept PollinationsAPIService)
- Generation modal UI (simplified parameters)
- Settings modal (remove API token section)
- Help documentation (reference Pollinations)
- Error messages (Pollinations-specific)

## Security Considerations

1. **No Authentication Required**
   - No API tokens to store or manage
   - No sensitive data in localStorage
   - Reduced security surface area

2. **URL Construction**
   - Sanitize and encode user input
   - Validate all parameters before URL construction
   - Prevent injection attacks

3. **Image Fetching**
   - Validate image URLs
   - Implement timeout to prevent hanging
   - Handle malicious or oversized images
   - CORS is handled by Pollinations

4. **Rate Limiting**
   - Respect Pollinations rate limits
   - Implement client-side throttling if needed
   - Handle rate limit errors gracefully

## Performance Considerations

1. **Generation Time**
   - Pollinations typically takes 5-15 seconds
   - Show clear loading indicators
   - Allow cancellation of long-running requests
   - Implement timeout (30 seconds)

2. **Image Fetching**
   - Use efficient fetch API
   - Convert to base64 only once
   - Cache images in memory during session
   - Implement retry with exponential backoff

3. **Storage**
   - Base64 images are same size as before
   - No additional storage overhead
   - Existing compression strategies apply

4. **UI Responsiveness**
   - Keep UI responsive during generation
   - Use async/await properly
   - Show progress indicators
   - Allow user to continue other actions

## Future Enhancements

1. **Advanced Features**
   - Batch generation (multiple images at once)
   - Image-to-image generation (if Pollinations adds support)
   - Negative prompts (if supported)
   - Style presets for common use cases

2. **Quality Improvements**
   - Prompt optimization suggestions
   - Model recommendation based on description
   - Quality comparison between models
   - Generation history and favorites

3. **Performance Optimizations**
   - Prefetch common generations
   - Progressive image loading
   - WebP format support (if available)
   - Local caching strategies

4. **User Experience**
   - Prompt templates and examples
   - One-click regeneration with variations
   - Seed randomization button
   - Model comparison view
