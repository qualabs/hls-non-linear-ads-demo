#!/usr/bin/env node
// LA ESCENA DE LA CARRERA, ESCRITA UNA VEZ Y ENMARCADA SIETE VECES.
//
// Emite los SVG animados que el puente de la T-05 captura a video: el programa
// (el corte de realizacion, que es el contenido primario de race.html) y una
// camara por auto (los feeds del catalogo de multi view).
//
// ============================================================================
// LA DECISION CENTRAL: UNA SOLA ESCENA, SIETE ENCUADRES
// ============================================================================
// La instruccion de abaratarlo fue "lo hacemos la misma para todos y despues
// cambiamos el color del auto". Recolorear solo NO alcanza y el motivo es que se
// ve: seis clips que son el mismo movimiento con otro color se leen como seis
// copias, no como seis camaras, y una fila del selector deja de significar algo.
// Es el R1 de la fase 13, y aca se resuelve por construccion.
//
// El dibujo de la escena se escribe UNA vez (escena()) y los siete archivos lo
// comparten byte por byte. Lo unico que cambia entre archivo y archivo son las
// dos animaciones de la camara: cuanto se acerca y a donde apunta. Cada camara
// sigue a SU auto, asi que ve a los demas entrar y salir de cuadro en momentos
// distintos, que es lo que las vuelve camaras de la MISMA carrera.
//
// ============================================================================
// COMO SE MUEVE LA CAMARA, Y POR QUE ASI
// ============================================================================
// Se anima el `transform` de un grupo y NO el `viewBox` de la raiz. Que `viewBox`
// anime no esta verificado en este proyecto; animar un grupo es lo que
// `zumbra-16x9.svg` ya hace y lo que la T-05 ya capturo nueve veces.
//
// El armado es de dos grupos anidados, porque un elemento admite UNA sola
// animacion de `transform` en modo replace:
//
//     <g>  animateTransform translate   <- la camara apunta
//       <g transform|animate scale>     <- la camara se acerca
//         ...la escena...
//
// Un punto p del mundo cae en pantalla en z*p + T. Que el auto quede en el
// centro C del cuadro pide T(t) = C - z * p_auto(t), y eso es lo que se calcula
// y se emite muestreado.
//
// POR QUE LA INTERPOLACION LINEAL NO DESPEGA LA CAMARA DEL AUTO. Los dos lados
// se muestrean en LA MISMA grilla de tiempos, y T = C - z*p es afin en p: la
// interpolacion lineal de C - z*p es exactamente C - z por la interpolacion
// lineal de p. La camara queda pegada al auto tambien ENTRE muestras, y no por
// suerte sino por la forma de la cuenta. Si las dos grillas fueran distintas,
// no.
//
// EL CORTE DE REALIZACION DEL PROGRAMA ES UN SALTO DE UN CUADRO, Y ESO CUESTA
// UNA PAREJA DE MUESTRAS. Con interpolacion lineal un cambio de valor se
// reparte sobre todo el intervalo, asi que un corte puesto sobre la grilla de
// 0,2 s se veria como un barrido de seis cuadros. El corte se emite como dos
// muestras separadas 1/60 s: la de antes con el encuadre viejo y la de t con el
// nuevo. Ningun cuadro capturado a 30 fps cae adentro de esos 1/60 s, asi que el
// corte es limpio y las claves siguen siendo estrictamente crecientes, que es lo
// que SMIL pide.
//
// ============================================================================
// EL CIRCUITO
// ============================================================================
// Una linea media cerrada que pasa por doce puntos de control, suavizada con
// Catmull-Rom y remuestreada por longitud de arco. De ahi salen tres cosas: el
// asfalto (la linea media engrosada), los carriles (la linea media corrida por
// su normal, uno por auto) y la posicion y el angulo de cada auto en cada
// instante.
//
// LOS AUTOS VAN EN TRES PAREJAS REPARTIDAS POR EL CIRCUITO. Si los seis
// estuvieran juntos, las seis camaras verian lo mismo y el encuadre no estaria
// haciendo nada; si estuvieran repartidos de a uno, no habria carrera. De a dos,
// con tiempos de vuelta casi iguales adentro de la pareja y una ondulacion
// periodica encima, hay tres peleas rueda a rueda en tres lugares distintos de la
// pista al mismo tiempo, y ninguna camara comparte el fondo con otra.
//
// LA ONDULACION CIERRA EL BUCLE Y NO HACE RETROCEDER A NADIE. Su amplitud esta
// acotada por debajo de la velocidad media, asi que la posicion sobre la pista
// es monotona: un auto acelera y afloja, nunca va marcha atras.
//
// NI NUMEROS NI PATROCINADORES EN LOS AUTOS. El auto se reconoce por el color;
// el nombre vive en la fila del selector, que es texto del navegador. Tampoco
// hay una sola letra en la escena, por la misma razon por la que las marcas de
// los creativos son de fantasia: nada que se pueda leer como una marca, un
// equipo o un piloto real.
//
// LOS NUMEROS QUE OTRA TASK NECESITA VIVEN EN stage.json (ADR 0044): el largo,
// la cadencia, donde abre la ventana, y la lista de camaras con su nombre y su
// color. Lo que vive ACA es la receta (ADR 0061): la geometria del circuito, los
// carriles, los tiempos de vuelta, los zooms y el plan de cortes. Son decisiones
// de realizacion, no numeros que otro archivo tenga que leer.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stage = JSON.parse(fs.readFileSync(path.join(RAIZ, 'stage.json'), 'utf8'));
const C = stage.carrera;

const ANCHO = C.salida.ancho;
const ALTO = C.salida.alto;
const LARGO = C.largo;          // s de escena
const PASO = 0.2;               // s entre muestras de la camara y de los autos
const CUADRO = 1 / C.fps;       // s; el salto de un corte dura la mitad de esto

// ── El circuito ─────────────────────────────────────────────────────────────
// Doce puntos de control, en sentido horario, sobre un mundo de 3600 x 2000.
// La recta principal es la de abajo, que es donde estan las tribunas y la linea
// de largada.
const CONTROL = [
  [600, 1620], [1450, 1730], [2350, 1700], [3060, 1500],
  [3320, 1130], [3180, 760], [3060, 420], [2450, 300],
  [1800, 430], [1150, 320], [600, 500], [330, 1060],
];
const ASFALTO = 150;            // ancho del asfalto en unidades de mundo
const CARRIL = 46;              // separacion entre carriles

function catmull(pts, porSegmento = 28) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let k = 0; k < porSegmento; k++) {
      const t = k / porSegmento, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
}

const LINEA = catmull(CONTROL);
const ACUM = [0];
for (let i = 1; i <= LINEA.length; i++) {
  const a = LINEA[i - 1], b = LINEA[i % LINEA.length];
  ACUM.push(ACUM[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
}
const VUELTA = ACUM[LINEA.length];

/** Punto, tangente y normal a la distancia s sobre la linea media. */
function enS(s) {
  const u = ((s % VUELTA) + VUELTA) % VUELTA;
  let lo = 0, hi = LINEA.length;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ACUM[m] <= u) lo = m; else hi = m; }
  const a = LINEA[lo], b = LINEA[(lo + 1) % LINEA.length];
  const seg = ACUM[lo + 1] - ACUM[lo];
  const f = seg > 0 ? (u - ACUM[lo]) / seg : 0;
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
  return { x: a[0] + dx * f, y: a[1] + dy * f, tx: dx / d, ty: dy / d, nx: -dy / d, ny: dx / d };
}

const corrido = (d) => LINEA.map((_, i) => {
  const p = enS(ACUM[i]);
  return [p.x + p.nx * d, p.y + p.ny * d];
});
const aPath = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';

// ── Los autos ───────────────────────────────────────────────────────────────
// id, carril, vuelta en segundos, largada (fraccion de vuelta), amplitud y fase
// de la ondulacion, y los dos parametros del encuadre de SU camara: cuanto se
// acerca (zoom) y cuanto corre el centro hacia adelante del auto (lead). El
// color sale de stage.json, que es donde lo lee tambien el selector.
//
// TRES PAREJAS EN TRES PUNTOS DEL CIRCUITO, Y ADENTRO DE CADA PAREJA UNA CAMARA
// ABIERTA Y UNA CERRADA. Las parejas estan a 0, 0,34 y 0,67 de vuelta, asi que
// hay tres peleas rueda a rueda pasando a la vez en tres lugares distintos. Y las
// dos camaras de una misma pelea no se pueden confundir: una va a 1,5 con el
// centro 110 unidades adelante del auto (el auto queda atras en el cuadro y se ve
// a donde va) y la otra a 2,45 con el centro 40 atras (el auto queda adelante y
// se ve de quien se escapa). Sin eso las dos camaras de una pareja serian el
// mismo plano con otro color, que es el defecto que esta task existe para
// evitar.
const CINE = {
  caldrix: { carril: -1.2, vuelta: 22.90, largada: 0.000, onda: 0.018, fase: 0.0, zoom: 1.35, lead: 130 },
  marvok:  { carril:  0.6, vuelta: 23.05, largada: 0.014, onda: 0.021, fase: 2.4, zoom: 2.45, lead: -40 },
  noctev:  { carril: -0.8, vuelta: 22.80, largada: 0.338, onda: 0.019, fase: 4.0, zoom: 1.45, lead: 120 },
  runtak:  { carril:  1.0, vuelta: 22.95, largada: 0.352, onda: 0.020, fase: 0.9, zoom: 2.35, lead: -35 },
  pentav:  { carril: -1.4, vuelta: 23.10, largada: 0.672, onda: 0.017, fase: 3.3, zoom: 1.40, lead: 140 },
  quentra: { carril:  0.4, vuelta: 22.85, largada: 0.686, onda: 0.022, fase: 5.4, zoom: 2.40, lead: -45 },
};
const AUTOS = C.camaras.map((c) => ({ ...c, ...CINE[c.id] }));
for (const a of AUTOS) {
  if (a.carril === undefined) throw new Error(`escribir-carrera: ${a.id} no tiene realizacion en CINE`);
  // La ondulacion no puede superar a la velocidad media, o el auto retrocederia.
  const vMedia = 1 / a.vuelta;                       // vueltas por segundo
  const vOnda = a.onda * 2 * Math.PI * 2 / LARGO;    // dos ciclos en toda la escena
  if (vOnda >= vMedia) throw new Error(`escribir-carrera: ${a.id} retrocede`);
}

/** Posicion y angulo del auto en el instante t. */
function auto(a, t) {
  const s = VUELTA * (a.largada + t / a.vuelta + a.onda * Math.sin(2 * Math.PI * 2 * t / LARGO + a.fase));
  const p = enS(s);
  return {
    x: p.x + p.nx * a.carril * CARRIL,
    y: p.y + p.ny * a.carril * CARRIL,
    ang: Math.atan2(p.ty, p.tx) * 180 / Math.PI,
    tx: p.tx, ty: p.ty,
  };
}

// ── La escena, escrita UNA vez ──────────────────────────────────────────────
function escena() {
  const centro = aPath(LINEA.map((_, i) => { const p = enS(ACUM[i]); return [p.x, p.y]; }));
  const borde = (d) => aPath(corrido(d));
  const s = [];

  s.push(`<defs>
    <linearGradient id="pasto" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#20362a"/><stop offset="1" stop-color="#16241d"/>
    </linearGradient>
    <linearGradient id="asfalto" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#4a4f55"/><stop offset="1" stop-color="#33373c"/>
    </linearGradient>
    <radialGradient id="sombra" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#000" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>`);

  // El fondo desborda el mundo en todas las direcciones: una camara pegada a un
  // auto del borde exterior mira afuera del circuito, y ahi no puede haber
  // transparencia, que el empaquetado aplanaria contra negro.
  s.push(`<rect x="-3000" y="-3000" width="10000" height="8000" fill="url(#pasto)"/>`);

  // Relieve del pasto: bandas de corte, que es lo que hace que el movimiento se
  // lea cuando la camara pasa por encima.
  for (let i = -6; i < 30; i++) {
    s.push(`<rect x="-3000" y="${i * 190}" width="10000" height="95" fill="#ffffff" opacity="0.022"/>`);
  }

  // Trampas de grava, agua y arboledas: los puntos de referencia que hacen que
  // dos encuadres se distingan. Estan repartidos por todo el circuito a
  // proposito.
  s.push(`<ellipse cx="3320" cy="1300" rx="240" ry="190" fill="#8a7a5e" opacity="0.85"/>`);
  s.push(`<ellipse cx="2760" cy="180" rx="300" ry="150" fill="#8a7a5e" opacity="0.85"/>`);
  s.push(`<ellipse cx="250" cy="1400" rx="260" ry="200" fill="#8a7a5e" opacity="0.85"/>`);
  s.push(`<ellipse cx="1700" cy="1080" rx="420" ry="230" fill="#1d3f4e"/>`);
  s.push(`<ellipse cx="1700" cy="1060" rx="380" ry="200" fill="#28576b"/>`);
  for (const [cx, cy, r, n] of [[900, 900, 60, 7], [2450, 900, 55, 6], [3450, 700, 50, 5], [520, 1800, 58, 6], [2200, 1900, 52, 7], [1150, 180, 56, 6]]) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, rr = r * (0.7 + 0.3 * ((i * 7) % 5) / 5);
      s.push(`<circle cx="${(cx + Math.cos(a) * r * 1.6).toFixed(0)}" cy="${(cy + Math.sin(a) * r * 1.1).toFixed(0)}" r="${rr.toFixed(0)}" fill="#1b3527"/>`);
      s.push(`<circle cx="${(cx + Math.cos(a) * r * 1.6 - rr * 0.25).toFixed(0)}" cy="${(cy + Math.sin(a) * r * 1.1 - rr * 0.25).toFixed(0)}" r="${(rr * 0.65).toFixed(0)}" fill="#2a4d36"/>`);
    }
  }

  // El asfalto y sus lineas.
  s.push(`<path d="${centro}" fill="none" stroke="#12181c" stroke-width="${ASFALTO + 26}" stroke-linejoin="round"/>`);
  s.push(`<path d="${centro}" fill="none" stroke="url(#asfalto)" stroke-width="${ASFALTO}" stroke-linejoin="round"/>`);
  s.push(`<path d="${borde(-ASFALTO / 2 + 7)}" fill="none" stroke="#e8eaec" stroke-width="5" opacity="0.7"/>`);
  s.push(`<path d="${borde(ASFALTO / 2 - 7)}" fill="none" stroke="#e8eaec" stroke-width="5" opacity="0.7"/>`);

  // Pianos en cuatro curvas: un tramo de la orilla, a rayas. Cada uno esta en un
  // lugar distinto del circuito, asi que sirven tambien de referencia.
  const piano = (s0, s1, lado) => {
    const pts = [];
    for (let u = s0; u <= s1; u += 12) {
      const p = enS(u);
      pts.push([p.x + p.nx * lado * (ASFALTO / 2 + 11), p.y + p.ny * lado * (ASFALTO / 2 + 11)]);
    }
    return `<path d="${'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}" fill="none" stroke="#d93b3b" stroke-width="22" stroke-dasharray="46 46"/>`
         + `<path d="${'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}" fill="none" stroke="#f2f2f2" stroke-width="22" stroke-dasharray="46 46" stroke-dashoffset="46"/>`;
  };
  s.push(piano(VUELTA * 0.20, VUELTA * 0.26, 1));
  s.push(piano(VUELTA * 0.38, VUELTA * 0.44, -1));
  s.push(piano(VUELTA * 0.58, VUELTA * 0.63, 1));
  s.push(piano(VUELTA * 0.80, VUELTA * 0.85, -1));

  // La linea de largada, sobre la recta principal.
  {
    const p = enS(VUELTA * 0.04);
    const ang = Math.atan2(p.ty, p.tx) * 180 / Math.PI;
    s.push(`<g transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})">`);
    for (let i = 0; i < 10; i++) {
      s.push(`<rect x="0" y="${-ASFALTO / 2 + i * (ASFALTO / 10)}" width="30" height="${ASFALTO / 10}" fill="${i % 2 ? '#f2f2f2' : '#1a1e22'}"/>`);
      s.push(`<rect x="30" y="${-ASFALTO / 2 + i * (ASFALTO / 10)}" width="30" height="${ASFALTO / 10}" fill="${i % 2 ? '#1a1e22' : '#f2f2f2'}"/>`);
    }
    s.push(`</g>`);
  }

  // Tribunas y boxes sobre la recta principal, y postes de comisario repartidos.
  // Las construcciones se colocan SIGUIENDO LA PISTA por longitud de arco y no
  // como un rectangulo rigido: sobre una recta que no es del todo recta, un
  // rectangulo se despega de la orilla por un lado y se sube al asfalto por el
  // otro, que es exactamente lo que paso en la primera version.
  const alBorde = (s0, paso, n, lado, d, dibujo) => {
    for (let i = 0; i < n; i++) {
      const p = enS(s0 + i * paso);
      const ang = Math.atan2(p.ty, p.tx) * 180 / Math.PI;
      s.push(`<g transform="translate(${(p.x + p.nx * lado * d).toFixed(1)},${(p.y + p.ny * lado * d).toFixed(1)}) rotate(${ang.toFixed(1)})">${dibujo(i)}</g>`);
    }
  };
  // La tribuna, del lado de afuera: gradas escalonadas mirando al asfalto.
  alBorde(VUELTA * 0.005, 74, 22, 1, ASFALTO / 2 + 135, () =>
    `<rect x="-36" y="-118" width="72" height="236" fill="#2b3138"/>`
    + `<rect x="-36" y="-118" width="72" height="72" fill="#39434d"/>`
    + `<rect x="-36" y="-46" width="72" height="72" fill="#434f5c"/>`);
  // Los boxes, del lado de adentro.
  alBorde(VUELTA * 0.012, 150, 8, -1, ASFALTO / 2 + 118, () =>
    `<rect x="-62" y="-92" width="124" height="184" rx="8" fill="#2f3742"/>`
    + `<rect x="-62" y="40" width="124" height="52" rx="6" fill="#20262d"/>`);
  for (let i = 0; i < 14; i++) {
    const p = enS(VUELTA * (i / 14 + 0.011));
    const lado = i % 2 ? 1 : -1;
    s.push(`<rect x="${(p.x + p.nx * lado * (ASFALTO / 2 + 48) - 13).toFixed(1)}" y="${(p.y + p.ny * lado * (ASFALTO / 2 + 48) - 13).toFixed(1)}" width="26" height="26" rx="4" fill="${i % 2 ? '#f5a623' : '#5ab0f5'}"/>`);
  }

  // Los autos. Un grupo por auto con su traslacion, y adentro otro con su giro,
  // porque un elemento admite UNA sola animacion de transform en modo replace.
  for (const a of AUTOS) {
    const ts = [], xy = [], gir = [];
    for (let t = 0; t <= LARGO + 1e-9; t += PASO) {
      const q = auto(a, Math.min(t, LARGO));
      ts.push((Math.min(t, LARGO) / LARGO).toFixed(6));
      xy.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);
      gir.push(q.ang.toFixed(1));
    }
    s.push(`<g>`);
    s.push(anim('translate', xy, ts));
    s.push(`<g>`);
    s.push(anim('rotate', gir, ts));
    s.push(cuerpoDeAuto(a.color));
    s.push(`</g></g>`);
  }
  return s.join('\n');
}

/** Un auto visto desde arriba, apuntando al +x, centrado en el origen. */
function cuerpoDeAuto(color) {
  return `<g>
    <ellipse cx="0" cy="14" rx="62" ry="26" fill="url(#sombra)"/>
    <rect x="-34" y="-34" width="26" height="20" rx="4" fill="#15181c"/>
    <rect x="-34" y="14" width="26" height="20" rx="4" fill="#15181c"/>
    <rect x="18" y="-32" width="24" height="18" rx="4" fill="#15181c"/>
    <rect x="18" y="14" width="24" height="18" rx="4" fill="#15181c"/>
    <path d="M-52,-15 L20,-17 L46,-9 L56,0 L46,9 L20,17 L-52,15 Z" fill="${color}"/>
    <path d="M-52,-15 L20,-17 L46,-9 L56,0 L20,4 L-52,0 Z" fill="#ffffff" opacity="0.14"/>
    <rect x="-56" y="-30" width="12" height="60" rx="3" fill="${color}"/>
    <rect x="44" y="-20" width="10" height="40" rx="3" fill="${color}"/>
    <ellipse cx="-6" cy="0" rx="17" ry="11" fill="#0d1014"/>
    <ellipse cx="-3" cy="-3" rx="11" ry="6" fill="#39424d"/>
  </g>`;
}

function anim(tipo, valores, tiempos) {
  return `<animateTransform attributeName="transform" attributeType="XML" type="${tipo}"`
    + ` dur="${LARGO}s" calcMode="linear" fill="freeze" repeatCount="1"`
    + ` keyTimes="${tiempos.join(';')}" values="${valores.join(';')}"/>`;
}

// ── Las camaras ─────────────────────────────────────────────────────────────
// Cada una es la misma escena adentro de dos grupos: uno que apunta y otro que
// se acerca. `lead` corre el encuadre hacia adelante del auto, asi que se ve a
// donde va y no de donde viene; cada camara lleva el suyo, y con el zoom son las
// dos cosas que hacen que dos camaras no se puedan confundir ni cuando los dos
// autos estan cerca.
function camara(a, cuerpo) {
  const ts = [], xy = [];
  for (let t = 0; t <= LARGO + 1e-9; t += PASO) {
    const u = Math.min(t, LARGO);
    const q = auto(a, u);
    const cx = q.x + q.tx * a.lead, cy = q.y + q.ty * a.lead;
    ts.push((u / LARGO).toFixed(6));
    xy.push(`${(ANCHO / 2 - a.zoom * cx).toFixed(1)},${(ALTO / 2 - a.zoom * cy).toFixed(1)}`);
  }
  return `<g>\n${anim('translate', xy, ts)}\n<g transform="scale(${a.zoom})">\n${cuerpo}\n</g></g>`;
}

// ── El programa: el corte de realizacion ────────────────────────────────────
// Un plano cada pocos segundos, saltando entre autos, con dos planos generales
// que muestran el circuito entero. El plano general existe porque es lo que
// explica de un golpe que las seis camaras son de la misma carrera: se ven los
// dos grupos peleando en lados opuestos.
const GENERAL = { general: true, zoom: 0.360, cx: 1820, cy: 1010 };
const CORTES = [
  { t: 0,   ...GENERAL },
  { t: 9,   auto: 'caldrix', zoom: 1.05, lead: 150 },
  { t: 17,  auto: 'runtak',  zoom: 1.20, lead: 120 },
  { t: 25,  auto: 'noctev',  zoom: 1.45, lead: 80 },
  { t: 32,  auto: 'pentav',  zoom: 1.00, lead: 160 },
  { t: 40,  ...GENERAL },
  { t: 47,  auto: 'marvok',  zoom: 1.30, lead: 100 },
  { t: 56,  auto: 'quentra', zoom: 1.15, lead: 130 },
  { t: 64,  auto: 'caldrix', zoom: 1.40, lead: 70 },
  { t: 72,  auto: 'runtak',  zoom: 0.95, lead: 170 },
  { t: 80,  ...GENERAL },
  { t: 87,  auto: 'pentav',  zoom: 1.35, lead: 90 },
  { t: 95,  auto: 'noctev',  zoom: 1.10, lead: 140 },
  { t: 103, auto: 'marvok',  zoom: 1.50, lead: 60 },
  { t: 111, auto: 'quentra', zoom: 1.00, lead: 150 },
];

function programa(cuerpo) {
  const ts = [], xy = [], zs = [];
  const porId = Object.fromEntries(AUTOS.map((a) => [a.id, a]));
  const plano = (t) => { let p = CORTES[0]; for (const c of CORTES) if (c.t <= t) p = c; return p; };
  const foco = (p, t) => {
    if (p.general) return { x: p.cx, y: p.cy };
    const a = porId[p.auto];
    const q = auto(a, t);
    return { x: q.x + q.tx * p.lead, y: q.y + q.ty * p.lead };
  };
  const muestra = (t) => {
    const p = plano(t);
    const f = foco(p, t);
    ts.push((t / LARGO).toFixed(6));
    xy.push(`${(ANCHO / 2 - p.zoom * f.x).toFixed(1)},${(ALTO / 2 - p.zoom * f.y).toFixed(1)}`);
    zs.push(p.zoom.toFixed(4));
  };

  // La grilla regular, con la pareja de muestras de cada corte intercalada: la
  // de antes lleva el encuadre viejo, la de t el nuevo, y entre las dos hay
  // medio cuadro, asi que ningun cuadro capturado cae adentro del salto.
  const instantes = [];
  for (let t = 0; t <= LARGO + 1e-9; t += PASO) instantes.push(Math.min(t, LARGO));
  for (const c of CORTES) if (c.t > 0) instantes.push(c.t - CUADRO / 2, c.t);
  instantes.sort((a, b) => a - b);

  let previo = -1;
  for (const t of instantes) {
    if (Math.abs(t - previo) < 1e-6) continue;   // la grilla y un corte coinciden
    previo = t;
    muestra(t);
  }
  return `<g>\n${anim('translate', xy, ts)}\n<g>\n${anim('scale', zs, ts)}\n${cuerpo}\n</g></g>`;
}

// ── Emision ─────────────────────────────────────────────────────────────────
function archivo(titulo, interior) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  GENERADO por scripts/escribir-carrera.mjs. No se edita a mano: el proximo
  comando lo pisa. La receta, la geometria del circuito y el plan de cortes
  viven en ese script.

  ${titulo}
-->
<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}"
     viewBox="0 0 ${ANCHO} ${ALTO}" role="img" aria-label="${titulo}">
${interior}
</svg>
`;
}

const destino = process.argv[2] || path.join(RAIZ, 'content', 'race', 'svg');
fs.mkdirSync(destino, { recursive: true });

const CUERPO = escena();
const escritos = [];
const escribir = (nombre, texto) => {
  const p = path.join(destino, nombre);
  fs.writeFileSync(p, texto);
  escritos.push([nombre, texto.length]);
};

escribir('program.svg', archivo(`${C.programa.nombre}: the race, cut between cars`, programa(CUERPO)));
for (const a of AUTOS) escribir(`${a.id}.svg`, archivo(`${a.nombre}`, camara(a, CUERPO)));

console.log(`escribir-carrera: circuito de ${VUELTA.toFixed(0)} unidades, ${AUTOS.length} autos, ${LARGO} s`);
for (const [n, b] of escritos) console.log(`  ${n}\t${(b / 1024).toFixed(0)} KB`);
console.log(`  en ${path.relative(RAIZ, destino)}`);
