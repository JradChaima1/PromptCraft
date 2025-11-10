/**
 * Pixellab API Service
 * Handles all interactions with the Pixellab API v2
 * 
 * API Documentation: https://api.pixellab.ai/v2/llms.txt
 * API Docs UI: https://api.pixellab.ai/v2/docs
 * 
 * All API responses follow this structure:
 * {
 *   success: boolean,
 *   data: {...},
 *   error: string | null,
 *   usage: {
 *     credits_used: number,
 *     generations_used: number,
 *     remaining_credits: number,
 *     remaining_generations: number
 *   }
 * }
 */

import { base64ToBlobURL } from '../utils/helpers.js';

export default class PixellabAPIService {
  constructor(apiToken = null) {
    this.baseURL = 'https://api.pixellab.ai/v2';
    this.apiToken = apiToken;
    this.maxRetries = 3;
  }

  /**
   * Set the API token
   * @param {string} token - Pixellab API token
   */
  setApiToken(token) {
    this.apiToken = token;
  }

  /**
   * Validate the current API token
   * @returns {Promise<boolean>} True if token is valid
   */
  async validateToken() {
    if (!this.apiToken) {
      return false;
    }

    try {
      const response = await this._makeRequest('/balance', 'GET');
      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Get account balance and usage information
   * @returns {Promise<{remainingCredits: number, remainingGenerations: number}>}
   */
  async getBalance() {
    const response = await this._makeRequest('/balance', 'GET');
    
    if (!response.ok) {
      throw new Error(`Failed to get balance: ${response.status}`);
    }

    const result = await response.json();
    
    // API returns: {success, data, error, usage}
    if (!result.success) {
      throw new Error(result.error || 'Failed to get balance');
    }

    return {
      remainingCredits: result.usage?.remaining_credits || 0,
      remainingGenerations: result.usage?.remaining_generations || 0
    };
  }

  /**
   * Generate a static image using Pixellab API
   * @param {Object} params - Generation parameters
   * @returns {Promise<{imageData: string, usage: Object}>}
   */
  async generateImage(params) {
    const {
      description,
      imageSize = { width: 64, height: 64 },
      textGuidanceScale = 8.0,
      outline = 'medium',
      shading = 'soft',
      detail = 'medium',
      view = 'side',
      direction = null,
      isometric = false,
      noBackground = false,
      seed = null
    } = params;

    // Validate required parameters
    if (!description || description.trim().length === 0) {
      throw new Error('Description is required for image generation');
    }

    // Build request body
    const requestBody = {
      description: description.trim(),
      image_size: imageSize,
      text_guidance_scale: textGuidanceScale,
      outline,
      shading,
      detail,
      view,
      isometric,
      no_background: noBackground
    };

    // Add optional parameters
    if (direction) {
      requestBody.direction = direction;
    }
    if (seed !== null) {
      requestBody.seed = seed;
    }

    const response = await this._makeRequestWithRetry(
      '/create-image-pixflux',
      'POST',
      requestBody
    );

    if (!response.ok) {
      const error = await this._parseErrorResponse(response);
      throw error;
    }

    const result = await response.json();
    
    // API returns: {success, data: {image}, error, usage}
    if (!result.success) {
      throw new Error(result.error || 'Image generation failed');
    }
    
    return {
      imageData: result.data?.image,
      usage: {
        creditsUsed: result.usage?.credits_used || 0,
        generationsUsed: result.usage?.generations_used || 0,
        remainingCredits: result.usage?.remaining_credits || 0,
        remainingGenerations: result.usage?.remaining_generations || 0
      }
    };
  }

  /**
   * Generate an animated asset using Pixellab API
   * @param {Object} params - Animation generation parameters
   * @returns {Promise<{frames: Array<string>, usage: Object}>}
   */
  async generateAnimation(params) {
    const {
      description,
      action = '',
      imageSize = { width: 64, height: 64 },
      textGuidanceScale = null,
      imageGuidanceScale = null,
      nFrames = null,
      startFrameIndex = null,
      view = 'side',
      direction = null,
      referenceImage = null,
      seed = null
    } = params;

    // Validate required parameters
    if (!description || description.trim().length === 0) {
      throw new Error('Description is required for animation generation');
    }

    if (!action || action.trim().length === 0) {
      throw new Error('Action description is required for animation generation');
    }

    // Build request body according to API spec
    const requestBody = {
      description: description.trim(),
      action: action.trim(),
      image_size: imageSize,
      view
    };

    // Add optional parameters
    if (textGuidanceScale !== null) {
      requestBody.text_guidance_scale = textGuidanceScale;
    }
    if (imageGuidanceScale !== null) {
      requestBody.image_guidance_scale = imageGuidanceScale;
    }
    if (nFrames !== null) {
      requestBody.n_frames = nFrames;
    }
    if (startFrameIndex !== null) {
      requestBody.start_frame_index = startFrameIndex;
    }
    if (direction) {
      requestBody.direction = direction;
    }
    if (referenceImage) {
      requestBody.reference_image = referenceImage;
    }
    if (seed !== null) {
      requestBody.seed = seed;
    }

    const response = await this._makeRequestWithRetry(
      '/animate-with-text',
      'POST',
      requestBody
    );

    if (!response.ok) {
      const error = await this._parseErrorResponse(response);
      throw error;
    }

    const result = await response.json();
    
    // API returns: {success, data: {frames}, error, usage}
    if (!result.success) {
      throw new Error(result.error || 'Animation generation failed');
    }
    
    return {
      frames: result.data?.frames || [],
      usage: {
        creditsUsed: result.usage?.credits_used || 0,
        generationsUsed: result.usage?.generations_used || 0,
        remainingCredits: result.usage?.remaining_credits || 0,
        remainingGenerations: result.usage?.remaining_generations || 0
      }
    };
  }

  /**
   * Handle API errors and format for user display
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
  handleAPIError(error) {
    // Network errors
    if (error.message === 'Network request failed') {
      return 'Network error. Check your connection and try again.';
    }

    // HTTP status errors
    if (error.status) {
      switch (error.status) {
        case 401:
          return 'Invalid API token. Please check your credentials.';
        case 402:
          return 'Insufficient credits. Visit pixellab.ai to purchase more.';
        case 422:
          return error.message || 'Validation error. Please check your input parameters.';
        case 429:
          return 'Too many requests. Please wait before trying again.';
        case 529:
          return 'Service temporarily overloaded. Please try again in a moment.';
        case 500:
        case 502:
        case 503:
          return 'Server error. Please try again later.';
        default:
          return `API error (${error.status}): ${error.message || 'Unknown error'}`;
      }
    }

    // Generic errors
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Make an HTTP request to the Pixellab API
   * @private
   */
  async _makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }

    const options = {
      method,
      headers
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    return fetch(url, options);
  }

  /**
   * Make a request with retry logic for network failures
   * @private
   */
  async _makeRequestWithRetry(endpoint, method, body, attempt = 1) {
    try {
      const response = await this._makeRequest(endpoint, method, body);
      
      // Don't retry on client errors (4xx) or success
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Retry on server errors (5xx) or network issues
      if (attempt < this.maxRetries) {
        const delay = this._getExponentialBackoffDelay(attempt);
        console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
        
        await this._sleep(delay);
        return this._makeRequestWithRetry(endpoint, method, body, attempt + 1);
      }

      return response;
    } catch (error) {
      // Network error - retry if attempts remaining
      if (attempt < this.maxRetries) {
        const delay = this._getExponentialBackoffDelay(attempt);
        console.warn(`Network error, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
        
        await this._sleep(delay);
        return this._makeRequestWithRetry(endpoint, method, body, attempt + 1);
      }

      // Max retries exceeded
      const networkError = new Error('Network request failed');
      networkError.originalError = error;
      throw networkError;
    }
  }

  /**
   * Parse error response from API
   * @private
   */
  async _parseErrorResponse(response) {
    const error = new Error();
    error.status = response.status;

    try {
      const result = await response.json();
      // API returns {success: false, data: null, error: "message", usage: {...}}
      error.message = result.error || result.message || result.detail || 'API request failed';
      error.details = result;
    } catch (e) {
      error.message = `HTTP ${response.status}: ${response.statusText}`;
    }

    return error;
  }

  /**
   * Calculate exponential backoff delay
   * @private
   */
  _getExponentialBackoffDelay(attempt) {
    // Base delay of 1 second, doubled for each attempt
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
  }

  /**
   * Sleep utility for retry delays
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convert base64 image to Blob URL for Phaser
   * @param {string} base64String - Base64 encoded image
   * @returns {string} Blob URL
   */
  convertToTextureURL(base64String) {
    return base64ToBlobURL(base64String);
  }
}
