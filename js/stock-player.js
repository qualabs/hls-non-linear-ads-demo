// stock-player.js -- the other half of the compatibility pair (ADR 0007): a
// client that is already in the market, reading the same playlist as the demo.
//
// The whole point of this file is what it does NOT do. It creates an hls.js
// instance and passes it not one option, so the interstitials machinery is on,
// which is what a deployed player looks like today. It does not import the
// signalling layer, it does not import the renderer, it never asks for the
// concurrent asset-list, and it has no idea the sibling class exists. Given the
// pair of Date Ranges it schedules the Apple-class one and replaces the content
// with the linear ad; the other tag reaches it in full and it does nothing with
// it, because in HLS the class is compared by exact string equality and there is
// no inheritance to fall back on (ADR 0009).
//
// T-02 confirmed all of that in execution on this same version. What this file
// adds is that it happens in the demo's own page, next to the demo's own player
// and labelled, so a recording shows it without anybody explaining it.
//
// AND IT NOW TAKES THE CHROME OF THE LIBRARY, which does not make it a modified
// client and the difference is worth being exact about (the dated note of
// ADR 0007). What stays unmodified is the INSTANCE and its configuration:
// `new Hls()` with nothing passed, its own interstitials machinery deciding
// everything about the break. What the library draws is furniture around it,
// through `attachControls` -- an entry point that receives no instance,
// subscribes to nothing and asks the network for nothing (ADR 0015). Without
// this the two panes would differ in the mechanism AND in the furniture, and
// nobody watching would know which of the two is the argument.
//
// It sits on the transport side of the seam of ADR 0003 -- it reaches for the
// `Hls` global and it reads the interstitials manager -- and it never touches
// the contract. The renderer stays on the far side, knowing none of this.

/**
 * @param video      the element this client plays into
 * @param container  the box around that element, which is what the chrome is
 *                   drawn into and what goes fullscreen
 * @param src        the media playlist. The SAME one the demo player loads:
 *                   app.js passes its own constant, which is the argument
 * @param pane       the labelled box around it; its `data-state` is what the
 *                   stylesheet paints, `primary` or `ad`
 * @param state      one line of text under the player, for the recording
 * @param hud        one line with the version and the configuration, to sit next
 *                   to the demo player's identical line
 */
export function createStockPlayer({ video, container, src, pane, state, hud }) {
  // Factory configuration: not one option is passed. This is the difference
  // with the demo's instance, and it is the only difference.
  const hls = new Hls();

  /** Its own interstitials manager, which is the only thing read off it. */
  const manager = () => hls.interstitialsManager;

  /**
   * What this client is playing, straight out of its own interstitials
   * manager: the identifier of the scheduled item while an ad is on screen,
   * and null while the primary content is. It is the same property T-02 read.
   */
  function playingAd() {
    return manager()?.playingItem?.event?.identifier ?? null;
  }

  /**
   * THE PROGRAMME, AS THIS CLIENT REPORTS IT, and the reason this object exists
   * instead of the element being handed over directly.
   *
   * The chrome reads four properties off what it is given and the rail it draws
   * is the WHOLE PROGRAMME, 180 s of it, with the breaks marked on it as
   * positions of the programme. So the clock over that rail has to be the
   * programme's clock. The element's is not, and measured, it is not in a way
   * that no bar could survive: during a break hls.js chooses one of two
   * strategies per break, according to whether the resume point falls on a
   * segment boundary, and the element reports something different in each.
   *
   *   append in place (breaks 1, 3 and 5 of this run): the ad is written into
   *   the primary timeline, so `currentTime` runs 20.1 -> 32.3 and `duration`
   *   stays at 180.02. The element is reporting the programme.
   *
   *   the MediaSource handed to the asset (breaks 2 and 4): `currentTime` runs
   *   0.1 -> 11.7 and `duration` becomes 12.03. The element is reporting the
   *   AD, on a rail that is the programme -- and for one frame at the edge it
   *   reports the ad's clock against the programme's length, which is neither.
   *
   * A bar fed the element would therefore be right in three breaks out of five
   * and, in the other two, would snap the knob back to the far left and rescale
   * the whole rail to twelve seconds. Which of the two happens is a detail of
   * how hls.js appends, it moves with the segment grid of the content, and
   * nobody could explain it on camera.
   *
   * WHAT IS TRUE IN ALL FIVE IS `interstitialsManager.primary`, and it is
   * exactly the same object this file already reads. It reports the programme:
   * `duration` 180.02 throughout, and a `currentTime` that during a break stays
   * INSIDE the twelve seconds that break takes out of the programme -- walking
   * through them where the ad was appended in place, holding at the second the
   * break began where the MediaSource went to the asset. Both are the truth of
   * what replacement means: the playhead of the programme is inside the break,
   * and what occupies it is the mark the bar draws there.
   *
   * The ad's own clock is not lost and it is not this bar's business: it is the
   * line of text under the picture, where `interstitialPlayer` reports it the
   * same way in all five breaks.
   *
   * `paused` and `muted` are the element's, unproxied: they are true whichever
   * source the element is playing. And the SEEK writes on the programme's
   * timeline for the same reason the clock reads off it -- see the setter.
   */
  const programme = {
    get currentTime() {
      const at = manager()?.primary?.currentTime;
      return Number.isFinite(at) ? at : video.currentTime;
    },
    // A seek from the bar is a seek to a second OF THE PROGRAMME, because that
    // is what the bar draws. Written on the element it would land in the ad's
    // timeline in the two breaks above and mean nothing. Written here it is the
    // machinery of hls.js that decides what a second of the programme means --
    // including one inside a break, and including the `X-RESTRICT` the tag
    // carries, which is its policy to enforce and not ours to imitate.
    set currentTime(seconds) {
      const primary = manager()?.primary;
      if (primary) primary.currentTime = seconds;
      else video.currentTime = seconds;
    },
    get duration() {
      const length = manager()?.primary?.duration;
      return Number.isFinite(length) && length > 0 ? length : video.duration;
    },
    get paused() { return video.paused; },
    get muted() { return video.muted; },
    set muted(value) { video.muted = value; },
    play: () => video.play(),
    pause: () => video.pause(),
    addEventListener: (...args) => video.addEventListener(...args)
  };

  /**
   * The contract of ADR 0003, implemented for THIS player out of its own
   * schedule. It is the second implementation of that contract in the
   * repository and the first one that is not ours, which is the consequence the
   * ADR wrote in phase 01: the signalling layer can have other implementations
   * without the rendering side being touched.
   *
   * Why this and not the provider the library hands back: a bar marks what the
   * player it is drawn on plays (ADR 0018), and what this player scheduled only
   * this player knows. Fed from our signalling layer the bar would be reporting
   * what the PLAYLIST signals, which is a different fact -- and the day this
   * client stopped scheduling a break, the bar would go on drawing five marks
   * and lying about the pane. It has to be able to be wrong when the pane is
   * wrong.
   *
   * The span of a mark is the piece of the PROGRAMME the break takes out of it,
   * `resumeTime - startTime`, and not the length of the ad. The two are the same
   * twelve seconds while the tag stays in the replacement form of ADR 0017, and
   * the day they stop being the same it is the programme's rail that this mark
   * is drawn on.
   */
  function programRanges() {
    const events = manager()?.events || [];
    return {
      ranges: events.map((event) => {
        const span = event.resumeTime - event.startTime;
        return {
          id: event.identifier,
          kind: 'interstitial',
          startTime: event.startTime,
          duration: Number.isFinite(span) && span > 0 ? span : event.duration
        };
      }),
      // The five are known from the first INTERSTITIALS_UPDATED and the list
      // does not grow after it. The contract carries the field, so it is
      // answered rather than assumed.
      settled: events.length > 0
    };
  }

  function paint() {
    const ad = playingAd();
    pane.dataset.state = ad ? 'ad' : 'primary';
    // How far into the AD, off the interstitial player, which reports it the
    // same way whichever strategy hls.js chose for this break. The element
    // cannot say it: in three of the five breaks its clock is the programme's,
    // and reading it as the ad's is what made this line say `125.3s of the ad`
    // of an ad that lasts twelve seconds.
    const inTheAd = manager()?.interstitialPlayer;
    state.textContent = ad
      ? `LINEAR AD "${ad}" · ${(inTheAd?.currentTime ?? 0).toFixed(1)}s of ` +
        `${(inTheAd?.duration ?? 0).toFixed(1)}s · the content is off the screen`
      : `primary content · ${programme.currentTime.toFixed(1)}s`;
  }

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    const on = hls.interstitialsManager != null;
    hud.textContent = `hls.js ${Hls.version} · interstitials manager: ${on ? 'PRESENT' : 'none'} · playing ${src}`;
  });

  // What this client made of the pair, in the console, next to the demo's own
  // trace: one scheduled event out of the two tags.
  hls.on(Hls.Events.INTERSTITIALS_UPDATED, (_event, data) => {
    const scheduled = (data.events || []).map((e) => `${e.identifier} (${e.dateRange?.class})`);
    console.log(`[stock] scheduled ${scheduled.length}: ${scheduled.join(', ') || '(nothing)'}`);
    paint();
  });

  // The transitions, so the label changes at the instant and not a quarter of
  // a second later, which is when `timeupdate` would get around to it.
  for (const name of ['INTERSTITIAL_STARTED', 'INTERSTITIAL_ASSET_STARTED',
    'INTERSTITIAL_ASSET_ENDED', 'INTERSTITIAL_ENDED', 'INTERSTITIALS_PRIMARY_RESUMED']) {
    hls.on(Hls.Events[name], () => { console.log(`[stock] ${name}`); paint(); });
  }

  hls.on(Hls.Events.ERROR, (_event, d) => {
    console.error('[stock] error', d.type, d.details, 'fatal:', d.fatal);
  });

  video.addEventListener('timeupdate', paint);

  // The chrome, and the whole of what this pane takes from the library: the
  // same bar, the same play/pause, the same audio control and the same
  // fullscreen the demo pane draws, over the programme this client reports and
  // marking the breaks this client scheduled. No logo, because after T-02
  // neither pane carries a mark over the picture. No instance goes in and
  // nothing of ours goes on the network for it.
  const chrome = QualabsConcurrentHls.attachControls(programme, {
    container,
    provider: { programRanges }
  });

  hls.loadSource(src);
  hls.attachMedia(video);
  // Muted: the audio of the composition belongs to the demo pane (ADR 0014).
  // The control above can lift it, and the page is what keeps the two panes
  // from being audible at the same time -- see `oneAudioAtATime` in app.js.
  video.muted = true;
  video.play().catch(() => {});
  paint();

  return {
    hls,
    programme,
    programRanges,
    controls: chrome.controls,
    get playingAd() { return playingAd(); },
    get scheduled() {
      return (hls.interstitialsManager?.events || [])
        .map((e) => ({ id: e.identifier, class: e.dateRange?.class }));
    }
  };
}
