# Putting this on GitHub Pages

The app now has a **build step** (Vite), so the old "deploy from a branch / root" setup no longer applies — Pages serves the built `dist/`, produced by GitHub Actions.

## One-time setup
1. Open the **repository's** Pages settings (not your account settings):
   **https://github.com/jonathantheblip/the-texas-gambit/settings/pages**
   (i.e. open the repo, click its own **Settings** tab in the repo top bar, then **Pages** in the left sidebar — *not* the avatar-menu Settings, which only shows "Verified domains").
2. Under **Build and deployment → Source**, choose **GitHub Actions** (not "Deploy from a branch").

That's the whole switch. The workflow at `.github/workflows/deploy.yml` does the rest.

## Going live
The deploy workflow triggers on a push to **`main`** (or manually from the Actions tab). The render-forward work currently lives on the `render-forward-3d` branch, so "go live" means merging it to `main`:
```bash
git checkout main
git merge render-forward-3d
git push origin main          # → Actions builds and deploys
```
It builds the app and publishes to:
> https://jonathantheblip.github.io/the-texas-gambit/

Because it's a **project** site (served under `/the-texas-gambit/`), `vite.config.js` sets `base: '/the-texas-gambit/'` for builds so asset URLs resolve. Once live it's an installable PWA — Helen can "Add to Home Screen," and it works offline.

## Updating the site
Any push to `main` re-deploys automatically (build → publish, ~1–2 min). Nothing to run by hand.

## Safety gate (CI)
`.github/workflows/ci.yml` runs on every push/PR and fails if:
- a **lock breaks** (`scripts/validate.py` on `compound_rooms.json`),
- a **test fails** (`npm test`), or
- the **build breaks** (`npm run build`).

So a bad edit can't reach `main` (and the live site) silently.

## Local preview of the production build
```bash
npm run build && npm run preview
```
Serves `dist/` with the service worker active — the closest thing to the deployed PWA.

## Custom domain (optional)
1. Buy the domain (Cloudflare Registrar is cheap and clean).
2. **Settings → Pages → Custom domain** → your domain (GitHub adds a `CNAME`).
3. At your DNS provider, add a `CNAME` record pointing to `jonathantheblip.github.io`.
4. Wait for DNS; GitHub issues a free Let's Encrypt cert automatically.

(With a custom domain you can drop the `base` in `vite.config.js` back to `/`, since the site is then served from the domain root.)

## Privacy
Pages on the free tier serves public repos. Options if you want it less open:
- Keep the repo **private** + Pages on GitHub Pro (small monthly fee).
- Keep it public but rely on the obscure URL (Pages isn't indexed well; fine if Helen's the only viewer).
- **Belt and suspenders:** put Cloudflare Access in front of a custom domain (free up to 50 users) — Helen logs in by email, everyone else is blocked.

## Troubleshooting
- **Blank page / 404 assets:** usually a `base` mismatch — confirm `vite.config.js` `base` matches the Pages path (`/the-texas-gambit/` for the project site).
- **Changes not appearing:** the service worker caches aggressively (`autoUpdate` applies on next load). Hard-reload (Ctrl/Cmd+Shift+R), or check the **Actions** tab for a failed deploy.
- **Deploy didn't run:** confirm **Settings → Pages → Source = GitHub Actions**, and that you pushed to `main`.
