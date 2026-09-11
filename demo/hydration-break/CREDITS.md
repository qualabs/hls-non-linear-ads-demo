# Créditos y procedencia del material

Dos grupos, y el segundo todavía es provisorio.

## El plate del partido

Cuatro clips de **Pexels**, bajo la [Pexels License](https://www.pexels.com/license/),
que no exige atribución. Se acreditan igual, porque la procedencia es lo que hace
auditable el chequeo de derechos.

| clip | qué aporta | tratamiento |
| --- | --- | --- |
| [31370180](https://www.pexels.com/video/31370180/) | los dos actos de juego | **recortado**: el tercio izquierdo del cuadro original queda afuera (ver abajo) |
| [9502518](https://www.pexels.com/video/9502518/) | la parada, jugadoras en el banco | recorte central a 16:9, estirado 1,32× |
| [9517718](https://www.pexels.com/video/9517718/) | la parada, tomando agua | igual |
| [9441632](https://www.pexels.com/video/9441632/) | la parada, charla de equipo | igual |

**El recorte de 31370180 no es encuadre: es el chequeo de cuadro.** En el tercio
izquierdo del cuadro original hay un jugador con una camiseta réplica de selección, con
escudo de federación visible y las tres tiras de una marca real en la manga. El recorte
lo saca, verificado en cuatro momentos del clip. Los números están en
`scripts/armar-plate.sh` y cambiarlos sin volver a mirar los cuadros vuelve a meter la
marca.

**Lo que queda anotado y no descalifica**, siguiendo el criterio de la investigación de
contenido: en los clips de la parada hay ropa deportiva con marca comercial legible en un
par de cuadros. Es aparición incidental de producto sobre un equipo amateur, que es el
caso débil; lo que descalifica un clip es un escudo de club profesional, una marca de
liga o una valla publicitaria, y ninguno de estos cuatro los tiene. **Va al chequeo final
de cuadro antes de grabar.**

## El paquete de canal

**Inventado y nuestro.** El canal, los dos clubes, el marcador y el reloj. Está escrito
como SVG en `graphics/` y quemado sobre el plate por `scripts/paquete-de-canal.sh`. No
imita el vestido de ningún broadcaster real.

## Los creativos del minuto

**Nuestros, y de tres marcas de fantasía: NEONECTAR** (una gaseosa botánica), **KALTO**
(zapatillas) y **MERIDIA** (viajes). Ninguna imita el vestido comercial de una marca real.

Cada creativo tiene dos mitades, y el corte es el del ADR 0045: **lo pictórico se genera y
la tipografía se escribe a mano como SVG.**

| aviso | marca | pictórico | tipografía |
| --- | --- | --- | --- |
| banner inferior, imagen fija | MERIDIA | costa generada con `agy generate_image`, 16:9 | `graphics/creativos/banner.svg`, 1280×216 |
| la L, video | KALTO | zapatilla generada con `agy generate_image`, 3:2 | `l-vertical.svg` 512×720 y `l-horizontal.svg` 1280×288 |
| lineal de 10 s, cuadro entero | NEONECTAR | 8 s generados con Veo `veo-3.1-fast-generate-001` desde una imagen fija | `linear-endcard.svg`, 1920×1080, los 2 s de cierre |
| overlay de esquina, video | MERIDIA | la misma costa generada | `overlay.svg`, 320×180 |

**Las imágenes generadas están versionadas** en `graphics/creativos/fuentes/`, y **el
video no**: el repositorio no carga video, y lo que carga en su lugar es la receta —los
prompts, el modelo, la región y el método— que `scripts/setup-content.sh` ejecuta. Las
razones de cada línea de esos prompts están en el README de esa carpeta.

**El chequeo de vestido comercial se hizo pieza por pieza y está en la evidencia de la
T-05**, porque está medido que el generador deriva hacia marcas reales aunque se le
prohíba. No es una formalidad ni una nota: es un paso.

## El audio

**Nada del material traía audio**: los cuatro clips del partido son mudos y el spot
generado también salió mudo. Todo lo que suena se produjo acá, y la receta completa está
en `audio/README.md`.

| pieza | de dónde sale |
| --- | --- |
| los dos relatores | sintetizados con `gemini-2.5-flash-tts`, voces Charon y Kore, en `en-GB`. El texto es nuestro |
| la cama de cancha | **grabada por Nicolás**, recortada al tramo estable y loopeada |
| las tres camas musicales | generadas con `lyria-002`, una por marca |

**Los equipos y el relato son inventados.** Norvik y Haverstone no son clubes reales, no
se nombra a ningún jugador, y el marcador y el reloj que se cantan son los del paquete de
canal ficticio.

**La cama de cancha la grabó Nicolás**, así que no hay licencia de terceros que respetar
ni atribución que poner. Se dice acá y no en una nota al pie porque una grabación sin
procedencia escrita se termina sacando por las dudas.

## La marca de Qualabs

Copias del kit de marca, con su procedencia en `brand/README.md`. **No hay asset de la
marca de SVTA en este repositorio**, así que la página la nombra como texto: no se
fabrica el logo de un tercero.
