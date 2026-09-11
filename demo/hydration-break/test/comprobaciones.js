// comprobaciones.js -- lo de esta demo que se puede romper en silencio editando un
// archivo, escrito como funciones puras.
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
 * CHEQUEO 2b -- el reparto de los avisos sale de plate.json y no del asset list.
 *
 * `plate.json` declara `avisos`, y las `DURATION` del asset list tienen que ser ésas.
 * Si los dos no coinciden, la demo **miente sin fallar**: el break dura lo que suman
 * las `DURATION` y el gráfico de la parada dura `paradaDura`, así que la publicidad
 * termina antes o después de la parada y en pantalla no se ve como un error, se ve como
 * otra demo.
 *
 * Y dos condiciones que vienen del techo de la generación: los avisos suman
 * `paradaDura`, y **cada uno es múltiplo de 8** -- que es el largo máximo de un
 * segmento generado, así que la parada entera es una cantidad entera de eslabones sin
 * un resto corto, que es el que peor sale.
 */
export function elRepartoSaleDeUnSoloLugar({ plate, assetList }) {
  const hallazgos = [];
  const avisos = plate.avisos;
  if (!Array.isArray(avisos) || avisos.length === 0) {
    hallazgos.push('plate.json no declara `avisos`, que es de donde sale el reparto');
    return hallazgos;
  }

  const suma = avisos.reduce((a, b) => a + b, 0);
  if (suma !== plate.paradaDura) {
    hallazgos.push(`los avisos suman ${suma}s y la parada dura ${plate.paradaDura}s: ` +
      'la publicidad no cubre la parada, y eso no falla, se ve como otra demo');
  }

  const noMultiplos = avisos.filter((a) => a % 8 !== 0);
  if (noMultiplos.length > 0) {
    hallazgos.push(`estos avisos no son múltiplos de 8: ${noMultiplos.join(', ')}. El ` +
      'techo de una generación son 8 s, así que un aviso que no es múltiplo deja un ' +
      'resto corto, que es el eslabón que peor sale');
  }

  const declaradas = (assetList.ASSETS || []).map((a) => Number(a.DURATION));
  if (declaradas.length !== avisos.length ||
      declaradas.some((d, i) => d !== avisos[i])) {
    hallazgos.push(`el asset list declara [${declaradas.join(', ')}] y plate.json ` +
      `[${avisos.join(', ')}]: el reparto vive en dos lugares y ya se despegó`);
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

/**
 * CHEQUEO 4 -- la galería de formas se dibuja del contrato y no de una lista de tipos
 * escrita a mano (ADR 0073).
 *
 * Es el chequeo que convierte el valor entero de la galería en una propiedad medible.
 * Ese valor es negativo —no puede quedar vieja— y una propiedad negativa que nadie mide
 * dura hasta el primer apuro: el día que alguien reemplace el dibujo por cuatro
 * imágenes o por una lista de nombres, la página deja de leer el contrato y nada se
 * entera.
 *
 * Y MIDE LA PROPIEDAD EN VEZ DE REPETIR LA CONCLUSIÓN. No pregunta si la galería "se
 * deriva", que no es una pregunta que un archivo conteste: pregunta si alguno de los
 * identificadores de layout que el asset list declara aparece escrito como literal en
 * los archivos que dibujan. Si aparece, alguien lo escribió, porque derivarlo es
 * exactamente no escribirlo.
 *
 * LOS IDENTIFICADORES SALEN DEL ASSET LIST Y NO DE UNA LISTA DE ACÁ, por la misma razón
 * que la galería: una lista escrita en este archivo envejece igual que la que persigue.
 * Si el asset list no declara ninguno, el que falla es el chequeo, y lo dice.
 *
 * `fuentes` es `[{ nombre, texto }]` -- el test le pasa los archivos de verdad y la
 * campaña de mutación una copia con un identificador plantado.
 */
export function laGaleriaSeDibujaDelContrato({ assetList, fuentes }) {
  const hallazgos = [];
  const identificadores = [...new Set((assetList.ASSETS || [])
    .flatMap((a) => a['X-AD-CREATIVE-SIGNALING']?.payload ?? [])
    .map((item) => item?.type)
    .filter((tipo) => typeof tipo === 'string' && tipo.length > 0))];

  if (identificadores.length === 0) {
    hallazgos.push('el asset list no declara ningún identificador de layout, así que este ' +
      'chequeo no tiene qué buscar y no puede dar rojo: el que está roto es el chequeo');
    return hallazgos;
  }

  for (const { nombre, texto } of fuentes) {
    for (const identificador of identificadores) {
      if (texto.includes(identificador)) {
        hallazgos.push(`\`${nombre}\` tiene escrito el identificador de layout ` +
          `\`${identificador}\`: la galería dejó de derivarse del contrato y pasó a ser una ` +
          'afirmación, que es lo que envejece sin que nadie se entere (ADR 0073)');
      }
    }
  }

  return hallazgos;
}

/** Los identificadores de layout que declara un ASSET; ninguno si no trae bloque. */
const tiposDeLayout = (asset) => {
  const payload = asset?.['X-AD-CREATIVE-SIGNALING']?.payload;
  return (Array.isArray(payload) ? payload : [])
    .map((item) => item?.type)
    .filter((tipo) => typeof tipo === 'string' && tipo.length > 0);
};

/**
 * CHEQUEO 5 -- cada pliegue de la señalización rotula el aviso que tiene adentro
 * (ADR 0075).
 *
 * El pliegue muestra el JSON crudo de un `ASSET` y lo rotula con una línea de resumen.
 * Si el rótulo y el JSON se despegan, la sección **miente sin fallar**: en pantalla se
 * ve un pliegue que dice `cornerOverlay` con adentro un aviso que declara otra cosa, y
 * eso no rompe nada, se lee como que la página está bien.
 *
 * Y ES EL CHEQUEO QUE HACE QUE EL RÓTULO SIGA SIENDO DERIVADO. La única forma de que
 * pase es que lo produzca la página leyendo el asset list, que es lo que hace
 * `labelsOfAssetList` en `js/senalizacion.js`. Escrito a mano, el rótulo se queda viejo
 * el día que alguien edite el asset list, y este chequeo es lo que se entera.
 *
 * `rotulos` entra por parámetro y no se calcula acá a propósito: el test le pasa los que
 * produce la página y la campaña de mutación le pasa una tanda escrita a mano, que es la
 * única manera de ver a este chequeo ponerse rojo.
 */
export function cadaPliegueRotulaSuAviso({ assetList, rotulos }) {
  const hallazgos = [];
  const assets = assetList.ASSETS || [];

  if (rotulos.length !== assets.length) {
    hallazgos.push(`la sección dibuja ${rotulos.length} pliegues y el asset list declara ` +
      `${assets.length} avisos: hay un aviso sin pliegue o un pliegue sin aviso`);
  }

  const identificadores = [...new Set(assets.flatMap(tiposDeLayout))];

  assets.forEach((asset, i) => {
    const rotulo = rotulos[i];
    if (rotulo == null) return;

    if (!rotulo.startsWith(`Ad ${i + 1} `)) {
      hallazgos.push(`el pliegue ${i + 1} se rotula "${rotulo}" y tiene adentro el aviso ` +
        `${i + 1} del break: el ordinal no es el del aviso que muestra`);
    }

    const propios = tiposDeLayout(asset);
    for (const tipo of propios) {
      if (!rotulo.includes(tipo)) {
        hallazgos.push(`el pliegue ${i + 1} no nombra \`${tipo}\`, que es el layout que su ` +
          'propio aviso declara');
      }
    }
    for (const tipo of identificadores) {
      if (!propios.includes(tipo) && rotulo.includes(tipo)) {
        hallazgos.push(`el pliegue ${i + 1} nombra \`${tipo}\`, que su aviso no declara: el ` +
          'rótulo dejó de salir del asset list');
      }
    }

    const duracion = Number(asset.DURATION);
    if (Number.isFinite(duracion) && !rotulo.includes(`${+duracion.toFixed(2)} s`)) {
      hallazgos.push(`el pliegue ${i + 1} no dice los ${duracion} s que declara su aviso`);
    }
  });

  return hallazgos;
}

/**
 * CHEQUEO 7 -- los medios que la sección 1 nombra salen del contrato y no están escritos
 * en la página (ADR 0073).
 *
 * Es el CHEQUEO 4 aplicado a la otra cosa derivada de la misma sección. La galería dibuja
 * DÓNDE va cada caja y el bloque de abajo dice QUÉ puede ir adentro, y los dos se apoyan
 * en lo mismo: que la página lea el asset list en vez de repetirlo. La forma más natural
 * de escribir ese bloque es tipear `image/png` al lado del dibujo, y ahí el bloque queda
 * viejo el día que el creativo cambie de formato, sin que nada falle.
 *
 * MIDE LA PROPIEDAD Y NO LA CONCLUSIÓN, igual que el CHEQUEO 4: no pregunta si el bloque
 * "se deriva", pregunta si alguno de los MIME que el asset list declara aparece escrito
 * como literal en los archivos que dibujan. Los discriminantes de la librería --
 * `/^image\//` y `/mpegurl/` -- no son ninguno de esos strings, así que la página puede
 * seguir clasificando sin nombrar.
 *
 * Y SI EL ASSET LIST NO DECLARA NINGÚN MIME, EL QUE ESTÁ ROTO ES EL CHEQUEO, que es la
 * misma salida que toma el CHEQUEO 4 cuando no hay identificadores que buscar.
 */
export function losMediosSalenDelContrato({ assetList, fuentes }) {
  const hallazgos = [];
  const medios = [...new Set((assetList.ASSETS || [])
    .flatMap((a) => a['X-AD-CREATIVE-SIGNALING']?.payload ?? [])
    .flatMap((item) => item?.layout?.assets ?? [])
    .map((caja) => caja?.type)
    .filter((tipo) => typeof tipo === 'string' && tipo.length > 0))];

  if (medios.length === 0) {
    hallazgos.push('el asset list no declara ningún tipo de medio, así que este chequeo no ' +
      'tiene qué buscar y no puede dar rojo: el que está roto es el chequeo');
    return hallazgos;
  }

  for (const { nombre, texto } of fuentes) {
    for (const medio of medios) {
      if (texto.includes(medio)) {
        hallazgos.push(`\`${nombre}\` tiene escrito el tipo de medio \`${medio}\`: lo que la ` +
          'sección dice que se puede poner en una caja dejó de leerse del asset list y pasó a ' +
          'ser una afirmación, que es lo que envejece sin que nadie se entere (ADR 0073)');
      }
    }
  }

  return hallazgos;
}

/** Los cinco niveles del bloque, escritos acá y no importados: que los dos lados tengan
 * que coincidir en los nombres es parte de lo que el chequeo mide. */
const NIVELES = ['asset', 'block', 'item', 'layout', 'element'];

/**
 * Los campos que un asset list trae, por nivel, recorridos como los recorre la librería.
 *
 * Es un recorrido PROPIO y no el de la página, y ahí está el valor del chequeo: si el de
 * la página dejara de bajar a las cajas del layout, sus filas no tendrían `viewport` y
 * éste sí, que es exactamente el rojo que hay que ver.
 */
function camposDelAssetList(assetList) {
  const encontrados = new Map(NIVELES.map((nivel) => [nivel, []]));
  const sumar = (nivel, fuente) => {
    const nombres = encontrados.get(nivel);
    for (const nombre of Object.keys(Object(fuente))) {
      if (!nombres.includes(nombre)) nombres.push(nombre);
    }
  };
  const lista = (valor) => (Array.isArray(valor) ? valor : []);

  for (const asset of lista(assetList?.ASSETS)) {
    sumar('asset', asset);
    const bloque = asset?.['X-AD-CREATIVE-SIGNALING'];
    if (bloque == null) continue;
    sumar('block', bloque);
    for (const item of lista(bloque.payload)) {
      sumar('item', item);
      const layout = item?.layout;
      if (layout == null) continue;
      sumar('layout', layout);
      if (layout.primaryContent != null) sumar('element', layout.primaryContent);
      for (const caja of lista(layout.assets)) sumar('element', caja);
    }
  }
  return encontrados;
}

/**
 * CHEQUEO 8 -- la glosa del bloque explica los campos que el asset list trae, y ninguno
 * más.
 *
 * La sección 3 muestra el JSON crudo de cada aviso y arriba explica qué es cada campo. Si
 * las dos mitades se despegan, la sección **miente sin fallar** de las dos formas: un
 * campo que el lector tiene delante y que nadie explicó se lee como que no importa, y una
 * explicación de un campo que el archivo no trae se lee como que el archivo lo trae.
 *
 * ES EL CHEQUEO QUE HACE QUE LA GLOSA SIGA SALIENDO DEL ASSET LIST. La única forma de
 * pasarlo es que la produzca la página recorriendo el archivo, que es lo que hace
 * `blockGlossOf` en `js/senalizacion.js`. Una glosa escrita a mano se queda vieja el día
 * que la herramienta emita un campo nuevo, y esto es lo que se entera.
 *
 * `filas` entra por parámetro por la misma razón que los rótulos del CHEQUEO 5: el test le
 * pasa las que produce la página y la campaña de mutación tandas armadas a mano, que es la
 * única manera de ver a este chequeo ponerse rojo. Son las filas TAL COMO la página las
 * produce -- `{ level, name, glossed }` --, sin traducir: una traducción en el medio es un
 * lugar donde el chequeo puede quedar mirando otra cosa que la que se dibuja.
 */
export function laGlosaDelBloqueExplicaSusCampos({ assetList, filas }) {
  const hallazgos = [];
  const encontrados = camposDelAssetList(assetList);
  const tiene = (nivel, nombre) => filas.some((f) => f.level === nivel && f.name === nombre);

  for (const nivel of NIVELES) {
    for (const nombre of encontrados.get(nivel)) {
      if (!tiene(nivel, nombre)) {
        hallazgos.push(`el asset list trae \`${nombre}\` en el nivel \`${nivel}\` y la glosa no ` +
          'lo explica: el lector lo tiene adelante en el JSON del pliegue y la página no dice ' +
          'qué es');
      }
    }
  }

  for (const fila of filas) {
    if (!NIVELES.includes(fila.level)) {
      hallazgos.push(`la glosa tiene una fila en el nivel \`${fila.level}\`, que no es uno de ` +
        `los del bloque (${NIVELES.join(', ')})`);
      continue;
    }
    if (!encontrados.get(fila.level).includes(fila.name)) {
      hallazgos.push(`la glosa explica \`${fila.name}\` en el nivel \`${fila.level}\`, que este ` +
        'asset list no trae: la glosa dejó de salir del archivo que la sección muestra');
    }
    if (!fila.glossed) {
      hallazgos.push(`la glosa no tiene qué decir de \`${fila.name}\` en el nivel ` +
        `\`${fila.level}\`: la página lo dice en pantalla, y acá es rojo`);
    }
  }

  return hallazgos;
}

/** El piso de programa visible entre dos placas consecutivas, en segundos.
 *
 * Sale de lo medido y no de un gusto: las dos separaciones más chicas que el guion
 * tiene hoy son 5,5 s y 6,0 s, así que 4 s no salta con lo que ya está y sí atrapa una
 * colisión. */
const PISO_DE_PARTIDO_ENTRE_PLACAS = 4;

/** El tope de lo que una placa se queda en pantalla, en segundos.
 *
 * Sale del mismo lado y con el mismo margen. El `hold` más largo que hay hoy son 7 s, y
 * el piso de arriba le deja a la separación más chica un margen de 1,375x antes de
 * saltar (5,5 / 4). Ese mismo margen del otro lado, sobre 7 s, da 9,6 s: 10 redondeando. */
const TOPE_DE_PLACA = 10;

/**
 * CHEQUEO 6 -- entre dos placas se ve partido, y ninguna placa se queda (ADR 0037).
 *
 * El CHEQUEO 1 mira cada placa POR SU CUENTA: que su ancla resuelva y que frene antes
 * de lo que anuncia. Nada miraba la RELACIÓN entre dos placas, y ahí hay un defecto que
 * pasa en verde: dos beats pueden resolver en el mismo segundo -- cada uno impecable
 * por separado -- y en pantalla eso es una placa que se va y otra que entra sin un
 * cuadro de partido en el medio.
 *
 * Y no es hipotético. Las separaciones de hoy no están declaradas en ningún lado: son
 * la consecuencia de los `lead` del guion, calculados a mano, así que la próxima
 * edición de textos las mueve en silencio. Los textos se editan seguido.
 *
 * QUÉ SE MIDE, QUE NO ES LO QUE PARECE. Mientras una placa está en pantalla el programa
 * está en pausa (ADR 0040), así que un `hold` NO consume tiempo de programa y dos
 * `hold` no se pueden solapar entre sí. Lo que se mide son SEGUNDOS DE PROGRAMA entre
 * el final de una placa y el comienzo de la siguiente, y con el programa frenado eso es
 * la resta de los dos segundos resueltos y nada más.
 *
 * EL `hold` SE MIDE APARTE PORQUE ES EL OTRO LADO DEL MISMO AGUJERO: un valor absurdo
 * no se pisa con nada, deja pasar este chequeo por la puerta de al lado, y aun así
 * rompe el minuto -- cuarenta segundos de placa sobre un partido congelado no se ven
 * como un error, se ven como que la demo se colgó.
 *
 * El orden es el que corre la página: los beats se resuelven, los que no resuelven se
 * saltean -- eso ya es el rojo del CHEQUEO 1, no de éste -- y el resto se ordena por
 * segundo, igual que la cola de `runStory`.
 */
export function elRitmoDelGuion({ story, provider }) {
  const hallazgos = [];

  const placas = (story.beats || [])
    .map((beat) => ({
      id: beat.id,
      at: resolveAnchor(beat.anchor, provider),
      // El 6 es el que aplica `runStory` cuando el beat no declara `hold`, así que lo
      // que se mide es lo que la página va a esperar y no lo que el archivo dice.
      hold: Number(beat.hold) || 6
    }))
    .filter((placa) => placa.at !== null)
    .sort((a, b) => a.at - b.at);

  for (let i = 0; i < placas.length - 1; i += 1) {
    const antes = placas[i];
    const despues = placas[i + 1];
    const partido = +(despues.at - antes.at).toFixed(3);
    if (partido < PISO_DE_PARTIDO_ENTRE_PLACAS) {
      hallazgos.push(`entre "${antes.id}" y "${despues.id}" se ven ${partido} s de ` +
        `programa y el piso son ${PISO_DE_PARTIDO_ENTRE_PLACAS} s: las dos placas se ` +
        'encadenan con un parpadeo de partido en el medio, que no falla, se ve como que ' +
        'la demo atropella');
    }
  }

  for (const placa of placas) {
    if (placa.hold > TOPE_DE_PLACA) {
      hallazgos.push(`la placa "${placa.id}" se queda ${placa.hold} s en pantalla y el ` +
        `tope son ${TOPE_DE_PLACA} s: con el programa congelado atrás, eso no se lee ` +
        'como una placa larga, se lee como que la demo se colgó');
    }
  }

  return hallazgos;
}
