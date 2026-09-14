# Las cinco cámaras restantes, y lo que midieron

Cuarenta y seis generaciones, **US$36,80**, de un techo de US$57,60. Existen los cinco
archivos: `marvok.mp4`, `noctev.mp4`, `runtak.mp4`, `pentav.mp4` y `quentra.mp4`, **64,000000 s
exactos, 1536 cuadros a 24 fps, 1280×720**, cada uno con audio y sin una palabra hablada. Con
CALDRIX, el catálogo tiene **seis** cámaras y la grilla llega hasta cuatro cajas, que es la
mitad del argumento de esta demo.

El veredicto en una línea: **el molde de la T-05 se transporta —34 de 40 clips salieron a la
primera— y los seis rechazos no son seis casos sino tres modos de falla, los tres de la misma
familia: el modelo completa lo que el prompt no ocupa, y lo completa con televisión, con un
auto que no es de este mundo, o con el nombre del color pintado en la chapa.**

Las cinco láminas de contacto están en [`lamina/`](lamina/), una por cámara. La comprobación
propia de esta task —las seis juntas— es
[`lamina/6-las-seis-en-grilla.jpg`](lamina/6-las-seis-en-grilla.jpg).

---

## 1. El molde se transporta, y ése era el supuesto caro de la etapa

La T-05 dejó escrito que las otras dos cámaras de a bordo *"heredan el bloque tal cual
cambiando la palabra del color"*. Se cumplió, y se extendió más lejos de lo que ella podía
prometer: las tres cámaras de **seguimiento**, que la T-05 no probó, salieron con el bloque
`SEGUIMIENTO` del programa —el que separó las diez casillas aprobadas de las cuatro
rechazadas— sin una sola falla de geometría en 24 clips.

**Los bloques no se copiaron: se importan.** `generar-camaras.py` carga `LUGAR`, `AUTOS`,
`CALZADA`, `ATORNILLADA`, el sonido y el renombre del verde desde `generar-camara.py`, y
`SEGUIMIENTO`, `PISTA` y `UNICIDAD` desde `generar-programa.py`, por path. Los cuarenta clips
llevan **los mismos bytes** del párrafo del mundo que llevaron el programa y CALDRIX, que es
el R1 de `PHASE.md` resuelto por construcción en vez de por revisión.

| cámara | clase | a la primera | rechazados |
| --- | --- | ---: | ---: |
| MARVOK | a bordo | 7 de 8 | 1 |
| PENTAV | a bordo | 7 de 8 | 1 |
| NOCTEV | seguimiento | 5 de 8 | 4 |
| RUNTAK | seguimiento | 8 de 8 | 0 |
| QUENTRA | seguimiento | 8 de 8 | 0 |
| | | **34 de 40** | **6** |

**Y ninguna generación se perdió.** Cero `code 14` en 46 lanzamientos, contra 3 de 13 en la
T-05 y 2 de 6 en la T-03. El detalle de cómo se lee eso —y por qué no invalida la estimación
del 20 % que hizo la T-05— está en [`el-gasto.md`](el-gasto.md).

## 2. Los tres modos de falla, que son la misma cosa vista de tres lados

Los cinco clips rechazados están en
[`lamina/9-los-cinco-rechazados.jpg`](lamina/9-los-cinco-rechazados.jpg), cada uno con su
defecto marcado, y sus `.mp4` quedaron en `content/.fuentes/camaras/<cámara>/rechazados-*/`
con el prompt que viajó.

### `television race coverage` se toma al pie de la letra dos de cada dieciséis veces

El bloque `CAMERA` de las cuarenta empieza con *"television race coverage"*, que es el texto
que la T-03 midió y que la T-05 heredó. En dos clips de a bordo el modelo lo leyó como el
sujeto de la toma y no como su estilo:

- **MARVOK 04** volvió con una **pantalla de televisión filmada en una habitación** —marco,
  marca en el borde de abajo— y con el reloj de la transmisión, `08:07:1 / LAP 36`, encima.
- **PENTAV 06** volvió con **gráficos de transmisión pegados**: un logo `TV` arriba a la
  izquierda y un velocímetro con texto abajo.

Los dos rompen dos cosas a la vez: la ficción del feed, y el ADR 0045 y el 0062, que es lo que
prohíbe tipografía adentro del cuadro.

**No se tocó el prompt y las dos segundas tiradas volvieron limpias**
([`lamina/10-las-segundas-tiradas-de-a-bordo.jpg`](lamina/10-las-segundas-tiradas-de-a-bordo.jpg)).
Es la decisión barata y es la correcta: 14 casillas del programa y 8 clips de CALDRIX viajaron
con esas mismas dos palabras sin que pasara nunca, así que **la tasa es del orden de 2 en 30 y
no una propiedad del texto**. Reescribir el bloque para tapar un 7 % habría cambiado el único
párrafo que hace que los seis feeds se lean como la misma transmisión.

### El exterior de una curva devuelve un auto de ruedas cubiertas

Es el hallazgo transferible de esta task y costó tres generaciones.

**NOCTEV 02 y NOCTEV 06 volvieron con un prototipo cerrado** —carrocería envolvente, ruedas
tapadas, aleta dorsal—, que no es ninguno de los seis monoplazas de este mundo. NOCTEV 06
salió bien a la segunda
([`lamina/11-las-segundas-tiradas-de-noctev.jpg`](lamina/11-las-segundas-tiradas-de-noctev.jpg));
**NOCTEV 02 falló dos de dos**, y ahí se aplicó la regla que la T-03
dejó escrita después de cinco planos aéreos fracasados: *la palanca no es escribir mejor*.

**Lo que las dos casillas fallidas tienen en común, y que las 22 sanas no tienen, es el
encuadre:** pedían la cámara quieta **en el exterior de una curva** o **baja al costado de una
recta**, y el modelo compone eso como un **tres cuartos de frente**, con el auto viniendo hacia
la lente. De frente, este modelo dibuja una carrocería cerrada. **Todas las tomas que volvieron
con el auto de costado trajeron ruedas descubiertas**, las 24 de seguimiento incluidas.

Así que la casilla 02 no se pidió una tercera vez igual: se le cambió el plano por el que el
modelo sí sostiene —la cámara sigue quieta al borde de la pista, que es lo que esa casilla
aporta al reparto, pero mira **el costado** del auto en un tramo recto— y las ruedas
descubiertas se nombraron **en positivo dentro del cuadro** (*"its four wheels out in the open
air clear of the bodywork"*) en vez de prohibir la carrocería cerrada, que es la regla de la
fase 08. Volvió bien a la primera:
[`lamina/12-noctev-02-de-costado.jpg`](lamina/12-noctev-02-de-costado.jpg).

**Lo que hereda quien genere más contenido de esta carrera:** una toma de seguimiento se pide
de costado. El tres cuartos de frente no está prohibido —QUENTRA tiene cuatro casillas que
volvieron de frente y con ruedas descubiertas—, pero es donde el defecto aparece, y no hay
ninguna toma que lo necesite.

### El nombre del color se pinta en la carrocería, y en una toma cerrada se lee

**NOCTEV 04 volvió con `BRIGHT` en letras blancas grandes sobre el pontón y `AQUAMARINE`
sobre la toma de aire.** Es el mismo fenómeno de la casilla 10 del programa (`Apple` pintado)
y de la casilla 4 (`AQUAAMARINE` en el alerón), pero con una diferencia que importa: **acá se
lee**. La T-03 cerró la tipografía diciendo *"no es texto legible: es garabato con forma de
patrocinador"*, y a 470 px se vuelve mancha; una palabra de seis letras sobre el pontón en una
toma cerrada, no.

**De ahí sale el criterio con el que se rechazó, y que antes de esta task no estaba escrito:
un clip se rechaza cuando la tipografía es LEGIBLE, y se acepta cuando es garabato.** Con esa
vara, de los 40 clips se rechazó uno. Los otros 39 traen lo que el programa ya traía —rótulos
ilegibles en los alerones, alguna calcomanía en el pontón, un número chico en RUNTAK 01— y eso
es lo que un auto de carrera tiene.

**El padrón de seis colores no se renombró, y `BRIGHT AQUAMARINE` viajó en los cuarenta.** La
decisión es deliberada y va contra el reflejo, así que va con sus dos razones:

- **No es una marca.** Lo que el R2 defiende es que el auto no se parezca a un equipo real;
  `Apple` era eso y por eso la T-05 lo renombró en los ocho. `AQUAMARINE` pintado es un
  garabato con más letras.
- **Cambiar la palabra del color mueve el color.** La T-01 gastó tres iteraciones descubriendo
  exactamente eso: `VIVID YELLOW-GREEN` devolvía amarillo y `BRIGHT APPLE GREEN` devolvía
  verde. El auto de NOCTEV está medido en el programa en `#24ACC8` y su fila del selector está
  pintada de ese color; renombrarlo por prolijidad habría movido el único número que hace que
  la fila signifique algo, para arreglar un garabato que a tamaño de caja no se ve.

La segunda tirada de la casilla, con el mismo prompt, volvió sin una palabra legible.

## 3. Las seis juntas: es la misma carrera, y son seis autos distintos

Es la comprobación que ninguna task anterior pudo hacer, porque hasta ahora no había seis.

**A ojo**, en [`lamina/6-las-seis-en-grilla.jpg`](lamina/6-las-seis-en-grilla.jpg), con el
mismo instante de cada feed: el mismo cielo cubierto y plano, el mismo asfalto gris medio, los
mismos pianos blancos y rojos, la misma tribuna gris con público ralo, el mismo muro de bandas
diagonales. Las dos clases de toma se distinguen de un vistazo —tres cabinas y tres autos
enteros—, que es lo que hace que seis cajas valgan más que seis ángulos del mismo plano.

**Y medido.** Verbatim en
[`salidas/es-la-misma-carrera.txt`](salidas/es-la-misma-carrera.txt). Se mide **el cielo**,
que es el parche que está en las dos clases de toma: 32 cuadros por feed, uno cada dos
segundos, la mediana de los píxeles claros y sin color de la mitad de arriba.

| qué se compara | dE00 |
| --- | ---: |
| **los cielos de los seis feeds entre sí, los quince pares** | **0,9 – 7,9** |
| *control: los mismos cuadros virados a hora dorada* | *10,8 – 16,0* |
| *control: metraje real de otro mundo (la demo del partido)* | *12,5 – 17,0* |
| *control: la mitad de ABAJO de esos mismos cuadros* | *10,8 contra su propia mitad de arriba* |

Los seis están **más cerca entre sí que cualquiera de los tres controles**, y los tres
controles usan el mismo operador sobre las mismas imágenes, que es lo único que los hace
comparables.

**Y el tercer control hay que leerlo con cuidado, porque no hizo lo que se esperaba.** Se
escribió esperando que el piso del 2 % rechazara los recortes de la mitad de abajo —asfalto,
piano, carrocería— y **no los rechaza: 29 de 32 votan**, porque el asfalto claro y los pianos
blancos también son claros y sin color. O sea que **el piso no separa arriba de abajo, y decir
"esto mide cielo" apoyándose en él habría sido falso**. Lo que sí separa es el color que
devuelve cada mitad: la de abajo da `#DAE1CC` contra `#F4F9F9` de la de arriba, 10,8 de
distancia, contra los 0,9 a 7,9 de los seis feeds entre sí. Eso es lo que dice que los seis
coinciden en algo específico y no en el gris promedio de cualquier imagen.

**La identificación al tamaño que importa.**
[`lamina/8-al-ancho-de-una-caja-190.jpg`](lamina/8-al-ancho-de-una-caja-190.jpg) pone los seis
a 190 px —una de cuatro cajas a 400 de ancho, o sea un teléfono—: se pierde todo el detalle y
los seis siguen siendo seis autos de seis colores. A 470 px
([`lamina/7-…`](lamina/7-al-ancho-de-una-caja-470.jpg)), más todavía.

## 4. El portón de transcripción: 40 de 40 sin habla, y se lo vio rechazar

Se corrió el mismo instrumento de la T-05 —`oir-la-camara.sh`, con sus dos oyentes y sus dos
controles— una vez por cámara. Verbatim en
[`salidas/el-porton-de-audio-<cámara>.txt`](salidas/).

| oyente | los 40 clips | control positivo: el ambiente con una línea de relator real a −20 LUFS | control de otro origen: la parada del partido |
| --- | --- | --- | --- |
| whisper.cpp medium | motor, gomas, y **`[Music]` o `(dramatic music)` en varios** | *"Norvik are still in front here, 1-0…"* | *"Yeah, we needed this break, I'm shattered…"* |
| gemini-2.5-flash | `SPEECH: NO` en los 40 | `SPEECH: YES` + transcripción | `SPEECH: YES` + transcripción |

**El control se ve rechazar en las cinco corridas**, que es lo que hace que los 40 `SPEECH: NO`
signifiquen algo: el control positivo es **el ambiente del propio primer clip de esa cámara**
con seis segundos de relator real mezclados encima, así que un portón que dijera `NO` a todo
también lo diría a ése. No lo dice: lo marca y lo transcribe, en las cinco.

La discrepancia de whisper —"música" donde hay motor— es la falla conocida que la T-03
documentó en la casilla 12 y la T-05 en cuatro de ocho, y se resuelve a favor del segundo
oyente, que escucha el archivo en vez de transcribirlo. **El portón decide sobre habla**, y ahí
los dos coinciden.

**Y se corrió también sobre el entregable**, que es lo que la demo reproduce y no lo que la
alimenta: los seis feeds de 64 s pegados, emparejados y recodificados a AAC dan `SPEECH: NO`,
con el mismo control positivo sobre el feed armado dando `SPEECH: YES`
([`salidas/el-porton-sobre-los-feeds.txt`](salidas/el-porton-sobre-los-feeds.txt)). Hacen falta
las dos corridas porque entre el clip verificado y el archivo entregado hay tres pasos —el
concat, la ganancia por clip y la recodificación— que ningún chequeo sobre los insumos cubre.

### El nivel, emparejado contra el programa

El destino no está tipeado: `armar-camara.sh` lo mide de `programa.mp4` en cada corrida. Los
seis feeds quedaron a un décimo de él:

| | I | LRA | pico |
| --- | ---: | ---: | ---: |
| `programa.mp4`, que es el destino | −23,0 LUFS | 4,7 LU | −6,7 dBFS |
| caldrix | −23,0 | 2,4 | −10,5 |
| marvok | −23,1 | 1,9 | −10,1 |
| noctev | −23,0 | 3,1 | −10,7 |
| runtak | −23,0 | 3,2 | −6,7 |
| pentav | −23,1 | 2,3 | −10,9 |
| quentra | −23,0 | 4,6 | −5,6 |

Importa por el ADR 0026: el foco de audio le da volumen 1 al feed agrandado y 0 a los demás,
así que agrandar cualquiera de las seis calla la transmisión. Con los siete al mismo nivel ese
momento —que es el beat de audio de la demo— es un cambio de contenido y no un salto de
volumen, **sea cual sea la cámara que el espectador eligió**.

## 5. Los largos, y los dos controles que se ven en rojo

`verificar-largos.mjs` corre adentro de `preparar-contenido.sh` y lee `race.json` en vez de
tipear los números. Verbatim en
[`salidas/el-empaquetado-de-los-seis.txt`](salidas/el-empaquetado-de-los-seis.txt):

```
VERDE  el programa           112.000000 s contra 112.000 declarados (0.000000 s) · 56 segmentos
VERDE  CALDRIX, on-board      64.000000 s contra  64.000 declarados (0.000000 s) · 32 segmentos
VERDE  MARVOK, on-board       64.000000 s contra  64.000 declarados (0.000000 s) · 32 segmentos
VERDE  NOCTEV, trackside      64.000000 s contra  64.000 declarados (0.000000 s) · 32 segmentos
VERDE  RUNTAK, trackside      64.000000 s contra  64.000 declarados (0.000000 s) · 32 segmentos
VERDE  PENTAV, on-board       64.000000 s contra  64.000 declarados (0.000000 s) · 32 segmentos
VERDE  QUENTRA, trackside     64.000000 s contra  64.000 declarados (0.000000 s) · 32 segmentos

ROJO   CONTROL sin el último segmento     110.000000 s contra 112.000 declarados (-2.000000 s)
ROJO   CONTROL con un #EXTINF estirado    112.500000 s contra 112.000 declarados (0.500000 s)

PASA, y se vieron los dos controles en rojo.
```

Los 64,000 s no se consiguen recortando: son 8 × 192 cuadros, y el script se niega a correr si
no hay exactamente ocho clips en la carpeta de una cámara. **Y el catálogo no se editó a
mano**: `preparar-contenido.sh` empaqueta las cámaras que tengan su `.mp4`, así que las cinco
nuevas entraron solas y `senalizar-contenido.sh` las ofrece en el asset-list —**seis vistas**—
sin que nadie tocara una lista.

## 6. El hexadecimal de CALDRIX no se mueve

La T-05 dejó abierto si el `#CCB21F` de `race.json` tenía que correrse hacia el `#F6F252` que
devuelve su cámara de a bordo. **Se resolvió midiendo, y la respuesta es que no se toca.**
Verbatim en [`salidas/el-hex-del-selector.txt`](salidas/el-hex-del-selector.txt).

**La medición se hizo sobre el programa y no sobre la cámara**, porque el hexadecimal no
existe para reproducir un cuadro: existe para que las seis filas del selector se distingan
entre sí y contra el fondo oscuro del panel. Con esa vara, lo que hay que medir no es la
distancia entre la cámara y el programa —eso ya lo midió la T-05 en 15,4— sino dos cosas que
ella no midió:

| | dE00 | control |
| --- | ---: | --- |
| **las seis filas entre sí** (el par más parecido: MARVOK / RUNTAK) | **13,7** | *seis grises separados de a cuatro puntos: 1,5 – 7,9* |
| **CALDRIX contra el auto más cercano** (QUENTRA) | **26,6** | |
| **cada fila contra el fondo del panel**, el peor caso (MARVOK) | **18,6** | *el fondo + 10 por canal: 3,2* |
| **CALDRIX contra el fondo del panel** | **60,4 – 67,3** | |

El fondo es `rgba(12, 16, 24, 0.82)` de `.qa-views`, medido en sus dos extremos: el panel sobre
negro y sobre un cuadro claro, porque un panel translúcido no tiene un fondo.

**CALDRIX es la fila mejor separada de las seis**, tanto de sus vecinas como del fondo. Correrlo
hacia el amarillo de la cámara lo separaría todavía más —de 26,6 a 39,7— pero eso no es un
beneficio: **la fila que hay que mirar es la que está más apretada, y es MARVOK contra RUNTAK
en 13,7**, que este cambio no toca. Mover el único hexadecimal que nadie necesita mover es
riesgo sin ganancia.

**Y hay un dato que la pregunta no contemplaba y que conviene decir: hoy nada pinta esos
colores.** `lib/controls.js` dibuja las filas del selector en blanco sobre el panel, sin
muestra de color; el asset-list no lleva el campo; ningún script lo lee. El `color` de
`race.json` es, por ahora, la ficha del auto escrita donde se la puede auditar. Eso no cambia
la decisión —si algún día se pinta, se pinta con estos números— pero sí baja lo que estaba en
juego.

## 7. Lo que no se rompió

`npm test` da **193 pruebas, 193 pasan, 0 fallan**, salida 0; `npm run check` da **verde** —3
ocurrencias, las tres en la lista aceptada, y cero hits en la segunda—, salida 0. Verbatim en
[`salidas/no-se-rompio-nada.txt`](salidas/no-se-rompio-nada.txt). Son 9 pruebas más que las 184
con las que la T-05 cerró la etapa 2; las nueve las agregó la T-09, que corre en paralelo sobre
la página.

**Y `lib/` no se tocó:**

```
$ git diff --stat -- lib/
$
```

Sin una línea de salida. Todo lo que esta task escribió vive en `demo/race-multiview/content/`,
`demo/race-multiview/scripts/generar-camaras.py`, `demo/race-multiview/signalling/`,
`demo/race-multiview/audio/` y `.project/phases/13-…/tasks/T-08-las-cinco-camaras/`.
**`race.json` tampoco se tocó**, que es la decisión de la §6.

## 8. El tope, y el arreglo que la T-05 propuso

El generador cuenta las líneas del registro y se niega a lanzar si la próxima pasaría de 72.
Los cuatro guardas se corrieron rotos a propósito para verlos en rojo, y los dos casos del tope
no tocan la red:
[`salidas/los-guardas-se-ven-fallar.txt`](salidas/los-guardas-se-ven-fallar.txt).

| guarda | roto a propósito | lo que salió |
| --- | --- | --- |
| el tope frena | registro con 72 anotadas, una pedida | `TOPE: hay 72 generaciones lanzadas…`, salida 1 |
| el tope **no** frena | registro con 60 anotadas, ocho pedidas | lista las ocho y sale sin lanzar, salida 0 |
| la cámara quieta que viaja | los bloques `PISTA` y `SEGUIMIENTO` juntos | `…piden una camara que se queda quieta viajando`, salida 1 |
| el auto equivocado | la ficha de RUNTAK apuntando al bronce | `…no nombran 'DARK BRONZE GOLD'…`, salida 1 |
| ninguno roto | — | 40 prompts armados, salida 0 |

**Dos de los cuatro nacieron de un error que este mismo control encontró**, y por eso están:

- **La cámara quieta que viaja.** La primera versión de `generar-camaras.py` ponía `PISTA`
  **y** `SEGUIMIENTO` en los cuatro clips de cámara quieta, o sea un prompt que pedía a la vez
  una cámara clavada en el piso y una que corre al lado del auto. Nada lo habría avisado: el
  clip habría vuelto raro y el diagnóstico habría sido "Veo no sostiene la toma". El guarda
  mira el **texto armado** y no la bandera que lo armó, que es lo que lo hace valer.
- **El auto equivocado.** La primera versión preguntaba *"¿está el color de esta cámara en el
  prompt?"* y **se la vio pasar con la ficha de RUNTAK apuntando al bronce**, porque el bloque
  `AUTOS` nombra a los seis autos en las cuarenta: la respuesta era siempre que sí. Reescrito,
  mira sólo los bloques del clip y exige que cualquier otro color del padrón esté declarado en
  `ajenos` —los tres clips de MARVOK con el amarillo adelante y los dos de PENTAV con el
  magenta—.

**El caso "el tope no frena" es el que la T-05 no pudo construir sin pagarlo.** Allá costó una
generación de US$0,80 lanzada sin querer, porque la única forma de ver el caso que no frena era
llamar a Vertex. Acá está la opción `--contar` que esa task propuso: corre el chequeo del tope,
arma los cuarenta prompts con todos sus guardas, imprime lo que haría y **sale antes del primer
POST**. Cuesta cero y se puede correr las veces que haga falta.

## 9. Lo que esta task NO hizo

- **La página, el README y los créditos.** Son la T-09, que corre en paralelo. Esta task no
  tocó `index.html`, `js/`, `css/`, `README.md` ni `CREDITS.md`.
- **La no-regresión completa y la publicación.** Son la T-10. Acá se corrieron `npm test` y
  `npm run check` como evidencia de que no se rompió nada, no como la compuerta de esa task.
- **Tocar `race.json`.** La §6 dice por qué, con la medición.
- **Renombrar `BRIGHT AQUAMARINE`.** La §2 dice por qué, y deja el clip rechazado como
  evidencia de lo que pasa cuando no se lo renombra.
- **Resolver la tipografía ilegible.** Sigue como la dejó la T-03: medida, no resuelta, y
  ahora con el criterio de rechazo escrito —legible se rechaza, garabato no—.

## 10. Tres cosas que se reportan y no se arreglan

- **El par MARVOK / RUNTAK del selector está a 13,7 de dE00**, que es el par más apretado de
  los seis y casi la mitad de la distancia del siguiente (25,5). Es un número de la T-01,
  medido sobre el programa, y la T-08 lo encontró midiendo otra cosa. No se tocó porque mover
  un color de `race.json` reacomoda las seis filas y porque hoy nada los pinta (§6); si alguna
  vez el panel muestra la muestra de color, **ése es el par a mirar y no el amarillo**.
- **El tramo costero se pide y vuelve tribuna cuatro de siete veces.** Siete de los cuarenta
  prompts nombran *"the flat grey sea beyond it"* adentro del bloque `IN FRAME`, que es la
  posición más fuerte que tiene un prompt de esta serie. En cuatro —MARVOK 03, PENTAV 03,
  NOCTEV 02 y RUNTAK 01— no hay una gota de mar: hay tribuna. En los otros tres se ve, y en dos
  de ellos como una franja en el horizonte:
  [`lamina/13-el-tramo-costero-sin-mar.jpg`](lamina/13-el-tramo-costero-sin-mar.jpg).
  No rompe nada —el circuito se lee igual en los seis feeds, que es lo que la §3 mide— pero
  significa que **el tramo costero no es una posición de pista que se pueda pedir**, y un plan
  de tomas futuro no debería contarla como una. La tribuna sí vuelve cuando se la pide.
- **`oir-la-camara.sh` vive en la carpeta de la T-05 y esta task lo corrió cinco veces.** Es el
  instrumento de tres tasks ya, con la carpeta por argumento y sin una línea que lo ate a
  CALDRIX. No se movió porque es de otra task, pero **el lugar donde vive ya no dice de quién
  es**; lo mismo con `de.py` de la T-01, que a esta altura lo importan cuatro tasks.
