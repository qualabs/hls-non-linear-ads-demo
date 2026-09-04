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
// It sits on the transport side of the seam of ADR 0003 -- it reaches for the
// `Hls` global and it reads the interstitials manager -- and it never touches
// the contract. The renderer stays on the far side, knowing none of this.

/**
 * @param video   the element this client plays into
 * @param src     the media playlist. The SAME one the demo player loads:
 *                app.js passes its own constant, which is the argument
 * @param pane    the labelled box around it; its `data-state` is what the
 *                stylesheet paints, `primary` or `ad`
 * @param state   one line of text under the player, for the recording
 * @param hud     one line with the version and the configuration, to sit next
 *                to the demo player's identical line
 */
export function createStockPlayer({ video, src, pane, state, hud }) {
  // Factory configuration: not one option is passed. This is the difference
  // with the demo's instance, and it is the only difference.
  const hls = new Hls();

  /**
   * What this client is playing, straight out of its own interstitials
   * manager: the identifier of the scheduled item while an ad is on screen,
   * and null while the primary content is. It is the same property T-02 read.
   */
  function playingAd() {
    return hls.interstitialsManager?.playingItem?.event?.identifier ?? null;
  }

  function paint() {
    const ad = playingAd();
    pane.dataset.state = ad ? 'ad' : 'primary';
    // The time an off-the-shelf client reports during a replacement ad is the
    // ad's own, not the show's, which is itself part of what replacement means.
    state.textContent = ad
      ? `LINEAR AD "${ad}" · ${video.currentTime.toFixed(1)}s of the ad · the content is off the screen`
      : `primary content · ${video.currentTime.toFixed(1)}s`;
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

  hls.loadSource(src);
  hls.attachMedia(video);
  // Muted: this pane is the compatibility argument and not the audio one. The
  // audio of ADR 0010 belongs to the demo pane.
  video.muted = true;
  video.play().catch(() => {});
  paint();

  return {
    hls,
    get playingAd() { return playingAd(); },
    get scheduled() {
      return (hls.interstitialsManager?.events || [])
        .map((e) => ({ id: e.identifier, class: e.dateRange?.class }));
    }
  };
}
