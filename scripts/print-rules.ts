/**
 * Prints the routing table for clinician sign-off.
 *
 * The whole clinical decision surface has to fit on a page a clinician can read,
 * mark up, and sign. If this output ever stops being readable, the rules have
 * grown past what a human can govern — which is a design problem, not a formatting one.
 *
 *   npm run rules:print
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { printRulesTable } from '../packages/engine/src/routing.ts';
import type { FlowConfig } from '../packages/engine/src/flow.ts';
import type { Instrument, Ladder, RoutingRules } from '../packages/engine/src/types.ts';

const CONFIG = join(dirname(fileURLToPath(import.meta.url)), '../config');
const read = <T>(...p: string[]): T => JSON.parse(readFileSync(join(CONFIG, ...p), 'utf8')) as T;

const rules = read<RoutingRules>('routing', 'rules.json');
const flow = read<FlowConfig>('routing', 'flow.json');
const ladder = read<Ladder>('ladder', 'ladder.json');
const instrumentIds = ['phq-4', 'phq-9', 'gad-7', 'who-5', 'audit-c', 'pc-ptsd-5'];
const instruments = instrumentIds.map((id) => read<Instrument>('instruments', `${id}.json`));

const rule = (char = '─') => char.repeat(78);

console.log(`\n${rule('═')}`);
console.log('REITTI — CLINICAL DECISION SURFACE  ·  FOR SIGN-OFF');
console.log('All clinical content below is PROVISIONAL until signed off.');
console.log(rule('═'));

console.log('\nINSTRUMENTS\n');
for (const inst of instruments) {
  console.log(`  ${inst.name.padEnd(12)} ${inst.type.padEnd(9)} ${inst.license.padEnd(14)} ${inst.items.length} items`);
  console.log(`  ${''.padEnd(12)} ${inst.source}`);
  const bands = inst.bands.map((b) => `${b.min}–${b.max} ${b.bandId}`).join('  ·  ');
  console.log(`  ${''.padEnd(12)} bands: ${bands}`);
  if (inst.crisisItem) {
    console.log(`  ${''.padEnd(12)} ⚠ CRISIS TRIGGER: item "${inst.crisisItem.key}" ≥ ${inst.crisisItem.triggerIf.atLeast}`);
  }
  if (inst.safetyFlag) {
    console.log(`  ${''.padEnd(12)} flag "${inst.safetyFlag.flag}" when band = ${inst.safetyFlag.ifBandId}`);
  }
  if (inst.note) console.log(`  ${''.padEnd(12)} NOTE: ${inst.note}`);
  console.log();
}

console.log(rule());
console.log('\nTHE TIERED FUNNEL  (who sees which test)\n');
console.log(`  Everyone starts on: ${flow.entry}`);
for (const inst of instruments) {
  for (const branch of inst.branchesTo ?? []) {
    const cond = branch.ifSubscaleAtLeast
      ? `${branch.ifSubscaleAtLeast.subscale} subscale ≥ ${branch.ifSubscaleAtLeast.score}`
      : `score ≥ ${branch.ifScoreAtLeast}`;
    console.log(`  ${inst.id}: ${cond}  →  ${branch.instrumentId}`);
  }
}
for (const trigger of flow.domainTriggers) {
  console.log(`  ${trigger.id}  domain in [${trigger.ifDomainIn.join(', ')}]  →  ${trigger.instrumentId}`);
  console.log(`       ↳ ${trigger.because}`);
}
for (const trigger of flow.severityTriggers) {
  console.log(`  ${trigger.id}  severity ≥ ${trigger.ifSeverityAtLeast}  →  ${trigger.instrumentId}`);
  console.log(`       ↳ ${trigger.because}`);
}

console.log(`\n${rule()}\n`);
console.log(printRulesTable(rules));

console.log(`\n${rule()}`);
console.log('\nTHE LADDER\n');
for (const rung of [...ladder.rungs].sort((a, b) => a.level - b.level)) {
  console.log(`  ${rung.level}  ${rung.id.padEnd(24)} ${rung.typicalCost}${rung.publicFirst ? '  [public-first]' : ''}`);
  if (rung.note) console.log(`     ↳ ${rung.note}`);
}

console.log(`\n${rule('═')}`);
console.log('Signed: ______________________________   Date: ______________');
console.log(`${rule('═')}\n`);
