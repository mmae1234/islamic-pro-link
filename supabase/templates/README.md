# Auth email templates

Branded copies of the Supabase Auth email templates (Dashboard → Authentication →
Emails → Templates). Sent through Resend SMTP from
`Muslim Pros Network <contact@muslimprosnet.com>` (set up Nov 25, 2026).

| File | Dashboard template | Subject |
|---|---|---|
| confirmation.html | Confirm sign up | Confirm your email for Muslim Pros Network |
| recovery.html | Reset password | Reset your Muslim Pros Network password |
| email_change.html | Change email address | Confirm your new email address |
| magic_link.html | Magic link or OTP | Your Muslim Pros Network sign-in link |
| invite.html | Invite user | You're invited to Muslim Pros Network |

## Scanner-proof links (live since Nov 25, 2026)

Buttons link to `/auth/confirm` (src/pages/AuthConfirm.tsx) with a token hash
instead of `{{ .ConfirmationURL }}`, which spent the one-time token as soon as
anything opened the link (including Outlook/Defender "Safe Links" scanners) and,
for resets, only worked in the browser that asked. Current hrefs:

| Template | New href |
|---|---|
| Confirm sign up | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard` |
| Reset password | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery` |
| Change email address | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/settings` |
| Magic link or OTP | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/dashboard` |
| Invite user | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/dashboard` |

Authentication → URL Configuration → Site URL must stay `https://muslimprosnet.com`.
The reset flow was tested end to end on Nov 25, 2026.
