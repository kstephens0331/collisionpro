"use client";

import { useState } from "react";
import TechnicianList from "@/components/technicians/TechnicianList";
import TechnicianForm from "@/components/technicians/TechnicianForm";
import { Technician } from "@/lib/technician-management";

// Mock data for demonstration
const mockTechnicians: Technician[] = [
  {
    id: "tech-1",
    shopId: "shop-1",
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike.johnson@example.com",
    phone: "(555) 123-4567",
    hireDate: new Date("2020-03-15"),
    status: "active",
    title: "Master Technician",
    department: "Body Shop",
    payType: "flat-rate",
    payRate: 35.0,
    yearsExperience: 12,
    specialties: ["Body Repair", "Frame Repair", "Welding", "Aluminum Repair"],
    skillLevel: "master",
    efficiencyRating: 125,
    qualityScore: 98,
    hoursPerWeek: 40,
    certifications: [
      {
        id: "cert-1",
        certificationId: "icar-1",
        certificationName: "I-CAR Platinum",
        issuingOrganization: "I-CAR",
        obtainedDate: new Date("2021-01-15"),
        expirationDate: new Date("2026-01-15"),
        isActive: true,
        isExpiringSoon: false,
      },
    ],
  },
  {
    id: "tech-2",
    shopId: "shop-1",
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.williams@example.com",
    phone: "(555) 234-5678",
    hireDate: new Date("2021-06-01"),
    status: "active",
    title: "Paint Technician",
    department: "Paint Shop",
    payType: "hourly",
    payRate: 28.5,
    yearsExperience: 8,
    specialties: ["Painting & Refinishing", "Paint Preparation", "Color Matching"],
    skillLevel: "senior",
    efficiencyRating: 115,
    qualityScore: 95,
    hoursPerWeek: 40,
    certifications: [
      {
        id: "cert-2",
        certificationId: "ase-1",
        certificationName: "ASE B3 Painting",
        issuingOrganization: "ASE",
        obtainedDate: new Date("2019-05-10"),
        expirationDate: new Date("2024-05-10"),
        isActive: true,
        isExpiringSoon: true,
      },
    ],
  },
  {
    id: "tech-3",
    shopId: "shop-1",
    firstName: "David",
    lastName: "Martinez",
    email: "david.martinez@example.com",
    hireDate: new Date("2022-09-01"),
    status: "active",
    title: "Technician",
    department: "Body Shop",
    payType: "hourly",
    payRate: 22.0,
    yearsExperience: 3,
    specialties: ["Body Repair", "Panel Replacement", "Detail"],
    skillLevel: "intermediate",
    efficiencyRating: 95,
    qualityScore: 88,
    hoursPerWeek: 40,
  },
  {
    id: "tech-4",
    shopId: "shop-1",
    firstName: "Jessica",
    lastName: "Chen",
    email: "jessica.chen@example.com",
    phone: "(555) 345-6789",
    hireDate: new Date("2023-01-15"),
    status: "active",
    title: "Apprentice Technician",
    department: "Body Shop",
    payType: "hourly",
    payRate: 18.0,
    yearsExperience: 1,
    specialties: ["Body Repair", "Disassembly", "Reassembly"],
    skillLevel: "apprentice",
    efficiencyRating: 78,
    qualityScore: 82,
    hoursPerWeek: 40,
  },
  {
    id: "tech-5",
    shopId: "shop-1",
    firstName: "Robert",
    lastName: "Taylor",
    email: "robert.taylor@example.com",
    hireDate: new Date("2019-11-10"),
    status: "on-leave",
    title: "Senior Technician",
    department: "Body Shop",
    payType: "flat-rate",
    payRate: 32.0,
    yearsExperience: 10,
    specialties: ["Frame Straightening", "Welding", "Body Repair"],
    skillLevel: "senior",
    efficiencyRating: 110,
    qualityScore: 92,
    hoursPerWeek: 40,
  },
];

export default function TechniciansContent() {
  const [technicians, setTechnicians] = useState<Technician[]>(mockTechnicians);
  const [showForm, setShowForm] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<
    Technician | undefined
  >(undefined);

  const handleAddTechnician = () => {
    setEditingTechnician(undefined);
    setShowForm(true);
  };

  const handleEditTechnician = (tech: Technician) => {
    setEditingTechnician(tech);
    setShowForm(true);
  };

  const handleSaveTechnician = (data: Partial<Technician>) => {
    if (editingTechnician) {
      // Update existing technician
      setTechnicians((prev) =>
        prev.map((tech) =>
          tech.id === editingTechnician.id ? { ...tech, ...data } : tech
        )
      );
    } else {
      // Add new technician
      const newTech: Technician = {
        id: `tech-${Date.now()}`,
        ...data,
      } as Technician;
      setTechnicians((prev) => [...prev, newTech]);
    }
    setShowForm(false);
    setEditingTechnician(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTechnician(undefined);
  };

  const handleViewDetails = (tech: Technician) => {
    // In production, this would navigate to a detail page
    console.log("View details for:", tech);
    alert(`Viewing details for ${tech.firstName} ${tech.lastName}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {showForm ? (
        <TechnicianForm
          technician={editingTechnician}
          shopId="shop-1"
          onSave={handleSaveTechnician}
          onCancel={handleCancel}
        />
      ) : (
        <TechnicianList
          technicians={technicians}
          onAddTechnician={handleAddTechnician}
          onEditTechnician={handleEditTechnician}
          onViewDetails={handleViewDetails}
        />
      )}
    </div>
  );
}
