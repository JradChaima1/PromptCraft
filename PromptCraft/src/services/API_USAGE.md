# Pixellab API Service Usage Guide

This document explains how to use the PixellabAPIService based on the official Pixellab API v2 documentation.

## API Documentation
- Full API Docs: https://api.pixellab.ai/v2/llms.txt
- Interactive Docs: https://api.pixellab.ai/v2/docs
- Get API Token: https://pixellab.ai/account

## Response Format

All API responses follow this structure:
```json
{
  "success": true,
  "data": {...},
  "error": null,
  "usage": {
    "credits_used": 0,
    "generations_used": 0,
    "remaining_credits": 100,
    "remaining_generations": 50
  }
}
```

## Basic Usage

### 1. Initialize the Service

```javascript
import PixellabAPIService from './services/PixellabAPIService.js';

const apiService = new PixellabAPIService('your-api-token-here');
```

### 2. Validate Token

```javascript
const isValid = await apiService.validateToken();
if (!isValid) {
  console.error('Invalid API token');
}
```

### 3. Check Balance

```javascript
const balance = await apiService.getBalance();
console.log(`Credits: ${balance.remainingCredits}`);
console.log(`Generations: ${balance.remainingGenerations}`);
```

### 4. Generate Static Image

```javascript
try {
  const result = await apiService.generateImage({
    description: 'a brave knight with shining armor',
    imageSize: { width: 64, height: 64 },
    textGuidanceScale: 8.0,
    outline: 'medium',
    shading: 'soft',
    detail: 'medium',
    view: 'side',
    noBackground: false,
    seed: null // or specific number for reproducibility
  });

  console.log('Image generated:', result.imageData); // base64 string
  console.log('Credits used:', result.usage.creditsUsed);
  console.log('Remaining credits:', result.usage.remainingCredits);

  // Convert to Blob URL for Phaser
  const blobUrl = apiService.convertToTextureURL(result.imageData);
  
} catch (error) {
  const errorMessage = apiService.handleAPIError(error);
  console.error(errorMessage);
}
```

### 5. Generate Animation

```javascript
try {
  const result = await apiService.generateAnimation({
    description: 'a brave knight',
    action: 'walking',
    imageSize: { width: 64, height: 64 },
    textGuidanceScale: 8.0,
    nFrames: 4,
    view: 'side',
    direction: 'east',
    seed: null
  });

  console.log('Animation frames:', result.frames); // array of base64 strings
  console.log('Credits used:', result.usage.creditsUsed);
  
  // Convert frames to Blob URLs
  const frameUrls = result.frames.map(frame => 
    apiService.convertToTextureURL(frame)
  );
  
} catch (error) {
  const errorMessage = apiService.handleAPIError(error);
  console.error(errorMessage);
}
```

## Generation Parameters

### Image Size
- **Width/Height**: 16-400 pixels for static images
- **Recommended**: 64x64 for characters, 32x32 for small objects, 128x128 for buildings

### Text Guidance Scale
- **Range**: 1.0 - 20.0
- **Default**: 8.0
- **Higher values**: More faithful to description
- **Lower values**: More creative interpretation

### Outline Options
- `'thin'` - Minimal outline
- `'medium'` - Standard outline (default)
- `'thick'` - Bold outline
- `'none'` - No outline

### Shading Options
- `'soft'` - Smooth gradients (default)
- `'hard'` - Sharp shadows
- `'flat'` - No shading
- `'none'` - Minimal shading

### Detail Options
- `'low'` - Simple, minimal detail
- `'medium'` - Balanced detail (default)
- `'high'` - Maximum detail

### View Options
- `'side'` - Side view (default for characters)
- `'low top-down'` - Slight overhead angle
- `'high top-down'` - Direct overhead (good for terrain)

### Direction Options
- `'north'`, `'north-east'`, `'east'`, `'south-east'`
- `'south'`, `'south-west'`, `'west'`, `'north-west'`

## Error Handling

The service includes comprehensive error handling:

```javascript
try {
  const result = await apiService.generateImage(params);
} catch (error) {
  // Get user-friendly error message
  const message = apiService.handleAPIError(error);
  
  // Handle specific error types
  if (error.status === 401) {
    // Invalid token - prompt for re-entry
  } else if (error.status === 402) {
    // Insufficient credits - show purchase link
  } else if (error.status === 422) {
    // Validation error - check parameters
  } else if (error.status === 429 || error.status === 529) {
    // Rate limited - wait and retry
  }
}
```

## Retry Logic

The service automatically retries failed requests up to 3 times with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 second delay
- Max delay: 10 seconds

Network errors and server errors (5xx) trigger retries. Client errors (4xx) do not retry.

## Best Practices

1. **Store the token securely** - Use StorageService to save/load the token
2. **Check balance before generation** - Avoid failed requests due to insufficient credits
3. **Use appropriate image sizes** - Larger sizes cost more credits
4. **Handle errors gracefully** - Always wrap API calls in try-catch
5. **Show loading indicators** - API calls can take 3-10 seconds
6. **Cache generated assets** - Store in asset library to avoid regenerating
7. **Use seeds for consistency** - Same seed + params = same result

## Integration with Storage

```javascript
import StorageService from './services/StorageService.js';
import PixellabAPIService from './services/PixellabAPIService.js';

const storage = new StorageService();
const token = storage.getAPIToken();

if (!token) {
  // Prompt user for token
  const userToken = prompt('Enter your Pixellab API token:');
  storage.saveAPIToken(userToken);
}

const apiService = new PixellabAPIService(token);
```

## Common Issues

### "Invalid API token"
- Check token at https://pixellab.ai/account
- Ensure no extra spaces or characters
- Token should start with your account prefix

### "Insufficient credits"
- Purchase more credits at https://pixellab.ai/account
- Check balance with `getBalance()`

### "Validation error"
- Check image size is within limits (16-400px)
- Ensure description is not empty
- Verify all enum values match API spec

### "Too many requests"
- Wait before retrying
- Implement request queuing
- Check rate limits in API docs

## Support

- Discord: https://discord.gg/pBeyTBF8T7
- Email: support@pixellab.ai
- Python Client: https://github.com/pixellab-code/pixellab-python
