// native-outcome.js -- what hls.js DID with each interstitial it scheduled, read
// off its own events, for the pages that say it in words (index.html and
// inspect.html).
//
// THE ASSET-LIST SAYS WHAT A BREAK PLANS TO PLAY, AND ONLY hls.js SAYS WHAT IT
// PLAYED. A list with a `URI` declares a default, and a page that read that and
// wrote "plays its default: the linear ad" was right only while the default
// loaded: when the request for it fails, hls.js skips the break and the
// programme goes on, and the sentence on screen went on claiming an ad nobody
// saw. So the pages say the plan ("will play its default") until hls.js has
// told them the outcome, and the outcome is one of three things hls.js reports:
//
// - INTERSTITIAL_ASSET_STARTED, and no failure after it: the default is
//   playing. Not ASSET_LIST_LOADED, which only says the list parsed; and not the
//   start alone, because hls.js starts a pre-roll's asset before its playlist
//   has answered, so a failure that follows a start wins over it.
// - INTERSTITIAL_ASSET_ERROR, and then the EVENT carries an `error`: the
//   default failed and nothing of the break is left, so hls.js falls back to
//   the programme (`primaryFallback` in hls.js 1.7.2). The asset error alone is
//   not the outcome -- hls.js emits it for errors it recovers from too, with
//   `fatal` overwritten to false -- and the `error` it writes on the event right
//   after emitting it is what says it gave up. So the event is read a tick
//   later, and the reason shown is the one the asset error carried.
// - A list that loaded with NO asset (`assetListLoaded` with an empty
//   `assetList`): the break without a default, which hls.js skips (ADR 0091).
//   Read off the schedule and not off ASSET_LIST_LOADED, which never reaches a
//   listener for that list (measured, fase 15, T-20).
//
// Nothing here requests anything: it listens to the instance it is handed.

/** The reason of a failed asset in a few words: the HTTP status when there is one. */
export function reasonOf(data) {
  const code = data?.response?.code ?? data?.networkDetails?.status;
  if (Number.isFinite(code) && code > 0) return `HTTP ${code}`;
  return data?.error?.message || data?.details || 'unknown error';
}

/**
 * Follow the interstitials of one hls.js instance. `keyOf(identifier)` is the
 * key the page knows a break by (its identifier, by default), and
 * `onChange(key)` is called whenever what is known of one of them changes.
 * Returns `outcome(key)`: `null` while hls.js has said nothing conclusive, or
 * `{ kind: 'played' }`, `{ kind: 'failed', reason }`, `{ kind: 'empty' }`, or
 * `{ kind: 'skipped' }` -- it ended with nothing started, for no reason this
 * file saw.
 */
export function followInterstitials(hls, onChange = () => {}, keyOf = (identifier) => identifier) {
  const started = new Set();
  const endedEmpty = new Set();
  /** key -> { reason, event }: the last asset error, and the event it belongs to. */
  const errors = new Map();
  const { Events } = globalThis.Hls;
  const keyOfData = (data) => (data?.event?.identifier ? keyOf(data.event.identifier) : null);

  hls.on(Events.INTERSTITIAL_ASSET_STARTED, (_e, data) => {
    const key = keyOfData(data);
    if (key == null) return;
    started.add(key);
    onChange(key);
  });
  hls.on(Events.INTERSTITIAL_ASSET_ERROR, (_e, data) => {
    const key = keyOfData(data);
    if (key == null) return;
    errors.set(key, { reason: reasonOf(data), event: data.event });
    // hls.js writes `event.error` right after emitting this, when it gives up.
    setTimeout(() => onChange(key), 0);
  });
  hls.on(Events.INTERSTITIAL_ENDED, (_e, data) => {
    const key = keyOfData(data);
    if (key == null || started.has(key)) return;
    endedEmpty.add(key);
    onChange(key);
  });

  // A FAILURE IS ASKED FIRST, because a start is not proof the default played:
  // a pre-roll's asset is started by hls.js before its playlist has answered,
  // and the 404 arrives after INTERSTITIAL_ASSET_STARTED (measured, hls.js
  // 1.7.2, inspect.html with the creatives blocked).
  function outcome(key) {
    const error = errors.get(key);
    if (error?.event?.error) return { kind: 'failed', reason: error.reason };
    const event = (hls.interstitialsManager?.events || []).find((e) => keyOf(e.identifier) === key);
    if (event?.error) return { kind: 'failed', reason: error?.reason ?? event.error.message };
    if (started.has(key)) return { kind: 'played' };
    if (event?.assetListLoaded && event.assetList?.length === 0) return { kind: 'empty' };
    if (endedEmpty.has(key)) return { kind: 'skipped' };
    return null;
  }
  return { outcome };
}

/** The outcome as the short note of a request in the list of index.html. */
export function outcomeNote(outcome, { hasDefault } = {}) {
  if (outcome?.kind === 'played') return '→ its default started: the linear ad';
  if (outcome?.kind === 'failed') return `→ default failed to load (${outcome.reason}): skipped`;
  if (outcome?.kind === 'empty') return '→ skipped: no default content';
  if (outcome?.kind === 'skipped') return '→ skipped';
  if (hasDefault === false) return '→ no default content: will be skipped';
  if (hasDefault) return '→ will play its default: the linear ad';
  return null;
}
