# Fase 05: la sdk y sus demos

El ADR 0015 dividió este repositorio en dos, la librería y la página que la usa,
y lo hizo adentro del código: `lib/` son los cinco módulos de la sdk y `js/` son
los tres de la página. La división existe, la verifica un grep
(`scripts/verificar-cortes.mjs`), y **no se ve desde afuera**. Quien abre la raíz encuentra `brand/`,
`content/`, `css/`, `signalling/` e `index.html` al lado de `lib/`, todos al
mismo nivel y sin nada que diga cuál es el producto. El `package.json` se llama
`hls-non-linear-ads-demo` y no declara `main`, `module`, `exports` ni `files`:
el único archivo que podría decir qué es la sdk no dice nada.

Esta fase hace visible la línea que el ADR 0015 ya trazó, y de paso corta el
único acoplamiento que va en la dirección equivocada: tres de los tests leen
JSON de `.project/`, que es la capa de gestión del desarrollo.

El repositorio pasa a tener una raíz que es la sdk y una carpeta `demo/` con una
subcarpeta por demo, porque va a haber más de una.

## Lo que ya está decidido y entra como dato

**Los fixtures se copian a `test/`, y de acá en adelante son de `test/`.** La
evidencia de las fases queda intacta como registro y `test/` se vuelve
autosuficiente. No hay ningún chequeo que compare las dos copias: el dueño del
fixture pasa a ser el test. Decisión de Nicolás, con su argumento: los tests que
dependen de `.project/` son la consecuencia de una task mal diseñada, y lo que se
debería haber hecho es que la task generara los tests con sus JSON adentro de
`test/`.

**El cambio de URLs de la demo no es un problema del diseño.** Mover `content/`
mueve las URLs que la demo sirve, y el primer draft para David es el 21 de
septiembre. Nicolás: "no importa. esto es mi gestión."

## El punto de partida, medido

Raíz de hoy: `brand/ content/ css/ dist/ docs/ js/ lib/ scripts/ signalling/
test/ vendor/` más `index.html`, `server.mjs`, `run.sh`, `package.json`,
`README.md` y `CREDITS.md`.

Cuatro acoplamientos, y son de tres especies distintas:

1. **Tres tests leen cinco JSON de `.project/`**: `m3-resultados.json` de la
   T-03 de la fase 01, y las mediciones de las T-02, T-04 y T-05 de la fase 02
   más la T-05 de la fase 03. Es una **lectura**: si el registro se reorganiza,
   `npm test` se rompe.
2. **Dos tests leen `signalling/` y uno lee `scripts/senalizar-contenido.sh`.**
   Hoy es inocuo porque las dos carpetas están en la raíz y no son de nadie.
   En cuanto `signalling/` baje a `demo/<nombre>/`, la suite de la sdk pasa a
   depender de una demo en particular.
3. **`docs/contrato-senalizacion-renderizado.md` cita un JSON de `.project/`.**
   Es una **cita**: nadie lo lee, es la procedencia de una medición.
4. **`lib/controls.js` cita `brand/README.md`** para justificar por qué el
   violeta y el amarillo de la barra no son colores de marca.

Y un dato del código que decide varias cosas de abajo: **las URIs de los trece
asset-lists son absolutas desde la raíz del servidor** (`/content/adB/index.m3u8`),
igual que el `X-ASSET-LIST="/signalling/..."` que escribe el script de
señalización.

## La pregunta que ordena todo

Para cada archivo de la raíz: **¿existiría si no hubiera ninguna demo?**

Si la respuesta es sí, es de la sdk y se queda. Si es no, es de la demo y baja.
La pregunta no es "¿lo usa la demo?", porque la demo usa la sdk entera; es si el
archivo tiene una razón de ser propia cuando no hay una página que mostrar.

## Decisión 1: la raíz es la librería, y `demo/` es donde se la muestra

| hoy | va a | por qué |
| --- | --- | --- |
| `lib/` | queda | es la sdk |
| `dist/` | queda | es la sdk construida. Generado, gitignored |
| `test/` | queda | prueba las funciones puras de la sdk |
| `docs/` | queda | el contrato entre las dos capas y cómo integrar la librería: los dos le hablan a quien construye con la sdk |
| `scripts/construir-libreria.sh` | queda | construye la sdk |
| `scripts/verificar-cortes.mjs` | queda | verifica las dos costuras de la sdk, ADR 0003 y ADR 0015 |
| `vendor/` | queda | ver abajo |
| `server.mjs` | queda | un servidor para todas las demos (decisión 4) |
| `run.sh` | queda, con la demo como argumento | construye la sdk y levanta la demo que se le nombre |
| `package.json` | queda | el manifiesto de la sdk (decisión 6) |
| `README.md` | queda, reescrito | (decisión 7) |
| `index.html` | `demo/compatibility-pair/` | es la página |
| `css/player.css` | ídem | es la hoja de estilos de la página. Los controles traen su propio CSS adentro de `lib/controls.js`, así que esta hoja no tiene nada de la sdk |
| `js/` (`app.js`, `stock-player.js`, `contract-trace.js`) | ídem | el cableado de la página, el pane de fábrica del par de compatibilidad y la traza del contrato |
| `brand/` | ídem | ver abajo |
| `signalling/` | ídem | (decisión 3) |
| `content/` | ídem | el material empaquetado de esta demo. Generado, gitignored |
| `scripts/preparar-contenido.sh`, `empaquetar-contenido.sh`, `senalizar-contenido.sh` | `demo/compatibility-pair/scripts/` | bajan, empaquetan y señalizan el material de esta demo |
| `CREDITS.md` | ídem | la atribución CC BY que exige el material de esta demo |

Los tres archivos que no son obvios, cada uno con su argumento:

**`vendor/hls.min.js` queda en la raíz.** La lectura que lo bajaría a la demo es
buena: la librería nunca recibe el constructor de hls.js, lee `window.Hls`, así
que proveerlo es tarea del integrador y acá el integrador es la página. La que
gana es la otra: 1.7.2 no es un asset de la página, es **la versión contra la que
la sdk está leída y medida** (ADR 0002), y una segunda demo tiene que usar la
misma o la garantía de la sdk no vale. El desempate es preguntar quién queda mal
si está en el lugar equivocado: con una copia por demo, el día que la sdk suba de
versión cada demo queda con una copia vieja y nada lo dice. Al revés no hay
problema simétrico, porque una demo que necesite otra versión puede vendorearla
al lado de su propia página.

**`brand/` baja a la demo.** `docs/integrating-the-library.md` §7 se titula "The
brand is yours, because this library ships none": la librería no envía marca, la
recibe. La marca es de la página. Esto arrastra una consecuencia que está más
abajo, porque `lib/controls.js` cita hoy `brand/README.md`.

**`css/player.css` baja a la demo** y no es dudoso una vez que se mira el código:
`lib/controls.js` lleva su propio CSS adentro (las reglas `.qa-*` y las variables
`--qa-*`), así que la hoja de la raíz es solamente la página. Lo único que la ata
a la sdk es que aparece en la lista de archivos del grep del ADR 0003, y eso se
resuelve abajo.

`demo/` es para demos web de esta sdk. iOS no entra ahí: el ADR 0015 ya dice que
la plataforma nativa hereda la línea y no el código.

## Decisión 2: la demo que existe se llama `compatibility-pair`

La demo es una página con dos players al lado, los dos sobre la misma URL, uno de
ellos hls.js en configuración de fábrica. El proyecto ya la nombra así en los dos
lugares donde tuvo que explicarla: el README dice "The page is two players, not
one, and that is the demo's strongest argument (ADR 0007)", y el primer bloque de
comentario de `index.html` abre con "THE COMPATIBILITY PAIR (ADR 0007), which is
the strongest argument this demo can make". El nombre ya está en uso; lo que falta
es que sea el nombre de la carpeta.

Y separa bien de las demos que vienen. El par de compatibilidad es una elección
deliberada y cara (dos instancias de hls.js sobre el mismo manifiesto, una de
ellas sin tocar) y ninguna otra demo la hereda por defecto: una que recorra los
layouts con un player solo, o una del repliegue, no es un par.

Descartados: `hls-interest-day`, que nombra la ocasión y no la demo, y choca el
día que haya una segunda demo para el mismo evento; `five-layouts`, que nombra el
contenido de la corrida, que es justo lo que más cambia (la fase 03 ya le agregó
un break mezclado con cuatro avisos); y `web-hlsjs`, que nombra la plataforma,
que es lo que distingue a este repositorio entero y no a una demo de adentro.

Va en inglés porque los artefactos que miran hacia afuera de este repositorio
están en inglés: el README, la página, los dos documentos de `docs/`.

## Decisión 3: un `signalling/` por demo, y qué pasa si dos necesitan el mismo

Los trece asset-lists bajan enteros a `demo/compatibility-pair/signalling/`. Es
lo que pidió Nicolás y el argumento se sostiene solo: no son formas, son formas
**con las URIs de esta demo puestas**, que es como el README ya los describe ("as
the SVTA Layout Controller emits them, with the URIs filled in").

Eso contesta la pregunta que sigue, que es la que importa. **Dos demos sobre
material distinto no pueden compartir un asset-list**, porque cada lista apunta a
los segmentos de su propio contenido. Así que el caso de la lista repetida es más
angosto de lo que parece: aparece sólo entre dos demos sobre el **mismo**
contenido, y dos demos sobre el mismo contenido son una demo con dos corridas,
que es lo que `senalizar-contenido.sh <segundo> <layout>` ya hace hoy con un
argumento. El criterio, entonces: si dos carpetas de `demo/` necesitaran el
archivo idéntico, eso no pide una carpeta compartida, pide que sean una sola demo
con dos corridas.

Descartado: un `demo/signalling/` compartido al lado de los por-demo. Cuesta una
pregunta nueva en cada asset-list que se agregue ("¿este es de todos o de uno?"),
y esa pregunta se paga siempre, mientras que la copia se paga en un caso que la
propia forma del dato vuelve improbable.

Los cuatro `asset-list-repliegue-*.json` están rotos a propósito y son también
corridas servibles de esta demo: así los ejercitó la T-02 de la fase 03, con el
player corriendo. Se quedan en la demo, y `test/` tiene su propia copia por la
decisión 5. Cuatro archivos existen dos veces y está dicho.

## Decisión 4: el servidor sirve la demo como raíz de documentos

Esta es la decisión que hace que toda la mudanza cueste poco, y sale del dato
medido: las URIs de los asset-lists son absolutas desde la raíz del servidor.

Si el servidor sigue sirviendo la raíz del repositorio, la demo pasa a vivir en
`/demo/compatibility-pair/` y hay que reescribir las URIs de los trece
asset-lists y el `X-ASSET-LIST` del script de señalización, con el nombre de la
carpeta metido adentro de cada JSON. Renombrar la demo se convierte entonces en
una edición de trece archivos.

Así que **el servidor recibe su raíz de documentos como argumento**
(`node server.mjs demo/compatibility-pair`) y monta dos rutas fijas contra la raíz
del repositorio, `/dist/` y `/vendor/`, que es lo que la página necesita de la
sdk. Son unas ocho líneas en un archivo de cuarenta que existe para una sola cosa
(el `Content-Type` de un `.m3u8`), y a cambio los trece asset-lists, el script de
señalización y todas las rutas relativas de la página quedan **byte por byte
iguales**. Los tres scripts de contenido hacen `cd "$(dirname "$0")/.."`, así que
mudados a `demo/compatibility-pair/scripts/` apuntan solos al lugar correcto y
tampoco se tocan.

Lo único que cambia en `index.html` son dos `src`, `./dist/` y `./vendor/`, que
pasan a ser absolutos para que los resuelvan los montajes.

Descartado: reescribir las URIs con el prefijo de la demo. Cuesta trece archivos,
ata el nombre de la carpeta al contenido de cada JSON, y va contra el ADR 0004,
que manda consumir el asset-list tal como la herramienta lo emite, y la
herramienta emite una ruta absoluta desde la raíz del sitio. Descartado también:
symlinks de `dist/` y `vendor/` adentro de la demo, porque el propio
`server.mjs` tiene una guarda de traversal que compara el prefijo de la ruta
resuelta y los rechazaría.

Efecto lateral: la URL de la demo sigue siendo `http://localhost:8080/`. No es un
driver de esta decisión, porque Nicolás ya dijo que el cambio de URLs no importa,
pero conviene anotarlo para que nadie lo busque.

`run.sh` queda en la raíz y toma la demo como argumento, con la única que existe
como default (`DEMO="${1:-compatibility-pair}"`). Sigue haciendo lo mismo en el
mismo orden: el contenido de la demo si falta, la señalización de la demo, la
construcción de la sdk, el servidor. Descartado: un `run.sh` por demo, que
repetiría en cada una las dos líneas de la sdk y volvería a "construir la
librería antes de servir" una cosa que cada demo tiene que acordarse de hacer,
que es exactamente el olvido que el ADR 0015 evitó construyendo en cada arranque.

## Decisión 5: `test/` sólo lee `test/` y `lib/`

La regla es una línea y no tiene excepciones, porque una autosuficiencia "casi
completa" es la forma que se despega.

**Lo que se copia a `test/fixtures/`**, y de ahí en adelante es del test:

- `test/fixtures/mediciones/`: los cinco JSON de `.project/`, **con sus nombres
  originales**, porque el nombre es la procedencia (`m3-resultados.json`,
  `t02-los-rangos-del-programa.json`, `t04-la-medicion.json`,
  `t05-la-medicion.json`, `t05-el-recorrido-con-el-break-mezclado.json`). Unos
  225 KB.
- `test/fixtures/asset-lists/`: los trece, completos. Se copian los trece y no un
  subconjunto porque el conjunto que los tests leen **se computa** (una función
  toma el nombre por parámetro y otra lo saca de la tabla de la corrida), así que
  cualquier subconjunto es una adivinanza. Son unos 15 KB en total: filtrar
  cuesta más que copiar.
- `test/fixtures/run.json`: las cinco tandas de la corrida que midieron la T-02,
  la T-04 y la T-05, declaradas explícitamente (segundo y asset-list). Reemplaza
  el parseo del script de señalización.
- `test/fixtures/README.md`: de dónde vino cada archivo, que ahora es del test, y
  que **no hay chequeo contra el original, por decisión**. Está escrito ahí para
  que nadie agregue uno más adelante creyendo que falta.

**Lo que se muda a la demo es un test y medio de los cuarenta y tres.** El
archivo `program-ranges-and-volume.test.js` es hoy dos cosas: diez tests de
funciones puras de la sdk, uno enteramente sobre `senalizar-contenido.sh`, que es
un script de la demo, y uno partido, con dos afirmaciones sobre el script y dos
sobre `kindOfClass`. Lo que habla del script baja a
`demo/compatibility-pair/test/`, y lo que afirma ahí lo afirma **sobre los
archivos de la demo y no contra el fixture**: que la tabla de la corrida tiene
cinco filas, que el `PLANNED-DURATION` se computa y no se tipea, que el script
escribe las dos `CLASS`, y que cada fila nombra un asset-list que existe en el
`signalling/` de la demo. No es una comparación entre las dos copias: es el
chequeo de la corrida viva, hecho con lo que la demo tiene adentro.

Ese chequeo vale la pena por evidencia propia: el `PLANNED-DURATION` escrito a
mano declaraba doce segundos de un break de cuarenta y ocho, y lo encontró la
fase 03. Del test partido, la mitad que prueba `kindOfClass` se queda en `test/`.

`npm test` no cambia. `node --test` sin argumentos descubre recursivamente, y
está verificado en esta máquina (node v25.9.0): una suite en `test/` y otra en
`demo/x/test/` corren las dos con un solo comando.

**El costo, y se acepta explícito.** El fixture congelado deja de describir la
corrida que la demo sirve el día que la corrida cambie, y nada lo va a decir.
Eso es exactamente la decisión que Nicolás ya tomó, y tiene su compensación: lo
que vigila la corrida viva es el test de la demo, que ahora existe. Las medidas
de `test/fixtures/mediciones/` son lecturas fechadas de una corrida, así que
congelarlas junto con la corrida que describen es lo correcto: una medición
separada de su corrida no significa nada.

Los comentarios de cabecera de los tres tests nombran hoy las tasks de donde
salieron los datos. Se quedan, con la ruta reescrita para que digan de dónde vino
la copia. Eso es procedencia y es lo que la política de documentación llama
registro.

Descartado: que `test/` lea `demo/compatibility-pair/`. Es el cambio más chico
(una ruta más larga y nada más) y se descarta por el punto 3 de Nicolás: va a
haber más de una demo, y una suite de la sdk clavada a la primera obliga a
decidir, el día que llegue la segunda, si también lee de ahí. Esa es una decisión
que sale en el medio, que es lo que este diseño existe para evitar. Descartado
también: copiar el script de señalización a `test/fixtures/`, que dejaría las dos
afirmaciones sobre el script hablando de una copia congelada, o sea vacías.

## Decisión 6: el manifiesto declara la sdk

Lo más fuerte que dice hoy el `package.json` es su `name`:
`hls-non-linear-ads-demo`. Eso cambia a **`qualabs-concurrent-hls`**, que es el
nombre del archivo construido y del global que define. La `description` no se
toca: ya describe la librería y no la demo.

- **`main` y `exports`: `./lib/concurrent-hls.js`.** Es el punto de entrada de las
  fuentes y la superficie pública real. Descartado apuntarlos a
  `./dist/qualabs-concurrent-hls.js`: `dist/` está gitignoreado y se construye en
  cada arranque, así que un campo del manifiesto que apunta ahí es una afirmación
  falsa en todo clone nuevo.
- **`files`: `["lib/", "dist/", "docs/"]`.** Este es el campo que hace lo que
  Nicolás pidió, porque es literalmente una lista de "qué es el producto", y lo
  dice sobre todo por lo que **no** está: `demo/`, `test/`, `scripts/`,
  `vendor/`, `server.mjs`, `run.sh`. `dist/` sí está, porque es la forma en que el
  ADR 0015 distribuye la librería y es lo que un paquete llevaría.
- **`private: true` se queda, y `version` queda en `0.0.0`.** El ADR 0015 dice
  que la superficie pública no está congelada, así que el manifiesto declara qué
  **es** la sdk sin afirmar que está publicada. Los campos son la declaración; se
  vuelven operativos el día que la superficie se cierre. Descartado inventar un
  `0.1.0`, que sería un número que no significa nada y que después hay que
  mantener.
- **`scripts` queda con los verbos de la sdk**: `start` (`./run.sh`), `build`
  (`./scripts/construir-libreria.sh`), `check` (`./scripts/verificar-cortes.mjs`)
  y `test` (`node --test`). `build` y `check` no existían y son los dos verbos de
  la sdk que hoy sólo viven adentro de `run.sh` y del README. **`serve` y
  `content` salen**, porque nombran rutas de una demo: van al README de la demo,
  con su ruta completa, que es donde nombrarlas no es una copia de nada. Efecto
  útil de segundo orden: el nombre de la demo por default queda en un solo lugar
  del repositorio, el `run.sh`.

Nada de esto dice que la sdk se consuma como módulo de npm: cómo se obtiene el
archivo lo sigue diciendo `docs/integrating-the-library.md` §8, que es su dueño.

## Decisión 7: el README de la raíz enruta, y cada demo cuenta su corrida

El README de hoy tiene 347 líneas y nueve secciones, y es de las dos cosas a la
vez. Se reparte por una regla: **cada párrafo va donde vive su tema, y el otro
README recibe un puntero, nunca un resumen.** Y una segunda que evita que la raíz
vuelva a crecer: **el README de la raíz no describe la corrida.** La corrida es
una propiedad de una demo.

| sección de hoy | va a | por qué |
| --- | --- | --- |
| encabezado (qué es esto) | los dos, reescrito en cada uno | la raíz dice qué es la sdk; la demo dice qué muestra esta demo. No es el mismo párrafo dos veces, son dos temas |
| Run it | demo | es el comando de esta demo. La raíz queda con el `./run.sh <demo>` en la sección de demos |
| Before you record | demo | entero. Es sobre esta corrida: los cinco breaks, el audio, la inversión del tramo del break 5 |
| la tabla de los cinco breaks | demo | es la corrida |
| Test it | los dos, partido | la raíz: `npm test` y `npm run check`, qué cubren y qué no. La demo: su propio test de la corrida |
| What is where | los dos, partido | cada uno lista su propio árbol. La raíz no lista `demo/` archivo por archivo, lista las demos |
| The compatibility pair | demo | es el argumento de esta página, no de la sdk. La sdk no sabe lo que es un par |
| The two layers | raíz | es la sdk, y es sobre todo un puntero a `docs/contrato-senalizacion-renderizado.md` |
| The library, and the page that uses it | raíz | es la línea del ADR 0015, que es de qué es este repositorio |
| Four things... 1 (maquinaria de interstitials apagada) | raíz, como puntero | es un requisito de la sdk y ya está escrito completo en `docs/integrating-the-library.md` §2.1 |
| Four things... 2 (`EXT-X-PROGRAM-DATE-TIME`) | demo | es una propiedad del contenido empaquetado de esta demo |
| Four things... 3 (un layout inserta una imagen) | demo | es una nota sobre lo que muestra el break 3 |
| Four things... 4 (los dos defaults que la herramienta omite) | raíz, como puntero | es comportamiento de la capa de señalización y ya está en el contrato y en los ADR 0004 y 0014 |

La raíz gana una sección nueva, `demo/`, que es un índice: una línea por demo con
qué argumenta y un link a su README, más el comando para levantar una. La línea
de `compatibility-pair` dice de qué es el par y apunta al ADR 0007. Esa línea es
el índice haciendo su trabajo, no un párrafo duplicado.

Los dos punteros de la tabla merecen una nota, porque son la tercera duplicación
del README y la menos visible: los puntos 1 y 4 de "Four things" están hoy
escritos completos en el README **y** en `docs/`. La regla C de la política de
documentación dice que un dato del que otro artefacto es dueño no se copia, se
apunta. Así que el trabajo del README de la raíz es enrutar: qué es la sdk en
pocas líneas, y dónde está escrita cada cosa.

## Decisión 8: una cita a `.project/` no es un acoplamiento; una lectura sí

`docs/contrato-senalizacion-renderizado.md` dice, sobre los dos defaults que la
herramienta de SVTA omite: "Los midió la T-03 sobre los seis payloads que emite
la herramienta de SVTA, y están resueltos en
`.project/phases/01-poc-web-hlsjs/tasks/T-06/t06-los-seis-payloads-resueltos.json`".

**La cita se queda**, y la diferencia con los tests es concreta y no una
distinción de vocabulario: un test que **lee** `.project/` se rompe si el registro
se reorganiza, y un documento que lo **cita** no se rompe con nada. El argumento
que Nicolás dio para los tests es que `.project` es la gestión del desarrollo y no
algo de lo que dependa el código; una nota al pie que dice dónde se hizo una
medición no es código que dependa del registro, es documentación apuntando al
registro, que es para lo que el registro existe. La política de documentación pide
justamente eso: apuntar a la fuente en lugar de copiar el dato.

Lo único que se agrega es una cláusula que diga que ese archivo es la evidencia de
una fase cerrada, para que quien siga el puntero sepa que va a un registro y no a
un archivo vivo. Una cláusula, no una reescritura.

Descartado: repuntarla a `test/fixtures/`. Ese JSON **no** es uno de los cinco que
los tests leen, así que repuntarla obligaría a copiar a `test/fixtures/` un
archivo que ningún test usa, o sea inventar un fixture para satisfacer una cita.
Y la cita no quiere decir dónde hay una copia, quiere decir dónde se hizo la
medición.

## Tres consecuencias que la mudanza obliga y no son decisiones nuevas

**`lib/controls.js` deja de citar `brand/README.md`.** El comentario que explica
por qué el amarillo y el violeta no son colores de marca ofrece como evidencia la
lista del kit de Qualabs y cita el archivo. Con `brand/` adentro de
`demo/compatibility-pair/`, esa cita contendría el literal `demo`, que es uno de
los términos que grepea el chequeo del ADR 0015 con lista de aceptados vacía: la
costura se pondría roja, y con razón, porque sería la librería nombrando a la
demo. **Se saca la ruta y se queda la frase.** El argumento del comentario es que
esos dos colores son funcionales, y para un argumento el chequeo es un lector,
no un grep; la política de documentación lo dice explícito cuando acota la regla C
a datos que una herramienta puede comparar. Vale la pena anotar que este
acoplamiento era invisible hasta hoy y lo va a encontrar un chequeo que ya
existe.

**El grep del ADR 0003 en `verificar-cortes.mjs` actualiza dos rutas.** Su lista
de archivos del lado del renderizado incluye `js/contract-trace.js` y
`css/player.css`, que se mudan; pasan a nombrarse bajo
`demo/compatibility-pair/`. Se actualizan y no se sacan: esa lista es por archivo
y a propósito (lo dice el comentario del script), y esos dos archivos ganan su
lugar porque son la prueba de que el contrato alcanza para dibujar, que es el
argumento del ADR 0003. Lo que **no** puede depender de una demo es la
verificación de completitud del script, que exige que todo `lib/*.js` esté de un
lado o del otro de la costura, y ésa ya es sólo sobre `lib/` y queda igual.
Descartado sacar los dos archivos de la lista: ahorraría el acoplamiento y
perdería la prueba, y el chequeo del ADR 0015 (`files: ['lib/*.js',
'scripts/construir-libreria.sh']`) no necesita ni un cambio, porque ya grepea el
término `demo`.

**El `.gitignore` no se toca.** Sus dos patrones relevantes, `content/` y
`dist/`, no llevan barra inicial, así que matchean a cualquier profundidad. Está
verificado con `git check-ignore`: `demo/compatibility-pair/content/foo.ts` da
`.gitignore:4:content/`.

Y un detalle de ejecución que cuesta media hora y 535 MB si se pasa por alto:
`content/.fuentes/` es el cache de las descargas y se muda con el resto de
`content/`, así que nada se vuelve a bajar. Lo tracked se mueve con `git mv` para
que la historia siga al archivo.

## Riesgos

**R1. La demo deja de levantar y nadie se entera hasta la grabación.** La mudanza
toca todas las rutas que la página carga. Mitigación, y la corre quien ejecuta:
`./run.sh` levanta la corrida y se mira un cuadro por break, los cinco, más
`npm test` y `npm run check` en verde. No hace falta un instrumento nuevo ni
esperar a nadie, porque lo que una ruta rota produce es una pantalla que no
carga. La ventana de grabación es del 28 al 30 de septiembre, con margen.

**R2. Una ruta se arregla en un lugar y se pasa en otro que sólo falla en
runtime**, típicamente una URI de asset-list o un `src` de `index.html`.
Mitigación: la decisión 4 es la que baja el riesgo de verdad, porque deja la
cuenta de archivos con rutas por editar en dos `src` de `index.html` y nada más;
las trece URIs, el script de señalización y los tres scripts de contenido quedan
sin tocar.

**R3. El fixture congelado de `test/` deja de describir la corrida que la demo
sirve.** Aceptado explícito: es la decisión de Nicolás, y la corrida viva queda
vigilada por el test de la demo que la decisión 5 crea.

**R4 (residual, aceptado).** Cuatro asset-lists de repliegue van a existir dos
veces, en la demo y en `test/fixtures/`. Se acepta sin chequeo, por la misma
decisión que gobierna el resto de los fixtures.

## Lo que se consideró y se descartó

| alternativa | por qué no |
| --- | --- |
| `vendor/hls.min.js` adentro de cada demo | la versión de hls.js es una propiedad de la sdk (ADR 0002); una copia por demo se queda vieja sin que nada lo diga |
| un `demo/signalling/` compartido | cuesta una pregunta nueva por cada asset-list que se agregue, y el caso que resolvería es improbable porque una lista lleva las URIs de su propio contenido |
| reescribir las URIs de los trece asset-lists con el prefijo de la demo | trece archivos, el nombre de la carpeta metido en cada JSON, y va contra el ADR 0004 |
| symlinks de `dist/` y `vendor/` adentro de la demo | la guarda de traversal de `server.mjs` los rechaza |
| un `run.sh` por demo | repite las dos líneas de la sdk en cada demo y devuelve "construir antes de servir" a la memoria de alguien |
| que `test/` lea `demo/compatibility-pair/` | clava la suite de la sdk a la primera demo y deja la decisión servida para el medio de la ejecución, el día que haya una segunda |
| copiar `senalizar-contenido.sh` a `test/fixtures/` | las dos afirmaciones sobre el script quedarían hablando de una copia congelada, o sea vacías |
| `main`/`exports` apuntando a `dist/` | `dist/` está gitignoreado: el campo sería falso en todo clone nuevo |
| sacar `private: true` y versionar | nadie decidió publicar, y el ADR 0015 dice que la superficie no está congelada |
| sacar `js/contract-trace.js` y `css/player.css` del grep del ADR 0003 | ahorra el acoplamiento y pierde la prueba de que el contrato alcanza para dibujar |
| repuntar la cita de `docs/` a `test/fixtures/` | ese JSON no lo lee ningún test: habría que inventar un fixture para satisfacer una cita |
| partir `docs/` en subcarpetas por audiencia | los dos documentos tienen el mismo lector, quien construye con la sdk, así que la regla que pide una subcarpeta por audiencia ya está contestada con una sola |
