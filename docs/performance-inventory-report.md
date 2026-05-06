# Performance and Inventory Report

Date: 2026-05-06
Scope: production Vite bundle, route-level React surfaces, Cloudflare Pages Functions/API inventory, and static governance/documentation assets in this repository.

## Executive summary

- **Primary performance issue found:** the application shell imported every major route workspace eagerly, so first-load users downloaded admin, teacher, student, legal, news, and public route code in one JavaScript bundle.
- **Remediation implemented:** route surfaces now use `React.lazy` with `Suspense`, and admin navigation metadata was extracted into a lightweight module so the shell can render workspace navigation without pulling the full admin workspace into the initial chunk.
- **Build result after remediation:** the initial JavaScript chunk is now **195.91 kB / 59.64 kB gzip** instead of the pre-change single **747.81 kB / 203.72 kB gzip** bundle observed during the baseline build.
- **Remaining watch item:** CSS is still a single **95.80 kB / 16.28 kB gzip** asset. That is acceptable for the current scope, but future route-specific CSS extraction or stricter utility pruning should be considered if styles continue to grow.

## Performance checks performed

| Check | Result | Notes |
| --- | ---: | --- |
| Production build baseline | Passed | Baseline build produced one large route bundle: `dist/assets/index-DF3k7ZNu.js` at 747.81 kB / 203.72 kB gzip. |
| Production build after remediation | Passed | Build now emits multiple async route chunks and a much smaller entry chunk. |
| Initial JS entry chunk | Improved | 747.81 kB -> 195.91 kB uncompressed; 203.72 kB -> 59.64 kB gzip. |
| Route-level code splitting | Implemented | Landing, login, news, legal, student, community, teacher, and admin experiences are lazy-loaded. |
| Admin shell navigation dependency | Improved | Navigation labels/icons/groups were moved out of `AdminWorkspace.jsx` so the app shell does not eagerly import the heavy admin workspace just to render nav items. |

## Current production bundle inventory

Generated with `npm run build` on 2026-05-06.

| Asset | Size | Gzip | Purpose |
| --- | ---: | ---: | --- |
| `dist/index.html` | 1.11 kB | 0.56 kB | HTML shell |
| `dist/assets/index-BukI3-CR.css` | 95.80 kB | 16.28 kB | Shared styles |
| `dist/assets/index-DJo1i13q.js` | 195.91 kB | 59.64 kB | Initial app shell/runtime |
| `dist/assets/learningPath-BSG_dUrW.js` | 1.36 kB | 0.64 kB | Shared learning path helpers |
| `dist/assets/SecurityTurnstile-Dtnflywv.js` | 1.36 kB | 0.70 kB | Turnstile widget chunk |
| `dist/assets/newsUtils-Cl-3HWJy.js` | 2.26 kB | 1.11 kB | News utility chunk |
| `dist/assets/embedUtils-D_311pQv.js` | 5.39 kB | 1.60 kB | Embed parsing chunk |
| `dist/assets/NewsArchive-CSh8jjRg.js` | 6.66 kB | 2.20 kB | News archive route |
| `dist/assets/LoginExperience-DHJhzgb0.js` | 17.76 kB | 5.45 kB | Login/reset/verification route |
| `dist/assets/StudentCommunityExperience-DWMbMFlx.js` | 19.82 kB | 4.82 kB | Student community route |
| `dist/assets/TeacherWorkspace-CwZFDD7K.js` | 27.52 kB | 7.26 kB | Teacher workspace route |
| `dist/assets/StudentExperience-CW8BCcrI.js` | 40.22 kB | 8.51 kB | Student portal route |
| `dist/assets/SopsWorkspaceV2-Dk6bTOvz.js` | 41.54 kB | 12.06 kB | SOP workspace shared by admin/teacher chunks |
| `dist/assets/PublicExperience-z7J6F71B.js` | 48.43 kB | 13.19 kB | Landing/public marketing route |
| `dist/assets/LegalPages-3QMo7Y75.js` | 67.03 kB | 18.64 kB | Legal pages route |
| `dist/assets/AdminExperience-BNOGweqU.js` | 117.21 kB | 27.79 kB | Admin route wrapper/workspace |
| `dist/assets/MarkdownContent-Cv7Nxubb.js` | 157.00 kB | 47.58 kB | Markdown renderer dependency chunk |

## Source inventory

| Area | Inventory | Notes |
| --- | ---: | --- |
| `src/` files | 38 | Frontend React app, shared UI, hooks, services, and platform workspaces. |
| `src/features/platform/` lines | 15,948 | The heaviest UI area is the platform workspace feature set. |
| `functions/` files | 71 | Cloudflare Pages Functions endpoints and shared API libraries. |
| `migrations/` files | 10 | D1 schema evolution through enrollment completion. |
| `docs/governance/` files | 12 | Governance policies, SOPs, checklists, RACI, and audit evidence templates. |

## Findings and recommendations

### Fixed now

1. **Eager route imports inflated first-load JavaScript.**
   - The app shell no longer statically imports every major route component.
   - `React.lazy` now loads route experiences only when needed.
   - A small `RouteLoadingFallback` keeps route transitions explicit while chunks load.

2. **Admin navigation metadata was coupled to the full admin workspace.**
   - Admin labels, icons, and grouping metadata now live in `adminNavigation.js`.
   - This avoids importing the large admin workspace just to render shell navigation.

### Monitor next

1. **Markdown dependency chunk size.**
   - `MarkdownContent` is 157.00 kB / 47.58 kB gzip after chunking.
   - If markdown is not needed on common first routes, keep it isolated; if it leaks into the entry chunk later, investigate imports immediately.

2. **CSS growth.**
   - Shared CSS remains under 100 kB uncompressed, but the app has many workspace states and utility classes.
   - Re-check after large UI additions.

3. **Workspace component size.**
   - `AdminWorkspace.jsx` remains the largest route source file.
   - Future admin enhancements should favor smaller section modules to preserve chunk readability and maintainability.

## Verification command

```bash
npm run build
```
