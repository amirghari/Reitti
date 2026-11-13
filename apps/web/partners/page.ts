/**
 * The partner page (open item E11), English, as a PREVIEW ONLY (Amir, 13.11.2026:
 * "I read it before it goes live").
 *
 * The text is company-ops drafts/mielenreitti/partner-page-en.md at 543d952,
 * word for word from "Link to Mielenreitti from your service" down. The draft's
 * preface (its sources and the four things to do before it goes live) is for
 * Amir and is not on the page.
 *
 * Kept out of the live site three ways, until Amir says otherwise:
 *   - scripts/build-partners.ts builds nothing in a production build;
 *   - the page carries `noindex, nofollow`;
 *   - it is in no sitemap, no llms.txt, no address table and no link on the site.
 * Going live is its own pull request: drop the production guard, decide the
 * address, and add the Finnish and Swedish versions after the native reviewers.
 */
import { frame } from '../guides/render.ts';
import { esc } from '../pages/frame.ts';

export const PARTNER_PATH = '/partners';

type Item = string | { text: string; list: string[]; after?: string };
type Block = string | { list: Item[] };
interface Section {
  heading: string;
  body: Block[];
}

/** Escape, then `**bold**`, `*italic*`, `[label](href)`. */
function inline(text: string): string {
  return esc(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) =>
      `<a href="${href}"${href.startsWith('https://') ? ' rel="noopener"' : ''}>${label}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

const item = (i: Item): string =>
  typeof i === 'string' ? `<li>${inline(i)}</li>` : `<li>${inline(i.text)}<ul>${i.list.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>${i.after ? `<p>${inline(i.after)}</p>` : ''}</li>`;
const block = (b: Block) => (typeof b === 'string' ? `<p>${inline(b)}</p>` : `<ul>${b.list.map(item).join('')}</ul>`);

export const TITLE = 'Link to Mielenreitti from your service';

export const LEDE =
  'Mielenreitti is a free website that helps people in Finland find the right kind of mental-health help. It shows free and public options first, with what each step costs and the languages it is offered in. It works in Finnish, Swedish and English. Nobody needs an account.';

export const SECTIONS: Section[] = [
  {
    heading: 'What it does',
    body: [
      {
        list: [
          'A person answers a short set of questions. Mielenreitti then shows two or three steps that fit their answers, lightest first, with what each costs. The person chooses; Mielenreitti does not pick for them.',
          'If an answer points to a crisis, the crisis lines open before anything else. MIELI confirmed the crisis numbers in writing on 21 September 2026.',
          {
            text: 'A directory lists the services behind each step:',
            list: [
              'public health stations and online therapy',
              'student health (YTHS)',
              'Kela-funded rehabilitative psychotherapy',
              'charities’ chats, helplines and groups',
            ],
            after: 'Private practices are not listed yet.',
          },
          'Routing follows fixed rules, not artificial intelligence. Each rule says in plain words why it points where it does, and the same answers always give the same result.',
        ],
      },
    ],
  },
  {
    heading: 'What it never does',
    body: [
      {
        list: [
          'It does not diagnose. It is not a medical device and decides nothing about anyone’s care. It gives guidance and information, and the decision stays with the person and their professional.',
          'It never sees anyone’s answers (see the next section).',
          'No analytics, advertising, tracking tools or cookies.',
          'Nobody pays to be listed or to be shown first. Using it is free.',
        ],
      },
    ],
  },
  {
    heading: 'Privacy, in plain words',
    body: [
      {
        list: [
          '**The answers stay on the person’s own phone or computer.** The questions run in the browser, and the answers and results are kept in that browser’s storage. They are never sent to us or to anyone else. One button deletes everything Mielenreitti has stored on the device.',
          {
            text: '**What does reach a server:**',
            list: [
              'Our hosting company (Vercel) sees technical details of each visit, such as the IP address and the page asked for, in order to deliver the site. The request logs we can see are kept for one hour.',
              'Feedback reaches us only if a person chooses to write some, and it carries only what they type.',
            ],
          },
          '**What this means for you:** linking to Mielenreitti sends us nothing about your clients, and we receive no health data. We believe a link needs no data-processing agreement, because nothing is processed on your behalf. Your own data protection officer should confirm that for your organisation.',
          'The full privacy notice is at [mielenreitti.fi/privacy](/privacy).',
        ],
      },
    ],
  },
  {
    heading: 'How it has been checked, and what has not been yet',
    body: [
      {
        list: [
          'The routing rules were reviewed by Yasin Najafizadegan, PhD, a psychologist licensed outside Finland.',
          '**A review by a Finland-registered psychologist is in progress and not yet complete.** Until it is, the rules have not been clinically reviewed in Finland. We will update this page when it is done, and we can tell you directly if you ask.',
          'The crisis numbers were confirmed by MIELI (above).',
        ],
      },
    ],
  },
  {
    heading: 'How to link to it',
    body: [
      'Use a plain link in the language your page is in:',
      {
        list: [
          'English: [https://mielenreitti.fi/](https://mielenreitti.fi/)',
          'Finnish: [https://mielenreitti.fi/fi](https://mielenreitti.fi/fi)',
          'Swedish: [https://mielenreitti.fi/sv](https://mielenreitti.fi/sv)',
        ],
      },
      'A sentence you can use: *“Not sure where to start? Mielenreitti shows the free and public mental-health options that fit your situation, with what each one costs. Free, no account, and your answers stay on your phone.”*',
      'Leave out tracking codes: the site has no analytics, so we can’t count visits from your link and nobody on your side needs to set anything up. A box that runs Mielenreitti inside your own page is planned but not built yet.',
    ],
  },
  {
    heading: 'Who runs it',
    body: [
      'Mielenreitti is run by Amir Ghari in Helsinki, who is also responsible for its data (the data controller). It is independent and carries no advertising.',
    ],
  },
  {
    heading: 'Contact',
    body: [
      {
        list: [
          'To link to Mielenreitti, ask a question, or report a service that is wrong or missing: [hello@mielenreitti.fi](mailto:hello@mielenreitti.fi)',
          'Privacy questions: [tietosuoja@mielenreitti.fi](mailto:tietosuoja@mielenreitti.fi)',
        ],
      },
    ],
  },
];

export function partnerPage(): string {
  const sections = SECTIONS.map(
    (s, i) => `<section aria-labelledby="p${i}"><h2 id="p${i}">${inline(s.heading)}</h2>\n${s.body.map(block).join('\n')}\n</section>`,
  ).join('\n');
  return frame({
    lang: 'en',
    title: `${TITLE} | Mielenreitti`,
    description: LEDE,
    path: PARTNER_PATH,
    noindex: true,
    body: `<article class="partner">\n<h1>${esc(TITLE)}</h1>\n<p class="intro">${esc(LEDE)}</p>\n${sections}\n</article>`,
    nav: { href: '/about', label: 'About' },
  });
}
