/**
 * @reitti/ai — the AI slot. Deliberately empty in V1.
 *
 * Architecture v2 §6: the AI layer sits behind ONE interface, is assistance-only,
 * and is never on the critical path. If it is absent, disabled, or failing, the
 * app must work identically on rules alone — which is why V1 ships with a null
 * implementation and the app never branches on its presence.
 *
 * Safety invariant 5 is structural, not a convention: this module cannot import
 * the routing engine and exposes no way to produce a rung, a band, or a
 * diagnosis. Filling the slot in Phase 2 must not widen AssistRequest beyond
 * text that has ALREADY been through the deterministic core.
 */

export type AssistJob =
  /** Understand optional free text the user wrote, into config-known domain tags. */
  | 'understand-free-text'
  /** Explain a result the rules engine already produced, in plain language. */
  | 'explain-result'
  /** Draft copy the user may send to a doctor to request a referral. */
  | 'draft-referral-request';

export interface AssistRequest {
  job: AssistJob;
  /** Never raw answers, never a crisis context — only what the core has already decided. */
  context: Readonly<Record<string, string | number | boolean>>;
}

export interface AssistResponse {
  job: AssistJob;
  text: string;
  /** Every AI output is labelled as such to the user. Non-negotiable. */
  aiGenerated: true;
}

export interface Assistant {
  assist(request: AssistRequest): Promise<AssistResponse | null>;
}

/**
 * V1's assistant: always declines. Callers must treat null as the normal case
 * and render the rules-only experience — that is what keeps AI off the critical path.
 */
export const nullAssistant: Assistant = {
  async assist() {
    return null;
  },
};

/** Jobs the AI layer may never perform, enforced when the slot is filled. */
export const FORBIDDEN_JOBS = [
  'diagnose',
  'route',
  'override-crisis',
  'reorder-clinical-matches',
] as const;
