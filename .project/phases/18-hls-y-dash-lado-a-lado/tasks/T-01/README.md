# T-01 — evidencia

Registro de la corrida del 2026-10-26.

- `base-test.log`, `base-check.log`, `base-dry.log`: la línea de base en `0739c38` (`npm test`
  378/378, `npm run check` verde, `scripts/publicar.sh --all` en seco: 0 para copiar y 0 para borrar
  en las cinco demos, y los playlists señalizados que subiría).
- `T01-self.log`: `comparar-publicacion.mjs 0739c38 0739c38`, verde.
- `T01-control.log`: `comparar-publicacion.mjs --control 0739c38`, cada plantado como debía (14):
  verdes un comentario, dos declaraciones permutadas y un import partido en dos; rojos un literal,
  una regex, una declaración de menos, un dist que no parsea, una constante movida antes de la que
  lee al cargar, un archivo de más, uno de menos, un byte de una página, un import con otro nombre,
  una línea de test fuera de sus imports. El verde del comentario prueba además que los dos dists
  sin comentarios pasan `node --check` y se evalúan.
- Script: commit `3422cbb` de la rama `fase-18`.
