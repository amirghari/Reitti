import type { Guide } from '../types.ts';
import { cite } from './sources.js';

export const therapyInEnglish: Guide = {
  slug: 'therapy-in-finland-in-english',
  title: 'How to get therapy in Finland in English',
  description: 'The public, student, workplace, Kela and private routes to mental-health care in Finland, and what each official source says about English.',
  checkedOn: '2026-11-08',
  intro: [
    'There is no single door to therapy in Finland. Below are the routes that exist, with what each official source says about English. Where a source promises an interpreter rather than care in English, we say so.',
  ],
  sections: [
    {
      heading: 'Start at your health centre',
      body: [
        'InfoFinland, the public information service for people moving to Finland, says to contact your local health and social services centre first [[infofinland]]. You do not need a referral for primary care: you contact the service yourself [[mtalo-where]].',
        'The law sets time limits. On weekdays during office hours you must be able to reach the health centre the same day and get an individual assessment of what care you need and how urgently [[stm-guidance]]. Treatment must start within three months at the latest, and within 14 days for people under 23 when it concerns an illness or injury [[stm-hoitotakuu]]. These rules apply to mental and physical health problems in the same way [[stm-guidance]].',
        'Mental-health work in public outpatient care is free of charge, and no fee may be charged for nurse visits. A doctor visit at a health centre costs at most 30.20 euros in 2026 [[stm-fees]].',
        '**On English:** the official pages we read promise an interpreter, not English-speaking staff. Helsinki’s low-threshold unit Mieppi, for example, serves residents over 13 for free and says it can use an interpreter if your mother tongue is not Finnish or Swedish [[mieppi]].',
      ],
    },
    {
      heading: 'Internet therapy is free, but not in English',
      body: [
        '[Mielenterveystalo’s internet therapies](/directory/hus-nettiterapiat) are produced by public healthcare and are free, and any doctor in Finland can refer you. Treatment is currently available only in Finnish and Swedish [[mtalo-internet]].',
        'Its [self-help programmes](/directory/mielenterveystalo-omahoito) are different: they are free, anonymous, need no login and no diagnosis, and several are in English, including programmes for anxiety, depression, insomnia and concentration difficulties [[mtalo-selfhelp]].',
      ],
    },
    {
      heading: 'If you study at a university or a university of applied sciences',
      body: [
        'The [Finnish Student Health Service (FSHS, YTHS in Finnish)](/directory/yths) serves Bachelor’s and Master’s degree students. Postgraduate students, open university students and international exchange students who are not completing a degree in Finland cannot use it [[yths-who]].',
        'The student healthcare fee is 35.35 euros per term in 2026, paid to Kela [[kela-shf]]. FSHS promises that students whose first language is neither Finnish nor Swedish receive service “in at least acceptable English” [[yths-lang]].',
        'One difference from health centres: in higher-education student healthcare, the 14-day limit does not apply to psychologist appointments, even for under-23s [[stm-guidance]].',
      ],
    },
    {
      heading: 'If you work',
      body: [
        'InfoFinland says that if you have a job, you can talk to an occupational doctor about your mental health, and that occupational health care may also offer a psychologist [[infofinland]]. Mielenterveystalo notes that occupational health care is often free for the employee [[mtalo-where]].',
      ],
    },
    {
      heading: 'Kela rehabilitative psychotherapy',
      body: [
        'For longer therapy, Kela reimburses part of the cost of [rehabilitative psychotherapy](/directory/kela-kuntoutuspsykoterapia) if you meet its conditions; our [Kela psychotherapy guide](/en/guides/kela-psychotherapy) explains them. Kela’s search for approved therapists is available in Finnish and Swedish only [[kela-rehab]]. Kela can arrange foreign-language interpretation for individual therapy, but not for couples, family or group therapy [[kela-guideline]].',
      ],
    },
    {
      heading: 'Paying privately',
      body: [
        'InfoFinland says a private appointment is sometimes faster but considerably more expensive [[infofinland]]. As a private client you pay the fees yourself [[mtalo-where]], and Kela does not reimburse treatment given by a psychologist [[kela-partner]]. Our guide to [seeing a psychologist without a referral](/en/guides/psychologist-without-referral) covers what is and is not reimbursed.',
      ],
    },
    {
      heading: 'Crisis support in English',
      body: [
        'MIELI’s English crisis phone line closed on Monday 23 March 2026. MIELI now offers [booked crisis chat](/directory/mieli-chat-en), remote appointments by video or phone, and crisis email in English, free and without a referral [[mieli-en]]. Booking needs an anonymous [Tukinet](/directory/tukinet) account, at least 30 minutes ahead, and an email reply can take up to two weeks [[tukinet-en]].',
        'InfoFinland still lists an English crisis number, 09 2525 0116 [[infofinland]]. That line is closed [[mieli-en]].',
        'In an emergency, call 112. It is free from any phone; operators must answer in Finnish and Swedish, and can transfer your call or bring in an interpreter [[e112]].',
      ],
    },
  ],
  sources: cite(
    'infofinland',
    'mtalo-where',
    'stm-guidance',
    'stm-hoitotakuu',
    'stm-fees',
    'mieppi',
    'mtalo-internet',
    'mtalo-selfhelp',
    'yths-who',
    'kela-shf',
    'yths-lang',
    'kela-rehab',
    'kela-guideline',
    'kela-partner',
    'mieli-en',
    'tukinet-en',
    'e112',
  ),
};
