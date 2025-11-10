/**
 * Storage Service
 * Handles all browser localStorage operations for the game
 */

export default class StorageService {
  constructor() {
    this.storageKeys = {
      API_TOKEN: 'pixellab_api_token',
      ASSET_LIBRARY: 'asset_library',
      WORLD_STATE: 'world_state',
      SETTINGS: 'game_settings'
    };
    
    // Compression settings
    this.compressionEnabled = true;
    this.compressionThreshold = 50000; // Compress if data > 50KB
  }

  // ==================== API Token Methods ====================

  /**
   * Save API token to storage
   * @param {string} token - Pixellab API token
   */
  saveAPIToken(token) {
    try {
      localStorage.setItem(this.storageKeys.API_TOKEN, token);
      return true;
    } catch (error) {
      console.error('Failed to save API token:', error);
      this._handleStorageError(error);
      return false;
    }
  }

  /**
   * Get API token from storage
   * @returns {string|null} API token or null if not found
   */
  getAPIToken() {
    try {
      return localStorage.getItem(this.storageKeys.API_TOKEN);
    } catch (error) {
      console.error('Failed to get API token:', error);
      return null;
    }
  }

  /**
   * Clear API token from storage
   */
  clearAPIToken() {
    try {
      localStorage.removeItem(this.storageKeys.API_TOKEN);
      return true;
    } catch (error) {
      console.error('Failed to clear API token:', error);
      return false;
    }
  }

  // ==================== Asset Library Methods ====================

  /**
   * Save asset library to storage
   * @param {Array} assets - Array of asset objects
   * @param {boolean} lazyLoad - If true, save thumbnails separately for lazy loading
   */
  saveAssetLibrary(assets, lazyLoad = false) {
    try {
      // Check storage quota before saving
      this._checkStorageQuota();

      // If lazy loading is enabled, separate thumbnails from full data
      let assetsToSave = assets;
      if (lazyLoad) {
        // Save only metadata, not full image data
        assetsToSave = assets.map(asset => ({
          ...asset,
          imageData: asset.imageData ? 'lazy' : null, // Mark as lazy-loaded
          frames: asset.frames ? 'lazy' : null
        }));
        
        // Store full image data separately with asset ID as key
        assets.forEach(asset => {
          if (asset.imageData && asset.imageData !== 'lazy') {
            const imageKey = `${this.storageKeys.ASSET_LIBRARY}_image_${asset.id}`;
            try {
              localStorage.setItem(imageKey, asset.imageData);
            } catch (e) {
              console.warn(`Failed to save image data for asset ${asset.id}:`, e);
            }
          }
          
          if (asset.frames && Array.isArray(asset.frames) && asset.frames.length > 0) {
            const framesKey = `${this.storageKeys.ASSET_LIBRARY}_frames_${asset.id}`;
            try {
              localStorage.setItem(framesKey, JSON.stringify(asset.frames));
            } catch (e) {
              console.warn(`Failed to save frames for asset ${asset.id}:`, e);
            }
          }
        });
      }

      const data = {
        version: '1.0',
        assets: assetsToSave,
        lastModified: new Date().toISOString(),
        lazyLoad: lazyLoad
      };

      const jsonString = JSON.stringify(data);
      
      // Try to compress if data is large
      const finalData = this._maybeCompress(jsonString);
      
      localStorage.setItem(this.storageKeys.ASSET_LIBRARY, finalData);
      return true;
    } catch (error) {
      console.error('Failed to save asset library:', error);
      this._handleStorageError(error);
      return false;
    }
  }

  /**
   * Load asset library from storage
   * @param {boolean} loadImages - If false, skip loading full image data (for lazy loading)
   * @returns {Array} Array of asset objects
   */
  loadAssetLibrary(loadImages = true) {
    try {
      let jsonString = localStorage.getItem(this.storageKeys.ASSET_LIBRARY);
      
      if (!jsonString) {
        return [];
      }

      // Try to decompress if needed
      jsonString = this._maybeDecompress(jsonString);

      const data = JSON.parse(jsonString);
      
      // Validate data structure
      if (!data.version || !Array.isArray(data.assets)) {
        console.warn('Invalid asset library format, returning empty array');
        return [];
      }

      // If lazy loading was used and we want images, load them now
      if (data.lazyLoad && loadImages) {
        data.assets = data.assets.map(asset => {
          const fullAsset = { ...asset };
          
          // Load image data if marked as lazy
          if (asset.imageData === 'lazy') {
            const imageKey = `${this.storageKeys.ASSET_LIBRARY}_image_${asset.id}`;
            fullAsset.imageData = localStorage.getItem(imageKey) || null;
          }
          
          // Load frames if marked as lazy
          if (asset.frames === 'lazy') {
            const framesKey = `${this.storageKeys.ASSET_LIBRARY}_frames_${asset.id}`;
            const framesData = localStorage.getItem(framesKey);
            fullAsset.frames = framesData ? JSON.parse(framesData) : [];
          }
          
          return fullAsset;
        });
      }

      return data.assets;
    } catch (error) {
      console.error('Failed to load asset library:', error);
      this._handleCorruptedData(this.storageKeys.ASSET_LIBRARY, error);
      return [];
    }
  }

  /**
   * Load a single asset's image data (for lazy loading)
   * @param {string} assetId - Asset ID
   * @returns {string|null} Image data or null
   */
  loadAssetImage(assetId) {
    try {
      const imageKey = `${this.storageKeys.ASSET_LIBRARY}_image_${assetId}`;
      return localStorage.getItem(imageKey);
    } catch (error) {
      console.error(`Failed to load image for asset ${assetId}:`, error);
      return null;
    }
  }

  /**
   * Load a single asset's frames (for lazy loading)
   * @param {string} assetId - Asset ID
   * @returns {Array} Frames array or empty array
   */
  loadAssetFrames(assetId) {
    try {
      const framesKey = `${this.storageKeys.ASSET_LIBRARY}_frames_${assetId}`;
      const framesData = localStorage.getItem(framesKey);
      return framesData ? JSON.parse(framesData) : [];
    } catch (error) {
      console.error(`Failed to load frames for asset ${assetId}:`, error);
      return [];
    }
  }

  // ==================== World State Methods ====================

  /**
   * Save world state to storage
   * @param {Object} worldData - World state data
   */
  saveWorldState(worldData) {
    try {
      // Check storage quota before saving
      this._checkStorageQuota();

      const data = {
        version: '1.0',
        worldName: worldData.worldName || 'Untitled World',
        createdAt: worldData.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString(),
        worldSize: worldData.worldSize || { width: 4000, height: 600 },
        placedAssets: worldData.placedAssets || [],
        playerSpawn: worldData.playerSpawn || { x: 100, y: 300 },
        cameraPosition: worldData.cameraPosition || { x: 0, y: 0, zoom: 1 }
      };

      const jsonString = JSON.stringify(data);
      localStorage.setItem(this.storageKeys.WORLD_STATE, jsonString);
      return true;
    } catch (error) {
      console.error('Failed to save world state:', error);
      this._handleStorageError(error);
      return false;
    }
  }

  /**
   * Load world state from storage
   * @returns {Object|null} World state data or null if not found
   */
  loadWorldState() {
    try {
      const jsonString = localStorage.getItem(this.storageKeys.WORLD_STATE);
      
      if (!jsonString) {
        return null;
      }

      const data = JSON.parse(jsonString);
      
      // Validate data structure
      if (!data.version) {
        console.warn('Invalid world state format');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load world state:', error);
      this._handleCorruptedData(this.storageKeys.WORLD_STATE, error);
      return null;
    }
  }

  /**
   * Clear world state from storage
   */
  clearWorldState() {
    try {
      localStorage.removeItem(this.storageKeys.WORLD_STATE);
      return true;
    } catch (error) {
      console.error('Failed to clear world state:', error);
      return false;
    }
  }

  // ==================== Settings Methods ====================

  /**
   * Save user settings to storage
   * @param {Object} settings - User settings object
   */
  saveSettings(settings) {
    try {
      const data = {
        version: '1.0',
        settings: settings,
        lastModified: new Date().toISOString()
      };

      const jsonString = JSON.stringify(data);
      localStorage.setItem(this.storageKeys.SETTINGS, jsonString);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      this._handleStorageError(error);
      return false;
    }
  }

  /**
   * Load user settings from storage
   * @returns {Object} Settings object with defaults
   */
  loadSettings() {
    try {
      const jsonString = localStorage.getItem(this.storageKeys.SETTINGS);
      
      if (!jsonString) {
        return this._getDefaultSettings();
      }

      const data = JSON.parse(jsonString);
      
      // Validate and merge with defaults
      if (!data.version || !data.settings) {
        console.warn('Invalid settings format, using defaults');
        return this._getDefaultSettings();
      }

      return { ...this._getDefaultSettings(), ...data.settings };
    } catch (error) {
      console.error('Failed to load settings:', error);
      this._handleCorruptedData(this.storageKeys.SETTINGS, error);
      return this._getDefaultSettings();
    }
  }

  // ==================== Export/Import Methods ====================

  /**
   * Export data to a downloadable file
   * @param {Object} data - Data to export
   * @param {string} filename - Name of the file (optional, will generate with timestamp if not provided)
   */
  exportToFile(data, filename = null) {
    try {
      // Generate filename with timestamp if not provided
      if (!filename) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        filename = `world_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.json`;
      }

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log(`File exported: ${filename}`);
      return true;
    } catch (error) {
      console.error('Failed to export file:', error);
      return false;
    }
  }

  /**
   * Import data from a file
   * @returns {Promise<Object>} Imported data
   */
  importFromFile() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            resolve(data);
          } catch (error) {
            reject(new Error('Invalid JSON file'));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
      };
      
      input.click();
    });
  }

  // ==================== Private Helper Methods ====================

  /**
   * Get default settings
   * @private
   */
  _getDefaultSettings() {
    return {
      soundEnabled: true,
      musicEnabled: true,
      volume: 0.7,
      showFPS: false,
      showGrid: false,
      autoSave: true,
      autoSaveInterval: 2000 // milliseconds
    };
  }

  /**
   * Check storage quota and warn if running low
   * @private
   */
  _checkStorageQuota() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return; // API not available
    }

    navigator.storage.estimate().then(estimate => {
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = (usage / quota) * 100;

      if (percentUsed > 90) {
        console.warn(`Storage quota nearly full: ${percentUsed.toFixed(1)}% used`);
        throw new Error('Storage quota exceeded. Please delete some assets to continue.');
      } else if (percentUsed > 75) {
        console.warn(`Storage quota warning: ${percentUsed.toFixed(1)}% used`);
      }
    }).catch(error => {
      console.error('Failed to check storage quota:', error);
    });
  }

  /**
   * Handle storage errors
   * @private
   */
  _handleStorageError(error) {
    if (error.name === 'QuotaExceededError') {
      throw new Error('Storage full. Please delete some assets to continue.');
    } else if (error.name === 'SecurityError') {
      throw new Error('Storage access denied. Please check browser settings.');
    } else {
      throw new Error('Storage operation failed. Please try again.');
    }
  }

  /**
   * Handle corrupted data
   * @private
   */
  _handleCorruptedData(key, error) {
    console.error(`Corrupted data detected for key: ${key}`, error);
    
    // Optionally backup corrupted data
    try {
      const corruptedData = localStorage.getItem(key);
      if (corruptedData) {
        const backupKey = `${key}_corrupted_${Date.now()}`;
        localStorage.setItem(backupKey, corruptedData);
        console.log(`Corrupted data backed up to: ${backupKey}`);
      }
    } catch (backupError) {
      console.error('Failed to backup corrupted data:', backupError);
    }
    
    // Clear corrupted data
    try {
      localStorage.removeItem(key);
    } catch (clearError) {
      console.error('Failed to clear corrupted data:', clearError);
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<Object>} Storage usage info
   */
  async getStorageInfo() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
          percentUsed: ((estimate.usage || 0) / (estimate.quota || 1)) * 100
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return null;
    }
  }

  // ==================== Compression Methods ====================

  /**
   * Compress data if it exceeds threshold
   * Uses simple LZ-based compression via pako or native compression
   * @private
   * @param {string} data - Data to compress
   * @returns {string} Compressed or original data
   */
  _maybeCompress(data) {
    if (!this.compressionEnabled || data.length < this.compressionThreshold) {
      return data;
    }

    try {
      // Simple compression using btoa and deflate-like approach
      // For production, consider using a library like pako or lz-string
      // For now, we'll just mark it as compressed and return original
      // This is a placeholder for future compression implementation
      console.log(`Data size: ${data.length} bytes (compression not implemented yet)`);
      return data;
    } catch (error) {
      console.warn('Compression failed, using uncompressed data:', error);
      return data;
    }
  }

  /**
   * Decompress data if it was compressed
   * @private
   * @param {string} data - Data to decompress
   * @returns {string} Decompressed or original data
   */
  _maybeDecompress(data) {
    // Placeholder for decompression
    // In production, detect compression marker and decompress accordingly
    return data;
  }

  /**
   * Enable or disable compression
   * @param {boolean} enabled - True to enable compression
   */
  setCompressionEnabled(enabled) {
    this.compressionEnabled = enabled;
    console.log(`Storage compression ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set compression threshold
   * @param {number} threshold - Size in bytes above which to compress
   */
  setCompressionThreshold(threshold) {
    this.compressionThreshold = Math.max(1000, threshold);
    console.log(`Compression threshold set to ${this.compressionThreshold} bytes`);
  }

  // ==================== Cleanup Methods ====================

  /**
   * Clean up orphaned lazy-loaded image data
   * Removes image/frame data for assets no longer in library
   */
  cleanupOrphanedData() {
    try {
      const assets = this.loadAssetLibrary(false); // Load without images
      const validAssetIds = new Set(assets.map(a => a.id));
      
      let cleanedCount = 0;
      
      // Scan localStorage for orphaned image/frame data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && (key.startsWith(`${this.storageKeys.ASSET_LIBRARY}_image_`) || 
                    key.startsWith(`${this.storageKeys.ASSET_LIBRARY}_frames_`))) {
          // Extract asset ID from key
          const parts = key.split('_');
          const assetId = parts[parts.length - 1];
          
          if (!validAssetIds.has(assetId)) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} orphaned storage entries`);
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup orphaned data:', error);
      return 0;
    }
  }
}
