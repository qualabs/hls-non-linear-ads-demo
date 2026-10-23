# T-06 — los árboles para `roku-ads-02` (2026-10-22)

| demo | path | HEAD | chequeo de referencias de `publicar.py` |
| --- | --- | --- | --- |
| stage-pair | `~/.cache/cto-tmp/hls17-arbol/repo/demo/stage-pair/` | fe82c1c | 48 references, 19 playlists followed, 564 segments; 0 missing |
| hydration-break | `~/.cache/cto-tmp/hls17-arbol/repo-hb/demo/hydration-break/` | 54dd9c7 | 14 references, 3 playlists followed, 24 segments; 0 missing |

Armados como el escenario de `publicar.sh`: `git archive` de la rama, `dist/` construido, `vendor/`,
`content/` sin `.fuentes/` ni `.work/`, y `senalizar-contenido.sh` corrido adentro.

Lo que `roku-ads-02` informó: stage-pair, todas las `uri` de los tres asset-lists 200 con su tipo, el
break A idéntico a su fixture, los tres breaks dibujan el MP4 y caen al PNG si falta. hydration-break:
Nicolás vio en la TV que la L se dibuja tapando el programa (ver T-07).
