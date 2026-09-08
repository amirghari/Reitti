# `pool-counter` — the anonymous counter service

The second server Reitti has, and the smaller of the two. It backs demand pooling
(A3) and the follow-up loop (C3).

## The claim this service is built to support

> **Reitti's server holds counts, not people.** It never receives your answers,
> your scores, or anything that identifies you or your device. When you put your
> hand up for a group, one number goes up.

That claim is narrower than "no health data leaves the device" and it is the one
we can defend line by line — see `docs/v2-decisions.md` D-5. Somebody declaring
interest in an anxiety group *is* disclosing something health-adjacent about
themselves. What makes it safe is that there is no identifier attached and no
per-person row to attach one to later.

## What it stores

Integers. That is the whole data model.

```
counters["anxiety|helsinki|fi"]  = 14
outcomes["got-in"]               = 231
outcomes["still-waiting"]        = 402
outcomes["gave-up"]              =  58
```

There is no table of interests, no session, no device id, no cookie, no auth
header, no per-event timestamp and no request log carrying an IP. A subpoena
served on this service returns a handful of numbers.

## API

```
POST /pool/interest   { topicId, region, careLanguage }  → { count, threshold, ready }
GET  /pool/:topicId   ?region=&language=                 → { count, threshold, ready }
POST /outcome         { bucket }                         → 204
```

`bucket` is one of `got-in`, `still-waiting`, `gave-up`. Nothing else is accepted
on either endpoint: an unexpected key is a 400, not a silently-ignored extra
field, because silently ignoring it is how a field ends up being sent for months
before anyone notices.

## Deliberate omissions

- **No withdraw endpoint** (decision D-4). Returning a token the client could use
  to decrement would make every participant pseudonymous. Interest expires
  on-device instead, and counts drift slightly high — a much smaller problem than
  a per-person token in a health-adjacent store.
- **No rung on the outcome counter** (decision D-6). Rung × bucket is 18 cells;
  at pilot volume some of them would hold very few people, and a network observer
  can see request timing. Three integers is what "strictly aggregate" means until
  the volume is real.
- **No timestamps.** Not per event, not per counter.

## Storage

The handler is written against a `CounterStore` interface. The in-memory store
here is for the preview deployment and for tests; production needs an EU-hosted
durable store behind the same interface, and nothing else changes.

## Rate limiting

Not implemented, and it is the one thing this service genuinely needs before it
faces the public internet: a counter anyone can increment is a counter anyone can
forge. The mitigation has to arrive without introducing a per-person identifier,
which rules out the obvious cookie-based approaches — a coarse per-IP token
bucket held in memory and never logged is the intended shape.
