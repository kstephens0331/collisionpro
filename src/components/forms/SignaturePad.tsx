"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenTool, Trash2, Save, Download } from "lucide-react";

interface SignaturePadProps {
  onSave?: (signatureDataUrl: string, signerName: string) => void;
  formType?: string;
  estimateId?: string;
}

export default function SignaturePad({
  onSave,
  formType = "Authorization",
  estimateId,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 200;

        // Redraw background
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "#e5e7eb";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(20, canvas.height - 40);
          ctx.lineTo(canvas.width - 20, canvas.height - 40);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    setHasSignature(true);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and redraw background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 40);
    ctx.lineTo(canvas.width - 20, canvas.height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    setHasSignature(false);
  };

  const saveSignature = async () => {
    if (!hasSignature) {
      alert("Please provide a signature");
      return;
    }

    if (!signerName.trim()) {
      alert("Please enter your name");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get signature as data URL
    const signatureDataUrl = canvas.toDataURL("image/png");

    if (onSave) {
      setSaving(true);
      try {
        await onSave(signatureDataUrl, signerName);
      } finally {
        setSaving(false);
      }
    }
  };

  const downloadSignature = () => {
    if (!hasSignature) {
      alert("Please provide a signature first");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `signature-${formType}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Digital Signature
          </span>
          <span className="text-sm font-normal text-green-600 bg-green-50 px-3 py-1 rounded-full">
            ✅ PAPERLESS
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signature Canvas */}
        <div className="space-y-2">
          <Label>Signature *</Label>
          <div className="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full cursor-crosshair touch-none"
              style={{ touchAction: "none" }}
            />
          </div>
          <p className="text-xs text-gray-500">
            Sign above using your mouse, trackpad, or finger (on touchscreen)
          </p>
        </div>

        {/* Signer Name */}
        <div className="space-y-2">
          <Label htmlFor="signerName">Full Name *</Label>
          <Input
            id="signerName"
            placeholder="Enter your full name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
          />
        </div>

        {/* Agreement Text */}
        <div className="p-4 bg-gray-50 rounded-lg border text-sm">
          <p className="font-semibold mb-2">By signing, you agree to:</p>
          <ul className="space-y-1 ml-4 text-gray-700">
            <li>• Authorize the repairs outlined in estimate #{estimateId || "XXXXX"}</li>
            <li>• Accept financial responsibility for the repair costs</li>
            <li>• Acknowledge that additional charges may apply if hidden damage is found</li>
            <li>• Agree to the shop's terms and conditions</li>
          </ul>
          <p className="mt-3 text-xs text-gray-600">
            <strong>Date:</strong> {new Date().toLocaleDateString()} at{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={clearSignature} variant="outline" disabled={!hasSignature}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button onClick={downloadSignature} variant="outline" disabled={!hasSignature}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={saveSignature}
            disabled={!hasSignature || !signerName.trim() || saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Signature
              </>
            )}
          </Button>
        </div>

        {/* Benefits */}
        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
          <p className="font-semibold mb-1">✅ Benefits of Digital Signatures:</p>
          <ul className="ml-4 space-y-0.5">
            <li>• Instant - no printing, scanning, or mailing</li>
            <li>• Legally binding in all 50 states</li>
            <li>• Timestamped for your protection</li>
            <li>• Automatically attached to your estimate</li>
            <li>• Eco-friendly - save paper!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
