# T-04 — Los tests de `dash/signalling.js`, vistos fallar

Rama `fase-19`, `4616a5a`: `test/dash-signalling.test.js` (29 tests) y `test/fixtures/dash/`.
`npm test` 413/413.

**Las fixtures son referencia independiente:** `breaks.mpd` tiene cada caso una vez (pre-roll,
remoto, slots adentro en texto plano, ONCE, post-roll, sobre sin flag, evento recortado por el fin
del Period, timescale 90000 con presentationTimeOffset, Replace con maxDuration menor que su
duración, otro esquema), y `breaks.json` es su lectura escrita a mano: los cuerpos copiados del
texto del MPD por una regex, el resto tipeado. No sale de `readMpd`.

**`readMpd` en Chrome** (`readmpd-en-browser.py`): su lectura de `breaks.mpd` es igual a
`breaks.json`, y el control (la misma comparación con un cuerpo cambiado en un espacio) da distinto:

```
{"same": true, "control": false, "events": 8, "firstBody": "{\"version\":2,\"type\":\"pod\",\"features\":{\"r"}
```

**Un caso a mano:** el evento 6 está en el segundo Period, que empieza en 100 s (fin del primero,
`@duration` PT100S); `(4950000 - 900000) / 90000 = 45` s adentro, o sea **145 s**, y
`1080000 / 90000 = 12` s de largo. El test `an Event is placed by its timescale…` lo afirma.

**Mutaciones** (`mutaciones.py`): una ruptura por regla, corriendo sólo los tests de esa regla
(`--test-name-pattern`):

| ruptura | tests corridos (patrón) | pass | fail | |
| --- | --- | --- | --- | --- |
| sin presentationTimeOffset | `presentationTimeOffset of its stream` | 0 | 1 | ROJO |
| sin recorte al fin del Period | `ends at the end of its Period` | 0 | 1 | ROJO |
| sin el flag de 0121 | `without features.concurrentPresentation` | 0 | 1 | ROJO |
| features desconocidas aceptadas | `a feature this reader does not implement` | 0 | 1 | ROJO |
| slots no contiguos aceptados | `hole or an overlap` | 0 | 1 | ROJO |
| start del slot sin poner en 0 | `one asset per slot` | 0 | 1 | ROJO |
| pedido a 60 s exclusivo | `60 s before the break` | 0 | 1 | ROJO |
| break terminado se pide igual | `a seek into the window` | 0 | 1 | ROJO |
| maxDuration ignorado | `the breaks of the MPD` | 0 | 1 | ROJO |
| el lineal no gana | `drawn alone` | 0 | 1 | ROJO |
| cue sensible a mayúsculas | `the cue takes the values` | 0 | 1 | ROJO |
| ONCE no se gasta | `a ONCE break leaves` | 0 | 1 | ROJO |
| post-roll sin esperar el fin | `post-roll waits` | 0 | 1 | ROJO |
| Period sin encadenar | `a Period begins` | 0 | 1 | ROJO |
| sobre remoto sin validar el tipo | `\$remote.slots has to answer` | 0 | 1 | ROJO |
| capacidades no viajan | `at load: every break` | 0 | 1 | ROJO |

Lo que los tests hicieron ver de mi lado: dos expectativas mías estaban mal y el código bien. El
break de 45 s se pide al cargar porque está a menos de 60 s (ADR 0124), y `settled` es `true` con
breaks esperando, como en HLS.
