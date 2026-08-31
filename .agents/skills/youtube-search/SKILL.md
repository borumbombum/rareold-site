---
name: youtube-search
description: Step-by-step method for finding and verifying exact-whisky, in-language YouTube review/tasting videos for the Old Rare catalog. Uses every search source that returns results (native YouTube scraper + multiple Invidious instances) because no single endpoint finds everything, then verifies each candidate via oEmbed. Companion to add-product Step 5. Use whenever you need to discover or vet influencer videos for a product and language.
---

# Finding YouTube videos for a product

Goal: for one product (`[whisky_name]`) find **real, playable review/tasting videos** of that **exact expression**, spoken in each target language (`es | en | pt | ja | fr`), and output them as `influencer_videos` entries.

**Why this skill exists.** No single search source finds everything. The native YouTube results scraper returns the most hits with channel + duration, but it buries some exact-expression videos (it found nothing good for Royal Salute's Treasured Blend). Invidious instances preserve original-language titles and surfaced the exact videos native search missed. So you **run every endpoint that returns results, merge, dedup, and verify** — never settle on one source.

**Inherited hard rule (from `add-product` Step 5):** a video may be used ONLY if it reviews/tastes the **EXACT whisky/expression** on the product. Never another version, age, brand, or same-style/region substitute. If a language has no exact-expression video, that language gets nothing (English tops up at runtime). The spoken language must match the slot.

---

## Workflow

### 1. Search — use ALL sources that return results

Run the same query through every search endpoint, then merge + dedup by video ID.

**A. Native YouTube** (`scripts/yt-search.mjs`, repo-maintained):

```bash
node scripts/yt-search.mjs "Royal Salute Treasured Blend review"
```

Output is TSV: `id<TAB>length<TAB>channel<TAB>title`. **Channel + length are your shortlist signals** (prefer 3–20 min reviews on whisky-review channels). **Titles are auto-translated into English by YouTube — do NOT trust them for language determination.** (The script hardcodes `accept-language: en`; the *query* language and the *channel* are what tell you the true spoken language.)

**B. Invidious instances** (`scripts/yt-invidious.mjs`, repo-maintained):

```bash
node scripts/yt-invidious.mjs "Royal Salute Treasured Blend review"
node scripts/yt-invidious.mjs "ロイヤルサルート トレジャード ブレンド"
node scripts/yt-invidious.mjs "タリスカー 25年 テイスティング"
```

Output is `id ||| title [via <instance>]` per result. Titles here are **preserved in the original language** — this is how you spot genuine foreign-language reviews that native search hides. The script tries several public instances automatically and skips any that returned 401/403/"Endpoint disabled". If an instance reports no results or fails, that's fine — the others may still hit.

**C. If both are thin**, try directly:
- More Invidious instances not already in `scripts/yt-invidious.mjs` (public instance lists exist), same `/search?q=` format.
- Plain `websearch` for the phrase in-language (e.g. `"Talisker 25" review youtube`) to discover a channel, then search that channel.

### 2. Query crafting (per language)

- **Exact expression name**, not just the distillery or a loose descriptor. This was the Royal Salute lesson: querying "Royal Salute 25" found nothing; "Royal Salute **Treasured Blend**" found the exact videos. Match the product's official expression name.
- **Native script for non-Latin scripts** (Japanese): use `ロイヤルサルート トレジャード ブレンド`, `タリスカー 25年`. Latin languages: use the expression name plus a review cue.
- Add a language-appropriate review/tasting cue:
  - `es`: cata, review, opinión, degustación
  - `en`: review, tasting
  - `pt`: review, degustação, opinião
  - `ja`: テイスティング, レビュー, 飲んでみた
  - `fr`: test, avis, dégustation, revue
- Run the query in the **target language**; the channel + preserved title tell you if the narration is actually in that language.

### 3. Shortlist

From the merged results, pick 6–10 candidates per language. Favor:
- Whisky review/tasting channels (not "unboxing", "unboxing shorts", or brand ads)
- 3–20 minute durations (from `yt-search.mjs`)
- Titles that name the **exact expression**
- Channels whose name/narration matches the target language

### 4. Verify every candidate (mandatory — no API key)

oEmbed returns the **authoritative** title + channel, which is the ground truth for both the spoken language and whether it's the exact whisky:

```bash
node scripts/yt-verify.mjs <id1> <id2> ...      # or: cat ids.txt | node scripts/yt-verify.mjs
curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json"
```

- `200` → live and playable; `author_name` (channel) + `title` = authoritative.
- `404`/`DEAD` or `401`/`BLOCK` → dead or embed-blocked → discard.
- Apply the hard rule: reject if the oEmbed title shows a **different expression/version/age/brand**, or if the spoken language (channel/title) doesn't match the target slot. Don't list an English video in a non-English slot.

### 5. Output

Emit for each chosen video the seed shape from `add-product` Step 5:

```json
{ "language": "en", "platform": "youtube", "url": "https://www.youtube.com/watch?v=ID", "label": "<short title/channel>", "created_at": "2000-01-01T00:00:00.000Z" }
```

Rules: `language` ∈ `es|en|pt|ja|fr`; one URL per product per language ever; prefer 3–20 min; `label` short and localized where possible; fixed `created_at` timestamp. Hand these to `add-product` Step 5 for seeding.

---

## Common pitfalls

- **Trusting auto-translated titles.** YouTube rewrites titles to the `accept-language` hint. Always confirm via oEmbed, and use the **channel** + **preserved-title** sources to judge real language.
- **Searching a loose name.** Always the exact expression ("Royal Salute Treasured Blend" not "Royal Salute"), native script for Japanese.
- **An Invidious instance returning 401/403/"Endpoint disabled".** Expected for some instances — the script skips them automatically; native YouTube still works.
- **Pad-filling a language.** If no exact-expression video exists in that language after honest multi-source search, ship nothing for it (English tops up at runtime). Never substitute a different expression.
- **An English video in a Spanish/Japanese/… slot.** Forbidden — the runtime pairs each video with its slot's locale; a non-localized video belongs in `en` only.
