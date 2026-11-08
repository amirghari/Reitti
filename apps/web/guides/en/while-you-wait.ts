import type { Guide } from '../types.ts';
import { cite } from './sources.ts';

export const whileYouWait: Guide = {
  slug: 'while-you-wait',
  title: 'What to do while you wait for therapy',
  description: 'The time limits public care must meet in Finland, free support you can use now while you wait, and where to turn if things get worse.',
  checkedOn: '2026-11-08',
  intro: [
    'Waiting is common. This page sets out how long public care may make you wait, what free support exists in the meantime, and who to call if waiting becomes too much. It is information, not treatment advice.',
  ],
  sections: [
    {
      heading: 'How long public care may make you wait',
      body: [
        {
          list: [
            'On weekdays during opening hours, you must be able to reach your health centre immediately [[stm-hoitotakuu]], and get an assessment of your need for care the same day [[stm-guidance]].',
            'Treatment in primary care must start within three months at the latest [[stm-hoitotakuu]].',
            'For people under 23, within 14 days when it concerns an illness or injury [[stm-hoitotakuu]].',
            'In specialised care, after a referral: assessment within three weeks, examinations within three months, and treatment within six months of the need being established [[stm-hoitotakuu]].',
          ],
        },
        'These limits apply to mental and physical health problems in the same way [[stm-guidance]]. Visits under an agreed care plan, such as ongoing psychotherapy, fall outside them [[stm-guidance]].',
        'For children and young people under 23, short-term psychotherapy or structured psychosocial treatment in primary care must start within 28 days of the need being established, since 1 May 2025 [[finlex-1107]].',
      ],
    },
    {
      heading: 'Free support you can use now',
      body: [
        {
          list: [
            'Mielenterveystalo’s self-help programmes: free, anonymous, no login and no diagnosis needed. English programmes include anxiety, depression, insomnia and concentration difficulties [[mtalo-selfhelp]].',
            'MIELI’s Finnish crisis chat is open Monday to Thursday, 15 to 21, and its written support usually answers within a week [[mieli-chat]].',
            'In English, MIELI offers booked crisis chat, remote appointments and crisis email, free and without a referral [[mieli-en]]. Email replies can take up to two weeks [[tukinet-en]].',
            'Sekasin-chat for 12 to 29-year-olds is anonymous and free, open weekdays 9 to 24 and weekends 15 to 24 [[sekasin]].',
          ],
        },
        'Mielenreitti’s [list of every service](/directory) shows the free options first, with the languages each is offered in.',
      ],
    },
    {
      heading: 'If things get worse while you wait',
      body: [
        'MIELI’s crisis line 09 2525 0111 answers in Finnish every day, 24 hours a day; MIELI does not charge for the conversation and you can call anonymously [[mieli-fi]].',
        'Call 116117 if there is no danger to life but the situation is serious or needs urgent care, and 112 if someone’s life or safety is threatened [[mtalo-where]]. Both calls are free [[m116117]] [[e112]].',
      ],
    },
  ],
  sources: cite('stm-hoitotakuu', 'stm-guidance', 'finlex-1107', 'mtalo-selfhelp', 'mieli-chat', 'mieli-en', 'tukinet-en', 'sekasin', 'mieli-fi', 'mtalo-where', 'm116117', 'e112'),
};
