/*************************************************
 * GPBC Finance Desk — monthlyCloseApi.ts
 * Typed Client API Layer for Monthly Close & Period Locking
 *************************************************/

import { gasFetch } from './gasFetch';
import type {
  MonthlyCloseRecord,
  MonthlyCloseReadiness,
  MonthlyCloseHistoryEvent
} from '../types/monthlyClose';

export const monthlyCloseApi = {
  /**
   * Fetches monthly close status for a period or all records
   */
  async getMonthlyClose(params?: { periodKey?: string }): Promise<{
    success: boolean;
    periodKey?: string;
    closeRecord?: MonthlyCloseRecord | null;
    closeRecords?: MonthlyCloseRecord[];
  }> {
    return gasFetch('getMonthlyClose', params || {});
  },

  /**
   * Evaluates real-time close readiness for a period
   */
  async getMonthlyCloseReadiness(params: { periodKey: string }): Promise<MonthlyCloseReadiness & { success: boolean }> {
    return gasFetch('getMonthlyCloseReadiness', params);
  },

  /**
   * Freezes and locks a monthly accounting period (Admin only)
   */
  async closeMonthlyPeriod(params: {
    periodKey: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    closeId: string;
    periodKey: string;
    status: string;
    closedBy: string;
    closedAt: string;
  }> {
    return gasFetch('closeMonthlyPeriod', params);
  },

  /**
   * Reopens a closed accounting period with a mandatory documented reason (Admin only)
   */
  async reopenMonthlyPeriod(params: {
    periodKey: string;
    reopenReason: string;
  }): Promise<{
    success: boolean;
    closeId: string;
    periodKey: string;
    status: string;
    reopenedBy: string;
    reopenedAt: string;
    reopenReason: string;
  }> {
    return gasFetch('reopenMonthlyPeriod', params);
  },

  /**
   * Fetches lifecycle history events for a monthly period
   */
  async getMonthlyCloseHistory(params?: { periodKey?: string }): Promise<{
    success: boolean;
    count: number;
    history: MonthlyCloseHistoryEvent[];
  }> {
    return gasFetch('getMonthlyCloseHistory', params || {});
  }
};

export default monthlyCloseApi;
