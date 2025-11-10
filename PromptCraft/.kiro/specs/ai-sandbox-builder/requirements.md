# Requirements Document

## Introduction

This document specifies the requirements for an AI-Powered 2D Sandbox Building Game. The game enables players to create and manipulate game worlds using AI-generated pixel art assets from the Pixelab API. Players can generate custom objects, characters, terrain, and decorations through text prompts, then place, transform, and interact with these assets in a creative sandbox environment built with Phaser 3.

## Glossary

- **Sandbox Game**: A game environment where players have creative freedom to build and modify the game world without strict objectives
- **Pixellab API**: An external REST API service that generates pixel art images and animations from text descriptions
- **Asset**: A visual game element (sprite, tile, decoration, character) that can be placed in the game world
- **Game World**: The 2D playable area where players can place and interact with assets
- **Player Character**: The controllable avatar that navigates the game world
- **Asset Library**: A collection of generated and saved assets available for placement
- **Placement Mode**: A game state where players can position assets in the world
- **Transform Operations**: Actions to modify asset properties (position, rotation, scale)
- **Generation Job**: An asynchronous API request to create pixel art assets
- **Base64 Image**: An image encoded as a text string for API transmission
- **Phaser Scene**: A container for game logic and visual elements in the Phaser framework
- **Static Physics Body**: A non-moving collidable object in the physics simulation
- **Sprite**: A 2D image or animation displayed in the game world

## Requirements

### Requirement 1: Asset Generation System

**User Story:** As a player, I want to generate custom pixel art assets by entering text descriptions, so that I can create unique objects for my game world.

#### Acceptance Criteria

1. WHEN the player opens the asset generator interface, THE Game System SHALL display a text input field for asset descriptions
2. WHEN the player submits an asset generation request with a valid description, THE Game System SHALL send a POST request to the Pixellab API create-image-pixflux endpoint with the description and image size parameters
3. WHEN the Pixellab API returns a successful response, THE Game System SHALL decode the base64 image data and create a Phaser texture from the generated asset
4. IF the Pixellab API returns an error response, THEN THE Game System SHALL display an error message to the player indicating the failure reason
5. WHILE an asset generation request is pending, THE Game System SHALL display a loading indicator to the player

### Requirement 2: Asset Library Management

**User Story:** As a player, I want to save and organize my generated assets in a library, so that I can reuse them without regenerating.

#### Acceptance Criteria

1. WHEN a new asset is successfully generated, THE Game System SHALL automatically add the asset to the player's asset library
2. THE Game System SHALL persist the asset library data to browser local storage with asset metadata including name, description, image data, and generation parameters
3. WHEN the player opens the asset library interface, THE Game System SHALL display thumbnail previews of all saved assets in a scrollable grid layout
4. WHEN the player selects an asset from the library, THE Game System SHALL enable placement mode for that asset
5. WHEN the player deletes an asset from the library, THE Game System SHALL remove the asset data from local storage and update the library display

### Requirement 3: Asset Placement System

**User Story:** As a player, I want to place assets from my library into the game world, so that I can build custom scenes and structures.

#### Acceptance Criteria

1. WHEN the player selects an asset and enters placement mode, THE Game System SHALL display a semi-transparent preview of the asset following the mouse cursor position
2. WHEN the player clicks in the game world during placement mode, THE Game System SHALL create a new sprite instance at the clicked position with the selected asset texture
3. THE Game System SHALL add physics bodies to placed assets based on their collision settings
4. WHEN the player places an asset, THE Game System SHALL save the placement data including position, asset reference, scale, and rotation to the world state
5. THE Game System SHALL support placing multiple instances of the same asset in different locations

### Requirement 4: Asset Transformation Controls

**User Story:** As a player, I want to move, rotate, and scale placed assets, so that I can arrange them precisely in my world.

#### Acceptance Criteria

1. WHEN the player clicks on a placed asset, THE Game System SHALL select that asset and display transformation handles
2. WHEN the player drags a selected asset, THE Game System SHALL update the asset position to follow the mouse cursor
3. WHEN the player uses the rotation control on a selected asset, THE Game System SHALL rotate the asset sprite around its center point
4. WHEN the player uses the scale control on a selected asset, THE Game System SHALL resize the asset while maintaining its aspect ratio
5. WHEN the player presses the delete key with an asset selected, THE Game System SHALL remove the asset from the game world and update the world state

### Requirement 5: World Persistence System

**User Story:** As a player, I want my created world to be saved automatically, so that I can continue building across multiple sessions.

#### Acceptance Criteria

1. WHEN the player places, moves, or deletes an asset, THE Game System SHALL serialize the current world state to a JSON structure
2. THE Game System SHALL save the serialized world state to browser local storage within 2 seconds of any world modification
3. WHEN the player loads the game, THE Game System SHALL retrieve the saved world state from local storage
4. WHEN a saved world state exists, THE Game System SHALL recreate all placed assets with their saved properties including position, rotation, scale, and texture
5. IF no saved world state exists, THEN THE Game System SHALL initialize an empty world with default terrain

### Requirement 6: API Authentication and Credit Management

**User Story:** As a player, I want to authenticate with the Pixellab API and monitor my usage, so that I can manage my generation credits.

#### Acceptance Criteria

1. WHEN the player first launches the game, THE Game System SHALL prompt the player to enter their Pixellab API token
2. THE Game System SHALL store the API token securely in browser local storage
3. WHEN making API requests, THE Game System SHALL include the stored API token in the Authorization header as a Bearer token
4. WHEN the Pixellab API returns usage data in the response, THE Game System SHALL display the remaining credits and generations to the player
5. IF the API returns a 402 insufficient credits error, THEN THE Game System SHALL display a message informing the player they need to purchase more credits

### Requirement 7: Asset Category System

**User Story:** As a player, I want to generate different types of assets with appropriate parameters, so that I can create varied content for my world.

#### Acceptance Criteria

1. THE Game System SHALL provide asset category options including characters, objects, terrain tiles, decorations, and buildings
2. WHEN the player selects a category, THE Game System SHALL adjust the generation parameters including image size, view angle, and style settings appropriate for that category
3. WHERE the player selects the character category, THE Game System SHALL set the view parameter to "side" and enable outline and shading options
4. WHERE the player selects the terrain category, THE Game System SHALL set the view parameter to "high top-down" and adjust the image size to tile dimensions
5. THE Game System SHALL allow the player to override default category parameters with custom values

### Requirement 8: Animated Asset Support

**User Story:** As a player, I want to generate and place animated assets, so that I can add dynamic elements to my world.

#### Acceptance Criteria

1. WHERE the player enables animation generation, THE Game System SHALL use the Pixellab API animate-with-text endpoint instead of the static image endpoint
2. WHEN an animated asset is generated, THE Game System SHALL receive multiple frames from the API response
3. THE Game System SHALL create a Phaser animation from the received frames with a configurable frame rate
4. WHEN an animated asset is placed in the world, THE Game System SHALL play the animation in a continuous loop
5. THE Game System SHALL save animation frame data and playback settings with the asset in the library

### Requirement 9: User Interface System

**User Story:** As a player, I want an intuitive interface to access all game features, so that I can easily create and manage my world.

#### Acceptance Criteria

1. THE Game System SHALL display a toolbar interface with buttons for asset generation, library access, placement mode, and settings
2. WHEN the player presses the ESC key, THE Game System SHALL toggle the main menu visibility
3. THE Game System SHALL display keyboard shortcuts and controls in a help panel accessible from the main menu
4. WHEN the player hovers over UI elements, THE Game System SHALL display tooltips explaining their function
5. THE Game System SHALL use a pixel art visual style for all UI elements consistent with the game aesthetic

### Requirement 10: Camera and Navigation Controls

**User Story:** As a player, I want to navigate around my world easily, so that I can view and build in different areas.

#### Acceptance Criteria

1. WHEN the player uses arrow keys or WASD keys, THE Game System SHALL move the player character in the corresponding direction at 200 pixels per second
2. WHEN the player uses the mouse wheel, THE Game System SHALL zoom the camera in or out with a minimum zoom of 0.5 and maximum zoom of 2.0
3. WHEN the player middle-clicks and drags, THE Game System SHALL pan the camera view independent of player character position
4. THE Game System SHALL smoothly interpolate camera movements with a lerp factor of 0.1
5. WHEN the player double-clicks the player character, THE Game System SHALL center the camera on the player position

### Requirement 11: Collision and Physics Configuration

**User Story:** As a player, I want to configure physics properties for placed assets, so that I can create interactive environments.

#### Acceptance Criteria

1. WHEN the player places an asset, THE Game System SHALL provide options to enable or disable collision for that asset
2. WHERE collision is enabled for an asset, THE Game System SHALL create a static physics body matching the asset dimensions
3. THE Game System SHALL detect collisions between the player character and assets with collision enabled
4. WHEN the player selects an asset, THE Game System SHALL display the current collision settings and allow toggling
5. THE Game System SHALL save collision settings with each placed asset in the world state

### Requirement 12: Asset Generation Parameters

**User Story:** As a player, I want to customize generation parameters, so that I can fine-tune the appearance of generated assets.

#### Acceptance Criteria

1. THE Game System SHALL provide controls for text guidance scale with a range from 1.0 to 20.0 and default value of 8.0
2. THE Game System SHALL provide dropdown options for outline style including thin, medium, thick, and none
3. THE Game System SHALL provide dropdown options for shading style including soft, hard, flat, and none
4. THE Game System SHALL provide dropdown options for detail level including low, medium, and high
5. WHEN the player generates an asset, THE Game System SHALL include all configured parameters in the API request

### Requirement 13: Error Handling and Validation

**User Story:** As a player, I want clear feedback when errors occur, so that I can understand and resolve issues.

#### Acceptance Criteria

1. WHEN the player submits an empty asset description, THE Game System SHALL display a validation error message requiring a description
2. IF the API request fails due to network issues, THEN THE Game System SHALL display an error message and provide a retry option
3. IF the API returns a 401 authentication error, THEN THE Game System SHALL prompt the player to re-enter their API token
4. IF the API returns a 422 validation error, THEN THE Game System SHALL display the specific validation issues from the API response
5. THE Game System SHALL log all API errors to the browser console with request and response details for debugging

### Requirement 14: World Export and Import

**User Story:** As a player, I want to export and import my worlds, so that I can share creations and back up my work.

#### Acceptance Criteria

1. WHEN the player selects the export option, THE Game System SHALL serialize the complete world state including all assets and placements to a JSON file
2. THE Game System SHALL include asset image data in the exported file to ensure portability
3. WHEN the player selects the import option, THE Game System SHALL display a file picker for JSON world files
4. WHEN a valid world file is imported, THE Game System SHALL load all assets and placements from the file and recreate the world
5. IF an imported file is invalid or corrupted, THEN THE Game System SHALL display an error message and preserve the current world state

### Requirement 15: Performance Optimization

**User Story:** As a player, I want the game to run smoothly even with many placed assets, so that I can create large complex worlds.

#### Acceptance Criteria

1. THE Game System SHALL implement sprite pooling to reuse sprite objects instead of creating new instances
2. THE Game System SHALL cull off-screen assets from rendering when they are outside the camera view bounds
3. THE Game System SHALL limit the maximum number of simultaneously placed assets to 500 instances
4. WHEN the asset count exceeds 400, THE Game System SHALL display a warning message to the player
5. THE Game System SHALL maintain a minimum frame rate of 30 FPS with 300 placed assets on a system with 8GB RAM and integrated graphics
