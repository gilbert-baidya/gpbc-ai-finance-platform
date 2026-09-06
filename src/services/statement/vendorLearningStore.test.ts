import { describe, it, expect } from 'vitest';
import { vendorLearningStore } from './vendorLearningStore';

describe('Vendor Learning Store', () => {
  it('retrieves default preset rules for church vendors', () => {
    const match = vendorLearningStore.findMatch('San Bernardino Alarm');
    expect(match).not.toBeNull();
    expect(match?.defaultCategory).toBe('Facility & Security');
    expect(match?.defaultPurpose).toBe('Security / Alarm Monitoring');
    expect(match?.confidence).toBe('HIGH');
  });

  it('allows learning new merchant mappings dynamically', () => {
    vendorLearningStore.learnMapping(
      'california water',
      'California Water Service',
      'Utilities',
      'Sanctuary Water Utility Service',
      'HIGH',
      'MANUAL_APPROVAL'
    );

    const match = vendorLearningStore.findMatch('California Water Service');
    expect(match).not.toBeNull();
    expect(match?.defaultCategory).toBe('Utilities');
    expect(match?.source).toBe('MANUAL_APPROVAL');
  });
});
