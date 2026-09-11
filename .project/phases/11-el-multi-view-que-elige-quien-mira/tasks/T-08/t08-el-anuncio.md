# El anuncio: el popup que se va y el punto que se queda

2026-09-11. `lib/controls.js` anuncia la ventana de multi view con las dos
piezas del ADR 0068: un popup sobre la imagen que se va solo a los 4,5 s, y un
punto sobre el control del selector que se queda mientras nadie subió ninguna
cámara. La verificación son las capturas y las lecturas que las acompañan.

## 1. Lo que se construyó

| dónde | qué |
| --- | --- |
| el popup | `qa-announce`: el ícono de cuatro cajas en verde y *"Multi view available"*, sobre una plancha oscura igual a la de la lista, en el mismo lugar del que la lista sale. Aparece con la ventana y se va a `ANNOUNCE_MS` |
| el punto | `qa-btn--new` sobre el botón del selector, un `::after` de `--qa-icon * 0.22` en el verde de `RANGE_COLOURS.multiview` con un anillo oscuro |
| `ANNOUNCE_TEXT`, `ANNOUNCE_MS` | las dos constantes del anuncio, una línea cada una |
| `raiseAnnounce` / `dropAnnounce` | toda la vida del popup: lo levanta el cambio de ventana, lo baja el temporizador, el cierre de la ventana, o que se abra la lista |
| `paintDot()` | la única decisión: hay punto si hay oferta y **ninguna fila tildada que no sea el programa**, leído de `multiview.rows(offer)` |

**El popup es hermano del cromo y no hijo, y es lo único estructural de la
task.** El cromo se apaga bajando la opacidad de su capa a cero, y la opacidad
de un padre es un grupo del que ningún hijo se escapa: adentro, el popup sería
invisible **justo en el estado para el que existe** —una imagen que nadie tocó
hace unos segundos—. Así que cuelga del contenedor del player, después de la
capa del cromo y en el mismo `z-index`.

**Los siete tokens pasaron a declararse para los dos selectores** en lugar de
sólo para `.qa-controls`, que es lo que hace que el popup crezca en pantalla
completa con el resto de la furniture. Es el único cambio de esta task sobre
CSS que ya existía.

**Ninguna llamada nueva cruza hacia el estado de quien mira**: el punto sale de
`rows`, que el selector ya usaba, y se pregunta sólo cuando cambia la ventana o
cuando alguien tilda. No corre por frame.

**El punto vuelve si se baja la última cámara.** Es consecuencia de leerlo de
las filas y no de un "ya se anunció": lo que el punto dice es que hay una oferta
y la grilla está vacía, y eso es cierto de nuevo. Está medido en la corrida (E).

## 2. El instrumento

| | |
| --- | --- |
| la página | `t08-la-pagina.html`, la de la T-07 con dos lecturas nuevas, servida desde un directorio temporal con `lib/` traído por un enlace: lo que corre es la librería viva |
| la oferta | `signalling/asset-list-offer-3.json` de la demo nueva, ventana abierta en el segundo 4 |
| el puerto | **8108**, propio. Las tres demos servidas (8080, 8081, 8082) no se tocaron |
| el tamaño | 960 × 540, y el recorte de cada captura es el player |
| el script | `t08run.py`, 36 chequeos; la corrida entera en `t08-la-corrida.json` |

**El punto se lee del pseudo-elemento y no de la clase.** La clase es lo que
este cambio escribe; lo que se ve es la regla que la clase enciende, y las dos
pueden estar desacopladas. `getComputedStyle(boton, '::after').content` vale
`'none'` cuando ninguna regla lo genera.

**Y la visibilidad se lee con `checkVisibility` y no con la opacidad.** Esto
costó una medición falsa y vale escribirlo: `getComputedStyle(nodo).opacity`
devuelve la opacidad **de ese nodo**, así que adentro de una capa apagada sigue
contestando `1`. La primera versión del chequeo del punto G daba verde con el
popup metido adentro del cromo —el error exacto que ese chequeo existe para
encontrar—. `checkVisibility({ opacityProperty: true })` mira a los ancestros.

## 3. La corrida, con sus números

Los 36 chequeos dieron verde. Los que importan:

| momento | lo que se leyó |
| --- | --- |
| **A. sin oferta** (la referencia) | sin botón, sin punto (`content: none`), popup en opacidad 0 y sin texto |
| **B. la ventana abre** | popup visible, *"Multi view available"*, `role=status`, `pointer-events: none`, colgando de `player` y no del cromo; punto de 7,47 px en `rgb(51, 204, 102)`; una sola caja en pantalla |
| **C. el toque atraviesa** | `elementFromPoint` en el centro del popup devuelve el primario, y un click de verdad de `page.mouse` llegó al primario en (888, 103) |
| **C. el control** | con el popup tomando punteros, el mismo punto devuelve el popup y **el primario no recibe nada**. Devuelto a como estaba, vuelve a atravesar |
| **D. se va solo** | el popup se fue, no se ve, y la región viva quedó vacía; la ventana sigue abierta y **el punto sigue puesto** |
| **E. la primera cámara** | dos cajas y el punto se fue (`content: none`); destildada la última, el punto vuelve |
| **F. la ventana se cierra** | ni popup, ni botón, ni punto |
| **G. el cromo se va y el popup no** | el cromo bajó a los **2595,5 ms** de abrirse la ventana y el popup a los **4481,4 ms**, y en el medio el popup se sigue viendo con el cromo abajo |

Los tokens, medidos aparte (`t08-los-tokens.py`): los siete resuelven idénticos
en el cromo y en el anuncio, y el juego de pantalla completa sigue ganando sobre
el chico en los dos.

```
chico  cromo   {'--qa-pad': '16px', '--qa-icon': '34px', '--qa-play': '74px', '--qa-text': '13px', ...}
chico  anuncio {'--qa-pad': '16px', '--qa-icon': '34px', '--qa-play': '74px', '--qa-text': '13px', ...}
grande cromo   {'--qa-pad': '30px', '--qa-icon': '46px', '--qa-play': '104px', '--qa-text': '18px', ...}
grande anuncio {'--qa-pad': '30px', '--qa-icon': '46px', '--qa-play': '104px', '--qa-text': '18px', ...}
```

## 4. Las capturas

| archivo | qué se mira |
| --- | --- |
| `t08-1-sin-oferta.png` | la referencia: el cromo arriba, sin botón de vistas, sin popup y sin punto |
| `t08-2-el-popup-y-el-punto.png` | la ventana recién abierta: el popup bajo el botón, y el punto verde sobre el botón |
| `t08-3-el-punto-sin-el-popup.png` | pasados los segundos: el popup se fue y el punto sigue |
| `t08-4-sin-punto-con-una-camara.png` | con una cámara arriba: dos cajas y el botón sin punto |
| `t08-5-el-popup-sin-cromo.png` | el popup solo sobre la imagen, con el cromo ya ido: la mitad que el ADR 0068 necesita que sea cierta |

## 5. Las roturas a propósito

Dos, cada una sobre una regla, corriendo el mismo script:

| rotura | qué se puso rojo |
| --- | --- |
| el punto deja de mirar si alguien subió una cámara (`fresh = Boolean(offer)`) | 2 fallas en E: *"el punto se fue con la primera camara: content '""'"* |
| el popup pasa a ser hijo del cromo (`layer.appendChild`) | 2 fallas: el padre en B, y en G *"el popup SE SIGUE VIENDO con el cromo abajo: checkVisibility False"* |

La segunda es la que encontró la medición falsa: con el chequeo escrito contra
`opacity` esa misma rotura daba **36 chequeos, 0 fallas**.

El tercer control no es una rotura sino parte de la corrida: el chequeo del
toque trae adentro el caso que tiene que dar lo contrario, y lo imprime.

## 6. Lo que no se siguió del plan, y un hallazgo

**Nada del plan quedó sin hacer.** Lo que se agregó y el plan no nombra son tres
cosas, todas en la misma dirección que el ADR: que el popup se vaya también
cuando se abre la lista —la lista sale exactamente de donde está el popup, y a
quien la abrió ya se le dijo—, que sea `role="status"` para que exista para
quien no lo ve, y que el punto vuelva con la grilla vacía.

**El hallazgo: `dist/` no se reconstruyó.** La demo servida en el 8082 toma
`/dist/qualabs-concurrent-hls.js`, así que **este cambio no se ve ahí todavía**.
No se reconstruyó a propósito: al momento de esta corrida había otra task
editando `lib/multiview.js` y `lib/renderer.js`, y un build hubiera metido el
estado a medio escribir de esos dos archivos en la demo que está mirando
Nicolás. La reconstrucción queda para el coordinador, con las tres tasks
quietas.

**Y la tabla de la fase no se tocó**, por la misma razón: hay tasks corriendo en
paralelo y `TASKS.md` es de todas. La línea de la T-08 la escribe quien
coordine.

La suite quedó en **165 pruebas, 165 pasan** —las mismas de antes, porque esta
task no agrega lógica pura que testear: el único chequeo no visual es el de los
pointer events, y ése es del navegador— y `npm run check` en verde con las tres
ocurrencias aceptadas de siempre.
