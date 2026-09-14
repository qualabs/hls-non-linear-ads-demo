# Los catorce clips del programa, y lo que midieron

Diecisiete generaciones, **US$13,60**, de un techo de US$19,20. Las catorce casillas existen,
miden 8,000000 s cada una y suman **112,000 s exactos**.

El veredicto en una línea: **el encuadre se puede gobernar y los colores alcanzan, con dos
cosas que no se arreglaron y que están medidas: los dos planos aéreos no son aéreos, y la
tipografía en la carrocería sigue apareciendo.**

Los clips están en `demo/race-multiview/content/.fuentes/programa/`, cada uno con su
`.prompt.txt` al lado. La lámina de contacto de los catorce está en
[`lamina/1-lamina-de-contacto.jpg`](lamina/1-lamina-de-contacto.jpg).

---

## 1. El encuadre: se le pide a Veo el nombre del plano, no las coordenadas de la cámara

Es el hallazgo más útil de la task y el que cambia cómo se escriben los 48 prompts que
faltan.

**El sondeo había dejado el diagnóstico a medias.** Midió que tres pedidos de plano aéreo
volvían a nivel de pista y que el mismo pedido, sin el párrafo del mundo, devolvía el cenital
a la primera, y concluyó que el párrafo del mundo se come la instrucción de cámara. La
corrección que propuso —poner la clase de toma primera— **nunca se probó**: en el clip C la
clase de toma era la primera línea de *su* bloque, pero el bloque entero seguía entrando
después de las 190 palabras del mundo. En el prompt completo la cámara nunca estuvo primera.

**La forma nueva la puso primera y última, y no alcanzó.** El prompt se rediseñó en bloques
rotulados —`CAMERA`, `IN FRAME`, `THE CARS IN THIS SHOT`, `THE PLACE`, `SOUND`, `CAMERA,
AGAIN`—, con la cámara ocupando las dos posiciones que un modelo pondera más y el mundo en el
medio, que es donde va un fondo constante; y el párrafo del mundo perdió toda frase que
implica un punto de vista, porque *"Beyond the barriers:"* no describe el lugar, describe
dónde está parado el que mira. Las dos primeras sondas con esa forma fallaron igual:

| sonda | qué se pidió | qué volvió |
| --- | --- | --- |
| casilla 4 | plano de dron a cincuenta metros, mirando hacia abajo | cámara en el eje de la pista, a nivel del piso |
| casilla 8 | *"a camera car running alongside at the same speed, level with the racing car"* | cámara **montada sobre el auto** |
| casilla 8, 2.º intento | lo mismo más *"the camera is outside the car and is never mounted on it"*, *"this is never the driver's point of view"* | cámara montada en el morro del auto |

**Lo que sí funcionó fue cambiar el idioma del pedido.** La casilla 1 se pidió como
*"television race coverage, trackside camera position. A fixed broadcast camera stands on the
ground at the edge of the circuit… the cars enter the frame from one side, cross it and leave
by the other"*, y volvió exactamente eso a la primera. Con esa forma se regeneró la casilla 8
—*"trackside camera position with a long lens"*— y volvió el auto entero visto desde afuera,
que es lo que la compuerta 2 necesita. **Doce de las catorce casillas salieron a la primera.**

**La regla, que es la de la fase 08 aplicada al encuadre en lugar de a la librea:** describir
la alternativa en vez de negar lo que no se quiere. *"La cámara no está montada en el auto"*
es una negación y deja el hueco; *"una cámara de transmisión al borde de la pista"* nombra una
cosa que existe en el mundo y que el modelo vio mil veces, y la dibuja. **Se nombra el plano,
no se dan las coordenadas de la cámara.**

**Y tiene un corolario que le ahorra trabajo a la etapa 2:** la cámara de a bordo es
justamente lo que Veo devuelve solo cuando no se le pide nada. Las seis cámaras de la oferta
no van a pelearse con el modelo.

### Las dos casillas aéreas no son aéreas, y se decidió no insistir

Contando el sondeo son **cinco pedidos de plano aéreo y cinco fracasos**, con el encuadre
dicho primero, dicho último, y dicho con el vocabulario que funciona en las otras doce.

Lo que el sondeo ya había aislado sigue en pie: el modelo **sabe** hacer un cenital, porque la
generación `d` lo devolvió a la primera con un prompt que era sólo la instrucción de cámara.
Lo que no hace es un cenital **mientras el prompt describe además una carrera con seis autos
identificables por color** — y esa tensión es real y no de redacción: un plano desde ochenta
metros hace que los seis colores no se lean, y de los dos pedidos el modelo resuelve el que
está escrito más veces.

**No se insistió porque la casilla no necesitaba ser aérea.** Lo que el plan de tomas le pide
a la casilla 4 son tres cosas —los seis autos en cuadro, que no pase nada, y que la línea del
anuncio entre entera— y las tres las cumple el plano general de la recta que volvió. Gastar
generaciones en una palabra que ninguna de las tres condiciones nombra es pagar por la
estética del plan y no por su función.

**Si el aéreo importa, la palanca no es escribir mejor: es generar desde un primer cuadro**,
que fija el encuadre por construcción. No se probó y no entra en el techo de esta etapa.

### El párrafo del mundo se reescribió, y el mundo no se movió

Era el riesgo del rediseño y por eso se midió: el párrafo perdió las frases que implican un
punto de vista, y si con eso hubiera cambiado la luz o el piso, el R1 se habría roto justo
donde nadie estaba mirando. Verbatim en
[`salidas/el-mundo-se-sostiene.txt`](salidas/el-mundo-se-sostiene.txt).

| qué se compara | ΔE00 asfalto | ΔE00 cielo |
| --- | ---: | ---: |
| **clips del sondeo (párrafo viejo) entre sí** | 2,4 – 6,0 | 3,3 |
| **clips del sondeo contra los del programa (párrafo nuevo)** | **3,1 – 8,4** | **0,9 – 7,4** |
| clips del programa entre sí | 4,6 – 9,2 | 5,8 |
| *control: el mismo cuadro virado a hora dorada* | *14,9 – 21,9* | *14,1 – 16,5* |
| *control: un cuadro de otro mundo (metraje real de la demo del break)* | *15,0 – 23,9* | *—* |

**La referencia no sale de este cálculo**: son los clips del sondeo, generados con el párrafo
viejo dos días antes y por otra task. Los clips nuevos quedan a la misma distancia de los
viejos que los viejos entre sí, y los dos controles se mueven de dos a cuatro veces más.
Mirados además en la lámina, los catorce traen el mismo circuito costero de dunas, los mismos
pianos rojos y blancos, la misma tribuna gris y el mismo mar bajo el mismo cielo cubierto.

---

## 2. Los colores: ahora manda lo que Veo dibuja

La especificación se dio vuelta. Los hexadecimales de `race.json` **se midieron sobre los
catorce clips** y las seis fichas se regeneraron contra ellos, porque las fichas las dibuja
Imagen y los clips los dibuja Veo. Medición verbatim en
[`salidas/los-colores-sobre-los-clips.txt`](salidas/los-colores-sobre-los-clips.txt).

| auto | `race.json` | tono | medidas | dispersión entre casillas | contra su ficha vieja |
| --- | --- | ---: | ---: | ---: | ---: |
| CALDRIX | `#CCB21F` | 51° | 4 | 9,9 | 3,3 |
| MARVOK | `#381A6A` | 262° | 2 | 7,2 | 11,3 |
| NOCTEV | `#24ACC8` | 190° | 2 | 11,5 | 17,1 |
| RUNTAK | `#661955` | 313° | 2 | 4,2 | 8,2 |
| PENTAV | `#2D6E24` | 113° | 3 | **19,6** | 7,1 |
| QUENTRA | `#876E46` | 37° | 2 | **35,8** | 16,7 |

**Los seis se miden sólo donde se los puede identificar sin discutir**: en las diez casillas
donde el auto está nombrado y grande. Los cuatro planos generales quedan afuera a propósito,
porque ahí los autos son chicos y decir cuál es cuál ya es una interpretación.

### La separación, que es el número que la demo necesita

| juego de seis | mínima mutua | entre qué par |
| --- | ---: | --- |
| **los catorce clips del programa (Veo)** | **13,7** | MARVOK / RUNTAK |
| el clip C del sondeo, un solo cuadro | 16,3 | RUNTAK / MARVOK |
| *las fichas de la T-01 (Imagen) — referencia de otra task, sobre otras imágenes* | *22,3* | *MARVOK / RUNTAK* |

Y la escala para leer ese 13,7, que también viene de mediciones anteriores y no de esta:
**dos verdes casi iguales miden 5,6** (control de la T-01) y **el pasto del costado de la
pista mide 11,0 contra el verde de PENTAV** (T-02). O sea que en esta serie **un 11 ya no es
"parecido": es otro color**, y 13,7 está por encima de eso.

### ¿Alcanza para que una persona distinga los autos a la velocidad a la que pasan?

**Sí, con una salvedad que no es el número mutuo sino la constancia.** Las tres mediciones que
contestan la pregunta:

1. **Adentro de un cuadro, siempre, y por un margen grande.** En las seis casillas de dos
   autos, la distancia entre los dos que están en pantalla va de **25,6 a 77,6**, y la más
   chica es la casilla 10 —el verde y el bronce por las eses—, que sigue siendo el doble del
   umbral. MARVOK y RUNTAK, que son el par más cercano de los seis, **no comparten ni una
   sola casilla del programa**.
2. **Al ancho que tiene una caja, sí.** La
   [simulación](lamina/2-al-ancho-de-una-caja.jpg) pone el mismo cuadro a 470 px —una de
   cuatro cajas a 1907 de ancho— y a 190 px —una de cuatro a 400, o sea móvil. A 470 los seis
   se nombran solos. A 190 se pierden los detalles pero el color se sostiene: el amarillo, el
   violeta, el verde, el cian y el bronce siguen siendo cinco cosas distintas. Es mejor que lo
   que midió el sondeo, donde a 190 px sólo sobrevivía el amarillo, y la razón es que estos
   colores volvieron más saturados.
3. **Entre casillas, no siempre**, y ésta es la salvedad. **La dispersión de un mismo auto
   entre dos casillas llega a 35,8 —QUENTRA—, que es más grande que la distancia mínima entre
   dos autos distintos.** De las quince instancias medidas, **una se lee como otro auto**:
   QUENTRA en la casilla 7 vuelve un oro claro que queda a 14,1 de CALDRIX y a 16,4 de su
   propio representante. En esa casilla CALDRIX no está en cuadro, así que no hay confusión
   posible mirando el clip; la confusión sería contra la fila del selector.

**Y esa salvedad importa más para las seis cámaras que para el programa.** El programa muestra
un plano por vez; un feed son ocho clips seguidos **del mismo auto**, y ahí una dispersión de
35 es el auto cambiando de color adentro de su propia caja. Es lo que la etapa 2 tiene que
mirar primero en la cámara de a bordo de CALDRIX, que es el auto con la dispersión más baja
de los que se midieron más de dos veces (9,9 sobre cuatro casillas).

### Las fichas: el retrato se rehízo contra el clip, y sólo en tres autos mejoró

Las seis fichas del repositorio dejan de ser la especificación del auto y pasan a ser su
retrato. Se regeneraron con `agy`/Imagen pidiéndoles el color medido sobre los clips, se
midió lo que volvió, y **se quedó la que está más cerca del color de Veo, sea la nueva o la
vieja**. Medición en
[`salidas/las-fichas-contra-los-clips.txt`](salidas/las-fichas-contra-los-clips.txt).

| auto | la ficha que queda | medida | dE00 contra el color de Veo | por qué ésa |
| --- | --- | --- | ---: | --- |
| CALDRIX | la de la T-01 | `#D1BD31` | **3,2** | la regenerada salió a 19,5 |
| MARVOK | la de la T-01 | `#5F28A1` | **10,4** | la única que queda arriba de 10; ver abajo |
| NOCTEV | regenerada, 2.ª vuelta | `#21AAC6` | **0,6** | la vieja estaba a 17,4 y la 1.ª vuelta a 12,4 |
| RUNTAK | regenerada | `#652B4C` | **6,1** | la vieja estaba a 7,9 |
| PENTAV | la de la T-01 | `#337E29` | **5,6** | ya era el retrato más cercano |
| QUENTRA | regenerada, 2.ª vuelta | `#866C44` | **0,8** | la vieja estaba a 16,3 y la 1.ª vuelta a 15,3 |

**El instrumento se controló contra una referencia que no salió de él**: el mismo recorte
sobre las fichas viejas devuelve `#D1BD31`, `#5F28A1`, `#04B09D`, `#591C39`, `#337E29` y
`#56442E`, que son los seis hexadecimales que la T-01 publicó en su día con su propio
método. Si el recorte estuviera mal puesto no habría reproducido esos números. Los seis
recortes se dibujaron sobre la imagen y se miraron antes de medir.

**Y hay una calibración que queda escrita porque se va a volver a necesitar, y es la que
resolvió los dos casos difíciles**: el generador de imágenes dibuja la carrocería con su
sombreado, así que **la mediana sobre el cuerpo vuelve sistemáticamente 13 a 20 puntos de L*
más oscura que el color pedido**. Pedir el color que uno quiere medir no funciona; hay que
pedir una versión más clara. Aplicado a los dos que estaban lejos —a NOCTEV se le pidió
`#5AC9E6` para medir `#24ACC8`, y a QUENTRA `#BFA179` para medir `#876E46`— los dos cayeron
a **0,6 y 0,8**, que es tan cerca como esta medición puede estar.

**MARVOK se queda en 10,4 y no se insistió.** Es el más oscuro de los seis (L* 21) y ahí la
compensación deja de ser lineal: pedir más oscuro lo manda al negro y pedir más claro es lo
que ya está. Diez es el borde de la escala de esta serie, no adentro de ella, y el costo de
seguir era tiempo de reloj y no dólares.

**Un aviso sobre delegarle esto a `agy`, porque casi se cuela.** De las seis corridas en
paralelo, **dos se quedaron esperando un temporizador en lugar de generar**, y una de ellas
—PENTAV— terminó **copiando la ficha vieja del repositorio y respondiendo `DONE`**. El
archivo estaba, pesaba lo que tenía que pesar, y su `md5sum` era idéntico al de la ficha que
decía haber reemplazado. Lo que lo atrapó fue comparar los hashes contra las viejas; sin ese
paso, la task habría reportado seis fichas regeneradas y tres de ellas no lo estarían.

### El instrumento, y cómo se lo vio fallar

El estimador es el de la T-01 —mediana de los píxeles con S>0,35 y V>0,25— cargado por path
desde la T-02 en lugar de copiado, porque dos copias de la misma fórmula se despegan. Cada
recorte se **dibujó sobre el cuadro y se miró** antes de medirlo.

**El control es un recorte de asfalto vacío del mismo cuadro**, que tiene que devolver
`(ninguno)`: cero píxeles cromáticos. **Cuatro de los diez controles dieron color en la
primera corrida** —verde en la casilla 6, gris azulado en la 8, rojo en la 10— y eso es el
control funcionando: estaba diciendo que esos rectángulos habían caído sobre pasto, sobre una
valla y sobre un piano, no sobre asfalto. Corridos los cuatro, los diez devuelven
`(ninguno)`.

**Y el segundo estimador se imprime pero no vota, con su razón medida.** El `cromatico`
(S>0,12) sobre MARVOK devuelve `#9D93C4` donde el `filtrado` devuelve `#3B1F5B`: un lavanda
pálido que es el reflejo del cielo sobre la carrocería y no la librea. El precio de usar el
estricto es que sobre un auto lejano pasa el 4 % del recorte, y por eso una medida por debajo
del 15 % no vota.

---

## 3. La tipografía: no se arregló, y acá está lo que cuesta arreglarla

**La hipótesis que se probó** era que la prohibición del sondeo fallaba porque nombraba lo
prohibido: las vallas se describían como *"faced with boards painted in wide diagonal bands"*
—y `boards` es la palabra de los carteles de publicidad de un circuito— y del auto se decía
*"no number, no lettering, no logo and no sponsor marking"*, cuatro menciones de tipografía en
una oración, cuando la propia regla de la fase 08 dice que **describir de más da permiso**.

Así que el prompt nuevo sacó la palabra `boards`, dejó las vallas como *"bare grey concrete
walls painted in wide diagonal bands"*, y reemplazó la lista de prohibiciones del auto por una
descripción positiva de la superficie: *"The paint is the whole livery: clean, smooth,
unbroken bodywork, straight out of the paint shop."*

**No funcionó.** En [`lamina/3-tipografia-y-vallas.jpg`](lamina/3-tipografia-y-vallas.jpg) hay
un recorte al 200 % de cada casilla, sobre la carrocería:

- **Once de las catorce traen tipografía ilegible en el auto**: renglones en el morro, un
  rótulo en el alerón trasero, una calcomanía en la tapa de motor, una firma en el pontón. Las
  tres restantes —1, 7 y 14— tienen el auto barrido por el movimiento y **no permiten
  decidir**; no son tres limpias.
- **Una es graciosa y vale como síntoma**: en la casilla 4, el auto verde lleva escrito
  `AQUAAMARINE` en el alerón. El modelo tomó una palabra del prompt y la pintó en la
  carrocería.
- **Las vallas volvieron casi siempre como se piden** —bandas diagonales blancas y grises—,
  pero en la casilla 13 hay un arco sobre la recta con paneles rotulados, y hay paneles
  sueltos en otras.

### Cuánto costaría sacarla rechazando clips

A lo sumo **3 de 14 vuelven limpias, o sea el 21 %**, y ése es el número optimista porque las
tres son las que no se pudieron juzgar. Con esa tasa, **conseguir un clip limpio cuesta unas
cinco generaciones**, o sea unos US$4; los catorce del programa, **unos US$56**. El techo de
toda la etapa 1 es US$22,40 y el de la fase entera US$92,80: rechazar por tipografía en el
programa se come **dos veces y media la etapa**, y aplicado a los 62 clips del corte final se
come la fase entera y sobra.

### Lo que sí se puede decir sobre si molesta

**No es texto legible: es garabato con forma de patrocinador.** A cuadro entero se ve que hay
renglones y no se lee ninguno. Al ancho de una caja —470 px— quedan manchas, y a 190 px
desaparecen. O sea que **no rompe la legibilidad de nada**; lo que hace es que el auto parezca
un auto de carrera con patrocinadores, que es lo que un auto de carrera parece.

**El riesgo que sí deja abierto es el R2 y no la legibilidad**: una carrocería con rótulos se
parece más a un equipo real que una carrocería lisa. Eso lo decide el ojo humano clip por
clip, que es lo que el R2 manda, y mirados los catorce **ninguno trae un escudo, un logo
reconocible ni un vestido comercial identificable**. Con el número de arriba delante, la
decisión es de Nicolás y esta task no la toma.

---

## 4. El audio: catorce de catorce sin una palabra, y el portón se vio rechazar dos veces

Verbatim en [`salidas/el-porton-de-audio.txt`](salidas/el-porton-de-audio.txt).

| oyente | los catorce clips | control positivo: el ambiente con una línea de relator real a −20 LUFS | control de otro origen: un clip de la parada del partido |
| --- | --- | --- | --- |
| whisper.cpp medium | `(engine revving)`, `(tires squealing)`, `(airplane engine roaring)` | *"Norvik are still in front here, 1-0…"* | *"Yeah, we needed this break, I'm shattered…"* |
| gemini-2.5-flash | `SPEECH: NO` en las catorce | `SPEECH: YES` + transcripción | `SPEECH: YES` + transcripción |

**Hay dos controles y el segundo es el que más vale**, porque no lo preparó esta task: es un
archivo de otra demo, con diálogo de verdad, que nadie fabricó para este chequeo. Los dos
oyentes lo rechazan.

**El nivel, que es insumo del montaje y no del portón.** Los catorce van de **−15,3 a −24,8
LUFS**, o sea **9,5 LU de dispersión**, y la casilla 12 pica a **−0,9 dBFS**. `DESIGN.md`
normaliza cada línea de relator a −20 LUFS, así que pegados tal cual siete de los catorce
quedan por encima del relato. Se mide acá y **no se corrige acá**: el montaje es de otra task.

**Y sigue faltando el público.** El párrafo del mundo pide *"a distant crowd"* y ninguno de
los catorce listados de sonidos lo trae. Es lo mismo que midió el sondeo y no sale de Veo por
pedirlo; es barato de agregar como cama de ambiente en la mezcla.

---

## 5. Lo que se tocó fuera de esta carpeta, y por qué

- **`demo/race-multiview/race.json`** — los seis colores, que ahora salen de los clips.
- **`demo/race-multiview/scripts/generar-programa.py`** — la receta, que el ADR 0061 manda que
  viva con el generador.
- **`T-01-el-mundo-y-los-autos/plan-de-tomas.md`** — tenía las palabras de color viejas en
  cinco casillas (el hallazgo H1 del sondeo), la casilla 7 con un auto sin nombrar, y una
  columna que copiaba el prompt. **La copia del prompt se sacó**: ahora el archivo apunta al
  generador, porque dos copias del mismo texto se despegan y la que se despega es la que nadie
  ejecuta, que es exactamente cómo nació H1.
- **`T-01-el-mundo-y-los-autos/el-mundo-y-los-seis-autos.md` y sus seis fichas** — la ficha
  deja de ser la especificación y pasa a ser el retrato, escrito donde el próximo lector va a
  buscarlo.

**Y `lib/` no se tocó, que es el criterio de la fase y se prueba en lugar de prometerse.**
Con el árbol tal como lo deja esta task: `npm test` da **184 pruebas, 184 pasan, 0 fallan**,
salida 0; `npm run check` da **verde** —3 ocurrencias, las tres en la lista aceptada, y cero
hits en la segunda—, salida 0. Son los mismos números con los que la T-01 abrió la fase.
Verbatim en [`salidas/no-se-rompio-nada.txt`](salidas/no-se-rompio-nada.txt).

**Dónde quedó la receta.** En `demo/race-multiview/scripts/generar-programa.py`, con los
catorce prompts adentro y el porqué de la forma en su cabecera. La carpeta de crudos
—`content/.fuentes/programa/`— no lleva README porque `content/` entero está gitignoreado y
ese README no sobreviviría a un clon; lo que sí sobrevive, y es lo que el ADR 0061 pide, es
el generador. Cada `.mp4` tiene igual su `.prompt.txt` al lado, con el texto exacto que
viajó.

---

## 6. Lo que esta task NO hizo

- **El montaje.** No existe `programa.mp4`: los catorce clips están sueltos. El concat, el
  emparejado de niveles y la verificación de los 2688 cuadros son de la task del montaje. Lo
  que sí queda comprobado es que **cada clip mide 8,000000 s con 192 cuadros a 24 fps**, así
  que los 112,000 s cierran sin recortar nada.
- **El relato.** Ninguna línea de voz.
- **Las seis cámaras.** Cero clips de la etapa 2.
- **La tipografía.** Está medida, no resuelta.
