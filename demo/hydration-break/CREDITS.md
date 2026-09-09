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

## Los creativos del minuto — PROVISORIOS

Hasta que la T-05 produzca los de las tres marcas de fantasía, los cuatro avisos son
películas abiertas de la Blender Foundation:

- *Sintel* (CC BY 3.0)
- *Caminandes: Gran Dillama* (CC BY 3.0)
- *Elephants Dream* (CC BY 2.5)

© Blender Foundation, [blender.org](https://www.blender.org). Recodificados y recortados
para esta demo.

## La marca de Qualabs

Copias del kit de marca, con su procedencia en `brand/README.md`. **No hay asset de la
marca de SVTA en este repositorio**, así que la página la nombra como texto: no se
fabrica el logo de un tercero.
