# Tasks — fase 05-la-sdk-y-sus-demos

**El orden lo fija el invariante del `PHASE.md`: ningún commit deja `npm test` en
rojo y ninguno deja a `test/` leyendo una demo.** Con eso el orden se deduce
solo y no hay margen para reacomodarlo.

- La **T-01** va primera porque la suite tiene que ser autosuficiente **antes**
  de que `signalling/` y el script de señalización se muden. Al revés, el commit
  de la mudanza deja la suite roja, y el arreglo obvio —apuntarla a
  `demo/compatibility-pair/`— es justo lo que el ADR 0023 prohíbe.
- La **T-02** va antes de la mudanza porque la mudanza depende de que el
  servidor ya sepa servir una carpeta que se le nombre. Y va sola para que la
  única lógica nueva de la fase se pruebe mientras todo lo demás está en su
  lugar, que es cuando un 403 o un 404 se puede leer sin dudar de qué lo causó.
- La **T-03** es el pivote y es grande a propósito. Adentro suyo van los `git mv`,
  las cuatro ediciones de ruta y **el test nuevo de la demo**. El test no es una
  task aparte por la misma razón que las otras dos van antes: las tres
  afirmaciones sobre el script de señalización sólo pueden hablar de los archivos
  de la demo cuando la demo existe, y separarlas en un commit propio es tener un
  commit con la suite roja o con esas tres afirmaciones borradas. El
  `PLANNED-DURATION` escrito a mano que declaraba doce segundos de un break de
  cuarenta y ocho lo encontró justamente ese chequeo, así que no se apaga ni por
  un commit.
- La **T-04** y la **T-05** son declarativas y van después de que las rutas
  existan, porque las dos las nombran. La T-05 depende además de la T-04, que es
  la que crea el verbo `check` y saca `serve` y `content` del manifiesto para que
  la T-05 los escriba, con su ruta completa, en el README de la demo.
- La **T-06** es la verificación de la fase, corrida una vez sobre el resultado
  entero.

**El instrumento es el que ya existe.** `npm test`, `npm run check`, la demo
corriendo y un grep. Cada bloque dice qué le queda y qué se le fue, para que la
ausencia se lea como una decisión y no como un descuido.

**El grep de autosuficiencia va acotado al código (`--include='*.js'`), y el motivo
es del instrumento y no del alcance.** Sin acotar devuelve quince líneas que están
adentro de dos JSON de mediciones: son líneas de consola que el navegador imprimió
durante la corrida medida, con una URL `.../signalling/asset-list-....json` en el
texto. Es dato medido y no una ruta que alguien resuelva, así que editarlo
falsificaría un registro. Lo encontró la T-01 corriendo el grep que su propio done
pedía, y aplica a las tres tasks que lo repiten.


| id   | brief                                                              | status  | plan | evidence |
| ---- | ------------------------------------------------------------------ | ------- | ---- | -------- |
| T-01 | Los fixtures pasan a ser del test                                  | done    | —    | [tasks/T-01/](tasks/T-01/) |
| T-02 | El servidor sirve la carpeta que se le nombra                       | done    | —    | [tasks/T-02/](tasks/T-02/) |
| T-03 | La mudanza: la página baja a `demo/compatibility-pair/`             | done    | —    | [tasks/T-03/](tasks/T-03/) |
| T-04 | El manifiesto declara la sdk                                        | done    | —    | [tasks/T-04/](tasks/T-04/) |
| T-05 | El README de la raíz enruta y la demo cuenta su corrida             | pending | —    | —        |
| T-06 | La corrida entera desde la estructura nueva                         | pending | —    | —        |

---

## T-01 — Los fixtures pasan a ser del test

- **Objetivo:** la suite de la sdk no lee un solo archivo fuera de `test/` y
  `lib/`, y sigue afirmando exactamente lo que afirmaba. Con eso la mudanza de la
  T-03 deja de poder romperla, y el registro de las fases vuelve a ser lo que
  es: registro, no una dependencia del código.
- **Qué tiene que cubrir:**

  Lo que se copia a `test/fixtures/`, y de ahí en adelante es del test:

  - `test/fixtures/mediciones/`: los cinco JSON de `.project/`, **con sus nombres
    originales**, porque el nombre es la procedencia:
    `m3-resultados.json` (T-03 de la fase 01),
    `t02-los-rangos-del-programa.json`, `t04-la-medicion.json` y
    `t05-la-medicion.json` (fase 02), y
    `t05-el-recorrido-con-el-break-mezclado.json` (fase 03). Unos 225 KB.
  - `test/fixtures/asset-lists/`: los trece de `signalling/`, completos. Se
    copian los trece y no un subconjunto porque el conjunto que los tests leen
    **se computa** —una función toma el nombre por parámetro y otra lo saca de la
    tabla de la corrida—, así que cualquier subconjunto es una adivinanza. Son
    unos 15 KB: filtrar cuesta más que copiar.
  - `test/fixtures/run.json`: las cinco tandas de la corrida, declaradas
    explícitamente (segundo y nombre del asset-list). **Reemplaza el parseo de
    `scripts/senalizar-contenido.sh`**, que hoy está en la constante `RUN` de
    `test/program-ranges-and-volume.test.js:84` y es de donde sale la mitad de
    los tests de ese archivo.
  - `test/fixtures/README.md`: de dónde vino cada archivo, que ahora es del test,
    y que **no hay chequeo contra el original, por decisión**. Está escrito ahí
    para que nadie agregue uno más adelante creyendo que falta.

  Los tres archivos de `test/` se reescriben para leer de ahí. Los comentarios de
  cabecera nombran hoy las tasks de donde salieron los datos: **se quedan**, con
  la ruta reescrita para que digan de dónde vino la copia. Eso es procedencia y
  la política de documentación lo llama registro.

  **Las tres afirmaciones sobre `scripts/senalizar-contenido.sh` no se tocan en
  esta task**, y hay que dejarlas leyendo el script en la raíz, que es donde
  todavía está: `RUN.length === 5`, el `PLANNED-DURATION=%s` que no es un dígito
  (líneas 118 a 129), y los dos `CLASS="..."` que el script escribe (línea 136).
  Se mudan en la T-03, que es cuando existe la demo sobre la que pueden hablar.
  Lo que sí entra acá es que la **tabla** de la corrida deje de salir del parseo:
  las tres afirmaciones quedan sobre el script y los datos salen del fixture.

  Punto de partida, en este orden: el ADR 0023, que es la regla y su costo; los
  tres archivos de `test/`; y las cinco rutas de `.project/` que hoy aparecen en
  ellos (`/usr/bin/grep -rn --include='*.js' -e '\.project' test/`). Restricción: ni un valor
  esperado cambia y ni un test se borra. La cuenta de tests y sus nombres son los
  mismos antes y después; si alguno tiene que cambiar de nombre, es un hallazgo y
  se reporta. Sin dependencias.
- **Definición de done:**
  - `/usr/bin/grep -rn --include='*.js' -e '\.project' -e 'signalling/' test/` no devuelve nada, y la
    única ruta de `test/` que sale de `test/` y `lib/` es la del script de
    señalización, en un lugar solo.
  - `npm test` en verde, con la **misma lista de nombres de test y la misma
    cuenta** que antes de la task, comparada archivo contra archivo.
  - Cada fixture copiado es idéntico a su original (`diff` limpio de los cinco
    JSON de mediciones y de los trece asset-lists).
  - `test/fixtures/README.md` dice de dónde vino cada uno y que no hay chequeo.
- **nivel de verificación:** alto. Lo que esta task entrega es la red de
  regresión del proyecto, y una red que quedó más floja no se ve: pasa en verde
  igual y se descubre meses después, encima de todo lo que se construyó sobre
  ella. Lo que la pone en `alto` es la parte que reemplaza un parseo por un
  fixture, porque ahí es donde la red puede perder tensión sin que nada avise.
  - **Tests nuevos, y son estos:** que `test/fixtures/run.json` tiene cinco
    tandas, que cada una trae su segundo y su asset-list, y que **cada
    asset-list nombrado existe en `test/fixtures/asset-lists/`**. Sin eso un
    fixture truncado o con un nombre mal tipeado no es un test rojo: es una tabla
    más chica sobre la que los demás tests pasan sin mirar nada. Es exactamente
    el chequeo que la constante `RUN` de hoy ya hace sobre el parseo
    (`test/program-ranges-and-volume.test.js:114`) y que hay que conservar cuando
    la fuente cambia.
  - **Campaña de mutación, acotada a la única regla que esta task es dueña**
    —que la tabla de la corrida sale del fixture y no de un parseo—, y corriendo
    sólo los tests que cubren esa regla, no la suite entera por rotura: sacar una
    tanda de `run.json`, cambiar un segundo, y apuntar una tanda a un asset-list
    que no está. Las tres tienen que ponerse rojas. Una que queda verde es un
    hallazgo.
  - **El caso contra una fuente independiente:** el inventario de tests antes y
    después (nombres y cuenta, de la salida de `node --test`) y el `diff` de cada
    copia contra su original. Ese `diff` es el único momento en que las dos
    copias se comparan a propósito: el ADR 0023 prohíbe un chequeo **permanente**,
    no verificar la copia el día que se hace.
  - **Se fue:** la verificación visual, porque acá no hay nada que mirar.

## T-02 — El servidor sirve la carpeta que se le nombra

- **Objetivo:** que el servidor pueda servir cualquier carpeta como raíz de
  documentos, con `/dist/` y `/vendor/` de la sdk montados encima. Es lo que
  después deja los trece asset-lists, el script de señalización y todas las rutas
  relativas de la página sin tocar.
- **Qué tiene que cubrir:** `server.mjs` recibe la raíz de documentos como
  primer argumento y monta dos rutas fijas contra la raíz del repositorio,
  `/dist/` y `/vendor/`, que es lo que la página necesita de la sdk. La guarda de
  traversal tiene que seguir valiendo **para las tres raíces**: hoy compara el
  prefijo de la ruta resuelta contra `ROOT` y rechaza con 403, y ahora hay tres
  prefijos legítimos en lugar de uno.

  **El default está decidido y es la raíz del repositorio**, para que esta task
  sea una suma y no un cambio: sin argumento, el servidor sirve exactamente lo
  que sirve hoy, así que este commit no altera cómo levanta la demo. Después de
  la T-03 ese default sirve la raíz de la sdk, donde no hay `index.html`, y la
  respuesta es un 404 en `/`, que alcanza para un comando que nadie usa sin
  argumento porque `run.sh` siempre se lo pasa.

  Punto de partida: `server.mjs` entero, que son cuarenta líneas, y el ADR 0022.
  Restricción: los `Content-Type` de `TYPES` no se tocan —el `.m3u8` es la razón
  por la que este archivo existe en lugar de un `python3 -m http.server`—, el
  `cache-control: no-store` tampoco, y `run.sh` sigue levantando la demo igual en
  este commit. Sin dependencias.
- **Definición de done:** cuatro pedidos al servidor corriendo, con su código de
  respuesta anotado: un archivo de la raíz de documentos que se le pasó, uno bajo
  `/dist/`, uno bajo `/vendor/`, y un `..` que se escapa de las tres raíces, que
  tiene que dar 403. Más `./run.sh` levantando la demo como antes de la task.
- **nivel de verificación:** bajo. Lo que puede salir mal acá es una ruta que no
  resuelve, y eso es una pantalla que no carga o un 404 en la consola: está en la
  pantalla y arreglarlo es barato.
  - **Tests nuevos: no, y la razón es una decisión de esta misma fase.** La
    lógica no visual de la task es la resolución de la ruta, que es justo lo que
    un test unitario cubriría; pero el ADR 0023 deja a `test/` leyendo sólo
    `test/` y `lib/`, así que un test que importara `server.mjs` rompería la
    regla que esta fase instala. Lo mismo vale para los dos scripts de la sdk, y
    los tres se chequean corriéndolos. El instrumento acá son los cuatro pedidos
    de la definición de done, que contestan la misma pregunta sin el
    acoplamiento.
  - **Campaña de mutación: no.**
  - **La verificación visual es la demo levantando** como levantaba antes.

## T-03 — La mudanza: la página baja a `demo/compatibility-pair/`

- **Objetivo:** que la raíz del repositorio sea la sdk y que la página entera
  viva en `demo/compatibility-pair/`, con la demo corriendo igual que antes y las
  dos costuras verdes. Es la fase.
- **Qué tiene que cubrir:**

  **Lo que baja, con la carpeta puesta**, y las carpetas conservan su nombre
  adentro de la demo, que es lo que deja las rutas relativas de `index.html`
  byte por byte iguales: `index.html`, `css/player.css`, los tres de `js/`
  (`app.js`, `stock-player.js`, `contract-trace.js`), `brand/` completo,
  `signalling/` con los trece asset-lists, `content/` con su `.fuentes/`,
  `CREDITS.md`, y los tres scripts de contenido
  (`preparar-contenido.sh`, `empaquetar-contenido.sh`,
  `senalizar-contenido.sh`) a `demo/compatibility-pair/scripts/`. Lo tracked se
  mueve con `git mv` para que la historia siga al archivo.

  **Los tres scripts de contenido no se editan.** Hacen `cd "$(dirname "$0")/.."`,
  así que mudados apuntan solos al lugar correcto.

  **Las cuatro ediciones de ruta, y son cuatro:**

  1. `index.html`: los dos `src` de `./dist/` y `./vendor/` pasan a absolutos,
     `/dist/` y `/vendor/`, para que los resuelvan los montajes de la T-02.
     Ninguna otra ruta de ese archivo cambia.
  2. `run.sh`: queda en la raíz y toma la demo como argumento, con la única que
     existe como default (`DEMO="${1:-compatibility-pair}"`). Sigue haciendo lo
     mismo en el mismo orden: el contenido de la demo si falta, la señalización
     de la demo, la construcción de la sdk, el servidor con la carpeta de la demo
     como raíz de documentos. No se parte en un `run.sh` por demo: eso repetiría
     las dos líneas de la sdk en cada una y devolvería "construir antes de
     servir" a la memoria de alguien.
  3. `scripts/verificar-cortes.mjs`: la lista `files` de la costura del ADR 0003
     incluye `js/contract-trace.js` y `css/player.css`, que se mudan. Se
     **reescriben** las dos rutas bajo `demo/compatibility-pair/` y no se saca
     ninguna: esa lista es por archivo a propósito y esos dos archivos ganan su
     lugar porque son la prueba de que el contrato alcanza para dibujar, que es
     el argumento del ADR 0003. La costura del ADR 0015 (`lib/*.js`,
     `scripts/construir-libreria.sh`) no necesita ni un cambio.
  4. `lib/controls.js`: el comentario que explica por qué el amarillo y el
     violeta no son colores de marca cita hoy `brand/README.md` (línea 78). Con
     `brand/` adentro de la demo esa cita contendría el literal `demo`, que es
     uno de los términos que grepea la costura del ADR 0015 con lista de
     aceptados vacía, y se pondría roja con razón, porque sería la librería
     nombrando a la demo. **Se saca la ruta y se queda la frase**: el argumento
     es que esos dos colores son funcionales, y para un argumento el chequeo es
     un lector y no un grep.

  **El `.gitignore` no se toca.** Sus dos patrones relevantes, `content/` y
  `dist/`, no llevan barra inicial, así que matchean a cualquier profundidad
  (verificado: `git check-ignore` sobre `demo/compatibility-pair/content/foo.ts`
  responde `.gitignore:4:content/`).

  **El test de la demo, que se escribe acá.** Las tres afirmaciones sobre el
  script de señalización que la T-01 dejó en su lugar bajan a
  `demo/compatibility-pair/test/` y afirman **sobre los archivos de la demo, no
  contra el fixture**: que la tabla de la corrida tiene cinco filas, que el
  `PLANNED-DURATION` se computa y no se tipea, que el script escribe las dos
  `CLASS`, y que cada fila nombra un asset-list que existe en el `signalling/` de
  la demo. No es una comparación entre las dos copias: es el chequeo de la
  corrida viva, hecho con lo que la demo tiene adentro. Del test partido de hoy
  (`test/program-ranges-and-volume.test.js:136`), la mitad que prueba
  `kindOfClass` se queda en `test/` y la que mira el script baja.

  `npm test` no cambia: `node --test` sin argumentos descubre recursivamente, y
  está verificado en esta máquina (node v25.9.0) que una suite en `test/` y otra
  en `demo/x/test/` corren las dos con un solo comando.

  Punto de partida, en este orden: el ADR 0020 (el reparto archivo por archivo),
  el ADR 0022 (por qué el servidor y no las URIs), el ADR 0023 (por qué el test
  de la demo mira la demo), y después `index.html`, `run.sh`,
  `scripts/verificar-cortes.mjs` y `lib/controls.js`. Restricciones: ni una de
  las trece URIs de asset-list se edita, ni una línea de los tres scripts de
  contenido, ni el `.gitignore`, ni nada de `lib/` más allá de la cita del punto
  4. Si algo obliga a editar una URI, es un hallazgo contra el ADR 0022 y se
  reporta. Escape hatch: es un commit solo y `git revert` lo deshace entero.
  Depende de la T-01 y de la T-02.
- **Definición de done:**
  - `./run.sh` levanta la demo y el recorrido de los cinco breaks corre entero,
    con un cuadro capturado por break.
  - `npm test` en verde, con los tests de `test/` **más** los de
    `demo/compatibility-pair/test/`, y la cuenta de los de `test/` igual a la que
    dejó la T-01 menos las tres afirmaciones que bajaron.
  - `npm run check` (o `node scripts/verificar-cortes.mjs` mientras la T-04 no
    exista) en verde, las dos costuras.
  - `/usr/bin/grep -rn --include='*.js' -e '\.project' -e 'signalling/' -e 'demo/' test/` no devuelve nada:
    `test/` quedó leyendo sólo `test/` y `lib/`, que es el estado final del
    ADR 0023.
  - `git status` limpio y `git log --follow` mostrando la historia de al menos un
    archivo mudado.
- **nivel de verificación:** bajo. Todo lo que esta task puede romper es una ruta,
  y una ruta rota es una pantalla que no carga, un 404 en la consola o un chequeo
  en rojo. Lo único que no se ve —que la corrida que la demo sirve siga siendo la
  de las cinco tandas— es lo que cubre el test nuevo de la demo, que es parte del
  entregable de esta task.
  - **Tests nuevos: sí, y son los de `demo/compatibility-pair/test/`** descritos
    arriba. Son la lógica no visual de la task.
  - **Campaña de mutación: no.** No hay una regla de negocio nueva; hay archivos
    que cambian de lugar y cuatro rutas que se reescriben.
  - **La verificación visual es un cuadro por break, los cinco**, al tamaño real
    de uso. Mirar la imagen: un `getComputedStyle` no es evidencia de que algo se
    ve.
  - **Se fue:** la comparación de la caja pedida contra la dibujada. Esta task no
    toca el renderizado ni los controles, y el recorrido corriendo con los cinco
    cuadros ya muestra que la composición se dibuja.

## T-04 — El manifiesto declara la sdk

- **Objetivo:** que el `package.json` diga qué es el producto, sobre todo por lo
  que no está adentro de `files`, y que los cuatro verbos de la sdk existan como
  comandos en lugar de vivir sólo adentro de `run.sh` y del README.
- **Qué tiene que cubrir:** los campos, uno por uno, con el ADR 0024 como fuente:
  `name` pasa a `qualabs-concurrent-hls`, que es el nombre del archivo construido
  y del global que define; `description` no se toca, porque ya describe la
  librería y no la demo; `main` y `exports` apuntan a `./lib/concurrent-hls.js`,
  que es el punto de entrada de las fuentes y la superficie pública real, y **no**
  a `dist/`, que está gitignoreado; `files` es `["lib/", "dist/", "docs/"]`;
  `private: true` se queda y `version` queda en `0.0.0`; y `scripts` queda con
  `start` (`./run.sh`), `build` (`./scripts/construir-libreria.sh`), `check`
  (`./scripts/verificar-cortes.mjs`) y `test` (`node --test`).

  **`serve` y `content` salen**, porque nombran rutas de una demo. La T-05 los
  escribe en el README de la demo, con su ruta completa, que es donde nombrarlos
  no es una copia de nada. Efecto útil de segundo orden: el nombre de la demo por
  default queda en un solo lugar del repositorio, el `run.sh`.

  Punto de partida: el ADR 0024 y `package.json`, que son doce líneas.
  Restricción: no se agrega ninguna dependencia y no se toca `type: "module"`,
  que es lo que hace que el chequeo de sintaxis de `construir-libreria.sh`
  funcione. Depende de la T-03, que es la que deja los scripts de la demo en su
  ruta final.
- **Definición de done:** los cuatro verbos corridos y en verde
  (`npm start` levantando la demo, `npm run build`, `npm run check`,
  `npm test`), y `npm pack --dry-run` listando lo que `files` declara y **nada
  más**: sin `demo/`, sin `test/`, sin `scripts/`, sin `vendor/`, sin
  `server.mjs` y sin `run.sh`.
- **nivel de verificación:** bajo. Los cuatro verbos son comandos: si uno está
  mal, no corre, y eso se ve en la primera corrida. Y `files`, que es el campo que
  hace el trabajo de este ADR, tiene su propio observable en
  `npm pack --dry-run`, que lista el paquete sin publicar nada.
  - **Tests nuevos: no.** Lo que habría que testear son cuatro comandos, y
    correrlos es más corto y más honesto que un test que los envuelva.
  - **Campaña de mutación: no.**
  - **La verificación es la salida de los cinco comandos**, pegada en la
    evidencia.

## T-05 — El README de la raíz enruta y la demo cuenta su corrida

- **Objetivo:** que quien abre el README de la raíz lea qué es la sdk y de dónde
  sacar cada cosa, y que quien abre el README de la demo lea qué muestra esa
  demo y cómo levantarla. Dos temas, dos documentos, ningún párrafo repetido.
- **Qué tiene que cubrir:** el reparto sección por sección del README de hoy
  —347 líneas y nueve secciones— está resuelto en el ADR 0025 y se ejecuta desde
  ahí. Las dos reglas que deciden lo que la tabla de ese ADR no enumere: **cada
  párrafo va donde vive su tema, y el otro README recibe un puntero y nunca un
  resumen**; y **el README de la raíz no describe la corrida**, porque la corrida
  es una propiedad de una demo.

  La raíz gana una sección `demo/` que es un índice: una línea por demo con qué
  argumenta y un link a su README, más el comando para levantar una
  (`./run.sh <demo>`). La línea de `compatibility-pair` dice de qué es el par y
  apunta al ADR 0007.

  Los dos punteros que la tabla del ADR marca como tales —la maquinaria de
  interstitials apagada y los dos defaults que la herramienta omite— quedan
  **como puntero y no como párrafo**: los dos están hoy escritos completos en el
  README **y** en `docs/`, y un dato del que otro artefacto es dueño se apunta.

  El README de la demo recibe además los dos comandos que la T-04 saca del
  manifiesto, con su ruta completa
  (`node server.mjs demo/compatibility-pair`,
  `./demo/compatibility-pair/scripts/preparar-contenido.sh`).

  **La cláusula de `docs/`**, que es una cláusula y no una reescritura: la cita
  de `docs/contrato-senalizacion-renderizado.md` al JSON de
  `.project/phases/01-poc-web-hlsjs/tasks/T-06/` se queda, y se le agrega que ese
  archivo es la evidencia de una fase cerrada, para que quien siga el puntero
  sepa que va a un registro y no a un archivo vivo (ADR 0023).

  **Lo que en `docs/` no se toca, y está dicho para que nadie se ponga
  creativo:** el `hls.loadSource('./content/primary/con-daterange.m3u8')` del
  ejemplo de `integrating-the-library.md` es la página del integrador cargando su
  propio stream, y el `GET /signalling/asset-list-cornerOverlay.json?...` ilustra
  la forma de un pedido y no una ruta de este repositorio. Los dos se quedan como
  están.

  Punto de partida: el ADR 0025 con su tabla, `README.md`, y
  `docs/contrato-senalizacion-renderizado.md` línea 228. Restricción: ningún
  documento de `docs/` se reescribe y la superficie pública que esos documentos
  describen no cambia. Depende de la T-03 (las rutas) y de la T-04 (los verbos).
- **Definición de done:** los dos README leídos de arriba abajo, cada uno
  entendible solo; ninguna sección del README de la raíz describe la corrida;
  todos los links relativos de los dos resuelven a un archivo que existe
  (chequeado, no supuesto); y la cláusula de procedencia está en `docs/` en una
  frase.
- **nivel de verificación:** mínimo. Todo el entregable es prosa que una persona
  lee antes de que algo dependa de ella, y lo único mecánico son los links, que
  se chequean con un comando.
  - **Tests nuevos: no. Campaña de mutación: no.**
  - **Una corrida que muestra el resultado**: el chequeo de links resueltos, y
    nada más.

## T-06 — La corrida entera desde la estructura nueva

- **Objetivo:** que la fase quede probada como un todo y no task por task: la
  demo levanta desde la estructura nueva con un solo comando, el recorrido de los
  cinco breaks corre entero, y las dos costuras y la suite están en verde
  después de que todo lo demás ya se tocó.
- **Qué tiene que cubrir:** los cuatro puntos de la verificación de la fase del
  `PHASE.md`, corridos en este orden y con su salida guardada: `./run.sh` y un
  cuadro por break, los cinco; `npm test` con la cuenta de tests de `test/` y de
  `demo/compatibility-pair/test/` anotada por separado; `npm run check`; y el
  grep de autosuficiencia de `test/`.

  Y una cosa que sólo se puede mirar acá, porque es sobre el conjunto: **que el
  árbol de la raíz se lea como una sdk**. `ls` de la raíz devolviendo `lib/`,
  `dist/`, `test/`, `docs/`, `vendor/`, `demo/`, `scripts/`, `server.mjs`,
  `run.sh`, `package.json` y `README.md`, y nada de la página. Un archivo de la
  página que quedó arriba es el defecto que ninguna task anterior iba a encontrar,
  porque cada una miraba su propio pedazo.

  Punto de partida: la sección "La verificación de la fase" del `PHASE.md`.
  Restricción: esta task no arregla nada por su cuenta. Lo que encuentre se
  reporta y se corrige en la task que lo introdujo, con su línea
  `post-ejecución:`. Depende de la T-01 a la T-05.
- **Definición de done:** los cinco cuadros guardados, la salida de los tres
  comandos guardada y en verde, el `ls` de la raíz guardado, y cero hallazgos
  abiertos.
- **nivel de verificación:** bajo. Es una verificación y su instrumento principal
  es mirar: cinco cuadros al tamaño real de uso, uno por break. Lo mecánico son
  tres comandos y un grep, que se corren y se pegan.
  - **Tests nuevos: no.** Esta task no construye nada.
  - **Campaña de mutación: no.**
  - **La verificación visual es el centro de la task**, y son los cinco cuadros
    mirados como imagen.
