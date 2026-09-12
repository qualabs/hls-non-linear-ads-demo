# H4 — El botón de una caja viaja con su caja

Cierra el hallazgo que dejó anotado la H3. Aquélla hizo que una caja que cambia
de lugar **viaje** en vez de saltar; el botón que el cromo dibuja sobre esa caja
se quedó saltando, y por eso durante 380 ms quedaba flotando sobre una imagen que
no era la suya.

El archivo tocado es **`lib/controls.js`** y nada más.

## Lo que se decidió, y por qué

**El botón viaja con su caja.** Es el arreglo, y es el mismo mecanismo con el que
se mueve la imagen (ADR 0051, ADR 0070): el rectángulo se escribe en su **destino**
en una pasada y una transformación lo pinta de vuelta en el origen; soltar esa
transformación es el movimiento. Se anima una transformación y nunca una medida de
layout, con los **mismos 380 ms y la misma curva** que el resto —importados de
`lib/renderer.js` y no escritos acá, que es lo que pide el ADR 0054.

**La transformación es un `translate` y va sobre el rectángulo, no sobre el botón.**
Dos razones, y cada una alcanza sola:

- La de la imagen tiene que reproducir un rectángulo entero, porque el rectángulo
  es lo que se ve, y por eso lleva `scale`. Acá el rectángulo es invisible
  —`.qa-box` no dibuja nada y no toma punteros— y lo que se ve es un botón cuyo
  tamaño es un token de la hoja de estilo. Un `scale` lo achicaría a la mitad al
  salir de un cuadrante y lo devolvería creciendo: un segundo movimiento que nadie
  pidió.
- `.qa-btn` ya anima un `transform` propio —el `scale(0.94)` con el que cada botón
  del cromo contesta una presión, 120 ms en `:active`—. Un `transform` inline
  escrito sobre el botón le gana a esa regla y le saca la respuesta a la presión
  para siempre.

Y el botón **queda sobre su caja en todos los cuadros y no sólo en las dos puntas**,
que es aritmética y no suerte: el navegador interpola el `translate` y el `scale`
de la imagen con la misma curva y la misma duración que este `translate`, y bajo eso
la esquina pintada de la imagen es la interpolación entre su esquina de partida y
su esquina de llegada. La esquina del botón es la interpolación entre esas mismas
dos esquinas más el padding, que es constante. Son el mismo camino. La medición de
abajo lo confirma: **deriva máxima 0,1 px sobre 380 ms de viaje.**

**Los botones que sobran desaparecen, y los que vuelven aparecen, sin desvanecerse.**
Es la otra mitad de la pregunta que la H3 dejó abierta, y la respuesta tiene un
argumento y una medición.

El argumento: cuando una caja se va a cuadro entero hay **un** botón (ADR 0069), y
los otros tres dejan de existir como control. Un botón que se sigue dibujando es la
promesa de que se puede apretar, y las dos salidas son malas: si sigue vivo, agranda
una caja que ya no se ve; si está muerto, es un control que ignora una presión. El
renderizado ya cerró esta misma forma del otro lado —`place()` prende los punteros
sólo sobre lo que está en pantalla, *porque la opacidad no detiene a un dedo*—, y un
desvanecido la reabriría del lado del cromo.

La medición, sobre `con-el-arreglo.json`: si el que sobra se desvaneciera en los
380 ms del viaje, el botón de `view-caminandes-b` quedaría pintado **encima** de la
caja que está creciendo desde los 177 ms, y el del primario desde los 411 ms. O sea
un control muerto dibujado sobre una imagen que no es la suya, que es exactamente el
defecto que esta tarea vino a sacar.

Del otro lado, el que vuelve: en el desagrandar, los botones que reaparecen quedan
sobre la imagen que todavía se está yendo durante los primeros **73 ms** (unos cuatro
cuadros), porque la curva es de salida rápida y a los 10 ms la caja que se va ya
dejó la mitad de la pantalla. Está mirado, foto 5: cada botón está sobre **su**
caja, que no se movió; lo que está encima de esa caja es una imagen que se va. No
hay nada mintiendo sobre dónde está nada, y un desvanecido de entrada sería el único
de este cromo, con una segunda duración que mantener en línea con el viaje.

## La medición, y su rojo al lado

**Qué mide.** `lectura-del-boton.py` es el muestreador por cuadro de la H3 con una
columna más: en cada cuadro de los 700 ms que siguen al gesto anota la caja de la
imagen **y** la caja del botón, en las mismas coordenadas. `juzgar-el-viaje.py`
calcula `deriva`: el vector de la esquina de la caja al borde del botón que se apoya
en ella, contra ese mismo vector en el cuadro final. Cero quiere decir que el botón
viaja montado; un número grande, que están en dos lugares distintos de la pantalla
en ese mismo cuadro.

Una lectura de las dos puntas no sirve, y es el motivo de que esto exista: antes y
después el botón está quieto sobre su caja quieta con el arreglo y sin él.

**Las dos referencias.** Adentro de la misma corrida, el gesto de subir una tercera
cámara deja tres cajas quietas al lado de la que viaja, y las tres tienen que dar 0.
Y contra el árbol sin el arreglo, que es el rojo:

```
### sin-el-arreglo.json   (Chrome 153.0.8010.36, contenedor [1100, 619])
  agrandar una vista
    view-caminandes-a    caja VIAJA  ( 21 cuadros intermedios)   deriva máx   550.0 px a los   58.4 ms   ROJO en 23/37 cuadros
  desagrandar una vista
    view-caminandes-a    caja VIAJA  ( 22 cuadros intermedios)   deriva máx   550.0 px a los   53.9 ms   ROJO en 23/35 cuadros
  subir una tercera cámara
    view-caminandes-b    caja VIAJA  ( 18 cuadros intermedios)   deriva máx   275.0 px a los  272.1 ms   ROJO en 18/37 cuadros
== ROJO: 3 elemento(s) con el botón fuera de su esquina durante el gesto ==

### con-el-arreglo.json   (Chrome 153.0.8010.36, contenedor [1100, 619])
  agrandar una vista
    view-caminandes-a    caja VIAJA  ( 21 cuadros intermedios)   deriva máx     0.1 px a los  139.4 ms   ok
  desagrandar una vista
    view-caminandes-a    caja VIAJA  ( 22 cuadros intermedios)   deriva máx     0.1 px a los  353.3 ms   ok
  subir una tercera cámara
    view-caminandes-b    caja VIAJA  ( 10 cuadros intermedios)   deriva máx     0.1 px a los  486.6 ms   ok
== VERDE: el botón se mantuvo en su esquina en todos los cuadros de todos los gestos ==
```

Las dos corridas enteras, con las cajas quietas que son la otra referencia, están en
`medicion-sin-el-arreglo.txt` y `medicion-con-el-arreglo.txt`; los cuadros crudos, en
los dos `.json`.

**La primera versión de la cuenta medía otra cosa y se la comió un gesto**, y queda
escrito porque es el tipo de error que esta medición existe para no cometer: medía
cuántos píxeles del botón caían **afuera** de su caja, y en el desagrandar el botón
salta al rincón del cuadrante, que está adentro del cuadro entero del que la imagen
todavía está saliendo. Daba **0,0 px** con el defecto a la vista. Un botón adentro
de su caja pero en otro lugar de ella es el mismo defecto: por eso la cuenta final
mide contra la esquina, que es lo que no se puede fingir.

## Las fotos

Tomadas en cámara lenta —`Animation.setPlaybackRate` a 0,1 por CDP, que es una
perilla del navegador y no un cambio en el código— porque la curva es de salida
rápida y a reloj la foto llega tarde: a los 40 ms de los 380 el viaje ya lleva un
tercio, y sacar una foto cuesta más que eso.

| | |
| --- | --- |
| `1-sin-el-arreglo-agrandar-150ms.png` | El defecto. La caja va por la mitad del viaje y su botón ya está en el rincón de arriba a la izquierda del cuadro entero, dibujado sobre las otras dos imágenes. |
| `2-con-el-arreglo-agrandar-150ms.png` | El mismo instante, con el botón montado en la esquina de la caja que viaja. |
| `3-la-grilla-de-cuatro.png` | El punto de partida: cuatro cajas, cuatro botones. |
| `4-agrandar-a-los-10ms-los-que-sobran-ya-no-estan.png` | Los tres que sobran ya no están, y el que se queda ya arrancó su viaje. |
| `5-desagrandar-a-los-10ms-los-que-vuelven-ya-estan.png` | Los tres que vuelven ya están, cada uno sobre su caja. Abajo a la derecha se ve el hallazgo 1: ese botón queda recortado por el borde de la imagen. |
| `6-desagrandar-a-los-60ms.png` | El viaje de vuelta a mitad de camino. |

## Lo que corrió, y cómo salió

| chequeo | resultado | archivo |
| --- | --- | --- |
| `npm test` | **183 pruebas, 183 pasan, 0 fallan** | `suite.txt` |
| `npm run check` | verde: 3 ocurrencias en la lista aceptada, cero hits en la segunda costura | `costuras.txt` |
| el comparador del recorrido de la T-12 | **VERDE: 14 de 14 segundos iguales** | `comparador.txt` |

**No hay prueba nueva, y es una decisión y no un olvido.** Este arreglo no produce
una función pura: es una diferencia entre dos rectángulos leídos del DOM y tres
propiedades escritas. La fase ya dijo dónde cae eso —*"lo que se vuelve puro se
testea, y lo que queda es pintura, que se mira"*— y lo que mira esta pintura es la
medición de arriba, que corre sobre un navegador de verdad y tiene su rojo.

**Cómo se corrió el comparador.** El `dist/` del repositorio no se tocó: las dos
lecturas se sirvieron desde un árbol propio en `/dev/shm` con `demo/` enlazado, en
el puerto **8097**, cambiando el archivo construido entre una corrida y la otra —el
mismo puerto y la misma URL, que es lo que el propio comparador exige para
certificar. El primero de los dos intentos usó dos puertos y el comparador salió
rojo por eso mismo, nombrando la URL distinta, aunque los catorce segundos daban
iguales: el chequeo de condiciones del comparador funciona.

| | sha256 del `dist/` servido |
| --- | --- |
| la base | `ece53a7fb1054478dba16a08eb1432ec01497fa2ba1e46d7e8994d3d5a4e388f` (idéntico al `dist/` del repositorio antes del cambio) |
| con el cambio | `c4b3792eae42994a7f4f9a5626fdf56f26f2645eb5c28d1891ebcdf97084d4a3` |

Con los tres chequeos en verde, el `dist/` del repositorio se volvió a construir y
quedó en ese segundo sha, que es el que se midió. El control en rojo del comparador
—`adOverlay1` movido diez píxeles a mano sobre la propia base de esta tarea— está en
`control-en-rojo.txt`.

## Hallazgos

**1. El rectángulo de un botón de caja mide 12,8 px de más, y en tres de las cuatro
esquinas eso cuelga el botón afuera de su caja.** Es anterior a esta tarea y no se
tocó.

`.qa-box` escribe `width`/`height` y tiene `padding`, y la hoja de estilo de la
librería no declara `box-sizing`, así que el rectángulo es **content-box**. Medido
en la grilla de cuatro (`hallazgo-box-sizing.json`, tomado sobre el árbol **sin**
este cambio): caja de `550 × 309,4`, rectángulo de `562,8 × 322,2`, padding 6,4.
En `nw` no se nota, porque el botón se apoya arriba y a la izquierda. En `ne` —la
única otra esquina que las tres formas del ADR 0065 llegan a usar, y la usa la
cuarta caja— el botón queda en `1072,4` en vez de `1059,6`: **12,8 px afuera de su
caja por la derecha**, que en el 2x2 es afuera del borde derecho de la imagen, donde
se ve recortado (foto 5, abajo a la derecha). En `sw` y `se` sería lo mismo por
abajo.

Importa más de lo que parece porque `boxButtonCorner` recibe la caja **verdadera** y
elige bien la esquina, y después el DOM pone el botón 12,8 px más allá: la esquina
que la aritmética eligió por estar libre no es exactamente donde el botón termina.
El arreglo es una línea —`box-sizing: border-box` en `.qa-box`— pero mueve la
geometría que la H2 midió, así que es una tarea con su propia medición y no un
agregado a ésta.

Y tiene una arista de hoy: las páginas de las demos declaran `* { box-sizing:
border-box }` en su propia hoja, así que **el defecto depende de la página del
integrador**. `demo/multiview-offer/` no tenía hoja propia cuando se tomaron estas
lecturas; la tarea que está corriendo en paralelo le está agregando una
(`demo/multiview-offer/css/page.css`), que taparía el defecto en esa demo sin
arreglarlo en la librería.

**2. Apareció un `CLAUDE.md` sin commitear en la raíz del repositorio**, que no
estaba cuando arrancó esta tarea y no es de ella. Queda dicho porque el proyecto no
tenía uno y sus reglas viven en otros archivos.

## Lo que esta tarea no mira

- **Ningún tamaño de ventana que no sea 1600×1000** con el contenedor en 1100×619.
  La aritmética del viaje no depende del tamaño, pero está medida en uno solo.
- **Ni pantalla completa ni un redimensionado en medio de un viaje.** El camino está
  escrito —la pasada de geometría saca `transform` de la lista de transiciones, que
  es lo que la cancela y deja el botón en su caja, que es la respuesta del ADR 0053—
  pero no está medido.
- **iOS**, como toda la fase.
