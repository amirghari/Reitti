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
    const timers: number[] = [];

    /**
     * Numerals marked `data-count-to` count up from 00 as their row arrives. The
     * finished number is what the markup holds, so this only ever runs forward
     * from a state it set itself, and a cleanup mid-count puts the number back.
     */
    const counters = targets.flatMap((target) =>
      Array.from(target.querySelectorAll<HTMLElement>('[data-count-to]')),
    );
    const finished = new Map(counters.map((el) => [el, el.textContent ?? '']));
    const pad = (n: number) => String(n).padStart(2, '0');
    for (const el of counters) el.textContent = pad(0);

    const reveal = (target: Element) => {
      target.classList.add('is-visible');
      for (const el of target.querySelectorAll<HTMLElement>('[data-count-to]')) {
        const to = Number(el.dataset.countTo);
        // 600ms end to end, whatever the number, so 03 does not take longer than 01.
        const step = 600 / Math.max(1, to);
        for (let n = 1; n <= to; n++) {
          timers.push(window.setTimeout(() => (el.textContent = pad(n)), step * n));
        }
      }
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

    const pending = new Set<Element>();
    for (const target of targets) {
      // Anything already on screen at mount is revealed immediately rather than
      // waiting for a scroll that may never come.
      if (target.getBoundingClientRect().top < window.innerHeight) {
        reveal(target);
      } else {
        pending.add(target);
        observer.observe(target);
      }
    }

    /**
     * An observer only reports an element crossing into view. A jump that lands
     * past one, like the hero's link straight to the ladder, never crosses it,
     * so it would stay in its pre-arrival state for good: shifted, and with a
     * numeral stuck at 00. Anything the page has already scrolled past is
     * therefore finished on the next scroll.
     */
    let frame = 0;
    const settlePassed = () => {
      frame = 0;
      for (const target of pending) {
        if (target.classList.contains('is-visible')) pending.delete(target);
        else if (target.getBoundingClientRect().bottom <= 0) {
          reveal(target);
          observer.unobserve(target);
          pending.delete(target);
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
      for (const id of timers) window.clearTimeout(id);
      for (const [el, text] of finished) el.textContent = text;
      root.classList.remove('js-motion');
    };
  }, []);
}
