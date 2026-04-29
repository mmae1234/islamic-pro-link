# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]
### Added
- Admin Release Notes page that renders this changelog for internal visibility.
- Colocated React Query hooks (`src/hooks/queries/`) for the professional directory, business directory, profiles, favorites, conversations, and mentorship — unifying caching and invalidation across the app.
- Sentry error tracking via `@sentry/react`, gated on `VITE_SENTRY_DSN` (no-op when unset). Captures uncaught render errors from `GlobalErrorBoundary`, `ErrorBoundary`, and `LazyRouteErrorBoundary` (each tagged with `boundary`); sets user context to id only on auth state change. Privacy defaults: `sendDefaultPii: false`, replay session sample 0%, replay-on-error 100%, beforeSend drops offline events and scrubs email-shaped strings.
- Source-map upload via `@sentry/vite-plugin` at build time when `SENTRY_AUTH_TOKEN` is present; no-op otherwise.

### Changed
- Six pages (Search, Businesses, Favorites, Profile, Mentorship, Messages) migrated from raw `useEffect + useState + supabase.from(...)` to the new query hooks. UI behavior unchanged; data layer only.
- Messages realtime subscription now invalidates query caches via `queryClient.invalidateQueries` instead of manually re-fetching.

### Fixed
- N/A

### Removed
- N/A

### Build
- `terser` added as a `devDependency` so `@vitejs/plugin-legacy` minification works on local builds without `--legacy-peer-deps` gymnastics.

## [1.4.1] - 2025-08-12
### Fixed
- Minor UI adjustments and copy updates following security hardening.

## [1.4.0] - 2025-08-12
### Added
- Social links on Business Dashboard and Professional Edit Profile.
- Help/FAQ updates and Settings page cleanup for clearer roles.

### Changed
- Businesses listing and guest Business Profile now source from a restricted `business_directory` view exposing only non-sensitive fields.

### Fixed
- Security: Restricted public access to `business_accounts` sensitive data; dropped broad public SELECT, added auth-only policy, and introduced `SECURITY DEFINER` view function limited to safe columns.

## [1.3.0] - 2025-07-20
### Added
- Mobile-focused fixes and improvements to iOS auth fallback.

### Changed
- Color/theme token refinements in design system for better contrast.

## [1.2.0] - 2025-06-25
### Added
- Businesses directory and Business Profile pages with favorites support.

### Changed
- Search experience and filters for improved discovery.

## [1.1.0] - 2025-06-05
### Added
- Mentorship pages, requests, and search filters.

## [1.0.0] - 2025-05-15
### Added
- Initial public release: Landing, Auth, Profiles, Search, and core UI components.

[Unreleased]: https://github.com/REPO_OWNER/REPO_NAME/compare/v1.4.1...HEAD
[1.4.1]: https://github.com/REPO_OWNER/REPO_NAME/releases/tag/v1.4.1
[1.4.0]: https://github.com/REPO_OWNER/REPO_NAME/releases/tag/v1.4.0
[1.3.0]: https://github.com/REPO_OWNER/REPO_NAME/releases/tag/v1.3.0
[1.2.0]: https://github.com/REPO_OWNER/REPO_NAME/releases/tag/v1.2.0
[1.1.0]: https://github.com/REPO_OWNER/REPO_NAME/releases/tag/v1.1.0
[1.0.0]: https://github.com/REPO_OWNER/REPO_NAME/releases/tag/v1.0.0
