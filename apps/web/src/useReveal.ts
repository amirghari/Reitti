/**
 * Reveal-on-scroll, for the landing page only: one short fade per section.
 *
 * The motion policy since D-32 is one ambient loop in the hero and interaction
 * everywhere else. What is left here is the least motion that still marks a
 * section arriving: each landing section fades in over 250ms the first time it
 * scrolls into view. No sliding, no staggering, no counting.
 *
 * The finished state is what the stylesheet renders. Everything in here is
 * additive: this hook marks the document `js-motion` and tags sections
 * `is-visible` as they arrive, and the CSS only hides anything inside
 * `@media (prefers-reduced-motion: no-preference)` AND under `.js-motion`.
 * So if JavaScript never runs, if the observer is unavailable, or if the person
 * asked their system to reduce motion, nothing is hidden and nothing moves. A
 * page that animates itself into visibility is a page that stays invisible for
 * somebody, and on a mental-health site that somebody is looking for a phone
 * number.
 *
 * A section already on screen when the page loads is shown in the same frame,
 * without the fade. That matters beyond looks: the contrast audit has twice
 * measured text caught halfway through a fade as a failure, and the sections a
 * page opens on are the ones an audit reads first.
 *
 * `once` by design. Sections that re-animate every time they scroll past are
 * motion that exists for its own sake.
 */
import { useEffect } from 'react';

export function useReveal(): void {
  useEffect(() => {
    const root = document.documentElement;

    // Nothing to do if the person asked for less motion: leave the document
    // unmarked so the CSS never takes over from the finished state.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

    // Before the document is marked, so a section on screen at load is never
    // hidden for even a frame.
    const pending = new Set<Element>();
    for (const target of targets) {
      if (target.getBoundingClientRect().top < window.innerHeight) target.classList.add('is-visible');
      else pending.add(target);
    }
    root.classList.add('js-motion');

    const reveal = (target: Element) => {
      target.classList.add('is-visible');
      pending.delete(target);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 },
    );
    for (const target of pending) observer.observe(target);

    /**
     * An observer only reports an element crossing into view. A jump that lands
     * past one, like a link to the free options, never crosses it, so it would
     * stay faded out above the reader for good. Anything the page has already
     * scrolled past is therefore finished on the next scroll.
     */
    let frame = 0;
    const settlePassed = () => {
      frame = 0;
      for (const target of pending) {
        if (target.getBoundingClientRect().bottom <= 0) {
          reveal(target);
          observer.unobserve(target);
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(settlePassed);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      root.classList.remove('js-motion');
    };
  }, []);
}
