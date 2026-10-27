# T-05 — evidencia

Registro de la corrida del 2026-10-26, sobre `8f3aa53` (la rama `fase-18` entera), contra la línea
de base de `0739c38` en `tasks/T-01/`.

| | `0739c38` | `8f3aa53` |
| --- | --- | --- |
| `npm test` | 378/378 | 378/378 (`after-test.log`) |
| `npm run check` | verde | verde (`after-check.log`) |
| corrida en seco, referencias faltantes | 0 en las cinco | 0 en las cinco |
| corrida en seco, borrados | 0 | 0 |
| corrida en seco, playlists señalizados | los mismos | los mismos |
| corrida en seco, copias | 0 | 11: el dist en cada demo y los seis archivos de test (`dry-run-copies.txt`) |
| `comparar-publicacion.mjs 0739c38` | — | verde (`after-compare.log`) |

- `dry-run-diff.txt`: el diff de los resúmenes de las dos corridas en seco (referencias, segmentos,
  faltantes, copias, señalizados, veredicto). Sólo difieren las cinco líneas de copias.
- Las 11 copias son exactamente los 11 archivos que el comparador admitió, y ninguno más: el dist
  (mismas 174 declaraciones, otro orden y comentarios, mismo global) y los tests de demo (mismos
  nombres importados).
- Merge `--no-ff` a main local: `aab6382`. `npm test` en main después del merge: 378/378. El `dist/`
  del checkout de main no se reconstruyó; el worktree y la rama `fase-18` se borraron. Sin push.
