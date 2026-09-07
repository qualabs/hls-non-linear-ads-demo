# T-03 — el `decoderCount`, de la configuración al pedido del asset-list

Las tres condiciones son passthrough y nada más: que se pueda configurar del lado
del SDK, que sin configurar no cambie nada, y que configurado el GET lo lleve.
Nada de acá decide qué hacer con el número.

Todas las lecturas salen de `t03leer.py`, que carga la página y anota **la URL que
sale a la red**, tal como la pestaña de red la muestra, más la línea que la capa
de señalización imprime con la URL que construyó: dos fuentes independientes del
mismo string. Las corridas están en los cuatro JSON de este directorio, con la
consola incluida.

**La diferencia entre las dos corridas es una línea de la página del integrador y
ni un byte de la librería.** La página del repo no configura decoders —la fase la
dejó fuera de alcance— así que la corrida configurada intercepta `js/app.js` y le
agrega `decoderCount: 3` al `attach`. La inyección verifica que el `attach` que
toca sea exactamente uno y aborta si no (`inyeccion.ocurrencias` en el JSON).

## El nombre del parámetro: `qa-decoder-count`

**No empieza con `_HLS_`.** El draft reserva ese prefijo para los query params que
define él y pide que nadie más defina parámetros con él. Acá la reserva no es
teórica: en la misma corrida, el pane de fábrica pide
`asset-list-linear.json?_HLS_primary_id=<uuid>` —la maquinaria de interstitials de
hls.js poniéndole su huella al pedido—, y esa huella es lo que la evidencia del
par de compatibilidad usa para distinguir qué pidió cada pane. Un parámetro
nuestro con ese prefijo rompería la reserva y ensuciaría una lectura que ya se
usa.

**Lleva el namespace del vendor**, como todo lo demás que esta librería deja en la
página de otro: el global `QualabsConcurrentHls`, la clase de la capa
`qa-concurrent-layer`, la custom property `--qa-accent`, y la clase de Date Range
`com.qualabs.hls.concurrentInterstitial` del ADR 0009. El asset-list es de quien
lo sirve y puede traer query propia, así que un `decoderCount` pelado sería
reclamar un nombre en espacio compartido que no es nuestro. El día que la
especificación nombre esta capacidad, ese nombre es el que viaja y reemplaza a
éste.

**La forma es un entero decimal**, la cantidad de decodificadores de video que el
integrador declara tener. Ausente es ausente: no se agrega nada a la URI.

El nombre está publicado como `QualabsConcurrentHls.DECODER_COUNT_PARAM`, leído
en vivo del global:

```json
{ "claves": ["VERSION", "CONCURRENT_CLASS", "DECODER_COUNT_PARAM", "hlsConfig", "attach", "attachControls"],
  "param": "qa-decoder-count" }
```

## Condición 1 — se configura del lado del SDK

La opción es `decoderCount` de `attach`, en `lib/concurrent-hls.js`, y viaja a
`createSignalling` de `lib/signalling.js`. No hay una línea de esto en `js/app.js`
ni en `index.html`: la página del integrador la pasa como pasa `logo` o
`onResolved`, que es la superficie que fija el ADR 0015. `verificar-cortes` lo
confirma por el otro lado —la costura del ADR 0015 sigue con cero cruces—.

El número se lee **una vez**, al construir la señalización, y no en cada pedido:
lo que puede estar mal es lo que escribió el integrador, y eso es una afirmación y
no una por break. Con `decoderCount: 0` la consola dice una sola línea para los
cinco breaks (`t03-configurado-invalido.json`):

```
[signalling] decoderCount is 0, which is not a whole number of decoders above zero,
so it is not sent: the asset-list is asked for exactly as it would be asked for
without the option.
```

y los cinco pedidos salen pelados, que es la misma promesa que la condición 2.

## Condición 2 — sin configurar no cambia nada, y es la que se rompe sin verse

Dos corridas del recorrido de los cinco breaks, la de **antes** del cambio y la de
**después** sin configurar, comparadas string contra string.

| | antes del cambio | después, sin configurar |
| --- | --- | --- |
| `asset-list-cornerOverlay.json` | `http://localhost:8080/signalling/asset-list-cornerOverlay.json` | idéntica |
| `asset-list-squeezebackLShape.json` | `…/signalling/asset-list-squeezebackLShape.json` | idéntica |
| `asset-list-squeezebackLShape-image.json` | `…/signalling/asset-list-squeezebackLShape-image.json` | idéntica |
| `asset-list-squeezebackDoubleBox.json` | `…/signalling/asset-list-squeezebackDoubleBox.json` | idéntica |
| `asset-list-multiView.json` | `…/signalling/asset-list-multiView.json` | idéntica |

**Iguales carácter por carácter, las cinco, sin query string.** La comparación es
de listas de strings y no de una mirada.

Y el recorrido corre igual: `programRanges()` devuelve los **mismos diez rangos**
—cinco concurrentes y cinco de interstitial, en 20, 45, 70, 95 y 120, de 12 s cada
uno—, comparados rango por rango contra la corrida de antes y contra los de la
T-01 y la T-02; `settled` en `true`; en un instante de adentro de cada break
`activeAt` devuelve la experiencia con el layout que la tabla del script declara;
**cero seeks y cero errores de consola**.

## Condición 3 — configurado, el GET lo lleva

Con `decoderCount: 3`, los cinco pedidos de nuestra capa
(`t03-configurado.json`):

```
http://localhost:8080/signalling/asset-list-cornerOverlay.json?qa-decoder-count=3
http://localhost:8080/signalling/asset-list-squeezebackLShape.json?qa-decoder-count=3
http://localhost:8080/signalling/asset-list-squeezebackLShape-image.json?qa-decoder-count=3
http://localhost:8080/signalling/asset-list-squeezebackDoubleBox.json?qa-decoder-count=3
http://localhost:8080/signalling/asset-list-multiView.json?qa-decoder-count=3
```

Son **las cinco URLs de la corrida sin configurar más el parámetro**, verificado
por concatenación y no por lectura. Y el recorrido de los cinco breaks también
corre igual con el parámetro puesto: los mismos diez rangos, cero seeks, cero
errores.

Que la respuesta no cambie es alcance del proyecto y no un defecto de la task: la
demo sirve archivos y el servidor ignora la query. Lo que se muestra es el
parámetro viajando.

## Lo que la task NO hizo, porque el `PHASE.md` lo pone afuera

No decide qué hacer cuando el número no alcanza, no elige un layout alternativo,
no cuenta decodificadores y no mide nada con el número. **No se agregó detección
de nada**: el SDK recibe el número, no lo averigua.

**El gancho de la T-02 ya está y no hizo falta cablear nada.** La T-02 decidió no
detectar el caso "el layout pide más elementos que los que el `decoderCount`
declara" porque el número todavía no existía, y dejó escrito que cuando existiera
sería una línea en el mismo lugar donde el bloque inutilizable ya cae al
repliegue. Ese lugar es `usablePayload`, llamada desde `resolveAssetList`, que
`read()` invoca teniendo `decoders` en su propio alcance: la línea que compare
tiene el número a mano sin plomería nueva. No se agregó un parámetro sin
consumidor para dejarlo "preparado".

## Los tres chequeos del proyecto

- `node scripts/verificar-cortes.mjs`: las dos costuras se sostienen. ADR 0003 con
  tres ocurrencias, todas en la lista de aceptadas; ADR 0015 con cero cruces.
- `npm test`: 27 pasan, 0 fallan.
- La comparación de la caja pedida contra la dibujada **no corresponde**: la task
  no toca el renderizado.

## Documentación del integrador

`docs/integrating-the-library.md` gana la opción en la tabla de `attach`, el
`DECODER_COUNT_PARAM` en la tabla de la superficie pública, y una sección corta
con el nombre del parámetro, la forma, el ejemplo del GET, la razón del nombre y
la promesa de que ausente no agrega nada.

## Una diferencia entre el bloque y el código

El bloque dice "el nombre del parámetro **y su forma** hay que fijarlos y
escribirlos". La forma quedó fijada como entero decimal positivo, y de ahí sale la
única decisión que el bloque no enumeraba: **qué hace la librería con un valor que
no es eso.** Se avisa por consola y no se manda, en lugar de reenviarlo tal cual,
porque un valor que no es una cuenta llega al servidor de decisioning y ahí se
ignora en silencio —la falla que se parece a que todo anda— o se contesta mal. Es
la misma forma que `checkConfig` y `ensurePositioned` ya tienen en este archivo:
la librería verifica y avisa, no exige y no rompe.
