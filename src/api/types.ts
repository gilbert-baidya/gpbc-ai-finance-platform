import { UserRole } from '../types/auth';

export interface GasRequestEnvelope<T = Record<string, unknown>> {
  action: string;
  idToken?: string;
  payload?: T;
}

export interface GasResponseEnvelope<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export interface VerifySessionPayload {
  tokenClaims?: {
    email: string;
    name: string;
    picture?: string;
  };
}

export interface VerifySessionResponse {
  success: boolean;
  user?: {
    email: string;
    name: string;
    picture?: string;
    role: UserRole;
  };
  error?: string;
}

export interface DashboardSummaryResponse {
  success: boolean;
  totals?: {
    tithe: number;
    offering: number;
    expenses: number;
    netBalance: number;
  };
  error?: string;
}

export interface SchemaInventoryResponse {
  success: boolean;
  spreadsheetId?: string;
  sheetCount?: number;
  sheets?: Array<{
    name: string;
    rowCount: number;
    columnCount: number;
    headers: string[];
  }>;
  environment?: string;
  error?: string;
}
