// dash-mpd.js -- what the pages of stage-pair read off the signalled MPD of the
// DASH mode (phase 19), as plain functions of its text and of stage.json.
//
// CARD 1 OF inspect.html SHOWS EACH BREAK'S Event AS IT IS WRITTEN IN THE MPD,
// and the text it reads is the response dash.js received (the page's own
// response interceptor, next to the library's: ADR 0128), so the MPD is not
// asked for a second time. The Event is cut out of that text as it is, CDATA
// and all, and not re-serialised out of a DOM, because the subject of the card
// is what the file says. What the library MADE of it -- the window it computed,
// the envelope it read -- comes from the library and not from here.
//
// No DOM and no global in this file, so `node --test` imports it
// (test/dash-mpd.test.js); `breakDash` lives here for the same reason and
// capabilities.js hands it on.

/**
 * The break of a report of the DASH mode. An Event@id of an MPD is an unsigned
 * int, so `senalizar-dash.mjs` numbers the breaks of `stage.breaks` from 1 and
 * gives the traditional linear one the next number; this reads it back. A
 * number or a string, because dash.js hands the id over as a number and the
 * library as the string it read.
 */
export const breakDash = (id, stage) => {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  if (n >= 1 && n <= stage.breaks.length) return stage.breaks[n - 1].id;
  return n === stage.breaks.length + 1 ? stage.breakLineal?.id ?? null : null;
};

/** An attribute of one start tag, or null. */
const atributo = (etiqueta, nombre) => etiqueta.match(new RegExp(`\\s${nombre}="([^"]*)"`))?.[1] ?? null;

/**
 * Every Event of every EventStream of the MPD's text, in document order:
 * `{ scheme, apertura, timescale, id, crudo, presentationTime, duration, cuerpo, replace }`.
 * `apertura` is the EventStream's start tag as written, `crudo` the whole Event
 * element as written, `cuerpo` its body (the CDATA's content, or its text) or
 * null, and `replace` the attributes of a ReplacePresentation, or null.
 * Comments are skipped, so a commented-out Event is not read.
 */
export function eventosDelMpd(texto) {
  const limpio = String(texto ?? '').replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));
  const eventos = [];
  for (const stream of limpio.matchAll(/<EventStream\b[^>]*>[\s\S]*?<\/EventStream>/g)) {
    const apertura = stream[0].match(/^<EventStream\b[^>]*>/)[0];
    const scheme = atributo(apertura, 'schemeIdUri');
    const timescale = Number(atributo(apertura, 'timescale') ?? 1) || 1;
    for (const ev of stream[0].matchAll(/<Event\b[^>]*?(?:\/>|>[\s\S]*?<\/Event>)/g)) {
      const crudo = ev[0];
      const inicio = crudo.match(/^<Event\b[^>]*?\/?>/)[0];
      const cdata = crudo.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
      const reemplazo = crudo.match(/<ReplacePresentation\b[^>]*>/)?.[0] ?? null;
      const interior = inicio.endsWith('/>') ? '' : crudo.slice(inicio.length, -'</Event>'.length);
      const texto = cdata ? cdata[1] : reemplazo ? null : interior.trim() || null;
      const numero = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
      eventos.push({
        scheme,
        apertura,
        timescale,
        id: atributo(inicio, 'id'),
        crudo,
        presentationTime: numero(atributo(inicio, 'presentationTime')),
        duration: numero(atributo(inicio, 'duration')),
        cuerpo: texto,
        replace: reemplazo
          ? {
            uri: atributo(reemplazo, 'uri'),
            maxDuration: numero(atributo(reemplazo, 'maxDuration')),
            executeOnce: atributo(reemplazo, 'executeOnce') === 'true'
          }
          : null
      });
    }
  }
  return eventos;
}

/** The Event of a break of stage.json, by the number `senalizar-dash.mjs` gave it, or null. */
export function eventoDelBreak(eventos, idDelBreak, stage) {
  return eventos.find((ev) => breakDash(ev.id, stage) === idDelBreak) ?? null;
}

/**
 * An Event as written, on a few lines: the start tag, the body, the end tag.
 * Lines are only broken BETWEEN the tags; nothing inside an attribute or inside
 * the CDATA is touched, so what is read is still the Event as it is written.
 */
export function eventoEnLineas(crudo) {
  const cdata = crudo.match(/<!\[CDATA\[[\s\S]*?\]\]>/);
  if (cdata) {
    const antes = crudo.slice(0, cdata.index);
    const despues = crudo.slice(cdata.index + cdata[0].length);
    return `${antes}\n  ${cdata[0]}\n${despues}`;
  }
  return crudo.replace(/>\s*</g, '>\n  <').replace(/\n {2}<\/Event>$/, '\n</Event>');
}

/** An Event's body as the JSON it carries, or null when it carries none or it is not JSON. */
export function sobreDelEvento(evento) {
  if (evento?.cuerpo == null) return null;
  try {
    return JSON.parse(evento.cuerpo);
  } catch {
    return null;
  }
}

/**
 * What a `$remote.slots` answer is made of, read off the answer itself: the
 * DASH twin of the summary of an HLS asset-list, in one line. A `slot`
 * envelope (SVTA2053 5.2.2.2.2) carries the Slots; each Slot's `media` is its
 * default linear ad (ADR 0122) and its `layoutOptions` the non-linear options.
 */
export function resumenDeSlots(cuerpo) {
  let sobre;
  try {
    sobre = JSON.parse(cuerpo);
  } catch {
    return 'the answer is not JSON';
  }
  if (!sobre || sobre.version !== 2 || sobre.type !== 'slot' || !Array.isArray(sobre.payload)) {
    return 'not a version 2 envelope of type "slot"';
  }
  const slots = sobre.payload;
  const opciones = slots.flatMap((s) => (Array.isArray(s?.layoutOptions) ? s.layoutOptions : []));
  const cajas = opciones.flatMap((o) => o?.layout?.assets ?? []);
  const conDefault = slots.some((s) => Array.isArray(s?.media) && s.media.some((m) => typeof m?.uri === 'string' && m.uri.trim()));
  const partes = [`envelope v${sobre.version} "${sobre.type}"`, `${slots.length} slot${slots.length === 1 ? '' : 's'}`];
  partes.push(`${opciones.length} option${opciones.length === 1 ? '' : 's'}`);
  partes.push(conDefault ? 'linear default (Slot.media)' : 'no default');
  const layouts = [...new Set(opciones.map((o) => o?.type).filter(Boolean))];
  if (layouts.length) partes.push(layouts.join(', '));
  const medios = [...new Set(cajas.map((c) => c?.type).filter(Boolean))];
  if (medios.length) partes.push(medios.join(', '));
  const duraciones = [...new Set(slots.map((s) => s?.duration).filter((d) => d != null))];
  if (duraciones.length) partes.push(`${duraciones.join(', ')} s`);
  return partes.join(' · ');
}

/**
 * What dash.js's own MPD event carried for an Event, as one sentence, from the
 * fields it hands an `EVENT_MODE_ON_RECEIVE` listener (`id`, the computed
 * presentation time, `duration`, `messageData`). Measured in T-01 of phase 19:
 * a body in CDATA reaches the event as `undefined`, and the attributes of a
 * ReplacePresentation do not reach it at all, which is why the library reads
 * the MPD's text (ADR 0128). The sentence says what arrived, so if a later
 * dash.js delivers the body, the card says so.
 */
export function lecturaDeDashjs(evento, { replace = false } = {}) {
  if (!evento) return 'dash.js has not handed this Event to a listener yet.';
  const cuando = Number.isFinite(evento.presentationTime)
    ? ` at ${Number(evento.presentationTime).toFixed(2)} s${Number.isFinite(evento.duration) ? ` for ${Number(evento.duration).toFixed(2)} s` : ''}`
    : '';
  const id = `id ${JSON.stringify(evento.id)}${typeof evento.id === 'number' ? ' (a number: dash.js parses it as an int)' : ''}`;
  const dato = evento.messageData;
  const llego = typeof dato === 'string' ? dato.trim() !== '' : dato != null && (dato.length ?? 1) > 0;
  if (replace) {
    return `dash.js's own event: ${id}${cuando}, and no ReplacePresentation attributes on it ` +
      '(no @uri, no @maxDuration): dash.js does not execute Alternative MPD, so the library reads the MPD (ADR 0125, 0128).';
  }
  return llego
    ? `dash.js's own event: ${id}${cuando}, with its body in messageData.`
    : `dash.js's own event: ${id}${cuando}, and messageData ${dato === undefined ? 'undefined' : 'empty'}: ` +
      'the body in CDATA did not reach it, which is why the library reads the MPD\'s text (ADR 0128).';
}
