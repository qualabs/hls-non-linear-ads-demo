// app.js -- the pair of players of index.html, and the switch that says what
// the device can draw.
//
// This file is three things, and it marks which is which.
//
// THE FIRST IS WHAT AN INTEGRATOR WRITES, and it is the block fenced inside
// `armar()`: the library arrives as a <script src> that defines a global, the
// page builds its own hls.js instance with the one configuration the library
// hands over, and turns the concurrent experience on over a container. That is
// the surface of ADR 0015, and the fence is there so it can be counted. The only
// thing this page adds to it that `demo/compatibility-pair/` does not is one
// option, `capabilities` (ADR 0086), documented in
// `docs/integrating-the-library.md`.
//
// THE SECOND IS THE ARGUMENT OF THE PAGE: the off-the-shelf player of the
// compatibility pair, the trace of the contract under the player and in the
// console, and the label of each pane. None of it is plumbing the library needs.
//
// THE THIRD IS THE SWITCH, and it is the only piece of this demo that does not
// exist in the four that came before.
//
// Under all three there is one invariant, and the second half of this file is
// about holding it: THE TWO PANES ARE ALWAYS AT THE SAME SECOND OF THE
// PROGRAMME. The switch and the jump buttons move them together because they
// rebuild; the two scrub bars move them together because they are tied -- see
// "THE TWO BARS ARE ONE BAR" below, which is also where what makes that hard is
// written down.
//
// ============================================================================
// WHY CHANGING THE SWITCH REBUILDS BOTH PLAYERS, AND WHY BOTH
// ============================================================================
// `capabilities` is read ONCE, when the signalling is created, and the reason is
// written where it is read (`createSignalling`, in lib/signalling.js): what the
// value can be wrong about is a statement of the integrator, and that is one
// statement and not one per break. So there is no in-flight way to change it,
// with this design or with any other, and rebuilding is not a detour around the
// contract -- it IS the contract.
//
// AND BOTH SIDES REBUILD IN ONE CALL, which is the half that is easy to get
// wrong. Rebuilding our pane alone would leave the two players on two timelines
// -- one back at zero, the other a minute into the programme -- and a pair whose
// halves are showing different seconds of the same film argues nothing at all.
// `armar()` tears both down and builds both up, and hands both the SAME target
// second, so the invariant does not depend on anybody remembering it.
//
// The programme second is kept across the rebuild for the same reason: the event
// gives about two minutes for everything, and a switch that sent the run back to
// zero would cost twenty seconds to reach the first break every time it is
// touched.
//
// WHAT THE SWITCH CHOOSES is one thing: the `capabilities` handed to
// `attach()`. They travel on the asset-list request, and the library filters the
// options of every ad against them (ADR 0085). The playlist is ONE and the
// answer of each break is the same file for every position of the switch, which
// is how a demo served as static files out of a bucket shows a Player choosing
// with no server behind it.
//
// Both panes load that one playlist, always, which is the whole claim of the
// pair. The break with no linear default (ADR 0087) carries no Apple-class tag,
// so the off-the-shelf pane plays nothing there in every position.

import { traceContract } from './contract-trace.js';
import { createStockPlayer } from './stock-player.js';
import { PARAMETROS, breakDelReporte, crearControl, desenlaceCorto } from './capabilities.js';

// The one source of the numbers of this demo (ADR 0044). The axes of the
// switch, the playlist and the three breaks all come from here; not one of them
// is typed in this file.
const stage = await (await fetch('/stage.json')).json();

const SRC = `/${stage.playlists.par}`;

const panes = {
  stock: {
    caja: document.getElementById('stock-slot'),
    pane: document.getElementById('pane-stock'),
    state: document.getElementById('stock-state'),
    hud: document.getElementById('stock-hud')
  },
  demo: {
    caja: document.getElementById('demo-slot'),
    pane: document.getElementById('pane-demo'),
    state: document.getElementById('demo-state'),
    hud: document.getElementById('hud'),
    contract: document.getElementById('contract')
  }
};

/** A fresh player box with a fresh media element in it, for one arming. */
function construirCaja(slot) {
  const player = document.createElement('div');
  player.className = 'player';
  const video = document.createElement('video');
  video.className = 'video';
  video.playsInline = true;
  video.muted = true;
  player.append(video);
  slot.replaceChildren(player);
  return { player, video };
}

// ===========================================================================
// WHAT WENT OUT ON THE WIRE
// ===========================================================================
// The asset-list requests are READ and not written. What the list below prints
// is the URL the browser actually fetched, out of the performance timeline, so
// the parameters shown are on the request or they are not on the page. Next to
// each one, what the library kept of its answer, off the report `onResolved`
// hands over.
const listaPedidos = document.getElementById('wire-list');
let pedidos = [];

/** break id -> what the library kept of the answer, as `onResolved` reported it. */
const selecciones = new Map();

function pintarPedidos() {
  if (!pedidos.length) {
    const li = document.createElement('li');
    li.className = 'none';
    li.textContent = 'waiting for the first break of this run…';
    listaPedidos.replaceChildren(li);
    return;
  }
  listaPedidos.replaceChildren(...pedidos.map((href) => {
    const url = new URL(href);
    const pares = Object.values(PARAMETROS)
      .filter((nombre) => url.searchParams.has(nombre))
      .map((nombre) => `${nombre}=${url.searchParams.get(nombre)}`);
    const li = document.createElement('li');
    li.append(url.pathname);
    const marca = document.createElement(pares.length ? 'b' : 'span');
    if (!pares.length) marca.className = 'none';
    marca.textContent = pares.length ? `?${pares.join('&')}` : '  — no capability on this request';
    li.append(marca);
    const id = url.pathname.match(/asset-list-break-([a-z0-9]+)\.json/)?.[1];
    const asset = selecciones.get(id)?.assets[0];
    if (asset) {
      const nota = document.createElement('span');
      nota.className = 'wire__outcome';
      nota.textContent = `  ${desenlaceCorto(asset)}`;
      li.append(nota);
    }
    return li;
  }));
}

// Our client's own asset-list requests and not the other pane's: the off-the-
// shelf player asks for the Apple-class list on its own and never heard of the
// option, so its request carries nothing and saying so about it would be saying
// it about the wrong client.
new PerformanceObserver((list) => {
  const nuevas = list.getEntries()
    .map((e) => e.name)
    .filter((name) => name.includes('/signalling/asset-list-break-'));
  if (!nuevas.length) return;
  pedidos = [...pedidos, ...nuevas];
  pintarPedidos();
}).observe({ type: 'resource' });

// ===========================================================================
// THE ARMING
// ===========================================================================

/** What is alive right now: the two players of one arming, or null. */
let vivo = null;
let capacidadesActuales = stage.capacidades.inicial;

/**
 * A TARGET BOTH PANES CAN ACTUALLY REACH, and it exists because one of them
 * cannot reach every second of the programme.
 *
 * Measured on this page: while the off-the-shelf pane is inside a break, a write
 * to its programme clock is accepted and does nothing -- hls.js is playing the
 * linear ad and the tag says `X-RESTRICT="SKIP"`, so the programme timeline is
 * not somewhere it will move to on request. Ours has no such restriction,
 * because nothing was replaced in the first place (ADR 0016). So a target
 * INSIDE a break moves one pane and leaves the other, and the pair ends up
 * ninety seconds apart, which is the one state this page must never be in.
 *
 * A target inside a break therefore becomes the head of that break, with the
 * same lead-in the jump buttons use. That is not a fallback that loses
 * something: flipping the switch in the middle of a break and having the break
 * start again from the top is how the two formats of the same ad get compared,
 * which is what the switch is for.
 */
const ENTRADA = 5;

/**
 * HOW FAR APART THE TWO CLOCKS MAY BE AND STILL BE THE SAME SECOND. It is the
 * tolerance of every read-back on this page -- the one after a write and the one
 * after a scrub -- because both ask the same question: did the other pane take
 * the second we asked for. The programme keeps running between the write and the
 * read, so the answer is never an equality.
 */
const TOLERANCIA = 1.5;

function objetivoSeguro(segundo) {
  // Only the breaks the off-the-shelf pane plays: the one with no linear default
  // (ADR 0087) has no Apple-class tag, so for that pane it is plain programme.
  for (const brk of stage.breaks.filter((b) => b.lineal)) {
    if (segundo >= brk.offset && segundo < brk.offset + brk.duracion) {
      return Math.max(0.05, brk.offset - ENTRADA);
    }
  }
  return segundo;
}

/** The programme second both panes are at, asked of whichever one can answer. */
function segundoDelPrograma() {
  if (!vivo) return 0;
  const nuestro = vivo.video.currentTime;
  return Number.isFinite(nuestro) ? nuestro : 0;
}

function derribar() {
  if (!vivo) return;
  // Both instances, because both were built by the same call. `destroy()` is
  // what hls.js offers; the library has no teardown of its own, so what is left
  // of an arming is cleared by replacing the DOM the composition was drawn into.
  vivo.hls.destroy();
  vivo.stock.hls.destroy();
  panes.stock.caja.replaceChildren();
  panes.demo.caja.replaceChildren();
  vivo = null;
}

/**
 * A SEEK THAT IS CHECKED AFTERWARDS, and it is checked because a seek written
 * too early is accepted and dropped without a word.
 *
 * Measured on this page: right after a rebuild, `interstitialsManager.primary`
 * of the off-the-shelf pane already exists, the write returns without throwing,
 * the property goes on reporting the old second, and the pane stays where it
 * was. Our pane took the same write and moved, so the two ended up a minute
 * apart -- which is exactly the failure this pair cannot have. Waiting for one
 * more readiness flag would be guessing at which one; reading back what was
 * written is the property that matters, and it is the same on both sides.
 *
 * The write is asynchronous, so the read-back is a quarter of a second later,
 * and the tolerance is `TOLERANCIA` because the programme keeps running between
 * the write and the read. It gives up after twenty attempts rather than for
 * ever: a target INSIDE a break is one the other pane's programme clock
 * legitimately cannot reach -- it holds at the second the break began -- and a
 * seek that cannot land must not turn into a loop. Giving up CALLS BACK, and
 * that is not bookkeeping: a seek that never landed is the pair silently an
 * unknown distance apart, which is the one state this page must not be in
 * without saying so.
 */
function buscar(listo, leer, escribir, objetivo, intentos = 20, alAgotar = null) {
  if (intentos <= 0) { alAgotar?.(); return; }
  if (!listo()) {
    setTimeout(() => buscar(listo, leer, escribir, objetivo, intentos - 1, alAgotar), 50);
    return;
  }
  escribir(objetivo);
  setTimeout(() => {
    if (Math.abs(leer() - objetivo) > TOLERANCIA) {
      buscar(listo, leer, escribir, objetivo, intentos - 1, alAgotar);
    }
  }, 250);
}

/**
 * PUT BOTH PANES AT THE SAME SECOND OF THE PROGRAMME, which is the invariant of
 * this page: two players of the same film a minute apart argue nothing.
 *
 * Ours is the element's own clock, because here the programme is never stopped
 * (ADR 0016). The other pane's is not the element's: during a break hls.js
 * chooses between two append strategies and the element reports a different
 * thing in each, so what is written is `interstitialsManager.primary` through
 * the facade `stock-player.js` already builds for its own bar. The header of
 * that file has the measurement.
 */
function irA(segundo) {
  if (!vivo || segundo <= 0) return;
  const { video, stock, stockVideo, crudo } = vivo;
  buscar(
    () => video.readyState >= 1,
    () => video.currentTime,
    (s) => { crudo.nuestro(s); video.play().catch(() => {}); },
    segundo
  );
  buscar(
    () => stock.hls.interstitialsManager?.primary != null && stockVideo.readyState >= 1,
    () => stock.programme.currentTime,
    (s) => { crudo.otro(s); },
    segundo,
    20,
    () => console.warn(`[app] the off-the-shelf pane never took ${segundo.toFixed(2)}s: ` +
      `it is at ${stock.programme.currentTime.toFixed(2)}s and the pair is NOT at the same second`)
  );
}

// ===========================================================================
// THE TWO BARS ARE ONE BAR, AND WHICHEVER ONE IS DRAGGED MOVES BOTH PANES
// ===========================================================================
// Asked for after the page was already published: a scrub on either bar has to
// leave both panes showing the same moment of the programme, so that what one
// format of the break does and what the other does can be compared at any
// second and not only at the four the jump buttons offer.
//
// WHERE IT IS TIED, AND WHY THERE. The chrome commits a scrub by writing ONE
// property, on release: `video.currentTime` for our pane -- the media element
// itself -- and `programme.currentTime` for the off-the-shelf pane, the facade
// `stock-player.js` hands to `attachControls`. So the two writes are the whole
// of the surface, and the tie is an accessor put over each of them for the life
// of one arming. Nothing in `lib/` is touched, no event is invented, and the
// bar goes on being the only thing that decides what a press on it means.
//
// IT IS THE RELEASE AND NOT THE DRAG, and that falls out of the same place: the
// chrome writes on `pointerup` and paints the knob off its own pointer until
// then (ADR 0033). So the other pane is not dragged along frame by frame, which
// would be a second player seeking twenty times in one gesture.
//
// THE PART THAT IS NOT PLUMBING: A SEEK OF THE OFF-THE-SHELF PANE ONLY LANDS
// WHILE THAT PANE IS OUTSIDE A BREAK. The measurement is in the header of
// `buscar()` above and in T-07: inside a break the write to
// `interstitialsManager.primary.currentTime` is accepted, throws nothing, and
// does nothing -- hls.js is playing the linear ad and the tag carries
// `X-RESTRICT="SKIP"`. Ours has no such restriction (ADR 0016), so a naive tie
// would move one pane and leave the other, and T-07 measured that state at
// 90.79 s apart. Three things answer it, and each one answers a different half:
//
//   A TARGET INSIDE A BREAK becomes the head of that break, `objetivoSeguro`,
//   which is what the switch and the jump buttons already do with one. It is a
//   second the other pane's programme clock cannot sit at, so it is not a
//   target for a PAIR.
//
//   A SCRUB WHILE THE OFF-THE-SHELF PANE IS IN A BREAK rebuilds both, which is
//   T-07's mechanism and the only one that is known to land: after a rebuild
//   both panes are at the head of the programme and outside every break. It is
//   asked of the pane itself -- `playingAd`, its own interstitials manager --
//   and not worked out from the clock. This is the expensive path and it is
//   taken on one gesture in fifteen: the three breaks are 36 s of a 180 s
//   programme.
//
//   AND EVERY CHEAP SEEK IS READ BACK, because the two above are reasons to
//   expect a landing and not proof of one. If the off-the-shelf pane is not
//   within `TOLERANCIA` of the target a beat later, the page rebuilds anyway
//   rather than leave a pair that looks tied and is not. A failure that gets as
//   far as the rebuild not working says so in the console, from `irA`.
//
// WHAT IS LEFT OVER, said rather than hidden: a scrub to a second inside a
// break lands at the head of that break instead, and a scrub taken during a
// break costs a rebuild, which is visibly a rebuild. Both are on screen.

/** Off, the two bars move their own pane and nothing else: the page as it was. */
let enlaceActivo = true;

/** The last tie, for the console and for the measurement: what was asked, what
 *  was aimed at, which path was taken, and how far apart the two ended up. */
let ultimoEnlace = null;

/**
 * Put an accessor over the one property each bar writes, and hand back the two
 * RAW writers.
 *
 * TWO THINGS SAY THAT A WRITE IS A SCRUB, AND THE WRITE IS ONLY ONE OF THEM.
 * The accessor gives the SECOND being asked for, which is the library's own
 * number and must not be worked out a second time on this side; the pointer
 * gives the fact that a person asked for it. Both are needed, and the second one
 * is not caution: measured here, hls.js writes `currentTime` on the media
 * element by itself -- on a rebuild, at the position it starts a level at -- and
 * an accessor on its own takes those writes for a gesture. The first version of
 * this did, and the trace showed the tie firing a second time, with no bar
 * touched, right after a rebuild.
 *
 * So the window is opened by a `pointerup` ON THE BAR, in the capture phase so
 * it is open before the chrome's own handler runs, and the write that follows
 * within `VENTANA_DEL_GESTO` is that gesture's. The listener is on the container
 * and asks `closest()`, which is what makes it independent of WHEN the chrome
 * is built -- our pane's is built on `MEDIA_ATTACHED`, which has not happened
 * yet when this runs.
 *
 * Everything on this page that moves the pair on purpose -- `irA`, and so the
 * switch, the jump buttons and the tie itself -- writes through the raw writers
 * and never through the accessors, so no gesture window can be open around it.
 */
const VENTANA_DEL_GESTO = 250;

function instalarEnlace(video, programme, cajas, alSoltar) {
  const delElemento = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime');
  const delPrograma = Object.getOwnPropertyDescriptor(programme, 'currentTime');
  const crudo = {
    nuestro: (s) => delElemento.set.call(video, s),
    otro: (s) => delPrograma.set.call(programme, s)
  };
  const soltado = { demo: 0, stock: 0 };

  for (const [lado, caja] of Object.entries(cajas)) {
    caja.addEventListener('pointerup', (evento) => {
      if (evento.target?.closest?.('.qa-track')) soltado[lado] = performance.now();
    }, true);
    // A bar that is not there is a tie that quietly does nothing, and a demo
    // whose two halves drift apart on stage with no warning is the thing this
    // whole file is against. `.qa-track` is the chrome's, so the day it is
    // renamed this line is what says so.
    setTimeout(() => {
      if (!caja.querySelector('.qa-track')) {
        console.warn(`[app] no bar found in the ${lado} pane: the two bars are NOT tied`);
      }
    }, 5000);
  }

  const escribe = (lado, crudoDelLado) => (s) => {
    const esGesto = enlaceActivo && performance.now() - soltado[lado] < VENTANA_DEL_GESTO;
    if (esGesto) alSoltar(lado, s);
    else crudoDelLado(s);
  };

  Object.defineProperty(video, 'currentTime', {
    configurable: true,
    get: () => delElemento.get.call(video),
    set: escribe('demo', crudo.nuestro)
  });
  Object.defineProperty(programme, 'currentTime', {
    configurable: true,
    get: () => delPrograma.get.call(programme),
    set: escribe('stock', crudo.otro)
  });
  return crudo;
}

/** A scrub, from whichever bar: one target, both panes, and the path recorded. */
function enlazar(origen, pedido) {
  if (!vivo) return;
  const objetivo = objetivoSeguro(pedido);
  const enBreak = vivo.stock.playingAd != null;
  ultimoEnlace = { origen, pedido, objetivo, camino: enBreak ? 'rearmado' : 'directo', delta: null };
  if (enBreak) {
    console.log(`[app] scrub from the ${origen} bar to ${objetivo.toFixed(2)}s while the ` +
      'off-the-shelf pane is inside a break: it cannot take a seek there, so both are rebuilt');
    armar(capacidadesActuales, objetivo);
    return;
  }
  vivo.crudo.nuestro(objetivo);
  vivo.video.play().catch(() => {});
  vivo.crudo.otro(objetivo);
  const registro = ultimoEnlace;
  setTimeout(() => {
    if (!vivo || ultimoEnlace !== registro) return;
    registro.delta = Math.abs(vivo.stock.programme.currentTime - objetivo);
    if (registro.delta <= TOLERANCIA) return;
    registro.camino = 'directo, no entró → rearmado';
    console.log(`[app] the off-the-shelf pane did not take ${objetivo.toFixed(2)}s ` +
      `(it is at ${vivo.stock.programme.currentTime.toFixed(2)}s): both are rebuilt`);
    armar(capacidadesActuales, objetivo);
  }, 400);
}

/**
 * ONE AUDIO AT A TIME, and it is the page that arbitrates it because it is the
 * page that has two players. Both panes carry the same chrome and the audio
 * control of that chrome is one of its four buttons, so both work and whichever
 * one is lifted last owns the sound. The page starts both muted so the autoplay
 * policy lets the recording begin, and the audio of the composition is the demo
 * pane's (ADR 0014).
 */
function unSoloAudio(elementos) {
  for (const elemento of elementos) {
    elemento.addEventListener('volumechange', () => {
      if (elemento.muted) return;
      for (const otro of elementos) if (otro !== elemento) otro.muted = true;
    });
  }
}

/** The media of the ad, off the contract: the field the step actually moves. */
function medios(activas) {
  // A linear default declares no medium of its own: it is the asset's `URI`
  // played full frame (ADR 0019), so it is named for what it is.
  const tipos = activas
    .flatMap((e) => e.elements.map((el) => ({ el, lineal: e.type === 'linear' })))
    .filter(({ el }) => !el.primary)
    .map(({ el, lineal }) => el.mediaType || (lineal ? 'the linear default, full frame' : 'unknown'));
  return [...new Set(tipos)].join(', ');
}

function armar(capacidades, retomarEn = 0) {
  capacidadesActuales = capacidades;

  derribar();
  pedidos = [];
  selecciones.clear();
  pintarPedidos();

  const nuestro = construirCaja(panes.demo.caja);
  const otro = construirCaja(panes.stock.caja);
  const video = nuestro.video;

  // =========================================================================
  // WHAT AN INTEGRATOR WRITES  (with the <script src> of index.html and the
  // container this page hands over). Everything between the two fences exists
  // because the library exists; the rest of this file exists because this page
  // is a demo of a pair with a switch.
  const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
  const concurrent = QualabsConcurrentHls.attach(hls, {
    container: nuestro.player,
    // The one option of this block that the four earlier demos do not have:
    // what the device can draw, one axis at a time (ADR 0086).
    capabilities: capacidades,
    onResolved: (experiences, seleccion) => {
      for (const e of experiences) {
        console.log(`[app] resolved ${e.type}#${e.itemId}: ${e.elements.length} elements,` +
          ` window ${e.startTime.toFixed(2)}s -> ${(e.startTime + e.duration).toFixed(2)}s`);
      }
      selecciones.set(breakDelReporte(seleccion), seleccion);
      pintarPedidos();
    }
  });
  hls.loadSource(SRC);
  hls.attachMedia(video);
  // =========================================================================

  // The contract, printed: the line of text under the player and the table in
  // the console, which is what makes a recording auditable. It reads exactly
  // what the renderer inside the library reads, and neither knows about the
  // other.
  const consumer = traceContract({
    provider: concurrent.provider, video, hud: panes.demo.contract
  });

  hls.on(Hls.Events.ERROR, (_e, d) => {
    console.error('[hls] error', d.type, d.details, 'fatal:', d.fatal);
  });

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    // The check is cheap and it is the whole point of the configuration above,
    // so it is on the page rather than in a comment.
    const off = hls.interstitialsManager == null;
    panes.demo.hud.textContent =
      `hls.js ${Hls.version} · interstitials manager: ${off ? 'none' : 'PRESENT'} · ` +
      `capabilities: ${JSON.stringify(capacidades)} · playing ${SRC}`;
  });

  video.muted = true;
  video.play().catch(() => {});

  // The other half of the compatibility pair (ADR 0007): a client that is
  // already in the market, on the SAME playlist -- `SRC`, the same constant,
  // which is the whole argument -- and with none of the above wired into it.
  const stock = createStockPlayer({
    video: otro.video,
    container: otro.player,
    src: SRC,
    pane: panes.stock.pane,
    state: panes.stock.state,
    hud: panes.stock.hud
  });

  unSoloAudio([video, otro.video]);

  /**
   * The demo pane's label, the mirror of the one the off-the-shelf player paints
   * for itself, read off the contract -- `activeAt` and nothing else, the same
   * thing every consumer of the seam gets.
   *
   * IT NAMES THE MEDIUM OF THE AD because that is the one field the switch
   * moves, and it reads it rather than deriving it from the switch: with two
   * decoders the library keeps the option in video, with one the option as
   * `image/svg+xml`, in another layout and of the same campaign (ADR 0088). If the line ever says the medium the step asked for
   * while the composition is drawing another, that is the page lying and it
   * would not show any other way.
   */
  function pintarDemo() {
    const activas = concurrent.provider.activeAt(video.currentTime);
    panes.demo.pane.dataset.state = activas.length ? 'ad' : 'primary';
    panes.demo.state.textContent = activas.length
      ? `primary content + NON-LINEAR AD (${activas.map((e) => e.type).join(', ')})` +
        ` · ${video.currentTime.toFixed(1)}s · nothing was replaced` +
        ` · ad media: ${medios(activas)}`
      : `primary content · ${video.currentTime.toFixed(1)}s`;
  }
  video.addEventListener('timeupdate', pintarDemo);
  pintarDemo();

  // The tie of the two bars, over the two properties the chrome writes, and the
  // raw writers everything else on this page moves the pair with. It goes on the
  // objects of THIS arming, so a rebuild takes the old pair's accessors down
  // with the old pair.
  const crudo = instalarEnlace(
    video, stock.programme, { demo: nuestro.player, stock: otro.player }, enlazar);

  vivo = {
    hls, concurrent, consumer, video, stock, stockVideo: otro.video, capacidades, src: SRC, crudo
  };
  irA(objetivoSeguro(retomarEn));

  // For the console, for the measurements of this task, and for whoever comes
  // next. It is replaced on every arming, so it always points at what is alive.
  window.demo = {
    get hls() { return vivo.hls; },
    get video() { return vivo.video; },
    get concurrent() { return vivo.concurrent; },
    get provider() { return vivo.concurrent.provider; },
    get renderer() { return vivo.concurrent.renderer; },
    get layer() { return vivo.concurrent.layer; },
    get stock() { return vivo.stock; },
    get capacidades() { return vivo.capacidades; },
    get selecciones() { return Object.fromEntries(selecciones); },
    get src() { return vivo.src; },
    get pedidos() { return [...pedidos]; },
    stage,
    armar: (capacidades, retomarEn) => armar(capacidades, retomarEn),
    irA,
    // The tie of the two bars: what the last scrub did, and the switch that
    // turns the tie off. The switch is what a measurement of the tie needs and
    // could not build from outside -- a number that is small with the tie on
    // means nothing until the same measurement comes out big with it off.
    get ultimoEnlace() { return ultimoEnlace; },
    get enlace() { return enlaceActivo; },
    set enlace(valor) { enlaceActivo = !!valor; }
  };
}

// ===========================================================================
// THE SWITCH AND THE JUMPS
// ===========================================================================

const control = crearControl({
  contenedor: document.getElementById('steps'),
  salida: document.getElementById('step-out'),
  stage,
  alCambiar: (capacidades) => armar(capacidades, segundoDelPrograma())
});

// The jumps, so a break can be reached without waiting for it: the event gives
// about two minutes for everything and the first break is at twenty seconds.
// Five seconds of programme before each one, because what is worth seeing is the
// transition INTO the break and not the break already on screen.
//
// A JUMP REBUILDS, exactly like a change of the switch, and it is the same reason: a
// seek of the off-the-shelf pane only lands while that pane is outside a break,
// and after a rebuild both panes are at the head of the programme and outside
// every one of them. One mechanism for every movement of the pair is what makes
// the invariant hold without a special case that somebody has to remember.
const jumps = document.getElementById('jumps');
jumps.replaceChildren(...[
  { texto: 'start', segundo: 0.05 },
  ...stage.breaks.map((b) => ({
    texto: `break ${b.id.toUpperCase()}`,
    segundo: Math.max(0.05, b.offset - ENTRADA)
  }))
].map(({ texto, segundo }) => {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'jump';
  boton.textContent = texto;
  boton.addEventListener('click', () => armar(capacidadesActuales, segundo));
  return boton;
}));

armar(control.actual());
