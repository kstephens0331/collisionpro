# Free Professional 3D Vehicle Models - Setup Guide

## Quick Start: Download Free Models

### Best Free Sources (CC0 License - No Attribution Required)

1. **Poly Pizza** (https://poly.pizza)
   - Search: "car" or "vehicle"
   - Filter: CC0 license
   - Format: GLB (preferred)
   - Quality: Good for proof of concept

2. **Sketchfab** (https://sketchfab.com)
   - Search: "car low poly"
   - Filter: "Downloadable" + "CC0" or "CC-BY"
   - Download Format: Select GLB
   - Models under 10MB work best

3. **Quaternius Ultimate Vehicles Pack** (FREE)
   - URL: https://quaternius.com/packs/ultimatevehicles.html
   - License: CC0 (completely free)
   - Format: GLB included
   - Includes: Cars, trucks, vans, SUVs

## Step-by-Step Installation

### 1. Download Models

Download these specific free models:

**Sedan:**
- Poly Pizza: Search "sedan car glb"
- Or: https://poly.pizza/m/car (example)

**SUV:**
- Quaternius: Download Ultimate Vehicles pack
- Extract SUV model

**Truck:**
- Quaternius: Use pickup truck from pack

**Van:**
- Quaternius: Use van model from pack

### 2. Prepare Models

Place downloaded GLB files in this structure:
```
public/
  models/
    vehicles/
      sedan.glb       (< 5MB recommended)
      suv.glb
      truck.glb
      van.glb
      coupe.glb
```

### 3. Verify Models

Models should be:
- **Format:** GLB (not GLTF + bin)
- **Size:** Under 10MB each
- **Centered:** Model origin at vehicle center
- **Scale:** Roughly 1 unit = 1 meter
- **Orientation:** Front facing +Z axis

## I've Already Created the Loader Component

The component at `src/components/3d/models/GLTFVehicle.tsx` is ready to use.

## Manual Download Instructions

### Option 1: Poly Pizza (Easiest)

1. Go to https://poly.pizza
2. Search "car"
3. Find a simple, low-poly car model
4. Click "Download GLB"
5. Save as `public/models/vehicles/sedan.glb`

### Option 2: Quaternius (Best Free Pack)

1. Go to https://quaternius.com/packs/ultimatevehicles.html
2. Click "Download" (it's FREE)
3. Extract the ZIP file
4. Find GLB files in the extracted folder
5. Copy these files:
   - `Car_01.glb` → `public/models/vehicles/sedan.glb`
   - `SUV_01.glb` → `public/models/vehicles/suv.glb`
   - `Truck_01.glb` → `public/models/vehicles/truck.glb`
   - `Van_01.glb` → `public/models/vehicles/van.glb`

### Option 3: Sketchfab (More Variety)

1. Go to https://sketchfab.com/search?q=car&type=models
2. Filter by:
   - ✓ Downloadable
   - ✓ CC0 or CC-BY license
3. Find a low-poly car (< 50k polygons)
4. Click model → Download 3D Model
5. Select "Auto-converted format (glTF)"
6. Download and extract
7. Find the `.glb` file
8. Rename and move to `public/models/vehicles/`

## What Happens After You Download

Once you place GLB files in `public/models/vehicles/`, the app will automatically:
1. Detect the models exist
2. Load them with proper materials
3. Apply your chosen color
4. Enable damage marker placement
5. Show realistic 3D vehicles

## Fallback System

The code already has a fallback:
- **If GLB exists:** Uses professional model
- **If no GLB:** Shows simple placeholder with message

## Recommended Models to Search For

Search these terms on Poly Pizza or Sketchfab:
- "low poly sedan"
- "simple car glb"
- "vehicle low poly"
- "cartoon car" (actually works well!)
- "stylized vehicle"

## File Size Guidelines

- **Ideal:** 1-3 MB per model
- **Acceptable:** 3-7 MB
- **Maximum:** 10 MB
- **Too Large:** > 10 MB (will cause slow loading)

## Testing Your Models

After downloading, test with:
```bash
# Start dev server
npm run dev

# Navigate to an estimate with 3D viewer
# The model should load automatically
```

## Troubleshooting

**Model doesn't appear:**
- Check file is named exactly: `sedan.glb`, `suv.glb`, etc.
- Check file is in `public/models/vehicles/` folder
- Check browser console for errors
- Verify file is GLB format (not GLTF with separate .bin)

**Model is too small/large:**
- Open Chrome DevTools → Console
- Look for scale warnings
- The loader auto-adjusts scale, but extreme sizes may need manual fixing

**Model has wrong colors:**
- Some models come with baked textures
- The color picker only works if model uses materials, not textures
- Consider finding a simpler model without textures

## License Compliance

When using CC-BY models (requires attribution):
1. Note the creator's name from Sketchfab
2. Add to your app's credits page
3. Example: "3D models by [Artist] (Sketchfab) - CC-BY"

CC0 models require NO attribution and can be used freely.

## Next Steps After Setup

1. Download 1-2 free models to test
2. Place in `public/models/vehicles/`
3. Restart dev server
4. View 3D damage annotator
5. If it works, download remaining vehicle types

## Future: Better Models

When you have budget:
- **Hum3D:** $75-200 per vehicle (photorealistic)
- **TurboSquid:** $50-500 per vehicle
- **CGTrader:** $30-300 per vehicle

But for now, the free Quaternius pack or Poly Pizza models are perfectly acceptable for a proof-of-concept and will look 1000x better than procedural geometry!
