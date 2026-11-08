import type { Guide } from '../types.ts';
import { cite } from './sources.ts';

export const psychologistWithoutReferral: Guide = {
  slug: 'psychologist-without-referral',
  title: 'Seeing a psychologist without a referral in Finland: what it costs',
  description: 'Where you can see a psychologist without a referral, what public care costs, what Kela does and does not reimburse, and why no official private price exists.',
  checkedOn: '2026-11-08',
  intro: [
    'You do not need a referral to contact public primary care or to book a private appointment. What differs is the cost, and what Kela pays towards it.',
  ],
  sections: [
    {
      heading: 'Public care: free, and no referral needed',
      body: [
        'You can seek primary care by contacting the service yourself; a doctor’s referral is needed for specialised care and for internet therapy [[mtalo-where]].',
        'Health centres may offer direct appointments with a psychologist. Where they do, the same time limits apply: within 14 days for people under 23, and within three months for older patients [[stm-guidance]]. Not every health centre has them: the guidance says they “may” exist.',
        'Mental-health work in public outpatient care is free of charge, and no fee may be charged for nurse visits [[stm-fees]].',
      ],
    },
    {
      heading: 'Private psychologists: you pay, and Kela does not reimburse treatment',
      body: [
        'You can book private care yourself, and as a private client you pay the fees yourself [[mtalo-where]].',
        'Kela does not pay medical-care reimbursement for treatment given by a psychologist, for psychotherapy or for neuropsychological rehabilitation; it reimburses psychotherapy only as rehabilitative psychotherapy [[kela-partner]]. That statement is on a Kela page for healthcare providers dated April 2021 [[kela-partner]]; Kela’s current page for clients does not contradict it [[kela-private]]. Kela’s route is explained in our [Kela psychotherapy guide](/en/guides/kela-psychotherapy).',
        'Examinations are different. Kela can reimburse examinations done by a psychologist, regardless of who prescribed them [[kela-private]].',
        '**No official price exists for a private psychologist session.** Kela, STM and InfoFinland publish none, so we give none. Ask the provider before you book.',
      ],
    },
    {
      heading: 'Free without a referral',
      body: [
        {
          list: [
            'Mielenterveystalo’s self-help programmes: free, anonymous, no login, several in English [[mtalo-selfhelp]].',
            'In Helsinki, the Mieppi unit serves residents over 13 free of charge [[mieppi]].',
            'Students at universities and universities of applied sciences have the Finnish Student Health Service (FSHS); the student healthcare fee is 35.35 euros per term in 2026 [[kela-shf]].',
          ],
        },
        'For under-23s there is also the therapy guarantee: short therapy in public primary care must start within 28 days of the need being established, since 1 May 2025 [[finlex-1107]].',
      ],
    },
  ],
  sources: cite('mtalo-where', 'stm-guidance', 'stm-fees', 'kela-partner', 'kela-private', 'mtalo-selfhelp', 'mieppi', 'kela-shf', 'finlex-1107'),
};
