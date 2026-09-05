/**
 * GPBC Finance Desk — Help & Training Content Types
 * 
 * DEVELOPER EXTENSION GUIDE:
 * To add a new help article or module guide in the future:
 * 1. Add the article object conforming to `HelpArticle` in `src/help/moduleGuides.ts`.
 * 2. Specify `id`, `title`, `route` (if applicable), `category`, `summary`, `allowedRoles`,
 *    `quickSteps`, `keyFields`, `commonMistakes`, `statusMeanings`, and `sections`.
 * 3. Register the route-to-id mapping in `src/help/helpRegistry.ts` (`ROUTE_TO_HELP_MAP`).
 * 4. The search index, contextual drawer, and Help Center landing page will automatically
 *    index and render the new article without any further modifications.
 */

import { UserRole } from '../types/auth';

export type HelpCategory = 
  | 'getting-started'
  | 'overview'
  | 'finance'
  | 'projects'
  | 'control-audit'
  | 'system';

export interface HelpSection {
  id: string;
  title: string;
  content: string;
  callout?: {
    type: 'note' | 'tip' | 'important' | 'warning';
    text: string;
  };
}

export interface StatusExplanation {
  status: string;
  badgeType: 'success' | 'warning' | 'info' | 'error' | 'neutral';
  description: string;
  actionRequired?: string;
}

export interface HelpField {
  fieldName: string;
  description: string;
  required: boolean;
  example?: string;
}

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  category: HelpCategory;
  route?: string;
  summary: string;
  allowedRoles: UserRole[] | 'All';
  readTimeMinutes: number;
  keywords: string[];
  purpose: string;
  whenToUse: string;
  quickSteps: string[];
  keyFields?: HelpField[];
  recommendedWorkflow?: string[];
  whatToReviewBeforeSaving?: string[];
  commonMistakes: string[];
  statusMeanings?: StatusExplanation[];
  sections: HelpSection[];
  relatedArticleIds: string[];
}

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  action: string;
  purpose: string;
  targetRoute: string;
  routeLabel: string;
  requiredRoles: UserRole[];
  roleBadgeText: string;
  prerequisites: string[];
  completionChecklist: string[];
  proTip: string;
}

export interface RoleGuide {
  role: UserRole;
  title: string;
  badgeColor: string;
  summary: string;
  responsibilities: string[];
  permittedModules: { name: string; path: string; accessLevel: 'Full Write' | 'Read Only' | 'Executive Oversight' }[];
  restrictedActions: string[];
  monthlyRoutine: string[];
  keySafetyReminders: string[];
}

export interface TroubleshootingItem {
  id: string;
  title: string;
  problem: string;
  possibleReasons: string[];
  safeActionSteps: string[];
  whenToContactAdmin: string;
  relatedModuleId?: string;
  keywords: string[];
}

export interface GlossaryTerm {
  term: string;
  category: 'Accounting' | 'Platform' | 'Audit' | 'Governance';
  definition: string;
  churchContext: string;
  formulaOrRule?: string;
  relatedTerms?: string[];
}

export interface WhatNextScenario {
  id: string;
  triggerQuestion: string;
  shortAnswer: string;
  recommendedRoute: string;
  routeButtonLabel: string;
  steps: string[];
  ruleSummary?: string;
  rolesAllowed: UserRole[] | 'All';
}

export interface QuickStartStep {
  minute: number;
  title: string;
  keyTakeaway: string;
  instructions: string[];
  targetRoute: string;
}
