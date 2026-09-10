# hydration-break — the minute where the broadcast does not cut away

Play stops for a minute: the players drink, the coach talks to the team. **The broadcast
keeps the live picture and puts the advertising on top of it.** The argument is about
money, not about pixels: the viewer stays watching, so the advertising is seen, while a
linear break in that minute sends them to the kitchen.

That is what this demo shows, and it shows it by doing it — real HLS, a real
`EXT-X-DATERANGE`, an asset-list fetched over the network, and video elements playing.
Nothing here is a compositing pass over a recording.

## Run it

```bash
./run.sh hydration-break
```

Nothing else is needed: it downloads the match clips if they are not there, assembles the
plate, burns the channel package over it, composes the four ad creatives, writes the
signalled playlist, builds the library, and serves this folder.

`PORT` picks the port when 8080 is taken:

```bash
PORT=8081 ./run.sh hydration-break
```

**Do one thing before recording, and only once: turn the audio on**, with the control at
the top right of the picture — the library draws it. The page starts muted because the
browser's autoplay policy will not start a page with sound. The concurrent ads come in
silent over a match you keep hearing, and the linear ad is the only one that takes the
sound (ADR 0019).

## What you will see

The walkthrough **starts by itself**: the player holds still on a card, a line of type says
what is about to happen, the card goes, and the player carries on so you watch it happen.
When the ad is about to change it stops again. There is one way out and it is the button
below the picture — a tap on the player's own controls will not end it (ADR 0042). When
the last beat is done the player is yours.

The minute is one break with four ads, and the shape of it is **a curve of intrusion**: a
bottom banner with the match fully visible, the L with the match folded into a corner, the
traditional linear ad with the match not visible at all, and a corner overlay that gives
it back. The linear one is third on purpose, and that is where the walkthrough makes the
business case (ADR 0043).

**Three shapes of ad, not two**, and the first one is the point: the banner is a **still
image**. The mechanism takes an image as happily as it takes video, and this minute says
so on screen rather than in a README (ADR 0046).

`scripts/senalizar-contenido.sh` prints the run — every ad, its window and its shape —
every time it writes the playlist, which is on every start. Read it there rather than
here: this file would be a copy that goes stale.

## What is on screen and whose it is

Two halves, and `CREDITS.md` has the provenance of each file.

- **The match** is amateur footage under the Pexels License, cut and re-framed. Every clip
  went through a frame check, and what was looked at is written down: of six candidates,
  five did not pass — one carried a federation crest and a real sportswear mark, one
  showed minors.
- **Everything else is ours and fictional.** The channel package — the bug, the scorebug,
  the clock, the two clubs and the score — and the four ad creatives, for three invented
  brands. Nothing imitates the trade dress of a real brand, and that is not left to a
  prompt: it is a human check per piece, because the generator drifts towards real marks
  even when told not to (ADR 0045).

## The files that decide things

```
plate.json          where the stoppage starts, and how long it lasts (ADR 0044)
story/story.json    the walkthrough: what is said and when
signalling/         the asset-list of the break
graphics/           the channel package and the typography of the creatives, as SVG
```

**Two of them are where you edit, and neither is code.** `story/story.json` is the text of
the walkthrough — a beat names a break or an ad and how far ahead of it to speak, never a
second of the programme, so moving a break in the signalling moves the story with it (ADR
0037). And `plate.json` is the one place the second of the stoppage lives: the graphic that
says `PLAY STOPPED` and the break that draws advertising over it both read it.

## Test it

```bash
npm test              # this demo's own suite runs with the library's
npm run mutaciones    # breaks each of this demo's checks on purpose
```

The suite reads this demo's declared files, and its first check is the one that keeps ADR
0037 honest: every anchor of the walkthrough has to land on a break and an ad that exist,
and every beat has to stop *before* the thing it announces. It runs `resolveAnchor` from
`js/story.js` — the page's own code, not a copy of it.

`npm run mutaciones` is why those checks can be trusted: it breaks one rule at a time and
requires each check to go red. **A check nobody has seen fail is a check nobody knows can
fail**, and this project has been caught by that three times.
