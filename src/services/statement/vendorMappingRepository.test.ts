import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalVendorMappingRepository,
  RemoteVendorMappingRepository,
  REMOTE_PERSISTENCE_STATUS
} from './vendorMappingRepository';

describe('Vendor Mapping Repository', () => {
  let localRepo: LocalVendorMappingRepository;
  let remoteRepo: RemoteVendorMappingRepository;

  beforeEach(() => {
    localRepo = new LocalVendorMappingRepository();
    remoteRepo = new RemoteVendorMappingRepository();
  });

  it('LocalVendorMappingRepository matches seeded vendor rules', async () => {
    const matchAlarm = await localRepo.getMapping('San Bernardino Alarm');
    expect(matchAlarm).not.toBeNull();
    expect(matchAlarm?.defaultCategory).toBe('Facility & Security');
  });

  it('LocalVendorMappingRepository learns and persists new vendor mappings', async () => {
    await localRepo.saveMapping({
      merchantPattern: 'home depot',
      canonicalMerchant: 'Home Depot',
      defaultCategory: 'Facility Maintenance',
      defaultPurpose: 'Building Repair Materials',
      confidence: 'HIGH',
      source: 'MANUAL_APPROVAL',
      lastUsedAt: '2026-09-01T00:00:00Z'
    });

    const match = await localRepo.getMapping('The Home Depot Store #123');
    expect(match).not.toBeNull();
    expect(match?.defaultCategory).toBe('Facility Maintenance');
  });

  it('RemoteVendorMappingRepository documents persistence status and falls back safely', async () => {
    expect(REMOTE_PERSISTENCE_STATUS).toBe('REMOTE VENDOR LEARNING PERSISTENCE NOT YET IMPLEMENTED');
    const list = await remoteRepo.listMappings();
    expect(list.length).toBeGreaterThan(0);
    const alarm = list.find(r => r.merchantPattern === 'san bernardino alarm');
    expect(alarm).toBeDefined();
    expect(alarm?.defaultCategory).toBe('Facility & Security');
  });
});
