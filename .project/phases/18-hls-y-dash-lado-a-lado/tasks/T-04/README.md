# T-04 — evidencia

Registro de la corrida del 2026-10-26, sobre `8f3aa53` de la rama `fase-18`.

- `T04-grep.log`: `git grep "lib/(signalling|media|concurrent-hls).js"` fuera de `.project/` y
  `demo/`, vacío; la misma búsqueda sobre `0739c38` la encuentra en 29 archivos (el instrumento
  encuentra). Y lo que queda en `demo/`, publicado y sin tocar por el ADR 0119: 18 líneas de
  comentarios y de un `"_"` de `stage.json` que citan `lib/signalling.js`, `lib/media.js` o
  "assembled from lib/". Van al REPORT.
- Actualizados: `README.md` (qué hay dónde, `lib/` y `hls/` y `dash/`, el comparador),
  `docs/integrating-the-library.md` (`MAX_BOXES` en `lib/experience.js`, `MULTIVIEW_CLASS` en
  `hls/signalling.js`, el build), `docs/contrato-senalizacion-renderizado.md` (`hls/media.js`), el
  `CLAUDE.md` del proyecto, `.gitignore`, `scripts/verificar-build.sh` y un comentario de test.
- `dash/README.md`: para qué es, la regla del ADR 0116 aplicada a DASH, y lo que hay que tocar
  cuando llegue el primer `.js`. Sin código.
- `npm test` 378/378 y `npm run check` verde después de los cambios.
