"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, Camera, MousePointer, Download } from "lucide-react";

export default function ThreeDViewerAnalytics() {
  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Box className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">
                3D Viewer Analytics Coming Soon
              </h3>
              <p className="text-sm text-blue-700">
                Track 3D damage viewer usage, marker adoption, and customer engagement
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
              Total 3D Sessions
            </CardTitle>
            <Box className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Viewer opened count</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Estimates with Markers
            </CardTitle>
            <MousePointer className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Feature adoption rate</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Markers per Estimate
            </CardTitle>
            <Camera className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Damage documentation depth</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Screenshots Captured
            </CardTitle>
            <Download className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Documentation exports</p>
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
              <h4 className="font-semibold text-gray-900 mb-2">Usage Metrics</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Total 3D viewer sessions</li>
                <li>• Estimates with damage markers</li>
                <li>• Average markers per estimate</li>
                <li>• Most used damage types</li>
                <li>• Most used camera angles</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Adoption Insights</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Adoption trend over time</li>
                <li>• Screenshots captured count</li>
                <li>• Customer portal views</li>
                <li>• Feature engagement rate</li>
                <li>• ROI impact on estimates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Note */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> 3D viewer analytics tracking is already implemented
            in Phase 8. This dashboard will query the{" "}
            <code className="bg-gray-200 px-1 rounded">viewer_analytics</code> table
            to display comprehensive usage insights.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
