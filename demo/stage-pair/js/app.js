// app.js -- the pair of players of index.html, and the switch that says how many
// video decoders the device has.
//
// This file is three things, and it marks which is which.
//
// THE FIRST IS WHAT AN INTEGRATOR WRITES, and it is the block fenced inside
// `armar()`: the library arrives as a <script src> that defines a global, the
// page builds its own hls.js instance with the one configuration the library
// hands over, and turns the concurrent experience on over a container. That is
// the surface of ADR 0015, and the fence is there so it can be counted. The only
// thing this page adds to it that `demo/compatibility-pair/` does not is one
// option, `decoderCount`, which is already documented in
// `docs/integrating-the-library.md`.
//
// THE SECOND IS THE ARGUMENT OF THE PAGE: the off-the-shelf player of the
// compatibility pair, the trace of the contract under the player and in the
// console, and the label of each pane. None of it is plumbing the library needs.
//
// THE THIRD IS THE SWITCH, and it is the only piece of this demo that does not
// exist in the four that came before.
//
// ============================================================================
// WHY CHANGING THE STEP REBUILDS BOTH PLAYERS, AND WHY BOTH
// ============================================================================
// `decoderCount` is read ONCE, when the signalling is created, and the reason is
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
// WHAT THE STEP CHOOSES is two things at once and they are the two halves of
// ADR 0083: the VALUE handed to `attach()`, which is what puts
// `qa-decoder-count` on the asset-list request -- or leaves it off, in the step
// that declares nothing -- and the PLAYLIST that is loaded, which is how a demo
// served as static files out of a bucket answers a parameter with no server
// behind it. The response is baked by value, one playlist per step, and the
// switch is the `if`.
//
// One thing the page does NOT do is tell the two panes apart by the step. Both
// load the same playlist, always, which is the whole claim of the pair; the
// Apple-class tag is byte for byte the same in the rich playlist and in the lean
// one, so the off-the-shelf pane plays the same twelve seconds in every step.

import { traceContract } from './contract-trace.js';
import { createStockPlayer } from './stock-player.js';

// The one source of the numbers of this demo (ADR 0044). The steps, the
// playlists, the name of the parameter and the three breaks all come from here;
// not one of them is typed in this file.
const stage = await (await fetch('/stage.json')).json();

const PARAMETRO = stage.decodificadores.parametro;
const POSICIONES = stage.decodificadores.posiciones;
const PLAYLIST = {
  rica: `/${stage.playlists.rica}`,
  magra: `/${stage.playlists.magra}`
};

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
// the parameter shown is on the request or it is not on the page. A page that
// printed the step it had just been handed would be reporting its own intention,
// which is the one thing on this page that nobody needs told.
const listaPedidos = document.getElementById('wire-list');
let pedidos = [];

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
    const valor = url.searchParams.get(PARAMETRO);
    const li = document.createElement('li');
    li.append(url.pathname);
    if (valor === null) {
      const nota = document.createElement('span');
      nota.className = 'none';
      nota.textContent = `  — no ${PARAMETRO} on this request`;
      li.append(nota);
    } else {
      const marca = document.createElement('b');
      marca.textContent = `?${PARAMETRO}=${valor}`;
      li.append(marca);
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
let posicionActual = 0;

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

function objetivoSeguro(segundo) {
  for (const brk of stage.breaks) {
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
 * and the tolerance is 1.5 s because the programme keeps running between the
 * write and the read. It gives up after twenty attempts rather than for ever:
 * a target INSIDE a break is one the other pane's programme clock legitimately
 * cannot reach -- it holds at the second the break began -- and a seek that
 * cannot land must not turn into a loop.
 */
function buscar(listo, leer, escribir, objetivo, intentos = 20) {
  if (intentos <= 0) return;
  if (!listo()) { setTimeout(() => buscar(listo, leer, escribir, objetivo, intentos - 1), 50); return; }
  escribir(objetivo);
  setTimeout(() => {
    if (Math.abs(leer() - objetivo) > 1.5) buscar(listo, leer, escribir, objetivo, intentos - 1);
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
  const { video, stock, stockVideo } = vivo;
  buscar(
    () => video.readyState >= 1,
    () => video.currentTime,
    (s) => { video.currentTime = s; video.play().catch(() => {}); },
    segundo
  );
  buscar(
    () => stock.hls.interstitialsManager?.primary != null && stockVideo.readyState >= 1,
    () => stock.programme.currentTime,
    (s) => { stock.programme.currentTime = s; },
    segundo
  );
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
  const tipos = activas
    .flatMap((e) => e.elements)
    .filter((el) => !el.primary)
    .map((el) => el.mediaType || 'unknown');
  return [...new Set(tipos)].join(', ');
}

function armar(indice, retomarEn = 0) {
  const posicion = POSICIONES[indice];
  const SRC = PLAYLIST[posicion.respuesta];
  posicionActual = indice;

  derribar();
  pedidos = [];
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
    onResolved: (experiences) => {
      for (const e of experiences) {
        console.log(`[app] resolved ${e.type}#${e.itemId}: ${e.elements.length} elements,` +
          ` window ${e.startTime.toFixed(2)}s -> ${(e.startTime + e.duration).toFixed(2)}s`);
      }
    },
    // The one line of this block that the four earlier demos do not have. A
    // `null` is not "zero decoders" and it is not a placeholder: it is the
    // supported state in which nothing is added to the request and it goes out
    // exactly as it goes out for an integrator who never heard of the option
    // (`usableDecoderCount`, in lib/signalling.js).
    decoderCount: posicion.valor
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
    const declarado = posicion.valor == null ? 'not declared' : String(posicion.valor);
    panes.demo.hud.textContent =
      `hls.js ${Hls.version} · interstitials manager: ${off ? 'none' : 'PRESENT'} · ` +
      `decoderCount: ${declarado} · playing ${SRC}`;
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
   * moves, and it reads it rather than deriving it from the step: with two
   * decoders the elements come back as media playlists, with one as
   * `image/svg+xml`, and the layout, the campaign and the duration are the same
   * in both (ADR 0084). If the line ever says the medium the step asked for
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

  vivo = { hls, concurrent, consumer, video, stock, stockVideo: otro.video, posicion, src: SRC };
  irA(objetivoSeguro(retomarEn));
  pintarPasos();

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
    get posicion() { return vivo.posicion; },
    get src() { return vivo.src; },
    get pedidos() { return [...pedidos]; },
    stage,
    armar: (indice, retomarEn) => armar(indice, retomarEn),
    irA
  };
}

// ===========================================================================
// THE SWITCH AND THE JUMPS
// ===========================================================================

const pasos = document.getElementById('steps');
const salida = document.getElementById('step-out');

const etiqueta = (p) => (p.valor == null ? 'not declared' : `${p.valor}`);

const botones = POSICIONES.map((posicion, indice) => {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'step';
  boton.textContent = etiqueta(posicion);
  boton.addEventListener('click', () => armar(indice, segundoDelPrograma()));
  return boton;
});
pasos.replaceChildren(...botones);

function pintarPasos() {
  const posicion = POSICIONES[posicionActual];
  botones.forEach((b, i) => b.setAttribute('aria-pressed', String(i === posicionActual)));
  salida.textContent = posicion.valor == null
    ? `request goes out without ${PARAMETRO} → the rich answer: the ad in video`
    : `request carries ${PARAMETRO}=${posicion.valor} → the ` +
      (posicion.respuesta === 'rica' ? 'rich answer: the ad in video' : 'lean answer: the same ad as image/svg+xml');
}

// The jumps, so a break can be reached without waiting for it: the event gives
// about two minutes for everything and the first break is at twenty seconds.
// Five seconds of programme before each one, because what is worth seeing is the
// transition INTO the break and not the break already on screen.
//
// A JUMP REBUILDS, exactly like a change of step, and it is the same reason: a
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
  boton.addEventListener('click', () => armar(posicionActual, segundo));
  return boton;
}));

armar(0);
