/**
 * BackgroundRemovalService
 * 
 * Service for removing backgrounds from images using remove.bg API
 * or client-side canvas processing as fallback
 */

export default class BackgroundRemovalService {
  constructor() {
    // Remove.bg API endpoint
    this.removeBgAPI = 'https://api.remove.bg/v1.0/removebg';
    
    // API key (user can set this in settings)
    this.apiKey = null;
  }

  /**
   * Set remove.bg API key
   * @param {string} key - API key from remove.bg
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Remove background from image
   * @param {string} imageData - Base64 image data
   * @param {boolean} useAPI - Whether to use remove.bg API (requires API key)
   * @returns {Promise<string>} Base64 image data with transparent background
   */
  async removeBackground(imageData, useAPI = false) {
    if (useAPI && this.apiKey) {
      return await this.removeBackgroundWithAPI(imageData);
    } else {
      return await this.removeBackgroundClientSide(imageData);
    }
  }

  /**
   * Remove background using remove.bg API
   * @param {string} imageData - Base64 image data
   * @returns {Promise<string>} Base64 image data with transparent background
   */
  async removeBackgroundWithAPI(imageData) {
    try {
      // Convert base64 to blob
      const base64Data = imageData.split(',')[1];
      const blob = this.base64ToBlob(base64Data, 'image/png');

      // Create form data
      const formData = new FormData();
      formData.append('image_file', blob);
      formData.append('size', 'auto');

      // Call remove.bg API
      const response = await fetch(this.removeBgAPI, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Remove.bg API error: ${response.status}`);
      }

      // Get result as blob
      const resultBlob = await response.blob();

      // Convert blob to base64
      return await this.blobToBase64(resultBlob);

    } catch (error) {
      console.error('Remove.bg API failed:', error);
      throw new Error('Background removal failed. Check your API key or try client-side processing.');
    }
  }

  /**
   * Remove background using client-side canvas processing
   * Uses chroma key technique to remove similar colors
   * @param {string} imageData - Base64 image data
   * @returns {Promise<string>} Base64 image data with transparent background
   */
  async removeBackgroundClientSide(imageData) {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          // Draw image
          ctx.drawImage(img, 0, 0);

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Sample corner pixels to determine background color
          const bgColor = this.detectBackgroundColor(data, canvas.width, canvas.height);

          // Remove background by making similar colors transparent
          // Use conservative threshold to preserve sprite details
          const bgBrightness = (bgColor.r + bgColor.g + bgColor.b) / 3;
          
          // More conservative thresholds to avoid removing sprite parts
          let threshold;
          if (bgBrightness > 240) {
            threshold = 30; // Very bright white background
          } else if (bgBrightness > 200) {
            threshold = 25; // Bright background
          } else if (bgBrightness < 20) {
            threshold = 25; // Very dark background
          } else {
            threshold = 20; // Medium backgrounds
          }
          
          // Track which pixels are definitely background (edge pixels)
          const isEdgePixel = (x, y) => {
            const edgeMargin = 3; // Increased from 2 to catch more edge artifacts
            return x < edgeMargin || x >= canvas.width - edgeMargin ||
                   y < edgeMargin || y >= canvas.height - edgeMargin;
          };
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate pixel position
            const pixelIndex = i / 4;
            const x = pixelIndex % canvas.width;
            const y = Math.floor(pixelIndex / canvas.width);
            
            // Calculate pixel brightness
            const pixelBrightness = (r + g + b) / 3;

            // Calculate color difference using Euclidean distance
            const diff = Math.sqrt(
              Math.pow(r - bgColor.r, 2) +
              Math.pow(g - bgColor.g, 2) +
              Math.pow(b - bgColor.b, 2)
            );

            // Special handling for dark edge artifacts (black outlines)
            if (isEdgePixel(x, y)) {
              // Remove very dark pixels on edges (likely artifacts)
              if (pixelBrightness < 40) {
                data[i + 3] = 0;
              }
              // Remove pixels similar to background
              else if (diff < threshold) {
                data[i + 3] = 0;
              }
              // Gradual transparency for edge pixels
              else if (diff < threshold + 15) {
                const alpha = Math.floor(((diff - threshold) / 15) * 255);
                data[i + 3] = Math.min(data[i + 3], alpha);
              }
            } else {
              // Interior pixels - only remove if VERY similar to background
              if (diff < threshold * 0.5) {
                data[i + 3] = 0;
              }
            }
          }

          // Put modified image data back
          ctx.putImageData(imageData, 0, 0);

          // Convert to base64
          const result = canvas.toDataURL('image/png');
          resolve(result);
        };

        img.onerror = () => {
          reject(new Error('Failed to load image for background removal'));
        };

        img.src = imageData;

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Detect background color by sampling corner pixels
   * @param {Uint8ClampedArray} data - Image pixel data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Object} RGB color object
   */
  detectBackgroundColor(data, width, height) {
    // Sample corners and edges with larger sample size
    const samples = [];
    const sampleSize = 10; // Increased from 5 for better detection

    // Sample all four corners
    const corners = [
      { startX: 0, startY: 0 }, // Top-left
      { startX: width - sampleSize, startY: 0 }, // Top-right
      { startX: 0, startY: height - sampleSize }, // Bottom-left
      { startX: width - sampleSize, startY: height - sampleSize } // Bottom-right
    ];

    corners.forEach(corner => {
      for (let y = corner.startY; y < corner.startY + sampleSize && y < height; y++) {
        for (let x = corner.startX; x < corner.startX + sampleSize && x < width; x++) {
          const i = (y * width + x) * 4;
          samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
      }
    });

    // Also sample edges (top, bottom, left, right)
    const edgeSampleSize = 3;
    
    // Top edge
    for (let x = sampleSize; x < width - sampleSize; x += 5) {
      for (let y = 0; y < edgeSampleSize; y++) {
        const i = (y * width + x) * 4;
        samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
    
    // Bottom edge
    for (let x = sampleSize; x < width - sampleSize; x += 5) {
      for (let y = height - edgeSampleSize; y < height; y++) {
        const i = (y * width + x) * 4;
        samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
    
    // Left edge
    for (let y = sampleSize; y < height - sampleSize; y += 5) {
      for (let x = 0; x < edgeSampleSize; x++) {
        const i = (y * width + x) * 4;
        samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
    
    // Right edge
    for (let y = sampleSize; y < height - sampleSize; y += 5) {
      for (let x = width - edgeSampleSize; x < width; x++) {
        const i = (y * width + x) * 4;
        samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }

    // Use median instead of average for more robust detection
    // Sort samples by brightness to find the most common background color
    samples.sort((a, b) => {
      const brightnessA = (a.r + a.g + a.b) / 3;
      const brightnessB = (b.r + b.g + b.b) / 3;
      return brightnessA - brightnessB;
    });

    // Take median color (middle of sorted array)
    const medianIndex = Math.floor(samples.length / 2);
    return samples[medianIndex];
  }

  /**
   * Convert base64 to Blob
   * @param {string} base64 - Base64 string
   * @param {string} contentType - MIME type
   * @returns {Blob}
   */
  base64ToBlob(base64, contentType = 'image/png') {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  /**
   * Convert Blob to base64
   * @param {Blob} blob - Blob to convert
   * @returns {Promise<string>} Base64 string
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
