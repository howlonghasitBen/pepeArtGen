# Meshy AI Integration Guide

**Last Updated:** January 2026
**Purpose:** Step-by-step guide for creating and integrating 3D models using Meshy AI

---

## Overview

This guide covers the complete workflow for creating 3D models with Meshy AI and integrating them into the SURF Waves mini-app's 3D shop environment.

## Table of Contents

1. [Meshy AI Basics](#meshy-ai-basics)
2. [Image-to-3D Workflow](#image-to-3d-workflow)
3. [Export Settings](#export-settings)
4. [Integration into Mini-App](#integration-into-mini-app)
5. [Model Categories & Ideas](#model-categories--ideas)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Meshy AI Basics

### What is Meshy AI?

Meshy AI is an AI-powered 3D model generation service that creates 3D models from:
- **Text prompts** (Text-to-3D)
- **Reference images** (Image-to-3D) ← Your preferred method

### Account Access

1. Go to [meshy.ai](https://www.meshy.ai/)
2. Log in with your subscription account
3. Navigate to "Create" → "Image to 3D"

---

## Image-to-3D Workflow

### Step 1: Prepare Your Reference Image

**Best Practices for Reference Images:**

| Do | Don't |
|----|-------|
| Use clear, well-lit photos | Use blurry or dark images |
| Show the object from a good angle | Use extreme close-ups |
| Use simple backgrounds | Use cluttered backgrounds |
| Include the full object | Cut off important parts |
| Use PNG or JPG format | Use heavily compressed images |

**Ideal Image Specifications:**
- Resolution: 512x512 to 2048x2048 pixels
- Format: PNG (preferred) or JPG
- Background: Solid color or transparent
- Angle: 3/4 view (shows front and side)

### Step 2: Upload to Meshy AI

1. Click "Create" → "Image to 3D"
2. Upload your reference image
3. Wait for the preview to generate

### Step 3: Configure Generation Settings

**Art Style Options:**
- `Realistic` - For real-world objects
- `Cartoon` - Stylized, simplified shapes (recommended for this project)
- `Low-poly` - Minimalist, game-ready (best for performance)
- `Sculpture` - Detailed artistic look

**Recommended Settings for SURF Waves:**
```
Art Style: Low-poly or Cartoon
Topology: Standard
Resolution: Medium (for performance)
```

### Step 4: Generate and Refine

1. Click "Generate"
2. Wait for initial model (usually 1-3 minutes)
3. Review the result from multiple angles
4. If needed, use "Refine" to improve details
5. Use the texture paint tools to fix any issues

### Step 5: Export the Model

See [Export Settings](#export-settings) below.

---

## Export Settings

### Recommended Export Format: GLB

**Why GLB?**
- Single file (includes textures)
- Widely supported
- Optimized file size
- Works directly with Three.js

**Export Configuration:**

```
Format: GLB (Binary glTF)
Scale: 1.0 (adjust in code if needed)
Include:
  ☑ Textures
  ☑ Materials
  ☐ Animations (unless needed)
```

### File Naming Convention

```
category-descriptive-name.glb

Examples:
  props/arcade-machine.glb
  props/pinball-table.glb
  environment/palm-tree-tall.glb
  environment/beach-umbrella-striped.glb
  displays/card-pedestal-gold.glb
  displays/trophy-case-glass.glb
  characters/pepe-hat-cowboy.glb
```

### File Size Guidelines

| Size | Status | Action |
|------|--------|--------|
| < 500KB | Excellent | Ready to use |
| 500KB - 2MB | Good | Acceptable |
| 2MB - 5MB | Warning | Consider optimizing |
| > 5MB | Too Large | Must optimize or simplify |

**Optimization Tips:**
- Use "Low-poly" art style for smaller files
- Reduce texture resolution in Meshy AI
- Use [gltf.report](https://gltf.report/) to analyze and optimize

---

## Integration into Mini-App

### Step 1: Place the Model File

Put your exported `.glb` file in the correct directory:

```
mini-app/public/models/
├── props/           ← Shop furniture, arcade machines, decor
├── environment/     ← Palm trees, rocks, beach items
├── displays/        ← Card pedestals, trophy cases
└── characters/      ← Hats, accessories for Pepe
```

### Step 2: Add to ShopProps.jsx

Open `mini-app/src/components/shop/ShopProps.jsx` and add your model:

```javascript
const SHOP_PROPS = [
  {
    id: 'arcade-machine-1',          // Unique ID
    url: '/models/props/arcade-machine.glb',  // Path from public/
    position: [8, 0, -5],            // X, Y, Z world position
    rotation: [0, -Math.PI / 4, 0],  // Rotation (radians)
    scale: 1.5,                      // Size multiplier
    category: 'props',
  },
  // Add more props here...
];
```

### Step 3: Advanced Configuration Options

```javascript
{
  id: 'glowing-jukebox',
  url: '/models/props/jukebox.glb',
  position: [-6, 0, -4],
  rotation: [0, Math.PI / 6, 0],
  scale: 1.2,

  // Animation (optional)
  animate: true,          // Enable frame updates
  floatAmplitude: 0.1,    // Vertical bobbing amount
  floatSpeed: 1,          // Bobbing speed
  rotateSpeed: 0.5,       // Auto-rotation speed

  // Material enhancement (optional)
  emissiveIntensity: 0.5, // Glow brightness (0-1)
  emissiveColor: '#ff00ff', // Glow color
  metalness: 0.8,         // Metal appearance (0-1)
  roughness: 0.2,         // Surface smoothness (0-1)

  category: 'props',
}
```

### Step 4: Test Your Model

1. Run the development server:
   ```bash
   cd mini-app
   npm run dev:all
   ```

2. Navigate to the 3D Shop (house icon)

3. Find your model and verify:
   - Position is correct
   - Scale looks right
   - Textures load properly
   - No console errors

---

## Model Categories & Ideas

### Shop Props (Interior)

| Item | Description | Meshy Prompt Ideas |
|------|-------------|-------------------|
| Arcade Machine | Retro gaming cabinet | "retro arcade cabinet, neon lights, low-poly" |
| Jukebox | Music player | "1950s jukebox, chrome, glowing" |
| Pinball Table | Gaming table | "pinball machine, space theme, low-poly" |
| Vending Machine | Drink/snack dispenser | "Japanese vending machine, colorful" |
| Neon Sign | Wall decoration | "neon sign, open, pink and blue" |
| Bar Stool | Seating | "wooden bar stool, tropical style" |
| Tiki Torch | Lighting | "tiki torch, bamboo, flame" |
| Fish Tank | Aquarium | "fish tank, tropical fish, bubbles" |
| Cash Register | Counter item | "vintage cash register, brass" |

### Environment Props (Outdoor)

| Item | Description | Meshy Prompt Ideas |
|------|-------------|-------------------|
| Palm Tree | Beach vegetation | "palm tree, coconuts, low-poly" |
| Beach Umbrella | Shade structure | "striped beach umbrella, colorful" |
| Surfboard | Standing board | "surfboard, tropical design, wooden" |
| Beach Chair | Seating | "beach lounger, canvas, wooden" |
| Cooler | Storage | "ice cooler, red, vintage" |
| Beach Ball | Decoration | "beach ball, colorful stripes" |
| Sandcastle | Beach feature | "sandcastle, detailed, bucket nearby" |
| Boat | Water feature | "small wooden boat, fishing boat" |
| Dock | Structure | "wooden pier, weathered planks" |
| Lifeguard Tower | Structure | "lifeguard stand, red and white" |

### Card Displays

| Item | Description | Meshy Prompt Ideas |
|------|-------------|-------------------|
| Card Pedestal | Display stand | "museum pedestal, white marble, modern" |
| Trophy Case | Glass display | "glass trophy case, gold trim, LED lights" |
| Card Frame | Wall mount | "ornate picture frame, gold, baroque" |
| Display Box | Card case | "acrylic display box, trading card size" |
| Holographic Stand | Futuristic | "hologram projector, sci-fi, blue glow" |
| Card Album | Book display | "open binder, trading cards visible" |

### Character Accessories

| Item | Description | Meshy Prompt Ideas |
|------|-------------|-------------------|
| Cowboy Hat | Headwear | "cowboy hat, brown leather" |
| Sunglasses | Eyewear | "aviator sunglasses, gold frame" |
| Lei | Necklace | "Hawaiian lei, flowers, colorful" |
| Surfboard (held) | Accessory | "miniature surfboard, cartoon style" |
| Crown | Headwear | "golden crown, gems, cartoon" |
| Party Hat | Celebration | "birthday party hat, stripes" |

---

## Best Practices

### Performance Optimization

1. **Keep polygon count low**
   - Use "Low-poly" art style in Meshy AI
   - Aim for < 10,000 triangles per model
   - Complex scenes should have < 50,000 total triangles

2. **Optimize textures**
   - 512x512 is usually sufficient
   - 1024x1024 for hero items only
   - Use JPG for opaque textures

3. **Batch similar objects**
   - Use instancing for repeated objects
   - Group static objects together

### Visual Consistency

1. **Match the existing art style**
   - The current shop has a PS2/low-poly aesthetic
   - Avoid hyper-realistic models
   - Keep colors saturated and fun

2. **Scale reference**
   - Pepe character height: ~1.5 units
   - Card height: ~1 unit
   - Use these as reference for scaling

3. **Lighting consideration**
   - Models will receive sunset lighting
   - Test how textures look under warm light
   - Use emissive for items that should glow

### Organization

1. **Naming conventions**
   - Use descriptive, lowercase names
   - Include category prefix
   - Add variant suffix if multiple versions

2. **Documentation**
   - Comment new props in ShopProps.jsx
   - Note any special requirements
   - Record the Meshy AI prompt used

---

## Troubleshooting

### Model Doesn't Appear

**Check:**
1. File path is correct (case-sensitive!)
2. File is in `/public/models/` directory
3. No console errors in browser DevTools
4. Model is not positioned out of view

**Fix:**
```javascript
// Try positioning at origin first
position: [0, 0, 0],
scale: 1,
```

### Model is Too Big/Small

**Solution:**
```javascript
// Adjust scale until it looks right
scale: 0.1,  // If too big
scale: 5,   // If too small
```

### Textures Missing

**Check:**
1. Exported as GLB (not GLTF with separate files)
2. Textures are embedded in the file
3. Use [gltf.report](https://gltf.report/) to verify

### Model is Black/Dark

**Cause:** Missing or incorrect materials

**Fix:**
```javascript
// Add material overrides
metalness: 0.2,
roughness: 0.8,
emissiveIntensity: 0.1,
emissiveColor: '#ffffff',
```

### Performance Issues

**Symptoms:** Low FPS, stuttering

**Solutions:**
1. Reduce model count
2. Use simpler models
3. Decrease texture resolution
4. Check total polygon count

### Model Orientation Wrong

**Fix:**
```javascript
// Rotate to correct orientation (in radians)
rotation: [0, Math.PI, 0],      // 180 degrees Y
rotation: [0, Math.PI / 2, 0],  // 90 degrees Y
```

---

## Quick Reference Card

### Adding a New Model

```bash
# 1. Create in Meshy AI (Image-to-3D)
# 2. Export as GLB
# 3. Copy to: mini-app/public/models/[category]/
# 4. Add config to: mini-app/src/components/shop/ShopProps.jsx
# 5. Test: npm run dev:all
```

### Minimum Config

```javascript
{
  id: 'my-model',
  url: '/models/props/my-model.glb',
  position: [0, 0, 0],
  scale: 1,
  category: 'props',
}
```

### Full Config

```javascript
{
  id: 'my-model',
  url: '/models/props/my-model.glb',
  position: [x, y, z],
  rotation: [rx, ry, rz],
  scale: 1,
  animate: true,
  floatAmplitude: 0.1,
  floatSpeed: 1,
  rotateSpeed: 0.5,
  emissiveIntensity: 0.5,
  emissiveColor: '#ff00ff',
  metalness: 0.5,
  roughness: 0.5,
  category: 'props',
}
```

---

## Next Steps

1. **Start small** - Create one simple prop first
2. **Test thoroughly** - Verify it works before making more
3. **Iterate** - Adjust positioning and scale
4. **Expand** - Add more props once workflow is solid

Happy modeling!
