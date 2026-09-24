/**
 * Moving focus to the question a screen has just advanced to.
 *
 * Answering advances the screen by itself, with no submit and no page change.
 * Without this, focus either stays on the option button that was just pressed —
 * which a moment later carries an answer to a question the person has not been
 * told about — or is dropped onto <body> when the component behind it is
 * replaced, as it is between the context questions and the first instrument.
 *
 * The one thing this must not do is take focus on page load. A draft restores
 * automatically into the middle of the questionnaire (see draft.ts), so a mount
 * is not by itself proof that the person did anything. A mount that follows a
 * real interaction is, and that is all the flag below records.
 */
import { useEffect, useRef, type RefObject } from 'react';

let interacted = false;

if (typeof document !== 'undefined') {
  const mark = () => {
    interacted = true;
  };
  // Capture phase, so a handler that stops propagation cannot hide the fact that
  // the person did something. Passive: this never calls preventDefault.
  const options = { capture: true, passive: true } as const;
  document.addEventListener('pointerdown', mark, options);
  document.addEventListener('keydown', mark, options);
}

/**
 * Focus `target` whenever `at` changes to a new screen.
 *
 * `at` identifies the screen, not just its number, so a questionnaire that opens
 * on a gate and then shows its first item counts as having moved.
 *
 * `hold` is for the crisis panel: while that dialog is open it owns focus, and
 * pulling focus out of it is safety invariant 1 failing quietly.
 */
export function useAdvanceFocus(
  target: RefObject<HTMLElement | null>,
  at: string | number,
  { hold = false }: { hold?: boolean } = {},
): void {
  const focused = useRef<string | number | null>(null);

  useEffect(() => {
    if (hold) return;
    if (focused.current === at) return;

    const firstScreen = focused.current === null;
    focused.current = at;

    // The first screen of a mount is an advance only if something the person did
    // caused the mount. On a cold load with a restored draft, it did not.
    if (firstScreen && !interacted) return;

    target.current?.focus();
  }, [target, at, hold]);
}
