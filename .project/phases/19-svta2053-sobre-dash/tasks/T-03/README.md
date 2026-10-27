# T-03 — `dash/signalling.js`

Rama `fase-19`, `28e59e7`. Importa de `lib/experience.js`, `lib/capabilities.js`,
`lib/ad-list.js` y `lib/playhead.js`, nada de `hls/`. Las funciones puras se importan en node sin
dash.js (las usa T-04); `readMpd` necesita DOM y se chequeó en Chrome (T-04).

Lo que el diseño no decía y se decidió acá, con el criterio de sus ADR:

- **La lectura es del texto del MPD en el interceptor** (ADR 0128, por T-01), con `parseMpd`
  inyectable para que el test le pase datos planos.
- **`layoutOptions`, no `options`.** El diseño citaba `Slot.options` del borrador del 2026-10-02; la
  spec vigente y la librería usan `layoutOptions` (ADR 0105, renombre de David del 2026-10-20). El
  sobre `slot` de DASH lleva los mismos Slots que el bloque de HLS.
- **`Slot.media` es `Array<MediaReference>`** (Table 5, 4.4.3): el default lineal es el primero con
  `uri`.
- **`settled`** sigue la semántica de HLS (ADR 0108): un break que todavía no toca está en la lista,
  provisional, y no cuenta como en vuelo.
- **El Replace es `kind: 'interstitial'`** en los rangos, el valor del contrato que la barra ya
  pinta como "traditional interstitial"; y con `executeOnce` es ONCE (ADR 0112).
- **Un pre-roll va en 0**, donde arranca la reproducción de un MPD `static` (ADR 0110). Un MPD
  `dynamic` no se lee (live queda fuera de la fase).

Verificación: T-04.
