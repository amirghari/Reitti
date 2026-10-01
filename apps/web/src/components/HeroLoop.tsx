/**
 * The one ambient motion on the site: the hero photograph, as a slow loop.
 *
 * The motion policy (D-32) is one cinematic element and nothing else that moves
 * on its own. Everything below the hero responds only to what the person does.
 *
 * The still `<img>` in Home stays in the DOM in every case and carries the alt
 * text; this video sits over it, hidden from assistive tech, and is decoration.
 * It is mounted only when all of these hold, and the still is what renders
 * otherwise:
 *
 *   - the person has not asked for reduced motion, and JavaScript is running
 *     (this component only renders anything after mount);
 *   - the screen is wider than 640px, because a phone pays for the bytes;
 *   - the browser has not asked to save data.
 *
 * It pauses when the tab is hidden and when the hero leaves the viewport, so it
 * never plays where nobody can see it. The files are supplied by the product
 * owner (`hero-loop.webm`, `hero-loop.mp4` in `public/img/`); until they exist,
 * the first failed load removes the element and the still is all there is.
 */
import { useEffect, useRef, useState } from 'react';

const NO_MOTION = '(prefers-reduced-motion: reduce)';
const PHONE = '(max-width: 640px)';

const saveData = (): boolean =>
  Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

export function HeroLoop({ poster }: { poster: string }) {
  const [allowed, setAllowed] = useState(false);
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  // Decided after mount, and again whenever either media query changes: turning
  // on reduced motion mid-visit takes the video away at once.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const noMotion = window.matchMedia(NO_MOTION);
    const phone = window.matchMedia(PHONE);
    const decide = () => setAllowed(!noMotion.matches && !phone.matches && !saveData());
    decide();
    noMotion.addEventListener('change', decide);
    phone.addEventListener('change', decide);
    return () => {
      noMotion.removeEventListener('change', decide);
      phone.removeEventListener('change', decide);
    };
  }, []);

  // Play only where it can be seen.
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let onScreen = true;
    const sync = () => {
      if (document.visibilityState === 'visible' && onScreen) void el.play().catch(() => undefined);
      else el.pause();
    };
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting;
            sync();
          });
    observer?.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [allowed, failed]);

  if (!allowed || failed) return null;

  return (
    <video
      ref={video}
      className="hero-loop"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={poster}
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src="/img/hero-loop.webm" type="video/webm" />
      {/* The last source failing is the video failing: nothing else will load. */}
      <source src="/img/hero-loop.mp4" type="video/mp4" onError={() => setFailed(true)} />
    </video>
  );
}
