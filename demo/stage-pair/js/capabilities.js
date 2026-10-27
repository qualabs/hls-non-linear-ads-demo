// capabilities.js -- the switch of index.html and inspect.html: what the application
// configures on the library, `concurrentVideo` and `concurrentImage` (SVTA2053 5.3.3,
// ADR 0104), and the sentences both pages print about what the library did with it
// (ADR 0085).
//
// ONE FILE FOR THE TWO PAGES because the two switches are the same statement,
// and two copies of it are two places where "1 decoder" can come to mean two
// different things. What each page does when the switch moves -- rebuild both
// players, or the one -- stays in its own file.
//
// THE AXES AND THEIR VALUES COME FROM stage.json (`capacidades`), and the names
// of the parameters from the library itself, which is the one that writes them
// onto the request: typed here, they would be a third spelling of the same wire.

/** The label of each axis, and how each value is read out. */
const EJES = {
  concurrentVideo: { titulo: 'Video decoders', valor: (v) => String(v) },
  concurrentImage: { titulo: 'Images over video', valor: (v) => (v ? 'yes' : 'no') }
};

/** The query parameter each axis travels in, as the library writes it. */
export const PARAMETROS = {
  concurrentVideo: QualabsConcurrentHls.VIDEO_DECODERS_PARAM,
  concurrentImage: QualabsConcurrentHls.IMAGE_OVER_VIDEO_PARAM
};

/**
 * The two groups of buttons, drawn into `contenedor`. `alCambiar(capacidades)`
 * is called with the whole declaration every time one axis moves, because what
 * the library receives is the declaration and not a delta.
 */
export function crearControl({ contenedor, salida, stage, alCambiar }) {
  const actual = { ...stage.capacidades.inicial };
  const grupos = Object.entries(EJES).map(([clave, eje]) => {
    const grupo = document.createElement('div');
    grupo.className = 'axis';
    grupo.setAttribute('role', 'group');
    grupo.setAttribute('aria-label', eje.titulo);
    const titulo = document.createElement('span');
    titulo.className = 'axis-label';
    titulo.textContent = eje.titulo;
    const botones = stage.capacidades[clave].map((valor) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'step';
      boton.textContent = eje.valor(valor);
      boton.dataset.eje = clave;
      boton.dataset.valor = String(valor);
      boton.addEventListener('click', () => {
        if (actual[clave] === valor) return;
        actual[clave] = valor;
        pintar();
        alCambiar({ ...actual });
      });
      return boton;
    });
    grupo.append(titulo, ...botones);
    return { clave, botones, valores: stage.capacidades[clave] };
  });
  contenedor.replaceChildren(...grupos.map((g) => g.botones[0].parentElement));

  function pintar() {
    for (const { clave, botones, valores } of grupos) {
      botones.forEach((b, i) => b.setAttribute('aria-pressed', String(valores[i] === actual[clave])));
    }
    const query = Object.entries(PARAMETROS)
      .map(([clave, nombre]) => `${nombre}=${clave === 'concurrentImage' ? (actual[clave] ? 1 : 0) : actual[clave]}`)
      .join('&');
    salida.textContent = `request carries ?${query} → the same answer for every device; the library filters it`;
  }
  pintar();
  return { actual: () => ({ ...actual }) };
}

/**
 * The option of an ad as one line somebody reads out: its layout, the medium of
 * each element, and what it asks of the device.
 */
export function describirOpcion(opcion, indice) {
  const medios = opcion.media.map((m) => (/^image\//i.test(m || '') ? `image (${m})` : `video (${m})`));
  const pide = `needs ${opcion.needs.concurrentVideo} video decoder${opcion.needs.concurrentVideo === 1 ? '' : 's'}` +
    (opcion.needs.concurrentImage ? ' and images over video' : '');
  return `Option ${indice + 1} · ${opcion.type} · ${medios.join(' + ')} · ${pide}`;
}

/**
 * What the library HANDED THE RENDERER for an asset of a break, as one sentence,
 * from the report of `onResolved` (`resolveAssets` in lib/ad-list.js).
 * Since ADR 0107 that is not yet what is on screen: the renderer can still fall
 * to a later option, to the default or to nothing, and `presentado` says that.
 */
export function desenlace(asset) {
  // A post-roll (ADR 0111) never presents its non-linear ad: there is no
  // programme under it after the end. Its options are not even considered.
  if (asset.postroll) {
    return asset.outcome === 'skipped'
      ? 'A post-roll (CUE="POST") with no linear default: a non-linear ad is never presented after the ' +
        'programme ends, so it is skipped.'
      : 'A post-roll (CUE="POST"): a non-linear ad is never presented after the programme ends, so it ' +
        'plays its linear default, full frame, when the programme ends.';
  }
  const item = asset.items[0];
  const fallaron = item?.discarded.filter((d) => d.failed).length ?? 0;
  const ninguna = fallaron ? 'No option this device can show passed pre-validation' : 'No option fits this device';
  if (asset.outcome === 'drawn') {
    const orden = (item?.order ?? [item.chosen]).map((i) => i + 1);
    const antes = fallaron ? ` after ${fallaron} option${fallaron === 1 ? '' : 's'} failed pre-validation` : '';
    const resto = orden.length > 1 ? `, then option${orden.length > 2 ? 's' : ''} ${orden.slice(1).join(', ')}` : '';
    const red = asset.fallback ? ', then the linear default' : ', and no default after them';
    return `Handed to the renderer${antes}: option ${orden[0]} first${resto}${red}.`;
  }
  if (asset.outcome === 'default') {
    return `${ninguna}, so the break plays its default: the linear ad, full frame.`;
  }
  if (asset.outcome === 'skipped' && asset.defaultFailed) {
    return `${ninguna}, and the first request for the default failed (${asset.defaultFailed.error}), ` +
      'so the ad is skipped and the programme goes on.';
  }
  if (asset.outcome === 'skipped') {
    return `${ninguna} and this break has no default, so the ad is skipped and the programme goes on.`;
  }
  return 'A linear ad: the asset carries no layout block.';
}

/** A short form of `desenlace`, for a list of requests. */
export function desenlaceCorto(asset) {
  if (asset.postroll) {
    return asset.outcome === 'skipped' ? '→ post-roll, no linear default: skipped' : '→ post-roll: the linear default, after the programme';
  }
  const item = asset.items[0];
  const fallo = item?.discarded.some((d) => d.failed) ? ' (pre-validation discarded some)' : '';
  if (asset.outcome === 'drawn') {
    const orden = (item?.order ?? [item.chosen]).map((i) => i + 1).join(' → ');
    return `→ handed: option ${orden}${asset.fallback ? ' → default' : ''}${fallo}`;
  }
  if (asset.outcome === 'default') return `→ no option fits${fallo}: the linear default`;
  if (asset.outcome === 'skipped' && asset.defaultFailed) return `→ no option fits${fallo}, default failed to load: skipped`;
  if (asset.outcome === 'skipped') return `→ no option fits${fallo}, no default: skipped`;
  return '→ linear';
}

/**
 * WHAT WAS ACTUALLY PRESENTED, from the report of `onPresented` (ADR 0107): the
 * renderer's failover, which is always on, after every attempt that failed to
 * load on screen.
 */
export function presentado(reporte) {
  const intentos = reporte.attempts.map((a) =>
    `${a.linear ? 'the linear default' : `option ${a.index + 1}`} ${a.reason}${a.late ? ' (after its window opened)' : ''}`);
  const antes = intentos.length ? ` First ${intentos.join('; then ')}.` : '';
  if (reporte.outcome === 'skipped') return `On screen: nothing — nothing that was handed over loaded, so the ad was skipped.${antes}`;
  const p = reporte.presented;
  const que = p.linear ? 'the linear default, full frame' : `option ${p.index + 1} (${p.type})`;
  const tarde = reporte.late ? ` It was mounted ${reporte.lateBy.toFixed(1)} s after its window opened.` : '';
  return `On screen: ${que}.${antes}${tarde}`;
}

/** A short form of `presentado`, for a list of requests. */
export function presentadoCorto(reporte) {
  const n = reporte.attempts.length;
  const fallos = n ? ` after ${n} failed to load` : '';
  if (reporte.outcome === 'skipped') return `· shown: nothing${fallos}`;
  const p = reporte.presented;
  return `· shown: ${p.linear ? 'the linear default' : `option ${p.index + 1}`}${fallos}${reporte.late ? ', late' : ''}`;
}

/** The break a report of `onResolved` belongs to: `AD-A` is break `a` (one tag per break, ADR 0113). */
export const breakDelReporte = (seleccion) => seleccion.id.match(/^AD-([A-Z0-9]+)(?:-|$)/i)?.[1].toLowerCase() ?? null;

/**
 * The break of a report of the DASH pane (phase 19). An Event@id of an MPD is an
 * unsigned int, so `senalizar-dash.mjs` numbers the breaks of `stage.breaks` from
 * 1 and gives the traditional linear one the next number; this reads it back.
 */
export const breakDash = (id, stage) => {
  const n = Number(id);
  if (n >= 1 && n <= stage.breaks.length) return stage.breaks[n - 1].id;
  return n === stage.breaks.length + 1 ? stage.breakLineal?.id ?? null : null;
};

// ===========================================================================
// index.html: ONE CONTROL PER PANE (fase 15)
// ===========================================================================
// Each pane of the pair chooses its mode -- the native HLS interstitials client,
// our library over HLS, or our library over DASH (phase 19) -- and, with our
// library, the two axes. The configuration
// of the page is `{ izq: {modo, capacidades}, der: {...} }` and it travels in the
// URL, so a link opens a precise combination:
//
//     ?izq=nativo&der=ours-2dec-img        the default: the pair as published
//     ?izq=ours-1dec-img&der=ours-1dec-noimg
//     ?izq=ours-2dec-img&der=dash-2dec-img     the same stream over HLS and over DASH

const MODOS = { nativo: 'HLS interstitials, native', ours: 'With our library', dash: 'DASH, our library' };

/** The default of each pane: the pair as it was published. */
const POR_DEFECTO = (stage) => ({
  izq: { modo: 'nativo', capacidades: null },
  der: { modo: 'ours', capacidades: { ...stage.capacidades.inicial } }
});

/** One pane's configuration as it goes in the URL. */
export function aTexto(c) {
  if (c.modo === 'nativo') return 'nativo';
  return `${c.modo}-${c.capacidades.concurrentVideo}dec-${c.capacidades.concurrentImage ? 'img' : 'noimg'}`;
}

/** One pane's configuration out of the URL, or null when the text is not one. */
export function deTexto(texto, stage) {
  if (texto === 'nativo') return { modo: 'nativo', capacidades: null };
  const m = /^(ours|dash)-(\d+)dec-(img|noimg)$/.exec(texto || '');
  if (!m) return null;
  const concurrentVideo = Number(m[2]);
  if (!stage.capacidades.concurrentVideo.includes(concurrentVideo)) return null;
  return { modo: m[1], capacidades: { concurrentVideo, concurrentImage: m[3] === 'img' } };
}

/** The page's configuration from the query string, pane by pane, with the default for what is missing or wrong. */
export function leerConfig(search, stage) {
  const q = new URLSearchParams(search);
  const d = POR_DEFECTO(stage);
  return { izq: deTexto(q.get('izq'), stage) ?? d.izq, der: deTexto(q.get('der'), stage) ?? d.der };
}

/** The configuration written back into the URL, without adding a history entry per click. */
export function escribirConfig(config) {
  const q = new URLSearchParams(location.search);
  q.set('izq', aTexto(config.izq));
  q.set('der', aTexto(config.der));
  history.replaceState(null, '', `${location.pathname}?${q}`);
}

/**
 * The control of one pane: the two modes, and the two axes under the second.
 * `alCambiar(config)` receives the pane's whole configuration.
 */
export function crearControlDePane({ contenedor, stage, lado, inicial, alCambiar }) {
  let actual = structuredClone(inicial);
  const ultimaCapacidad = { ...(inicial.capacidades ?? stage.capacidades.inicial) };

  const boton = (texto, datos, alClic) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'step';
    b.textContent = texto;
    Object.assign(b.dataset, datos);
    b.addEventListener('click', alClic);
    return b;
  };
  const grupo = (titulo, botones) => {
    const g = document.createElement('div');
    g.className = 'axis';
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', `${titulo} (${lado})`);
    const t = document.createElement('span');
    t.className = 'axis-label';
    t.textContent = titulo;
    g.append(t, ...botones);
    return g;
  };

  const modos = Object.entries(MODOS).map(([modo, texto]) => boton(texto, { lado, modo }, () => {
    if (actual.modo === modo) return;
    actual = modo === 'nativo'
      ? { modo, capacidades: null }
      : { modo, capacidades: { ...ultimaCapacidad } };
    alCambiar(structuredClone(actual));
  }));
  const ejes = Object.entries(EJES).map(([clave, eje]) => grupo(eje.titulo,
    stage.capacidades[clave].map((valor) => boton(eje.valor(valor), { lado, eje: clave, valor: String(valor) }, () => {
      if (actual.modo === 'nativo' || actual.capacidades[clave] === valor) return;
      actual = { modo: actual.modo, capacidades: { ...actual.capacidades, [clave]: valor } };
      Object.assign(ultimaCapacidad, actual.capacidades);
      alCambiar(structuredClone(actual));
    }))));
  const cajaEjes = document.createElement('div');
  cajaEjes.className = 'pane-axes';
  cajaEjes.append(...ejes);
  const salida = document.createElement('p');
  salida.className = 'step-out';
  contenedor.replaceChildren(grupo('Mode', modos), cajaEjes, salida);

  function pintar(config) {
    actual = structuredClone(config);
    modos.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo === actual.modo)));
    cajaEjes.hidden = actual.modo === 'nativo';
    for (const b of cajaEjes.querySelectorAll('button')) {
      b.setAttribute('aria-pressed', String(actual.modo !== 'nativo'
        && String(actual.capacidades[b.dataset.eje]) === b.dataset.valor));
    }
    salida.textContent = actual.modo !== 'nativo'
      ? `asks${actual.modo === 'dash' ? ' for its $remote.slots' : ''} with ?${Object.entries(PARAMETROS).map(([clave, nombre]) =>
          `${nombre}=${clave === 'concurrentImage' ? (actual.capacidades[clave] ? 1 : 0) : actual.capacidades[clave]}`).join('&')}`
      : 'plays the Apple-class interstitial and replaces the programme with it';
  }
  pintar(actual);
  return { pintar, actual: () => structuredClone(actual) };
}

// ===========================================================================
// inspect.html: THE SAME CONTROL, ONE PLAYER (fase 15)
// ===========================================================================
// The single player of inspect.html takes the same control and the same grammar
// as a pane of index.html, in one key: `?modo=nativo`, `?modo=ours-1dec-img`.
// The default is the page as it was: our library, two decoders, images.

/** The configuration of inspect.html from the query string. */
export function leerModo(search, stage) {
  return deTexto(new URLSearchParams(search).get('modo'), stage) ?? POR_DEFECTO(stage).der;
}

/** The configuration of inspect.html written back into the URL. */
export function escribirModo(config) {
  const q = new URLSearchParams(location.search);
  q.set('modo', aTexto(config));
  history.replaceState(null, '', `${location.pathname}?${q}`);
}
