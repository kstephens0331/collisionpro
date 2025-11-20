"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Zap,
  DollarSign,
  Wrench,
  Package,
  Info,
} from "lucide-react";

interface DamageDetection {
  id: string;
  type: string;
  location: string;
  confidence: number;
  severity: "minor" | "moderate" | "severe";
  description: string;
  suggestedOperations: string[];
  suggestedParts: string[];
  estimatedCost: {
    labor: number;
    parts: number;
    paint: number;
    total: number;
  };
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface AnalysisResult {
  imageId: string;
  analyzedAt: string;
  processingTimeMs: number;
  damages: DamageDetection[];
  overallConfidence: number;
  vehicleDetected: boolean;
  warnings: string[];
}

interface DamageAnalyzerProps {
  estimateId: string;
  onDamageDetected?: (damages: DamageDetection[]) => void;
  onOperationsSelected?: (operations: string[]) => void;
  onPartsSelected?: (parts: string[]) => void;
}

export default function DamageAnalyzer({
  estimateId,
  onDamageDetected,
  onOperationsSelected,
  onPartsSelected,
}: DamageAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  }, []);

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/ai/analyze-damage", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data.data);
      onDamageDetected?.(data.data.damages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image");
    } finally {
      setAnalyzing(false);
    }
  };

  const addAllOperations = () => {
    if (!result) return;
    const operations = result.damages.flatMap((d) => d.suggestedOperations);
    const uniqueOps = [...new Set(operations)];
    onOperationsSelected?.(uniqueOps);
  };

  const addAllParts = () => {
    if (!result) return;
    const parts = result.damages.flatMap((d) => d.suggestedParts);
    const uniqueParts = [...new Set(parts)];
    onPartsSelected?.(uniqueParts);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "moderate":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "severe":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const totalEstimate = result
    ? result.damages.reduce((sum, d) => sum + d.estimatedCost.total, 0)
    : 0;

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Zap className="h-5 w-5" />
          AI Damage Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {!result && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              selectedFile
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-blue-400"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Selected damage photo"
                  className="max-h-48 mx-auto rounded-lg shadow-sm"
                />
                <p className="text-sm text-gray-600">{selectedFile?.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Camera className="h-10 w-10 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">
                  Drag and drop a damage photo or
                </p>
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    browse to upload
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* Analyze Button */}
        {selectedFile && !result && (
          <Button
            onClick={analyzeImage}
            disabled={analyzing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing damage...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Analyze Photo
              </>
            )}
          </Button>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  {result.damages.length} damage{result.damages.length !== 1 ? "s" : ""} detected
                </span>
              </div>
              <div className="text-sm text-green-600">
                {result.overallConfidence}% confidence
              </div>
            </div>

            {/* Warnings */}
            {result.warnings.map((warning, i) => (
              <div
                key={i}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm flex items-start gap-2"
              >
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {warning}
              </div>
            ))}

            {/* Damage List */}
            <div className="space-y-3">
              {result.damages.map((damage) => (
                <div
                  key={damage.id}
                  className={`p-4 border rounded-lg ${getSeverityColor(damage.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{damage.description}</h4>
                      <p className="text-sm opacity-75">
                        {damage.confidence}% confidence
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium uppercase">
                      {damage.severity}
                    </span>
                  </div>

                  {/* Suggested Operations */}
                  {damage.suggestedOperations.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1 text-xs font-medium mb-1">
                        <Wrench className="h-3 w-3" />
                        Operations
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {damage.suggestedOperations.map((op, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white/50 rounded text-xs"
                          >
                            {op}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Parts */}
                  {damage.suggestedParts.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1 text-xs font-medium mb-1">
                        <Package className="h-3 w-3" />
                        Parts
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {damage.suggestedParts.map((part, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white/50 rounded text-xs"
                          >
                            {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cost Estimate */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-current/10">
                    <div className="flex items-center gap-1 text-xs">
                      <DollarSign className="h-3 w-3" />
                      Estimated Cost
                    </div>
                    <span className="font-medium">
                      ${damage.estimatedCost.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Estimate */}
            <div className="p-4 bg-gray-100 rounded-lg flex items-center justify-between">
              <span className="font-medium">Total Estimated Repair</span>
              <span className="text-xl font-bold text-blue-600">
                ${totalEstimate.toLocaleString()}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={addAllOperations}
                className="flex-1"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Add All Operations
              </Button>
              <Button
                variant="outline"
                onClick={addAllParts}
                className="flex-1"
              >
                <Package className="h-4 w-4 mr-2" />
                Add All Parts
              </Button>
            </div>

            {/* Analyze Another */}
            <Button
              variant="ghost"
              onClick={() => {
                setResult(null);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              Analyze Another Photo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
