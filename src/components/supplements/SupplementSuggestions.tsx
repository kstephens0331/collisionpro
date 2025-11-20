"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  XCircle,
  Loader2,
  FileText,
  Camera,
} from "lucide-react";

interface SupplementSuggestion {
  id: string;
  trigger: string;
  category: string;
  confidence: number;
  suggestedAmount: number;
  justification: string;
  documentationNeeded: string[];
  priority: "high" | "medium" | "low";
  timing: string;
}

interface SupplementSuggestionsProps {
  estimateId: string;
  onCreateSupplement?: (suggestion: SupplementSuggestion) => void;
}

export default function SupplementSuggestions({
  estimateId,
  onCreateSupplement,
}: SupplementSuggestionsProps) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SupplementSuggestion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);
  const [highPriorityCount, setHighPriorityCount] = useState(0);

  useEffect(() => {
    fetchSuggestions();
  }, [estimateId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/supplements/recommendations?estimateId=${estimateId}&minConfidence=50`
      );

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.data.recommendations || []);
        setTotalAmount(data.data.estimatedTotalAmount || 0);
        setAvgConfidence(data.data.avgConfidence || 0);
        setHighPriorityCount(data.data.highPriorityCount || 0);
      } else {
        setError(data.error || "Failed to load suggestions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <TrendingUp className="h-4 w-4" />;
      case "low":
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Analyzing for supplement opportunities...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-700">Failed to Load Suggestions</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-700">No Supplement Risks Detected</h3>
              <p className="text-sm text-green-600 mt-1">
                AI analysis found no common supplement triggers for this estimate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          AI Supplement Suggestions
        </CardTitle>
        <p className="text-sm text-gray-600">
          Based on historical data and estimate analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{suggestions.length}</div>
            <div className="text-xs text-gray-600">Suggestions</div>
          </div>
          <div className="text-center border-x">
            <div className="text-2xl font-bold text-blue-600">{avgConfidence}%</div>
            <div className="text-xs text-gray-600">Avg Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${totalAmount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Est. Total</div>
          </div>
        </div>

        {/* High Priority Alert */}
        {highPriorityCount > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium text-sm">
                {highPriorityCount} high-priority supplement{highPriorityCount !== 1 ? "s" : ""}{" "}
                detected
              </span>
            </div>
          </div>
        )}

        {/* Suggestions List */}
        <div className="space-y-2">
          {suggestions.map((suggestion) => {
            const isExpanded = expandedId === suggestion.id;

            return (
              <div
                key={suggestion.id}
                className={`border-2 rounded-lg overflow-hidden ${getPriorityColor(
                  suggestion.priority
                )}`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                  className="w-full p-3 flex items-start justify-between hover:bg-opacity-75 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 text-left">
                    {getPriorityIcon(suggestion.priority)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{suggestion.trigger}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs opacity-75 capitalize">
                          {suggestion.category}
                        </span>
                        <span className="text-xs opacity-75">
                          {suggestion.confidence}% confidence
                        </span>
                        <span className="text-xs font-semibold">
                          ${suggestion.suggestedAmount.toLocaleString()} estimated
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t bg-white p-4 space-y-3">
                    {/* Justification */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Insurance Justification
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {suggestion.justification}
                      </p>
                    </div>

                    {/* Documentation Needed */}
                    {suggestion.documentationNeeded.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Required Documentation
                        </h4>
                        <ul className="space-y-1">
                          {suggestion.documentationNeeded.map((doc, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedId(null)}
                        className="flex-1"
                      >
                        Dismiss
                      </Button>
                      {onCreateSupplement && (
                        <Button
                          size="sm"
                          onClick={() => {
                            onCreateSupplement(suggestion);
                            setExpandedId(null);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Create Supplement
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Suggestions powered by AI analysis of {suggestions.length > 0 ? "historical" : ""} supplement
          patterns
        </div>
      </CardContent>
    </Card>
  );
}
