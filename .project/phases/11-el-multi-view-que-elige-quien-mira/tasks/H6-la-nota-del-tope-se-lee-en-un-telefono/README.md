# H6 — La nota del tope se lee en un teléfono

Cierra el hallazgo que dejó medido la T-11 al mirar la corrida a dos anchos: en
420 px el panel del selector esconde la mitad que existe para ser vista. Con la
grilla llena, la nota *"4 boxes is what the screen holds. Lower one to raise
another."* y las filas grises que esa nota explica quedaban abajo del pliegue, y
a 1440 estaban las dos.

El archivo tocado es **`lib/controls.js`** y nada más.

## 1. El defecto, en píxeles

El panel se acota al alto de la imagen y adentro scrollea. Medido con la grilla
llena, sobre la segunda ventana de la corrida (cinco vistas ofrecidas, cuatro
cajas de tope, dos filas grises):

| | 420 x 860 | 1440 x 900 |
| --- | --- | --- |
| la imagen | 392 x 220,5 | 1124 x 632,3 |
| el panel muestra | **137 px** | 297 px |
| el panel mide | 297 px | 297 px |
| sobra afuera | **160 px** | 0 |
| la nota | **0 de 44,4 visibles** | 44,4 de 44,4 |
| `Elephants Dream, late` (gris) | 34 de 34 | 34 de 34 |
| `Sintel` (gris) | **17,3 de 34** | 34 de 34 |
| el título `MULTI VIEW` | **0 de 30,2** | 30,2 de 30,2 |

Lo que el panel dejaba arriba del pliegue era la **cabeza**: el título y las
filas tildadas.

## 2. Lo que se decidió, y por qué a ese nivel

El panel no puede crecer más que la imagen, así que no hay forma de que entre
todo: 137 px de panel sobre 297 px de lista. Lo único que queda por elegir es
**sobre qué punta de la lista está esa ventana**, y la respuesta es **el pie**.

**Porque la cabeza es la mitad que ya está en la pantalla.** En la cabeza están
el título y las filas tildadas, y una fila tildada **es una caja que se está
mirando**: dice por segunda vez lo que dice la imagen. En el pie están las filas
grises y la línea que explica por qué están grises, que es lo único del panel que
no está en ningún otro lado. Sin eso el tope se lee como un control que dejó de
funcionar, que es exactamente el defecto que la línea existe para evitar
(ADR 0066).

**Sólo mientras hay línea que leer.** Una lista con lugar en la grilla no explica
nada, no tiene nada en el pie, y queda donde la haya dejado quien la esté
leyendo. Y donde entra todo, esto escribe un cero: a 1440 `scrollHeight` es 297 y
`clientHeight` es 297, así que el panel que nunca necesitó la línea no se mueve
por ella.

**El pie clavado era la otra respuesta y se paga con la lista.** Sacar la línea
del scroller —una columna flex con el pie afuera— la deja arriba contra cualquier
scroll, y también le saca sus 50 px a los 137 para siempre: quedan **una fila y
un tercio** para leer, contra las dos filas grises más la línea que deja esto.
Por eso la línea se le pone adelante a quien llenó la grilla, y de ahí en más el
scroll es suyo. **Lo que esto no compra**, dicho en el código y acá: si quien
mira sube el scroll a mano, la nota se va. Es su gesto y su vuelta.

El cambio son dos líneas adentro de `paintRows`, que es donde ya se decide si la
nota está o no.

## 3. La medición: qué contesta, y contra qué

`medir-el-pliegue.py`, sobre una copia del SDK en `/dev/shm` con `dist/`
reconstruido, sirviendo `demo/multiview-offer` en el puerto 8093, Chrome del
sistema por Playwright.

**Que un elemento exista en el DOM no es que se vea.** `note.hidden === false`
también es cierto con el defecto puesto: la nota está en el documento, pintada y
con su texto. Lo que decide si se puede leer es dónde cae contra el
**scrollport** del panel —su caja de cliente, que es lo que el panel muestra de sí
mismo—, así que cada lectura es la intersección vertical de un rectángulo con esa
caja. Y la vara es **el elemento entero**: media oración no es una oración que
alguien leyó.

Tres lecturas por ancho, y la primera tiene que contestar al revés:

| lectura | qué tiene que dar |
| --- | --- |
| `con-lugar` | dos cajas arriba, lugar en la grilla. **No hay nota**, y el panel está en su **cabeza**: el título entero. Un cambio que estacionara todo panel abajo se cae acá |
| `grilla-llena` | la grilla llenada a tildes, que es el gesto en que se encontró el defecto. La nota entera y **todas** las filas grises enteras |
| `reabierto` | la misma lista cerrada con `Escape` y abierta de nuevo con la grilla ya llena: es el otro camino al mismo estado y pasa por otra rama del archivo (`buildRows`, no `pick`) |

**La referencia son los dos anchos**, y no es un número elegido: 1440 es el ancho
donde la nota y las filas grises ya estaban en pantalla y tienen que seguir.

### El rojo

Contra el mismo árbol **menos las dos líneas**, y no contra `HEAD`: en el árbol
de hoy están también los cambios sin commitear de la H4 y de la H5, así que un
control construido de `HEAD` habría revertido tres cosas y no una. El control es
este `lib/controls.js`, con el `if (note !== null)` y su comentario sacados, y
nada más. `medicion-sin-el-arreglo.txt`, verbatim:

```
420 px  420x860  RED
  [grilla-llena] panel 137 px of 297 (overflow 160, scrollTop 87)  RED
     title  visible     0 of  30.2  whole=False
     note   visible     0 of  44.4  whole=False  hidden=False
     row grey Elephants Dream, late    visible    34 of    34  whole=True
     row grey Sintel                   visible  17.3 of    34  whole=False
     OK   note is shown
     FAIL note is whole
     OK   there are grey rows
     FAIL every grey row is whole

1440 px  1440x900  GREEN
```

Las dos mitades importan. **El 420 en rojo** dice que la medición puede fallar, y
falla justo en lo que el hallazgo describió. **El 1440 en verde con el defecto
puesto** dice que lo que mide es el pliegue del teléfono y no cualquier cosa:
`note is shown` da OK en los dos, que es la lectura que no alcanza.

### El verde

`medicion-con-el-arreglo.txt`, verbatim:

```
420 px  420x860  GREEN
  [con-lugar] panel 137 px of 247 (overflow 110, scrollTop 0)  green
     title  visible  30.2 of  30.2  whole=True
     OK   no note
     OK   no grey rows
     OK   the head is shown
  [grilla-llena] panel 137 px of 297 (overflow 160, scrollTop 160)  green
     note   visible  44.4 of  44.4  whole=True  hidden=False
     row up   Elephants Dream, early   visible  12.7 of    34  whole=False
     row grey Elephants Dream, late    visible    34 of    34  whole=True
     row grey Sintel                   visible    34 of    34  whole=True
     OK   note is shown
     OK   note is whole
     OK   there are grey rows
     OK   every grey row is whole
  [reabierto] ... green

1440 px  1440x900  GREEN
  [grilla-llena] panel 297 px of 297 (overflow 0, scrollTop 0)  green
     title  visible  30.2 of  30.2  whole=True
     note   visible  44.4 of  44.4  whole=True  hidden=False
     (las seis filas, 34 de 34)
```

**El 1440 no se movió**: `scrollTop 0`, `overflow 0` y las mismas seis filas
enteras antes y después, línea por línea. **El `con-lugar` de 420 tampoco**:
`scrollTop 0` y el título entero con el arreglo puesto, que es la mitad que
prueba que esto no es "estacionar el panel abajo".

Los 12,7 px de `Elephants Dream, early` no son un resto: son la fila tildada que
asoma arriba de las dos grises, y es lo que dice que la lista sigue para arriba.

### Las capturas

| | |
| --- | --- |
| `capturas/sin-420-grilla-llena.png` | el defecto: sin nota, `Sintel` cortada al medio |
| `capturas/con-420-grilla-llena.png` | las dos filas grises y la nota entera |
| `capturas/sin-1440-grilla-llena.png` / `capturas/con-1440-grilla-llena.png` | la referencia, idénticas |
| `capturas/*-con-lugar.png`, `capturas/*-reabierto.png` | las otras dos lecturas de cada ancho |

## 4. Las dos mediciones heredadas

Se corrieron **sin tocarles una línea**, sobre la misma librería con el arreglo,
porque tocan el mismo cromo. Salidas en `heredadas/`.

| medición | resultado |
| --- | --- |
| `H2/medir-esquinas.py` — el botón de cada caja se puede presionar, en las tres formas más el teléfono | **ALL GREEN**, y las esquinas son las de su tabla: `nw,nw` / `nw,nw,nw` / `nw,nw,nw,ne` |
| `H4/lectura-del-boton.py` + `juzgar-el-viaje.py` — el botón viaja con su caja | **VERDE**, deriva máxima 0,1 px, que es el mismo número de su corrida |

**La H4 necesitó una URL distinta, y eso es un hallazgo y no un arreglo.** Su
script espera `currentTime > 48` sin pedir `play()` ni traer el player a la
vista, y contra la página que dejó la T-11 eso no llega nunca: la página abre con
la sección de apertura y el `<video>` arranca cuando el `IntersectionObserver` ve
el 60 % del player (`demo/multiview-offer/js/app.js:70`), así que en `load` el
player queda **3120 px abajo del pliegue**, `currentTime` se queda en 0 y el
script se cae a los 180 s. Medido:

```
{'t': 0, 'paused': True, 'scrollY': 0, 'innerH': 1000, 'playerTop': 3120, 'playerH': 632}   (x5, cada 2 s)
```

Se corrió con `http://localhost:8093/#player`: el ancla es un argumento que el
script ya toma, la página es la misma byte a byte, y el navegador la abre con el
player a la vista, que es lo que prende la reproducción. No se tocó una línea de
la H4. **Es anterior a este cambio** —la H4 corrió 26 minutos antes de que la
página de la T-11 reemplazara a la mínima del cableado de `attach()`— y el
arreglo de fondo es de la task dueña.

## 5. La suite

`npm test` y `npm run check`, verbatim en `suites.txt`: **183 pruebas, 183 pasan**
y las dos costuras en verde. No hay prueba nueva de node y es deliberado: lo que
este cambio decide no es aritmética pura, es dónde cae un rectángulo contra el
scrollport de otro, y este repositorio no tiene DOM en `node --test` (las 183 son
todas de funciones puras). La prueba de esto es la medición de arriba, con su
rojo.

## 6. Cómo se corre otra vez

```
W=/dev/shm/h6-$(date -u +%Y%m%dT%H%M%S)
mkdir -p "$W" && cp -r lib scripts test server.mjs package.json "$W/"
ln -s "$PWD/vendor" "$W/vendor" && ln -s "$PWD/demo" "$W/demo"
(cd "$W" && ./scripts/construir-libreria.sh && PORT=8093 node server.mjs demo/multiview-offer &)

python medir-el-pliegue.py http://localhost:8093/index.html ./capturas ./con-el-arreglo.json con
```

Para el rojo, lo mismo sacándole a `"$W/lib/controls.js"` el bloque
`if (note !== null) { ... }` de `paintRows` y su comentario, que son las dos
líneas de este cambio.

## 7. Hallazgos

Van en el informe.
