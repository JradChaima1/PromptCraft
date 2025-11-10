/**
 * Asset Manager
 * Manages asset library, generation, and placement
 * Integrates with PixellabAPIService and StorageService
 */

import { generateUUID } from '../utils/helpers.js';

// Asset category enum
export const AssetCategory = {
  CHARACTER: 'character',
  OBJECT: 'object',
  TERRAIN: 'terrain',
  DECORATION: 'decoration',
  BUILDING: 'building'
};

export default class AssetManager {
  constructor(scene, apiService, storageService) {
    this.scene = scene;
    this.apiService = apiService;
    this.storageService = storageService;
    
    // Asset library (in-memory cache)
    this.assets = [];
    
    // Texture cache to prevent duplicate loads
    this.textureCache = new Map();
    
    // Loading state
    this.isGenerating = false;
    
    // Load existing assets from storage
    this._loadAssetsFromStorage();
  }

  // ==================== Asset Library Management ====================

  /**
   * Get all assets from the library
   * @returns {Array} Array of asset metadata objects
   */
  getAssets() {
    return [...this.assets]; // Return copy to prevent external modification
  }

  /**
   * Add a new asset to the library and persist to storage
   * @param {Object} assetData - Asset metadata
   * @returns {Object} The added asset with generated ID
   */
  addAsset(assetData) {
    // Generate ID if not provided
    const asset = {
      id: assetData.id || generateUUID(),
      name: assetData.name || 'Untitled Asset',
      description: assetData.description || '',
      category: assetData.category || 'object',
      imageData: assetData.imageData,
      frames: assetData.frames || [],
      animationConfig: assetData.animationConfig || null,
      generationParams: assetData.generationParams || {},
      createdAt: assetData.createdAt || new Date().toISOString(),
      usageCredits: assetData.usageCredits || 0
    };

    // Validate required fields
    if (!asset.imageData) {
      throw new Error('Asset must have imageData');
    }

    // Add to library
    this.assets.push(asset);

    // Persist to storage
    this._saveAssetsToStorage();

    console.log(`Asset added to library: ${asset.name} (${asset.id})`);
    
    return asset;
  }

  /**
   * Remove an asset from the library with storage cleanup
   * @param {string} assetId - ID of the asset to remove
   * @returns {boolean} True if asset was removed
   */
  removeAsset(assetId) {
    const index = this.assets.findIndex(asset => asset.id === assetId);
    
    if (index === -1) {
      console.warn(`Asset not found: ${assetId}`);
      return false;
    }

    // Remove from library
    const removedAsset = this.assets.splice(index, 1)[0];

    // Clean up texture cache
    if (this.textureCache.has(assetId)) {
      const textureKey = this.textureCache.get(assetId);
      
      // Remove texture from Phaser if it exists
      if (this.scene.textures.exists(textureKey)) {
        this.scene.textures.remove(textureKey);
      }
      
      this.textureCache.delete(assetId);
    }

    // Persist to storage
    this._saveAssetsToStorage();

    console.log(`Asset removed from library: ${removedAsset.name} (${assetId})`);
    
    return true;
  }

  /**
   * Get a single asset by ID
   * @param {string} assetId - ID of the asset to retrieve
   * @returns {Object|null} Asset metadata or null if not found
   */
  getAsset(assetId) {
    const asset = this.assets.find(asset => asset.id === assetId);
    
    if (!asset) {
      console.warn(`Asset not found: ${assetId}`);
      return null;
    }

    return { ...asset }; // Return copy
  }

  // ==================== Asset Generation ====================

  /**
   * Generate a static asset using Pixellab API
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generated asset metadata
   */
  async generateAsset(params) {
    // Set loading state
    this.isGenerating = true;

    try {
      // Validate API service
      if (!this.apiService || !this.apiService.apiToken) {
        throw new Error('API service not configured. Please set your API token.');
      }

      // Call API to generate image
      console.log('Generating asset with params:', params);
      const result = await this.apiService.generateImage(params);

      // Create asset metadata
      const asset = {
        id: generateUUID(),
        name: params.name || params.description.substring(0, 30),
        description: params.description,
        category: params.category || 'object',
        imageData: result.imageData,
        frames: [], // Static image has no frames
        generationParams: {
          textGuidanceScale: params.textGuidanceScale,
          outline: params.outline,
          shading: params.shading,
          detail: params.detail,
          view: params.view,
          direction: params.direction,
          isometric: params.isometric,
          noBackground: params.noBackground,
          imageSize: params.imageSize,
          seed: params.seed
        },
        createdAt: new Date().toISOString(),
        usageCredits: result.usage.creditsUsed
      };

      // Add to library
      this.addAsset(asset);

      console.log('Asset generated successfully:', asset.name);

      // Return asset and usage info
      return {
        asset,
        usage: result.usage
      };

    } catch (error) {
      console.error('Asset generation failed:', error);
      
      // Format error message for user display
      const errorMessage = this.apiService.handleAPIError(error);
      
      // Re-throw with formatted message
      const formattedError = new Error(errorMessage);
      formattedError.status = error.status;
      formattedError.originalError = error;
      
      throw formattedError;
      
    } finally {
      // Clear loading state
      this.isGenerating = false;
    }
  }

  /**
   * Generate an animated asset using Pixellab API
   * @param {Object} params - Animation generation parameters
   * @returns {Promise<Object>} Generated animated asset metadata
   */
  async generateAnimatedAsset(params) {
    // Set loading state
    this.isGenerating = true;

    try {
      // Validate API service
      if (!this.apiService || !this.apiService.apiToken) {
        throw new Error('API service not configured. Please set your API token.');
      }

      // Call API to generate animation
      console.log('Generating animated asset with params:', params);
      const result = await this.apiService.generateAnimation(params);

      // Validate frames
      if (!result.frames || result.frames.length === 0) {
        throw new Error('Animation generation returned no frames');
      }

      // Create asset metadata with animation config
      const asset = {
        id: generateUUID(),
        name: params.name || params.description.substring(0, 30),
        description: params.description,
        category: params.category || 'character',
        imageData: result.frames[0], // Use first frame as thumbnail
        frames: result.frames,
        animationConfig: {
          frameRate: params.frameRate || 8,
          repeat: -1, // Loop infinitely
          yoyo: false
        },
        generationParams: {
          action: params.action,
          textGuidanceScale: params.textGuidanceScale,
          imageGuidanceScale: params.imageGuidanceScale,
          nFrames: params.nFrames,
          startFrameIndex: params.startFrameIndex,
          view: params.view,
          direction: params.direction,
          imageSize: params.imageSize,
          seed: params.seed
        },
        createdAt: new Date().toISOString(),
        usageCredits: result.usage.creditsUsed
      };

      // Add to library
      this.addAsset(asset);

      console.log('Animated asset generated successfully:', asset.name, `(${result.frames.length} frames at ${asset.animationConfig.frameRate} FPS)`);

      // Return asset and usage info
      return {
        asset,
        usage: result.usage
      };

    } catch (error) {
      console.error('Animated asset generation failed:', error);
      
      // Format error message for user display
      const errorMessage = this.apiService.handleAPIError(error);
      
      // Re-throw with formatted message
      const formattedError = new Error(errorMessage);
      formattedError.status = error.status;
      formattedError.originalError = error;
      
      throw formattedError;
      
    } finally {
      // Clear loading state
      this.isGenerating = false;
    }
  }

  /**
   * Check if asset generation is in progress
   * @returns {boolean} True if generating
   */
  isLoading() {
    return this.isGenerating;
  }

  // ==================== Texture Loading for Phaser ====================

  /**
   * Load asset texture into Phaser
   * Converts base64/Blob to Phaser texture with caching
   * @param {Object} assetData - Asset metadata with imageData
   * @returns {Promise<string>} Texture key in Phaser texture manager
   */
  async loadAssetTexture(assetData) {
    try {
      // Check if texture is already cached
      if (this.textureCache.has(assetData.id)) {
        const cachedKey = this.textureCache.get(assetData.id);
        
        // Verify texture still exists in Phaser
        if (this.scene.textures.exists(cachedKey)) {
          console.log(`Using cached texture: ${cachedKey}`);
          return cachedKey;
        } else {
          // Cache is stale, remove it
          this.textureCache.delete(assetData.id);
        }
      }

      // Generate unique texture key
      const textureKey = `asset_${assetData.id}`;

      // Convert base64 to Blob URL
      const blobURL = this.apiService.convertToTextureURL(assetData.imageData);

      // Load texture into Phaser
      return new Promise((resolve, reject) => {
        this.scene.load.image(textureKey, blobURL);
        
        this.scene.load.once('complete', () => {
          // Cache the texture key
          this.textureCache.set(assetData.id, textureKey);
          console.log(`Texture loaded: ${textureKey}`);
          resolve(textureKey);
        });

        this.scene.load.once('loaderror', () => {
          console.error('Texture loading failed for asset:', assetData.name);
          reject(new Error(`Failed to load texture for asset: ${assetData.name}`));
        });

        // Start the load
        this.scene.load.start();
      });

    } catch (error) {
      console.error('Error loading asset texture:', error);
      throw new Error(`Failed to load texture: ${error.message}`);
    }
  }

  /**
   * Create Phaser animation from frame array
   * @param {Array<string>} frames - Array of base64 frame data
   * @param {string} animKey - Animation key
   * @param {Object} options - Animation options
   * @returns {Promise<string>} Animation key
   */
  async createAnimationFromFrames(frames, animKey, options = {}) {
    try {
      if (!frames || frames.length === 0) {
        throw new Error('No frames provided for animation');
      }

      const {
        frameRate = 8,
        repeat = -1, // -1 for infinite loop
        yoyo = false
      } = options;

      // Load all frames as textures
      const frameKeys = [];
      
      for (let i = 0; i < frames.length; i++) {
        const frameKey = `${animKey}_frame_${i}`;
        const blobURL = this.apiService.convertToTextureURL(frames[i]);

        await new Promise((resolve, reject) => {
          this.scene.load.image(frameKey, blobURL);
          
          this.scene.load.once('complete', () => {
            frameKeys.push(frameKey);
            resolve();
          });

          this.scene.load.once('loaderror', () => {
            reject(new Error(`Failed to load frame ${i}`));
          });

          this.scene.load.start();
        });
      }

      // Create animation configuration
      const animConfig = {
        key: animKey,
        frames: frameKeys.map(key => ({ key })),
        frameRate,
        repeat,
        yoyo
      };

      // Create animation in Phaser
      if (this.scene.anims.exists(animKey)) {
        this.scene.anims.remove(animKey);
      }
      
      this.scene.anims.create(animConfig);

      console.log(`Animation created: ${animKey} (${frames.length} frames at ${frameRate} FPS)`);

      return animKey;

    } catch (error) {
      console.error('Error creating animation from frames:', error);
      throw new Error(`Failed to create animation: ${error.message}`);
    }
  }

  /**
   * Check if a texture is loaded for an asset
   * @param {string} assetId - Asset ID
   * @returns {boolean} True if texture is loaded
   */
  isTextureLoaded(assetId) {
    if (!this.textureCache.has(assetId)) {
      return false;
    }

    const textureKey = this.textureCache.get(assetId);
    return this.scene.textures.exists(textureKey);
  }

  /**
   * Get texture key for an asset
   * @param {string} assetId - Asset ID
   * @returns {string|null} Texture key or null if not loaded
   */
  getTextureKey(assetId) {
    if (!this.textureCache.has(assetId)) {
      return null;
    }

    const textureKey = this.textureCache.get(assetId);
    return this.scene.textures.exists(textureKey) ? textureKey : null;
  }

  /**
   * Prepare an asset for placement by loading texture and creating animation if needed
   * @param {string} assetId - Asset ID
   * @returns {Promise<Object>} Object with textureKey, animationKey, and animationConfig
   */
  async prepareAssetForPlacement(assetId) {
    const asset = this.getAsset(assetId);
    
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Load texture if not already loaded
    let textureKey = this.getTextureKey(assetId);
    
    if (!textureKey) {
      textureKey = await this.loadAssetTexture(asset);
    }

    // Prepare animation if asset has frames
    let animationKey = null;
    let animationConfig = null;

    if (asset.frames && asset.frames.length > 1) {
      animationKey = `anim_${asset.id}`;
      animationConfig = asset.animationConfig || {
        frameRate: 8,
        repeat: -1,
        yoyo: false
      };

      // Create animation if it doesn't exist
      if (!this.scene.anims.exists(animationKey)) {
        await this.createAnimationFromFrames(
          asset.frames,
          animationKey,
          animationConfig
        );
      }
    }

    return {
      assetId: asset.id,
      textureKey,
      animationKey,
      animationConfig
    };
  }

  // ==================== Asset Category System ====================

  /**
   * Get default generation parameters for a category
   * @param {string} category - Asset category
   * @returns {Object} Default parameters for the category
   */
  getCategoryDefaults(category) {
    const defaults = {
      [AssetCategory.CHARACTER]: {
        view: 'side',
        direction: null,
        imageSize: { width: 64, height: 64 },
        outline: 'medium',
        shading: 'soft',
        detail: 'medium',
        isometric: false,
        noBackground: true,
        textGuidanceScale: 8.0
      },
      [AssetCategory.OBJECT]: {
        view: 'front',
        direction: null,
        imageSize: { width: 64, height: 64 },
        outline: 'medium',
        shading: 'soft',
        detail: 'medium',
        isometric: false,
        noBackground: true,
        textGuidanceScale: 8.0
      },
      [AssetCategory.TERRAIN]: {
        view: 'high top-down',
        direction: null,
        imageSize: { width: 32, height: 32 },
        outline: 'thin',
        shading: 'flat',
        detail: 'medium',
        isometric: false,
        noBackground: false,
        textGuidanceScale: 7.0
      },
      [AssetCategory.DECORATION]: {
        view: 'front',
        direction: null,
        imageSize: { width: 48, height: 48 },
        outline: 'medium',
        shading: 'soft',
        detail: 'high',
        isometric: false,
        noBackground: true,
        textGuidanceScale: 8.0
      },
      [AssetCategory.BUILDING]: {
        view: 'front',
        direction: null,
        imageSize: { width: 128, height: 128 },
        outline: 'medium',
        shading: 'hard',
        detail: 'high',
        isometric: true,
        noBackground: true,
        textGuidanceScale: 9.0
      }
    };

    // Return defaults for category or generic defaults
    return defaults[category] || defaults[AssetCategory.OBJECT];
  }

  /**
   * Get all available asset categories
   * @returns {Array<string>} Array of category names
   */
  getCategories() {
    return Object.values(AssetCategory);
  }

  /**
   * Validate category
   * @param {string} category - Category to validate
   * @returns {boolean} True if valid category
   */
  isValidCategory(category) {
    return Object.values(AssetCategory).includes(category);
  }

  /**
   * Get assets filtered by category
   * @param {string} category - Category to filter by
   * @returns {Array} Array of assets in the category
   */
  getAssetsByCategory(category) {
    if (!this.isValidCategory(category)) {
      console.warn(`Invalid category: ${category}`);
      return [];
    }

    return this.assets.filter(asset => asset.category === category);
  }

  /**
   * Generate asset with category-specific defaults
   * Merges user params with category defaults
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generated asset
   */
  async generateAssetWithCategoryDefaults(params) {
    const category = params.category || AssetCategory.OBJECT;
    const categoryDefaults = this.getCategoryDefaults(category);

    // Merge params with category defaults (params override defaults)
    const mergedParams = {
      ...categoryDefaults,
      ...params,
      category
    };

    return this.generateAsset(mergedParams);
  }

  // ==================== Private Storage Methods ====================

  /**
   * Load assets from storage on initialization
   * @private
   */
  _loadAssetsFromStorage() {
    try {
      const storedAssets = this.storageService.loadAssetLibrary();
      this.assets = storedAssets || [];
      console.log(`Loaded ${this.assets.length} assets from storage`);
    } catch (error) {
      console.error('Failed to load assets from storage:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Initialize with empty array to allow recovery
      this.assets = [];
      
      // Emit error event for UI to handle
      if (this.scene && this.scene.events) {
        this.scene.events.emit('asset-load-error', {
          error: 'Failed to load asset library from storage',
          canRecover: true
        });
      }
    }
  }

  /**
   * Save assets to storage
   * @private
   */
  _saveAssetsToStorage() {
    try {
      this.storageService.saveAssetLibrary(this.assets);
    } catch (error) {
      console.error('Failed to save assets to storage:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        assetCount: this.assets.length,
        timestamp: new Date().toISOString()
      });
      
      // Emit error event for UI to handle
      if (this.scene && this.scene.events) {
        this.scene.events.emit('asset-save-error', {
          error: error.message || 'Failed to save asset library',
          assetCount: this.assets.length
        });
      }
      
      // Re-throw to let caller handle
      throw error;
    }
  }
}
