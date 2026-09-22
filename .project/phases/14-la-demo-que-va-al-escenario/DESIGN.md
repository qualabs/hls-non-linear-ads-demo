# Diseño — fase 14: la demo que va al escenario

Esta fase se planifica de cero. La 14 anterior se abrió y se abandonó el mismo día porque
Apple comunicó que **en la presentación que se hace en sus oficinas no se puede mostrar
contenido de video ni de imagen generado por modelos de IA**, y aquella fase existía para
reemplazar el metraje de la Blender Foundation por creativos generados con Veo: su primer punto
era su premisa. La entrada del `LOG.md` del 2026-09-21 tiene el detalle.

**El alcance de la restricción importa y conviene dejarlo escrito acá, porque es fácil
aplicarlo de más: es sobre esa presentación, no sobre todo lo que este proyecto produce ni
sobre lo que la marca publica.** Las cuatro demos que ya existen siguen publicadas y siguen
sirviendo para lo suyo; lo que cambia es cómo se produce el contenido de la que se muestra
ahí.

Lo que Nicolás pidió en su lugar, textual:

> *"Volvamos a planificar de cero esta nueva fase pensando en algo nuevo… quiero dejar lo
> que ya estaba como está, porque son demos que igual pueden ser internas. Y quiero
> planificar ahora sí la demo de HLS como una subdemo nueva que puede tener incluso más de
> una página o más de un elemento, lo que sea, para cumplir con los requerimientos de
> Apple. Volvámoslo en una carpeta de demo nueva sin tocar las demos que ya tenemos."*

Así que el entregable es **una demo nueva, en su propia carpeta bajo `demo/`**, `stage-pair`,
con **tres páginas**. Las cuatro demos que existen no se tocan: quedan como demos internas.

---

## 1. Qué tiene que mostrar, y de dónde sale cada requisito

Los tres primeros salen de la reunión del 2026-09-21 con David Hassoun
(`.project/minute-2026-09-21-hassoun-apple-demo.md` y
`.project/acciones-demo-post-2026-09-21.md`).

1. **El argumento "así es hoy / así podría ser" en un cuadro.** Los dos panes al lado, uno
   con un hls.js de fábrica y otro con la librería, sobre la misma playlist. Es la pieza
   principal.
2. **Que se pueda inspeccionar con el network tab abierto**: el manifest, los tags
   DATERANGE, el pedido del asset-list y el JSON que vuelve.
3. **El control de cantidad de decodificadores.** Que se vea que el pedido lleva cuántos
   decodificadores tiene el dispositivo y que **la respuesta cambia**. La preferencia de David
   es que esté sobre el par. Lo que la respuesta cambia lo fija el ADR 0084 y es más fuerte de
   lo que él describió: **la capacidad degrada el formato del aviso, no el aviso**, así que el
   dispositivo de un solo decodificador recibe la misma campaña en el mismo layout, en imagen
   en lugar de en video, y no pierde la experiencia.
4. **El mismo espacio publicitario, monetizado sin tapar la pantalla.** Es el argumento que
   Nicolás fijó, textual: *"estás monetizando sin ocupar toda la pantalla"*. Del lado de
   fábrica, el interstitial común tapa el cuadro; del nuestro, **el recorrido pasa por las
   tres formas no lineales, una por break**.
5. **Y los avisos tienen que parecer avisos.** Las demos que existen usan películas de la
   Blender Foundation como creativo publicitario, y un tráiler de cine metido en una esquina
   no se lee como publicidad.

## 2. Qué sobrevive de lo que ya existe, y qué no

La procedencia declarada en cada `README.md` y `CREDITS.md`, cruzada contra la restricción:

| demo | primario | creativos | reutilizable |
| --- | --- | --- | --- |
| `compatibility-pair` | *Tears of Steel*, Blender | tres películas de Blender | sí, todo |
| `multiview-offer` | Blender | Blender | sí, todo |
| `hydration-break` | metraje amateur, licencia Pexels | **imágenes generadas** | sólo el primario |
| `race-multiview` | **Veo**, imagen y sonido, más locución TTS | — | no |

**Lo que se reusa no es material, es forma.** El mecanismo del par —dos players sobre la
misma playlist, uno de fábrica y uno con la librería— está construido y verificado desde la
fase 01 y vive en `demo/compatibility-pair/js/stock-player.js` y `js/contract-trace.js`. La
demo nueva **los copia**, que es lo que el ADR 0022 obliga: cada demo sirve su propia carpeta
como raíz de documentos, así que no hay import entre demos.

**Y la baja de `race-multiview` es la que más cuesta**, porque era el cierre de la
presentación: *"y esto se puede llevar más lejos"*. Su contenido es generado de punta a punta,
así que **no puede mostrarse ahí**. Sigue publicada y sigue siendo una demo válida en cualquier
otro lado —la restricción es de la presentación—, pero el cierre desaparece del guion, así que
**hay que reconstruirlo**, y esta fase lo reconstruye como su tercera página en lugar de como
una quinta demo (sección 9).

## 3. La decisión que gobierna todo: los creativos son SVG animado

La decidió Nicolás, y su razonamiento es el que la sostiene:

> *"vamos a hacer SVG animados y a través de esos SVG animados vamos a generar las
> publicidades. Esto sí está permitido porque lo que no permite es usar modelos de imágenes
> o modelos de vídeo para generar publicidad. Pero esto es generar SVG que básicamente es
> código."*

La restricción de Apple es sobre **la salida de un modelo generativo de imagen o de video**.
Un SVG es un documento de marcado con figuras, colores y animaciones declaradas: lo escribe
una persona o un programa, y lo dibuja el navegador. No es la salida de un modelo de imagen
ni de video, del mismo modo que no lo es una animación hecha en un editor vectorial ni el CSS
que dibuja la barra de progreso de este proyecto.

Está escrito como **ADR 0080**, que **supersede al ADR 0045**: aquel repartía la producción
de un creativo en tres caminos y el primero era *"lo pictórico se genera"*, que es
exactamente lo que dejó de estar disponible. Lo que el 0045 tenía de acertado y nunca falló
—*"la geometría y la tipografía se escriben a mano como SVG y se rasterizan con Chrome
headless, que da alfa real y dimensiones exactas"*— es lo que el 0080 conserva y extiende a
la pieza entera.

**Y es la primera vez que la restricción compra algo en lugar de costar.** Los creativos
dejan de depender de material de terceros, de licencias que hay que leer pieza por pieza y de
un chequeo de cuadro como el que la fase 08 tuvo que hacer —cinco de seis clips "libres de
uso" no pasaron, por escudo de federación, marca real o menores—. Un SVG que escribimos
nosotros no tiene marca real adentro salvo que se la pongamos.

### Lo que el SVG disuelve: el problema de la geometría

Toda la discusión de recortes que esta fase heredaba deja de existir. Las cajas que los
layouts declaran, medidas caja por caja sobre las señalizaciones que ya están en el
repositorio (`viewport` es inset top/right/bottom/left en porcentaje):

| caja | `viewport` | tamaño | relación |
| --- | --- | --- | --- |
| `cornerOverlay` | `"0 75 75 0"` | 25 % × 25 % | **16:9** |
| `squeezebackDoubleBox`, primario | `"25 50 25 0"` | 50 % × 50 % | **16:9** |
| `squeezebackDoubleBox`, aviso | `"25 0 25 50"` | 50 % × 50 % | **16:9** |
| `lowerThirdOverlay` (banner) | `"70 6.25 12.5 6.25"` | 87,5 % × 17,5 % | **8,89:1** |
| L de dos tiras, vertical | `"0 0 0 60"` | 40 % × 100 % | 0,71:1 |
| L de dos tiras, horizontal | `"60 0 0 0"` | 100 % × 40 % | 4,44:1 |
| L como backplate (ADR 0047) | `"0 0 0 0"` | cuadro entero | **16:9** |

Con material filmado, las tres relaciones que no son 16:9 obligan a recortar un clip de 16:9,
que es lo que el pedido `T-12` de la fase 01 reclamaba y lo que el ADR 0013 resuelve con
`object-fit: cover` a costa de comerse el 60 % del cuadro en la tira vertical. **Un vector no
tiene relación de aspecto que respetar**: se autora con el `viewBox` de la caja y se escala
sin resamplear.

### Tres campañas, una por marca, y cada una en tres formas

La aclaración de Nicolás, textual: *"es que son una campaña PARA CADA MARCA"*. Son **tres
marcas de fantasía —bebida, calzado y turismo—**, y cada una es una campaña con sus tres
formas. **Nueve piezas.** Está escrito como **ADR 0081**.

| forma | `viewBox` | dónde se usa | cómo viaja |
| --- | --- | --- | --- |
| **16:9** | 16:9 | el aviso lineal y el `squeezebackDoubleBox` | **las dos**: video e `image/svg+xml` |
| **banner** | 8,89:1 | el `lowerThirdOverlay` | **las dos** |
| **L backplate** | 16:9 con guarda | el `squeezebackLShape` (ADR 0047) | **las dos** |

**Las tres viajan en los dos medios, y eso no las convierte en seis formas**: es el mismo
dibujo servido como video o como imagen, y cuál de los dos llega lo decide la cantidad de
decodificadores declarados (ADR 0084, sección 6). El único uso que pide video sí o sí es el
aviso lineal, porque lo reproduce también el pane de fábrica.

Una identidad se decide una vez —la marca, qué vende, el claim, la paleta, la construcción del
objeto y qué hace el movimiento— y se autora tres veces. Que las tres formas se lean como la
misma campaña es lo que las hace parecer publicidad de verdad, y es lo que decidió entre esta
forma y tres piezas independientes; el ahorro de autoría vino después.

**La guarda del backplate** es la región que el contenido primario tapa cuando se encoge: el
ADR 0047 pone el aviso a cuadro entero en `zDepth` 0 y el primario encima, encogido y anclado
contra dos bordes, y la L se percibe porque el backplate asoma por los otros dos. En el SVG
eso significa dejar esa esquina vacía.

**Y la L sale gratis en sus dos formas.** El ADR 0012 dice que "LBox video" y "LBox image" son
el mismo layout con distinto `mediaType`. Acá son literalmente el mismo dibujo: el mismo SVG
servido como `image/svg+xml` en un escalón de la escalera y capturado a video en el otro.

### La primera campaña ya existe y está aprobada

**ZUMBRA**, gaseosa cítrica, claim *"CITRUS, OUT LOUD"*, en su forma 16:9. Nicolás aprobó la
identidad y pidió un solo ajuste —la tapa de la lata—, que está aplicado y también aprobado.
Vive en `tasks/T-04/`.

No se rehace ni se redefine: **es la referencia de estructura de las otras dos**, no porque se
copie el dibujo sino porque fija qué secciones tiene el archivo, qué explica su cabecera y
cómo se reparte el movimiento. Su cabecera ya resuelve por escrito las tres trampas de la
sección 5 —el bucle sin fase visible, la pila tipográfica del sistema sin `@font-face`, y la
animación declarativa sin una línea de script—, así que las otras dos no las vuelven a pensar.

### Lo que un SVG no tiene: audio

No lo tiene, y no hay forma de que lo tenga. Donde haga falta sonido —el aviso lineal, que
reemplaza el programa— se agrega en el paso de captura a video. Los elementos concurrentes
salen en silencio, que ya es el default del proyecto: el `volume` ausente es silencio
(ADR 0014).

## 4. El puente a video, y por qué el lineal lo necesita sí o sí

**El aviso lineal lo reproducen los dos panes**, y el de fábrica es un hls.js sin modificar
que recibe un `X-ASSET-LIST` con una `URI` a un `.m3u8` y la reproduce como medio. No sabe qué
es un SVG y no va a saberlo. **Si el lineal no se ve del lado de fábrica, se cae el argumento
de la demo**, que es precisamente que del otro lado el programa se reemplaza.

Así que hace falta un paso de pipeline: **animar el SVG y capturarlo a video**. Navegador
headless que abre el SVG a tamaño fijo, un cuadro por tick contra un reloj controlado,
`ffmpeg` que arma el video, y el empaquetado a HLS con el mismo empaquetador que las otras
demos ya usan.

**Y el puente se escribe una vez y corre muchas**, que es lo que lo hace barato: produce la
variante de video de las tres formas de cada campaña —nueve corridas—, **el programa de la
carrera de la tercera página** y **las cámaras de su catálogo**. Nueve piezas de autoría, y el
resto son corridas de un script.

### Dos lecciones medidas que el puente hereda de la producción de ZUMBRA

**Un SVG mal formado no se dibuja y no avisa.** Una tabla markdown adentro de un comentario
XML rompe el documento entero: el separador `| --- |` contiene `--`, que es ilegal dentro de
`<!-- -->`. Chrome no dibuja nada, la captura sale negra y **no hay ningún error**. La
mitigación probada es parsear el XML —`xml.dom.minidom.parse`— antes de capturar. Vale para
todo el pipeline de creativos, y no es un caso raro: este proyecto usa cabeceras largas como
documentación, y ahí es exactamente donde uno escribe una tabla.

**Capturar al tamaño del viewport no mide una animación.** Medido sobre ZUMBRA: a 800 px de
ancho un creativo de 1920 se reduce 2,4×, y las burbujas mueven **entre 0,5 y 3 píxeles de
383.200 comparados**, así que dos capturas seguidas dan el mismo hash por casualidad y el
positivo sale "2 de 3". **A 1920×1080 el mismo par mueve 14.620.** La consecuencia es una
regla y no un consejo: **toda verificación de animación captura a la resolución nativa del
creativo**, y un "md5 igual" a resolución reducida no prueba nada. Le pega directo al puente y
también a la verificación de la sección 5, que tiene el mismo modo de fallar.

## 5. La hipótesis que decide si el escalón de un decodificador se mueve

Es la que sostiene el lado de imagen del ADR 0084, y **puede que no haga falta tocar la SDK.** En `lib/renderer.js:209` está:

```js
export const isImage = (mediaType) => /^image\//i.test(mediaType || '');
```

`"image/svg+xml"` matchea ese regex. Y el mismo predicado está, escrito aparte, en
`lib/media.js`, que para un `image/*` hace `node.src = uri` sobre el `<img>` que `createNode`
ya creó (`lib/renderer.js:699`, `document.createElement(image ? 'img' : 'video')`). O sea que
un SVG declarado con ese `mediaType` **ya entraría por el camino de imagen**, sin una línea de
librería. Y las animaciones **declarativas** —SMIL y CSS— corren adentro de un `<img>`; lo que
no corre ahí es JavaScript.

**Nada de esto está verificado contra el renderizador real, así que es una hipótesis y no un
hecho.** La T-02 la verifica **temprano**, y su verdicto decide si las variantes de imagen se
mueven o son piezas fijas. Y en la misma pasada verifica la premisa que sostiene la escalera
entera: **que un elemento de imagen no consume un decodificador de video**.

**La verificación necesita controles**, porque el instrumento natural —dos capturas en dos
instantes, y comparar— pasa igual si la comparación está rota, y ya se sabe **por medición**
que a resolución reducida da un falso negativo. Los controles, y son tres cosas distintas que
hay que poder distinguir:

- **Un SVG sin ninguna animación** tiene que dar dos capturas **idénticas**. Si también da
  distintas, lo que se midió es el instrumento.
- **Un SVG animado por JavaScript** tiene que dar dos capturas idénticas, porque el script no
  corre adentro de un `<img>`. Si da distintas, la hipótesis está mal en la otra dirección y
  eso cambia lo que se puede autorar.
- **El mismo SVG animado por SMIL/CSS** tiene que dar dos capturas **distintas**. Es el caso
  positivo, y **se captura a resolución nativa**, por la lección de la sección 4.

Y se mide **adentro de la composición real**, con la librería dibujando el elemento en su
caja, no con el SVG abierto suelto en una pestaña: lo que hay que saber es qué pasa por el
camino que el código toma, incluido el `object-fit: cover` sobre un `<img>` de SVG.

### Dos cosas más que la T-02 tiene que contestar en la misma pasada

**Las fuentes externas no cargan adentro de un `<img>`.** Un SVG referenciado por `src` se
dibuja aislado y no trae recursos de red, así que un `@font-face` a un archivo de fuente no va
a resolver y el texto sale en otra tipografía o no sale. ZUMBRA ya está autorada asumiendo
esto —una pila del sistema, Helvetica / Arial / Liberation Sans, métricamente compatibles
entre sí para que el bloque de texto ocupe el mismo ancho en los tres sistemas—, así que lo
que la task hace es **confirmar el supuesto sobre el que ya se dibujó**, no descubrirlo.

**`bringAhead` construye el nodo tres segundos antes de que se vea, a `opacity: 0`.** Para un
video eso es preparación; para un SVG con SMIL significa que **el reloj de la animación
arranca antes de que el elemento aparezca**. ZUMBRA ya está autorada contra eso: burbujas con
`begin` negativo y fases repartidas dentro del mismo ciclo de 3 s, y un anillo de doce rayos
que gira 30° en 6 s, con lo que a los 6 s el dibujo es idéntico al inicial. O sea que el bucle
**no tiene momento feo** y da igual en qué fase se lo mire. La task mide si el adelanto existe
y cuánto vale, para que las otras dos campañas se autoren sabiéndolo.

### La escalera de salida si la hipótesis se cae, y por qué es gratis

Ninguna rama entra a `lib/`.

1. **La hipótesis se confirma** → las variantes de imagen del escalón de un decodificador se
   mueven. Cuesta cero.
2. **SMIL/CSS no anima adentro de `<img>`** → esas variantes son piezas fijas, el mismo dibujo
   sin movimiento. Se conservan la geometría y la nitidez, y **el argumento no se cae**: un
   aviso fijo sigue siendo publicidad no lineal sobre el programa, que es lo que el escalón
   tiene que demostrar.

**Y no hay una tercera rama.** Capturar esa variante a video es exactamente lo que el escalón de
un decodificador no puede hacer, así que la salida que antes existía —subir esa forma un escalón—
dejó de ser una salida cuando la variante de imagen pasó a ser el punto (ADR 0084). Lo que la
hipótesis decide es si ese escalón se ve en movimiento o quieto, no si existe.

Si apareciera algo que obligue a entrar a la librería, **es una dependencia y se reporta**: se
para, se escribe qué hace falta y por qué, y no se entra.

## 6. La escalera de decodificadores, y cómo se sirve sin servidor

Está escrito como **ADR 0083**. El parámetro `qa-decoder-count` **viaja de verdad** en la
petición del asset-list, y la página apunta a un asset-list estático distinto por valor.
Textual de Nicolás: *"no quiero es hacer un servidor del otro lado para responder esto, va a
ser simplemente casi que un if"*. **Es el único camino que sobrevive a la publicación**,
porque las demos se sirven como archivos estáticos en GCS y no hay nada del otro lado que
pueda leer una query.

### Lo que el código ya hace, leído y no recordado

- `lib/signalling.js:629` define `DECODER_COUNT_PARAM = 'qa-decoder-count'`, con el argumento
  escrito de por qué no empieza con `_HLS_` y por qué lleva el namespace del vendor.
- `assetListUrl` agrega el parámetro, o **no agrega nada** si el valor es ausente, cero,
  negativo, fraccionario o no numérico (`usableDecoderCount`).
- `decoderCount` se lee **una sola vez**, al crear la señalización (`createSignalling`,
  `lib/signalling.js:687`, llamada desde `lib/concurrent-hls.js:260`). **Cambiarlo en vivo
  rearma el player**, y eso no es un rodeo: es lo que el contrato ya implica, porque lo que el
  valor puede tener de equivocado es una afirmación del integrador y no una por break.

### Tres posiciones, y la del medio es la que más dice

| posición | qué pasa en la petición | qué responde la demo |
| --- | --- | --- |
| **sin declarar** | la URI sale **exactamente igual** que para un integrador que nunca oyó de la opción | la respuesta rica |
| **1** | `?qa-decoder-count=1` | la respuesta magra |
| **2** | `?qa-decoder-count=2` | la respuesta rica |

La posición "sin declarar" es la que hace el punto en el network tab: **la misma petición, con
y sin el parámetro**. Y que "sin declarar" y "2" devuelvan lo mismo es verdad y no una
simplificación: un ad server que no recibe el dato contesta con su default.

**No hay una posición 3 ni una 4, y no hay que fabricarla.** Ningún layout de esta demo pide
más de dos decodificadores de video: el primario más un elemento de aviso.

**Y lo que cambia entre la respuesta rica y la magra es el medio del creativo y nada más**
(ADR 0084): el mismo layout, la misma campaña, la misma duración, el mismo dibujo, servido como
video o como `image/svg+xml`. De ahí sale la cuenta de decodificadores, y **se apoya en una
premisa que la T-02 verifica en lugar de asumir**: que un elemento de imagen no consume un
decodificador de video. Si la respuesta magra pidiera dos, la escalera no tendría escalones.

### Cómo se implementa, que es el "if"

El script de señalización escribe **una playlist por escalón de respuesta**, la rica y la
magra, cada una con sus `X-ASSET-LIST` apuntando a su juego de asset-lists estáticos. El
control elige la playlist y el valor que se le pasa a `attach()`, y rearma el player.

**Y la página lo dice.** No hay servidor del otro lado, y una demo que dejara creer que sí lo
hay estaría afirmando algo que no leyó.

## 7. El contenido primario: SPARKS, de Netflix Open Content

Lo eligió Nicolás. Los datos del relevamiento, que son de dónde salen las decisiones de
empaquetado y no un adorno:

| | |
| --- | --- |
| archivo | `TechblogAssets/Sparks/encodes/Sparks_4096x2160_5994fps_SDR.mp4` |
| tamaño | 419.744.507 B (0,39 GB) |
| duración | **229,9 s**, y los créditos arrancan en **199,0 s** |
| video | H.264 Main L5.1, yuv420p, 4096×2160 a 59,94, **SDR** |
| audio | AAC-HE 2.0, 48 k |
| licencia | **CC BY 4.0** |

**Que sea SDR es lo que lo hace barato**: no hay que tone-mapear, que es el paso que convierte
una transcodificación en un problema de color.

**El programa de la demo es el tramo previo a los créditos**, y dónde empiezan está medido y
no asumido: la luminancia media arranca el fundido a negro en **193,0 s**, toca negro pleno en
**198,0 s** y sube a un valor constante en **199,0 s**, que es la placa fija de SPARKS. El corte
va en **198,0 s**, entero y con su fundido, y de ahí salen los offsets de los tres breaks. La cadencia del empaquetado sale de la fuente, que es lo
que manda el ADR 0059: 59,94 o su mitad exacta, nunca un resample a otra cadencia.

### La atribución no está especificada, así que se redacta contra el default de CC BY 4.0

**Ni el sitio ni el bucket dicen cómo hay que atribuir.** Eso no es permiso para no hacerlo:
es que hay que armarla con lo que la licencia pide por defecto, y eso son cinco cosas —el
creador, el aviso de copyright, el aviso de licencia con su enlace, el enlace al material, y
**indicar que se modificó**—. Lo último es lo que se olvida y acá es seguro que aplica: la
demo recorta, recodifica y reempaqueta.

### Meridian está descartado, y conviene decir por qué

Hay un `TechblogAssets/Meridian/meridian_license.txt` vivo que declara **CC BY-NC-ND**, lo que
**contradice el CC BY 4.0 que el sitio anuncia para el conjunto**. Sin derivados y sin uso
comercial es exactamente lo contrario de lo que esta demo hace con el material.

Queda escrito acá para que nadie lo reconsidere sin saberlo: no se descartó por gusto, se
descartó porque su propio archivo de licencia dice otra cosa que la portada, y **cuando dos
fuentes de licencia se contradicen manda la más restrictiva que esté pegada al archivo**.

## 8. El recorrido del par: tres breaks, y las tres formas

Nicolás lo pidió explícito: del lado nuestro el recorrido pasa por **todas las formas no
lineales, una por break** —*"uno side by side, otro L-shape, otro banner"*—. Con eso las tres
formas de la biblioteca (sección 3) y los tres breaks se mapean uno a uno.

| break | rica (sin declarar, o 2) | magra (1) | qué argumenta el escalón |
| --- | --- | --- | --- |
| **A — side by side** | `squeezebackDoubleBox` con el creativo 16:9 **en video** | el **mismo** creativo 16:9 como `image/svg+xml` | media pantalla de aviso se paga con un decodificador o con ninguno |
| **B — L-shape** | `squeezebackLShape` con el backplate **en video** | el **mismo** backplate como `image/svg+xml` | el mismo layout y el mismo dibujo, dos `mediaType` (ADR 0012) |
| **C — banner** | `lowerThirdOverlay` con el banner **en video** | el **mismo** banner como `image/svg+xml` | la forma más chica también existe en los dos medios |

**Los tres breaks responden distinto al control, y ninguno finge.** Es lo que la regla del ADR
0084 compró: el primer reparto que se escribió dejaba el break del banner devolviendo lo mismo
en los dos escalones, porque un banner ya era una imagen, y bajaba el break A al aviso lineal,
o sea que el dispositivo de un decodificador terminaba viendo la pantalla tapada — justo lo que
esta tecnología existe para evitar.

**Y ahí hay algo que cambió respecto de lo que David describió.** Él quería el control sobre el
par *"where the fallback to the other side's experience is visible"*, y con esta regla **nuestro
cliente ya no baja nunca a la experiencia del otro lado**: con un decodificador sigue mostrando
publicidad no lineal, en imagen. Lo que se ve en su lugar es más fuerte y está a la vista en los
dos escalones, no en uno: **el pane de fábrica reemplaza el programa en los tres breaks,
siempre**, así que la experiencia del cliente de mercado está permanentemente en el cuadro de al
lado. Lo que el control muestra pasa a ser otra cosa, y es la que sube de nivel la demo: **la
capacidad del dispositivo degrada el formato del aviso, no el aviso**.

### Un lineal por break, con la duración de su break

Está escrito como **ADR 0082**. En `compatibility-pair` el repliegue lineal es **uno solo
compartido**: los cinco DATERANGE de clase Apple apuntan al mismo `asset-list-linear.json`,
con `adA` y `DURATION` 12,0, contra un quinto break concurrente que declara
`PLANNED-DURATION=48`. De ahí sale **el tramo invertido**: durante 12 de esos 48 segundos la
comparación queda al revés. La fase 03 lo aceptó y lo explicó porque arreglarlo pedía tocar el
`START-DATE` compartido del ADR 0007.

Acá no hay nada que aceptar: cada break trae su propio asset-list lineal, con su duración y
con el creativo de su campaña. Los dos panes entran y salen del break en el mismo segundo, y
**el tramo invertido no existe**, sin tocar el `START-DATE` compartido.

**Una campaña por break**, que es lo que hace que tres breaks seguidos no parezcan el mismo
aviso repetido, y lo que justifica que las campañas sean tres.

## 9. Tres páginas

Nicolás habilitó más de una página y después fijó cuáles son tres. Las tres comparten la
carpeta, el contenido de los creativos y la hoja de estilo; lo que cambia es qué argumenta
cada una.

### `index.html` — los dos players lado a lado

La pieza principal. El mismo espacio publicitario en los dos panes: del lado de fábrica el
interstitial común, que tapa la pantalla; del nuestro, el recorrido de la sección 8. Lleva el
control de decodificadores, que es donde David lo quiere.

Los dos panes quedan **idénticos en todo salvo en qué muestran durante el break**, que es el
criterio que la fase 04 fijó: el mismo cromo, la misma barra, el mismo reloj, ninguna marca
sobre la imagen.

### `inspect.html` — el mismo contenido con un solo player, el nuestro

Es donde David abre el network tab: con un player solo se sigue mucho más fácil qué está
pasando. Al lado del player va lo que hay que poder leer en cámara, el fragmento de playlist
con los DATERANGE y el asset-list que se resolvió.

**Lo que muestra se lee, no se transcribe.** Es la línea que la fase 12 fijó: la sección que
muestra el tag lo lee de la playlist que el player está tocando. Una página que copiara el
JSON a mano estaría afirmando algo que no leyó.

Esta página contesta además una pregunta que estaba abierta: el documento de acciones registra
que **no se puede determinar desde el transcript** cuál de las demos existentes es la "demo
simple para el network tab" que David quiere aparte, porque se señalaron en pantalla
compartida. En lugar de arrastrarla, la demo nueva la define.

### `race.html` — el multiview de la carrera, en SVG, con los avisos antes

Es el cierre, y existe porque el cierre que había —`race-multiview`— está caído entero por la
restricción. Nicolás lo pidió así: una carrera simple hecha en SVG, autos, pista, competencia,
**una cámara por auto**, y **los mismos creativos no lineales antes de que se abra la ventana
de multiview**. Textual: *"de esta forma tenemos una 3ra demo súper potente con todo lo que
creamos junto"*.

**Va después de las dos primeras**, dentro de la misma fase.

**Y no revive lo que David bajó.** Él descartó `multiview-offer` —la que mezcla aviso y multi
view en una página— con el argumento de que *"the racing one's far better than this"*. Lo que
esta página hace no es traer de vuelta aquella: es **reconstruir la de la carrera**, que es la
que él eligió como cierre. Que además lleve los avisos adelante es lo que la vuelve más fuerte
que las dos por separado, con dos minutos de demo para todo.

**La separación que David pidió sigue visible**, y mejor que antes. Él pidió que la
interacción de quien mira quede separada de la señalización de publicidad y que la separación
se vea en el código y en las librerías; son dos clases hermanas (ADR 0063), y en el árbol son
dos páginas distintas: el par no lleva multi view, y esta muestra primero la publicidad y
después la ventana, así que se ve dónde termina una cosa y empieza la otra.

#### Las cámaras son la misma escena enmarcada distinto, y no la misma animación recoloreada

La instrucción de abaratarlo fue: *"lo hacemos la misma para todos y después cambiamos el
color del auto"*. **Recolorear solo no alcanza**, y el motivo es que se ve: seis clips que son
el mismo movimiento con otro color se leen como seis copias, no como seis cámaras, y una fila
del selector deja de significar algo.

**En SVG el arreglo cuesta casi nada, y es esta:** una sola escena, y **cada cámara enmarca
una región distinta de esa escena, siguiendo a su auto**. Es cambiar un rectángulo, no dibujar
otra escena. Cada cámara ve a los demás autos entrar y salir de cuadro en momentos distintos,
que es exactamente lo que hace que se lean como cámaras de la misma carrera —que era el R1 de
la fase 13, el riesgo número uno de aquella producción, y acá se resuelve por construcción en
lugar de por prompt.

**El mecanismo lo elige la task**, y el camino seguro es animar el `transform` de un grupo en
lugar de el `viewBox` de la raíz, porque que `viewBox` anime no está verificado acá y lo otro
sí es lo que ya hace ZUMBRA. **Si al implementarlo resulta más caro que lo que dice este
párrafo, eso es un hallazgo y se reporta**: el que lo escribió no lo midió.

**La alternativa —sólo el color— queda descartada por la razón de arriba**, no por costo.

#### Las cámaras van a video, y eso lo decide el foco de audio

El programa de la carrera **tiene que ser video de todos modos**, porque es el contenido
primario del player y eso es un `.m3u8`. Con el puente ya corriendo para él, capturar las
cámaras es el mismo comando con otro encuadre: el costo marginal es tiempo de máquina, no
autoría.

Y hay una razón que decide, más allá del costo: **el ADR 0027 dice que enfocable es una caja
de video del aviso y nada más**, así que una cámara servida como imagen **no toma el foco de
audio**. Agrandar una cámara y quedarse adentro de ese auto era el pago que `race-multiview`
tenía y las otras demos no; con feeds de imagen ese beat no existe.

El tope de cajas en pantalla es cuatro (ADR 0066) **y el programa es una de esas cuatro**, así
que el máximo son tres cámaras más el primario: **cuatro elementos**, por debajo del sobre que
la T-01 de la fase 01 midió, que es de cinco elementos a 1280×720 y 30 fps.

**Y no lleva audio.** Un SVG no tiene sonido, así que cualquier ruido de carrera habría que
producirlo en el paso de captura, y Nicolás decidió que por ahora va todo mudo. El foco de audio
sigue funcionando porque los feeds son video: el mecanismo está, sencillamente no suena nada.

#### El tamaño del catálogo

No se fija acá un número de autos. El criterio sí: **la oferta tiene que superar el tope de
cuatro de la grilla**, porque si todo lo ofrecido entra en pantalla a la vez, elegir no
significa nada y el ADR 0066 no tiene qué demostrar. Y los colores tienen que distinguirse en
una caja de media pantalla, que es el criterio que la fase 13 ya usó.

## 10. Lo que se consideró y se descartó

| alternativa | por qué se descarta |
| --- | --- |
| Arreglar `compatibility-pair` en lugar de hacer una demo nueva | Nicolás pidió lo contrario, y con razón: es material interno que ya funciona y está publicado, y cambiarle creativos, lineal por break y recorrido es reescribirla entera con el riesgo de romper lo que anda. |
| Reusar el metraje de Blender como creativo publicitario | Es lo que hay hoy y es exactamente lo que David pidió cambiar: un tráiler de cine no se lee como un aviso. |
| Una sola campaña para los tres breaks | Tres breaks seguidos con el mismo aviso no se leen como publicidad sino como un defecto. |
| Un aviso de Qualabs como creativo | Nicolás lo propuso en la reunión. Como creativo de las tres formas mete la marca propia adentro del cuadro, que es justo lo que la fase 04 sacó. Si se quiere, es un SVG más y se decide mirando uno. |
| Que el control de decodificadores lo resuelva un servidor | Nicolás lo decidió: sin servidor. Y es lo único que sobrevive a la publicación en GCS. |
| Una posición 3 o 4 en el control | Ningún layout de esta demo pide más de dos decodificadores de video. |
| Inventarle una variante al break del banner para que el control "haga algo" en los tres | Sería una afirmación falsa con forma de demo. |
| Una sola página con un modo | Un modo es un estado que hay que dejar puesto antes de una demo en vivo; una URL no. |
| Una quinta demo para el multiview de la carrera | Nicolás pidió que estuviera *"todo lo que creamos junto"*, y comparte contenido, creativos y hoja de estilo con las otras dos páginas. Una carpeta aparte duplicaría las tres cosas. |
| Las cámaras como la misma animación recoloreada | Se leen como seis copias y no como seis cámaras. Enmarcar la misma escena distinto cuesta casi lo mismo y resuelve por construcción el riesgo número uno de la fase 13. |
| Las cámaras como `image/svg+xml` | El ADR 0027 deja fuera del foco de audio a todo lo que no sea una caja de video, así que se perdería el beat de agrandar una cámara y escuchar ese auto. El puente a video ya corre para el programa. |
| Rasterizar los SVG a PNG de entrada | Pierde el movimiento y la nitidez sin ganar nada, salvo que la hipótesis de la sección 5 se caiga — y en ese caso es la salida 2 de la escalera, no el plan. |
| El primer reparto de la escalera: un break bajando al lineal, otro cambiando de `mediaType` y el del banner devolviendo lo mismo | Degradaba de forma desigual, dejaba un tercio del recorrido donde el control no cambiaba nada, y en otro tercio mandaba al dispositivo de un decodificador a ver la pantalla tapada, que es lo que esta tecnología existe para evitar (ADR 0084). |
| Meridian como contenido primario | Su propio archivo de licencia declara CC BY-NC-ND, que contradice el CC BY 4.0 del sitio. |

## 11. Las decisiones que esta fase toma, para el que las busque

**Cuatro están escritas como ADR, y se escribieron al abrir y no al cerrar**, porque son las
que alguien podría deshacer sin saber por qué son así:

- **ADR 0080 — cada demo resuelve su propio contenido, y el de la que va a la presentación se
  escribe como SVG animado.** `scope: project`. **Supersede al ADR 0045**, que era una receta
  única para todo el proyecto y cuyo primer camino —*"lo pictórico se genera"*— es exactamente
  lo que dejó de estar disponible en esa presentación.
- **ADR 0081 — una identidad por campaña, autorada tres veces con tres `viewBox`.**
  `scope: project`.
- **ADR 0082 — un asset-list lineal por break, con la duración de su break.**
  `scope: project`.
- **ADR 0083 — el parámetro de decodificadores viaja de verdad y la respuesta está horneada
  por valor.** `scope: phase-14`. Es **cómo** viaja el dato y cómo se sirve la respuesta.
- **ADR 0084 — la capacidad del dispositivo degrada el formato del aviso y no el aviso.**
  `scope: project`. Es **qué** contiene cada respuesta, que es otra pregunta: el 0083 es del
  transporte y el 0084 es del ad stack, así que el día que haya un servidor de verdad el 0083
  queda superseded y éste sigue en pie tal cual.

**Las que todavía no son ADR, y qué las cierra:**

- **La demo son tres páginas, y el multiview vuelve como la tercera.** Es alcance, no
  arquitectura: no cambia cómo se señaliza ni cómo se dibuja nada.
- **Las cámaras son la misma escena enmarcada distinto, y van a video.** Se escribirá como ADR
  **cuando la T-09 la haya construido**, porque su consecuencia principal —que se lean como
  cámaras de la misma carrera— es una afirmación que hoy no está medida y el ADR tendría que
  citarla.
- **La cadencia y el tamaño del empaquetado de SPARKS.** Sale del ADR 0059 aplicado a una
  fuente nueva; si la T-03 tiene que apartarse de él, eso sí es un ADR y se escribe antes.

## 12. Lo que queda abierto, y a quién le toca

- **Cuántos autos.** La T-09 lo fija con el criterio de la sección 9; si Nicolás tiene un
  número, lo dice y se acabó.

**Y una que estaba abierta y ya no lo está: el audio.** Nicolás decidió que **por ahora va todo
sin audio**. Las cámaras salen mudas y la página no promete audio por cámara. El foco de audio
sigue funcionando porque los feeds son video —así que el mecanismo no se pierde—, sencillamente
no suena nada.

## 13. La fecha, y por qué esta fase no tiene

Nicolás la sacó del alcance, textual: *"sobre la fecha olvidate porque eso lo tengo control yo
y no pasa nada"*. Así que esta fase no se planifica contra un deadline, no lleva timeline y no
hace supuestos sobre la ventana de grabación ni sobre el 7 de octubre. Lo que ordena las tasks
es la dependencia técnica entre ellas.

Se escribe acá porque la ausencia de una sección que todas las fases anteriores tienen se lee
como un olvido, y no lo es.
