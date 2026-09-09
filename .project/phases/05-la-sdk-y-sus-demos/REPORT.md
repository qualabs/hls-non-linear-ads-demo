# Informe de cierre — fase 05: la sdk y sus demos

**Fase abierta, diseñada y ejecutada el 2026-09-08; cerrada el 2026-09-09 con las
seis tasks en `done`.** Ninguna abandonada y ninguna task nueva agregada después
de la generación.

## 1. Resumen

El ADR 0015 había cortado la librería de la página **adentro del código**, y ese
corte estaba verificado por un grep. Lo que no estaba era a la vista: quien abría
la raíz encontraba `brand/`, `content/`, `css/`, `signalling/` e `index.html` al
lado de `lib/`, todos al mismo nivel y sin nada que dijera cuál era el producto.
**Esta fase movió esa línea al árbol del repositorio**, y de paso cortó el único
acoplamiento que iba en la dirección equivocada: la suite de la sdk leyendo la
capa de gestión del desarrollo.

Lo que la fase entrega son dos propiedades, y las dos son verificables sin
opinión. **La raíz es la sdk**: el `ls` devuelve `lib/`, `dist/`, `test/`,
`docs/`, `vendor/`, `demo/`, `scripts/`, `server.mjs`, `run.sh`, `package.json` y
`README.md`, y ni un archivo de la página quedó arriba. Y **una demo es una
carpeta que se puede nombrar, levantar y multiplicar sin tocar la librería**:
`./run.sh <demo>` la levanta, su `signalling/` y su contenido son suyos, y su
README cuenta su corrida.

### Lo que la fase midió

Todo de la T-06, corrido sobre el resultado entero el 2026-09-08:

- **El recorrido corrió de punta a punta desde la estructura nueva y sin un
  salto.** `./run.sh` sin argumento, `video.ended` en 180,03 s, muestreado cada
  250 ms, los cinco breaks arrancando en su segundo declarado.
- **250 pedidos y ninguno con status ≥ 400**, que es el único chequeo que atrapa
  una ruta que sólo falla en runtime.
- **46 tests en verde**: los 43 de `test/` —los mismos 43 que antes de la fase,
  con los mismos nombres y las mismas cuentas por archivo— más los 3 de
  `demo/compatibility-pair/test/`. El número que más podía moverse,
  `program-ranges-and-volume.test.js`, quedó en 12 de los dos lados: las tres
  afirmaciones que bajaron a la demo se compensan con el test de integridad del
  fixture que agregó la T-01.
- **`npm run check` en `both seams hold.`** y el grep de autosuficiencia de
  `test/` en cero líneas.
- **Los cinco breaks mirados en cuadro** —seis capturas, contando el aviso a
  cuadro entero de adentro del mezclado—, y el del break 2 comparado contra el
  de la T-03: la misma composición, los mismos recuadros, el mismo segundo. La
  mudanza no movió un píxel.

### Los nueve commits

| commit | qué es |
| --- | --- |
| `94677ca` | T-01: los fixtures pasan a ser del test |
| `a797f37` | el grep de autosuficiencia acotado al código, en las tres tasks que lo pedían |
| `e69166b` | T-02: el servidor recibe la raíz de documentos como argumento |
| `e1ad898` | T-03: la mudanza, la página baja a `demo/compatibility-pair/` |
| `dbcca8d` | T-04: el manifiesto declara la sdk |
| `c9fccad` | T-05: el README de la raíz enruta y la demo cuenta su corrida |
| `aa89d90` | T-06: la corrida entera desde la estructura nueva |
| `20923ef` | el `status` del `PHASE.md`, que decía `planning` con las seis tasks hechas |
| `4ac7ee6` | las cinco citas de `test/fixtures/README.md`, escritas completas |

Los tres últimos no son tasks: son arreglos de cosas que la fase encontró sobre
sí misma. Los dos primeros están explicados en la sección 4 y el tercero acá
abajo.

### La decisión que llegó al cierre y se resolvió antes de él

La T-06 dejó dicho que las cinco citas a `.project/` de `test/fixtures/README.md`
podían escribirse completas, y lo dejó "para el cierre" porque cambiaba una
decisión de la T-01. **No era una decisión pendiente: el ADR 0023 de esta misma
fase ya la había tomado**, y su título la dice entera, "el código no lee
`.project/`, la documentación sí lo cita". Las citas estaban abreviadas para no
disparar un grep que buscaba esos nombres en la carpeta entera, ese grep se
corrigió en `a797f37` y desde entonces mira sólo el código, así que la razón de
la abreviatura había dejado de existir. Se escribieron completas en `4ac7ee6`,
las cinco resuelven a una carpeta que existe, y el párrafo que justificaba la
abreviatura se reemplazó por la distinción del ADR: una lectura se rompe si el
registro se reorganiza, una cita no se rompe con nada.

**Este cierre no lleva ninguna decisión adentro.**

## 2. Decisiones tomadas

Seis ADR nuevos, el 0020 al 0025, todos `accepted` y **todos `scope: project`**.
El scope no es un descuido de etiquetado: lo que estas seis decisiones fijan es
qué es este repositorio, no cómo se ejecuta esta fase, así que sobreviven a la
fase por definición.

- **ADR 0020 — la raíz del repositorio es la librería y `demo/` es donde se la
  muestra.** El reparto archivo por archivo sale de una sola pregunta,
  *¿existiría si no hubiera ninguna demo?*, y los tres casos que la pregunta no
  contesta sola están resueltos con su desempate escrito: `vendor/hls.min.js`
  queda en la raíz porque 1.7.2 es la versión contra la que la sdk está leída y
  medida (ADR 0002) y una copia por demo envejece en silencio; `brand/` baja
  porque la librería no envía marca, la recibe; `css/player.css` baja porque los
  controles llevan su propio CSS adentro de `lib/controls.js`. Y una demo se
  nombra por el argumento que hace. **Generaliza el ADR 0015**, que queda
  `accepted` con `generalized_by: "0020"`: nada de lo que ese ADR afirma dejó de
  valer, la línea se ensanchó del código al árbol.
- **ADR 0021 — un `signalling/` por demo.** Los trece asset-lists son formas con
  las URIs de esta demo puestas, no formas. Y el caso de la lista repetida es más
  angosto de lo que parece: dos demos sobre material distinto no pueden
  compartir un asset-list, así que el caso sólo aparece entre dos demos sobre el
  mismo contenido, y ésas son una demo con dos corridas.
- **ADR 0022 — el servidor recibe su raíz de documentos como argumento y monta
  `/dist/` y `/vendor/` de la sdk.** Es el ADR que baja el riesgo de verdad:
  ocho líneas en un archivo de cuarenta, y a cambio los trece asset-lists, el
  script de señalización y los tres scripts de contenido quedaron byte por byte
  iguales. La cuenta de rutas por editar en la mudanza quedó en dos `src` de
  `index.html`.
- **ADR 0023 — el código no lee `.project/`, la documentación sí lo cita.**
  `test/` sólo lee `test/` y `lib/`, sin excepciones, porque una autosuficiencia
  "casi completa" es la forma que se despega. Los fixtures se copian y de ahí en
  adelante son del test, **sin chequeo contra el original**, y eso está escrito
  en `test/fixtures/README.md` para que nadie agregue uno creyendo que falta. La
  distinción que sostiene la otra mitad del ADR es concreta: un test que **lee**
  el registro se rompe si el registro se reorganiza, un documento que lo **cita**
  no se rompe con nada.
- **ADR 0024 — el manifiesto declara la sdk sin afirmar que está publicada.**
  `files: ["lib/", "dist/", "docs/"]` es el campo que hace el trabajo, y lo hace
  sobre todo por lo que no está adentro. `private: true` y `version: 0.0.0` se
  quedan.
- **ADR 0025 — el README de la raíz enruta y cada demo cuenta su corrida.** Dos
  reglas: cada párrafo va donde vive su tema y el otro README recibe un puntero y
  nunca un resumen, y el README de la raíz no describe la corrida.

**Ningún ADR quedó superseded en esta fase y ninguno quedó `proposed`.** Los dos
`proposed` del proyecto —0011 y 0012, las dos propuestas a David— no los tocó
esta fase.

**Las tres consecuencias que la mudanza obligó y no se volvieron ADR**, porque
son trabajo y no decisiones nuevas: `lib/controls.js` deja de citar la ruta de
`brand/README.md` y se queda con la frase, el grep del ADR 0003 reescribe las dos
rutas que se mudan sin sacar ninguna, y el `.gitignore` no se toca porque sus
patrones `content/` y `dist/` no llevan barra inicial y matchean a cualquier
profundidad.

## 3. Tasks

Seis, las seis en `done`, cada una con su carpeta de evidencia.

| id | qué dejó |
| --- | --- |
| T-01 | `test/fixtures/` con los cinco JSON de mediciones y los trece asset-lists, dieciocho de dieciocho copias idénticas verificadas con `diff` y `sha256`, y la tabla de la corrida declarada en `run.json` en lugar de parseada. Los 43 tests siguen siendo los mismos 43 |
| T-02 | `server.mjs` con `DOCS`, `MOUNTS` y `resolveFile()`, el default en la raíz del repositorio para que el commit sea una suma, y la guarda de traversal comparando contra `root + sep` sobre tres prefijos legítimos |
| T-03 | la mudanza: 26 archivos tracked con `git mv` (25 renombres al 100 %, `index.html` al 98 %), `content/` con su cache de 660 MB con un `mv`, las cuatro ediciones de ruta, y `demo/compatibility-pair/test/signalled-run.test.js` adentro del mismo commit |
| T-04 | el `package.json` de doce líneas a veinte, los cuatro verbos corridos, y `npm pack --dry-run` listando diez archivos y nada de `demo/`, `test/`, `scripts/`, `vendor/`, `server.mjs` ni `run.sh` |
| T-05 | los dos README: la raíz en 170 líneas, la demo en 243, ningún párrafo repetido, y la cláusula de procedencia en `docs/` |
| T-06 | la verificación de la fase, los tres arreglos de la sección 7 y los dos hallazgos que quedaban abiertos, cerrados |

**El invariante de ejecución aguantó.** Ningún commit dejó `npm test` en rojo y
ninguno dejó a `test/` leyendo una demo, y eso es lo que fijó el orden: la
autosuficiencia primero, el servidor después, la mudanza tercera llevando adentro
el test nuevo de la demo. Ese último punto era el que se podía discutir y no se
discutió: separar el test en su propio commit era tener un commit con la suite
roja o uno con las tres afirmaciones sobre `senalizar-contenido.sh` borradas, y
ese chequeo es el que encontró el `PLANNED-DURATION` de doce segundos en un break
de cuarenta y ocho.

### Lo que las tasks decidieron y su bloque no decidía

Ocho cosas, en cuatro tasks, y **ninguna se preguntó**. Se reportan acá porque el
patrón vale más que cada una: **todas son de la línea de arranque, del mensaje de
error o del comentario que un argumento nuevo trae consigo**, o sea la superficie
que un cambio de estructura toca y que ningún ADR enumera.

- **T-02**: la línea de arranque dice qué carpeta está sirviendo (`-- serving
  compatibility-pair`), que es lo primero que uno quiere saber cuando la página
  no carga; y el encabezado dejó de decir "40 lines", porque el archivo dejó de
  tener cuarenta, y dice "a few dozen", que es la afirmación que la próxima
  edición no vuelve a falsear.
- **T-03**: `run.sh` chequea que la carpeta de la demo exista y dice qué nombre
  no encontró; el comentario de `verificar-cortes.mjs` arriba de `files` dice por
  qué dos de los cuatro archivos están adentro de una demo; y un párrafo de
  `test/fixtures/README.md` pasó a decir que las tres afirmaciones viven en la
  suite de la demo, porque decía "what stays over the script".
- **T-05**: el título de la raíz pasó de `# hls-non-linear-ads-demo` a
  `# qualabs-concurrent-hls`, que cierra uno de los dos sobrevivientes del nombre
  viejo; dos filas de tabla que se apoyaban en secciones que se fueron al otro
  documento se reescribieron; y el chequeo de links resolvió también las rutas
  escritas en prosa y en bloques de código, no sólo los links markdown.

## 4. Lo que queda abierto

Cuatro hallazgos de esta fase y cuatro items que se quedan de pie por decisión.

### Los cuatro hallazgos

1. **La definición de done de tres tasks pedía un grep que no podía pasar
   nunca.** `grep -rn "\.project\|signalling/" test/` devuelve quince líneas, las
   quince adentro de dos JSON de mediciones recién copiados: son líneas de
   consola que el navegador imprimió durante la corrida medida, con una URL
   `.../signalling/asset-list-….json` adentro del texto. **Es dato medido y
   editarlo falsificaría un registro**, así que el instrumento correcto es el
   mismo grep acotado al código (`--include='*.js'`), que sí da cero. Lo encontró
   la T-01 corriendo el grep que su propio done le pedía en lugar de declararlo
   pasado, y se corrigió en las tres tasks (`a797f37`) con el motivo escrito en el
   preámbulo para que nadie lo "arregle" sacándole el include. **Lo que queda
   abierto no es el grep, es cómo se escribió**: un chequeo que no puede pasar y
   un chequeo que pasa siempre son el mismo defecto, y el diseño de la fase
   escribió uno de los dos sin que nadie lo corriera. La recomendación 2 es la
   forma operativa.
2. **El `..` que uno escribiría nunca disparó el 403, y nunca lo disparó.** El
   handler parsea con `new URL(...)` y ese parser colapsa los `../` del path
   antes de que el servidor vea nada: `/dist/../../etc/passwd` llega como
   `/etc/passwd` y da 404 abajo de la raíz de documentos, no 403. **Pasaba lo
   mismo antes de esta task**, y es por eso que la guarda vieja no se disparaba
   nunca. El vector real es el percent-encodeado con la barra adentro,
   `%2e%2e%2f`, porque el parser no decodifica `%2f` como separador y el
   `decodeURIComponent` corre después; y ahí la guarda importa de verdad, porque
   abajo de un montaje lo que se junta es el resto del path, que es relativo, así
   que su `../` sobrevive a `normalize()` y lo único que lo para es la
   comparación de prefijo. Hoy `/dist/%2e%2e%2f%2e%2e%2fetc/passwd` da 403 y
   `/vendor/%2e%2e%2fdist/qualabs-concurrent-hls.js` también. **Lo que queda
   abierto es que eso no lo cubre ningún test y no lo puede cubrir**: un test que
   importara `server.mjs` dejaría a `test/` leyendo fuera de `test/` y `lib/`,
   que es lo que el ADR 0023 acaba de instalar. La evidencia son cuatro pedidos
   de un día, no una red de regresión.
3. **El verbo `content` del manifiesto estaba roto desde la T-03 y sacarlo lo
   arregló de rebote.** La T-04 lo sacó porque nombraba una ruta de una demo,
   que es el argumento del ADR 0024; el dato es que además **apuntaba a una ruta
   que la mudanza ya había movido**. O sea que entre la T-03 y la T-04 el
   manifiesto tenía un comando muerto y ninguna de las dos costuras lo mira: el
   grep del ADR 0015 lista `lib/*.js` y `scripts/construir-libreria.sh`, y el
   `package.json` no está adentro de ninguna lista. **Nada en el repositorio
   chequea que un `script` del manifiesto resuelva a un archivo que existe.**
4. **La etiqueta de consola de `server.mjs` quedó decidida por un criterio que ya
   estaba en el repositorio sin estar escrito.** La T-04 la reportó y no la tocó,
   con razón: ningún ADR dice cuál tiene que ser, y copiarle el `name` del
   manifiesto a un servidor que sirve una demo era la respuesta cómoda. El
   criterio que la cierra es que **la etiqueta nombra a la herramienta que imprime
   la línea**, que es lo que las otras dos ya hacían —`construir-libreria:` sale
   de `scripts/construir-libreria.sh` y `verificar-cortes:` de
   `scripts/verificar-cortes.mjs`, las dos el nombre del archivo sin extensión—,
   así que dice `server:`. **La convención existía en el código y en ningún
   documento**, y por eso costó una decisión en la última task de la fase en lugar
   de resolverse sola. Con eso el nombre viejo no queda en ningún archivo tracked
   fuera de `.project/`.

### Los cuatro que se quedan de pie por decisión

- **Una segunda demo.** La fase dejó el lugar hecho y el criterio escrito y no
  construyó ninguna, que es lo que su alcance decía. El criterio del ADR 0021
  —dos demos que necesitaran el archivo idéntico son una demo con dos corridas—
  está escrito y sin ejercer.
- **Los cuatro asset-lists de repliegue existen dos veces**, en la demo y en
  `test/fixtures/`, sin chequeo entre las copias. Es el R4 y es residual
  aceptado, por la misma decisión que gobierna el resto de la carpeta.
- **El fixture congelado no se va a enterar si la corrida que la demo sirve
  cambia de forma.** Es el R3, aceptado explícito, y la compensación es la suite
  de la demo, que vigila la corrida viva. El día que la corrida cambie hay que
  mirar los fixtures a mano.
- **`private: true` y `version: 0.0.0`.** El manifiesto declara qué es la sdk sin
  afirmar que está publicada, y los campos se vuelven operativos el día que la
  superficie pública se cierre. El ADR 0015 dice que todavía no está congelada.

### Dos que no son de esta fase y siguen abiertos

- **Las fases 02 y 04 no tienen `DESIGN.md`**, y el validador las reporta en rojo
  desde antes de esta fase. No se silencian y no se rellenan: un `DESIGN.md`
  reconstruido desde el contrato que tenía que generar es procedencia que nunca
  existió. La decisión —tener la conversación de diseño, o aceptar el hallazgo en
  `EXCEPTIONS` con su razón escrita— es de Nicolás.
- **La fase 06 no tiene línea en el índice de fases del `PROJECT.md`.** Está
  abierta desde el 2026-09-08 y el índice no la nombra. Es el mismo agujero que
  esta fase tuvo mientras estaba abierta, así que no es un olvido de una vez: el
  índice se está escribiendo al cerrar y no al abrir, y el comentario del propio
  índice dice que la línea de una fase abierta dice para qué está. Este cierre no
  la escribe, porque la fase 06 está en ejecución y su línea es de quien la
  abrió.

## 5. Riesgos que se materializaron

El `PHASE.md` escribió cinco. **Se materializó uno, y en una forma adyacente a la
que estaba escrita.**

- **R1 — la demo deja de levantar y nadie se entera hasta la grabación. No se
  materializó.** La mitigación corrió tal como estaba escrita y no hizo falta
  ningún instrumento nuevo: `./run.sh`, un cuadro por break, la suite y las dos
  costuras.
- **R2 — una ruta se arregla en un lugar y se pasa en otro que sólo falla en
  runtime. Se materializó dos veces, y las dos veces en un comentario y no en
  runtime.** La primera la agarró el grep de la costura del ADR 0015: un
  comentario de `test/` explicaba dónde quedó la otra mitad del test y decía la
  ruta completa `demo/compatibility-pair/test/`, que contiene justo uno de los
  literales que ese grep busca. La segunda la agarró el chequeo de rutas de la
  T-06 corrido sobre el árbol entero: `test/fixtures/README.md` decía que
  `run.json` reemplaza el parseo de `scripts/senalizar-contenido.sh`, y ese
  script había bajado a `demo/compatibility-pair/scripts/`. **La mitigación
  funcionó mejor que su enunciado**: el ADR 0022 dejó la cuenta de rutas de
  runtime por editar en dos `src`, así que el riesgo se corrió a las rutas
  escritas en prosa y en comentarios, que es donde no lo esperaba el enunciado y
  donde el instrumento que lo atrapó fue un chequeo de rutas sobre los 36
  archivos de texto tracked —12 links y 179 rutas resueltas— y no el navegador.
- **R3 — el fixture congelado deja de describir la corrida que la demo sirve. No
  se materializó**, y es aceptado explícito de todos modos.
- **R4 — cuatro asset-lists de repliegue existen dos veces. Existe, y es residual
  aceptado.** Está en la sección 4.
- **R5 — un archivo tracked se muda perdiendo su historia. No se materializó.**
  Los 26 tracked se movieron con `git mv` y `git log --follow` los sigue: 25
  renombres al 100 % y el de `index.html` al 98 %, que son sus dos `src`. El
  detalle que el riesgo señalaba se cumplió también: `content/.fuentes/` se mudó
  con un `mv` y nada se volvió a bajar. La única diferencia con lo escrito es de
  tamaño, y a favor: el cache eran 660 MB medidos y no los 535 MB que estimaba el
  riesgo.

## 6. Recomendaciones para la fase siguiente

1. **Si una task de la 06 toca `server.mjs`, volver a correr los cuatro pedidos
   de la T-02**, incluido el percent-encodeado. No hay test que los cubra y por el
   ADR 0023 no lo puede haber, así que la única red es correrlos. Son cuatro
   pedidos y están escritos con su salida verbatim en la evidencia de la T-02.
2. **Cuando una definición de done nombre un grep, correrlo al escribir el done y
   no al ejecutarlo.** Es una línea de trabajo en la generación de la fase y es lo
   que habría evitado que tres tasks cargaran un chequeo imposible durante toda la
   fase. Salió gratis sólo porque la T-01 lo corrió en lugar de declararlo pasado.
3. **La 06 toca `lib/` y la demo a la vez** —la marca del foco la dibuja el
   renderer sobre el nodo que creó, ADR 0030—, así que la costura del ADR 0015 va
   a estar en el camino: grepea el literal `demo` en `lib/*.js` con lista de
   aceptados vacía. Esta fase la disparó dos veces y las dos con un comentario que
   citaba una ruta. **La forma de arreglarlo ya está decidida y no hace falta
   volver a decidirla**: se saca la ruta y se queda la frase, porque para un
   argumento el chequeo es un lector y no un grep.
4. **Un `script` del manifiesto no lo chequea nada.** Si la 06 agrega o mueve un
   verbo, correrlo en el mismo commit es todo el chequeo que hay. Un chequeo
   automático sería trabajo nuevo y esta fase no lo pide: lo que pide es no
   suponer que las costuras lo miran, porque no lo miran.
5. **La línea de la fase 06 en el índice de fases del `PROJECT.md`.** No es de
   este cierre, y hoy el índice no nombra la fase que está corriendo.

## 7. Correcciones post-ejecución

`grep -n "post-ejecuci"` sobre el `TASKS.md` de la fase devuelve **tres líneas**,
en la T-01, la T-03 y la T-04, las tres del 2026-09-08 y **las tres encontradas
por la T-06**. No hay ningún `feedback-<n>.md` en la fase.

| task | qué se corrigió |
| --- | --- |
| T-01 | el párrafo de `test/fixtures/README.md` que justificaba escribir sus rutas sin prefijo diciendo que el grep de autosuficiencia mira la carpeta entera, "este README incluido". Dejó de ser cierto cuando el grep se acotó al código por las quince líneas de dato medido que esa misma task encontró. El párrafo ahora dice el alcance que el chequeo tiene |
| T-03 | la ruta `scripts/senalizar-contenido.sh` del mismo README, que la mudanza dejó apuntando al `scripts/` de la sdk. Quedó nombrado por lo que es, el script de señalización de la demo |
| T-04 | la etiqueta de `server.mjs:107`, que esta task había reportado sin tocar porque ningún ADR decía cuál tenía que ser. La T-06 la decidió con el criterio de la sección 4 |

**Leídas como medición y no como registro**, las tres dicen lo mismo y no dicen
que el `done` estuviera flojo: **son las tres el producto del instrumento que la
fase se dio para encontrarlas**. El bloque de la T-06 dice literalmente que esa
task no arregla nada por su cuenta y que lo que encuentre se corrige en la task
que lo introdujo con su línea `post-ejecución:`, así que tres correcciones son la
convención funcionando y no tres verificaciones que fallaron. Es la primera fase
del proyecto con más de dos, y la fase con la task de verificación más grande.

Dos observaciones que sí son sobre cómo se verificó:

- **Dos de las tres son documentación y ninguna es código**, que es exactamente
  la misma forma que tomó el R2. En una fase que mueve archivos, lo que se queda
  viejo es lo que **habla** de dónde están las cosas, y el instrumento que lo
  encuentra es un chequeo de rutas sobre el árbol entero. La T-05 lo intuyó y
  amplió su chequeo de links a las rutas escritas en prosa; la T-06 lo llevó a
  los 36 archivos y encontró la que faltaba. **La lección es del alcance del
  chequeo, no de la prolijidad de nadie**: dos de las tres correcciones están en
  el mismo archivo, `test/fixtures/README.md`, que ninguna task tenía como
  entregable después de la T-01.
- **La tercera no es una corrección, es una decisión que su task devolvió a
  propósito.** La T-04 podía cerrarla copiando el `name` del manifiesto y no lo
  hizo, porque ningún ADR lo decía. Eso es el comportamiento correcto y la
  convención la anota igual que a un defecto; queda dicho acá para que la lectura
  de esta tabla no cuente tres defectos donde hay dos.

## 8. Revisión de documentación

Superficie por superficie, con el resultado por superficie.

- **El índice de fases del `PROJECT.md`.** Actualizado en este pase. La línea de
  la fase 05 se escribió por primera vez y dice en qué terminó: la línea del
  ADR 0015 movida al árbol, las dos propiedades verificables, y el costo de que
  `test/` se volviera autosuficiente. `last_update` pasa a 2026-09-09. **El
  `status` del proyecto queda en `ongoing` y este cierre no lo toca**: la fase 06
  está abierta, y quedan la grabación, iOS y la especificación de SVTA.
- **El resto del `PROJECT.md`.** Sin cambios, y se chequeó por qué: la mudanza no
  dejó ni una ruta vieja en el documento, porque las únicas rutas que cita son de
  `.project/` y las dos URLs son externas. La sección "A confirmar" no la tocó
  esta fase, que no cambió nada de lo que David tiene que confirmar.
- **El `PHASE.md` de la fase.** `status: closed` y `closed: 2026-09-09`. El
  cuerpo no se toca: es el contrato y describe correctamente lo que se propuso,
  incluida la estimación de 535 MB que la medición dejó en 660. Eso es
  información y no un error a corregir.
- **El `TASKS.md` de la fase.** Sin cambios en este pase. Las seis tasks ya
  estaban en `done` con su carpeta de evidencia apuntada, las tres líneas
  `post-ejecución:` ya están escritas, y el preámbulo del grep acotado al código
  ya está puesto con su motivo.
- **El `LOG.md` del proyecto.** Entrada de cierre agregada. Las ocho entradas de
  la ventana de la fase quedan como están: son el registro de lo que pasó.
- **`docs/arc42/`.** **No existe en este proyecto y este cierre no lo crea.** El
  documento de arquitectura del producto son los dos de `docs/`, y el diseño de
  esta fase resolvió explícitamente no partirlos en subcarpetas por audiencia
  porque tienen el mismo lector, quien construye con la sdk.
  `docs/contrato-senalizacion-renderizado.md` se re-leyó contra lo que la fase
  hizo y **sigue describiendo este sistema**: el delta de la fase es de forma y no
  de comportamiento, la superficie pública no cambió, el contrato entre las dos
  capas no cambió y `lib/signalling.js` no se tocó. Lo único que la fase le
  agregó es la cláusula de procedencia de la línea 228 —el JSON de la T-06 de la
  fase 01 es la evidencia de una fase cerrada y la cita dice dónde se hizo la
  medición, no dónde hay un archivo que alguien lea en tiempo de ejecución
  (ADR 0023)—, y está puesta.
- **El resto de `docs/`.** `docs/integrating-the-library.md` no se tocó, y eso es
  la decisión de la T-05 y no un olvido: sus dos rutas que parecen del árbol de
  hoy no lo son. El `hls.loadSource('./content/primary/con-daterange.m3u8')` es
  la página del integrador cargando su propio stream, y el
  `GET /signalling/asset-list-cornerOverlay.json?…` ilustra la forma de un pedido
  y no una ruta de este repositorio. Las dos siguen siendo correctas después de
  la mudanza justamente porque no hablan de este árbol.
- **El `README.md` de la raíz.** Reescrito por la T-05 y verificado por la T-06,
  y es el entregable de una task y no de este pase. Quedó en 170 líneas, no
  describe la corrida en ninguna sección, y su tabla "What is where" nombra los
  dos documentos de `docs/` y para quién son: *"the product's own documents: the
  contract between the two layers, and how to integrate the library into a page
  that is not a demo"*. **No tiene línea que apunte a `docs/arc42/` ni la puede
  tener, porque ese directorio no existe.** La sección `demo/` es un índice de una
  fila y una demo nueva agrega una fila sin tocar ninguna otra sección, que es la
  propiedad que el ADR 0025 compró.
- **El `README.md` de la demo.** Nuevo, 243 líneas, escrito por la T-05. Recibió
  *Run it*, *Before you record* con su tabla de los cinco breaks y *The
  compatibility pair* enteros, más los dos comandos que la T-04 sacó del
  manifiesto con su ruta completa. Se lee solo, que es la regla que obligó a
  reescribir dos filas de tabla que se apoyaban en secciones que se fueron al
  otro documento.
- **`test/fixtures/README.md`.** Es la superficie que esta fase creó y la que más
  se movió: dos de las tres correcciones post-ejecución y el commit `4ac7ee6`
  están ahí. Hoy dice de dónde vino cada archivo con la ruta completa, que no hay
  chequeo contra el original y que la ausencia es una decisión, y el alcance real
  del grep que sostiene la regla. Las cinco citas a `.project/` resuelven a una
  carpeta que existe, verificado en este pase.
- **El `CLAUDE.md` del proyecto.** **No existe, y esta fase no lo necesita.** De
  lo que esta fase podría haber querido escribir como convención, todo tiene
  dueño: el reparto raíz/demo está en el ADR 0020, la autosuficiencia de `test/`
  en el 0023, y la convención de la etiqueta de consola —la etiqueta nombra a la
  herramienta que imprime la línea— es el único candidato real. Está en la
  sección 4 como hallazgo y no se escribe como regla acá: son tres etiquetas en
  tres archivos y el lugar donde alguien la va a buscar es el archivo que edite.
- **`.project/knowledge/`.** No existe y este cierre tampoco la crea. Nada de lo
  que la fase aprendió quedó sin lugar: los hallazgos están en la sección 4, las
  decisiones en los seis ADR, y las mediciones en la evidencia de las tasks.
- **El `CLAUDE.md` y `knowledge/` del repo raíz.** **Nada que agregar, y el
  candidato se revisó.** El aprendizaje repo-wide más fuerte de la fase es el del
  hallazgo 1: **un chequeo que no puede pasar nunca y un chequeo que pasa siempre
  son el mismo defecto**, y el `knowledge/phase-closure-report.md` del skill
  `create-project` ya tiene escrita la mitad de eso ("una verificación que puede
  pasar sin que el requisito se cumpla es la verificación equivocada"). La otra
  mitad —que la falla simétrica existe y se detecta corriendo el chequeo al
  escribirlo— es candidata a regla y **no se escribe sola**: va con su texto
  exacto a Nicolás, que corrige y aprueba, y recién ahí se editan archivos. Por
  ahora vive en la recomendación 2, que es donde la fase 06 la va a leer. Y una
  nota de precedencia: `knowledge/documentation-policy.md` del repo padre cita
  este proyecto con la ruta `scripts/verificar-cortes.mjs`, que **esta fase dejó
  donde estaba**, así que esa cita sigue resolviendo.
- **El documento de install/runbook.** El proyecto no tiene `INSTALL.md`: el
  arranque es `run.sh` y las secciones de los dos README que lo explican.
  **Ninguna task agregó ni rompió un paso de setup** —no entró una dependencia, ni
  un bundler, ni una variable de entorno, y `dist/` se sigue armando en cada
  arranque desde `lib/`—, pero **el comando cambió de forma**: `./run.sh` ahora
  toma la demo como argumento, con `compatibility-pair` de default, y
  `node server.mjs` toma la raíz de documentos. Los dos están escritos en el
  README que corresponde, la raíz para el primero y la demo para el segundo, y el
  nombre de la demo por default quedó en un solo lugar del repositorio, la línea
  `DEMO="${1:-compatibility-pair}"` de `run.sh`.
- **Las carpetas `tasks/` de la fase que cierra, marcadas como registro.** Las
  seis son evidencia y no instrucción vigente. Se leen como registro por
  construcción: los `.txt` son salidas verbatim de comandos con su fecha, los seis
  documentos `.md` están escritos en pasado sobre lo que se corrió y lo que se
  midió, y las capturas llevan el break en el nombre. **Ninguno se reescribe**, y
  eso incluye las quince líneas de las dos mediciones de `test/fixtures/` que
  dispararon el hallazgo 1: son dato medido, y editarlas para que un grep pase es
  falsificar un registro. **El único que hay que leer como algo más que registro
  es `t02-el-servidor-sirve-la-carpeta-que-se-le-nombra.md`, por sus cuatro
  pedidos**, que son la única red que tiene la guarda de traversal y están
  apuntados desde el hallazgo 2 y desde la recomendación 1.

### El gate del cierre

`validar-proyecto.py` sobre el proyecto **sale en rojo con dos hallazgos, y
ninguno es de esta fase**: `phases/02-sdk-y-controles/PHASE.md` y
`phases/04-refinamiento/PHASE.md`, las dos `phase-without-design`. Son las mismas
dos que reportó la apertura de esta fase, están en la sección 4 y la decisión es
de Nicolás. **La fase 05 sale limpia**, con su `DESIGN.md` en su lugar, los seis
ADR con el frontmatter válido —ids como strings, la generalización 0020 → 0015
completa en los dos extremos— y ningún bloque de task difiriendo una decisión a
una persona.
