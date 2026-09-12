# brand/ — the Qualabs brand kit, vendored

Copies. Not links, not a CDN, not a path into another project on somebody's laptop: a file that
resolves off a sibling repo works exactly until the demo is recorded or shown from anywhere else.

| file | what it is | where it comes from |
| --- | --- | --- |
| `logo-qualabs.svg` | the full logo, mark plus wordmark, 1920x436 | `projects/mtv-accelerators/design-references/qualabs-brand/assets/logo_qualabs.svg` |
| `logo-qualabs-on-dark.svg` | the same artwork with its seven wordmark paths in white and the mark keeping its four inks | derived here from `logo-qualabs.svg` |
| `favicon.svg` | the mark alone, for the browser tab | `.../qualabs-brand/assets/favicon.svg` |
| `fonts-embedded.css` | Poppins 400/500/600/700 + italic 600, and JetBrains Mono 400/500/600, as base64 woff2 in eight `@font-face` rules | `.../qualabs-brand/fonts/fonts-embedded.css` |

The three copied on 2026-08-18, byte for byte. **Do not edit those here.** If the brand changes,
copy the new version over; a divergent local edit is a fork of somebody else's brand that nobody
will find.

## Two things worth knowing before using them

**The logo needs a light surface, and what changes to get one is the logo.** The wordmark of
`logo-qualabs.svg` is ink `#383838`, so on the dark page of this demo it is not there. The answer
is `logo-qualabs-on-dark.svg` — the same artwork with the wordmark in white and the mark untouched
— and not a white rectangle under it, which is what Nicolás rejected, twice. That is what this page
uses, at the masthead and at the foot of the credits. It is still the only mark outside the
picture: nothing of ours sits over the frame a layout uses.

**The palette is used as accents, not as surfaces.** The reference document these came from is a
light page that fills whole bands with teal. A player is the opposite case: the picture is the
subject and everything else is furniture over it.

## The palette, for reference

Teal `#37b4a7` primary (`#c2e0de` light step, `#2a8e84` dark step), orange `#ff8d4e` accent (`#ffe0ca`
light step), ink `#1a1f2e` / `#3a4152` / `#6b7180`, paper `#f8f9fa`.
