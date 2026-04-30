# Email deliverability — SPF / DKIM / DMARC for muslimprosnet.com

**Status:** transactional mail is sent through **Resend** (which routes via Amazon SES under the hood). Inbound + admin mail goes through **Microsoft 365 / Outlook**. Both senders need to be authorized in DNS so receivers (Gmail, Outlook, Yahoo, Apple) accept our mail and DMARC can later be tightened from monitor-only to enforcement.

This doc captures the current DNS state, the diagnosed gaps, and the exact records to add at the registrar.

---

## 1. Current DNS snapshot

Captured via `dig +short`:

| Record | Host | Value |
|---|---|---|
| **SPF (apex, M365)** | `muslimprosnet.com` | `v=spf1 include:spf.protection.outlook.com -all` |
| **MX (apex, M365 inbound)** | `muslimprosnet.com` | `0 muslimprosnet-com.mail.protection.outlook.com` |
| **DMARC** | `_dmarc.muslimprosnet.com` | `v=DMARC1; p=none;` |
| **MS verify token** | `muslimprosnet.com` | `MS=ms74914296` (M365 ownership proof, leave alone) |
| **DKIM (Resend, on apex)** | `resend._domainkey.muslimprosnet.com` | `p=MIGfMA0GCSqGSIb3…` (TXT) |
| **SPF (Resend send subdomain)** | `send.muslimprosnet.com` | `v=spf1 include:amazonses.com ~all` |
| **Return-path MX (Resend)** | `send.muslimprosnet.com` | `10 feedback-smtp.us-east-1.amazonses.com` |
| **DKIM (Resend, on send.)** | `resend._domainkey.send.muslimprosnet.com` | **MISSING** |

---

## 2. Diagnosis

### ✅ Correct
- **M365 inbound mail** is fully wired (MX + SPF) and verified via the `MS=` TXT.
- **Resend SPF + return-path MX** on `send.muslimprosnet.com` are correct for the US region.

### ⚠️ DKIM is published at the wrong host
The Resend DKIM record is at `resend._domainkey.muslimprosnet.com` (apex) but the SPF + return-path are at `send.muslimprosnet.com`. If Resend is sending mail with `MAIL FROM: bounces@send.muslimprosnet.com` (the default when you verify a `send.` subdomain), receivers will look up DKIM at `resend._domainkey.send.muslimprosnet.com` and get **NXDOMAIN**. Mail will then rely on SPF alone for DMARC alignment, which is fragile (forwarding breaks SPF).

**Two scenarios; you need to confirm which one in Resend's dashboard:**

**Scenario A — sending domain is `muslimprosnet.com` (apex):**
The current apex DKIM is correct. Then the SPF + MX on `send.muslimprosnet.com` are unused leftovers and can be ignored or deleted. No new DKIM records needed.

**Scenario B — sending domain is `send.muslimprosnet.com`:**
The DKIM TXT needs to move from `resend._domainkey.muslimprosnet.com` to `resend._domainkey.send.muslimprosnet.com`. Same value, different host.

### ⚠️ DMARC is monitor-only
`p=none` lets impersonators through; it only tells receivers "report what you see, don't act." It also has no `rua=` so we get no aggregate visibility. After Scenario A/B is resolved and we've watched aggregate reports for 1–2 weeks, we should tighten to `p=quarantine` with a 25% rollout (`pct=25`).

---

## 3. Records to add / change

### Step 1: confirm the sending domain in Resend dashboard

1. Go to https://resend.com/domains
2. Click on the verified domain entry
3. Note whether the "Domain" column shows `muslimprosnet.com` or `send.muslimprosnet.com`
4. The "DNS records" panel lists exactly what Resend expects to see published

**That panel is the source of truth — copy any record values from there, not from this doc.** The DKIM key in this doc snapshot is just for diff comparison.

### Step 2: Apply the matching scenario

**If Scenario A (sending domain = `muslimprosnet.com`):**
The records below are *additive*. Existing apex SPF and DKIM stay as-is.

| Action | Type | Host | Value | TTL |
|---|---|---|---|---|
| **Add** | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@muslimprosnet.com; fo=1; adkim=r; aspf=r` | 3600 |
| _(optional)_ Delete | TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| _(optional)_ Delete | MX | `send` | `10 feedback-smtp.us-east-1.amazonses.com` | — |

**If Scenario B (sending domain = `send.muslimprosnet.com`):**

| Action | Type | Host | Value | TTL |
|---|---|---|---|---|
| **Add** | TXT | `resend._domainkey.send` | _(copy from Resend dashboard — same `p=…` key currently at apex)_ | 3600 |
| **Delete** | TXT | `resend._domainkey` (apex) | the existing `p=MIGfMA0GCSqGSIb3…` value | — |
| **Replace** | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@muslimprosnet.com; fo=1; adkim=r; aspf=r` | 3600 |

> **Set up `dmarc-reports@muslimprosnet.com` as an alias before publishing the DMARC record.** Aggregate XML reports arrive daily from every receiver that processes mail from the domain — you'll want them landing in a real mailbox (or a DMARC dashboard service like dmarcian / Postmark / Cloudflare's free DMARC reporting).

### Step 3: Tighten DMARC (do this 1–2 weeks AFTER Step 2)

Once aggregate reports show 100% of legitimate mail passes either SPF-alignment or DKIM-alignment, replace the DMARC record with:

```
v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc-reports@muslimprosnet.com; fo=1; adkim=r; aspf=r
```

After another 1–2 weeks of clean reports, raise to `p=quarantine; pct=100`, then `p=reject`.

---

## 4. Registrar UI patterns

I don't know which registrar holds `muslimprosnet.com` — `whois` would tell us, but the editing pattern is similar across all of them. Look for:

| Registrar | DNS panel name | What to look for |
|---|---|---|
| **Cloudflare** | "DNS" tab on the domain | Add Record → Type / Name / Content / TTL. "Proxy status" should be **DNS only** (gray cloud) for all email records — never proxied. |
| **Namecheap** | "Advanced DNS" tab | "Add New Record" → Type, Host, Value, TTL. Use `@` for the apex, not `muslimprosnet.com`. |
| **GoDaddy** | "DNS Records" page | "Add" button at the top → similar fields. GoDaddy stores TXT values without quotes; just paste the body. |
| **Google Domains / Squarespace** | "DNS" → "Custom records" | Type / Host / TTL / Data. The `_dmarc` host is just `_dmarc` (not `_dmarc.muslimprosnet.com`). |
| **Route53** | Hosted zone for the domain | "Create record" → Record name (without trailing dot), Record type, Value, TTL. |

Two universal gotchas:
1. The **host** column wants the *short* name — `_dmarc`, not `_dmarc.muslimprosnet.com`. Most registrars auto-append the apex.
2. **TXT values must be wrapped in quotes** at most registrars (Namecheap, GoDaddy, Cloudflare auto-wrap; Route53 requires explicit quoting). When you paste a long DKIM key, leave it as one continuous quoted string — DNS automatically splits >255-byte strings.

---

## 5. Verification

After publishing, wait 5–10 min for propagation, then:

```sh
# DKIM (host depends on Scenario A vs B)
dig +short TXT resend._domainkey.send.muslimprosnet.com
dig +short TXT resend._domainkey.muslimprosnet.com

# DMARC
dig +short TXT _dmarc.muslimprosnet.com

# Send a test email through Resend, then check the headers in the receiving inbox.
# Look for `Authentication-Results: mx.google.com; spf=pass smtp.mailfrom=…; dkim=pass header.i=@…; dmarc=pass`
```

For ongoing monitoring:
- **Resend dashboard → Logs** shows per-message delivery status.
- The `dmarc-reports@` mailbox starts receiving aggregate XML reports within 24h. Drop them into [dmarcian](https://dmarcian.com/) or [Postmark's free DMARC monitor](https://dmarc.postmarkapp.com/) for a readable view.

---

## 6. Summary of the gap (TL;DR)

| Item | State | Action |
|---|---|---|
| SPF (apex, M365) | ✅ correct | none |
| SPF (Resend send.) | ✅ correct | none |
| DKIM (Resend) | ⚠️ at apex, may need to be at `send.` | confirm scenario in Resend dashboard, move if Scenario B |
| DMARC | ⚠️ `p=none`, no `rua=` | replace with monitor-with-reports policy now; tighten to `p=quarantine` after 1–2 weeks of clean aggregate reports |
| Reporting mailbox | ❌ doesn't exist | create `dmarc-reports@muslimprosnet.com` alias |
