/**
 * GPBC Finance Desk — Vendor Learning Store
 *
 * Deterministic learning memory for vendor mappings, categories, and business purposes.
 */

import { VendorLearningRule, ConfidenceLevel } from './types';

const STORAGE_KEY = 'gpbc_vendor_learning_rules';

export const DEFAULT_VENDOR_RULES: VendorLearningRule[] = [
  {
    merchantPattern: 'san bernardino alarm',
    canonicalMerchant: 'San Bernardino Alarm',
    defaultCategory: 'Facility & Security',
    defaultPurpose: 'Security / Alarm Monitoring',
    confidence: 'HIGH',
    source: 'SYSTEM_DEFAULT',
    lastUsedAt: '2026-03-01T00:00:00Z'
  },
  {
    merchantPattern: 'pacific gas|pg&e|pge',
    canonicalMerchant: 'Pacific Gas & Electric',
    defaultCategory: 'Utilities',
    defaultPurpose: 'Monthly Sanctuary Electric & Gas',
    confidence: 'HIGH',
    source: 'SYSTEM_DEFAULT',
    lastUsedAt: '2026-03-01T00:00:00Z'
  },
  {
    merchantPattern: 'edison|southern california edison',
    canonicalMerchant: 'Southern California Edison',
    defaultCategory: 'Utilities',
    defaultPurpose: 'Monthly Electric Utility Service',
    confidence: 'HIGH',
    source: 'SYSTEM_DEFAULT',
    lastUsedAt: '2026-03-01T00:00:00Z'
  },
  {
    merchantPattern: 'office depot',
    canonicalMerchant: 'Office Depot',
    defaultCategory: 'Ministry Supplies',
    defaultPurpose: 'Office & Ministry Supplies',
    confidence: 'HIGH',
    source: 'SYSTEM_DEFAULT',
    lastUsedAt: '2026-03-01T00:00:00Z'
  },
  {
    merchantPattern: 'pastor david lee',
    canonicalMerchant: 'Pastor David Lee',
    defaultCategory: 'Honorariums',
    defaultPurpose: 'Guest Speaker Honorarium',
    confidence: 'HIGH',
    source: 'SYSTEM_DEFAULT',
    lastUsedAt: '2026-03-01T00:00:00Z'
  },
  {
    merchantPattern: 'grace community foundation',
    canonicalMerchant: 'Grace Community Foundation',
    defaultCategory: 'Capital Grants',
    defaultPurpose: 'Capital Project Grant',
    confidence: 'HIGH',
    source: 'SYSTEM_DEFAULT',
    lastUsedAt: '2026-03-01T00:00:00Z'
  },
  {
    merchantPattern: 'zoom',
    canonicalMerchant: 'Zoom Video Communications',
    defaultCategory: 'Software & Technology',
    defaultPurpose: 'Online Ministry Conferencing',
    confidence: 'HIGH',
    source: 'SYSTEM_DEFAULT',
    lastUsedAt: '2026-03-01T00:00:00Z'
  },
  {
    merchantPattern: 'google|gsuite',
    canonicalMerchant: 'Google Workspace',
    defaultCategory: 'Software & Technology',
    defaultPurpose: 'Church Cloud & Email Services',
    confidence: 'HIGH',
    source: 'SYSTEM_DEFAULT',
    lastUsedAt: '2026-03-01T00:00:00Z'
  }
];

class VendorLearningStore {
  private rules: VendorLearningRule[] = [];

  constructor() {
    this.initRules();
  }

  private initRules(): void {
    this.rules = [...DEFAULT_VENDOR_RULES];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Merge custom rules with defaults
            const customRules = parsed.filter(r => r && r.merchantPattern);
            this.rules = [...DEFAULT_VENDOR_RULES, ...customRules];
          }
        }
      } catch {
        // Fallback to defaults
      }
    }
  }

  public getAllRules(): VendorLearningRule[] {
    return [...this.rules];
  }

  public findMatch(merchantName: string, rawDescription: string = ''): VendorLearningRule | null {
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

  public learnMapping(
    merchantPattern: string,
    canonicalMerchant: string,
    defaultCategory: string,
    defaultPurpose: string,
    confidence: ConfidenceLevel = 'HIGH',
    source: 'MANUAL_APPROVAL' | 'HISTORICAL_IMPORT' = 'MANUAL_APPROVAL'
  ): void {
    const cleanPattern = merchantPattern.toLowerCase().trim();
    const existingIndex = this.rules.findIndex(r => r.merchantPattern.toLowerCase() === cleanPattern);

    const updatedRule: VendorLearningRule = {
      merchantPattern: cleanPattern,
      canonicalMerchant,
      defaultCategory,
      defaultPurpose,
      confidence,
      source,
      lastUsedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.rules[existingIndex] = updatedRule;
    } else {
      this.rules.unshift(updatedRule);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const customRules = this.rules.filter(r => r.source !== 'SYSTEM_DEFAULT');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customRules));
      } catch {
        // LocalStorage quota or restricted
      }
    }
  }
}

export const vendorLearningStore = new VendorLearningStore();
