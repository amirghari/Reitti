/**
 * A chosen answer stays on screen, filled, for a moment before the next question.
 *
 * Answering advances by itself, so without a pause the card a person tapped was
 * replaced in the same frame and the selection was never seen. The review asked
 * for an indicator that fills on select; this is the time it gets to be seen in.
 *
 * It is not motion: with reduced motion the fill is instant, and the pause is
 * still there, because the pause is the acknowledgement.
 *
 * Only ever for an ordinary answer. A crisis answer is never held: the panel
 * opens the moment the answer is given, before anything else happens
 * (invariant 2), so the caller checks for crisis before calling `hold`.
 */
import { useEffect, useRef, useState } from 'react';

export const ANSWER_HOLD_MS = 260;

export function useAnswerHold() {
  const timer = useRef<number | null>(null);
  const [holding, setHolding] = useState(false);

  // Leaving the screen mid-hold (Start over, the wordmark) must not advance a
  // questionnaire that is no longer there.
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const hold = (then: () => void) => {
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      then();
    }, ANSWER_HOLD_MS);
  };

  /** "Previous question" during a hold: the pending advance is dropped. */
  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  return { holding, hold, cancel };
}
