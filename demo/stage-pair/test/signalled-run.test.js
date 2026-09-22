// signalled-run.test.js -- los tests de esta demo, y los únicos que hay.
//
// Qué miran: LA SEÑALIZACIÓN QUE ESTA DEMO SIRVE. La suite de `test/` prueba las
// funciones puras de la librería sobre datos congelados el día que se midieron
// (ADR 0023), así que nada de ahí notaría que el recorrido de ESTA demo cambió de
// forma.
//
// LO QUE SE ASSERTA SALE DE LO QUE EL SCRIPT ESCRIBIÓ DE VERDAD, y no del texto
// del script. La diferencia es todo el punto: leer el fuente y encontrar un
// printf que menciona una clase prueba que alguien la tipeó, no que la playlist
// salga con un tag de esa clase apuntando a un asset-list con el layout de este
// recorrido adentro. Así que el test le pasa al señalizador una media playlist de
// nueve líneas por `SRC` y recoge sus tres salidas por `OUT_RICA`, `OUT_MAGRA` y
// `SIGNALLING`. No necesita ffmpeg ni un solo byte de video, que es lo que le
// permite correr en `npm test` sobre un clone limpio.
//
// ---------------------------------------------------------------------------
// LA AFIRMACIÓN QUE ESTE ARCHIVO EXISTE PARA PROTEGER
// ---------------------------------------------------------------------------
// El ADR 0084 dice que la capacidad del dispositivo degrada EL FORMATO del aviso
// y no el aviso: entre la respuesta rica y la magra de un mismo break cambian el
// `type` y el `uri` del asset, y NADA MÁS. Ese "nada más" no es una prolijidad de
// implementación, es lo que la demo afirma en cámara, así que acá se asserta
// campo por campo y con su control: un `viewport` movido en una sola de las dos
// tiene que poner el test rojo.
//
// La librería se importa para las dos clases -- la clase que esta demo señaliza
// es la que la librería traduce, que es lo que hace que el tag llegue a alguna
// parte -- y una demo sí puede nombrar al sdk: lo que el ADR 0015 prohíbe es la
// dirección contraria.
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
// donde está declarado en lugar de copiarse de un ADR a un test, que es la clase
// de copia que queda vieja sin que nada avise.
import {
  CONCURRENT_CLASS, INTERSTITIAL_CLASS, MAX_BOXES, MULTIVIEW_CLASS
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
  const rica = join(dir, 'rica.m3u8');
  const magra = join(dir, 'magra.m3u8');
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
      env: { ...process.env, SRC: src, OUT_RICA: rica, OUT_MAGRA: magra, SIGNALLING: signalling, ...env },
      encoding: 'utf8'
    });
    // Los nueve se leen ACÁ, antes de que el `finally` borre el temporal: un
    // lector perezoso devolvería una función que abre un archivo que ya no está.
    // Y se lee el DIRECTORIO y no la lista de nombres de stage.json, que es lo que
    // permite assertar cuántos archivos salieron.
    const escritos = Object.fromEntries(
      readdirSync(signalling).sort().map((name) => [name, JSON.parse(readFileSync(join(signalling, name), 'utf8'))])
    );
    const lista = (name) => {
      if (!(name in escritos)) throw new Error(`el señalizador no escribió ${name}`);
      return structuredClone(escritos[name]);
    };
    return {
      rica: readFileSync(rica, 'utf8'),
      magra: readFileSync(magra, 'utf8'),
      escritos: Object.keys(escritos),
      lista,
      hoja
    };
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

/** El bloque de layout de un asset-list concurrente. */
const bloque = (lista) => lista.ASSETS[0]['X-AD-CREATIVE-SIGNALING'].payload[0];

/**
 * DÓNDE difieren dos objetos, como rutas de campo ordenadas.
 *
 * Es el instrumento de la aserción central, así que devuelve las rutas y no un
 * booleano: un booleano diría que difieren y no en qué, y lo que hay que poder
 * leer cuando esto se ponga rojo es exactamente cuál campo se movió. Su control
 * está más abajo, y sin él esta función sería un chequeo que no puede fallar.
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

test('cada playlist sale con los dos tags por break, y las clases son las dos del ADR 0007', () => {
  // EL CONTEO Y LAS CLASES, LEÍDOS DE LA SALIDA. Un tag que no se escribe es un
  // break que no pasa, y la playlist es el único lugar donde eso se ve. Dos por
  // break y no uno: el de clase Apple es lo que el pane de fábrica reproduce y el
  // concurrente lo que reproduce el nuestro, y la compatibilidad no sale de que
  // una clase extienda a la otra -- en HLS se comparan por igualdad exacta de
  // string -- sino de que la playlist sirva las dos cosas a la vez.
  const { rica, magra, escritos } = run();
  // Y los nueve asset-lists, contados sobre el directorio: tres por break -- el
  // lineal, el rico y el magro --, que es lo que las dos playlists apuntan entre
  // las dos. Un archivo de menos sería un break que carga un 404 en cámara.
  assert.deepEqual(
    escritos,
    BREAKS.flatMap((b) => [b.lineal, b.rica, b.magra]).sort(),
    'los nueve asset-lists, y ninguno de más'
  );
  for (const [nombre, playlist] of [['rica', rica], ['magra', magra]]) {
    const tags = dateRanges(playlist);
    assert.equal(tags.length, BREAKS.length * 2, `${nombre}: dos tags por break`);
    assert.deepEqual(
      tags.map((t) => t.hlsClass),
      BREAKS.flatMap(() => [INTERSTITIAL_CLASS, CONCURRENT_CLASS]),
      `${nombre}: las clases, en el orden en que se escriben`
    );
  }
});

test('los dos tags de un break comparten el START-DATE, y el segundo es el que stage.json declara', () => {
  // ADR 0007: el mismo instante en los dos, que es lo que hace que los dos panes
  // estén mostrando el mismo segundo del programa. Y el instante se compara como
  // instante y no como string, porque el script lo escribe en hora local.
  const origen = new Date(PDT).getTime();
  const corrida = run();
  for (const playlist of [corrida.rica, corrida.magra]) {
    const tags = dateRanges(playlist);
    BREAKS.forEach((brk, i) => {
      const [lineal, concurrente] = [tags[i * 2], tags[i * 2 + 1]];
      assert.equal(lineal.startDate, concurrente.startDate, `break ${brk.id}: un solo START-DATE`);
      assert.equal((new Date(lineal.startDate).getTime() - origen) / 1000, brk.offset);
    });
  }
});

test('cada break trae SU lineal, con la duración de SU break: es donde muere el tramo invertido', () => {
  // ADR 0082, y es la aserción cuyo error es el más caro de la task. En
  // compatibility-pair los cinco breaks comparten un asset-list lineal de 12 s
  // contra un break concurrente de 48, y de ahí sale que durante 12 de esos 48
  // segundos la comparación queda al revés. Acá cada lineal es propio y dura lo
  // que su break, así que los dos PLANNED-DURATION de un break coinciden.
  //
  // El largo NO se lee del script: se lee del asset-list que el script escribió y
  // se compara contra stage.json, que son las dos puntas entre las que el número
  // podría despegarse.
  const { rica, magra, lista } = run();
  const nombres = new Set(BREAKS.map((b) => b.lineal));
  assert.equal(nombres.size, BREAKS.length, 'un asset-list lineal por break y no uno compartido');

  for (const playlist of [rica, magra]) {
    const tags = dateRanges(playlist);
    BREAKS.forEach((brk, i) => {
      const [lineal, concurrente] = [tags[i * 2], tags[i * 2 + 1]];
      assert.equal(lineal.assetList, `/signalling/${brk.lineal}`);
      assert.equal(lista(brk.lineal).ASSETS[0].DURATION, brk.duracion);
      assert.equal(lineal.plannedDuration, brk.duracion);
      assert.equal(concurrente.plannedDuration, brk.duracion);
      assert.equal(
        lineal.plannedDuration,
        concurrente.plannedDuration,
        `break ${brk.id}: los dos panes duran lo mismo`
      );
    });
  }
});

test('el lineal de cada break es el creativo 16:9 de su campaña', () => {
  // ADR 0082: la misma pieza que el aviso concurrente del break A usa como aviso,
  // y la que ocupa el break entero del pane de fábrica en los tres. Por eso los
  // tres breaks duran lo mismo -- 12 s son el largo del creativo -- y por eso no
  // hay que recortar nada.
  const { lista } = run();
  for (const brk of BREAKS) {
    const pieza = STAGE.assets.piezas.find((p) => p.campana === brk.campana && p.forma === '16x9');
    assert.equal(lista(brk.lineal).ASSETS[0].URI, `/${pieza.video}`);
  }
});

test('el tag lineal va en la forma de reemplazo, o sea SIN X-RESUME-OFFSET', () => {
  // ADR 0017, y es la otra mitad de por qué los dos panes se quedan en el mismo
  // segundo del programa: sin el atributo el primario retoma donde el aviso
  // terminó. Escrito en 0 pediría lo contrario, y el pane de fábrica se atrasaría
  // la duración del aviso en cada break. El del tag concurrente sí se escribe y es
  // inerte (ADR 0016).
  const tags = dateRanges(run().rica);
  for (const tag of tags.filter((t) => t.hlsClass === INTERSTITIAL_CLASS)) {
    assert.equal(tag.resumeOffset, false, `${tag.id} no declara X-RESUME-OFFSET`);
  }
  for (const tag of tags.filter((t) => t.hlsClass === CONCURRENT_CLASS)) {
    assert.equal(tag.resumeOffset, true, `${tag.id} sí lo declara, y no significa nada`);
  }
});

test('cada playlist apunta a SU juego de asset-lists, y es todo lo que las separa', () => {
  // ADR 0083: la respuesta está horneada por valor, y la forma de hornearla es una
  // playlist por escalón. Los tags de clase Apple son los mismos en las dos -- el
  // pane de fábrica reproduce el mismo aviso lineal declare lo que declare el
  // dispositivo -- y lo único que cambia es a qué asset-list concurrente apunta
  // cada break.
  const { rica, magra } = run();
  const deRica = dateRanges(rica);
  const deMagra = dateRanges(magra);
  BREAKS.forEach((brk, i) => {
    assert.equal(deRica[i * 2 + 1].assetList, `/signalling/${brk.rica}`);
    assert.equal(deMagra[i * 2 + 1].assetList, `/signalling/${brk.magra}`);
    assert.equal(deRica[i * 2].line, deMagra[i * 2].line, `break ${brk.id}: el tag lineal es el mismo`);
  });
});

test('ningún asset-list magro declara un asset de video', () => {
  // La premisa sobre la que se apoya la escalera entera del ADR 0084: con un
  // decodificador el aviso se dibuja con un elemento de imagen, que no instancia
  // ningún player. Un `type` de video en el escalón magro pediría el segundo
  // decodificador que ese escalón no tiene, y no se vería hasta estar en cámara.
  const { lista } = run();
  for (const brk of BREAKS) {
    for (const asset of bloque(lista(brk.magra)).layout.assets) {
      assert.equal(asset.type, STAGE.assets.tipos.imagen, `${brk.magra}: ${asset.id}`);
    }
  }
});

test('el chequeo del escalón magro sabe encontrar un asset de video', () => {
  // EL CONTROL del test de arriba: un cero lo produce igual una búsqueda rota que
  // un juego de asset-lists correcto. Se le planta el `type` de video a una copia
  // y la misma lectura tiene que cazarlo.
  const { lista } = run();
  const magra = lista(BREAKS[0].magra);
  magra.ASSETS[0]['X-AD-CREATIVE-SIGNALING'].payload[0].layout.assets[0].type =
    STAGE.assets.tipos.video;
  const tipos = bloque(magra).layout.assets.map((a) => a.type);
  assert.deepEqual(tipos, [STAGE.assets.tipos.video], 'la lectura ve el type plantado');
});

test('entre la rica y la magra de un break cambian EXACTAMENTE el type y el uri del asset', () => {
  // ESTA ES LA AFIRMACIÓN QUE LA DEMO HACE (ADR 0084). El layout, el `viewport`, el
  // `zDepth`, el `id`, la campaña, la duración, el repliegue del ADR 0019 y hasta
  // el bloque `primaryContent` son idénticos: lo que la capacidad del dispositivo
  // degrada es el FORMATO del aviso y no el aviso.
  //
  // Se asserta como IGUALDAD DE TODO MENOS DOS CAMPOS y no como "los campos que me
  // acordé de mirar coinciden": una lista de campos a comparar deja afuera el
  // campo que alguien agregue mañana, que es justo el que rompería la afirmación.
  const { lista } = run();
  for (const brk of BREAKS) {
    const rutas = diferencias(lista(brk.rica), lista(brk.magra));
    assert.deepEqual(
      rutas,
      [
        'ASSETS.0.X-AD-CREATIVE-SIGNALING.payload.0.layout.assets.0.type',
        'ASSETS.0.X-AD-CREATIVE-SIGNALING.payload.0.layout.assets.0.uri'
      ],
      `break ${brk.id}: la rica y la magra difieren en algo más que el medio del asset`
    );
    // Y difieren de verdad en esos dos: si fueran iguales también, la lista de
    // rutas saldría vacía y la aserción de arriba pasaría por el motivo contrario.
    const [r, m] = [bloque(lista(brk.rica)), bloque(lista(brk.magra))];
    assert.notEqual(r.layout.assets[0].type, m.layout.assets[0].type);
    assert.notEqual(r.layout.assets[0].uri, m.layout.assets[0].uri);
  }
});

test('el chequeo de equivalencia ve un viewport movido en una sola de las dos', () => {
  // EL CONTROL, y es el que le da sentido al test de arriba. Si alguien mañana
  // mueve el `viewport` de la magra y no el de la rica, esto tiene que gritar: se
  // planta esa edición exacta sobre una copia y la lista de diferencias tiene que
  // traer tres rutas en lugar de dos.
  const { lista } = run();
  const brk = BREAKS[0];
  const magra = lista(brk.magra);
  bloque(magra).layout.assets[0].viewport = '0 0 0 0';
  const rutas = diferencias(lista(brk.rica), magra);
  assert.deepEqual(rutas, [
    'ASSETS.0.X-AD-CREATIVE-SIGNALING.payload.0.layout.assets.0.type',
    'ASSETS.0.X-AD-CREATIVE-SIGNALING.payload.0.layout.assets.0.uri',
    'ASSETS.0.X-AD-CREATIVE-SIGNALING.payload.0.layout.assets.0.viewport'
  ]);
  // Y la misma función tiene que ver un campo que sólo existe de un lado, que es
  // el otro modo de falla: uno agrega `volume` a la rica y nadie se entera.
  const otra = lista(brk.magra);
  bloque(otra).layout.assets[0].volume = 100;
  assert.ok(
    diferencias(lista(brk.rica), otra).includes(
      'ASSETS.0.X-AD-CREATIVE-SIGNALING.payload.0.layout.assets.0.volume'
    ),
    'un campo que está de un solo lado también es una diferencia'
  );
});

test('el layout de cada break es el que stage.json declara, con sus cajas', () => {
  // Que el tipo de layout y las cajas salgan de stage.json y no del script es el
  // ADR 0044 acá: el `viewport` de la caja del aviso lo leen la señalización, la
  // captura a video -- que saca cada creativo al tamaño exacto de su caja -- y las
  // páginas. Tipeado dos veces, un día el creativo sale a un tamaño y se dibuja en
  // otro, y eso se ve recién en cámara.
  const { lista } = run();
  for (const brk of BREAKS) {
    const forma = STAGE.formas[brk.forma];
    for (const nombre of [brk.rica, brk.magra]) {
      const item = bloque(lista(nombre));
      assert.equal(item.type, forma.layout);
      assert.equal(item.type, brk.layout);
      assert.equal(item.start, 0);
      assert.equal(item.duration, brk.duracion);
      assert.equal(item.layout.assets[0].viewport, forma.viewportAviso);
      assert.equal(item.layout.assets[0].zDepth, forma.zDepthAviso);
      if (forma.viewportPrimario === undefined) {
        // El lowerThirdOverlay no declara primaryContent, y es deliberado: la
        // herramienta de SVTA no lo emite en los dos overlays y la capa asume su
        // preset. Escribirlo sería divergir de lo que la herramienta emite, que es
        // lo que el ADR 0004 prohíbe.
        assert.ok(!('primaryContent' in item.layout), `${nombre}: un overlay no declara primario`);
      } else {
        assert.deepEqual(item.layout.primaryContent, {
          zDepth: forma.zDepthPrimario,
          viewport: forma.viewportPrimario
        });
      }
    }
  }
});

test('el asset de cada break es la pieza de su campaña, en los dos medios', () => {
  // El inventario del ADR 0081: nueve piezas de autoría, dieciocho assets. La
  // variante de imagen es el SVG autorado que vive en graphics/campaigns/ y va a
  // git; la de video es la salida del puente de la T-05, que vive en content/ y no
  // va. Que el `uri` de cada una salga de la misma fila de stage.json es lo que
  // hace que no puedan ser piezas distintas.
  const { lista } = run();
  for (const brk of BREAKS) {
    const pieza = STAGE.assets.piezas.find((p) => p.campana === brk.campana && p.forma === brk.forma);
    assert.equal(bloque(lista(brk.rica)).layout.assets[0].uri, `/${pieza.video}`);
    assert.equal(bloque(lista(brk.magra)).layout.assets[0].uri, `/${pieza.svg}`);
  }
});

test('el control del tramo invertido se puede encender, y desempareja los dos panes', () => {
  // El instrumento de la medición del navegador vive afuera de acá
  // (test/medir-tramo-invertido.py), pero SU PALANCA es de este script y se prueba
  // donde se puede probar sin navegador: con CONTROL_DURACION_CONCURRENTE el break
  // concurrente pasa a durar otra cosa que su lineal, que es exactamente lo que
  // compatibility-pair tiene. Si esta palanca no hiciera nada, la medición en
  // verde de al lado no probaría nada.
  const { rica } = run({ CONTROL_DURACION_CONCURRENTE: '24' });
  const tags = dateRanges(rica);
  BREAKS.forEach((brk, i) => {
    assert.equal(tags[i * 2].plannedDuration, brk.duracion, 'el lineal se queda con la suya');
    assert.equal(tags[i * 2 + 1].plannedDuration, 24, 'el concurrente se desempareja');
  });
});

test('la hoja que el script imprime sale de los archivos y no de sí misma', () => {
  // La tabla con la que se graba. Los segundos se calculan sobre lo que el
  // asset-list declara, y la columna del medio se lee del archivo escrito: escrita
  // a mano diría "image/svg+xml" aunque el archivo trajera un video.
  const { hoja } = run();
  for (const brk of BREAKS) {
    assert.match(hoja, new RegExp(`t=\\s*${brk.offset}s a\\s*${brk.offset + brk.duracion}s`));
    assert.match(hoja, new RegExp(`${brk.rica}\\s+${STAGE.assets.tipos.video.replace(/[./+]/g, '\\$&')}`));
    assert.match(hoja, new RegExp(`${brk.magra}\\s+${STAGE.assets.tipos.imagen.replace(/[./+]/g, '\\$&')}`));
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
