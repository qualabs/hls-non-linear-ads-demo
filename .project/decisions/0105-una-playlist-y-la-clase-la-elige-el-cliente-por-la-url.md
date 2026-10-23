---
id: "0105"
title: Un juego de tags por stream, y la clase de cada break la elige el cliente con un parámetro de la URL (EXT-X-DEFINE QUERYPARAM)
status: accepted
scope: project
date: 2026-10-22
supersedes: "0007"
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Hasta acá había dos formas de servir los dos clientes: el ADR 0007 (en `compatibility-pair`)
ponía dos tags por break, uno de cada clase, en el mismo START-DATE de la misma playlist; el ADR
0090 (en `stage-pair`) escribía dos playlists, una por clase. El 2026-10-22 David Hassoun decidió,
por el coordinador:

- **(a)** Un stream lleva UN juego de Date Ranges. Las clases pueden mezclarse en un stream pero
  no se pueden solapar en el tiempo; si se solapan, el player los resuelve "como siempre" (dos
  Date Ranges a la vez, que está mal, sin manejo especial).
- **(b)** La clase se elige por player con sustitución de variables de HLS:
  `EXT-X-DEFINE:QUERYPARAM` en la playlist y `CLASS="{$…}"` en los breaks. Cada player carga la
  MISMA URL estática con otro parámetro, y hls.js sustituye. Sirve en un bucket estático porque el
  archivo es el mismo y la sustitución pasa en el cliente.

## Lo verificado antes de construir

**La spec** (draft-pantos-hls-rfc8216bis-22, 2026-08-13):

- 4.3: *"The following Playlist elements are subject to variable substitution: URI lines,
  quoted-string AttributeValues, hexadecimal-sequence AttributeValues"*. `CLASS` y
  `X-ASSET-LIST` de EXT-X-DATERANGE son quoted-string, así que se sustituyen.
- 4.4.2 (EXT-X-DEFINE está ahí): *"The tags in this section can appear in either Multivariant
  Playlists or Media Playlists."* IMPORT sólo en media playlists cargadas desde una multivariant.
- 4.4.2.3, QUERYPARAM: *"its value is the value associated with the query parameter of the same
  name in the URI of the Playlist"*; *"If the QUERYPARAM attribute value does not match any query
  parameter in the URI or the matching parameter has no associated value, the parser MUST fail to
  parse the Playlist."*
- 6.3.1: la referencia se sustituye sólo con una variable *"provided by an EXT-X-DEFINE tag that
  precedes the Variable Reference"*; si no, *"MUST trigger a parsing error"*.
- 7: *"A Playlist MUST indicate an EXT-X-VERSION of 11 or higher if it contains: An EXT-X-DEFINE
  tag with a QUERYPARAM attribute."*

**hls.js 1.7.2** (`npm pack`, idéntico byte a byte a `vendor/hls.min.js`), sin flag de
configuración (la sustitución está compilada en el build completo, `__USE_VARIABLE_SUBSTITUTION__`):

- `utils/variable-substitution.ts:59-74`: QUERYPARAM lee `new self.URL(parentUrl).searchParams`;
  si falta, `playlistParsingError` "EXT-X-DEFINE QUERYPARAM: … does not match any query parameter".
- `loader/m3u8-parser.ts:569-571`: `case 'DATERANGE': const dateRangeAttr = new AttrList(value1,
  level); const dateRange = new DateRange(dateRangeAttr, …)`, y `utils/attr-list.ts:136-142`
  sustituye todo valor quoted-string (`substituteVariables(parsed, value)`). O sea, CLASS,
  X-ASSET-LIST y cualquier X- quedan sustituidos ANTES de `details.dateRanges` y del
  interstitials controller (`dateRange.isInterstitial` compara la clase ya sustituida).
- `loader/playlist-loader.ts:736-752`: con error de parseo dispara `LEVEL_PARSING_ERROR` y no usa
  la playlist (salvo `ignorePlaylistParsingErrors`).

Un bucket de GCS sirve el objeto igual con un parámetro desconocido (verificado: 200 y el mismo
`content-type` para `…con-daterange-concurrente.m3u8?adclass=…` en el bucket de `stage-pair`).

## Decisión

- **Un tag por break, con `CLASS="{$adclass}"`, y `#EXT-X-DEFINE:QUERYPARAM="adclass"` antes de
  los tags.** El parámetro se llama `adclass`; su valor es el nombre completo de la clase. Los
  generadores suben `EXT-X-VERSION` a 11.
- **Cada página pasa el parámetro**: el pane de fábrica `?adclass=com.apple.hls.interstitial`, el
  nuestro `?adclass=com.qualabs.hls.concurrentInterstitial` (`QualabsConcurrentHls.CONCURRENT_CLASS`).
  Las páginas que sólo corren nuestro player pasan la nuestra.
- **Sólo los avisos son conmutables.** Las ventanas de multi view son ofertas y no tienen lectura
  de Apple: su clase va escrita.
- **Un tag sirve a las dos lecturas, así que va en la forma de Apple**: reemplazo (sin
  X-RESUME-OFFSET, o `=0` en el break sin default, ADR 0091), sin X-SNAP (hls.js lo aplicaría a la
  lectura de Apple). Leídos con la clase concurrente esos atributos son inertes (ADR 0016).
- **El asset-list es el del break, y lo leen los dos** (lo que queda del ADR 0090): la parte
  estándar la reproduce hls.js, el bloque de encima la librería.
- Por demo:
  - `stage-pair`: `stage.json` pasa de `playlists.{interstitial,concurrente}` a `playlist` +
    `parametroDeClase`; una sola `content/primary/con-daterange.m3u8`; IDs `AD-<break>`. La
    carrera (`race.html`) también define la variable para sus cuatro avisos.
  - `compatibility-pair`: un tag por break con el asset-list concurrente del break; el pane de
    fábrica reproduce su parte estándar. `asset-list-linear.json` deja de ser el lineal de los
    cinco breaks.
  - `hydration-break` y `multiview-offer`: el aviso concurrente usa la variable; la página la
    pide con la nuestra.
  - `race-multiview`: sin cambios; sólo tiene una ventana de multi view, ningún aviso.
- Los tests leen la playlist generada como la lee cada cliente con
  `demo/shared/test/variable-substitution.js`, que aplica las reglas de la spec.

## Consecuencias

- Supersede al ADR 0007 (dos tags por break en la misma playlist) y a la parte "un manifest por
  clase" del ADR 0090. El par de compatibilidad pasa a diferir **sólo en el parámetro de la URL**.
- En `compatibility-pair` el break 5 (48 s, cuatro avisos) ya no se invierte: el pane de fábrica
  reproduce las cuatro partes estándar seguidas, y del 144 al 156 los dos panes muestran el mismo
  lineal. Antes el tag de Apple de cada break apuntaba a un lineal de 12 s propio.
- Una playlist pedida sin el parámetro no se puede usar (la spec lo exige; hls.js da
  `LEVEL_PARSING_ERROR`). Quien abra la URL a mano sin `?adclass=` no ve nada: es el costo.
- La publicación (`scripts/publicar.py http`) verifica además que el bucket sirva la playlist igual con cada parámetro.
