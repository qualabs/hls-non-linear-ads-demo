# La no-regresión y la publicación

Cero generaciones de Veo, cero dólares. Nada de lo que ya existía se rompió, y la demo está
publicada en `https://qualabs-hls-demo-race-multiview.storage.googleapis.com/index.html`,
respondiendo 200 sin credenciales y reproduciendo las cuatro cajas desde el bucket.

El veredicto en una línea: **la suite no perdió una sola prueba —las 184 de la línea de base
están las 184, y las 9 que llegaron son de esta demo—, las dos costuras siguen verdes con las
mismas tres ocurrencias aceptadas y ningún hit nuevo, `git diff --stat -- lib/` está vacío, y
los 324 objetos publicados son byte por byte los archivos que se probaron.**

**Y la fase gastó US$74,40 en 93 generaciones**, US$18,40 por debajo del techo que `PHASE.md`
declaró. Ese número no coincide con los dos que ya estaban escritos, y ahí está el hallazgo de
esta task: a `T-08/el-gasto.md` y al `README.md` de la demo les faltan las mismas doce
generaciones. El detalle, en [`el-gasto.md`](el-gasto.md).

---

## 1. Los tres comandos, comparados por nombre y no por conteo

| chequeo | comando | resultado | salida | verbatim |
| --- | --- | --- | ---: | --- |
| la suite | `npm test` | **193 pruebas, 193 pasan, 0 fallan** | `0` | [`npm-test.txt`](salidas/npm-test.txt) |
| las dos costuras | `npm run check` | **verde**: la primera, 3 ocurrencias todas aceptadas; la segunda, cero hits | `0` | [`npm-check.txt`](salidas/npm-check.txt) |
| la campaña de la demo grabada | `npm run mutaciones` | *"las 20 roturas dieron rojo y los 9 chequeos dan verde sin romper nada"* | `0` | [`npm-mutaciones.txt`](salidas/npm-mutaciones.txt) |
| la demo que se graba | `node --test demo/hydration-break/test/signalled-run.test.js` | **10 pruebas, 10 pasan** | `0` | [`npm-test-signalled-run.txt`](salidas/npm-test-signalled-run.txt) |

**La suite se comparó por nombres.** El conteo pasó de 184 a 193, y un conteo no distingue
"llegaron nueve" de "se fueron dos y llegaron once":

```
$ extract() { grep -E '^(✔|✖|✗) ' "$1" | sed -E 's/^. //; s/ \([0-9.]+ms\)$//' | sort; }
$ comm -23 nombres-linea-de-base.txt nombres-hoy.txt    # las que SE FUERON
(ninguna)

$ comm -13 nombres-linea-de-base.txt nombres-hoy.txt    # las que LLEGARON
the catalogue is the cameras that are packaged, named as race.json names them
the check for typed numbers can see one
the content is packaged at 1280x720 and at the cadence of the footage
the cue sheet prints the seconds of the window, and they are computed and not typed
the multi view tag drops X-RESTRICT
the numbers this demo runs on are declared once, in race.json
the offer announces a catalogue and not a layout
the playlist comes out with one Date Range, of the multi view class, and no other
the window opens at the second race.json declares, and lasts what it declares
```

Las nueve nombran `race.json`, el catálogo, la ventana y el tag de esta demo: son las que
escribieron la T-06 y la T-07, y ninguna toca a las otras tres demos.

**Y el comparador se vio dar distinto.** Sobre una copia de los nombres de hoy se borró una
prueba y se renombró otra —el conteo baja de 193 a 192, una diferencia de uno que un ojo
perdona— y el comparador nombró la que faltaba y mostró la renombrada como una que llegó, que
es exactamente el par que un conteo igual escondería. En
[`las-pruebas-por-nombre.txt`](salidas/las-pruebas-por-nombre.txt).

**`npm run check` y `npm run mutaciones` salen byte por byte iguales a la línea de base de la
T-01:**

```
$ diff <(grep -v EXIT= T-01/salidas/npm-mutaciones.txt) <(grep -v EXIT= npm-mutaciones.txt)
99d98
< exit=0
$ diff <(grep -v EXIT= T-01/salidas/npm-check.txt) <(grep -v EXIT= npm-check.txt)
21d20
< exit=0
```

La única línea de diferencia en cada uno es la que la T-01 le agregó al pie al guardar el
archivo. Las 20 roturas, los 9 chequeos, las 3 ocurrencias aceptadas y su texto son los
mismos.

## 2. Las dos costuras, y la cuarta ocurrencia que no apareció

**La primera reporta tres ocurrencias y las tres están en la lista aceptada. No hay una
cuarta**, así que no hay nada que agregar a ninguna lista, que es lo que el propio script
pide que no se haga.

```
GREEN: 3 occurrence(s), all of them on the accepted list.
  lib/controls.js:33  // or 'interstitial' -- which the contract carries on purpose, because the two
  lib/controls.js:133  interstitial: '#ffcc00'
  lib/controls.js:169  interstitial: 'traditional interstitial: the content is replaced by the ad'
```

**La segunda, cero hits.**

**Las dos se vieron en rojo, sobre una copia del árbol en `/dev/shm` y sin tocar el
repositorio.** Una cuarta ocurrencia plantada en `lib/renderer.js` puso roja a la primera
(`RED: 1 occurrence(s) that are not on the accepted list`, salida `1`), y un `getElementById`
plantado en `lib/media.js` puso roja a la segunda mientras la primera volvía a verde — o sea
que las dos son independientes y ninguna arrastra a la otra. Verbatim en
[`las-costuras-se-ven-en-rojo.txt`](salidas/las-costuras-se-ven-en-rojo.txt).

## 3. `lib/` no cambió

La fase arrancó sobre `e2f7f3f`, que es el commit que la T-01 midió y el padre del único
commit que la fase escribió.

```
$ git diff --stat e2f7f3f -- lib/
$ git diff --stat f050ddd -- lib/
$ git diff --stat -- lib/
```

Los tres vacíos: contra el commit con el que la fase arrancó, contra lo que la fase ya llevaba
commiteado, y el árbol de trabajo contra `HEAD`.

**El control es que el mismo comando sabe decir que sí hubo un cambio.** Contra `1767254` —el
commit anterior al arranque— no vuelve vacío:

```
$ git diff --stat 1767254 -- lib/
 lib/renderer.js | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Esa línea es el comentario que `e2f7f3f` arregló, de **antes** de esta fase, y es la
advertencia de `PHASE.md` que la T-01 ya había cerrado. En
[`lib-no-cambio.txt`](salidas/lib-no-cambio.txt), con el diff entero.

## 4. La publicación

**El bucket es `qualabs-hls-demo-race-multiview`**, y queda idéntico a los otros tres: mismo
`location`, mismo `storage class`, acceso uniforme, y la misma política de IAM con `allUsers`
en `roles/storage.legacyObjectReader`. Las dos descripciones, la del bucket nuevo y la de
`multiview-offer`, están una al lado de la otra en
[`la-publicacion.txt`](salidas/la-publicacion.txt).

**Lo que se subió:** la carpeta de la demo en la raíz del bucket, más `dist/` —reconstruido
con `./scripts/construir-libreria.sh` antes de subir— y `vendor/`. **324 objetos**, de los
cuales 248 son segmentos.

**El content type de cada `.ts` se puso a mano.** Google los sube como
`text/vnd.trolltech.linguist`, que es el formato de traducciones de Qt, y se lo vio hacerlo:
el `describe` de `seg000.ts` antes de corregir decía exactamente eso. Después del
`objects update`, los 248 son `video/mp2t` y no hay ninguno que no lo sea.

**`content/.fuentes/` no se publicó.** Son 798 MB de clips crudos contra los 131 MB que sí
subieron, y ninguna página los pide.

### Y lo publicado es byte por byte lo que se probó, medido y no prometido

[`auditar-lo-publicado.py`](auditar-lo-publicado.py) compara el md5 que el bucket guarda de
cada objeto contra el md5 del archivo local, y recorre el árbol local al revés para que un
`rsync` que subió de menos también se vea:

```
objetos publicados en gs://qualabs-hls-demo-race-multiview: 324
  identicos byte por byte al archivo local : 324
  DISTINTOS                                : 0 []
  publicados sin archivo local             : 0 []
  locales publicables que faltan arriba    : 0 []
  .ts con content type que no es video/mp2t: 0 []

EL CONTROL, sobre index.html:
  md5 publicado                    IqbibgesuZcbg2X5dVmQfg==
  md5 del archivo local            IqbibgesuZcbg2X5dVmQfg==   -> IGUAL
  md5 del archivo local + un byte  RwbdiznO5QE4T1321esgUg==   -> DISTINTO
```

No se editó un solo archivo de la demo para publicarla. Verbatim en
[`lo-publicado-es-lo-que-se-probo.txt`](salidas/lo-publicado-es-lo-que-se-probo.txt).

### El acceso público, sin credenciales

La comprobación corre con el entorno **vaciado** —`env -i` no le pasa una sola variable al
proceso, ni `PATH`, y por eso el binario va por path absoluto—, así que lo que responde 200 le
responde 200 a cualquiera:

```
$ env -i /usr/bin/curl -s -o /dev/null -w '%{http_code}  %{content_type}  %{size_download}' URL
/index.html                     200  text/html                      11112 bytes
/css/page.css                   200  text/css                       13509 bytes
/js/app.js                      200  text/javascript                 4504 bytes
/dist/qualabs-concurrent-hls.js 200  text/javascript               273987 bytes
/race.json                      200  application/json                  628 bytes
/content/primary/con-daterange.m3u8  200  application/vnd.apple.mpegurl   4964 bytes
/content/primary/seg000.ts      200  video/mp2t                    586184 bytes
/signalling/asset-list-offer.json    200  application/json               1794 bytes
/content/view-caldrix/index.m3u8     200  application/vnd.apple.mpegurl   2765 bytes
/brand/favicon.svg              200  image/svg+xml                     802 bytes
```

**Los tres controles, porque un 200 no dice nada si todo diera 200:** la raíz del host da
**403** —es un pedido de listar el bucket, y listar está denegado a propósito—, un objeto
inexistente da **404**, y un clip crudo de `.fuentes` da **404** porque no se publicó. En
[`el-acceso-es-publico.txt`](salidas/el-acceso-es-publico.txt).

### Y el video reproduce desde ahí

[`reproduce-desde-la-nube.py`](reproduce-desde-la-nube.py) abre la URL pública en el Chrome del
sistema y no mide que el `<video>` exista: mide **`currentTime` contra reloj de pared**.

| | la corrida | el control: `.ts` abortados |
| --- | --- | --- |
| hosts de todos los requests | `{qualabs-hls-demo-race-multiview.storage.googleapis.com: 41}` | el mismo, 23 |
| respuestas ≥ 400 | **0** | 0 |
| `currentTime` en 4.000 ms de pared | **+3,020 s** | **+0,000 s** |
| cámaras subidas a la grilla | 3 | — |
| cajas / `<video>` adentro del player | **4 / 4** | — |
| cuántos avanzaron su propio tiempo | **4 de 4** | — |
| el catálogo | las seis, de `CALDRIX, on-board` a `QUENTRA, trackside` | — |
| la línea de estado | `t=41.5s · multi view · 4 boxes · 4 video elements in the player, 4 decoding` | — |

**El control es lo que hace que "+3,020 s" signifique algo**: con los segmentos abortados el
mismo instrumento dice `+0,000`, o sea que lo que se lee es el video y no el reloj del
sistema. Y el único host de los 41 requests es el del bucket, así que la página publicada no
se apoya en nada de esta máquina.

El único request fallido de la corrida buena es un `net::ERR_ABORTED` sobre
`content/primary/seg001.ts`, que es el reproductor cancelando un segmento en vuelo al saltar
de tiempo: el mismo objeto responde **200** a un `curl` sin credenciales, y está en la tabla
de arriba. Verbatim en
[`reproduce-desde-la-nube.txt`](salidas/reproduce-desde-la-nube.txt), lecturas crudas en
[`reproduce-desde-la-nube.json`](salidas/reproduce-desde-la-nube.json), y las capturas en
[`capturas/`](capturas/) — cuatro autos distintos decodificando a la vez, servidos de GCS.

## 5. El gasto de la fase

**US$74,40 en 93 generaciones**, sumado de los registros y no de los informes. La tabla etapa
por etapa, los tres techos, y las dos veces que Nicolás subió el de la etapa 1, en
[`el-gasto.md`](el-gasto.md).

| etapa | generaciones | US$ | techo declarado | |
| --- | ---: | ---: | ---: | --- |
| 1. el programa (T-02 + T-03 y sus tres regeneraciones) | 33 | 26,40 | 22,40, subido a **30,00** | quedan 3,60 |
| 2. una cámara (T-05) | 14 | 11,20 | **12,80** | quedan 1,60 |
| 3. las cinco restantes (T-08) | 46 | 36,80 | **57,60** | quedan 20,80 |
| **la fase** | **93** | **74,40** | **92,80** | **quedan 18,40** |

Esta task no gastó un centavo: cero generaciones de Veo y ninguna llamada a un modelo.

## 6. Lo que esta task NO hizo

- **`lib/`.** Ni una línea, y está medido en §3.
- **Las otras tres demos y sus buckets.** No se corrió un solo comando contra
  `qualabs-hls-demo-hydration-break`, `-multiview-offer` ni `-compatibility-pair`: la única
  vez que se los nombró fue un `describe` de lectura, para comparar la configuración del
  bucket nuevo contra la de uno que ya funciona.
- **Los dos totales de gasto que no cierran.** Se reportan en §7 con el texto exacto y no se
  editan, porque son archivos de otras dos tasks.
- **El selector a 400 px.** Nicolás lo cerró sin cambio: la demo es 16:9 y el panel vive
  adentro del alto de la imagen. No se volvió a medir ni se reabrió.
- **Ninguna medición de red.** Que esté en GCS no la convierte en una, y `PHASE.md` avisó de
  esta tentación exacta. La corrida de §4 se hizo desde esta máquina contra el bucket y no
  dice nada sobre lo que cuatro reproductores le piden a una conexión de verdad.

## 7. Los hallazgos, que se reportan y no se arreglan

### 7.1 Los dos totales de gasto de la fase están cortos, y les falta lo mismo

A `T-08/el-gasto.md` y al `README.md` de la demo les faltan **las mismas doce generaciones**:
las tres regeneraciones de la T-03, que viven en subcarpetas de esa task y no en su informe
principal. Son **US$9,60**.

| dónde | dice | los registros dicen |
| --- | --- | --- |
| `T-08/el-gasto.md`, tabla *El total de la fase* | etapa 1: 28 gen / US$22,40 — la fase: 88 / US$70,40 | etapa 1: **33 / US$26,40** — la fase: **93 / US$74,40** |
| `demo/race-multiview/README.md`, tabla *How the content is regenerated* | 16.80 / 64.80 / *81 generations were launched* | **26.40 / 74.40 / 93 lanzadas** |

**El del README es el que importa**, porque es un documento que se publica y su tabla es lo que
alguien va a usar para presupuestar una regeneración: sale un 15 % más cara de lo que dice. Las
tres filas corregidas, listas para pegar:

```
| the probe and the programme | two clips to test the prompt, then the fourteen shots of the race, and three rounds of reshoots | 26.40 |
| the first on-board camera | the eight clips of one car, and the demo running with a catalogue of one | 11.20 |
| the rest of the catalogue | eight clips per remaining camera, five cameras | 36.80 |
| | **the whole of this demo** | **74.40** |
```

y la frase de abajo: **93 generations were launched and 62 clips are in the demo** — las 31 que
no están son las que se miraron y se rechazaron, las cinco que Vertex perdió con `code 14`, y
las versiones anteriores de las casillas que una regeneración reemplazó.

### 7.2 `PHASE.md` declara un techo de etapa 1 que Nicolás ya levantó dos veces

La tabla de las tres compuertas sigue diciendo **US$22,40**, y el techo vigente al cerrar la
etapa era **US$30,00**. La excepción está escrita, pero sólo adentro de dos informes de
subcarpeta de la T-03, así que quien lea `PHASE.md` va a concluir que la etapa 1 se pasó
US$4,00 sin permiso.

### 7.3 El `CLAUDE.md` de la raíz dice *"All three are public"*, y ahora son cuatro

La tabla de *Where the demos are published* no incluye la demo nueva. La fila que falta:

```
| `demo/race-multiview/` | https://qualabs-hls-demo-race-multiview.storage.googleapis.com/index.html |
```

No se editó porque `PHASE.md` declara como propiedad del diseño que **ninguna task de esta fase
edita un archivo que ya existe**, y el contrato de la T-10 no lo pide. Es de una línea y es la
última cosa que queda desalineada entre el repositorio y la realidad.

### 7.4 El `--exclude` de `gcloud storage rsync` ancla su regex al principio del path

`-x '(^|/)__pycache__/|^content/\.fuentes/'` excluyó `content/.fuentes/` y **no** excluyó
`scripts/__pycache__/`: `gcloud` evalúa el patrón contra el path relativo con `re.match`, así
que una alternativa que arranca con `/` nunca engancha en el medio. El único `.pyc` de la demo
se subió y se sacó a mano; el patrón que sí anda es `.*__pycache__/`. Queda anotado porque el
modo de falla es silencioso: el comando no avisa que un patrón no mordió nada.

## 8. Cómo queda el árbol

Modificado y **sin commitear**, que es como termina toda task de este repositorio. Lo que
`git status` muestra es exactamente lo que dejaron la T-08 y la T-09, más la carpeta de esta
task; `git diff --stat` sobre `lib/`, sobre las otras tres demos, sobre `docs/`, `run.sh`,
`server.mjs`, `package.json` y `scripts/` está vacío.

Los temporales de esta corrida vivieron en `/dev/shm/t10-…/` y se borraron. No se levantó
ningún server: la única página que se abrió fue la publicada, desde su URL.
