# T-02 — el asset sin bloque: el aviso lineal y el repliegue

Todas las lecturas salen de `t02leer.py`, que carga la página una vez por
escenario y la deja correr de punta a punta del break sin un solo seek. Cada
escenario es un asset-list de `signalling/` señalizado en el segundo 20 con
`./scripts/senalizar-contenido.sh 20 <escenario>`. Los JSON de este directorio
son las corridas enteras, con la consola incluida.

Ningún escenario registró un seek. `signalling/asset-list-linear.json`, el aviso
lineal declarado sin bloque desde la fase 01, resuelve hoy a exactamente una
experiencia de `type` `linear`.

## Las tres decisiones

### 1. La regla de fin: decide la ventana declarada

El fin de un aviso sale de su `duration` declarada, y `activeAt` sigue siendo la
única fuente de la ventana de activación. Es una divergencia con la norma —el
Apéndice D dice que el interstitial termina al terminar el asset— y queda escrita
como tal en `docs/contrato-senalizacion-renderizado.md`, con lo que promete y lo
que no.

Las tres razones, en orden de peso:

1. **El fin real no es una fuente que se pueda prometer.** Un asset que nunca
   carga nunca termina, así que una regla escrita sobre el `ended` del elemento
   necesita igual un corte por tiempo debajo, y ese corte es la duración
   declarada. No la reemplaza: le agrega una segunda fuente encima.
2. **El contrato tiene más de un lector.** La ventana la leen el renderizador y
   el trazador del contrato, cada uno por su lado y en el mismo cuadro. Con dos
   fuentes pueden contestar distinto sobre el mismo instante.
3. **La lista de rangos es monótona por promesa del contrato.** Un fin que llega
   del asset movería una `duration` ya publicada.

**Lo que la divergencia cuesta, y lo que se hizo con eso.** Las dos direcciones
fallan sin verse: un creativo más corto que su ventana se queda en su última
imagen hasta que la ventana cierre, y uno más largo se corta a mitad de camino.
Las dos se ven idénticas a un aviso normal en una captura. Así que el
renderizador **lo dice en la consola las dos veces, con el número**
(`CUT_TOLERANCE_SECONDS`, medio segundo de tolerancia para la holgura de arrancar
y parar un elemento). La capa sigue sin corregir nada; deja de ser silenciosa.

### 2. Qué cuenta como "no lo puedo reproducir": tres de cuatro

Se detectan, y las tres son sobre la forma del dato:

- **No hay bloque.** No es una falla: es el aviso lineal.
- **El bloque no tiene payload usable**: sin `payload`, vacío, o con un item sin
  ventana —`duration` que no es un número positivo— o con un layout sin assets
  adentro. Ninguna de las tres puede volverse una caja en una pantalla.
- **El asset no tiene nada reproducible**: ni bloque usable ni un `URI` con
  `DURATION` positiva. Se saltea ese asset y no el break.

No se detectan, y cada una por una razón distinta:

- **El `mediaType` que el cliente no soporta.** En el momento de resolver no hay
  con qué contestarlo: el `type` de un asset de media playlist es el mismo string
  para cualquier códec que tenga adentro, así que el chequeo miraría el
  contenedor y rechazaría nada de lo que realmente falla. La respuesta honesta
  llega recién cuando el elemento intenta reproducir, que es otro mecanismo y
  otro momento.
- **El layout que pide más elementos que los decodificadores declarados.** El
  número todavía no existe: es de la T-03. Cuando exista, la comparación es una
  línea en el mismo lugar donde el bloque inutilizable ya cae al repliegue, y no
  necesita mecanismo nuevo.

**Un `uri` vacío en un elemento no cuenta como bloque ilegible, y lo dijo la
suite de tests.** La primera versión del chequeo lo incluía y puso nueve tests en
rojo: la herramienta de SVTA emite `"uri": ""` en los seis payloads, con
`"URI": "[PATH TO ASSET]"` arriba. Un cliente que lo tomara por ilegible
replegaría sobre **todos** los asset-list que la herramienta produce, que es
exactamente lo que el ADR 0004 decide no hacer.

### 3. La barra: una sola marca por break, como hoy

El break entero sigue siendo **un** rango de clase `concurrent`, del arranque del
primer aviso al fin del último, con el aviso a cuadro entero adentro. No se toca
`rangeOfExperiences` y no se reescribe el ADR 0018.

La razón es la definición de `kind`: un rango es concurrente o es de reemplazo, y
lo que los separa es si cambia el largo de la línea de tiempo (ADR 0016). Bajo
este render el aviso a cuadro entero **no lo cambia** —está medido más abajo—,
así que marcarlo de reemplazo diría que hubo un reemplazo sobre un riel donde no
lo hubo, y marcarlo de concurrente no agregaría nada al rango que ya está. La
anticipación del ADR 0018 se cumple el día que un aviso de esta capa detenga el
programa de verdad; ese aviso sí es un rango propio y sí es de reemplazo.

## La lectura que decide la primera: dos experiencias solapadas

`signalling/asset-list-solapado.json`: el primer item declara 18 s dentro de un
asset que declara `DURATION` 12, así que su ventana (20 → 38) pisa la del segundo
(32 → 44). El solape es de 32 a 38. Corrida en `t02-solapado.json`.

En t = 34,501 s, `activeAt` devuelve **dos** experiencias, y `drawn` queda con
**cuatro** entradas, dos de ellas `primaryContent` apuntando al mismo `<video>`:

| lo que pide cada experiencia para el primario | caja pedida (l, t, w, h) | caja dibujada |
| --- | --- | --- |
| `AD-1-CONCURRENT.0`, `cornerOverlay`, box `0 0 0 0` | 828, 314,078, 715, 402,188 | 828, **414,625**, **357,5**, **201,094** |
| `AD-1-CONCURRENT.1`, `squeezebackDoubleBox`, box `25 50 25 0` | 828, 414,625, 357,5, 201,094 | igual, delta 0 |

**Gana la última y la diferencia es de 357,5 px** en el ancho del contenido
primario. Y el aviso de la primera experiencia queda dibujado correctamente
contra su propia caja —delta 0— pero sobre un área que el primario ya no ocupa:
dos avisos en pantalla a la vez y un overlay de esquina flotando al lado de un
primario encogido.

Hay dos costos más, y los dos los reportó la consola sola:

- `ad1-overlay` en el instante del solape: `ended` en `true`, `paused` en `true`,
  `currentTime` 12,011 s de un asset de 12,011 s. Es la última imagen congelada
  esperando a que cierre una ventana de 18 s.
  `[renderer] ad1-overlay: the asset ran out with 5.87s still left in the window`.
- Al cerrarse el solape, en t ≈ 38, la clave del renderizador cambia, `clear()`
  destruye **los dos** nodos y `build()` reconstruye el que seguía corriendo:
  `[renderer] ad2-box: taken off with 6.09s of its asset still unplayed`. Un
  arranque en frío en el medio del break, que es justo lo que la T-01 sacó.

**Por eso la ventana declarada decide.** Si el fin real mandara, un creativo más
largo que su `DURATION` declarada produciría esto **en operación normal**. La
divergencia que la regla declarada deja es un aviso cortado o congelado; la que
la otra abre es la composición entera mal dibujada.

## El asset sin bloque

`signalling/asset-list-mezclado.json`: cuatro avisos, el tercero sin bloque —la
mezcla que David nombró, "concurrent, concurrent, linear, concurrent"—. Ventanas
20 → 32, 32 → 44, 44 → 56, 56 → 68. Corridas en `t02-mezclado.json` y
`t02-mezclado-con-audio.json`, la segunda con el audio de la composición
levantado con un click real sobre el control de la librería, que es lo que hace
el operador una vez al arrancar la grabación.

En t = 50,036 s, dentro del tercero, `activeAt` devuelve **una** experiencia con
**dos** elementos:

| elemento | `primary` | `zDepth` | `box` | `volume` | `uri` |
| --- | --- | --- | --- | --- | --- |
| `primaryContent` | `true` | 0 | `0 0 0 0` | 0 | `null` |
| `linear` | `false` | 1 | `0 0 0 0` | 100 | `/content/adA/index.m3u8` |

Y el estado de los dos elementos en ese instante, con el audio levantado:

| | `volume` | `muted` | `paused` |
| --- | --- | --- | --- |
| nodo del asset (`<video>`, `readyState` 4) | **1** | **false** | **false** |
| `<video>` del primario | **0** | false | **false** |

**`paused` en falso en el primario es la lectura que dice que el programa no se
detuvo**, y es la que ninguna captura del aviso a cuadro entero puede dar.

Un instante después del fin del tercero, t = 56,316 s: el nodo `linear` ya no
está en la capa y el `<video>` del primario volvió a `volume` 1.

**El `style` inline no está vacío ahí, y el bloque de la task suponía que sí.** A
los 56 s el cuarto aviso ya abrió su ventana, así que el renderizador ya puso al
primario en la caja de ese aviso. La lectura del `style` ausente es la del fin del
**break**, t = 68,559 s: `activas` vacío, capa vacía, `style` en `null` y `volume`
en 1. Las dos están en la corrida.

## El largo del programa, que es el ADR 0016 verificado

Los tres números, antes, durante y después del aviso a cuadro entero:

| instante | `video.duration` | rango concurrente de `programRanges()` |
| --- | --- | --- |
| t = 10,056 s, antes del break | **180** | `startTime` 20, `duration` 48 |
| t = 50,036 s, dentro del aviso lineal | **180** | `startTime` 20, `duration` 48 |
| t = 68,559 s, después del break | **180** | `startTime` 20, `duration` 48 |

Los mismos tres números las tres veces. Y la barra marca lo que la decisión 3
dice que marca: **un** rango de clase `concurrent` para el Date Range, con los
cuatro avisos adentro. El otro rango de la lista es `AD-1-LINEAR`, de clase
`interstitial`, que es el tag de clase Apple del par de compatibilidad y que
nuestra barra no marca (ADR 0018) — o sea que **el par de compatibilidad sigue
diciendo lo que tiene que decir**: nuestro player no marca ni reproduce lo que
reproduce el de fábrica.

## El repliegue, escalón por escalón

Un asset-list roto a propósito por cada caso detectado. En cada uno, qué hizo el
cliente y no que "no se rompió".

### Un bloque que este cliente no puede dibujar

`asset-list-repliegue-bloque-roto.json`: tres assets, el segundo con un item cuyo
`layout` declara `primaryContent` y **ningún** asset. Corrida en
`t02-repliegue-bloque-roto.json`.

| t | `activeAt` devuelve | nodo en la capa | primario |
| --- | --- | --- | --- |
| 26,066 s | `AD-1-CONCURRENT.0`, `cornerOverlay` | `ad1-overlay` | `paused` false, `volume` 1 |
| 38,065 s | `AD-1-CONCURRENT.1`, **`linear`** | **`linear`** | `paused` false, **`volume` 0** |
| 50,061 s | `AD-1-CONCURRENT.2`, `cornerOverlay` | `ad3-overlay` | `paused` false, `volume` 1 |

El asset replegó a su propio `URI` y el break se llenó entero. Rango:
`startTime` 20, `duration` 36. Consola:
`[signalling] AD-1-CONCURRENT: an ASSET carries a layout block this client cannot draw, so it falls back to the asset's own URI and plays as a linear ad (ADR 0019).`

### Un asset que no se puede reproducir: se saltea ese asset y no el break

`asset-list-repliegue-sin-uri.json`: tres assets, el segundo sin `URI` y sin
bloque. Corrida en `t02-repliegue-sin-uri.json`.

| t | `activeAt` devuelve | nodos en la capa |
| --- | --- | --- |
| 26,048 s | `AD-1-CONCURRENT.0`, `cornerOverlay` | `ad1-overlay` |
| 38,030 s, en la ventana del salteado | **nada** | **ninguno** |
| 50,019 s | `AD-1-CONCURRENT.1`, `cornerOverlay` | `ad3-overlay` |

**El tercer asset sigue arrancando en el segundo 44**, o sea que las ventanas de
los otros quedaron intactas: la `DURATION` declarada del salteado se acumula
igual. Rango: `startTime` 20, `duration` 36 — el break no se canceló. Es
exactamente la distinción del Apéndice D.5 que la fase tenía escrita más gruesa.

### El asset-list que no se puede leer: se cancela el break entero

`asset-list-repliegue-json-roto.json`, que es JSON inválido a propósito. Corrida
en `t02-repliegue-json-roto.json`.

En t = 10,054 s, 26,035 s y 38,063 s: `activeAt` vacío, capa vacía, primario con
`paused` en false y `volume` 1 en los tres. `programRanges()` al final:

```json
{ "ranges": [ { "id": "AD-1-LINEAR", "kind": "interstitial", "startTime": 20, "duration": 12 } ], "settled": true }
```

**`AD-1-CONCURRENT` no está en la lista**: el break se canceló y no se reporta.
`AD-1-LINEAR` sí está porque es otro Date Range —el del par de compatibilidad— y
nuestra barra no lo marca igual. Consola:
`[signalling] AD-1-CONCURRENT: the asset-list could not be read, so the whole break is cancelled with offset 0 (Appendix D.5)…`
Es el único rastro que el break deja, y por eso es un error y no una advertencia.

### `ASSETS` vacío: se aplica el offset y no se reproduce nada

`asset-list-repliegue-vacio.json`. Corrida en `t02-repliegue-vacio.json`.
Cero experiencias, cero nodos, `AD-1-CONCURRENT` ausente de `programRanges()`, y
el primario con `paused` en false en los tres instantes. Consola:
`[signalling] AD-1-CONCURRENT: the list declares no ASSETS. The break plays nothing and the programme is not interrupted (Appendix D.5…)`.
Bajo este render no hay offset que aplicar, porque el primario nunca se detuvo.

### Y el que NO repliega

Dos lecturas, porque son dos preguntas:

- **Con el asset-list mezclado bien armado**: la corrida entera
  (`t02-mezclado-con-audio.json`) tiene **cero advertencias y cero errores** de
  consola. Lo único que la señalización dice del tercer asset es un `log`, no un
  `warn`: es un aviso lineal declarado, no un repliegue.
- **Sobre los siete asset-list de `signalling/` que no son fixtures de
  repliegue** —los cinco del recorrido, `linear` y `multiAd`— `resolveAssetList`
  emite exactamente un mensaje, el `log` del aviso lineal de
  `asset-list-linear.json`. Ninguna advertencia de repliegue en ninguno.

## La caja pedida contra la dibujada

El aviso a cuadro entero es una caja `0 0 0 0` que tapa al primario, y es la
primera vez que se dibuja una así. La caja pedida se calcula aparte del
renderizador, desde el rectángulo de la capa, la relación de aspecto del video y
los porcentajes de inset; la dibujada es el `getBoundingClientRect()` de cada
nodo, y del `<video>` del primario, que llega a su caja por un `transform`.

| aviso | elemento | pedida (l, t, w, h) | dibujada | Δ |
| --- | --- | --- | --- | --- |
| 1 `cornerOverlay` | `primaryContent` | 828, 330,328, 715, 402,188 | igual | 0 |
| 1 `cornerOverlay` | `ad1-overlay` | 828, 330,328, 178,75, 100,547 | igual | 0 |
| 2 `squeezebackDoubleBox` | `primaryContent` | 828, 430,875, 357,5, 201,094 | igual | 0 |
| 2 `squeezebackDoubleBox` | `ad2-box` | 1185,5, 430,875, 357,5, 201,094 | igual | 0 |
| **3 `linear`** | `primaryContent` | 828, 330,328, 715, 402,188 | igual | 0 |
| **3 `linear`** | `linear` | 828, 330,328, 715, 402,188 | igual | 0 |
| 4 `cornerOverlay` | `ad4-overlay` | 1364,25, 631,969, 178,75, 100,547 | igual | 0 |

Mayor diferencia absoluta: **0,0 píxeles**. El aviso a cuadro entero ocupa
exactamente la misma caja que el primario y queda encima por `zDepth`.

## El recorrido de los cinco breaks, que tenía que seguir corriendo igual

Con la playlist restaurada, `t01recorrido.py` de la T-01: `programRanges()`
devuelve los mismos diez rangos que la fase 02 y la T-01 leyeron —cinco
concurrentes y cinco de interstitial, en 20, 45, 70, 95 y 120, de 12 s cada uno—,
`settled` en `true`, en un instante de adentro de cada break `activeAt` devuelve
la experiencia con el layout que la tabla del script declara, cero seeks y cero
errores de consola.

## Los tres chequeos del proyecto

- `node scripts/verificar-cortes.mjs`: las dos costuras se sostienen, tres
  ocurrencias todas en la lista de aceptadas y cero cruces de la del ADR 0015.
- `npm test`: 27 pasan, 0 fallan.
- La comparación de la caja pedida contra la dibujada: arriba, 0,0 px.

## Errores de consola, explicados

En dos de las siete corridas aparece `[stock] error networkError aborted fatal: false`,
del pane de fábrica. Es el mismo que la T-01 anotó: no es fatal, no viene de la
librería, y no aparece en la corrida de los cinco breaks. Los demás mensajes de
las corridas de repliegue son los que cada escalón emite a propósito y están
citados arriba, uno por escenario.
