"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import { Vector3 } from "three";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Box,
  Loader2,
  RotateCcw,
  Camera,
} from "lucide-react";
import { CAMERA_PRESETS, type CameraPosition } from "@/lib/3d/camera-presets";
import { captureScreenshot, downloadScreenshot } from "@/lib/3d/screenshot-capture";
import { type DamageMarker, DAMAGE_TYPES } from "@/lib/3d/damage-markers";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import RealisticVehicle from "@/components/3d/models/RealisticVehicle";

interface VehicleViewerProps {
  vehicleType?: "sedan" | "suv" | "truck" | "coupe";
  mode?: "annotate" | "view";
  estimateId?: string;
  onSave?: (data: any) => void;
}

export default function VehicleViewer({
  vehicleType = "sedan",
  mode = "view",
  estimateId,
  onSave,
}: VehicleViewerProps) {
  const [selectedCamera, setSelectedCamera] = useState<string>("isometric");
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<DamageMarker[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load damage markers if in view mode
  useEffect(() => {
    if (mode === "view" && estimateId) {
      fetch(`/api/damage-annotations?estimateId=${estimateId}`)
        .then(r => r.json())
        .then(({ data }) => {
          if (data?.markers) {
            setMarkers(data.markers);
          }
        })
        .catch(err => console.error('Failed to load damage markers:', err));
    }
  }, [estimateId, mode]);

  const handleCameraChange = (presetName: string) => {
    setSelectedCamera(presetName);
  };

  const handleScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const filename = `vehicle-${vehicleType}-${Date.now()}.png`;
      downloadScreenshot(dataUrl, filename);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  };

  return (
    <Card className="w-full h-[600px] overflow-hidden">
      <CardContent className="p-0 relative h-full">
        {/* 3D Canvas */}
        <Canvas
          shadows
          className="bg-gradient-to-b from-blue-50 to-gray-100"
          gl={{ preserveDrawingBuffer: true }} // For screenshots
        >
          <Suspense fallback={null}>
            {/* Scene Setup */}
            <SceneSetup selectedCamera={selectedCamera} />

            {/* Realistic Vehicle Model */}
            <RealisticVehicle vehicleType={vehicleType} />

            {/* Damage Markers (view mode) */}
            {mode === "view" && markers.map((marker) => (
              <DamageMarkerMesh key={marker.id} marker={marker} />
            ))}

            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize={[2048, 2048]}
            />
            <directionalLight position={[-10, 10, -5]} intensity={0.5} />

            {/* Environment */}
            <Environment preset="city" />

            {/* Grid Helper (only in annotate mode) */}
            {mode === "annotate" && (
              <gridHelper args={[20, 20, "#cccccc", "#eeeeee"]} />
            )}

            {/* Camera Controls */}
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={3}
              maxDistance={15}
              maxPolarAngle={Math.PI / 2.1} // Prevent going under ground
            />
          </Suspense>
        </Canvas>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Loading 3D viewer...</p>
            </div>
          </div>
        )}

        {/* Camera Preset Buttons */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <CameraButton
            icon={<ArrowUp className="h-4 w-4" />}
            label="Front"
            active={selectedCamera === "front"}
            onClick={() => handleCameraChange("front")}
          />
          <CameraButton
            icon={<ArrowDown className="h-4 w-4" />}
            label="Rear"
            active={selectedCamera === "rear"}
            onClick={() => handleCameraChange("rear")}
          />
          <CameraButton
            icon={<ArrowLeft className="h-4 w-4" />}
            label="Left"
            active={selectedCamera === "left"}
            onClick={() => handleCameraChange("left")}
          />
          <CameraButton
            icon={<ArrowRight className="h-4 w-4" />}
            label="Right"
            active={selectedCamera === "right"}
            onClick={() => handleCameraChange("right")}
          />
          <CameraButton
            icon={<Maximize2 className="h-4 w-4" />}
            label="Top"
            active={selectedCamera === "top"}
            onClick={() => handleCameraChange("top")}
          />
          <CameraButton
            icon={<Box className="h-4 w-4" />}
            label="3/4"
            active={selectedCamera === "isometric"}
            onClick={() => handleCameraChange("isometric")}
          />
          <CameraButton
            icon={<RotateCcw className="h-4 w-4" />}
            label="Reset"
            onClick={() => handleCameraChange("isometric")}
          />
          <div className="h-px bg-gray-300 my-1" />
          <CameraButton
            icon={<Camera className="h-4 w-4" />}
            label="Photo"
            onClick={handleScreenshot}
          />
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-600 shadow-lg">
          <p className="font-medium mb-1">Controls:</p>
          <ul className="space-y-1">
            <li>• <strong>Left Click + Drag</strong>: Rotate</li>
            <li>• <strong>Right Click + Drag</strong>: Pan</li>
            <li>• <strong>Scroll</strong>: Zoom</li>
            <li>• <strong>Click Buttons</strong>: Preset angles</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Scene setup component (handles camera transitions)
 */
function SceneSetup({ selectedCamera }: { selectedCamera: string }) {
  const { camera, gl } = useThree();
  const targetPosition = useRef(new Vector3());
  const targetLookAt = useRef(new Vector3());
  const currentLookAt = useRef(new Vector3(0, 0.8, 0));
  const transitioning = useRef(false);
  const transitionProgress = useRef(0);

  useEffect(() => {
    const preset = CAMERA_PRESETS[selectedCamera];
    if (preset) {
      targetPosition.current.set(...preset.position);
      targetLookAt.current.set(...preset.target);
      transitioning.current = true;
      transitionProgress.current = 0;
    }
  }, [selectedCamera]);

  useFrame(() => {
    if (transitioning.current) {
      transitionProgress.current += 0.05; // Smooth transition

      if (transitionProgress.current >= 1) {
        transitioning.current = false;
        transitionProgress.current = 1;
      }

      // Lerp camera position
      camera.position.lerp(targetPosition.current, transitionProgress.current);

      // Lerp look-at target
      currentLookAt.current.lerp(targetLookAt.current, transitionProgress.current);
      camera.lookAt(currentLookAt.current);

      camera.updateProjectionMatrix();
    }
  });

  return null;
}

// GenericVehicle removed - now using RealisticVehicle component

/**
 * 3D Damage Marker (for view mode)
 */
function DamageMarkerMesh({ marker }: { marker: DamageMarker }) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh
      ref={meshRef}
      position={[marker.position.x, marker.position.y, marker.position.z]}
    >
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial
        color={marker.color}
        emissive={marker.color}
        emissiveIntensity={0.3}
      />

      {/* Label */}
      <Html distanceFactor={10}>
        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none">
          {DAMAGE_TYPES[marker.damageType].label}
          {marker.description && ` - ${marker.description}`}
        </div>
      </Html>
    </mesh>
  );
}

/**
 * Camera preset button
 */
function CameraButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className={`
        flex items-center gap-2 min-w-[80px]
        ${active ? "bg-blue-600 text-white" : "bg-white/90 backdrop-blur-sm"}
      `}
      title={label}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}
