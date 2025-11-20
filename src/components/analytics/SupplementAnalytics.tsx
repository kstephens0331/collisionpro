"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, DollarSign, TrendingUp } from "lucide-react";

export default function SupplementAnalytics() {
  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-900">
                Supplement Analytics Coming Soon
              </h3>
              <p className="text-sm text-purple-700">
                Track AI supplement recommendations, approval rates, and revenue impact
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Recommendations
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">AI suggestions made</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Acceptance Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">% suggestions acted on</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approval Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">% approved by insurance</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Revenue Impact
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">From supplements</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Description */}
      <Card>
        <CardHeader>
          <CardTitle>What We'll Track</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Performance Metrics</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Total AI recommendations made</li>
                <li>• Acceptance rate by estimators</li>
                <li>• Approval rate by insurance</li>
                <li>• Revenue from supplements</li>
                <li>• Time saved vs manual detection</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Insights</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Top supplement triggers</li>
                <li>• Common damage patterns</li>
                <li>• Recommendation accuracy trends</li>
                <li>• ROI of AI feature</li>
                <li>• Comparison by insurance company</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>ROI Calculator (Preview)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Revenue Captured</p>
              <p className="text-2xl font-bold text-green-600">$---</p>
              <p className="text-xs text-gray-500 mt-1">From approved supplements</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Time Saved</p>
              <p className="text-2xl font-bold text-blue-600">--- hrs</p>
              <p className="text-xs text-gray-500 mt-1">Pre-disassembly detection</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">ROI Ratio</p>
              <p className="text-2xl font-bold text-purple-600">---:1</p>
              <p className="text-xs text-gray-500 mt-1">Return on investment</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Note */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Supplement analytics tracking is already implemented
            in Phase 7. This dashboard will query the{" "}
            <code className="bg-gray-200 px-1 rounded">supplement_analytics</code> table
            and existing supplement data to provide comprehensive ROI insights.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
