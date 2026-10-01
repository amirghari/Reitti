/**
 * Reveal-on-scroll, for the landing page only.
 *
 * Each section's content arrives in a way that says what it is (D-33): the
 * staircase builds from the bottom step up, the three steps arrive in order
 * with the numerals counting, the free services are dealt up one by one, and
 * the trust statements follow each other. Movement and drawing only, never a
 * fade: the contrast audit has twice measured text caught mid-fade as a
 * failure.
 *
 * The finished state is what the stylesheet renders. Everything in here is
 * additive: this hook marks the document `js-motion` and tags elements
 * `is-visible` as they arrive, and the CSS only moves anything inside
 * `@media (prefers-reduced-motion: no-preference)` AND under `.js-motion`.
 * So if JavaScript never runs, if the observer is unavailable, or if the person
 * asked their system to reduce motion, nothing is displaced and nothing moves.
 *
 * Anything already on screen when the page loads is shown in the same frame,
 * and anything the page is scrolled past is finished on the next scroll, so a
 * jump never leaves content stuck half-arrived. `once` by design.
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

    const count = (target: Element) => {
      for (const el of target.querySelectorAll<HTMLElement>('[data-count-to]')) {
        const to = Number(el.dataset.countTo);
        // 600ms end to end whatever the number, so 03 does not take longer than 01.
        const step = 600 / Math.max(1, to);
        el.textContent = pad(0);
        for (let n = 1; n <= to; n++) {
          timers.push(window.setTimeout(() => (el.textContent = pad(n)), step * n));
        }
      }
    };

    // Before the document is marked, so content on screen at load is never
    // displaced for even a frame.
    const pending = new Set<Element>();
    for (const target of targets) {
      if (target.getBoundingClientRect().top < window.innerHeight) target.classList.add('is-visible');
      else {
        pending.add(target);
        for (const el of target.querySelectorAll<HTMLElement>('[data-count-to]')) el.textContent = pad(0);
      }
    }
    root.classList.add('js-motion');

    const reveal = (target: Element) => {
      target.classList.add('is-visible');
      pending.delete(target);
      count(target);
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
     * stay half-arrived above the reader for good, a numeral stuck at 00.
     * Anything the page has already scrolled past is finished on the next scroll.
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
      for (const id of timers) window.clearTimeout(id);
      for (const [el, text] of finished) el.textContent = text;
      root.classList.remove('js-motion');
    };
  }, []);
}
