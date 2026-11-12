import type { Guide } from '../types.ts';
import { cite } from './sources.js';

export const kelaPsychotherapy: Guide = {
  slug: 'kela-psychotherapy',
  title: 'Kela rehabilitative psychotherapy: who can get it and how to apply',
  description: 'Who qualifies for Kela-reimbursed psychotherapy, how to apply with form KU 131, what Kela pays per session, and how long it lasts.',
  checkedOn: '2026-11-08',
  intro: [
    'Kela, the Social Insurance Institution of Finland, reimburses part of the cost of longer psychotherapy when a mental-health condition puts your ability to work or study at risk. It is called [rehabilitative psychotherapy (kuntoutuspsykoterapia)](/directory/kela-kuntoutuspsykoterapia). This page sets out Kela’s own conditions and amounts, each linked to Kela’s page.',
  ],
  sections: [
    {
      heading: 'Who can get it',
      body: [
        'Kela lists these conditions [[kela-rehab]]:',
        {
          list: [
            'you are between 16 and 67 years of age [[kela-rehab]];',
            'your ability to work or study is at risk because of a mental health disorder [[kela-rehab]];',
            'you have been diagnosed and have received appropriate treatment for at least 3 months [[kela-rehab]];',
            'a psychiatrist has assessed that you need it, in a medical statement B, a statement BC or a rehabilitation plan issued within the last 12 months [[kela-rehab]].',
          ],
        },
        'Kela’s guideline adds that you must be insured in Finland under the Health Insurance Act [[kela-guideline]].',
      ],
    },
    {
      heading: 'How to apply',
      body: [
        'Fill in form KU 131 and send it through OmaKela, Kela’s online service, with the statement attached, or by post to Kela, PL 10, 00056 KELA [[kela-rehab]].',
        'Apply before the therapy starts, and at the earliest 2 months before it starts [[kela-rehab]]. Kela can reimburse from the beginning of the month in which your application arrives [[kela-fi]].',
        'Two costs are yours. You pay for the first meetings with possible therapists (tutustumiskäynti) yourself [[kela-rehab]], and Kela does not reimburse, as a rehabilitation cost, the doctor’s statement written for the application [[kela-guideline]].',
      ],
    },
    {
      heading: 'What Kela pays',
      body: [
        'Kela pays a fixed amount per session [[kela-amounts]]:',
        {
          table: {
            head: ['Therapy', 'Kela pays'],
            rows: [
              ['Individual psychotherapy', '57.60 euros per session [[kela-amounts]]'],
              ['Group therapy', '42.05 euros per session [[kela-amounts]]'],
              ['Family or couples therapy, 1 hour', '63.91 euros [[kela-amounts]]'],
              ['Family or couples therapy, 1.5 hours', '95.87 euros [[kela-amounts]]'],
            ],
          },
        },
        'Kela’s page gives no date from which these amounts apply [[kela-amounts]]. The reimbursement is often smaller than the price of a session, so you may pay part of the price yourself [[kela-fi]]. In February 2025 Kela reported that a session costs around a hundred euros and that the client’s own share can be about 40 to 60 euros per session [[kela-stats]]; prices may have changed since.',
        'Usually the therapist deducts Kela’s share from the price. If not, you claim it on form KU 204 within 6 months of paying [[kela-fi]].',
      ],
    },
    {
      heading: 'How long it lasts',
      body: [
        'Kela reimburses up to 80 sessions a year and up to 200 in total, for at most 3 years [[kela-rehab]]. For the second and third year, a statement from your treating doctor is enough if the therapy has gone as planned [[kela-fi]]. On special grounds it can be granted again if at least 5 years have passed since the previous period ended [[kela-fi]].',
      ],
    },
    {
      heading: 'Finding a therapist',
      body: [
        'Kela’s search lists only Kela-approved therapists who have agreed to be listed, and it is available in Finnish and Swedish only [[kela-rehab]]. Kela can arrange foreign-language interpretation for individual therapy, but not for couples, family or group therapy [[kela-guideline]].',
      ],
    },
    {
      heading: 'Young people: the therapy guarantee is a different route',
      body: [
        'Since 1 May 2025, short-term psychotherapy or structured psychosocial treatment for children and young people under 23 in public primary care must start within 28 days of the need being established [[finlex-1107]]. That is public healthcare, not Kela: you start at your health centre or student health service.',
      ],
    },
  ],
  sources: cite('kela-rehab', 'kela-guideline', 'kela-fi', 'kela-amounts', 'kela-stats', 'finlex-1107'),
};
