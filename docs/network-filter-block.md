# Network filters block mielenreitti.fi

**Reported:** 2026-09-24, on a library computer. `ERR_CONNECTION_RESET`.

## What was ruled out

Checked from the open internet the same day:

| | |
|---|---|
| HTTPS | 200, HTTP/2 |
| TLS | 1.3, Let's Encrypt, `Verify return code: 0 (ok)` |
| http → https | 308, correct |
| Quad9 (security filtering) | resolves to the real IP |
| Cloudflare family (1.1.1.3) | resolves to the real IP |
| **Cisco Umbrella / OpenDNS** | **resolves to the real IP** |
| Google DNS | resolves to the real IP |

So the domain is not flagged as malicious or phishing by the major reputation
feeds, and it is not blocked at DNS level by the resolvers institutions commonly
use. A server fault would give a 5xx or a timeout, a DNS fault would say
`ERR_NAME_NOT_RESOLVED`, and a certificate fault would say so. A connection reset
means a device in the middle killed the TCP connection.

## What it almost certainly is

The library's own filtering appliance, blocking on the hostname it sees in the
TLS handshake. It cannot show a block page over HTTPS without breaking the
certificate, so it resets instead, which is exactly the error reported.

Two likely policies, in order:

1. **Newly registered domain.** `mielenreitti.fi` was registered **17.9.2026**.
   NRD is a standard blocking category and the window is usually 30 days, so this
   one expires by itself around **17.10.2026**.
2. **Uncategorised, or a blocked category.** A new domain has no category
   assigned. Many filters block uncategorised by default, and some block health
   or mental health outright.

Nothing in our configuration causes this and nothing in it can fix it.

## Why it matters more than one person's afternoon

Nobody reports this. Someone on a library or school computer sees a broken site
and leaves, and that is precisely the person the site is for, on precisely the
computer they have. The adoption plan targets libraries (Oodi, Helmet) and
student networks, so a filter block undercuts the channel it is aimed at.

## What fixes it

1. **Submit the domain for categorisation.** Free, roughly ten minutes, and it
   clears the block for every institution using that vendor rather than one
   library. Ask for **Health & Medicine**. These need a person: each has a
   captcha.
   - Cisco Talos: talosintelligence.com/reputation_center
   - FortiGuard: fortiguard.com/faq/wfratingsubmit
   - Symantec / Blue Coat: sitereview.bluecoat.com
   - Zscaler: zscaler.com/threatlabz/site-review
   - Palo Alto: urlfiltering.paloaltonetworks.com
   - Netcraft: netcraft.com (site report, then request classification)
2. **Ask the network owner to allowlist it.** Draft below.
3. **Wait.** The NRD window closes around 17.10.2026 on its own.

## Draft: allowlist request

Send to Metropolia IT (helpdesk) and, for the public libraries, Helmet customer
service. Short on purpose; they act on specifics, not on explanations.

> **Subject:** Request to allow mielenreitti.fi through the web filter
>
> Hello,
>
> Your network is blocking https://mielenreitti.fi. On a library computer it
> fails with ERR_CONNECTION_RESET, which is a filter resetting the connection
> rather than a fault at the site.
>
> The site is a free, non-commercial directory of mental health support in
> Finland, in Finnish, Swedish and English. There is no advertising, no account
> and no tracking. I built it and I maintain it.
>
> I think it is being caught as a newly registered domain: the domain was
> registered on 17 September 2026 and has no category assigned yet. It is not on
> any reputation blocklist; Cisco Umbrella, Quad9 and Cloudflare all resolve it
> normally.
>
> Could you allow the domain, or categorise it as health? People looking for
> mental health information on a public computer are exactly who it is for.
>
> Thank you,
> Amir Ghari
> [email]
