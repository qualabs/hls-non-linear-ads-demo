# T-06 — La página: las secciones, la estética y las marcas

Cuatro secciones contando el player, que es el tope, y **tres de ellas están abajo del
pliegue a propósito**: nada de lo que hay ahí explica el caso de negocio. Eso ya pasó, en
la imagen, en treinta segundos. El scroll es para el ingeniero de la sala que ahora
pregunta qué fue lo que vio.

| sección | qué es | alto medido |
| --- | --- | --- |
| 1 | el player, a altura completa, con la demo guiada | 100 vh |
| 2 | qué hizo el player: una playlist, un tag, cuatro avisos, y el partido nunca se detuvo | 887 px sobre 887 de viewport |
| 3 | la señalización, **leída de la playlist que este player está tocando** | 887 px sobre 887 |
| 4 | los créditos | 639 px |

## La sección que vale para esta sala: la señalización mostrada como lo que es

No es una ilustración. La página **fetchea la propia playlist**, saca la línea del
`EXT-X-DATERANGE` y la parte por las comas para que se lea en cuatro renglones en lugar de
uno largo; después sigue el `X-ASSET-LIST` de ese tag y muestra la forma de cada asset. En
la captura se lee el tag real, con su `START-DATE` de hoy y su `PLANNED-DURATION=58`, y el
asset list con los cuatro avisos —incluido el tercero, que aparece como
`"(no layout block: a linear ad, played full frame)"`—.

**Es la misma regla que obedece la línea de estado, aplicada al scroll: esta página no
afirma nada que no haya leído.** Un tag pegado en el HTML sería una ilustración, y una
ilustración de una playlist no vale nada para un público que lee playlists para vivir;
además el `START-DATE` se mueve cada vez que se empaqueta el contenido, así que uno pegado
a mano estaría mal mañana.

## Las seis propiedades de la estética, y qué descartó cada una

- **Una idea por pantalla**, y quedó medido: las dos secciones de contenido miden 887 px
  sobre un viewport de 887. Lo que costó fue el bloque del asset list, que son cien líneas:
  scrollea adentro de sí mismo en lugar de empujar su sección abajo del pliegue.
- **Mucho aire**: el ancho de lectura está topeado en 880 px y en 62 caracteres para el
  cuerpo.
- **Dos o tres tamaños tipográficos y nada más**: el kicker, el título y el cuerpo. Los
  tres números de la sección 2 usan el tamaño del título, no un cuarto.
- **Paleta corta y neutra, con el color traído por el video**: no hay un solo acento de
  color en las tres secciones de abajo. Es la propiedad de la que cuelga el diseño entero
  — una página que trae su propio color compite con la imagen que existe para mostrar.
- **Cero decoración**: sin tarjetas, sin bordes, sin gradientes de adorno, sin sombras. Lo
  que separa una sección de la siguiente es el aire.
- **El video es el producto**: va primero, grande y **sin marco** —sin borde, sin esquinas
  redondeadas, sin sombra—, y su ancho está topeado por el alto disponible para que la
  imagen entre entera en una pantalla.

**La marca de Qualabs va junto a la de SVTA y afuera del cuadro**, que es lo que la fase 04
dejó cerrado. Y sigue en pie lo que la T-02 dejó dicho: **no hay asset de la marca de SVTA
en el repositorio**, así que la página la nombra como texto. No se fabrica el logo de un
tercero.

## Un defecto encontrado en el celular, y no se veía en el escritorio

**La página desbordaba horizontalmente en pantalla angosta**: medido a 500 px de ancho, el
documento scrolleaba hasta 539. La causa no es el bloque de código sino su padre: **un ítem
de grid se niega a encogerse por debajo del tamaño de su contenido**, así que el
`white-space: pre` del `<pre>` ensanchaba la sección entera, y el `overflow-x: auto` del
bloque no hacía nada mientras su contenedor crecía feliz. Una línea, `min-width: 0`, con la
medición escrita al lado. Después: 485 sobre 500, sin desborde, y los dos bloques de código
scrolleando adentro de sí mismos.

Es el tipo de defecto que la vara del celular existe para agarrar: el celular tiene que ser
**usable** y no tener una versión propia, y esto no era una cuestión de gusto sino la única
cosa que la página no puede hacer nunca, que es scrollear de costado.

`t06-celular.png` es la captura a 500 px: la imagen entra entera, el banner de MERIDIA se
lee, la línea de estado envuelve, y no hay barra horizontal.
