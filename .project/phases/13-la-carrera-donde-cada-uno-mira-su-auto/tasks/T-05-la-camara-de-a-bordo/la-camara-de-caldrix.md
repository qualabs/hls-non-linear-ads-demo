# La cámara de a bordo de CALDRIX, y lo que midió

Catorce generaciones, **US$11,20**, de un techo de US$12,80. Existe
`demo/race-multiview/content/.fuentes/caldrix.mp4`: **64,000000 s exactos, 1536 cuadros a
24 fps, 1280×720**, con audio y sin una palabra hablada.

El veredicto en una línea: **la cámara de a bordo es la toma fácil de este modelo y la
identificación del auto se resuelve encuadrando su propia carrocería, no pidiendo el color;
lo que la cámara no hace es mirar hacia atrás, y eso costó dos clips.**

Los ocho clips están en `content/.fuentes/camaras/caldrix/`, cada uno con su `.prompt.txt`
al lado. La lámina de los ocho, que es para mirarlos de una sola pasada, está en
[`lamina/1-lamina-de-contacto.jpg`](lamina/1-lamina-de-contacto.jpg).

---

## 1. El corolario de la T-03 era cierto, y se comprobó antes de gastar los ocho

La T-03 dejó escrito que *"la cámara de a bordo es justamente lo que Veo devuelve solo
cuando no se le pide nada"*, y la evidencia era cara: dos casillas del programa pidieron una
cámara **exterior** viajando al lado del auto y las dos volvieron con la cámara **montada
sobre el auto**. Hicieron falta tres generaciones y cambiarle el idioma al pedido para
sacársela de encima.

Acá se verificó por el lado de esta task y salió igual: **seis de los ocho clips volvieron a
la primera**, y los dos que no fallaron por otra cosa. Ninguno de los catorce lanzamientos
falló por no conseguir un plano de a bordo. La consecuencia práctica, que es lo que le sirve
a la etapa 3: **el bloque de cámara puede ser corto y no tiene que pelear con el párrafo del
mundo**, que es exactamente lo contrario de lo que pasó con los planos aéreos.

## 2. La identificación del auto se resuelve con el encuadre, y es lo único que había que resolver

`PHASE.md` elige esta cámara por ser el peor caso: *"en una toma de a bordo el auto casi no
está en cuadro, y la identificación es lo único que hace que una fila del selector
signifique algo"*.

**El pedido no es el color, es qué pieza del auto está en cuadro.** Una cámara de a bordo
real siempre tiene carrocería propia adentro del encuadre —el morro delante de la T-cam, el
arco de seguridad, los espejos, el pontón, el alerón—, y esa carrocería es del color del
auto. Los ocho prompts llevan un bloque, `THE CAR THIS CAMERA IS ON`, que dice que la cámara
va atornillada al auto amarillo y que se ve su carrocería amarilla; y cada clip dice **cuál**
pieza. Ninguno pide "que se note que es CALDRIX".

**El resultado medido: el amarillo ocupa entre el 61 % y el 100 % del recorte en los ocho.**
No es que el auto se vea: es que la caja del selector está llena de él.

| clip | ángulo | del recorte medido |
| --- | --- | ---: |
| 01 | arco de seguridad, recta principal | 62,7 % |
| 02 | pontón, curva larga | 100 % |
| 03 | casco del piloto, tramo costero | 90,2 % |
| 04 | morro, tramo costero | 82,3 % |
| 05 | rueda delantera sobre el piano | 82,1 % |
| 06 | arco de seguridad, frente a la tribuna | 60,9 % |
| 07 | alerón trasero mirando adelante, recta | 100 % |
| 08 | arco de seguridad, curvón | 77,7 % |

**Y al ancho al que se va a ver de verdad, también.**
[`lamina/4-al-ancho-de-una-caja.jpg`](lamina/4-al-ancho-de-una-caja.jpg) pone cuatro de los
clips a 470 px —una de cuatro cajas a 1907 de ancho— y a 190 px —una de cuatro a 400, o sea
un teléfono—. A 190 px el clip pierde todo detalle y **sigue siendo inconfundiblemente un
auto amarillo**, porque lo que ocupa la caja es la carrocería. Es mejor que lo que midió el
programa, donde a 190 px sólo sobrevivía el amarillo de entre los seis: acá el amarillo es
lo único que hay.

**Lo que esto le dice a la etapa 3**, y es el hallazgo transferible: las otras dos cámaras de
a bordo —MARVOK y PENTAV— heredan el bloque tal cual cambiando la palabra del color. Las
tres de seguimiento no lo necesitan, porque ahí el auto se ve entero.

## 3. El cruce contra el programa: es el mismo auto, y no es el mismo amarillo

Es la comprobación que esta etapa existe para hacer, y la casilla contra la que se cruza no
se eligió acá: es la **casilla 8 del programa, `08-caldrix-cerrado`, un seguimiento cerrado
de CALDRIX visto desde afuera**, que cubre los segundos **56 a 64** de un programa cuya
ventana va del 28 al 92. Es el único cuadro de toda la demo donde el espectador puede tener
el programa y esta cámara en pantalla al mismo tiempo, mostrando el mismo auto.

Medición completa en [`salidas/el-color-de-caldrix.txt`](salidas/el-color-de-caldrix.txt),
con el mismo estimador de la T-01 cargado por path y los recortes del programa que dejó la
T-03 —otra task, otras imágenes, otro día—, que es lo que hace que la referencia valga.

| | color medido | tono |
| --- | --- | ---: |
| la cámara de a bordo (mediana de los ocho) | `#F6F252` | 59° |
| el programa (mediana de las cuatro casillas de CALDRIX) | `#CCB21F` | 51° |
| `race.json`, que es lo que el selector pinta en la fila | `#CCB21F` | 51° |

- **dE00 entre la cámara y el programa: 15,4.**
- **dE00 contra el auto más cercano de los otros cinco (QUENTRA): 39,7.** Los otros cuatro,
  entre 46,0 y 97,4.
- Clip por clip contra la casilla 8: de **7,5 a 20,7**.

**Cómo se lee ese 15,4, que es el número que importa y que no se puede leer solo.** La
escala de esta serie ya está medida por otras tasks: la separación mínima entre dos de los
seis autos del programa es **13,7**, y la dispersión de un mismo auto entre dos casillas
llegó a **35,8** en QUENTRA. O sea que 15,4 es **más grande que la distancia entre dos autos
distintos** y **menos de la mitad de lo que el mismo auto ya se movió adentro del programa**.

Y la pregunta que decide es la del selector, no la del número absoluto: **el amarillo de
esta cámara está 2,6 veces más cerca del CALDRIX del programa que del auto más parecido de
los otros cinco.** Mientras esa relación se sostenga, la fila significa lo que dice.

**Por qué pasa, y es una propiedad de la clase de toma.** En el programa CALDRIX se ve a
veinte metros, con aire de por medio y luz plana; acá su carrocería está a medio metro de la
lente y ocupa media pantalla. Veo la dibuja más clara y más saturada, que es lo que hace una
cámara de verdad. Se ve de un vistazo en
[`lamina/2-el-cruce-contra-el-programa.jpg`](lamina/2-el-cruce-contra-el-programa.jpg): el
mismo circuito, los mismos pianos rojos y blancos, la misma tribuna gris, el mismo cielo
cubierto, y el mismo auto amarillo con dos exposiciones distintas.

**Lo que esto deja abierto, y no se tocó porque es de otra task.** `race.json` le da a
CALDRIX `#CCB21F`, que es el color medido sobre el programa, y es lo que el panel pinta en
la fila del selector. Al lado de esta cámara esa muestra va a verse más apagada que el video
de la caja. Las dos salidas son baratas y ninguna es obvia: dejarlo, porque el programa es
la referencia y es lo que más se ve; o correr el hexadecimal hacia el promedio de los dos.
**No es una decisión de esta task**: `race.json` es de la T-01 y lo leen la señalización y
el empaquetado.

## 4. La consistencia entre los ocho, que es la corrida más larga de una misma cosa

`PHASE.md` nombra esto como el segundo riesgo de la task: ocho clips de la misma cabina son
donde primero se ve si el modelo se separa de sí mismo entre generaciones.

**El cielo, que es el parche que sí mide.** Verbatim en
[`salidas/el-cielo-de-los-ocho.txt`](salidas/el-cielo-de-los-ocho.txt).

| qué se compara | dE00 |
| --- | ---: |
| **el cielo de los ocho clips entre sí** | **0,0 – 4,0** |
| *control: el mismo parche del mismo cuadro virado a hora dorada* | *10,7 – 14,0* |
| *control: el mismo parche sobre un cuadro de otro mundo (metraje real de la demo del break)* | *34,9 – 37,4* |

Los dos controles van **sobre el mismo rectángulo del mismo cuadro**, que es lo único que
los hace comparables: el instrumento se mueve tres veces más cuando cambia la luz y nueve
veces más cuando cambia el lugar. Los ocho clips, entre sí, no se mueven.

**El amarillo del auto entre los ocho: dispersión máxima 14,8**, entre el clip del casco y
el del morro. Contra la escala de arriba —35,8 de dispersión del mismo auto adentro del
programa— eso es constancia, no deriva; y contra los 39,7 que lo separan del auto más
parecido, no alcanza para confundir nada. Los seis clips que comparten punto de montaje
quedan todos a menos de 5 del representante; los dos que se despegan son los dos ángulos
más cerrados, el casco y el morro, que es donde la carrocería está más cerca de la lente.

**Y el asfalto no mide y hay que decirlo, porque el número existe y es grande.** Se intentó
la misma comparación con parches de asfalto, que es lo que hizo la T-03 para el programa, y
no separa: los ocho clips dan 2,6 a 68,6, pero **las cuatro casillas del programa medidas
con estos mismos parches dan 4,9 a 34,7**, cuando la T-03 las midió en 4,6 a 9,2 con los
suyos. O sea que lo que se mueve es el parche y no el mundo: en una toma de a bordo la
calzada está barrida por el movimiento, en sombra bajo la carrocería, o los dos. La
medición está en [`salidas/el-mundo-de-la-camara.txt`](salidas/el-mundo-de-la-camara.txt) y
**su conclusión es que el instrumento no sirve acá**, no que el mundo cambió. Lo que sí
sirve es el cielo, y el ojo sobre la lámina: los ocho traen el mismo circuito costero de
dunas, los mismos pianos, la misma tribuna y el mismo cielo.

## 5. La cámara de a bordo de Veo no mira hacia atrás

Es el hallazgo de la task y costó dos generaciones, más las dos que se perdieron por el
error de Vertex encima de ellas.

Dos de los ocho clips se pidieron **mirando hacia atrás** —el arco de seguridad apuntando
por el camino que el auto deja— con MARVOK persiguiendo, que es lo que el programa cuenta en
las casillas 3 y 13. Los dos volvieron con **la cámara montada atrás pero mirando adelante,
y el auto violeta ADELANTE**:
[`lamina/3-la-camara-que-no-mira-atras.jpg`](lamina/3-la-camara-que-no-mira-atras.jpg).

Eso no es un defecto estético: **invierte la carrera**. El feed es el del auto que va
primero, la fila del selector dice CALDRIX y el programa muestra a CALDRIX liderando; dos
clips donde persigue a otro contradicen las tres cosas. Y el segundo trajo además un auto de
**ruedas cubiertas**, que no existe en este mundo de seis monoplazas.

**No se insistió una tercera vez, y es la regla de la T-03 aplicada**: cinco pedidos de plano
aéreo y cinco fracasos terminaron en *"la palanca no es escribir mejor"*. Acá son dos de dos
con el pedido escrito en las dos posiciones que ganan.

**Lo que se hizo en su lugar es la otra mitad de esa regla: se nombró el plano que el modelo
sí sabe hacer.** Los dos clips que devolvió el modelo cuando se le pidió mirar hacia atrás
son, los dos, *una cámara montada en la cola mirando hacia adelante sobre todo el auto*, y es
un plano bueno y distinto de los otros siete. Así que el clip 7 pide exactamente eso, en
positivo y con la ruta despejada —que es además lo que le corresponde al que va primero—, y
volvió a la primera. El clip 3 pasó a ser una cámara en el casco del piloto, que es el otro
ángulo que una transmisión usa y que no estaba en los ocho.

Los dos rechazados **no se borraron**: están en
`content/.fuentes/camaras/caldrix/rechazados-la-camara-que-no-mira-atras/` con su prompt,
porque son la evidencia del hallazgo.

**Lo que la etapa 3 hereda:** ninguna de las seis cámaras pide una toma hacia atrás, y el
auto que persigue no se muestra desde el de adelante. Si se lo quiere, la palanca no es el
prompt.

## 6. El audio: ocho de ocho sin una palabra, y el portón se vio rechazar dos veces

Verbatim en [`salidas/el-porton-de-audio.txt`](salidas/el-porton-de-audio.txt).

| oyente | los ocho clips | control positivo: el ambiente con una línea de relator real a −20 LUFS | control de otro origen: los clips de la parada del partido |
| --- | --- | --- | --- |
| whisper.cpp medium | `(engine revving)`, `(tires squealing)`, y **`(upbeat music)` en cuatro** | *"Norvik are still in front here, 1-0…"* | *"Yeah, we needed this break, I'm shattered…"* |
| gemini-2.5-flash | `SPEECH: NO` en los ocho | `SPEECH: YES` + transcripción | `SPEECH: YES` + transcripción |

**La discrepancia se resuelve a favor del segundo oyente y ya estaba resuelta.** whisper
devuelve "música" en cuatro de los ocho; el segundo, que escucha el archivo en vez de
transcribirlo, reporta motor, cambios y gomas y ninguna música. Es la falla conocida de
whisper con motores sostenidos que la T-03 ya documentó en la casilla 12, y acá aparece más
seguido justamente porque una cámara de a bordo es motor de punta a punta. **El portón
decide sobre habla**, y ahí los dos coinciden.

**La radio de equipo era el riesgo propio de esta toma y no apareció.** Tampoco se la nombró
en el prompt: es habla, ya está cubierta por la misma oración que viajó en las catorce
casillas del programa, y nombrar lo prohibido da permiso.

**Y el portón se corrió también sobre el entregable**, no sólo sobre sus insumos: los 64 s
pegados y emparejados dan `SPEECH: NO`
([`salidas/el-porton-sobre-el-feed.txt`](salidas/el-porton-sobre-el-feed.txt)).

### El nivel, que acá sí se corrigió

El programa midió y dejó la corrección al montaje. Acá el montaje **es** esta task, así que
se corrigió, y hacía falta más que allá:

| | antes de emparejar | después |
| --- | --- | --- |
| dispersión entre los ocho clips | **15,8 LU** (−26,1 a −10,3 LUFS) | 0,0: los ocho a −23,0 |
| pico del feed | **0,0 dBFS**, o sea recortando | **−10,5 dBFS** |
| LRA del feed | 15,7 LU | 2,4 LU |

**El destino es −23,0 LUFS y no es un gusto: es lo que mide `programa.mp4`, leído del
archivo en la corrida y no tipeado.** El número importa por el ADR 0026: el foco de audio le
da volumen 1 al feed agrandado y 0 a todos los demás, así que agrandar esta cámara **calla la
transmisión y deja al espectador adentro del auto**. Si el feed estuviera más fuerte o más
flojo que el programa, ese momento —que es el beat de audio de la demo— sería un salto de
volumen. La referencia se imprime al lado en cada corrida:
[`salidas/el-feed-armado.txt`](salidas/el-feed-armado.txt), y el audio **sin** emparejar se
deja medido en la misma salida, porque sin eso "los ocho quedaron parejos" no tiene con qué
compararse.

## 7. Lo que la T-06 tiene que saber

- **`content/.fuentes/caldrix.mp4`**, 64,000000 s, 1536 cuadros, 24 fps, 1280×720, y su
  audio aparte en **`audio/caldrix.m4a`**, que es lo que el empaquetador de
  `hydration-break` toma por argumento. El `.mp4` está gitignoreado; el `.m4a` no, igual que
  `programa.m4a`.
- **El largo sale de `race.json` y no está tipeado**: `armar-camara.sh` lee `ofertaDura` y
  `clipDura` y se niega a correr si no hay exactamente ocho clips. Los 64,000 s no se
  consiguen recortando: son 8 × 192 cuadros.
- **El script toma el nombre de la cámara por argumento** (`./armar-camara.sh caldrix`), así
  que la etapa 3 lo corre cinco veces más sin tocarlo.

## 8. Lo que no se rompió

`npm test` da **184 pruebas, 184 pasan, 0 fallan**, salida 0; `npm run check` da **verde**
—3 ocurrencias, las tres en la lista aceptada, y cero hits en la segunda—, salida 0. Son los
mismos números con los que la T-01 abrió la fase. Verbatim en
[`salidas/no-se-rompio-nada.txt`](salidas/no-se-rompio-nada.txt).

**Y `lib/` no se tocó, lo cual acá es más fácil de probar que de prometer**: `git status` no
muestra un solo archivo trackeado modificado. Todo lo que esta task escribió vive adentro de
`demo/race-multiview/` y de `.project/phases/13-…/`, que son las dos carpetas que todavía no
están commiteadas.

## 9. Lo que esta task NO hizo

- **La cadena y la señalización.** No hay HLS, no hay `EXT-X-DATERANGE` y no hay asset-list:
  son la T-06 y la T-07. Lo que esta task entrega es el archivo del largo correcto.
- **Las otras cinco cámaras.** Cero clips. Lo que se les deja escrito es el bloque de
  identificación, el hallazgo de la cámara que no mira atrás, y la tasa de pérdidas de
  Vertex, que hay que presupuestar.
- **Tocar `race.json`.** El desfasaje entre el amarillo de la fila y el amarillo de la caja
  está medido y no resuelto, y está dicho en §3 por qué no lo resuelve esta task.
- **Resolver la tipografía de la carrocería.** Acá no apareció (§10), pero eso es un dato de
  esta clase de toma y no un arreglo: el prompt no hizo nada nuevo para conseguirlo, y las
  tres cámaras de seguimiento de la etapa 3 van a ver el auto entero como lo ve el programa.
  El número de la T-03 —unas cinco generaciones por clip limpio— sigue siendo el que hay que
  usar para presupuestarlas.

## 10. La carrocería volvió limpia, y no es mérito del prompt

Es el resultado que menos se esperaba. El programa volvió con **once de catorce** casillas
con renglones ilegibles en el auto, y la cuenta de sacarlos rechazando clips —unas cinco
generaciones por clip limpio— es lo que hizo que la T-03 lo dejara sin resolver.

En estos ocho **no hay una sola palabra en la carrocería**:
[`lamina/5-la-carroceria-de-cerca.jpg`](lamina/5-la-carroceria-de-cerca.jpg), con cada
recorte a resolución completa y ampliado ×2 con `NEAREST`, que no inventa bordes: lo que se
lee estaba en el píxel. El arco, la tapa de motor, el pontón y el morro —que son justo
donde un patrocinador iría— vuelven pintados y lisos. Lo único con marcas es **el casco del
piloto en el clip 2**, con dos calcos de cuatro letras que no dicen nada (`EI`, `A`) y una
firma ilegible, y un rótulo diminuto en el arco del clip 6.

**El control está en la misma lámina y sin él esto no probaría nada**: el mismo recorte, con
el mismo comando, sobre la casilla 12 del programa, donde el auto magenta lleva una `S`
grande en la tapa de motor y renglones en el pontón. El instrumento muestra letras cuando
las hay.

**La explicación, dicha como hipótesis porque no se midió contra su contrafactual:** el
programa filma el auto desde afuera, entero, que es el encuadre de una foto de prensa —un
género lleno de patrocinadores—; una cámara de a bordo muestra tres paneles de chapa a medio
metro, y ahí el modelo no tiene dónde poner un cartel. Si es cierto, **las tres cámaras de a
bordo de la etapa 3 heredan esto y las tres de seguimiento no**, y eso se sabe gratis cuando
se generen.

**Y ninguna marca real, que es el R2**: la palabra `APPLE` no viajó en ninguno de los ocho
prompts —el padrón de seis colores usa `BRIGHT LIME GREEN` en los ocho, que es el arreglo
que la casilla 10 del programa dejó medido— y los ocho se miraron de cerca uno por uno.

## 11. Tres hallazgos que se reportan y no se arreglan

- **`code 14` de Vertex no es una rareza y hay que presupuestarlo.** Tres de trece
  lanzamientos acá, dos de seis en la T-03: cinco eventos en dos días. Un 20 % sobre las 40
  generaciones de la etapa 3 son **US$6,40** que el techo de esa etapa tiene que contener.
  Las tres se verificaron antes de relanzar y ninguna había evaluado el prompt.
- **`comparar-mundo.py` de la T-02 deja un `__pycache__` adentro de la carpeta de la T-01**,
  que es el temporal en el árbol que `colores-del-programa.py` de la T-03 sí evita con
  `sys.dont_write_bytecode`. El `.pyc` que dejó esta corrida se borró; el arreglo es una
  línea en el script de la T-02 y **es de esa task**, no de ésta.
- **El tope se controla lanzando, y ése es el defecto que costó US$0,80.** Verlo frenar es
  fácil; verlo *no* frenar obliga hoy a llamar a Vertex. La propuesta —una opción que cuente
  y salga, sin POST— está en [`el-gasto.md`](el-gasto.md), y es sobre el generador, que la
  etapa 3 hereda.
