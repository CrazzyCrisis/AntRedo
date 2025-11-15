# PanelRenderable Texture Usage Guide

## Overview
`PanelRenderable` supports three rendering modes:
1. **Solid Color** (current) - Clean, simple panels with transparency
2. **Tiled Background** (future) - Repeating texture pattern across the panel
3. **Border Texture** (future) - Decorative border around the panel

## Current Usage (Solid Color)

```typescript
// Create a panel with solid color background
const panel = new PanelRenderable(
    x, y,           // Position (top-left corner)
    width, height,  // Dimensions
    'my_panel',     // ID
    '#2C2C2C',      // Background color (hex)
    220,            // Alpha (0-255, transparency)
    12              // Corner radius (rounded corners)
);

renderer.register(panel);
```

## Future Usage: Tiled Background Texture

### Step 1: Load Texture Asset
```typescript
// In preload() or asset loading
const panelTexture = loadImage('assets/images/ui/panel_texture.png');
```

### Step 2: Apply Texture to Panel
```typescript
// Create panel
const panel = new PanelRenderable(x, y, width, height, 'my_panel');

// Set tiled background texture
panel.setBackgroundTexture(panelTexture, 1.0); // 1.0 = normal scale
// OR with custom scale
panel.setBackgroundTexture(panelTexture, 0.5); // 0.5 = half size tiles

renderer.register(panel);
```

### Texture Requirements:
- **Seamless/Tileable**: Edges should connect smoothly when repeated
- **Power of 2 dimensions**: 32x32, 64x64, 128x128, etc. (recommended)
- **PNG format**: With transparency if desired
- **Example size**: 64x64 pixels for a detailed pattern

### Example Texture Patterns:
- Wood grain
- Stone/brick texture
- Parchment paper
- Metal plates
- Fantasy ornate patterns

## Future Usage: Border Texture

### Step 1: Load Border Asset
```typescript
// In preload()
const borderTexture = loadImage('assets/images/ui/panel_border.png');
```

### Step 2: Apply Border to Panel
```typescript
const panel = new PanelRenderable(x, y, width, height, 'my_panel');

// Set background texture (optional)
panel.setBackgroundTexture(panelTexture);

// Add border texture
panel.setBorderTexture(borderTexture, 16); // 16px border width

renderer.register(panel);
```

### Border Texture Requirements:
- **Single image file**: Just one PNG file, no splitting needed!
- **Tileable**: The image should tile seamlessly when repeated
- **Small size**: Typically 16x16, 32x32, or 64x64 pixels
- **Width**: The texture will be stretched/repeated to match borderWidth parameter
- **Style**: Decorative frame, ornate edges, etc.
- **Examples**: Gold trim, wooden frame, stone edge

**What is "9-slice"?**
- Your border texture gets **repeated along the edges** (top, bottom, left, right)
- Corners are drawn separately so they look correct
- You only provide **one small texture** - the code does the rest
- Think of it like tiling: one small image repeated many times to form a border

## Combining Both

```typescript
const panel = new PanelRenderable(x, y, width, height, 'fancy_panel');

// Tiled background
panel.setBackgroundTexture(woodTexture, 1.0);

// Decorative border
panel.setBorderTexture(goldBorderTexture, 20);

// Can still adjust transparency
panel.setAlpha(200);

renderer.register(panel);
```

## Removing Textures

```typescript
// Return to solid color background
panel.clearBackgroundTexture();

// Remove border
panel.clearBorderTexture();
```

## Implementation in AudioSettingsScene

Current implementation uses solid color:
```typescript
this.backgroundPanel = new PanelRenderable(
    panelX, panelY,
    panelWidth, panelHeight,
    'audio_settings_panel',
    '#2C2C2C',  // Dark gray
    220,        // Slightly transparent
    12          // Rounded corners
);
```

To add textures in the future:
```typescript
// After loading assets
this.backgroundPanel.setBackgroundTexture(menuPanelTexture);
this.backgroundPanel.setBorderTexture(menuBorderTexture, 16);
```

## Asset Organization

Recommended folder structure:
```
assets/
  images/
    ui/
      panels/
        wood_panel_64x64.png      # Single tileable texture
        stone_panel_64x64.png     # Single tileable texture
        parchment_panel_64x64.png # Single tileable texture
      borders/
        gold_border_16.png        # Single border texture (16x16)
        wood_frame_20.png         # Single border texture (20x20)
        ornate_border_24.png      # Single border texture (24x24)
```

**Important**: Each file is just ONE small image that gets repeated/tiled by the code!

## Visual Example

```
Border texture: [decorative pattern in 16x16 image]

Panel result:
┌─────────────────────────┐
│  [pattern repeated 10x] │  ← Top edge (your texture repeated)
│ │                     │ │
│ │   Panel content     │ │  ← Left/Right edges (texture repeated vertically)
│ │                     │ │
│  [pattern repeated 10x] │  ← Bottom edge (texture repeated)
└─────────────────────────┘
   ↑ Corners use same texture

You provide: One 16x16 image
Code creates: Full border of any size
```

## Performance Notes

- **Tiled textures** are efficient - one small image repeated many times
- **Border rendering** uses 9-slice technique for proper corner handling
- **Clipping mask** ensures rounded corners work with textures
- **Alpha blending** works with both textures and solid colors

## Future Enhancements

Potential additions:
- Corner-specific textures (separate images for each corner)
- Gradient overlays on textured backgrounds
- Shadow/glow effects
- Animated textures (scrolling patterns)
- Nine-slice scaling for background textures
