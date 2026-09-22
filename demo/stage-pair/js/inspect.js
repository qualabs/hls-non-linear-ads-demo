// inspect.js -- the single player of inspect.html, and the three moves of the
// exchange drawn beside it.
//
// THE PAGE SHOWS THREE THINGS AND READS ALL THREE. The ranges come out of the
// playlist the player is playing, the request comes off the performance
// timeline, and the body comes from that same URL. Not one of them is a string
// in this file, and that is the rule of the page rather than a nicety: a tag
// pasted into the markup would be an illustration, and the audience of this demo
// reads playlists for a living. Besides which the START-DATE is resolved against
// the EXT-X-PROGRAM-DATE-TIME of the packaging (ADR 0005), so a transcribed tag
// is wrong the next time the content is packaged.
//
// AND THAT IS CHECKED AND NOT DECLARED: `test/verificar-inspect.py` moves the
// source -- it rewrites the lists with another duration, which moves both the
// PLANNED-DURATION of the tag and the `duration` of the list -- and asserts that
// what is on screen moved with it. A page that pasted its tag would pass every
// comparison against the disk on the day it was written and fail that one.
//
// ============================================================================
// WHAT THIS FILE HAS THAT app.js DOES NOT, AND WHAT IT DELIBERATELY DROPS
// ============================================================================
// It drops the off-the-shelf pane, which is the whole reason this page exists:
// with one player there is half as much on the network tab and the thing being
// pointed at is the thing being explained. Everything that belonged to the pair
// -- the second player, the arbitration of one audio between two, the target
// that both panes can reach -- goes with it, and what is left is short.
//
// It adds the three moves, and the one piece of judgement in them is HOW A RANGE
// IS MARKED AS THE ONE THIS CLIENT KEPT. It is not marked by comparing its CLASS
// against a string written here: it is marked because THIS CLIENT ASKED FOR THE
// LIST THAT RANGE POINTS AT. The evidence is the request on the network, which
// is the same evidence move 2 is showing one card below, so the page cannot
// claim a client behaviour it did not observe. Before the requests are in, the
// ranges are drawn unmarked rather than guessed at.
//
// ============================================================================
// WHY THE STEP REBUILDS AND THE JUMP DOES NOT
// ============================================================================
// `decoderCount` is read ONCE, when the signalling is created (`createSignalling`
// in lib/signalling.js), with the argument written where it is read: what that
// value can be wrong about is a statement of the integrator, and that is one
// statement and not one per break. So there is no in-flight way to change it and
// rebuilding is not a detour around the contract -- it IS the contract.
//
// A jump is a different thing here and it is worth saying why, because on
// `index.html` a jump rebuilds too. There the reason was the OTHER pane: a write
// to its programme clock while it is inside a break is accepted and dropped, so
// the pair would end up ninety seconds apart. This page has no other pane, and
// ours has no such restriction because nothing was ever replaced (ADR 0016). So
// a jump is a seek, which is faster in a room with two minutes in it.
//
// What survives from that measurement is the READ-BACK: a write made too early
// is accepted, throws nothing, and is silently lost. So the seek writes, reads
// what it wrote a quarter of a second later, and tries again if it did not land.

import { traceContract } from './contract-trace.js';

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

/** Five seconds of programme before a break: the transition in is what is worth seeing. */
const ENTRADA = 5;

const dom = {
  slot: document.getElementById('slot'),
  pane: document.getElementById('pane'),
  state: document.getElementById('state'),
  hud: document.getElementById('hud'),
  contract: document.getElementById('contract'),
  which: document.getElementById('which'),
  ranges: document.getElementById('ranges'),
  request: document.getElementById('request'),
  answerLede: document.getElementById('answer-lede'),
  answer: document.getElementById('answer')
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

// ===========================================================================
// WHAT THE PLAYLIST SAID  (move 1)
// ===========================================================================

/**
 * The Date Range lines of the playlist being played, by the break they belong
 * to.
 *
 * The pairing is by the ID the line carries -- `AD-A-LINEAR` and
 * `AD-A-CONCURRENT` for the break whose id is `a` in `stage.json` -- and not by
 * the order the lines appear in, because order is an accident of how the file
 * was written and the id is what the signalling declares.
 */
let rangosPorBreak = new Map();

async function leerRangos(src) {
  rangosPorBreak = new Map();
  const playlist = await (await fetch(src)).text();
  const lineas = playlist.split('\n').filter((l) => l.startsWith('#EXT-X-DATERANGE:'));
  for (const brk of stage.breaks) {
    const prefijo = `ID="AD-${brk.id.toUpperCase()}-`;
    rangosPorBreak.set(brk.id, lineas.filter((l) => l.includes(prefijo)));
  }
}

/** The URL a range points at, which is what pairs it with a request on the network. */
const listaDelRango = (linea) => linea.match(/X-ASSET-LIST="([^"]+)"/)?.[1] ?? null;

/**
 * One range, wrapped on its commas.
 *
 * Wrapped because the real line is one long tag and a horizontal scrollbar is a
 * worse way to read something off a projector than four short lines. The value
 * of a quoted attribute is never split: `X-SNAP="OUT,IN"` carries a comma inside
 * itself, so the break is only taken where the next thing is another attribute
 * name.
 */
function dibujarRango(linea, pedida) {
  const caja = el('div', 'range');
  caja.dataset.kept = String(pedida === true);
  const clase = linea.match(/CLASS="([^"]+)"/)?.[1] ?? '(no class)';
  const marca = pedida === null
    ? 'waiting for this client to ask'
    : pedida
      ? 'THIS CLIENT KEPT IT — it asked for the list below'
      : 'this client ignored it — no request for its list went out';
  caja.append(
    el('p', 'range__class', clase),
    el('p', 'range__mark', marca),
    el('pre', 'range__line', linea.replace(/,(?=[A-Z0-9-]+=)/g, ',\n  '))
  );
  return caja;
}

// ===========================================================================
// WHAT WENT OUT, AND WHAT CAME BACK  (moves 2 and 3)
// ===========================================================================
// The requests are READ off the performance timeline: what is printed is the URL
// the browser actually fetched, which is the same string the network tab shows.
// A page that printed the step it had just been handed would be reporting its
// own intention, which is the one thing on this page nobody needs told.
//
// AND THE BODY IS FETCHED FROM THAT SAME URL, not from a path this file builds:
// whatever query the library put on it travels, so what is on screen is the
// answer to the request on screen. The fetch lands on the timeline too, which is
// why what is kept is a MAP KEYED BY URL -- a second sighting of a URL already
// seen is dropped, and without that the observer would feed itself for ever.

/** break id -> { url, cuerpo }, the request this client made and its answer. */
const intercambio = new Map();

const breakDeLaUrl = (url) => url.match(/asset-list-break-([a-z0-9]+)-/)?.[1] ?? null;

const vistas = new Set();

async function anotarPedido(href) {
  if (vistas.has(href)) return;
  vistas.add(href);
  const id = breakDeLaUrl(href);
  if (!id) return;
  const url = new URL(href);
  intercambio.set(id, { url, cuerpo: null });
  pintarIntercambio();
  try {
    intercambio.set(id, { url, cuerpo: await (await fetch(href)).text() });
  } catch (error) {
    intercambio.set(id, { url, cuerpo: `could not read the answer: ${error.message}` });
    console.error('[page] the answer could not be read', error);
  }
  pintarIntercambio();
}

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name.includes('/signalling/asset-list-break-')) anotarPedido(entry.name);
  }
}).observe({ type: 'resource' });

/**
 * What the answer is made of, read off the answer itself.
 *
 * Every number here is taken from the body that came back and not from the step
 * that was asked for. If the line ever says the medium the switch requested
 * while the list on screen declares another, that is the page lying and it would
 * not show any other way.
 */
function resumenDeLaRespuesta(cuerpo) {
  let lista;
  try {
    lista = JSON.parse(cuerpo);
  } catch {
    return 'the answer is not JSON';
  }
  const assets = Array.isArray(lista?.ASSETS) ? lista.ASSETS : [];
  const items = assets.flatMap((a) => a?.['X-AD-CREATIVE-SIGNALING']?.payload ?? []);
  const cajas = items.flatMap((i) => i?.layout?.assets ?? []);
  const partes = [`${assets.length} asset${assets.length === 1 ? '' : 's'}`];
  const layouts = [...new Set(items.map((i) => i?.type).filter(Boolean))];
  if (layouts.length) partes.push(layouts.join(', '));
  const medios = [...new Set(cajas.map((c) => c?.type).filter(Boolean))];
  if (medios.length) partes.push(medios.join(', '));
  const duraciones = [...new Set(items.map((i) => i?.duration).filter((d) => d != null))];
  if (duraciones.length) partes.push(`${duraciones.join(', ')} s`);
  return partes.join(' · ');
}

// ===========================================================================
// WHICH BREAK IS ON SCREEN
// ===========================================================================
// One break at a time in the three moves, because the three have to describe the
// same thing or the column stops being one exchange. Which one is decided by the
// clock: the break being played, or the next one coming, or the last one once
// they are all behind.

function breakDelSegundo(segundo) {
  for (const brk of stage.breaks) if (segundo < brk.offset + brk.duracion) return brk;
  return stage.breaks[stage.breaks.length - 1];
}

let mostrado = null;

function pintarIntercambio() {
  if (!mostrado) return;
  const traza = intercambio.get(mostrado.id);

  // Move 1: the ranges, each marked by whether this client asked for its list.
  const rangos = rangosPorBreak.get(mostrado.id) ?? [];
  dom.ranges.replaceChildren(...rangos.map((linea) => {
    if (!traza) return dibujarRango(linea, null);
    return dibujarRango(linea, traza.url.pathname === listaDelRango(linea));
  }));
  if (!rangos.length) dom.ranges.replaceChildren(el('p', 'none', 'no range for this break in the playlist'));

  // Move 2: the URL that went out, with the parameter picked out of it.
  dom.request.replaceChildren();
  if (!traza) {
    dom.request.append(el('span', 'none', 'no request for this break has gone out yet'));
  } else {
    const valor = traza.url.searchParams.get(PARAMETRO);
    dom.request.append(el('span', 'request__path', traza.url.pathname));
    dom.request.append(valor === null
      ? el('span', 'none', `  — no ${PARAMETRO} on this request`)
      : el('b', null, `?${PARAMETRO}=${valor}`));
  }

  // Move 3: the body of that same URL, verbatim.
  if (!traza || traza.cuerpo == null) {
    dom.answerLede.textContent = 'Read from the URL above, verbatim.';
    dom.answer.textContent = traza ? 'reading…' : '';
  } else {
    dom.answerLede.textContent = resumenDeLaRespuesta(traza.cuerpo);
    dom.answer.textContent = traza.cuerpo;
  }
}

function mostrarBreak(brk) {
  if (mostrado?.id === brk.id) return;
  mostrado = brk;
  dom.which.textContent =
    `Break ${brk.id.toUpperCase()} of ${stage.breaks.length} · t = ${brk.offset}s to ` +
    `${brk.offset + brk.duracion}s · ${stage.campanas[brk.campana].marca}`;
  pintarIntercambio();
}

// ===========================================================================
// THE ARMING
// ===========================================================================

/** What is alive right now, or null. */
let vivo = null;
let posicionActual = 0;

function construirCaja() {
  const player = document.createElement('div');
  player.className = 'player';
  const video = document.createElement('video');
  video.className = 'video';
  video.playsInline = true;
  video.muted = true;
  player.append(video);
  dom.slot.replaceChildren(player);
  return { player, video };
}

function derribar() {
  if (!vivo) return;
  // `destroy()` is what hls.js offers; the library has no teardown of its own,
  // so what is left of an arming is cleared by replacing the DOM the composition
  // was drawn into.
  vivo.hls.destroy();
  dom.slot.replaceChildren();
  vivo = null;
}

/**
 * A SEEK THAT IS CHECKED AFTERWARDS, because a write made too early is accepted
 * and dropped without a word. Measured on `index.html` and kept here: right
 * after a rebuild the element takes the write, reports the old second and stays
 * there. Waiting for one more readiness flag would be guessing at which one;
 * reading back what was written is the property that matters.
 */
function buscar(objetivo, intentos = 20) {
  if (!vivo || intentos <= 0) return;
  const { video } = vivo;
  if (video.readyState < 1) { setTimeout(() => buscar(objetivo, intentos - 1), 50); return; }
  video.currentTime = objetivo;
  video.play().catch(() => {});
  setTimeout(() => {
    if (vivo?.video === video && Math.abs(video.currentTime - objetivo) > 1.5) {
      buscar(objetivo, intentos - 1);
    }
  }, 250);
}

function armar(indice, retomarEn = 0) {
  const posicion = POSICIONES[indice];
  const SRC = PLAYLIST[posicion.respuesta];
  posicionActual = indice;

  derribar();
  intercambio.clear();
  vistas.clear();
  mostrado = null;
  leerRangos(SRC).then(pintarIntercambio);

  const { player, video } = construirCaja();

  // =========================================================================
  // WHAT AN INTEGRATOR WRITES  (with the <script src> of inspect.html and the
  // container this page hands over). Everything between the two fences exists
  // because the library exists; the rest of this file exists because this page
  // is an inspection of one exchange.
  const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
  const concurrent = QualabsConcurrentHls.attach(hls, {
    container: player,
    onResolved: (experiences) => {
      for (const e of experiences) {
        console.log(`[page] resolved ${e.type}#${e.itemId}: ${e.elements.length} elements,` +
          ` window ${e.startTime.toFixed(2)}s -> ${(e.startTime + e.duration).toFixed(2)}s`);
      }
    },
    // A `null` is not "zero decoders" and it is not a placeholder: it is the
    // supported state in which nothing is added to the request and it goes out
    // exactly as it goes out for an integrator who never heard of the option
    // (`usableDecoderCount`, in lib/signalling.js).
    decoderCount: posicion.valor
  });
  hls.loadSource(SRC);
  hls.attachMedia(video);
  // =========================================================================

  const consumer = traceContract({
    provider: concurrent.provider, video, hud: dom.contract
  });

  hls.on(Hls.Events.ERROR, (_e, d) => {
    console.error('[hls] error', d.type, d.details, 'fatal:', d.fatal);
  });

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    const off = hls.interstitialsManager == null;
    const declarado = posicion.valor == null ? 'not declared' : String(posicion.valor);
    dom.hud.textContent =
      `hls.js ${Hls.version} · interstitials manager: ${off ? 'none' : 'PRESENT'} · ` +
      `decoderCount: ${declarado} · playing ${SRC}`;
  });

  video.muted = true;
  video.play().catch(() => {});

  /** The live line under the picture, read off the contract and nothing else. */
  function pintar() {
    const activas = concurrent.provider.activeAt(video.currentTime);
    dom.pane.dataset.state = activas.length ? 'ad' : 'primary';
    const medios = [...new Set(activas
      .flatMap((e) => e.elements)
      .filter((caja) => !caja.primary)
      .map((caja) => caja.mediaType || 'unknown'))].join(', ');
    dom.state.textContent = activas.length
      ? `primary content + NON-LINEAR AD (${activas.map((e) => e.type).join(', ')})` +
        ` · ${video.currentTime.toFixed(1)}s · nothing was replaced · ad media: ${medios}`
      : `primary content · ${video.currentTime.toFixed(1)}s`;
    mostrarBreak(breakDelSegundo(video.currentTime));
  }
  // `timeupdate` and `seeked`, because the second is the one that keeps the line
  // honest: a seek that lands on a paused or still-buffering element fires no
  // `timeupdate`, and the line would go on reporting the second the player was
  // at before the jump. A line under the picture that disagrees with the picture
  // is worse than no line, and on a projector it is the thing being read out.
  video.addEventListener('timeupdate', pintar);
  video.addEventListener('seeked', pintar);
  pintar();

  vivo = { hls, concurrent, consumer, video, posicion, src: SRC };
  if (retomarEn > 0) buscar(retomarEn);
  pintarPasos();

  // For the console, for the measurements of this task, and for whoever comes
  // next. It is replaced on every arming, so it always points at what is alive.
  window.demo = {
    get hls() { return vivo.hls; },
    get video() { return vivo.video; },
    get concurrent() { return vivo.concurrent; },
    get provider() { return vivo.concurrent.provider; },
    get posicion() { return vivo.posicion; },
    get src() { return vivo.src; },
    get mostrado() { return mostrado?.id ?? null; },
    get intercambio() {
      return Object.fromEntries([...intercambio].map(([id, t]) => [id, { url: t.url.href, cuerpo: t.cuerpo }]));
    },
    stage,
    armar: (indice, retomarEn) => armar(indice, retomarEn),
    irA: (segundo) => buscar(segundo)
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
  boton.addEventListener('click', () => armar(indice, vivo ? vivo.video.currentTime : 0));
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

// A jump is a seek and not a rebuild, which is the one thing this page does
// differently from `index.html`: there the rebuild existed for the other pane,
// and there is no other pane here.
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
  boton.addEventListener('click', () => buscar(segundo));
  return boton;
}));

armar(0);
