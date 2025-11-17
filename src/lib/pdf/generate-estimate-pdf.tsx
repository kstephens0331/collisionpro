import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import { EstimatePDF, EstimateData, EstimateLineItemData, ShopSettingsData } from './estimate-template';

/**
 * Generate PDF buffer for an estimate
 * @param estimate - Estimate data
 * @param lineItems - Array of line items
 * @param shopSettings - Shop settings with branding information
 * @returns Promise<Buffer> - PDF as a buffer
 */
export async function generateEstimatePDF(
  estimate: EstimateData,
  lineItems: EstimateLineItemData[],
  shopSettings: ShopSettingsData
): Promise<Buffer> {
  try {
    // Create the PDF document using the template
    const pdfDocument = (
      <EstimatePDF
        estimate={estimate}
        lineItems={lineItems}
        shopSettings={shopSettings}
      />
    );

    // Render the PDF to a buffer
    const pdfBuffer = await ReactPDF.renderToBuffer(pdfDocument);

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate estimate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate PDF stream for an estimate (alternative to buffer)
 * @param estimate - Estimate data
 * @param lineItems - Array of line items
 * @param shopSettings - Shop settings with branding information
 * @returns Promise<NodeJS.ReadableStream> - PDF as a stream
 */
export async function generateEstimatePDFStream(
  estimate: EstimateData,
  lineItems: EstimateLineItemData[],
  shopSettings: ShopSettingsData
): Promise<NodeJS.ReadableStream> {
  try {
    // Create the PDF document using the template
    const pdfDocument = (
      <EstimatePDF
        estimate={estimate}
        lineItems={lineItems}
        shopSettings={shopSettings}
      />
    );

    // Render the PDF to a stream
    const pdfStream = await ReactPDF.renderToStream(pdfDocument);

    return pdfStream;
  } catch (error) {
    console.error('Error generating PDF stream:', error);
    throw new Error(`Failed to generate estimate PDF stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
