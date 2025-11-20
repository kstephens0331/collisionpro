"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, DollarSign, Palette, Building2, Save, Loader2, Mail } from "lucide-react";
import { ShopSettings, DEFAULT_SHOP_SETTINGS } from "@/lib/labor-operations";

export default function SettingsContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<ShopSettings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // For demo, use hardcoded shopId - in production, get from session
  const shopId = "shop_demo";

  useEffect(() => {
    fetchSettings();
  }, []);

  // Detect unsaved changes
  useEffect(() => {
    if (settings && originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasUnsavedChanges(changed);
    }
  }, [settings, originalSettings]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/shop-settings?shopId=${shopId}`);
      const data = await response.json();

      if (data.success && data.settings) {
        setSettings(data.settings);
        setOriginalSettings(data.settings);
      } else {
        // Initialize with defaults
        const defaultSettings = {
          id: `settings_${Date.now()}`,
          shopId,
          ...DEFAULT_SHOP_SETTINGS,
        };
        setSettings(defaultSettings);
        setOriginalSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      alert("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/shop-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        alert("Settings saved successfully!");
        setSettings(data.settings);
        setOriginalSettings(data.settings); // Reset original after save
        setHasUnsavedChanges(false);
      } else {
        alert(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (field: keyof ShopSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {hasUnsavedChanges && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Unsaved changes</strong> - Don't forget to save your settings before leaving this page.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure your labor rates, fees, and business information
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {hasUnsavedChanges ? "Save Changes" : "All Saved"}
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="labor-rates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="labor-rates">
            <Wrench className="h-4 w-4 mr-2" />
            Labor Rates
          </TabsTrigger>
          <TabsTrigger value="fees">
            <DollarSign className="h-4 w-4 mr-2" />
            Fees & Tax
          </TabsTrigger>
          <TabsTrigger value="paint">
            <Palette className="h-4 w-4 mr-2" />
            Paint Materials
          </TabsTrigger>
          <TabsTrigger value="business">
            <Building2 className="h-4 w-4 mr-2" />
            Business Info
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email Settings
          </TabsTrigger>
        </TabsList>

        {/* LABOR RATES TAB */}
        <TabsContent value="labor-rates">
          <Card>
            <CardHeader>
              <CardTitle>Labor Rates</CardTitle>
              <CardDescription>
                Set your hourly labor rates for different types of work. These rates will be used to calculate labor costs on estimates.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="bodyLaborRate">Body Labor Rate ($/hour)</Label>
                <Input
                  id="bodyLaborRate"
                  type="number"
                  step="0.01"
                  value={settings.bodyLaborRate}
                  onChange={(e) => updateSetting("bodyLaborRate", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">R&I, repair, straightening</p>
              </div>

              <div>
                <Label htmlFor="paintLaborRate">Paint Labor Rate ($/hour)</Label>
                <Input
                  id="paintLaborRate"
                  type="number"
                  step="0.01"
                  value={settings.paintLaborRate}
                  onChange={(e) => updateSetting("paintLaborRate", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Prep, paint, refinish</p>
              </div>

              <div>
                <Label htmlFor="mechanicalLaborRate">Mechanical Labor Rate ($/hour)</Label>
                <Input
                  id="mechanicalLaborRate"
                  type="number"
                  step="0.01"
                  value={settings.mechanicalLaborRate}
                  onChange={(e) => updateSetting("mechanicalLaborRate", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Suspension, brakes, drivetrain</p>
              </div>

              <div>
                <Label htmlFor="electricalLaborRate">Electrical Labor Rate ($/hour)</Label>
                <Input
                  id="electricalLaborRate"
                  type="number"
                  step="0.01"
                  value={settings.electricalLaborRate}
                  onChange={(e) => updateSetting("electricalLaborRate", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Sensors, modules, wiring</p>
              </div>

              <div>
                <Label htmlFor="glassLaborRate">Glass Labor Rate ($/hour)</Label>
                <Input
                  id="glassLaborRate"
                  type="number"
                  step="0.01"
                  value={settings.glassLaborRate}
                  onChange={(e) => updateSetting("glassLaborRate", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Windshield, windows</p>
              </div>

              <div>
                <Label htmlFor="detailLaborRate">Detail Labor Rate ($/hour)</Label>
                <Input
                  id="detailLaborRate"
                  type="number"
                  step="0.01"
                  value={settings.detailLaborRate}
                  onChange={(e) => updateSetting("detailLaborRate", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Cleaning, buffing, finishing</p>
              </div>

              <div>
                <Label htmlFor="frameRate">Frame Labor Rate ($/hour)</Label>
                <Input
                  id="frameRate"
                  type="number"
                  step="0.01"
                  value={settings.frameRate}
                  onChange={(e) => updateSetting("frameRate", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Frame straightening, structural</p>
              </div>

              <div>
                <Label htmlFor="diagnosticRate">Diagnostic Rate ($/hour)</Label>
                <Input
                  id="diagnosticRate"
                  type="number"
                  step="0.01"
                  value={settings.diagnosticRate}
                  onChange={(e) => updateSetting("diagnosticRate", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Inspection, testing, diagnosis</p>
              </div>

              <div>
                <Label htmlFor="alignmentRate">Alignment Rate ($/hour)</Label>
                <Input
                  id="alignmentRate"
                  type="number"
                  step="0.01"
                  value={settings.alignmentRate}
                  onChange={(e) => updateSetting("alignmentRate", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">4-wheel alignment</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEES & TAX TAB */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Fees & Tax Settings</CardTitle>
              <CardDescription>
                Configure shop fees and tax rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="shopSuppliesRate">Shop Supplies Rate (%)</Label>
                  <Input
                    id="shopSuppliesRate"
                    type="number"
                    step="0.01"
                    value={(settings.shopSuppliesRate * 100).toFixed(2)}
                    onChange={(e) => updateSetting("shopSuppliesRate", parseFloat(e.target.value) / 100 || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Percentage of parts + labor</p>
                </div>

                <div>
                  <Label htmlFor="defaultTaxRate">Sales Tax Rate (%)</Label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    step="0.01"
                    value={(settings.defaultTaxRate * 100).toFixed(2)}
                    onChange={(e) => updateSetting("defaultTaxRate", parseFloat(e.target.value) / 100 || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Default sales tax rate</p>
                </div>

                <div>
                  <Label htmlFor="hazmatFee">Hazmat Fee ($)</Label>
                  <Input
                    id="hazmatFee"
                    type="number"
                    step="0.01"
                    value={settings.hazmatFee}
                    onChange={(e) => updateSetting("hazmatFee", parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Hazardous materials disposal</p>
                </div>

                <div>
                  <Label htmlFor="environmentalFee">Environmental Fee ($)</Label>
                  <Input
                    id="environmentalFee"
                    type="number"
                    step="0.01"
                    value={settings.environmentalFee}
                    onChange={(e) => updateSetting("environmentalFee", parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Environmental compliance</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-4">Tax Application</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.taxParts}
                      onChange={(e) => updateSetting("taxParts", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Apply tax to parts</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.taxLabor}
                      onChange={(e) => updateSetting("taxLabor", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Apply tax to labor</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.taxPaint}
                      onChange={(e) => updateSetting("taxPaint", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Apply tax to paint materials</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAINT MATERIALS TAB */}
        <TabsContent value="paint">
          <Card>
            <CardHeader>
              <CardTitle>Paint Materials Rates</CardTitle>
              <CardDescription>
                Set rates for paint materials charged per hour of paint time
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="paintMaterialsRate">Paint Materials Rate ($/hour)</Label>
                <Input
                  id="paintMaterialsRate"
                  type="number"
                  step="0.01"
                  value={settings.paintMaterialsRate}
                  onChange={(e) => updateSetting("paintMaterialsRate", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Paint, primer, reducer per hour</p>
              </div>

              <div>
                <Label htmlFor="clearCoatRate">Clear Coat Rate ($/hour)</Label>
                <Input
                  id="clearCoatRate"
                  type="number"
                  step="0.01"
                  value={settings.clearCoatRate}
                  onChange={(e) => updateSetting("clearCoatRate", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Clear coat materials per hour</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BUSINESS INFO TAB */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                This information will appear on estimates and invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName || ""}
                  onChange={(e) => updateSetting("companyName", e.target.value)}
                  placeholder="ABC Collision Repair"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={settings.address || ""}
                  onChange={(e) => updateSetting("address", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={settings.city || ""}
                  onChange={(e) => updateSetting("city", e.target.value)}
                  placeholder="Austin"
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={settings.state || ""}
                  onChange={(e) => updateSetting("state", e.target.value)}
                  placeholder="TX"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={settings.zip || ""}
                  onChange={(e) => updateSetting("zip", e.target.value)}
                  placeholder="78701"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={settings.phone || ""}
                  onChange={(e) => updateSetting("phone", e.target.value)}
                  placeholder="(512) 555-0123"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => updateSetting("email", e.target.value)}
                  placeholder="contact@abccollision.com"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={settings.website || ""}
                  onChange={(e) => updateSetting("website", e.target.value)}
                  placeholder="https://abccollision.com"
                />
              </div>

              <div>
                <Label htmlFor="taxId">Tax ID / EIN</Label>
                <Input
                  id="taxId"
                  value={settings.taxId || ""}
                  onChange={(e) => updateSetting("taxId", e.target.value)}
                  placeholder="12-3456789"
                />
              </div>

              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={settings.licenseNumber || ""}
                  onChange={(e) => updateSetting("licenseNumber", e.target.value)}
                  placeholder="TX123456"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMAIL SETTINGS TAB */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure the email address used to send estimates to customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="senderEmail">Sender Email Address *</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={settings.senderEmail || ""}
                    onChange={(e) => updateSetting("senderEmail", e.target.value)}
                    placeholder="estimates@yourshop.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The email address estimates will be sent from
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="senderName">Sender Display Name</Label>
                  <Input
                    id="senderName"
                    value={settings.senderName || ""}
                    onChange={(e) => updateSetting("senderName", e.target.value)}
                    placeholder="Joe's Auto Body"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The name customers will see in their inbox
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="replyToEmail">Reply-To Email (Optional)</Label>
                  <Input
                    id="replyToEmail"
                    type="email"
                    value={settings.replyToEmail || ""}
                    onChange={(e) => updateSetting("replyToEmail", e.target.value)}
                    placeholder="contact@yourshop.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Where customer replies should go (if different from sender email)
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.emailDomainVerified || false}
                    onChange={(e) => updateSetting("emailDomainVerified", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    My domain is verified and ready to send emails
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving Settings...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
