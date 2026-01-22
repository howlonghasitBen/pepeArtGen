/**
 * Card Layout Constants
 * Based on cardHTMLGenerator.mjs specifications
 * Card dimensions: 400px × 533px (3:4 aspect ratio)
 */

export const CARD_LAYOUT = {
  // Standard card aspect ratio (width:height = 3:4)
  ASPECT_RATIO: 3 / 4, // 0.75

  // Carousel settings
  CAROUSEL: {
    MAX_WIDTH: 400,
    MOBILE_MAX_WIDTH: 320,
    SMALL_MOBILE_MAX_WIDTH: 260,
    BORDER_RADIUS: 14,
  },

  // 3D Scene card settings
  CARD_3D: {
    BASE_HEIGHT: 1.0,
    CARD_DEPTH: 0.02,
    HOVER_SCALE: 1.12,
    FLOAT_AMPLITUDE: 0.015,
    FLOAT_SPEED: 1.2,
  },

  // Card bar / shop display settings
  CARD_BAR: {
    // Counter display (rotating cards on bar top)
    COUNTER: {
      MAX_CARDS: 5,
      ROTATION_INTERVAL_MS: 60000, // 1 minute
      BAR_WIDTH: 10,
      Y_POSITION: 1.5,
      Z_POSITION: -3,
    },

    // Shelf display settings
    SHELVES: {
      COUNT: 4,
      CARDS_PER_SHELF: 7,
      SHELF_WIDTH: 10,
      CARD_SCALE: 0.7, // Smaller cards on shelves
      POSITIONS: [
        { y: 1.6, z: 0.15 },  // Shelf 1 (lowest)
        { y: 2.5, z: 0.15 },  // Shelf 2
        { y: 3.4, z: 0.15 },  // Shelf 3
        { y: 4.3, z: 0.15 },  // Shelf 4 (highest)
      ],
      LED_COLORS: ['#ff6600', '#ff00ff', '#00ffff', '#00ff88'],
    },

    // Bar geometry
    BAR: {
      WIDTH: 12,
      HEIGHT: 0.15,
      DEPTH: 1.5,
      TOP_COLOR: '#4a3728',
      BASE_COLOR: '#3d2817',
      METAL_COLOR: '#888888',
      NEON_COLOR: '#00ff88',
    },
  },
};

export default CARD_LAYOUT;
