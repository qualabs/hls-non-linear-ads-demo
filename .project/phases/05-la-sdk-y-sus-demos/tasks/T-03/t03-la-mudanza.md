# T-03 — la mudanza: la página baja a `demo/compatibility-pair/`

La raíz del repositorio quedó con la sdk —`lib/`, `dist/`, `test/`, `docs/`,
`vendor/`, `server.mjs`, `run.sh`, `package.json`, `README.md` y los dos scripts
de la sdk— y la página entera vive en `demo/compatibility-pair/`. Veintiséis
archivos tracked se movieron con `git mv` y `content/` con su cache `.fuentes/`
(660 MB) con un `mv`, porque está gitignoreado y nunca estuvo en el índice: nada
se volvió a bajar.

Es un commit solo, con las cuatro ediciones de ruta y el test nuevo de la demo
adentro. Está así por el invariante de la fase: separar el test de la mudanza es
tener un commit con la suite roja, o uno con las tres afirmaciones sobre
`senalizar-contenido.sh` borradas, que es el chequeo que encontró el
`PLANNED-DURATION` de doce segundos en un break de cuarenta y ocho.

## Las cuatro ediciones de ruta

1. **`index.html`**, los dos `src` de la sdk: `./dist/…` y `./vendor/…` pasaron a
   `/dist/…` y `/vendor/…`, absolutos, para que los resuelvan los dos montajes
   que la T-02 le dio al servidor. Ninguna otra ruta del archivo cambió: las
   cinco que quedan —las dos hojas de `brand/` y de `css/`, el favicon, el logo y
   el módulo de `js/`— son relativas a la página y la página se mudó con sus
   carpetas, así que resuelven igual que antes.
2. **`run.sh`**, la demo como argumento: `DEMO="${1:-compatibility-pair}"`, con la
   única que existe como default. Hace lo mismo en el mismo orden —el contenido
   de la demo si falta, la señalización de la demo, la construcción de la sdk, el
   servidor con la carpeta de la demo como raíz de documentos— y no se partió en
   un `run.sh` por demo, que repetiría las dos líneas de la sdk en cada una.
3. **`scripts/verificar-cortes.mjs`**, la lista `files` de la costura del
   ADR 0003: `js/contract-trace.js` y `css/player.css` pasaron a
   `demo/compatibility-pair/js/contract-trace.js` y
   `demo/compatibility-pair/css/player.css`. Reescritas y no sacadas: esa lista es
   por archivo a propósito y esos dos archivos son la prueba de que el contrato
   alcanza para dibujar. La verificación de completitud del script —que todo
   `lib/*.js` esté de un lado o del otro— sigue siendo sólo sobre `lib/` y no
   depende de ninguna demo. La costura del ADR 0015 no necesitó ni un cambio.
4. **`lib/controls.js`**, la cita de `brand/README.md` en el comentario que
   explica por qué el amarillo y el violeta no son colores de marca: se fue la
   ruta y quedó la frase. Con `brand/` adentro de la demo, esa cita contendría el
   literal `demo`, que es uno de los términos que grepea la costura del ADR 0015
   con lista de aceptados vacía, y la pondría roja con razón: sería la librería
   nombrando a la demo. Para un argumento el chequeo es un lector y no un grep.

**Los tres scripts de contenido no se editaron**, ni una línea: hacen
`cd "$(dirname "$0")/.."`, así que mudados a `demo/compatibility-pair/scripts/`
apuntan solos a la carpeta de la demo. **Las trece URIs de asset-list tampoco**,
ni el `X-ASSET-LIST` del script de señalización, que es exactamente lo que el
ADR 0022 existe para evitar. **Y el `.gitignore` no se tocó**: sus patrones
`content/` y `dist/` no llevan barra inicial, así que matchean a cualquier
profundidad.

## El test de la demo

`demo/compatibility-pair/test/signalled-run.test.js`, tres tests, y son las tres
afirmaciones que la T-01 dejó en su lugar hasta que existiera la demo sobre la que
pueden hablar. Afirman **sobre los archivos de la demo** y no contra el fixture:
leen `../scripts/senalizar-contenido.sh` y `../signalling/`, y las dos constantes
de clase las importan de `lib/signalling.js`, que es la demo nombrando a la sdk,
la dirección que el ADR 0015 permite.

- que el script señaliza las cinco filas de la corrida, en los segundos 20, 45,
  70, 95 y 120, y que cada fila nombra un asset-list que está en el `signalling/`
  de la demo, más el `LISTA_LINEAL` que la tabla no nombra y los cinco breaks usan;
- que el largo que declara un break se computa del asset-list y no se tipea
  (`PLANNED-DURATION=%s` presente, `PLANNED-DURATION=<dígito>` ausente);
- que el script escribe las dos `CLASS` que la librería traduce.

Del test partido de `test/program-ranges-and-volume.test.js`, la mitad que prueba
`kindOfClass` se quedó arriba y la que miraba el script bajó. `npm test` no
cambió: `node --test` sin argumentos descubre `test/` y `demo/*/test/` en una sola
corrida.

## La cuenta de tests

**46 en verde: los 43 de `test/` que dejó la T-01, más los 3 de la demo.** Ni un
test se borró y ni un valor esperado cambió. La lista de nombres, comparada uno a
uno contra la de antes de la task, tiene tres agregados —los de la demo— y **un
renombrado**: el test que se llamaba `the run of the script is the five breaks of
the recording` ahora se llama `the run of the recording is five breaks, each
naming an asset-list of this suite`. El nombre viejo afirmaba algo que el test ya
no hace: la T-01 le había sacado el parseo de la tabla y esta task le sacó las dos
afirmaciones que le quedaban sobre el script, así que el nombre nombraba al
script y el test mira el fixture.

## La verificación

- **`npm test`** en 46 de 46. Salida en `t03-suite-y-costuras.txt`.
- **`node scripts/verificar-cortes.mjs`** en `both seams hold.`, con la del
  ADR 0003 en tres ocurrencias aceptadas y la del ADR 0015 en cero hits. Misma
  salida.
- **El grep de autosuficiencia**, acotado al código:
  `/usr/bin/grep -rn --include='*.js' -e '\.project' -e 'signalling/' -e 'demo/' test/`
  no devuelve nada. `test/` lee sólo `test/` y `lib/`, que es el estado final del
  ADR 0023.
- **`./run.sh`** levanta la demo desde la estructura nueva y sirve
  `demo/compatibility-pair`. Los once archivos que la página carga responden 200
  con su `Content-Type`, incluidos `/dist/` y `/vendor/`, que vienen de los
  montajes de la sdk.
- **La corrida entera, y un cuadro por break.** Cinco PNG, uno por break, al
  tamaño real de uso (1920 × 977), más un sexto del aviso a cuadro entero de
  adentro del break mezclado, que es donde el par de compatibilidad se invierte.
  El recorrido corrió además de punta a punta sin un solo salto, muestreado cada
  250 ms: las cinco ventanas aparecieron en su segundo y con su layout, y el
  detalle está en `t03-el-recorrido-entero.txt`.

## Lo que el bloque no cubría, decidido acá

- **`run.sh` chequea que la carpeta de la demo exista** antes de correr nada, y
  dice qué nombre no encontró. Es la línea que un argumento nuevo trae consigo:
  sin ella, un nombre mal tipeado falla en el primer script con un mensaje que
  habla de un archivo y no de la demo.
- **El comentario de `verificar-cortes.mjs` arriba de `files` dice por qué dos de
  los cuatro archivos están adentro de una demo**, porque un lector que vea a la
  costura de la sdk nombrando una demo se va a preguntar justo eso. El archivo no
  está en la lista de ninguna de las dos costuras, así que el literal `demo` no
  las mueve.
- **`test/fixtures/README.md`, un párrafo.** Decía "what stays over the script"
  de las tres afirmaciones, que era cierto mientras estaban arriba; ahora dice que
  viven en la suite de la demo, al lado del script que leen. Es el único lugar del
  repositorio donde la mudanza dejaba una frase falsa, y no lo cubre la T-05, que
  es del README de la raíz y del de la demo.
- **El comentario del test de `test/` que quedó apuntando a la demo se escribió
  sin la ruta**, por la misma razón que el punto 4 de arriba: el grep de
  autosuficiencia busca el literal `demo/` en el código de `test/`, y un
  comentario con la ruta completa lo ponía en rojo. Dice "la suite de esa demo" y
  no `demo/compatibility-pair/test/`.

## Un residual, anotado y no arreglado

El comentario de cabecera de `index.html` dice que hls.js está vendoreado en
`./vendor/`, y la restricción del bloque es que ninguna otra ruta de ese archivo
cambie. Se queda como está y no es una frase falsa: habla del árbol del
repositorio, donde `vendor/` sigue estando en la raíz, y no de la URL que la
página pide, que es la que sí cambió en el `src` de dos líneas más abajo.
