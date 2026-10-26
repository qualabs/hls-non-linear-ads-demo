# T-02 — evidencia

Registro de la corrida del 2026-10-26, sobre `7c95e9a` de la rama `fase-18`.

- `T02-compare.log`: `comparar-publicacion.mjs 0739c38 HEAD`, verde. En cada demo, idéntico todo
  salvo el dist (174 declaraciones antes y después, mismas con el mismo texto, en otro orden; el
  global con las mismas 7 claves) y los tests de demo (los mismos nombres importados).
- `test-summary.txt`: `npm test`, 378/378.
- `grep-0003-lib.txt`: los términos del ADR 0003 sobre `lib/*.js`: sólo las tres líneas aceptadas de
  `controls.js`.
- Cómo se partió: un script fuera del repo cortó `lib/signalling.js` por declaración de nivel
  superior (con su comentario de arriba) y las repartió por nombre según el ADR 0117, en su orden;
  las dependencias que encontró son las del ADR (`lib/capabilities.js` usa `isOffer`;
  `hls/signalling.js` usa ocho nombres de `experience.js` y tres de `capabilities.js`; `lib/` no usa
  nada de `hls/`). Los imports de los tests se reescribieron por nombre, manteniendo su formato
  cuando no se partían.
- `scripts/publicar.sh` suma `hls` a su `git archive` en esta task y no en T-03: el comparador arma
  el stage con el `publicar.sh` de cada commit, y sin eso no podía construir el dist.
