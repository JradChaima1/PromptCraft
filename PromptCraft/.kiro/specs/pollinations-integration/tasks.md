# Implementation Plan

- [x] 1. Create PollinationsAPIService





  - Implement new service class to replace PixellabAPIService
  - Build URL construction for Pollinations API
  - Implement image fetching and conversion
  - Add model management
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_


- [x] 1.1 Create PollinationsAPIService class structure

  - Create new file `src/services/PollinationsAPIService.js`
  - Define class with constructor (no parameters needed)
  - Add base URL constant: `https://image.pollinations.ai/prompt/`
  - Define available models array with descriptions
  - Add default model constant: "turbo"
  - _Requirements: 1.1, 3.1_


- [x] 1.2 Implement URL construction method

  - Create `buildPollinationsURL(params)` method
  - Encode description for URL safety using `encodeURIComponent`
  - Construct URL with description, width, height parameters
  - Add optional seed parameter if provided
  - Add model parameter (default to "turbo")
  - Add nologo=true parameter
  - Return complete URL string
  - _Requirements: 1.2, 1.3, 2.1, 2.2, 4.1, 4.4_

- [x] 1.3 Implement image fetching with retry logic

  - Create `fetchImageFromURL(url)` method
  - Use Fetch API to retrieve image from URL
  - Implement retry logic with exponential backoff (1s, 2s, 4s delays)
  - Set maximum 3 retry attempts
  - Add 30-second timeout per attempt
  - Convert response to Blob
  - Convert Blob to base64 string using FileReader
  - Handle network errors and timeouts
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.1, 11.2_


- [x] 1.4 Implement model management methods

  - Create `getAvailableModels()` method returning array of model objects
  - Define models: turbo, flux, flux-realism, flux-anime, flux-3d
  - Add descriptions for each model
  - Create `getDefaultModel()` method returning "turbo"
  - Add model validation in URL construction
  - _Requirements: 3.1, 3.2, 3.3, 3.4_



- [x] 1.5 Implement generateImage method





  - Create `generateImage(params)` method
  - Validate required parameters (description, imageSize)
  - Validate image size range (16-1024 pixels)
  - Call `buildPollinationsURL` with params
  - Call `fetchImageFromURL` with constructed URL
  - Return object with imageData and metadata (model, seed, generationURL)

  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.5_


- [x] 1.6 Implement error handling





  - Create `handleAPIError(error)` method
  - Handle rate limiting errors (429) with appropriate message
  - Handle network errors with retry suggestion
  - Handle timeout errors
  - Handle invalid parameter errors
  - Return user-friendly error messages
  - Log errors to console for debugging
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Update AssetManager to use PollinationsAPIService





  - Replace PixellabAPIService with PollinationsAPIService
  - Update generateAsset method for Pollinations parameters
  - Remove animation support
  - Update asset metadata structure
  - _Requirements: 1.1, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 8.3_


- [x] 2.1 Update AssetManager constructor

  - Change constructor to accept PollinationsAPIService instance
  - Update apiService property assignment
  - Keep all other initialization unchanged
  - _Requirements: 1.1_


- [x] 2.2 Update generateAsset method

  - Remove animation-related code and checks
  - Update API call to use Pollinations parameters (description, imageSize, model, seed)
  - Remove Pixellab-specific parameters (outline, shading, detail, view, direction, textGuidanceScale)
  - Update asset metadata to include model and seed
  - Set usageCredits to 0
  - Set frames to empty array
  - Keep asset library addition logic unchanged
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 6.1, 6.2, 6.3, 6.4_


- [x] 2.3 Remove animation methods

  - Remove `generateAnimatedAsset` method
  - Remove animation-related helper methods
  - Remove animation frame handling code
  - _Requirements: 8.1, 8.2, 8.3, 8.4_


- [x] 2.4 Update asset metadata structure

  - Update generationParams to include only: description, imageSize, model, seed
  - Remove Pixellab-specific fields from metadata
  - Ensure backward compatibility (old assets still load correctly)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 12.1, 12.2_

- [x] 3. Update UIManager for simplified generation interface





  - Simplify generation modal
  - Add model selector
  - Add seed input
  - Remove Pixellab-specific UI elements
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 9.1, 9.2, 9.3, 9.4_


- [x] 3.1 Update generation modal UI

  - Remove API token status display
  - Remove credit/balance display
  - Remove Pixellab parameter controls (outline, shading, detail, view, direction, textGuidanceScale)
  - Remove animation toggle checkbox
  - Remove animation-specific parameters (action, nFrames)
  - Keep description input field
  - Keep image size inputs
  - Keep category selector
  - _Requirements: 4.1, 4.2, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3_


- [x] 3.2 Add model selector to generation modal

  - Create dropdown for model selection
  - Populate with models from PollinationsAPIService.getAvailableModels()
  - Set default to "turbo"
  - Add tooltips with model descriptions
  - Save selected model to generation parameters
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 9.4_


- [x] 3.3 Add seed input to generation modal

  - Create optional number input field for seed
  - Add tooltip explaining seed reproducibility
  - Allow empty value (null seed)
  - Validate numeric input
  - Display seed value in asset library for generated assets
  - _Requirements: 4.4, 10.1, 10.2, 10.3, 10.4, 10.5_


- [x] 3.4 Remove credit display from HUD

  - Remove `updateCreditsDisplay` method
  - Remove credit/generation counter UI elements
  - Remove balance checking code
  - _Requirements: 5.1, 5.2, 5.3, 9.2_


- [x] 3.5 Update help documentation

  - Update generation modal help text to reference Pollinations
  - Remove Pixellab-specific documentation
  - Add model descriptions and recommendations
  - Add seed usage examples
  - Document that animations are not currently supported
  - _Requirements: 8.5, 9.5_

- [x] 4. Update StorageService to remove API token handling





  - Remove API token storage methods
  - Clean up storage keys
  - _Requirements: 5.1, 5.2, 5.3, 5.4_



- [x] 4.1 Remove API token methods





  - Remove `saveAPIToken` method
  - Remove `getAPIToken` method
  - Remove `clearAPIToken` method


  - _Requirements: 5.1, 5.2, 5.3_

- [x] 4.2 Remove API token storage key





  - Remove `pixellab_api_token` from storage keys
  - Keep all other storage keys (asset_library, world_state, game_settings)
  - _Requirements: 5.4_
-

- [x] 5. Update settings modal




  - Remove API token configuration
  - Update settings UI
  - _Requirements: 5.1, 5.2, 5.3, 9.2, 9.3_



- [x] 5.1 Remove API token section from settings




  - Remove API token input field
  - Remove token validation UI
  - Remove token save/clear buttons
  - _Requirements: 5.1, 5.2, 5.3, 9.2_


- [x] 5.2 Update settings modal layout

  - Reorganize remaining settings
  - Ensure clean, simple layout
  - Update help text
  - _Requirements: 9.3_

- [x] 6. Update BootScene initialization




  - Remove API token validation
  - Initialize PollinationsAPIService
  - Update scene flow
  - _Requirements: 5.1, 5.2, 5.5_


- [x] 6.1 Remove API token validation from BootScene






  - Remove token prompt on startup
  - Remove token validation check
  - Remove authentication error handling
  - _Requirements: 5.1, 5.2, 5.5_



- [x] 6.2 Initialize PollinationsAPIService in BootScene




  - Create PollinationsAPIService instance (no parameters needed)
  - Pass service to AssetManager
  - Remove PixellabAPIService initialization
  - _Requirements: 1.1, 5.5_


- [x] 6.3 Update scene transition logic





  - Remove authentication-required checks
  - Allow direct transition to game
  - _Requirements: 5.5_
-

- [x] 7. Clean up and remove unused code




  - Remove PixellabAPIService file
  - Remove unused utility functions
  - Remove dead code
  - Update comments
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_






- [x] 7.1 Remove PixellabAPIService file



  - Delete `src/services/PixellabAPIService.js`
  - Delete `src/services/API_USAGE.md` (Pixellab-specific)
  - _Requirements: 13.1, 13.2_



- [ ] 7.2 Remove unused utility functions
  - Remove Pixellab-specific helper functions
  - Remove authentication utilities


  - Remove credit calculation functions
  - _Requirements: 13.2, 13.5_

- [x] 7.3 Update code comments and documentation


  - Update comments to reference Pollinations instead of Pixellab
  - Remove outdated documentation
  - Add Pollinations-specific comments
  - _Requirements: 13.4_

- [x] 7.4 Remove dead code





  - Remove unused imports
  - Remove commented-out Pixellab code
  - Remove authentication error handling (401, 402)
  - Clean up unused variables
  - _Requirements: 13.5_
- [x] 8. Test and validate implementation




- [ ] 8. Test and validate implementation

  - Test Pollinations generation
  - Test backward compatibility
  - Test error handling
  - Validate UI changes
  - _Requirements: All requirements_

-

- [x] 8.1 Test basic generation functionality




  - Generate images with default settings
  - Test each model (turbo, flux, flux-realism, flux-anime, flux-3d)
  - Verify images load correctly
  - Verify asset metadata is correct
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3_


- [x] 8.2 Test seed reproducibility





  - Generate image with specific seed
  - Generate again with same seed and parameters
  - Verify results are identical
  - Test with null seed (random generation)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

-

- [ ] 8.3 Test error handling



  - Simulate network failure (disconnect internet)
  - Verify retry logic works
  - Verify timeout handling (wait 30+ seconds)
  - Verify error messages are user-friendly
  - Test with invalid parameters
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


-



- [ ] 8.4 Test backward compatibility
  - Load existing world with Pixellab-generated assets
  - Verify old assets display correctly
  - Verify no errors or crashes
  - Test export/import with mixed assets


  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_


- [ ] 8.5 Test UI changes
  - Verify generation modal shows correct parameters
  - Verify model selector works
  - Verify seed input works
  - Verify no credit displays appear
  - Verify no API token prompts appear


  - Verify help documentation is updated

  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_



- [ ] 8.6 Test performance
  - Verify generation completes within reasonable time (5-15 seconds typical)
  - Verify timeout works (30 seconds max)
  - Verify UI remains responsive during generation
  - Test with various image sizes
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 9. Write unit tests
  - Create tests for PollinationsAPIService
  - Update tests for AssetManager
  - Test URL construction
  - Test error handling
  - _Requirements: All requirements_

- [ ]* 9.1 Create PollinationsAPIService tests
  - Test URL construction with various parameters
  - Test URL encoding of special characters
  - Test model validation
  - Test seed handling
  - Test image fetching (mock fetch API)
  - Test retry logic
  - Test timeout handling
  - Test error message formatting
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 9.2 Update AssetManager tests
  - Test generation with Pollinations service
  - Test asset metadata structure
  - Test removal of animation support
  - Test backward compatibility
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 12.1, 12.2_
