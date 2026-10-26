# Tasks — fase 18-hls-y-dash-lado-a-lado

| id | brief | status | who | plan | evidence |
| --- | --- | --- | --- | --- | --- |
| T-01 | `scripts/comparar-publicacion.mjs`, y la línea de base | done | agent | — | rama `fase-18` · [`tasks/T-01/`](tasks/T-01/) |
| T-02 | La partición: `lib/`, `hls/`, el build y los imports | done | agent | — | rama `fase-18` · [`tasks/T-02/`](tasks/T-02/) |
| T-03 | Las costuras y la publicación con `hls/` | done | agent | — | rama `fase-18` · [`tasks/T-03/`](tasks/T-03/) |
| T-04 | `dash/README.md` y la documentación que la mudanza dejó falsa | in-progress | agent | — | — |
| T-05 | La verificación contra `0739c38`, y el merge a main local | planned | agent | — | — |

---

## T-01 — `scripts/comparar-publicacion.mjs`, y la línea de base

- **Objective:** con un comando se sabe si lo que se publicaría desde un commit difiere de lo que se
  publicaría desde otro en algo más que la forma inerte que admite el ADR 0118, y la línea de base de
  `0739c38` (tests, check, corrida en seco) está guardada para compararla al final.
- **What it must cover:** ADR 0118. `scripts/comparar-publicacion.mjs <antes> [<después>=HEAD]`,
  node sin dependencias: por demo de `publicar.sh` (`ALL`), arma el árbol de cada commit con `git
  archive`, corre su `construir-libreria.sh` adentro, copia `dist/` y `vendor/` en la demo, y compara
  las cuatro cosas del ADR (lista de archivos, bytes, el dist por declaraciones sin comentarios, los
  archivos que sólo cambiaron imports). Temporales en `$XDG_RUNTIME_DIR`, borrados al salir. Un
  modo `--control` que plante cada rojo y cada verde sobre copias, y no tests en `test/`: la suite
  tiene que dar 378 antes y después. Cabecera que explique el porqué, como las demás de `scripts/`.
- **Definition of done:** `comparar-publicacion.mjs 0739c38 0739c38` verde; rojo con: un literal
  cambiado en el dist, una regex cambiada, una declaración de menos, un archivo publicado de más, un
  import con un nombre distinto; verde con: un comentario cambiado, dos declaraciones permutadas, un
  import partido en dos con los mismos nombres. El dist de `0739c38` sin comentarios pasa `node
  --check`. La línea de base en `tasks/T-01/`.
- **nivel de verificación:** alto. Es el instrumento sobre el que descansa la afirmación de que nada
  cambió, corre sin nadie mirando en la fase DASH, y un comparador roto da verde.

## T-02 — La partición: `lib/`, `hls/`, el build y los imports

- **Objective:** `lib/` tiene el renderer, los controles, el multi-view, el tracking, el post-roll,
  el modelo de un corte (`lib/experience.js`) y las capacidades (`lib/capabilities.js`); `hls/` tiene
  `signalling.js`, `media.js` y `concurrent-hls.js`; y el dist que sale de ahí es el de hoy salvo
  orden y comentarios.
- **What it must cover:** ADR 0117, con el reparto declaración por declaración que nombra. Las
  declaraciones se mueven por script y en su orden; su código no se toca salvo `export` en
  `withOptions`. Los comentarios de lo que sube a `lib/` que nombran HLS se reescriben en el
  vocabulario del contrato. Cabeceras de los tres archivos. `construir-libreria.sh` con el orden del
  ADR y sus comentarios; `package.json` (`main`, `exports`, `files`). Los imports de `lib/`, `hls/`,
  `test/`, `demo/*/test/signalled-run.test.js` y `demo/stage-pair/test/verificar-carrera.py`; nada
  más de `demo/`. Depende de T-01.
- **Definition of done:** `npm test` 378/378; `comparar-publicacion.mjs 0739c38 HEAD` verde, con el
  dist y los seis archivos de test como únicas diferencias admitidas; el dist nuevo evaluado en node
  define `QualabsConcurrentHls` con las mismas claves que el de `0739c38`; `grep` de los términos del
  ADR 0003 sobre `lib/*.js` sólo con las tres líneas aceptadas.
- **nivel de verificación:** alto. Es el código de las cinco demos públicas, y un cambio de
  comportamiento no se ve hasta que alguien mira la demo. No hay reglas de negocio nuevas que mutar:
  la referencia independiente es `0739c38`, a través de T-01.
- **post-ejecución:** 2026-10-26, el `hls` del `git archive` de `scripts/publicar.sh` se hizo acá y
  no en T-03: el comparador arma el stage con el `publicar.sh` de cada commit.

## T-03 — Las costuras y la publicación con `hls/`

- **Objective:** `npm run check` vigila `lib/` entero contra el transporte y `lib/` y `hls/` contra
  la demo, y la publicación y CI saben que `hls/` es parte del dist.
- **What it must cover:** ADR 0116. `scripts/verificar-cortes.mjs`: la costura 0003 sobre
  `lib/*.js` más los consumidores de demo que ya nombra; fuera `SIGNALLING_SIDE` y
  `nobodyIsUnwatched`, con la razón en la cabecera; la 0015 sobre `lib/*.js` y `hls/*.js`.
  `scripts/publicar.sh`: `hls` en el `git archive`. `scripts/demos-cambiadas.sh`: `hls/` publica las
  cinco. Sus cabeceras. Depende de T-02.
- **Definition of done:** `npm run check` verde; rojo con un término de HLS plantado en
  `lib/experience.js`, con un `import` de `../hls/` plantado en `lib/capabilities.js`, y con `demo`
  plantado en `hls/media.js` (cada uno revertido); `demos-cambiadas.sh` lista las cinco para un
  commit que sólo toca `hls/` y ninguna para uno que sólo toca `dash/`.
- **nivel de verificación:** alto. Son los chequeos que corren en CI sin nadie mirando, y uno que
  dejó de mirar da verde.

## T-04 — `dash/README.md` y la documentación que la mudanza dejó falsa

- **Objective:** quien abre el repo ve qué es `lib/`, `hls/` y `dash/` y dónde va algo nuevo, y
  ningún documento vigente fuera de `demo/` apunta a una ruta que ya no existe.
- **What it must cover:** ADR 0119 y `knowledge/documentation-policy.md` del repo padre. `dash/README.md`
  (para qué, la regla, sin código); `README.md`; `docs/integrating-the-library.md`;
  `docs/contrato-senalizacion-renderizado.md`; el `CLAUDE.md` del proyecto; comentarios de `test/`,
  `scripts/` y de `lib/`/`hls/` que nombran una ruta movida. No `.project/` (registro) ni `demo/`
  (ADR 0119). Depende de T-02 y T-03.
- **Definition of done:** `git grep -n "lib/\(signalling\|media\|concurrent-hls\)\.js"` fuera de
  `.project/` y `demo/` vacío, y la misma búsqueda sobre `0739c38` encuentra las de hoy (el
  instrumento encuentra); las que quedan en `demo/` listadas para el REPORT.
- **nivel de verificación:** bajo. Lo lee una persona o un agente, y un error se ve al leerlo; la
  búsqueda es la parte no visual.

## T-05 — La verificación contra `0739c38`, y el merge a main local

- **Objective:** está probado, con la evidencia guardada, que la fase no cambia lo que hace ninguna
  demo, y la rama está en main local.
- **What it must cover:** desde el worktree, en HEAD de la rama: `npm test`, `npm run check`,
  `scripts/publicar.sh --all` en seco, `comparar-publicacion.mjs 0739c38`. Comparar cada salida con
  la de T-01: la corrida en seco con las mismas referencias, 0 faltantes, 0 borrados, y como copias
  sólo el dist y los tests de demo. Merge `--no-ff` a main local, sin push; el `dist/` de main no se
  reconstruye. Depende de T-01 a T-04.
- **Definition of done:** las cuatro salidas en `tasks/T-05/` y la comparación escrita; main local
  con el merge; `git status` limpio.
- **nivel de verificación:** alto. Es la prueba de la regla dura de la fase.
