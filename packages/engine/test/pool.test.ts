import { describe, expect, it } from 'vitest';
import {
  poolInterestBody,
  poolKey,
  promoteNext,
  readyToForm,
  thresholdFor,
  topicsForRung,
} from '../src/pool.js';
import { ConfigError } from '../src/scoring.js';
import { groups } from './helpers.js';

describe('thresholds', () => {
  it('reads a topic’s own threshold', () => {
    const topic = groups.topics[0];
    expect(thresholdFor(groups, topic.id)).toBe(topic.formThreshold);
  });

  it('throws for an unknown topic rather than guessing a threshold', () => {
    expect(() => thresholdFor(groups, 'nope')).toThrow(ConfigError);
  });

  it('is ready only at or above the threshold', () => {
    expect(readyToForm(7, 8)).toBe(false);
    expect(readyToForm(8, 8)).toBe(true);
    expect(readyToForm(9, 8)).toBe(true);
  });
});

describe('the counter key', () => {
  it('is coarse: topic, region, language and nothing finer', () => {
    const body = poolInterestBody(groups, {
      topicId: 'anxiety',
      region: 'helsinki',
      careLanguage: 'fi',
    });
    expect(poolKey(body)).toBe('anxiety|helsinki|fi');
    expect(poolKey(body).split('|')).toHaveLength(3);
  });

  it('separates regions, so a national count cannot masquerade as a local one', () => {
    const helsinki = poolInterestBody(groups, {
      topicId: 'anxiety',
      region: 'helsinki',
      careLanguage: 'fi',
    });
    const pirkanmaa = poolInterestBody(groups, {
      topicId: 'anxiety',
      region: 'pirkanmaa',
      careLanguage: 'fi',
    });
    expect(poolKey(helsinki)).not.toBe(poolKey(pirkanmaa));
  });
});

describe('waitlist promotion', () => {
  const waiting = [
    { joinedAt: '2026-03-02T10:00:00.000Z', id: 'b' },
    { joinedAt: '2026-03-01T10:00:00.000Z', id: 'a' },
    { joinedAt: '2026-03-03T10:00:00.000Z', id: 'c' },
  ];

  it('promotes first-in first, so a cancellation frees a seat rather than collapsing the group', () => {
    expect(promoteNext(waiting, 2).map((w) => w.id)).toEqual(['a', 'b']);
  });

  it('promotes nobody when there are no seats', () => {
    expect(promoteNext(waiting, 0)).toEqual([]);
    expect(promoteNext(waiting, -1)).toEqual([]);
  });

  it('does not invent people when there are more seats than waiting', () => {
    expect(promoteNext(waiting, 99)).toHaveLength(3);
  });

  it('leaves the caller’s array alone', () => {
    const before = waiting.map((w) => w.id);
    promoteNext(waiting, 2);
    expect(waiting.map((w) => w.id)).toEqual(before);
  });
});

describe('topics by rung', () => {
  it('returns the topics that hang off a rung, in config order', () => {
    const onGroup = topicsForRung(groups, 'group-therapy');
    expect(onGroup.length).toBeGreaterThan(0);
    const configOrder = groups.topics.filter((t) => t.rungs.includes('group-therapy'));
    expect(onGroup).toEqual(configOrder);
  });

  it('returns nothing for a rung with no groups', () => {
    expect(topicsForRung(groups, 'kela-rehabilitative')).toEqual([]);
  });
});
