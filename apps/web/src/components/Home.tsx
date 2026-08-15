/**
 * The home page carries the argument for the product, not just the entry button.
 *
 * Structure follows the standalone prototype: hero → the two values → the gap in
 * the market → today-vs-Reitti → where to start. Every claim here has to survive
 * a clinician reading it, so there are no invented statistics; where a number
 * would help, the copy names the mechanism instead.
 */
import { useState } from 'react';
import { ladder } from '../config';
import { t } from '../i18n';
import { Previews } from './Previews';

const COST_LABEL: Record<string, string> = {
  free: 'Free',
  'free-with-referral': 'Free · referral',
  low: 'Low cost',
  medium: 'Self-pay',
  subsidised: 'Subsidised',
};

const GAPS = [
  {
    num: '01',
    title: 'Availability is unknown',
    body: "Directories list who exists, not who is taking clients. People contact therapist after therapist to find out.",
  },
  {
    num: '02',
    title: 'The Kela path is opaque',
    body: 'Eligibility, method, language and availability live in different places, so nobody sees them in one view.',
  },
  {
    num: '03',
    title: 'No guided front door',
    body: 'A first-time help-seeker has to already know whether they need self-help, a group, nettiterapia or Kela psychotherapy.',
  },
  {
    num: '04',
    title: 'Everything is fragmented',
    body: 'Public services and private providers each hold one slice. There is no single current picture of what is reachable.',
  },
  {
    num: '05',
    title: 'Language narrows it further',
    body: 'Finding support in Swedish, English or another language — with a real opening — is guesswork today.',
  },
];

const TODAY_STEPS = [
  'Search a directory',
  'Email a therapist',
  'No reply',
  'Email another',
  '“Not taking new clients”',
  'Repeat',
  'Weeks pass',
];

const REITTI_STEPS = [
  'Answer a few questions',
  'Get a suggested rung of the ladder',
  'See what is reachable at that level',
  'Or start free self-help today, while you wait',
];

export function Home({
  onStart,
  onOpenCrisis,
}: {
  onStart: () => void;
  onOpenCrisis: () => void;
}) {
  // The comparison reveals one dead end at a time. Reading the friction beats
  // being told about it, and it costs one piece of state.
  const [revealed, setRevealed] = useState(1);
  const rungs = [...ladder.rungs].sort((a, b) => a.level - b.level);

  return (
    <>
      <section className="wrap hero">
        <div>
          <p className="eyebrow">The access layer for Finnish mental health care</p>
          <h1 className="display">The right kind of help, at the right level — and actually reachable.</h1>
          <p className="lede" style={{ marginTop: '1.35rem' }}>
            Most services can tell you who exists. Reitti works out which <em>kind</em> of support fits
            what you are carrying right now — free self-help, a group, guided online therapy or
            individual sessions — and points you at the step that matches.
          </p>
          <div className="hero-cta">
            <button type="button" className="btn btn-large" onClick={onStart}>
              Find your path
            </button>
            <button type="button" className="btn btn-secondary btn-large" onClick={onOpenCrisis}>
              I need help now
            </button>
          </div>
          <div className="assurances">
            <span className="pill">Your answers stay on this device</span>
            <span className="pill">No account, no email</span>
            <span className="pill">Guidance, never a diagnosis</span>
          </div>
        </div>

        <aside className="ladder-card">
          <div className="ladder-head">
            <span className="mono" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              The stepped-care ladder
            </span>
            <span className="mono">6 rungs</span>
          </div>
          {rungs.map((rung) => (
            <div key={rung.id} className="ladder-row">
              <span className="ladder-step">{rung.level}</span>
              <span className="ladder-name">{t(rung.labelRef)}</span>
              <span className="ladder-cost">{COST_LABEL[rung.typicalCost] ?? rung.typicalCost}</span>
            </div>
          ))}
          <p className="ladder-foot">
            Every rung is real care. Starting lower is not lesser treatment — matching intensity to
            need is how stepped care is meant to work, and it is what keeps the scarce rungs
            available for the people who need them.
          </p>
        </aside>
      </section>

      <section className="band">
        <div className="wrap" style={{ paddingBlock: '3.9rem 4.2rem' }}>
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>
            What Reitti is for
          </p>
          <p className="prose" style={{ margin: '0 0 1.9rem', maxWidth: '60ch' }}>
            Two objectives. Everything else in the product exists as evidence for one of them.
          </p>
          <div className="grid grid-2">
            <article className="value-card">
              <p className="value-eyebrow">Objective 1</p>
              <h2 className="value-title">The right session</h2>
              <p className="value-body">
                A short, non-diagnostic assessment routes you to the right <em>kind</em> of care — not
                just to whoever has an open slot.
              </p>
              <p className="value-foot">
                Scored against published cutoffs by rules a clinician signs off. No inference, no
                diagnosis, no AI in the decision.
              </p>
            </article>
            <article className="value-card">
              <p className="value-eyebrow">Objective 2</p>
              <h2 className="value-title">Reachable for anyone</h2>
              <p className="value-body">
                A stepped-care ladder, groups and demand pooling make help reachable at every budget —
                including capacity that does not exist yet.
              </p>
              <p className="value-foot">
                Free and public options surface first whenever that is clinically sensible. Budget
                shifts what we suggest; it never hides an option from you.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap" style={{ paddingBlock: '3.9rem' }}>
          <h2 className="section-title">Discovery is solved. Access is not.</h2>
          <p className="prose" style={{ margin: '0.6rem 0 2.4rem' }}>
            Listings tell you a therapist exists. They do not tell you whether anyone is taking
            clients, whether Kela will cover it, or — the question underneath all of it — what you
            should be looking for in the first place.
          </p>
          <div className="grid grid-3">
            {GAPS.map((gap) => (
              <div key={gap.num} className="gap-card">
                <div className="gap-num">{gap.num}</div>
                <h3>{gap.title}</h3>
                <p>{gap.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap" style={{ paddingBlock: '3.9rem' }}>
          <h2 className="section-title">The same search, two ways</h2>
          <p className="prose" style={{ margin: '0.6rem 0 2.2rem' }}>
            Click through the first path to see where it stalls.
          </p>
          <div className="grid grid-2">
            <div className="compare-col">
              <div className="compare-head">
                <h3>Finding help today</h3>
                <button
                  type="button"
                  className="link"
                  onClick={() => setRevealed(revealed >= TODAY_STEPS.length ? 1 : revealed + 1)}
                >
                  {revealed >= TODAY_STEPS.length ? 'Start over' : 'Next step →'}
                </button>
              </div>
              <div className="step-list">
                {TODAY_STEPS.map((label, i) => {
                  const shown = i < revealed;
                  const dead = i > 0;
                  return (
                    <div
                      key={label}
                      className={`step ${shown ? '' : 'hidden'} ${shown && dead ? 'dead' : ''}`}
                    >
                      <span className="step-mark">{dead ? '×' : '→'}</span>
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="compare-col reitti">
              <div className="compare-head">
                <h3>With Reitti</h3>
              </div>
              <div className="step-list">
                {REITTI_STEPS.map((label) => (
                  <div key={label} className="step good">
                    <span className="step-mark">✓</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBlock: '3.4rem 1rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>
          Where to start
        </p>
        <p className="prose" style={{ margin: '0 0 1.5rem', maxWidth: '62ch' }}>
          Three ways in. Each one leads to one of the two objectives above.
        </p>
        <div className="grid grid-3">
          <div className="entry-card">
            <h3>Not sure what you need?</h3>
            <p>
              A short assessment suggests where on the ladder to start, from free self-help through
              to Kela rehabilitative psychotherapy. Guidance, not a medical assessment.
            </p>
            <button type="button" className="btn btn-ghost" onClick={onStart}>
              Start the assessment
            </button>
          </div>
          <div className="entry-card">
            <h3>Individual therapy is not the only first step</h3>
            <p>
              Professionally led groups, workshops and free peer support work well for many common
              difficulties — at a fraction of the cost. If no suitable group exists yet, the plan is
              to form one.
            </p>
            <span className="badge">Coming soon</span>
          </div>
          <div className="entry-card">
            <h3>Preparing for a first session?</h3>
            <p>
              Short questionnaires help you see what is under strain, and you can print a summary to
              hand to a therapist so the first session starts where it matters.
            </p>
            <button type="button" className="btn btn-ghost" onClick={onStart}>
              See the questions
            </button>
          </div>
        </div>
      </section>

      <div className="wrap">
        <Previews />
      </div>
    </>
  );
}
