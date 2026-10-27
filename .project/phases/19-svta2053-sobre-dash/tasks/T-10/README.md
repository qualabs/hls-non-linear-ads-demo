# T-10 — La documentación, la verificación final y el merge a main local

**Documentación** (`f148970`): `README.md` (DASH en la intro, la tabla de qué está dónde, el
snippet de `attach` sobre dash.js), `dash/README.md` (ya no dice que está vacío), 
`docs/integrating-the-library.md`, `docs/contrato-senalizacion-renderizado.md`,
`demo/stage-pair/README.md` (el paso `empaquetar-dash.sh`) y el `CLAUDE.md` del proyecto (cómo se
publica el lado DASH). Búsqueda de lo que quedaba falso: `holds no code|Empty but for its
README|while the build does not read it` da 0 fuera de `.project/`; sobre `bb0d78b`, 3.

**Verificación**, desde el worktree en `f148970`:

| | resultado |
| --- | --- |
| `npm test` (`test.txt`) | 419/419 (378 en `bb0d78b`; +6 de `lib/media.js`, +29 de `dash/signalling.js`, +6 de los sobres de `stage-pair`) |
| `npm run check` (`check.txt`) | las dos costuras en verde; los dos dists construyen |
| `comparar-publicacion.mjs bb0d78b` (`comparar.txt`) | RED, con las causas acotadas. En las 4 demos que no son `stage-pair`: los renombres de T-02 y las declaraciones que los llaman, `attachAsset`/`attachPlain` (diferencial de T-02: 590 corridas, 0 diferencias) y las líneas de comentario de T-07 (medidas como sólo comentario). Nada más. `stage-pair` además suma lo del modo DASH |
| `publicar.sh --all` en seco (`seco-final.log`) | 4 demos: 0 faltantes, 0 borrados. `stage-pair`: 8 faltantes, todos contenido DASH que todavía no está en el bucket (7 MPD de creativos y `senalizado.mpd`) |
| la misma, en `bb0d78b` (`seco-base.log`) | verde, 0 copias: el bucket está en `bb0d78b` |
| `publicar.sh --con-contenido stage-pair` en seco (`seco-con-contenido.log`) | 0 faltantes, verde; 24 copias y 262 objetos de `content/` para copiar o borrar (no desglosé cuántos de cada uno) |

Lo que el próximo push publicaría, por demo, contra el bucket (`seco-final` contra `seco-base`): en
las cuatro demos HLS, el dist HLS y las páginas/CSS/JS con comentarios corregidos; en `stage-pair`,
lo de arriba más el dist DASH, dash.js y su licencia, los sobres `slot`, los scripts y tests nuevos.
**Y la publicación de `stage-pair` va a dar rojo hasta que su contenido DASH se suba a mano**
(`publicar.sh --publicar --con-contenido stage-pair`): las otras cuatro salen igual.

**Merge** `--no-ff` de `fase-19` a main local: `7ec15b5`. Sin push. El `dist/` de main no se
reconstruyó.
