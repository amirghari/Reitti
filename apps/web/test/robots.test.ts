/**
 * Which hosts are allowed into a search index.
 *
 * The deployment answers on the real domain, on an old vercel.app address that
 * still serves the same app, and on a fresh preview URL for every push. Only the
 * first is open (D-26). Getting this backwards puts a second, older copy of
 * unreviewed clinical content in front of somebody searching for help.
 */
import { describe, expect, it } from 'vitest';
import { robotsFor } from '../api/robots';

const allows = (body: string) => body.includes('Allow: /') && !body.includes('Disallow: /');
const refuses = (body: string) => body.includes('Disallow: /');

describe('robots.txt is answered per host', () => {
  it('opens the real domain, with and without www', () => {
    expect(allows(robotsFor('mielenreitti.fi'))).toBe(true);
    expect(allows(robotsFor('www.mielenreitti.fi'))).toBe(true);
  });

  it('closes every other host this app is served on', () => {
    for (const host of [
      'reitti-seven.vercel.app',
      'reitti-nkmlmzomw-amirs-projects-b107307b.vercel.app',
      'reitti-git-main-amirs-projects-b107307b.vercel.app',
      'localhost:5173',
    ]) {
      expect(refuses(robotsFor(host)), `${host} was let into the index`).toBe(true);
    }
  });

  it('closes a host it has never heard of, rather than opening it', () => {
    // The safe default for a mistake here is invisibility, not a second copy.
    expect(refuses(robotsFor(undefined))).toBe(true);
    expect(refuses(robotsFor(''))).toBe(true);
    expect(refuses(robotsFor('example.com'))).toBe(true);
  });

  it('is not fooled by a port, capitals, or whitespace', () => {
    expect(allows(robotsFor('MielenReitti.FI'))).toBe(true);
    expect(allows(robotsFor('mielenreitti.fi:443'))).toBe(true);
    expect(allows(robotsFor('  mielenreitti.fi  '))).toBe(true);
  });

  it('is not fooled by a host that merely contains the domain', () => {
    // The failure that a substring check would wave through.
    for (const host of ['mielenreitti.fi.evil.example', 'notmielenreitti.fi', 'mielenreitti.fi.vercel.app']) {
      expect(refuses(robotsFor(host)), `${host} was treated as the real domain`).toBe(true);
    }
  });

  it('says which site is the real one, on the hosts that are not', () => {
    expect(robotsFor('reitti-seven.vercel.app')).toContain('https://mielenreitti.fi');
  });
});
