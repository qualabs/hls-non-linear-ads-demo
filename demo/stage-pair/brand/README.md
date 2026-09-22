# brand/ — the Qualabs brand kit, vendored

Copies. Not links, not a CDN, not a path into another project on somebody's laptop: a file that
resolves off a sibling repo works exactly until the demo is recorded or shown from anywhere else.

| file | what it is | where it comes from |
| --- | --- | --- |
| `logo-qualabs-on-dark.svg` | the full logo with its seven wordmark paths in white and the mark keeping its four inks | copied from `demo/hydration-break/brand/`, byte for byte |
| `favicon.svg` | the mark alone, for the browser tab | copied from `demo/hydration-break/brand/`, byte for byte |
| `fonts-embedded.css` | Poppins 400/500/600/700 + italic 600, and JetBrains Mono 400/500/600, as base64 woff2 in eight `@font-face` rules | copied from `demo/hydration-break/brand/`, byte for byte |

Copied on 2026-09-22. **Do not edit them here.** If the brand changes, copy the new version
over; a divergent local edit is a fork of somebody else's brand that nobody will find.

**The logo on a dark page is the on-dark file and not a white plate under the full-colour one.**
Nicolás rejected the plate twice, and the reason is that a plate is a surface: on a page whose
subject is two pictures, the brand is an accent. `logo-qualabs.svg` is not copied here because
this demo has no light surface to put it on.

**Nothing in this folder is a creative of the demo.** The three files are furniture of the page.
The nine advertising creatives are the SVG of `graphics/campaigns/`, written for this demo, and
their provenance is in `CREDITS.md` with everything else that is on screen.
