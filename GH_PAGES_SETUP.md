# Putting this on GitHub Pages

The site is plain static HTML+JSX (no build step). GitHub Pages can serve it directly.

## One-time setup

1. **Push these files to your repo.** From a local clone of `the-texas-gambit`, drop everything in this bundle into the repo root, then:
   ```bash
   git add .
   git commit -m "Initial site"
   git push origin main
   ```

2. **Enable Pages.** Go to the repo on github.com → **Settings** → **Pages** (left sidebar).

3. **Configure source:**
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
   - Click **Save**

4. **Wait ~30 seconds**, then refresh the Pages settings page. You'll see:
   > Your site is live at `https://jonathantheblip.github.io/the-texas-gambit/`

5. **Open it.** Bookmark for Helen.

## Updating the site

Any push to `main` re-deploys automatically (takes 30–90 seconds). Easiest workflow:

```bash
# pull whatever Helen / I have committed
git pull

# make changes (or paste in a fresh export bundle)
# ...

git add .
git commit -m "Pass 5: room descriptions polish"
git push
```

That's it.

## Custom domain (optional)

If you want `texasgambit.com` or similar instead of the github.io URL:

1. Buy the domain (Cloudflare Registrar is cheap and clean).
2. In **Settings → Pages**, set **Custom domain** to your domain. GitHub will create a `CNAME` file in the repo.
3. At your DNS provider, add a `CNAME` record pointing to `jonathantheblip.github.io`.
4. Wait for DNS to propagate (a few minutes to an hour). GitHub will issue a free Let's Encrypt cert automatically.

## Privacy

The repo is public by default if Pages is on the free tier. If you want it private + still served:

- **Easiest:** keep the repo private, accept that Pages on private repos requires GitHub Pro (small monthly fee), turn it on the same way.
- **Alternative:** keep the repo public but add an obscure URL slug — Pages doesn't index well, and Helen can bookmark the link. If Helen's the only viewer, this is fine.
- **Belt and suspenders:** put Cloudflare Access in front of the custom domain (free tier covers up to 50 users). Helen logs in with email; everyone else gets blocked.

## Troubleshooting

**Page loads blank.** Check the browser console (F12). Most likely: a `<script src="...">` is 404ing because a file didn't get pushed. Confirm all `.jsx`, `.js`, `.css` files made it to the repo, plus the `lookbook_images/` folder.

**Images don't load.** Same as above — confirm `lookbook_images/` is in the repo. GitHub Pages is case-sensitive; an `Image.png` referenced as `image.png` will 404.

**Changes aren't appearing.** Pages caches aggressively. Hard reload (Ctrl/Cmd + Shift + R). If still stale, check the **Actions** tab on github.com — there should be a "pages build and deployment" run; if it failed, click in to see why.

**Babel warning in console:** `You are using the in-browser Babel transformer.` Harmless. The site uses Babel in the browser to transform JSX at runtime so there's no build step. Performance is fine for this scale.
