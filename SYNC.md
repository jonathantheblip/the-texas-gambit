# Working between the design environment and Claude Code

The site can be edited from two places. They have different strengths. The trick is picking the right one for the change you're making, and keeping a clean line of sight between them.

## Where to edit what

### Edit in the **design environment** (claude.ai project) when:
- You want to **see** the change live as you make it
- You're exploring layouts, copy, color, typography
- You're adding rooms, decisions, ancestors, or other data
- You're debugging a visual issue
- You want to compare three options side-by-side
- You're not sure what you want yet

### Edit in **Claude Code** (terminal, on a local clone) when:
- You're committing finished work
- You're doing a structural refactor across many files
- You want git history, branches, PRs
- You're fixing a bug that doesn't need visual feedback to debug
- You're adding tooling or dependencies
- You want to test in a real browser locally before pushing

## The handoff dance

The single most important rule: **don't make changes in both places between syncs.** Pick one as the source of truth between commits.

### Pattern A: design first, ship via Claude Code

1. Open the design project (this environment). Iterate visually until happy.
2. Ask Claude (here) to **export a fresh bundle** — you'll get a downloadable zip.
3. Open Claude Code in your local clone. Pull latest from `main`.
4. Unzip the bundle into the repo, overwriting files.
5. Have Claude Code run `git status` and `git diff` to show you what changed.
6. Commit + push. GitHub Pages auto-deploys.

### Pattern B: bug fix in Claude Code, then re-import

1. Open Claude Code in your local clone.
2. Pull latest, fix the bug, commit, push.
3. Next time you open the design project, ask Claude (here) to **re-import from GitHub** so this environment matches the canonical version.

### Pattern C: emergency parallel work

If you and Helen are both editing — Helen leaving comments here, you fixing something in Claude Code — that's fine because you're touching different things (her notes save to localStorage in her browser; your code changes go to git). Just don't both edit code in both places at once.

## The "is this in sync?" sniff test

When you open the design environment after some time away, check:

1. Does the topbar show the version of the data you expect? (e.g. did Helen's note about the front porch land?)
2. Open `data.js` and `app.jsx` — do they match the `main` branch on GitHub?
3. If they don't, ask Claude here to re-import from GitHub before making changes.

If you do work here without checking, and then export a bundle that overwrites work that landed in `main` from elsewhere, you'll lose those changes. Git will catch it on commit (the diff will show unexpected reversions) but it's friction you don't need.

## What lives where

| Thing | Edit here | Edit in Claude Code |
|---|---|---|
| Room images, copy, anchors | ✅ | also fine |
| Visual styling, layout | ✅ | possible but slower |
| Adding a new feature | ✅ then export | ✅ |
| Fixing a bug | depends — visual ✅ here, structural ✅ Claude Code | |
| Updating data (`data.js`) | ✅ | ✅ |
| Helen's reactions / notes | (saves to her browser, not git) | n/a |
| README / docs | either | ✅ better |
| `.gitignore`, repo config | n/a | ✅ |

## Mental model

Think of this design environment as **a high-end visual design tool that happens to write code**. Think of Claude Code as **a real engineer pair-programming on a real codebase**. They're complementary. Use the right one for the moment.
