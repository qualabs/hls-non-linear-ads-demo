# T-02 — La hipótesis del SVG animado adentro de `<img>`, con sus controles

**Verdicto: la hipótesis se confirma, y la premisa del ADR 0084 también.** Un
`image/svg+xml` con animación declarativa se dibuja y **se mueve** adentro de la composición
que la librería arma, sin una línea de `lib/`. Un elemento de imagen **no consume un
decodificador de video**. Queda elegida la **rama 1** de la escalera de salida de `DESIGN.md`
para el banner y para la L: cuesta cero.

Siete preguntas, siete respuestas, cada una con su medición.

| # | pregunta | respuesta |
| --- | --- | --- |
| 1 | ¿anima SMIL adentro de la composición? | **sí**, 91.268 píxeles de 2.073.600 |
| 2 | ¿anima CSS adentro de la composición? | **sí**, 329.521 píxeles |
| 3 | ¿corre JavaScript adentro del `<img>`? | **no**, 0 píxeles, y el dibujo queda en su estado autorado |
| 4 | ¿cuánto se adelanta el reloj de la animación? | **3,25 a 3,50 s**, tres de tres corridas |
| 5 | ¿qué fuentes resuelven? | la **pila del sistema** y la **embebida como datos**; el **`@font-face` a un archivo externo NO** |
| 6 | ¿cómo compone el alfa? | **compone**: la región transparente deja pasar el programa, 0 píxeles de diferencia |
| 7 | ¿cuántos decodificadores pide una imagen? | **ninguno**: un `<video>` vivo con la variante magra, dos con la rica |

## Cómo se midió, y por qué así

**Adentro de la composición real.** El banco es una página que corre el mismo bloque de
integrador que `demo/compatibility-pair/js/app.js`: `QualabsConcurrentHls.attach(hls, {
container })` sobre una señalización de prueba con un `EXT-X-DATERANGE` de clase
`com.qualabs.hls.concurrentInterstitial`, y el creativo entra por el `uri` y el `type` del
asset-list, que es el camino que el código toma. El contenido primario es el que
`demo/compatibility-pair/content/primary/` ya tiene empaquetado, servido de sólo lectura.

**A resolución nativa.** El contenedor de la página mide **1920 × 1080 px CSS** con
`device_scale_factor = 1`, y el aviso se declara a cuadro entero (`viewport "0 0 0 0"`), así
que el nodo que la librería crea mide 1920 × 1080 exactos y una captura de él **es** el
creativo a su resolución nativa. Confirmado por el propio banco:

```
"adBoxes": [{ "tag": "IMG", "id": "probe", "x": 0, "y": 0, "w": 1920, "h": 1080,
              "opacity": "1", "src": "/svg/anim-smil.svg" }]
```

**Con el programa en pausa entre las dos capturas.** El creativo es lo único que se mueve,
así que un control que tiene que dar cero puede dar cero de verdad. La animación declarativa
no se detiene con el video: el reloj de SMIL es del documento del `<img>`.

**Y nada de esto vive en el árbol**: el banco entero —página, señalización, fixtures— corrió
en `$XDG_RUNTIME_DIR/cto/T-02-…/` y se borró al terminar. No se tocó `lib/` ni para
instrumentar: el contador de instancias del player es una **subclase de `Hls` en la página**,
que hereda los estáticos por la cadena de prototipos y deja intacto lo que la librería lee.

### El instrumento de píxeles, y por qué no es `compare -metric AE`

`compare -metric AE` **de este ImageMagick no devuelve un conteo de píxeles**: un negro contra
un verde a 1920×1080 da 1,15e6 y no 2.073.600. Medido:

```
$ compare -metric AE /tmp/k-black.png /tmp/k-green.png null:
1.15471e+06 (0.556863)
```

Así que el instrumento se armó a mano y **se validó contra tres casos de respuesta conocida**
antes de apoyarse en él:

```
$ cat pxdif.sh
magick "$1" "$2" -compose difference -composite -colorspace Gray \
  -threshold 0 -format "%[fx:int(mean*w*h+0.5)]" info: | awk "{printf \"%d\", \$1}"

$ ./pxdif.sh negro.png verde.png        # tiene que dar 2073600
2073600
$ ./pxdif.sh negro.png negro.png        # tiene que dar 0
0
$ ./pxdif.sh negro.png negro+10col.png  # 10 columnas de 1080 = 10800
10800
```

## 1, 2 y 3 — SMIL anima, CSS anima, JavaScript no corre

Dos capturas separadas 0,8 s del **nodo que la librería dibuja**, a 1920×1080:

```
=== EL INSTRUMENTO (mismo archivo, y dos creativos distintos) ===
lib-static-a contra si mismo                            0
lib-static-a contra lib-smil-a                    2070790

=== ADENTRO DE LA COMPOSICION (1920x1080 nativo), dos instantes ===
smil                                                91268
css                                                329521
static                                                  0
js                                                      0

=== EL MISMO ARCHIVO EN UN <img> SUELTO DE LA PAGINA ===
bare-smil                                          326096
bare-css                                           345281
bare-static                                             2
bare-js                                                 0
```

**Los tres controles, y los tres dicen lo que tenían que decir:**

- **El SVG sin animación da 0.** El instrumento no fabrica diferencias, así que los 91.268 del
  positivo son movimiento y no ruido.
- **El SVG animado por JavaScript da 0**, y en la captura el dibujo está en su estado autorado
  —la barra en `x = 0`, donde el documento la declara— y no en el que el script le habría
  dado. El script no corre adentro de un `<img>`, que es lo que la hipótesis predecía.
- **El mismo archivo en un `<img>` suelto de la página se comporta igual** (326.096 y 345.281
  contra 0 y 0), así que "no anima adentro de esta composición" queda separado de "no anima
  adentro de un `<img>`". Ninguno de los dos pasa.

**El único número que no es cero ni grande son los 2 píxeles de `bare-static`**, sobre
2.073.600. Es el borde antialiasado del nodo y no movimiento: tres órdenes de magnitud debajo
del positivo más chico.

**Por qué SMIL mueve menos que CSS** —91.268 contra 329.521— y no es un defecto: son dos
dibujos distintos con dos recorridos distintos en 0,8 s, no el mismo creativo medido dos
veces. Lo que la medición compara es cada caso contra su propio control, no un caso contra el
otro.

Evidencia visual: [`evidencia-animacion.png`](evidencia-animacion.png), los dos instantes de
cada uno de los cuatro casos, uno al lado del otro.

## 4 — El reloj se adelanta 3,25 a 3,50 s

`bringAhead` construye el nodo `PRELOAD_LEAD_SECONDS = 3` segundos antes de que se vea, a
`opacity: 0` (`lib/renderer.js:35` y `:891`). Para un SVG eso significa que **el reloj de la
animación arranca ahí**.

El creativo de prueba es un reloj: 24 franjas, una encendida por cada rebanada de 0,25 s, sin
repetir. **La franja encendida en el instante en que el nodo pasa a verse ES el tiempo
transcurrido de la animación.** Tres corridas:

```
[{"corrida": 0, "currentTime al verse": 20.22,  "franjas encendidas": [13], "adelanto del reloj (s)": [3.25]},
 {"corrida": 1, "currentTime al verse": 20.22,  "franjas encendidas": [13], "adelanto del reloj (s)": [3.25]},
 {"corrida": 2, "currentTime al verse": 20.233, "franjas encendidas": [13], "adelanto del reloj (s)": [3.25]}]
```

El break abre a los 20,0 s y el nodo se ve a los 20,22 s: los 0,22 s de más son el sondeo y el
pintado, no el adelanto. **Los 3 s de `bringAhead` están enteros ahí.**

**Lo que eso decide para autorar KOVRIN y KETRAVA**, y es la razón por la que esta pregunta
estaba en la task: el creativo **se ve por primera vez a 3,25 s de su propia animación**, no en
su comienzo. Un bucle de 3 s se ve entrando en su fase 0,25; uno de 6 s, a mitad de camino. La
consecuencia es la regla con la que ZUMBRA ya está autorada y que las otras dos campañas tienen
que respetar: **el bucle no puede tener un momento feo**, porque no hay forma de elegir en qué
fase se lo mira. Un bucle de 3 s con las fases repartidas y un ciclo largo de 6 s que cierra
idéntico al inicio cumplen eso por construcción.

Evidencia: [`evidencia-reloj.png`](evidencia-reloj.png).

## 5 — Resuelven la pila del sistema y la fuente embebida; el `@font-face` externo no

El mismo texto, el mismo cuerpo, la misma caja; lo único que cambia es la declaración de
familia. Todas contra la base `monospace`:

```
=== LAS FUENTES (todas contra la base monospace) ===
mono                                                    0
serif                                               57380
system                                              60649
face                                                    0
embedded                                            68964
```

- **`serif` es el control del instrumento**: 57.380 píxeles prueban que la comparación **ve**
  un cambio de familia. Sin él, el cero de `face` no significaría nada.
- **`system`** —`Helvetica, Arial, 'Liberation Sans', monospace`, la pila con la que ZUMBRA ya
  está dibujada— **resuelve**: 60.649. El supuesto sobre el que se autoró queda confirmado y no
  descubierto.
- **`face`** —`@font-face` con `src: url("/svg/probe.ttf")`— **da exactamente 0 contra
  `monospace`**: el archivo no se pide y el texto cae al fallback. Un SVG referenciado por
  `src` se dibuja aislado y no trae recursos de red.
- **`embedded`** —la misma fuente como `data:font/ttf;base64,…` adentro del propio SVG—
  **resuelve**: 68.964. Es la salida si alguna vez hace falta una tipografía que el sistema no
  tiene.

Evidencia visual: [`evidencia-fuentes.png`](evidencia-fuentes.png). `mono` y `face` son el
mismo dibujo; `serif`, `system` y `embedded` son tres dibujos distintos.

## 6 — El alfa compone contra el programa

`createNode` pone la cama negra **sólo a un `<video>`** (`lib/renderer.js:715`), así que un SVG
con fondo transparente debería componer contra el programa. Compone.

La medición **no cambia de carga de página**, y ahí hubo un hallazgo: la primera versión
comparaba el programa con aviso contra el programa de **otra** carga, y dos cargas no
garantizan el mismo cuadro de la película, así que el número mezclaba el alfa con la diferencia
entre dos cuadros. La versión que vale toma las dos capturas en la **misma carga**, con el
programa en pausa, ocultando el nodo del aviso entre una y otra: lo único que cambia es el
aviso.

```
{ "alpha":  { "banda transparente, con aviso vs sin aviso":          0,
              "cuadro entero, con aviso vs sin aviso":         458205 },
  "opaque": { "banda transparente, con aviso vs sin aviso":    1612680,
              "cuadro entero, con aviso vs sin aviso":         2070880 } }
```

- **La banda transparente da 0**: el programa se ve a través del creativo, píxel por píxel.
- **El cuadro entero da 458.205**, que son las dos barras opacas del creativo: 2 × 1920 × 120 =
  460.800 menos el antialiasing de sus bordes.
- **El control opaco da 1.612.680 en la misma banda**: el instrumento sabe ver un creativo que
  tapa. Sin ese control, el cero de arriba lo produciría igual una comparación rota.

Evidencia visual: [`evidencia-alfa.png`](evidencia-alfa.png).

## 7 — Un elemento de imagen no consume un decodificador de video

Es la premisa que sostiene la escalera entera del ADR 0084. La misma señalización, el mismo
layout, la misma duración; cambia **el `type` y el `uri` del asset y nada más**, que es lo que
la demo afirma. Contados adentro del contenedor, con el aviso en pantalla:

```
decoders static  videos=1 adVideos=0 adImgs=1 hlsLive=1 hlsCreated=1
decoders video   videos=2 adVideos=1 adImgs=0 hlsLive=2 hlsCreated=2
```

- **La variante magra da uno**, que es el contenido primario, y **cero elementos `<video>` de
  aviso**. El aviso es un `<img>`.
- **La variante rica es el control y da más**: dos elementos `<video>` y dos instancias del
  player.

**La escalera tiene escalones.** Si las dos hubieran dado lo mismo, lo medido habría sido el
instrumento; si la magra hubiera dado dos, la task paraba acá. Dio uno.

**Un matiz que el contrato no nombra y que conviene tener escrito**: adentro de un break con
varios avisos, `bringAhead` construye el nodo del siguiente hasta 3 s antes, así que en ese
tramo puede haber **un elemento de aviso de más** vivo a la vez. Para la variante rica eso es
un decodificador de más durante la cola del aviso anterior —y está argumentado en el propio
comentario de `bringAhead`—; para la magra no cambia nada, porque un `<img>` de más no es un
decodificador de más. **No alcanza a esta demo**: el recorrido del par tiene un aviso por
break (T-01, `stage.json`).

## La guarda del XML, vista fallar

Los doce SVG del banco se parsearon como XML antes de usarse. Y la guarda se hizo fallar a
propósito, porque una guarda que no se vio en rojo no se sabe si mide algo:

```
$ python3 -c "import xml.dom.minidom; xml.dom.minidom.parse('roto/tabla.svg')"
XML ROTO tabla.svg: not well-formed (invalid token): line 4, column 4

$ # el mismo archivo, abierto en Chrome:
   errores que emitio Chrome: NINGUNO
```

El archivo es un SVG válido con **una tabla markdown adentro de un comentario XML**, que es el
defecto ya medido: el separador `| --- |` contiene `--`, ilegal dentro de `<!-- -->`. **Chrome
no dibuja nada y no emite ni una línea.** La guarda lo agarra; mirar la consola, no.

## El verdicto sobre la escalera de salida

**Rama 1 de la sección 5 de `DESIGN.md`: la hipótesis se confirma.** Las variantes de imagen
del escalón de un decodificador **se mueven**, servidas como `image/svg+xml` desde el archivo
autorado. Cuesta cero de SDK y no hay ninguna dependencia de `lib/` que reportar.

**Lo que esto le fija a las tasks que siguen:**

- **T-04** autora las seis piezas que faltan con animación **declarativa** —SMIL o CSS, las dos
  sirven—, **nunca por JavaScript**, y con la pila de familias del sistema o la fuente embebida
  como datos, nunca con un `@font-face` a un archivo externo. El bucle se autora para que no
  tenga momento feo, porque el creativo se ve por primera vez a 3,25 s de su animación.
- **El backplate de la L puede usar transparencia** en la región de la guarda si el dibujo lo
  pide: el alfa compone contra el programa.
- **T-06** genera los dos juegos de asset-lists con la variante magra apuntando a
  `/graphics/campaigns/…svg` con `type: "image/svg+xml"`, sin nada más distinto que el `uri` y
  el `type`.
- **T-07** vuelve a contar los decodificadores por escalón sobre la página real, que es lo que
  el contrato de la fase pide: esta medición es en aislamiento.

## Lo que esta task NO midió

- **Nada sobre iOS ni sobre Safari.** Todo se midió en el Chrome real del sistema, que es el
  navegador contra el que esta demo se muestra.
- **Nada sobre el rendimiento** de varios SVG animados a la vez. El sobre medido del proyecto
  es de elementos de video, y `race.html` es donde eso podría importar.
- **Ningún creativo de las campañas**: los doce SVG del banco son fixtures de prueba, escritos
  para que cada pregunta tenga una respuesta inequívoca, y no entran a la demo.
