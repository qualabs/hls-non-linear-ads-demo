# La casilla 10, sin la marca

**Una generación, US$0,80, y la casilla sirve.** El clip nuevo está en
`demo/race-multiview/content/.fuentes/programa/10-pentav-quentra-eses.mp4`, con su
`.prompt.txt` al lado. Mide **8,000000 s, 192 cuadros a 24 fps, 1280×720**, los mismos
números que las otras trece, así que los 112,000 s del programa siguen cerrando.

**Qué se ve**: los dos autos corren juntos por el tramo costero, PENTAV verde lima delante
y QUENTRA bronce medio auto atrás, sostenidos en el mismo lugar del cuadro los ocho
segundos mientras pasan por detrás las dunas, la tribuna y **el mar**.

El rechazado no se borró: está en
`content/.fuentes/programa/rechazados-la-marca-en-la-carroceria/`, con su prompt.

---

## 1. La marca la invitaba el nombre del color

El prompt no nombra ninguna marca. Lo que nombra es el color del auto que la llevaba
pintada:

    BRIGHT APPLE GREEN

La palabra `APPLE` está en las catorce casillas, porque el padrón de seis colores va en el
bloque del mundo. **Lo que separa es si además está en `THE CARS IN THIS SHOT`**, que es el
bloque que dice qué hay en cuadro:

| | casillas |
| --- | --- |
| `APPLE` en el bloque de la casilla, o sea sobre un auto que está en cuadro | 1, 4, 6, 7, **10**, 11, 14 |
| `APPLE` sólo en el padrón del mundo | 2, 3, 5, 8, 9, 12, 13 |

La casilla 5 es la única de las catorce que volvió sin una sola letra en la carrocería, y
es del segundo grupo. La 10 es del primero, **y el auto que volvió con la marca pintada es
exactamente el auto cuyo color se nombró en ese bloque**. El resto del prompt describe una
transmisión deportiva, que es un género lleno de marcas: el modelo tiene el hueco y una
sola palabra candidata para llenarlo.

**El arreglo es sacar la palabra, no prohibirla**, que es la regla de la fase 08 aplicada a
su segunda mitad: nombrar lo prohibido da permiso, y escribir "sin logos de Apple" habría
sido la peor forma de pedirlo. La casilla 10 renombra su verde a **`BRIGHT LIME GREEN`** en
todo su prompt, el padrón del mundo incluido, y **no se agregó ni una negación**.

`LIME` se eligió por tono y no por sonar bien: el verde que Veo dibujó para `APPLE GREEN`
es un verde amarillento, que es donde cae `lime`, y correrlo hacia el azul —emerald,
shamrock— lo acercaría a `BRIGHT AQUAMARINE`, que es otro de los seis.

**Nada más se tocó.** El bloque de seguimiento que resolvió la geometría, la calzada, el
encuadre, el mar y el sonido viajaron letra por letra igual que en el intento anterior: la
regeneración cambia **una sola variable**.

### Dónde vive el arreglo

En `demo/race-multiview/scripts/generar-programa.py`, que es donde el ADR 0061 manda que
viva la receta. El renombre es **por casilla** y no una edición del padrón, porque las otras
trece volvieron aprobadas y su `.prompt.txt` tiene que seguir siendo el texto que de verdad
viajó. El mecanismo se llama `color_renombrado` y **se niega a correr si el texto que
reemplaza no está en el prompt**: sin ese guarda, un renombre que deja de enganchar se
convierte en un no-op silencioso y el clip sale con el nombre viejo sin que nada avise.

## 2. Qué se lee en los recortes

**A resolución completa y agrandados ×3 con `neighbor`, que no inventa bordes**: lo que se
lee estaba en el píxel. Un recorte reducido no muestra una palabra de cuatro letras en un
pontón, que es exactamente el defecto que descalificó la versión anterior.

| recorte | qué se lee |
| --- | --- |
| [la valla, s4](lamina/10-la-valla-s4-sin-marca.png) | **nada**. Muro liso en bandas naranja, blanco y negro, sin un cartel y sin una letra. Detrás, dunas, tribuna con público y el mar |
| [la valla, s6](lamina/10-la-valla-s6-sin-marca.png) | **nada**. Muro blanco y negro liso de punta a punta. El mar ocupa medio cuadro |
| [el auto, s2](lamina/10-el-auto-s2-sin-marca.png) | `KUMWS` en el plano del alerón trasero, el número `75`, `QMS` en la deriva del alerón delantero. Ninguna es una marca real |
| [el auto, s6](lamina/10-el-auto-s6-sin-marca.png) | lo mismo, y un roundel blanco en el pontón con un garabato verde adentro: **no es una palabra** |
| [el pontón ×6](lamina/10-el-ponton-x6-donde-estaba-apple.png) | el lugar exacto donde estaba `Apple` con la media manzana roja: **el roundel y nada más** |
| [el morro ×6](lamina/10-el-morro-x6.png) | `QMS`, el `75`, y un disco negro con un glifo abstracto. Sin palabras legibles |

**No hay ninguna marca real en el cuadro.** La tipografía inventada sigue apareciendo —es
lo que la T-03 midió y dejó sin resolver, y no es lo que descalificaba a esta casilla—, pero
ahora son cadenas sin referente: `KUMWS`, `QMS`, `75`.

### El instrumento se vio funcionar antes de usarlo

Los mismos recortes, con el mismo comando, sobre el clip **rechazado**:

- [el auto rechazado, s4](lamina/control-el-auto-rechazado-s4.png) → se lee `apple` **dos
  veces** en el pontón y el cubremotor.
- [la valla rechazada, s6](lamina/control-la-valla-rechazada-s6.png) → se lee `Apople` en
  **dos carteles** de la valla.

Sin eso, un recorte que no muestra una marca no prueba nada: podría ser que el recorte no
pueda mostrar ninguna.

## 3. La geometría no se movió

[Los ocho segundos, un cuadro por segundo](lamina/10-los-ocho-segundos.png): los dos autos
en el mismo lugar del cuadro y del mismo tamaño de principio a fin, una sola calzada, un
solo sentido, nadie desaparece y nadie cambia de color. Es la toma que el intento anterior
consiguió, intacta.

**Y el mar apareció.** Es la tercera vez que se pide y la primera que sale: está en cuadro
desde el segundo 4 hasta el final, detrás de la valla. El informe anterior había concluido
que *"el mar de este circuito no está saliendo por prompt"* — **esa conclusión era
prematura**, y el prompt que lo consiguió es el mismo que no lo había conseguido, así que
lo que cambió fue la tirada y no el pedido.

## 4. Dos cosas que el montaje tiene que saber

**El verde de PENTAV quedó más amarillo.** Medido sobre ocho cuadros de cada clip, contra
las dos casillas donde PENTAV corre y que no se tocaron
([la lámina](lamina/10-el-verde-contra-sus-referencias.png), los números en
[`salidas/el-verde-medido.txt`](salidas/el-verde-medido.txt)):

| clip | color | mediana de los píxeles verdes |
| --- | --- | --- |
| casilla 6, sin tocar | `APPLE GREEN` | `#639E74` |
| casilla 7, sin tocar | `APPLE GREEN` | `#3E8F65` |
| casilla 10 rechazada | `APPLE GREEN` | `#54814C` |
| **casilla 10 nueva** | `LIME GREEN` | **`#9BBA40`** |

**La medida está contaminada y hay que decirlo**: el filtro toma cualquier píxel verde del
cuadro, así que también cuenta el pasto y el matorral. El control lo demuestra — la casilla
5, donde el auto es aquamarine y no hay ningún auto verde, igual devuelve 14.052 píxeles
"verdes". Los números sirven para ordenar los cuatro clips, no como el color de la pintura.

Lo que la lámina muestra sin ambigüedad es que **el verde nuevo es el más amarillo de los
cuatro**. Ahora bien, la dispersión entre clips ya era grande antes de tocar nada: en la
casilla 7 PENTAV es un verde inglés oscuro y en la 6 es un verde brillante, y ésas son las
dos que no se tocaron. El verde nuevo se lee inconfundiblemente verde y no se confunde con
el `LEMON YELLOW` de CALDRIX, que además no comparte ningún cuadro con él.

**Lo que esto deja abierto, y no se tocó porque es de otra tarea**: `race.json` le asigna a
PENTAV `#2D6E24`, que es el color de su ficha en el panel. Ese hexadecimal ya no describía
bien ni a la casilla 6 ni a la 7, y ahora tampoco a la 10.

**La luz de este clip es más cálida.** Las casillas 6 y 7 tienen el gris parejo que el
prompt pide; ésta tiene un cielo más claro y un aire más cálido, con el sol implícito bajo.
Está adentro de "late afternoon", pero es el más cálido de los tres y quien empareje el
montaje lo va a notar.

## 5. Lo que no se hizo

- **No se tocó `scripts/relato/guion.json`, ni el relato, ni el montaje**: son de otra
  tarea.
- **No se renombró el archivo**, que sigue diciendo `eses` sin tener eses. El orden del
  montaje sale del prefijo numérico y renombrar dejaría colgadas las referencias de las dos
  corridas anteriores y de las carpetas `rechazados-*`.
- **No se tocó `lib/` ni las otras tres demos**, y acá es más fácil de probar que de
  prometer: `git status` no muestra un solo archivo trackeado modificado.
- **No se volvió a pedir el mar ni se tocó el encuadre**: la regeneración cambió una sola
  variable a propósito.
