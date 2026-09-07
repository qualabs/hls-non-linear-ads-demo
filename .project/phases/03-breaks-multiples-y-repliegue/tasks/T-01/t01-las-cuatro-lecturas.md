# T-01 — un break con varios avisos, uno detrás del otro

El escenario: un break de tres avisos en el segundo 20, con los dos primeros
compartiendo `type` y los tres dibujando cajas distintas.
`signalling/asset-list-multiAd.json`, señalizado con
`./scripts/senalizar-contenido.sh 20 multiAd`.

| aviso | asset | `type` | creativo | caja |
| --- | --- | --- | --- | --- |
| 1 | `ASSETS[0]`, `DURATION` 12 | `cornerOverlay` | `adB` | esquina superior izquierda |
| 2 | `ASSETS[1]`, `DURATION` 12 | `cornerOverlay` | `adC` | esquina inferior derecha |
| 3 | `ASSETS[2]`, `DURATION` 12 | `squeezebackDoubleBox` | `adA` | mitad derecha, primario a la izquierda |

Todas las lecturas salen de `t01leer.py`, que carga la página una vez y la deja
correr de punta a punta del break sin un solo seek. Los JSON son la corrida
entera: `t01-lecturas-con-el-arreglo.json` y, para el contraste,
`t01-lecturas-sin-el-arreglo.json`, que es la misma corrida con la clave vieja
del renderizador y la precarga apagada.

## Las tres decisiones

**El desplazamiento sale de la `DURATION` de nivel superior de cada asset,
acumulada.** El `start` del item del bloque se lee entonces como desplazamiento
adentro de su propio asset. La razón es que el desplazamiento tiene que salir de
un campo que **todos** los assets tengan: `DURATION` es obligatorio en cada
Asset-Description por el Apéndice D.2, y el bloque es extensión nuestra, así que
el asset sin bloque de la T-02 no tiene dónde llevar un `start`. Los seis
payloads que emite la herramienta traen un solo asset con `start: 0`, así que el
acumulador vale 0 y ninguno de ellos se mueve. Queda en
`docs/contrato-senalizacion-renderizado.md`, con lo que cuesta: la `DURATION` es
metadato declarado y la capa declara la secuencia sin corregirla.

**La identidad de cada aviso es un campo nuevo del contrato, `itemId`.** `id`
sigue nombrando el Date Range —lo comparten los tres avisos, y es lo que la barra
necesita para marcar un rango por break—, y `itemId` nombra un aviso:
`AD-1-CONCURRENT.0`, `.1`, `.2`. La clave del renderizador pasa a ser el `itemId`
y deja de ser `${type}#${id}`. Es la regla 6 del contrato.

**La precarga trae el aviso siguiente 3 segundos antes de su ventana**
(`PRELOAD_LEAD_SECONDS`), preguntándole al contrato `activeAt(t + 3)`, o sea sin
método nuevo del proveedor. Hasta que le toca, el nodo está en la capa y en su
caja, con `opacity: 0` —que lo esconde sin sacarlo de la pintura, a diferencia de
`display: none`, y un nodo que no se pinta tampoco se decodifica—, en pausa y
muteado: `applyPlayback` y `applyAudio` leen `drawn`, y el nodo precargado no
está en `drawn`. Tres segundos porque alcanzan para las dos vueltas de red que
cuesta un arranque en frío y son una fracción chica de un aviso, así que como
mucho hay un decodificador de más y sólo durante la cola del aviso anterior. Un
nodo que deja de venir —un seek hacia atrás— se descarta.

## 1. La secuencia

Predicho por el desplazamiento elegido: `20 + 0`, `20 + 12`, `20 + 12 + 12`.

| instante | experiencias que devuelve `activeAt(t)` | `itemId` | `type` | `startTime` | predicho |
| --- | --- | --- | --- | --- | --- |
| 26,040 s | **1** | `AD-1-CONCURRENT.0` | `cornerOverlay` | 20,000 | 20,000 |
| 38,052 s | **1** | `AD-1-CONCURRENT.1` | `cornerOverlay` | 32,000 | 32,000 |
| 50,052 s | **1** | `AD-1-CONCURRENT.2` | `squeezebackDoubleBox` | 44,000 | 44,000 |

Tres instantes, tres respuestas, exactamente una experiencia en cada una y en el
orden del array `ASSETS`.

## 2. La identidad

En el instante del segundo aviso, t = 38,052 s, el único nodo de la capa es
`data-element-id="ad2-overlay"`, y el elemento que el contrato le declara es
`/content/adC/index.m3u8` — el segundo creativo.

Con el bug vivo, en ese mismo instante el nodo de la capa es
`data-element-id="ad1-overlay"`, con `currentTime` 12,032 s: el creativo del
primer aviso, ya pasado su propio fin, corriendo de largo. El segundo no se
dibuja nunca. El tercero sí, porque cambia de `type` y ahí la clave vieja sí
cambia — que es exactamente por qué el defecto aparece cuando dos avisos
comparten layout y no antes.

**El `src` del nodo no distingue los creativos, y el bloque supone que sí.** Un
asset de media playlist se adjunta con una segunda instancia del player, así que
el `src` del nodo es un `blob:` del MediaSource
(`blob:http://localhost:8080/701dd7bd-…`) y no nombra al creativo. Lo que sí lo
nombra es el `data-element-id` del nodo y el `uri` del elemento del contrato, y
las dos lecturas están arriba.

## 3. La barra

`provider.programRanges()` para el Date Range concurrente:

```json
{ "id": "AD-1-CONCURRENT", "kind": "concurrent", "startTime": 20, "duration": 36 }
```

**Un** rango, del arranque del primer aviso al fin del último, con los tres
avisos adentro. El otro rango de la lista es `AD-1-LINEAR`, de clase
`interstitial`, que es el tag de clase Apple del par de compatibilidad y no lo
marca nuestra barra (ADR 0018). `settled` en `true`.

## 4. La precarga

En el instante anterior a cada transición, qué nodos hay en la capa:

| instante | nodos en la capa | el que entra | `readyState` | `opacity` | `paused` |
| --- | --- | --- | --- | --- | --- |
| 19,460 s (entra el aviso 1) | `ad1-overlay` | `ad1-overlay` | **4** | `0` | `true` |
| 31,437 s (entra el aviso 2) | `ad1-overlay`, `ad2-overlay` | `ad2-overlay` | **4** | `0` | `true` |
| 43,419 s (entra el aviso 3) | `ad2-overlay`, `ad3-box` | `ad3-box` | **4** | `0` | `true` |

`readyState` 4 es `HAVE_ENOUGH_DATA`, por encima del 2 que el done pide. El nodo
que entra ya está en su caja definitiva, invisible, en pausa y muteado.

Sin precarga, en esos mismos tres instantes: la capa está **vacía** antes del
aviso 1, y antes de los avisos 2 y 3 el único nodo es el del aviso 1 — el que
entra no existe todavía, que es el arranque en frío entero cayendo en el medio
del break.

## La caja pedida contra la dibujada

Tres layouts encadenados, seis elementos. La caja pedida se calcula aparte del
renderizador, desde el rectángulo de la capa, la relación de aspecto del video y
los porcentajes de inset del asset-list; la dibujada es el
`getBoundingClientRect()` de cada nodo, y del `<video>` del primario, que llega a
su caja por un `transform`.

| aviso | layout | elemento | pedida (l, t, w, h) | dibujada | Δ |
| --- | --- | --- | --- | --- | --- |
| 1 | `cornerOverlay` | `primaryContent` | 828, 330,328, 715, 402,188 | igual | 0 |
| 1 | `cornerOverlay` | `ad1-overlay` | 828, 330,328, 178,75, 100,547 | igual | 0 |
| 2 | `cornerOverlay` | `primaryContent` | 828, 330,328, 715, 402,188 | igual | 0 |
| 2 | `cornerOverlay` | `ad2-overlay` | 1364,25, 631,969, 178,75, 100,547 | igual | 0 |
| 3 | `squeezebackDoubleBox` | `primaryContent` | 828, 430,875, 357,5, 201,094 | igual | 0 |
| 3 | `squeezebackDoubleBox` | `ad3-box` | 1185,5, 430,875, 357,5, 201,094 | igual | 0 |

Mayor diferencia absoluta en los seis elementos: **0,0 píxeles**. Detalle en
`t01-cajas.json`.

## El recorrido de los cinco breaks, que tenía que seguir corriendo igual

`t01recorrido.py`, una carga y 135 segundos de programa:
`programRanges()` devuelve los mismos diez rangos que la fase 02 leyó —cinco
concurrentes y cinco de interstitial, en 20, 45, 70, 95 y 120, de 12 s cada
uno—, `settled` en `true`, y en un instante de adentro de cada break `activeAt`
devuelve una experiencia con el layout que la tabla del script declara. Cero
seeks y cero errores de consola. Corrida entera en
`t01-el-recorrido-de-los-cinco.json`.

## Los tres chequeos del proyecto

- `node scripts/verificar-cortes.mjs`: las dos costuras se sostienen. La del
  ADR 0015 encontró dos cruces reales mientras esta task se escribía —dos
  comentarios de `lib/` que nombraban la demo— y los dos se sacaron.
- `npm test`: 27 pasan, 0 fallan.
- La comparación de la caja pedida contra la dibujada: arriba, 0,0 px.

## Un error de consola que no es de esta task

En la corrida del break de tres avisos aparece `[stock] error networkError
aborted fatal: false`, del pane de fábrica. No es fatal, no viene de la
librería, y en la corrida de los cinco breaks no aparece.
