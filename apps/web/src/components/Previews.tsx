/**
 * V1 ships with zero therapists onboarded, so the marketplace appears as clearly
 * labelled previews. Being honest about what does not exist yet is the point —
 * an empty directory dressed up as a live one is how trust gets spent early.
 */
export function Previews() {
  return (
    <section className="previews">
      <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>
        Coming next
      </p>
      <p className="prose" style={{ margin: '0 0 1.5rem', maxWidth: '62ch' }}>
        None of this exists yet. It is here so you can see where the ladder leads once therapists
        are onboarded — not to imply a directory we do not have.
      </p>
      <div className="grid grid-3">
        <article className="preview-card">
          <span className="badge">Coming soon</span>
          <h4 style={{ marginTop: '0.65rem' }}>Find a therapist</h4>
          <p>
            Search verified therapists by approach, language, price and availability — with
            registration checked against Valvira's public register, and availability confirmed by
            the therapist rather than guessed.
          </p>
        </article>
        <article className="preview-card">
          <span className="badge">Coming soon</span>
          <h4 style={{ marginTop: '0.65rem' }}>Groups and workshops</h4>
          <p>
            Professionally led groups at a fraction of individual cost. When enough people are
            waiting for the same kind of group in the same place, Reitti starts one.
          </p>
        </article>
        <article className="preview-card">
          <span className="badge">Coming soon</span>
          <h4 style={{ marginTop: '0.65rem' }}>Track how you're doing</h4>
          <p>
            Re-take a short wellbeing check every few weeks and see the trend — yours to keep, and
            yours to share with a therapist if you want to.
          </p>
        </article>
      </div>
    </section>
  );
}
