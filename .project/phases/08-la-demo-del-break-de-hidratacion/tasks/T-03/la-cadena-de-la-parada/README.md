# La cadena de la parada: ocho eslabones y su chequeo de cuadro

La parada del juego del plate son **ocho eslabones de 8 s generados con Veo**, 64,03 s
concatenados. `los-ocho-eslabones.png` es un cuadro de cada uno, tomado a los 4 s, en orden.

Esto es la evidencia de que la cadena entró. La carpeta hermana
`generacion-de-la-parada/` es la evidencia de los siete intentos que **no** entraron, y se
queda en pie: la diferencia entre las dos no es un prompt mejor, es el umbral.

## Cómo está sembrada

Cada eslabón arranca del **último cuadro del anterior** (`ffmpeg -sseof -1`), así que la
continuidad no es una intención del prompt sino una entrada del modelo. El octavo, y sólo el
octavo, lleva además `lastFrame`: el primer cuadro del acto 3, que es donde el clip filmado
retoma. Por eso el plate no necesita disolvencias en ninguno de los dos empalmes.

## Deriva de escena: ninguna

Muestreado cada 8 s en los 64. En los ocho cuadros se repiten la **misma cancha** —la reja de
fondo con los mismos paños, el arco a la derecha, la pista roja detrás—, los **mismos conos**
naranjas en las mismas posiciones, las **mismas pecheras** amarillas y celestes con números
negros impresos, y la **misma luz** fría de tarde nublada. El eslabón 8 ya muestra a los
jugadores caminando de vuelta y una pelota en el piso, que es lo que hace que el corte al acto
3 no se lea.

Es la propiedad que decidía la fase entera: el plate es **un solo partido de punta a punta**, y
el espectador no puede percibir que el video principal cambió, porque no cambió.

## Chequeo de vestido comercial, eslabón por eslabón

Con el umbral que fijó Nicolás: **en el programa, una marca incidental en la ropa se acepta,
igual que si estuviera filmada; lo que no entra es una marca dominando el cuadro** — un logo
grande y centrado, un escudo legible en primer plano.

| Eslabón | Qué se miró | Veredicto |
|---|---|---|
| 1 | Pecheras planas con número impreso. Marcas de ropa deportiva chicas y laterales en pantalones. Ningún escudo. | entra |
| 2 | Igual. El jugador de la derecha con el brazo en alto no expone ningún pecho con marca. | entra |
| 3 | Igual. La pechera 2 en primer plano es lisa con número. | entra |
| 4 | Grupo bebiendo de frente, es el cuadro con más pecho a cámara de la cadena. Pecheras lisas con número. | entra |
| 5 | Marca incidental en la cintura de un pantalón, chica y lateral. | entra |
| 6 | Igual que 5. Nada centrado ni dominante. | entra |
| 7 | Pecheras lisas. Un pantalón con tiras laterales, incidental. | entra |
| 8 | Plano más abierto, jugadores volviendo. Nada legible. | entra |

**Ninguna marca domina un cuadro y ninguna imita una real de forma legible.** Los siete
intentos anteriores caían justamente por eso —un felino, tres tiras dibujadas al pecho,
swooshes, un escudo de federación—, y lo que los distingue de estos ocho no es el tamaño sino
**dónde está la marca**: ahí estaba dibujada al frente, acá es ropa deportiva incidental.

El prompt que los generó está en `scripts/generar-parada.sh`, con la instrucción explícita de
pecheras de un solo color plano con un número negro grande y **ninguna marca grande o centrada
en el cuadro**.
