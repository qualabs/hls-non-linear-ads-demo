# Integrating the library

This library plays a **concurrent** ad experience over an unmodified hls.js: the
ad runs beside the content instead of replacing it. You keep your own player
instance and your own content; the library takes over one box of your page and
draws the composition inside it.

It reads a second class of Date Range as well, and what separates the two is who
composes the picture. An ad declares where every box goes and the client draws
what it was told; a **multi view** announces a catalogue of feeds and whoever is
watching builds the grid out of it. Nothing on your page changes for that — no
call of your own, no option, no second container — and §5.2 is why.

What you add is a `<script src>`, a container, and one call. What you have to
get right is on this page, and two of those things are requirements the library
cannot fix for you afterwards — they are §2.

The chrome it draws — the progress bar, the play/pause, the audio control, the
list of feeds and fullscreen of the composition — can also be used on its own,
over a player this library does nothing else to. That is a second call and it is
§6.

The seam between the two layers inside the library is a different document,
`contrato-senalizacion-renderizado.md`. You do not need it to integrate; you
need it if you want to read what is active at a given instant, which is what
`attach` hands back.

---

## 1. The page, in full

This is the whole of it. Nothing is elided.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  /* Neither of these two rules is decoration. §3 says why. */
  .player { position: relative; aspect-ratio: 16 / 9; background: #000; }
  .video  { width: 100%; height: 100%; display: block; object-fit: contain; }
</style>
</head>
<body>

<!-- The container, and the media element INSIDE it. -->
<div class="player" id="player">
  <video class="video" id="video" playsinline></video>
</div>

<!-- hls.js first: the library reaches for the `Hls` global (§4). -->
<script src="./vendor/hls.min.js"></script>
<script src="./dist/qualabs-concurrent-hls.js"></script>
<script>
  const video = document.getElementById('video');

  const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
  const concurrent = QualabsConcurrentHls.attach(hls, {
    container: document.getElementById('player')
  });
  hls.loadSource('./content/primary/con-daterange.m3u8');
  hls.attachMedia(video);

  // Yours and not ours: muted so the autoplay policy lets it start without a
  // click. The audio control the library draws over the picture is what lifts
  // it.
  video.muted = true;
  video.play().catch(() => {});
</script>

</body>
</html>
```

Six lines of JavaScript and four of markup exist because this library exists.
Everything else on that page — the media element, the URL of your content, the
autoplay decision — you would be writing anyway.

Two things about the shape of it:

- **Order of the two script tags matters**, and §4 is the reason.
- **Your code has to run after both of them.** An inline `<script>` at the end
  of `<body>`, as above, or a `<script src>` of your own after those two.

---

## 2. The two things this library requires and cannot fix for you

Both are about `attach`, and one of them is only about `attach`. §2.1 is a
requirement of the concurrent experience, so it is not `attachControls`'
business: that call receives no instance. §2.2 holds for both, for one of its
two reasons — with the chrome drawn there are two sets of controls over the same
element, whichever call drew it. The other reason, the `transform` that scales
the native ones, is only about `attach`.

### 2.1 The interstitials machinery of hls.js goes off

```js
const hls = new Hls({ ...myOwnConfig, ...QualabsConcurrentHls.hlsConfig });
```

`hlsConfig` is one key — `interstitialsController: undefined` — handed over
rather than described, so that the correct path is one line and you never have
to know the name of the key.

**It cannot be required, in the sense of being fixed.** hls.js instantiates the
controller in its constructor, gated on nothing but the truthiness of
`config.interstitialsController`. By the time your instance reaches `attach`
the machinery either exists or does not, and no call from this side changes it.
The other way of requiring it — building the instance for you — is not on
offer: the player is yours.

**And documenting it is not enough, which is the part worth reading twice.**
With the machinery on, *your player still works*. The same media playlist
carries a Date Range of Apple's interstitial class next to ours (that is how
this deploys without breaking clients already in the market), so hls.js
schedules the traditional ad and replaces the content with it. No exception, no
error, nothing on screen to notice: what you are looking at is an ordinary
player doing an ordinary thing. The only symptom is the absence of the thing you
integrated this for.

So the library **verifies and warns**. On `attach` it reads the instance and, if
the machinery is on, writes to `console.error` and leaves the same message on
the handle:

```js
concurrent.diagnostics  // { interstitialsControllerOn: boolean, message: string|null }
```

It does not throw. Taking somebody's page down over a configuration he can fix
in one line is a bigger promise than a plugin gets to make.

Why the machinery has to go off at all: it is closed over Apple's class, so a
Date Range of the concurrent class never reaches it; and it is a machinery of
*replacement* — it hands one MediaSource back and forth between the primary and
the asset, which is the opposite of drawing two sources at once. Nothing is
lost by turning it off: hls.js parses every `EXT-X-DATERANGE` regardless of
class and hands them over on `LEVEL_UPDATED`, which is where the library picks
them up.

### 2.2 No native controls on the primary content

Do not put the `controls` attribute on your `<video>`.

The library scales and moves the primary content inside the container with a
`transform`, because that is how the picture shrinks into the box a layout asks
for. **Native controls are part of the video element, so they scale with it**: a
squeezeback leaves you with a control bar at 40 % of its size, in a corner of
the composition. And with more than one `<video>` on screen — which is what a
concurrent experience is — they command one piece of the picture rather than the
picture.

What you get instead, drawn by the library inside your container: one progress
bar along the bottom for the **whole programme**, with the breaks marked **on the
bar itself** and nothing hanging below it; play/pause centred over the
composition; one audio control at the top right; the list of feeds beside it,
which appears only while a multi view is being offered (§5.2); and fullscreen
**of the composition**, which is the container and everything in it.

The bar is dragged as well as pressed, and it is one gesture and not two: a press
anywhere on it takes the dot there, the dot follows the pointer, and **the seek
happens on the release** — so a press and release without moving seeks where it
was pressed, and a drag seeks where it was let go (ADR 0032).

What a bar marks is what the player it is attached to plays, and only that. The
breaks come from the `provider` you hand over (§6), so a bar over your own
player marks your own breaks and a bar over a second player marks that one's.

That last one is worth stating as a consequence and not as a feature: **anything
you draw outside the container is gone the moment somebody presses fullscreen.**
If your player has a mark, it goes in through the `logo` option (§7), which is
drawn inside.

---

## 3. What your stylesheet has to say

Three rules and one prohibition.

**`object-fit: contain` on the media element.** This is the one that bites
silently. While a layout is on screen the library owns the primary's box; the
moment the break ends it hands the element back to your page by removing its
inline styles, and from then on your stylesheet is what decides the rectangle
the picture occupies. `contain` fits the picture into the container without
deforming it, which is the same rectangle the library was using — so the framing
does not move on the way out of a break. `cover` names a *different* rectangle,
and you get a picture that jumps at the end of every break. Nothing errors and
nothing logs.

**The container needs a box of its own.** It has no intrinsic size: give it a
width from your layout and a height, an `aspect-ratio: 16 / 9` being the
straightforward way. A container of zero height draws nothing.

You do not have to make it a positioning context — the library sets
`position: relative` on it if it computes to `static`, and leaves it alone if
your stylesheet already made it one.

**If your page draws anything over the picture, the container needs
`isolation: isolate`.** The chrome is drawn at a `z-index` of 2147483000 — a
number picked so that it wins over whatever page the library is embedded in — and
that is the right default until the page wants to put something of its own on
top: a caption, a card, a cover. Without a stacking context of its own on the
container, that number competes with your page's elements and beats them, so what
you drew is painted and never seen, with nothing in the console to say why.

`isolation: isolate` on the container keeps the number inside the box. And then
your own element has to be a **sibling of the container, not a child of it**: a
child is inside the same stacking context and loses to the chrome all the same.
The two together are what it takes; either one alone is not enough. Both halves
were found by looking at the picture, which is the only place this shows.

**Do not style the media element inline.** At the end of every break the library
calls `removeAttribute('style')` on it, so any inline style you wrote is gone
after the first break. Put it in a stylesheet.

---

## 4. hls.js has to be a global

The library never receives the hls.js constructor. It reads `Hls.Events` to
subscribe, and it does `new Hls(...)` for every ad asset that is an HLS
playlist — one instance per asset, which is what makes several sources play at
once.

So hls.js has to be loaded as **a classic script that defines `window.Hls`**,
before your code calls `attach`. `import Hls from 'hls.js'` into a module scope
does not satisfy this: the primary content plays, and the first break throws a
`ReferenceError` from inside the library. If that is your setup, assign it —
`window.Hls = Hls` — before `attach`.

The library itself is distributed the same way and for the same reason: one
classic `<script src>` that defines `window.QualabsConcurrentHls`, no bundler
and no npm dependency (§8).

---

## 5. What is the library's, and what stays yours

| | |
| --- | --- |
| **Yours** | the hls.js instance, its configuration, its source, its error handling |
| | the media element that plays the primary content, and its `muted` / autoplay |
| | the container: where it sits on the page, how big it is, its background and its corners |
| | your brand: the logo file, the accent colour, the typeface (§7) |
| **The library's** | everything drawn inside the container: the layer the ads live in, the boxes of each layout, the second instances that play the assets |
| | the geometry of the primary content **while a break is on screen** — its position, its size, its scale, and **the time it takes to get there** (§5.1) |
| | whether an element of an ad fades in and out, and whether it is painted onto an opaque bed (§5.1) |
| | the controls of the composition, and the element that goes fullscreen |
| | which feeds of an offer are on the grid, in what order and which one is enlarged, while that window is open (§5.2) |
| | the volume of every element during a break, including the primary's: the asset-list declares the initial mix, and with the chrome on screen a press on a video box of the ad hands that box the whole sound until it is let go (ADR 0026) |

The library takes the media element from the instance you pass — either it is
attached already, or it arrives on `MEDIA_ATTACHED` — so there is nothing to
pass twice. **It has to be a descendant of the container**: the primary is moved
and scaled within that box, so an element living elsewhere would be dragged
around outside it. The library says so on `console.error` and carries on.

### 5.1 The composition moves, and there is no switch for it

An ad does not cut into the picture, it arrives. Two things carry that, and one
of them deliberately does not:

- **The picture of the primary content is animated**, with a `transform`,
  whenever a layout gives it a box other than the one it is in. A squeezeback
  then reads as the picture retreating over an ad that was already behind it,
  rather than as the frame changing all at once — and on the way out the picture
  grows back and covers the ad again.
- **An element of an ad fades in and out**, by opacity.
- **An ad at full frame gets neither**, in or out. A full-frame ad is a cut, and
  a cut is what it is meant to look like. Nothing has to be declared for this:
  the library recognises it as the ad it drew no layout for.

**The time comes out of the ad's own window, and never from after it.** The way
in happens in the first stretch of the window; the way out *ends* on the edge of
it rather than starting there. So nothing on screen outlives the window the
signalling gave it, and **no frame of a creative is skipped or delayed to make
room for an effect** — the asset starts at the first instant of its window and
plays whole, and what moves over it is the picture. On a window shorter than the
transition there is simply no effect, because the window is what pays for it.

**It is fixed behaviour and it takes no configuration.** `attach` has no option
for it and no custom property of your stylesheet reaches it. The durations and
the curves are exported constants of `lib/renderer.js` —
`PRIMARY_MOVE_MS`, `AD_FADE_IN_MS`, `AD_FADE_OUT_MS`, `MOVE_EASING` and
`FADE_EASING` — and if you want the numbers, read them there. They are not
repeated here on purpose: a number copied into a document is a number that goes
stale.

Two things worth knowing because they touch what stays yours:

- **The library writes `transition-*` inline on the media element** while a break
  is on screen, so a transition your stylesheet puts on that element does not
  survive a break. Only `transform` and `opacity` are ever animated, so nothing
  here costs a layout pass per frame.
- **A still keeps its alpha and a video gets an opaque bed.** A `<video>` is
  transparent until it decodes its first frame, so the library paints black
  behind it; an image is composited with its own transparency, which is what a
  PNG with an alpha channel is for. The difference is not configurable either,
  and it is the reason a transparent creative works.

### 5.2 The viewer can compose the picture, and your page does nothing for it

A Date Range of the multi view class announces a **catalogue** instead of a
layout: what else can be watched during that window and what each feed is
called. Where any of it goes is not in the payload, and cannot be — where a box
goes depends on how many boxes end up on screen, and that is decided here, more
than once, while the window is open.

**There is nothing to integrate.** No call, no option, no container of your own,
and no switch. A playlist that signals no offer resolves none, so a player of a
single feed comes out exactly as it did before this existed; a playlist that
signals one grows the list of feeds in the chrome for the length of that window
and puts it away afterwards. What decides it is what the playlist carries.

What the library does inside the container while a window is open: it announces
the offer once, in a popup that leaves, and marks the button that opens the list
for as long as there is something on offer; a row raises a feed and the same row
lowers it; a button on a box takes that box to full frame **with the sound**,
which is one gesture and not two, and brings it back still sounding; and one
control puts the programme back alone. The programme is a row of that list like
any other, and it is the one row that is ticked and cannot be unticked: it
carries the clock everything else is placed against.

**The cap on the grid is of the screen and never of the catalogue.** A catalogue
is as long as whoever published it wants; what is capped is how much of it is up
at once, counting the programme. With the grid full the rows that are not up go
grey with a line saying why, and the way past it is to lower one and raise
another. The number comes from the table of shapes the library composes with,
derived from it rather than written beside it — `MAX_BOXES` in
`lib/signalling.js`.

**A full grid is that many video decoders playing at once**, which is exactly the
number `capabilities.videoDecoders` exists to tell your ad server before it picks
what to send (§6). The filter of §6 applies to the options of an ad and not to a
catalogue: nothing here refuses an offer over it, and what to offer a device is
the server's decision.

**What is not known, and it is not an omission that measuring here would close:
how much bandwidth a full grid asks of a real connection, and what an adaptive
bitrate algorithm does with that many players competing.** Everything measured so
far ran against content served from the same machine, so what has been shown is
that the decoders keep up, and nothing at all about the network. If you are
sizing this for a live service, that number is yours to take.

---

## 6. The public surface

The global is `QualabsConcurrentHls`, and this is all of it:

| | |
| --- | --- |
| `VERSION` | the library's version, a string |
| `CONCURRENT_CLASS` | `'com.qualabs.hls.concurrentInterstitial'`, the Date Range class of a concurrent ad |
| `VIDEO_DECODERS_PARAM` | `'sgai-video-decoders'`, the query parameter `capabilities.videoDecoders` travels in |
| `IMAGE_OVER_VIDEO_PARAM` | `'sgai-image-over-video'`, the query parameter `capabilities.imageOverVideo` travels in |
| `hlsConfig` | the configuration your instance has to be built with (§2.1) |
| `attach(hls, options)` | turns the concurrent experience on, and returns a handle |
| `attachControls(video, options)` | draws the chrome on a player, with nothing else turned on |

**The multi view class is not on the global**, and it is better known than
discovered. The library reads `com.qualabs.hls.multiViewInterstitial` too, and the
only place that string is published is the source — `MULTIVIEW_CLASS` in
`lib/signalling.js`. A packager or an ad server that has to spell it writes it
out, with no name to check itself against.

### `attach(hls, options)`

`hls` is required and it is your instance, already built.

| option | | |
| --- | --- | --- |
| `container` | **required** | the box the composition lives in, and the element that goes fullscreen. The media element has to be inside it |
| `video` | optional | only if the media element is not the one the instance is attached to |
| `onResolved` | optional | called with the experiences of each asset-list as they resolve, and with what the capability filter did with that break. A hook for your own logging; nothing depends on it |
| `logo` | optional | `{ src, alt }` — your own mark, drawn inside the container (§7) |
| `capabilities` | optional | `{ videoDecoders, imageOverVideo }`: what the device can draw. It travels to your ad server on the asset-list request, and the options of every ad are filtered against it before anything is drawn |

Anything else you pass is ignored. `attach` throws a `TypeError` on a missing
instance or a missing container, and those are the only two things it throws
for.

### `capabilities`, the parameters it becomes, and the filter

```js
QualabsConcurrentHls.attach(hls, {
  container,
  capabilities: { videoDecoders: 1, imageOverVideo: true }
});
```

Two axes, each on its own, because device capability has more than one and a
single number would have to name a class of device instead (R29.1 of the
specification):

| axis | value | what it says |
| --- | --- | --- |
| `videoDecoders` | a whole number above zero | how many video streams the device decodes and composes at the same time, **the programme included**: a device that can show one ad video beside the programme declares 2 |
| `imageOverVideo` | `true` / `false` | whether it can draw an image over the video |

**It is used twice.** Every asset-list request carries it, one parameter per
axis:

```
GET /signalling/asset-list-break-a.json?sgai-video-decoders=1&sgai-image-over-video=1
```

and your ad server SHOULD use it to answer only what the device can show. Then,
whatever the server answered, **the library checks again before drawing**. An
item of the payload may carry `options`, an ordered list of `{ type, layout }`,
and the library keeps the first one the capability satisfies (R5.6): an option
needs one decoder for the programme plus one per element that is not an image,
and needs images if it has an image element. When no option is left, the break
plays the asset's own `URI` full frame as its linear default, or is skipped when
the asset has none. The report of that step — what was offered, what was
discarded and why, and how the break ended — is the second argument of
`onResolved`.

**Leave it out, or leave out an axis, and nothing is sent or filtered for it.**
That is the supported state: the URI is asked for character for character the
way it is asked for by an integrator who never heard of this option, and the
first option of every ad wins. A value that is not one of its axis is not sent
either, and the library says so on `console.warn`.

**You give the capability; the library does not find it out.** What else on your
page is decoding at the same moment is something only your application knows.

**There is no HTML axis.** The specification has one, and this library does not
draw HTML, so there is no value of it the library could declare about itself and
have it be true.

The names are the specification's and they do not begin with `_HLS_`, which the
base reserves for its own parameters. They are published as
`QualabsConcurrentHls.VIDEO_DECODERS_PARAM` and `IMAGE_OVER_VIDEO_PARAM`, so a
server-side check and a client-side one can be written against the same string.

### The handle it returns

| | |
| --- | --- |
| `container` | the one you passed |
| `provider` | the contract: `activeAt(time)` and `programRanges()`. This is the seam of the other document, and the supported way to know what is on screen |
| `diagnostics` | the reading of your instance's configuration (§2.1) |
| `layer` | the element the ads are drawn into |
| `video` | the media element the library ended up using |
| `renderer`, `controls` | the two pieces, once there is a media element |

`provider` is the one to build on. The last three are there to be inspected, not
to be driven.

### The list of breaks is not complete until it says so

`provider.programRanges()` answers `{ ranges, settled }`, and the second half is
the one that gets missed.

The ranges resolve **one at a time**, as each asset-list comes back off the
network, and nothing announces the last one. So a page that draws the moment it
has something draws whatever had arrived by then. Measured on the multi view demo
of this repository: drawn on the first frame that had enough, the section under
the player showed **two of the three breaks** of a playlist that signals three —
no error, no warning, and nothing on the screen to say one was missing.

`settled` is the contract's own answer to *is this the whole list*. `false` means
the list is partial and you ask again; `true` means the signalling has handed over
every range it is going to and none is still resolving. Waiting for it costs a few
hundred milliseconds of an empty container, and an empty container is the honest
state of a section whose subject has not finished arriving.

What it talks about is the **signalling and not the programme**: it turns `true`
when the source of the ranges is closed — a playlist that cannot grow — and
everything that source fired has finished. Over a source that keeps growing it
never turns `true`, and what you draw off it repaints as the ranges arrive, which
is the same thing the bar does.

The bar the library draws needs none of this, because it re-reads on every paint
the way it re-reads the length. It is your own reading of the contract that gets
one chance to be wrong.

### `attachControls(video, options)`

The chrome on its own: the same controls `attach` draws, on a media element,
with none of the concurrent experience behind them. It receives no instance of
hls.js and it subscribes to nothing.

It is here because the two are separable and you can want one without the other
— the chrome over a player whose ads you already handle some other way, or over
a player this library does not drive at all. Nothing about that player changes:
this call reads `currentTime`, `duration`, `paused` and `muted` off the element
and writes them back, and that is the whole of its contact with it.

`video` is required and it is what the controls command. A media element, or
anything that reports and accepts those four properties and forwards
`addEventListener`, `play` and `pause` to one. That is not a loophole and it is
worth one paragraph, because it is what makes this call usable over a player
whose ads it does not handle: **a client that replaces the content with an ad
usually stops reporting the programme while the ad is on screen** -- its element
reports the ad's own time and the ad's own length. A bar fed that would rescale
the whole rail to twelve seconds and drop every mark on it. Hand over a small
object that reads the programme's position off wherever your player keeps it, and
the bar draws one timeline. The clock of the ad is a different statement and it
belongs somewhere else on your page.

| option | | |
| --- | --- | --- |
| `container` | **required** | the box the controls are drawn in, and the element that goes fullscreen. `video` has to be inside it, and it needs a box of its own (§3) |
| `provider` | optional | anything with a `programRanges()`, which is what the bar marks the breaks from. Without one the bar is the bar and nothing else |
| `logo` | optional | `{ src, alt }` — your own mark, drawn inside the container (§7) |

**`provider` is the contract and not this library's implementation of it.** The
one `attach` hands back is one implementation; a player of your own that knows
where its breaks are is another. That is the rule and not a convenience: what a
bar marks has to come out of the player that bar is drawn on, or it is marking
somebody else's timeline. The shape is in `contrato-senalizacion-renderizado.md`.

The handle it returns is `attach`'s minus what does not exist:

| | |
| --- | --- |
| `container` | the one you passed |
| `video` | the one you passed |
| `controls` | the piece it built |

What it does **not** do is most of the point. It reads no configuration and
writes no diagnosis, so §2.1 is not its business; it creates no layer for ads and
applies no transform to your element; and it asks the network for nothing.

---

## 7. The brand is yours, because this library ships none

A player embedded in somebody else's page carries his brand or none. Three
things, none of them required, and each travels by the mechanism that fits what
it is:

```js
QualabsConcurrentHls.attach(hls, {
  container: document.getElementById('player'),
  logo: { src: './my-logo.svg', alt: 'My brand' }   // a file, so it goes through the API
});
```

```css
#player {
  --qa-accent: #37b4a7;   /* the knob of the bar and the focus ring */
  --qa-plate:  #f8f9fa;   /* the surface the logo sits on */
}
```

A logo is an asset, so it goes through `attach`; a colour is a value, so it goes
through CSS, set on your container. **The typeface is inherited** — the chrome
takes the font of the page it is embedded in, and this library distributes none.

Pass nothing and you get a player with no mark, a white knob and a light plate,
which is what a player with no brand looks like.

Two colours are **not** yours and are deliberately not exposed: the violet of a
concurrent range and the yellow of a traditional one, on the bar. Those are
functional — what they have to do is be told apart — and yellow is the colour
Apple's own players mark a break with, so it arrives already read.

---

## 8. Getting the file

`dist/qualabs-concurrent-hls.js` is assembled from `lib/` by
`scripts/construir-libreria.sh`: the sources stay as ES modules, one file per
piece, and the build concatenates them into one classic script that defines the
global. No bundler, no dependencies, and the browser does not resolve modules.

In this repository it is built on every start by `run.sh` and it is gitignored,
so there can be no stale copy. To take the library elsewhere, run that script
and copy the one file it writes.

---

## 9. What it costs, in lines

Ten lines: six of JavaScript and four of markup, plus the two CSS rules of §3.
That is the page of §1 with the optional things left out.

The compatibility-pair demo in this repository is that page with one option
added, `onResolved`, plus one more call of §6 -- `attachControls` over the second
player, so that both pictures carry the same chrome. Everything else it contains
is there to make its own argument: that second player at its factory
configuration for the compatibility pair, the object it hands over so its bar
reads the programme and not the ad it replaces it with, and the trace of the
contract under the picture and in the console. None of that is plumbing this
library needs, and the second call is the same one line the section above
documents.

The multi view demo is those ten lines exactly, with no option at all: what makes
it a multi view is the second class in its playlist and not a line of its page.
What it adds is its own reading of `provider`, to draw the run under the picture.
