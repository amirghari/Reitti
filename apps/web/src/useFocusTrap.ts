/**
 * Keep focus inside a dialog while it is open, and give it back when it closes.
 *
 * `aria-modal` is a promise to assistive technology, not an implementation.
 * Without a trap, Tab walks straight out of the dialog and into the page behind
 * it, and somebody using a keyboard is interacting with content they believe is
 * covered.
 *
 * The crisis panel has its own copy of this logic and deliberately keeps it.
 * That panel is covered by safety invariants 1–3 and `CLAUDE.md` says not to
 * touch the crisis path except to add crisis lines; refactoring it to share this
 * hook would be a change to the one screen that must never regress, made for
 * tidiness. The duplication is the cheaper risk.
 */
import { useEffect, type RefObject } from 'react';

export function useFocusTrap(
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  focusFirst?: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null;
    focusFirst?.current?.focus();

    const focusable = (): HTMLElement[] =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const stops = focusable();
      if (stops.length === 0) return;

      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Wrap at both ends, and pull focus back in if it has already escaped
      // (a browser-chrome round trip can leave it on <body>).
      if (!active || !panelRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (restoreTo?.isConnected) restoreTo.focus();
    };
  }, [panelRef, onClose, focusFirst]);
}
