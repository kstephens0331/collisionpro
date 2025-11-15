"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Car,
  FileText,
  Shield,
  Sparkles,
} from "lucide-react";

type FormStep = "customer" | "vehicle" | "insurance" | "damage";

interface EstimateFormData {
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;

  // Vehicle info
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleVin: string;
  vehicleTrim: string;
  vehicleMileage: string;
  vehicleColor: string;
  vehicleLicensePlate: string;

  // Insurance info
  insuranceCompany: string;
  claimNumber: string;
  policyNumber: string;
  deductible: string;

  // Damage info
  damageDescription: string;
  dateOfLoss: string;
  notes: string;
  internalNotes: string;

  // Rates
  laborRate: string;
  taxRate: string;
}

export default function NewEstimatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>("customer");
  const [loading, setLoading] = useState(false);
  const [decodingVIN, setDecodingVIN] = useState(false);
  const [usePartialVIN, setUsePartialVIN] = useState(false);
  const [formData, setFormData] = useState<EstimateFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleVin: "",
    vehicleTrim: "",
    vehicleMileage: "",
    vehicleColor: "",
    vehicleLicensePlate: "",
    insuranceCompany: "",
    claimNumber: "",
    policyNumber: "",
    deductible: "",
    damageDescription: "",
    dateOfLoss: "",
    notes: "",
    internalNotes: "",
    laborRate: "75.00",
    taxRate: "0.0825",
  });

  const steps: { id: FormStep; title: string; icon: any }[] = [
    { id: "customer", title: "Customer Info", icon: User },
    { id: "vehicle", title: "Vehicle Info", icon: Car },
    { id: "insurance", title: "Insurance", icon: Shield },
    { id: "damage", title: "Damage Details", icon: FileText },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDecodeVIN = async () => {
    const vin = formData.vehicleVin.trim();

    // Validate based on mode
    const expectedLength = usePartialVIN ? 6 : 17;
    if (!vin || vin.length !== expectedLength) {
      alert(`Please enter ${usePartialVIN ? 'the last 6 digits' : 'a valid 17-character VIN'}`);
      return;
    }

    setDecodingVIN(true);
    try {
      const response = await fetch("/api/vin/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin, partialVin: usePartialVIN }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const vehicle = data.data;
        const isPartial = data.isPartial;

        setFormData((prev) => ({
          ...prev,
          vehicleYear: vehicle.year?.toString() || prev.vehicleYear,
          vehicleMake: vehicle.make || prev.vehicleMake,
          vehicleModel: vehicle.model || prev.vehicleModel,
          vehicleTrim: vehicle.trim || prev.vehicleTrim,
        }));

        if (isPartial) {
          alert("Last 6 digits decoded! Make and Model filled in. Year may not be available - please enter manually if known.");
        } else {
          alert("VIN decoded successfully! Vehicle details have been filled in.");
        }
      } else {
        alert(data.error || `Failed to decode ${usePartialVIN ? 'last 6 digits' : 'VIN'}. Please verify the ${usePartialVIN ? 'digits are' : 'VIN is'} correct.`);
      }
    } catch (error) {
      console.error("Error decoding VIN:", error);
      alert(`Failed to decode ${usePartialVIN ? 'last 6 digits' : 'VIN'}. Please try again.`);
    } finally {
      setDecodingVIN(false);
    }
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case "customer":
        return !!formData.customerName.trim();
      case "vehicle":
        return (
          !!formData.vehicleYear &&
          !!formData.vehicleMake.trim() &&
          !!formData.vehicleModel.trim()
        );
      case "insurance":
        return true; // Optional fields
      case "damage":
        return true; // Optional fields
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      alert("Please fill in all required fields");
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async (status: "draft" | "sent") => {
    if (!validateStep()) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          vehicleYear: parseInt(formData.vehicleYear),
          vehicleMileage: formData.vehicleMileage
            ? parseInt(formData.vehicleMileage)
            : null,
          deductible: formData.deductible
            ? parseFloat(formData.deductible)
            : 0,
          laborRate: parseFloat(formData.laborRate),
          taxRate: parseFloat(formData.taxRate),
          status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/dashboard/estimates/${data.estimate.id}`);
      } else {
        alert("Failed to create estimate: " + data.error);
      }
    } catch (error) {
      console.error("Error creating estimate:", error);
      alert("Failed to create estimate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/estimates")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Estimate</h1>
            <p className="text-gray-600 mt-1">
              Create a new collision repair estimate
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCompleted
                          ? "bg-blue-600 border-blue-600 text-white"
                          : isActive
                          ? "border-blue-600 text-blue-600 bg-blue-50"
                          : "border-gray-300 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium mt-2 ${
                        isActive ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 -mt-6 ${
                        isCompleted ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {steps.find((s) => s.id === currentStep)?.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Info Step */}
          {currentStep === "customer" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="customerName">
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Input
                  id="customerAddress"
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
            </div>
          )}

          {/* Vehicle Info Step */}
          {currentStep === "vehicle" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="vehicleYear">
                  Year <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vehicleYear"
                  name="vehicleYear"
                  type="number"
                  value={formData.vehicleYear}
                  onChange={handleInputChange}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleMake">
                  Make <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vehicleMake"
                  name="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={handleInputChange}
                  placeholder="Honda"
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleModel">
                  Model <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vehicleModel"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleInputChange}
                  placeholder="Civic"
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleTrim">Trim</Label>
                <Input
                  id="vehicleTrim"
                  name="vehicleTrim"
                  value={formData.vehicleTrim}
                  onChange={handleInputChange}
                  placeholder="EX-L"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="vehicleVin">
                  {usePartialVIN ? "Last 6 Digits of VIN" : "VIN"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="vehicleVin"
                    name="vehicleVin"
                    value={formData.vehicleVin}
                    onChange={handleInputChange}
                    placeholder={usePartialVIN ? "123456" : "1HGBH41JXMN109186"}
                    maxLength={usePartialVIN ? 6 : 17}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDecodeVIN}
                    disabled={
                      decodingVIN ||
                      formData.vehicleVin.length !== (usePartialVIN ? 6 : 17)
                    }
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {decodingVIN ? "Decoding..." : "Decode"}
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usePartialVIN}
                      onChange={(e) => {
                        setUsePartialVIN(e.target.checked);
                        setFormData((prev) => ({ ...prev, vehicleVin: "" }));
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      Use last 6 digits only
                    </span>
                  </label>
                  <p className="text-xs text-gray-500">
                    {usePartialVIN
                      ? "Partial decode: Make/Model only (year may not be available)"
                      : "Full decode: Year, Make, Model, and Trim"}
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="vehicleMileage">Mileage</Label>
                <Input
                  id="vehicleMileage"
                  name="vehicleMileage"
                  type="number"
                  value={formData.vehicleMileage}
                  onChange={handleInputChange}
                  placeholder="45000"
                />
              </div>
              <div>
                <Label htmlFor="vehicleColor">Color</Label>
                <Input
                  id="vehicleColor"
                  name="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={handleInputChange}
                  placeholder="Silver"
                />
              </div>
              <div>
                <Label htmlFor="vehicleLicensePlate">License Plate</Label>
                <Input
                  id="vehicleLicensePlate"
                  name="vehicleLicensePlate"
                  value={formData.vehicleLicensePlate}
                  onChange={handleInputChange}
                  placeholder="ABC123"
                />
              </div>
            </div>
          )}

          {/* Insurance Step */}
          {currentStep === "insurance" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="insuranceCompany">Insurance Company</Label>
                <Input
                  id="insuranceCompany"
                  name="insuranceCompany"
                  value={formData.insuranceCompany}
                  onChange={handleInputChange}
                  placeholder="State Farm"
                />
              </div>
              <div>
                <Label htmlFor="claimNumber">Claim Number</Label>
                <Input
                  id="claimNumber"
                  name="claimNumber"
                  value={formData.claimNumber}
                  onChange={handleInputChange}
                  placeholder="CLM-123456"
                />
              </div>
              <div>
                <Label htmlFor="policyNumber">Policy Number</Label>
                <Input
                  id="policyNumber"
                  name="policyNumber"
                  value={formData.policyNumber}
                  onChange={handleInputChange}
                  placeholder="POL-789012"
                />
              </div>
              <div>
                <Label htmlFor="deductible">Deductible ($)</Label>
                <Input
                  id="deductible"
                  name="deductible"
                  type="number"
                  step="0.01"
                  value={formData.deductible}
                  onChange={handleInputChange}
                  placeholder="500.00"
                />
              </div>
            </div>
          )}

          {/* Damage Details Step */}
          {currentStep === "damage" && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="dateOfLoss">Date of Loss</Label>
                <Input
                  id="dateOfLoss"
                  name="dateOfLoss"
                  type="date"
                  value={formData.dateOfLoss}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="damageDescription">Damage Description</Label>
                <Textarea
                  id="damageDescription"
                  name="damageDescription"
                  value={formData.damageDescription}
                  onChange={handleInputChange}
                  placeholder="Describe the damage to the vehicle..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="notes">Customer Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes visible to customer..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Textarea
                  id="internalNotes"
                  name="internalNotes"
                  value={formData.internalNotes}
                  onChange={handleInputChange}
                  placeholder="Internal notes (not visible to customer)..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="laborRate">Labor Rate ($/hour)</Label>
                  <Input
                    id="laborRate"
                    name="laborRate"
                    type="number"
                    step="0.01"
                    value={formData.laborRate}
                    onChange={handleInputChange}
                    placeholder="75.00"
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Tax Rate (decimal)</Label>
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    step="0.0001"
                    value={formData.taxRate}
                    onChange={handleInputChange}
                    placeholder="0.0825"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: 8.25% = 0.0825
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {currentStepIndex === steps.length - 1 ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit("draft")}
                    disabled={loading}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSubmit("sent")}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Estimate"}
                    <Check className="h-4 w-4 ml-2" />
                  </Button>
                </>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
