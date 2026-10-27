// inspect.js -- the single player of inspect.html, and the three moves of the
// exchange drawn beside it.
//
// THE PAGE SHOWS THREE THINGS AND READS ALL THREE. The ranges come out of the
// playlist the player is playing, and the request and its answer are the ones the
// player received: our library hands them over in its report (ADR 0116), and
// hls.js, for the lists it loads itself, in its interstitial event. Nothing is
// requested a second time to be shown. Not one of them is a string in this
// file, and that is the rule of the page rather than a nicety: a tag pasted into
// the markup would be an illustration, and the audience of this demo reads
// playlists for a living. Besides which the START-DATE is resolved against
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
// And it adds a fourth move, WHAT THE LIBRARY KEPT, which is the intermediate
// step of ADR 0085 on screen: the answer carries every option of the ad, the
// same for every device, and the library keeps the first one the declared
// capability satisfies. What is drawn in that card is the report the library
// hands `onResolved`, so the page shows what the library did and not what this
// file thinks it should have done. Since ADR 0107 it is two reports: what the
// signalling HANDED the renderer, in order (`onResolved`), and what the
// renderer actually PRESENTED after any option failed to load on screen
// (`onPresented`). The "Pre-validate assets" switch (off, the library's default)
// adds the up-front check, and its requests appear in the same card.
//
// ============================================================================
// WHY THE SWITCH REBUILDS AND THE JUMP DOES NOT
// ============================================================================
// `capabilities` is read ONCE, when the signalling is created (`createSignalling`
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
import { createStockPlayer } from './stock-player.js';
import { followInterstitials } from './native-outcome.js';
import {
  PARAMETROS, breakDelReporte, crearControlDePane, desenlace, describirOpcion, leerModo, escribirModo,
  presentado
} from './capabilities.js';

// The one source of the numbers of this demo (ADR 0044). The axes of the
// switch, the playlist and the breaks all come from here; not one of them
// is typed in this file.
const stage = await (await fetch('/stage.json')).json();

// ONE PLAYLIST FOR BOTH CLIENTS, AND THE CLASS IN ITS URL (ADR 0113): the
// playlist declares `#EXT-X-DEFINE:QUERYPARAM="adclass"` and each break carries
// `CLASS="{$adclass}"`, so our library asks for it with our class and the native
// client with Apple's, and hls.js substitutes the reference while parsing.
const CLASE = {
  nativo: 'com.apple.hls.interstitial',
  ours: QualabsConcurrentHls.CONCURRENT_CLASS
};
const SRC = Object.fromEntries(Object.entries(CLASE).map(([modo, clase]) =>
  [modo, `/${stage.playlist}?${stage.parametroDeClase}=${encodeURIComponent(clase)}`]));

/**
 * Every break this page walks through, in the order of the programme: the ones
 * of `breaks`, and the traditional linear break the playlist writes with Apple's
 * class (ADR 0115), which hls.js plays in both modes (ADR 0114).
 */
const TODOS = [...stage.breaks, ...(stage.breakLineal ? [{ ...stage.breakLineal, tradicional: true, lineal: true }] : [])]
  .sort((a, b) => (a.cue === 'POST' ? Infinity : a.offset) - (b.cue === 'POST' ? Infinity : b.offset));

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
  rangesLede: document.getElementById('ranges-lede'),
  filter: document.getElementById('filter'),
  outcome: document.getElementById('outcome'),
  rol: document.getElementById('rol'),
  sub: document.getElementById('sub'),
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
 * to, and the definition of the variable its class is read from.
 *
 * The pairing is by the ID the line carries -- `AD-A` for the break whose id is
 * `a` in `stage.json` -- and not by the order the lines appear in, because order
 * is an accident of how the file was written and the id is what the signalling
 * declares.
 *
 * THE LINE IS SHOWN AS IT IS IN THE FILE, `CLASS="{$adclass}"` and all, because
 * that is what the file says and the file is the same for both clients. What
 * THIS client made of it is a second reading, and it is not this page's: it is
 * the class hls.js parsed into its own Date Range (`dateRangeDelPlayer`), which
 * is the substitution done by the client and not a guess of this file.
 */
let rangosPorBreak = new Map();
let definicion = null;

async function leerRangos(src) {
  rangosPorBreak = new Map();
  const playlist = await (await fetch(src)).text();
  const lineas = playlist.split('\n');
  definicion = lineas.find((l) => l.startsWith('#EXT-X-DEFINE:')) ?? null;
  const rangos = lineas.filter((l) => l.startsWith('#EXT-X-DATERANGE:'));
  for (const brk of TODOS) {
    const id = `ID="AD-${brk.id.toUpperCase()}"`;
    rangosPorBreak.set(brk.id, rangos.filter((l) => l.includes(id)));
  }
}

/** The class this client's hls.js parsed for a Date Range, after substitution, or null. */
function claseDelPlayer(linea) {
  const id = linea.match(/ID="([^"]+)"/)?.[1];
  const level = vivo?.hls?.levels?.[vivo.hls.currentLevel >= 0 ? vivo.hls.currentLevel : 0];
  return level?.details?.dateRanges?.[id]?.class ?? null;
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
  const escrita = linea.match(/CLASS="([^"]+)"/)?.[1] ?? '(no class)';
  const leida = claseDelPlayer(linea);
  const clase = leida && leida !== escrita ? `${escrita}  →  ${leida}  (as this client's hls.js read it)` : escrita;
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
// WHAT IS PRINTED IS THE EXCHANGE THE PLAYER HAD, AND NOT A SECOND ONE (ADR
// 0116). Each list is asked for once, by whoever plays the break, and both the
// URL and the body on screen are what that request got: a page that asked again
// would be showing an answer the player never resolved, and to an ad server a
// second request is a second impression. Two clients ask, so there are two
// sources:
//
// - A BREAK OF OURS is asked for by the library, and its report hands the answer
//   over as it was received: `response` in the second argument of `onResolved`,
//   with the URL it came from and the body verbatim.
// - A LIST hls.js LOADS ITSELF -- every break in native mode, and in our mode the
//   traditional break of the stream (ADR 0114, ADR 0115) -- is never seen by the
//   library. Its body is the one hls.js keeps on its interstitial event
//   (`assetListResponse`), which it sets BEFORE it fires ASSET_LIST_LOADED, so it
//   is there for the list hls.js then fails on too: the break without a default,
//   whose event never reaches a listener (measured, fase 15, T-20). hls.js keeps
//   it parsed and not the bytes, so it is printed re-serialised and the card says
//   so. Its URL is READ off the performance timeline, by the session id hls.js
//   writes on the request (`_HLS_primary_id`), because the event does not carry
//   it for that same list: the observer sees the request the browser made, and
//   makes none.

/** break id -> { url, cuerpo, deHls }, the request this client made and its answer. */
const intercambio = new Map();

const breakDeLaUrl = (url) => url.match(/asset-list-break-([a-z0-9]+)\.json/)?.[1] ?? null;

/** break id -> what the library kept of the answer, as `onResolved` reported it. */
const selecciones = new Map();

/** break id -> what the renderer actually presented, as `onPresented` reported it (ADR 0107). */
const presentados = new Map();

/**
 * PRE-VALIDATION, THE ONE TOGGLE THIS PAGE ADDS, and it starts OFF because that
 * is the library's default (ADR 0107): with it off nothing is requested up
 * front and the renderer's failover, which is always on, is what keeps a dead
 * option off the screen. With it on, the first request for the assets of each
 * break's options goes out when its list arrives, and card 4 shows the ones it
 * discarded. It travels in the URL as `?prevalidar=1`, like the mode.
 */
let prevalidar = new URLSearchParams(location.search).get('prevalidar') === '1';

/** What our library received for a break, off its report (ADR 0116). */
function anotarRespuesta(seleccion) {
  const { response } = seleccion;
  if (!response) return;
  intercambio.set(breakDelReporte(seleccion), { url: new URL(response.url), cuerpo: response.text, deHls: false });
}

/**
 * What hls.js DID with the breaks it plays itself (native-outcome.js): card 4
 * says the plan the list declares until this says what happened.
 */
let seguidorDeHls = null;

/**
 * Card 4 for a break hls.js plays -- every break in native mode, the traditional
 * one in both -- as the PLAN its list declares until hls.js reports the outcome:
 * its default started, or it failed to load and the break was skipped.
 * `{ texto, salteado }`.
 */
function desenlaceDeHls(brk, que, coda) {
  const o = seguidorDeHls?.outcome(brk.id) ?? null;
  if (o?.kind === 'failed') {
    return { salteado: true, texto: `The default of this break failed to load (${o.reason}), so hls.js skipped ${que} ` +
      'and the programme went on.' };
  }
  if (o?.kind === 'empty' || o?.kind === 'skipped' || !brk.lineal) {
    const sabido = o != null;
    return { salteado: sabido, texto: `The asset-list of this break has no standard part (no default), so hls.js ` +
      `${sabido ? 'skipped' : 'will skip'} ${que} and the programme goes on.` };
  }
  if (o?.kind === 'played') {
    return { salteado: false, texto: `hls.js plays ${que}: its default, the linear ad, started full frame, replacing ` +
      `the programme${coda}.` };
  }
  return { salteado: false, texto: `hls.js will play ${que} as it is, full frame, replacing the programme${coda}, ` +
    'if its default loads.' };
}

/** break id -> the interstitial event hls.js loads that break's list for, whose body it keeps. */
const eventosDeHls = new Map();

/** The body hls.js kept for a break, re-serialised, or null while it has none. */
function cuerpoDeHls(id) {
  const lista = eventosDeHls.get(id)?.assetListResponse;
  return lista ? JSON.stringify(lista, null, 2) : null;
}

/**
 * The lists THIS instance of hls.js asks for: the URL off the timeline, the body
 * off its event. The id of its session is on every request it makes, and that is
 * what keeps a request of a previous arming out.
 */
function escucharListasDeHls(hls) {
  seguidorDeHls = followInterstitials(hls, () => pintarIntercambio(), (identifier) => breakDelReporte({ id: identifier }));
  hls.on(Hls.Events.ASSET_LIST_LOADING, (_e, data) => {
    const id = breakDelReporte({ id: data.event.identifier });
    if (id) eventosDeHls.set(id, data.event);
  });
  // Either one means hls.js has the body: LOADED when it accepted the list, an
  // ERROR when a listener of it threw on the list it had already kept.
  hls.on(Hls.Events.ASSET_LIST_LOADED, () => pintarIntercambio());
  hls.on(Hls.Events.ERROR, () => pintarIntercambio());
}

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const id = breakDeLaUrl(entry.name);
    if (!id || !vivo) continue;
    const url = new URL(entry.name);
    if (url.searchParams.get('_HLS_primary_id') !== vivo.hls.sessionId) continue;
    intercambio.set(id, { url, cuerpo: null, deHls: true });
    pintarIntercambio();
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
  const opciones = items.flatMap((i) => (Array.isArray(i?.layoutOptions) ? i.layoutOptions : [i]));
  const cajas = opciones.flatMap((o) => o?.layout?.assets ?? []);
  const partes = [`${assets.length} asset${assets.length === 1 ? '' : 's'}`];
  partes.push(`${opciones.length} option${opciones.length === 1 ? '' : 's'}`);
  partes.push(assets.some((a) => typeof a?.URI === 'string' && a.URI.trim()) ? 'linear default' : 'no default');
  const layouts = [...new Set(opciones.map((o) => o?.type).filter(Boolean))];
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
  for (const brk of TODOS) if (brk.cue !== 'POST' && segundo < brk.offset + brk.duracion) return brk;
  return TODOS[TODOS.length - 1];
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
  if (definicion && rangos.length) dom.ranges.prepend(el('pre', 'range__line', definicion));
  // One playlist for both clients (ADR 0113): the class is the query parameter
  // this client asked with, substituted by hls.js.
  const pedidoCon = `?${stage.parametroDeClase}=${CLASE[vivo?.modo] ?? ''}`;
  dom.rangesLede.textContent = mostrado?.tradicional
    ? 'The same playlist both clients load, and this tag is the one whose class is WRITTEN, not chosen: ' +
      'com.apple.hls.interstitial for every client. hls.js plays it full frame in both modes (ADR 0114, ADR 0115).'
    : vivo?.modo === 'nativo'
    ? (mostrado?.lineal
      ? `The same playlist both clients load, asked for with ${pedidoCon}: hls.js reads this break as an ` +
        'Apple interstitial and plays the standard part of its asset-list, if it loads.'
      : `The same playlist both clients load, asked for with ${pedidoCon}: hls.js reads this break as an ` +
        'Apple interstitial, but its asset-list has no standard part, so hls.js skips it (ADR 0091).')
    : `The same playlist both clients load, asked for with ${pedidoCon}: hls.js reads this break as our ` +
      'class, and the library reads the part of its asset-list on top of the standard one.';

  // Move 2: the URL that went out, with the parameter picked out of it.
  dom.request.replaceChildren();
  if (!traza) {
    // On demand (ADR 0108): the list goes out when the programme is buffered up
    // to the break, or played or sought into it, so a break ahead is not asked
    // for yet. That is the rule of hls.js, and not this page being slow.
    dom.request.append(el('span', 'none', vivo?.modo === 'nativo'
      ? 'no request for this break has gone out yet'
      : 'no request for this break yet: the list goes out when the programme is buffered up to it, as hls.js does'));
  } else {
    dom.request.append(el('span', 'request__path', traza.url.pathname));
    const nombres = vivo?.modo === 'nativo' || mostrado.tradicional
      ? [...traza.url.searchParams.keys()] : Object.values(PARAMETROS);
    const pares = nombres
      .filter((nombre) => traza.url.searchParams.has(nombre))
      .map((nombre) => `${nombre}=${traza.url.searchParams.get(nombre)}`);
    dom.request.append(pares.length
      ? el('b', null, `?${pares.join('&')}`)
      : el('span', 'none', vivo?.modo === 'nativo' || mostrado.tradicional ? '  — no query' : '  — no capability on this request'));
  }

  // Move 4: what the library kept, off its own report. The native client has
  // no library and no capabilities, so there is nothing kept and nothing is
  // made up: the card says what that client does instead.
  if (mostrado.tradicional) {
    // ADR 0115: not a break of ours in either mode. hls.js plays it.
    dom.filter.replaceChildren(el('li', 'none', vivo?.modo === 'nativo'
      ? 'Native HLS interstitials: no capabilities are configured and there are no layoutOptions to filter.'
      : 'Not a break of ours: its class is Apple\'s, written out, so the library does not resolve it. ' +
        'hls.js, which runs inside this player with its interstitials machinery on, plays it (ADR 0114).'));
    const { texto, salteado } = desenlaceDeHls(mostrado, 'this traditional interstitial',
      vivo?.modo === 'nativo' ? ', as it does every break in this mode' : ', in our player too');
    dom.outcome.dataset.outcome = salteado ? 'skipped' : 'default';
    dom.outcome.textContent = texto;
  } else if (vivo?.modo === 'nativo') {
    dom.filter.replaceChildren(el('li', 'none',
      'Native HLS interstitials: no capabilities are configured and there are no layoutOptions to filter.'));
    const { texto, salteado } = desenlaceDeHls(mostrado,
      mostrado.lineal ? 'the Apple-class interstitial of this break' : 'the interstitial', '');
    dom.outcome.dataset.outcome = salteado ? 'skipped' : 'native';
    dom.outcome.textContent = texto;
  }
  const seleccion = vivo?.modo === 'nativo' ? null : selecciones.get(mostrado.id);
  const asset = seleccion?.assets[0];
  if (vivo?.modo === 'nativo' || mostrado.tradicional) {
    // already said above
  } else if (!asset) {
    dom.filter.replaceChildren(el('li', 'none', mostrado.cue === 'POST'
      ? 'the library has not resolved this post-roll yet: its list is requested when the programme is buffered to its end'
      : 'the library has not resolved this break yet: its list is requested when the programme is buffered up to it'));
    dom.outcome.textContent = '';
  } else if (seleccion.postroll) {
    // A post-roll (ADR 0111): no option is weighed, because none of them is
    // ever presented after the end. What plays is the linear default, or nothing.
    const reporte = presentados.get(mostrado.id);
    dom.filter.replaceChildren(el('li', 'none',
      'Post-roll: the layout options are not considered, because a non-linear ad is never presented after the programme ends.'));
    dom.outcome.dataset.outcome = reporte
      ? (reporte.outcome === 'skipped' ? 'skipped' : 'default')
      : (asset.outcome === 'skipped' ? 'skipped' : 'default');
    dom.outcome.textContent = `${desenlace(asset)}${reporte ? ` ${presentado(reporte)}` : ' It plays when the programme ends.'}`;
  } else {
    const item = asset.items[0];
    // Two reports and two moments: what the signalling HANDED OVER, in order
    // (`onResolved`), and what the renderer PRESENTED after any option failed
    // to load on screen (`onPresented`, ADR 0107).
    const reporte = presentados.get(mostrado.id);
    const enPantalla = new Map((reporte?.attempts ?? []).filter((a) => !a.linear).map((a) => [a.index, a]));
    const mostrada = reporte?.presented && !reporte.presented.linear ? reporte.presented.index : null;
    const orden = item?.order ?? (item?.chosen != null ? [item.chosen] : []);
    dom.filter.replaceChildren(...(item?.offered ?? []).map((opcion, i) => {
      const descarte = item.discarded.find((d) => d.index === i);
      const fallo = enPantalla.get(i);
      let veredicto = 'not-reached';
      let porque = 'Not handed over: it does not fit this device, or it is not needed.';
      if (descarte) {
        veredicto = 'discarded';
        porque = descarte.failed ? `Discarded by pre-validation: it ${descarte.reason}.` : `Discarded: it ${descarte.reason}.`;
      } else if (fallo) {
        veredicto = 'discarded';
        porque = `Failed on screen: it ${fallo.reason}${fallo.late ? ', after its window had opened' : ''}. The renderer took it down and mounted the next.` +
          (i === 0 && mostrado.primeraOpcionRota ? ' On purpose: this URI does not exist, to show the failover.' : '');
      } else if (i === mostrada) {
        veredicto = 'kept';
        porque = `On screen: its assets loaded${reporte.attempts.length ? ' after the ones before it failed' : ''}.`;
      } else if (orden[0] === i) {
        veredicto = 'kept';
        porque = reporte
          ? 'Handed first.'
          : 'Handed first: this device can show it. Whether its assets load is known when the renderer mounts it.';
      } else if (orden.includes(i)) {
        veredicto = 'queued';
        porque = 'Handed next: the renderer mounts it if the ones before it fail to load.';
      }
      const li = el('li', 'filter__option');
      li.dataset.verdict = veredicto;
      li.append(el('p', 'filter__what', describirOpcion(opcion, i)), el('p', 'filter__why', porque));
      return li;
    }));
    const pre = seleccion.preValidation?.enabled
      ? `Pre-validation ON (${seleccion.preValidation.method}): ${seleccion.requests.length} first request${seleccion.requests.length === 1 ? '' : 's'} made. `
      : 'Pre-validation OFF: nothing requested up front. ';
    dom.outcome.dataset.outcome = reporte
      ? (reporte.outcome === 'skipped' ? 'skipped' : reporte.presented.linear ? 'default' : 'drawn')
      : asset.outcome;
    dom.outcome.textContent = `${pre}${desenlace(asset)}${reporte ? ` ${presentado(reporte)}` : ''}`;
  }

  // Move 3: the answer to that same request, as the player received it (ADR 0116).
  if (traza?.deHls && traza.cuerpo == null) traza.cuerpo = cuerpoDeHls(mostrado.id);
  if (!traza || traza.cuerpo == null) {
    dom.answerLede.textContent = 'The answer to the request above, as the player received it.';
    dom.answer.textContent = traza
      ? 'hls.js asked for this list and has not kept a body for it: either it is still on its way, or hls.js ' +
        'could not read it as an asset-list. The page does not ask a second time.'
      : '';
  } else {
    dom.answerLede.textContent = resumenDeLaRespuesta(traza.cuerpo) + (traza.deHls
      ? ' · as hls.js parsed it, re-serialised: hls.js keeps the list, not the bytes'
      : ' · verbatim, from the library\'s report');
    dom.answer.textContent = traza.cuerpo;
  }
}

function mostrarBreak(brk) {
  if (mostrado?.id === brk.id) return;
  mostrado = brk;
  // A preroll (ADR 0110) is said as one: both clients ask for its list at load,
  // before play, which is what move 2 shows the moment the page opens.
  // A post-roll (ADR 0111) too: it goes after the programme, whatever its
  // START-DATE, and only as a linear ad.
  const cuando = brk.cue === 'POST'
    ? `after the programme ends (t = ${stage.programa.largo}s), for ${brk.duracion}s`
    : `t = ${brk.offset}s to ${brk.offset + brk.duracion}s`;
  if (brk.tradicional) {
    dom.which.textContent = `Break ${brk.id.toUpperCase()} · ${cuando} · ${stage.campanas[brk.campana].marca} · ` +
      'a TRADITIONAL linear break: CLASS="com.apple.hls.interstitial" written in the playlist, the same for both ' +
      'clients, played by hls.js in both modes';
    pintarIntercambio();
    return;
  }
  dom.which.textContent =
    `Break ${brk.id.toUpperCase()} of ${stage.breaks.length} · ${cuando} · ${stage.campanas[brk.campana].marca} · ` +
    (brk.cue === 'PRE' ? 'preroll, CUE="PRE": its list is asked for at load · ' : '') +
    (brk.cue === 'ONCE'
      ? 'CUE="ONCE": once it has played, both clients take it out, so a seek back does not show it again · '
      : '') +
    // A deliberate failover demonstration (stage.json, `_primeraOpcionRota`).
    (brk.primeraOpcionRota
      ? 'its FIRST OPTION FAILS ON PURPOSE: it points at a URI that does not exist, so the renderer moves on ' +
        'to the next option by itself (ADR 0107) · '
      : '') +
    (brk.cue === 'POST'
      ? 'post-roll, CUE="POST": its list is asked for when the programme is buffered to its end, and a ' +
        'non-linear ad is never presented after the end · '
      : '') +
    (brk.lineal ? 'with a linear default' : 'no default: content that is not interrupted');
  pintarIntercambio();
}

// ===========================================================================
// THE ARMING
// ===========================================================================

/** What is alive right now, or null. */
let vivo = null;

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
 *
 * Waiting for readiness is not a failed attempt: served from the bucket the
 * player takes seconds to be ready, and a shared counter gave up before the
 * first write (fase 15). Readiness gets up to twenty seconds.
 */
function buscar(objetivo, intentos = 20, desde = performance.now()) {
  if (!vivo || intentos <= 0) return;
  const { video, programa, listo } = vivo;
  if (!listo()) {
    if (performance.now() - desde < 20000) setTimeout(() => buscar(objetivo, intentos, desde), 50);
    return;
  }
  // The programme clock: the element for our library, whose programme is never
  // stopped; the interstitials manager's primary for the native client.
  programa.currentTime = objetivo;
  video.play().catch(() => {});
  setTimeout(() => {
    if (vivo?.video === video && Math.abs(programa.currentTime - objetivo) > 1.5) {
      buscar(objetivo, intentos - 1, desde);
    }
  }, 250);
}

const ROTULOS = {
  nativo: {
    rol: 'HLS interstitials, native',
    sub: 'A client that is already in the market: hls.js with nothing of this demo in it. It replaces the programme with the ad.'
  },
  ours: {
    rol: 'This demo\u2019s player',
    sub: 'The library over an unmodified hls.js: our breaks are drawn over the programme, never replacing it; a traditional interstitial, if the stream has one, hls.js plays.'
  }
};

let configActual = null;

function armar(config, retomarEn = 0) {
  configActual = config;
  escribirModo(config);
  dom.rol.textContent = ROTULOS[config.modo].rol;
  dom.sub.textContent = ROTULOS[config.modo].sub;
  dom.pane.classList.toggle('pane-demo', config.modo === 'ours');
  dom.pane.classList.toggle('pane-stock', config.modo === 'nativo');
  control?.pintar(config);
  // Pre-validation is a setting of our library; the native client has none.
  grupoPre.hidden = config.modo !== 'ours';
  if (config.modo === 'nativo') { armarNativo(retomarEn); return; }
  const capacidades = config.capacidades;
  derribar();
  intercambio.clear();
  selecciones.clear();
  presentados.clear();
  eventosDeHls.clear();
  mostrado = null;
  leerRangos(SRC.ours).then(pintarIntercambio);

  const { player, video } = construirCaja();

  // =========================================================================
  // WHAT AN INTEGRATOR WRITES  (with the <script src> of inspect.html and the
  // container this page hands over). Everything between the two fences exists
  // because the library exists; the rest of this file exists because this page
  // is an inspection of one exchange.
  const hls = new Hls();
  const concurrent = QualabsConcurrentHls.attach(hls, {
    container: player,
    // Handed now, so the programme's clock exists from the first line below.
    video,
    // What the device can draw, `{ concurrentVideo, concurrentImage }` (ADR
    // 0104). The library filters the layoutOptions of every ad against it, and
    // with `sendCapabilities` it also travels on the request, which is the
    // exchange this page shows.
    capabilities: capacidades,
    sendCapabilities: true,
    // Off by default, and this page starts with the default (ADR 0107); the
    // toggle above the player turns it on.
    preValidateAssets: prevalidar,
    // Which option the renderer actually put on screen, after any failover.
    onPresented: (reporte) => {
      presentados.set(breakDelReporte(reporte), reporte);
      pintarIntercambio();
    },
    onResolved: (experiences, seleccion) => {
      for (const e of experiences) {
        console.log(`[page] resolved ${e.type}#${e.itemId}: ${e.elements.length} elements,` +
          ` window ${e.startTime.toFixed(2)}s -> ${(e.startTime + e.duration).toFixed(2)}s`);
      }
      selecciones.set(breakDelReporte(seleccion), seleccion);
      anotarRespuesta(seleccion);
      pintarIntercambio();
    }
  });
  hls.loadSource(SRC.ours);
  hls.attachMedia(video);
  // =========================================================================

  // The traditional break of the stream is loaded by hls.js, not by the library.
  escucharListasDeHls(hls);

  const consumer = traceContract({
    provider: concurrent.provider, video, hud: dom.contract
  });

  hls.on(Hls.Events.ERROR, (_e, d) => {
    // A non-fatal error is one hls.js recovers from -- the usual one is a load
    // aborted because a rebuild destroyed the instance -- so it is a warning.
    (d.fatal ? console.error : console.warn)('[hls] error', d.type, d.details, 'fatal:', d.fatal);
  });

  // Card 1 shows the class this client parsed, which is there once the playlist is.
  hls.on(Hls.Events.LEVEL_UPDATED, () => pintarIntercambio());
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    const off = hls.interstitialsManager == null;
    dom.hud.textContent =
      `hls.js ${Hls.version} · interstitials manager: ${off ? 'none' : 'PRESENT'} · ` +
      `capabilities: ${JSON.stringify(capacidades)} · pre-validation ${prevalidar ? 'on' : 'off'} · playing ${SRC.ours}`;
  });

  video.muted = true;
  video.play().catch(() => {});

  /** The live line under the picture, read off the contract and nothing else. */
  function pintar() {
    // What is ON SCREEN, after the renderer's failover (ADR 0107).
    // A traditional interstitial of the stream, played by hls.js (ADR 0114).
    if (concurrent.linearOnScreen()) {
      const t = concurrent.programme.currentTime;
      dom.pane.dataset.state = 'ad';
      dom.state.textContent = `LINEAR AD, played by hls.js (traditional interstitial) · programme at ${t.toFixed(1)}s · the content is off the screen`;
      mostrarBreak(breakDelSegundo(t));
      return;
    }
    const activas = concurrent.presentedAt(video.currentTime);
    dom.pane.dataset.state = activas.length ? 'ad' : 'primary';
    // A linear default declares no medium of its own: it is the asset's `URI`
    // played full frame (ADR 0019), so it is named for what it is.
    const medios = [...new Set(activas
      .flatMap((e) => e.elements.map((caja) => ({ caja, lineal: e.type === 'linear' })))
      .filter(({ caja }) => !caja.primary)
      .map(({ caja, lineal }) => caja.mediaType || (lineal ? 'the linear default, full frame' : 'unknown')))].join(', ');
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

  vivo = {
    modo: 'ours', hls, concurrent, consumer, video, capacidades, src: SRC.ours,
    programa: concurrent.programme, listo: () => video.readyState >= 1
  };
  if (retomarEn > 0) buscar(retomarEn);

  // For the console, for the measurements of this task, and for whoever comes
  // next. It is replaced on every arming, so it always points at what is alive.
  window.demo = {
    get hls() { return vivo.hls; },
    get video() { return vivo.video; },
    get concurrent() { return vivo.concurrent; },
    get provider() { return vivo.concurrent.provider; },
    get capacidades() { return vivo.capacidades; },
    get src() { return vivo.src; },
    get mostrado() { return mostrado?.id ?? null; },
    get intercambio() {
      return Object.fromEntries([...intercambio].map(([id, t]) => [id, { url: t.url.href, cuerpo: t.cuerpo }]));
    },
    stage,
    get selecciones() { return Object.fromEntries(selecciones); },
    get presentados() { return Object.fromEntries(presentados); },
    get prevalidar() { return prevalidar; },
    get modo() { return vivo.modo; },
    armar: (config, retomarEn) => armar(config, retomarEn),
    irA: (segundo) => buscar(segundo)
  };
}

/**
 * The native client, in the same box and with the same three moves: what the
 * playlist said, what hls.js asked for -- the Apple-class list, read off the
 * network like ours -- and what came back. Card 4 says there is no filter.
 */
/**
 * The breaks the native client is known to skip, for the whole life of the page:
 * a jump in native mode and a change of mode both rebuild the player, and a mark
 * that went away must not come back with the new one (ADR 0092, T-22).
 */
const salteadosPorElNativo = new Set();

function armarNativo(retomarEn = 0) {
  derribar();
  intercambio.clear();
  selecciones.clear();
  presentados.clear();
  eventosDeHls.clear();
  mostrado = null;
  leerRangos(SRC.nativo).then(pintarIntercambio);
  const { player, video } = construirCaja();
  dom.contract.textContent = '';
  const stock = createStockPlayer({
    video, container: player, src: SRC.nativo, pane: dom.pane, state: dom.state, hud: dom.hud,
    skipped: salteadosPorElNativo
  });
  stock.hls.on(Hls.Events.LEVEL_UPDATED, () => pintarIntercambio());
  escucharListasDeHls(stock.hls);
  const alTiempo = () => mostrarBreak(breakDelSegundo(stock.programme.currentTime));
  video.addEventListener('timeupdate', alTiempo);
  video.addEventListener('seeked', alTiempo);
  vivo = {
    modo: 'nativo', hls: stock.hls, stock, video, capacidades: null, src: SRC.nativo,
    programa: stock.programme,
    listo: () => stock.hls.interstitialsManager?.primary != null && video.readyState >= 1
  };
  alTiempo();
  if (retomarEn > 0) buscar(retomarEn);
  window.demo = {
    get hls() { return vivo.hls; },
    get video() { return vivo.video; },
    get stock() { return vivo.stock; },
    get modo() { return vivo.modo; },
    get capacidades() { return null; },
    get src() { return vivo.src; },
    get mostrado() { return mostrado?.id ?? null; },
    get intercambio() {
      return Object.fromEntries([...intercambio].map(([id, t]) => [id, { url: t.url.href, cuerpo: t.cuerpo }]));
    },
    stage,
    get selecciones() { return {}; },
    armar: (config, t) => armar(config, t),
    irA: (segundo) => buscar(segundo)
  };
}

// ===========================================================================
// THE SWITCH AND THE JUMPS
// ===========================================================================

// The same control as each pane of index.html: the mode, and the two axes
// under "With our library".
let control = null;
control = crearControlDePane({
  contenedor: document.getElementById('steps'),
  stage,
  lado: 'inspect',
  inicial: leerModo(location.search, stage),
  alCambiar: (config) => armar(config, vivo ? vivo.programa.currentTime : 0)
});

// The pre-validation toggle, in the same row and with the same buttons as the
// axes. Like the axes, it rebuilds the player: the library reads it once.
const grupoPre = el('div', 'axis');
grupoPre.setAttribute('role', 'group');
grupoPre.setAttribute('aria-label', 'Pre-validation of assets');
const botonesPre = [false, true].map((valor) => {
  const b = el('button', 'step', valor ? 'on' : 'off');
  b.type = 'button';
  b.addEventListener('click', () => {
    if (prevalidar === valor) return;
    prevalidar = valor;
    const q = new URLSearchParams(location.search);
    if (valor) q.set('prevalidar', '1'); else q.delete('prevalidar');
    history.replaceState(null, '', `${location.pathname}?${q}`);
    pintarPre();
    if (configActual?.modo === 'ours') armar(configActual, vivo ? vivo.programa.currentTime : 0);
  });
  return b;
});
const pintarPre = () => botonesPre.forEach((b, i) => b.setAttribute('aria-pressed', String(prevalidar === (i === 1))));
grupoPre.append(el('span', 'axis-label', 'Pre-validate assets'), ...botonesPre);
document.getElementById('steps').append(grupoPre);
pintarPre();

// With our library a jump is a seek and not a rebuild: the programme is never
// stopped, so the seek lands. In native mode it rebuilds, as index.html does.
const jumps = document.getElementById('jumps');
jumps.replaceChildren(...[
  { texto: 'start', segundo: 0.05 },
  ...TODOS.map((b) => ({
    texto: `break ${b.id.toUpperCase()}${b.tradicional ? ' (traditional)' : ''}`,
    // A post-roll plays when the programme ends (ADR 0111): its jump lands near the end.
    segundo: Math.max(0.05, (b.cue === 'POST' ? stage.programa.largo : b.offset) - ENTRADA)
  }))
].map(({ texto, segundo }) => {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'jump';
  boton.textContent = texto;
  // In native mode a jump REBUILDS, as on index.html: while hls.js is playing an
  // interstitial with `X-RESTRICT="SKIP"` a seek of the programme is accepted and
  // dropped, so the jump would not land (measured on this page, fase 15).
  // With our library it rebuilds too while hls.js is playing the traditional
  // break (ADR 0115), for the same reason.
  boton.addEventListener('click', () => (vivo?.modo === 'nativo' || vivo?.concurrent?.linearOnScreen()
    ? armar(configActual, segundo) : buscar(segundo)));
  return boton;
}));

armar(leerModo(location.search, stage));
