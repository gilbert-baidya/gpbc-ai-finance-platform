import { MODULE_GUIDES } from './moduleGuides';
import { MONTHLY_WORKFLOW_STEPS } from './workflowGuide';
import { ROLE_GUIDES } from './roleGuides';
import { GLOSSARY_TERMS } from './glossary';
import { TROUBLESHOOTING_GUIDES } from './troubleshooting';
import { WHAT_NEXT_SCENARIOS } from './whatNext';
import { QUICK_START_STEPS } from './quickStart';
import { HelpArticle } from './types';
export type { GlossaryTerm, TroubleshootingItem, WorkflowStep, HelpArticle } from './types';
import { UserRole } from '../types/auth';

/**
 * Authoritative mapping from frontend application routes to help article IDs
 */
export const ROUTE_TO_HELP_MAP: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/transactions': 'transactions',
  '/income': 'income',
  '/expenses': 'expenses',
  '/reimbursements': 'reimbursements',
  '/documents': 'documents',
  '/receipts': 'receipts',
  '/checks': 'checks',
  '/capital-projects': 'capital-projects',
  '/reconciliation': 'reconciliation',
  '/audit': 'audit-center',
  '/monthly-close': 'monthly-close',
  '/presbyter-reports': 'presbyter-reports',
  '/settings': 'settings'
};

/**
 * Retrieves a module help article by its route path
 */
export function getHelpArticleByRoute(pathname: string): HelpArticle | undefined {
  const cleanPath = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const articleId = ROUTE_TO_HELP_MAP[cleanPath];
  if (!articleId) return undefined;
  return MODULE_GUIDES.find(a => a.id === articleId);
}

/**
 * Retrieves a module help article by ID or slug
 */
export function getHelpArticleById(idOrSlug: string): HelpArticle | undefined {
  return MODULE_GUIDES.find(a => a.id === idOrSlug || a.slug === idOrSlug);
}

/**
 * Search result item schema
 */
export interface SearchResult {
  type: 'article' | 'glossary' | 'troubleshooting' | 'workflow';
  id: string;
  title: string;
  category: string;
  snippet: string;
  targetRoute?: string;
  articleId?: string;
}

/**
 * Fast client-side search across all help resources
 */
export function searchHelp(query: string, userRole?: UserRole): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  // Search Module Guides
  MODULE_GUIDES.forEach(article => {
    // Check role permission: If Presbyter, hide operational module guides from search results unless general
    if (userRole === 'Presbyter Read-Only' && article.id !== 'presbyter-reports' && article.id !== 'user-roles') {
      // Allow searching presbyter reports and roles
      return;
    }

    const titleMatch = article.title.toLowerCase().includes(q);
    const keywordMatch = article.keywords.some(k => k.toLowerCase().includes(q));
    const summaryMatch = article.summary.toLowerCase().includes(q);
    const mistakeMatch = article.commonMistakes.some(m => m.toLowerCase().includes(q));
    const sectionMatch = article.sections.some(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));

    if (titleMatch || keywordMatch || summaryMatch || mistakeMatch || sectionMatch) {
      let snippet = article.summary;
      if (!summaryMatch && mistakeMatch) {
        const found = article.commonMistakes.find(m => m.toLowerCase().includes(q));
        if (found) snippet = `Mistake warning: ${found}`;
      } else if (!summaryMatch && sectionMatch) {
        const found = article.sections.find(s => s.content.toLowerCase().includes(q));
        if (found) snippet = found.content.substring(0, 140) + '...';
      }

      results.push({
        type: 'article',
        id: article.id,
        title: article.title,
        category: 'Guide',
        snippet,
        targetRoute: `/help/${article.id}`,
        articleId: article.id
      });
    }
  });

  // Search Glossary
  GLOSSARY_TERMS.forEach(term => {
    if (term.term.toLowerCase().includes(q) || term.definition.toLowerCase().includes(q) || term.churchContext.toLowerCase().includes(q)) {
      results.push({
        type: 'glossary',
        id: `glossary-${term.term.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${term.term} (Glossary)`,
        category: `Glossary: ${term.category}`,
        snippet: term.definition,
        targetRoute: `/help?tab=glossary&q=${encodeURIComponent(term.term)}`
      });
    }
  });

  // Search Troubleshooting
  TROUBLESHOOTING_GUIDES.forEach(trouble => {
    if (
      trouble.title.toLowerCase().includes(q) ||
      trouble.problem.toLowerCase().includes(q) ||
      trouble.keywords.some(k => k.toLowerCase().includes(q)) ||
      trouble.safeActionSteps.some(s => s.toLowerCase().includes(q))
    ) {
      results.push({
        type: 'troubleshooting',
        id: trouble.id,
        title: trouble.title,
        category: 'Troubleshooting',
        snippet: trouble.safeActionSteps[0] || trouble.problem,
        targetRoute: `/help?tab=troubleshooting&q=${encodeURIComponent(trouble.id)}`
      });
    }
  });

  // Search Monthly Workflow
  MONTHLY_WORKFLOW_STEPS.forEach(step => {
    if (step.title.toLowerCase().includes(q) || step.action.toLowerCase().includes(q) || step.purpose.toLowerCase().includes(q)) {
      results.push({
        type: 'workflow',
        id: `step-${step.stepNumber}`,
        title: `Step ${step.stepNumber}: ${step.title}`,
        category: 'Monthly Workflow',
        snippet: step.purpose,
        targetRoute: `/help?tab=workflow&step=${step.stepNumber}`
      });
    }
  });

  return results;
}

/**
 * Future-Proof Bilingual (English / Bangla) localization token abstraction
 * Version 1 defaults to English. Bangla phrases can be registered here in Phase 2.
 */
export type SupportedLanguage = 'en' | 'bn';

export const I18N_STRINGS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    helpCenterTitle: 'Help & Training',
    helpCenterSubtitle: 'Learn how to use GPBC Finance Desk, understand church finance workflows, and complete monthly reporting with confidence.',
    searchPlaceholder: 'Search help topics, workflows, rules, or glossary...',
    printGuide: 'Print Guide',
    printCompleteManual: 'Print Complete Manual',
    quickStartTab: '5-Min Quick Start',
    modulesTab: 'Module Guides',
    workflowTab: 'Monthly Workflow',
    rolesTab: 'Your Role',
    whatNextTab: 'What Should I Do Next?',
    troubleshootingTab: 'Troubleshooting',
    glossaryTab: 'Glossary',
    lastUpdated: 'GPBC Finance Desk User Guide • Version 1.0 • Updated September 2026'
  },
  bn: {
    // Ready for Phase 2 Bangla translation without rewriting UI components
    helpCenterTitle: 'সাহায্য ও প্রশিক্ষণ কেন্দ্র (Help & Training)',
    helpCenterSubtitle: 'জিপিবিসি ফাইনান্স ডেস্ক ব্যবহার পদ্ধতি, গির্জার অর্থ ব্যবস্থাপনা ও মাসিক ক্লোজ জানুন।',
    searchPlaceholder: 'সহায়িকা, কাজের ধারা, বা পরিভাষা খুঁজুন...',
    printGuide: 'গাইড প্রিন্ট করুন',
    printCompleteManual: 'সম্পূর্ণ সহায়িকা প্রিন্ট করুন',
    quickStartTab: '৫-মিনিটের পরিচিতি',
    modulesTab: 'মডিউল সহায়িকা',
    workflowTab: 'মাসিক কাজের ধারা',
    rolesTab: 'আপনার ভূমিকা',
    whatNextTab: 'পরবর্তী পদক্ষেপ',
    troubleshootingTab: 'সমস্যা সমাধান',
    glossaryTab: 'শব্দকোষ',
    lastUpdated: 'জিপিবিসি ফাইনান্স ডেস্ক ব্যবহারকারী সহায়িকা • সংস্করণ ১.০'
  }
};

export function getHelpString(key: string, lang: SupportedLanguage = 'en'): string {
  return I18N_STRINGS[lang]?.[key] || I18N_STRINGS.en[key] || key;
}

export {
  MODULE_GUIDES,
  MONTHLY_WORKFLOW_STEPS,
  ROLE_GUIDES,
  GLOSSARY_TERMS,
  TROUBLESHOOTING_GUIDES,
  WHAT_NEXT_SCENARIOS,
  QUICK_START_STEPS
};
