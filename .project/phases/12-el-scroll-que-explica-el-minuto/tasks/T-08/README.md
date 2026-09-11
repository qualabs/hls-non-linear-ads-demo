# Evidencia de la T-08 — la marca, centrada y en blanco, y la misma cerrando los créditos

Registro de lo que se corrió y se miró el 2026-09-11. Las tres corridas están en
[`../T-06/`](../T-06/README.md).

## El pedido, y la regla que lo respalda

Nicolás pidió el logo **centrado**, **sin fondo**, **en blanco** y **un poco más
grande**, más **un pie con el mismo logo**. Y lo pidió repitiendo algo que ya había
corregido antes: **el logo de Qualabs nunca va sobre una plancha blanca.**

De ahí sale la única decisión de diseño de la task: **si el logo no se ve sobre el
fondo, lo que cambia es el logo y no el fondo.**

## Lo que había, y por qué había eso

`.brand` tenía `background: var(--q-paper-50)`, `border-radius: 10px` y `padding: 9px
14px` — una plancha blanca del tamaño del logo. Existía por una razón escrita en el
comentario de al lado y en `brand/README.md`: **las letras del logo son `#383838`** y
el masthead es `#000`, así que sin la plancha la mitad del logo no está.

## El archivo nuevo, y por qué no se editó el de marca

`brand/logo-qualabs.svg` es copia del kit de marca, con su procedencia documentada y
un *"do not edit them here"* al lado. No se tocó. Al lado quedó
**`brand/logo-qualabs-on-dark.svg`**: el mismo dibujo con **los siete paths del
logotipo en `#fff`** —tres que eran `#383838` y cuatro que eran `#64ba93`— y **el
isotipo intacto con sus cuatro tintas** (`#64ba93`, `#dbdfe2`, `#36b4a7`, `#fff`), que
es lo que Nicolás pidió conservar si se podía. Se podía.

Verificado contando: el archivo tiene 8 `fill="#fff"` —siete del logotipo y uno que el
isotipo ya tenía—, más `#36b4a7`, `#64ba93` y `#dbdfe2`, uno cada uno. Y el comentario
de cabecera dice qué se le cambió y por qué, que es lo que lo separa de un fork
silencioso del logo de otro.

## El error que la captura encontró, y que ningún test habría encontrado

La primera versión del archivo **no se dibujaba**: el browser mostraba el `alt` con el
ícono de imagen rota, arriba y en el pie. La causa es del formato y no del dibujo:
**un SVG es XML, y un comentario XML no puede contener dos guiones seguidos.** El
comentario que escribí usaba `--` como raya, igual que el resto de los comentarios de
esta demo, que son HTML y sí lo admiten.

Se arregló reescribiendo el comentario sin esa secuencia, y el archivo se verifica con
un parser en vez de a ojo:

```
$ python3 -c "import xml.dom.minidom; xml.dom.minidom.parse('logo-qualabs-on-dark.svg'); print('well-formed XML')"
well-formed XML
```

**Lo encontró la captura y no la suite**, y no hay test que lo hubiera encontrado: un
`<img>` roto es HTML válido, CSS válido y JavaScript válido. Es el argumento del
`feedback_verify_css_visually` de siempre, con un caso nuevo.

## Lo que quedó

| | antes | ahora |
| --- | --- | --- |
| fondo | plancha `#f8f9fa`, radio 10, padding 9/14 | ninguno |
| posición | a la izquierda, con la línea de la SVTA al lado | centrado, con la línea centrada debajo |
| alto | 22 px | 30 px |
| archivo | `logo-qualabs.svg` | `logo-qualabs-on-dark.svg` |
| pie | no había | la misma marca, al final de los créditos |

**Centrado de verdad y no centrado de lo que sobra**: con algo al lado, el logo queda
centrado respecto del hueco restante, así que la línea *with the SVTA* pasó a apilarse
debajo. El `alt` sigue siendo `Qualabs` en los dos.

**Y no hay dos pies peleándose**: la marca del final está **adentro** del bloque de
créditos, que ya es el pie de la página por el ADR 0077, en lugar de una banda propia
abajo de ellos. Lo que hace ahí es terminarlos.

## Las capturas

| archivo | qué es |
| --- | --- |
| `masthead-1907.png` / `masthead-400x780.png` | arriba, en los dos anchos |
| `pie-1907.png` / `pie-400x780.png` | el pie de créditos con la marca cerrándolo |

En los dos anchos el logotipo se lee en blanco, el isotipo conserva su verde, y no hay
ninguna superficie clara debajo.

## Un hallazgo que no se arregló, porque no es de esta task

`brand/README.md` quedó desactualizado en dos puntos y **no se tocó**, porque es un
archivo que esta task no tiene asignado:

1. Dice *"This page does not use the logo yet; the file is here for the recording"*, y
   la página lo usa desde que existe el masthead — o sea que ya estaba viejo antes.
2. Dice que recolorear el logo *"is not an option that was rejected for taste: it is
   how a brand gets broken"*, y la instrucción de Nicolás eligió exactamente eso. La
   tabla de archivos tampoco tiene la fila del archivo nuevo.

Lo que corresponde es agregarle la fila de `logo-qualabs-on-dark.svg` con su
procedencia y reescribir ese párrafo para que diga cuál se usa en una superficie clara
y cuál en una oscura. Va reportado y no hecho.
