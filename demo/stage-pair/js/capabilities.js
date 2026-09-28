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
