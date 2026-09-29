// app.js -- the pair of players of index.html, each one with its own control.
//
// Each pane is configured on its own (fase 15, asked for by Nicolás to be able to
// compare every combination): first a MODE, the off-the-shelf "HLS interstitials"
// client -- hls.js with nothing of ours, which replaces the programme with the
// ad -- or "with our library"; and only in the second, the two capability axes of
// ADR 0086. So the page compares native against ours, ours against ours with
// different capabilities, or native against native. The default is the pair as
// it was published: native on the left, ours with two decoders and images on the
// right, and the configuration travels in the URL (`?izq=nativo&der=ours-2dec-img`)
// so a link opens a precise combination.
//
// THE BLOCK AN INTEGRATOR WRITES is fenced inside `construirNuestro()`: the
// library arrives as a <script src> that defines a global, the page builds its
// own hls.js with the one configuration the library hands over, and turns the
// concurrent experience on over a container, with `capabilities` (ADR 0086). The
// native pane is `stock-player.js`, which takes the chrome from the library and
// nothing else.
//
// Under everything there is one invariant, and most of this file is about
// holding it: THE TWO PANES ARE ALWAYS AT THE SAME SECOND OF THE PROGRAMME.
// Changing a control or jumping rebuilds BOTH panes at the same target second,
// and the two scrub bars are tied -- see "THE TWO BARS ARE ONE BAR" below.
//
// WHY A CHANGE REBUILDS, AND WHY BOTH. `capabilities` is read ONCE, when the
// signalling is created (`createSignalling`, lib/signalling.js), so there is no
// in-flight way to change it: rebuilding is the contract. And both sides rebuild
// in one call, because rebuilding one leaves the pair on two timelines.

import { traceContract } from './contract-trace.js';
import { createStockPlayer } from './stock-player.js';
import {
  breakDelReporte, crearControlDePane, desenlaceCorto, leerConfig, escribirConfig
} from './capabilities.js';

// The one source of the numbers of this demo (ADR 0044).
const stage = await (await fetch('/stage.json')).json();

const SRC = `/${stage.playlists.par}`;

const LADOS = ['izq', 'der'];

/** The fixed parts of each pane, the ones that survive a rebuild. */
const panes = Object.fromEntries(LADOS.map((lado) => [lado, {
  caja: document.getElementById(`slot-${lado}`),
  pane: document.getElementById(`pane-${lado}`),
  rol: document.getElementById(`rol-${lado}`),
  sub: document.getElementById(`sub-${lado}`),
  lee: document.getElementById(`lee-${lado}`),
  state: document.getElementById(`state-${lado}`),
  hud: document.getElementById(`hud-${lado}`),
  contract: document.getElementById(`contract-${lado}`),
  pedidos: document.getElementById(`wire-${lado}`),
  control: document.getElementById(`control-${lado}`)
}]));

/** What each mode says about itself, painted on the pane when it is built. */
const ROTULOS = {
  nativo: {
    rol: 'HLS interstitials, native',
    sub: 'A client that is already in the market: hls.js with nothing of this demo in it. It replaces the programme with the ad.',
    lee: 'keeps com.apple.hls.interstitial · ignores com.qualabs.hls.concurrentInterstitial'
  },
  ours: {
    rol: 'With our library',
    sub: 'The same hls.js, unmodified, with its interstitials machinery off. The programme is never replaced.',
    lee: 'keeps com.qualabs.hls.concurrentInterstitial · ignores com.apple.hls.interstitial'
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
// WHAT WENT OUT ON THE WIRE, PER PANE
// ===========================================================================
// Each pane lists the asset-list requests IT made, which is the point of having
// two controls: each side asks with its own capabilities. They are read, not
// written: ours from the URL the library reports in `onResolved` (the request it
// made, with the parameters on it), the native one from hls.js's own asset-list
// events. Two panes of the same mode ask for the same files, so the network tab
// alone could not tell them apart; each instance can.

function pintarPedidos(lado) {
  const { pedidos } = vivo?.lados[lado] ?? { pedidos: [] };
  const lista = panes[lado].pedidos;
  if (!pedidos.length) {
    const li = document.createElement('li');
    li.className = 'none';
    li.textContent = 'no asset-list requested yet';
    lista.replaceChildren(li);
    return;
  }
  lista.replaceChildren(...pedidos.map(({ url, asset }) => {
    const u = new URL(url, location.href);
    const li = document.createElement('li');
    li.append(u.pathname);
    const query = [...u.searchParams].map(([k, v]) => `${k}=${v}`).join('&');
    const marca = document.createElement(query ? 'b' : 'span');
    if (!query) marca.className = 'none';
    marca.textContent = query ? `?${query}` : '  — no query';
    li.append(marca);
    if (asset) {
      const nota = document.createElement('span');
      nota.className = 'wire__outcome';
      nota.textContent = `  ${desenlaceCorto(asset)}`;
      li.append(nota);
    }
    return li;
  }));
}

// ===========================================================================
// THE ARMING
// ===========================================================================

/** What is alive right now: the two panes of one arming, or null. */
let vivo = null;
let configActual = leerConfig(location.search, stage);

/**
 * A TARGET EVERY PANE CAN ACTUALLY REACH. Measured on this page: while a native
 * pane is inside a break, a write to its programme clock is accepted and does
 * nothing -- hls.js is playing the linear ad and the tag says
 * `X-RESTRICT="SKIP"`. Ours has no such restriction (ADR 0016). So when a native
 * pane is present, a target inside one of ITS breaks -- the ones with a linear
 * default (ADR 0087) -- becomes the head of that break. With no native pane the
 * target is left alone.
 */
const ENTRADA = 5;

/** How far apart two clocks may be and still be the same second. */
const TOLERANCIA = 1.5;

function objetivoSeguro(segundo) {
  if (!Object.values(configActual).some((c) => c.modo === 'nativo')) return segundo;
  for (const brk of stage.breaks.filter((b) => b.lineal)) {
    if (segundo >= brk.offset && segundo < brk.offset + brk.duracion) {
      return Math.max(0.05, brk.offset - ENTRADA);
    }
  }
  return segundo;
}

/** The programme second the pair is at, asked of whichever pane can answer. */
function segundoDelPrograma() {
  if (!vivo) return 0;
  for (const lado of LADOS) {
    const t = vivo.lados[lado].programa.currentTime;
    if (Number.isFinite(t)) return t;
  }
  return 0;
}

function derribar() {
  if (!vivo) return;
  // `destroy()` is what hls.js offers; the library has no teardown of its own,
  // so what is left of an arming is cleared by replacing the DOM it drew into.
  for (const lado of LADOS) {
    vivo.lados[lado].hls.destroy();
    panes[lado].caja.replaceChildren();
  }
  vivo = null;
}

/**
 * A SEEK THAT IS CHECKED AFTERWARDS, because a seek written too early is
 * accepted and dropped without a word (measured: right after a rebuild the
 * native pane's programme clock takes the write, reports the old second and
 * stays there). It gives up after twenty attempts and SAYS SO, because a seek
 * that never landed is the pair an unknown distance apart.
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
 * Put both panes at the same second of the programme, each through its own
 * programme clock: ours is the element's own clock, because the programme is
 * never stopped (ADR 0016); the native one is `interstitialsManager.primary`,
 * through the facade `stock-player.js` builds for its bar.
 */
function irA(segundo) {
  if (!vivo || segundo <= 0) return;
  for (const lado of LADOS) {
    const l = vivo.lados[lado];
    buscar(l.listo, () => l.programa.currentTime, (s) => l.escribir(s), segundo, 20,
      () => console.warn(`[app] the ${lado} pane never took ${segundo.toFixed(2)}s: it is at ` +
        `${l.programa.currentTime.toFixed(2)}s and the pair is NOT at the same second`));
  }
}

// ===========================================================================
// THE TWO BARS ARE ONE BAR, AND WHICHEVER ONE IS DRAGGED MOVES BOTH PANES
// ===========================================================================
// A scrub on either bar leaves both panes at the same moment of the programme.
// The chrome commits a scrub by writing ONE property on release -- `currentTime`
// of what it was given: the media element for our pane, the programme facade for
// the native one -- so the tie is an accessor over each of those for the life of
// one arming. Nothing in lib/ is touched.
//
// TWO THINGS SAY THAT A WRITE IS A SCRUB: the accessor gives the second, and a
// `pointerup` ON THE BAR within `VENTANA_DEL_GESTO` says a person asked for it.
// hls.js writes `currentTime` by itself on a rebuild, and an accessor on its own
// took that for a gesture.
//
// A NATIVE PANE INSIDE A BREAK cannot take a seek, so a scrub then rebuilds the
// pair, and every cheap seek is read back: if a pane did not land within
// `TOLERANCIA` a beat later, the pair is rebuilt rather than left looking tied.

/** Off, the two bars move their own pane and nothing else. */
let enlaceActivo = true;

/** The last tie: what was asked, what was aimed at, which path, how far apart. */
let ultimoEnlace = null;

const VENTANA_DEL_GESTO = 250;

/** The accessor over the one property a bar writes; returns the raw writer. */
function instalarEnlace(lado, programa, caja, alSoltar) {
  const propio = Object.getOwnPropertyDescriptor(programa, 'currentTime');
  const descriptor = propio ?? Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime');
  const crudo = (s) => descriptor.set.call(programa, s);
  let soltado = 0;
  caja.addEventListener('pointerup', (evento) => {
    if (evento.target?.closest?.('.qa-track')) soltado = performance.now();
  }, true);
  setTimeout(() => {
    if (!caja.querySelector('.qa-track')) {
      console.warn(`[app] no bar found in the ${lado} pane: the two bars are NOT tied`);
    }
  }, 5000);
  Object.defineProperty(programa, 'currentTime', {
    configurable: true,
    get: () => descriptor.get.call(programa),
    set: (s) => {
      if (enlaceActivo && performance.now() - soltado < VENTANA_DEL_GESTO) alSoltar(lado, s);
      else crudo(s);
    }
  });
  return crudo;
}

/** Whether any native pane is inside a break right now. */
const algunoEnAviso = () => LADOS.some((lado) => vivo.lados[lado].enAviso());

/** A scrub, from whichever bar: one target, both panes, and the path recorded. */
function enlazar(origen, pedido) {
  if (!vivo) return;
  const objetivo = objetivoSeguro(pedido);
  const enBreak = algunoEnAviso();
  ultimoEnlace = { origen, pedido, objetivo, camino: enBreak ? 'rearmado' : 'directo', delta: null };
  if (enBreak) {
    console.log(`[app] scrub from the ${origen} bar to ${objetivo.toFixed(2)}s while a native pane ` +
      'is inside a break: it cannot take a seek there, so both are rebuilt');
    armar(configActual, objetivo);
    return;
  }
  for (const lado of LADOS) {
    vivo.lados[lado].escribir(objetivo);
    vivo.lados[lado].video.play().catch(() => {});
  }
  const registro = ultimoEnlace;
  setTimeout(() => {
    if (!vivo || ultimoEnlace !== registro) return;
    registro.delta = Math.max(...LADOS.map((lado) => Math.abs(vivo.lados[lado].programa.currentTime - objetivo)));
    if (registro.delta <= TOLERANCIA) return;
    registro.camino = 'directo, no entró → rearmado';
    console.log(`[app] a pane did not take ${objetivo.toFixed(2)}s: both are rebuilt`);
    armar(configActual, objetivo);
  }, 400);
}

/** One audio at a time: whichever pane is unmuted last owns the sound. */
function unSoloAudio(elementos) {
  for (const elemento of elementos) {
    elemento.addEventListener('volumechange', () => {
      if (elemento.muted) return;
      for (const otro of elementos) if (otro !== elemento) otro.muted = true;
    });
  }
}

/** The media of the ad, off the contract: what the capabilities actually move. */
function medios(activas) {
  // A linear default declares no medium of its own: it is the asset's `URI`
  // played full frame (ADR 0019), so it is named for what it is.
  const tipos = activas
    .flatMap((e) => e.elements.map((el) => ({ el, lineal: e.type === 'linear' })))
    .filter(({ el }) => !el.primary)
    .map(({ el, lineal }) => el.mediaType || (lineal ? 'the linear default, full frame' : 'unknown'));
  return [...new Set(tipos)].join(', ');
}

/** A pane with our library, and the block an integrator writes. */
function construirNuestro(lado, capacidades, caja, registro) {
  const p = panes[lado];
  // =========================================================================
  // WHAT AN INTEGRATOR WRITES  (with the <script src> of index.html and the
  // container this page hands over).
  const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
  const concurrent = QualabsConcurrentHls.attach(hls, {
    container: caja.player,
    // What the device can draw, one axis at a time (ADR 0086).
    capabilities: capacidades,
    onResolved: (experiences, seleccion) => {
      for (const e of experiences) {
        console.log(`[app:${lado}] resolved ${e.type}#${e.itemId}: ${e.elements.length} elements,` +
          ` window ${e.startTime.toFixed(2)}s -> ${(e.startTime + e.duration).toFixed(2)}s`);
      }
      registro.selecciones[breakDelReporte(seleccion)] = seleccion;
      registro.pedidos.push({ url: seleccion.url, asset: seleccion.assets[0] });
      pintarPedidos(lado);
    }
  });
  hls.loadSource(SRC);
  hls.attachMedia(caja.video);
  // =========================================================================

  const consumer = traceContract({ provider: concurrent.provider, video: caja.video, hud: p.contract });
  hls.on(Hls.Events.ERROR, (_e, d) => console.error(`[hls:${lado}] error`, d.type, d.details, 'fatal:', d.fatal));
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    const off = hls.interstitialsManager == null;
    p.hud.textContent = `hls.js ${Hls.version} · interstitials manager: ${off ? 'none' : 'PRESENT'} · ` +
      `capabilities: ${JSON.stringify(capacidades)} · playing ${SRC}`;
  });
  caja.video.muted = true;
  caja.video.play().catch(() => {});

  /** The pane's label, read off the contract -- `activeAt` and nothing else. */
  function pintar() {
    const activas = concurrent.provider.activeAt(caja.video.currentTime);
    p.pane.dataset.state = activas.length ? 'ad' : 'primary';
    p.state.textContent = activas.length
      ? `primary content + NON-LINEAR AD (${activas.map((e) => e.type).join(', ')})` +
        ` · ${caja.video.currentTime.toFixed(1)}s · nothing was replaced · ad media: ${medios(activas)}`
      : `primary content · ${caja.video.currentTime.toFixed(1)}s`;
  }
  caja.video.addEventListener('timeupdate', pintar);
  pintar();

  return {
    modo: 'ours', capacidades, hls, concurrent, consumer, video: caja.video,
    programa: caja.video,
    listo: () => caja.video.readyState >= 1,
    enAviso: () => false
  };
}

/** A native pane: hls.js at its factory configuration, through stock-player.js. */
function construirNativo(lado, caja, registro) {
  const p = panes[lado];
  p.contract.textContent = '';
  const stock = createStockPlayer({
    video: caja.video, container: caja.player, src: SRC, pane: p.pane, state: p.state, hud: p.hud
  });
  // The requests THIS instance made, from its own asset-list events: two native
  // panes ask for the same files, and only the instance knows which were its own.
  stock.hls.on(Hls.Events.ASSET_LIST_LOADED, (_e, data) => {
    const url = data.networkDetails?.responseURL || data.networkDetails?.url || data.event?.assetListUrl?.href ||
      String(data.event?.assetListUrl ?? '');
    registro.pedidos.push({ url, asset: null });
    pintarPedidos(lado);
  });
  return {
    modo: 'nativo', capacidades: null, hls: stock.hls, stock, video: caja.video,
    programa: stock.programme,
    listo: () => stock.hls.interstitialsManager?.primary != null && caja.video.readyState >= 1,
    enAviso: () => stock.playingAd != null
  };
}

function pintarRotulos(lado, config) {
  const p = panes[lado];
  const r = ROTULOS[config.modo];
  p.rol.textContent = r.rol;
  p.sub.textContent = r.sub;
  p.lee.textContent = r.lee;
  p.pane.classList.toggle('pane-stock', config.modo === 'nativo');
  p.pane.classList.toggle('pane-demo', config.modo === 'ours');
  p.pane.dataset.modo = config.modo;
}

function armar(config, retomarEn = 0) {
  configActual = config;
  escribirConfig(config);
  derribar();

  const lados = {};
  for (const lado of LADOS) {
    const registro = { pedidos: [], selecciones: {} };
    const caja = construirCaja(panes[lado].caja);
    pintarRotulos(lado, config[lado]);
    const l = config[lado].modo === 'nativo'
      ? construirNativo(lado, caja, registro)
      : construirNuestro(lado, config[lado].capacidades, caja, registro);
    Object.assign(l, registro, { caja });
    lados[lado] = l;
  }
  unSoloAudio(LADOS.map((lado) => lados[lado].video));
  for (const lado of LADOS) {
    lados[lado].escribir = instalarEnlace(lado, lados[lado].programa, lados[lado].caja.player, enlazar);
  }
  vivo = { lados, config };
  LADOS.forEach(pintarPedidos);
  controles.izq?.pintar(config.izq);
  controles.der?.pintar(config.der);
  irA(objetivoSeguro(retomarEn));

  // For the console and the measurements. `video`, `provider` and `stock` keep
  // the names the phase-14 measurements read: the first pane with our library
  // and the first native one.
  const primero = (modo) => LADOS.map((lado) => vivo.lados[lado]).find((l) => l.modo === modo);
  window.demo = {
    get lados() { return vivo.lados; },
    get config() { return vivo.config; },
    get video() { return primero('ours')?.video; },
    get concurrent() { return primero('ours')?.concurrent; },
    get provider() { return primero('ours')?.concurrent.provider; },
    get stock() { return primero('nativo')?.stock; },
    get capacidades() { return primero('ours')?.capacidades; },
    get selecciones() { return primero('ours')?.selecciones ?? {}; },
    pedidos: (lado) => [...vivo.lados[lado].pedidos],
    stage,
    armar: (c, t) => armar(c, t),
    irA,
    get ultimoEnlace() { return ultimoEnlace; },
    get enlace() { return enlaceActivo; },
    set enlace(valor) { enlaceActivo = !!valor; }
  };
}

// ===========================================================================
// THE CONTROLS AND THE JUMPS
// ===========================================================================

const controles = {};
for (const lado of LADOS) {
  controles[lado] = crearControlDePane({
    contenedor: panes[lado].control,
    stage,
    lado,
    inicial: configActual[lado],
    alCambiar: (c) => armar({ ...configActual, [lado]: c }, segundoDelPrograma())
  });
}

// The jumps rebuild, exactly like a change of a control: a seek of a native pane
// only lands while it is outside a break, and after a rebuild both panes are at
// the head of the programme and outside every one of them.
const jumps = document.getElementById('jumps');
jumps.replaceChildren(...[
  { texto: 'start', segundo: 0.05 },
  ...stage.breaks.map((b) => ({ texto: `break ${b.id.toUpperCase()}`, segundo: Math.max(0.05, b.offset - ENTRADA) }))
].map(({ texto, segundo }) => {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'jump';
  boton.textContent = texto;
  boton.addEventListener('click', () => armar(configActual, segundo));
  return boton;
}));

armar(configActual);
