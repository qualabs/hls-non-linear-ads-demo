# El guion de los dos relatores, y los prompts de estilo

Los textos exactos que se sintetizaron y donde cae cada uno sobre los 112 s del programa.
Esta aca y no en el README por la misma razon que en la demo del partido: para que el
README se pueda leer entero sin esto.

**El guion que se ejecuta es `../scripts/relato/guion.json`**, no esta tabla. Aca esta
ademas donde cae cada linea, que sale de `tiempos.json` y lo calcula
`../scripts/armar-relato.mjs` con la duracion medida de cada archivo. Dos copias del mismo
texto se despegan, y la que se despega es siempre la que nadie ejecuta.

## El reparto es por funcion y no por turnos

**R** es **Charon** y relata lo que pasa. **C** es **Kore** y comenta por que. Son las dos
voces de `demo/hydration-break/audio/`, reusadas a proposito: la funcion es la misma, el
prompt de estilo ya estaba calibrado, y dos demos del mismo proyecto que suenan al mismo
canal es coherencia. La razon del reparto esta escrita alla y vale igual en una carrera:
*"dos voces diciendo lo mismo suenan peor que una sola"*.

Las voces ocupan **80,6 s de 112, o sea el 72 %**. Es mas que el 57 % de la demo del
partido y es del contenido: alla el programa es una parada de hidratacion, que es una pausa;
aca es una carrera, donde el relator se calla cuando corta el realizador y no mucho mas. Los
catorce huecos caen en los cortes.

## La linea del anuncio

La fila en negrita. Termina de decirse en **27,640 s**, y la ventana abre en **28,000**:
la voz entra antes que el tag, que es como pasa en una transmision. El segundo sale de
`race.json` y no esta tipeado en ningun lado; la comprobacion, con sus dos controles en
rojo, la hace `../scripts/verificar-anuncio.mjs`.

## La otra linea con hora, que es la 15

El clip de la casilla 12 trae **dos tomas**: un seguimiento lateral con el piano en primer
plano hasta los **4,375 s**, y despues un corte a un plano frontal. La linea que nombra el
piano tiene que **terminar de decirse antes de ese corte**, o describe una imagen que ya no
esta. Sale en 91,86 y el corte cae en 92,38.

El segundo del corte **se mide sobre el clip y no se tipea**: `../scripts/verificar-linea-15.mjs`
lee los scene scores cuadro a cuadro, toma el salto mas grande y lo compara contra el mismo
estadistico de los otros trece clips, que son de una sola toma. Su control es la misma linea
corrida 1 s, que tiene que dar rojo.

| voz | entra | sale | casilla | que hay en pantalla | linea |
| --- | ---: | ---: | ---: | --- | --- |
| **R** | 0.50 | 5.84 | 1 | los seis juntos, la camara viajando con ellos | *Eleven laps gone here on the coast, and this is still one race.* |
| C | 8.30 | 13.54 | 2 | CALDRIX solo, teleobjetivo | *Caldrix in front, and he has not put a wheel wrong all afternoon.* |
| **R** | 15.90 | 21.78 | 3 | MARVOK al lado de CALDRIX | *Marvok has been in that mirror for three laps now, looking for a way through.* |
| **R** | 24.12 | 27.70 | 4 | **los seis en fila por la recta principal** | ***The cameras on all six cars are open.*** |
| C | 28.02 | 30.89 | 4 | **los seis en fila por la recta principal** | *Six of them, and you choose which one you watch.* |
| **R** | 32.30 | 37.89 | 5 | NOCTEV solo por un tramo abierto | *Noctev third, and he has been quicker than the leader for two laps now.* |
| **R** | 40.30 | 46.51 | 6 | RUNTAK y PENTAV, frenada rueda a rueda | *Runtak and Pentav side by side into the braking zone, and neither of them lifts.* |
| **R** | 48.20 | 52.85 | 7 | QUENTRA pasa a PENTAV por afuera | *And here comes Quentra, round the outside of Pentav.* |
| C | 53.17 | 55.29 | 7 | QUENTRA pasa a PENTAV por afuera | *Fifth place, and it sticks.* |
| **R** | 56.40 | 61.24 | 8 | CALDRIX solo, teleobjetivo cerrado | *And back to the leader. Caldrix, still with a second in hand.* |
| **R** | 63.60 | 68.66 | 9 | MARVOK y NOCTEV rueda a rueda por el curvon | *Marvok and Noctev now, wheel to wheel through this long corner.* |
| C | 68.98 | 72.64 | 9 | MARVOK y NOCTEV rueda a rueda por el curvon | *And Noctev is close enough to try something.* |
| **R** | 73.10 | 79.01 | 10 | PENTAV y QUENTRA por el tramo costero, con el mar detras | *Down to the sea section, Pentav and Quentra still together.* |
| C | 80.30 | 84.86 | 11 | el peloton repartido por la costa | *That is three separate fights, and all of them are alive.* |
| **R** | 88.20 | 91.86 | 12 | RUNTAK al lado del piano — **ese plano se termina a los 92,38** | *Look at Runtak, running right along that kerb.* |
| C | 92.18 | 94.33 | 12 | el corte al plano frontal de RUNTAK | *And the car keeps taking it.* |
| **R** | 96.40 | 100.26 | 13 | CALDRIX y MARVOK en la recta, la diferencia cerrada | *Marvok is right on the back of Caldrix again.* |
| C | 100.58 | 101.88 | 13 | CALDRIX y MARVOK en la recta, la diferencia cerrada | *The gap has gone.* |
| **R** | 105.00 | 109.14 | 14 | el peloton frente a la tribuna llena | *And they are on their feet as this field goes by.* |

## El prompt de estilo de cada voz

Son los de la demo del partido con el deporte cambiado, y nada mas: el prompt largo
original hacia que cinco de quince lineas salieran cuatro veces mas largas de lo pedido, y
acortarlo es lo que lo bajo.

**Charon, el relato:**

> A calm British motor racing commentator on live television, calling a race from the commentary box. Warm, level, unhurried. Never shouting, never like an advertisement.

**Kore, el comentario:**

> A calm British co-commentator, a former racing driver, answering her colleague on live television. Warm, level, unhurried, conversational. Never shouting, never like an advertisement.

## Los seis nombres viajan como se escriben

La demo del partido necesita mandarle **"Norvick"** al sintetizador aunque el equipo se
llame **"Norvik"**, porque con la `v` sola esta voz lo convierte en *Norwich*. Aca **no hace
falta ninguna sustitucion**: los seis nombres se eligieron entre veintidos midiendo como los
dice esta misma voz, y los seis vuelven como se escriben. Es un resultado y no una omision
— se busco la sustitucion y no hizo falta.

Lo que si conviene saber, porque aparece en las transcripciones y no es un defecto: el
transcriptor escribe *Kaldrick's* por CALDRIX y *Noctave* por NOCTEV. Son homofonos de lo
que la voz dice; lo que se oye es el nombre.

## Que hay en `lineas/`

Diecinueve archivos, uno por linea, en `.m4a` a 96 kb/s mono. Cada uno esta **nivelado solo
a -20,0 LUFS**, porque Kore sale unos 3 dB mas fuerte que Charon y en una conversacion eso
no se lee como enfasis sino como que una esta mas cerca del microfono. La ganancia que se le
aplico a cada uno esta en `transcripciones.tsv`, junto con lo que el portón oyo que dijo.
