# multiview-offer — the break where the publisher offers and the viewer composes

An ad break is composed by whoever sells it: the payload declares a box per asset and the
client draws what it was told. **A multi view is not composed by anybody when it is
signalled.** The playlist announces a *catalogue* — what else can be watched and what each
one is called — and says nothing about where any of it goes, because where it goes depends
on how many feeds the viewer raised, and that is decided on the other side of the network
after the playlist was written.

So this demo is about a change of who decides:

| | |
| --- | --- |
| the publisher | offers a catalogue, and names every item in it |
| the player | works out the geometry, because it is the only one that knows how many boxes there are **and** how big the screen is |
| whoever is watching | raises and lowers feeds, gives one the sound, enlarges one, and leaves |

And **one playlist carries both classes**, which is the second thing it shows.
`com.qualabs.hls.concurrentInterstitial` and `com.qualabs.hls.multiViewInterstitial` are
siblings, not one extending the other: in HLS the class of a Date Range is compared as an
exact string and the format has no inheritance.

## Run it

```bash
./run.sh multiview-offer
```

That packages the content the first time, writes the signalled playlist, builds the
library, and serves this folder. `PORT` picks the port when 8080 is taken:

```bash
PORT=8090 ./run.sh multiview-offer
```

**Nothing is downloaded.** The four films come from
`demo/compatibility-pair/content/.fuentes/`, which the other demo already has on disk, and
they are re-cut into the stretches this run needs. That is what lets this demo be built in
an afternoon and it is the difference with the motor-racing one, which needs footage that
does not exist yet.

**Do one thing before watching, and only once: turn the sound on**, with the control at the
top right of the picture — the library draws it. The page starts muted because a browser
will not autoplay a page with sound. It matters more here than in the other demo: an offer
opens with the programme sounding and every feed silent, and the whole point of tapping a
box is to move that.

## What you will see

**It opens on black**, one sentence at a time, and the type shrinks as you scroll. The last
one names the thing, and the picture arrives over it. The programme does not start until
the player is actually on screen — sixty per cent of it visible — so nothing plays to a
reader who is still up top.

**There is no guided walkthrough, and that is the demo rather than an omission.** The other
demo in this repository drives itself: its ads arrive on their own and a walkthrough can
stop the picture and say what is about to happen. Here nothing happens until you tick a
row. A walkthrough that ticked rows on your behalf would be arguing the opposite of what
this page is for. What is under the player instead is a **map of the run** — the windows,
read off the contract, with the one that is open lit — and, for the window you are in, what
it is offering.

The run is 180 seconds and three breaks:

- **an ad**, of the class that has been working since phase 01, drawn over a programme that
  never stops. It is here to show that adding the second class took nothing away from the
  first.
- **a catalogue that fits on the grid.** Open the list of feeds in the bar and tick them one
  at a time: the grid takes its shape from how many are up. Enlarge a box and it goes to
  full frame *with the sound* — that is one gesture, not two. Shrink it and it goes back,
  still sounding. Then leave with the one-view button.
- **a catalogue longer than the grid.** Fill the grid and the rows that are not up go grey,
  with a line saying why; the way past a full grid is to lower one and raise the other.
  Leave this one the other way: untick the last feed. **The two ways out are the same
  event** — one box is no composition — so there is only one implementation of "put the
  programme back as it was", and nothing to fall out of step.

`scripts/senalizar-contenido.sh` prints the run — every break, its window, its class and
what its catalogue offers — every time it writes the playlist, which is on every start.
Read it there rather than here: this file would be a copy that goes stale.

## Below the picture

Three sections, and none of them contains a screenshot or a typed-in fact:

- **what a break announces** — every break of this run, the ad drawn as the boxes its
  payload declared and each offer listed as the catalogue it declares, plus the field names
  of one element and one view side by side. The three fields an offer does **not** carry are
  the point of that comparison.
- **the shape of the grid** — a gallery that starts empty and fills as you walk the run: one
  cell per number of boxes the composition actually reached, stamped with the second it
  happened. Under it, the two readings that are the proof of the way out: the `style`
  attribute of the primary content when the page loaded, and the same attribute now.
- **the signalling, as it is served** — the Date Range tags of the playlist this player is
  playing, the block of an offer field by field, and each asset-list in a fold, with the one
  whose window is open marked live.

**Every one of those is read at run time**, off the provider or off the network. A caption
this page cannot support is a caption this page does not have, and where there is nothing to
say yet the box stays empty rather than filling with a promise.

## What is on screen and whose it is

*Tears of Steel* (the programme), *Caminandes: Gran Dillama* (the ad, and two of the feeds),
*Elephants Dream* and *Sintel* (the rest of the catalogue), © Blender Foundation, under
Creative Commons Attribution — CC BY 3.0, and CC BY 2.5 for *Elephants Dream*. Re-encoded
and cut for this demo; nothing was added to them and nothing of ours is drawn over them.
Every file with the source it came from is in `CREDITS.md`.

**Two feeds of the long catalogue are the same film at different moments, on purpose.** It
is what makes it evident that a grid of four is four decoders and not one picture shown
twice — and the line under the player counts those decoders off the DOM so nobody has to
take it on trust.

**What that line does not report is the network, and it cannot.** Everything here is served
off the same machine, so a full grid shows that four decoders keep up and says nothing about
what four players ask of a real connection, or about what an adaptive bitrate algorithm does
with them competing. That has not been measured anywhere in this repository.

## The files that decide things

```
signalling/asset-list-cornerOverlay.json   the ad: one box, declared where it goes
signalling/asset-list-offer-3.json         a catalogue that fits on the grid
signalling/asset-list-offer-5.json         a catalogue longer than it
scripts/senalizar-contenido.sh             the run: which break, at which second, of which class
scripts/empaquetar-contenido.sh            how each feed is cut and encoded
```

**The names in the selector live in the asset-lists and nowhere else.** A view declares a
`name`, and that is the field that makes a catalogue a catalogue: a list somebody chooses
from cannot be a list of identifiers. Edit those and the rows change, on the page and in the
chrome, with no code touched.

**The class of each tag is not typed into the signalling script either.** It is decided by
what the asset-list's payload carries, which is what makes it impossible to announce a
catalogue with the class of an ad.

## Test it

```bash
npm test    # this demo's own suite runs with the library's
```

`test/signalled-run.test.js` watches **the playlist this demo serves**, which the library's
own suite cannot see: it hands `scripts/senalizar-contenido.sh` a media playlist of nine
lines and counts what really came out — three Date Ranges, one of the concurrent class and
two of multi view, each pointing at its own asset-list, starting where the table says and
declaring the length its asset-list adds up to. It also checks that no view of a catalogue
carries a `viewport`, a `zDepth` or a `volume`, which is the rule that keeps an offer from
quietly turning into a layout.

The two class strings are imported from the library rather than written in the test: the
string a tag carries and the string the library translates have to be the same one, because
a client compares a class by exact equality and two spellings are two experiences that never
meet.
