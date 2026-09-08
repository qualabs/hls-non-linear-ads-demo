---
phase: 05-la-sdk-y-sus-demos
title: "La sdk y sus demos: la raíz es la librería y demo/ es donde se la muestra"
status: planning
started: 2026-09-08
closed: null
---

# Fase 05: la sdk y sus demos

El ADR 0015 cortó la librería de la página adentro del código, y ese corte está
verificado por un grep. Lo que no está es a la vista: quien abre la raíz
encuentra `brand/`, `content/`, `css/`, `signalling/` e `index.html` al lado de
`lib/`, todos al mismo nivel y sin nada que diga cuál es el producto.

Esta fase mueve esa línea al árbol del repositorio. La raíz queda con la sdk y
la página baja entera a `demo/compatibility-pair/`, que es la primera de varias
demos. Y de paso corta el único acoplamiento que va en la dirección equivocada:
la suite de la sdk leyendo la capa de gestión del desarrollo.

## Objetivo

Que quien abra la raíz del repositorio vea la sdk, y que una demo sea una
carpeta que se puede nombrar, levantar y multiplicar sin tocar la librería.

## El criterio de la fase

**Para cada archivo: ¿existiría si no hubiera ninguna demo?** Si la respuesta es
sí, es de la sdk y se queda en la raíz. Si es no, es de la demo y baja a su
carpeta.

La pregunta no es "¿lo usa la demo?", porque la demo usa la sdk entera; es si el
archivo tiene una razón de ser propia cuando no hay una página que mostrar. El
reparto archivo por archivo del árbol de hoy ya está resuelto en el ADR 0020;
este criterio es para lo que ese reparto no enumere, y **lo aplica quien ejecuta
la task, sin preguntar**.

## El invariante de ejecución

**Ningún commit deja `npm test` en rojo, y ningún commit deja a `test/` leyendo
una demo.** No es una preferencia de prolijidad: los dos acoplamientos que esta
fase corta se cruzan justo en el medio de la mudanza. Tres tests leen JSON de
`.project/`, dos leen `signalling/` y uno **parsea**
`scripts/senalizar-contenido.sh`, así que mover `signalling/` y los scripts de
contenido a la demo vuelve a romper la suite si la suite no se volvió
autosuficiente antes, y arreglarla apuntándola a `demo/compatibility-pair/`
sería clavar la suite de la sdk a la primera demo, que es exactamente lo que el
ADR 0023 prohíbe.

De ahí sale el orden de las tasks y de ahí sale que el test nuevo de la demo se
escriba adentro de la task que muda los archivos: separarlos en dos commits es
tener un commit con la suite roja. El razonamiento por task está en `TASKS.md`.

## Alcance

1. **El reparto del árbol.** La raíz queda con `lib/`, `dist/`, `test/`,
   `docs/`, `vendor/`, `server.mjs`, `run.sh`, `package.json`, `README.md` y los
   dos scripts de la sdk (`construir-libreria.sh`, `verificar-cortes.mjs`).
   `demo/compatibility-pair/` recibe `index.html`, `css/`, `js/`, `brand/`,
   `signalling/`, `content/`, `CREDITS.md` y los tres scripts de contenido.
2. **El servidor recibe su raíz de documentos como argumento** y monta `/dist/`
   y `/vendor/` contra la raíz del repositorio, que es lo que deja los trece
   asset-lists, el script de señalización y las rutas relativas de la página
   byte por byte iguales (ADR 0022).
3. **`test/` se vuelve autosuficiente**: los fixtures se copian a
   `test/fixtures/` y de ahí en adelante son del test, sin chequeo contra el
   original. Lo que habla del script de señalización pasa a
   `demo/compatibility-pair/test/` y afirma sobre los archivos de la demo
   (ADR 0023).
4. **El manifiesto declara la sdk**: nombre, punto de entrada, `files`, y los
   cuatro verbos de la librería (ADR 0024).
5. **El README de la raíz enruta y cada demo cuenta su corrida** (ADR 0025), más
   la cláusula que dice que la cita de `docs/` apunta a la evidencia de una fase
   cerrada.
6. **Las tres consecuencias que la mudanza obliga**, y que no son decisiones
   nuevas: `lib/controls.js` deja de citar la ruta de `brand/README.md` y se
   queda con la frase; el grep del ADR 0003 en `verificar-cortes.mjs` reescribe
   las dos rutas que se mudan; y el `.gitignore` no se toca, porque sus patrones
   `content/` y `dist/` no llevan barra inicial y matchean a cualquier
   profundidad.
7. **La corrida entera levantada desde la estructura nueva**, con un cuadro por
   break, la suite y las dos costuras en verde.

## Fuera de alcance

- **Una segunda demo.** La fase deja el lugar hecho y el criterio escrito; no
  construye ninguna.
- **iOS**, y `demo/` no es su lugar: el ADR 0015 ya dice que la plataforma
  nativa hereda la línea y no el código.
- **Publicar la sdk.** El manifiesto declara qué es el producto; `private: true`
  se queda y la versión queda en `0.0.0` (ADR 0024). Nadie decidió publicar y el
  ADR 0015 dice que la superficie pública no está congelada.
- **Cambiar la superficie pública de la librería, el contrato entre las dos
  capas, o cualquier comportamiento de la página.** Esta fase mueve archivos y
  rutas. Si algo se ve distinto en la pantalla, es un defecto de la mudanza.
- **Reescribir las URIs de los trece asset-lists**, que es justo lo que el
  ADR 0022 existe para evitar.
- **`docs/` partido en subcarpetas por audiencia.** Los dos documentos tienen el
  mismo lector, quien construye con la sdk.
- **Un chequeo que compare el fixture con su original.** Está decidido que no lo
  hay, y está escrito en `test/fixtures/README.md` para que nadie lo agregue
  creyendo que falta.
- **Un bundler, un framework o una dependencia de npm.** Sigue siendo una
  propiedad deliberada del proyecto.
- **El cambio de URLs que sirve la demo.** Está aceptado; el efecto lateral del
  ADR 0022 es que igual siguen siendo las mismas.

## Decisiones que gobiernan la fase

Las seis que esta fase toma:

- **ADR 0020**, la raíz es la librería y `demo/<nombre>/` es donde se la
  muestra, con el reparto archivo por archivo y el criterio para nombrar una
  demo. Generaliza el ADR 0015: nada de lo que ese ADR dice deja de valer, la
  línea se ensancha del código al árbol.
- **ADR 0021**, un `signalling/` por demo, y dos demos que necesitarían la misma
  lista son una demo con dos corridas.
- **ADR 0022**, el servidor recibe la raíz de documentos como argumento y monta
  `/dist/` y `/vendor/` de la sdk.
- **ADR 0023**, el código no lee `.project/` y la documentación sí lo cita.
- **ADR 0024**, el manifiesto declara la sdk sin afirmar que está publicada.
- **ADR 0025**, el README de la raíz enruta y cada demo cuenta su corrida.

Las que ya estaban y acotan lo que se puede hacer:

- **ADR 0015**, el límite del SDK. Es la línea que esta fase hace visible, y
  también el chequeo que encuentra a la librería nombrando a la demo.
- **ADR 0003**, las dos capas. Su grep es por archivo a propósito, así que dos
  de sus rutas se reescriben y ninguna se saca.
- **ADR 0004**, consumir el asset-list tal como la herramienta lo emite. Es lo
  que descarta reescribir las URIs.
- **ADR 0002**, hls.js 1.7.2 es la versión contra la que la sdk está leída y
  medida. Es lo que deja `vendor/` en la raíz.
- **ADR 0007**, el par de compatibilidad, que es el argumento del que la demo
  toma el nombre.

## Riesgos

**R1. La demo deja de levantar y nadie se entera hasta la grabación.** La
mudanza toca todas las rutas que la página carga. Mitigación, y la corre quien
ejecuta la T-06: `./run.sh` levanta la corrida y se mira un cuadro por break,
los cinco, más la suite y las dos costuras en verde. No hace falta un
instrumento nuevo, porque lo que una ruta rota produce es una pantalla que no
carga. La ventana de grabación es del 28 al 30 de septiembre, con margen.

**R2. Una ruta se arregla en un lugar y se pasa en otro que sólo falla en
runtime**, típicamente una URI de asset-list o un `src` de `index.html`.
Mitigación: el ADR 0022 es el que baja el riesgo de verdad, porque deja la
cuenta de archivos con rutas por editar en dos `src` de `index.html` y nada más.
Las trece URIs, el script de señalización y los tres scripts de contenido quedan
sin tocar, y el servidor se prueba con su propia task antes de que nada se mude.

**R3. El fixture congelado de `test/` deja de describir la corrida que la demo
sirve.** Aceptado explícito, y es la decisión que entró como dato: las mediciones
son lecturas fechadas de una corrida, así que congelarlas junto con la corrida
que describen es lo correcto. La compensación es el test de la demo, que vigila
la corrida viva y que esta fase crea.

**R4 (residual, aceptado).** Cuatro asset-lists de repliegue van a existir dos
veces, en la demo y en `test/fixtures/`. Se acepta sin chequeo, por la misma
decisión que gobierna el resto de los fixtures.

**R5. Un archivo tracked se muda perdiendo su historia.** Mitigación: lo tracked
se mueve con `git mv`. Y un detalle que cuesta media hora y 535 MB si se pasa por
alto: `content/.fuentes/` es el cache de las descargas y se muda con el resto de
`content/`, así que nada se vuelve a bajar.

## La verificación de la fase

Cuatro cosas, y las cuatro son comandos o una mirada. No se agrega instrumento
nuevo.

- **La demo levanta y el recorrido corre entero**: `./run.sh`, un cuadro por
  break, los cinco. Es el único instrumento que atrapa una ruta rota.
- **`npm test` en verde, con la misma cuenta de tests que antes de la fase**
  más los de la demo. Una suite que adelgaza sin que nadie lo diga es la forma
  en que esta fase podría salir mal en silencio.
- **`npm run check` en verde**, las dos costuras. La del ADR 0015 es la que
  encuentra a la librería nombrando a la demo, y esta fase le mete el literal
  `demo` en la ruta de todo lo que baja.
- **La autosuficiencia de `test/`, grepeada y no afirmada**: ninguna ruta de
  `test/` sale de `test/` y `lib/`.

## Arquitectura del producto

El proyecto no tiene `docs/arc42/` y esta fase no lo crea: sus dos documentos de
`docs/` cumplen ese papel para el único lector que tienen, quien construye con la
sdk, y el diseño ya resolvió dejar `docs/` como está.

El delta de esta fase es de forma y no de comportamiento. La superficie pública
no cambia, el contrato entre las dos capas no cambia, y la librería construida
sigue siendo un script clásico que define un global. Lo que cambia es dónde vive
cada cosa, quién sirve qué, y qué declara el manifiesto, y eso está escrito en
los ADR 0020 a 0025. Los dos documentos de `docs/` se tocan sólo en la cláusula
de procedencia del ADR 0023.

## Calendario y quién mira

El primer draft para David es el 21 de septiembre y la ventana de grabación es
del 28 al 30. Esta fase no agrega capacidades, así que su lugar en el calendario
es antes de que empiece a construirse cualquier cosa nueva: todo lo que se
construya con la estructura vieja hay que mudarlo después. Quien ejecuta corre
la verificación de arriba; lo que Nicolás mira es la demo corriendo, que es lo
que igual iba a mirar.
