// dash-player.js -- the DASH player of stage-pair: our library over dash.js
// (phase 19, ADR 0127), built the same way for a pane of index.html and for the
// single player of inspect.html.
//
// ONE FILE FOR THE TWO PAGES, for the reason capabilities.js gives: two copies of
// the block an integrator writes are two places where it can come to differ, and
// the point of inspect.html is that what it inspects is what index.html plays.
// What each page does with the reports -- a list of requests per pane, or the
// four cards -- is handed in as callbacks and stays in its own file.
//
// THE ORDER IS THE ONE DIFFERENCE FROM HLS AN INTEGRATOR SEES: `attach` before
// `initialize`, because the breaks are read off the MPD as dash.js receives it
// (ADR 0128). `antesDeIniciar(player)` runs between the two, which is where a
// page that wants to read that same response hangs its own interceptor.

import { traceContract } from './contract-trace.js';
import { breakDash, mediosEnPantalla } from './capabilities.js';

/**
 * Build the DASH player into `caja` (`{ player, video }`, a fresh box).
 *
 * `alResolver(idDelBreak, seleccion, experiences)` and
 * `alPresentar(idDelBreak, reporte)` receive the two reports of the library
 * with the break already named by its letter in stage.json; `alPintar(t)` is
 * called on every update of the line under the picture. `etiqueta` prefixes the
 * console lines; `hudExtra` is appended to the HUD.
 *
 * Returns what a page keeps of one arming: `{ modo: 'dash', player, concurrent,
 * consumer, video, programa, listo, enAviso, destruir, linealEnPantalla }`.
 */
export function crearDash({
  caja, capacidades, src, stage, preValidateAssets = false,
  alResolver = null, alPresentar = null, alPintar = null, antesDeIniciar = null,
  hud, contract, pane, state, etiqueta = 'dash', hudExtra = ''
}) {
  // The reports name a break by its Event@id, a number; the pages by its letter.
  const deBreak = (reporte) => breakDash(reporte.id, stage);
  // =========================================================================
  // WHAT AN INTEGRATOR WRITES  (with the <script src> of dash.js and of the
  // library's DASH build, and the container the page hands over).
  const player = dashjs.MediaPlayer().create();
  const concurrent = QualabsConcurrentDash.attach(player, {
    container: caja.player,
    video: caja.video,
    // What the device can draw (ADR 0104), on the `$remote.slots` request too.
    capabilities: capacidades,
    sendCapabilities: true,
    // Off by default (ADR 0107); inspect.html's toggle turns it on.
    preValidateAssets,
    onPresented: (reporte) => alPresentar?.(deBreak(reporte), reporte),
    onResolved: (experiences, seleccion) => {
      for (const e of experiences) {
        console.log(`[${etiqueta}] resolved ${e.type}#${e.itemId}: ${e.elements.length} elements,` +
          ` window ${e.startTime.toFixed(2)}s -> ${(e.startTime + e.duration).toFixed(2)}s`);
      }
      alResolver?.(deBreak(seleccion), seleccion, experiences);
    }
  });
  antesDeIniciar?.(player);
  player.initialize(caja.video, src, true);
  // =========================================================================

  const consumer = traceContract({ provider: concurrent.provider, video: caja.video, hud: contract });
  player.on(dashjs.MediaPlayer.events.ERROR, (e) => console.error(`[${etiqueta}] error`, e.error?.code, e.error?.message));
  player.on(dashjs.MediaPlayer.events.MANIFEST_LOADED, () => {
    hud.textContent = `dash.js ${player.getVersion()} · capabilities: ${JSON.stringify(capacidades)}${hudExtra} · playing ${src}`;
  });
  caja.video.muted = true;

  /** Whether a linear experience is the replace break, and not a linear default of ours. */
  const esElReemplazo = (e) => e.type === 'linear' && breakDash(e.id, stage) === stage.breakLineal?.id;
  const linealEnPantalla = () => concurrent.presentedAt(caja.video.currentTime).some(esElReemplazo);

  /** The line under the picture, read off the contract and nothing else. */
  function pintar() {
    const t = caja.video.currentTime;
    const activas = concurrent.presentedAt(t);
    // The traditional linear break, a replace event our library plays (ADR 0125).
    if (activas.some(esElReemplazo)) {
      pane.dataset.state = 'ad';
      state.textContent = `LINEAR AD, played by our library (replace event) · programme at ${t.toFixed(1)}s · the content is off the screen`;
    } else {
      pane.dataset.state = activas.length ? 'ad' : 'primary';
      state.textContent = activas.length
        ? `primary content + NON-LINEAR AD (${activas.map((e) => e.type).join(', ')})` +
          ` · ${t.toFixed(1)}s · nothing was replaced · ad media: ${mediosEnPantalla(activas)}`
        : `primary content · ${t.toFixed(1)}s`;
    }
    alPintar?.(t);
  }
  // `seeked` too: a seek onto a paused element fires no `timeupdate`.
  caja.video.addEventListener('timeupdate', pintar);
  caja.video.addEventListener('seeked', pintar);
  pintar();

  return {
    modo: 'dash', capacidades, player, concurrent, consumer, video: caja.video,
    destruir: () => player.reset(),
    // The programme is always the element: nothing replaces it (ADR 0016, 0125).
    programa: caja.video,
    listo: () => caja.video.readyState >= 1,
    // Our library plays the replace break too, so the programme takes a seek anywhere.
    enAviso: () => false,
    linealEnPantalla
  };
}
