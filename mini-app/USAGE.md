# Mini-app Usage Guide

## Current Status

The mini-app is set up and running, but **card generation requires images**. Here's how to use it:

## Option 1: Use Existing Card Generator (Recommended)

The easiest way is to use the existing `unifiedCardGenerator.mjs` from the parent directory:

```bash
# Go to parent directory
cd ..

# Create input directory if it doesn't exist
mkdir -p input_dir

# Add your monster images to input_dir/
# (PNG, JPG, GIF, or WEBP files)

# Generate cards
node unifiedCardGenerator.mjs
```

This will create cards in `generated-cards/` with:
- AI-generated moves and flavor text
- Color extraction from images
- Proper theming
- NFT metadata

## Option 2: Add Image Upload to Mini-app

To enable card generation in the mini-app, you need to add image upload functionality. Here's what needs to be done:

### Frontend Changes Needed:

1. Add a file input in `GeneratorScreen.jsx`:
```jsx
<input
  type="file"
  accept="image/*"
  onChange={handleImageUpload}
  multiple={mode === 'batch'}
/>
```

2. Convert uploaded images to base64
3. Send base64 images with monster names to API

### API Endpoint:

The API is already configured to:
- Accept `monsterNames` and `images` arrays
- Extract colors using node-vibrant
- Generate themes based on colors
- Create move and flavor text with Gemini

## WalletConnect Setup (Optional)

The wallet connection errors are just warnings. To fix them:

1. Get a free Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Add to `.env`:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_actual_project_id
```

The app works without this - you just won't be able to connect wallets until minting time.

## Quick Test Workflow

For now, to test the app's styling and flow:

1. Generate cards with the existing generator:
```bash
cd .. && node unifiedCardGenerator.mjs
```

2. Manually create test data in the mini-app (or add image upload feature)

3. Test the swipe interface and minting flow

## Next Steps

Would you like me to:
1. Add image upload functionality to the GeneratorScreen?
2. Create a demo mode with sample cards for testing?
3. Integrate the existing generated cards into the mini-app?

Let me know how you'd like to proceed!
