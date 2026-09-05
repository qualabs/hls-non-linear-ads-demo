# El skin y la marca: las decisiones y lo que se midió

2026-09-05. La task es alcance propio —lo más cercano que dijo David es *"make
it look a little more Pro"*, y lo dijo sobre el marcador de los breaks—, así que
lo que importa acá es qué se decidió, contra qué se decidió, y qué se midió para
no romper nada de lo que ya estaba probado.

## 1. Dónde va el logo, y por qué no va en una esquina

El logo va en **dos lugares y son el mismo archivo**: una placa sobre el titular
de la página, y una placa que la librería dibuja **adentro del contenedor**, en
la barra de controles. La segunda existe porque es la única que sigue en el
cuadro en fullscreen: todo lo que está afuera del contenedor desaparece cuando
alguien aprieta el botón (ADR 0015), y una grabación en fullscreen no tiene otro
marco.

**Adentro de la imagen no hay una esquina libre, y eso está medido y no
supuesto.** Un bug de canal va en una esquina; en este player la imagen es del
layout:

| layout | qué ocupa las esquinas |
| --- | --- |
| `cornerOverlay` | el aviso **es** la esquina superior izquierda (`0 75 75 0`) |
| `multiView` | las cuatro: primario arriba-izquierda, y un aviso en cada una de las otras tres |
| `squeezebackLShape` | la columna derecha y la franja de abajo son avisos |
| `squeezebackDoubleBox` | media pantalla es aviso; arriba y abajo quedan 25 % de negro |

Una marca en cualquier esquina se le sienta encima al creativo del anunciante en
dos o tres de los cinco breaks del recorrido, y en el primero —el que la captura
con aviso muestra— se le sienta encima al aviso que la demo existe para mostrar.
Se probó, y la captura de esa primera corrida quedó como evidencia de la opción
descartada: la placa arriba a la izquierda le tapaba la mitad al `cornerOverlay`
(`t07-14-la-esquina-descartada.png`).

Entonces la marca va **en la barra**, que es la franja que la composición ya le
cedió al mobiliario, y en **una fila propia arriba del reloj y del riel**, para
que tampoco le saque ancho a la barra de progreso, que es contra lo que se mide
un break. Costo real: cero sobre la imagen que el layout usa, cero sobre el
largo del riel.

## 2. La placa clara, que es una regla del kit y no una preferencia

`brand/README.md` lo deja escrito: el wordmark es tinta `#383838` y la marca
lleva formas `#dbdfe2` y `#fff`, así que sobre el fondo oscuro del player se
pierde la mitad. Se verificó mirándolo antes de decidir: sobre el `#232a3d` de
la página, el "qua" desaparece y sobrevive el "labs" en teal. Eso no es una
versión oscura del logo, es un logo roto. Va sobre una placa de papel
`#f8f9fa`, que es lo que hacen los documentos de la propia marca, y **no se
recolorea**: recolorearlo es la otra forma de romperlo.

La placa es del tamaño del logo y no más. Una banda clara de ancho completo
sería una superficie, y en una página cuyo sujeto son dos imágenes la marca es
un acento.

## 3. Qué es acento y qué quedó neutro

La segunda regla del kit: la paleta se usa como acento y no como superficie.
Repartido:

| | qué |
| --- | --- |
| **acento** (teal `#37b4a7`) | la perilla de la barra y el anillo de foco de los botones. Nada más. |
| **neutro** | el relleno del progreso (blanco), el riel (blanco al 30 %), los scrims (negro), los iconos (blancos), la placa (papel) |
| **funcional, con dueño** | el violeta del rango concurrente y el amarillo del interstitial, que fijó la T-04 y que esta task no toca |

**El relleno del progreso se dejó blanco a propósito**, aunque pintarlo de teal
hubiera sido el gesto de marca más visible. Es el sustrato sobre el que la T-04
midió que las marcas violetas se leen a un cuarto de escala; cambiarlo es
cambiar esa medición sin rehacerla. La perilla es un punto, nunca cae encima de
una marca, y a un cuarto sigue leyéndose teal (§6).

## 4. La librería no lleva marca, y por eso la marca es del que la integra

El logo y el color entran por afuera:

- `attach(hls, { ..., logo: { src, alt } })` — un archivo del integrador. La
  librería no trae ninguno.
- `--qa-accent` y `--qa-plate`, propiedades CSS que el integrador pone sobre su
  contenedor. Sin ellas, la perilla es blanca y la placa es papel: un player sin
  marca.
- La tipografía es `inherit`. El chrome sale en la tipografía de la página que
  lo embebe —medido: los tiempos salen en Poppins sin que la librería nombre una
  fuente ni la distribuya—, así que un player embebido se parece al producto de
  quien lo embebe y no a un widget de un tercero.

Un color y una placa son valores, y por eso van por CSS; un logo es un archivo
con un texto alternativo, y por eso va por `attach`. Son dos mecanismos porque
son dos clases de cosa.

**Costo en la superficie pública, dicho de frente:** la valla de `js/app.js`
pasa de ocho líneas de JavaScript a nueve. La novena es el `logo` y es
opcional: el mínimo que la T-01 midió no se movió.

> **Nota del 2026-09-05 (T-08).** Los dos números están corridos en uno: la
> valla pasó de **siete a ocho**. Las ocho de la T-01 incluían `audioControl`,
> que la T-03 borró al llevarse los controles a la librería —`git show
> 2bcb136:js/app.js` da siete—, y esta task comparó contra la medida vieja sin
> restarle eso. Lo que la línea afirma sigue siendo cierto: la marca costó una
> línea, es opcional, y el mínimo de diez de la T-01 no se movió.

## 5. El resto del skin

Los tamaños del chrome son **tokens**, y hay un juego por tamaño de pantalla: en
fullscreen la clase `qa-controls--full` los cambia todos, y la pone la misma
función que pinta el icono de fullscreen. El chrome de un player se lee desde
tan lejos como grande es la imagen, así que una barra que está bien en una caja
de 715 px es un hilo en una de 1920.

| | en ventana | en fullscreen |
| --- | --- | --- |
| botones chicos | 34 px | 46 px |
| pausa central | 74 px | 104 px |
| tiempos | 13 px | 18 px |
| riel y carril | 8 px | 10 px |
| logo | 22 px | 40 px |

Lo demás: dos scrims en vez de uno —el de abajo con cuatro paradas en vez de dos
para que no haya banda, y uno arriba que es lo que permite que el control de
audio sea un icono y no un disco—, botones sin disco con sombra en el icono y
fondo sólo al hover, y los tiempos con `min-width: 4ch` para que la barra no se
corra un dígito cuando el programa pasa de 9:59 a 10:00.

**El riel pasó de 559,31 px a 541,56 px** en ventana (−3,2 %). Son los `4ch` de
los dos relojes y el gap un poco más grande. Es el único número de la T-04 que
esta task movió y se dice acá: el alto del riel y el del carril, que es lo que
aquella medición fijó, no se tocaron.

## 6. La prueba del cuarto, y el defecto que encontró

La misma prueba barata de la T-04: la captura a tamaño real reducida al 25 % de
su lado, leída en sus píxeles y **mirada**.

| | en ventana | con aviso | en fullscreen |
| --- | --- | --- | --- |
| marca violeta vs cue amarillo (distancia RGB) | 283,2–283,9 | 276,8–282,3 | 278,1–282,6 |
| alto de cada carril | 2 px | 2 px | 2,5 px |
| perilla, leída | `37, 171, 158` | `40, 174, 160` | `58, 179, 166` |
| logo del encabezado, alto | 11 px | 11 px | no está en el cuadro |
| logo de los controles, alto | 5,5 px | 5,5 px | 10 px |

Lo que la prueba dice, en orden:

**La T-04 sigue en pie.** Los dos colores se distinguen igual que antes —283
contra los 282–292 que midió aquella task— y el riel fuera de un break lee
`127, 127, 125`, o sea que el contraste es contra algo.

**La perilla sobrevive.** Mide 3,5 px de lado en la reducida y lee teal, a 253
de distancia del relleno blanco. El acento se ve a distancia.

**El logo de los controles NO se lee a un cuarto en la página de dos panes, y
no se agranda.** A 22 px de alto queda en 5,5 px reducido y el wordmark se
disuelve: la tinta más oscura sube a 161,8 sobre un papel de 254. Se ve en
`t07-8-el-logo-de-los-controles-un-cuarto.png`. No es un defecto que se arregle
subiéndole el tamaño, y la aritmética dice por qué: a un cuarto la imagen de ese
pane mide 179 px de ancho, y un "qualabs" legible necesita 48 de esos 179, o sea
el 27 % del ancho de la imagen. Eso ya no es una marca de player, es un cartel.
**En la página de dos panes la marca que se lee de lejos es la del encabezado**,
que a un cuarto queda en 11 px de alto y se lee entera
(`t07-10-el-logo-del-encabezado-un-cuarto.png`).

**En fullscreen el encabezado no está, así que ahí la marca del player sí tiene
que leerse — y por eso se subió a 40 px.** Con los 32 px iniciales quedaba en
8 px reducido y el wordmark seguía siendo una mancha; a 40 px queda en 10 px, que
es el mismo tamaño con el que se lee el del encabezado, y la placa ocupa el 11 %
del ancho de 1920, que es tamaño de bug de canal. Está en
`t07-9-el-logo-en-fullscreen-un-cuarto.png`.

## 7. El pane sin modificar quedó igual, y no se afirma: son cero píxeles

`t07diff.py` compara la captura del elemento `#pane-stock` de las dos corridas,
entera: **0 píxeles distintos de 429.177**, caja de la diferencia `None`. Y la
caja medida en el DOM es la misma en las dos: 749 × 572,125 el pane, 715 ×
402,1875 el player en el mismo lugar adentro, `controls` ausente, el mismo texto
de estado.

Dos cosas hicieron falta para que ese número signifique algo, y las dos están en
`t07run.py`. El video del pane se para en el mismo segundo en las dos corridas,
porque si no se comparan dos cuadros distintos de la película. Y el pane se
empuja a una fila entera de píxeles: el encabezado nuevo lo baja 13,x px, la
rasterización de un texto depende de la fracción de píxel en la que cae, y sin
esa alineación el diff daba 2,7 % de píxeles distintos que eran antialiasing y
no skin. Medir el corrimiento y llamarlo cambio de estilo era el falso positivo
disponible.

**En la captura de fullscreen el pane sin modificar no está**, y no puede estar:
en fullscreen la composición ocupa el viewport entero. Lo que prueba que quedó
igual son las dos capturas en ventana y el diff de arriba.

## 8. Las capturas

| archivo | qué prueba |
| --- | --- |
| `t07-1-sin-aviso.png` | la composición con el skin y la marca, 1920 × 1080, programa en 1:00 de 3:00 |
| `t07-2-con-aviso.png` | lo mismo con `cornerOverlay` en pantalla: **el aviso entero, sin nada encima** |
| `t07-3-fullscreen.png` | fullscreen de verdad, con el chrome en su juego de tamaños grande |
| `t07-4-la-composicion-de-cerca.png` | el recorte del contenedor del mismo cuadro |
| `t07-5/6/7-*-un-cuarto.png` | las tres reducidas al 25 % |
| `t07-8/9/10/11-*.png` | los recortes de la reducida, agrandados con vecino más cercano para poder mirarlos |
| `t07-12/13-el-pane-sin-modificar-*.png` | el pane de fábrica antes y después |
| `t07-14-la-esquina-descartada.png` | la opción que se probó y se descartó: la marca en la esquina, encima del aviso |

Se pausa a propósito, como en la T-04: los controles se esconden solos a los
2,6 s mientras corre y en pausa se quedan, así que la captura es reproducible.

## 9. Lo que esta task encontró y no arregló

**1. La dirección del skin no está escrita en ningún lado.** El bloque dice "el
skin de los controles de la T-03, en la dirección que eligió Nicolás", y en la
fase no hay registro de esa dirección: lo que hay son las dos imágenes de
referencia que la T-03 usó —que fijaron **dónde** va cada control, no cómo se ve—
y el "make it look a little more Pro" de David. El skin de esta task se decidió
con eso y con las dos reglas del kit. Si había una dirección elegida que no llegó
al repositorio, esto se mira y se corrige.

**2. Un `networkError aborted` no fatal aparece a veces en la consola de la
sonda, y no es de esta task.** Aparece en tres de seis corridas, y también en el
árbol sin los cambios cuando se corre la misma secuencia (`control2` de dos
corridas de control). Es un fragmento que hls.js cancela cuando la sonda hace
seek, y no tiene efecto en la imagen. Está anotado por si aparece en una
grabación.

**3. Un comentario de `index.html` afirmaba lo que la nota fechada del ADR 0015
ya había corregido**, que el pane de fábrica conserva sus controles nativos. No
los tuvo nunca y Nicolás decidió que no los va a tener. Se corrigió el
comentario, que era falso en un archivo que esta task ya estaba tocando; la nota
del ADR queda donde está, porque ahí el registro histórico es el valor.

**4. El bloque pide que en las tres capturas se vea el pane sin modificar.** En
la de fullscreen es imposible por construcción (§7).
