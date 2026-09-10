// comprobaciones.js -- las tres cosas de esta demo que se pueden romper en silencio
// editando un archivo, escritas como funciones puras.
//
// POR QUÉ SON FUNCIONES Y NO ASSERTS SUELTOS DENTRO DEL TEST: el test las corre sobre
// los archivos de verdad y la campaña de mutación las corre sobre copias rotas a
// propósito. Si cada chequeo viviera adentro de su `test()`, la campaña tendría que
// reimplementarlo, y un chequeo reimplementado es un chequeo distinto que puede pasar
// donde el original falla. Acá las dos corridas ejecutan exactamente el mismo código.
//
// Cada función devuelve una lista de hallazgos. Lista vacía es verde.

import { resolveAnchor } from '../js/story.js';

/**
 * El proveedor del contrato, armado desde los archivos declarados en lugar de desde un
 * player corriendo.
 *
 * Es la única parte de este archivo que reproduce algo que en vivo hace la librería, y
 * reproduce lo mínimo: dónde arranca el break y dónde arranca cada aviso adentro de él,
 * que es la suma acumulada de las DURATION del Apéndice D.2. Todo lo demás -- convertir
 * eso en el segundo de un beat -- lo hace `resolveAnchor`, que es el código de la
 * página y no una copia.
 */
export function proveedorDeclarado({ plate, assetList }) {
  const id = 'HYDRATION-BREAK';
  const assets = assetList.ASSETS || [];
  const largo = assets.reduce((s, a) => s + (Number(a.DURATION) || 0), 0);

  let cursor = plate.paradaEn;
  const experiences = assets.map((a, i) => {
    const startTime = cursor;
    cursor += Number(a.DURATION) || 0;
    return {
      id,
      itemId: `${id}.${i}`,
      type: a['X-AD-CREATIVE-SIGNALING']?.payload?.[0]?.type ?? 'linear',
      startTime,
      duration: Number(a.DURATION) || 0
    };
  });

  return {
    experiences,
    programRanges: () => ({
      ranges: [{ id, kind: 'concurrent', startTime: plate.paradaEn, duration: largo }],
      settled: true
    })
  };
}

/**
 * CHEQUEO 1 -- toda ancla del guion cae en un break y en un aviso que existen, y el
 * beat frena ANTES de lo que anuncia.
 *
 * Es el chequeo que hace que el ADR 0037 sea una propiedad y no una intención: el guion
 * se ancla a la señalización, así que un guion que referencia el aviso 4 de un break
 * que tiene tres tiene que ser un rojo y no una placa sobre otra cosa.
 *
 * Y mira las dos mitades. Que resuelva, y que el segundo que resuelve caiga antes del
 * arranque de la cosa anclada: un `lead` negativo o un ancla al aviso equivocado
 * resuelven perfecto y ponen la placa tarde, que es el mismo defecto con otra cara.
 */
export function anclasDelGuion({ story, provider }) {
  const hallazgos = [];
  const rangos = provider.programRanges().ranges.filter((r) => r.kind === 'concurrent');

  for (const beat of story.beats || []) {
    const at = resolveAnchor(beat.anchor, provider);
    if (at === null) {
      hallazgos.push(`el beat "${beat.id}" ancla a algo que la señalización no tiene: ` +
        JSON.stringify(beat.anchor));
      continue;
    }
    if (beat.anchor?.at === 'start') continue;

    const spec = beat.anchor.before ?? beat.anchor.at;
    const rango = rangos[spec.break - 1];
    let objetivo = rango.startTime;
    if (spec.ad != null) {
      const avisos = provider.experiences
        .filter((e) => e.id === rango.id)
        .sort((a, b) => a.startTime - b.startTime);
      objetivo = avisos[spec.ad - 1].startTime;
    }
    if (!(at < objetivo)) {
      hallazgos.push(`el beat "${beat.id}" resuelve en ${at}s y lo que anuncia arranca ` +
        `en ${objetivo}s: la placa llega tarde o justo encima`);
    }
  }
  return hallazgos;
}

/**
 * CHEQUEO 2 -- el break arranca en el corrimiento declarado de la parada del juego.
 *
 * El ADR 0044 dice que ese número vive en un solo lugar y que los dos scripts lo leen.
 * Esto es lo que hace que no sea un acuerdo verbal entre dos scripts: si alguien
 * escribe el segundo a mano en el script de señalización, la demo entera se corre de
 * lugar sin que nada falle -- el break entra sobre juego corriendo en lugar de sobre la
 * parada.
 */
export function elBreakArrancaEnLaParada({ plate, senalizador }) {
  const hallazgos = [];
  if (!/require\("\.\/plate\.json"\)\.paradaEn/.test(senalizador)) {
    hallazgos.push('el script de señalización no lee `paradaEn` de plate.json: si el ' +
      'segundo del break está escrito a mano, deja de seguir al plate (ADR 0044)');
  }
  if (!/require\("\.\/plate\.json"\)\.paradaEn|paradaEn/.test(senalizador) ||
      !Number.isFinite(plate.paradaEn)) {
    hallazgos.push('plate.json no declara un `paradaEn` numérico');
  }
  if (Number.isFinite(plate.paradaEn) && Number.isFinite(plate.paradaDura) &&
      Number.isFinite(plate.largo) &&
      plate.paradaEn + plate.paradaDura > plate.largo) {
    hallazgos.push(`la parada del juego termina en ${plate.paradaEn + plate.paradaDura}s ` +
      `y el plate dura ${plate.largo}s: el break se sale del programa`);
  }
  return hallazgos;
}

/**
 * CHEQUEO 3 -- el minuto declara sus tres formas de aviso.
 *
 * Cuatro avisos; exactamente uno SIN bloque de layout, que es el lineal del ADR 0019, y
 * TERCERO, que es el ADR 0043; y exactamente uno cuyos elementos son todos `image/*`,
 * que es el banner del ADR 0046.
 *
 * Sin esto, las tres formas dependen de que quien edite el asset list se acuerde de que
 * son tres. La capacidad de imagen fija en particular se pierde con una línea: cambiar
 * un `image/jpeg` por un `.m3u8` deja la demo andando y le saca el argumento.
 */
export function lasTresFormasDelMinuto({ assetList }) {
  const hallazgos = [];
  const assets = assetList.ASSETS || [];

  if (assets.length !== 4) {
    hallazgos.push(`el break declara ${assets.length} avisos y el minuto son cuatro`);
  }

  const sinBloque = assets
    .map((a, i) => ({ i, tiene: a['X-AD-CREATIVE-SIGNALING'] != null }))
    .filter((a) => !a.tiene);
  if (sinBloque.length !== 1) {
    hallazgos.push(`hay ${sinBloque.length} avisos sin bloque de layout y tiene que ` +
      'haber exactamente uno, que es el lineal a cuadro entero (ADR 0019)');
  } else if (sinBloque[0].i !== 2) {
    hallazgos.push(`el aviso lineal está en la posición ${sinBloque[0].i + 1} y va ` +
      'tercero (ADR 0043): ahí es donde el guion cuenta el caso de negocio');
  }

  const deImagen = assets.filter((a) => {
    const cajas = a['X-AD-CREATIVE-SIGNALING']?.payload?.[0]?.layout?.assets ?? [];
    return cajas.length > 0 && cajas.every((c) => /^image\//i.test(c.type || ''));
  });
  if (deImagen.length !== 1) {
    hallazgos.push(`hay ${deImagen.length} avisos de imagen fija y tiene que haber ` +
      'exactamente uno (ADR 0046): es la tercera forma que este minuto demuestra');
  }

  return hallazgos;
}
