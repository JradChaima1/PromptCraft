/**
 * Utility helper functions for the AI Sandbox Builder
 */

/**
 * Generate a UUID v4 for asset and instance IDs
 * @returns {string} UUID string
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate base64 image data
 * @param {string} base64String - Base64 encoded image string
 * @returns {boolean} True if valid base64 image
 */
export function isValidBase64Image(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }
  
  // Check if it starts with data:image prefix or is pure base64
  const base64Pattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
  const pureBase64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
  
  if (base64Pattern.test(base64String)) {
    return true;
  }
  
  // Remove whitespace and check pure base64
  const cleaned = base64String.replace(/\s/g, '');
  return pureBase64Pattern.test(cleaned) && cleaned.length % 4 === 0;
}

/**
 * Create a debounced function that delays execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Calculate image dimensions from base64 data
 * @param {string} base64String - Base64 encoded image
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export function getImageDimensions(base64String) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for dimension calculation'));
    };
    
    // Handle both data URL and pure base64
    if (base64String.startsWith('data:')) {
      img.src = base64String;
    } else {
      img.src = `data:image/png;base64,${base64String}`;
    }
  });
}

/**
 * Convert base64 string to Blob URL for Phaser texture loading
 * @param {string} base64String - Base64 encoded image
 * @returns {string} Blob URL
 */
export function base64ToBlobURL(base64String) {
  // Extract base64 data if it includes data URL prefix
  let base64Data = base64String;
  let mimeType = 'image/png';
  
  if (base64String.startsWith('data:')) {
    const matches = base64String.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      base64Data = matches[2];
    }
  }
  
  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create blob and return URL
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}
