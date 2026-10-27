# T-09 — El texto para SVTA2053

Rama `fase-19`, `2719f87`: `docs/svta2053-dash-concurrent-presentation.md` (≈455 líneas, en inglés).
Lo redactó un subagente con las fuentes nombradas; lo revisé y completé la 7.2 con T-08.

- Cambios a Abstract, Versioning, §1, §2, §3, 4.1, Table 18 (`features.concurrentPresentation`),
  5.2.2.2.2, 5.3.1 y 5.3.3; la 6.7 nueva (6.7.1 a 6.7.8, Tables 31-32, Code 15-16); §7 partido en
  7.1 (la Table 31 vieja) y 7.2 (Table 34); §9 a la 6ª edición de 23009-1; §10.
- **Citas:** `citas.txt`, 63 bloques grep con su salida, ninguno sin match: 37 contra el borrador
  v3, 15 contra la 23009-1:2026 (`pdftotext`), 5 contra los ADR que citan texto de la edición
  vigente (`layoutOptions`, 5.3.3), 6 contra T-01 y el código. Límite: los bloques de 5.3.3 se
  escriben contra texto de la edición vigente que sólo está citado en los ADR, no en disco.
- **Notas para David:** preguntas 5 (un MPD por clase) y 7 (`ad-id-signaling` en Code 8, 9 y 13), el
  bug de CDATA de dash.js 5.2.1, y que el borrador en disco todavía dice `options`.

Lo que la 7.2 declara como no hecho, y es cierto del código: sólo se lee el primer Pod;
`@executeOnce` se lee como ONCE y no con el conteo de 5.16.2.2; `@returnOffset`, `@clip`,
`@startWithOffset`, `@earliestResolutionTimeOffset` y `@noJump` no se leen; y **los URIs relativos
de adentro de un sobre devuelto se resuelven contra la página y no contra la URL del sobre**. Esto
último vale igual para HLS (la librería pasa el `uri` del layout tal cual, en `hls/` y en `dash/`):
es un hallazgo de la librería, no de DASH, y no se arregló en la fase porque cambiaría a las cinco
demos (ninguna lo nota: todas usan paths absolutos).

Verificación: nivel mínimo; las citas son la parte chequeada. Una oración del borrador ("At most
one presentation is active at a time") no tenía fuente y se sacó.
