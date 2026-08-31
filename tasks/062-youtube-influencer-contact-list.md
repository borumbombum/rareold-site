Status: [TODO] Youtube Influencer Contact List

## Context

After all whiskies from the pending queue have been added (task 037–060), the site will have influencer videos attached to products in all languages. We need a consolidated list of every YouTube influencer whose videos are embedded, so we can reach out and tell them about the project.

## Requirements

- Scan all product records and extract unique YouTube video URLs (across all languages).
- For each unique video, fetch the channel name and channel URL from YouTube (or from metadata already stored).
- Deduplicate by channel (one entry per influencer/channel).
- Output a clean list (markdown or CSV) with: channel name, channel URL, number of videos featured, and the product names their videos appear on.

## Acceptance criteria

- [ ] A script or manual process exists that produces the influencer list.
- [ ] The list is saved to a file (e.g. `docs/youtube-influencers.md` or `.csv`).
- [ ] Each entry has: channel name, channel URL, video count, product names.
- [ ] No duplicate channels in the final list.

## Progress

- 2026-08-31: Task created.
