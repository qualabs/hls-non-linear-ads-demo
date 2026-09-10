# fuentes/ — lo pictórico generado, y los prompts con los que se genera

Tres imágenes, y son la mitad de cada creativo que el ADR 0045 manda generar: el fondo
pictórico. La otra mitad —la geometría y toda la tipografía— son los SVG de la carpeta de
arriba.

| archivo | qué es | proporción pedida | qué salió |
| --- | --- | --- | --- |
| `kalto-shoe.jpg` | la zapatilla de KALTO | `3:2` | 1264×848 |
| `meridia-coast.jpg` | la costa de MERIDIA | `16:9` | 1376×768 |
| `neonectar-panel.jpg` | el panel de NEONECTAR, que es la **entrada** del spot de video | `16:9` | 1376×768 |

**Las imágenes están en el repositorio y el video no.** Es una decisión de Nicolás y la
razón es del repositorio y no de los archivos: subir video es pesado y no aporta. Lo que
el repositorio carga es la receta, que es este archivo, y la ejecuta
`scripts/setup-content.sh`.

**Y el resultado no tiene que ser idéntico al que se grabó acá.** Con un modelo generativo
no existe eso. El criterio es que el prompt sea el correcto y que quien lo corra entienda
por qué dice lo que dice, que es de lo que trata el resto de este archivo.

## Los prompts de las imágenes

Se generaron con `agy` y su herramienta `generate_image`, que va contra la suscripción de
Antigravity y no contra una tarjeta. Elegís una proporción, nunca un tamaño exacto.

**La restricción que abre los dos prompts, y no es decorativa:**

> *Do NOT imitate the trade dress of any real brand. No swoosh, no three stripes, no
> leaping cat, no jumping figure, no cursive white script on red, no interlocking letters
> of any real company. Invent an original visual identity. If you find yourself reaching
> for something that looks like a brand you know, change it.*

**`kalto-shoe`**, proporción `3:2`:

> *A single running shoe, three-quarter view, floating slightly above a seamless studio
> surface, dramatic single-source lighting from the upper left, deep shadow. The shoe is
> charcoal grey with a single continuous accent in warm amber running along the midsole.
> NO logo, NO side marking of any kind, NO text anywhere on the shoe or in the image.
> Clean, cool background, plenty of empty space to the right of the shoe. Photographic,
> sharp, commercial product photography.*

**`meridia-coast`**, proporción `16:9`:

> *A wide travel photograph of an anonymous Mediterranean-style coastline at golden hour:
> pale cliffs, turquoise water, a small empty sand cove, no buildings, no people, no
> boats, no signage, no text anywhere. Warm late light, slight haze on the horizon.
> Nothing in the frame identifies a real place or a real company.*

## El prompt del video, y sus tres razones

Lo ejecuta `scripts/setup-content.sh` con `veo-3.1-fast-generate-001` en `us-central1`,
por `:predictLongRunning` más el polling de `:fetchPredictOperation`, tomando
`neonectar-panel.jpg` como primer cuadro. El prompt textual está en ese script y no
duplicado acá, para que no se despeguen; lo que va acá es **por qué dice lo que dice**,
que es lo que ninguna documentación de Google trae.

**1. Describe el movimiento de cámara y nada más, porque Veo honra el primer cuadro.**
Medido: el frame 0 del clip generado es la imagen de entrada, con su titular y su tagline
intactos y legibles. Lo único que hay que pedirle es qué hace después.

**2. No pide tipografía, y ésa es la razón por la que el spot tiene una placa de cierre
compuesta.** Medido: **el titular se va de cuadro cuando la cámara empuja.** En el último
cuadro no queda tipografía, sólo un plano de producto. No es un defecto del modelo —es lo
que hace un movimiento de cámara— y de ahí sale el reparto del ADR 0045: el movimiento se
genera sólo donde la tipografía puede irse de cuadro, y la tipografía vuelve compuesta
como SVG.

**3. Donde prohíbe, describe la alternativa.** Ésta es la más útil de las tres y salió de
comparar dos corridas. La investigación de contenido midió que el generador **deriva hacia
el vestido comercial real aunque se le prohíba**: con la pipa y las tiras prohibidas, un
zapato volvió con un destello lateral curvo parecido a una pipa. El prompt de
`kalto-shoe` de acá no derivó, y la única diferencia es que **nombra la alternativa** —"un
único acento continuo en ámbar recorriendo la entresuela"— en lugar de sólo prohibir.

> **Prohibir deja el hueco y el modelo lo llena con lo que conoce; describir la
> alternativa le da con qué llenarlo.**

Es una hipótesis con una observación a favor y no una ley. Cuesta una oración.

**Y el chequeo humano sigue siendo un paso**, con o sin eso: cada pieza generada se mira
antes de ir a pantalla. Lo que se miró de cada una está en la evidencia de la T-05 de la
fase 08.

## Dos cosas del instrumento, porque las dos hicieron perder tiempo

**Los ids de modelo se buscan en la documentación y no se inventan.** Los que terminan en
`-preview` ya no existen; los vivos terminan en `-001`. Y el 404 de un id retirado dice
*"was not found **or** your project does not have access to it"*, **que no distingue las
dos cosas**: probar candidatos hasta que uno responda mide la lista de candidatos y no la
disponibilidad.

**Con un cuerpo vacío el chequeo de acceso no puede fallar.** La validación del cuerpo
corre antes del lookup del modelo, así que `{}` devuelve `400 Empty instances.` exista el
modelo o no. El instrumento que dice algo es `{"instances":[{}],"parameters":{}}`: ahí el
lookup corre primero, y un 404 significa que el modelo no está.

## Las tres marcas son de fantasía

**NEONECTAR** (una gaseosa botánica), **KALTO** (zapatillas) y **MERIDIA** (viajes).
Ninguna imita el vestido comercial de una marca real.

## `salida-vuelve-el-juego.png` no se usa, y hay que decirlo acá

El archivo sigue en esta carpeta y **ningún script lo nombra**. Era el cuadro contra el
que cerraba el último eslabón de la parada del juego, y está mal: comparado contra los
341 cuadros del clip del partido, el más parecido da YAVG 37,7 y el menos parecido 38,1.
Que los dos extremos den casi lo mismo es la firma de que **la imagen no pertenece al
clip** — si fuera otro segundo del mismo metraje, habría un mínimo claro.

Mientras estuvo en uso, la cadena cerraba contra una imagen ajena y el juego volvía a un
encuadre que no era el del acto 3.

Hoy ese cuadro **se extrae del clip por índice**, en `generar-parada.sh`, con el mismo
recorte que el plate: los dos valores salen de `plate.json` para que no puedan
despegarse. Se deja el png acá y no se borra porque el próximo que lo encuentre va a
suponer que es la salida buena, y esta nota es lo único que lo evita.

`entrada-arranca-la-parada.png` sí pertenece al clip: es el cuadro 334 (YAVG 0,48; sus
vecinos, 5,9).


## Los tres modos en que una generación sale mal, y los tres pasan el chequeo de costura

Aparecieron los tres en un mismo día de generar, y la lista está acá y no en el informe
de una fase porque es **qué mirar la próxima vez** y no un registro de qué pasó. Ninguno
se deduce de los otros dos.

**1. Deriva de escena entre eslabones.** El eslabón se ve perfecto y la costura mide
bien, pero la cámara --que el prompt manda tener quieta-- se fue caminando a otra parte
de la cancha, y los eslabones que siguen heredan obedientemente el mundo equivocado. Se
midió: el fondo contra el acto 1 pasa de 22-28 a ~70. **Y es de la corrida y no del
método**: el mismo eslabón, regenerado desde la misma semilla y con el mismo prompt,
volvió a 23,8. Por eso la escalera se mira de a uno.

**2. Una prohibición sin alternativa se llena con lo que el modelo conoce.** El prompt
del fondo de la L decía *"no floor, no horizon, no props and no set"* --cuatro
prohibiciones seguidas y nada que dibujar en su lugar-- y volvió con un piso de estudio,
sombra proyectada incluida: la banda inferior subió de 30,2 a 65,9 de luz media. Y como
nunca decía **dónde** tenía que estar el producto, el zapato se fue al centro del cuadro,
que es donde el partido lo tapa. Es la misma lección que ya está escrita más arriba en
este archivo, aplicada al revés: **"sin piso" es una prohibición con otras palabras**, y
lo que funciona es describir qué hay en su lugar y dónde vive cada cosa.

**3. Un fundido encadenado con un corte de escena adentro de un eslabón.** Los
jugadores vuelven duplicados y semitransparentes durante unos treinta cuadros, y del
otro lado del fundido la escena es otra. **Es el que más cuesta ver**, porque un fundido
es suave por construcción: la diferencia cuadro a cuadro se queda en el rango sano de
punta a punta y la costura con el eslabón anterior mide como las buenas. Lo agarra el
fondo contra el acto 1 (dio 57) y lo agarra el ojo.

**Los tres pasan `verificar-plate.sh`.** Ese chequeo mide continuidad, no identidad de
escena. El que compara la escena es `verificar-cadena.sh`, y se corre sobre cada
eslabón, no sólo cuando uno sospecha: la sospecha es el peor disparador de una medición
--la del fundido apareció porque veníamos de la deriva, y si hubiera sido el primero
pasaba de largo--.
