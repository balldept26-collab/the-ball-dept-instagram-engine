# The Ball Dept — Automated Reels

Zero-subscription-cost Instagram Reel generator and Buffer scheduling client for `@theballdept`.

## Locked promotion

- Fliff code: `4F273`
- Headline: `GET A $250 BONUS`
- Qualification copy: `UP TO $250`
- Visible disclaimer: `18+`

## Generate original Reels

```bash
npm install
npm run generate:reels
```

The seven-post rotation is written to `output/reels/` as 1080 × 1920 MP4 files. Captions live in `output/reels-manifest.json`. The videos use original graphics rather than copyrighted game footage.

## One-time free connection

1. Create a free Buffer account and connect the professional Instagram account `@theballdept`.
2. Create a personal API key in Buffer API settings.
3. Put this project in a public GitHub repository so Buffer can fetch the generated MP4.
4. Add one encrypted repository secret: `BUFFER_API_KEY`.

The publisher automatically finds the connected Instagram channel named
`@theballdept` and derives the public media URL from GitHub Actions. If the
account name changes, set `BUFFER_CHANNEL_NAME`; `BUFFER_CHANNEL_ID` and
`PUBLIC_MEDIA_BASE_URL` remain optional manual overrides.

5. Enable the included daily GitHub Actions workflow.

No password, API key, or account code belongs in the repository or in chat. To queue one Reel manually:

```bash
npm run publish -- clutch-gene
```

Set `PUBLISH_AT` to an ISO-8601 UTC timestamp for an exact time; otherwise the Reel goes into the next Buffer queue slot.

## Content standard

Every Reel includes a persistent Fliff/code sponsor line, an end CTA, `18+`, terms language, and an affiliate disclosure. Verify the exact Fliff offer and applicable location rules before publishing; do not promise winnings or imply that a deposit is risk-free.
