/**
 * PollinationsAPIService
 * 
 * Service for generating images using the Pollinations.ai API.
 * Pollinations provides free, open-source AI image generation via URL-based requests.
 * 
 * Features:
 * - No authentication required
 * - Multiple AI models (turbo, flux, flux-realism, flux-anime, flux-3d)
 * - Seed support for reproducible generations
 * - Automatic retry with exponential backoff
 * - 30-second timeout per attempt
 */

export default class PollinationsAPIService {
  constructor() {
    // Base URL for Pollinations image generation
    this.baseURL = 'https://image.pollinations.ai/prompt/';
    
    // Default model for fast generation
    this.defaultModel = 'turbo';
    
    // Available models with descriptions
    this.availableModels = [
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
    ];
  }

  /**
   * Get list of available models
   * @returns {Array<{name: string, description: string}>} Array of model objects
   */
  getAvailableModels() {
    return this.availableModels;
  }

  /**
   * Get the default model name
   * @returns {string} Default model name
   */
  getDefaultModel() {
    return this.defaultModel;
  }

  /**
   * Build Pollinations URL with parameters
   * @param {Object} params - Generation parameters
   * @param {string} params.description - Text prompt for image generation
   * @param {number} params.width - Image width in pixels
   * @param {number} params.height - Image height in pixels
   * @param {string} [params.model] - AI model to use (default: turbo)
   * @param {number} [params.seed] - Seed for reproducible generation
   * @param {boolean} [params.nologo] - Remove Pollinations logo (default: true)
   * @returns {string} Complete Pollinations URL
   */
  buildPollinationsURL(params) {
    const {
      description,
      width,
      height,
      model = this.defaultModel,
      seed = null,
      nologo = true
    } = params;

    // Validate model
    const validModels = this.availableModels.map(m => m.name);
    const selectedModel = validModels.includes(model) ? model : this.defaultModel;

    // Encode description for URL safety
    const encodedDescription = encodeURIComponent(description);

    // Build URL with parameters
    let url = `${this.baseURL}${encodedDescription}`;
    url += `?width=${width}`;
    url += `&height=${height}`;
    url += `&model=${selectedModel}`;
    
    if (seed !== null && seed !== undefined) {
      url += `&seed=${seed}`;
    }
    
    if (nologo) {
      url += `&nologo=true`;
    }

    return url;
  }

  /**
   * Fetch image from URL with retry logic and timeout
   * @param {string} url - Image URL to fetch
   * @returns {Promise<string>} Base64 encoded image data
   */
  async fetchImageFromURL(url) {
    const maxRetries = 3;
    const timeoutMs = 30000; // 30 seconds
    const retryDelays = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        // Fetch image
        const response = await fetch(url, {
          signal: controller.signal,
          mode: 'cors'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Convert response to Blob
        const blob = await response.blob();

        // Convert Blob to base64 using FileReader
        const base64 = await this.blobToBase64(blob);

        return base64;

      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;

        // Handle abort (timeout)
        if (error.name === 'AbortError') {
          console.warn(`Attempt ${attempt + 1}/${maxRetries}: Request timed out after ${timeoutMs}ms`);
          if (isLastAttempt) {
            throw new Error('TIMEOUT');
          }
        }
        // Handle network errors
        else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          console.warn(`Attempt ${attempt + 1}/${maxRetries}: Network error`);
          if (isLastAttempt) {
            throw new Error('NETWORK_ERROR');
          }
        }
        // Handle HTTP errors
        else if (error.message.includes('HTTP 429')) {
          console.warn(`Attempt ${attempt + 1}/${maxRetries}: Rate limited`);
          if (isLastAttempt) {
            throw new Error('RATE_LIMITED');
          }
        }
        else {
          console.warn(`Attempt ${attempt + 1}/${maxRetries}: ${error.message}`);
          if (isLastAttempt) {
            throw error;
          }
        }

        // Wait before retry (exponential backoff)
        if (!isLastAttempt) {
          await this.sleep(retryDelays[attempt]);
        }
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Convert Blob to base64 string
   * @param {Blob} blob - Blob to convert
   * @returns {Promise<string>} Base64 encoded string
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate image using Pollinations API
   * @param {Object} params - Generation parameters
   * @param {string} params.description - Text prompt for image generation
   * @param {Object} params.imageSize - Image dimensions
   * @param {number} params.imageSize.width - Image width (16-1024)
   * @param {number} params.imageSize.height - Image height (16-1024)
   * @param {string} [params.model] - AI model to use
   * @param {number} [params.seed] - Seed for reproducible generation
   * @returns {Promise<{imageData: string, metadata: Object}>} Generated image and metadata
   */
  async generateImage(params) {
    try {
      // Validate required parameters
      if (!params.description || params.description.trim().length === 0) {
        throw new Error('INVALID_PARAMS: Description is required');
      }

      if (!params.imageSize || !params.imageSize.width || !params.imageSize.height) {
        throw new Error('INVALID_PARAMS: Image size (width and height) is required');
      }

      // Validate image size range
      const { width, height } = params.imageSize;
      if (width < 16 || width > 1024) {
        throw new Error('INVALID_PARAMS: Width must be between 16 and 1024 pixels');
      }
      if (height < 16 || height > 1024) {
        throw new Error('INVALID_PARAMS: Height must be between 16 and 1024 pixels');
      }

      // Build Pollinations URL
      const url = this.buildPollinationsURL({
        description: params.description,
        width: params.imageSize.width,
        height: params.imageSize.height,
        model: params.model || this.defaultModel,
        seed: params.seed || null,
        nologo: true
      });

      console.log('Generating image with Pollinations:', url);

      // Fetch image from URL
      const imageData = await this.fetchImageFromURL(url);

      // Return image data and metadata
      return {
        imageData,
        metadata: {
          model: params.model || this.defaultModel,
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

  /**
   * Convert base64 image data to a texture URL for Phaser
   * @param {string} base64Data - Base64 encoded image data
   * @returns {string} Blob URL or base64 data URL
   */
  convertToTextureURL(base64Data) {
    // If it's already a data URL, return it directly
    if (base64Data.startsWith('data:')) {
      return base64Data;
    }
    
    // Otherwise, assume it's a raw base64 string and convert it
    return `data:image/png;base64,${base64Data}`;
  }

  /**
   * Handle API errors and return user-friendly messages
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
  handleAPIError(error) {
    const errorMessage = error.message || error.toString();

    // Rate limiting
    if (errorMessage.includes('RATE_LIMITED') || errorMessage.includes('429')) {
      return 'Too many requests. Pollinations is experiencing high traffic. Please wait a moment and try again.';
    }

    // Timeout
    if (errorMessage.includes('TIMEOUT')) {
      return 'Generation timed out. The service may be overloaded. Please try again.';
    }

    // Network errors
    if (errorMessage.includes('NETWORK_ERROR') || errorMessage.includes('Failed to fetch')) {
      return 'Network error. Check your connection and try again.';
    }

    // Invalid parameters
    if (errorMessage.includes('INVALID_PARAMS')) {
      return errorMessage.replace('INVALID_PARAMS: ', '');
    }

    // Service unavailable
    if (errorMessage.includes('503') || errorMessage.includes('unavailable')) {
      return 'Image generation service is temporarily unavailable. Please try again in a few minutes.';
    }

    // Generic error
    return 'Failed to generate image. Please try again.';
  }
}
