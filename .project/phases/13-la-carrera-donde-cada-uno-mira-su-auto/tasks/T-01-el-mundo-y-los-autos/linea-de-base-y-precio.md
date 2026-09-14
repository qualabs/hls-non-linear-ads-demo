# La línea de base de la fase, y el precio del día

Las dos mediciones que la T-01 toma **antes de que exista la primera generación**, porque
las dos deciden cosas que el resto de la fase no puede revisar: contra qué se compara una
regresión, y contra qué número se cuenta el gasto.

## 1. La línea de base de los tres comandos

Medida el **2026-09-12** sobre el árbol de trabajo tal como estaba al abrir la task:
commit **`e2f7f3f`**, sin cambios sin commitear (`git status --porcelain` sólo muestra
como no rastreada la carpeta de esta fase).

| chequeo | comando | resultado | salida |
| --- | --- | --- | ---: |
| la suite | `npm test` | **184 pruebas, 184 pasan, 0 fallan** | `0` |
| las dos costuras | `npm run check` | **verde**: la primera reporta 3 ocurrencias, las tres en la lista aceptada; la segunda, cero hits | `0` |
| la campaña de mutaciones | `npm run mutaciones` | **las 20 roturas dan rojo y los 9 chequeos dan verde sin romper nada** | `0` |

Evidencia verbatim de las tres, en [`salidas/`](salidas/).

### Y los tres se vieron en rojo, porque un verde solo no dice nada

Una tabla de tres verdes no prueba que los tres midan algo. Los tres se rompieron a
propósito y los tres se pusieron rojos, sobre una **copia del árbol en `/dev/shm`**: el
repositorio no se tocó, y eso se ve en que `git status` sigue mostrando sólo la carpeta de
esta fase como no rastreada.

| chequeo | qué se rompió en la copia | qué dijo |
| --- | --- | --- |
| `npm run check` | el comentario de `lib/renderer.js:401` vuelve a nombrar el transporte | `RED: 1 occurrence(s) that are not on the accepted list`, salida `1` |
| `npm test` | `MAX_BOXES` pasa de `Math.max` a `Math.min` en `lib/signalling.js:197` | **151 pasan, 33 fallan**, salida `1` |
| `npm run mutaciones` | no hace falta romperlo: **la campaña se rompe sola**, y su propia salida dice *"las 20 roturas dieron rojo y los 9 chequeos dan verde sin romper nada"* | — |

Verbatim en [`salidas/control-los-chequeos-en-rojo.txt`](salidas/control-los-chequeos-en-rojo.txt).

**El número de la suite coincide con el que `PHASE.md` anotó** —184— y eso confirma que
entre el `1767254` de aquella medición y el árbol de hoy no se agregó ni se sacó ninguna
prueba.

### La advertencia de `PHASE.md` sobre la costura ya no aplica, y hay que decirlo

`PHASE.md` avisa que la primera costura estaba verde **por un cambio sin commitear** en el
comentario de `lib/renderer.js`, y que quien hiciera `checkout` de `1767254` limpio iba a
verla roja y a creer que la había roto esta fase.

**Ese cambio ya está commiteado**: es `e2f7f3f`, *"La costura vuelve a verde: el comentario
nombraba el asset-list"*, y su diff contra `1767254` es una sola línea de `lib/renderer.js`.
La línea de base de hoy sale de un árbol limpio, así que el aviso de `PHASE.md` describe
una situación que ya no existe y la T-10 no tiene que arrastrarlo.

### Contra qué se compara cada task

Contra el conteo con el que **esa task** arrancó, no contra esta tabla. Acá quedan los
números del día en que se abrió la fase, que es lo único que esta tabla afirma.

## 2. El precio vivo de Veo, releído el día que se empieza a gastar

**Leído el 2026-09-12** de la página de precios de Vertex
(<https://cloud.google.com/vertex-ai/generative-ai/pricing>), sección Veo. Lo que dice esa
página, textual, para el modelo de esta fase:

| modelo | feature | output | resolución | precio |
| --- | --- | --- | --- | ---: |
| Veo 3.1 Fast | Video + Audio generation | Video + Audio | **720p** | **`$0.10 / 1 count`** |
| Veo 3.1 Fast | Video + Audio generation | Video + Audio | 1080p | `$0.12 / 1 count` |
| Veo 3.1 Fast | **Video generation** | Video | **720p** | **`$0.08 / 1 count`** |
| Veo 3.1 Fast | Video generation | Video | 1080p | `$0.10 / 1 count` |

**La unidad `1 count` es un segundo de video generado**, confirmado contra la otra página
de precios del mismo modelo (<https://ai.google.dev/gemini-api/docs/pricing>), que publica
las mismas cifras diciendo *"per second"*: Veo 3.1 Fast `$0.10` a 720p, `$0.12` a 1080p,
`$0.30` a 4K.

### El número que gobierna la fase no cambió

**US$0,10 por segundo, o sea US$0,80 por cada clip de 8 s.** Es exactamente el número con
el que están calculados los tres techos, así que **los tres techos quedan como están**:

| etapa | techo en generaciones | × US$0,80 | techo en US$ |
| --- | ---: | ---: | ---: |
| 1. El programa | 28 | | **22,40** |
| 2. Una cámara | 16 | | **12,80** |
| 3. Las cinco restantes | 72 | | **57,60** |
| la fase entera | 116 | | **92,80** |

### Y el comentario viejo de los scripts no estaba viejo: era otro precio

`DESIGN.md` dice que las cabeceras de `generar-parada.sh` y `generar-la-l.sh` dicen
US$0,08/s y que *"el comentario quedó viejo"*, y que *"no se encontró ninguna distinción
vigente entre con y sin audio"*. **Las dos mitades son falsas, medido hoy:**

- La página **sí distingue** con audio de sin audio: 720p son `$0.10` con audio y `$0.08`
  sin audio, y la distinción existe también en 1080p y en 4K y en los otros tres modelos
  de la familia.
- El comentario de `generar-parada.sh` **ya decía cuál de los dos estaba citando**:
  *"Fast a 720p **sin audio** son US$ 0,08/s"*. No quedó viejo; citaba la otra fila.

**Esto no mueve el gasto de esta fase, y conviene decir por qué antes de que alguien
proponga ahorrar el 20 %.** Las siete piezas de esta demo se generan **con** audio a
propósito: el ambiente que Veo trae —motores, gomas, el doppler del auto que pasa— es lo
que `DESIGN.md` §6 llama *"el ambiente sale gratis"*, y el audio de las seis cámaras es el
beat de la demo, porque agrandar una cámara de a bordo calla la transmisión y te deja
adentro de ese auto. Bajar a la fila de US$0,08 ahorraría unos US$9,92 sobre las 62
generaciones del corte final y se llevaría puesta la razón por la que esta demo tiene
sonido.

### Lo que sigue sin ser una factura

El único gasto registrado del proyecto —US$5,44 por 7 generaciones, 2026-09-10— es un
cálculo contra la tabla publicada y no una lectura de factura, y esta task no cambió eso:
**no hay ninguna factura en el repositorio y esta medición tampoco lo es.** Lo que está
verificado es el precio publicado el día de hoy, no lo que Google terminó cobrando.
