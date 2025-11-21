"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paintbrush, Plus, Trash2, Calculator } from "lucide-react";
import {
  calculatePaintEstimate,
  PanelPaintTime,
  PaintEstimateResult,
  STANDARD_PANELS,
  DEFAULT_MATERIAL_COSTS,
  formatHours,
  formatCurrency,
} from "@/lib/paint-calculator";

interface PaintCalculatorProps {
  estimateId: string;
  laborRate?: number;
  onSave?: (result: PaintEstimateResult) => void;
}

export default function PaintCalculator({
  estimateId,
  laborRate = 65,
  onSave,
}: PaintCalculatorProps) {
  const [selectedPanels, setSelectedPanels] = useState<PanelPaintTime[]>([]);
  const [paintType, setPaintType] = useState<'solid' | 'metallic' | 'pearl' | 'tri-coat'>('metallic');
  const [includeBlend, setIncludeBlend] = useState(true);
  const [customLaborRate, setCustomLaborRate] = useState(laborRate);
  const [estimate, setEstimate] = useState<PaintEstimateResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleAddPanel = (panelName: string) => {
    const panelData = STANDARD_PANELS[panelName];
    if (!panelData) return;

    const newPanel: PanelPaintTime = {
      partName: panelName,
      ...panelData,
    };

    setSelectedPanels([...selectedPanels, newPanel]);
  };

  const handleRemovePanel = (index: number) => {
    setSelectedPanels(selectedPanels.filter((_, i) => i !== index));
  };

  const handleCalculate = () => {
    if (selectedPanels.length === 0) {
      alert('Please add at least one panel');
      return;
    }

    const materialCosts = DEFAULT_MATERIAL_COSTS[paintType];

    const result = calculatePaintEstimate({
      panels: selectedPanels,
      paintType,
      materialCosts,
      laborRate: customLaborRate,
      includeBlend,
    });

    setEstimate(result);
    setShowResults(true);
  };

  const handleSaveEstimate = () => {
    if (estimate && onSave) {
      onSave(estimate);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Paint Material Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Paint Type Selection */}
          <div>
            <Label>Paint Type</Label>
            <Select value={paintType} onValueChange={(value: any) => setPaintType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid Color</SelectItem>
                <SelectItem value="metallic">Metallic</SelectItem>
                <SelectItem value="pearl">Pearl</SelectItem>
                <SelectItem value="tri-coat">Tri-Coat</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {paintType === 'solid' && 'Standard solid color (1x material cost)'}
              {paintType === 'metallic' && 'Metallic finish (1.2x material cost)'}
              {paintType === 'pearl' && 'Pearl finish (1.4x material cost)'}
              {paintType === 'tri-coat' && 'Tri-coat finish (1.8x material cost)'}
            </p>
          </div>

          {/* Labor Rate */}
          <div>
            <Label>Labor Rate ($/hr)</Label>
            <Input
              type="number"
              value={customLaborRate}
              onChange={(e) => setCustomLaborRate(parseFloat(e.target.value) || 0)}
              step="5"
            />
          </div>

          {/* Blend Adjacent Panels */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeBlend"
              checked={includeBlend}
              onChange={(e) => setIncludeBlend(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="includeBlend" className="cursor-pointer">
              Include blend time for adjacent panels
            </Label>
          </div>

          {/* Panel Selection */}
          <div>
            <Label>Add Panels to Paint</Label>
            <Select onValueChange={handleAddPanel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a panel..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(STANDARD_PANELS).map((panelName) => (
                  <SelectItem key={panelName} value={panelName}>
                    {panelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Panels List */}
          {selectedPanels.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2">
              <h4 className="font-medium text-sm">Selected Panels ({selectedPanels.length})</h4>
              {selectedPanels.map((panel, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div>
                    <p className="font-medium text-sm">{panel.partName}</p>
                    <p className="text-xs text-gray-600">
                      {formatHours(panel.prepTime + panel.paintTime + panel.finishTime)} • {panel.squareFeet} sq ft
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemovePanel(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Calculate Button */}
          <Button
            className="w-full"
            onClick={handleCalculate}
            disabled={selectedPanels.length === 0}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Paint Estimate
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {showResults && estimate && (
        <Card>
          <CardHeader>
            <CardTitle>Paint Estimate Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Panels</p>
                <p className="text-2xl font-bold">{estimate.totalPanels}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Area</p>
                <p className="text-2xl font-bold">{estimate.squareFeet.toFixed(1)} sq ft</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold">{estimate.totalLaborHours.toFixed(1)} hrs</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(estimate.totalCost)}</p>
              </div>
            </div>

            {/* Labor Breakdown */}
            <div>
              <h4 className="font-semibold mb-2">Labor Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Prep Time:</span>
                  <span className="font-medium">{formatHours(estimate.prepHours)} @ {formatCurrency(estimate.laborRate)}/hr = {formatCurrency(estimate.prepHours * estimate.laborRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paint Time:</span>
                  <span className="font-medium">{formatHours(estimate.paintHours)} @ {formatCurrency(estimate.laborRate)}/hr = {formatCurrency(estimate.paintHours * estimate.laborRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Finish Time:</span>
                  <span className="font-medium">{formatHours(estimate.finishHours)} @ {formatCurrency(estimate.laborRate)}/hr = {formatCurrency(estimate.finishHours * estimate.laborRate)}</span>
                </div>
                {estimate.blendHours > 0 && (
                  <div className="flex justify-between">
                    <span>Blend Time:</span>
                    <span className="font-medium">{formatHours(estimate.blendHours)} @ {formatCurrency(estimate.laborRate)}/hr = {formatCurrency(estimate.blendHours * estimate.laborRate)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold">
                  <span>Total Labor:</span>
                  <span>{formatCurrency(estimate.totalLaborCost)}</span>
                </div>
              </div>
            </div>

            {/* Material Breakdown */}
            <div>
              <h4 className="font-semibold mb-2">Material Costs</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base Coat:</span>
                  <span className="font-medium">{formatCurrency(estimate.baseCoatCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Clear Coat:</span>
                  <span className="font-medium">{formatCurrency(estimate.clearCoatCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Primer:</span>
                  <span className="font-medium">{formatCurrency(estimate.primerCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sealer:</span>
                  <span className="font-medium">{formatCurrency(estimate.sealerCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reducer:</span>
                  <span className="font-medium">{formatCurrency(estimate.reducerCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hardener:</span>
                  <span className="font-medium">{formatCurrency(estimate.hardenerCost)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold">
                  <span>Total Materials:</span>
                  <span>{formatCurrency(estimate.totalMaterialCost)}</span>
                </div>
              </div>
            </div>

            {/* Panel Breakdown */}
            <div>
              <h4 className="font-semibold mb-2">Per-Panel Breakdown</h4>
              <div className="space-y-2">
                {estimate.panelBreakdown.map((panel, index) => (
                  <div key={index} className="border rounded p-2 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{panel.partName}</span>
                      <span className="font-bold">{formatCurrency(panel.totalCost)}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Labor: {formatHours(panel.totalTime)} ({formatCurrency(panel.laborCost)}) •
                      Materials: {formatCurrency(panel.materialCost)} •
                      Area: {panel.squareFeet} sq ft
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            {onSave && (
              <Button className="w-full" onClick={handleSaveEstimate}>
                Save Paint Estimate to Job
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
