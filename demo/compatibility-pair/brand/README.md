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

**The logo needs a light surface.** Its wordmark is ink `#383838` and its mark carries a `#dbdfe2`
and a `#fff` shape, so on the dark page of the player half of it disappears. It goes on a white
plate, which is what the brand's own documents do. Recolouring it to suit a dark interface is not an
option that was rejected for taste: it is how a brand gets broken. This page does not use the logo
yet; the file is here for the recording.

**The palette is used as accents, not as surfaces.** The reference document these came from is a
light page that fills whole bands with teal. A player is the opposite case: the picture is the
subject and everything else is furniture over it.

## The palette, for reference

Teal `#37b4a7` primary (`#c2e0de` light step, `#2a8e84` dark step), orange `#ff8d4e` accent (`#ffe0ca`
light step), ink `#1a1f2e` / `#3a4152` / `#6b7180`, paper `#f8f9fa`.
