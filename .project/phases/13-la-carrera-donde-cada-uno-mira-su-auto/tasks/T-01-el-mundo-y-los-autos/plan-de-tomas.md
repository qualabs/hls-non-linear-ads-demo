# El plan de tomas del programa

Catorce casillas de ocho segundos, 0 a 112 s. **Cada casilla es una generación de Veo y
entre dos casillas no hay que resolver nada**: el programa es un montaje que corta entre
autos, así que el corte es el contenido y no un artefacto (`DESIGN.md` §2).

Los números no se repiten acá: salen de
[`demo/race-multiview/race.json`](../../../../demo/race-multiview/race.json), que es la
única fuente y la lee también el armado del audio, el empaquetado y la señalización
(ADR 0044). Lo que esta tabla agrega es **qué se ve en cada casilla**.

## Dónde está el prompt exacto, y por qué no está acá

En [`demo/race-multiview/scripts/generar-programa.py`](../../../../demo/race-multiview/scripts/generar-programa.py),
que es lo que el ADR 0061 manda: la receta de generación vive con el generador. Esta tabla
describe **qué se ve**; el texto que viaja a Veo está allá, una sola vez.

**Y esa separación no es prolijidad, es un defecto arreglado.** Este archivo llegó a tener
copiadas las palabras de color de cinco casillas, y cuando la T-01 corrigió dos de ellas
—`VIVID YELLOW-GREEN` volvía amarillo y chocaba con CALDRIX— la copia de acá se quedó con
las viejas. El sondeo de la T-02 lo encontró antes de que costara catorce generaciones. Dos
copias del mismo texto se despegan, y la que se despega es siempre la que nadie ejecuta.

## Las catorce casillas

| # | t | quién | clase de toma | qué se ve |
| ---: | ---: | --- | --- | --- |
| 1 | 0–8 | los seis | cámara de pista, fija | Los seis pasan juntos por una curva rápida y cruzan el cuadro. La cámara los deja pasar. |
| 2 | 8–16 | CALDRIX | cámara de pista, teleobjetivo | El amarillo solo, de costado, por un curvón largo, llenando la mitad derecha del cuadro. |
| 3 | 16–24 | CALDRIX · MARVOK | cámara de pista, teleobjetivo | El violeta pegado atrás del amarillo, sale del rebufo a la salida y busca por dónde pasar. |
| **4** | **24–32** | **los seis** | **plano general de la recta** | **Los seis en fila por la recta principal, la tribuna de un lado y el mar del otro. No pasa nada: es la casilla del anuncio.** |
| 5 | 32–40 | NOCTEV | cámara de pista | El aguamarina solo por una chicana, piano a piano. |
| 6 | 40–48 | RUNTAK · PENTAV | cámara de pista | El ciruela y el verde manzana lado a lado en una frenada, rueda a rueda, ninguno cede. |
| 7 | 48–56 | QUENTRA · PENTAV | cámara de pista baja, al piano | El bronce llega detrás del verde manzana y lo pasa por afuera, pegado al piano. |
| **8** | **56–64** | **CALDRIX** | **cámara de pista, teleobjetivo cerrado** | **El amarillo solo por un curvón a izquierda, el auto entero de punta a cola llenando el cuadro. Es el cruce de la compuerta 2.** |
| 9 | 64–72 | MARVOK · NOCTEV | cámara de pista, teleobjetivo | El violeta y el aguamarina en fila india por un curvón rápido. |
| 10 | 72–80 | PENTAV · QUENTRA | cámara de pista | El verde manzana y el bronce juntos por las eses de la costa, el mar detrás. |
| 11 | 80–88 | los seis | plano general de la costa | Todo el pelotón repartido por el tramo costero. |
| 12 | 88–96 | RUNTAK | cámara de pista baja, al piano | Las ruedas traseras del ciruela montando un piano, la suspensión trabajando. |
| 13 | 96–104 | CALDRIX · MARVOK | cámara de pista, teleobjetivo | En la recta principal, el violeta pegado a la cola del amarillo, la diferencia cerrada. |
| 14 | 104–112 | los seis | cámara de pista, fija | El pelotón pasa frente a la tribuna principal y el público de pie. |

Los nombres de los autos **no aparecen en el prompt** —el modelo no tiene por qué saberlos—
sino su color. El nombre vive en la fila del selector, que es texto real del navegador.

**Ninguna casilla tiene un auto sin nombrar.** La casilla 7 decía *"toma a un auto más
lento"*, sin decir cuál, y un auto sin color declarado es un séptimo color en pantalla en una
demo que promete seis. El auto pasado es PENTAV, y por eso PENTAV aparece siete veces y no
seis.

## Cómo se le pide una cámara a Veo, que es lo que decide esta tabla

La columna de clase de toma dice *"cámara de pista"* y no *"seguimiento"*, y eso se ganó
midiendo. Veo **no obedece una instrucción de encuadre escrita en geometría** —*"una cámara
que corre al lado del auto, a la misma velocidad, unos metros al costado"*— y devuelve, en su
lugar, la toma que él asocia a una carrera: cámara sobre el auto o cámara en el eje de la
pista. Se le pidió así dos veces a la casilla 8 y las dos volvieron con la cámara montada en
el auto.

**Sí obedece cuando el encuadre se pide con el vocabulario de lo que es**: *"television race
coverage, trackside camera position"*, *"con teleobjetivo"*, *"cámara baja al borde del
piano"*. Doce de las catorce casillas salieron a la primera con esa forma. Es la misma
lección de la fase 08 —describir la alternativa en lugar de negar lo que no se quiere—
aplicada al encuadre en lugar de a la librea: **se nombra el plano, no se dan las
coordenadas de la cámara**.

Y tiene una consecuencia que le sirve a la etapa 2: **las seis cámaras de a bordo no van a
pelearse con el modelo**, porque la cámara de a bordo es justamente lo que Veo devuelve solo.

## Las casillas 4 y 11 no son aéreas, y quedaron igual

Las dos se pidieron como plano de helicóptero y las dos volvieron a nivel de pista. Contando
el sondeo son **cinco intentos de plano aéreo y cinco fracasos**, con el encuadre dicho
primero, dicho último y dicho con el vocabulario que funciona en las otras doce.

Lo que el sondeo ya había aislado es que el modelo **sí sabe hacer un cenital**: la generación
`d` lo devolvió a la primera con un prompt que era sólo la instrucción de cámara. Lo que no
hace es un cenital **mientras el prompt describe además una carrera con seis autos
identificables por color**, que es la tensión real: un plano desde ochenta metros hace que los
seis colores no se lean, y de los dos pedidos el modelo resuelve el que está escrito más
veces.

**No se insistió, y la razón es que la casilla no necesitaba ser aérea.** Lo que el plan le
pide a la 4 está tres párrafos más abajo y son tres cosas —los seis autos en cuadro, que no
pase nada, y que la línea del anuncio entre entera—, y las tres las cumple el plano general
de la recta que volvió. Gastar generaciones en una palabra que ninguna de las tres condiciones
nombra habría sido pagar por la estética del plan en lugar de por su función.

Si en algún momento el aéreo importa de verdad, la palanca no es escribir mejor: es
**generar desde un primer cuadro**, que fija el encuadre por construcción en lugar de
pedirlo. No se probó acá y no está en el presupuesto de esta etapa.

## La casilla 4 es la del anuncio, y por eso es la que está restringida

`ofertaEn` vale **28**, o sea que el segundo en que la señalización abre la ventana cae
adentro de la casilla 4, que va de 24 a 32.

**Qué tiene que cumplir esa casilla**, y esto es del plan y no del montaje, por eso se
resuelve acá:

1. **Nada de choque, entrada a boxes ni bandera.** Una línea que dice que se habilitaron las
   cámaras no tiene dónde caer encima de un accidente. La casilla 4 es un plano general de los
   seis autos por la recta: no pasa nada, y es exactamente el plano al que un director corta
   cuando la transmisión tiene algo que anunciar.
2. **La línea entera tiene que entrar adentro de la casilla.** La T-04 assertará que el fin
   hablado de la línea cae en `[ofertaEn − 0,5 ; ofertaEn]`, o sea en `[27,5 ; 28,0]`. Con
   eso, la línea se dice a lo largo de `[28 − L ; 27,5]`, y entra entera en la casilla 4
   —que arranca en 24— **si y sólo si `L ≤ 4,0 s`**. Ése es el número que
   `race.json` declara como `anuncioLargoMax`, para que la T-04 lo lea del mismo archivo del
   que lee `ofertaEn` y no lo vuelva a deducir.
3. **Y la casilla 3 también lo admite**, que es el margen. Si el guion quedara más largo que
   los 4 s, la línea se derramaría hacia atrás sobre la casilla 3 (16–24), que es una pelea
   entre dos autos y no un incidente. O sea que un error de medio segundo no obliga a
   regenerar nada.

**Y esto se verificó en lugar de afirmarse.**
[`salidas/verificar-plan.mjs`](salidas/verificar-plan.mjs) lee `race.json`, calcula en qué
casilla cae `ofertaEn` y en qué segundo arrancaría una línea de `anuncioLargoMax`, y compara
contra las casillas que este plan marca como que admiten el anuncio. Con el `race.json` real
da verde. **El control son dos mutaciones y las dos tienen que dar rojo**, y lo dan: subir
`anuncioLargoMax` de 4 a 5 hace que la línea arranque en el segundo 23 y se derrame fuera de
su casilla, y mover `ofertaEn` de 28 a 40 la manda a la casilla 6, que este plan no marca.
Verbatim en
[`salidas/control-la-casilla-del-segundo-28.txt`](salidas/control-la-casilla-del-segundo-28.txt).

Lo que este chequeo **no** mide es cuánto dura la línea de verdad: eso lo mide la T-04 sobre
el audio sintetizado, con su propio control.

**La casilla 4 también hace algo que el diseño no pedía y conviene aprovechar**: es el único
plano donde los seis autos están en cuadro a la vez. Cuando la voz dice que se habilitaron las
cámaras, en pantalla están las seis opciones. No cuesta una generación extra y hace que el
anuncio se entienda sin la placa que esta demo decidió no tener.

## La casilla 8 es el cruce que la compuerta 2 necesita

La etapa 2 genera **una sola cámara, la de a bordo de CALDRIX**, y su gate es *"la cámara y
el programa son la misma carrera"*. Para que eso sea comprobable y no una impresión, hace
falta que el programa muestre a CALDRIX **desde afuera, adentro de la ventana**.

La casilla 8 va de 56 a 64, o sea de lleno adentro de la ventana (28–92), y es un plano de
pista con teleobjetivo cerrado sobre CALDRIX, tomado desde el costado del circuito. Durante
esos ocho segundos se puede poner el programa y el feed uno al lado del otro y comparar el
mismo auto desde adentro y desde afuera, en el mismo segundo: el amarillo, la franja, la luz,
el asfalto y el fondo. **Ése es el cruce, y está puesto acá a propósito.**

**Y por eso esta casilla es la única que se regeneró dos veces.** Los dos primeros intentos
volvieron con la cámara montada en el auto, y una toma de a bordo acá no sería un plano
distinto: sería la misma cosa que el feed contra el que hay que compararla, así que el cruce
se quedaría sin las dos mitades.

## Ninguna casilla tiene un incidente, y es una decisión

`TASKS.md` sólo prohíbe el incidente en la casilla del segundo 28. Acá no hay ninguno **en
ninguna de las catorce**, y la razón es de producción y no de guion: un choque, una salida
de pista o una entrada a boxes es una cosa que **empieza en una casilla y termina en otra**,
y toda esta producción está construida sobre que entre dos casillas no hay que resolver
nada. Un incidente sería el único lugar donde volvería a hacer falta continuidad entre
generaciones, que es justamente lo que la fase 08 midió que Veo no sabe hacer.

Lo que reemplaza al incidente es lo que una carrera real tiene la mayor parte del tiempo:
peleas. Hay cuatro —casillas 3, 6, 9, 13— más un sobrepaso en la 7, y los relatores hacen
el resto.

## Cuántas veces aparece cada auto

| auto | casillas propias | + planos generales | total |
| --- | --- | ---: | ---: |
| CALDRIX | 2, 3, 8, 13 | 1, 4, 11, 14 | **8** |
| MARVOK | 3, 9, 13 | 1, 4, 11, 14 | 7 |
| PENTAV | 6, 7, 10 | 1, 4, 11, 14 | 7 |
| NOCTEV | 5, 9 | 1, 4, 11, 14 | 6 |
| RUNTAK | 6, 12 | 1, 4, 11, 14 | 6 |
| QUENTRA | 7, 10 | 1, 4, 11, 14 | 6 |

**Que CALDRIX sea el que más aparece no es un desequilibrio: es una premisa de la fase.**
`PHASE.md` elige la cámara de la etapa 2 argumentando que *"el auto que va adelante es el
que más aparece en el programa, así que es el único feed donde se puede cruzar lo que
muestra la cámara contra lo que muestra el programa"*. Si el plan de tomas no lo cumpliera,
esa elección se quedaría sin su razón.

## Lo que el color no puede hacer, y por eso el color importa más

El bloque de oferta del ADR 0064 declara por vista `id`, `name`, `type` y `uri`, **y nada
más**. No hay un campo de color, y agregarlo sería un cambio de formato y de librería, que
es lo primero que esta fase dice que no va a hacer.

O sea que **el color de cada auto no llega al selector por la señalización**: llega sólo por
el video. Lo que la fila del selector muestra es el `name`, y lo que el espectador tiene
para atar esa fila a una caja de la grilla es el color del auto adentro del cuadro. Es la
razón por la que los seis colores se midieron en lugar de elegirse a ojo.

**Y se miden sobre los clips, no sobre las fichas.** Los hexadecimales que están en
`race.json` salen de medir los catorce clips de esta tabla, porque el que dibuja lo que el
espectador ve es Veo. Las fichas del repositorio son el retrato de esos colores y no su
especificación; el detalle está en
[`el-mundo-y-los-seis-autos.md`](el-mundo-y-los-seis-autos.md) §2.
