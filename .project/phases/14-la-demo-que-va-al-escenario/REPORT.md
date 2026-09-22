# Informe de cierre — fase 14: la demo que va al escenario

Abierta el 2026-09-21 y cerrada el 2026-09-22. **Doce tasks, las doce ejecutadas, y la demo
publicada y respondiendo sin credenciales.**

## 1. Resumen

Existe `demo/stage-pair/`, la quinta demo del repositorio y la única cuyo contenido visual está
**escrito y no generado**: tres campañas de fantasía autoradas como SVG animado, tres formas
cada una, y una carrera de seis autos que sale de un generador de primitivas vectoriales. Es la
demo que se le muestra a Apple.

**La fase nació de una restricción externa y de un encuadre que llegó después.** Apple comunicó
que **en la presentación que se hace en sus oficinas** no se puede mostrar contenido de video ni
de imagen generado por modelos de IA. Eso tumbó la fase 14 anterior el mismo día que se abrió,
sacó del guion a `race-multiview` —el cierre, generado de punta a punta— y dio vuelta el problema
que esa fase resolvía. **La restricción es de esa presentación y no de todo lo que la marca
publica**: las cuatro demos que existen siguen publicadas y esta fase no tocó ninguna.

**La decisión que la define es el ADR 0080**: cada demo resuelve su propio contenido, y el de la
que va a esa presentación se escribe como **SVG animado**, que es código que el navegador dibuja
y no la salida de un modelo. El 0045 —*"lo pictórico se genera"*— quedó `superseded`, y no sólo
porque su primer camino dejó de estar disponible: era **una receta única para todo el proyecto**,
y eso sólo funciona mientras todas las demos tengan las mismas ataduras.

**Y la fase mató un problema que estaba abierto desde la fase 03: el tramo invertido.** El par de
compatibilidad señaliza sus cinco breaks contra un único `asset-list-linear.json` de 12,0 s contra
un break concurrente de 48, así que durante 12 de esos 48 segundos el pane de fábrica ya volvió al
programa y el nuestro sigue con la pantalla tapada. Acá hay **un asset-list lineal por break, con
la duración de su break** (ADR 0082), y los dos panes entran y salen juntos:

```
== LA MEDICIÓN — index.html, escalón rico (T-07) ==
  break A  fábrica  20.001 ->  32.078   nuestro  19.945 ->  32.046   delta entrada  0.056 s  salida  0.033 s   IGUAL
  break B  fábrica  64.973 ->  77.075   nuestro  64.965 ->  77.030   delta entrada  0.008 s  salida  0.045 s   IGUAL
  break C  fábrica 109.962 -> 122.077   nuestro 109.922 -> 122.068   delta entrada  0.040 s  salida  0.009 s   IGUAL

==    EL CONTROL — el break concurrente dura 24.0 s y su lineal no ==
  break A  fábrica  19.790 ->  32.078   nuestro  19.908 ->  44.100   delta entrada  0.118 s  salida 12.021 s   DISTINTO
```

**Los doce segundos del control son exactamente el defecto de `compatibility-pair`**, y es lo que
hace que los 0,056 signifiquen algo: el instrumento sabe ver una diferencia de esa magnitud. La
medición se toma leyendo el estado del navegador —`interstitialsManager.playingItem.event.identifier`
de un lado y `provider.activeAt(t)` del otro—, que es el instrumento que la fase 03 eligió y
argumentó. La corrida equivalente sobre la señalización sola (T-06) da deltas de hasta 0,170 s con
el mismo control en 12 s.

**Lo que la demo afirma en escenario, y de dónde sale cada afirmación:**

| afirmación | qué la sostiene |
| --- | --- |
| el mismo stream en dos clientes, un cuadro | dos panes sobre la misma playlist, `stock-player.js` copia byte a byte del par de compatibilidad (`cmp` sin salida) |
| se monetiza sin tapar la pantalla | el recorrido pasa por las tres formas, una por break: `squeezebackDoubleBox`, `squeezebackLShape`, `lowerThirdOverlay` |
| se puede abrir el network tab y leer todo | `inspect.html` dibuja el tag, la petición y la respuesta **leídos** de la playlist en curso y del *performance timeline*, medido moviendo la fuente y viendo moverse la pantalla |
| la capacidad degrada el formato y no el aviso | `qa-decoder-count` viaja de verdad, con su control negativo en rojo, y la composición pasa de **2** elementos `<video>` a **1** sin cambiar layout, campaña ni duración (ADR 0083 y 0084) |

**La premisa sobre la que se apoya la escalera entera se verificó dos veces y no se asumió** —que
un elemento de imagen no consume un decodificador de video—: en aislamiento en la T-02 y sobre la
página real en la T-07, en los tres breaks y en los tres escalones. La variante magra deja **un**
elemento de video vivo, que es el primario; la rica, que es el control, deja dos.

**La producción:**

| | |
| --- | --- |
| creativos | **nueve piezas autoradas** (3 campañas × 3 formas) en `graphics/campaigns/`, y sus nueve variantes de video en `content/creatives/`: 12,000 s, 360 cuadros, 30 fps cada una |
| programa del par | SPARKS, de Netflix Open Content, CC BY 4.0, cortado en **198,0 s** —el fundido a negro arranca en 193,0 s y la placa de créditos en 199,0 s—, 99 segmentos |
| la carrera | un programa de **120,000 s** con quince planos y corte seco, y **seis cámaras de 64,000 s** que arrancan en el segundo 56 de la escena, que es donde `race.html` abre la ventana |
| señalización | dos playlists —rica y magra—, **nueve asset-lists** para el par y cinco más para la carrera |
| suite | **193 → 216 pruebas**, +23, cero desaparecidas comparando nombres |

**Y el cierre, con los mismos comandos de la línea de base:**

| chequeo | base (la T-01 el 2026-09-21, sobre `28999e2`) | al cerrar |
| --- | --- | --- |
| `npm test` | 193 pruebas, 193 pasan, 0 fallan | **216 pruebas, 216 pasan, 0 fallan** |
| `npm run check` | verde: 3 ocurrencias aceptadas, cero hits en la segunda | **igual, y con dos archivos más adentro de la lista auditada** |
| `git diff --stat -- lib/` | — | **vacío**, y se lo vio no vacío con su control |
| `git diff --stat` sobre las cuatro demos publicadas | — | **vacío**, con el mismo control |

**La demo está publicada.** Verificado hoy con `curl` sin ningún token:

```
/index.html                               200 text/html
/inspect.html                             200 text/html
/race.html                                200 text/html
/content/primary/con-daterange-rica.m3u8  200 application/vnd.apple.mpegurl
/content/primary/seg000.ts                200 video/mp2t
/graphics/campaigns/zumbra-16x9.svg       200 image/svg+xml
/                                         403   (listar denegado, que es lo correcto)
/no-existe                                404   (control del instrumento)
```

Sobre `https://qualabs-hls-demo-stage-pair.storage.googleapis.com/`. El 404 del control es lo que
hace que los 200 signifiquen algo: un `curl` que contestara 200 a todo habría contestado 200 ahí.

**Y el verde que no lo era.** El paso 7 de `publicar.sh` —la verificación de los objetos por md5—
devolvió `0 objetos comparados por md5, 0 distintos` y salió 0. **Un cero de cero no verifica
nada**, y el script no puede distinguirlo de un éxito: su bucle hace `continue` tanto cuando el
objeto no trae hash como cuando no encuentra el archivo local, y su código de salida depende sólo
del contador de distintos. La verificación se rehizo a mano sobre cuatro archivos
—`index.html`, `race.html`, un SVG y un `.ts`—: los cuatro idénticos, con el control de comparar
`index.html` local contra `race.html` remoto, que da distinto. Es exactamente la clase de verde
vacío que este proyecto persigue, y esta vez lo produjo un instrumento nuestro.

## 2. Decisiones tomadas

**Cinco ADR, cuatro escritos al abrir y uno que salió ejecutando.** El proyecto pasa de 79 a 84.

| id | scope | qué fija |
| --- | --- | --- |
| **0080** | project | Cada demo resuelve su propio contenido, y el de la que va a la presentación se escribe como SVG animado. **Supersede al 0045.** |
| **0081** | project | Una identidad por campaña, autorada tres veces con tres `viewBox`: 16:9, banner de 8,889:1 y backplate con su guarda |
| **0082** | project | Un asset-list lineal por break, con la duración de su break |
| **0083** | phase-14 | El parámetro de decodificadores viaja de verdad y la respuesta está horneada por valor |
| **0084** | project | La capacidad del dispositivo degrada el formato del aviso y no el aviso |

**El 0084 es el que más lejos llega y no estaba en el diseño: salió de una idea de Nicolás a
mitad de camino.** El reparto que la fase traía degradaba de forma desigual —un break bajaba al
aviso lineal, otro cambiaba el `mediaType`, y el del banner devolvía lo mismo en los dos escalones
porque un banner ya era una imagen—, así que en un tercio del recorrido el control no cambiaba
nada y en otro tercio el dispositivo de un decodificador terminaba viendo la pantalla tapada, que
es lo que esta tecnología existe para evitar. Textual de Nicolás: *"está bueno agregar un
resolution document que lo que haga sea devolver sólo los formatos imagen para los dispositivos
que tengan sólo 1 decoder y queramos mostrar ads no lineales de todos modos"*. Lo que salió de ahí
es **la afirmación central de la demo**: el publisher sigue monetizando y el espectador sigue
viendo publicidad no lineal; lo único que cambia es con qué está dibujada.

**El 0083 y el 0084 quedaron separados a propósito**, y el separarlos ya se pagó: el día que
exista un ad presentation server de verdad, el 0083 queda `superseded` y el 0084 sigue en pie tal
cual, porque la política de degradar el formato es del ad stack y no del transporte.

**El 0080 supersede al 0045 por dos motivos y no por uno.** El primero es la restricción; el
segundo es anterior a ella y es el que importa para adelante: el 0045 era una receta única para
todo el proyecto. El 0045 quedó `superseded` con su nota fechada y con lo que tenía de acertado
—escribir la geometría y la tipografía como SVG— conservado adentro del 0080. **El ADR 0062 no se
tocó**: dice dónde puede ir el movimiento generado, lo que sigue siendo cierto para cualquier demo
que no vaya a esa presentación.

**La fase consumió ADRs sin pedirles un campo nuevo**, que es la afirmación que esta demo existía
para poder hacer: el 0007 (dos tags en el mismo `START-DATE`), el 0012, el 0013, el 0017, el 0019
(el repliegue), el 0027 (enfocable es una caja de video), el 0044 (los números en un solo archivo),
el 0047 (la L), el 0059 (empaquetar a la cadencia de la fuente), el 0061 (la receta vive con el
generador), el 0063, el 0064, el 0065 y el 0066 (el tope de cuatro cajas). **`lib/` no se tocó**,
y el contrato entre las dos capas tampoco.

**Y dos decisiones se tomaron ejecutando y no están en un ADR**, las dos con su razón medida en el
documento de su task:

- **Los nueve SVG autorados viven en `graphics/campaigns/` y no en `content/`** (T-01 §7). El
  `TASKS.md` decía `content/`, que está gitignoreado porque es *"lo que cualquier clone reconstruye
  con un comando"*, y nueve SVG escritos a mano no son eso: si van ahí, un clone limpio se queda
  sin creativos y la fase pierde de git justo aquello sobre lo que apoya su tesis. El precedente
  del repositorio se midió con su control (`git ls-files demo/hydration-break/graphics/` da 18 y
  `content/` da 0, contra un `ls` de esa misma carpeta que devuelve 5 entradas).
- **Las dos playlists señalizadas viven en `content/primary/` y no en `signalling/`** (T-06 §5),
  por dos razones independientes: llevan un `START-DATE` que es hora de pared, así que en git sólo
  podrían estar viejas, y sus segmentos son relativos.

## 3. Tasks

**Las doce en `done`.** La T-12 quedó en `in-progress` hasta hoy porque su Definition of done
incluía la publicación y ésa esperaba el OK de Nicolás; hecha la publicación y verificada sin
credenciales, se cierra.

| id | qué dejó |
| --- | --- |
| T-01 | La línea de base medida, los tres briefs contrastados contra búsquedas, los tres `viewBox`, la guarda de la L elegida, el recorrido de los tres breaks, y `stage.json` como única fuente de los números |
| T-02 | Siete preguntas y siete respuestas con sus controles: el SVG anima adentro de `<img>`, el JavaScript no corre, el reloj se adelanta 3,25 s, el `@font-face` externo no resuelve, el alfa compone, y **un elemento de imagen no consume un decodificador** |
| T-03 | SPARKS transcodificado y empaquetado, el corte elegido mirando dónde empiezan los créditos, y la atribución de CC BY 4.0 con sus cinco piezas |
| T-04 | Los nueve SVG, con `ZUMBRA` aprobada antes de que existieran las otras dos campañas y las tres identidades aprobadas por Nicolás el 2026-09-22 |
| T-05 | `puente-a-video.sh`: reloj controlado con `pauseAnimations()`+`setCurrentTime()`, las nueve variantes de video, y la aserción de que lo capturado es lo animado con sus dos controles vistos en rojo |
| T-06 | Las dos playlists, los nueve asset-lists, las 14 pruebas, **el tramo invertido muerto y medido**, y la copia de `contract-trace.js` adentro del chequeo de costuras, vista roja |
| T-07 | `index.html`, el switch de tres posiciones, y las tres mediciones con sus controles: el parámetro viaja, la cuenta de decodificadores por escalón, y los dos panes juntos |
| T-08 | `inspect.html`: las tres movidas del intercambio leídas y no transcriptas, medido moviendo la fuente; y la hoja de estilos adentro del chequeo de costuras, vista roja |
| T-09 | La escena de la carrera y las seis cámaras, con la medida de que son seis encuadres y no seis copias; y el hallazgo del `-ss 0` que invalidaba la aserción de fase |
| T-10 | `race.html`: cuatro avisos entre los segundos 6 y 48, la ventana a los 56, las dos clases hermanas sin solaparse con su control en rojo, y 9 pruebas más |
| T-11 | El `README.md` y el `CREDITS.md` de la demo, el cruce automatizado del árbol contra los créditos con sus plantados en rojo, y la tabla del README de la raíz corregida de tres filas a cinco |
| T-12 | La no-regresión comparada por nombres con su control, los dos `git diff` vacíos vistos no vacíos, las cuatro demos publicadas verificadas sin credenciales y corriendo en el navegador, y el camino de publicación probado en seco |

### Las líneas del plan que no se siguieron, y las que se corrigieron sobre la marcha

**1. La T-06 copió `js/contract-trace.js`, que el `TASKS.md` le asigna a la T-07.** Sin el archivo,
el `grep` de `verificar-cortes.mjs` falla con status 2 y el chequeo entero se cae, así que la línea
que la T-06 tenía que agregar no se podía agregar antes de que el archivo existiera. Es una copia
byte a byte.

**2. La T-10 tocó `senalizar-contenido.sh`, que es de la T-06.** Una línea, la que llama al
señalizador de la carrera. `./run.sh` llama a un solo script por demo y `run.sh` está fuera del
alcance de la fase, así que era el único gancho. Va condicionada a que la señalización vaya a la
carpeta de la demo, porque el test de la T-06 le pasa `SIGNALLING` a un temporal y cuenta los
archivos que salen: cinco archivos más ahí lo habrían puesto rojo por una causa que no era la suya.

**3. La T-05 dejó escrita una aserción que después tuvo que corregir, y quien la encontró fue la
T-09.** `verificar-creativo.sh` sacaba cada cuadro con `ffmpeg -ss $t`, y el MPEG-TS que escribe el
empaquetado **no empieza en cero**: su primer PTS es 1,4667 s, el retardo de multiplexado por
defecto del contenedor, así que con `-ss 0` lo que vuelve no es el primer cuadro. Sobre los nueve
creativos el veredicto no se daba vuelta —se mueven poco y el orden entre los dos candidatos
quedaba del lado correcto— y sobre una cámara que barre la pista sí: 537.653 px de diferencia
contra los 2.733 del cuadro correcto. La T-09 no tocó el script de una task cerrada y escribió el
suyo; la corrección se aplicó después y **las nueve piezas se re-verificaron en verde**, con el
control en rojo: un video corrido quince cuadros pasaba en verde con la aserción anterior
(`11629 < 22582`) y con la nueva se pone rojo nombrando el desfasaje.

**4. El instrumento de píxeles de la T-02 estaba roto para esta fase y la T-05 lo arregló antes de
medir nada.** Devolvía 0 para un negro contra un verde, porque ImageMagick guarda en escala de
grises lo que tiene los tres canales iguales. El arreglo es `-colorspace sRGB` en las dos entradas,
y vive con un `--autotest` de siete casos de respuesta conocida que corre **antes** de cada corrida
del puente. Y apareció un segundo defecto que no estaba en el encargo: con umbral 0, un video
**congelado** difiere de sí mismo en 328.496 px de 921.600 por el ±1 de cuantización de H.264, así
que un video quieto pasa por movido. De ahí el tercer argumento de `pxdif.sh`, el umbral, que es
5 % en todo lo que toca un cuadro de video.

**5. La primera aserción de movimiento de la T-05 tenía un umbral absoluto y `KOVRIN` la puso
roja.** Su movimiento es *"el suelo y no el zapato"*, un patrón de tacos de bajo contraste que mueve
0,38 % del cuadro. El video estaba bien: el mismo par movía 0,375 % en el navegador, o sea que el
video movió **más** que el SVG. Lo que estaba mal era el número, calibrado contra un creativo
ruidoso. La referencia pasó a ser el propio SVG, que es la única que existe: cuánto se mueve es una
propiedad del creativo, y lo que el pipeline tiene que garantizar es que **no pierde** el movimiento
que había.

**6. El primer control de la T-08 dio rojo y el rojo era del instrumento.** Se usó el `START-DATE`
como fuente a mover, y el `START-DATE` es función pura del empaquetado: volver a señalizar no lo
mueve. El control que quedó —`CONTROL_DURACION_CONCURRENTE=24`— mueve las dos fuentes de una vez y
por eso es mejor.

**7. El instrumento de la T-07 se equivocó dos veces y las dos veces el rojo era suyo**: un pedido
de la corrida anterior que llegaba después del click, y una referencia "fuera del break" tomada
demasiado cerca del break, donde `bringAhead` todavía tiene construido el nodo. Las dos están
arregladas adentro del script con su comentario, y ahora la referencia se toma a nueve segundos y
se confirma con una segunda muestra, con el `t` impreso en la fila para poder auditarla.

**8. La T-10 reportó que la fase afirmaba cinco elementos de video a la vez en `race.html` y son
cuatro**, porque el tope de cuatro cajas del ADR 0066 cuenta al programa como una. No lo corrigió
—*"son de otras tasks"*— y los tres textos se corrigieron después: el R13 de `PHASE.md`, la sección
de `DESIGN.md` y los dos comentarios de `stage.json`, más una nota fechada en el documento de la
T-01. El número no se tipeó en ningún test: los dos leen `MAX_BOXES` de `lib/signalling.js`.

**9. Tres tasks no dejaron documento escrito, sólo evidencia.** La T-03 dejó tres capturas, la T-04
dejó los SVG y dieciocho PNG, y **la T-11 no dejó carpeta**. Sus entregables existen y son
auditables —`demo/stage-pair/content/primary/`, los nueve SVG en `graphics/campaigns/`, el
`README.md` y el `CREDITS.md` de la demo, y las cinco filas de la tabla del README de la raíz—, y
la fila del `TASKS.md` de cada una apunta a ellos en lugar de a un informe. Es una asimetría con
las otras nueve y queda anotada: lo que no hay es el registro de **cómo** se decidió, que en la
T-03 incluye la lectura de la licencia y la elección del corte.

## 4. Hilos abiertos

**`lib/` no tiene teardown, y las tres páginas lo rodean.** El switch de decodificadores rearma el
player en cada cambio, y lo único que hay para desarmar es `hls.destroy()` más reemplazar el DOM
en el que la composición dibujó. Medido sobre la librería:

```
$ /usr/bin/grep -c "requestAnimationFrame" lib/*.js | grep -v ':0'
lib/controls.js:1
lib/renderer.js:1
$ /usr/bin/grep -rn "addEventListener" lib/*.js | wc -l
31
$ /usr/bin/grep -rn "removeEventListener\|cancelAnimationFrame" lib/*.js | wc -l
0
```

Dos bucles de cuadro que se re-agendan solos y treinta y un listeners, contra cero formas de
soltarlos. En una demo de dos minutos no se nota; en una integración real, cada rearmado deja lo
anterior corriendo. **Es una dependencia de `lib/` y esta fase no entró a la librería**, que es lo
que su contrato mandaba. El comentario está escrito en `js/app.js` y en `js/inspect.js`, que es
donde alguien que rearme un player lo va a leer.

**El contrato de la T-12 afirma que los `.svg` necesitan su tipo de contenido a mano y está medido
que no.** El `TASKS.md` lo pedía *"por el mismo modo de falla que el `.ts`"*; la T-12 lo contrastó
contra la fuente primaria —los `.svg` ya publicados en `race-multiview`, `hydration-break` y
`compatibility-pair`, subidos por este mismo camino, devuelven `image/svg+xml`— y hoy el SVG
publicado de esta demo también. **El `.ts` sí lo necesita** y por eso el paso 5 de `publicar.sh`
sigue ahí. La línea del `TASKS.md` es registro y no se reescribe; queda anotado acá y en el
documento de la T-12, que es donde alguien lo va a buscar.

**El paso 7 de `publicar.sh` no verifica nada y sale 0.** Está descripto en §1. El arreglo no es
acordarse de mirar el número: es que el script **falle cuando compara cero objetos**, y que un
objeto que no se puede mapear a un archivo local sea un error y no un `continue`. Hoy el script
vive en `tasks/T-12/`, que es la carpeta de una task cerrada.

**Ningún dato sobre iOS ni sobre Safari**, y estaba escrito de antemano. Las doce tasks lo dicen
una por una: todo se midió en el Chrome real del sistema. Lo que esta fase le deja a Emil es
contenido publicado.

**Ningún dato sobre viabilidad en red.** Todo se sirvió local desde `server.mjs`, y que la demo
esté en GCS no la convierte en una medición de red. `PHASE.md` avisó de esta tentación exacta.

**Ninguna medición de rendimiento con varios SVG animados a la vez.** La T-02 lo dejó escrito: el
sobre medido del proyecto es de elementos de video, y `race.html` es donde eso podría importar.

**El guion de la demo no tiene dueño.** Qué se muestra, en qué orden y en cuántos segundos es lo
único que David nombró en la reunión y nadie tomó. David dijo que el evento da unos dos minutos
para todo, y esta fase entrega tres páginas; lo que hizo en su lugar es que las páginas permitan
saltar a un break sin esperar y que el switch conserve el segundo del programa. **La decisión sigue
siendo de la presentación y no de este repositorio.**

**`verificar-creativo.sh` y `verificar-fase-carrera.sh` siguen separados**, y la razón está escrita:
tienen entradas distintas —uno recaptura el navegador desde el SVG y el otro recibe los PNG que ya
originaron el video— y el segundo no mide ni cuadros ni duración. Los dos comparten hoy el mismo
criterio de fase, que es el que la T-09 validó.

**Un `@font-face` a un archivo externo no resuelve adentro de un `<img>`**, medido con su control:
da exactamente 0 píxeles de diferencia contra la base `monospace`, mientras que un cambio de
familia real da 57.380. Cualquier creativo futuro tiene dos salidas y sólo dos: la pila del sistema
o la fuente embebida como datos.

## 5. Riesgos que se materializaron

**R2 — un SVG mal formado no se dibuja y no avisa — se materializó antes de la fase y por eso
estaba escrito.** El caso es una tabla markdown adentro de un comentario XML: el separador
`| --- |` contiene `--`, que es ilegal dentro de `<!-- -->`. La guarda se vio fallar:

```
$ python3 -c "import xml.dom.minidom; xml.dom.minidom.parse('roto/tabla.svg')"
XML ROTO tabla.svg: not well-formed (invalid token): line 4, column 4
$ # el mismo archivo, abierto en Chrome:
   errores que emitio Chrome: NINGUNO
```

Chrome no dibuja nada y no emite una línea, así que la captura sale negra y el pipeline sigue.
**Este proyecto escribe cabeceras largas como documentación, que es exactamente donde uno escribe
una tabla.** No volvió a pasar en la fase porque cada paso que abre un SVG lo parsea primero.

**R4 — el reloj de la animación se adelanta — se materializó y está cuantificado.** `bringAhead`
construye el nodo tres segundos antes de que se vea, y para un SVG eso significa que el reloj
arranca ahí: el creativo **se ve por primera vez a 3,25 s de su propia animación**, tres de tres
corridas. No hay forma de elegir en qué fase se lo mira, así que la regla que gobierna la autoría
es que el bucle no puede tener un momento feo. Las tres campañas están autoradas contra eso, con un
bucle de 3 s de fases repartidas y un ciclo de 6 s que cierra idéntico al inicio.

**R1 no se materializó, y era el único lugar donde la fase podía terminar necesitando `lib/`.** La
hipótesis del SVG animado adentro de `<img>` se confirmó con sus tres controles: 91.268 px de
2.073.600 el SMIL y 329.521 el CSS, contra 0 del SVG sin animación y 0 del animado por JavaScript,
y el mismo archivo en un `<img>` suelto de la página se comporta igual. Costó cero de SDK.

**R1b no se materializó, y era la pata de la afirmación entera.** Un elemento de imagen no consume
un decodificador de video, medido con su control en la T-02 y de nuevo por escalón sobre la página
real en la T-07.

**R7 no se materializó, medido con dos controles.** Las seis cámaras se leen como seis encuadres de
la misma carrera: la pareja **más parecida** difiere en el 41,62 % del cuadro, contra el **1,47 %**
de una copia recoloreada construida de verdad —la alternativa que el diseño descartaba—, y contra
el 0 % del control de extracción. La pareja real más parecida está veintiocho veces por encima del
techo de lo que una copia puede diferir.

**R11 no se materializó porque la T-06 lo atajó, y se vio en rojo.** La copia de
`contract-trace.js` habría quedado fuera del chequeo de costuras sin que nada avisara; se la agregó
a la lista y se la verificó plantándole un término del transporte, con el contra-control de correr
el mismo plantado con el archivo comentado en la lista, que sale verde. La T-08 hizo lo mismo con
la hoja de estilos, que había quedado fuera por haberse creado después.

**R12 sigue en pie y no es un riesgo técnico.** Los dos minutos de demo del evento: la fase entrega
tres páginas y no entrega el guion.

**Y un riesgo que no estaba en la tabla y se materializó dos veces: la sesión que ejecutaba.** Está
en §6.

## 6. Recomendaciones para la fase siguiente

**Una sesión paralela que deja de responder no avisa, y el mecanismo de ejecución de esta fase
cambió a mitad por eso.** La fase arrancó con una sesión de Claude Code dedicada y falló dos veces.
La segunda está medida en `BITACORA-EJECUCION.md`: la sesión cerró la T-02 a las 22:38, terminó de
bajar SPARKS a las 22:42, y a las 04:02 llevaba **cinco horas y veinte minutos sin escribir un
archivo** mientras consumía CPU y renderaba el indicador de trabajo de forma continua. Se descartó
por medición que estuviera muerta, que le faltara el canal, que NATS estuviera caído y que hubiera
un `ffmpeg` largo corriendo; **no se determinó la causa**. Se la bajó por el PID que se había
guardado al lanzarla. Las doce tasks las entregaron **subagentes**, y el archivo append-only nació
justo de esto: sobrevive a que la sesión se caiga, y la entrada de las 04:05 la escribió el
coordinador porque la sesión nunca llegó a escribir la suya.

**Y hubo un incidente de infraestructura que la bitácora no registró: la máquina se quedó sin
espacio en `/run/user/1000`.** Es RAM y son 1,6 G, y la fase escribe ahí todos sus temporales:
cuadros PNG a 1920×1080 de un pipeline que produce dieciséis piezas de video. La sesión que
ejecutaba se cayó. **El trabajo no se perdió; lo que se perdió fue el contexto de una sesión.** El
arreglo no es acordarse de borrar: una corrida que llena un tercio de la RAM de la máquina tiene
que declarar cuánto va a ocupar antes de empezar, o escribir a una carpeta con un tope. Queda
anotado acá porque no está en ningún otro lado de `.project/`.

**Un instrumento nuevo se prueba contra casos de respuesta conocida antes de medir con él, y esta
fase lo pagó dos veces.** El comparador de píxeles de la T-02 devolvía 0 para un negro contra un
verde y lo descubrió la T-05 al cruzar cuadros de video contra cuadros de navegador; `compare
-metric AE` de este ImageMagick no devuelve un conteo de píxeles y lo descubrió la T-02. El
`--autotest` de siete casos que la T-05 dejó puesto es la forma barata: corre antes de cada corrida
y cuesta segundos.

**Un umbral absoluto sobre "cuánto se mueve algo" no puede existir, porque cuánto se mueve es una
propiedad de lo que se mide.** La referencia tiene que ser la misma propiedad medida sobre la
fuente. Es la lección de `KOVRIN` y es transferible a cualquier aserción sobre contenido.

**Un cuadro extraído con `-ss 0` de un MPEG-TS no es el primer cuadro**, porque el contenedor
arranca en 1,4667 s por el retardo de multiplexado. Y la forma de la aserción importa tanto como el
cuadro: decidir la fase **por mínimo sobre varios candidatos** en lugar de por una comparación entre
dos es lo que hace que un empate no lo decida el ruido. Las dos cosas están hoy en
`verificar-creativo.sh` y en `verificar-fase-carrera.sh`.

**Un negativo de publicación necesita el control de un instrumento que sepa encontrar.** Los tres
verdes de esta fase que lo tienen —el 404 de la ruta inventada, el `diff` plantado en `lib/`, el
comparador de nombres de pruebas al que se le sacó una— valen; el que no lo tuvo es el paso 7 de
`publicar.sh`, que contó cero y salió 0.

**Y la publicación no es el final del trabajo sino el principio de una verificación.** El camino
quedó escrito, probado en seco y detrás de una bandera, que es la forma correcta de dejar algo que
va hacia afuera esperando una autorización. Lo que faltó fue que el paso que verifica lo publicado
pudiera ponerse rojo.

## 7. Correcciones post-ejecución

**Una sola**, recogida con el `grep` que la convención manda:

```
$ grep -n "post-ejecuci" .project/phases/14-la-demo-que-va-al-escenario/TASKS.md
331:- **post-ejecución:** 2026-09-21, la tapa de la lata de `ZUMBRA` no se leía como una tapa;
```

**Y el instrumento sabe encontrar**: el mismo `grep` sobre los `TASKS.md` de las otras fases
devuelve cinco archivos (01, 05, 06, 07 y 08), así que el uno es del archivo y no de la búsqueda.

**Es de la T-04, que es la task de autoría visual, que es donde esta corrección tiene que
aparecer.** Nicolás miró la 16:9 de `ZUMBRA`, la tapa de la lata no se leía como una tapa, se
corrigió y se aprobó, con la evidencia del antes y el después guardada. **Leído como medición, el
uno dice que la compuerta funcionó**: la fase tiene una sola compuerta —Nicolás mira la primera
forma de cada campaña antes de que se autoren las otras dos— y la corrección entró ahí, en la pieza
más barata de rehacer, antes de que existieran las otras ocho. Con `KOVRIN` y `KETRAVA` la compuerta
se cumplió sin pedir cambios, y las tres identidades quedaron aprobadas el 2026-09-22.

**Las once tasks restantes no necesitaron corrección post-entrega**, y eso no es porque nadie las
haya mirado: los defectos que aparecieron los encontraron las tasks siguientes corriendo los
instrumentos de las anteriores —el `-ss 0` lo encontró la T-09 sobre el script de la T-05, el
comparador de píxeles lo encontró la T-05 sobre el de la T-02, el número de elementos de video lo
encontró la T-10 sobre tres textos de otras—, que es la forma que esta fase tuvo de auditarse.

## 8. Revisión de documentación

Superficie por superficie, con lo que se actualizó o por qué no necesitaba nada.

**El índice de fases de `PROJECT.md`** — **reescrito en este cierre.** Su línea decía *"abierta y en
ejecución"* y ahora dice qué terminó siendo la fase: la quinta demo, el criterio del SVG, la
escalera de decodificadores, el tramo invertido muerto, lo que publicó y lo que dejó abierto.

**`docs/arc42/`** — no existe, y esta fase no lo crea, por la misma razón que las trece anteriores:
los dos documentos de `docs/` cumplen ese papel para el único lector que tienen.

**`docs/contrato-senalizacion-renderizado.md`** — **re-leído y no cambió, y eso era la prueba.**
Esta fase **consume** el contrato de punta a punta sin pedirle un campo: los dos tags en el mismo
`START-DATE` (ADR 0007), el repliegue de nivel superior (ADR 0019), el bloque de oferta de multi
view (ADR 0064), y la distinción por `mediaType` sobre la que se apoya la escalera entera, que ya
estaba. `PHASE.md` lo declaró de antemano y se cumplió: si esta fase hubiera necesitado un método
nuevo del proveedor, eso era una dependencia y había que parar.

**`docs/integrating-the-library.md`** — **no necesitaba nada**, y también estaba declarado: ya
documenta `decoderCount` y el parámetro `qa-decoder-count` en el que se convierte, así que la fase
lo usó tal como está escrito. Medido y no prometido: `git diff --stat -- lib/` vacío, con su control.

**El `README.md` de la raíz** — **corregido por la T-11, y es la corrección que la fase 13 había
reportado sin tocar.** Su tabla listaba tres demos cuando había cuatro; ahora tiene las cinco, con
la fila de `race-multiview` que faltaba y la de `stage-pair` nueva, en el registro que las otras
usan. Verificado:

```
$ /usr/bin/grep -c "race-multiview" README.md
1
$ /usr/bin/grep -c "stage-pair" README.md
1
```

**El `README.md` de la demo** — **escrito por la T-11**: qué argumenta, qué muestra cada una de sus
tres páginas, cómo se corre, y qué hace el control de decodificadores con la aclaración de que no
hay servidor.

**`demo/stage-pair/CREDITS.md`** — **escrito por la T-11, y es el instrumento de la afirmación
central de la fase.** *"Acá no hay nada generado por un modelo"* no se sostiene mirando píxeles: se
sostiene con la lista completa, una fila por archivo, y **un archivo sin línea bloquea la demo**.
La T-11 automatizó el cruce en `test/verificar-creditos.py`, que audita `content/` y `graphics/` y
se probó con sus plantados en rojo. Es la regla C de la política de documentación con su mitad de
chequeo puesta.

**El `CLAUDE.md` del proyecto — quedó desalineado en dos puntos y no se corrigió acá**, porque este
cierre está acotado a `.project/`. Los dos van como hallazgo:

```
$ /usr/bin/grep -n "four" CLAUDE.md
8:**Not here.** This file is the orientation; what governs the work lives in four places,
27:All four are **public on the internet**, on Google Cloud Storage, project
```

La línea 27 y su tabla listan **cuatro** demos publicadas y son cinco: falta la fila de
`stage-pair`, con su bucket `qualabs-hls-demo-stage-pair`. Y a su sección de publicación le falta
lo que esta fase midió: **los `.svg` no necesitan el tipo de contenido a mano**, al revés de lo que
el contrato de la T-12 suponía. La línea 8 es el control de la búsqueda —habla de otra cosa, de los
cuatro lugares donde viven las reglas, y es correcta—, que es lo que hace que el hallazgo de la 27
sea del archivo y no del `grep`. Lo que sí sigue vigente ahí y esta fase usó tal cual es el `-x` que
ancla su regex al principio del path, la trampa que la fase 13 le agregó, y la del tipo de contenido
de los `.ts`.

**`.project/knowledge/`** — no existe, y la fase no produjo nada que califique. El candidato era la
receta de la captura de SVG a video, y el ADR 0061 ya manda que viva con el generador: está en la
cabecera de `puente-a-video.sh` y de `capturar-svg.py`.

**El `CLAUDE.md` y el `knowledge/` del repo padre** — **no se tocaron.** El bloque de constraints de
esta fase ya manda los temporales a `$XDG_RUNTIME_DIR`, que es lo que
`knowledge/reglas-para-workers.md` pide: la contradicción que la fase 13 reportó —su `TASKS.md`
mandaba a `/dev/shm`— está resuelta del lado del molde de las tasks. Lo que esta fase aporta al repo
padre es el incidente de §6: `$XDG_RUNTIME_DIR` es RAM y en esta máquina son 1,6 G, y una corrida
que produce cuadros PNG los llena. No se escribe una regla acá porque una regla se acuerda con
Nicolás antes de escribirla.

**El doc de instalación o runbook** — el proyecto no tiene uno separado: `./run.sh <demo>` es el
punto de entrada y lo dice el `README.md` de la raíz. `run.sh` no se tocó y no hizo falta, porque
toma el nombre de la demo como argumento y usa su carpeta como raíz de documentos; `server.mjs`
tampoco, porque sirve la carpeta entera y una segunda y una tercera página son dos archivos más.
**Lo que esta fase sí agregó es un paso de setup que no es parte de `run.sh`**: la reconstrucción
del contenido —el transcode de SPARKS, las dieciséis capturas a video—, que se corre a mano y está
documentado en el README de la demo, que es donde alguien con un clon nuevo lo va a buscar.

**Las carpetas `tasks/` de esta fase** — son **registro** y no instrucción vigente. Sus documentos
prueban qué se corrió y qué se midió el 21 y el 22 de septiembre, y no se reescriben. Dos ya llevan
su nota fechada, agregadas mientras la fase estaba abierta: la del documento de la T-01 —los
`~195 s` estimados contra los 198,0 s medidos, y el número de elementos de video— y la del de la
T-09, que dice que las dos correcciones que esa task dejó pendientes ya están hechas. **Lo que
queda desactualizado y sin nota es el `publicar.sh` de la T-12**, cuyo paso 7 no verifica y cuya
suposición sobre los `.svg` el propio documento de la task desmiente; las dos cosas están en §4,
que es el documento vivo donde alguien las va a buscar.
