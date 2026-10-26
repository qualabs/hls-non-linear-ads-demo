---
description: Llevar a MPEG-DASH, en dash/ y sobre dash.js sin modificar, los mecanismos de SVTA2053 v3 que la librería implementa en HLS, y mostrar el mismo stream en HLS y en DASH lado a lado
status: designing
category: feature
origin: "Nicolás vía agent-nicolas-laptop-865daf, 2026-10-26, despacho del diseño de la fase 19"
---

# SVTA2053 v3 sobre DASH

Sólo diseño. El modelo es lo que la librería hace en HLS (ADR 0104 a 0115); la pregunta de cada
mecanismo es cómo se dice en un MPD, quién lo resuelve y si dash.js lo trae.

## Fuentes, y qué está verificado

- **DASH:** ISO/IEC 23009-1:2026 (6ª ed.), el PDF licenciado en
  `sandbox/ai-playground/vertex-rag/ISO_IEC_23009-1_2026(en) (1).pdf` (no está en
  `sgai-for-mpeg-dash`, como decía el despacho). Leído con `pdftotext`; cada cita de abajo es de ese
  texto. Control de la búsqueda: `executeOnce` da 9; `ListMPD` da 0 porque la norma escribe "List
  MPD" (5.3.2.6, 8.15).
- **dash.js:** upstream `v5.2.1` (commit `a9a8542`, 2026-08-17), leído en su código por un
  subagente; dos afirmaciones (el `parseInt` del id y "SGAI: Not supported") las volví a leer yo en
  el tag. Las rutas `archivo:línea` son de ese tag.
- **SVTA2053 v3:** no hay copia del `.docx` vigente en disco. La forma del documento sale del
  borrador del 2026-10-02 (`sandbox/sgai/2026-10-02-svta-doc-update/borrador.md`), y los cambios de
  David del 2026-10-20/22 de los ADR 0104 a 0115, que citan las secciones (5.3.3, 6.6.4, Table 30/31).
- **Antecedente:** `sandbox/sgai/2026-10-03-svta-dash-prototipo/borrador.md` (generado por AI, sin
  revisar) y la spec de `sgai-for-mpeg-dash` (`dist/sgai-spec.md`). Se usaron como mapa; ninguna cita
  sale de ellos.

## Lo que dash.js trae y lo que no (v5.2.1)

| | veredicto | evidencia |
| --- | --- | --- |
| Eventos de MPD de cualquier `schemeIdUri`, despachados a la app | sí | `player.on(scheme, fn, scope, {mode})`, `MediaPlayer.js:532`; rama genérica `EventController.js:510-511` |
| Modos `onReceive` / `onStart` | sí, default `onStart` | `EventBus.js:71,139`; `EventController.js:494,511` |
| Cuerpo del Event | sólo como string | `messageData` = atributo, CDATA o texto (`DashManifestModel.js:1340-1351`); los elementos hijos se parsean pero no llegan al evento |
| `Event@id` | numérico | `parseInt` (`DashManifestModel.js:1335`): un id no numérico queda `NaN` |
| `messageData` en el tiempo | se borra a los 10 s | `deleteEventMessageDataTimeout`, `Settings.js:385` |
| Alternative MPD (Insert/Replace), List MPD | **no** | 0 archivos de código con `alternativeMPD`, `InsertPresentation`, `ReplacePresentation`, `ImportedMPD`; `docs/.../index_features.md:23`: SGAI "Not supported" |
| Varios `MediaPlayer` en una página | sí | contexto por instancia, `MediaPlayerFactory.js:44-45`; sample `auto-load-multi-video.html` |
| MP4 progresivo | no (va en un `<video src>` nativo) | `ManifestLoader.js:97,102` |
| Interceptar el pedido y la respuesta del MPD | sí | `addRequestInterceptor` / `addResponseInterceptor`, `MediaPlayer.js:1966,1988` |
| XLink | sólo `onLoad` | `XlinkController.js:81,152,162` |

El fork `github.com/qualabs/dash.js` (en `sandbox/clients/comcast/.../sgai-demo/dash.js`, base 5.2.0)
sí tiene Alternative MPD, List MPD y overlays sobre SCTE-214. No es upstream y está atrás de él.

## 1. La tabla

"Directo": la misma semántica existe en DASH. "Adaptado": DASH lo dice de otra forma o hay que
definirlo en nuestro esquema. "Hueco": no hay equivalente.

| mecanismo | HLS hoy | DASH | lo resuelve | entra |
| --- | --- | --- | --- | --- |
| La clase del corte | `CLASS="com.qualabs.hls.concurrentInterstitial"` (`hls/signalling.js:23`, ADR 0009) | `EventStream@schemeIdUri`, URN o URL (5.10.2.1, Table 43). Propuesto `urn:qualabs:dash:concurrent-interstitial:2026`. **Adaptado**: el reverse-DNS de HLS no es URN | MPD | sí |
| ID del corte | `ID` string | `Event@id` es `xs:unsignedLong` (XSD de 5.10.2.3), único por EventStream (Table 44), y dash.js le hace `parseInt`. **Adaptado**: id numérico en el atributo, el id string en el cuerpo | MPD | sí |
| Inicio | `START-DATE` contra `EXT-X-PROGRAM-DATE-TIME` (`mediaTimeOf`) | `Event@presentationTime` relativo al Period, menos `@presentationTimeOffset`, en `@timescale` (Tables 43 y 44). **Directo**, sin reloj de pared | MPD + player | sí |
| Largo | `PLANNED-DURATION` / `DURATION` | `Event@duration`, cuya interpretación define el dueño del esquema (Table 44). **Directo**. Un evento termina en el fin de su Period (5.10.2.1) | MPD | sí |
| Dónde está el asset-list | `X-ASSET-LIST` | Cuerpo del Event como string (Table 44 recomienda string o XML; `@messageData` deprecado y `prohibited` en el XSD). JSON: `{"id","assetList","cue"}`. **Adaptado** | MPD | sí |
| El asset-list | JSON de RFC8216bis Ap. D + `X-AD-CREATIVE-SIGNALING` (ADR 0004, 0019) | El mismo JSON; los URIs de media apuntan a MPD (`application/dash+xml`), MP4 o PNG. **Directo** | servidor de asset-list | sí |
| Capacidades `concurrentVideo` / `concurrentImage`, `sendCapabilities` | `lib/capabilities.js`, ADR 0104 | Iguales. Los `sgai-*` los agrega la librería; Annex I (`RequestParam`) no aplica porque el pedido no lo hace el cliente DASH (I.1). **Directo** | player | sí |
| `layoutOptions` y selección | `selectOption`, ADR 0105 | Igual | player | sí |
| Failover por primera carga | renderer `nextAfterFailure`, `hls/media.js` `attachAsset` con `onLoaded`/`onFailed`, ADR 0107 | Igual; la primera carga de un MPD es el pedido del MPD. Detectarla con los errores de dash.js: **no verificado** | player (`dash/media.js`) | sí |
| Pre-validación opcional | `firstRequest`, `preValidateAssets`, ADR 0107 | Igual (un `fetch` del MPD) | player | sí |
| Cuándo se pide el asset-list | la regla de hls.js: buffer hasta el break (`assetListDue`, ADR 0108/0109) | dash.js no tiene regla propia (no hace SGAI). La de la norma: `@earliestResolutionTimeOffset`, default 60 s antes del inicio (Table 63). **Adaptado** | player | sí |
| Barra con los breaks antes de su lista | rangos `provisional` del tag (ADR 0108) | Rango del `Event@duration`, con todos los eventos del MPD al cargar (VOD) | player | sí |
| `CUE="PRE"` | `preRollStart`, ADR 0110 | Sin atributo en un Event genérico. La norma lo hace con un evento activo desde 0 que se ejecuta donde arranca la reproducción (G.23; 5.16.4, Table 61). **Adaptado**: `"cue":["PRE"]` en el cuerpo, misma semántica | MPD + player | sí |
| `CUE="POST"` | lineal al terminar o se saltea (`resolvePostRoll`, `lib/postroll.js`, ADR 0111) | Sin equivalente para un evento. MPD chaining (5.11) encadena un MPD al final, pero es otro mecanismo. **Hueco** en la señalización: `"cue":["POST"]`; el reproductor es `lib/postroll.js` sin tocar | player | sí |
| `CUE="ONCE"` | `onceProgress`, ADR 0112 | `@executeOnce` existe sólo para Alternative MPD (Table 63), y cuenta la ejecución iniciada con éxito (5.16.2.2, NOTE 3), no "entró y salió". **Adaptado**: `"cue":["ONCE"]` con la regla de hls.js | player | sí |
| Clase elegida por URL (`?adclass=`) | `EXT-X-DEFINE:QUERYPARAM`, ADR 0113 | No hay sustitución de variables en atributos del MPD ("QUERYPARAM": 0; Annex I sólo parametriza pedidos, I.1). En DASH la clase la elige el cliente al suscribirse (5.10.1). **Hueco** | — | no |
| Las dos clases en un player | hls.js reproduce el interstitial de Apple, la librería dibuja las suyas (ADR 0114) | El lineal tradicional es `ReplacePresentation` (5.16.4) o `InsertPresentation` (5.16.3, sólo `static`). dash.js upstream no ejecuta ninguno. **Hueco en dash.js**; ver decisión 4 | player (librería) | sí, Replace |
| Corte lineal fijo en el stream | `CLASS="com.apple.hls.interstitial"` escrito, ADR 0115 | Un evento `urn:mpeg:dash:event:alternativeMPD:replace:2025` con `ReplacePresentation@uri` al MPD del lineal y `@maxDuration` (Tables 61-63) | MPD | sí |
| Prioridad del lineal ante solapamiento | mientras hay lineal no se dibuja nada nuestro (ADR 0114) | Igual. Replace no muestra el principal y su tiempo avanza (5.16.1) | player | sí |
| Multi view | `MULTIVIEW_CLASS`, ADR 0063 | Otro esquema, `urn:qualabs:dash:multiview-interstitial:2026`, mismo camino | MPD + player | no |
| `X-PLAYOUT-LIMIT`, `skipTiming` | no implementados (Table 31) | `@maxDuration` sólo existe para Alternative MPD (Table 63) | — | no |
| Tracking | `lib/tracking.js`, de lo presentado (ADR 0093) | Igual; el callback de DASH (5.10.4.5) no se usa | player | sí, sin cambios |
| Live | preroll en el punto de unión, simulado (ADR 0110) | MPD `dynamic`, updates o `emsg` con `InbandEventStream` (5.10.3.2). `InsertPresentation` prohibido en `dynamic` (5.16.3) | — | no |

## 2. Qué va en `dash/` y qué se reusa

**Sin tocar, de `lib/`:** `experience.js`, `capabilities.js`, `renderer.js`, `controls.js`,
`multiview.js`, `tracking.js`, `postroll.js`.

**Sube de `hls/` a `lib/`, cada uno en su commit** (`dash/README.md`, ADR 0116-0118, con `npm run
check` y `scripts/comparar-publicacion.mjs` de testigos): las funciones de `hls/signalling.js` que
leen el asset-list y no el transporte (`BLOCK`, `usableUri`, `resolveAssetList`,
`pendingFirstRequests`, `resolveWithFirstRequests`, `resolvePostRoll`, `assetListUrl` y sus dos
parámetros) y los auxiliares que el ADR 0117 dejó esperando un segundo lector (`onceProgress`,
`postRollDue`, `bufferedEndAt`); de `hls/media.js`, `firstRequest`, `FIRST_REQUEST_TIMEOUT_MS` y las
ramas de imagen y MP4 progresivo de `attachAsset`. Sus comentarios se reescriben sin vocabulario HLS.

**Nuevo en `dash/`:**

- `dash/signalling.js`: se suscribe con `onReceive` a los esquemas propios y al de Replace; convierte
  cada Event en rango (`presentationTime`, `timescale`, `presentationTimeOffset`, fin del Period);
  lee el cuerpo **al recibirlo** (dash.js lo borra a los 10 s); PRE, POST y ONCE; cuándo pedir la
  lista (`earliestResolutionTimeOffset`); y entrega el contrato del ADR 0003 igual que
  `hls/signalling.js`.
- `dash/media.js`: `attachAsset` para `application/dash+xml` con un `MediaPlayer` por elemento, con
  la misma firma y los mismos `onLoaded`/`onFailed`; imagen y MP4 de `lib/`.
- `dash/concurrent-dash.js`: `attach(player, {...})` con las mismas opciones que el de HLS.
- `vendor/dash.all.min.js` v5.2.1 con su licencia, y un dist propio
  (`dist/qualabs-concurrent-dash.js`), para que el de HLS no cambie más que por lo que sube a `lib/`.
- `dash/*.js` entra a la costura del ADR 0015 y a `demos-cambiadas.sh`, como dice `dash/README.md`.

## 3. Decisiones

### Decisión 1 — El asset-list es el mismo JSON, y el MPD sólo dice dónde está

El cuerpo del Event es un string JSON `{"id":"AD-B","assetList":"/signalling/...json","cue":["ONCE"]}`.
Lo que la librería ya resuelve (opciones, capacidades, failover, default lineal) no cambia, y el
cuerpo string es lo único que dash.js le entrega a la app. Es también la forma de la carriage DASH
que SVTA2053 ya tiene (6.1, Table 25: el JSON "as a string").

| descartada | por qué |
| --- | --- |
| Un elemento XML hijo con `@uri` (la forma de `sgai-for-mpeg-dash`, `<svta:OverlayPresentation>`) | dash.js no lo entrega; habría que parsear el MPD en la librería |
| El bloque entero en el cuerpo, sin asset-list | los `sgai-*` no llegarían al APS y el corte no se podría decidir en el momento |
| `@messageData` | deprecado y `prohibited` en el XSD de la 6ª ed. (Table 44) |

### Decisión 2 — PRE, POST y ONCE se escriben con el vocabulario de HLS

`"cue"` lleva los valores de `CUE` y la librería aplica las reglas de los ADR 0110-0112 tal cual: el
pre-roll va donde arranca la reproducción, el post-roll nunca es no lineal, el ONCE sale después de
haber entrado y salido. Los nombres de la base (`@executeOnce`) tienen otra semántica de conteo
(5.16.2.2) y sólo existen para Alternative MPD.

### Decisión 3 — El asset-list se pide con la regla de la norma, no con la de un player

En HLS se siguió a hls.js porque hls.js pide listas. dash.js no pide nada de esto, y la norma sí da
una regla: `@earliestResolutionTimeOffset`, 60 s por default (Table 63). La librería pide la lista
cuando el playhead está a esa distancia del inicio, o al entrar en la ventana por un seek. El
cuerpo puede traer `earliestResolutionTimeOffset` en segundos. El pre-roll se pide al cargar.

### Decisión 4 — El lineal tradicional lo ejecuta la librería, sobre dash.js sin modificar

dash.js upstream no ejecuta `ReplacePresentation`. La semántica de Replace (el principal no se
muestra y su tiempo avanza, 5.16.1) es la misma que la del default lineal que la librería ya dibuja
a cuadro entero sobre un programa que no se detiene (ADR 0016, 0107). Así que `dash/signalling.js`
se suscribe a `urn:mpeg:dash:event:alternativeMPD:replace:2025`, lee `@uri`, `@maxDuration` y
`@executeOnce` del Event, y lo entrega como una experiencia lineal que gana sobre cualquier otra
(ADR 0114). Sólo Replace: Insert corre el programa y no existe en `dynamic`.

Cómo se leen esos atributos es un riesgo: dash.js no los pasa en el evento, y el camino es
`event.eventStream.period.mpd.manifest...`, que no es API (o leer el MPD en un
`addResponseInterceptor`).

| descartada | por qué |
| --- | --- |
| El fork `qualabs/dash.js`, que ya lo trae | es un fork en 5.2.0, atrás de upstream; HLS se hizo sobre hls.js sin modificar |
| Dejar el lineal afuera | el par HLS/DASH dejaría de mostrar el mismo stream en el corte `LINEAR` |

### Decisión 5 — Sin `?adclass=` en el prototipo

No hay mecanismo de DASH que cambie el esquema de un evento según el cliente (tabla, fila
"Clase elegida por URL"). Las dos caras del par son nuestra librería, así que las dos leen nuestra
clase. Cómo se publica un stream para lectores de las dos clases es la pregunta abierta 4.

### Decisión 6 — La demo es `stage-pair`, con DASH como tercer modo de cada pane

El control por pane de la fase 15 ("HLS nativo" o "nuestra librería") suma "DASH, nuestra
librería". Mismos `stage.json`, breaks, capacidades y verificador (`verificar-pares.py`). Lo que se
agrega: el primario empaquetado en fMP4 con su MPD (dash.js no reproduce TS), los creativos en video
como MPD, y un juego de asset-lists DASH que `escribir-asset-lists.mjs` escribe desde `stage.json`
con los URIs de los MPD y las mismas gemelas PNG y MP4 (ADR 0096). Hay `ffmpeg`; no hay
`MP4Box` ni `shaka-packager`. Las 18 líneas viejas de `demo/` (REPORT de la fase 18) se corrigen
en la misma fase.

## 4. El documento, al estilo de SVTA2053 v3

Una sección nueva hermana de la 6.6, y su fila en la sección 7. Lo de 4 y 5 (modelo, sobre, 5.3)
vale tal cual y no se repite.

```
6.7 DASH Concurrent Presentation with ASSET-LIST Carriage
  6.7.1 EventStream and Event            Table: atributos (como Table 28); Code: Period con el evento
  6.7.2 Event Body                       Table: id, assetList, cue, earliestResolutionTimeOffset
  6.7.3 Timing                           presentationTime, timescale, presentationTimeOffset, fin del Period
  6.7.4 ASSET-LIST Request               cuándo (Table 63) y parámetros de capacidad (5.3.3)
  6.7.5 ASSET-LIST Processing and Sequencing   remite a 6.6.3; URIs de media en MPD
  6.7.6 Asset Load Failure and Fallback  remite a 5.3.3 y 6.6.4; el default lineal con semántica Replace (5.16.4)
  6.7.7 Pre-roll, Post-roll and Once     la clave cue
  6.7.8 Coexistence with Alternative MPD Events   no se solapan; si se solapan, gana el lineal
  6.7.9 Class Selection per Client       el hueco, y qué hace un publicador
  6.7.10 Clients That Do Not Implement the Scheme  ignoran el EventStream (5.10.1)
7 Reference Implementations (Informative)
  7.1 HLS (hls.js 1.7.2)                 Table 31
  7.2 DASH (dash.js 5.2.1)               la misma tabla, por sección
```

## 5. El prototipo: qué prueba, cómo, y qué se ve

**Prueba** que el mismo stream, con los mismos asset-lists y las mismas capacidades, se ve igual en
HLS y en DASH: en cada break (pre, A, B, C, LINEAR, post) los dos panes presentan la misma opción en
el mismo segundo de programa, piden el mismo asset-list con los mismos `sgai-*`, caen igual cuando
un asset no carga, y B (ONCE) no vuelve tras un seek.

**Cómo se verifica:**

1. `node --test` sobre las funciones puras de `dash/signalling.js` con MPD de fixture: Event a rango
   (con `timescale` y `presentationTimeOffset`), cuerpo, PRE/POST/ONCE, la regla del pedido y el
   Replace. Cada test se ve fallar una vez rompiendo lo que mide.
2. `npm run check` verde con `dash/*.js` en la costura 0015, y `comparar-publicacion.mjs` diciendo
   que el dist de HLS cambió sólo de orden y comentarios en cada subida a `lib/`.
3. `verificar-pares.py` extendido: HLS-nuestro contra DASH-nuestro en cada combinación de
   capacidades, comparando `presentedAt` y los pedidos. **Control**: dos panes DASH con capacidades
   distintas dan composiciones distintas en B; y un 404 plantado en el MPD de un creativo hace que
   el pane DASH pase a la opción siguiente y el HLS no.

**La demo:** `stage-pair/index.html` con un pane en HLS y otro en DASH, el mismo programa, y la
pestaña de red mostrando el `.m3u8` de un lado y el `.mpd` del otro.

## 6. Lo que no entra, riesgos y preguntas abiertas

**No entra:** live (MPD `dynamic`, updates, `emsg`), `InsertPresentation`, List MPD, multi view en
DASH, `X-PLAYOUT-LIMIT` / `skipTiming` (tampoco en HLS), `?adclass=`, las otras cuatro demos, y
reconciliar este esquema con el de `sgai-for-mpeg-dash`.

**Riesgos:**

- **Cuándo despacha dash.js un evento de MPD en `onReceive`** (`EventController.js:494`). Si no es
  al cargar, la barra y el pre-roll esperan. Se mide primero, en la primera task.
- **Leer `ReplacePresentation` sin API** (decisión 4): depende de la forma interna del manifest de
  dash.js. Si se rompe, el camino es el interceptor de respuesta.
- **Detectar la primera carga fallida** de un creativo MPD con los errores de dash.js: no verificado.
- **Alinear el primario fMP4 con el TS**: el HLS arranca en 0,067 s (ADR 0109); si el MPD de `ffmpeg`
  no tiene el mismo origen, los panes difieren en ese corrimiento y la comparación tiene que saberlo.
- **Varios `MediaPlayer` a la vez**: soportado (fila de la tabla de dash.js), no medido en CPU como
  se midió hls.js en la fase 01.

**Preguntas abiertas** (para Nicolás, y las que son de la spec, para David):

1. **Nombres de los esquemas.** Recomendación: `urn:qualabs:dash:concurrent-interstitial:2026` hasta
   que SVTA publique uno, con la forma `urn:svta:dash:<construct>:<año>` que usa `sgai-for-mpeg-dash`.
2. **Cuerpo JSON contra elemento XML.** Recomendación: JSON (decisión 1). Si el WG prefiere XML, la
   librería tiene que parsear el MPD por su cuenta.
3. **Vocabulario `cue` de HLS o nombres de la base.** Recomendación: `cue` (decisión 2), y que el
   documento diga dónde la base tiene un nombre parecido con otra semántica.
4. **Cómo sirve un publicador a lectores de las dos clases en DASH.** Recomendación: un MPD por clase
   del lado del servidor (el origen o el APS lo eligen por la query, que es como DASH personaliza), y
   que la spec lo diga como el equivalente de 6.6 para `?adclass=`. La alternativa, señalizar el
   break dos veces, hace que un player con las dos clases lo ejecute dos veces.
5. **El lineal tradicional: la librería, el fork o afuera.** Recomendación: la librería (decisión 4).
6. **Cuándo pedir el asset-list.** Recomendación: la regla de Table 63 con su default de 60 s
   (decisión 3), no imitar el buffer de hls.js.
7. **La divergencia con `sgai-for-mpeg-dash`**, que resuelve con un documento XML propio
   (`OverlayList`) y no con el asset-list JSON. Recomendación: este prototipo sigue a SVTA2053 v3 y
   la reconciliación queda para el WG, con este prototipo como evidencia.
