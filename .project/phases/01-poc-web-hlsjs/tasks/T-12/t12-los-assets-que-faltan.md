# Los creativos que el recorrido necesita y no tiene

El recorrido de los cinco layouts corre completo con el material del repo, que
son tres clips de doce segundos de películas abiertas de la Blender Foundation y
dos cuadros fijos sacados de dos de ellas. Cuatro de los cinco layouts quedan
bien. Uno no, y hay además un pedido que no es de luz sino de forma.

Todo lo que sigue está medido. El método es el de la T-11: luma Rec.709 del
cuadro escalado a 64x36, en la escala 0 a 255. Fuera del navegador está en
`t12-luz-de-los-assets.json`, y dentro de la página, sobre el elemento que está
reproduciendo de verdad, en el barrido de `t12-medicion.json`.

## Lo que hay

| Asset | Fuente | Ventana | mín | media | máx |
| --- | --- | --- | --- | --- | --- |
| adB | *Caminandes: Gran Dillama* | 35 a 47 s | 107,7 | 141,3 | 162,2 |
| adA | *Sintel* trailer | 28,5 a 40,5 s | 10,8 | 123,1 | 150,6 |
| adC | *Elephants Dream* teaser | 31 a 43 s | 13,9 | **24,9** | 34,0 |
| adImageA | un cuadro de *Caminandes* | — | 161,4 | 161,4 | 161,4 |
| adImageB | un cuadro de *Sintel* | — | 136,8 | 136,8 | 136,8 |
| primario | *Tears of Steel* | 270 a 450 s | 51,0 | 100,4 | 183,7 |

Las ventanas de adA y adC no son las que eligió la T-05: se barrieron las tres
fuentes enteras y de cada una se tomó la ventana de doce segundos cuyo instante
más oscuro es el más claro posible. Sintel pasó de una media de 82,4 con dos
cortes a negro adentro (mín 0,0) a una media de 123,1, y el teaser de Elephants
Dream de 18,7 a 24,9.

## Lo que falta, y es un solo layout

**El Quad (`multiView`) es el único de los cinco que se queda sin material.**
Consume los tres assets de aviso de una sola vez —el cuarto cuadrante es el
contenido primario—, así que no hay con qué reemplazar al que está oscuro: la
salida que usó la T-10, cambiar el asset por otro, en este layout no existe.

En la corrida del recorrido, en el instante más claro de la ventana:

| Cuadrante | Asset | Luminancia |
| --- | --- | --- |
| primario, arriba a la izquierda | *Tears of Steel* | 104,6 |
| `view2`, arriba a la derecha | adA | 163,1 |
| `view3`, abajo a la izquierda | adB | 130,5 |
| `view4`, abajo a la derecha | adC | **24,5** |

Y ese 24,5 es el mejor instante de los doce segundos: el barrido completo de la
ventana lo tiene bajando hasta 8,6. No es la ventana elegida, es la fuente: en
los 75 segundos del teaser de *Elephants Dream* no hay un solo instante que
llegue a 46, la media de la película entera es 15,0, y la mejor ventana de doce
segundos que tiene promedia 24,9 con un pico de 34,0.

**El pedido concreto es un creativo de video de doce segundos, 1280x720 o más,
con luminancia media arriba de 100 y sin ningún instante por debajo de 40.** Es
lo que miden los otros dos, y con uno alcanza para que el Quad tenga sus cuatro
cuadrantes legibles. Con dos, el recorrido deja de repetir el mismo clip en
breaks distintos.

## Lo segundo que falta, que no es de luz

**El LBox con video, que es el que David marcó como el más difícil de
conseguir, hoy está cubierto recortando el 60 % de un clip de 16:9.** Las dos
barras del L son las cajas más alejadas de la relación de aspecto de un asset
entre las quince que midió la T-03: la vertical es de 0,71 a 1 y la horizontal
de 4,44 a 1, contra 1,78 de un asset de 1280x720. Con la política del ADR 0013
—recorte centrado, sin deformar— de la barra vertical se ven 512 de las 1280
columnas y de la horizontal 288 de las 720 filas, y en las dos queda afuera el
60 % del asset.

O sea que lo que está en pantalla es un fragmento de una película y no un
creativo pensado para esa caja. Se ve bien porque los cuadros elegidos tienen
el sujeto al medio, que es exactamente lo que el ADR 0013 anticipa —"si el
recorte se come algo que importa, se cambia el asset"—, pero es una elección de
encuadre hecha a mano y no una propiedad del material.

**Lo que hace falta acá es un creativo hecho para la forma de la barra**, o,
si el formato va a admitir un asset de 16:9 en una caja de 0,71 a 1, que el
modelo diga por asset el modo de llenado o la relación de aspecto para la que el
creativo está pensado. Eso último es la pregunta que el ADR 0013 ya le manda a
SVTA, y el LBox es el layout donde deja de ser teórica.

## Una cosa que se aprendió eligiendo los cuadros fijos

La luminancia sola no alcanza para elegir un creativo. El instante más claro de
*Caminandes* en toda la película es su placa de agradecimientos: mide 180 sobre
255, es perfectamente estable, y en pantalla se lee como que el reproductor está
mostrando los créditos de algo. El criterio quedó en claro **y** mirado, con el
sujeto al medio porque la caja se come los costados.

Y hay un segundo criterio que también salió de mirar: el cuadro fijo no puede
venir de la misma escena que el video de la misma película. El primer LBox image
usó el cuadro más claro de Sintel, que cae adentro de la ventana de doce
segundos de adA, y en pantalla los dos breaks del LBox quedaban con la misma
duna en la misma barra. Lo que distingue LBox video de LBox image es que uno se
mueve y el otro no, y con la misma imagen en los dos eso no se ve.

---

## Nota del cierre de la fase — 2026-09-04

Lo de arriba no se toca: es la medición. Esto corrige una sola frase de la
lectura que se hizo de ella.

El pedido dice "sin ningún instante por debajo de 40" y lo justifica con "es lo
que miden los otros dos". **La media arriba de 100 sí la cumplen los dos; el
piso por instante lo cumple sólo adB.** La tabla de arriba le da a adA
(*Sintel*) un mínimo de 10,8 en su ventana elegida, el barrido fuera del
navegador da 11,2 para esa misma ventana, y adentro del navegador adA baja a
21,3 en la barra horizontal del break del LBox video y a 5,4 en su cuadrante del
Quad (`t12-medicion.json`).

El pedido no cambia, porque el piso por instante es justamente la propiedad que
distingue un creativo grabable de uno que se apaga en cámara, y las capturas de
la fase se toman en el instante más claro de cada ventana, lo cual es legítimo
para una captura y no lo es para una grabación, que muestra los doce segundos
enteros. Lo que cambia es cómo se le pide a David: como el criterio que hace
falta, y no como el estándar que el material actual ya cumple.
