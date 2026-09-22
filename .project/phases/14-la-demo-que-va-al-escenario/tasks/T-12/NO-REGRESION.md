# T-12 — La no-regresión, y la publicación dejada lista

**2026-09-22.** La no-regresión está hecha y en verde. **La publicación no se corrió**: publicar
es hacia afuera y lo autoriza Nicolás, y todavía no lo hizo. Lo que queda en su lugar es el
camino entero escrito, probado en seco y detrás de una bandera: `./publicar.sh --publicar`.

## 1. La suite, comparada por nombres

| | base (28999e2) | ahora | delta |
| --- | --- | --- | --- |
| pruebas | **193** | **216** | **+23** |
| pasan | 193 | 216 | |
| fallan | 0 | 0 | |
| **desaparecidas** | | | **0** |

La base no se recordó: se midió. `git archive 28999e2 | tar -x` a un árbol limpio fuera del
repositorio y `node --test` ahí, que da 193, la misma cifra que `PHASE.md` declaró el
2026-09-21. Las 23 nuevas son las 23 de `demo/stage-pair/test/signalled-run.test.js` —14 de la
T-06 y 9 de la T-10—, y ninguna otra prueba cambió de nombre ni desapareció.

**El comparador se vio funcionar**: se le sacó una prueba real a la lista de "ahora" y la
reportó faltando. Sin eso, el cero de arriba lo produce igual un `comm` mal escrito. Los
nombres, las 23 nuevas y el control están en
[`la-linea-de-base.txt`](la-linea-de-base.txt).

## 2. Las dos costuras

`npm run check` sale **0**. La primera reporta 3 ocurrencias, las tres en la lista aceptada
(`lib/controls.js` 33, 133 y 169); la segunda, cero hits. La lista de archivos auditados ya
lleva los dos de la demo nueva, `demo/stage-pair/js/contract-trace.js` y
`demo/stage-pair/css/player.css`, que es lo que la T-06 y la T-08 agregaron por el R11.

## 3. Los dos `git diff --stat`, con su control

```
$ git diff --stat 28999e2 -- lib/
                                                    (vacío)
$ git status --porcelain -- lib/
                                                    (vacío: tampoco hay untracked)
$ git diff --stat 28999e2 -- demo/compatibility-pair demo/hydration-break demo/multiview-offer demo/race-multiview
                                                    (vacío)
```

**El control, porque un diff vacío también lo da un comando mal escrito.** Se plantó una línea
en `lib/renderer.js` y otra en `demo/hydration-break/js/app.js`:

```
$ git diff --stat 28999e2 -- lib/
 lib/renderer.js | 1 +
 1 file changed, 1 insertion(+)
$ git diff --stat 28999e2 -- demo/compatibility-pair demo/hydration-break demo/multiview-offer demo/race-multiview
 demo/hydration-break/js/app.js | 1 +
 1 file changed, 1 insertion(+)
```

Las dos se revirtieron con `git checkout --` y los md5 volvieron a los de antes
(`37d0ae48…` y `26ca5453…`), que es lo que prueba que el control no dejó rastro.

## 4. Las cuatro demos siguen andando, que no es lo mismo que "sus archivos no cambiaron"

### 4.1 Publicadas, verificado sin credenciales

`curl` sin token, sobre el host virtual-hosted de cada bucket:

| demo | `/index.html` | `/dist/…js` | `/vendor/hls.min.js` | playlist | `seg000.ts` | raíz |
| --- | --- | --- | --- | --- | --- | --- |
| hydration-break | 200 | 200 | 200 | 200 `application/vnd.apple.mpegurl` | 200 `video/mp2t` | 403 |
| multiview-offer | 200 | 200 | 200 | 200 `application/vnd.apple.mpegurl` | 200 `video/mp2t` | 403 |
| compatibility-pair | 200 | 200 | 200 | 200 `application/vnd.apple.mpegurl` | 200 `video/mp2t` | 403 |
| race-multiview | 200 | 200 | 200 | 200 `application/vnd.apple.mpegurl` | 200 `video/mp2t` | 403 |

El 403 de la raíz es el correcto: es un pedido de listar y listar está denegado. **El control
negativo del instrumento** es una ruta inventada, que da 404 en los cuatro: un `curl` que
contestara 200 a todo habría dado 200 también ahí.

### 4.2 Corriendo de verdad, en el Chrome real

Cada demo servida en su propio puerto (8099–8102, ninguno de los de Nicolás) y cargada en el
navegador. Lo que se mide no es "abre": es que **la librería dibuje adentro del break y no
afuera**, que es una propiedad con forma de dar distinto.

| demo | control: fuera del break | dentro del break |
| --- | --- | --- |
| hydration-break | t=91,4 s, **0 nodos `.ad`** | t=40 s, `VIDEO:lBackplate` |
| multiview-offer | t=13,3 s, **0 nodos `.ad`** | t=29,8 s, `VIDEO:adOverlay1`, 2 elementos de video |
| compatibility-pair | t=13,3 s, **0 nodos `.ad`**, 2 videos | t=29,9 s, `VIDEO:adOverlay1`, **3** videos |
| race-multiview | t=16 s, el botón de vistas **invisible** | t=37,9 s, botón visible y con `qa-btn--new`; se abre el catálogo (7 filas), se elige *CALDRIX, on-board* y aparece **el segundo elemento de video** y la segunda caja |

`race-multiview` no dibuja un `.ad` en su break porque su break **es la oferta de multi view**,
no un aviso; por eso lo que se mide ahí es la oferta y la caja que la elección agrega.

Y antes de todo eso, el control del reloj: con el video **pausado** el `currentTime` avanza
**0,000 s** en 4 s, y reproduciendo avanza **5,957 s** en 6 s. Sin ese par, "el video anda" es
una afirmación sin referencia.

Capturas: `no-regresion-*.png`, una por demo.

## 5. La publicación, lista y probada hasta el borde

**No se publicó nada y el bucket `qualabs-hls-demo-stage-pair` todavía no existe**
(`gcloud storage buckets describe` da 404; el mismo comando contra
`qualabs-hls-demo-race-multiview` devuelve su configuración, que es el control de que el 404
no es del comando). El camino está en [`publicar.sh`](publicar.sh), que **sin bandera corre en
seco** y no toca GCS. Su corrida está en [`la-corrida-en-seco.txt`](la-corrida-en-seco.txt).

Lo que quedó verificado sin publicar:

- **El patrón de exclusión, contra el código de gcloud y no contra su documentación.**
  `googlecloudsdk/command_lib/storage/regex_util.py` hace `re.compile(p).match(path_relativo)`,
  así que el ancla al principio está en su fuente. Medido: `.*__pycache__/` excluye
  `scripts/__pycache__/x.pyc` y `(^|/)__pycache__/` —el de la fase 13— **no**. Con el patrón
  bueno suben **493 de 494 archivos, 252,9 MB**, y el único excluido es el master de SPARKS de
  419,7 MB en `content/.fuentes/`.
- **Toda referencia absoluta de las tres páginas, las playlists y los asset-lists existe en
  disco**: 35 rutas, 0 faltantes. El chequeo se vio en rojo con `publicar.sh --control`, que
  planta dos rutas inexistentes y sale 1.
- **Los `.svg` no necesitan el content-type a mano.** Es lo contrario de lo que el contrato de
  esta task supone, y está medido en la fuente primaria: los `.svg` ya publicados en
  `race-multiview`, `hydration-break` y `compatibility-pair` —subidos por este mismo camino—
  devuelven `image/svg+xml`. El `.ts` sí lo necesita, y por eso el paso 5 del script sigue ahí.
  La verificación por header se hace igual después de publicar, que es distinto de asumirlo.
- **La verificación por md5 se probó de punta a punta** contra un objeto ya publicado: el
  `md5_hash` que GCS devuelve en base64 decodifica al md5 hexadecimal del archivo local
  (`2e461f66689fa21a83773ccd31a29905` para `seg000.ts` de `race-multiview`).
- **`dist/` está al día**: `./scripts/construir-libreria.sh` lo reconstruyó y el md5 no cambió.
- **Las tres páginas de la demo nueva arrancan y reproducen** servidas en 8099: `index.html`
  (2 videos, `readyState` 4), `inspect.html` (1) y `race.html` (2, con un aviso dibujado a los
  10 s).

**Lo que falta para publicar es el OK de Nicolás.** Con él: `publicar.sh --publicar`.

## 6. Lo que esta task NO hizo

- **No publicó nada, no creó ningún bucket y no tocó ningún objeto de GCS.**
- **No commiteó ni pusheó.**
- **No tocó `lib/`** ni las cuatro demos, más allá de las dos líneas plantadas del control del
  punto 3, revertidas y verificadas por md5.
- **No corrió `./run.sh`**, que reconstruye y re-señaliza; los servidores se levantaron con
  `node server.mjs` directo para no reescribir las playlists de las demos publicadas.
- **No midió nada sobre iOS ni sobre Safari.**
