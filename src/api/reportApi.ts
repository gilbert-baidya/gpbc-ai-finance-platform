/*************************************************
 * GPBC Finance Desk — reportApi.ts
 * Typed Client API Layer for Presbyter Reports
 *************************************************/

import { gasFetch } from './gasFetch';
import type { PresbyterReportData, PresbyterReportRecord, PresbyterReportDTO } from '../types/reports';

export const reportApi = {
  /**
   * Fetches the Phase 4 Presbyter Financial Oversight Report DTO
   */
  async getPresbyterReport(params?: { periodKey?: string }): Promise<PresbyterReportDTO> {
    return gasFetch('getPresbyterReport', params || {});
  },

  /**
   * Generates and aggregates a Presbyter Financial Oversight Report
   */
  async generatePresbyterReport(params: {
    periodKey?: string;
    startDate?: string;
    endDate?: string;
    reportType?: 'MONTHLY_SUMMARY' | 'CUSTOM_RANGE' | 'DETAILED';
    detailLevel?: 'Summary' | 'Detailed';
    includeAuditAppendix?: boolean;
    notes?: string;
  }): Promise<{
    success: boolean;
    reportId: string;
    reportData: PresbyterReportData;
  }> {
    return gasFetch('generatePresbyterReport', params);
  },

  /**
   * Retrieves list of generated Presbyter Reports metadata
   */
  async getPresbyterReports(params?: { periodKey?: string }): Promise<{
    success: boolean;
    count: number;
    reports: PresbyterReportRecord[];
  }> {
    return gasFetch('getPresbyterReports', params || {});
  },

  /**
   * Sends a generated report via email
   */
  async sendPresbyterReport(params: {
    reportId: string;
    recipientEmail: string;
  }): Promise<{
    success: boolean;
    reportId: string;
    recipientEmail: string;
    sentAt: string;
  }> {
    return gasFetch('sendPresbyterReport', params);
  }
};

export default reportApi;
