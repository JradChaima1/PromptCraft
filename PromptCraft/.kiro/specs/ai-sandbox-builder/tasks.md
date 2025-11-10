# Implementation Plan

- [x] 1. Set up project structure and core services





  - Create directory structure for services, managers, controllers, and UI components
  - Set up environment configuration for API URL and game constants
  - _Requirements: 1.1, 6.1_


- [x] 1.1 Create Pixellab API Service

  - Implement PixellabAPIService class with constructor accepting API token
  - Add methods for setApiToken, validateToken, and getBalance with proper error handling
  - Implement generateImage method with all required parameters (description, imageSize, textGuidanceScale, outline, shading, detail, view, direction, isometric, noBackground, seed)
  - Implement generateAnimation method for animated asset support
  - Add handleAPIError method to format error responses for user display
  - Implement retry logic for network failures with exponential backoff (max 3 attempts)
  - Add base64 to Blob URL conversion utility for Phaser texture loading
  - _Requirements: 1.2, 1.3, 6.3, 13.2_


- [x] 1.2 Create Storage Service

  - Implement StorageService class with methods for all storage operations
  - Add saveAPIToken, getAPIToken, and clearAPIToken methods
  - Implement saveAssetLibrary and loadAssetLibrary with JSON serialization
  - Add saveWorldState and loadWorldState methods
  - Implement saveSettings and loadSettings for user preferences
  - Add storage quota checking before save operations
  - Implement error handling for corrupted storage data
  - _Requirements: 2.2, 5.2, 6.2, 13.6_

- [x] 1.3 Create utility helper functions

  - Implement UUID generation function for asset and instance IDs
  - Add base64 image validation utility
  - Create debounce function for world state saves
  - Add image dimension calculation utilities
  - _Requirements: 2.1, 5.1_

- [x] 2. Implement Asset Manager and generation system





  - Create AssetManager class to handle asset library and generation
  - Integrate with PixellabAPIService and StorageService
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_


- [x] 2.1 Implement asset library management

  - Create getAssets method to retrieve all assets from storage
  - Implement addAsset method to add new assets to library and persist to storage
  - Add removeAsset method with storage cleanup
  - Implement getAsset method for single asset retrieval by ID
  - Create asset metadata structure with all required fields (id, name, description, category, imageData, frames, generationParams, createdAt, usageCredits)
  - _Requirements: 2.1, 2.2, 2.3, 2.5_


- [x] 2.2 Implement asset generation functionality

  - Create generateAsset method that calls PixellabAPIService.generateImage
  - Add loading state management during generation
  - Implement success handling to add generated asset to library
  - Add error handling for all API error scenarios (401, 402, 422, 429, 529)
  - Implement generateAnimatedAsset method for animation support
  - _Requirements: 1.2, 1.3, 1.4, 8.1, 8.2, 13.1, 13.2, 13.3, 13.4_


- [x] 2.3 Implement texture loading for Phaser

  - Create loadAssetTexture method to convert base64/Blob to Phaser texture
  - Add texture caching to prevent duplicate loads
  - Implement createAnimationFromFrames for animated assets
  - Add error handling for texture loading failures
  - _Requirements: 1.3, 8.3_


- [x] 2.4 Implement asset category system

  - Define asset categories enum (character, object, terrain, decoration, building)
  - Create getCategoryDefaults method to return appropriate parameters for each category
  - Implement category-specific parameter presets (view angles, image sizes, style settings)
  - Add category selection to generation parameters
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3. Create UI Manager and interface components





  - Build UI system for asset generation, library, and controls
  - Implement modal dialogs and toolbars
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3.1 Create main toolbar UI


  - Implement createMainToolbar method with buttons for Generate, Library, Settings, Help
  - Add credits display showing remaining credits and generations
  - Implement toolbar button click handlers
  - Style toolbar with pixel art aesthetic
  - Position toolbar at top of screen with fixed positioning
  - _Requirements: 9.1, 6.4_


- [x] 3.2 Create asset generation modal

  - Implement showGenerationModal with text input for asset description
  - Add category selection dropdown
  - Create parameter controls for textGuidanceScale (slider 1-20, default 8)
  - Add dropdowns for outline (thin, medium, thick, none), shading (soft, hard, flat, none), detail (low, medium, high)
  - Implement image size inputs with validation (min 16, max 400)
  - Add view and direction dropdowns
  - Create isometric and noBackground checkboxes
  - Add seed input field (optional)
  - Implement Generate button with loading state
  - Add Cancel button to close modal
  - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4, 7.5, 12.1, 12.2, 12.3, 12.4, 12.5_


- [x] 3.3 Create asset library modal

  - Implement showLibraryModal with scrollable grid layout
  - Display asset thumbnails with name and category labels
  - Add click handler to select asset for placement
  - Implement delete button for each asset with confirmation
  - Add search/filter functionality by category
  - Show empty state message when library is empty
  - _Requirements: 2.3, 2.4, 2.5_



- [x] 3.4 Create settings modal





  - Implement showSettingsModal with API token input field
  - Add Save and Cancel buttons
  - Create keyboard shortcuts reference panel
  - Add world size configuration options
  - Implement Clear World button with confirmation dialog


  - _Requirements: 6.1, 9.3_

- [x] 3.5 Implement error and loading modals





  - Create showErrorModal method with message parameter and error icon
  - Implement showLoadingModal with spinner animation and message


  - Add hideAllModals method to close all open modals
  - Implement modal backdrop with click-to-close functionality
  - _Requirements: 1.4, 1.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 3.6 Create HUD elements





  - Implement updateCreditsDisplay to show current credits and generations
  - Add updateAssetCountDisplay showing placed assets count and limit
  - Create tooltip system with showTooltip and hideTooltip methods
  - Position HUD elements in corners without blocking gameplay
  - _Requirements: 6.4, 9.4, 15.4_

- [x] 4. Implement World Manager and placement system













  - Create world management system for placed assets
  - Implement placement mode and transformations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_


- [x] 4.1 Create WorldManager class structure





  - Implement constructor accepting scene and storageService
  - Initialize placedAssets array and selectedAsset reference
  - Create placed asset data structure (instanceId, assetId, position, rotation, scale, collisionEnabled, zIndex)
  - Set up sprite group for managing placed asset sprites
  - _Requirements: 3.1, 3.4_


- [x] 4.2 Implement asset placement functionality




  - Create addPlacedAsset method to instantiate sprite at position
  - Implement placement preview that follows mouse cursor
  - Add click handler to place asset at cursor position
  - Generate unique instanceId for each placed asset
  - Add placed asset to sprite group and placedAssets array
  - Implement exitPlacementMode to clear preview and reset state
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


- [x] 4.3 Implement asset transformation controls




  - Create selectAsset method to highlight selected asset
  - Implement moveAsset method with drag functionality
  - Add rotateAsset method with rotation handle or keyboard control
  - Implement scaleAsset method with scale handles
  - Create transformation handles UI (move, rotate, scale indicators)
  - Add deselectAsset method to clear selection and hide handles

  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4.4 Implement asset deletion




  - Add removePlacedAsset method to destroy sprite and remove from array
  - Implement delete key handler for selected asset
  - Add confirmation dialog for deletion

  - Update world state after deletion
  - _Requirements: 4.5_

- [x] 4.5 Implement physics and collision system




  - Create setCollisionEnabled method to toggle physics body
  - Implement updatePhysicsBody to refresh collision after transformations
  - Add collision detection between player and placed assets

  - Create physics body matching sprite dimensions
  - Add collision toggle UI in transformation controls
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 4.6 Implement world state persistence




  - Create saveWorld method to serialize placedAssets to JSON
  - Implement debounced auto-save (max once per 2 seconds)
  - Add loadWorld method to deserialize and recreate placed assets
  - Implement clearWorld method to remove all placed assets
  - Add world state versioning for future migrations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

-

- [x] 5. Implement Input Controller and camera system



  - Create input handling for player, camera, and asset interactions
  - Implement camera controls and navigation
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 5.1 Create InputController class







  - Implement constructor with scene reference
  - Set up keyboard input listeners (arrow keys, WASD, shortcuts)
  - Add mouse input listeners (click, drag, wheel, middle-click)
  - Create keyboard shortcuts map
  - _Requirements: 9.3, 10.1_




- [x] 5.2 Implement player movement controls





  - Create handlePlayerMovement method for arrow keys and WASD
  - Set player velocity to 200 pixels/second for horizontal movement
  - Implement jump with spacebar (velocity -400 when on ground)
  - Update player animation based on movement direction
  - _Requirements: 10.1_



- [x] 5.3 Implement camera controls








  - Create handleCameraZoom method for mouse wheel input
  - Set zoom limits (min 0.5, max 2.0)
  - Implement handleCameraPan for middle-click drag
  - Add centerCameraOnPlayer method for double-click on player
  - Implement smooth camera following with lerp factor 0.1
  - _Requirements: 10.2, 10.3, 10.4, 10.5_
-

- [x] 5.4 Implement asset interaction input




  - Create handleAssetClick to select assets on click
  - Implement handleAssetDrag for moving selected assets
  - Add handleAssetRelease to finalize position changes
  - Implement click detection with proper world coordinate conversion
  - _Requirements: 4.1, 4.2_

- [x] 5.5 Implement placement mode input








  - Create handlePlacementPreview to update preview position
  - Implement handlePlacementClick to place asset at cursor
  - Add right-click or ESC to cancel placement mode
  - Update cursor style during placement mode
  - _Requirements: 3.1, 3.2_






- [x] 5.6 Register keyboard shortcuts

  - Implement registerShortcuts method to bind all shortcuts
  - Add G key to open asset generator modal
  - Add L key to open asset library modal


  - Add ESC key to close modals and deselect assets
  - Add Delete key to remove selected asset
  - Add Ctrl+S to manually save world
  - Add Ctrl+E to export world
  - _Requirements: 9.3_



- [x] 6. Implement world export and import functionality



  - Create export/import system for world sharing
  - Implement file download and upload
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_





- [x] 6.1 Implement world export



  - Create exportWorld method in WorldManager
  - Serialize complete world state including all placed assets
  - Include asset image data in export for portability
  - Add world metadata (name, created date, version)
  - Implement exportToFile method in StorageService to trigger download
  - Generate filename with timestamp (e.g., "world_2025-01-15.json")

  - _Requirements: 14.1, 14.2_


- [x] 6.2 Implement world import





  - Create importWorld method in WorldManager
  - Add importFromFile method in StorageService with file picker
  - Validate imported JSON structure and version
  - Deserialize world data and recreate all placed assets
  - Load asset textures from embedded image data
  - Handle import errors gracefully with error messages
  - _Requirements: 14.3, 14.4, 14.5_

- [x] 6.3 Add export/import UI






  - Add Export World button to settings modal
  - Add Import World button to settings modal
  - Implement file picker dialog for import
  - Show success/error messages after export/import
  - Add confirmation dialog before importing (warns about overwriting current world)
  - _Requirements: 14.3, 14.4, 14.5_
-

- [x] 7. Implement animated asset support






  - Add animation generation and playback
  - Integrate with Pixellab animation API
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_


- [x] 7.1 Extend asset generation for animations


  - Add animation toggle checkbox to generation modal
  - Implement animation-specific parameters (actionDescription, nFrames)
  - Call generateAnimatedAsset method when animation is enabled
  - Handle multi-frame response from API
  - Store frame data in asset metadata
  - _Requirements: 8.1, 8.2_

- [x] 7.2 Implement animation playback



  - Create Phaser animation from frame array in createAnimationFromFrames
  - Set default frame rate to 8 FPS with configurable option
  - Implement looping animation playback
  - Add animation to placed asset sprites
  - Store animation configuration in placed asset data
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 7.3 Add animation controls to UI


  - Display animation indicator on animated assets in library
  - Add frame rate control slider to generation modal
  - Implement play/pause toggle for placed animated assets (optional enhancement)
  - Show frame count in asset metadata display
  - _Requirements: 8.1, 8.5_

- [x] 8. Implement performance optimizations





  - Add optimizations for large worlds with many assets
  - Implement culling and pooling systems
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_


- [x] 8.1 Implement sprite pooling


















  - Create sprite pool for frequently placed/removed assets
  - Implement getFromPool and returnToPool methods
  - Reuse sprite objects instead of destroying and creating
  - Set initial pool size based on common asset types
  - _Requirements: 15.1_

-


- [x] 8.2 Implement off-screen culling







  - Add culling system to hide sprites outside camera bounds
  - Calculate camera view bounds on each frame
  - Set sprite visibility based on position relative to camera
  - Update culling on camera movement
  - _Requirements: 15.2_

- [x] 8.3 Implement asset count limits


  - Add MAX_ASSETS constant (500) to configuration
  - Check asset count before allowing placement
  - Display warning message when count exceeds 400
  - Show current count in HUD
  - Prevent placement when limit is reached
  - _Requirements: 15.3, 15.4_

- [x] 8.4 Optimize storage operations


  - Implement debounced world state saves (max once per 2 seconds)
  - Add storage quota checking before saves
  - Compress large base64 strings if storage quota is low
  - Implement lazy loading for asset library thumbnails
  - _Requirements: 15.5_

- [ ]* 8.5 Add performance monitoring
  - Implement FPS counter display (optional, for debugging)
  - Add memory usage tracking
  - Log performance metrics to console
  - Create performance profiling utilities
  - _Requirements: 15.5_
-

- [x] 9. Integrate all systems and create game scenes



  - Wire together all managers and services
  - Create scene structure and flow
  - _Requirements: All requirements_

- [x] 9.1 Create BootScene for initialization


  - Implement BootScene class extending Phaser.Scene
  - Add API token validation on startup
  - Load saved settings from StorageService
  - Initialize PixellabAPIService with stored token
  - Transition to MainMenuScene after initialization
  - Handle missing token by prompting user input
  - _Requirements: 6.1, 6.2_

- [x] 9.2 Enhance GameScene with all systems


  - Integrate AssetManager into existing GameScene
  - Add WorldManager to GameScene
  - Initialize InputController in GameScene
  - Load saved world state on scene start
  - Set up auto-save on world modifications
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4_

- [x] 9.3 Create UIScene as overlay


  - Implement UIScene class extending Phaser.Scene
  - Initialize UIManager in UIScene
  - Create all toolbars and modals
  - Set scene to run parallel with GameScene
  - Handle communication between GameScene and UIScene via events
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9.4 Wire up event system between scenes


  - Implement event emitter for cross-scene communication
  - Create events for asset generation, placement, selection
  - Add events for UI interactions (button clicks, modal opens)
  - Implement event listeners in appropriate scenes
  - _Requirements: All UI and interaction requirements_

- [x] 9.5 Update main.js with scene configuration


  - Add BootScene to scene array
  - Add UIScene to scene array
  - Configure scene order (Boot → MainMenu → Game + UI)
  - Set up scene transitions
  - _Requirements: All requirements_

-

- [x] 10. Final integration and polish





  - Complete end-to-end testing
  - Fix bugs and refine user experience
  - _Requirements: All requirements_

- [x] 10.1 Implement error handling throughout application


  - Add try-catch blocks to all async operations
  - Implement error logging to console
  - Display user-friendly error messages
  - Add error recovery mechanisms
  - Test all error scenarios (API errors, storage errors, validation errors)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 10.2 Add loading states and feedback


  - Implement loading indicators for all async operations
  - Add progress feedback for asset generation
  - Show success messages for completed actions
  - Implement toast notifications for quick feedback
  - _Requirements: 1.5, 9.4_

- [x] 10.3 Implement help and tutorial system


  - Create help modal with keyboard shortcuts reference
  - Add tooltips to all UI elements
  - Implement first-time user tutorial (optional)
  - Create documentation for asset generation tips
  - _Requirements: 9.3, 9.4_

- [x] 10.4 Polish UI and visual design


  - Ensure consistent pixel art style across all UI elements
  - Add hover effects to all interactive elements
  - Implement smooth transitions and animations
  - Test UI responsiveness on different screen sizes
  - Adjust colors and contrast for readability
  - _Requirements: 9.5_

- [x] 10.5 Optimize and test performance





  - Profile application with 300+ placed assets
  - Verify frame rate meets 30 FPS minimum target
  - Test memory usage and optimize if needed
  - Verify storage operations complete within 100ms
  - Test on different browsers (Chrome, Firefox, Safari, Edge)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ]* 10.6 Create comprehensive documentation
  - Write README with setup instructions
  - Document API service usage
  - Create developer guide for extending the game
  - Add inline code comments
  - Document all public methods and classes
  - _Requirements: All requirements_

- [ ]* 10.7 Write unit tests for core systems
  - Create tests for PixellabAPIService (token validation, image generation, error handling)
  - Write tests for StorageService (save/load operations, quota handling)
  - Add tests for AssetManager (library CRUD, texture loading)
  - Create tests for WorldManager (placement, transformations, serialization)
  - Implement test utilities and mocks
  - _Requirements: All requirements_

- [ ]* 10.8 Perform integration testing
  - Test complete asset generation flow
  - Test asset placement and transformation flow
  - Test world persistence across page reloads
  - Test export and import functionality
  - Test error recovery scenarios
  - _Requirements: All requirements_
