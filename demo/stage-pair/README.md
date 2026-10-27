# stage-pair — the same stream on two clients, and what the device can draw

Two players side by side that know nothing about each other, over the same programme: an
off-the-shelf hls.js, which **replaces the content with the ad**, and the same version of
hls.js driven by this library, which **keeps the content on screen and draws the ad over
it**. **Both load the same file**, `content/primary/con-daterange.m3u8`, and each one asks
for it with the class it takes (ADR 0113): the playlist declares
`#EXT-X-DEFINE:QUERYPARAM="adclass"` and every break is ONE tag with `CLASS="{$adclass}"`, so
the off-the-shelf pane loads `con-daterange.m3u8?adclass=com.apple.hls.interstitial` and ours
`con-daterange.m3u8?adclass=com.qualabs.hls.concurrentInterstitial`, and hls.js substitutes the
class while parsing (HLS variable substitution, draft-pantos-hls-rfc8216bis-22, 4.3). The file
is byte for byte the same, which is why a static bucket serves it as it is. Each break names
**one asset-list**: its standard part (`URI`, `DURATION`) is what the off-the-shelf player
plays, and the block on top is what the library reads, falling back to that standard part when
it cannot draw (ADR 0090). One asset-list, two clients: the same ad space is sold on both, and
only one of them takes the screen away.

A Date Range of a class a player does not know is ignored, not degraded: a playlist read with
only the concurrent class gets NO ad on an off-the-shelf player. The fallback to a normal
interstitial needs the Apple class, which is what the query parameter of the off-the-shelf pane
asks for. A playlist loaded with no `adclass` at all does not parse: the spec says the client
MUST fail, and hls.js reports a `LEVEL_PARSING_ERROR`.

On top of that, the thing this demo adds to the four that came before it: **the capability of
the device degrades the format of the ad, not the ad**. A control on the page sets what the
device can draw, the two capabilities of the specification — `concurrentVideo`, the video
decoders, and `concurrentImage`, images over video — and both travel on the asset-list
request. What comes back is **the same for every device**: the ad with every
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

**The DASH pane needs a third**, after those two, and it is a remux and not an encode, so it
takes seconds: the programme and every creative in fragmented MP4 with its MPD, in a `dash/`
folder next to each playlist, on the same timeline as HLS (the header of the script says how
that was measured). The next start of `run.sh` signals the MPD.

```bash
./demo/stage-pair/scripts/empaquetar-dash.sh
```

## The three pages

| page | what it is for |
| --- | --- |
| [`index.html`](index.html) | **the pair.** Two players, each with its own control — the native HLS client, our library over HLS, or our library over DASH (`?der=dash-2dec-img`), which loads the same programme as an MPD signalled with the scheme of SVTA2053 —, loading the same playlist with the class of its mode, over the same programme, the walk through the three non-linear shapes — side by side, L-shape and banner — over a preroll, three breaks and a post-roll, and the capability switch |
| [`inspect.html`](inspect.html) | **one player, and the whole exchange in the open**, with the same control as each player of the pair. The Date Range the playlist carries, as written (`CLASS="{$adclass}"`) and as this client's hls.js read it, the asset-list URL the client asked for with the capability on it, the body that came back as the player received it, with no second request (ADR 0120), and **what the library kept of it**: each option, why it was discarded, and how the break ended. Made to be read out loud in a room with the network tab open |
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

The switch has two axes, **video decoders `1` | `2`** (`concurrentVideo`) and **images over
video `yes` | `no`** (`concurrentImage`), the capabilities SVTA2053 5.3.3 says the application
sets on the library. Each is sent on the asset-list request on its own, with the names of the
specification: `sgai-video-decoders` and `sgai-image-over-video`. They are the parameters an
ad presentation server would read. Sending them is optional in the specification, because
they add to what can fingerprint a device; this demo sends them (`sendCapabilities: true`)
because the request is what it shows. **There is no such server here** — these demos are published as static
files — and nothing needs one: the answer of each break is one static file that always
carries every option of the ad, whatever the device declared.

**The choice is the library's, and it is an explicit step.** Before drawing, it walks the
`layoutOptions` of the ad in order and keeps the first one the configured capabilities fit
(SVTA2053 5.3.3). An option
needs one decoder for the programme plus one per video element, and needs images if it has an
image element. So even when the server answers a video to a device that said it has one
decoder, the device does not try to play it. Every option the device can show is handed to
the renderer in that order, with the linear default behind them, and the one mounted also has
to load: when the first load of one of its assets fails (a 404, a network error, no answer),
the renderer takes it down and mounts the next, then the default, then nothing (ADR 0107).
Checking the assets up front, before the renderer is handed the list, is optional and off by
default (`preValidateAssets`); both pages use the default, and `inspect.html` has a "Pre-validate
assets" switch, off when the page opens, to compare. `inspect.html` shows what was handed over
and what was actually on screen, a failed load included, and the console logs every discarded
option and every failover with its reason.

**The asset-lists are requested one break at a time** (ADR 0108), when the programme is
buffered up to the break, or played or sought into it, which is when hls.js asks for an
interstitial's list. So the request panel of `index.html` and card 2 of `inspect.html` fill in as
the programme approaches each break, like the native pane does, and the bar marks every break
from the start anyway. `race.html` follows the same rule (ADR 0109): its run lists every break
from the start, off the tags, and each row fills in with what it carries when its list arrives.

**The first break is a preroll** (ADR 0110): its tag carries `CUE="PRE"`, and both clients
ask for its list **at load, before play**, which is when hls.js asks for a preroll's list
(`checkStart`). The off-the-shelf pane plays the linear default, KETRAVA 16:9 full frame, before
the programme and resumes the programme at 12 s, because its tag is in the replacement form; ours
draws the KETRAVA banner over the first 12 s of the programme. At 12 s both panes are on the same
second of the programme. `inspect.html` opens on it: card 1 shows the range with `CUE="PRE"` and
card 2 the request that already went out. The banner video and the still are pieces the demo
already had: the race's banner and the frozen 16:9.

**Break B carries `CUE="ONCE"`** (ADR 0112): once it has played (entered, then left at its end
or by a seek out of it), both clients take it out — hls.js from its schedule, the library from
its experiences and the ranges of its bar — so a seek back into it shows the programme, and its
tracking does not fire again. In `inspect.html` with our library, the second "break B" jump lands
on the programme alone.

**The last break is a post-roll** (ADR 0111): its tag carries `CUE="POST"`, so both clients
put it after the end of the programme, whatever its START-DATE (186 s, written because the spec
requires one), and ask for its list when the programme is buffered to its end (hls.js:
`BUFFERED_TO_END`). A non-linear ad is never presented after the end, so ours ignores the ZUMBRA
banner the list offers and plays its linear default, ZUMBRA 16:9 full frame, when the programme
ends: the same thing the off-the-shelf pane plays from the Apple reading of the same tag. The "break POST" jump lands
5 s before the end. No new media: the banner and the frozen backplate are race pieces, and the
linear is break A's ad.

**At 150 s there is a traditional linear break, and both panes play it** (ADR 0115). Its tag
is the one whose class is written and not chosen, `CLASS="com.apple.hls.interstitial"`, so
it reads the same with either `adclass`: the off-the-shelf pane plays it as it plays every
break, and ours plays it too, because hls.js runs inside our player with its interstitials
machinery on and plays Apple's class while the library draws its own (ADR 0114). It replaces
the programme for 12 s with KETRAVA 16:9 full frame, the linear of PRE and B, so there is no
new media, and it overlaps no other break. While it plays, ours draws nothing, its bar follows
the programme's clock and marks the break in yellow, and its line says the ad is played by
hls.js. The "break LINEAR (traditional)" jump lands 5 s before it; `inspect.html` has a card for
it that says it is not a break of ours.

**Break C's first option fails on purpose**, to show the failover working without breaking
anything else. Its first layoutOption, the KOVRIN banner in HLS, points at
`/content/creatives/kovrin-banner/missing-on-purpose/index.m3u8`, which does not exist: the
request answers 404 and the renderer mounts the next option that fits by itself (ADR 0107). On a
desktop browser configured with two decoders that is the MP4 twin of the same banner (ADR 0096),
so what is on screen looks like the banner; `inspect.html` says the first option failed and why,
and the console logs it. With one decoder and images it is the still L, as in the table below.
The bad URI is written by `scripts/escribir-asset-lists.mjs` from `primeraOpcionRota` in
`stage.json`, whose `_primeraOpcionRota` says why; taking that field out restores the break.
The off-the-shelf pane does not read layoutOptions, so it is unaffected.

**On a machine where the video creatives are not packaged** (`content/creatives/` missing), every
video option answers 404, and that is the failover on display: each break shows its still image
instead, and with one decoder and no images break B's linear default 404s too and the ad is
skipped.

| configured | break with a linear default (PRE, B, C) | break without one (A) |
| --- | --- | --- |
| 2 decoders, images or not | the ad in video | the ad in video |
| 1 decoder, images | the same campaign as a still image, in another layout | the same campaign as a still image, in another layout |
| 1 decoder, no images | the linear default, full frame | nothing: the programme goes on |

**The image is still and in another shape** (ADR 0088): the preroll goes from the banner to side
by side, break A from side by side to the L-shape, B from the L-shape to side by side, C from the
banner to the L-shape, each in the
same campaign. A moving picture inside an `<img>` looks like a video, and the same box in the
same place looks like the same experience; either way the difference had to be found by
inspecting the element. The still image is the authored SVG frozen at one instant by
`scripts/congelar-svg.py`, with no animation left in it.

**Every option has a twin for the Roku** (phase 17, ADR 0096, 0097). Right after the video
option goes the same option with a progressive VP9 MP4 of the same creative
(`content/creatives/<piece>/<hash>/progressive.mp4`, with its `codecs`), and right after the
image option the same option with a PNG of the frozen SVG (`graphics/campaigns/<piece>-fijo.png`).
They are for a device that draws neither a second HLS nor an SVG. The library does not pick one
while its original loads: a twin asks for exactly what the option before it asks for, and the
first that fits wins, so the table above does not change. A twin is drawn only as the next option
that fits when its original fails to load (ADR 0107). What does change is what the page counts:
the inspector lists four options for A, B and C, and their image option is option 3. The preroll
and the postroll offer only the PNG twin, three options: their banners have no MP4 yet. `scripts/progresivo-creativos.sh` makes the
MP4s out of the published HLS, and `scripts/rasterizar-fijo.py` the PNGs (`--verificar` checks
them against their SVG).

**Break A has no default on purpose** (ADR 0087, 0091): its asset carries no `URI`, so the
asset-list has no standard part. Read with the Apple class its tag is still an interstitial:
the off-the-shelf pane requests the list, finds nothing to play, skips it and the programme
goes on. It is content that is not interrupted.

Moving the switch **rebuilds both players** at the same target second, because the library
reads `capabilities` once, when the signalling is created, and hls.js instantiates its
interstitials machinery in the constructor. The run keeps its position instead of going back
to zero.

### The API, as it goes on a slide

```js
const hls = new Hls();

QualabsConcurrentHls.attach(hls, {
  container: document.querySelector('.player'),
  capabilities: {
    concurrentVideo: 1,     // sgai-video-decoders: video decoded and composed at once, programme included
    concurrentImage: true   // sgai-image-over-video: can composite an image over the video
  },
  sendCapabilities: true,   // also send them on the asset-list request, where privacy policy allows it
  onPresented: (report) => console.log(report)  // which option was actually on screen, after any failover
});

hls.loadSource('https://example.com/programme.m3u8');
hls.attachMedia(document.querySelector('.player video'));
```

The names are the two properties SVTA2053 5.3.3 requires the configuration of the library to
hold, and they travel with the specification's own parameter names (ADR 0104). There is no
HTML capability because this library does not draw HTML: declaring it would be a claim about
the player that is not true. Each capability is optional, and one that is left out is neither
sent nor filtered on.

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
