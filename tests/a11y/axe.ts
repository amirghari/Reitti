/**
 * The mechanical half of accessibility: axe-core run against the live DOM.
 *
 * It gates on `critical` and `serious` only. `moderate` and `minor` findings are
 * attached to the report and printed rather than failing the run, so existing
 * debt stays visible without wedging the pipeline. That threshold is a ratchet,
 * not a ceiling — tighten it once the moderate list is empty.
 *
 * What green here means: no *mechanical* WCAG failure. It is not a claim that a
 * screen is usable by someone in distress. Automated rules cover roughly a third
 * of WCAG; the rest — is the assessment too long before a payoff, does the crisis
 * panel read as calm — needs a person. This file is the floor, not the standard.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';

type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;
type Violation = AxeResults['violations'][number];

/** WCAG 2.0/2.1/2.2, levels A and AA. AAA is deliberately not a gate. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const BLOCKING_IMPACTS: ReadonlySet<string> = new Set(['critical', 'serious']);

export interface ScanOptions {
  /** Restrict the scan to a subtree, e.g. the crisis dialog. */
  include?: string;
  /**
   * Rules to switch off, each with a written reason. Never disable a rule to
   * make a screen pass — only where axe cannot see what a human already verified.
   */
  disableRules?: Record<string, string>;
}

/**
 * Scan whatever is currently rendered and fail on critical/serious violations.
 * `screen` names the state under test and shows up in the report attachments.
 */
export async function expectNoA11yViolations(
  page: Page,
  testInfo: TestInfo,
  screen: string,
  options: ScanOptions = {},
): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);

  if (options.include) builder = builder.include(options.include);

  const disabled = Object.keys(options.disableRules ?? {});
  if (disabled.length > 0) builder = builder.disableRules(disabled);

  const results = await builder.analyze();

  // The full machine-readable finding list, always attached — a failure should
  // be actionable from the report alone, without re-running anything locally.
  await testInfo.attach(`axe-${slug(screen)}.json`, {
    body: JSON.stringify(
      { screen, url: results.url, violations: results.violations },
      null,
      2,
    ),
    contentType: 'application/json',
  });

  const blocking = results.violations.filter((v) =>
    BLOCKING_IMPACTS.has(v.impact ?? ''),
  );
  const advisory = results.violations.filter(
    (v) => !BLOCKING_IMPACTS.has(v.impact ?? ''),
  );

  for (const violation of advisory) {
    const note = `[a11y advisory · ${screen}] ${violation.impact}: ${violation.id} — ${violation.help} (${violation.nodes.length} node(s))`;
    testInfo.annotations.push({ type: 'a11y-advisory', description: note });
    console.log(note);
  }

  expect(
    blocking.map(describe).join('\n\n'),
    `critical/serious accessibility violations on "${screen}"`,
  ).toBe('');
}

function describe(violation: Violation): string {
  const nodes = violation.nodes.slice(0, 5).map((node) => {
    const target = node.target.map(String).join(' ');
    const detail = node.failureSummary?.split('\n').join(' ').trim();
    return `    → ${target}${detail ? `\n      ${detail}` : ''}`;
  });
  const more =
    violation.nodes.length > 5
      ? `    → …and ${violation.nodes.length - 5} more node(s)`
      : '';

  return [
    `${(violation.impact ?? 'unknown').toUpperCase()} · ${violation.id} — ${violation.help}`,
    `    ${violation.helpUrl}`,
    ...nodes,
    more,
  ]
    .filter(Boolean)
    .join('\n');
}

const slug = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
