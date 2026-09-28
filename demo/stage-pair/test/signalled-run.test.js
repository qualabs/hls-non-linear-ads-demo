// signalled-run.test.js -- los tests de esta demo, y los únicos que hay.
//
// Qué miran: LA SEÑALIZACIÓN QUE ESTA DEMO SIRVE. La suite de `test/` prueba las
// funciones puras de la librería sobre datos congelados el día que se midieron
// (ADR 0023), así que nada de ahí notaría que el recorrido de ESTA demo cambió de
// forma.
//
// LO QUE SE ASSERTA SALE DE LO QUE EL SCRIPT ESCRIBIÓ DE VERDAD, y no del texto
// del script. Así que el test le pasa al señalizador una media playlist de nueve
// líneas por `SRC` y recoge sus salidas por `OUT` y `SIGNALLING`. No necesita
// ffmpeg ni un solo byte de video, que es lo que le permite correr en `npm test`
// sobre un clone limpio.
//
// ---------------------------------------------------------------------------
// LAS DOS AFIRMACIONES QUE ESTE ARCHIVO EXISTE PARA PROTEGER
// ---------------------------------------------------------------------------
// El ADR 0084: la capacidad del dispositivo degrada EL FORMATO del aviso y no el
// aviso. Entre las dos opciones de un break cambian el `type` y el `uri` del
// asset, y NADA MÁS, y se asserta campo por campo con su control.
//
// El ADR 0085: la respuesta es UNA, la misma para cualquier capacidad, y quien
// elige es la librería. Por eso el último test de esta sección le pasa los
// archivos escritos a `resolveAssetList` bajo las cuatro combinaciones del
// control y mira qué sale: es la única forma de saber que lo que la demo sirve y
// lo que la librería filtra encajan.
//
// Correr: npm test   (node --test desde la raíz, sin argumentos, que descubre
// esta carpeta junto con las otras cuatro)

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `MULTIVIEW_CLASS` y `MAX_BOXES` los agrega la tercera página: la clase que
// esta demo señaliza es la que la librería traduce, y el tope de cajas se lee de
// donde está declarado en lugar de copiarse de un ADR a un test.
import {
  CONCURRENT_CLASS, INTERSTITIAL_CLASS, LINEAR_TYPE, MAX_BOXES, MULTIVIEW_CLASS,
  resolveAssetList, usableCapabilities
} from '../../../lib/signalling.js';

const DEMO = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(join(DEMO, path), 'utf8');

/** El único archivo donde los segundos, las formas y las campañas están declarados. */
const STAGE = JSON.parse(read('stage.json'));

/**
 * La corrida, producida corriendo el señalizador de verdad.
 *
 * El fixture lleva las dos cosas que tiene que llevar: un EXT-X-PROGRAM-DATE-TIME,
 * contra el que se resuelve cada START-DATE (ADR 0005), y un EXTINF, que es antes
 * de dónde se insertan los tags.
 */
const PDT = '2026-09-14T10:00:00.000+0000';

function run(env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'stage-pair-'));
  const src = join(dir, 'index.m3u8');
  const out = join(dir, 'con-daterange.m3u8');
  const signalling = join(dir, 'signalling');
  mkdirSync(signalling);
  writeFileSync(
    src,
    [
      '#EXTM3U',
      '#EXT-X-VERSION:6',
      '#EXT-X-TARGETDURATION:4',
      '#EXT-X-PLAYLIST-TYPE:VOD',
      '#EXT-X-INDEPENDENT-SEGMENTS',
      '#EXTINF:3.000000,',
      `#EXT-X-PROGRAM-DATE-TIME:${PDT}`,
      'seg000.ts',
      '#EXT-X-ENDLIST',
      ''
    ].join('\n')
  );
  try {
    const hoja = execFileSync(join(DEMO, 'scripts/senalizar-contenido.sh'), {
      cwd: DEMO,
      env: { ...process.env, SRC: src, OUT: out, SIGNALLING: signalling, ...env },
      encoding: 'utf8'
    });
    // Se leen ACÁ, antes de que el `finally` borre el temporal. Y se lee el
    // DIRECTORIO y no la lista de nombres de stage.json, que es lo que permite
    // assertar cuántos archivos salieron.
    const escritos = Object.fromEntries(
      readdirSync(signalling).sort().map((name) => [name, JSON.parse(readFileSync(join(signalling, name), 'utf8'))])
    );
    const lista = (name) => {
      if (!(name in escritos)) throw new Error(`el señalizador no escribió ${name}`);
      return structuredClone(escritos[name]);
    };
    return { playlist: readFileSync(out, 'utf8'), escritos: Object.keys(escritos), lista, hoja };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Una línea de Date Range, como los atributos que se assertan sobre ella. */
const dateRanges = (playlist) =>
  playlist
    .split('\n')
    .filter((line) => line.startsWith('#EXT-X-DATERANGE:'))
    .map((line) => ({
      line,
      id: line.match(/ID="([^"]+)"/)?.[1],
      hlsClass: line.match(/CLASS="([^"]+)"/)?.[1],
      startDate: line.match(/START-DATE="([^"]+)"/)?.[1],
      assetList: line.match(/X-ASSET-LIST="([^"]+)"/)?.[1],
      plannedDuration: Number(line.match(/PLANNED-DURATION=([\d.]+)/)?.[1]),
      resumeOffset: /X-RESUME-OFFSET=/.test(line)
    }));

/** El primer ítem del bloque de layout de un asset-list concurrente. */
const bloque = (lista) => lista.ASSETS[0]['X-AD-CREATIVE-SIGNALING'].payload[0];

/** Las opciones de presentación del aviso de un break, en orden. */
const opciones = (lista) => bloque(lista).options;

/**
 * DÓNDE difieren dos objetos, como rutas de campo ordenadas.
 *
 * Es el instrumento de la aserción central, así que devuelve las rutas y no un
 * booleano: lo que hay que poder leer cuando esto se ponga rojo es cuál campo se
 * movió. Su control está más abajo.
 */
function diferencias(a, b, ruta = '') {
  if (a === b) return [];
  const objeto = (v) => v !== null && typeof v === 'object';
  if (!objeto(a) || !objeto(b)) return [ruta];
  const claves = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  return claves.flatMap((k) => diferencias(a?.[k], b?.[k], ruta ? `${ruta}.${k}` : k));
}

/** Los tres breaks, con su fila de stage.json al lado. */
const BREAKS = STAGE.breaks;
const CON_DEFAULT = BREAKS.filter((b) => b.lineal);
const SIN_DEFAULT = BREAKS.filter((b) => !b.lineal);

/** Los tags de un break en la playlist, por su ID. */
const tagsDe = (playlist, brk) => {
  const tags = dateRanges(playlist);
  return {
    lineal: tags.find((t) => t.id === `AD-${brk.id.toUpperCase()}-LINEAR`),
    concurrente: tags.find((t) => t.id === `AD-${brk.id.toUpperCase()}-CONCURRENT`)
  };
};

test('hay un break sin default y los otros dos con, que es lo que David pidió mostrar', () => {
  // ADR 0087. Sin un break de cada tipo, la corrida no muestra las dos salidas de
  // un aviso que no se puede dibujar.
  assert.equal(SIN_DEFAULT.length, 1, 'un break sin default');
  assert.equal(CON_DEFAULT.length, 2, 'dos con default');
});

test('la playlist sale con un tag por break sin default y dos por break con, y las clases son las del ADR 0007', () => {
  const { playlist, escritos } = run();
  // Los asset-lists, contados sobre el directorio: un concurrente por break y un
  // lineal por break con default. Un archivo de menos es un 404 en cámara.
  assert.deepEqual(
    escritos,
    BREAKS.flatMap((b) => [b.concurrente, b.lineal].filter(Boolean)).sort(),
    'los asset-lists, y ninguno de más'
  );
  const tags = dateRanges(playlist);
  assert.deepEqual(
    tags.map((t) => t.hlsClass),
    BREAKS.flatMap((b) => (b.lineal ? [INTERSTITIAL_CLASS, CONCURRENT_CLASS] : [CONCURRENT_CLASS])),
    'las clases, en el orden en que se escriben'
  );
});

test('los tags de un break comparten el START-DATE, y el instante es el que stage.json declara', () => {
  const origen = new Date(PDT).getTime();
  const { playlist } = run();
  for (const brk of BREAKS) {
    const { lineal, concurrente } = tagsDe(playlist, brk);
    assert.equal((new Date(concurrente.startDate).getTime() - origen) / 1000, brk.offset);
    if (brk.lineal) assert.equal(lineal.startDate, concurrente.startDate, `break ${brk.id}: un solo START-DATE`);
  }
});

test('el break sin default no lleva tag lineal ni URI, y los que tienen default llevan los dos', () => {
  // ADR 0087. Las dos ausencias van juntas: sin tag el pane de fábrica no
  // interrumpe, y sin `URI` la librería saltea el asset cuando no queda opción.
  // Los breaks con default son el control de la misma lectura: si la lectura no
  // supiera encontrar un tag lineal o un `URI`, los daría ausentes también ahí.
  const { playlist, lista } = run();
  for (const brk of SIN_DEFAULT) {
    assert.equal(tagsDe(playlist, brk).lineal, undefined, `break ${brk.id}: sin tag lineal`);
    assert.equal('URI' in lista(brk.concurrente).ASSETS[0], false, `break ${brk.id}: sin URI`);
  }
  for (const brk of CON_DEFAULT) {
    const pieza = STAGE.assets.piezas.find((p) => p.campana === brk.campana && p.forma === '16x9');
    assert.ok(tagsDe(playlist, brk).lineal, `break ${brk.id}: con tag lineal`);
    assert.equal(lista(brk.concurrente).ASSETS[0].URI, `/${pieza.video}`, `break ${brk.id}: el default es su lineal`);
  }
});

test('cada break con default trae SU lineal, con la duración de SU break: es donde muere el tramo invertido', () => {
  // ADR 0082. Los dos PLANNED-DURATION de un break coinciden, leídos de lo que el
  // script escribió y comparados contra stage.json.
  const { playlist, lista } = run();
  assert.equal(new Set(CON_DEFAULT.map((b) => b.lineal)).size, CON_DEFAULT.length, 'un lineal por break');
  for (const brk of CON_DEFAULT) {
    const { lineal, concurrente } = tagsDe(playlist, brk);
    assert.equal(lineal.assetList, `/signalling/${brk.lineal}`);
    assert.equal(lista(brk.lineal).ASSETS[0].DURATION, brk.duracion);
    assert.equal(lineal.plannedDuration, brk.duracion);
    assert.equal(concurrente.plannedDuration, brk.duracion, `break ${brk.id}: los dos panes duran lo mismo`);
  }
});

test('el lineal de cada break con default es el creativo 16:9 de su campaña', () => {
  const { lista } = run();
  for (const brk of CON_DEFAULT) {
    const pieza = STAGE.assets.piezas.find((p) => p.campana === brk.campana && p.forma === '16x9');
    assert.equal(lista(brk.lineal).ASSETS[0].URI, `/${pieza.video}`);
  }
});

test('el tag lineal va en la forma de reemplazo, o sea SIN X-RESUME-OFFSET', () => {
  // ADR 0017. El del tag concurrente sí se escribe y es inerte (ADR 0016).
  const tags = dateRanges(run().playlist);
  for (const tag of tags.filter((t) => t.hlsClass === INTERSTITIAL_CLASS)) {
    assert.equal(tag.resumeOffset, false, `${tag.id} no declara X-RESUME-OFFSET`);
  }
  for (const tag of tags.filter((t) => t.hlsClass === CONCURRENT_CLASS)) {
    assert.equal(tag.resumeOffset, true, `${tag.id} sí lo declara, y no significa nada`);
  }
});

test('cada break trae las dos opciones del aviso, primero el video y después la imagen', () => {
  // ADR 0085 y R5.5: el orden de las opciones es la preferencia, y la librería se
  // queda con la primera que la capacidad satisface. Con la imagen primero, un
  // dispositivo de dos decodificadores vería la imagen.
  const { playlist, lista } = run();
  for (const brk of BREAKS) {
    assert.equal(tagsDe(playlist, brk).concurrente.assetList, `/signalling/${brk.concurrente}`);
    const medios = opciones(lista(brk.concurrente)).map((o) => o.layout.assets.map((a) => a.type));
    assert.deepEqual(medios, [[STAGE.assets.tipos.video], [STAGE.assets.tipos.imagen]], `break ${brk.id}`);
  }
});

test('entre las dos opciones de un break cambian EXACTAMENTE el type y el uri del asset', () => {
  // ESTA ES LA AFIRMACIÓN DEL ADR 0084. Se asserta como IGUALDAD DE TODO MENOS DOS
  // CAMPOS y no como "los campos que me acordé de mirar coinciden": una lista de
  // campos deja afuera el campo que alguien agregue mañana.
  const { lista } = run();
  for (const brk of BREAKS) {
    const [video, imagen] = opciones(lista(brk.concurrente));
    assert.deepEqual(
      diferencias(video, imagen),
      ['layout.assets.0.type', 'layout.assets.0.uri'],
      `break ${brk.id}: las dos opciones difieren en algo más que el medio del asset`
    );
    // Y difieren de verdad en esos dos, o la lista de arriba saldría vacía y la
    // aserción pasaría por el motivo contrario.
    assert.notEqual(video.layout.assets[0].type, imagen.layout.assets[0].type);
    assert.notEqual(video.layout.assets[0].uri, imagen.layout.assets[0].uri);
  }
});

test('el chequeo de equivalencia ve un viewport movido en una sola de las dos opciones', () => {
  // EL CONTROL del test de arriba.
  const { lista } = run();
  const [video, imagen] = opciones(lista(BREAKS[0].concurrente));
  imagen.layout.assets[0].viewport = '0 0 0 0';
  assert.deepEqual(diferencias(video, imagen), [
    'layout.assets.0.type', 'layout.assets.0.uri', 'layout.assets.0.viewport'
  ]);
  const otra = opciones(lista(BREAKS[0].concurrente))[1];
  otra.layout.assets[0].volume = 100;
  assert.ok(diferencias(video, otra).includes('layout.assets.0.volume'),
    'un campo que está de un solo lado también es una diferencia');
});

test('el layout de cada break es el que stage.json declara, con sus cajas, en las dos opciones', () => {
  // ADR 0044: el `viewport` de la caja del aviso lo leen la señalización, la
  // captura a video y las páginas, así que sale de stage.json y no del script.
  const { lista } = run();
  for (const brk of BREAKS) {
    const forma = STAGE.formas[brk.forma];
    const item = bloque(lista(brk.concurrente));
    assert.equal(item.start, 0);
    assert.equal(item.duration, brk.duracion);
    for (const opcion of item.options) {
      assert.equal(opcion.type, forma.layout);
      assert.equal(opcion.type, brk.layout);
      assert.equal(opcion.layout.assets[0].viewport, forma.viewportAviso);
      assert.equal(opcion.layout.assets[0].zDepth, forma.zDepthAviso);
      if (forma.viewportPrimario === undefined) {
        // El lowerThirdOverlay no declara primaryContent, a propósito (ADR 0004).
        assert.ok(!('primaryContent' in opcion.layout), `${brk.id}: un overlay no declara primario`);
      } else {
        assert.deepEqual(opcion.layout.primaryContent, {
          zDepth: forma.zDepthPrimario,
          viewport: forma.viewportPrimario
        });
      }
    }
  }
});

test('el asset de cada break es la pieza de su campaña, en los dos medios', () => {
  // El inventario del ADR 0081: que el `uri` de cada opción salga de la misma fila
  // de stage.json es lo que hace que no puedan ser piezas distintas.
  const { lista } = run();
  for (const brk of BREAKS) {
    const pieza = STAGE.assets.piezas.find((p) => p.campana === brk.campana && p.forma === brk.forma);
    const [video, imagen] = opciones(lista(brk.concurrente));
    assert.equal(video.layout.assets[0].uri, `/${pieza.video}`);
    assert.equal(imagen.layout.assets[0].uri, `/${pieza.svg}`);
  }
});

test('la librería, sobre la misma respuesta, dibuja video, imagen, el lineal o nada según la capacidad', () => {
  // ADR 0085, de punta a punta sobre los archivos que la demo sirve: la respuesta
  // es una y la pantalla no. Se leen los medios que la composición tendría
  // encima del programa, que es lo que se ve en cámara.
  const { lista } = run();
  const dibuja = (brk, capacidad) => {
    const { warn, log } = console;
    console.warn = console.log = () => {};
    try {
      return resolveAssetList(lista(brk.concurrente), {
        id: brk.id, slotStart: brk.offset, capabilities: usableCapabilities(capacidad)
      }).map((e) => (e.type === LINEAR_TYPE ? 'lineal' : e.elements.find((x) => !x.primary).mediaType));
    } finally { console.warn = warn; console.log = log; }
  };
  const { video, imagen } = STAGE.assets.tipos;
  for (const brk of BREAKS) {
    assert.deepEqual(dibuja(brk, { videoDecoders: 2, imageOverVideo: true }), [video], `${brk.id}: 2 y con imágenes`);
    assert.deepEqual(dibuja(brk, { videoDecoders: 2, imageOverVideo: false }), [video], `${brk.id}: 2 y sin imágenes`);
    assert.deepEqual(dibuja(brk, { videoDecoders: 1, imageOverVideo: true }), [imagen], `${brk.id}: 1 y con imágenes`);
    assert.deepEqual(
      dibuja(brk, { videoDecoders: 1, imageOverVideo: false }),
      brk.lineal ? ['lineal'] : [],
      `${brk.id}: 1 y sin imágenes, ${brk.lineal ? 'cae al lineal' : 'se saltea'}`
    );
  }
});

test('el control del tramo invertido se puede encender, y desempareja los dos panes', () => {
  // La palanca de test/medir-tramo-invertido.py, probada donde se puede probar sin
  // navegador. Si no hiciera nada, la medición en verde de al lado no probaría nada.
  const { playlist } = run({ CONTROL_DURACION_CONCURRENTE: '24' });
  for (const brk of CON_DEFAULT) {
    const { lineal, concurrente } = tagsDe(playlist, brk);
    assert.equal(lineal.plannedDuration, brk.duracion, 'el lineal se queda con la suya');
    assert.equal(concurrente.plannedDuration, 24, 'el concurrente se desempareja');
  }
});

test('la hoja que el script imprime sale de los archivos y no de sí misma', () => {
  // La tabla con la que se graba: los segundos salen de lo que el asset-list
  // declara y los medios se leen del archivo escrito.
  const { hoja } = run();
  const esc = (t) => t.replace(/[./+]/g, '\\$&');
  for (const brk of BREAKS) {
    assert.match(hoja, new RegExp(`t=\\s*${brk.offset}s a\\s*${brk.offset + brk.duracion}s`));
    assert.match(hoja, new RegExp(
      `${esc(brk.concurrente)}\\s+${esc(STAGE.assets.tipos.video)}, luego ${esc(STAGE.assets.tipos.imagen)}; ` +
      (brk.lineal ? 'sin opción que entre, el lineal' : 'sin opción que entre, se saltea')
    ));
  }
});

// ===========================================================================
// LA TERCERA PÁGINA: LOS AVISOS PRIMERO Y DESPUÉS LA VENTANA (T-10)
// ===========================================================================
// Mismo criterio que arriba y mismo instrumento: se corre el señalizador DE
// VERDAD y se asserta sobre lo que escribió. Lo que cambia es qué señaliza --
// cuatro avisos de la clase concurrente y una ventana de la de multi view, en la
// misma playlist -- y que acá el árbol de contenido también es una entrada: el
// catálogo son las cámaras DECLARADAS que además están EMPAQUETADAS, así que el
// test le pasa un árbol falso y comprueba que el mismo script contesta un
// catálogo de una y uno de seis sin ser editado. Ni ffmpeg ni un byte de video.

const CARRERA = STAGE.carrera;
const CAMARAS = CARRERA.camaras;
const RACE_BREAKS = CARRERA.breaks;

/** La corrida de la carrera, con las cámaras que se le pidan empaquetadas. */
function correrCarrera(camaras = CAMARAS.map((c) => c.id), env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'stage-pair-race-'));
  const src = join(dir, 'index.m3u8');
  const out = join(dir, 'con-daterange.m3u8');
  const signalling = join(dir, 'signalling');
  const content = join(dir, 'content');
  mkdirSync(signalling);
  writeFileSync(
    src,
    [
      '#EXTM3U',
      '#EXT-X-VERSION:6',
      '#EXT-X-TARGETDURATION:2',
      '#EXT-X-PLAYLIST-TYPE:VOD',
      '#EXT-X-INDEPENDENT-SEGMENTS',
      '#EXTINF:2.000000,',
      `#EXT-X-PROGRAM-DATE-TIME:${PDT}`,
      'seg000.ts',
      '#EXT-X-ENDLIST',
      ''
    ].join('\n')
  );
  for (const id of camaras) {
    mkdirSync(join(content, id), { recursive: true });
    writeFileSync(join(content, id, 'index.m3u8'), '#EXTM3U\n');
  }
  try {
    const hoja = execFileSync(join(DEMO, 'scripts/senalizar-carrera.sh'), {
      cwd: DEMO,
      env: {
        ...process.env,
        RACE_SRC: src, RACE_OUT: out, RACE_CONTENT: content, RACE_SIGNALLING: signalling,
        ...env
      },
      encoding: 'utf8'
    });
    const escritos = Object.fromEntries(
      readdirSync(signalling).sort()
        .map((name) => [name, JSON.parse(readFileSync(join(signalling, name), 'utf8'))])
    );
    const lista = (name) => {
      if (!(name in escritos)) throw new Error(`el señalizador no escribió ${name}`);
      return structuredClone(escritos[name]);
    };
    return { playlist: readFileSync(out, 'utf8'), escritos: Object.keys(escritos), lista, hoja };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** El bloque de un asset-list de la carrera, sea aviso u oferta. */
const bloqueCarrera = (l) => l.ASSETS[0]['X-AD-CREATIVE-SIGNALING'];

test('la carrera sale con un tag por aviso más el de la ventana, y las dos clases son hermanas', () => {
  // EL CONTEO Y LAS CLASES, LEÍDOS DE LA SALIDA. Las dos clases del ADR 0063 en
  // una sola media playlist: la concurrente para los avisos y la de multi view
  // para la ventana. Ninguna extiende a la otra -- en HLS la clase se compara por
  // igualdad exacta de string -- y que convivan en la misma playlist es lo que
  // esta página muestra en una pantalla.
  //
  // Y NO HAY TAG DE CLASE APPLE ACÁ, que es lo que la separa de la señalización
  // del par: esta página no tiene pane de fábrica, así que un tag de reemplazo
  // sería algo que nadie quiso señalizar.
  const { playlist, escritos } = correrCarrera();
  assert.deepEqual(
    escritos,
    [...RACE_BREAKS.map((b) => b.lista), CARRERA.oferta].sort(),
    'los cuatro asset-lists de aviso y el de la oferta, y ninguno de más'
  );
  const tags = dateRanges(playlist);
  assert.equal(tags.length, RACE_BREAKS.length + 1);
  assert.deepEqual(
    tags.map((t) => t.hlsClass),
    [...RACE_BREAKS.map(() => CONCURRENT_CLASS), MULTIVIEW_CLASS]
  );
  assert.ok(!tags.some((t) => t.hlsClass === INTERSTITIAL_CLASS), 'ningún tag de reemplazo');
});

test('EL ORDEN ES EL ARGUMENTO: los cuatro avisos terminan antes de que la ventana abra', () => {
  // ESTA ES LA AFIRMACIÓN DE LA PÁGINA, assertada sobre la playlist: la
  // publicidad no lineal primero y la extensión de Qualabs después, sin un
  // instante en que las dos clases estén abiertas a la vez. Es también la
  // separación que David pidió entre una cosa y la otra, hecha visible en el
  // tiempo y no sólo en el árbol de archivos.
  //
  // Se calcula sobre los START-DATE de los tags y los largos de sus asset-lists,
  // que es lo que un cliente lee, y no sobre stage.json, que es lo que este
  // repositorio declara. Las dos puntas entre las que el número podría
  // despegarse son justamente ésas.
  const { playlist } = correrCarrera();
  const origen = new Date(PDT).getTime();
  const segundoDe = (t) => (new Date(t.startDate).getTime() - origen) / 1000;
  const tags = dateRanges(playlist);
  const ventana = tags.find((t) => t.hlsClass === MULTIVIEW_CLASS);
  const avisos = tags.filter((t) => t.hlsClass === CONCURRENT_CLASS);
  for (const aviso of avisos) {
    assert.ok(
      segundoDe(aviso) + aviso.plannedDuration <= segundoDe(ventana),
      `${aviso.id} termina en ${segundoDe(aviso) + aviso.plannedDuration}s y la ventana abre en ${segundoDe(ventana)}s`
    );
  }
  // Y en el orden de stage.json, cada uno donde se declaró.
  RACE_BREAKS.forEach((brk, i) => {
    assert.equal(segundoDe(avisos[i]), brk.offset);
    assert.equal(avisos[i].plannedDuration, brk.duracion);
  });
});

test('el chequeo del orden ve un aviso corrido adentro de la ventana', () => {
  // EL CONTROL, y sin él la aserción de arriba es un chequeo que no puede fallar.
  // La palanca es del generador y se prueba donde se puede probar sin navegador:
  // con CONTROL_AVISO_EN_VENTANA el último aviso arranca DESPUÉS de que la
  // ventana abrió, que es exactamente lo que la página afirma que no pasa. La
  // misma lectura tiene que cazarlo.
  const { playlist } = correrCarrera(undefined, { CONTROL_AVISO_EN_VENTANA: '1' });
  const origen = new Date(PDT).getTime();
  const segundoDe = (t) => (new Date(t.startDate).getTime() - origen) / 1000;
  const tags = dateRanges(playlist);
  const ventana = tags.find((t) => t.hlsClass === MULTIVIEW_CLASS);
  const solapados = tags
    .filter((t) => t.hlsClass === CONCURRENT_CLASS)
    .filter((t) => segundoDe(t) + t.plannedDuration > segundoDe(ventana));
  assert.equal(solapados.length, 1, 'el control corre exactamente un aviso adentro de la ventana');
  assert.equal(solapados[0].id, `RACE-${RACE_BREAKS.at(-1).id.toUpperCase()}-CONCURRENT`);
});

test('la ventana abre en carrera.ofertaEn y dura lo que su asset-list declara', () => {
  // ADR 0044: el segundo lo leen este script, para poner el START-DATE, y el
  // puente de la T-09, para saber desde qué instante de la escena capturar cada
  // cámara. Dos números tipeados en dos archivos se despegan el día que alguien
  // mueve uno, y acá el defecto que sale de ahí es el peor de esta página: las
  // cámaras mostrarían otro momento de la carrera que el programa.
  //
  // Y el largo que el tag declara es el que su asset-list suma, nunca un número
  // tipeado en el script: un tag que declara doce segundos de una ventana de
  // sesenta y cuatro es inerte para este player -- el rango se arma con las
  // experiencias -- y una mentira para cualquier otro cliente.
  const { playlist } = correrCarrera();
  const ventana = dateRanges(playlist).find((t) => t.hlsClass === MULTIVIEW_CLASS);
  const origen = new Date(PDT).getTime();
  assert.equal((new Date(ventana.startDate).getTime() - origen) / 1000, CARRERA.ofertaEn);
  assert.equal(ventana.plannedDuration, CARRERA.ofertaDura);
  assert.equal(ventana.assetList, `/signalling/${CARRERA.oferta}`);
  assert.doesNotMatch(read('scripts/senalizar-carrera.sh'), /PLANNED-DURATION=\d/);
});

test('el tag de la ventana no lleva X-RESTRICT y los de los avisos sí', () => {
  // El único atributo que separa una oferta de un aviso (ADR 0063). En un aviso
  // dice que el break no se puede saltear; en una oferta no hay break que
  // saltear, porque el programa nunca se detiene y componer es opcional.
  const tags = dateRanges(correrCarrera().playlist);
  for (const tag of tags) {
    const esVentana = tag.hlsClass === MULTIVIEW_CLASS;
    assert.equal(
      /X-RESTRICT=/.test(tag.line), !esVentana,
      `${tag.id}: ${esVentana ? 'una oferta no restringe' : 'un aviso sí'}`
    );
  }
});

test('la oferta anuncia un catálogo y no un layout', () => {
  // Regla del ADR 0064: una vista lleva `id`, `name`, `type` y `uri`, y NO
  // `viewport`, `zDepth` ni `volume`. Un viewport en una oferta sería una
  // posición calculada contra un número que quien publicó no conocía: cuántas
  // cajas iba a levantar quien mira. La grilla la calcula la librería (ADR 0065).
  const bloque = bloqueCarrera(correrCarrera().lista(CARRERA.oferta));
  assert.equal(bloque.type, 'offer');
  assert.equal(bloque.version, 2);
  const item = bloque.payload[0];
  assert.equal(item.type, 'multiViewOffer');
  assert.equal(item.start, 0);
  assert.equal(item.duration, CARRERA.ofertaDura);
  assert.equal(item.primaryName, CARRERA.programa.nombre);
  assert.ok(!('layout' in item), 'una oferta no declara layout');
  for (const view of item.views) {
    for (const campo of ['id', 'name', 'type', 'uri']) {
      assert.equal(typeof view[campo], 'string', `la vista ${view.id} trae ${campo}`);
    }
    for (const campo of ['viewport', 'zDepth', 'volume']) {
      assert.ok(!(campo in view), `la vista ${view.id} no declara ${campo}`);
    }
  }
  // El URI del Apéndice D.2 es el de la primera vista, que es lo que le deja algo
  // que reproducir al cliente que no lee el bloque (ADR 0019).
  const lista = correrCarrera().lista(CARRERA.oferta);
  assert.equal(lista.ASSETS[0].URI, item.views[0].uri);
  assert.equal(lista.ASSETS[0].DURATION, CARRERA.ofertaDura);
});

test('el catálogo son las cámaras EMPAQUETADAS, con el nombre que stage.json les da', () => {
  // LOS NOMBRES NO SE TIPEAN DOS VECES. La fila del selector es lo único que hace
  // que elegir una cámara signifique algo, y la palabra de esa fila sale del
  // asset-list; escrito a mano, el nombre de un auto viviría en dos archivos.
  //
  // Y EL CATÁLOGO ES TAN LARGO COMO LO QUE ESTÁ EMPAQUETADO, que es el chequeo
  // que la fase 13 hizo pasar de una cámara a seis sin que nadie editara un
  // script: el mismo señalizador contesta las dos cosas.
  const una = bloqueCarrera(correrCarrera([CAMARAS[0].id]).lista(CARRERA.oferta)).payload[0];
  assert.deepEqual(una.views.map((v) => v.id), [CAMARAS[0].id]);
  assert.deepEqual(una.views.map((v) => v.name), [CAMARAS[0].nombre]);

  const todas = bloqueCarrera(correrCarrera().lista(CARRERA.oferta)).payload[0];
  assert.deepEqual(todas.views.map((v) => v.id), CAMARAS.map((c) => c.id));
  assert.deepEqual(todas.views.map((v) => v.name), CAMARAS.map((c) => c.nombre));
  assert.deepEqual(todas.views.map((v) => v.uri), CAMARAS.map((c) => `/${c.video}`));
  assert.equal(new Set(todas.views.map((v) => v.uri)).size, todas.views.length);
  // Seis contra una grilla que tope en cuatro: un catálogo más largo que la
  // grilla es la mitad de lo que esta página argumenta, y el tope es de la
  // pantalla y nunca de la oferta (ADR 0066). El número se lee de la librería y
  // no se tipea: copiado acá, podría quedar viejo sin que nada avise.
  assert.ok(todas.views.length > MAX_BOXES, 'el catálogo entero es más largo que la grilla');
});

test('cada aviso de la carrera es la pieza de su campaña, en la forma que stage.json declara', () => {
  // El inventario del ADR 0081 visto desde la otra punta: las cuatro piezas que
  // el par no usa son las cuatro de esta página, así que las nueve piezas
  // autoradas se ven en la demo. Y las cajas salen de `stage.formas`, que es la
  // MISMA lectura que hace el generador del par: un `viewport` vive en un solo
  // lugar aunque lo usen dos páginas.
  const { lista } = correrCarrera();
  for (const brk of RACE_BREAKS) {
    const forma = STAGE.formas[brk.forma];
    const pieza = STAGE.assets.piezas.find((p) => p.campana === brk.campana && p.forma === brk.forma);
    assert.ok(pieza.usos.includes('race'), `${brk.campana}/${brk.forma} está declarada para la carrera`);
    const item = bloqueCarrera(lista(brk.lista)).payload[0];
    assert.equal(item.type, forma.layout);
    assert.equal(item.type, brk.layout);
    assert.equal(item.start, 0);
    assert.equal(item.duration, brk.duracion);
    const aviso = item.layout.assets[0];
    assert.equal(aviso.uri, `/${pieza.video}`);
    assert.equal(aviso.type, STAGE.assets.tipos.video, 'esta página no tiene escalón magro');
    assert.equal(aviso.viewport, forma.viewportAviso);
    assert.equal(aviso.zDepth, forma.zDepthAviso);
    if (forma.viewportPrimario === undefined) {
      assert.ok(!('primaryContent' in item.layout), `${brk.lista}: un overlay no declara primario`);
    } else {
      assert.deepEqual(item.layout.primaryContent, {
        zDepth: forma.zDepthPrimario, viewport: forma.viewportPrimario
      });
    }
    // El repliegue del ADR 0019 es el creativo 16:9 de la campaña: lo que un
    // cliente que no lee el bloque reproduce es el aviso a cuadro entero, y no
    // una tira de 8,89:1 en el medio de la pantalla.
    const dieciseisNueve = STAGE.assets.piezas.find((p) => p.campana === brk.campana && p.forma === '16x9');
    assert.equal(lista(brk.lista).ASSETS[0].URI, `/${dieciseisNueve.video}`);
    assert.equal(lista(brk.lista).ASSETS[0].DURATION, brk.duracion);
  }
});

test('la hoja de la carrera sale de los archivos y no de sí misma', () => {
  // La tabla con la que se graba. Los segundos se calculan sobre lo que cada
  // asset-list declara y los nombres se leen del que se acaba de escribir:
  // escrita a mano nombraría una cámara que puede no estar empaquetada.
  const { hoja } = correrCarrera();
  for (const brk of RACE_BREAKS) {
    assert.match(hoja, new RegExp(`t=\\s*${brk.offset}s a\\s*${brk.offset + brk.duracion}s`));
    assert.match(hoja, new RegExp(`\\b${STAGE.campanas[brk.campana].marca}\\b`));
  }
  assert.match(hoja, new RegExp(`t=${CARRERA.ofertaEn}s a ${CARRERA.ofertaEn + CARRERA.ofertaDura}s`));
  assert.match(hoja, new RegExp(`\\b${CARRERA.programa.nombre}\\b`));
  for (const camara of CAMARAS) assert.match(hoja, new RegExp(`\\b${camara.nombre}\\b`));
});
