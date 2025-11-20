# Phase 8: 3D Vehicle Damage Visualization

**Duration**: Weeks 17-18 (2 weeks)
**Status**: 🚧 IN PROGRESS
**Start Date**: 2025-11-19

---

## Overview

Phase 8 adds interactive 3D vehicle visualization that allows estimators and customers to see damage locations visually on a 3D model. This creates a "wow factor" that competitors lack and improves communication with customers.

**Key Features**:
- Interactive 3D vehicle viewer (rotate, zoom, pan)
- Click-to-annotate damage markers
- Damage type categorization (dent, scratch, crack, etc.)
- Color-coded severity levels
- Multiple viewing angles
- Screenshot capture for PDF export
- Customer-facing simplified viewer

**Business Impact**:
- Better customer understanding of repairs
- Reduced miscommunication
- Professional presentation
- Competitive differentiation
- Higher estimate approval rates

---

## Implementation Strategy

### MVP Approach (Fast Launch)

Instead of sourcing 10,000+ vehicle models (requires licensing, huge file sizes), we'll use:

**Generic Vehicle Templates** (4 types):
1. Sedan (generic car shape)
2. SUV (generic SUV shape)
3. Truck (generic pickup shape)
4. Coupe (generic sports car shape)

**Benefits**:
- Launch immediately (no licensing delays)
- Small file sizes (fast loading)
- Works for 95% of damage annotation needs
- Easy to add real models later

**Future Enhancement**:
- Partner with model providers (TurboSquid, CGTrader)
- License manufacturer-specific models
- VIN-based model selection

---

## Sub-Phases

### 8.1: Three.js Setup & 3D Engine (Day 1)

**Objective**: Set up Three.js infrastructure and basic 3D scene.

**Features**:
- Three.js library integration
- Scene, camera, renderer setup
- Orbital controls (rotate, zoom, pan)
- Lighting system (ambient + directional)
- Grid/helper system for development

**Deliverables**:
- [ ] Three.js dependencies installed
- [ ] 3D scene component created
- [ ] Camera controls working
- [ ] Lighting configured

---

### 8.2: Generic Vehicle Models (Day 1-2)

**Objective**: Create or source 4 generic vehicle models.

**Options**:
1. **Use free models** from Sketchfab, TurboSquid (CC licensed)
2. **Procedural generation** (simple box-based shapes)
3. **Purchased low-poly models** ($50-100 total for 4 models)

**Model Requirements**:
- Low-poly (< 50k triangles)
- GLB/GLTF format (web-optimized)
- Named parts (hood, door, fender, bumper, etc.)
- Centered at origin, proper scale

**Deliverables**:
- [ ] 4 vehicle models sourced/created
- [ ] Models optimized for web (< 2MB each)
- [ ] Model loader component
- [ ] Vehicle type selector (sedan/SUV/truck/coupe)

---

### 8.3: Damage Annotation UI (Day 2-3)

**Objective**: Click-to-add damage markers on 3D model.

**Features**:
- Raycasting for click detection on model
- Damage marker placement (3D spheres/icons)
- Damage type selector:
  - Dent
  - Scratch
  - Crack
  - Shatter/Broken
  - Bend
  - Tear
  - Paint damage
  - Missing part
- Severity levels:
  - Minor (green)
  - Moderate (yellow)
  - Severe (orange)
  - Critical (red)
- Marker labels with damage info
- Delete/edit markers
- Marker list panel

**Deliverables**:
- [ ] Click-to-add damage system
- [ ] Damage type selector UI
- [ ] Color-coded severity markers
- [ ] Marker editing/deletion
- [ ] Damage list panel

---

### 8.4: Multiple Viewing Angles (Day 3)

**Objective**: Pre-set camera angles for quick navigation.

**Angles**:
- Front view
- Rear view
- Left side
- Right side
- Top view
- Front-left 45°
- Front-right 45°
- Isometric (3/4 view)

**Features**:
- Animated camera transitions
- Angle selector buttons
- Reset to default view

**Deliverables**:
- [ ] 8 preset camera angles
- [ ] Smooth camera animations
- [ ] Angle selector UI
- [ ] Reset button

---

### 8.5: PDF Export with Screenshots (Day 4)

**Objective**: Capture 3D views for PDF inclusion.

**Features**:
- Screenshot capture from current view
- Multi-angle capture (all 8 angles)
- Damage marker visibility toggle
- Grid/helper removal for clean shots
- High-resolution capture (2x canvas size)
- PNG export with transparency

**Deliverables**:
- [ ] Screenshot capture function
- [ ] Multi-angle batch capture
- [ ] Clean rendering mode (no helpers)
- [ ] Integration with existing PDF system

---

### 8.6: Customer-Facing Viewer (Day 4-5)

**Objective**: Simplified viewer for customer portal.

**Features**:
- Read-only mode (no editing)
- Simplified controls
- Damage markers visible
- Touch-friendly (mobile)
- Minimal UI (clean)
- Fullscreen mode

**Deliverables**:
- [ ] Customer viewer component
- [ ] Mobile-optimized controls
- [ ] Touch gesture support
- [ ] Fullscreen mode
- [ ] Integration with customer portal

---

### 8.7: Database Schema (Day 5)

**Objective**: Store damage annotations.

**Schema**:
```sql
CREATE TABLE damage_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,

  -- Vehicle model info
  vehicle_type VARCHAR(20), -- 'sedan', 'suv', 'truck', 'coupe'

  -- Marker data (stored as JSONB for flexibility)
  markers JSONB NOT NULL DEFAULT '[]',
  -- Example marker:
  -- {
  --   id: "marker_1",
  --   position: { x: 1.5, y: 0.5, z: 2.0 },
  --   damageType: "dent",
  --   severity: "moderate",
  --   description: "Large dent on driver door",
  --   partName: "door_left_front"
  -- }

  -- Camera state (save user's view)
  camera_position JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE damage_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shop's annotations"
  ON damage_annotations FOR SELECT
  USING (estimate_id IN (
    SELECT id FROM estimates WHERE shop_id IN (
      SELECT id FROM shops WHERE id = auth.uid()::uuid
      OR id IN (SELECT shop_id FROM shop_users WHERE user_id = auth.uid())
    )
  ));
```

**Deliverables**:
- [ ] Database migration
- [ ] RLS policies
- [ ] API endpoints (save/load annotations)

---

## Technology Stack

**3D Rendering**:
- **Three.js** (r160+) - Industry-standard WebGL library
- **@react-three/fiber** - React renderer for Three.js (optional, evaluate)
- **@react-three/drei** - Useful helpers (OrbitControls, etc.)

**Models**:
- **GLTF/GLB format** - Compressed, web-optimized
- **Draco compression** - Further size reduction

**Controls**:
- **OrbitControls** - Mouse/touch rotation, zoom, pan
- **Raycaster** - Click detection on 3D objects

**Rendering**:
- **WebGLRenderer** - Hardware-accelerated
- **PerspectiveCamera** - Realistic perspective
- **AmbientLight + DirectionalLight** - Natural lighting

---

## File Structure

```
src/
├── components/
│   └── 3d/
│       ├── VehicleViewer.tsx          # Main 3D viewer component
│       ├── DamageMarker.tsx           # Individual damage marker
│       ├── DamageAnnotator.tsx        # Annotation UI (estimator)
│       ├── CustomerViewer.tsx         # Customer-facing viewer
│       ├── CameraControls.tsx         # Angle selector buttons
│       ├── DamageMarkerPanel.tsx      # List of markers
│       └── ModelLoader.tsx            # Vehicle model loader
├── lib/
│   └── 3d/
│       ├── scene-setup.ts             # Scene/camera/renderer setup
│       ├── vehicle-models.ts          # Model loading utilities
│       ├── damage-markers.ts          # Marker creation/management
│       ├── screenshot-capture.ts      # Screenshot utilities
│       └── camera-presets.ts          # Preset camera angles
├── public/
│   └── models/
│       ├── sedan.glb                  # Generic sedan model
│       ├── suv.glb                    # Generic SUV model
│       ├── truck.glb                  # Generic truck model
│       └── coupe.glb                  # Generic coupe model
└── app/
    └── api/
        └── damage-annotations/
            ├── route.ts               # Save/load annotations
            └── [id]/route.ts          # Get specific annotation
```

---

## API Endpoints

### POST /api/damage-annotations
Save damage annotations for an estimate.

**Request**:
```json
{
  "estimateId": "uuid",
  "vehicleType": "sedan",
  "markers": [
    {
      "id": "marker_1",
      "position": { "x": 1.5, "y": 0.5, "z": 2.0 },
      "damageType": "dent",
      "severity": "moderate",
      "description": "Large dent on driver door",
      "partName": "door_left_front"
    }
  ],
  "cameraPosition": { "x": 5, "y": 3, "z": 5 }
}
```

### GET /api/damage-annotations?estimateId=xxx
Load damage annotations for an estimate.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "estimateId": "uuid",
    "vehicleType": "sedan",
    "markers": [...],
    "cameraPosition": {...}
  }
}
```

---

## Usage Example

```tsx
import VehicleViewer from '@/components/3d/VehicleViewer';

// In estimate detail page
<VehicleViewer
  estimateId={estimate.id}
  vehicleType={getVehicleType(estimate.vehicle_make)} // sedan/suv/truck/coupe
  mode="annotate" // or "view" for customer
  onSave={(annotations) => saveAnnotations(annotations)}
/>
```

---

## Success Metrics

**Technical**:
- 3D scene loads in < 2 seconds
- 60 FPS rendering on mid-range devices
- Model file sizes < 2MB each
- Touch gestures work on mobile

**Business**:
- Estimators use 3D viewer on 50%+ of estimates
- Customers rate visualization as "helpful" (>80%)
- Reduced estimate clarification calls by 30%
- Higher estimate approval rate (+10%)

---

## Completion Criteria

- [ ] Three.js integrated and working
- [ ] 4 generic vehicle models loaded
- [ ] Damage annotation functional
- [ ] 8 camera preset angles
- [ ] Screenshot capture working
- [ ] Customer viewer built
- [ ] Database schema created
- [ ] API endpoints functional
- [ ] Mobile-responsive
- [ ] PDF export integration
- [ ] Documentation complete

---

## Future Enhancements

**Real Vehicle Models**:
- Partner with 3D model providers
- VIN-based model selection
- Manufacturer-specific models
- 10,000+ vehicle library

**Advanced Features**:
- AR view (phone camera overlay)
- Damage measurement tools
- Before/after comparison
- Animated repair sequence
- VR support for training

---

**Phase 8 Start**: 2025-11-19
**Estimated Completion**: 2025-12-03 (2 weeks, but aiming for 5 days!)
