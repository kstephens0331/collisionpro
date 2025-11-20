"use client";

import { useState, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CircleDot,
  Minus,
  Split,
  X,
  Save,
  Trash2,
  Plus,
} from "lucide-react";
import {
  type DamageMarker,
  type DamageType,
  type DamageSeverity,
  DAMAGE_TYPES,
  SEVERITY_LEVELS,
  createDamageMarker,
  getMarkerColor,
} from "@/lib/3d/damage-markers";
import { trackViewerOpened, trackMarkerAdded, trackMarkersSaved } from "@/lib/analytics/3d-viewer-analytics";

interface DamageAnnotatorProps {
  estimateId: string;
  vehicleType?: "sedan" | "suv" | "truck" | "coupe";
  initialMarkers?: DamageMarker[];
  onSave?: (markers: DamageMarker[]) => void;
}

export default function DamageAnnotator({
  estimateId,
  vehicleType = "sedan",
  initialMarkers = [],
  onSave,
}: DamageAnnotatorProps) {
  const [markers, setMarkers] = useState<DamageMarker[]>(initialMarkers);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [newDamageType, setNewDamageType] = useState<DamageType>("dent");
  const [newSeverity, setNewSeverity] = useState<DamageSeverity>("moderate");
  const [newDescription, setNewDescription] = useState("");

  // Track viewer opened on mount
  useEffect(() => {
    trackViewerOpened(estimateId, vehicleType);
  }, [estimateId, vehicleType]);

  const handleSave = () => {
    if (onSave) {
      onSave(markers);
      // Track markers saved
      trackMarkersSaved(estimateId, markers.length);
    }
  };

  const handleAddMarker = (marker: DamageMarker) => {
    setMarkers([...markers, marker]);
    setAddMode(false);
    setNewDescription("");
    // Track marker added
    trackMarkerAdded(estimateId, marker.damageType);
  };

  const handleDeleteMarker = (id: string) => {
    setMarkers(markers.filter((m) => m.id !== id));
    if (selectedMarker === id) {
      setSelectedMarker(null);
    }
  };

  const handleUpdateMarker = (id: string, updates: Partial<DamageMarker>) => {
    setMarkers(markers.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  return (
    <div className="flex gap-4 h-[600px]">
      {/* 3D Viewer */}
      <div className="flex-1">
        <Card className="h-full overflow-hidden">
          <Canvas
            shadows
            className="bg-gradient-to-b from-blue-50 to-gray-100"
            gl={{ preserveDrawingBuffer: true }}
          >
            <SceneWithMarkers
              markers={markers}
              selectedMarker={selectedMarker}
              addMode={addMode}
              newDamageType={newDamageType}
              newSeverity={newSeverity}
              newDescription={newDescription}
              onMarkerClick={(id) => setSelectedMarker(id)}
              onAddMarker={handleAddMarker}
            />

            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
            />

            {/* Environment */}
            <Environment preset="city" />

            {/* Grid */}
            <gridHelper args={[20, 20, "#cccccc", "#eeeeee"]} />

            {/* Controls */}
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={3}
              maxDistance={15}
              maxPolarAngle={Math.PI / 2.1}
            />
          </Canvas>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="w-80 space-y-4">
        {/* Add Marker Controls */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Add Damage Marker</h3>
          <div className="space-y-3">
            <div>
              <Label>Damage Type</Label>
              <Select
                value={newDamageType}
                onValueChange={(v) => setNewDamageType(v as DamageType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DAMAGE_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Severity</Label>
              <Select
                value={newSeverity}
                onValueChange={(v) => setNewSeverity(v as DamageSeverity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SEVERITY_LEVELS).map(([key, { label, color }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g., Large dent on driver door"
              />
            </div>

            <Button
              className="w-full"
              variant={addMode ? "destructive" : "default"}
              onClick={() => setAddMode(!addMode)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {addMode ? "Cancel" : "Click Vehicle to Add"}
            </Button>

            {addMode && (
              <p className="text-xs text-gray-600 text-center">
                Click anywhere on the vehicle to place marker
              </p>
            )}
          </div>
        </Card>

        {/* Markers List */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">
              Damage Markers ({markers.length})
            </h3>
            <Button size="sm" variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {markers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No damage markers yet
              </p>
            ) : (
              markers.map((marker) => (
                <div
                  key={marker.id}
                  className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                    selectedMarker === marker.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedMarker(marker.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: marker.color }}
                        />
                        <span className="text-sm font-medium">
                          {DAMAGE_TYPES[marker.damageType].label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {SEVERITY_LEVELS[marker.severity].label}
                        </span>
                      </div>
                      {marker.description && (
                        <p className="text-xs text-gray-600">
                          {marker.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMarker(marker.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Scene with interactive markers
 */
function SceneWithMarkers({
  markers,
  selectedMarker,
  addMode,
  newDamageType,
  newSeverity,
  newDescription,
  onMarkerClick,
  onAddMarker,
}: {
  markers: DamageMarker[];
  selectedMarker: string | null;
  addMode: boolean;
  newDamageType: DamageType;
  newSeverity: DamageSeverity;
  newDescription: string;
  onMarkerClick: (id: string) => void;
  onAddMarker: (marker: DamageMarker) => void;
}) {
  const { camera, raycaster, scene } = useThree();
  const vehicleRef = useRef<THREE.Group>(null);

  const handleClick = (event: any) => {
    if (!addMode || !vehicleRef.current) return;

    // Calculate mouse position in normalized device coordinates
    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to find intersection with vehicle
    const mouse = new THREE.Vector2(x, y);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(vehicleRef.current.children, true);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const newMarker = createDamageMarker(
        { x: point.x, y: point.y, z: point.z },
        newDamageType,
        newSeverity,
        newDescription
      );
      onAddMarker(newMarker);
    }
  };

  return (
    <group onClick={handleClick}>
      {/* Vehicle */}
      <GenericVehicle ref={vehicleRef} />

      {/* Damage Markers */}
      {markers.map((marker) => (
        <DamageMarkerMesh
          key={marker.id}
          marker={marker}
          selected={selectedMarker === marker.id}
          onClick={() => onMarkerClick(marker.id)}
        />
      ))}
    </group>
  );
}

/**
 * 3D Damage Marker
 */
function DamageMarkerMesh({
  marker,
  selected,
  onClick,
}: {
  marker: DamageMarker;
  selected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh
      ref={meshRef}
      position={[marker.position.x, marker.position.y, marker.position.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <sphereGeometry args={[selected ? 0.15 : 0.1, 16, 16]} />
      <meshStandardMaterial
        color={marker.color}
        emissive={marker.color}
        emissiveIntensity={selected ? 0.5 : 0.2}
      />

      {/* Label */}
      <Html distanceFactor={10}>
        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none">
          {DAMAGE_TYPES[marker.damageType].label}
        </div>
      </Html>
    </mesh>
  );
}

/**
 * Generic vehicle (same as VehicleViewer but as forwardRef for raycasting)
 */
import { forwardRef } from "react";

const GenericVehicle = forwardRef<THREE.Group>((props, ref) => {
  return (
    <group ref={ref}>
      {/* Car Body */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.8, 4]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Car Top */}
      <mesh position={[0, 1.2, -0.3]} castShadow>
        <boxGeometry args={[1.8, 0.6, 2]} />
        <meshStandardMaterial color="#1e40af" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
    </group>
  );
});

GenericVehicle.displayName = "GenericVehicle";
