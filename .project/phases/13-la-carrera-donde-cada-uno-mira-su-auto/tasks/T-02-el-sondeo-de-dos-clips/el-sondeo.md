# El sondeo, y lo que midió

Cuatro generaciones, **US$3,20**, que es el tope de la task. El veredicto en una línea: **el
mundo se sostiene y el audio sirve; el prompt no queda como está, y las dos correcciones que
hay que hacerle están medidas y no supuestas.**

Las mediciones verbatim están en [`salidas/medicion-del-sondeo.txt`](salidas/medicion-del-sondeo.txt),
y se reproducen corriendo [`salidas/medir-sondeo.sh`](salidas/medir-sondeo.sh) sobre los
`.mp4`. La lámina está en [`lamina/`](lamina/).

## Las cuatro generaciones, y por qué son cuatro

| | toma | qué probaba | costó |
| --- | --- | --- | ---: |
| **A** | casilla 4, el aéreo de los seis | la casilla que el resto de la fase da por supuesta | US$0,80 |
| **B** | casilla 12, la rueda de RUNTAK sobre un piano | la que más probabilidad tenía de salir mal: el color de menor luminancia de los seis, en el encuadre donde menos carrocería hay | US$0,80 |
| **C** | casilla 4 corregida | si la clase de toma declarada primero y una lista numerada de los seis arreglan lo que falló en A | US$0,80 |
| **D** | sólo la instrucción de cámara, sin el párrafo del mundo | si el párrafo del mundo se come la instrucción de cámara, o si este modelo no entrega un cenital | US$0,80 |

**La B se eligió por criterio y está escrito**: RUNTAK es `#5B223C`, el más oscuro de los
seis, y la casilla 12 es la única toma del plan donde el auto no llena el cuadro. Es el caso
más débil para identificar un auto por su color, y la identificación es lo único que hace
que una fila del selector signifique algo.

**La C y la D no estaban planeadas y son lo que la task existe para producir.** La A falló
en dos frentes a la vez y separarlos costaba una generación cada uno: la C probó la
corrección de prompt, la D aisló la variable que quedaba.

---

## 1. El mundo se sostiene, y es el mejor resultado del sondeo

Tres clips generados por separado —dos tomas distintas y una corrección— comparten el piso y
la luz con un margen amplio contra sus dos referencias negativas.

| qué se compara | ΔE00 asfalto | ΔE00 cielo |
| --- | ---: | ---: |
| **dentro de un mismo clip**, entre segundos | 0,4 – 3,4 | — |
| **clip A vs clip B** | 4,5 – 5,8 | **2,7** |
| **clip A vs clip C** | **2,1** | **3,4** |
| **clip B vs clip C** | 6,0 | **4,3** |
| *control: el mismo cuadro virado a hora dorada* | *14,0 – 19,2* | *40,7 – 41,9* |
| *control: un cuadro de otro mundo (metraje real de la demo del break)* | *17,9 – 22,2* | *—* |

Los dos controles son lo que hace que la primera columna signifique algo: **el instrumento se
mueve tres a cuatro veces más cuando cambia la luz, y cuatro a cinco veces más cuando cambia
el lugar**. Un número chico entre los clips, sin eso al lado, no distinguiría entre "los clips
coinciden" y "este instrumento devuelve siempre lo mismo".

**Mirado, además de medido**: los tres clips traen el mismo circuito costero de dunas, los
mismos pianos rojos y blancos, la misma escapatoria pintada de verde azulado, la misma
tribuna gris y el mismo mar al fondo bajo el mismo cielo cubierto. La [lámina](lamina/1-lamina-de-contacto.jpg)
los pone uno debajo del otro.

**Lo que esta medición no dice, y conviene decirlo antes de que alguien la use mal.** Mide la
luz y el color del piso, no el lugar: dos asfaltos grises idénticos bajo la misma luz podrían
ser dos circuitos distintos. Y la mediana del **cuadro entero** resultó un instrumento flojo
—el clip B contra el mundo ajeno da 8,5, apenas más que los 4,9 del clip A contra el B—,
porque la domina cuánto gris hay en el encuadre. Los parches de asfalto y de cielo sí separan;
el cuadro entero no, y por eso no se cita como prueba.

**Consecuencia para el R1 de `PHASE.md`:** el repliegue a carrera nocturna **no hace falta**.
El párrafo del mundo hace lo que se escribió que hiciera.

---

## 2. Los autos NO se identifican por su color, y acá está el número

**La separación mínima entre los seis se parte a la mitad al pasar de la ficha al cuadro en
movimiento.** Es el hallazgo que la task existía para encontrar.

| juego de seis colores | mínima ΔE00 mutua | entre qué par |
| --- | ---: | --- |
| **las fichas de la T-01** (auto quieto, llena el cuadro) | **22,3** | MARVOK / RUNTAK |
| **clip A**, t=4,0 s | **8,0** | MARVOK / RUNTAK |
| **clip A**, t=7,5 s | **9,2** | MARVOK / RUNTAK |
| clip A, t=4,0 s, estimador robusto | 9,0 | NOCTEV / el sexto |
| clip A, t=7,5 s, estimador robusto | 10,5 | NOCTEV / el sexto |
| **clip C** (con la lista numerada), t=4,0 s | **16,3** | RUNTAK / MARVOK |
| clip C, t=4,0 s, estimador robusto | 14,8 | RUNTAK / MARVOK |

La referencia de esa tabla —los 22,3— **no sale de este cálculo**: la midió la T-01 sobre otras
imágenes, antes de que estos clips existieran. Y la misma T-01 dejó escrito su piso: dos verdes
casi iguales miden 5,6.

### Lo que pasó en el clip A, que es peor que el número

**De los seis colores pedidos volvieron cinco, y uno repetido.** El bronce de QUENTRA no salió
como auto: salió como **una franja bronce sobre el auto verde**, y el sexto lugar lo ocupó un
segundo auto cyan. O sea que en la casilla donde el anuncio dice que hay seis cámaras, en
pantalla hay cinco colores. La [tira de recortes medidos](lamina/2-recortes-medidos-clip-a.jpg)
muestra cada recorte al lado del color que devolvió.

### Lo que arregló la lista numerada, y lo que no

El clip C cambió **dos cosas y nada más**: la clase de toma declarada primera, y los seis autos
como lista numerada con la regla de unicidad pegada. Con eso:

- **Los seis vuelven distintos**, cada uno su auto, el bronce incluido. La mínima mutua sube de
  8,0 a **16,3**.
- **Pero no vuelven los que se pidieron.** Medido contra el hexadecimal de su ficha, con los dos
  estimadores y el porcentaje del recorte sobre el que salió cada uno:

  | auto | ΔE00 (estimador T-01) | ΔE00 (robusto) | veredicto |
  | --- | ---: | ---: | --- |
  | CALDRIX, amarillo limón | **4,3** (38 %) | **3,8** (47 %) | el único que sale como se pidió |
  | PENTAV, verde manzana | 7,3 (12 %) | 16,2 (33 %) | cerca |
  | QUENTRA, bronce oscuro | 11,4 (6 %) | 37,4 (23 %) | volvió mucho más claro |
  | MARVOK, violeta eléctrico | 17,6 (6 %) | 28,1 (31 %) | volvió malva apagado |
  | NOCTEV, aguamarina | 25,3 (20 %) | 23,7 (37 %) | volvió azul cyan, 205° en vez de 173° |
  | RUNTAK, magenta ciruela | 28,9 (17 %) | 30,2 (37 %) | volvió violeta claro |

- **Y en el clip B, con un solo color pedido en un solo auto**, RUNTAK vuelve a `#A87F8F`,
  `#B790AA`, `#BB92AE` en tres segundos distintos: un orquídea claro, a **31,3 / 38,8 / 40,0**
  de su ficha. Con un color solo, sin competencia, y con el auto llenando el cuadro.

### La causa, y es estructural y no de redacción

**Los seis hexadecimales de `race.json` se midieron sobre las fichas, que las dibujó `agy` con
Imagen. Los 62 clips los dibuja Veo, que es otro modelo.** La T-01 calibró las palabras de
color iterando contra el generador de fichas —ahí descubrió que *"vivid yellow-green"* volvía
amarillo y lo corrigió— y ese trabajo, hecho bien, se hizo contra el generador equivocado.

Es exactamente la regla que la propia T-01 dejó escrita, aplicada un nivel más arriba: *"una
propiedad se mide atravesando la herramienta que la produce, no sobre el número que uno le
pidió"*. La herramienta que produce lo que el espectador ve es Veo.

### A qué tamaño hay que leer esto

En la demo el video vive adentro de una caja. La [simulación](lamina/4-al-ancho-de-una-caja.jpg)
pone el mismo cuadro al ancho que tiene una caja con la grilla llena:

- **a 470 px** (cuatro cajas a 1907 de ancho): el amarillo y el verde se leen; el violeta y el
  cyan cuestan; los dos de atrás se funden.
- **a 190 px** (móvil, 400 de ancho): sólo el amarillo sobrevive.

### El instrumento, y cómo se lo vio fallar

Dos controles corren en cada cuadro medido, y los dos dan rojo:

- **Asfalto sin auto**: `(ninguno)` — cero píxeles cromáticos. El instrumento **no devuelve un
  color donde no hay auto**, que es la falla que lo haría medir el asfalto y llamarlo librea.
- **Alerón negro**: el estimador de la T-01 devuelve `#5D394F`, a **ΔE00 7,2** de la ficha de
  RUNTAK — un número que parece excelente y está calculado sobre **un (1) píxel**. Por eso toda
  fila de la medición lleva su `n`, y por eso hay un segundo estimador con la puerta más
  abierta: en el clip B el de la T-01 llegó a dar **3,5** sobre el 3 % del recorte, un falso
  aprobado que el segundo estimador desmintió con 31,3 sobre el 23 %.

**Y una calibración que hay que tener a mano para leer la tabla de arriba sin exagerarla**: el
**pasto** del costado de la pista, medido con el mismo instrumento sobre el 84 % de su recorte,
queda a **ΔE00 11,0** del verde de la ficha de PENTAV. O sea que el pasto está más cerca del
verde manzana que QUENTRA, MARVOK, NOCTEV y RUNTAK de sus propias fichas. No es un defecto de
la medición —el pasto **es** verde— pero fija la escala: en esta serie, un ΔE00 de 11 no es
"parecido", es la distancia a la que un espectador ya ve otro color.

---

## 3. El audio sirve, con una corrección de nivel

**No hay una sola palabra hablada en los tres clips**, comprobado con dos oyentes independientes
y con el control de los dos:

| clip | whisper.cpp medium | gemini-2.5-flash |
| --- | --- | --- |
| A | `(engine revving)` | `SPEECH: NO` |
| B | `(car engine revving)` | `SPEECH: NO` |
| C | `(airplane engine roaring)` | `SPEECH: NO` |
| **control**: el ambiente de A con una línea de relator real mezclada a −20 LUFS | *"Norvik are still in front here, 1-0, and we are just past the half hour."* | `SPEECH: YES` + la transcripción |

**El control no es decorativo: atrapó un instrumento roto.** La primera corrida devolvió vacío
para los tres archivos, control incluido. No era que no hubiera habla: el binario de
whisper.cpp abortaba por una biblioteca compartida fuera del `PATH` del enlazador, y el error
se iba por `stderr`. Sin el control, esa corrida se habría escrito como *"ninguno de los clips
trae habla"*.

**Hay dos oyentes y no uno porque miden cosas distintas.** Un transcriptor convierte habla en
texto y descarta lo que queda bajo su umbral, así que un locutor de circuito lejano se le puede
escapar. A `gemini-2.5-flash` se le puede preguntar por lo que un transcriptor no reporta: si
hay **cualquier** voz, por débil que sea. Los dos dicen que no. *(No es una generación de Veo:
son unos 250 tokens de audio por clip y no cuenta contra el tope.)*

### El nivel, que sí hay que corregir

| clip | integrada | rango (LRA) | pico real |
| --- | ---: | ---: | ---: |
| A | **−19,0 LUFS** | 4,8 LU | −4,6 dBFS |
| B | **−19,9 LUFS** | 0,8 LU | −3,1 dBFS |
| C | **−25,0 LUFS** | 0,8 LU | −14,3 dBFS |

`DESIGN.md` §6 normaliza **cada línea de relator a −20 LUFS**. O sea que **el ambiente de dos de
los tres clips sale a la altura del relato o un poco por encima**: pegado tal cual, compite. Y
los tres difieren entre sí **6 LU**, así que el montaje de catorce clips tendría catorce niveles
de ambiente distintos.

Las dos cosas se arreglan igual y son trabajo de la T-03: **cada clip se normaliza a un nivel
declarado antes de entrar al montaje**, y ese nivel queda por debajo del relato. Cuánto por
debajo lo decide la T-04 con la mezcla armada; este sondeo aporta el punto de partida medido y
no un número inventado.

**Y falta el público.** El párrafo del mundo pide *"a distant crowd"* y ninguno de los tres
listados de sonidos lo trae: motores, gomas, aire y el petardeo del escape. No es grave —el
público es lo que una cama de ambiente sí puede agregar barato— pero no sale de Veo por pedirlo.

---

## 4. Lo que el plan pedía y no se obedeció, con la razón

Tres líneas del insumo no se siguieron. Las tres están acá porque seguirlas habría gastado
generaciones en medir algo que ya se sabía.

1. **`TASKS.md` pedía las dos tomas de sondeo como *"una toma de un auto pasando y una de dos
   autos peleando"*.** Se generaron la casilla 4 y la casilla 12, por instrucción explícita de
   quien despachó la task: la 4 porque es la que el resto de la fase da por supuesta, y la 12
   por ser la de mayor probabilidad de fallar.

2. **`plan-de-tomas.md` escribe la casilla 4 sin nombrar los seis colores.** Con la línea tal
   cual, Veo elige seis colores suyos y el clip no puede medir lo que el sondeo existe para
   medir. Van nombrados.

3. **Donde `plan-de-tomas.md` dice `YELLOW-GREEN` y `LIGHT VIOLET`, se usaron las palabras
   corregidas de la T-01**, `BRIGHT APPLE GREEN` y `BRIGHT ELECTRIC PURPLE`. Ver el hallazgo
   H1 de abajo.

---

## 5. Los hallazgos, que son de otras tasks y se reportan sin tocarlos

**H1 — `plan-de-tomas.md` quedó con las palabras de color viejas, y eso rompe la T-03.** Las
casillas 3, 6, 9, 10 y 13 dicen *"the YELLOW-GREEN car"* y *"the LIGHT VIOLET car"*. La T-01
midió que `VIVID YELLOW-GREEN` volvía amarillo y chocaba con CALDRIX a ΔE00 6,9, y por eso lo
cambió a `BRIGHT APPLE GREEN`; el plan de tomas se quedó con la palabra que se descartó. Si la
T-03 corre el plan literal, PENTAV vuelve amarillo en cinco de las catorce casillas. **Es un
archivo de la T-01 y no se editó.**

**H2 — las cuatro casillas de plano general (1, 4, 11, 14) no nombran ningún color.** El
párrafo del mundo dice que cada auto lleva *"one flat dominant colour"* pero no cuáles. En esas
cuatro casillas Veo elige, y elige distinto cada vez.

**H3 — el párrafo del mundo se come la instrucción de cámara, y está probado.** Tres
generaciones seguidas pidieron un aéreo y las tres volvieron con la cámara a la altura de la
pista; en la C la instrucción estaba dicha tres veces y primera. **La D sacó el párrafo del
mundo y dejó sólo la instrucción de cámara: el cenital salió a la primera** ([lámina, cuarta
fila](lamina/1-lamina-de-contacto.jpg)). O sea que no es una limitación del modelo: son 190
palabras de descripción a nivel de pista compitiendo con una línea de encuadre. Afecta a los
62 prompts, no a la casilla 4.

**H4 — la tipografía volvió, con la prohibición y su alternativa puestas.** El morro de CALDRIX
trae cuatro renglones de letras ilegibles y dos emblemas circulares; el flanco bronce, tres
renglones más ([zooms](lamina/5-tipografia-y-vallas.jpg)). Es la falla que el ADR 0045 y el 0062
ya midieron. **No parece arreglable por prompt** —acá la prohibición está escrita con su
alternativa, que es la receta que funcionó en la fase 08— y eso convierte el rechazo clip por
clip en un costo de generación que el presupuesto de la fase no tiene contado.

**H5 — aparecieron carteles de publicidad en las vallas.** El párrafo describe la alternativa
—*"boards painted in wide diagonal bands of white and slate grey"*— y volvieron paneles rojos
con letras. Mismo caso que H4.

**H6 — la librea que volvió en el clip B es rosa claro con franja blanca**, que es la
descripción de una librea real reciente y muy conocida de la categoría. No es un veredicto de
propiedad intelectual —`PHASE.md` dice explícitamente que esta fase no produce uno— pero es
justo el par que el R2 manda mirar con ojo humano, y mirado, esto es lo que se ve.

**H7 — los colores de `race.json` están medidos sobre el generador equivocado.** Ver §2. No es
un error de la T-01: es que el paso de calibración tiene que repetirse contra Veo, y ahí cada
intento cuesta US$0,80 en vez de US$0.

---

## 6. El veredicto: el prompt no queda como está

**Lo que se corrige y está probado que sirve:**

- **La clase de toma va primera y en términos de cámara, antes del párrafo del mundo** (H3,
  probado por la D).
- **Los seis autos van como lista numerada con la regla de unicidad pegada**, en toda casilla
  donde aparezca más de un auto (probado por la C: la mínima mutua sube de 8,0 a 16,3).

**Lo que hay que decidir antes de las catorce, y no lo decide esta task:**

- **Los colores no vuelven siendo los de `race.json`.** Hay tres caminos y cuestan distinto:
  recalibrar las palabras contra Veo (US$0,80 por intento, y con seis autos son varios);
  reescribir `race.json` con lo que Veo efectivamente dibuja (US$0, pero las fichas del
  repositorio dejan de ser la especificación del auto); o aceptar que el selector no promete un
  color exacto. **El sondeo aporta el número —mínima mutua 16,3 con la lista numerada— y no la
  decisión.**
- **La tipografía y los carteles no se arreglan escribiendo mejor** (H4, H5). Si cada clip con
  letras se regenera, el presupuesto de 62 generaciones no alcanza.

**Lo que queda en verde y no hay que volver a mirar:** el párrafo del mundo hace lo que promete
(§1), y el audio no trae habla (§3).
