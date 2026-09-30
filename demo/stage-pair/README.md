# stage-pair — the same stream on two clients, and what the device can draw

Two players side by side that know nothing about each other, over the same programme: an
off-the-shelf hls.js, which **replaces the content with the ad**, and the same version of
hls.js driven by this library, which **keeps the content on screen and draws the ad over
it**. Each one loads the manifest of its own class -- `con-daterange-interstitial.m3u8`
carries only the `com.apple.hls.interstitial` tags, `con-daterange-concurrente.m3u8` only the
`com.qualabs.hls.concurrentInterstitial` ones -- and **the two tags of a break name the same
asset-list**: its standard part (`URI`, `DURATION`) is what the off-the-shelf player plays,
and the block on top is what the library reads, falling back to that standard part when it
cannot draw (ADR 0090). One asset-list, two clients: the same ad space is sold on both, and
only one of them takes the screen away.

A Date Range of a class a player does not know is ignored, not degraded: a manifest with only
the concurrent tag gets NO ad on an off-the-shelf player -- break A of this demo, which has no
linear default, is exactly that case, measured. The fallback to a normal interstitial needs
the Apple-class tag.

On top of that, the thing this demo adds to the four that came before it: **the capability of
the device degrades the format of the ad, not the ad**. A control on the page declares what
the device can draw, in two axes — video decoders, and images over video — and both travel on
the asset-list request. What comes back is **the same for every device**: the ad with every
option it was sold in: video first, and then the same campaign as a still `image/svg+xml` in
**another layout**, so that two browsers side by side show two experiences that cannot be
mistaken for each other (ADR 0088). The library keeps the first option the device can show.
Two decoders and the ad is video; one, and it is the still image, which costs no decoder at
all; neither, and the break plays its linear default, or nothing if it has none.

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

Without the first, the two pages of the pair still run: what is missing is the video option of
each break, not the demo. Without the second, `race.html` has nothing to play, and the
signalling script says exactly that and carries on.

## The three pages

| page | what it is for |
| --- | --- |
| [`index.html`](index.html) | **the pair.** Two players, each with its own control and the manifest of its mode, over the same programme, the walk through the three non-linear shapes — side by side, L-shape and banner, one per break — and the capability switch |
| [`inspect.html`](inspect.html) | **one player, and the whole exchange in the open**, with the same control as each player of the pair. The Date Range the manifest of its mode carried, the asset-list URL the client asked for with the capability on it, the body that came back, verbatim, and **what the library kept of it**: each option, why it was discarded, and how the break ended. Made to be read out loud in a room with the network tab open |
| [`race.html`](race.html) | **the ads first, then the multi view window.** Four non-linear ads over a race, eight seconds of clean race, and then a window that offers a catalogue of six on-board cameras for whoever is watching to compose |

The three are served from the same root, so they are one demo and not three: same library
build, same brand kit, same stylesheet.

**`race.html` is where the separation is visible in time and not only in the file tree**: one
playlist carries the two sibling classes — the advertising one and the Qualabs multi view
extension — and their ranges never overlap. The window's catalogue offers six cameras and the
grid holds four boxes, the programme being one of them, so the most that is ever on screen is
**three cameras plus the primary content**. The catalogue is deliberately longer than the
grid: an offer where everything fits at once is not a choice.

## The switch, the filter, and the fact that there is no server

The switch has two axes, **video decoders `1` | `2`** and **images over video `yes` | `no`**,
and each is sent on the asset-list request on its own, as the specification asks (R29.1):
`sgai-video-decoders` and `sgai-image-over-video`. They are the parameters an ad presentation
server would read. **There is no such server here** — these demos are published as static
files — and nothing needs one: the answer of each break is one static file that always
carries every option of the ad, whatever the device declared.

**The choice is the library's, and it is an explicit step.** Before drawing, it walks the
options in order and keeps the first one the declared capability satisfies (R5.6). An option
needs one decoder for the programme plus one per video element, and needs images if it has an
image element. So even when the server answers a video to a device that said it has one
decoder, the device does not try to play it. `inspect.html` shows that step on screen, and the
console logs every discarded option with its reason.

| declared | break with a linear default (B, C) | break without one (A) |
| --- | --- | --- |
| 2 decoders, images or not | the ad in video | the ad in video |
| 1 decoder, images | the same campaign as a still image, in another layout | the same campaign as a still image, in another layout |
| 1 decoder, no images | the linear default, full frame | nothing: the programme goes on |

**The image is still and in another shape** (ADR 0088): break A goes from side by side to the
L-shape, B from the L-shape to side by side, C from the banner to the L-shape, each in the
same campaign. A moving picture inside an `<img>` looks like a video, and the same box in the
same place looks like the same experience; either way the difference had to be found by
inspecting the element. The still image is the authored SVG frozen at one instant by
`scripts/congelar-svg.py`, with no animation left in it.

**Break A has no default on purpose** (ADR 0087, 0091): its asset carries no `URI`, so the
asset-list has no standard part. The interstitials manifest still names it with an Apple-class
tag: the off-the-shelf pane requests the list, finds nothing to play, skips it and the programme
goes on. It is content that is not interrupted.

Moving the switch **rebuilds both players** at the same target second, because the library
reads `capabilities` once, when the signalling is created, and hls.js instantiates its
interstitials machinery in the constructor. The run keeps its position instead of going back
to zero.

### The API, as it goes on a slide

```js
const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });

QualabsConcurrentHls.attach(hls, {
  container: document.querySelector('.player'),
  capabilities: {
    videoDecoders: 1,       // sgai-video-decoders: streams decoded and composed at once, programme included
    imageOverVideo: true    // sgai-image-over-video: can draw an image over the video
  }
});

hls.loadSource('https://example.com/programme.m3u8');
hls.attachMedia(document.querySelector('.player video'));
```

The names are the axes of the specification in camelCase, and they travel with the
specification's own names. `htmlOverVideo`, the third axis of R29.1, is not there because this
library does not draw HTML: declaring it would be a claim about the player that is not true.
Each axis is optional, and one that is left out is neither sent nor filtered on.

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
each one carrying its own control: `test/verificar-capacidades.py` for the four positions of
the switch — the request, the answer that does not change, and the composition that does —,
`test/medir-tramo-invertido.py` and `test/medir-tramo-en-el-par.py` for the two panes entering
and leaving each break on the same second, `test/verificar-inspect.py` for what `inspect.html`
reads, and `test/verificar-carrera.py` for the race. Each prints what it compared against what, and each has a control that it can be seen
to fail.
