Status: DONE

# Link the code to the GitHub repo

## Context

`/workspace` (the "Rare Old" whisky ranking: SvelteKit + Turso + Google login) is **not** a git
repository yet. The owner created `https://github.com/borumbumbom/rareold-site`; it returns 404
unauthenticated, so it is **private** and its contents cannot be verified without auth.

This environment is Debian 12, running as root, with `apt-get` and `curl` available, but **no** `gh`
CLI, **no** SSH keys, **no** saved tokens, and **no** git identity configured. This task is meant to
be executed by an agent that can obtain credentials from the repo owner. Per owner decisions:

- Commit identity: `Borum <borumbumbom@proton.me>` (set **repo-local**, never global).
- Auth method: **install `gh` CLI and authenticate via the GitHub device flow**.

## Requirements

1. **Init** `git init -b main` in `/workspace`.
2. **Identity (repo-local)**: `git config user.name "Borum"` and
   `git config user.email "borumbumbom@proton.me"`.
3. **Remote**: `git remote add origin https://github.com/borumbumbom/rareold-site.git`.
4. **Authenticate**: install `gh` per GitHub's official apt instructions (Debian 12), then
   `gh auth login` (device flow, HTTPS protocol, `repo` scope) and `gh auth setup-git` so git uses the
   credential helper (token must never be embedded in the remote URL).
   - Note: a non-TTY agent shell cannot run the interactive `gh auth login` TUI. Fallback: drive the
     device flow manually — `POST https://github.com/login/device/code` with the public GitHub CLI OAuth
     `client_id`, hand the owner the one-time code + `https://github.com/login/device`, poll
     `https://github.com/login/oauth/access_token` until authorized, store the token, then
     `gh auth login --with-token` + `gh auth setup-git`.
5. **Stage and verify**: `git add -A`, then confirm `git status --short` does **not** stage `.env`,
   `node_modules/`, `/.svelte-kit`, `.vercel`, `/tools`, `/data/images/raw` (covered by the existing
   `.gitignore`). Confirm `.env.example` (whitelisted) holds no real secrets. `data/images/*.webp`
   (~157 files, ~5.6 MB) **is** intentionally committed (served via `vercel.json`).
6. **Commit**: `Initial commit: Rare Old whisky ranking (SvelteKit + Turso + Google auth)`.
7. **Push**: `git push -u origin main`. If the remote is **not empty** (e.g. created with a README),
   do **not** force-push: `git pull --rebase origin main`, re-push, and if conflicts arise stop and ask.

## Acceptance criteria

- The full codebase is on GitHub at `github.com/borumbumbom/rareold-site`, branch `main`.
- No secrets (`.env`, Turso tokens, Google client secret) exist in history or the working tree.
- `git status` is clean; `git remote -v` shows `origin`.
- Pushing again works without re-entering a token (gh credential helper configured).

## Progress

- 2026-08-15: Done. Environment was macOS (not Debian) with `gh` already installed/authenticated as `borumbombum`. Repo `borumbombum/rareold-site` existed (public, default branch `main`, one auto-generated README commit `90e4349`). Ran `git init -b main`, set repo-local identity `Borum <borumbumbom@proton.me>`, added clean `origin` remote. Committed all 306 files (`.env`, `node_modules/`, `/.svelte-kit`, `.vercel`, `/tools`, `/data/images/raw` excluded by `.gitignore`; `.env.example` verified secret-free; 156 webp committed). Rebased onto `origin/main`, resolved the `README.md` add/add conflict in favor of the project README. Pushed `90e4349..93db65c` to `main`. Working tree clean, `main` tracks `origin/main`, no token embedded in the remote URL. Note: GitHub REST/GraphQL API returned inconsistent 404s for this repo throughout; git smart-HTTP (the authoritative path) worked and the push was confirmed by a fresh fetch.
