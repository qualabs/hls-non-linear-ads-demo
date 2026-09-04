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

## Test it

```bash
npm test          # node --test, no dependencies and no browser
```

The tests cover the layout resolution and nothing else: the parsing of
`viewport`, the two defaults the tool omits, the order by `zDepth`, the
activation window, and the conversion of insets into a box in pixels. That is
the only part of the demo that can fail in silence -- everything else is on the
screen. The cases are the six payloads the SVTA Layout Controller emits, read
verbatim from the evidence of T-03, and the expected boxes are the pixels
measured there.

## What is where

| | |
| --- | --- |
| `index.html`, `css/`, `js/` | the page. No bundler and no framework: native ES modules |
| `js/signalling.js` | the signalling layer: Date Ranges in, the contract out |
| `js/renderer.js` | the rendering layer: the contract in, the boxes drawn over the video. Knows nothing about HLS |
| `js/contract-trace.js` | the same contract, printed: the line under the player and the table in the console |
| `js/stock-player.js` | the off-the-shelf client of the compatibility pair: hls.js at its factory configuration, and none of the above |
| `signalling/` | the asset-lists, as the SVTA Layout Controller emits them, with the URIs filled in |
| `test/` | the tests of the layout resolution, over the six payloads of the tool |
| `vendor/hls.min.js` | hls.js **1.7.2, unmodified** |
| `server.mjs` | a static file server, and nothing else: no ad server, no APS |
| `scripts/` | the content: download and package as HLS VOD |
| `content/` | the packaged output. Generated, gitignored |
| `brand/` | Qualabs fonts, logo and favicon, on disk |
| `CREDITS.md` | the CC BY attribution the footage requires |

## The compatibility pair

The page is two players, not one, and that is the demo's strongest argument
(ADR 0007): this deploys without breaking the clients that are already in the
market. Both load the **same URL**. The media playlist carries two
`EXT-X-DATERANGE` on the same `START-DATE`, one of Apple's interstitial class
with a linear ad and one of the sibling class of ADR 0009 with the concurrent
experience, each with its own `ID` and its own asset-list.

The left player is hls.js at its **factory configuration**, with nothing of this
demo wired into it: it schedules the Apple-class tag and replaces the content
with the linear ad, exactly as a deployed player does today. The right one is
the same library, same version, unmodified, and keeps the content on screen with
the concurrent experience drawn over it.

Backwards compatibility does **not** come from one class extending the other. In
HLS the class of a Date Range is compared by exact string equality and there is
no inheritance, so an existing client cannot do anything sensible with a class
it has never heard of -- it ignores it, which is what the left player does with
ours. The compatibility comes from the playlist serving both things at once and
each client keeping the one it understands.

## The two layers

The demo is split in two, with a contract between them (ADR 0003): the
signalling layer answers *what is active at this playback time, and with what
boxes*, and the consumer draws it. Only the first side knows what HLS is. The
contract is written down in
`.project/phases/01-poc-web-hlsjs/tasks/T-06/t06-contrato.md`.

The ad starts **silent** and the primary content keeps its audio, so the page
has a visible control to turn the ad's sound on (ADR 0010). Turning it on in
front of an audience is how the demo shows that both sources of audio are
there and that choosing between them is the player's.

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
