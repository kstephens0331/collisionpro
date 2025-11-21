"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Technician, SKILL_CATEGORIES } from "@/lib/technician-management";

interface TechnicianFormProps {
  technician?: Technician;
  shopId: string;
  onSave: (data: Partial<Technician>) => void;
  onCancel: () => void;
}

export default function TechnicianForm({
  technician,
  shopId,
  onSave,
  onCancel,
}: TechnicianFormProps) {
  const [formData, setFormData] = useState<Partial<Technician>>({
    shopId,
    firstName: technician?.firstName || "",
    lastName: technician?.lastName || "",
    email: technician?.email || "",
    phone: technician?.phone || "",
    title: technician?.title || "Technician",
    department: technician?.department || "",
    status: technician?.status || "active",
    payType: technician?.payType || "hourly",
    payRate: technician?.payRate || 0,
    yearsExperience: technician?.yearsExperience || 0,
    skillLevel: technician?.skillLevel || "intermediate",
    efficiencyRating: technician?.efficiencyRating || 100,
    qualityScore: technician?.qualityScore || 100,
    hoursPerWeek: technician?.hoursPerWeek || 40,
    specialties: technician?.specialties || [],
    hireDate: technician?.hireDate || new Date(),
  });

  const [newSpecialty, setNewSpecialty] = useState("");

  const handleChange = (
    field: keyof Technician,
    value: string | number | Date
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties?.includes(newSpecialty.trim())) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...(prev.specialties || []), newSpecialty.trim()],
      }));
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: (prev.specialties || []).filter((s) => s !== specialty),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {technician ? "Edit Technician" : "Add New Technician"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="font-semibold mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  First Name *
                </label>
                <Input
                  required
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Last Name *
                </label>
                <Input
                  required
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Smith"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john.smith@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <h3 className="font-semibold mb-3">Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title *</label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Master Technician"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Department
                </label>
                <Input
                  value={formData.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="Body Shop"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) =>
                    handleChange(
                      "status",
                      e.target.value as Technician["status"]
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="on-leave">On Leave</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Hire Date *
                </label>
                <Input
                  required
                  type="date"
                  value={
                    formData.hireDate instanceof Date
                      ? formData.hireDate.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleChange("hireDate", new Date(e.target.value))
                  }
                />
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div>
            <h3 className="font-semibold mb-3">Compensation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Pay Type *
                </label>
                <select
                  required
                  value={formData.payType}
                  onChange={(e) =>
                    handleChange("payType", e.target.value as Technician["payType"])
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="hourly">Hourly</option>
                  <option value="salary">Salary</option>
                  <option value="flat-rate">Flat Rate</option>
                  <option value="commission">Commission</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Pay Rate ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.payRate}
                  onChange={(e) =>
                    handleChange("payRate", parseFloat(e.target.value) || 0)
                  }
                  placeholder="25.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Hours Per Week *
                </label>
                <Input
                  required
                  type="number"
                  value={formData.hoursPerWeek}
                  onChange={(e) =>
                    handleChange("hoursPerWeek", parseInt(e.target.value) || 40)
                  }
                  placeholder="40"
                />
              </div>
            </div>
          </div>

          {/* Skills & Experience */}
          <div>
            <h3 className="font-semibold mb-3">Skills & Experience</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Years of Experience *
                </label>
                <Input
                  required
                  type="number"
                  value={formData.yearsExperience}
                  onChange={(e) =>
                    handleChange("yearsExperience", parseInt(e.target.value) || 0)
                  }
                  placeholder="5"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Skill Level *
                </label>
                <select
                  required
                  value={formData.skillLevel}
                  onChange={(e) =>
                    handleChange(
                      "skillLevel",
                      e.target.value as Technician["skillLevel"]
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="apprentice">Apprentice</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="senior">Senior</option>
                  <option value="master">Master</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Efficiency Rating (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.efficiencyRating}
                  onChange={(e) =>
                    handleChange(
                      "efficiencyRating",
                      parseFloat(e.target.value) || 100
                    )
                  }
                  placeholder="100"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Quality Score (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.qualityScore}
                  onChange={(e) =>
                    handleChange(
                      "qualityScore",
                      parseFloat(e.target.value) || 100
                    )
                  }
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div>
            <h3 className="font-semibold mb-3">Specialties</h3>
            <div className="flex gap-2 mb-3">
              <select
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a specialty...</option>
                {SKILL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Button type="button" onClick={addSpecialty} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <Input
              placeholder="Or type a custom specialty..."
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSpecialty();
                }
              }}
              className="mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {formData.specialties?.map((specialty, idx) => (
                <Badge key={idx} className="flex items-center gap-1">
                  {specialty}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(specialty)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {formData.specialties?.length === 0 && (
                <p className="text-sm text-gray-500">
                  No specialties added yet. Add at least one.
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {technician ? "Update Technician" : "Add Technician"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
