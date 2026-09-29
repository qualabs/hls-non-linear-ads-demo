// capabilities.js -- the switch of index.html and inspect.html: what the device
// declares, one axis at a time (ADR 0086), and the sentences both pages print
// about what the library did with it (ADR 0085).
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
  videoDecoders: { titulo: 'Video decoders', valor: (v) => String(v) },
  imageOverVideo: { titulo: 'Images over video', valor: (v) => (v ? 'yes' : 'no') }
};

/** The query parameter each axis travels in, as the library writes it. */
export const PARAMETROS = {
  videoDecoders: QualabsConcurrentHls.VIDEO_DECODERS_PARAM,
  imageOverVideo: QualabsConcurrentHls.IMAGE_OVER_VIDEO_PARAM
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
      .map(([clave, nombre]) => `${nombre}=${clave === 'imageOverVideo' ? (actual[clave] ? 1 : 0) : actual[clave]}`)
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
  const pide = `needs ${opcion.needs.videoDecoders} video decoder${opcion.needs.videoDecoders === 1 ? '' : 's'}` +
    (opcion.needs.imageOverVideo ? ' and images over video' : '');
  return `Option ${indice + 1} · ${opcion.type} · ${medios.join(' + ')} · ${pide}`;
}

/**
 * What happened to an asset of a break, as one sentence, from the report the
 * library hands `onResolved` (`resolveAssetList` in lib/signalling.js).
 */
export function desenlace(asset) {
  const item = asset.items[0];
  if (asset.outcome === 'drawn') {
    const opcion = item?.offered[item.chosen];
    const medio = opcion?.media.every((m) => /^image\//i.test(m || '')) ? 'as an image' : 'in video';
    return `Drawn: option ${item.chosen + 1}, the ad ${medio}, over the programme.`;
  }
  if (asset.outcome === 'default') {
    return 'No option fits this device, so the break plays its default: the linear ad, full frame.';
  }
  if (asset.outcome === 'skipped') {
    return 'No option fits this device and this break has no default, so the ad is skipped and the programme goes on.';
  }
  return 'A linear ad: the asset carries no layout block.';
}

/** A short form of `desenlace`, for a list of requests. */
export function desenlaceCorto(asset) {
  const item = asset.items[0];
  if (asset.outcome === 'drawn') return `→ option ${item.chosen + 1} drawn (${item.offered[item.chosen].media.join(', ')})`;
  if (asset.outcome === 'default') return '→ no option fits: the linear default';
  if (asset.outcome === 'skipped') return '→ no option fits, no default: skipped';
  return '→ linear';
}

/** The break a report of `onResolved` belongs to: `AD-A-CONCURRENT` is break `a`. */
export const breakDelReporte = (seleccion) => seleccion.id.match(/^AD-([A-Z0-9]+)-/i)?.[1].toLowerCase() ?? null;

// ===========================================================================
// index.html: ONE CONTROL PER PANE (fase 15)
// ===========================================================================
// Each pane of the pair chooses its mode -- the native HLS interstitials client
// or our library -- and, only with our library, the two axes. The configuration
// of the page is `{ izq: {modo, capacidades}, der: {...} }` and it travels in the
// URL, so a link opens a precise combination:
//
//     ?izq=nativo&der=ours-2dec-img        the default: the pair as published
//     ?izq=ours-1dec-img&der=ours-1dec-noimg

const MODOS = { nativo: 'HLS interstitials, native', ours: 'With our library' };

/** The default of each pane: the pair as it was published. */
const POR_DEFECTO = (stage) => ({
  izq: { modo: 'nativo', capacidades: null },
  der: { modo: 'ours', capacidades: { ...stage.capacidades.inicial } }
});

/** One pane's configuration as it goes in the URL. */
export function aTexto(c) {
  if (c.modo === 'nativo') return 'nativo';
  return `ours-${c.capacidades.videoDecoders}dec-${c.capacidades.imageOverVideo ? 'img' : 'noimg'}`;
}

/** One pane's configuration out of the URL, or null when the text is not one. */
export function deTexto(texto, stage) {
  if (texto === 'nativo') return { modo: 'nativo', capacidades: null };
  const m = /^ours-(\d+)dec-(img|noimg)$/.exec(texto || '');
  if (!m) return null;
  const videoDecoders = Number(m[1]);
  if (!stage.capacidades.videoDecoders.includes(videoDecoders)) return null;
  return { modo: 'ours', capacidades: { videoDecoders, imageOverVideo: m[2] === 'img' } };
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
      if (actual.modo !== 'ours' || actual.capacidades[clave] === valor) return;
      actual = { modo: 'ours', capacidades: { ...actual.capacidades, [clave]: valor } };
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
    cajaEjes.hidden = actual.modo !== 'ours';
    for (const b of cajaEjes.querySelectorAll('button')) {
      b.setAttribute('aria-pressed', String(actual.modo === 'ours'
        && String(actual.capacidades[b.dataset.eje]) === b.dataset.valor));
    }
    salida.textContent = actual.modo === 'ours'
      ? `asks with ?${Object.entries(PARAMETROS).map(([clave, nombre]) =>
          `${nombre}=${clave === 'imageOverVideo' ? (actual.capacidades[clave] ? 1 : 0) : actual.capacidades[clave]}`).join('&')}`
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
