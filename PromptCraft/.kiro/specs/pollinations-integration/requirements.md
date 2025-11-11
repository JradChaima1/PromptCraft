# Requirements Document

## Introduction

This document specifies the requirements for replacing Pixellab API with Pollinations.ai as the AI image generation provider in the AI-Powered 2D Sandbox Building Game. Pollinations.ai offers a free, open-source solution for generating images through simple URL-based requests, eliminating API costs and authentication requirements while maintaining the core asset generation functionality.

## Glossary

- **Pollinations.ai**: A free, open-source AI image generation service accessible via URL-based API
- **URL-based API**: An API that generates images by constructing URLs with parameters rather than POST requests
- **Model**: The AI model used for generation (turbo, flux, flux-realism, flux-anime, flux-3d)
- **Seed**: A number used to reproduce the same generation result
- **Asset Generation**: The process of creating pixel art images from text descriptions
- **PollinationsAPIService**: The service class that handles all Pollinations.ai interactions

## Requirements

### Requirement 1: Pollinations.ai Service Implementation

**User Story:** As a player, I want to use Pollinations.ai to generate images for free, so that I can create assets without API costs or authentication.

#### Acceptance Criteria

1. THE System SHALL implement a PollinationsAPIService class to replace PixellabAPIService
2. WHEN generating an image, THE System SHALL construct a Pollinations URL with the prompt and parameters
3. THE System SHALL support Pollinations parameters including width, height, seed, model, and nologo
4. WHEN the Pollinations URL is accessed, THE System SHALL fetch the generated image and convert it to base64 format
5. THE System SHALL handle Pollinations-specific errors including rate limiting and service unavailability

### Requirement 2: URL Construction and Image Fetching

**User Story:** As a player, I want images to be generated reliably, so that I can create assets consistently.

#### Acceptance Criteria

1. WHEN a generation is requested, THE System SHALL construct a valid Pollinations URL with encoded parameters
2. THE System SHALL fetch the image from the constructed URL using the Fetch API
3. THE System SHALL convert the fetched image to base64 format for storage consistency
4. THE System SHALL implement retry logic for failed image fetches (max 3 attempts with exponential backoff)
5. THE System SHALL handle CORS and network errors gracefully

### Requirement 3: Model Selection

**User Story:** As a player, I want to choose from different AI models, so that I can get different artistic styles and quality levels.

#### Acceptance Criteria

1. THE System SHALL support the following Pollinations models: turbo, flux, flux-realism, flux-anime, flux-3d
2. WHEN the player opens the asset generator, THE System SHALL display a model selector dropdown
3. THE System SHALL set "turbo" as the default model for fast generation
4. WHEN a model is selected, THE System SHALL include the model parameter in the generation URL
5. THE System SHALL save the selected model preference for future sessions

### Requirement 4: Simplified Generation Parameters

**User Story:** As a player, I want a simpler generation interface, so that I can create assets quickly without complex settings.

#### Acceptance Criteria

1. THE System SHALL remove Pixellab-specific parameters (outline, shading, detail, view, direction, textGuidanceScale)
2. THE System SHALL provide controls for description, image size, model, and seed
3. THE System SHALL set nologo parameter to true by default
4. THE System SHALL allow optional seed input for reproducible generations
5. THE System SHALL validate image size parameters (minimum 16px, maximum 1024px)

### Requirement 5: Remove Authentication Requirements

**User Story:** As a player, I want to start generating assets immediately, so that I don't need to configure API tokens.

#### Acceptance Criteria

1. THE System SHALL remove API token input from settings
2. THE System SHALL remove token validation logic
3. THE System SHALL remove credit/balance checking functionality
4. THE System SHALL remove authentication-related error handling (401, 402 errors)
5. THE System SHALL start generating assets without any authentication setup

### Requirement 6: Update Asset Metadata

**User Story:** As a developer, I want asset metadata to reflect the new generation service, so that the system remains maintainable.

#### Acceptance Criteria

1. WHEN an asset is generated, THE System SHALL store the model name in asset metadata
2. THE System SHALL store the seed value (if provided) in asset metadata
3. THE System SHALL remove Pixellab-specific metadata (credits used, generations used)
4. THE System SHALL set usageCredits to 0 for all generated assets
5. THE System SHALL maintain backward compatibility with existing Pixellab-generated assets

### Requirement 7: Error Handling for Pollinations

**User Story:** As a player, I want clear feedback when generation fails, so that I understand what went wrong and can retry.

#### Acceptance Criteria

1. IF the Pollinations service is unavailable, THEN THE System SHALL display "Image generation service is temporarily unavailable. Please try again."
2. IF a rate limit is encountered, THEN THE System SHALL display "Too many requests. Please wait a moment and try again."
3. IF a network error occurs, THEN THE System SHALL display "Network error. Check your connection and try again." with a retry option
4. IF image fetching times out (>30 seconds), THEN THE System SHALL display "Generation timed out. Please try again."
5. THE System SHALL log all errors to console for debugging

### Requirement 8: Remove Animation Support

**User Story:** As a player, I want to understand that animations are not currently supported, so that I have appropriate expectations.

#### Acceptance Criteria

1. THE System SHALL remove animation generation functionality
2. THE System SHALL remove the animation toggle from the generation modal
3. THE System SHALL remove animation-related parameters (action, nFrames, etc.)
4. THE System SHALL remove animation playback code
5. THE System SHALL display a message in help documentation that animations are not currently supported

### Requirement 9: Update UI for Pollinations

**User Story:** As a player, I want a clean, simple generation interface, so that I can focus on creating assets.

#### Acceptance Criteria

1. THE System SHALL update the generation modal to show only relevant parameters (description, size, model, seed)
2. THE System SHALL remove credit display from the HUD
3. THE System SHALL remove API token settings from the settings modal
4. THE System SHALL add model descriptions as tooltips in the model selector
5. THE System SHALL update help documentation to reference Pollinations instead of Pixellab

### Requirement 10: Seed Reproducibility

**User Story:** As a player, I want to use seeds to reproduce the same image, so that I can iterate on designs consistently.

#### Acceptance Criteria

1. THE System SHALL provide an optional seed input field in the generation modal
2. WHEN a seed is provided, THE System SHALL include it in the Pollinations URL
3. WHEN the same seed and parameters are used, THE System SHALL generate the same image
4. THE System SHALL display the seed value in the asset library for each asset
5. THE System SHALL allow copying seed values from existing assets for reuse

### Requirement 11: Performance and Caching

**User Story:** As a player, I want images to load quickly, so that I can iterate on designs efficiently.

#### Acceptance Criteria

1. THE System SHALL implement a 30-second timeout for image fetching
2. THE System SHALL cache fetched images to avoid redundant requests
3. THE System SHALL display loading indicators during image generation
4. THE System SHALL handle slow generation times gracefully (Pollinations can take 5-15 seconds)
5. THE System SHALL maintain responsive UI during generation

### Requirement 12: Migration from Pixellab

**User Story:** As an existing player, I want my existing assets to continue working, so that I don't lose my previous work.

#### Acceptance Criteria

1. THE System SHALL maintain backward compatibility with existing Pixellab-generated assets
2. WHEN loading existing assets, THE System SHALL display them correctly regardless of generation source
3. THE System SHALL preserve all existing asset library functionality
4. THE System SHALL maintain existing world save/load functionality
5. THE System SHALL not require re-generation of existing assets

### Requirement 13: Remove Unused Code

**User Story:** As a developer, I want clean, maintainable code, so that the system is easy to understand and modify.

#### Acceptance Criteria

1. THE System SHALL remove PixellabAPIService class file
2. THE System SHALL remove Pixellab-specific utility functions
3. THE System SHALL remove unused API documentation files
4. THE System SHALL update code comments to reference Pollinations
5. THE System SHALL remove dead code related to credits, tokens, and authentication
