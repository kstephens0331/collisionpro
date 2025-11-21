"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Save } from "lucide-react";

export interface DamageMarker {
  id: string;
  part: string;
  view: "front" | "left" | "right" | "top" | "rear";
  damageType: string;
  severity: string;
  description: string;
  x: number; // Percentage
  y: number; // Percentage
  color: string;
}

interface VehicleDiagram2DProps {
  estimateId: string;
  initialMarkers?: DamageMarker[];
  onSave?: (markers: DamageMarker[]) => void;
}

const VIEWS = [
  { id: "front", label: "Front", diagram: "/diagrams/sedan-front.svg" },
  { id: "left", label: "Left Side", diagram: "/diagrams/sedan-left.svg" },
  { id: "right", label: "Right Side", diagram: "/diagrams/sedan-right.svg" },
  { id: "top", label: "Top", diagram: "/diagrams/sedan-top.svg" },
  { id: "rear", label: "Rear", diagram: "/diagrams/sedan-rear.svg" },
] as const;

const DAMAGE_TYPES = {
  dent: { label: "Dent", color: "#fbbf24" },
  scratch: { label: "Scratch", color: "#f59e0b" },
  crack: { label: "Crack/Break", color: "#ef4444" },
  missing: { label: "Missing", color: "#dc2626" },
  paint: { label: "Paint Damage", color: "#3b82f6" },
  rust: { label: "Rust", color: "#b45309" },
};

const SEVERITY_LEVELS = {
  minor: { label: "Minor", color: "#10b981" },
  moderate: { label: "Moderate", color: "#f59e0b" },
  severe: { label: "Severe", color: "#ef4444" },
};

export default function VehicleDiagram2D({
  estimateId,
  initialMarkers = [],
  onSave,
}: VehicleDiagram2DProps) {
  const [currentView, setCurrentView] = useState<"front" | "left" | "right" | "top" | "rear">("front");
  const [markers, setMarkers] = useState<DamageMarker[]>(initialMarkers);
  const [addMode, setAddMode] = useState(false);
  const [newDamageType, setNewDamageType] = useState<string>("dent");
  const [newSeverity, setNewSeverity] = useState<string>("moderate");
  const [newDescription, setNewDescription] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Load SVG content
  useEffect(() => {
    const view = VIEWS.find((v) => v.id === currentView);
    if (view) {
      fetch(view.diagram)
        .then((res) => res.text())
        .then((svg) => setSvgContent(svg))
        .catch((err) => console.error("Error loading SVG:", err));
    }
  }, [currentView]);

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!addMode) return;

    const target = e.target as SVGElement;
    const partName = target.getAttribute("data-part");

    if (!partName) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const damageType = newDamageType as keyof typeof DAMAGE_TYPES;
    const severity = newSeverity as keyof typeof SEVERITY_LEVELS;

    const newMarker: DamageMarker = {
      id: `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      part: partName,
      view: currentView,
      damageType,
      severity,
      description: newDescription || `${DAMAGE_TYPES[damageType].label} on ${partName}`,
      x,
      y,
      color: SEVERITY_LEVELS[severity].color,
    };

    setMarkers([...markers, newMarker]);
    setNewDescription("");
    setAddMode(false);
  };

  const handleDeleteMarker = (id: string) => {
    setMarkers(markers.filter((m) => m.id !== id));
    if (selectedMarker === id) {
      setSelectedMarker(null);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(markers);
    }
  };

  const currentViewMarkers = markers.filter((m) => m.view === currentView);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Diagram Viewer */}
      <div className="lg:col-span-2">
        <Card className="p-4">
          {/* View Selector */}
          <div className="flex gap-2 mb-4">
            {VIEWS.map((view) => (
              <Button
                key={view.id}
                variant={currentView === view.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView(view.id as typeof currentView)}
              >
                {view.label}
              </Button>
            ))}
          </div>

          {/* Diagram Container */}
          <div
            ref={containerRef}
            className="relative border-2 border-gray-200 rounded-lg bg-white overflow-hidden"
            style={{ cursor: addMode ? "crosshair" : "default" }}
            onClick={handleDiagramClick}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />

          {/* Markers Overlay */}
          <div className="relative">
            {currentViewMarkers.map((marker) => (
              <div
                key={marker.id}
                className={`absolute w-6 h-6 rounded-full border-2 border-white cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                  selectedMarker === marker.id ? "ring-4 ring-blue-500" : ""
                }`}
                style={{
                  backgroundColor: marker.color,
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMarker(marker.id);
                }}
                title={`${marker.damageType} - ${marker.severity}`}
              />
            ))}
          </div>

          {/* Add Mode Instructions */}
          {addMode && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Click on a highlighted part</strong> to mark damage
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Control Panel */}
      <div className="space-y-4">
        {/* Add Damage Controls */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Add Damage</h3>
          <div className="space-y-3">
            <div>
              <Label>Damage Type</Label>
              <Select value={newDamageType} onValueChange={setNewDamageType}>
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
              <Select value={newSeverity} onValueChange={setNewSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SEVERITY_LEVELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description (optional)</Label>
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
          </div>
        </Card>

        {/* Markers List */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Damage Markers ({markers.length})</h3>
            {markers.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
                  onClick={() => {
                    setSelectedMarker(marker.id);
                    setCurrentView(marker.view);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: marker.color }}
                        />
                        <span className="text-sm font-medium">
                          {DAMAGE_TYPES[marker.damageType as keyof typeof DAMAGE_TYPES].label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {SEVERITY_LEVELS[marker.severity as keyof typeof SEVERITY_LEVELS].label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {marker.part} ({marker.view} view)
                      </p>
                      {marker.description && (
                        <p className="text-xs text-gray-600 mt-1">
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
                      <X className="h-3 w-3" />
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
