import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ScrapedPart {
  partNumber: string;
  supplierPartNumber: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  listPrice?: number;
  inStock: boolean;
  quantity?: number;
  leadTimeDays?: number;
  warranty?: string;
  condition: 'new' | 'refurbished' | 'used';
  productUrl: string;

  // Vehicle compatibility
  make?: string;
  model?: string;
  yearStart?: number;
  yearEnd?: number;
  compatibleVehicles?: string[]; // Array of "2020 Honda Civic", etc.

  // Cross-reference data
  oemPartNumber?: string;
  legacyPartNumbers?: string[];
  interchangeablePartNumbers?: string[];
}

export interface ScrapeResult {
  success: boolean;
  partsScraped: number;
  partsAdded: number;
  partsUpdated: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

export abstract class BaseScraper {
  protected supplierId: string;
  protected supplierName: string;
  protected supplierCode: string;
  protected errors: string[] = [];

  constructor(supplierId: string, supplierName: string, supplierCode: string) {
    this.supplierId = supplierId;
    this.supplierName = supplierName;
    this.supplierCode = supplierCode;
  }

  /**
   * Main scraping method - to be implemented by each supplier
   */
  abstract scrape(options?: any): Promise<ScrapedPart[]>;

  /**
   * Generate unique hash for deduplication
   */
  protected generatePartHash(partNumber: string, supplierCode: string): string {
    return crypto
      .createHash('md5')
      .update(`${supplierCode}-${partNumber}`)
      .digest('hex');
  }

  /**
   * Upsert part into database with deduplication
   */
  protected async upsertPart(scrapedPart: ScrapedPart): Promise<{ added: boolean; updated: boolean }> {
    try {
      const partHash = this.generatePartHash(scrapedPart.partNumber, this.supplierCode);

      // Check if part already exists
      const { data: existingPart } = await supabase
        .from('Part')
        .select('id')
        .eq('partNumber', scrapedPart.partNumber)
        .single();

      let partId: string;
      let added = false;
      let updated = false;

      if (!existingPart) {
        // Insert new part
        const { data: newPart, error: partError } = await supabase
          .from('Part')
          .insert({
            id: `part_${partHash}`,
            partNumber: scrapedPart.partNumber,
            partType: 'GENERAL', // Can be updated later
            category: scrapedPart.category,
            name: scrapedPart.name,
            description: scrapedPart.description,
            oemPartNumber: scrapedPart.oemPartNumber,
            isOEM: scrapedPart.oemPartNumber === scrapedPart.partNumber,
            make: scrapedPart.make,
            model: scrapedPart.model,
            yearStart: scrapedPart.yearStart,
            yearEnd: scrapedPart.yearEnd,
            images: scrapedPart.images,
            specifications: {
              legacyPartNumbers: scrapedPart.legacyPartNumbers,
              interchangeablePartNumbers: scrapedPart.interchangeablePartNumbers,
              compatibleVehicles: scrapedPart.compatibleVehicles,
            },
          })
          .select('id')
          .single();

        if (partError) {
          this.errors.push(`Failed to insert part ${scrapedPart.partNumber}: ${partError.message}`);
          return { added: false, updated: false };
        }

        partId = newPart.id;
        added = true;
      } else {
        partId = existingPart.id;

        // Update existing part with new data
        const { error: updateError } = await supabase
          .from('Part')
          .update({
            name: scrapedPart.name,
            description: scrapedPart.description,
            images: scrapedPart.images,
            specifications: {
              legacyPartNumbers: scrapedPart.legacyPartNumbers,
              interchangeablePartNumbers: scrapedPart.interchangeablePartNumbers,
              compatibleVehicles: scrapedPart.compatibleVehicles,
            },
            updatedAt: new Date().toISOString(),
          })
          .eq('id', partId);

        if (updateError) {
          this.errors.push(`Failed to update part ${scrapedPart.partNumber}: ${updateError.message}`);
        }
        updated = !updateError;
      }

      // Upsert price data
      await this.upsertPrice(partId, scrapedPart);

      return { added, updated };
    } catch (error: any) {
      this.errors.push(`Error upserting part: ${error.message}`);
      return { added: false, updated: false };
    }
  }

  /**
   * Upsert price for a part
   */
  protected async upsertPrice(partId: string, scrapedPart: ScrapedPart) {
    try {
      const { error } = await supabase
        .from('PartPrice')
        .upsert({
          id: `price_${partId}_${this.supplierId}`,
          partId,
          supplierId: this.supplierId,
          supplierPartNumber: scrapedPart.supplierPartNumber,
          price: scrapedPart.price,
          listPrice: scrapedPart.listPrice,
          inStock: scrapedPart.inStock,
          quantity: scrapedPart.quantity,
          leadTimeDays: scrapedPart.leadTimeDays,
          condition: scrapedPart.condition,
          warranty: scrapedPart.warranty,
          productUrl: scrapedPart.productUrl,
          lastUpdated: new Date().toISOString(),
        }, {
          onConflict: 'partId,supplierId',
        });

      if (error) {
        this.errors.push(`Failed to upsert price for ${scrapedPart.partNumber}: ${error.message}`);
      }
    } catch (error: any) {
      this.errors.push(`Error upserting price: ${error.message}`);
    }
  }

  /**
   * Run the scraper and save results
   */
  async run(options?: any): Promise<ScrapeResult> {
    const startTime = Date.now();
    this.errors = [];

    console.log(`🚀 Starting ${this.supplierName} scraper...`);

    try {
      const scrapedParts = await this.scrape(options);
      console.log(`✅ Scraped ${scrapedParts.length} parts from ${this.supplierName}`);

      let partsAdded = 0;
      let partsUpdated = 0;

      for (const part of scrapedParts) {
        const { added, updated } = await this.upsertPart(part);
        if (added) partsAdded++;
        if (updated) partsUpdated++;
      }

      const duration = Date.now() - startTime;

      const result: ScrapeResult = {
        success: true,
        partsScraped: scrapedParts.length,
        partsAdded,
        partsUpdated,
        errors: this.errors,
        duration,
        timestamp: new Date(),
      };

      // Log scrape result to database
      await this.logScrapeResult(result);

      console.log(`✅ ${this.supplierName} scraper completed in ${duration}ms`);
      console.log(`   Added: ${partsAdded}, Updated: ${partsUpdated}`);

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.errors.push(`Fatal scraper error: ${error.message}`);

      const result: ScrapeResult = {
        success: false,
        partsScraped: 0,
        partsAdded: 0,
        partsUpdated: 0,
        errors: this.errors,
        duration,
        timestamp: new Date(),
      };

      await this.logScrapeResult(result);
      return result;
    }
  }

  /**
   * Log scrape result to database for monitoring
   */
  protected async logScrapeResult(result: ScrapeResult) {
    try {
      await supabase.from('ScrapeLog').insert({
        supplierId: this.supplierId,
        supplierName: this.supplierName,
        success: result.success,
        partsScraped: result.partsScraped,
        partsAdded: result.partsAdded,
        partsUpdated: result.partsUpdated,
        errors: result.errors,
        duration: result.duration,
        timestamp: result.timestamp.toISOString(),
      });
    } catch (error) {
      console.error('Failed to log scrape result:', error);
    }
  }

  /**
   * Helper: Extract price from text
   */
  protected extractPrice(priceText: string): number {
    const match = priceText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  /**
   * Helper: Clean text
   */
  protected cleanText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }
}
