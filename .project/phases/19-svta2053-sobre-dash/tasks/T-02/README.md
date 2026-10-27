# T-02 — Lo común de `hls/` sube a `lib/`

Rama `fase-19`, tres commits:

| commit | qué | testigo |
| --- | --- | --- |
| `97c239d` | renombre puro por sed (`renombre.sh`): `resolveAssetList` → `resolveAssets`, `assetListUrl` → `listRequestUrl`, el parámetro `assetList` → `adList` de las funciones que suben | `renombre.sh` aplicado sobre `24f9e99` en un worktree aparte da un árbol idéntico al commit (`REPRO: identical to fase-19`); 378/378 |
| `f37d906` | `lib/ad-list.js` (la lista: `BLOCK`, `usableUri`, `decideAsset`, `pendingFirstRequests`, `resolveWithFirstRequests`, `resolveAssets`, `resolvePostRoll`, los dos parámetros, `listRequestUrl`) y `lib/playhead.js` (`onceProgress`, `postRollDue`, `BUFFER_HOLE_TOLERANCE`, `bufferedEndAt`, `rangesOf`) | `comparar-97c239d-f37d906.txt`: **verde**, las 174 declaraciones en otro orden, 7 claves del global |
| `1dd6247` | `lib/media.js`: `attachPlain` (las ramas de imagen y MP4 de `attachAsset`), `watchFirstLoad`, `FIRST_REQUEST_TIMEOUT_MS`, `RETRY_WITH_GET`, `firstRequest`, `requestOnce`; `test/plain-media.test.js` | `comparar-f37d906-1dd6247.txt`: rojo **sólo** en `attachAsset` (cambió) y `attachPlain` (nueva), 3 por demo; el resto idéntico |

En cada commit: `npm test` verde (378, y 384 con los 6 de `plain-media`), `npm run check` verde
(la costura 0003 sin líneas aceptadas nuevas).

## Por qué el comparador contra `bb0d78b` no da verde

`comparar-bb0d78b-1dd6247.txt` da rojo en las declaraciones renombradas y las que las llaman
(`createSignalling`, `pendingFirstRequests`, `resolveWithFirstRequests`, `resolvePostRoll`), en
`attachAsset`/`attachPlain`, y en el test de `stage-pair` (importa el nombre nuevo). Dos causas, las
dos inevitables con lo que pidió el diseño:

1. **El nombre cruzaba la costura.** `resolveAssetList` y `assetListUrl` contienen `assetlist`, uno
   de los términos del grep del ADR 0003 sobre `lib/`. Subirlos con el nombre exigía aceptar líneas
   en la costura; se renombraron. El comparador no admite renombres, así que el renombre va en su
   commit y su testigo es la reproducción por sed.
2. **Las ramas de `attachAsset` no se pueden subir sin cambiar `attachAsset`.** Es la única
   declaración con código distinto. Equivalencia: el orden de decisión es el mismo (imagen → si es
   HLS, hls.js → si no, progresivo); `isHls` se evalúa ahora también para una imagen, y es una regex
   pura que no tira con `uri` nulo. Las ramas que subieron tienen tests nuevos (6), cada uno visto
   fallar:

```
streaming ignorado -> ℹ fail 1
startAt roto -> ℹ fail 2
frase imagen -> ℹ fail 1
detach sin load -> ℹ fail 1
settle no es una vez -> ℹ fail 2
```

La prueba en un browser de que las demos HLS hacen lo mismo con el `attachAsset` nuevo es la de T-08
y T-10 (los panes HLS de `stage-pair` montan HLS, PNG y MP4).

## Lo que el instrumento vio

- Un renombre de más (`assetList` en todo el archivo, incluido `event.assetList` de hls.js) lo
  agarró la suite: `both-classes.test.js` en rojo. Se acotó a las líneas de las funciones que suben.
- El build sin `lib/ad-list.js` y `lib/playhead.js` en `FUENTES` pasó `npm run check` y los tests
  (importan los módulos), y lo agarró el comparador: 13 declaraciones faltantes y `evaluating the
  dist failed`.

## `attachAsset`, medido contra el de `bb0d78b`

Pregunta del despacho: ¿cambia lo que hacen las demos HLS? Ningún test de la suite toca
`hls/media.js` (es de browser), así que se midió con un diferencial, `diferencial.mjs`: el
`attachAsset` de `bb0d78b` y el de `1dd6247` sobre las mismas entradas, con un `Hls` falso y nodos
falsos que registran todo (constructor y opciones de `Hls`, suscripciones, `loadSource`,
`attachMedia`, `destroy`, cada `set` y llamada sobre el nodo, `onLoaded`/`onFailed` con su frase), y
la traza entera comparada.

Entradas (`cases.json`): los 50 pares `(type, uri)` que aparecen en las listas de las cinco demos
(cada `uri` de un layout con su `type`, y cada `URI` de asset sin type, que es como llega un default
lineal), más 9 bordes (uri nulo, imagen sin uri, `startAt`, `x-mpegURL` sin extensión, `.m3u8?x`,
type desconocido, `.mp4` sin type, `IMAGE/PNG`). El único archivo de listas que no parsea es
`asset-list-repliegue-json-roto.json`, roto a propósito: nunca llega a `attachAsset`. Escenarios por
entrada (10): `load`, `error`, `loadedmetadata` del nodo; `MANIFEST_LOADED`, 404, timeout, error de
fragmento no fatal y fatal de hls.js; los 10 s del timer; nada. Después, detach y 20 s de timer.

```
590 runs (59 inputs x 10 scenarios), 0 differ
```

Rama que toma cada entrada de las demos (`diferencial-salida.txt`): 39 hls.js, 11 imagen,
9 progresivo.

El instrumento, visto fallar con cuatro mutaciones del código nuevo:

```
mut1 (streaming invertido):            480 differ
mut2 (startAt > 10 en vez de > 0):      10 differ
mut3 (otra frase de fallo del archivo):  8 differ
mut4 (uri vacío no cuenta como cargado): 20 differ
```

(Una primera `mut2`, `startAt > 1`, dio 0: ninguna entrada tiene `startAt` entre 0 y 1. Se cambió
por una que el conjunto de entradas sí distingue.)
