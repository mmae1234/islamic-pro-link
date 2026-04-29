# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/8e0ed7b7-0ffc-4e43-978c-3b3c5a047199

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8e0ed7b7-0ffc-4e43-978c-3b3c5a047199) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Error tracking (Sentry)

Frontend errors are reported to Sentry via [`src/lib/sentry.ts`](./src/lib/sentry.ts). Initialization is **opt-in** — the client is a complete no-op unless `VITE_SENTRY_DSN` is set, so local dev and forks build and run without any Sentry account.

### Environment variables

Build-time (read by Vite — must be prefixed `VITE_`):

| Var | Required | Notes |
|---|---|---|
| `VITE_SENTRY_DSN` | for Sentry to be active | Public DSN. Safe to commit to `.env`. Format: `https://<key>@o<org>.ingest.sentry.io/<project>` |
| `VITE_APP_VERSION` | optional | Tags events with a release. If omitted, events are released-untagged. |

Runtime-only (used by `@sentry/vite-plugin` during `npm run build` to upload source maps and create releases):

| Var | Required | Notes |
|---|---|---|
| `SENTRY_AUTH_TOKEN` | only for source-map upload | Read & Write scope. Configured in Lovable runtime secrets — **do not** commit. The plugin no-ops silently when this is unset. |

`VITE_SENTRY_ORG` and `VITE_SENTRY_PROJECT` are not consumed by the runtime client (the org/project are hard-coded in `vite.config.ts` for the upload step).

### What's reported

- Uncaught render errors caught by `GlobalErrorBoundary`, `ErrorBoundary`, and `LazyRouteErrorBoundary` (each tagged with `boundary` for filtering).
- 10% transaction sampling (`tracesSampleRate: 0.1`).
- Replay on errors only (`replaysOnErrorSampleRate: 1.0`, session replay disabled).
- User context: **id only** — no email, no name (`sendDefaultPii: false`).
- Drops events when `navigator.onLine === false`.
- Email-shaped strings are scrubbed from `extra` and breadcrumb messages.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8e0ed7b7-0ffc-4e43-978c-3b3c5a047199) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
