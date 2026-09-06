/**
 * GPBC Finance Desk — Central Vendor Mapping Repository
 *
 * Provides an authoritative repository abstraction for vendor mapping and learning.
 * Does NOT alter the canonical production Google Sheets schema (16 canonical tables).
 *
 * Status: REMOTE VENDOR LEARNING PERSISTENCE NOT YET IMPLEMENTED
 * Local & Session memory is used during development. Remote persistence proposals
 * should leverage existing canonical structures (e.g. historical lookup on Transactions / Expense Detail
 * or Audit logs) rather than adding a non-canonical 17th spreadsheet tab.
 */

import { VendorLearningRule } from './types';
import { DEFAULT_VENDOR_RULES } from './vendorLearningStore';
import { statementImportApi } from '../../api/statementImportApi';

export const REMOTE_PERSISTENCE_STATUS = 'REMOTE VENDOR LEARNING PERSISTENCE NOT YET IMPLEMENTED';

export interface VendorMappingRepository {
  getMapping(merchantName: string, rawDescription?: string): Promise<VendorLearningRule | null>;
  saveMapping(rule: VendorLearningRule): Promise<boolean>;
  listMappings(): Promise<VendorLearningRule[]>;
}

export class LocalVendorMappingRepository implements VendorMappingRepository {
  private rules: VendorLearningRule[] = [...DEFAULT_VENDOR_RULES];

  async getMapping(merchantName: string, rawDescription: string = ''): Promise<VendorLearningRule | null> {
    if (!merchantName && !rawDescription) return null;
    const target = `${merchantName} ${rawDescription}`.toLowerCase();

    for (const rule of this.rules) {
      try {
        const regex = new RegExp(`\\b(${rule.merchantPattern})\\b`, 'i');
        if (regex.test(target)) {
          return { ...rule };
        }
      } catch {
        if (target.includes(rule.merchantPattern.toLowerCase())) {
          return { ...rule };
        }
      }
    }
    return null;
  }

  async saveMapping(rule: VendorLearningRule): Promise<boolean> {
    const cleanPattern = rule.merchantPattern.toLowerCase().trim();
    const existingIdx = this.rules.findIndex(r => r.merchantPattern.toLowerCase() === cleanPattern);

    if (existingIdx >= 0) {
      this.rules[existingIdx] = { ...rule };
    } else {
      this.rules.unshift({ ...rule });
    }
    return true;
  }

  async listMappings(): Promise<VendorLearningRule[]> {
    return [...this.rules];
  }
}

export class RemoteVendorMappingRepository implements VendorMappingRepository {
  private localFallback = new LocalVendorMappingRepository();

  async getMapping(merchantName: string, rawDescription: string = ''): Promise<VendorLearningRule | null> {
    try {
      const response = await statementImportApi.getVendorLearningRules();
      if (response && response.rules && Array.isArray(response.rules)) {
        const target = `${merchantName} ${rawDescription}`.toLowerCase();
        for (const rule of response.rules) {
          if (target.includes(rule.merchantPattern.toLowerCase())) {
            return rule;
          }
        }
      }
    } catch {
      // Fallback cleanly to local in development
    }
    return this.localFallback.getMapping(merchantName, rawDescription);
  }

  async saveMapping(rule: VendorLearningRule): Promise<boolean> {
    try {
      const res = await statementImportApi.saveVendorLearningRule(rule);
      if (res && res.success) {
        await this.localFallback.saveMapping(rule);
        return true;
      }
    } catch {
      // Fallback cleanly to local in development
    }
    return this.localFallback.saveMapping(rule);
  }

  async listMappings(): Promise<VendorLearningRule[]> {
    try {
      const response = await statementImportApi.getVendorLearningRules();
      if (response && response.rules && Array.isArray(response.rules) && response.rules.length > 0) {
        return response.rules;
      }
    } catch {
      // Fallback cleanly to local in development
    }
    return this.localFallback.listMappings();
  }
}

export const defaultVendorMappingRepo = new RemoteVendorMappingRepository();
