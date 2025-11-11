/**
 * Game Configuration
 * Centralized configuration for the AI Sandbox Builder
 */

export const API_CONFIG = {
  BASE_URL: 'https://image.pollinations.ai/prompt/',
  MAX_RETRIES: 3,
  TIMEOUT: 30000 // 30 seconds
};

export const GAME_CONFIG = {
  WORLD_WIDTH: parseInt(import.meta.env.VITE_WORLD_WIDTH) || 4000,
  WORLD_HEIGHT: parseInt(import.meta.env.VITE_WORLD_HEIGHT) || 600,
  MAX_ASSETS: parseInt(import.meta.env.VITE_MAX_ASSETS) || 500,
  ASSET_WARNING_THRESHOLD: 400,
  MIN_FPS: parseInt(import.meta.env.VITE_MIN_FPS) || 30,
  AUTO_SAVE_INTERVAL: parseInt(import.meta.env.VITE_AUTO_SAVE_INTERVAL) || 2000
};

export const PHYSICS_CONFIG = {
  GRAVITY_Y: 800,
  PLAYER_SPEED: 200,
  JUMP_VELOCITY: -400,
  DEBUG: false
};

export const CAMERA_CONFIG = {
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2.0,
  LERP_FACTOR: 0.1,
  PAN_SPEED: 1.0
};

export const ASSET_CATEGORIES = {
  CHARACTER: 'character',
  OBJECT: 'object',
  TERRAIN: 'terrain',
  DECORATION: 'decoration',
  BUILDING: 'building'
};

export const GENERATION_DEFAULTS = {
  [ASSET_CATEGORIES.CHARACTER]: {
    view: 'side',
    imageSize: { width: 64, height: 64 },
    outline: 'medium',
    shading: 'soft',
    detail: 'medium',
    textGuidanceScale: 8.0
  },
  [ASSET_CATEGORIES.OBJECT]: {
    view: 'side',
    imageSize: { width: 64, height: 64 },
    outline: 'medium',
    shading: 'soft',
    detail: 'medium',
    textGuidanceScale: 8.0
  },
  [ASSET_CATEGORIES.TERRAIN]: {
    view: 'high top-down',
    imageSize: { width: 64, height: 64 },
    outline: 'thin',
    shading: 'flat',
    detail: 'medium',
    textGuidanceScale: 8.0
  },
  [ASSET_CATEGORIES.DECORATION]: {
    view: 'side',
    imageSize: { width: 32, height: 32 },
    outline: 'medium',
    shading: 'soft',
    detail: 'high',
    textGuidanceScale: 8.0
  },
  [ASSET_CATEGORIES.BUILDING]: {
    view: 'side',
    imageSize: { width: 128, height: 128 },
    outline: 'thick',
    shading: 'hard',
    detail: 'high',
    textGuidanceScale: 8.0
  }
};

export const STORAGE_KEYS = {
  ASSET_LIBRARY: 'asset_library',
  WORLD_STATE: 'world_state',
  SETTINGS: 'game_settings'
};

export const UI_CONFIG = {
  TOOLBAR_HEIGHT: 50,
  MODAL_WIDTH: 600,
  MODAL_HEIGHT: 400,
  TOOLTIP_DELAY: 500,
  TOAST_DURATION: 3000
};

export const KEYBOARD_SHORTCUTS = {
  GENERATE_ASSET: 'G',
  OPEN_LIBRARY: 'L',
  CLOSE_MODAL: 'Escape',
  DELETE_ASSET: 'Delete',
  SAVE_WORLD: 'S', // With Ctrl
  EXPORT_WORLD: 'E', // With Ctrl
  UNDO: 'Z', // With Ctrl
  REDO: 'Y' // With Ctrl
};
