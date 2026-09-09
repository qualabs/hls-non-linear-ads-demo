# compatibility-pair

**One URL, two clients side by side.** On the left an off-the-shelf hls.js; on
the right the same version of hls.js, driven by the library of this repository.
Neither one is patched, both read the same media playlist, and what each of them
does with it is the argument of this demo.

This is the run that gets recorded.

## Run it

From the root of the repository:

```bash
./run.sh          # or npm start; both of them mean ./run.sh compatibility-pair
```

Then open <http://localhost:8080/>.

The first run downloads ~535 MB of footage and packages it (about half a minute
of ffmpeg). Every run after that starts the server straight away. To re-package
without re-downloading:

```bash
./demo/compatibility-pair/scripts/preparar-contenido.sh
```

Requirements: node and ffmpeg. There are no npm dependencies.

The playlist carries **five breaks**: four of a single ad each and a last one of
four ads back to back, one of them at full frame. That is the recording. To work
on a single layout instead, name it when the playlist is written -- there is one
asset-list per layout in `signalling/` -- and then serve this folder without
writing the playlist again:

```bash
./demo/compatibility-pair/scripts/senalizar-contenido.sh 20 squeezebackLShape
node server.mjs demo/compatibility-pair
```

Both from the root as well. The second one is what `run.sh` ends in: the folder
of this demo is the document root, and `/dist/` and `/vendor/` are mounted from
the root of the repository, which is what leaves the URIs of the thirteen
asset-lists and every relative path of the page untouched (ADR 0022).

## The compatibility pair

The page is two players, not one, and that is the demo's strongest argument
(ADR 0007): this deploys without breaking the clients that are already in the
market. Both load the **same URL**. The media playlist carries two
`EXT-X-DATERANGE` on the same `START-DATE`, one of Apple's interstitial class
with a linear ad and one of the sibling class of ADR 0009 with the concurrent
experience, each with its own `ID` and its own asset-list.

The left player is hls.js at its **factory configuration**, with nothing of this
demo wired into the instance: it schedules the Apple-class tag and replaces the
content with the linear ad, exactly as a deployed player does today. The right
one is the same library, same version, unmodified, and keeps the content on
screen with the concurrent experience drawn over it.

**Both panes carry the same chrome, and the left one is still an unmodified
client.** What it takes from the library is `attachControls`, which draws the bar
and the buttons over a player and does nothing else to it: no instance goes in,
nothing is turned on, and nothing of ours reaches the network for it. The
instance is `new Hls()` and not one option, which is the thing that has to stay
untouched for the argument to hold, and it is verified rather than asserted --
three readings of the running page, in the evidence of T-07 of phase 04. Without
the same chrome the two pictures would differ in the mechanism and in the
furniture at once, and nobody watching would know which of the two is the point.

**Each bar marks what its own player plays** (ADR 0018): the concurrent ranges in
violet on the right, and on the left the twelve seconds of the programme each
break replaces, in yellow, read out of that client's own schedule. Same
positions, because the two tags share their `START-DATE`; different colour,
because they are different behaviours. **And the left bar shows the clock of the
programme**, which during a break is the second the programme is stopped at
inside that break, and not the clock of the ad -- that one is on the line of text
under the picture. Why it cannot be the element's own clock is in the evidence of
T-07: in two of the five breaks hls.js hands the MediaSource to the asset, and
the element then reports 0:02 of 0:12 with the whole rail rescaled to the ad.

Backwards compatibility does **not** come from one class extending the other. In
HLS the class of a Date Range is compared by exact string equality and there is
no inheritance, so an existing client cannot do anything sensible with a class
it has never heard of -- it ignores it, which is what the left player does with
ours. The compatibility comes from the playlist serving both things at once and
each client keeping the one it understands.

## Before you record

The run is under three minutes and it needs nothing but a browser window. One
thing to do before the camera rolls, and six to expect.

**Turn the sound on once, at the start**, with the audio control at the top
right of the right-hand picture. Both pictures have one and either works, but
only one of them can be live: turning one on turns the other off, because two
soundtracks of the same film a fraction of a second apart is the worst thing
that can happen to a recording. The page starts muted so the browser's autoplay
policy lets it begin without a click, and that control is the one that lifts it:
it is the audio of the composition, drawn by the library along with the progress
bar, the play/pause and the fullscreen (ADR 0015). It is one switch for the
whole thing, primary content and ad together; what each element is worth inside
it is the mix the asset-list declares, and the player obeys it (ADR 0014). That
mix is the initial state and not the last word: while the chrome is on screen, a
press on any video box of the ad hands that box the whole sound -- it goes to
100 and everything else to 0, the programme included -- and the declared mix
comes back on a second press, or on its own when the ad leaves the screen
(ADR 0026).

**The last break carries four ads in a row, and the third of them is at full
frame.** The first four breaks are one ad each and walk four of the five names
of the requirements document; break 5 is the mix -- concurrent, concurrent,
linear, concurrent -- and the fifth name, Side by side pullback, is the second
ad inside it, which is why that layout has no break of its own. The break runs
48 s where the others run 12. Its third ad covers the picture and takes the
sound, and the programme **keeps playing underneath it**, uninterrupted and
silent: the line under the picture says so while it is on screen, and the bar
does not move, because drawing a linear ad this way changes nothing about the
programme's timeline (ADR 0016).

**Two breaks bring audio of their own.** The Quad, break 4, is the one with a
mix: its asset-list asks for 100 in the bottom-left quadrant and 10 in the other
three, which is what a quad of concurrent sources sounds like when the
signalling picks one to listen to. Here the signalling only proposes: with the
chrome on screen, a press on a quadrant moves the whole sound over to it, a
yellow ring marks the box being heard, and the declared 100/10 comes back when
that box is pressed again or when the break ends (ADR 0026). The full-frame ad
inside break 5 is the other, and it is the only ad of the run that takes the
sound off the programme, because an ad covering the whole screen with no audio
is a fault nothing on screen reports. Every other ad declares no `volume` at
all, and an absent field is silence on the ad and full volume on the show, so
those come in quietly over a programme that keeps its audio.

**One of the breaks has no audio at all.** The two assets of LBox image are
stills, so that ad has no soundtrack to mix in, and the state line under the
right-hand picture says so -- which is not the same thing as no ad being on
screen, and on camera the two look alike.

**Both panes stay on the same second of the programme, and that is the second
argument of the demo.** Every break carries its linear Date Range as well, and
that tag is in replacement form: the off-the-shelf client takes the twelve
seconds of that tag out of the programme and comes back where the ad ended and
not where it began. So the five breaks land on both clients at the same instant,
and outside a break the two panes are showing the same frame of the same film.
Inside one they are on the same second of the programme and each does something
different with it: on the right the ad is drawn over the picture and nothing is
replaced, on the left the ad **is** the picture and that stretch of the
programme is gone. When the break ends they are on the same second again, which
is what makes the two panes comparable frame by frame.

**In break 5 that comparison inverts for twelve of its forty-eight seconds, and
it is better said before it happens than explained afterwards.** Both tags of a
break share their `START-DATE`, which is what makes the pair a pair (ADR 0018),
and what they do not share is their length: theirs is twelve seconds and ours is
forty-eight. From 132 s the off-the-shelf client is already back on the
programme while the right-hand pane is still inside the break, and from 144 s to
156 s -- the full-frame ad -- the left pane shows the programme and the right
one shows a covered screen, which is the reverse of the frame the demo is built
on. It costs the argument nothing: both players are doing the same thing at
different moments, because they were handed breaks of different lengths, and the
argument lives in the other thirty-six seconds, where the right-hand pane keeps
the programme on screen and the left one does not.

**The left pane can end the run a fraction of a second behind**, and that is the
whole of the offset. hls.js resumes three of the five breaks by appending the ad
into the primary timeline, which costs nothing, and the other two by passing the
MediaSource to the asset and back, which costs a fraction of a second each --
0.7 s over the whole run, against the twelve seconds per break that inserting
the ad instead of replacing it would cost.

| break | from | to | layout on screen | name in the requirements document |
| --- | --- | --- | --- | --- |
| 1 | 20 s | 32 s | `cornerOverlay` | Overlay |
| 2 | 45 s | 57 s | `squeezebackLShape`, video assets | LBox video |
| 3 | 70 s | 82 s | `squeezebackLShape`, image assets | LBox image |
| 4 | 95 s | 107 s | `multiView` | Quad |
| 5 | 120 s | 168 s | four ads back to back | the mix |
| 5, ad 1 | 120 s | 132 s | `cornerOverlay` | Overlay |
| 5, ad 2 | 132 s | 144 s | `squeezebackDoubleBox` | Side by side pullback |
| 5, ad 3 | 144 s | 156 s | full frame, no layout block | the linear ad |
| 5, ad 4 | 156 s | 168 s | `cornerOverlay` | Overlay |

The first four breaks last twelve seconds and the fifth forty-eight, which is
its four ads one after the other, and `./run.sh` prints the same table on
startup along with what the compatibility pair does inside break 5. The mapping
of the five names to the four identifiers is ADR 0012, and it is a proposal
waiting on David: LBox video and LBox image are the same layout, and what tells
them apart is the type of the asset inserted into it.

## Two things that look like details and are not

**The primary playlist carries `EXT-X-PROGRAM-DATE-TIME`.** A `START-DATE`
resolves against that clock, so without it the Date Ranges have nothing to
anchor to. `scripts/empaquetar-contenido.sh` writes it into the packaged
content, and `scripts/senalizar-contenido.sh` reads it back to compute the
`START-DATE` of every tag it writes -- which is why the playlist is signalled
again on every start, since re-packaging moves that clock.

**One of the five layouts inserts a still and not a video.** LBox image is the
same L-shape as LBox video, and what changes is the `type` of each asset in the
payload: `image/jpeg` instead of `application/vnd.apple.mpegurl`. The renderer
reads that field to decide whether the box is an `<img>` or a `<video>`, which
is the only thing the five layouts needed that the three mechanisms did not
already do. It costs the ad its audio and its timeline, and both show: the state
line says the ad on screen is made of stills and has no audio, and the still does
not follow the primary when it is paused or seeked, because there is nothing to
follow.

## Test it

```bash
npm test   # from the root of the repository. node --test discovers this folder
```

`test/signalled-run.test.js` watches **the run this demo serves**, which is the
one thing the suite of the library cannot see: its fixtures are frozen copies of
a run measured once, and that is on purpose, because a reading is a reading of
one run (ADR 0023). Three assertions, over the files this folder has inside it
and not against any copy: that the signalling script writes the five breaks of
the recording and that every one of them names an asset-list that exists in
`signalling/`; that the length a break declares is computed from its asset-list
instead of being typed into the script; and that the two `CLASS` strings the
script writes are the two the library translates.

The middle one exists because a `PLANNED-DURATION` typed by hand once declared
twelve seconds of a forty-eight second break, and nothing on screen said so.

What the library itself is tested for, and the check of the two seams, is in the
[README of the root](../../README.md).

## What is where

| | |
| --- | --- |
| `index.html` | the page: the two players side by side, a state line under each, and the table of the run |
| `css/player.css` | the look, from the Qualabs kit in `brand/`. One rule of it is not decoration: each pane takes its identity from a colour and its live state from a data attribute, so somebody watching the recording with the sound off can tell which player is which |
| `js/app.js` | the wiring of the library into this page, with the block an integrator would write fenced apart from everything this page adds for its own argument |
| `js/contract-trace.js` | the contract of the library, printed: the line under the player and the table in the console. What the contract says is [`docs/contrato-senalizacion-renderizado.md`](../../docs/contrato-senalizacion-renderizado.md) |
| `js/stock-player.js` | the off-the-shelf client of the pair: `new Hls()` with nothing passed to it, and of the library only `attachControls`, the chrome |
| `signalling/` | the thirteen asset-lists, as the SVTA Layout Controller emits them, with the URIs filled in: the five of the recording, the three of the multiple breaks, the linear ad, and four broken on purpose to make the layer fall back (ADR 0021) |
| `scripts/` | the content of this demo: download, package as HLS VOD, and write the signalled playlist |
| `content/` | the packaged output, and its cache of downloads. Generated, gitignored |
| `brand/` | Qualabs fonts, logo and favicon, on disk. Copies and not links, with their provenance in [`brand/README.md`](brand/README.md) |
| `test/` | the suite of this demo, described under *Test it* |
| [`CREDITS.md`](CREDITS.md) | the CC BY attribution the footage requires |

The library this page uses is the root of the repository: `lib/` built into
`dist/` on every start, and hls.js pinned in `vendor/` (ADR 0002). What that
library is, is the [README of the root](../../README.md); how a page that is not
this one wires it in is
[`docs/integrating-the-library.md`](../../docs/integrating-the-library.md).
