import type { LegalSlug, SitePage } from '~/types'

export const LEGAL_SLUGS: LegalSlug[] = ['privacy', 'policy']

export const DEFAULT_LEGAL_PAGES: Record<LegalSlug, SitePage> = {
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    body: `Last updated: 17 August 2026

Bhaktiras is the community site for Shree KS Swaminarayan Temple Woolwich. This policy explains what information we collect, how we use it, and how we keep it safe — especially when you sign in.

## Who we are

Bhaktiras is run by the temple community. We use this site to share the journey, events, seva, niyams, and simple games for Patotsav.

## Signing in

You can use Bhaktiras without an account. Sign in if you want to save personal progress (for example niyams), appear on game leaderboards, or personalise your greeting.

We offer two ways to sign in:

- **Continue with Google** — you sign in with a Google account. Google confirms it is you. We never see or store your Google password.
- **Email and password** — you create a Bhaktiras account. Your password is stored by Google Firebase Authentication, not in our own database. We cannot read your password.

When you sign in with Google, Google may share your name, email address, and profile photo with us (only what you allow in the Google consent screen). We use this to create your Bhaktiras account and show your name on the site.

When you create an account, you must accept the current Privacy Policy and Site Policy. We store the document versions and acceptance times so we can show when that agreement was made.

## Why we use your data

We process account information because it is needed to provide the features you request, such as saving niyams and scores. We use legitimate interests to keep the service secure and prevent misuse. Where a feature is genuinely optional and requires consent, you can choose not to use it and withdraw that consent.

## What we store

Depending on how you use the site, we may store:

- Your account ID, display name, and email
- Game scores you choose to submit to a leaderboard (with your display name)
- Niyam ticks saved to your account
- Community wall messages you post (you can post anonymously)
- Bug reports you submit, including an optional contact email
- The versions and times of policies accepted when creating an account
- Admin-only records if you are a temple editor

We do **not** sell your data. We do **not** use it for advertising.

## Data security and Google / Firebase

The site is served over HTTPS. Accounts, scores, and content are stored with **Google Firebase** (Authentication, Firestore, and Storage). Google provides encryption in transit and at rest, access controls, and the sign-in security behind Google accounts (including 2-step verification if you have it enabled on your Google account).

Access to data is limited by Firestore security rules. For example:

- Anyone can read public content (events, timeline, published niyams, leaderboards)
- Only you can update your own niyam tracker and your own scores
- Only temple admins can edit site content, including this policy
- Only temple admins can read submitted bug reports

You should use a strong password (or Google sign-in with 2-step verification) and never share your account.

## What is public

Some things are visible to everyone on purpose, to encourage the mandal:

- Leaderboards show display name and score (not your email)
- Community niyam totals are shown as combined numbers, not your personal list
- Community wall messages you post (unless you post anonymously)

Your email address is not shown on public pages.

## Cookies and device storage

We use local device storage for things like a guest niyam tracker and your signed-in session. These are for the site to work, not for tracking you across the web.

## Children and family use

Bhaktiras is for the temple community, including families. Accounts should be created by someone 13 or older, or with a parent / guardian. We do not try to collect extra information about children. Please do not post other people's private details on the community wall.

## Your choices

You can:

- Browse without signing in
- Sign out at any time
- Open **Your account** to download a copy of data linked to your account
- Permanently delete your account and linked scores, streaks, niyam progress and game completions
- Ask a temple admin to correct information or remove a message you posted

Anonymous wall posts, anonymous bug reports and anonymised community totals do not contain your account ID, so the account tool cannot identify them automatically. Speak to a mandir admin if you need help with a specific item.

## How long we keep data

Account-linked data is kept while your account is active, unless it is needed for security, legal or safeguarding reasons. Self-service account deletion removes the account-linked records listed above. Public content submitted outside an account is kept until an admin removes it.

## Third parties

We rely on Google (Firebase Authentication, Firestore, Storage, and Google Sign-In) to run the site. Event photos are delivered from Flickr. If you choose to open GuestCam from the Community page, GuestCam operates its own service and privacy terms, including any MagicFind selfie search you choose to use. These providers may process data outside the UK under their own safeguards. We do not add advertising or behavioural analytics networks.

## Changes

We may update this policy. The latest version will always be on this page. Temple admins can edit it in the admin portal.

## Contact

For privacy questions, please speak to a mandir admin at Shree KS Swaminarayan Temple Woolwich, or reach the community through the temple WhatsApp group.

This page is a plain-language explanation for our mandal. It is not formal legal advice.`
  },
  policy: {
    id: 'policy',
    title: 'Site Policy',
    body: `Last updated: 13 August 2026

These guidelines explain how we expect everyone to use Bhaktiras, the community site for Shree KS Swaminarayan Temple Woolwich.

## Be respectful

This site is part of mandir life. Write and play in a way that would feel comfortable in sabha. Do not post abuse, hate, harassment, spam, or anything that could hurt a devotee or the temple's reputation.

## Accounts

Sign in only with your own Google or email account. Do not try to access someone else's account. Temple admins may suspend accounts that are misused.

## Community wall

Messages may be public. Do not share private phone numbers, addresses, or other people's personal information. You can post anonymously. Admins may remove messages that break these guidelines.

## Games and leaderboards

Games are for fun and satsang. Play fairly. Do not try to break or spam the leaderboards. Daily boards reset; some games keep an all-time best.

## Niyams and seva

Niyams are a personal tracker. Community totals are shown only to encourage the mandal, not to compare individuals.

## Content and photos

Timeline, events, and other pages are published by temple admins. Do not copy or reuse temple photos or videos without permission.

## Safety

If something on the site worries you, tell a mandir admin. Do not use Bhaktiras to arrange anything unsafe, especially involving children. Parents should stay involved when younger devotees use the site.

## Changes and contact

Admins may update this policy. If you have a question, speak to a mandir admin at Shree KS Swaminarayan Temple Woolwich.`
  }
}
