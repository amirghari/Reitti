/**
 * While you wait (C2).
 *
 * Every referral in Finnish mental health care comes with a wait, and a routing
 * tool that ends at "ask for a referral" hands somebody a queue and calls it
 * help. This block follows any referral-shaped rung: something to use on your
 * own, someone to talk to in the meantime, and — once slice S8 lands — the
 * option of putting your hand up for a group that does not exist yet.
 */
import { servesAge, type AgeBand } from '@reitti/engine';
import { directory, whileYouWait } from '../config';
import { t } from '../i18n';
import { OptionCard } from './Options';
import { GroupWaitlist } from './GroupWaitlist';

/** The rung the poolable group topics hang off. */
const GROUP_RUNG = 'group-therapy';

/** Is this a rung whose realistic next step is a wait? */
export function isReferralRung(rungId: string): boolean {
  return whileYouWait.afterRungs.includes(rungId);
}

export function WhileYouWait({
  careLanguage,
  ageBand = '30-plus',
  /** The rung this block follows — used to offer the groups that fit it. */
  rungId,
}: {
  careLanguage: string;
  ageBand?: AgeBand;
  rungId?: string;
}) {
  const byId = (ids: string[]) =>
    ids
      .map((id) => directory.find((e) => e.id === id))
      .filter((e): e is NonNullable<typeof e> => e !== undefined)
      .filter((e) => !e.fallbackOnly)
      .filter((e) => servesAge(e, ageBand));

  const selfHelp = byId(whileYouWait.selfHelpEntryIds);
  const peer = byId(whileYouWait.peerEntryIds).slice(0, 2);

  if (selfHelp.length === 0 && peer.length === 0 && !rungId) return null;

  return (
    <section className="while-you-wait">
      <h3 className="while-you-wait-heading">{t('whileYouWait.heading')}</h3>
      <p className="while-you-wait-help">{t('whileYouWait.help')}</p>

      {selfHelp.length > 0 && (
        <>
          <p className="while-you-wait-label">{t('whileYouWait.selfHelp')}</p>
          <ul className="option-list">
            {selfHelp.map((entry) => (
              <OptionCard key={entry.id} entry={entry} careLanguage={careLanguage} />
            ))}
          </ul>
        </>
      )}

      {peer.length > 0 && (
        <>
          <p className="while-you-wait-label">{t('whileYouWait.peer')}</p>
          <ul className="option-list">
            {peer.map((entry) => (
              <OptionCard key={entry.id} entry={entry} careLanguage={careLanguage} />
            ))}
          </ul>
        </>
      )}

      {/* A3. The third thing to do while waiting is to help create the capacity
          that is missing — the one mechanism a directory cannot copy.
          Always the group rung, not `rungId`: somebody waiting for individual
          therapy is exactly who a group might serve sooner, so the topics we
          offer are the group ones regardless of which referral they are queued
          for. `rungId` gates whether this block appears at all. */}
      {rungId && <GroupWaitlist rungId={GROUP_RUNG} careLanguage={careLanguage} />}
    </section>
  );
}
