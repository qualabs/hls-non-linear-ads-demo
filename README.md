# hls-non-linear-ads-demo

Non-linear ad experiences in HLS, played by an **unmodified hls.js**: an ad
that runs *concurrently* with the content instead of replacing it, signalled
with `EXT-X-DATERANGE` of the class `com.qualabs.hls.concurrentInterstitial`
and laid out from the asset-list that the SVTA Layout Controller emits.

## Run it

```bash
./run.sh          # or: npm start
```

Then open <http://localhost:8080/>.

The first run downloads ~535 MB of footage and packages it (about half a
minute of ffmpeg). Every run after that starts the server straight away. To
re-package without re-downloading, `npm run content`.

Requirements: node and ffmpeg. There are no npm dependencies.

## What is where

| | |
| --- | --- |
| `index.html`, `css/`, `js/` | the page. No bundler and no framework: native ES modules |
| `js/signalling.js` | the signalling layer: Date Ranges in, the contract out |
| `js/contract-trace.js` | the consumer side of the contract. Knows nothing about HLS |
| `signalling/` | the asset-lists, as the SVTA Layout Controller emits them, with the URIs filled in |
| `vendor/hls.min.js` | hls.js **1.7.2, unmodified** |
| `server.mjs` | a static file server, and nothing else: no ad server, no APS |
| `scripts/` | the content: download and package as HLS VOD |
| `content/` | the packaged output. Generated, gitignored |
| `brand/` | Qualabs fonts, logo and favicon, on disk |
| `CREDITS.md` | the CC BY attribution the footage requires |

## The two layers

The demo is split in two, with a contract between them (ADR 0003): the
signalling layer answers *what is active at this playback time, and with what
boxes*, and the consumer draws it. Only the first side knows what HLS is. The
contract is written down in
`.project/phases/01-poc-web-hlsjs/tasks/T-06/t06-contrato.md`.

## Three things that look like details and are not

**hls.js runs with its interstitials machinery turned off.** The page creates
the instance with `interstitialsController: undefined`. That machinery is
closed over Apple's interstitial class, so a Date Range of our own class would
never reach it, and it is a machinery of *replacement*: it passes one
MediaSource between the primary and the asset, which is the opposite of
drawing two sources at once. The tags are not lost -- hls.js parses every
`EXT-X-DATERANGE` regardless of class and hands them over on `LEVEL_UPDATED`,
which is where this demo picks them up.

**The primary playlist carries `EXT-X-PROGRAM-DATE-TIME`.** A `START-DATE`
resolves against that clock, so without it the Date Ranges have nothing to
anchor to.

**The Layout Controller omits two defaults, and the JSON in `signalling/` is
not missing them.** Of the six payloads the tool emits, the two overlays carry
no `primaryContent` block at all, and none of the six carries `volume` on any
element. The signalling layer assumes both -- the primary at zDepth 0, volume
100, viewport `0 0 0 0`, and volume 100 wherever it is absent -- instead of
requiring them, so a payload pasted straight out of the tool works as it is
(ADR 0004). Adding those fields to the JSON to "fix" it would hide the case
that a real payload hits.
