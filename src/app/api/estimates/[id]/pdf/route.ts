import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch estimate with all details
    const { data: estimate, error: estimateError } = await supabase
      .from("Estimate")
      .select("*")
      .eq("id", id)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Fetch line items
    const { data: lineItems } = await supabase
      .from("EstimateLineItem")
      .select("*")
      .eq("estimateId", id)
      .order("sequence", { ascending: true });

    // Fetch shop settings for branding
    const { data: shopSettings } = await supabase
      .from("ShopSettings")
      .select("*")
      .eq("shopId", estimate.shopId)
      .single();

    // Generate HTML for PDF
    const html = generateEstimateHTML(estimate, lineItems || [], shopSettings);

    // Return HTML that can be printed to PDF
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="estimate-${estimate.estimateNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

function generateEstimateHTML(
  estimate: Record<string, unknown>,
  lineItems: Record<string, unknown>[],
  shopSettings: Record<string, unknown> | null
): string {
  const shopName = (shopSettings?.shopName as string) || "CollisionPro";
  const shopAddress = (shopSettings?.address as string) || "";
  const shopPhone = (shopSettings?.phone as string) || "";
  const shopEmail = (shopSettings?.email as string) || "";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Group items by type
  const parts = lineItems.filter((i) => i.type === "part");
  const labor = lineItems.filter((i) => i.type === "labor");
  const paint = lineItems.filter((i) => i.type === "paint");
  const misc = lineItems.filter((i) => i.type === "misc");

  const renderItems = (items: Record<string, unknown>[], title: string) => {
    if (items.length === 0) return "";
    return `
      <tr class="section-header">
        <td colspan="4"><strong>${title}</strong></td>
      </tr>
      ${items
        .map(
          (item) => `
        <tr>
          <td>${item.partName || item.laborOperation || ""}</td>
          <td class="text-center">${item.quantity || 1}</td>
          <td class="text-right">${formatCurrency(item.unitPrice as number)}</td>
          <td class="text-right">${formatCurrency(item.lineTotal as number)}</td>
        </tr>
      `
        )
        .join("")}
    `;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estimate ${estimate.estimateNumber}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #1a1a1a;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #2563eb;
    }
    .shop-info h1 {
      font-size: 24px;
      color: #2563eb;
      margin-bottom: 5px;
    }
    .shop-info p {
      color: #666;
      font-size: 11px;
    }
    .estimate-info {
      text-align: right;
    }
    .estimate-info h2 {
      font-size: 18px;
      color: #333;
    }
    .estimate-info p {
      color: #666;
      font-size: 11px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .info-section {
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .info-section h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    .info-section p {
      margin-bottom: 3px;
    }
    .info-section strong {
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #2563eb;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #eee;
    }
    .section-header td {
      background: #f0f4f8;
      padding: 6px 10px;
      font-size: 11px;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .totals table {
      margin-bottom: 0;
    }
    .totals td {
      padding: 6px 10px;
    }
    .totals .total-row {
      font-size: 16px;
      font-weight: bold;
      background: #2563eb;
      color: white;
    }
    .totals .total-row td {
      padding: 12px 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 10px;
    }
    .notes {
      margin-top: 20px;
      padding: 15px;
      background: #fff8e6;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }
    .notes h3 {
      font-size: 12px;
      margin-bottom: 5px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop-info">
      <h1>${shopName}</h1>
      ${shopAddress ? `<p>${shopAddress}</p>` : ""}
      ${shopPhone ? `<p>${shopPhone}</p>` : ""}
      ${shopEmail ? `<p>${shopEmail}</p>` : ""}
    </div>
    <div class="estimate-info">
      <h2>ESTIMATE</h2>
      <p><strong>#${estimate.estimateNumber}</strong></p>
      <p>Date: ${formatDate(estimate.createdAt as string)}</p>
      <p>Status: ${(estimate.status as string || "draft").toUpperCase()}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <h3>Customer Information</h3>
      <p><strong>${estimate.customerName || "N/A"}</strong></p>
      <p>${estimate.customerEmail || ""}</p>
      <p>${estimate.customerPhone || ""}</p>
      <p>${estimate.customerAddress || ""}</p>
    </div>
    <div class="info-section">
      <h3>Vehicle Information</h3>
      <p><strong>${estimate.vehicleYear || ""} ${estimate.vehicleMake || ""} ${estimate.vehicleModel || ""}</strong></p>
      ${estimate.vehicleVin ? `<p>VIN: ${estimate.vehicleVin}</p>` : ""}
      ${estimate.vehicleColor ? `<p>Color: ${estimate.vehicleColor}</p>` : ""}
      ${estimate.vehicleMileage ? `<p>Mileage: ${(estimate.vehicleMileage as number).toLocaleString()}</p>` : ""}
    </div>
  </div>

  ${estimate.insuranceCompany ? `
  <div class="info-section" style="margin-bottom: 20px;">
    <h3>Insurance Information</h3>
    <p><strong>${estimate.insuranceCompany}</strong></p>
    ${estimate.claimNumber ? `<p>Claim #: ${estimate.claimNumber}</p>` : ""}
    ${estimate.policyNumber ? `<p>Policy #: ${estimate.policyNumber}</p>` : ""}
    ${estimate.deductible ? `<p>Deductible: ${formatCurrency(estimate.deductible as number)}</p>` : ""}
  </div>
  ` : ""}

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-center" style="width: 60px;">Qty</th>
        <th class="text-right" style="width: 100px;">Unit Price</th>
        <th class="text-right" style="width: 100px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${renderItems(parts, "Parts")}
      ${renderItems(labor, "Labor")}
      ${renderItems(paint, "Paint & Materials")}
      ${renderItems(misc, "Miscellaneous")}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td>Parts Subtotal</td>
        <td class="text-right">${formatCurrency(estimate.partsSubtotal as number)}</td>
      </tr>
      <tr>
        <td>Labor Subtotal</td>
        <td class="text-right">${formatCurrency(estimate.laborSubtotal as number)}</td>
      </tr>
      <tr>
        <td>Paint Subtotal</td>
        <td class="text-right">${formatCurrency(estimate.paintSubtotal as number)}</td>
      </tr>
      <tr>
        <td><strong>Subtotal</strong></td>
        <td class="text-right"><strong>${formatCurrency(estimate.subtotal as number)}</strong></td>
      </tr>
      <tr>
        <td>Tax (${((estimate.taxRate as number) * 100).toFixed(1)}%)</td>
        <td class="text-right">${formatCurrency(estimate.taxAmount as number)}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL</td>
        <td class="text-right">${formatCurrency(estimate.total as number)}</td>
      </tr>
    </table>
  </div>

  ${estimate.damageDescription ? `
  <div class="notes">
    <h3>Damage Description</h3>
    <p>${estimate.damageDescription}</p>
  </div>
  ` : ""}

  ${estimate.notes ? `
  <div class="notes" style="background: #f0f4f8; border-color: #2563eb;">
    <h3>Notes</h3>
    <p>${estimate.notes}</p>
  </div>
  ` : ""}

  <div class="footer">
    <p>This estimate is valid for 30 days from the date of issue.</p>
    <p>Generated by CollisionPro</p>
  </div>

  <script class="no-print">
    // Auto-print when opened
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;
}
