# dash/

Where the library's MPEG-DASH side goes: the same non-linear mechanisms of
SVTA2053 v3 that `hls/` implements over HLS, carried over DASH. It holds no code
yet; the next phase prototypes it.

## The rule

A file of the library goes in `lib/` if a player of any streaming format would use
it as it is, and in the folder of its format otherwise (ADR 0116). For DASH that
means:

- **What DASH needs and is already in `lib/` is imported from there**, never
  copied: the renderer, the controls, the multi view, the model of a break
  (`lib/experience.js`) and the capabilities and options (`lib/capabilities.js`).
- **What is DASH's goes here**: how the break is signalled and when its ads are
  asked for, the wiring with the DASH player, how a creative is attached.
- **What turns out to be common in `hls/` moves up to `lib/`**, in its own change,
  with two witnesses: `npm run check`, whose seam of ADR 0003 greps the whole of
  `lib/` for the vocabulary of HLS, and `scripts/comparar-publicacion.mjs`, which
  says whether what the demos publish changed in anything but order, comments
  and import paths (ADR 0118).

When the first `.js` lands here, `dash/*.js` joins the seam of ADR 0015 in
`scripts/verificar-cortes.mjs`, and the build and `scripts/demos-cambiadas.sh`
learn the folder in the same change. How a demo shows the same stream over HLS
and over DASH is decided by that phase, not here (ADR 0119).
