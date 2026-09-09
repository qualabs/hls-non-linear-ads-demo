# T-05 — Los creativos de las tres marcas de fantasía

Los cuatro avisos del minuto son nuestros. Tres marcas inventadas: **NEONECTAR** (una
gaseosa botánica), **KALTO** (zapatillas) y **MERIDIA** (viajes).

| aviso | marca | pictórico | tipografía | tamaño |
| --- | --- | --- | --- | --- |
| banner inferior, imagen fija | MERIDIA | costa generada, `agy generate_image` 16:9 | `banner.svg` | 1280×216 |
| la L, video | KALTO | zapatilla generada, `agy generate_image` 3:2 | `l-vertical.svg` + `l-horizontal.svg` | 512×720 y 1280×288 |
| lineal 10 s, cuadro entero | NEONECTAR | 8 s de Veo desde una imagen fija | `linear-endcard.svg`, los 2 s finales | 1280×720 |
| overlay de esquina, video | MERIDIA | la misma costa | `overlay.svg` | 320×180 |

## El chequeo de vestido comercial, pieza por pieza

Es un paso de la definición de done y no una formalidad, porque **está medido que el
generador deriva hacia el vestido comercial real incluso cuando se le prohíbe**. El prompt
completo, con la prohibición, está en `t05-el-prompt.txt`.

**`kalto-shoe.jpg` — pasa.** Mirado a cuadro completo y en dos ampliaciones, el lateral y
el talón (`t05-chequeo-zapato-lateral.png`). No hay pipa, ni tres tiras, ni felino
saltando, ni figura en salto. **La línea ámbar sigue la curva de la suela y no sube al
empeine**, que es exactamente la diferencia entre un acento propio y una pipa. Sin logo,
sin marca lateral y sin una sola letra en toda la imagen.

**`meridia-coast.jpg` — pasa.** Sin edificios, sin personas, sin embarcaciones, sin
carteles y sin texto. Nada en el cuadro identifica un lugar real ni una empresa.

**El clip de NEONECTAR — pasa, y ya estaba chequeado**: es el mismo que se midió al
resolver la disponibilidad de Veo, y su defecto conocido es tipográfico y no de marca —el
texto chico de la botella dice `SPARKLING BOTANICAL SOOL`—. **Ese defecto es justamente el
que la placa de cierre compuesta con SVG viene a tapar.**

## Y un refinamiento del hallazgo del ADR 0045, medido acá

La investigación de contenido midió que el generador **deriva hacia la marca real aunque se
le prohíba**: con la pipa y las tiras prohibidas, el zapato volvió con un destello lateral
curvo parecido a una pipa. **Acá no derivó**, y la diferencia entre los dos prompts es una
sola cosa: éste **nombra la alternativa**. No dice sólo "no imites una pipa", dice *"un
único acento continuo en ámbar cálido recorriendo la entresuela"*.

Es una hipótesis con una observación a favor y no una ley: **prohibir deja el hueco y el
modelo lo llena con lo que conoce; describir la alternativa le da con qué llenarlo.** Vale
escribirlo porque cuesta una oración en el prompt.

## El presupuesto: cero generaciones de Veo de las dos autorizadas

El clip de 8 s de NEONECTAR **ya existía y ya estaba pagado** —es el que se generó para
resolver si Veo estaba disponible— y es exactamente lo que el spot lineal necesita. Con la
tipografía compuesta encima al final, es el ADR 0045 corriendo. Las dos imágenes de `agy`
van contra la suscripción y no contra la tarjeta.

## Dos defectos encontrados mirando la pantalla

**1. El defecto silencioso del empaquetado, y era el más caro.** Cada creativo salía
perfecto al tamaño exacto de su caja, y después `empaquetar-contenido.sh` lo empaquetaba a
1280×720 como el plate — así que el recorte centrado del ADR 0013 se llevaba la mitad de la
tipografía. El script pasó a recibir el tamaño como argumento, con la razón escrita al
lado, y ahora cada aviso se sirve a su medida: 512×720, 1280×288, 320×180 y 1280×720,
verificado con `ffprobe` sobre cada playlist.

**2. La barra de progreso del cromo se come el pie de los creativos que llegan al borde
inferior.** El botón `SEE THE FARES` del banner y el `Book by Sunday` del overlay estaban
tapados. El cromo se esconde solo, así que en una grabación limpia no está — pero **un
creativo que sólo se lee cuando el cromo está abajo es un creativo que a veces no se lee**.
Los dos SVG llevan ahora la restricción escrita: nada baja de los últimos ~44 px de la
imagen, y por eso la línea de acento del overlay pasó de abajo a arriba.

## Las capturas

`t05-banner-meridia.png`, `t05-l-kalto.png`, `t05-lineal-neonectar.png`,
`t05-lineal-placa.png` y `t05-overlay-meridia.png`, cada una con su línea de estado leída
del contrato. La de la L es la que muestra el mecanismo entero de un vistazo: el partido
replegado a la esquina con el scorebug y la placa de parada adentro del repliegue, y el
mismo creativo de KALTO en las dos barras con la tipografía nítida en su sitio.
