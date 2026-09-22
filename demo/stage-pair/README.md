# stage-pair — the same stream on two clients, and what the device can decode

One media playlist. Two `EXT-X-DATERANGE` per break on the same `START-DATE`. Two players
side by side that know nothing about each other: an off-the-shelf hls.js, which schedules the
linear Date Range and **replaces the content with the ad**, and the same version of hls.js
driven by this library, which **keeps the content on screen and draws the ad over it**. The
same ad space is sold on both, and only one of them takes the screen away.

On top of that, the thing this demo adds to the four that came before it: **the capability of
the device degrades the format of the ad, not the ad**. A control on the page declares how
many video decoders it has, that number travels on the asset-list request as
`qa-decoder-count`, and what comes back is the same campaign, the same layout, the same box
and the same duration — **in a different medium**. Two decoders and the ad is video; one, and
it is the same drawing as `image/svg+xml`, which costs no decoder at all.

**Everything on screen that is not the programme was written by hand as vector.** The nine
advertising creatives and the race are SVG; nothing here came out of an image or a video
model, and the provenance of every file is in [`CREDITS.md`](CREDITS.md), which is checked by
a script rather than read.

## Run it

```bash
./run.sh stage-pair          # PORT=8081 ./run.sh stage-pair when 8080 is taken
```

That packages the programme if it is not there, writes the signalled playlists, builds the
library, and serves this folder. Packaging the programme downloads **0.4 GB** of SPARKS the
first time and takes a few minutes; from then on the source stays cached in
`content/.fuentes/` and is not downloaded again.

**Two things `run.sh` does not rebuild, because they are slow and they change only when their
source does**: the video variant of the nine creatives, and the race. A clean clone has
neither — `content/` is not in git — and the demo says so rather than breaking:

```bash
./demo/stage-pair/scripts/puente-a-video.sh    # the nine creatives, SVG -> HLS
./demo/stage-pair/scripts/puente-carrera.sh    # the race: the programme and its six cameras
```

Both drive the system's real Chrome through Playwright and both need `ffmpeg`. Each one
verifies what it produced and goes red if a capture lost frames or came out frozen; what that
assertion measures, and its two controls, are in the header of `scripts/verificar-creativo.sh`.

Without the first, the two pages of the pair still run: what is missing is the rich step of
each break, not the demo. Without the second, `race.html` has nothing to play, and the
signalling script says exactly that and carries on.

## The three pages

| page | what it is for |
| --- | --- |
| [`index.html`](index.html) | **the pair.** The two players over the same playlist, the walk through the three non-linear shapes — side by side, L-shape and banner, one per break — and the decoder switch |
| [`inspect.html`](inspect.html) | **one player, and the whole exchange in the open.** The two Date Ranges the playlist carried, the asset-list URL the client asked for with the parameter on it, and the body that came back, verbatim. Made to be read out loud in a room with the network tab open |
| [`race.html`](race.html) | **the ads first, then the multi view window.** Four non-linear ads over a race, eight seconds of clean race, and then a window that offers a catalogue of six on-board cameras for whoever is watching to compose |

The three are served from the same root, so they are one demo and not three: same library
build, same brand kit, same stylesheet.

**`race.html` is where the separation is visible in time and not only in the file tree**: one
playlist carries the two sibling classes — the advertising one and the Qualabs multi view
extension — and their ranges never overlap. The window's catalogue offers six cameras and the
grid holds four boxes, the programme being one of them, so the most that is ever on screen is
**three cameras plus the primary content**. The catalogue is deliberately longer than the
grid: an offer where everything fits at once is not a choice.

## The switch, and the fact that there is no server

`qa-decoder-count` is the parameter an ad presentation server would read. **There is no such
server here**, and the page says so on screen: these demos are published as static files, so
the answer is baked by value — one static playlist per step, each pointing at its own set of
asset-lists, and the switch picks which one is loaded.

**What is real is the request.** The parameter is on it, or absent from it, exactly as the
library builds it, and that is what `inspect.html` puts on the screen and what the network tab
shows. Between the rich answer and the lean one a single thing changes per break: the `type`
and the `uri` of the ad asset.

Moving the switch **rebuilds both players** at the same target second, because hls.js
instantiates its interstitials machinery in the constructor and the library reads
`decoderCount` once, when the signalling is created. The run keeps its position instead of
going back to zero.

## What is on screen and whose it is

- **The programme is SPARKS**, a Netflix Open Content test title under CC BY 4.0, cut,
  re-encoded and repackaged here. The attribution the licence asks for, with its five pieces
  and the statement that it was modified, is in [`CREDITS.md`](CREDITS.md).
- **Everything else is ours and invented.** ZUMBRA, KOVRIN and KETRAVA are brands that do not
  exist, each authored as SVG in three shapes; the race is one animated SVG scene framed six
  different ways, with car names of fantasy and no livery, number, sponsor or driver of any
  real series.
- **Nothing was generated by an image or a video model.** That claim is held by a list and not
  by looking: `./test/verificar-creditos.py` crosses the whole asset tree against
  `CREDITS.md` and names any file that has no declared origin.

## The files that decide things

```
stage.json          every number of this demo: the breaks and their offsets, the nine
                    pieces and their shapes, the race, the window, the cadences
signalling/         the asset-lists, written on every start
graphics/campaigns/ the nine authored SVGs. This is what is in git; their video is output
content/            the packaged output: the programme, the creatives, the race
scripts/            content, signalling, and the bridge from SVG to HLS
```

**`stage.json` is the one you edit**, and not a page and not a script: no second of the run is
typed anywhere else. The signalling, the capture and the three pages all read it.

## Test it

```bash
npm test                              # this demo's suite runs with the library's
./test/verificar-creditos.py          # every asset has a declared origin
```

The suite of this demo runs the signalling scripts for real over a minimal playlist and counts
what came out, without ffmpeg and without a byte of video, which is what makes it a test of the
playlist rather than of a `printf`. The measurements that need a browser are separate scripts,
each one carrying its own control: `test/medir-escalera.py` for the step down of the decoder
switch, `test/medir-tramo-invertido.py` for the two panes entering and leaving each break on
the same second, `test/verificar-inspect.py` and `test/verificar-carrera.py` for the other two
pages. Each prints what it compared against what, and each has a control that it can be seen
to fail.
