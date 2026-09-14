# race-multiview — the race where everybody watches their own car

A race programme that never stops, cutting between cars the way a director cuts. Part way
through it the commentators say the on-board cameras are open, and at that same second the
playlist opens a window that announces a **catalogue**: the cameras that were packaged for
this race, each one named after its driver. Whoever is watching raises the car they care
about, enlarges it, hears that engine instead of the commentary, and leaves. The race never
stopped.

**The argument is the use case and not the format.** A racing channel wants this because the
programme is a single picture and the story is several of them at once, so the director has
to choose for everybody. An offer does not take that choice away from him: the world feed
goes on exactly as it is, and a client that never heard of any of this plays it and nothing
else. What it adds is a second thing on the same playlist, for whoever wants to stay with one
driver.

| | |
| --- | --- |
| the publisher | offers a catalogue, and names every camera in it after its driver |
| the player | works out the geometry, because it is the only one that knows how many boxes there are **and** how big the screen is |
| whoever is watching | raises and lowers cameras, enlarges one to hear that car, and leaves |

The mechanism itself — what an offer is, field by field, and how it differs from an ad that
arrives composed — is the subject of `demo/multiview-offer/`. This demo is what the mechanism
is for.

## Run it

```bash
./run.sh race-multiview
```

That packages the content, writes the signalled playlist, builds the library, and serves this
folder. `PORT` picks the port when 8080 is taken:

```bash
PORT=8090 ./run.sh race-multiview
```

**The video is not in git and it is not downloaded either: it is generated, and generating it
costs money.** A fresh clone has the commentary, the scripts and the prompts but no picture,
and `scripts/preparar-contenido.sh` stops with a message naming what is missing and which
script produces it. See *How the content is regenerated* below before running any of them.

**Do one thing before watching, and only once: turn the sound on**, with the control at the
top right of the picture — the library draws it. The page starts muted because a browser will
not autoplay a page with sound. It matters more here than in any other demo in this
repository: this one is announced by voice. The commentators are the ones who tell you the
cameras are open, and enlarging a car is the gesture that silences them.

## What you will see

**It opens on black**, one sentence at a time, and the type shrinks as you scroll. The last
one names the thing, and the race arrives over it. The programme does not start until the
player is actually on screen — sixty per cent of it visible — so nothing plays to a reader who
is still up top.

Then, in order:

- **the race, with nothing signalled.** The director cuts between cars. The line under the
  picture says `the programme, nothing signalled` and counts one video element.
- **the announcement.** A commentator says the on-board cameras are available, and the window
  opens on the same second — the voice lands just before the tag, which is how it happens in a
  broadcast: first you hear it, then you see it. A popup says a multi view is available and a
  dot stays on the button of the selector after the popup has gone.
- **the catalogue.** Open the list in the bar: the world feed is on it, always on and with no
  tick box, and under it one row per camera, by driver. Tick one and the grid takes its shape;
  tick another and it takes a different one. Nobody chose those shapes — they are a function of
  how many boxes there are.
- **enlarging a car is where this demo pays.** A box at full frame takes the sound with it, so
  the commentary goes quiet and you are inside that car. Shrink it and the commentary is back.
  That is one gesture, not two.
- **filling the grid.** When it is full the rows that are not up go grey, with a line in the
  bar saying why: lower one to raise another. The cap is of the screen and never of the offer.
- **leaving**, with the one-view button or by unticking the last camera. **The two ways out
  are the same event** — one box is no composition — so there is only one implementation of
  "put the race back as it was", and nothing to fall out of step.

**There is no guided walkthrough, and that is the demo rather than an omission.** Nothing
happens until you tick a driver; a walkthrough that ticked one on your behalf would be arguing
the opposite of what this page is for.

`scripts/senalizar-contenido.sh` prints the cue sheet — the window, its class, and the
cameras it offers — every time it writes the playlist, which is on every start. Read it there
rather than here: this file would be a copy that goes stale.

## Below the picture

Two sections, and neither of them contains a screenshot or a typed-in fact:

- **what the window offers** — the window of this run, read off the contract, lit while it is
  open, with the cameras listed by the names the catalogue gives them.
- **the signalling, as it is served** — the Date Range tag of the playlist this player is
  playing, the block of the offer field by field, and the asset-list itself in a fold, marked
  live while its window is open.

**Both are read at run time**, off the provider or off the network. That matters more here
than in the demo this page is built from: this asset-list is not a file somebody wrote, it is
derived at packaging time from the cameras that really exist on disk, so printing the document
that was served is the only way to show that the catalogue on screen is the catalogue on the
wire.

## What is on screen and whose it is

**Everything was generated for this demo, and there is no third-party material in it.** The
race, the circuit, the cars, the crowd, the engines and the two commentators do not exist: the
picture and its sound come from Veo, the commentary from a text-to-speech model, and the
liveries were invented so that no real team's trade dress appears anywhere. There is nothing
here to licence and nobody to credit for footage — which is worth saying, because the other
demos in this repository do run on third-party films and do credit them. What each piece is
and which model made it is in [`CREDITS.md`](CREDITS.md).

**The line under the player counts the decoders off the DOM** so that nobody has to take on
trust that a world feed and three cameras are four decoders and not one picture composed
somewhere else and shipped as a single stream.

**What that line does not report is the network, and it cannot.** Everything here is served
off the same machine, so a full grid shows that four decoders keep up and says nothing about
what four players ask of a real connection, or about what an adaptive bitrate algorithm does
with them competing. That has not been measured anywhere in this repository.

## How the content is regenerated

**This is the section the other demos do not need.** They cut their content out of films that
are already on disk, so their content step is free and idempotent. Here every frame is
generated, and **that costs money**:

| stage | what it produced | US$ |
| --- | --- | ---: |
| the probe and the programme | two clips to test the prompt, then the fourteen shots of the race, and three rounds of reshoots | 26.40 |
| the first on-board camera | the eight clips of one car, and the demo running with a catalogue of one | 11.20 |
| the rest of the catalogue | eight clips per remaining camera, five cameras | 36.80 |
| | **the whole of this demo** | **74.40** |

Every figure is a calculation against the published price of `veo-3.1-fast-generate-001` at
the time it was run, not the reading of an invoice. And they count what was *launched*, which
is what is paid: **93 generations were launched and 62 clips are in the demo**. The thirty-one
that are not are the takes that were looked at and rejected, the five Vertex lost to `code 14`,
and the earlier versions of the shots that a round of reshoots replaced — and they are the
honest part of the figure.

**It is run by hand and it is not part of `run.sh`, on purpose.** A content step that costs
money is a step somebody has to decide to take. `run.sh` packages what is on disk and stops
there.

**And the result will not be the same.** These are generative models with no seed exposed:
the same prompt returns a different race. Every clip in this demo was looked at and several
were regenerated before they were kept — that reviewing is the work, not the generating. A
regenerated demo is a new demo of the same design, so budget for looking at it and for
throwing some of it away.

The chain, in order. Each generator prints its own usage when run with no arguments, and each
one carries its prompts inside it (ADR 0061) rather than in a document beside it:

```
scripts/generar-programa.py    the shots of the race, one clip per shot, into content/.fuentes/programa/
scripts/generar-relato.sh      the lines of the two commentators, one file each, into audio/lineas/
scripts/armar-relato.mjs       places those lines over the programme and renders the voice track
scripts/armar-programa.sh      concatenates the shots, levels them, and lays the voices on top
scripts/generar-camara.py      the clips of the first camera, into content/.fuentes/camaras/<car>/
scripts/generar-camaras.py     the clips of the rest, importing the prompt blocks of the first
scripts/armar-camara.sh        concatenates and levels one camera into <car>.mp4
./run.sh race-multiview        packages everything that is there, and serves it
```

**The commentary is in git and the video is not**, which is why the chain above is not one
command: the audio is small, so regenerating the picture does not mean regenerating the
voices. It also means the commentary describes the race that was generated the first time —
change the shots and the lines have to be revisited, and the one that announces the cameras
has to keep landing on the second the window opens, which is what
`scripts/verificar-anuncio.mjs` measures.

Both generators refuse to launch past a ceiling of generations, counted off their own log of
launches rather than off anybody's memory.

## The files that decide things

```
race.json                          the race: how long it is, when the window opens and how long it
                                   stays open, and the six cars with the name each one is listed by
scripts/senalizar-contenido.sh     writes the Date Range and derives the asset-list from race.json
scripts/preparar-contenido.sh      packages the programme and the cameras that are on disk
scripts/empaquetar-contenido.sh    how each piece is cut and encoded
```

**`race.json` is the one place those numbers exist.** The second the window opens is read by
the signaller, by the mix of the commentary and by the check that the announcement lands in
the window; a copy of it in a second file is a copy that comes apart, and the defect that falls
out of that is the announcement landing *near* the window instead of *in* it. The suite
asserts that none of those numbers is typed anywhere else in this demo.

**The names in the selector come from `race.json` too, and the asset-list is derived and not
written.** A view declares a `name`, and that is the field that makes a catalogue a catalogue:
a list somebody chooses from cannot be a list of identifiers. **And the catalogue is whatever
is packaged** — a camera with no footage on disk is not offered, and a camera whose footage
arrives is offered without anybody editing a script or a list.

## Test it

```bash
npm test    # this demo's own suite runs with the library's
```

`test/signalled-run.test.js` watches **the playlist this demo serves**, which the library's own
suite cannot see: it hands `scripts/senalizar-contenido.sh` a media playlist of nine lines and
a content tree through `SRC`, `OUT`, `CONTENT` and `LISTA`, and counts what really came out —
the Date Range of the multi view class, pointing at the asset-list it wrote, starting where
`race.json` says and offering exactly the cameras that were packaged, under the names
`race.json` gives them. It needs neither ffmpeg nor the video, so it runs on a clean clone.

It also checks that no camera of the catalogue carries a `viewport`, a `zDepth` or a `volume`,
which is the rule that keeps an offer from quietly turning into a layout, and that the numbers
of the race are typed in `race.json` and nowhere else — with a control that plants a file
really typing one, so the check can be seen finding it.

The class string is imported from the library rather than written in the test: the string a tag
carries and the string the library translates have to be the same one, because a client
compares a class by exact equality and two spellings are two experiences that never meet.
