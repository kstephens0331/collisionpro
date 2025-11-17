import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Define TypeScript interfaces for estimate data
export interface EstimateData {
  // Estimate Info
  id: string;
  estimateNumber: string;
  status: string;
  createdAt: string;

  // Customer Information
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;

  // Vehicle Information
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim?: string;
  vehicleVin?: string;
  vehicleMileage?: number;
  vehicleColor?: string;
  vehicleLicensePlate?: string;

  // Insurance Information
  insuranceCompany?: string;
  claimNumber?: string;
  policyNumber?: string;
  deductible?: number;

  // Damage Information
  damageDescription?: string;
  dateOfLoss?: string;

  // Financial Information
  laborRate: number;
  partsSubtotal: number;
  laborSubtotal: number;
  paintSubtotal: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;

  // Notes
  notes?: string;
  internalNotes?: string;
}

export interface EstimateLineItemData {
  id: string;
  type: 'part' | 'labor' | 'paint' | 'misc';
  partName: string;
  partNumber?: string;
  partDescription?: string;
  laborOperation?: string;
  laborHours?: number;
  paintArea?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}

export interface ShopSettingsData {
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  licenseNumber?: string;
}

// Define styles with blue/white color scheme
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },

  // Header Section
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #1e40af',
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  shopDetails: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  estimateTitle: {
    textAlign: 'right',
    flex: 1,
  },
  estimateTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  estimateNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  estimateDate: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 3,
  },

  // Info Sections
  infoSection: {
    marginBottom: 15,
  },
  sectionRow: {
    flexDirection: 'row',
    gap: 15,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 4,
    border: '1 solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    marginBottom: 4,
  },
  label: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 1,
  },
  value: {
    fontSize: 9,
    color: '#111827',
    fontWeight: 'medium',
  },

  // Damage Section
  damageSection: {
    marginBottom: 15,
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 4,
    border: '1 solid #bfdbfe',
  },
  damageTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
  },
  damageText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.5,
  },

  // Line Items Table
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    padding: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 8,
    minHeight: 30,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  tableCellBold: {
    fontSize: 9,
    color: '#111827',
    fontWeight: 'bold',
  },

  // Column widths
  colType: { width: '12%' },
  colDescription: { width: '40%' },
  colPartCode: { width: '18%' },
  colQty: { width: '10%', textAlign: 'right' },
  colUnitPrice: { width: '10%', textAlign: 'right' },
  colTotal: { width: '10%', textAlign: 'right' },

  // Description cell with multiple lines
  descriptionContainer: {
    flexDirection: 'column',
  },
  descriptionMain: {
    fontSize: 9,
    color: '#111827',
    fontWeight: 'medium',
    marginBottom: 2,
  },
  descriptionSub: {
    fontSize: 8,
    color: '#6b7280',
  },

  // Totals Section
  totalsSection: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: '40%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 4,
    border: '1 solid #e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalRowLast: {
    paddingTop: 6,
    borderTop: '2 solid #1e40af',
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 9,
    color: '#111827',
    fontWeight: 'medium',
  },
  totalLabelLarge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  totalValueLarge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },

  // Notes Section
  notesSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fffbeb',
    border: '1 solid #fde68a',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.4,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 10,
    borderTop: '1 solid #e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#6b7280',
  },
  footerBold: {
    fontSize: 8,
    color: '#374151',
    fontWeight: 'bold',
  },
});

interface EstimatePDFProps {
  estimate: EstimateData;
  lineItems: EstimateLineItemData[];
  shopSettings: ShopSettingsData;
}

export const EstimatePDF: React.FC<EstimatePDFProps> = ({
  estimate,
  lineItems,
  shopSettings,
}) => {
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* Shop Info */}
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>
                {shopSettings.companyName || 'Auto Collision Shop'}
              </Text>
              <View style={styles.shopDetails}>
                {shopSettings.address && (
                  <Text>{shopSettings.address}</Text>
                )}
                {(shopSettings.city || shopSettings.state || shopSettings.zip) && (
                  <Text>
                    {shopSettings.city}
                    {shopSettings.state && `, ${shopSettings.state}`}
                    {shopSettings.zip && ` ${shopSettings.zip}`}
                  </Text>
                )}
                {shopSettings.phone && <Text>Phone: {shopSettings.phone}</Text>}
                {shopSettings.email && <Text>Email: {shopSettings.email}</Text>}
                {shopSettings.website && <Text>{shopSettings.website}</Text>}
              </View>
            </View>

            {/* Estimate Title */}
            <View style={styles.estimateTitle}>
              <Text style={styles.estimateTitleText}>ESTIMATE</Text>
              <Text style={styles.estimateNumber}>{estimate.estimateNumber}</Text>
              <Text style={styles.estimateDate}>
                Date: {formatDate(estimate.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer & Vehicle Information */}
        <View style={styles.infoSection}>
          <View style={styles.sectionRow}>
            {/* Customer Info */}
            <View style={styles.infoBox}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{estimate.customerName}</Text>
              </View>
              {estimate.customerEmail && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>{estimate.customerEmail}</Text>
                </View>
              )}
              {estimate.customerPhone && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Phone</Text>
                  <Text style={styles.value}>{estimate.customerPhone}</Text>
                </View>
              )}
              {estimate.customerAddress && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Address</Text>
                  <Text style={styles.value}>{estimate.customerAddress}</Text>
                </View>
              )}
            </View>

            {/* Vehicle Info */}
            <View style={styles.infoBox}>
              <Text style={styles.sectionTitle}>Vehicle Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Vehicle</Text>
                <Text style={styles.value}>
                  {estimate.vehicleYear} {estimate.vehicleMake}{' '}
                  {estimate.vehicleModel}
                  {estimate.vehicleTrim && ` ${estimate.vehicleTrim}`}
                </Text>
              </View>
              {estimate.vehicleVin && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>VIN</Text>
                  <Text style={styles.value}>{estimate.vehicleVin}</Text>
                </View>
              )}
              {estimate.vehicleMileage && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Mileage</Text>
                  <Text style={styles.value}>
                    {estimate.vehicleMileage.toLocaleString()} miles
                  </Text>
                </View>
              )}
              {estimate.vehicleColor && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Color</Text>
                  <Text style={styles.value}>{estimate.vehicleColor}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Insurance Information */}
        {estimate.insuranceCompany && (
          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <Text style={styles.sectionTitle}>Insurance Information</Text>
              <View style={styles.sectionRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Insurance Company</Text>
                    <Text style={styles.value}>{estimate.insuranceCompany}</Text>
                  </View>
                  {estimate.claimNumber && (
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Claim Number</Text>
                      <Text style={styles.value}>{estimate.claimNumber}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {estimate.policyNumber && (
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Policy Number</Text>
                      <Text style={styles.value}>{estimate.policyNumber}</Text>
                    </View>
                  )}
                  {estimate.deductible && estimate.deductible > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Deductible</Text>
                      <Text style={styles.value}>
                        {formatCurrency(estimate.deductible)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Damage Description */}
        {estimate.damageDescription && (
          <View style={styles.damageSection}>
            <Text style={styles.damageTitle}>Damage Description</Text>
            <Text style={styles.damageText}>{estimate.damageDescription}</Text>
            {estimate.dateOfLoss && (
              <Text style={[styles.damageText, { marginTop: 5 }]}>
                Date of Loss: {formatDate(estimate.dateOfLoss)}
              </Text>
            )}
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colType]}>Type</Text>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colPartCode]}>
              Part/Code
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>
              Unit Price
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {/* Table Rows */}
          {lineItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                ...(index % 2 === 1 ? [styles.tableRowAlt] : []),
              ]}
            >
              <View style={styles.colType}>
                <Text style={styles.tableCell}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              </View>
              <View style={styles.colDescription}>
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionMain}>{item.partName}</Text>
                  {item.partDescription && (
                    <Text style={styles.descriptionSub}>
                      {item.partDescription}
                    </Text>
                  )}
                  {item.laborOperation && (
                    <Text style={styles.descriptionSub}>
                      {item.laborOperation}
                      {item.laborHours && ` (${item.laborHours} hrs)`}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.colPartCode}>
                <Text style={styles.tableCell}>
                  {item.partNumber || item.laborOperation || '-'}
                </Text>
              </View>
              <View style={styles.colQty}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={styles.colUnitPrice}>
                <Text style={styles.tableCell}>
                  {formatCurrency(item.unitPrice)}
                </Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={styles.tableCellBold}>
                  {formatCurrency(item.lineTotal)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Parts Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(estimate.partsSubtotal)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Labor Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(estimate.laborSubtotal)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Paint Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(estimate.paintSubtotal)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(estimate.subtotal)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax ({(estimate.taxRate * 100).toFixed(2)}%)
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(estimate.taxAmount)}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowLast]}>
              <Text style={styles.totalLabelLarge}>TOTAL</Text>
              <Text style={styles.totalValueLarge}>
                {formatCurrency(estimate.total)}
              </Text>
            </View>
            {estimate.deductible && estimate.deductible > 0 && (
              <View style={[styles.totalRow, { marginTop: 8 }]}>
                <Text style={styles.totalLabel}>Customer Responsibility</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(
                    Math.max(0, estimate.total - estimate.deductible)
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes Section */}
        {estimate.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{estimate.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>
              This estimate is valid for 30 days from the date of issue.
            </Text>
            {shopSettings.licenseNumber && (
              <Text style={styles.footerText}>
                License: {shopSettings.licenseNumber}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.footerBold}>Thank you for your business!</Text>
            {shopSettings.phone && (
              <Text style={styles.footerText}>
                Questions? Call {shopSettings.phone}
              </Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
};
