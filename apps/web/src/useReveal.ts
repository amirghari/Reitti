/**
 * Reveal-on-scroll, for the landing page only.
 *
 * The finished state is what the stylesheet renders. Everything in here is
 * additive: this hook marks the document `js-motion` and tags elements
 * `is-visible` as they arrive, and the CSS only hides anything inside
 * `@media (prefers-reduced-motion: no-preference)` AND under `.js-motion`.
 *
 * So if JavaScript never runs, if the observer is unavailable, or if the person
 * asked their system to reduce motion, nothing is hidden and nothing moves. A
 * page that animates itself into visibility is a page that stays invisible for
 * somebody, and on a mental-health site that somebody is looking for a phone
 * number.
 *
 * `once: true` by design. Elements that re-animate every time they scroll past
 * are the kind of motion that exists for its own sake.
 */
import { useEffect } from 'react';

export function useReveal(): void {
  useEffect(() => {
    const root = document.documentElement;

    // Nothing to do if the person asked for less motion: leave the document
    // unmarked so the CSS never takes over from the finished state.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;

    root.classList.add('js-motion');

    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 },
    );

    for (const target of targets) {
      // Anything already on screen at mount is revealed immediately rather than
      // waiting for a scroll that may never come.
      if (target.getBoundingClientRect().top < window.innerHeight) {
        target.classList.add('is-visible');
      } else {
        observer.observe(target);
      }
    }

    return () => {
      observer.disconnect();
      root.classList.remove('js-motion');
    };
  }, []);
}
