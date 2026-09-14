# Las cinco casillas que volvían con el circuito roto

Cinco generaciones, **US$4,00**, de los US$5,60 que le quedaban a la etapa 1. Las cinco
salieron a la primera y las cinco miden 8,000000 s con 192 cuadros a 24 fps, así que los
112,000 s del programa siguen cerrando sin recortar nada.

El veredicto en una línea: **las cinco fallaban por lo mismo —el clip le pedía al auto un
cambio de sentido, y el modelo no sostiene la calzada mientras gira— y las cinco se
arreglaron sacando el cambio de sentido, no escribiendo mejor la prohibición.**

Los clips nuevos están en `demo/race-multiview/content/.fuentes/programa/` con su
`.prompt.txt` al lado. **Los cinco viejos no se borraron**: están en
`content/.fuentes/programa/rechazados-geometria/`, con su prompt, porque son la referencia
contra la que se mira si el arreglo mejoró algo.

---

## 1. Las cinco frases de Nicolás describen un solo defecto

| casilla | lo que dijo | qué se ve en los doce cuadros |
| --- | --- | --- |
| 1 | *"parecen autos yendo para el otro lado de la pista"* | los seis llegan de frente por una curva y después cruzan el cuadro al revés |
| 5 | *"el auto sale de la pista y parece que comienza a conducir en una nueva pista"* | los pianos quedan como franjas sueltas sobre asfalto abierto y el auto termina en una explanada sin bordes |
| 6 | *"dan una vuelta en U y comienzan a ir para atrás"* | llegan de frente, doblan, y salen de espaldas hacia donde vinieron |
| 10 | *"se salen de la pista y aparece una pista en paralelo"* | una tira de pasto y un piano aparecen en el medio del asfalto y parten la calzada en dos |
| 12 | *"el auto viene perpendicular a la pista y luego sale recto"* | el auto entra cruzando el piano, no corriendo a lo largo de él |

**Lo que las cinco tenían y las nueve buenas no: un cambio de sentido adentro del clip.**
Una chicana izquierda-derecha, unas eses, una frenada con entrada a la curva, un auto
cruzando un piano, y seis autos *"entrando por un lado del cuadro y saliendo por el otro"*
en una curva.

**Y las nueve que Nicolás dio por buenas son todas la misma cosa**: el auto va para un solo
lado los ocho segundos —por una recta o por una curva larga— y la cámara lo acompaña desde
el costado. Seis de las nueve dicen además *"with a long lens"*; ninguna de las cinco
rechazadas lo decía.

**Por qué rompe.** El modelo deja de dibujar los **dos bordes** del camino mientras gira al
auto. Sin bordes corridos de punta a punta no hay calzada: hay asfalto, y el auto que lo
cruza parece estar en otro lado. Las cinco frases de Nicolás son cinco maneras de decir
eso.

## 2. Qué cambió en cada prompt

La forma del prompt no se tocó —bloques rotulados, la cámara primero y última, el párrafo
del mundo en el medio—, porque esa forma es la que hizo que doce de catorce salieran a la
primera. Lo que se agregó es un bloque nuevo, y lo que se cambió es **qué hace el auto**.

### El bloque `THE TRACK IN THIS SHOT`, que llevan las cinco y ninguna otra

Declara tres cosas que ninguna otra parte del prompt declaraba: que hay **una sola
calzada** con sus dos bordes corridos de punta a punta, que **todos los autos van para el
mismo lado** todo el clip, y que **la cámara no se muda de lugar**.

Va escrito **en positivo** —una calzada que existe, y no *"no dibujes una segunda"*— por la
misma razón que la fase 08 dejó escrita para la librea: nombrar lo prohibido le da permiso.
La única negación que quedó es *"no car ever turns back on itself"*, y queda porque **un
sentido de marcha no es un objeto que se pueda pintar**, a diferencia de `boards` o de
`lettering`.

**Las otras nueve no lo llevan**, y eso es deliberado: volvieron bien sin él, y su
`.prompt.txt` tiene que seguir siendo el texto que de verdad viajó a Vertex.

### Y en cada casilla, un solo movimiento en vez de dos

| casilla | antes | ahora |
| --- | --- | --- |
| **1** | cámara fija en una curva rápida; los seis *"entran por un lado del cuadro y salen por el otro"* | cámara fija con teleobjetivo **al costado de una recta**; los seis bajan la recta hacia la cámara y pasan |
| **5** | *"pans with one car as it flicks through it, left and then right"*, **kerb to kerb** | **la salida** de la chicana: el auto sale, pisa el piano de salida, se endereza y acelera hacia la cámara |
| **6** | la frenada **más la entrada a la curva** (*"as they turn in"*) | **sólo la frenada**: los dos bajan la recta lado a lado, con humo de una rueda trabada, y pasan sin doblar |
| **10** | las eses, *"changing direction left and right"* | el **tramo costero**, una curva larga, los dos juntos de punta a punta |
| **12** | el auto *"rides **over** the kerb"*, encuadre cerrado sobre las ruedas | el auto corre **a lo largo** del piano, paralelo a él, y el cuadro deja ver la pista detrás |

**La regla, que es la del encuadre aplicada a la acción**: así como se nombra el plano y no
se dan las coordenadas de la cámara, **se nombra una sola cosa que el auto hace**. Dos
acciones seguidas en ocho segundos es donde el modelo pierde el mundo.

La receta completa vive donde el ADR 0061 manda, en
`demo/race-multiview/scripts/generar-programa.py`, con el porqué en su cabecera. **Y el
generador reproduce letra por letra los catorce `.prompt.txt` que viajaron**, porque dos
copias del mismo texto se despegan y la que se despega es la que nadie ejecuta —que es
exactamente cómo nació el hallazgo H1 del sondeo. Se comprueba, y el control es sacarle el
bloque de geometría a una casilla y verlo dar rojo:
[`salidas/el-generador-y-los-prompts.txt`](salidas/el-generador-y-los-prompts.txt).

## 3. Cómo volvieron

Las cinco láminas de [`lamina/`](lamina/) tienen doce cuadros del rechazado arriba y doce
del nuevo abajo. **Doce y no uno porque el defecto no está en un cuadro: está en que la
geometría cambia adentro del clip.**

| casilla | qué muestra el clip nuevo |
| --- | --- |
| 1 | una recta, una calzada, los seis bajando juntos hacia la cámara y pasando. El sentido no cambia |
| 5 | el auto sale de la curva pisando el piano, pasa, y sigue por la misma calzada. Los bordes están los ocho segundos |
| 6 | los dos lado a lado, humo de la rueda trabada, sin doblar y sin separarse. Es exactamente lo que dice el relato |
| 10 | los dos juntos por una calzada única, pasan y se van por la misma. No hay segunda pista |
| 12 | el auto corre a lo largo del piano con la rueda trasera encima, pasa, y se va por la misma recta |

### Esto se miró y no se midió, y se intentó medirlo

Se construyó un instrumento para no depender del ojo: `medir-el-barrido.py` mide cuánto se
da vuelta el encuadre adentro del clip, siguiendo el desplazamiento horizontal del fondo
cuadro a cuadro. **Se lo calibró contra la única referencia que no sale de él —los nueve
clips que Nicolás dio por buenos y los cinco que rechazó— y no los separa:**

| grupo | R (1 = barre para un solo lado) |
| --- | --- |
| los nueve buenos | 0,00 · 0,00 · 0,07 · 0,31 · 0,67 · 0,83 · 0,89 · 1,00 · 1,00 |
| los cinco rechazados | 0,29 · 0,32 · 0,48 · 0,59 · 0,85 |

Verbatim, con los cinco nuevos medidos al lado, en
[`salidas/el-barrido-no-separa.txt`](salidas/el-barrido-no-separa.txt).

Los dos grupos se superponen enteros, así que **el número no vota**. Queda escrito porque
dice algo: lo que Nicolás ve no es que la cámara barra para los dos lados, es que **la
calzada deja de ser una**, y eso este instrumento no lo mide. El script queda en `salidas/`
para que nadie lo vuelva a construir creyendo que sirve.

### Lo que no se arregló, y no se intentó arreglar

- **La tipografía sigue apareciendo en la carrocería.** En la casilla 12 se lee `Nachte`,
  `PICKOGR` y `1-FUTA`. Es lo que la T-03 midió y dejó sin resolver, con su cuenta: sacarla
  rechazando clips cuesta unas cinco generaciones por clip limpio. Nada de esta corrida
  cambia ese número.
- **La casilla 10 perdió el mar.** El prompt lo pide —*"with the grey sea beyond the
  barrier"*— y volvió una valla sólida con tribuna detrás. El relato dice *"Down to the sea
  section"*, así que esa línea se quedó sin ancla visual. **No se gastó una generación en
  esto**: el defecto que Nicolás marcó está arreglado, y el mar es otra cosa. Las dos
  salidas están en §6.
- **La carrocería de la casilla 5 no siempre es un monoplaza de ruedas descubiertas**: en
  algunos cuadros vuelve un prototipo de ruedas cubiertas. Ya pasaba en el clip viejo, no
  es del arreglo, y Nicolás no lo marcó.
- **Los dos planos aéreos siguen sin ser aéreos.** No son de esta corrida y no se tocaron.

## 4. El portón de audio, que se corrió entero y no sólo sobre los cinco

Se corrió el instrumento que ya tiene la task —`salidas/oir-el-programa.sh` de la T-03—
sobre los catorce, para que los cinco nuevos se lean contra los nueve viejos y no contra
nada. Verbatim en [`salidas/el-porton-de-audio.txt`](salidas/el-porton-de-audio.txt).

| oyente | los catorce clips | control positivo: el ambiente con una línea de relator a −20 LUFS | control de otro origen: los clips de la parada del partido |
| --- | --- | --- | --- |
| whisper.cpp medium | `(engine revving)`, `(airplane engine roaring)` | *"Norvik are still in front here, 1-0…"* | *"Yeah, we needed this break, I'm shattered…"* |
| gemini-2.5-flash | `SPEECH: NO` en las catorce | `SPEECH: YES` + transcripción | `SPEECH: YES` + transcripción |

**Los dos controles se vieron rechazar**, y el segundo es el que vale más porque no lo
preparó nadie para esto: son archivos de otra demo con diálogo de verdad.

**El nivel mejoró y conviene decirlo, porque es insumo del montaje.** Los catorce van de
**−15,3 a −24,8 LUFS** —los mismos 9,5 LU de dispersión que midió la T-03—, pero **ya no
hay ningún clip al borde del recorte**: la casilla 12 picaba a −0,9 dBFS y la nueva pica a
−6,9; el pico más alto de los catorce es ahora −3,6 dBFS.

## 5. El color de RUNTAK, que era la consecuencia no obvia de regenerar

Los seis hexadecimales de `race.json` se midieron **sobre los catorce clips**, y RUNTAK es
el único auto cuyas **dos casillas propias —la 6 y la 12— se regeneraron las dos**. O sea
que su color se quedó sin el material del que salió.

Se volvió a medir con el mismo estimador de la T-01, cargado por path desde la T-02, con
los recortes dibujados y mirados antes de medir. Verbatim en
[`salidas/el-color-de-runtak.txt`](salidas/el-color-de-runtak.txt).

| dónde | filtrado (S>0,35) | % del recorte | dE00 contra `#661955` |
| --- | --- | ---: | ---: |
| casilla 12 nueva, t=2,5 s | `#691349` | 66,0 % | **3,7** |
| casilla 6 nueva, t=4,0 s | `#672849` | 34,9 % | **6,3** |
| *control: asfalto vacío del mismo cuadro* | *(ninguno)* | *0,0 %* | *—* |

**El hexadecimal de `race.json` sigue valiendo y no hay que re-medirlo.** La escala para
leer esos números no sale de este cálculo: la separación mínima entre dos de los seis
autos es **13,7**, y la dispersión de un mismo auto entre casillas llegaba a **35,8**. Un
3,7 y un 6,3 están muy por debajo de las dos.

**El control se vio funcionar**: el recorte de asfalto del mismo cuadro devuelve
`(ninguno)` en los dos clips, o sea cero píxeles cromáticos. Si hubiera devuelto un color,
el instrumento estaría midiendo el piso y no el auto.

**PENTAV no se concluye.** Su recorte en la casilla 6 pasa el 4,6 % del área, y el propio
estimador dice que por debajo del 15 % no vota. No hace falta: PENTAV conserva la casilla
7, que no se regeneró.

## 6. Lo que toca al relato

El guion de la T-04 nombra lo que está en pantalla en cuatro de las cinco casillas. Tres
siguen siendo ciertas y una no.

| línea | casilla | texto | ¿sigue siendo lo que se ve? |
| --- | ---: | --- | --- |
| 01 | 1 | *"Eleven laps gone here on the coast, and this is still one race."* | **sí**, no nombra geometría |
| 06 | 5 | *"…using every inch of the kerbs through the chicane."* | **sí**: la chicana y el piano de salida están en cuadro |
| 07 | 6 | *"…side by side into the braking zone, and neither of them lifts."* | **sí**, y ahora se ve mejor que antes |
| 13 | 10 | *"Down to the sea section, Pentav and Quentra still together."* | **no del todo: el mar no está en cuadro** |
| 15 | 12 | *"Look at Runtak over the kerb, the rear wheels taking all of it."* | **sí**: la rueda trasera va sobre el piano |

**La única que hay que resolver es la 13, y hay dos salidas que no cuestan lo mismo:**

- **Cambiar tres palabras del guion** —*"Pentav and Quentra, still together"*— y volver a
  sintetizar esa línea. Cuesta centavos y no toca video.
- **Regenerar la casilla 10** pidiendo el mar con más peso. Cuesta US$0,80, que es la mitad
  de lo único que le queda a la etapa 1, y arriesga volver a traer el defecto que se acaba
  de arreglar.

**Recomendado: lo primero.** El mar no es lo que la casilla tiene que probar, y la línea
del relato es lo más barato que hay en esta producción.

## 7. Lo que no se rompió

`npm test` da **184 pruebas, 184 pasan, 0 fallan**, salida 0; `npm run check` da **verde**
—3 ocurrencias, las tres en la lista aceptada, y cero hits en la segunda—, salida 0. Son
los mismos números con los que la T-01 abrió la fase y con los que la T-03 la cerró.
Verbatim en [`salidas/no-se-rompio-nada.txt`](salidas/no-se-rompio-nada.txt).

**Y `lib/` no se tocó, lo cual acá es más fácil de probar que de prometer**: `git status`
no muestra un solo archivo trackeado modificado. Todo lo que esta corrida escribió vive
adentro de `demo/race-multiview/` y de `.project/phases/13-…/`, que son las dos carpetas
que todavía no están commiteadas.

Los catorce clips siguen midiendo 8,000000 s y 192 cuadros, y suman 112,000000 s:
[`salidas/los-catorce-siguen-midiendo-8.txt`](salidas/los-catorce-siguen-midiendo-8.txt).

## 8. Lo que esta corrida NO hizo

- **El montaje y el audio.** `programa.mp4` no se rehízo: los catorce clips están sueltos,
  cinco de ellos nuevos. El concat, el emparejado de niveles y el relato son de la task del
  montaje, y se rehacen cuando Nicolás apruebe estos cinco.
- **Los carteles de Qualabs.** Estaban en el encargo y Nicolás los sacó antes de que se
  gastara una generación en ellos, cuando se le contó que la tipografía adentro del cuadro
  vuelve deformada (ADR 0045 y 0062). **Costo de ese ida y vuelta: US$0.**
- **Nada fuera de `demo/race-multiview/`**, salvo esta carpeta de evidencia.
