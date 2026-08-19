/**
 * Loads the governance surface.
 *
 * V1 bundles config at build time. Architecture v2 §5 replaces this module with a
 * fetch from a versioned CDN so a clinician can ship a cutoff change without a
 * deploy — nothing outside this file needs to change when that happens.
 */
import type { FlowConfig, Instrument, Ladder, RoutingRules } from '@reitti/engine';

import phq4 from '@config/instruments/phq-4.json';
import phq9 from '@config/instruments/phq-9.json';
import gad7 from '@config/instruments/gad-7.json';
import who5 from '@config/instruments/who-5.json';
import auditC from '@config/instruments/audit-c.json';
import pcPtsd5 from '@config/instruments/pc-ptsd-5.json';
import ucla3 from '@config/instruments/ucla-3.json';
import rulesJson from '@config/routing/rules.json';
import flowJson from '@config/routing/flow.json';
import ladderJson from '@config/ladder/ladder.json';
import crisisJson from '@config/crisis.json';

export const instruments = [phq4, phq9, gad7, who5, auditC, pcPtsd5, ucla3] as unknown as Instrument[];
export const rules = rulesJson as unknown as RoutingRules;
export const flow = flowJson as unknown as FlowConfig;
export const ladder = ladderJson as unknown as Ladder;

export interface CrisisResource {
  id: string;
  nameRef: string;
  phone: string;
  languages: string[];
  availability: string;
  verified: boolean;
}

export const crisis = crisisJson as unknown as { version: string; resources: CrisisResource[] };

export const instrumentById = (id: string): Instrument => {
  const found = instruments.find((i) => i.id === id);
  if (!found) throw new Error(`No instrument config "${id}"`);
  return found;
};

/** What the person tells us before any instrument runs. Feeds routing and the flow. */
export const DOMAINS = [
  { id: 'mood', label: 'Low mood, or nothing feels worth it' },
  { id: 'anxiety', label: 'Worry, tension, or panic' },
  { id: 'work', label: 'Work stress or burnout' },
  { id: 'social', label: 'Loneliness or relationships' },
  { id: 'grief', label: 'Grief, loss, or a big change' },
  { id: 'substance', label: 'Alcohol or other substances' },
  { id: 'general', label: "I'm not sure yet" },
] as const;

export const DURATIONS = [
  { id: 'under-a-month', label: 'Less than a month' },
  { id: '1-6-months', label: 'One to six months' },
  { id: '6-12-months', label: 'Six months to a year' },
  { id: 'over-a-year', label: 'More than a year' },
] as const;

export const BUDGETS = [
  { id: 'none', label: 'Nothing — it needs to be free' },
  { id: 'low', label: 'A small amount' },
  { id: 'moderate', label: 'A moderate amount' },
  { id: 'flexible', label: "Cost isn't the main constraint" },
] as const;

export const LANGUAGES = [
  { id: 'fi', label: 'Suomi' },
  { id: 'sv', label: 'Svenska' },
  { id: 'en', label: 'English' },
] as const;
