# El mundo, y los seis autos

Todo lo de acá se decidió **sin generar un solo clip**, que es la razón de ser de la T-01:
el sondeo de la T-02 tiene que medir un prompt escrito y no una idea a medio formar.

---

## 1. El párrafo del mundo

Va **al frente de los 62 prompts, idéntico**, antes de la línea que describe la toma. Es
lo único que hace que siete piezas generadas por separado se lean como la misma carrera
(R1 de `PHASE.md`), y por eso no se le cambia una palabra entre una toma y otra.

> WORLD (identical in every shot of this race): a fictional single-seater championship
> racing on a wide, flat coastal circuit. Late afternoon under a high, even overcast:
> soft flat light, no sun, no hard shadows, no lens flare. Dry mid-grey asphalt, wide
> kerbs painted in alternating white and red blocks at the corners, plain white edge
> lines. Beyond the barriers: low green coastal scrub, grey concrete walls faced with
> boards painted in wide diagonal bands of white and slate grey, and one distant grey
> grandstand with a sparse crowd. A flat grey sea on the horizon under a pale sky.
> Daylight throughout: no rain, no night, no floodlights. The cars are contemporary
> open-cockpit single-seaters with exposed wheels, each painted one flat dominant colour
> with a single accent stripe running from the nose to the tail; the bodywork carries
> nothing else, and there is no number, no lettering, no logo and no sponsor marking
> anywhere on the car, on the driver's helmet or on the team clothing. SOUND: engines,
> tyres scrubbing on asphalt, wind over the camera, and a distant crowd. No speech, no
> commentary, no music.

**Por qué dice lo que dice**, que es lo que ninguna documentación trae:

- **La hora y el cielo son el ancla, no la ambientación.** *"Late afternoon under a high,
  even overcast"* saca del cuadro la variable que más separa dos generaciones del mismo
  lugar: el ángulo del sol. Sin sol no hay sombras duras que apunten para lados distintos
  ni destellos que aparezcan en un clip y no en el otro. Si aun así las seis cámaras no
  cierran, el repliegue escrito en el R1 es pasar la carrera a nocturna con luz
  artificial, y el costo es el mismo.
- **Donde prohíbe, describe la alternativa**, que es la lección medida de la fase 08. Las
  vallas no dicen *"sin publicidad"*: dicen qué tienen pintado —bandas diagonales blancas
  y grises—, porque *"liso"* no es una alternativa y una prohibición sin alternativa la
  llena el modelo con lo que conoce. Lo mismo con el sonido: primero la lista de qué se
  oye, después la prohibición.
- **La prohibición de tipografía se queda igual**, junto a la alternativa. El ADR 0045 y
  el 0062 midieron que la tipografía adentro del cuadro generado vuelve deformada, así
  que un número de auto es pedir un número ilegible. El auto se reconoce por el color y el
  nombre vive en la fila del selector, que es texto real del navegador.
- **El audio se dirige y no se da por sentado.** El prompt de la demo del partido no
  mencionaba el sonido y Veo lo llenó con diálogo en inglés entre los jugadores, repetido
  entre clips. Acá la lista de qué se oye va adentro del párrafo compartido, o sea en las
  62 generaciones, y no en la línea de cada toma.
- **"Fictional single-seater championship"** y no *"Formula 1"*: nombrar la categoría real
  arrastra sus libreas reales, que es el R2.

---

## 2. Los seis autos

| # | nombre | rol en la carrera | cámara | color dominante | acento | en `race.json`, medido sobre los clips | medido en la ficha |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | **CALDRIX** | el que va adelante | a bordo | amarillo limón | grafito | **`#CCB21F`**, hue 51° | `#D1BD31` |
| 2 | **MARVOK** | el que lo persigue | a bordo | violeta | blanco | **`#381A6A`**, hue 262° | `#5F28A1` |
| 3 | **NOCTEV** | el tercero | seguimiento | cian | grafito | **`#24ACC8`**, hue 190° | `#21AAC6` |
| 4 | **RUNTAK** | uno de la pelea del medio | seguimiento | magenta ciruela | blanco | **`#661955`**, hue 313° | `#652B4C` |
| 5 | **PENTAV** | el otro de esa pelea | a bordo | verde | blanco | **`#2D6E24`**, hue 113° | `#337E29` |
| 6 | **QUENTRA** | el que remonta desde atrás | seguimiento | bronce | blanco | **`#876E46`**, hue 37° | `#866C44` |

**El que manda es el de la anteúltima columna**, medido sobre los catorce clips del
programa. La última es el de la ficha, y está al lado para poder ver de un vistazo cuánto se
separa el retrato del original: cinco de los seis quedan a **6,1 de ΔE00 o menos**, y MARVOK
a 10,4. Las tres fichas que ya estaban más cerca del color de Veo que cualquier regeneración
—CALDRIX, MARVOK y PENTAV— **se quedaron como estaban**, porque rehacer una imagen para que
tenga fecha de hoy no la mejora.

### La ficha es el retrato del auto y no su especificación

Es al revés de lo que parece y conviene decirlo antes que nada, porque el que abra esta
carpeta va a suponer lo contrario: una imagen limpia de un auto quieto **se lee como la
definición del auto**, y acá no lo es.

**Manda lo que Veo dibuja.** A Veo se le piden seis autos distintos con la lista numerada y
la regla de unicidad, **se mide sobre el clip lo que efectivamente dibujó**, y de ahí salen
los hexadecimales de `race.json`. Las fichas se generan después, con esos números, para que
la imagen del repositorio se parezca a lo que se va a ver en pantalla.

**La razón es que son dos modelos distintos.** Las fichas las dibuja Imagen a través de
`agy`; los 62 clips los dibuja Veo. La calibración de palabras de color que está más abajo
en este documento —tres intentos hasta que PENTAV dejó de volver amarillo— se hizo con
cuidado **contra el generador equivocado**, y el sondeo de la T-02 midió lo que eso cuesta:
de los seis colores pedidos, cinco volvieron a más de 7 de dE00 de su ficha y tres a más de
25. Es la misma regla que esta task ya había escrito, aplicada un nivel más arriba: *"una
propiedad se mide atravesando la herramienta que la produce"*. La herramienta que produce
lo que el espectador ve es Veo.

**Lo que la ficha sigue sirviendo para**: mirar un auto entero, quieto y bien iluminado, que
es donde se ve si la librea se parece a una real (R2) y si la carrocería trae tipografía.
Para eso vale, y por eso se quedan en el repositorio. Lo que no hay que hacer es tomar su
color como el contrato.

**Y las palabras de color que van a los prompts de Veo no cambiaron**, que es lo que hace
que este cambio no cueste generaciones: siguen siendo las de la §3, porque son las que el
clip C del sondeo probó que devuelven seis autos distintos entre sí. Lo que cambió es qué se
espera de vuelta.

La medición sobre los clips, con su instrumento y sus controles, está en
[`../T-03-el-programa/los-catorce-clips.md`](../T-03-el-programa/los-catorce-clips.md).

El reparto de clases de toma es el de `DESIGN.md` §4 y no se movió: tres a bordo y tres de
seguimiento, con la del líder de a bordo porque es la que la etapa 2 va a mirar.

**Hay dos acentos y no seis** —blanco `#F5F5F2` y grafito `#2C2C30`—, **y la regla es de
contraste y no de gusto:** el dominante claro lleva el acento oscuro y el dominante oscuro
lleva el claro. Un acento por auto sería un
segundo color que compite con el primero justo en la caja chica, que es donde el color
tiene que decidir de un vistazo.

**Al líder le toca el color más legible, y es discutible.** Podría argumentarse lo
contrario —que la etapa 2 mira la toma más difícil, así que el auto de esa toma debería
llevar también el color más difícil—, y no se hizo: la dificultad de una toma de a bordo
es que el auto casi no está en cuadro, y eso no cambia con el color. Lo que sí cambia con
el color es la legibilidad en las otras trece tomas del programa y en la fila del selector,
y ahí el que más aparece conviene que sea el más claro de leer.

### Cómo se eligieron los colores, y qué se midió — dos veces, y la segunda es la que decide

Los tres criterios son los de `TASKS.md`. El primero —que los seis se distingan en una caja
de media pantalla— es el único medible, y **se midió dos veces**, porque la primera medición
contestaba una pregunta parecida pero distinta de la que importa.

**El instrumento**: distancia CIEDE2000 entre pares, que es la que corresponde cuando la
pregunta es *"¿se distinguen de un vistazo?"* y no *"¿qué tan distintos son los números?"*.
Está en [`salidas/de.py`](salidas/de.py), [`salidas/probar.py`](salidas/probar.py) y
[`salidas/mediana.py`](salidas/mediana.py).

**El control, sin el cual esto no sería un chequeo**: el mismo instrumento sobre dos verdes
casi iguales —`#2ECC71` y `#22B765`— devuelve **5,6**, muy por debajo de cualquier umbral
útil, o sea que tiene una forma de dar mal
([`salidas/control-medicion-de-colores.txt`](salidas/control-medicion-de-colores.txt)).

#### Primera medición: sobre los seis colores elegidos en papel

Seis hexadecimales elegidos a mano, medidos entre sí y contra los cinco que `TASKS.md` deja
afuera ([`salidas/medicion-de-los-colores-elegidos.txt`](salidas/medicion-de-los-colores-elegidos.txt)).
Dieron **25,4 de separación mínima entre ellos** y **25,4 contra el más cercano de los cinco
prohibidos**, o sea todo en verde.

**Y esa medición ya había pagado su costo**, porque mató tres candidatos que se iban a elegir
por gusto:

| candidato descartado | contra qué | ΔE00 |
| --- | --- | ---: |
| marfil / hueso | plateado | **12,9** |
| cobre | rojo | **17,6** |
| turquesa | verde oscuro | **14,7** |

#### Y aun así no alcanzaba, porque mide el color que yo elijo y no el que el modelo dibuja

**Al generador no se le da un hexadecimal: se le dan palabras.** Generadas las seis fichas y
medido el color sobre la imagen, la separación mínima real resultó **6,9** — entre CALDRIX y
PENTAV, que en papel estaban a 31,0. El modelo había tirado el *"vivid yellow-green"* de
PENTAV hacia el amarillo: los dos autos salieron a 53° y 64° de tono, once grados, y en la
lámina se leían como el mismo auto en dos tonos de amarillo.
Verbatim en [`salidas/control-la-primera-vuelta-en-rojo.txt`](salidas/control-la-primera-vuelta-en-rojo.txt).

**Ése es el control de verdad de esta task, y no es sintético: el instrumento encontró un
defecto real que la medición en papel daba por resuelto.** La regla que queda escrita es la
misma que este proyecto ya tiene para otras cosas y que acá vuelve a aparecer: **una
propiedad se mide atravesando la herramienta que la produce, no sobre el número que uno le
pidió.**

#### Segunda medición: sobre la ficha generada, que es la que vale

Se corrigieron las palabras de color y se regeneró —US$0, son imágenes— hasta que la
separación dejó de estar rota: PENTAV pasó por `VIVID YELLOW-GREEN` (volvió a 64°, amarillo)
y `BRIGHT LEAF GREEN` (volvió a 137°, demasiado verde oscuro) antes de quedar en
`BRIGHT APPLE GREEN` (**112°**), y MARVOK pasó de `LIGHT VIOLET PURPLE`, que volvió apagado,
a `BRIGHT ELECTRIC PURPLE`.

El resultado sobre las seis fichas que están en el repositorio
([`salidas/medicion-sobre-las-fichas.txt`](salidas/medicion-sobre-las-fichas.txt)):

- **Los seis tonos quedan repartidos**: 34°, 53°, 113°, 173°, 266° y 329°.
- **La separación mínima entre pares es 22,3**, entre MARVOK y RUNTAK. El par que estaba roto,
  CALDRIX contra PENTAV, pasó de **6,9 a 31,8**.
- La lámina de contacto está en [`fichas/lamina-de-contacto.jpg`](fichas/lamina-de-contacto.jpg),
  y mirada a ojo los seis se nombran solos: amarillo, violeta, aguamarina, ciruela, verde y
  bronce.

#### Dónde el número engaña, dicho antes de que alguien lo use mal

**Entre dos colores oscuros, la ΔE00 la domina la luminosidad y no el tono.** Por eso el
violeta de MARVOK mide 15,8 contra un azul marino y el ciruela de RUNTAK mide 20,5 contra el
mismo azul, y sin embargo nadie confunde un violeta con un azul marino ni un ciruela con un
azul marino: los tres son oscuros, y eso es casi todo lo que el número está diciendo.

Lo mismo con los dos verdes de la serie. El aguamarina de NOCTEV mide 11,4 contra el verde de
Aston Martin y el verde manzana de PENTAV mide 14,5 contra el mismo, **y el criterio de
`TASKS.md` está escrito con nombres y no con hexadecimales**: lo que deja afuera es *"el verde
oscuro"*, y ni un cian-verde brillante ni un verde manzana son un verde oscuro. Contra la
referencia de verde oscuro que se usó para medir, PENTAV mide 16,2 — y **medía 7,1 con el
verde hoja anterior, que es exactamente por qué se regeneró**.

**Para qué sirve entonces el instrumento, dicho con precisión:** sirve para atrapar dos autos
que salieron del mismo color, que es la falla que hunde la demo y la que efectivamente
atrapó. No sirve para certificar que una librea no se parece a la de un equipo real: eso lo
decide el ojo humano clip por clip, que es lo que el R2 manda y lo que esta medición no
reemplaza.

**Lo que queda en la lista de mirar, y son dos cosas:** el par MARVOK / RUNTAK, que es el más
cercano de los seis, y los dos verdes de la serie contra el verde de Aston Martin. Las dos van
a la T-02 y a la revisión de la etapa 3 como cosas a mirar, no como cosas resueltas.

### La parrilla real cubre casi toda la rueda, y eso no se resuelve eligiendo mejor

Exigiendo a la vez ΔE00 ≥ 25 contra los cinco prohibidos, ΔE00 ≥ 20 contra los quince colores
de la parrilla viva de 2026, y máxima separación mutua, **el mejor sexteto posible baja la
separación mutua a 22,6** y mete adentro un azul a 6,9 de Williams. Se buscó por fuerza bruta
sobre un muestreo sistemático del espacio de color; la restricción es real.

Así que se eligió qué ceder: **la separación mutua se protege, porque es de lo que depende que
la demo funcione** —cuatro cajas en pantalla a la vez, y el color es lo único que dice cuál es
cuál—, y la distancia a la parrilla entera queda como dato y no como umbral. Lo que sí se
respeta entero es la lista de los cinco de `TASKS.md`, que es el contrato.

Dos aclaraciones sobre los acentos, para que sus números no se lean como un problema: el
blanco queda a 1,7 del blanco de Racing Bulls y el grafito a 6,4 del negro de Haas, **y eso
está bien**. Un acento es una franja, no una identidad; blanco y negro los usa todo el mundo,
y lo que identifica al auto es el color de la carrocería.

### Cómo suena cada nombre, que es el tercer criterio y el que más veces se saltea

El caso que obliga a hacerlo está escrito en `demo/hydration-break/audio/README.md`: al
sintetizador hay que mandarle **"Norvick"** aunque el equipo se llame **Norvik**, porque
con la `v` sola esta voz lo convierte en *Norwich*, que es un club inglés de verdad — justo
lo que un nombre inventado existe para evitar.

**El instrumento.** Cada candidato se sintetiza una vez con `gemini-2.5-flash-tts`, `en-GB`,
voz **Charon** —la del relato, la misma que va a decir los nombres en la T-04— dentro de la
frase portadora *"And there goes NOMBRE, NOMBRE holding the line into turn four."*, y se
transcribe con `gemini-2.5-flash` pidiéndole cuatro líneas: la transcripción textual, cómo
se oye el nombre, su IPA, y si lo que oyó coincide con una palabra, un lugar, una marca o
una persona que existan.

**El control.** Dos nombres plantados. **"Mercedes"** tiene que volver marcado como palabra
real, y volvió: `REAL-WORD: Mercedes`. Con eso el instrumento demostró que tiene una forma
de dar rojo. Verbatim en
[`salidas/control-como-suena-cada-nombre.txt`](salidas/control-como-suena-cada-nombre.txt).

**Los seis, y cómo suenan:**

| nombre | cómo lo transcribe la voz | IPA | palabra real |
| --- | --- | --- | --- |
| **CALDRIX** | *Caldrix* | /kældrɪks/ | `NONE` |
| **MARVOK** | *Marvok* | /mɑːvɒk/ | `NONE` |
| **NOCTEV** | *Noktev* | /nɒktɛv/ | `NONE` |
| **RUNTAK** | *Runtack* | /ˈrʌntæk/ | `NONE` |
| **PENTAV** | *Pentav* | /pɛnˈtæv/ | `NONE` |
| **QUENTRA** | *Quentra* | /kwɛntrə/ | `NONE` |

**Los seis se escriben igual para el selector y para el sintetizador**, o sea que esta demo
**no necesita ninguna sustitución de diccionario** como la de Norvik. Es un resultado y no
una omisión: se buscó la sustitución y no hizo falta.

**Y seis se eligieron entre veintidós porque nueve fallaron acá**, que es lo que esta
prueba existe para atrapar:

| candidato | qué volvió | por qué queda afuera |
| --- | --- | --- |
| MIRRAN | *Mirren* | **Helen Mirren**: una persona real |
| HELVAR | *Helva* | la `r` final desaparece en una voz no rótica, y *Helva* es una empresa real |
| ZANTHE | *Xanther* | se dice distinto de como se escribe, y encima inestable |
| MIRVEK | *Mervek* | la `i` se vuelve `e`: la ortografía y el sonido se despegan |
| KORVEX, ALTIVA, SELVAK, TORVIN, PELTRA | se oyen bien | vuelven marcados como palabra o marca existente, y había seis mejores |

También se contrastaron los seis contra la parrilla viva de 2026 —once equipos (McLaren,
Ferrari, Red Bull, Mercedes, Aston Martin, Williams, Alpine, Racing Bulls, Audi, Haas,
Cadillac) y sus veintidós pilotos— y no contra la memoria. Ninguno evoca a ninguno. El
único parecido que vale nombrar es que **CALDRIX y Cadillac arrancan con la misma /k/**, y
ahí se corta: */ˈkældrɪks/* contra */ˈkædɪlæk/* no se confunden ni dichos ni escritos.

**Y los seis se distinguen entre sí al oído**, que importa porque un relator los va a decir
seguidos: los seis arrancan con consonante distinta —K, M, N, R, P, KW— y ninguno termina
en la misma sílaba que otro.

---

## 3. El prompt de los seis autos

Las fichas de [`fichas/`](fichas/) se generaron con `agy` y su herramienta `generate_image`,
que va contra la suscripción de Antigravity y no contra la tarjeta: **las seis cuestan
US$0**. Van al repositorio porque son livianas, igual que `kalto-shoe` y las otras dos.

El prompt de cada una es **el párrafo de restricción + el cuerpo de ese auto**, concatenados
en ese orden, proporción `16:9`.

### El párrafo de restricción, idéntico en las seis

> Do NOT imitate the trade dress of any real racing team. No prancing horse, no charging
> bull, no three-pointed star, no four rings, no winged badge, no papaya orange, no
> Italian red, no British racing green, no silver arrows. Invent an original livery. If
> you find yourself reaching for something that looks like a team you know, change it.

### El cuerpo, idéntico salvo las dos palabras de color

> A single contemporary open-cockpit single-seater racing car with exposed wheels,
> three-quarter front view from slightly above, standing still on dry mid-grey asphalt
> under a high even overcast: soft flat light, no sun, no hard shadows, no lens flare. The
> whole car is one flat **‹DOMINANTE›** — nose, sidepods, engine cover and rear wing all
> the same colour — with a single continuous **‹ACENTO›** stripe of even width running
> from the tip of the nose, over the top of the car, to the trailing edge of the rear
> wing. The wheels are matt black with plain dark grey rims. The driver's helmet is the
> same **‹DOMINANTE›** as the car with the same **‹ACENTO›** stripe over the crown. There
> is no number, no lettering, no logo and no sponsor marking anywhere on the car, on the
> wheels, on the helmet or on the ground. Behind the car the background is the same empty
> grey asphalt continuing out of focus to all edges of the frame, with nothing on it.
> Photographic, sharp, motorsport press photography.

| auto | ‹DOMINANTE› | ‹ACENTO› | archivo |
| --- | --- | --- | --- |
| CALDRIX | `BRIGHT LEMON YELLOW` | `GRAPHITE BLACK` | `fichas/1-caldrix.jpg` |
| MARVOK | `BRIGHT ELECTRIC PURPLE` | `PURE WHITE` | `fichas/2-marvok.jpg` |
| NOCTEV | `BRIGHT AQUAMARINE` | `GRAPHITE BLACK` | `fichas/3-noctev.jpg` |
| RUNTAK | `DEEP PLUM MAGENTA` | `PURE WHITE` | `fichas/4-runtak.jpg` |
| PENTAV | `BRIGHT APPLE GREEN` | `PURE WHITE` | `fichas/5-pentav.jpg` |
| QUENTRA | `DARK BRONZE GOLD` | `PURE WHITE` | `fichas/6-quentra.jpg` |

**Ojo con esta tabla: las palabras son las de VEO, y tres de las seis fichas ya no se
generaron con ellas.** Desde que la ficha pasó a ser el retrato, a Imagen se le pide lo que
haga falta para que la imagen mida el color que Veo dibuja, y eso resultó ser una versión
más clara —a NOCTEV se le pidió `LIGHT BRIGHT SKY CYAN` y a QUENTRA `LIGHT SANDY TAN`—,
porque el generador de imágenes dibuja la carrocería sombreada y la mediana vuelve de 13 a
20 puntos de L* más oscura que lo pedido. Las palabras de arriba siguen siendo las que
viajan a los prompts de video, que es lo que esta tabla existe para fijar. El detalle está
en [`../T-03-el-programa/salidas/regenerar-fichas.sh`](../T-03-el-programa/salidas/regenerar-fichas.sh).

**Estas son las palabras que van a los 62 prompts de Veo**, y dos de ellas no son las que se
escribieron primero: **`BRIGHT ELECTRIC PURPLE`** reemplaza a `LIGHT VIOLET PURPLE`, que
volvía apagado, y **`BRIGHT APPLE GREEN`** reemplaza a `VIVID YELLOW-GREEN`, que volvía
amarillo, y a `BRIGHT LEAF GREEN`, que volvía demasiado oscuro. Los tres intentos del verde
están medidos arriba: 64°, 137° y 113° de tono.

**Al generador se le dan palabras y no códigos, y el hexadecimal se lee después.** A un modelo
generativo un `#F2DC12` no le dice nada; lo que obedece es *"bright lemon yellow"*. El
hexadecimal no es lo que se pide sino **lo que se mide sobre lo que volvió**.

**Y el que queda escrito en `race.json` es el que se mide sobre los clips, no sobre la
ficha.** Lo dice entero la §2: la ficha es el retrato y el clip es el contrato. Las palabras
de esta tabla son las que viajan a los 62 prompts de Veo; el hexadecimal que produce cada
una se mide del lado de Veo.

**Cuánto costaron: US$0.** Quince generaciones de imagen en total —seis de la primera vuelta,
tres de corrección y seis del retrato contra el color medido sobre los clips—, todas con
`generate_image` contra la suscripción de Antigravity. Ni una llamada a Veo en toda la task.

**El fondo se describe en lugar de prohibirse.** El prompt no dice *"sin piso, sin set"* —
que es exactamente la prohibición que en la fase 08 devolvió un piso de estudio con sombra
proyectada— sino que el fondo es el mismo asfalto gris fuera de foco hasta los cuatro
bordes. Y el asfalto gris bajo el mismo cielo cubierto es, además, lo que hace que las seis
fichas se lean como seis autos de la misma serie y no como seis fotos de catálogo.

### Qué se vio en las seis fichas, mirándolas

Lo que la ficha existe para descartar salió bien, y lo que el prompt pide y no consigue
también está medido, porque **el mismo cuerpo de prompt va a viajar a los 62 clips de Veo** y
lo que no obedece acá probablemente tampoco obedezca allá.

**Lo que salió bien, que es lo que importa:**

- **Tipografía: cero, en las seis.** Ni un número, ni una letra, ni un logo, en el auto, las
  ruedas, el casco o el piso, revisado con recortes ampliados del morro, la tapa de motor, el
  alerón y las llantas. Es la falla que el ADR 0045 y el 0062 documentaron, y la prohibición
  con alternativa la evitó.
- **La franja del acento está en las seis**, y corre del morro a la cola.
- **Ninguna se parece a un equipo real.** Ninguna trajo un escudo, un patrocinador ni un
  vestido comercial reconocible.

**Lo que el prompt pide y el modelo no da, en las seis por igual:**

- **La franja no es continua por arriba de la tapa de motor.** Todas la ponen en el morro y en
  el chasis, y casi todas agregan una banda en el alerón trasero, pero ninguna la lleva sin
  cortar de punta a punta. Es un patrón de las seis, no una falla suelta.
- **El fondo no es el asfalto vacío que se pide.** Varias traen muro de boxes, barreras o una
  línea de pista desenfocados. Para una ficha da igual; **en un clip de Veo no**, porque ahí
  el fondo es parte de lo que hace que las siete piezas se lean como la misma carrera, y de
  eso se ocupa el párrafo del mundo y no este cuerpo.
- En `4-runtak` la franja del alerón trasero salió **deformada, con forma de gancho**. No es
  una letra; es la franja mal resuelta.

Ninguna de las tres justifica gastar otra generación en una ficha: la ficha es la
especificación visual del auto, no una pieza que vaya a pantalla.
