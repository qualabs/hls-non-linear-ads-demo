# T-04 — tests: la secuencia del break y el asset sin bloque

Dieciséis tests nuevos en `test/break-sequence-and-fallback.test.js`, sobre las
funciones puras de `lib/signalling.js`. La suite pasa de **27 a 43** tests, 43
pasan y 0 fallan. Ningún test que ya existía cambió, y ninguno se puso en rojo
por los nuevos.

Los quince cortes de la campaña de mutación están en `t04-mutaciones.json` —qué
se rompió, qué tests se pusieron en rojo y con qué mensaje— y el arnés que la
corre, en `t04mutar.py`. Se puede volver a correr desde cualquier directorio:
aplica la rotura, corre la suite entera, restaura con `git checkout --` y
verifica que el árbol quedó limpio antes de pasar a la siguiente.

## Qué se cubre, y por qué esto y no otra cosa

Lo que esta fase agregó y **no se ve en la pantalla**, que son dos cosas y las
dos son funciones puras.

**La aritmética de la secuencia.** Dónde cae cada aviso de un break en la línea
de tiempo del programa, que sale de la `DURATION` de nivel superior de cada
asset acumulada, y cuál aviso es cuál, que es el `itemId`. Un desplazamiento
corrido por un asset pone a todos los que siguen en el segundo equivocado, y la
grabación de eso se ve igual que la grabación de lo correcto.

**La decisión del asset sin bloque.** Cuándo un asset cae al repliegue y cuándo
no, que es la frontera que dibujó la T-02: tres formas detectadas, dos que
deliberadamente no, y un `uri` vacío que no es una falla. Los dos lados de esa
frontera fallan en silencio — un repliegue que no se dispara deja un hueco en el
break, y uno que se dispara de más reemplaza un layout señalizado por un aviso a
cuadro entero.

**Lo que queda afuera, y no por olvido.** No hay tests de DOM ni de navegador, y
es la misma restricción de las tres fases anteriores. La otra mitad —que el
nodo del segundo creativo esté en la capa, que el primario siga corriendo detrás
del aviso a cuadro entero, que el parámetro viaje en el GET— son lecturas del
estado con el recorrido corriendo, y son el done ya cumplido de la T-01, la T-02
y la T-03. Un navegador levantado acá no agregaría una afirmación que esas
lecturas no hayan hecho ya.

**El segundo escalón del Apéndice D.5 se cubre por sus dos puntas y no por el
medio**, porque el medio no es una función pura: la cancelación del break vive
en el `catch` de `createSignalling`, donde está el `fetch`, y este archivo no
va a la red. Lo que se afirma es la entrada —el fixture que el recorrido sirve
para ese caso no es JSON, así que la respuesta nunca llega a ser una lista— y la
salida —un break que no resolvió nada no es ningún rango, o sea que no aparece
en la barra—. La distinción con el salteo de un asset, que en pantalla se parece
y que es de lo que se trata el escalón, queda afirmada entera: ahí el break
conserva su rango con un aviso menos.

## Los datos son los reales

Los asset-list son los de `signalling/` que la demo sirve —los cinco del
recorrido, los tres que agregó la fase y los cuatro fixtures rotos a propósito—
y los números esperados son los que la T-01 y la T-02 leyeron del contrato con
el reproductor corriendo: los arranques en 20, 32 y 44 del break de tres, los
cuatro del mezclado, el rango de 36 s y el de 48 s, las ventanas 20 → 38 y
32 → 44 del solapado. Los seis payloads de la herramienta de SVTA son los que
están verbatim en la evidencia de la T-03 de la fase 01. Los cinco casos
inventados dicen que lo son en el lugar donde están.

## Los tests nuevos, con la mutación que los puso en rojo

Cada uno se vio fallar por lo menos una vez. La columna del medio es la rotura
que lo puso en rojo, y el mensaje es el que `node --test` imprimió en esa
corrida. Cuando un test aparece en más de una rotura se cita la que apunta a la
regla que ese test cubre.

### La aritmética de la secuencia

| test | mutación | el rojo |
| --- | --- | --- |
| los fixtures de la fase son los breaks sobre los que se tomaron las lecturas | **M01** — el segundo aviso de `asset-list-multiAd.json` pasa de `cornerOverlay` a `lowerThirdOverlay`, o sea el break de tres deja de tener dos avisos que comparten layout | `the first two ads of the break of three share the layout, which is the case of the identity` — `+ 'lowerThirdOverlay' / - 'cornerOverlay'` |
| un break de un asset abre en el `START-DATE`, que es cada break de la grabación | **M02** — `let assetStart = 0` pasa a `1`: el acumulador arranca corrido | `cornerOverlay: 21 !== 20` |
| cada asset arranca donde terminó el anterior, sobre los breaks de tres, cuatro y dos | **M03** — el desplazamiento se acumula desde la **ventana** del aviso anterior y no desde la `DURATION` declarada | `+ 38 / - 32`, sobre `asset-list-solapado.json` |
| el `start` de un item es un desplazamiento adentro de su propio asset y no desde el `START-DATE` | **M04** — `startTime: slotStart + assetStart + start` pierde el `assetStart` | `+ 23 / - 35`: los dos items quedan en 23 |
| dos avisos de un break son dos identidades aunque compartan el layout | **M05** — el `itemId` vuelve a ser el `id` del Date Range | `+ 'AD-1-CONCURRENT' ×3 / - 'AD-1-CONCURRENT.0', '.1', '.2'` |
| el ordinal de un aviso es el del break entero, así que dos items de un asset son dos avisos | **M06** — el ordinal pasa a ser el índice del array `ASSETS` | `+ 'AD-1-CONCURRENT.0' / - 'AD-1-CONCURRENT.2'`: los dos items del primer asset colapsan en una identidad |
| un break de varios avisos es un rango, del primero en arrancar al último en terminar | **M14** — el largo del rango pasa a ser la **suma** de las ventanas y no su unión | `+ duration: 30 / - duration: 24`, sobre el solapado |

### El asset sin bloque y el repliegue

| test | mutación | el rojo |
| --- | --- | --- |
| un `ASSET` con `URI` y `DURATION` y nada más es un aviso a cuadro entero | **M07** — el `primaryContent` del item sintetizado pasa de `volume: 0` a `100`: la mezcla del aviso a cuadro entero deja de invertirse | `100 !== 0` |
| en el break mezclado el aviso a cuadro entero silencia al programa y los concurrentes no | **M07**, la misma | `+ [100, 100, 100, 100] / - [100, 100, 0, 100]` |
| las tres formas que este cliente no puede dibujar son las tres que no pueden volverse una caja | **M08** — el chequeo de la ventana pasa de `Number(item.duration) > 0` a `item.duration === undefined`: un `duration` de 0, negativo o no numérico pasa por usable | `a duration of null` — devuelve el payload en lugar de `null` |
| ídem | **M09** — se cae el chequeo del layout sin assets adentro | devuelve el payload con `layout: { assets: [] }` en lugar de `null` |
| un bloque que este cliente no puede dibujar reproduce el `URI` del asset, y los de al lado no se mueven | **M07** | `100 !== 0` en el primario del asset que replegó |
| un `uri` vacío y un `mediaType` que nadie conoce no son fallas del bloque | **M10** — se agrega `if (assets.some((a) => !a.uri)) return null;`, que es **exactamente el error que la T-02 cometió y la suite atrapó** | `cornerOverlay keeps the layout the tool declared` — `+ 'linear' / - 'cornerOverlay'`, y con él **nueve tests de los otros dos archivos** |
| ninguno de los asset-list que sirve la demo repliega, y los dos avisos lineales son declarados | **M15** — se exige un bloque `primaryContent` en el layout, que es el campo que la herramienta omite en los dos overlays | `cornerOverlay: linear ads — 1 !== 0`, y con él dieciséis tests de la suite |
| un asset que no se puede reproducir se saltea solo, y los avisos que siguen conservan sus ventanas | **M11** — el salteo de un asset vacía el break entero, o sea se confunde con la cancelación del Apéndice D.5 | `0 !== 2` |
| el asset-list que no se puede leer cancela el break entero, que no es saltear un asset | **M12** — al fixture `asset-list-repliegue-json-roto.json` se le saca la coma sobrante y pasa a ser JSON válido | `Missing expected exception (SyntaxError).` |
| una lista que no declara `ASSETS` no reproduce nada y no reporta rango | **M13** — el chequeo pasa de `!Array.isArray(assets) \|\| assets.length === 0` a sólo `!Array.isArray(assets)`: un `ASSETS: []` se resuelve callado | `0 !== 1` advertencias |

## Las dos mutaciones que dicen más que el test que las atrapó

**M10 pone en rojo diez tests, y nueve son de los archivos que ya estaban.** Es
el error de diseño que la T-02 cometió en su primera versión del chequeo,
reproducido a propósito: contar un `uri` vacío como bloque ilegible. La
herramienta de SVTA emite `"uri": ""` en los seis payloads, con
`"URI": "[PATH TO ASSET]"` arriba, así que un cliente que lo tomara por
ilegible replegaría sobre **todos** los asset-list que la herramienta produce.
Los nueve rojos de `layout-resolution.test.js` y de
`program-ranges-and-volume.test.js` son la razón por la que ese chequeo no
llegó a la rama: los seis layouts dejan de resolver a su layout y pasan a
resolver a `linear`, y ahí no hay ni cajas ni volúmenes que medir
(`T-03 measured no element called linear in cornerOverlay`).

**M15 pone en rojo dieciséis.** Es la misma familia de error con otra causa:
exigir un bloque `primaryContent` que la herramienta omite en los dos overlays.
El test que la atrapa de frente es el del repliegue que **no** se dispara, sobre
los nueve asset-list que la demo sirve, y es el único de los dieciséis que
nombra la causa en su mensaje. Los otros quince dicen que algo se rompió; ése
dice qué.

Las dos son el lado caro de la frontera: un repliegue que se dispara de más
reemplaza un layout que alguien señalizó por un aviso a cuadro entero, y la
grabación de eso es la grabación de un aviso reproduciéndose. Nada en pantalla
dice cuál tendría que haber sido.

## Ninguna mutación quedó verde

Quince cortes, quince corridas en rojo, sesenta y ocho rojos en total, y el
árbol restaurado y verificado con `git diff --quiet` después de cada uno. No
hubo hallazgos: no apareció una regla que la suite dejara pasar. Los dieciséis
tests nuevos pasaron en la primera corrida contra el código tal como la T-01 y
la T-02 lo dejaron, y los números esperados —los arranques, las ventanas, los
dos rangos, los volúmenes— se escribieron desde la evidencia de esas tasks y
coincidieron sin ajustar ninguno.

## Dos cosas del bloque que no coinciden con lo que las tres tasks dejaron

**La mutación de la regla de fin que el bloque pide no se puede aplicar, porque
describe la regla que la T-02 eligió.** El bloque enumera "la regla de fin
resuelta por `DURATION` en lugar de por el fin del asset" entre las roturas que
importan, y esa frase se escribió cuando la decisión estaba abierta. La T-02 la
cerró en el otro sentido: **la ventana declarada decide**, `activeAt` sigue
siendo la única fuente, y la divergencia con la norma quedó escrita en el
contrato con las tres razones que la sostienen. Resolver el fin por la
`DURATION` declarada no es una mutación de esa regla: es la regla.

Lo que se rompió en su lugar son las dos formas en que esa decisión se puede
deshacer sin que se note, y las dos sobre `asset-list-solapado.json`, el único
fixture donde el número declarado y la ventana real no coinciden: **M03**, que
acumula el desplazamiento desde las ventanas en vez de desde la `DURATION`
declarada —da 38 donde la regla da 32, y da lo mismo que la regla en todos los
demás asset-list de la demo—, y **M14**, que hace del rango del break la suma de
las ventanas en lugar de su unión.

**La campaña corre la suite entera por cada rotura y no sólo los tests de esa
regla.** El bloque pide lo segundo. Correr todo cuesta 150 ms y devuelve algo
que la corrida acotada esconde: el radio de la rotura. Es lo que hace legible la
M10 —diez rojos, nueve de ellos ajenos a esta task— y la M15 —dieciséis—, que
son las dos mutaciones que muestran cómo se detecta un repliegue que se dispara
de más. El `t04-mutaciones.json` guarda, por rotura, la lista completa de tests
en rojo, así que la lectura acotada se puede reconstruir filtrando.

## Los chequeos del proyecto

- `npm test`: **43 pasan, 0 fallan** (27 antes de esta task).
- `node scripts/verificar-cortes.mjs`: las dos costuras se sostienen. **No
  corresponde a esta task** —no toca `lib/`, `js/` ni `css/`, que son los
  archivos que el script mira— y se corrió igual porque la campaña de mutación
  escribe sobre `lib/signalling.js` y sobre dos fixtures, y esto verifica que
  los quince cortes se restauraron.
- La comparación de la caja pedida contra la dibujada **no corresponde**: la
  task no toca el renderizado.
