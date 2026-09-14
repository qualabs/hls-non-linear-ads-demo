# La página, los créditos y el README

Cero generaciones de Veo, cero dólares. La demo tiene su página entera: la apertura en negro
con sus cuatro frases, el player, las dos secciones de scroll que se dibujan solas de lo que
el contrato resolvió, y los créditos como pie. `brand/` está byte por byte, `CREDITS.md` y el
`README.md` están escritos, y **el 404 del favicon que dejó anotado la T-07 ya no está**: los
catorce recursos de la página responden 200.

El veredicto en una línea: **la página no afirma nada que no haya leído — el nombre de cada
cámara, la cantidad que ofrece el catálogo, los segundos de la ventana y el JSON del
asset-list salen del contrato o de la red, y lo único escrito a mano es la prosa que explica
un gesto.**

**Y el R5 tiene veredicto**: con las seis cámaras empaquetadas, las siete filas del selector
entran a 1907 con cero desborde y **no entran a 400×780**, donde el panel muestra 125 px de
331. Eso es una dependencia de `lib/` y está reportado sin tocarla. A los dos anchos el
documento no scrollea de costado, con su control en rojo.

`npm test` da **193 pruebas, 193 pasan**, `npm run check` verde, y `git diff --stat -- lib/`
vacío. Verbatim en [`salidas/no-se-rompio-nada.txt`](salidas/no-se-rompio-nada.txt).

---

## 1. Qué quedó en la página

De arriba hacia abajo, y cada cosa con quién la llena:

| | qué es | de dónde sale |
| --- | --- | --- |
| la marca | el logo sobre fondo oscuro, arriba y al pie | `brand/`, copiado |
| **la apertura** | tres pantallas de negro, una frase por vez, la tipografía encogiendo con el scroll | el markup: cuatro `<p>`, y `js/opening.js` que sólo escribe `--t` |
| el player | el contenedor con `isolation: isolate` y el `<video>` | las seis líneas que escribe un integrador |
| la línea de estado | qué dice el contrato en el playhead, y cuántos `<video>` hay de verdad adentro | `activeAt()` + el DOM |
| **la ventana** | la fila de la ventana, encendida mientras está abierta, con las cámaras listadas por nombre | `programRanges()` + `rows(offer)` |
| **la señalización** | el `EXT-X-DATERANGE` servido, el bloque campo por campo, y el asset-list crudo en un pliegue | `fetch()` a la playlist y al asset-list |
| los créditos | que todo es generado y que por eso no hay licencia de terceros | prosa |

**Dos secciones y no tres**, que es lo que el contrato pide: se descartó la de
`js/contrato.js` —298 líneas que explican el formato campo por campo— porque eso ya lo cuenta
`multiview-offer` y el argumento de esta página es el caso de uso.

**La copia argumenta el caso de uso y no que la transmisión tradicional esté mal.** La
apertura es *"A race is six stories at once / The picture can only be on one of them / So the
broadcast offers you the rest / Pick your car"*, y el encabezado de la sección dice *"The race
does not stop. A catalogue opens beside it."* En ningún lado la página dice que el realizador
elija mal: dice que la imagen es una sola, que es un hecho, y que el world feed sigue
exactamente como está para el cliente que nunca oyó hablar de nada de esto.

**Nada se escribió a mano que se pudiera leer.** Los tres lugares donde la tentación estaba:

- **La cantidad de cámaras del catálogo.** La fila dice *"A catalogue of N cameras"* con la N
  de `experience.views.length`, y se la vio pasar de 1 a 6 sin que nadie editara un archivo.
- **El tope de la grilla.** La página **no lo escribe**, y eso es una decisión y no un olvido:
  `MAX_BOXES` no está en la superficie que la librería exporta (`QualabsConcurrentHls` lleva
  `VERSION`, las dos clases, `DECODER_COUNT_PARAM`, `hlsConfig`, `attach` y `attachControls`),
  así que un número tipeado acá sería la página afirmando algo que no leyó. Lo que el lector
  recibe es qué pasa —las filas que no están arriba se ponen grises y la barra dice por qué—,
  y el número lo pone la barra, que lo interpola de su propia tabla.
- **Los segundos de la ventana.** Salen de `programRanges()`, y la suite ya asserta que
  `112`, `64` y `28` no están tipeados en ningún archivo de la demo fuera de `race.json` —
  eso incluye ahora `index.html` y `css/page.css`, que son los dos archivos nuevos que ese
  recorrido escanea.

**No se agregó un solo color.** Los siete tokens de `css/page.css` son los mismos nombres y
los mismos valores que los de `demo/multiview-offer/`, y las seis libreas de la carrera están
en la imagen y en ningún lado del stylesheet.

### Y que las dos secciones se llenan solas está medido, no afirmado

Una sección que lee el contrato y una sección con el catálogo tipeado adentro **se ven igual
mientras la red anda**. Se separan cortándola: [`control-de-lectura.py`](control-de-lectura.py)
corre la página dos veces, la segunda abortando el request del asset-list, y compara.

| | con el asset-list | sin él |
| --- | --- | --- |
| filas de la ventana | **1** | **0** |
| cámaras nombradas | las seis, de `CALDRIX, on-board` a `QUENTRA, trackside` | `[]` |
| la copia de la fila | *"A catalogue of 6 cameras, and the race carries on…"* | *(sin fila)* |
| niveles del bloque campo por campo | **4** | **0** |
| la línea de estado | `multi view offered · 6 feed(s) · nothing raised` | `the programme, nothing signalled` |
| tags impresos | **1** | **1** |
| pliegues del asset-list | **1** | **1**, diciendo que no se pudo leer |

Las dos últimas filas son las que hacen que el control valga: el tag y el pliegue **siguen ahí**
porque salen de la playlist, que no se cortó — o sea que lo que desapareció desapareció por
haberse cortado su fuente y no porque la página se haya caído entera. Verbatim en
[`salidas/las-secciones-se-leen.txt`](salidas/las-secciones-se-leen.txt).

## 2. La medición del selector, que es el R5 y la única de verificación alta

**Se hizo con las seis cámaras empaquetadas, o sea siete filas, y el veredicto está partido:
a 1907 entra con cero píxeles de desborde, y a 400×780 NO entra — el panel muestra 125 px de
331. Eso es una dependencia de `lib/` y se reporta acá; no se entró a la librería.** A los dos
anchos el documento no scrollea de costado.

El instrumento es el de la fase 11 —`H6/medir-el-pliegue.py`— reusado a propósito para que sus
números y éstos se puedan comparar: las mismas lecturas, tomadas igual. Está en
[`medir-el-selector.py`](medir-el-selector.py), y lo que se le agregó es la segunda propiedad,
que aquella task no tenía por qué medir.

**Qué mide, y cómo da distinto:**

| propiedad | cómo se mide | su control |
| --- | --- | --- |
| el documento no scrollea de costado | `documentElement.scrollWidth − clientWidth`, y lo mismo sobre `body` | se inserta un bloque 400 px más ancho que el viewport, se vuelve a leer, y **tiene que dar ROJO**; después se saca |
| cada fila del panel se lee entera | la intersección vertical del rectángulo de la fila con el **scrollport** del panel — no que el nodo exista, que también es cierto en el defecto | el estado `con-lugar`: con lugar en la grilla **no hay** línea del tope y el panel está en su cabecera. Una medición que estacionara todo panel abajo saldría acá |

**El control del ancho se vio en rojo en los dos anchos**: con el bloque adentro, `overflow`
pasa de 0 a **400 px** y la lectura dice `SCROLLS, as it must`; sacado el bloque, vuelve a 0.
Y el control del panel contestó al revés donde tenía que hacerlo: en `con-lugar` no hay línea
del tope y el título está entero.

### A 1907 entra, y entra completo

Con la grilla llena —cuatro cajas, cuatro `<video>` decodificando— el panel **muestra 331 px de
331: cero desborde**, y las siete filas están enteras: `World feed` bloqueada, CALDRIX, MARVOK y
NOCTEV tildadas, RUNTAK, PENTAV y QUENTRA en gris, más la línea *"4 boxes is what the screen
holds. Lower one to raise another."* entera. El título también.

### A 400×780 no entra, y ésta es la dependencia

| | `con-lugar` (una cámara arriba) | `grilla-llena` (cuatro cajas) |
| --- | ---: | ---: |
| el panel muestra | **125 px de 281** | **125 px de 331** |
| desborde | 156 px | **206 px** |
| `scrollTop` | 0 | **206** — el panel se auto-desplaza al pie |
| el título | entero | **0 px visibles** |
| la línea del tope | no hay, y está bien | **entera, 44,4 de 44,4** |
| las filas tildadas | CALDRIX entera, MARVOK 20,3 de 34, las otras cuatro a 0 | **las cuatro a 0 px** |
| las filas grises | — | QUENTRA y PENTAV enteras, RUNTAK 0,7 de 34 |

Lo que eso significa mirando la captura: con la grilla llena, **lo que un teléfono tiene en
pantalla son las dos últimas filas grises y la explicación del tope**. Las cuatro cámaras que
tiene arriba, y la fila del world feed, quedaron arriba del recorte.

**Y la mitad buena de esto no es casual, es el arreglo de la fase 11 aguantando con una fila
más.** El H6 de aquella fase existió para que la explicación del tope estuviera EN PANTALLA en
un teléfono y no solamente en el documento; con siete filas **sigue estando entera**, porque el
panel se auto-desplaza al pie. Lo que aquella fase no podía saber es que con la séptima fila el
auto-desplazamiento pasa a costar lo otro: ver qué cámaras tenés arriba.

**El veredicto, escrito:** **el catálogo de esta demo entra en el panel a 1907 y no entra a
400×780.** No es un defecto de esta página: el panel lo dibuja y lo dimensiona la librería
adentro del contenedor, recortado al alto de la imagen, y esta página no estiliza los controles
(ADR 0015). **Es una dependencia de `lib/` y queda reportada sin tocarla.** La demo se muestra
en escenario en una pantalla ancha, así que no bloquea la fase; lo que bloquea es decir que la
demo se ve bien en un teléfono, que con seis cámaras ya no es cierto del panel.

Verbatim en [`salidas/la-medicion-con-seis-camaras.txt`](salidas/la-medicion-con-seis-camaras.txt),
las lecturas crudas en
[`salidas/la-medicion-con-seis-camaras.json`](salidas/la-medicion-con-seis-camaras.json), y las
capturas en [`capturas/con-seis-camaras/`](capturas/con-seis-camaras/).

### La corrida anterior, con una cámara, quedó y vale como referencia

La misma página, sin editarle una línea, medida antes de que la T-08 empaquetara: **dos filas,
panel 111 px de 111, cero desborde a los dos anchos**. Es la referencia contra la que se lee lo
de arriba —el panel pasa de 111 a 331 de contenido porque le llegaron cinco filas, y el
recorte a 125 px del ancho de teléfono no se movió— y además es la prueba más directa de que
la sección se llena sola: entre las dos corridas no se tocó un archivo de la página, y la fila
pasó de decir *"A catalogue of 1 camera"* con una pastilla, a decir *"A catalogue of 6
cameras"* con seis. En
[`salidas/la-medicion-con-una-camara.txt`](salidas/la-medicion-con-una-camara.txt) y
[`capturas/con-una-camara/`](capturas/con-una-camara/).

### Y las capturas de la página entera valen por sí solas

Son el otro medio de la definición de terminado —*"la página se lee entera en los dos
anchos"*— y salen de la misma corrida: a 400 la página mide 6.645 px de alto y a 1907 mide
7.557, y **en las dos el ancho del documento es exactamente el del viewport**. En la de 400 se
ve la apertura, el player con su línea de estado, la fila de la ventana encendida con las seis
cámaras listadas por nombre, el tag con sus atributos uno por línea, el bloque campo por campo,
el pliegue del asset-list marcado `OPEN NOW`, y el pie con el logo.

## 3. Qué dice `CREDITS.md`

Una fila por pieza, con **qué es, cómo se produjo y con qué modelo**, y arriba de la tabla la
frase que la task pide que esté dicha y no supuesta:

> **Everything on screen and everything you hear was generated for this demo. There is no
> third-party material in it and therefore no licence to honour.**

Y el porqué de decirlo, que es el mismo argumento con el que la demo del partido dice que su
cama de cancha es grabación propia: las otras demos de este repositorio **sí** corren sobre las
películas de la Blender Foundation y **sí** las creditan, así que una página que no dijera nada
se leería como una de ésas con los créditos faltando.

Las cuatro filas: el programa (catorce clips de ocho segundos, `veo-3.1-fast-generate-001`, con
audio); cada cámara del catálogo (ocho clips, el mismo modelo, nivelada al mismo LUFS que el
programa para que agrandar sea un cambio de contenido y no de volumen); el relato (dos voces
repartidas por función, `gemini-2.5-flash-tts`, con `gemini-2.5-flash` escuchando cada línea de
vuelta en el portón); y las seis fichas de los autos, `generate_image` de `agy`, que no están en
pantalla pero son lo que hizo que los seis autos fueran los mismos seis en cada generación
independiente de esta carrera.

Cierra con dos cosas que no son adorno: **el prompt de cada pieza viaja con el generador que lo
mandó** (ADR 0061), y **las libreas inventadas se chequean y no se esperan** — el párrafo que
prohíbe el vestido comercial real, nombrando la alternativa en lugar de sólo la prohibición, va
idéntico en cada prompt de imagen y de video.

## 4. El README, y la sección que el otro no necesita

Las seis secciones del de `multiview-offer` más su encabezado, con la copia reescrita para
esta demo: qué es y cuál es el argumento, **Run it**, **What you will see**, **Below the
picture**, **What is on screen and whose it is**, **The files that decide things**, y **Test
it**.

Y la séptima, que es la que la task pide y la que la otra demo no necesita: **How the content
is regenerated**, entre *What is on screen* y *The files that decide things* — o sea antes de
los archivos y no al final, porque es lo que alguien con un clon nuevo necesita leer antes de
correr nada.

Dice tres cosas y cada una porque es verdad de esta demo y de ninguna otra del repositorio:

- **Cuesta plata, con la tabla y el total real.** US$16,80 el sondeo y el programa (T-02 +
  T-03), US$11,20 la primera cámara de a bordo (T-05), US$36,80 las cinco restantes (T-08):
  **US$64,80 la demo entera**. Y al lado, el número que importa para presupuestar y no está en
  ninguna de las cuatro tasks porque es la suma de las cuatro: **se lanzaron 81 generaciones y
  hay 62 clips en la demo.** Las diecinueve que faltan se miraron y se rechazaron.

  **Corrección del 2026-09-14, al cerrar la fase.** Esos tres números están cortos: a la
  etapa 1 le faltaban las doce generaciones (US$9,60) de las tres regeneraciones de la T-03,
  cuyos registros viven en subcarpetas de esa task. Lo real es **US$26,40 el sondeo y el
  programa**, **US$74,40 la demo entera**, y **93 generaciones lanzadas** contra 62 clips en
  la demo. El README ya quedó corregido con esos números; esta task escribió los otros.
- **Se corre a mano y no es parte de `run.sh`.** Un paso de contenido que cuesta plata es un
  paso que alguien tiene que decidir dar; `run.sh` empaqueta lo que hay en disco y para ahí.
- **El resultado no va a ser idéntico.** Son modelos generativos sin semilla expuesta: el mismo
  prompt devuelve otra carrera. Y el aviso que importa para presupuestar no es el de los
  dólares sino el del trabajo: cada clip se miró y varios se regeneraron, **mirar es el trabajo
  y generar no**.

Abajo va la cadena en orden, con los siete pasos y qué deja cada uno. No lleva las firmas de
los generadores adentro: **cada uno imprime su propio uso cuando se lo corre sin argumentos**,
que es lo que hace que el README no se despegue el día que un generador cambia de parámetros.

Y una cosa que el README dice porque un clon nuevo se la encuentra de frente: **el relato está
en git y el video no**. El audio pesa poco, así que regenerar la imagen no obliga a regenerar
las voces — y la contracara es que el relato describe la carrera que se generó la primera vez,
así que cambiar las tomas obliga a revisar las líneas, y la del anuncio tiene que seguir cayendo
en el segundo que abre la ventana, que es lo que mide `verificar-anuncio.mjs`.

## 5. Qué se copió y qué se reescribió

| | | |
| --- | --- | --- |
| **copiado byte por byte** | `brand/` (los cuatro archivos), `js/dom.js`, `js/opening.js` | md5 idéntico contra `multiview-offer`, abajo |
| **copiado y reescrita la prosa** | `js/recorrido.js`, `js/senalizacion.js` | la estructura y las lecturas son las mismas; lo que cambia es qué explican |
| **descartado** | `js/contrato.js` | 298 líneas de formato campo por campo |
| **nuevo** | `index.html`, `css/page.css`, `README.md`, `CREDITS.md` | el `index.html` y el `css` de la T-07 eran el mínimo para correr y se reemplazaron, que es lo que su comentario de cabecera decía que iba a pasar |
| **crecido** | `js/app.js` | las seis líneas del integrador y el arranque no se tocaron; lo que se le sacó son los ayudantes de la línea de estado, que se fueron a `js/recorrido.js`, y lo que se le puso son las tres llamadas a los módulos |

Los md5 de los dos lados, verbatim en
[`salidas/lo-copiado-byte-por-byte.txt`](salidas/lo-copiado-byte-por-byte.txt):

| archivo | md5, igual en las dos demos |
| --- | --- |
| `brand/favicon.svg` | `43b1a35092f5f6be2f24faa21845a85e` |
| `brand/fonts-embedded.css` | `9f266fbb787a76d4da0bc4b37f2ef1c6` |
| `brand/logo-qualabs-on-dark.svg` | `04f24d832b12a8bbc117ffed05582b43` |
| `brand/logo-qualabs.svg` | `47f31fce6b6353b1c43cd1087819a046` |
| `js/dom.js` | `43d8858e7334af10182c2407cad2ac18` |
| `js/opening.js` | `7af50b25790406d2c4048c733f8f1f73` |

**`brand/README.md` es la única excepción y se dice acá.** Se copió y después se le corrigieron
dos cosas: la columna *copied from*, que ahora apunta a `demo/multiview-offer/brand/`, y la
fecha, que decía 2026-09-11. Lo que la regla defiende es que **los archivos de marca** no se
forkeen —y eso está medido arriba, md5 por md5—; una procedencia que dice que este folder se
copió de un lugar del que no se copió, y un día en el que no se copió, es documentación falsa
en el único archivo del folder que existe para documentarlo.

**El bloque `WHAT AN INTEGRATOR WRITES` es el mismo código**, comprobado sacándole los
comentarios:

```
$ diff <(sed -n '/^\/\/ ====/,/^\/\/ ====/p' demo/multiview-offer/js/app.js | grep -v '^//') \
       <(sed -n '/^\/\/ ====/,/^\/\/ ====/p' demo/race-multiview/js/app.js  | grep -v '^//')
THE SIX LINES ARE IDENTICAL
```

**Y la línea de estado se movió de archivo sin cambiarle una palabra al texto que imprime.** Es
deliberado: las capturas de la T-07 dicen `t=28.0s`, `1 feed(s)` y `nothing raised`, y una línea
reformateada acá dejaría esas capturas ilegibles contra esta página. El wrapper de
`multiview-offer` escribe otro formato (`28.0 s · …`); se usó el de la T-07.

## 6. Lo que no se tocó

| chequeo | resultado |
| --- | --- |
| `git diff --stat -- lib/` | **vacío** |
| `npm test` | **193 pruebas, 193 pasan, 0 fallan** — la misma línea de base de la T-07 |
| `npm run check` | **verde**, salida 0 |
| los catorce recursos de la página | **200**, incluido el favicon que en la T-07 daba 404 — verbatim en [`salidas/los-recursos-de-la-pagina.txt`](salidas/los-recursos-de-la-pagina.txt) |

**Lo único que la consola imprime en una corrida limpia** es un
`[hls] error mediaError bufferSeekOverHole fatal: false` de hls.js, que es su propia
recuperación de un hueco de buffer y no viene de esta página: se registra acá para que el que
la abra no lo lea como algo nuevo. Ningún `pageerror` y ningún request fallido.

Ni `run.sh`, ni `server.mjs`, ni `package.json`, ni ninguna de las otras tres demos. Nada de
`content/`, `scripts/` ni `race.json`, que son de la T-08 y estaba adentro del mismo árbol al
mismo tiempo. El árbol queda modificado y **sin commitear**.

El server se sirvió en **8099** —el mismo que usó la T-07, y no 8080, 8081 ni 8082, que son de
Nicolás—, se lanzó guardando su PID y se bajó por ese PID.

## 7. Lo que esta task NO hizo

- **`lib/`.** El recorte del panel a 400 px es de la librería y se reporta en §2, no se
  arregla. Esta task no le tocó una línea.
- **Arreglar el panel angosto de ninguna otra manera.** Se podría haber estirado el panel desde
  el stylesheet de la página, y sería exactamente el defecto que el ADR 0015 prohíbe: cómo
  apila esa capa es un invariante del renderer y no una elección de quien escribe una página.
- **Nada sobre red.** Todo se sirvió local desde `server.mjs`, y el README lo dice en su propia
  sección en lugar de dejar que la grilla llena se lea como una medición de red.

## 8. Un hallazgo que se reporta y no se arregla

**`MAX_BOXES` no está en la superficie pública de la librería.** El export de
`lib/concurrent-hls.js` publica `VERSION`, las dos clases, `DECODER_COUNT_PARAM`, `hlsConfig`,
`attach` y `attachControls`, con un comentario que explica por qué las dos clases viajan juntas:
son nombres que un tercero tiene que reconocer. El tope de la grilla es de la misma clase de
cosa —una página que quiera explicar por qué una fila se puso gris lo necesita— y hoy no se
puede leer: la barra lo interpola adentro de la librería y lo escribe en su propio texto.

No se entró a `lib/` a agregarlo. La consecuencia en esta página es la de §1: el tope se
describe por lo que hace y no por su número, lo cual funciona y además no puede quedar viejo.
Queda como observación por si alguna vez una demo necesita afirmarlo.

## Resolución del hallazgo del selector (2026-09-14)

Nicolás lo cerró sin cambio y sin dependencia de `lib/`: **la demo está
pensada para una imagen de relación de aspecto 16:9 y nada más**, y el multi
view también. Que el panel quede recortado en un ancho de teléfono no es un
defecto a corregir: el panel vive adentro del alto de la imagen, y el alto de
la imagen lo fija el 16:9 del ancho que haya.

Queda escrito acá para que la medición de 400×780 no vuelva a leerse como un
pendiente. La medición sigue siendo válida como dato; lo que cambia es que el
escenario de esta demo no la incluye.
