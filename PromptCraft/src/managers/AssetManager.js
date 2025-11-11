/**
 * Asset Manager
 * Manages asset library, generation, and placement
 * Integrates with PollinationsAPIService and StorageService
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
  constructor(scene, apiService, storageService, bgRemovalService = null) {
    this.scene = scene;
    this.apiService = apiService;
    this.storageService = storageService;
    this.bgRemovalService = bgRemovalService;
    
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
      animationConfig: assetData.animationConfig || null, // Preserved for backward compatibility
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
   * Generate a static asset using Pollinations API
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generated asset metadata
   */
  async generateAsset(params) {
    // Set loading state
    this.isGenerating = true;

    try {
      // Call API to generate image
      console.log('Generating asset with params:', params);
      const result = await this.apiService.generateImage({
        description: params.description,
        imageSize: params.imageSize,
        model: params.model || 'turbo',
        seed: params.seed || null,
        nologo: true
      });

      let imageData = result.imageData;

      // Apply background removal if requested and service is available
      if (params.removeBackground && this.bgRemovalService) {
        try {
          console.log('Removing background from generated image...');
          imageData = await this.bgRemovalService.removeBackground(imageData, false);
          console.log('Background removed successfully');
        } catch (bgError) {
          console.warn('Background removal failed, using original image:', bgError);
          // Continue with original image if background removal fails
        }
      }

      // Create asset metadata
      const asset = {
        id: generateUUID(),
        name: params.name || params.description.substring(0, 30),
        description: params.description,
        category: params.category || 'object',
        imageData: imageData,
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

      // Add to library
      this.addAsset(asset);

      console.log('Asset generated successfully:', asset.name);

      // Return asset
      return {
        asset
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
   * Prepare an asset for placement by loading texture
   * @param {string} assetId - Asset ID
   * @returns {Promise<Object>} Object with textureKey
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

    return {
      assetId: asset.id,
      textureKey
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
        imageSize: { width: 64, height: 64 },
        model: 'turbo'
      },
      [AssetCategory.OBJECT]: {
        imageSize: { width: 64, height: 64 },
        model: 'turbo'
      },
      [AssetCategory.TERRAIN]: {
        imageSize: { width: 32, height: 32 },
        model: 'turbo'
      },
      [AssetCategory.DECORATION]: {
        imageSize: { width: 48, height: 48 },
        model: 'turbo'
      },
      [AssetCategory.BUILDING]: {
        imageSize: { width: 128, height: 128 },
        model: 'turbo'
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
