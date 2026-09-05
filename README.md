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

The playlist carries **five breaks, one per layout**: the five names of the
requirements document one after the other, which is the run that gets recorded.
To work on a single layout instead, name it when the playlist is written --
there is one asset-list per layout in `signalling/`:

```bash
./scripts/senalizar-contenido.sh 20 squeezebackLShape   # one break, at 20 s
npm run serve
```

## Before you record

The run is under three minutes and it needs nothing but a browser window. One
thing to do before the camera rolls, and three to expect.

**Turn the sound on once, at the start**, with the audio control at the top
right of the right-hand picture. The page starts muted so the browser's autoplay
policy lets it begin without a click, and that control is the one that lifts it:
it is the audio of the composition, drawn by the library along with the progress
bar, the play/pause and the fullscreen (ADR 0015). It is one switch for the
whole thing, primary content and ad together; what each element is worth inside
it is the mix the asset-list declares, and the player obeys it (ADR 0014).

**Only the fifth break has a mix.** Its asset-list asks for 100 in the
bottom-left quadrant and 10 in the other three, which is what a quad of
concurrent sources sounds like when the signalling picks one to listen to. The
other four declare no `volume` at all, and an absent field is silence on the ad
and full volume on the show, so those four breaks come in quietly over a
programme that keeps its audio.

**One of the five breaks has no audio at all.** The two assets of LBox image are
stills, so that ad has no soundtrack to mix in, and the state line under the
right-hand picture says so -- which is not the same thing as no ad being on
screen, and on camera the two look alike.

**The left player falls behind, and that is the second argument of the demo.**
Every break carries its linear Date Range as well, so the off-the-shelf client
replaces the content four times over the run and comes back where it left off,
twelve seconds later each time. It only reaches four of the five breaks: by the
fifth START-DATE it is already 49.5 s behind, so that break arrives near the end
of the 180 s VOD and the fifth linear ad never completes on the left. After those
four breaks it is 49.5 s of programme behind the player on the right, which
lost none: put the two panes side by side at any moment after the first break and they are showing different scenes of
the same film. Only in the first break do both clients react to the same tags
at the same instant; from the second on, the left one is somewhere else in the
programme, which is the argument rather than a defect.

| break | at | layout on screen | name in the requirements document |
| --- | --- | --- | --- |
| 1 | 20 s | `cornerOverlay` | Overlay |
| 2 | 45 s | `squeezebackLShape`, video assets | LBox video |
| 3 | 70 s | `squeezebackLShape`, image assets | LBox image |
| 4 | 95 s | `squeezebackDoubleBox` | Side by side pullback |
| 5 | 120 s | `multiView` | Quad |

Every break lasts twelve seconds, and `./run.sh` prints the same table on
startup. The mapping of the five names to the four identifiers is ADR 0012, and
it is a proposal waiting on David: LBox video and LBox image are the same
layout, and what tells them apart is the type of the asset inserted into it.

## Test it

```bash
npm test                        # node --test, no dependencies and no browser
./scripts/verificar-cortes.mjs  # the two seams of the project
```

The tests cover what can fail in silence and nothing else -- everything else is
on the screen. That is the pure functions of the two layers, in two files. The
layout resolution: the parsing of `viewport`, the two defaults the tool omits,
the order by `zDepth`, the activation window, and the conversion of insets into
a box in pixels. And what the controls stand on: where the breaks of the
programme are, which kind each one is, where that lands as a fraction of the
whole programme, and the volume every element starts at, which is the one place
where a single character turns the show mute or an ad declared silent into the
loudest thing on the screen.

No case is invented unless it says so. The layouts are the six payloads the SVTA
Layout Controller emits, read verbatim from the evidence of T-03; the breaks are
the run `scripts/senalizar-contenido.sh` writes; and the expected values are the
pixels, the marks and the volumes measured on the running player.

The second command checks a shape instead of a value, and it is the other half
of what can go wrong here without showing on the screen: the two seams. It runs
the grep of ADR 0003 -- the rendering side does not name the transport -- and
the grep of ADR 0015 -- the library does not name the demo -- and compares what
they find against a list of ACCEPTED occurrences it carries inside, each one
with the reason it is acceptable written beside it. Anything that is not on that
list makes it exit non-zero, saying which and where. The list is keyed by the
CONTENT of the line and not by its number, so an edit above an accepted line is
not a finding and the check is not asked to cry wolf.

## What is where

The repository is two things with a line between them (ADR 0015): the library,
and the page that uses it.

| | |
| --- | --- |
| `lib/` | **the library.** No bundler and no dependencies |
| `lib/signalling.js` | the signalling layer: Date Ranges in, the contract out |
| `lib/renderer.js` | the rendering layer: the contract in, the boxes drawn over the video. Knows nothing about HLS |
| `lib/controls.js` | the composition's own controls: one progress bar over the whole programme, pause, audio, fullscreen, and the two lanes that mark where the breaks are |
| `lib/media.js` | how a `uri` becomes pixels: one instance of hls.js per ad asset |
| `lib/concurrent-hls.js` | the entry point and the public surface: `attach`, and the configuration the instance has to be built with |
| `dist/` | the built library: one classic script that defines a global. Generated, gitignored |
| `index.html`, `css/`, `js/` | **the page.** The compatibility pair, the trace of the contract, and the wiring of the library. Native ES modules |
| `js/contract-trace.js` | the same contract, printed: the line under the player and the table in the console |
| `js/stock-player.js` | the off-the-shelf client of the compatibility pair: hls.js at its factory configuration, and none of the above |
| `signalling/` | the asset-lists, as the SVTA Layout Controller emits them, with the URIs filled in |
| `test/` | the tests of what fails in silence: the layout resolution, the ranges of the programme, and the volume of an element |
| `vendor/hls.min.js` | hls.js **1.7.2, unmodified** |
| `server.mjs` | a static file server, and nothing else: no ad server, no APS |
| `scripts/` | the content: download and package as HLS VOD. The build of the library. And `verificar-cortes.mjs`, the check of the two seams |
| `content/` | the packaged output. Generated, gitignored |
| `docs/` | the product's own documents: the contract between the two layers, and how to integrate the library into a page that is not this one |
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
boxes* and *where all the ranges of the programme are, and of which kind*, and
the consumer draws it. Only the first side knows what HLS is. The contract is
written down in `docs/contrato-senalizacion-renderizado.md`.

**The mix is signalled, and the default is silence.** Each element of a layout
starts at the `volume` its asset-list declares, and the page has a visible
control for the audio of the composition as a whole (ADR 0014). Turning it on in
front of an audience is how the demo shows that several sources of audio are
there and that choosing between them is the signalling's rather than the
player's.

An absent `volume` is **not** the same default on both sides of the layout: it
is silence on an element of the ad and full volume on the primary content. The
tool omits the field on every element, the primary content included, so a single
default of 0 would leave the show mute in the five layouts with nothing on
screen saying so, and a single default of 100 would put every ad at full volume
over the programme. Unexpected audio on camera is worse than missing audio,
which is what decides the ad side; the primary content was already playing
before the break, which decides the other. It is a deliberate divergence with
the tool, for which an absent field is 100 everywhere, and ADR 0014 leaves it
written down as a question for SVTA.

## The library, and the page that uses it

The library is `lib/`: the two layers, the piece that turns a `uri` into pixels,
and the entry point that joins them. Everything else is the page.

It is distributed as **one classic `<script src>` that defines a global**, with
no bundler and no npm dependency. The sources stay as ES modules and
`scripts/construir-libreria.sh` assembles them into
`dist/qualabs-concurrent-hls.js` on every start, the same way the signalled
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
const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
const concurrent = QualabsConcurrentHls.attach(hls, {
  container: document.getElementById('player')
});
hls.loadSource(src);
hls.attachMedia(video);
```

The container is the box the composition lives in, and the media element has to
be inside it: the library creates its own layer there, draws the boxes of the
layout into it, and moves the primary content within it. From `attach` it gets
back the contract of ADR 0003, which is what the trace on this page reads.

**The library ships no brand of its own, so a page that wants one hands it
over.** Its own mark, as a file, in `logo: { src, alt }` — drawn on a light
plate in the bar, inside the container, so that it is still in the frame in
fullscreen — and its own colour as a CSS custom property on the container,
`--qa-accent`, which the knob of the bar and the focus ring take (`--qa-plate`
is the plate's surface, light by default). None of the three is required, and
a player that passes none of them comes out in white, with no mark, which is
what a player with no brand looks like. The colours the bar marks the breaks
with are not part of this: those are functional and stay where they are.

`hlsConfig` is the one thing the library cannot fix afterwards. The interstitials
machinery of hls.js is instantiated in the constructor (ADR 0002), so an instance
built without that configuration arrives with the machinery already on. The
library **verifies and warns**: it neither requires it nor leaves it at
documentation, because with the machinery on the player schedules the traditional
interstitial the same playlist carries and replaces the content with it, which
looks exactly like an ordinary player working correctly. Nothing throws and
nothing is on screen to notice. Throwing would be the wrong answer too: taking
somebody's page down over a configuration he can fix in one line is a bigger
promise than a plugin gets to make.

The public surface is deliberately not frozen yet. ADR 0015 fixes it with the
controls of the composition built and not before, because the controls are most
of it.

## Four things that look like details and are not

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

**One of the five layouts inserts a still and not a video.** LBox image is the
same L-shape as LBox video, and what changes is the `type` of each asset in the
payload: `image/jpeg` instead of `application/vnd.apple.mpegurl`. The renderer
reads that field to decide whether the box is an `<img>` or a `<video>`, which
is the only thing the five layouts needed that the three mechanisms did not
already do. It costs the ad its audio and its timeline, and both show: the state
line says the ad on screen is made of stills and has no audio, and the still does
not follow the primary when it is paused or seeked, because there is nothing to
follow.

**The Layout Controller omits two defaults, and the JSON in `signalling/` is
not missing them.** Of the six payloads the tool emits, the two overlays carry
no `primaryContent` block at all, and none of the six carries `volume` on any
element. The signalling layer assumes both -- the primary at zDepth 0, volume
100, viewport `0 0 0 0`, and, where `volume` is absent, silence on an element of
the ad and full volume on the primary content (ADR 0014) -- instead of requiring
them, so a payload pasted straight out of the tool works as it is (ADR 0004).
Adding those fields to the JSON to "fix" it would hide the case that a real
payload hits.
