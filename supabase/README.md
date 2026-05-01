# Hill Country Estate — shared backend

This sets up the cross-device shared store for Helen + Jon. The site keeps working without it (single-device, localStorage-only); turning sync on takes ~10 minutes.

## What you get

- Helen pins a note on her phone → Jon sees it on his laptop within ~5s
- Every entry stamped with `author` (helen or jon)
- Offline-tolerant: writes queue and flush on reconnect
- localStorage becomes a cache, not the source of truth

## Setup

### 1. Create a Supabase project

[supabase.com](https://supabase.com) → New project. Free tier is plenty.

Copy from **Project Settings → API**:
- **Project URL** (e.g. `https://abcd1234.supabase.co`)
- **anon / public key** (long `eyJ...` string — RLS-gated, safe to ship in frontend)

### 2. Apply the schema

Open **SQL Editor** in the Supabase dashboard, paste [`schema.sql`](./schema.sql), run.

This creates 7 tables (`room_state`, `notes`, `pins`, `room_specs`, `decisions`, `journal`, `wall`), enables them on the `supabase_realtime` publication, and applies permissive RLS (anon can read + write — see "security" below).

### 3. Wire the keys into the site

Edit each entry HTML — [`index.html`](../index.html), [`helen.html`](../helen.html), [`jon.html`](../jon.html) — and fill in the `__HCE_CONFIG` block:

```html
<script>
  window.__HCE_CONFIG = {
    url: 'https://abcd1234.supabase.co',
    anonKey: 'eyJhbGc...',
  };
</script>
```

Commit, push. GitHub Pages auto-deploys. The `.sync-indicator` in the topbar should flip to `Syncing…` then go quiet (idle) once the first pull lands.

### 4. (One time) seed the server from your existing localStorage

If Helen has been adding notes pre-sync, those live in her browser only. To push them up:

- The first time the site loads with `__HCE_CONFIG` set AND the server is empty AND localStorage has content, **the app auto-migrates** — uploads the cache, stamps entries with the active mode, marks `hce.migrated = 1`. Done.
- If you want to seed manually (e.g. merging both Helen's and Jon's caches), open [`migrate.html`](../migrate.html), paste each user's `localStorage.getItem('hce.v3')` blob, choose author, push.

## Security model

This is a 2-person family tool. There is no per-user auth.

- The Supabase anon key is **safe to ship in source** — it's RLS-gated.
- RLS is permissive (`anon` can do everything) because the only callers are Helen and Jon. The deployment URL is the gate.
- Don't post the URL on the public web. If someone finds it, they can read/write the family's notes.

### Optional: shared-secret URL gate

If you want a thin obfuscation layer:

1. Add `token: 'some-long-random-string'` to `__HCE_CONFIG`
2. Add a startup script in each HTML entry that checks `localStorage.getItem('hce.token') === window.__HCE_CONFIG.token`, prompts on mismatch, stores on success.

Not implemented by default — keep it lean.

## How sync works (mental model)

- **store.js** is cache-first. `Store.load()` returns localStorage immediately. `Store.save(s)` writes localStorage AND diffs against the previous snapshot to emit per-row ops, which it hands to `HCESync.queueOps()`.
- **sync.js** owns the network. On boot it pulls all 7 tables and reconstructs the nested store shape via `Store.applyRemote()`. It subscribes to `postgres_changes` on the `hce-global` realtime channel — any delivery triggers a fresh pull. The outbox lives in `localStorage['hce.outbox']`; offline writes accumulate there and flush on `online` event. Periodic 60s reconcile pull is the safety net.
- **No sync.js / no config** → `HCESync` is a no-op stub. `Store.save` still writes localStorage. The `.sync-indicator` shows `unconfigured`. Everything works, single-device.

## Acceptance test

After setup, the brief's acceptance criteria should hold:

1. Helen on phone (helen.html) pins a note → Jon on laptop (jon.html) sees it within 5s.
2. Each note/pin/decision shows `— H` or `— J`.
3. Phone goes airplane mode → 5 changes → reconnect → all 5 land.
4. Fresh device opens the URL → sees full state within 2s.
5. Mode/route guard still flips on deep links (`/digest` → Jon, `/wall` → Helen).
6. PASS 6/7 readability + mobile overflow fixes intact.
7. Wiping localStorage and reloading → same UI (server is the source of truth).

## Troubleshooting

- **`.sync-indicator` stuck on "Syncing..."** — open DevTools console, check `[HCESync]` logs. Most likely a CORS / RLS error from a wrong key.
- **Nothing replicates between devices** — check that the schema's `alter publication supabase_realtime add table ...` ran. Without it, `postgres_changes` fires nothing.
- **Outbox piling up forever** — `JSON.parse(localStorage.getItem('hce.outbox'))` to inspect; usually a schema mismatch (e.g. SQL ran partially). Fix the schema and clear: `localStorage.removeItem('hce.outbox')`.
- **Auto-migration didn't happen** — by design, only fires when server is fully empty AND `hce.migrated` flag is unset. Use `migrate.html` for manual seeding.
