# SVTA2053: la presentación concurrente sobre DASH

Sólo diseño. SVTA2053 cubre DASH desde su primera edición: el esquema
`urn:svta:advertising-wg:ad-creative-signaling` con su payload versionado (§5), llevado en un
EventStream del MPD (§6.1) y en un MPD `type="list"` (§6.5). Lo que la v3 dejó afuera es la
presentación concurrente: "Concurrent presentation in DASH… its DASH carriage is left to a future
edition" (§1, Scope). Esta fase escribe esa carriage y la prototipa. No inventa un mecanismo: usa el
esquema, el sobre de la versión 2 y los datos de §5.3 tal como están, y nombra los huecos donde no
alcanzan.

El modelo de comportamiento es lo que la librería ya hace en HLS (ADR 0104 a 0115); la pregunta de
cada mecanismo es cómo se dice con el esquema de SVTA en un MPD, quién lo resuelve y si dash.js lo
trae.

## Fuentes, y qué está verificado

- **SVTA2053 v3:** el borrador del 2026-10-02 (`sandbox/sgai/2026-10-02-svta-doc-update/borrador.md`),
  que conserva las secciones DASH del original; leídos enteros §1, §4.1, §5 y §6. No hay copia del
  `.docx` vigente en disco; los cambios de David del 2026-10-20/22 se conocen por los ADR 0104 a
  0115, que citan sus secciones (5.3.3, 6.6.4, Table 30/31).
- **DASH:** ISO/IEC 23009-1:2026 (6ª ed.), el PDF licenciado en
  `sandbox/ai-playground/vertex-rag/ISO_IEC_23009-1_2026(en) (1).pdf`, leído con `pdftotext`; cada
  cita de la norma es de ese texto. Control de la búsqueda: `executeOnce` da 9; `ListMPD` da 0 porque
  la norma escribe "List MPD" (5.3.2.6, 8.15).
- **dash.js:** upstream `v5.2.1` (commit `a9a8542`, 2026-08-17), leído en su código; las rutas
  `archivo:línea` son de ese tag. El manejo de los eventos de callback está leído en la copia del fork
  (base 5.2.0), no en el tag.

## Lo que dash.js trae y lo que no (v5.2.1)

| | veredicto | evidencia |
| --- | --- | --- |
| Eventos de MPD de cualquier `schemeIdUri`, despachados a la app | sí | `player.on(scheme, fn, scope, {mode})`, `MediaPlayer.js:532`; rama genérica `EventController.js:510-511` |
| Modos `onReceive` / `onStart` | sí, default `onStart` | `EventBus.js:71,139`; `EventController.js:494,511` |
| Cuerpo del Event | sólo como string | `messageData` = atributo, CDATA o texto (`DashManifestModel.js:1340-1351`); los elementos hijos se parsean pero no llegan al evento |
| `Event@id` | numérico | `parseInt` (`DashManifestModel.js:1335`): un id no numérico queda `NaN` |
| `messageData` en el tiempo | se borra a los 10 s | `deleteEventMessageDataTimeout`, `Settings.js:385` |
| Eventos de callback (`urn:mpeg:dash:event:callback:2015`) | los pide el propio dash.js | `EventController.js:887,951` en el fork (base 5.2.0); en el tag 5.2.1, no verificado |
| Alternative MPD (Insert/Replace), List MPD | **no** | 0 archivos de código con `alternativeMPD`, `InsertPresentation`, `ReplacePresentation`, `ImportedMPD`; `docs/.../index_features.md:23`: SGAI "Not supported" |
| Varios `MediaPlayer` en una página | sí | contexto por instancia, `MediaPlayerFactory.js:44-45`; sample `auto-load-multi-video.html` |
| MP4 progresivo | no (va en un `<video src>` nativo) | `ManifestLoader.js:97,102` |
| Interceptar el pedido y la respuesta del MPD | sí | `addRequestInterceptor` / `addResponseInterceptor`, `MediaPlayer.js:1966,1988` |
| XLink | sólo `onLoad` | `XlinkController.js:81,152,162` |

El fork `github.com/qualabs/dash.js` (en `sandbox/clients/comcast/.../sgai-demo/dash.js`, base 5.2.0)
sí tiene Alternative MPD, List MPD y overlays sobre SCTE-214. No es upstream y está atrás de él.

## Las dos opciones

Hay dos caminos para la presentación concurrente en DASH, y el objetivo es tener los dos para
compararlos.

- **SVTA2053**, el de esta fase: el esquema y el payload JSON de SVTA en un EventStream, la
  continuación de §6.1 y §6.6 del mismo documento.
- **sgai-for-mpeg-dash**, el camino propio de DASH: un documento XML (`OverlayList`) sobre las
  construcciones de MPEG. Queda para después.

La comparación de requisitos entre los dos está en curso, y va a quedar en
`projects/sgai-for-mpeg-dash/output-analysis/2026-10-26-gap-hls-v3-vs-dash-reqs.md`.

## 1. La tabla

"Directo": SVTA2053 o la norma ya lo dicen. "Adaptado": está, pero hay que decir cómo aplica a lo
concurrente. "Hueco": no tiene dónde ir en el esquema de SVTA; la propuesta va en la sección 3.

| mecanismo | HLS hoy | DASH con el esquema de SVTA | lo resuelve | entra |
| --- | --- | --- | --- | --- |
| Qué es el corte | `CLASS="com.qualabs.hls.concurrentInterstitial"` (`hls/signalling.js:23`, ADR 0009); en la spec, `com.svta.hls.concurrentInterstitial` (6.6.1) | `EventStream@schemeIdUri="urn:svta:advertising-wg:ad-creative-signaling"`, `@value` omitido (§5, Table 24). Lo concurrente lo dice el payload: un Slot con `options` (4.4.2, 5.3). **Directo**; la marca para lectores viejos es un **hueco** (decisión 2) | MPD | sí |
| ID del corte | `ID` string | `Event@id`, "unique for the containing manifest" (Table 25), numérico para dash.js. **Directo** | MPD | sí |
| Inicio | `START-DATE` contra `EXT-X-PROGRAM-DATE-TIME` (`mediaTimeOf`) | `Event@presentationTime` relativo al Period, con `@presentationTimeOffset` y `@timescale` (Tables 24 y 25). **Directo** | MPD + player | sí |
| Largo | `PLANNED-DURATION` / `DURATION` | `Event@duration` (Table 25), la ventana del corte. Un evento termina en el fin de su Period (23009-1, 5.10.2.1). **Directo** | MPD | sí |
| Dónde está la lista | `X-ASSET-LIST` | Cuerpo del Event: el sobre v2 de tipo `pod` (Table 18) en CDATA (Table 25), con los slots adentro o en `$remote.slots` (5.2.2.2). **Directo** | MPD | sí |
| La lista | ASSET-LIST de RFC8216bis Ap. D, un `X-AD-CREATIVE-SIGNALING` por asset (6.4, 6.6.3) | Un sobre v2 de tipo `slot`, cada Slot con sus `options` (5.3.3), que es lo que `$remote.slots` devuelve. Los URIs de media apuntan a MPD, MP4 o PNG. **Directo** | servidor de la lista | sí |
| Default lineal | el `URI` del asset (6.6.4, Table 30) | `Slot.media` (4.4.3), que 4.1 hoy no permite en el esquema. **Hueco** (decisión 3) | payload + player | sí |
| Capacidades `sgai-*`, `sendCapabilities` | `lib/capabilities.js`, ADR 0104 | Iguales, en el pedido de `$remote.slots`; 5.3.3 hoy las define para el pedido del ASSET-LIST. **Adaptado** | player | sí |
| `layoutOptions` y selección | `selectOption`, ADR 0105 | Igual (5.3.3) | player | sí |
| Failover por primera carga | renderer `nextAfterFailure`, `hls/media.js` `attachAsset` con `onLoaded`/`onFailed`, ADR 0107 | Igual; la primera carga de un MPD es el pedido del MPD. Detectarla con los errores de dash.js: **no verificado** | player (`dash/media.js`) | sí |
| Pre-validación opcional | `firstRequest`, `preValidateAssets`, ADR 0107 | Igual (un `fetch` del MPD) | player | sí |
| Cuándo se pide la lista | la regla de hls.js: buffer hasta el break (`assetListDue`, ADR 0108/0109) | 5.2.2.2.2: se demora hasta que el Pod está por volverse activo. El número sale de 23009-1: `@earliestResolutionTimeOffset`, 60 s por default (Table 63). **Adaptado** (decisión 5) | player | sí |
| Barra con los breaks antes de su lista | rangos `provisional` del tag (ADR 0108) | Rango del `Event@duration`, con todos los eventos del MPD al cargar (VOD) | player | sí |
| `CUE="PRE"` / `"POST"` / `"ONCE"` | ADR 0110, 0111, 0112 | El esquema no tiene dónde decirlo. **Hueco** (decisión 4) | MPD + player | sí |
| Clase elegida por URL (`?adclass=`) | `EXT-X-DEFINE:QUERYPARAM`, ADR 0113 | No hay sustitución de variables en atributos del MPD ("QUERYPARAM": 0; Annex I sólo parametriza pedidos, I.1). **Hueco** | — | no |
| Las dos clases en un player | hls.js reproduce el interstitial de Apple, la librería dibuja las suyas (ADR 0114) | El lineal tradicional es `ReplacePresentation` (5.16.4) o `InsertPresentation` (5.16.3, sólo `static`). dash.js upstream no ejecuta ninguno. **Hueco en dash.js**; ver decisión 6 | player (librería) | sí, Replace |
| Corte lineal fijo en el stream | `CLASS="com.apple.hls.interstitial"` escrito, ADR 0115 | Un evento `urn:mpeg:dash:event:alternativeMPD:replace:2025` con `ReplacePresentation@uri` al MPD del lineal y `@maxDuration` (Tables 61-63) | MPD | sí |
| Prioridad del lineal ante solapamiento | mientras hay lineal no se dibuja nada nuestro (ADR 0114) | Igual. Replace no muestra el principal y su tiempo avanza (5.16.1) | player | sí |
| Multi view | `MULTIVIEW_CLASS`, ADR 0063 | Mismo esquema y mismo sobre: `multiView` es un PresentationType (4.3.1, 5.3.4) | MPD + player | no |
| `X-PLAYOUT-LIMIT`, `skipTiming` | no implementados (Table 31) | `@maxDuration` sólo existe para Alternative MPD (Table 63) | — | no |
| Tracking | `lib/tracking.js`, de lo presentado (ADR 0093) | Igual, desde `Slot.tracking`. Los eventos de callback que usa 6.5 (Table 27) no sirven acá: se piden a su hora se presente o no el creativo, y dash.js los pide solo | player | sí, sin cambios |
| Live | preroll en el punto de unión, simulado (ADR 0110) | MPD `dynamic`, updates o `emsg` con `InbandEventStream` (5.10.3.2) | — | no |

## 2. Qué va en `dash/` y qué se reusa

**Sin tocar, de `lib/`:** `experience.js`, `capabilities.js`, `renderer.js`, `controls.js`,
`multiview.js`, `tracking.js`, `postroll.js`.

**Sube de `hls/` a `lib/`, cada uno en su commit** (`dash/README.md`, ADR 0116-0118, con `npm run
check` y `scripts/comparar-publicacion.mjs` de testigos): las funciones de `hls/signalling.js` que
leen la lista y no el transporte (`BLOCK`, `usableUri`, `resolveAssetList`,
`pendingFirstRequests`, `resolveWithFirstRequests`, `resolvePostRoll`, `assetListUrl` y sus dos
parámetros) y los auxiliares que el ADR 0117 dejó esperando un segundo lector (`onceProgress`,
`postRollDue`, `bufferedEndAt`); de `hls/media.js`, `firstRequest`, `FIRST_REQUEST_TIMEOUT_MS` y las
ramas de imagen y MP4 progresivo de `attachAsset`. Sus comentarios se reescriben sin vocabulario HLS.

**Nuevo en `dash/`:**

- `dash/signalling.js`: se suscribe con `onReceive` al esquema de SVTA y al de Replace; convierte
  cada Event en rango (`presentationTime`, `timescale`, `presentationTimeOffset`, fin del Period);
  lee el cuerpo **al recibirlo** (dash.js lo borra a los 10 s); descarta los sobres sin
  `options` (son señalización de 6.1, no presentaciones); resuelve `$remote.slots` con los `sgai-*`;
  aplica `cue`; y entrega el contrato del ADR 0003 igual que `hls/signalling.js`. Para reusar
  `resolveAssetList` sin cambiarlo, arma con los slots la forma que esa función ya lee: un asset por
  Slot, con `URI` de `Slot.media` y `DURATION` de `Slot.duration`.
- `dash/media.js`: `attachAsset` para `application/dash+xml` con un `MediaPlayer` por elemento, con
  la misma firma y los mismos `onLoaded`/`onFailed`; imagen y MP4 de `lib/`.
- `dash/concurrent-dash.js`: `attach(player, {...})` con las mismas opciones que el de HLS.
- `vendor/dash.all.min.js` v5.2.1 con su licencia, y un dist propio
  (`dist/qualabs-concurrent-dash.js`), para que el de HLS no cambie más que por lo que sube a `lib/`.
- `dash/*.js` entra a la costura del ADR 0015 y a `demos-cambiadas.sh`, como dice `dash/README.md`.

## 3. Decisiones

### Decisión 1 — El cuerpo del Event es el sobre v2 de SVTA, un `pod` por corte

Un Event por corte, como un `EXT-X-DATERANGE` por corte en 6.6. Su cuerpo es un sobre de la
versión 2 de tipo `pod` (Table 18), en CDATA como manda Table 25. El Pod lleva sus slots de una de
dos formas que la versión 2 ya define:

- **adentro**, en `slots`, cada Slot con sus `options` (5.3.3);
- **remotos**, en `$remote.slots` (Table 19), un URI que devuelve un sobre de tipo `slot`, con
  `features.remoteFields: true`.

La forma remota es el equivalente del ASSET-LIST: el pedido sale del player, lleva las capacidades
del dispositivo y deja decidir el corte en el momento. El prototipo usa la remota en todos los
cortes, para que el par HLS/DASH pida lo mismo; la forma de adentro se prueba con fixtures.

```xml
<EventStream schemeIdUri="urn:svta:advertising-wg:ad-creative-signaling" timescale="1000">
  <Event id="2" presentationTime="45000" duration="12000"><![CDATA[{"version":2,"type":"pod",
    "features":{"remoteFields":true,"concurrentPresentation":true},"cue":["ONCE"],
    "payload":[{"duration":12,"$remote":{"slots":"/signalling/dash/slots-break-b.json"}}]}]]></Event>
</EventStream>
```

| descartada | por qué |
| --- | --- |
| Un cuerpo propio que sólo apunta a una lista (`{"id","assetList","cue"}`) | inventa un formato al lado del de SVTA, y el ASSET-LIST es un objeto de HLS |
| Extender §6.5: un evento Alternative MPD a un MPD `type="list"` con `ImportedMPD` y el EventStream | Alternative MPD reemplaza o inserta, no compone; haría falta un modo concurrente que MPEG no define, y dash.js upstream no ejecuta ni Alternative MPD ni List MPD. Es, en los hechos, el otro camino |
| El `OverlayList` XML de `sgai-for-mpeg-dash` | es la segunda opción (Las dos opciones) |
| `@messageData` | deprecado y `prohibited` en el XSD de la 6ª ed. (23009-1, Table 44); Table 25 ya usa el cuerpo |

### Decisión 2 — Ni versión nueva ni `@value`: un flag en `features`

Alcanza con la versión 2. §5 ya dice que los datos de 5.3 van en el sobre de la versión 2, y una
versión 3 rompería a todo lector de la 2 sin cambiar nada de la estructura ("implementers MUST NOT
assume future data versions are structurally compatible", 5.1).

El riesgo real es otro: un lector de §6.1 que hace tracking con lo que recibe contaría una impresión
de un concurrente que nunca dibujó. En HLS eso lo evita la clase propia (6.6.5). En DASH lo evita
el mecanismo que la versión 2 ya tiene para esto: un flag en `features` que el lector que no lo
soporta trata como error e ignora el payload (5.2.2.1). La propuesta es
`features.concurrentPresentation`, obligatorio en `true` en la carriage de 6.7.

`@value` no se usa: Table 24 lo pide omitido, partiría el esquema en dos EventStreams por Period, y
un lector que no mira `@value` leería el payload igual, así que no protege nada que el flag no
proteja.

### Decisión 3 — El default lineal es `Slot.media`

En HLS el default lineal es el `URI` del asset (Table 30). En el sobre de DASH no hay asset: el
lugar que el modelo ya tiene para la media de un creativo es `Slot.media` (4.4.3), con un MPD,
`application/dash+xml`. Un Slot sin `media` es un corte sin default lineal, como el asset sin `URI`
de 6.6.4. **Hueco:** 4.1 prohíbe referenciar la media de un slot en el esquema, con una excepción
para los assets del layout. La propuesta es extender esa excepción a la media de un slot
concurrente, que tampoco está en la línea de tiempo cosida.

### Decisión 4 — PRE, POST y ONCE: una clave `cue` en el sobre, con el vocabulario de HLS

El esquema no tiene dónde decir cuándo se ejecuta un corte respecto de la reproducción, y un Event
genérico no tiene atributos para eso. **Hueco:** la propuesta es una clave `cue` en el sobre,
definida para la carriage de 6.7, con los valores de `CUE` de HLS. Va en el sobre y no en el Pod
porque es una cuestión de la carriage, no del modelo del aviso. La librería aplica las reglas de
los ADR 0110-0112 tal cual: el pre-roll va donde arranca la reproducción, el post-roll nunca es no
lineal, el ONCE sale después de haber entrado y salido. Los nombres de 23009-1 (`@executeOnce`)
tienen otra semántica de conteo (5.16.2.2) y sólo existen para Alternative MPD.

### Decisión 5 — La lista remota se pide 60 s antes, la regla de SVTA con el número de la norma

En HLS se siguió a hls.js porque hls.js pide listas. dash.js no pide nada de esto. SVTA da la regla:
demorar la resolución remota hasta que el objeto está por volverse activo (5.2.2.2.2); 23009-1 da el
número para la misma situación en Alternative MPD: `@earliestResolutionTimeOffset`, 60 s por
default (Table 63). La librería pide `$remote.slots` cuando el playhead está a 60 s del inicio, o al
entrar en la ventana por un seek. El pre-roll se pide al cargar.

### Decisión 6 — El lineal tradicional lo ejecuta la librería, sobre dash.js sin modificar

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

### Decisión 7 — Sin `?adclass=` en el prototipo

No hay mecanismo de DASH que cambie el esquema de un evento según el cliente (tabla, fila
"Clase elegida por URL"). Las dos caras del par son nuestra librería, así que las dos leen el
esquema de SVTA. Cómo se publica un stream para lectores de las dos clases es la pregunta abierta 5.

### Decisión 8 — La demo es `stage-pair`, con DASH como tercer modo de cada pane

El control por pane de la fase 15 ("HLS nativo" o "nuestra librería") suma "DASH, nuestra
librería". Mismos `stage.json`, breaks, capacidades y verificador (`verificar-pares.py`). Lo que se
agrega: el primario empaquetado en fMP4 con su MPD (dash.js no reproduce TS), los creativos en video
como MPD, y un juego de sobres `slot` que `escribir-asset-lists.mjs` escribe desde `stage.json` con
los mismos slots que los ASSET-LIST de HLS, los URIs de los MPD y las mismas gemelas PNG y MP4
(ADR 0096). Hay `ffmpeg`; no hay `MP4Box` ni `shaka-packager`. Las 18 líneas viejas de `demo/`
(REPORT de la fase 18) se corrigen en la misma fase.

## 4. El documento: una subsección de §6 de SVTA2053 y lo que cambia en §5

No es un documento aparte. Se escribe como los cambios a SVTA2053 v3 que la próxima edición
llevaría, con el estilo de 6.6.

**Lo que cambia antes de §6:**

- **Abstract, Versioning y §1 (Scope):** sale "Concurrent presentation in DASH… left to a future
  edition"; entra la carriage DASH de la presentación concurrente.
- **4.1:** la excepción que deja referenciar media en el esquema se extiende a `Slot.media` de un
  slot concurrente (decisión 3).
- **5.2.2.1, Table 18:** la fila `features.concurrentPresentation` (decisión 2).
- **5.2.2.2.2:** una nota de que los slots de un Pod concurrente resueltos por `$remote.slots` son la
  decisión del corte, y que eso no contradice "cannot ultimately change how a stream … has been
  decisioned or stitched", porque el programa no cambia.
- **5.3.1 (Window):** el fin de la presentación hoy se define sólo para HLS; suma el caso DASH
  (6.7.3).
- **5.3.3:** los parámetros de capacidad valen también para el pedido de `$remote.slots`.

**La subsección nueva**, hermana de 6.6:

```
6.7 DASH Concurrent Presentation with EventStream Carriage
  6.7.1 EventStream and Event                 Tables 24 y 25 valen; Code: Period con el evento
  6.7.2 Payload                               sobre v2 `pod`, slots adentro o en $remote.slots,
                                              el flag, Slot.media como default lineal;
                                              Table: claves del sobre propias de 6.7 (`cue`)
  6.7.3 Timing                                presentationTime, timescale, presentationTimeOffset,
                                              Slot.start dentro del Pod, fin del Period
  6.7.4 Remote Resolution and Capability Parameters   cuándo (5.2.2.2.2, 60 s), parámetros de
                                              5.3.3, URIs relativos contra el URL del MPD
  6.7.5 Fallback                              la Table 30 con Slot.media en lugar del URI del asset
  6.7.6 Pre-roll, Post-roll and Once          la clave cue
  6.7.7 Coexistence with Alternative MPD Events   no se solapan; si se solapan, gana el lineal
  6.7.8 Clients That Do Not Implement Concurrent Presentation   el flag (5.2.2.1); lo que ve un
                                              lector de 6.1
7 Reference Implementations (Informative)
  7.1 HLS (hls.js 1.7.2)                      Table 31
  7.2 DASH (dash.js 5.2.1)                    la misma tabla, por sección
```

Y en §10, las tablas y el código nuevos.

## 5. El prototipo: qué prueba, cómo, y qué se ve

**Prueba** que el mismo stream, con los mismos slots y las mismas capacidades, se ve igual en HLS y
en DASH: en cada break (pre, A, B, C, LINEAR, post) los dos panes presentan la misma opción en el
mismo segundo de programa, piden su lista (el ASSET-LIST en HLS, `$remote.slots` en DASH) con los
mismos `sgai-*`, caen igual cuando un asset no carga, y B (ONCE) no vuelve tras un seek.

**Cómo se verifica:**

1. `node --test` sobre las funciones puras de `dash/signalling.js` con MPD de fixture: Event a rango
   (con `timescale` y `presentationTimeOffset`), el sobre con slots adentro y remotos, el flag, la
   conversión a la forma de `resolveAssetList`, `cue`, la regla del pedido y el Replace. Cada test
   se ve fallar una vez rompiendo lo que mide.
2. `npm run check` verde con `dash/*.js` en la costura 0015, y `comparar-publicacion.mjs` diciendo
   que el dist de HLS cambió sólo de orden y comentarios en cada subida a `lib/`.
3. `verificar-pares.py` extendido: HLS-nuestro contra DASH-nuestro en cada combinación de
   capacidades, comparando `presentedAt` y los pedidos. **Control**: dos panes DASH con capacidades
   distintas dan composiciones distintas en B; y un 404 plantado en el MPD de un creativo hace que
   el pane DASH pase a la opción siguiente y el HLS no.

**La demo:** `stage-pair/index.html` con un pane en HLS y otro en DASH, el mismo programa, y la
pestaña de red mostrando el `.m3u8` y el ASSET-LIST de un lado, y el `.mpd` y el sobre `slot` del
otro.

## 6. Lo que no entra, riesgos y preguntas abiertas

**No entra:** live (MPD `dynamic`, updates, `emsg`), `InsertPresentation`, List MPD, multi view en
DASH, `X-PLAYOUT-LIMIT` / `skipTiming` (tampoco en HLS), `?adclass=`, las otras cuatro demos, y el
camino de `sgai-for-mpeg-dash`.

**Riesgos:**

- **Cuándo despacha dash.js un evento de MPD en `onReceive`** (`EventController.js:494`). Si no es
  al cargar, la barra y el pre-roll esperan. Se mide primero, en la primera task.
- **Un lector de 6.1 que no respeta los flags** cuenta impresiones de un concurrente que no dibujó.
  El flag de la decisión 2 lo cubre para el lector conforme a 5.2.2.1; el que no lo es, no.
- **Slots no contiguos.** `resolveAssetList` encadena los assets uno detrás del otro; si un Pod trae
  slots con huecos entre sus `start`, la conversión de `dash/signalling.js` no alcanza. Los cortes
  de la demo son contiguos.
- **Leer `ReplacePresentation` sin API** (decisión 6): depende de la forma interna del manifest de
  dash.js. Si se rompe, el camino es el interceptor de respuesta.
- **Detectar la primera carga fallida** de un creativo MPD con los errores de dash.js: no verificado.
- **Alinear el primario fMP4 con el TS**: el HLS arranca en 0,067 s (ADR 0109); si el MPD de `ffmpeg`
  no tiene el mismo origen, los panes difieren en ese corrimiento y la comparación tiene que saberlo.
- **Varios `MediaPlayer` a la vez**: soportado (fila de la tabla de dash.js), no medido en CPU como
  se midió hls.js en la fase 01.

**Preguntas abiertas** (para Nicolás, y las que son de la spec, para David):

1. **El flag para lectores viejos.** Recomendación: `features.concurrentPresentation` (decisión 2),
   sin versión nueva ni `@value`.
2. **Dónde va el default lineal.** Recomendación: `Slot.media`, extendiendo la excepción de 4.1
   (decisión 3).
3. **`cue` con el vocabulario de HLS, en el sobre.** Recomendación: sí (decisión 4), y que el
   documento diga dónde 23009-1 tiene un nombre parecido con otra semántica.
4. **Los parámetros de capacidad en `$remote.slots`.** Recomendación: que 5.3.3 los extienda a ese
   pedido y 5.2.2.2.2 aclare que la decisión del corte concurrente puede ser remota.
5. **Cómo sirve un publicador a lectores de las dos clases en DASH.** Recomendación: un MPD por clase
   del lado del servidor (el origen o el APS lo eligen por la query, que es como DASH personaliza), y
   que la spec lo diga como el equivalente de 6.6 para `?adclass=`. La alternativa, señalizar el
   break dos veces, hace que un player con las dos clases lo ejecute dos veces.
6. **El lineal tradicional: la librería, el fork o afuera.** Recomendación: la librería (decisión 6).
7. **El nombre del esquema en los ejemplos de SVTA2053.** §5 y Table 24 dicen
   `urn:svta:advertising-wg:ad-creative-signaling`; Code 8, 9 y 13 usan
   `urn:svta:advertising-wg:ad-id-signaling`. Recomendación: la librería se suscribe sólo al de §5, y
   se le avisa a David para corregir los ejemplos.
