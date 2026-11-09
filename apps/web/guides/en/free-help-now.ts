import type { Guide } from '../types.ts';
import { cite } from './sources.ts';

export const freeHelpNow: Guide = {
  slug: 'free-help-now',
  title: 'Free mental-health help in Finland right now',
  description: 'Free crisis lines, chats and services in Finland with their published hours and languages, from 112 to MIELI’s chats and English support.',
  checkedOn: '2026-11-08',
  intro: [
    'Every line below is free to use. Hours and languages are as each service publishes them, linked at the bottom of the page.',
  ],
  sections: [
    {
      heading: 'In an emergency',
      body: [
        'Call 112 if someone’s life or safety is threatened [[mtalo-where]]. It is free from any phone. Operators must answer in Finnish and Swedish; one who does not speak English can transfer your call, and an interpreter can be brought in [[e112]].',
        'Call 116117, the Medical Helpline, if there is no danger to life but the situation is serious or needs urgent care [[mtalo-where]]. It is open 24/7, calling costs nothing, and it covers all of Finland except Åland [[m116117]].',
      ],
    },
    {
      heading: 'Talk to someone now',
      body: [
        {
          table: {
            head: ['Line', 'Number', 'When'],
            rows: [
              ['MIELI crisis line, in Finnish', '09 2525 0111', 'Every day, 24 hours a day [[mieli-fi]]'],
              ['MIELI crisis line, in Swedish', '09 2525 0112', 'Monday and Wednesday 16 to 20; Tuesday, Thursday and Friday 9 to 13 [[mieli-sv]]'],
            ],
          },
        },
        'MIELI does not charge for the conversations; you pay only your operator’s normal call rate [[mieli-fi]] [[mieli-sv]]. You can call anonymously [[mieli-fi]].',
        '**In English:** MIELI’s English phone line closed on 23 March 2026. Instead MIELI offers booked crisis chat, remote appointments by video or phone, and crisis email, free and without a referral [[mieli-en]]. You need an anonymous Tukinet account and must book at least 30 minutes ahead; email replies can take up to two weeks [[tukinet-en]].',
      ],
    },
    {
      heading: 'Chat',
      body: [
        {
          list: [
            'MIELI crisis chat, in Finnish: Monday to Thursday, 15 to 21 [[mieli-chat]].',
            'Sekasin-chat for 12 to 29-year-olds: anonymous and free, every day of the year, weekdays 9 to 24 and weekends 15 to 24 [[sekasin]].',
          ],
        },
      ],
    },
    {
      heading: 'Face to face',
      body: [
        'MIELI’s Crisis Centre Helsinki serves residents of the Helsinki metropolitan area and Eastern Uusimaa. Booking by phone on 09 4135 0510, Monday to Thursday 9 to 12 and 13 to 15, Friday 9 to 12 [[mieli-cc]].',
        'In Helsinki, the Mieppi unit serves residents over 13 free of charge, with an interpreter if your mother tongue is not Finnish or Swedish [[mieppi]].',
      ],
    },
    {
      heading: 'For students',
      body: [
        'The Finnish Student Health Service (FSHS) chat for general and mental health is open Monday to Thursday 8 to 15 and Friday 8 to 14 [[yths-home]]. It serves Bachelor’s and Master’s degree students [[yths-who]].',
      ],
    },
    {
      heading: 'Self-help, any time',
      body: [
        'Mielenterveystalo’s self-help programmes are free, anonymous and need no login, with English programmes for anxiety, depression, insomnia and concentration difficulties [[mtalo-selfhelp]].',
      ],
    },
  ],
  sources: cite('mtalo-where', 'e112', 'm116117', 'mieli-fi', 'mieli-sv', 'mieli-en', 'tukinet-en', 'mieli-chat', 'sekasin', 'mieli-cc', 'mieppi', 'yths-home', 'yths-who', 'mtalo-selfhelp'),
};
