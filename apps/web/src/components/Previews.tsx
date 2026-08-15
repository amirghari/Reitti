/**
 * V1 ships with zero therapists onboarded, so the marketplace appears as clearly
 * labelled previews. Being honest about what does not exist yet is the point —
 * an empty directory dressed up as a live one is how trust gets spent early.
 */
export function Previews() {
  return (
    <section className="previews">
      <h3>Coming next</h3>
      <div className="preview-grid">
        <article className="preview-card">
          <span className="badge">Coming soon</span>
          <h4>Find a therapist</h4>
          <p>
            Search verified therapists by approach, language, price and availability — with
            registration checked against Valvira's public register.
          </p>
        </article>
        <article className="preview-card">
          <span className="badge">Coming soon</span>
          <h4>Groups and workshops</h4>
          <p>
            Professionally led groups at a fraction of individual cost. When enough people are
            waiting for the same kind of group, Reitti starts one.
          </p>
        </article>
        <article className="preview-card">
          <span className="badge">Coming soon</span>
          <h4>Track how you're doing</h4>
          <p>
            Re-take a short wellbeing check every few weeks and see the trend — yours to keep, and
            yours to share with a therapist if you want to.
          </p>
        </article>
      </div>
    </section>
  );
}
