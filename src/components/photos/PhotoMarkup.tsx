"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Circle,
  Square,
  Type,
  Pencil,
  ArrowRight,
  Undo,
  Redo,
  Download,
  Save,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface Annotation {
  id: string;
  type: "circle" | "rectangle" | "arrow" | "text" | "freehand";
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  text?: string;
  points?: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

interface PhotoMarkupProps {
  imageUrl: string;
  estimateId: string;
  photoId: string;
  existingAnnotations?: Annotation[];
  onSave?: (annotations: Annotation[]) => void;
  readOnly?: boolean;
}

export default function PhotoMarkup({
  imageUrl,
  estimateId,
  photoId,
  existingAnnotations = [],
  onSave,
  readOnly = false,
}: PhotoMarkupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(existingAnnotations);
  const [selectedTool, setSelectedTool] = useState<Annotation["type"] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [color, setColor] = useState("#FF0000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [history, setHistory] = useState<Annotation[][]>([existingAnnotations]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      redrawCanvas(img, annotations);
    };
  }, [imageUrl]);

  // Redraw canvas when annotations change
  useEffect(() => {
    if (image) {
      redrawCanvas(image, annotations);
    }
  }, [annotations, image, scale]);

  const redrawCanvas = (img: HTMLImageElement, anns: Annotation[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match container
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = (container.clientWidth / img.width) * img.height;
    }

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw all annotations
    anns.forEach((ann) => drawAnnotation(ctx, ann, canvas.width / img.width));
  };

  const drawAnnotation = (
    ctx: CanvasRenderingContext2D,
    ann: Annotation,
    scaleRatio: number
  ) => {
    ctx.strokeStyle = ann.color;
    ctx.fillStyle = ann.color;
    ctx.lineWidth = ann.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const x = ann.x * scaleRatio;
    const y = ann.y * scaleRatio;

    switch (ann.type) {
      case "circle":
        const radius = (ann.width || 50) * scaleRatio;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;

      case "rectangle":
        const width = (ann.width || 100) * scaleRatio;
        const height = (ann.height || 100) * scaleRatio;
        ctx.strokeRect(x, y, width, height);
        break;

      case "arrow":
        if (ann.endX && ann.endY) {
          const endX = ann.endX * scaleRatio;
          const endY = ann.endY * scaleRatio;
          drawArrow(ctx, x, y, endX, endY);
        }
        break;

      case "text":
        if (ann.text) {
          ctx.font = `${20 * scaleRatio}px Arial`;
          ctx.fillText(ann.text, x, y);
        }
        break;

      case "freehand":
        if (ann.points && ann.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x * scaleRatio, ann.points[0].y * scaleRatio);
          ann.points.forEach((point) => {
            ctx.lineTo(point.x * scaleRatio, point.y * scaleRatio);
          });
          ctx.stroke();
        }
        break;
    }
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleRatio = image.width / canvas.width;

    return {
      x: (e.clientX - rect.left) * scaleRatio,
      y: (e.clientY - rect.top) * scaleRatio,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTool || readOnly) return;

    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);

    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      type: selectedTool,
      x,
      y,
      color,
      strokeWidth,
      points: selectedTool === "freehand" ? [{ x, y }] : undefined,
    };

    setCurrentAnnotation(newAnnotation);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;

    const { x, y } = getCanvasCoordinates(e);

    if (currentAnnotation.type === "freehand") {
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [...(currentAnnotation.points || []), { x, y }],
      });
    } else if (currentAnnotation.type === "arrow") {
      setCurrentAnnotation({
        ...currentAnnotation,
        endX: x,
        endY: y,
      });
    } else {
      setCurrentAnnotation({
        ...currentAnnotation,
        width: Math.abs(x - currentAnnotation.x),
        height: Math.abs(y - currentAnnotation.y),
      });
    }

    // Redraw with current annotation
    if (image) {
      redrawCanvas(image, [...annotations, currentAnnotation]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    if (currentAnnotation.type === "text") {
      const text = prompt("Enter text:");
      if (text) {
        const finalAnnotation = { ...currentAnnotation, text };
        addToHistory([...annotations, finalAnnotation]);
        setAnnotations([...annotations, finalAnnotation]);
      }
    } else {
      addToHistory([...annotations, currentAnnotation]);
      setAnnotations([...annotations, currentAnnotation]);
    }

    setIsDrawing(false);
    setCurrentAnnotation(null);
    setSelectedTool(null);
  };

  const addToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  const handleClear = () => {
    if (confirm("Clear all annotations?")) {
      addToHistory([]);
      setAnnotations([]);
    }
  };

  const handleSave = async () => {
    if (onSave) {
      onSave(annotations);
    }

    // Also save to API
    try {
      await fetch(`/api/estimates/${estimateId}/photos/${photoId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotations }),
      });
      alert("Annotations saved!");
    } catch (error) {
      console.error("Failed to save annotations:", error);
      alert("Failed to save annotations");
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `photo-${photoId}-annotated.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Photo Markup & Annotations</span>
          <span className="text-sm font-normal text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            🚀 EXCLUSIVE FEATURE
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg">
            {/* Drawing Tools */}
            <div className="flex gap-2">
              <Button
                variant={selectedTool === "circle" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTool("circle")}
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === "rectangle" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTool("rectangle")}
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === "arrow" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTool("arrow")}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === "freehand" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTool("freehand")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTool("text")}
              >
                <Type className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {/* Color Picker */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Color:</label>
              {["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#000000"].map(
                (c) => (
                  <button
                    key={c}
                    className={`w-8 h-8 rounded border-2 ${
                      color === c ? "border-gray-900" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                )
              )}
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={historyIndex === 0}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {/* Save & Download */}
            <div className="flex gap-2">
              <Button variant="default" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full cursor-crosshair"
            style={{ maxHeight: "600px" }}
          />
        </div>

        {/* Info */}
        <div className="text-sm text-gray-600">
          <p>
            <strong>Instructions:</strong> Select a tool, then click and drag on the
            image to mark damage areas. Use different colors to indicate severity or
            damage types.
          </p>
          {annotations.length > 0 && (
            <p className="mt-2">
              <strong>Annotations:</strong> {annotations.length} mark
              {annotations.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
