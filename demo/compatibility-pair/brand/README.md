# brand/ — the Qualabs brand kit, vendored

Copies. Not links, not a CDN, not a path into another project on somebody's laptop: a file that
resolves off a sibling repo works exactly until the demo is recorded or shown from anywhere else.

| file | what it is | copied from |
| --- | --- | --- |
| `logo-qualabs.svg` | the full logo, mark plus wordmark, 1920x436 | `projects/mtv-accelerators/design-references/qualabs-brand/assets/logo_qualabs.svg` |
| `favicon.svg` | the mark alone, for the browser tab | `.../qualabs-brand/assets/favicon.svg` |
| `fonts-embedded.css` | Poppins 400/500/600/700 + italic 600, and JetBrains Mono 400/500/600, as base64 woff2 in eight `@font-face` rules | `.../qualabs-brand/fonts/fonts-embedded.css` |

Copied on 2026-08-18, byte for byte. **Do not edit them here.** If the brand changes, copy the new
version over; a divergent local edit is a fork of somebody else's brand that nobody will find.

## Two things worth knowing before using them

**The logo needs a light surface, and what changes to get one is the logo.** The wordmark of
`logo-qualabs.svg` is ink `#383838`, so on a dark page half of it disappears. The answer is a
variant with the wordmark in white and the mark untouched, not a white rectangle under it: Nicolás
rejected the plate, twice, and `demo/hydration-break/brand/logo-qualabs-on-dark.svg` is that
variant. **This page still puts the mark on a light plate**, which predates that decision and is a
pending call, not an endorsement.

**The palette is used as accents, not as surfaces.** The reference document these came from is a
light page that fills whole bands with teal. A player is the opposite case: the picture is the
subject and everything else is furniture over it.

## The palette, for reference

Teal `#37b4a7` primary (`#c2e0de` light step, `#2a8e84` dark step), orange `#ff8d4e` accent (`#ffe0ca`
light step), ink `#1a1f2e` / `#3a4152` / `#6b7180`, paper `#f8f9fa`.
