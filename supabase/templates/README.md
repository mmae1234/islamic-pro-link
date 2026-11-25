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

## Planned switch to scanner-proof links

The live templates use `{{ .ConfirmationURL }}`, which spends the one-time token
as soon as anything opens the link (including Outlook/Defender "Safe Links"
scanners) and, for password resets, only works in the browser that asked.

Once the `/auth/confirm` page (src/pages/AuthConfirm.tsx) is published, replace
the button `href` in each template:

| Template | New href |
|---|---|
| Confirm sign up | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard` |
| Reset password | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery` |
| Change email address | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/settings` |
| Magic link or OTP | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/dashboard` |
| Invite user | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/dashboard` |

Check first that Authentication → URL Configuration → Site URL is
`https://muslimprosnet.com`. Do NOT switch before the page is live: the old
site has no `/auth/confirm` route and every link would 404.
