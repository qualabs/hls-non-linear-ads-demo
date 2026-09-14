# brand/ — the Qualabs brand kit, vendored

Copies. Not links, not a CDN, not a path into another project on somebody's laptop: a file that
resolves off a sibling repo works exactly until the demo is published from anywhere else — and this
one is published.

| file | what it is | copied from |
| --- | --- | --- |
| `logo-qualabs.svg` | the full logo, mark plus wordmark, 1920x436 | `demo/multiview-offer/brand/logo-qualabs.svg` |
| `logo-qualabs-on-dark.svg` | the same artwork with its seven wordmark paths in white | `demo/multiview-offer/brand/logo-qualabs-on-dark.svg` |
| `favicon.svg` | the mark alone, for the browser tab | `demo/multiview-offer/brand/favicon.svg` |
| `fonts-embedded.css` | Poppins 400/500/600/700 + italic 600, and JetBrains Mono 400/500/600, as base64 woff2 in eight `@font-face` rules | `demo/multiview-offer/brand/fonts-embedded.css` |

Copied on 2026-09-14, byte for byte, out of `demo/multiview-offer/`, which copied them on 2026-09-11
out of `demo/hydration-break/`, which vendored them from the brand kit on 2026-08-18. **Do not edit
them here.** If the brand changes, copy the new version over; a divergent local edit is a fork of
somebody else's brand that nobody will find.

**Every demo vendors its own copy and they are not shared.** A demo is a folder that is served on its
own (ADR 0022) and published on its own, so a file one folder up is a file that is not in the bucket.
The cost is 180 kB repeated per demo and it is paid on purpose.

## Two things worth knowing before using them

**The logo needs a light surface.** Its wordmark is ink `#383838` and its mark carries a `#dbdfe2` and
a `#fff` shape, so on a dark page half of it disappears. `logo-qualabs-on-dark.svg` is the answer this
project settled on: the same file with the wordmark in white and the mark untouched. That is the one
this page uses, at the top and at the foot.

**The palette is used as accents, not as surfaces.** The picture is the subject and everything else
is furniture around it.

## The palette, for reference

Teal `#37b4a7` primary (`#c2e0de` light step, `#2a8e84` dark step), orange `#ff8d4e` accent (`#ffe0ca`
light step), ink `#1a1f2e` / `#3a4152` / `#6b7180`, paper `#f8f9fa`.
