# qualabs-concurrent-hls

**Non-linear ad experiences in HLS, played by an unmodified hls.js**: an ad that
runs *concurrently* with the content instead of replacing it, signalled with
`EXT-X-DATERANGE` of the class `com.qualabs.hls.concurrentInterstitial` and laid
out from the asset-list that the SVTA Layout Controller emits.

A sibling class, `com.qualabs.hls.multiViewInterstitial`, signals the other
relationship: instead of declaring a layout it announces a **catalogue** of feeds,
and the composition is built by whoever is watching. The two are siblings and
neither extends the other — in HLS a Date Range class is compared as an exact
string — and one playlist carries both.

The root of this repository is that library. `demo/` is where it is shown: one
folder per demo, and each demo tells its own run.

## demo/

| demo | what it argues |
| --- | --- |
| [`compatibility-pair`](demo/compatibility-pair/README.md) | the same playlist file on two clients at once, which differ only in the class they ask for it with (`?adclass=…`, ADR 0113): an off-the-shelf hls.js, which reads each break as an Apple interstitial and replaces the content with the ad, next to the same version of hls.js driven by this library, which reads it as ours, keeps the content on screen and draws the ad over it. What it argues is that this deploys without breaking the clients already in the market |
| [`hydration-break`](demo/hydration-break/README.md) | why anybody would want this. A minute of stopped play in a football match, with four ads over the live picture instead of a commercial break — and the traditional linear ad third, so the comparison happens inside one minute and one player. What it argues is the business case: the viewer stays watching, so the advertising is seen. The page walks you through it by itself and stops the composition to explain each step, which the library allows without a line of it changing |
| [`multiview-offer`](demo/multiview-offer/README.md) | the break where the publisher offers and the viewer composes. One playlist carrying both classes: a concurrent ad of the class this repository started with, and two windows in which a catalogue of feeds is on offer and the grid takes its shape from how many of them somebody raised. What it argues is that the same signalling covers a relationship where the payload cannot declare a layout, because where a box goes is not known when the playlist is written |
| [`race-multiview`](demo/race-multiview/README.md) | the offer put to work on the case that asks for it. A race programme that never stops, and part way through it a window that announces a catalogue of on-board cameras, each one named after its driver: whoever is watching raises the car they care about, enlarges it and hears that engine instead of the commentary. What it argues is that the mechanism of `multiview-offer` is not a demo of itself — it is what a racing channel needs, because the programme is a single picture and the story is several of them at once |
| [`stage-pair`](demo/stage-pair/README.md) | the pair again, and on top of it the capability of the device. The same three non-linear shapes one per break, an `inspect.html` where the Date Ranges, the asset-list request and its answer are read out of the running player for anybody with a network tab open, and a race page where the four ads end before the multi view window opens. What it argues is that the capability of the device degrades the **format** of the ad and not the ad: the page sets the two capabilities of the device, `concurrentVideo` and `concurrentImage`, the answer carries every `layoutOption` of the ad, and the library keeps the first one the device can show and whose assets load — video with two decoders, the same campaign as a still `image/svg+xml` in another layout with one, and the break's linear default or nothing when neither fits. Everything on screen that is not the programme is vector written by hand, with the provenance of every file in its `CREDITS.md` |

```bash
./run.sh <demo>   # with no argument, and through npm start, it is compatibility-pair
```

One command for any of them: it packages the demo's content if it is not there
yet, writes its signalled playlist, builds the library, and serves the demo's
folder as the document root (ADR 0022). What a demo needs before that, what it
puts on screen and what to expect while it runs is in its own README.

### Published demos

All five are public, and every push to `main` republishes the ones it changed:

- [compatibility-pair](https://qualabs-hls-demo-compatibility-pair.storage.googleapis.com/index.html)
- [hydration-break](https://qualabs-hls-demo-hydration-break.storage.googleapis.com/index.html)
- [multiview-offer](https://qualabs-hls-demo-multiview-offer.storage.googleapis.com/index.html)
- [race-multiview](https://qualabs-hls-demo-race-multiview.storage.googleapis.com/index.html)
- [stage-pair](https://qualabs-hls-demo-stage-pair.storage.googleapis.com/index.html)

How they are published, and what you need to know to publish one by hand, is in
[`CLAUDE.md`](CLAUDE.md#where-the-demos-are-published).

## Test it

```bash
npm test        # node --test, no dependencies and no browser
npm run check   # the two seams of the project
```

`node --test` takes no arguments and discovers every suite in the repository:
the library's, in `test/`, and each demo's, inside its own folder.

`test/` covers what can fail in silence in the library and nothing else --
everything else is on the screen. That is the pure functions of the two layers,
one file per subject. The layout resolution: the parsing of `viewport`, the two
defaults the tool omits, the order by `zDepth`, the activation window, and the
conversion of insets into a box in pixels. The sequence of a break: where each
of its ads lands on the timeline of the programme, which ad is which, and the
rungs the layer falls back to when an asset cannot be drawn, the ordered list of
options handed to the renderer with the linear default behind them, what optional
pre-validation leaves out of that list (GET or HEAD, and when HEAD falls back to
GET), the renderer's own failover from an option whose asset fails to load to the
next one, to the default and to nothing, and when each break's asset-list is
requested, which is hls.js's own rule for an interstitial. And what the
controls stand on: where the breaks of the programme are, which kind each one
is, where that lands as a fraction of the whole programme, and the volume every
element starts at, which is the one place where a single character turns the
show mute or an ad declared silent into the loudest thing on the screen.

It covers by the same standard the plan that decides which nodes are kept,
created and destroyed when a composition changes; the table that turns a number
of boxes into their geometry, and every rule a selection of feeds has to hold;
the schedule of the transitions; and the audio focus, including what becomes of
it when the composition changes around a box that never stopped playing. All of
it is arithmetic over data, which is what a test can aim at without a browser.

No case is invented unless it says so, and no case is read out of a demo:
`test/` reads `test/` and `lib/`, and nothing else (ADR 0023). The six payloads
the tool emits, the readings taken on the running player and the run they were
taken over are copies this suite owns, in
[`test/fixtures/`](test/fixtures/README.md), which is also where the reason
there is no check against the originals is written down, so that nobody adds one
believing it is missing. What a frozen copy cannot notice is the run a demo
serves changing shape, and what watches that is the demo's own suite.

`npm run check` checks a shape instead of a value, and it is the other half of
what can go wrong here without showing on the screen: the two seams. It runs the
grep of ADR 0003 -- the rendering side does not name the transport -- and the
grep of ADR 0015 -- the library does not name a demo -- and compares what they
find against a list of ACCEPTED occurrences it carries inside, each one with the
reason it is acceptable written beside it. Anything that is not on that list
makes it exit non-zero, saying which and where. The list is keyed by the CONTENT
of the line and not by its number, so an edit above an accepted line is not a
finding and the check is not asked to cry wolf.

## What is where

The line of ADR 0015 runs through the tree: the root is the library and what
serves it, and everything below `demo/` is a page that uses it.

| | |
| --- | --- |
| `lib/` | **the library.** No bundler and no dependencies |
| `lib/signalling.js` | the signalling layer: Date Ranges in, the contract out |
| `lib/renderer.js` | the rendering layer: the contract in, the boxes drawn over the video. Knows nothing about HLS |
| `lib/controls.js` | the composition's own controls: one progress bar over the whole programme, pause, audio, fullscreen, the list of feeds whoever is watching picks from, and the marks on its rail that say where the breaks this player plays are |
| `lib/multiview.js` | the state of whoever is watching: which feeds are up, in what order, and which one is enlarged. It decorates the provider, so the rendering side never learns that somebody is choosing |
| `lib/media.js` | how a `uri` becomes pixels: one instance of hls.js per ad asset |
| `lib/concurrent-hls.js` | the entry point and the public surface: `attach` for the concurrent experience, `attachControls` for the chrome on its own |
| `dist/` | the built library: one classic script that defines a global. Generated, gitignored |
| `demo/` | **the demos**, one folder each, indexed above |
| `test/` | the tests of what fails in silence: the layout resolution, the sequence of a break and its fallback, the ranges of the programme, and the volume of an element |
| `docs/` | the product's own documents: [the contract between the two layers](docs/contrato-senalizacion-renderizado.md), and [how to integrate the library](docs/integrating-the-library.md) into a page that is not a demo |
| `vendor/hls.min.js` | hls.js **1.7.2, unmodified**, with its interstitials machinery on (ADR 0114) |
| `server.mjs` | a static file server, and nothing else: no ad server, no APS. It takes the folder to serve as its argument, and mounts `/dist/` and `/vendor/` from here (ADR 0022) |
| `run.sh` | the one command of a demo, with the demo as its argument |
| `scripts/` | the two scripts of the library: `scripts/construir-libreria.sh`, the build, and `scripts/verificar-cortes.mjs`, the check of the two seams |
| `package.json` | what the product is: the entry point, and the three folders `files` lists (ADR 0024) |

## The two layers

The library is split in two, with a contract between them (ADR 0003): the
signalling layer answers *what is active at this playback time, and with what
boxes* and *where all the ranges of the programme are, and of which kind*, and
the consumer draws it. Only the first side knows what HLS is. The contract is
written down, field by field and rule by rule, in
[`docs/contrato-senalizacion-renderizado.md`](docs/contrato-senalizacion-renderizado.md),
which owns it.

**The state of whoever is watching sits between the two and neither of them
learns about it.** `lib/multiview.js` decorates the provider: same signature,
same meaning, and everything that is not an offer crosses it as the same object
in the same place of the list. An offer comes out carrying the boxes of whatever
was raised, in the same `Element` shape an ad produces, which is why the multi
view was added without the contract changing by a field. Underneath, a viewer's
choices would live in the file that is defined by knowing the transport; above,
the drawing side would have to learn what an offer is. Both were refused.

**The mix is signalled, and the default is silence.** Each element of a layout
starts at the `volume` its asset-list declares, and the audio of the composition
as a whole gets one visible control (ADR 0014). The tool declares no `volume` on
any element, and no `primaryContent` block at all on the two overlays, and the
signalling layer **assumes** both instead of requiring them, so a payload pasted
straight out of the tool works as it is (ADR 0004). What it assumes for each of
the two, and why an absent `volume` is silence on an element of the ad and full
volume on the primary content -- a deliberate divergence with the tool, left
written down as a question for SVTA (ADR 0014) -- is in the contract, under *Los
dos defaults que la herramienta omite*.

## The library, and the page that uses it

The library is `lib/`: the two layers, the piece that turns a `uri` into pixels,
and the entry point that joins them.

It is distributed as **one classic `<script src>` that defines a global**, with
no bundler and no npm dependency. The sources stay as ES modules and
`scripts/construir-libreria.sh` assembles them into
`dist/qualabs-concurrent-hls.js` on every start, the same way a demo's signalled
playlist is written on every start. They stay separate for two reasons that are
not taste: the seam of ADR 0003 is verified per file by
`scripts/verificar-cortes.mjs`, and the tests import the pure functions of both
layers.

What a page writes to use it is a script tag,

```html
<script src="./dist/qualabs-concurrent-hls.js"></script>
```

and six lines:

```js
const hls = new Hls();
const concurrent = QualabsConcurrentHls.attach(hls, {
  container: document.getElementById('player')
});
hls.loadSource(src);
hls.attachMedia(video);
```

**An option whose asset does not load is never left on screen.** Every ad hands the
renderer its layoutOptions in order, with its linear default behind them, and when
the first load of an asset of the option mounted fails (a 404 on its playlist, an
image that does not load, no answer), the renderer takes the whole option down and
mounts the next one, then the default, then nothing. That is always on, and
`onPresented` reports which option ended up on screen. Checking the assets up
front as well, before the renderer is handed the list, is optional and off by
default (`preValidateAssets`, `preValidateMethod`), because with a real ad
decisioning service an extra request per asset has a cost. And each break's
asset-list is requested when hls.js would request it — when the programme is
buffered up to the break, or played or sought into it; a preroll's (`CUE="PRE"`), at
load, placed where playback begins, the live join point on a live playlist (ADR 0110); a
post-roll's (`CUE="POST"`), when the programme is buffered to its end, and only its linear
default plays, after the programme (ADR 0111); and a `CUE="ONCE"` break leaves for good once it
has played (ADR 0112) — and there is no option to
request them all up front (ADR 0109). The options are in
[`docs/integrating-the-library.md`](docs/integrating-the-library.md) §6.

The container is the box the composition lives in, and the media element has to
be inside it: the library creates its own layer there, draws the boxes of the
layout into it, and moves the primary content within it. From `attach` it gets
back the contract of ADR 0003, which is what the trace of a demo reads.

**The library ships no brand of its own, so a page that wants one hands it
over.** Its own mark, as a file, in `logo: { src, alt }` -- drawn on a light
plate in the bar, inside the container, so that it is still in the frame in
fullscreen -- and its own colour as a CSS custom property on the container,
`--qa-accent`, which the knob of the bar and the focus ring take (`--qa-plate`
is the plate's surface, light by default). None of the three is required, and a
player that passes none of them comes out in white, with no mark, which is what
a player with no brand looks like. The colours the bar marks the breaks with are
not part of this: those are functional and stay where they are.

**hls.js keeps its interstitials machinery on, and nothing of ours goes into
the instance.** One stream can carry both kinds of break, never overlapping: ours,
which the library draws over the programme, and Apple's traditional interstitial,
which hls.js plays by replacing the programme (ADR 0114). While hls.js plays one,
the library draws nothing over it, the chrome follows the programme's clock, and the
bar marks both kinds. Which class a break is can be chosen per client with a query
parameter on the same playlist (`EXT-X-DEFINE:QUERYPARAM`, ADR 0113). The details
are [`docs/integrating-the-library.md`](docs/integrating-the-library.md) §2.1.

The public surface is deliberately not frozen yet. ADR 0015 fixes it with the
controls of the composition built and not before, because the controls are most
of it.
