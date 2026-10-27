# dash/

The library's MPEG-DASH side: the same non-linear mechanisms that `hls/` implements
over HLS, carried over DASH with the scheme of SVTA2053, on dash.js 5.2.1 unmodified
(`vendor/dash.all.min.js`). Built into `dist/qualabs-concurrent-dash.js`, which
defines `QualabsConcurrentDash`.

| | |
| --- | --- |
| `signalling.js` | the MPD's EventStream and each break's `$remote.slots` in, the contract of ADR 0003 out |
| `media.js` | an MPD becomes pixels, one dash.js `MediaPlayer` per asset |
| `concurrent-dash.js` | `attach(player, { container, video, … })`, the options of the HLS `attach` |

The carriage it reads is written as SVTA2053 would carry it, in
[`docs/svta2053-dash-concurrent-presentation.md`](../docs/svta2053-dash-concurrent-presentation.md),
and its decisions are ADR 0120 to 0128. Two things an integrator has to know:

- **`attach` goes before `player.initialize`.** The breaks are read off the MPD's
  text as dash.js receives it, in a response interceptor, and not off dash.js's
  events, which lose an Event body written in CDATA (ADR 0128).
- **The traditional linear break is played by this library**, an Alternative MPD
  replace event drawn at full frame over the programme, because dash.js upstream
  does not execute Alternative MPD (ADR 0125).

Live (a `dynamic` MPD), `InsertPresentation`, List MPD and multi view are not
read.

## The rule

A file of the library goes in `lib/` if a player of any streaming format would use
it as it is, and in the folder of its format otherwise (ADR 0116):

- **What DASH needs and is already in `lib/` is imported from there**, never
  copied.
- **What is DASH's goes here**: how the break is signalled and when its ads are
  asked for, the wiring with dash.js, how an MPD is attached.
- **What turns out to be common in `hls/` or here moves up to `lib/`**, in its own
  change, with two witnesses: `npm run check`, whose seam of ADR 0003 greps the
  whole of `lib/` for the vocabulary of HLS, and `scripts/comparar-publicacion.mjs`,
  which says whether what the demos publish changed in anything but order,
  comments and import paths (ADR 0118).

`dash/*.js` is in the seam of ADR 0015, the build and `scripts/demos-cambiadas.sh`;
`scripts/publicar.sh` sends the DASH build and dash.js only to the demos in its
`DASH` list.
