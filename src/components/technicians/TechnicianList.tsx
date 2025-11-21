"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Plus,
  Award,
  TrendingUp,
  Clock,
  Edit,
  Eye,
} from "lucide-react";
import {
  Technician,
  formatTechnicianName,
  getTechnicianLevelColor,
  getEfficiencyBadge,
} from "@/lib/technician-management";

interface TechnicianListProps {
  technicians: Technician[];
  onAddTechnician?: () => void;
  onEditTechnician?: (tech: Technician) => void;
  onViewDetails?: (tech: Technician) => void;
}

export default function TechnicianList({
  technicians,
  onAddTechnician,
  onEditTechnician,
  onViewDetails,
}: TechnicianListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  // Filter technicians
  const filteredTechnicians = technicians.filter((tech) => {
    const matchesSearch =
      tech.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || tech.status === filterStatus;

    const matchesLevel =
      filterLevel === "all" || tech.skillLevel === filterLevel;

    return matchesSearch && matchesStatus && matchesLevel;
  });

  // Calculate statistics
  const activeTechs = technicians.filter((t) => t.status === "active").length;
  const avgEfficiency =
    technicians.reduce((sum, t) => sum + t.efficiencyRating, 0) /
      technicians.length || 0;
  const avgQuality =
    technicians.reduce((sum, t) => sum + t.qualityScore, 0) /
      technicians.length || 0;

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      "on-leave": "bg-yellow-100 text-yellow-800",
      suspended: "bg-orange-100 text-orange-800",
      terminated: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPayTypeIcon = (payType: string) => {
    const icons: Record<string, string> = {
      hourly: "⏰",
      salary: "💰",
      "flat-rate": "🔧",
      commission: "📊",
    };
    return icons[payType] || "💵";
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Technician Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {activeTechs} Active • {technicians.length} Total
          </p>
        </div>
        {onAddTechnician && (
          <Button onClick={onAddTechnician}>
            <Plus className="h-4 w-4 mr-2" />
            Add Technician
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Technicians</p>
                <p className="text-2xl font-bold">{activeTechs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Efficiency</p>
                <p className="text-2xl font-bold">{avgEfficiency.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Quality Score</p>
                <p className="text-2xl font-bold">{avgQuality.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="on-leave">On Leave</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Skill Level</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Levels</option>
                <option value="apprentice">Apprentice</option>
                <option value="intermediate">Intermediate</option>
                <option value="senior">Senior</option>
                <option value="master">Master</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technician List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Technicians ({filteredTechnicians.length})
          </h3>
        </div>

        {filteredTechnicians.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">
                No technicians found. Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTechnicians.map((tech) => {
            const efficiencyBadge = getEfficiencyBadge(tech.efficiencyRating);

            return (
              <Card key={tech.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">
                          {formatTechnicianName(tech)}
                        </h4>
                        <Badge className={getStatusColor(tech.status)}>
                          {tech.status.replace("-", " ").toUpperCase()}
                        </Badge>
                        <Badge className={getTechnicianLevelColor(tech.skillLevel)}>
                          {tech.skillLevel.toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-1">{tech.title}</p>
                      {tech.department && (
                        <p className="text-xs text-gray-500">
                          Department: {tech.department}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {onViewDetails && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(tech)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEditTechnician && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditTechnician(tech)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Experience</p>
                      <p className="text-sm font-semibold">
                        {tech.yearsExperience} years
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Pay Type</p>
                      <p className="text-sm font-semibold flex items-center gap-1">
                        {getPayTypeIcon(tech.payType)}
                        {tech.payType.replace("-", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Hours/Week</p>
                      <p className="text-sm font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {tech.hoursPerWeek}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Certifications</p>
                      <p className="text-sm font-semibold flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {tech.certifications?.length || 0}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Efficiency</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold">
                          {tech.efficiencyRating.toFixed(0)}%
                        </p>
                        <Badge className={efficiencyBadge.color}>
                          {efficiencyBadge.label}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Quality Score</p>
                      <p className="text-lg font-bold">
                        {tech.qualityScore.toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Specialties</p>
                      <p className="text-sm font-semibold">
                        {tech.specialties.length} skills
                      </p>
                    </div>
                  </div>

                  {tech.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tech.specialties.slice(0, 5).map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {tech.specialties.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{tech.specialties.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
