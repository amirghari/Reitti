/**
 * Demand pooling, from the person's side (A3).
 *
 * The consent copy names the three values that will be sent, verbatim. That is
 * deliberate: a consent notice that says "anonymous usage data" is not consent,
 * it is a shrug. Here the person can read the entire request before making it.
 */
import { useEffect, useState } from 'react';
import { thresholdFor, topicsForRung, type GroupTopic, type PoolCount } from '@reitti/engine';
import { groups } from '../config';
import { t } from '../i18n';
import { poolingEnabled, readCount, registerInterest } from '../pool';
import { joined, recordJoin } from '../waitlist';

export function GroupWaitlist({ rungId, careLanguage }: { rungId: string; careLanguage: string }) {
  const topics = topicsForRung(groups, rungId);

  // Region is asked here rather than in the context questions, because it is
  // only ever needed by this feature. A person who never looks at a group is
  // never asked where they live.
  const [region, setRegion] = useState<string>('');

  if (topics.length === 0) return null;

  return (
    <section className="waitlist" data-pooling={poolingEnabled() ? 'on' : 'off'}>
      <h3 className="waitlist-heading">{t('waitlist.heading')}</h3>
      <p className="waitlist-help">{t('waitlist.help')}</p>

      <p className="waitlist-region-label" id="waitlist-region-label">
        {t('waitlist.regionQuestion')}
      </p>
      <select
        className="waitlist-region"
        aria-labelledby="waitlist-region-label"
        value={region}
        onChange={(event) => setRegion(event.target.value)}
      >
        <option value="">{t('waitlist.regionPlaceholder')}</option>
        {groups.regions.map((id) => (
          <option key={id} value={id}>
            {t(`region.${id}`)}
          </option>
        ))}
      </select>

      <ul className="waitlist-list">
        {topics.map((topic) => (
          <TopicRow key={topic.id} topic={topic} careLanguage={careLanguage} region={region} />
        ))}
      </ul>

      <p className="waitlist-privacy">{t('waitlist.privacy')}</p>
    </section>
  );
}

function TopicRow({
  topic,
  careLanguage,
  region,
}: {
  topic: GroupTopic;
  careLanguage: string;
  region: string;
}) {
  const [count, setCount] = useState<PoolCount | null>(null);
  const [hasJoined, setHasJoined] = useState(() => (region ? joined(topic.id, region) : false));
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!region) return;
    let cancelled = false;
    readCount({ topicId: topic.id, region, careLanguage })
      .then((result) => {
        if (!cancelled) setCount(result);
      })
      .catch(() => {
        /* a counter that cannot be read is not a reason to break the page */
      });
    return () => {
      cancelled = true;
    };
  }, [topic.id, region, careLanguage]);

  const join = async () => {
    const result = await registerInterest({ topicId: topic.id, region, careLanguage }).catch(
      () => null,
    );
    recordJoin(topic.id, region, careLanguage);
    setHasJoined(true);
    setConfirming(false);
    if (result) setCount(result);
  };

  const threshold = thresholdFor(groups, topic.id);
  const shown = count ?? { count: 0, threshold, ready: false };

  return (
    <li className="waitlist-topic" data-topic={topic.id}>
      <div className="waitlist-topic-head">
        <h4 className="waitlist-topic-name">{t(topic.nameRef)}</h4>
        {count && (
          <span className="waitlist-count">
            {t('waitlist.count')
              .replace('{count}', String(shown.count))
              .replace('{threshold}', String(shown.threshold))}
          </span>
        )}
      </div>
      <p className="waitlist-topic-description">{t(topic.descriptionRef)}</p>

      {shown.ready && <p className="waitlist-ready">{t('waitlist.ready')}</p>}

      {hasJoined ? (
        <p className="waitlist-joined">{t('waitlist.joined')}</p>
      ) : confirming ? (
        <div className="waitlist-consent">
          {/* The whole request, in words, before it is made. */}
          <p className="waitlist-consent-body">
            {t('waitlist.consent')
              .replace('{topic}', t(topic.nameRef))
              .replace('{region}', t(`region.${region}`))
              .replace('{language}', t(`directory.language.${careLanguage}`))}
          </p>
          <div className="waitlist-consent-actions">
            <button type="button" className="btn btn-small" onClick={join}>
              {t('waitlist.consentConfirm')}
            </button>
            <button type="button" className="link" onClick={() => setConfirming(false)}>
              {t('waitlist.consentCancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-ghost btn-small"
          disabled={!poolingEnabled() || !region}
          onClick={() => setConfirming(true)}
        >
          {!poolingEnabled()
            ? t('waitlist.unavailable')
            : region
              ? t('waitlist.join')
              : t('waitlist.chooseRegionFirst')}
        </button>
      )}
    </li>
  );
}
