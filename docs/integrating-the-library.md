# Integrating the library

This library plays a **concurrent** ad experience over an unmodified hls.js: the
ad runs beside the content instead of replacing it. You keep your own player
instance and your own content; the library takes over one box of your page and
draws the composition inside it.

What you add is a `<script src>`, a container, and one call. What you have to
get right is on this page, and two of those things are requirements the library
cannot fix for you afterwards — they are §2.

The chrome it draws — the progress bar, the play/pause, the audio control and
fullscreen of the composition — can also be used on its own, over a player this
library does nothing else to. That is a second call and it is §6.

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
composition; one audio control at the top right; and fullscreen **of the
composition**, which is the container and everything in it.

What a bar marks is what the player it is attached to plays, and only that. The
breaks come from the `provider` you hand over (§6), so a bar over your own
player marks your own breaks and a bar over a second player marks that one's.

That last one is worth stating as a consequence and not as a feature: **anything
you draw outside the container is gone the moment somebody presses fullscreen.**
If your player has a mark, it goes in through the `logo` option (§7), which is
drawn inside.

---

## 3. What your stylesheet has to say

Two rules and one prohibition.

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
| | the geometry of the primary content **while a break is on screen** — its position, its size and its scale |
| | the controls of the composition, and the element that goes fullscreen |
| | the volume of every element during a break, including the primary's: the asset-list declares the initial mix, and with the chrome on screen a press on a video box of the ad hands that box the whole sound until it is let go (ADR 0026) |

The library takes the media element from the instance you pass — either it is
attached already, or it arrives on `MEDIA_ATTACHED` — so there is nothing to
pass twice. **It has to be a descendant of the container**: the primary is moved
and scaled within that box, so an element living elsewhere would be dragged
around outside it. The library says so on `console.error` and carries on.

---

## 6. The public surface

The global is `QualabsConcurrentHls`, and this is all of it:

| | |
| --- | --- |
| `VERSION` | the library's version, a string |
| `CONCURRENT_CLASS` | `'com.qualabs.hls.concurrentInterstitial'`, the Date Range class this reads |
| `DECODER_COUNT_PARAM` | `'qa-decoder-count'`, the query parameter `decoderCount` travels in |
| `hlsConfig` | the configuration your instance has to be built with (§2.1) |
| `attach(hls, options)` | turns the concurrent experience on, and returns a handle |
| `attachControls(video, options)` | draws the chrome on a player, with nothing else turned on |

### `attach(hls, options)`

`hls` is required and it is your instance, already built.

| option | | |
| --- | --- | --- |
| `container` | **required** | the box the composition lives in, and the element that goes fullscreen. The media element has to be inside it |
| `video` | optional | only if the media element is not the one the instance is attached to |
| `onResolved` | optional | called with the experiences of each asset-list as they resolve. A hook for your own logging; nothing depends on it |
| `logo` | optional | `{ src, alt }` — your own mark, drawn inside the container (§7) |
| `decoderCount` | optional | how many video decoders the device has. It travels to your ad server on the asset-list request, and nothing else happens to it here |

Anything else you pass is ignored. `attach` throws a `TypeError` on a missing
instance or a missing container, and those are the only two things it throws
for.

### `decoderCount`, and the parameter it becomes

A concurrent break is more than one video on screen at once, so how many the
device can decode at the same time is something the ad server would like to know
before it picks what to send. This option is how it finds out, and that is the
whole of it: **the number is passed on, not interpreted.** The library does not
read it back, does not refuse a layout over it, and measures nothing with it.

```js
QualabsConcurrentHls.attach(hls, { container, decoderCount: 3 });
```

Every asset-list request then carries it:

```
GET /signalling/asset-list-cornerOverlay.json?qa-decoder-count=3
```

**Leave it out and nothing is added to the request.** That is the supported
state, not an oversight: the URI is asked for character for character the way it
is asked for by an integrator who never heard of this option, and your ad server
answers what it answers today. A value that is not a whole number of decoders
above zero is not sent either, and the library says so on `console.warn` rather
than putting it on the wire, where it would be ignored without anybody noticing.

**You give the number; the library does not find it out.** What else on your page
is decoding at the same moment is something only your application knows, so
detection is yours and this is the seam where it arrives.

Two things about the name, because it ends up in your server's logs and in
somebody's parser:

- **It does not begin with `_HLS_`.** The HLS draft reserves that prefix for the
  query parameters it defines itself and asks that nobody else define parameters
  with it. It is also in live use next to this one: the interstitials machinery
  of hls.js puts `_HLS_primary_id` on the asset-list requests it makes.
- **It carries this library's namespace**, like the Date Range class it reads and
  the global it defines. The asset-list URI is yours and may already carry query
  of its own, so a bare `decoderCount` would be claiming a name in shared space.
  The day the specification names this capability, that name is the one that
  travels and it replaces this one.

The name is `QualabsConcurrentHls.DECODER_COUNT_PARAM`, so a server-side check
and a client-side one can be written against the same string.

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

The demo in this repository is that page with one option added, `onResolved`,
plus one more call of §6 -- `attachControls` over the second player, so that both
pictures carry the same chrome. Everything else it contains is there to make its
own argument: that second player at its factory configuration for the
compatibility pair, the object it hands over so its bar reads the programme and
not the ad it replaces it with, and the trace of the contract under the picture
and in the console. None of that is plumbing this library needs, and the second
call is the same one line the section above documents.
