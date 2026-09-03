# Fase 01: POC funcional en web con hls.js

Objetivo de la fase, fijado por Nicolás: **tener un POC funcional en web
usando hls.js**. Este documento explora qué hace falta para eso, qué se
decide ahora, qué hay que medir antes de comprometerse, y qué sigue sin
respuesta.

Sobre la fecha: la fase corre contra el **21 de septiembre**, que es el
hito del primer draft andando y del sync con David según la minuta. Esa
fecha está en disputa con el documento de requerimientos (dice 1 de
septiembre) y la disputa sigue abierta, tal como la registra el
`PROJECT.md`. Hoy es 3 de septiembre, así que quedan 18 días hasta el
21 y 25 hasta la ventana de grabación del 28 al 30.

---

## 1. Qué es "publicidad no lineal en HLS" en este POC, en concreto

La publicidad no lineal es la que convive con el contenido en lugar de
reemplazarlo: un overlay en una esquina, una banda inferior, un
squeezeback donde el contenido se achica y el aviso ocupa el espacio que
queda, o una grilla de fuentes simultáneas. Lo opuesto es la publicidad
lineal, donde el aviso interrumpe y el contenido no se ve.

El mecanismo que este proyecto usa para señalizarla en HLS tiene tres
piezas, y las tres salen del documento de requerimientos de David, que
está citado en el `PROJECT.md`.

**Pieza 1: el tag `EXT-X-DATERANGE` en la media playlist**, con una
clase propia en lugar de la de Apple. La forma exacta, textual del
documento de requerimientos:

```
#EXT-X-DATERANGE:ID="AD-1-0",CLASS="com.qualabs.hls.concurrentInterstitial",
START-DATE="2019-01-01T00:12:10.939Z",END-DATE="2019-01-01T00:12:10.939Z",
X-RESUME-OFFSET=0,X-SNAP="OUT,IN",X-ASSET-LIST="https://sgai.example.org/asset-list",
X-RESTRICT="SKIP",PLANNED-DURATION=24,SCTE35-OUT=0xFC30...
```

La clase concurrente extiende a `com.apple.hls.interstitial`, que es la
clase que Apple define para los HLS Interstitials. La idea de ese diseño
es que un player que no conoce la clase concurrente ignore el tag, y que
un player que sí la conoce obtenga la experiencia enriquecida.

**Pieza 2: el asset-list JSON** al que apunta `X-ASSET-LIST`. Es el
mismo flujo de interstitials de siempre: el player pide ese JSON y ahí
están los assets a reproducir. La extensión consiste en agregarle, por
asset, un bloque `X-AD-CREATIVE-SIGNALING` con los datos de layout.

**Pieza 3: el layout**, que es lo que hace que la experiencia sea
concurrente y no un corte publicitario. La herramienta de SVTA que el
`PROJECT.md` nombra como referencia (`https://www.svta.org/wp-content/nlag/v4/`)
genera exactamente ese JSON. Se inspeccionó su código el 2026-09-03
(`app.js`, unos 40 KB, servido en esa misma ruta) y esta es la
estructura que emite, verbatim de la función que arma el output:

```json
{
  "ASSETS": [{
    "URI": "[PATH TO ASSET]",
    "DURATION": 15.015,
    "X-AD-CREATIVE-SIGNALING": {
      "version": 2,
      "type": "slot",
      "payload": [{
        "type": "cornerOverlay",
        "start": 0.0,
        "duration": 15.015,
        "layout": {
          "primaryContent": { "zDepth": 0, "volume": 100, "viewport": "0 0 0 0" },
          "assets": [
            { "id": "...", "type": "video/mp4", "uri": "...",
              "viewport": "0 75 75 0", "zDepth": 1 }
          ]
        }
      }]
    }
  }]
}
```

Dos detalles del modelo de datos que importan para el diseño y que no
son evidentes leyendo el documento de requerimientos:

- **`viewport` es un string de cuatro porcentajes en el orden top,
  right, bottom, left**, y son *insets*, es decir cuánto se recorta cada
  borde respecto del área del player. Lo dice el comentario de la
  herramienta: "Viewport values are top, right, bottom, left as % of the
  player area". Un overlay en la esquina superior izquierda que ocupa un
  cuarto del ancho y un cuarto del alto es `"0 75 75 0"`.
- **El contenido primario es un elemento más del layout**, con su propio
  `viewport` y su propio `zDepth`. Ahí está el squeezeback: el
  `primaryContent` de `squeezebackFrame` es `"20 20 20 20"`, o sea el
  contenido se achica un 20 por ciento por cada lado y el aviso ocupa el
  fondo.

### Los cinco layouts se reducen a tres mecanismos

El documento de requerimientos enumera cinco layouts (Overlay, L-box con
video, L-box con imagen, Side by side pullback, y Quad editorial). La
herramienta de SVTA emite seis nombres de tipo (`cornerOverlay`,
`lowerThirdOverlay`, `squeezebackFrame`, `squeezebackDoubleBox`,
`squeezebackLShape`, `multiView`). Mirando el modelo de datos, todos se
apoyan en solamente tres mecanismos de render distintos:

| Mecanismo | Qué hace | Tipos que lo usan |
| --- | --- | --- |
| A. Overlay | El contenido primario no se mueve, el asset se dibuja encima. | `cornerOverlay`, `lowerThirdOverlay` |
| B. Squeezeback | El contenido primario se achica y el asset ocupa el espacio liberado. | `squeezebackFrame`, `squeezebackDoubleBox`, `squeezebackLShape` |
| C. Multiview | Varias fuentes conviven sin que ninguna sea privilegiada. | `multiView` |

Esto importa porque cambia qué es lo mínimo. Cubrir tres mecanismos
prueba el modelo entero; cubrir cinco layouts del mismo mecanismo no
prueba nada más que uno. Y ordena el riesgo: A es CSS sobre un elemento
que ya existe, B además requiere mover el video primario, y C es el
único que pone dos o más decodificadores a trabajar al mismo tiempo, que
es justamente el tema que David va a marcar en escenario.

---

## 2. Lo que hls.js hace hoy con esto, medido

Esta es la parte que el proyecto no puede asumir, así que se midió en
lugar de suponerse.

**Método.** Se bajó el paquete publicado `hls.js@1.7.2` (la versión
`latest` del registro de npm al 2026-09-03), que incluye los fuentes
TypeScript además del build, y se leyó el código. Las referencias son
`archivo:línea` dentro de `package/src/` de ese paquete.

**Hallazgo 1: hls.js sí tiene soporte de HLS Interstitials, y está
cerrado sobre la clase de Apple.** El único lugar donde se decide si un
DATERANGE es un interstitial es
`controller/interstitials-schedule.ts:350`, que pregunta
`if (dateRange.isInterstitial)`. Ese getter está en
`loader/date-range.ts:189` y es literalmente
`return this.class === CLASS_INTERSTITIAL`, con
`const CLASS_INTERSTITIAL = 'com.apple.hls.interstitial'` declarado como
constante de módulo en la línea 26, sin configuración y sin exportar.
Un DATERANGE con `CLASS="com.qualabs.hls.concurrentInterstitial"` nunca
se convierte en un evento de interstitial: hls.js no le pide el
`X-ASSET-LIST` ni lo agenda.

**Hallazgo 2: pero el tag no se pierde, y la aplicación lo puede leer.**
El parser guarda todos los DATERANGE sin filtrar por clase
(`loader/m3u8-parser.ts:578`), y el único filtro es de validez
(`loader/date-range.ts:192`), que para nuestra clase pide solamente un
`ID`, un `START-DATE` parseable y una `DURATION` no negativa si está
presente. El resultado queda en `LevelDetails.dateRanges`
(`loader/level-details.ts:22`), que llega a la aplicación en el evento
`LEVEL_UPDATED` (`types/events.ts:237`, campo `details`). `DateRange` es
además uno de los símbolos exportados públicamente por el paquete. En
otras palabras, **hls.js sin modificar ya le entrega a la aplicación el
tag con nuestra clase y todos sus atributos**.

**Hallazgo 3: la maquinaria de interstitials es de reemplazo, no de
concurrencia.** Cuando hls.js reproduce un interstitial, transfiere el
MediaSource entre el player primario y el player del asset
(`controller/interstitials-controller.ts:766` `transferMediaFromPlayer`
y `:795` `transferMediaTo`). Hay un solo elemento de media y se lo pasan
entre ellos. No hay nada en esa maquinaria que dibuje dos fuentes al
mismo tiempo, que es exactamente lo que esta demo tiene que mostrar.

**Hallazgo 4: el punto de extensión documentado existe pero hoy no se
puede usar desde npm.** La configuración acepta
`interstitialsController?: typeof InterstitialsController`
(`config.ts:387`), o sea que se puede inyectar un controlador propio.
Pero `InterstitialsController` **no está en los exports de runtime del
paquete**: la lista de exports de `dist/hls.mjs` incluye `DateRange`,
`M3U8Parser`, `AbrController` y una veintena más, y no lo incluye. Está
declarado en los tipos (`dist/hls.d.mts:4094`) pero no se puede importar
para heredar de él. Usar ese hook hoy obliga a compilar hls.js desde el
fuente, es decir a mantener un fork.

**Lectura conjunta.** Lo que Rob le dijo a David, que el trabajo en
hls.js "está planificado pero no hecho", es consistente con lo medido.
Para lo que esta demo necesita, hls.js 1.7.2 aporta la reproducción del
contenido primario y la entrega de los tags a la aplicación, y no aporta
ni el reconocimiento de la clase custom ni ninguna forma de
concurrencia.

**Lo que NO se midió y sigue sin saberse:**

- Si dos elementos `<video>` con instancias independientes de hls.js
  reproducen simultáneamente sin pelearse por decodificadores en la
  máquina donde se va a grabar. Es barato de medir y decide el mecanismo
  C.
- Si un hls.js parcheado puede engancharle el player de un asset a un
  segundo elemento de media mientras el primario sigue andando. El
  código muestra que el camino incorporado no lo hace; no muestra que sea
  imposible construirlo.
- Qué dice exactamente el roadmap de hls.js sobre esto. Se inspeccionó
  el paquete publicado, no el issue tracker ni los pull requests del
  proyecto.
- Nada de AVFoundation. Esta fase es web.

---

## 3. Las decisiones

### D1. La experiencia concurrente se renderiza en el DOM, sobre el video, y no se compone en video

El layout se expresa como porcentajes de inset sobre el área del player,
que es exactamente lo que CSS sabe hacer con un elemento posicionado. El
contenido primario se achica con una transformación de CSS sobre el
elemento `<video>` y los assets se dibujan como elementos posicionados
encima, ordenados por `zDepth`.

Consecuencia: no hace falta ningún trabajo a nivel de bitstream ni de
compositing, y la demo es honesta en el sentido en que David lo pidió,
porque lo que se ve es el player resolviendo el layout de verdad. Esto
además es lo que hace que el mecanismo B (squeezeback) sea casi tan
barato como el A.

### D2. El POC no usa la maquinaria de interstitials de hls.js

Por los hallazgos 1 y 3: esa maquinaria no ve nuestra clase, y aunque la
viera, lo que sabe hacer es reemplazar el contenido primario, que es lo
contrario de lo que la demo muestra. Adaptarla costaría un fork y
entregaría, en el mejor caso, la parte fácil del problema (agendar y
pedir un JSON) y nada de la parte que importa.

Consecuencia: hls.js entra a la demo **sin modificar**, en su rol de
player del contenido primario. La aplicación se suscribe a
`LEVEL_UPDATED`, lee `details.dateRanges`, se queda con los que tienen
nuestra clase, y sigue el flujo por su cuenta.

Consecuencia incómoda que hay que decir: así el POC no demuestra la
forma óptima que pide el documento de requerimientos, que es una
librería que reemplaza la clase por defecto dentro del player. Demuestra
la experiencia y el modelo de datos. La forma óptima se aborda después,
y D3 es lo que hace que abordarla no sea reescribir.

### D3. Dos capas separadas, señalización y renderizado, con un contrato entre ellas

La capa de señalización tiene una sola responsabilidad: producir, para
un tiempo de reproducción dado, la lista de experiencias concurrentes
activas con su layout ya resuelto. La capa de renderizado consume eso y
no sabe nada de HLS.

Consecuencia: la señalización tiene hoy una implementación (leer los
DATERANGE de hls.js sin modificar) y mañana puede tener otra (un hls.js
parcheado o una librería propia que se active con la clase) sin tocar el
renderizado, que es donde va a estar la mayor parte del trabajo y todo
el riesgo visual. Es también lo que permite que la parte de iOS de Emil
comparta el modelo aunque no comparta una línea de código.

### D4. El asset-list se consume tal como lo emite el Layout Controller de SVTA, sin formato propio

La herramienta de SVTA es la que genera el JSON y es la que muestra cómo
se debería ver. El POC toma su salida sin transformarla.

Consecuencia: la herramienta pasa a ser el banco de pruebas y la
referencia visual. Se arma un layout ahí, se copia el JSON, y el player
tiene que mostrar lo mismo que muestra su vista previa. Todo lo que no
podamos renderizar es un hueco para reportar a SVTA, no un formato para
cambiar por nuestra cuenta.

Vale aclarar qué es esa herramienta, porque el nombre "Layout
Controller" sugiere otra cosa: es un generador de datos con una vista
previa **estática** (`previewPlayer` es un `div` con cajas
redimensionables, no reproduce video). No es una librería que se pueda
embeber. Aportar el render de verdad es precisamente lo que esta demo
agrega.

### D5. El POC es VOD y el origen es estático

El contenido primario es un VOD empaquetado en HLS, y tanto la playlist
como el asset-list son archivos servidos por un servidor de archivos
estáticos. No hay ad server, no hay APS, no hay live.

Consecuencia: la demo es reproducible y grabable, que es lo que la
ventana del 28 al 30 necesita. La contra es que el `X-ASSET-LIST` no
demuestra nada dinámico, pero eso no es lo que la demo quiere probar.
Nota técnica a verificar al empaquetar: la especificación de HLS pide
que una media playlist que tenga `EXT-X-DATERANGE` tenga también al
menos un `EXT-X-PROGRAM-DATE-TIME`, porque `START-DATE` se resuelve
contra ese reloj.

### D6. El mínimo es un layout del mecanismo A, y el objetivo de la fase es uno por mecanismo

El mínimo que demuestra el punto es un `cornerOverlay` sobre un VOD, con
el DATERANGE de clase propia en la playlist y el asset-list servido al
lado, y con la pestaña de red del browser mostrando la playlist, el tag
y el JSON. Si eso anda, la cadena entera anda y lo que falta es más de
lo mismo.

Después se agrega un layout del mecanismo B (squeezeback) y uno del C
(multiview), en ese orden, porque es el orden de riesgo creciente.

Consecuencia: el reparto de los cinco layouts entre el draft y la
grabación, que es una pregunta abierta para David, se contesta con
mecanismos y no con nombres. Si el 21 de septiembre hay uno de cada
mecanismo andando, agregar los layouts que falten es trabajo de datos y
no de ingeniería.

---

## 4. Alternativas descartadas

| Alternativa | Por qué se descarta |
| --- | --- |
| Parchear hls.js ahora, cambiando el gate de clase y construyendo un controlador de interstitials propio | Es una línea cambiar el gate, pero después hay que construir la concurrencia dentro de una maquinaria que está hecha para reemplazar. Se paga un fork y una compilación desde el fuente antes de tener nada en pantalla. Queda como el camino de la versión "librería", no del POC. |
| Inyectar un controlador propio por `config.interstitialsController` | El hook existe pero la clase base no se exporta en runtime (hallazgo 4), así que igual obliga al fork. Sin la ventaja de ser el camino soportado. |
| Componer el layout en el video, del lado del servidor o del cliente | David lo descartó explícitamente ("I don't want it smoke in mirrors"), y además es innecesario: el modelo de datos es de porcentajes sobre el área del player, que es DOM. |
| Usar Media Source Extensions para meter las dos fuentes en un solo elemento de video | Muchísimo más caro y no muestra nada que dos elementos no muestren. El costo solo se justificaría si la limitación de decodificadores lo obligara, y esa es una pregunta de dispositivos que está fuera de alcance. |
| Empezar por el layout Quad, que es el más vistoso | Es el mecanismo C, el único que depende de una capacidad no medida. Empezar por ahí pone el riesgo desconocido antes que la cadena completa. |
| Hacer live en lugar de VOD | Agrega trabajo de empaquetado y una fuente de fallas durante la grabación, sin agregar nada a lo que se quiere demostrar. |
| Arrancar por iOS y AVFoundation | Está fuera del objetivo que fijó Nicolás para esta fase, y es el trabajo que entra por Emil. |

---

## 5. Lo que hay que medir antes de comprometerse

Tres mediciones cortas, cada una con lo que decide. Ninguna es una
investigación: son pruebas de que algo prende.

1. **Dos elementos `<video>` reproduciendo al mismo tiempo** en el
   browser y la máquina de la grabación, uno con el contenido primario y
   otro con un asset. Decide el mecanismo C y, en menor medida, el A
   cuando el asset es video en lugar de imagen. Si falla, el Quad sale
   de la demo o se resuelve con menos fuentes de video.
2. **La cadena mínima de señalización**: una playlist con nuestro
   DATERANGE, hls.js sin modificar, y la aplicación logueando el tag y
   el asset-list. Confirma en ejecución los hallazgos 1 y 2, que hasta
   ahora son lectura de código.
3. **Un layout de la herramienta de SVTA renderizado al lado de su vista
   previa**, para ver si el modelo de porcentajes alcanza o si falta
   información (relación de aspecto del asset, qué pasa cuando el
   viewport del asset no respeta la relación de aspecto del contenido).

Recién con las tres se sabe si el plan de tareas que sale de este diseño
es el correcto.

---

## 6. Qué hace falta que exista, y qué ya existe

| Pieza | Estado |
| --- | --- |
| Página de demo (player, overlay, sin bundler) | Existe algo directamente reusable: `projects/aws-multiview/demo-ibc/` es un player web sobre hls.js **sin modificar**, sin bundler y sin framework, con una capa de UI encima del elemento de video. Sirve de esqueleto. |
| Player de contenido primario | hls.js sin modificar. Nada que construir. |
| Capa de señalización | No existe. Es trabajo nuevo, chico. |
| Capa de renderizado de layouts | No existe. Es el grueso del trabajo de la fase. |
| VOD empaquetado en HLS con nuestros DATERANGE | No existe. Hay que empaquetar un asset y editar la media playlist. |
| Asset-list JSON | No existe como archivo, pero sí existe quién lo genera: la herramienta de SVTA. |
| Origen | No existe, y es un servidor de archivos estáticos. |
| Assets de aviso | No existen todavía en el proyecto. David quedó en compartir la planilla de assets abiertos de SVTA. Para el mínimo alcanza cualquier mp4 corto; la escasez solo aprieta para la grabación, y el L-box con video es el que David marcó como difícil de conseguir. Big Buck Bunny está descartado por pedido de Nicolás. |
| Repositorio | `qualabs/hls-non-linear-ads-demo` existe, privado y vacío. Nada pusheado todavía. |

Vale mirar también `projects/sgai-for-mpeg-dash/`, que es el mismo
problema del lado de DASH y ya tiene decidido un modelo de layout
propio. Ahí hay una inconsistencia que conviene resolver antes de que
las dos especificaciones diverjan, y está en las preguntas abiertas.

---

## 7. Riesgos de la fase y su mitigación

**R1. El calendario, que es más corto de lo que parece.** El software
tiene que estar operativo para la ventana de grabación del 28 al 30 de
septiembre, no para la presentación del 7 de octubre. Y la fecha del
primer draft está en disputa. Mitigación: la fase se planifica contra el
21 de septiembre, y el orden de trabajo es la cadena mínima completa
primero y los layouts después, para que en cualquier momento a partir de
la primera semana exista algo grabable.

**Escalera de repliegue, de más a menos.** Si algo no llega, se baja un
escalón y se avisa, no se recorta la calidad de lo que ya está.

1. Los tres mecanismos andando, con los cinco layouts.
2. Los tres mecanismos andando, con un layout de cada uno.
3. Los mecanismos A y B andando, sin multiview.
4. El mecanismo A andando, con la cadena de señalización completa y
   visible en la pestaña de red.

El escalón 4 es el piso: por debajo de eso no hay demo, y si el 21 de
septiembre no está el escalón 4, la conversación con David no es sobre
layouts sino sobre plataforma.

**R2. La concurrencia de decodificadores.** Es el riesgo que puede
sacar el mecanismo C de la demo. Mitigación: la medición 1 de la
sección 5, hecha temprano, cuando todavía hay tiempo de reemplazar el
Quad por otra cosa.

**R3. La información que David fue a buscar puede contradecir la
elección de plataforma.** La contradicción posible es que AVFoundation
haga esto notoriamente más fácil. Mitigación: las decisiones D1 a D4 de
este diseño no dependen de la plataforma, porque el modelo de datos y el
modelo de layout son los mismos en las dos. Lo que cambiaría es quién
implementa la capa de señalización y con qué esfuerzo. La separación de
D3 es lo que hace que un cambio de plataforma cueste una capa y no el
proyecto. Riesgo residual aceptado: dos semanas de trabajo de
renderizado web no se recuperan si la demo entera se muda a iOS, pero el
objetivo de la fase, fijado por Nicolás, es justamente el POC web.

**R4. Divergencia con el trabajo de DASH.** Ver pregunta abierta P5.
Mitigación: es una pregunta de especificación, no de código, y no
bloquea nada de esta fase. Se resuelve en la conversación con David y
con SVTA, no acá.

---

## 8. Preguntas abiertas

**P1. La fecha del primer draft.** El documento de requerimientos dice 1
de septiembre y la minuta dice lunes 21 de septiembre. Siguen sin
conciliar; el `PROJECT.md` la marca como la pregunta más urgente y esta
fase está planificada contra el 21. Para David.

**P2. El reparto de los cinco layouts entre el primer draft y la
grabación.** Sigue sin definir en ninguna de las dos fuentes. Este
diseño propone contestarla por mecanismos (D6), pero la decisión de qué
se muestra es de David.

**P3. Quién hace el primer pase de la especificación de SVTA.** Sigue
sin owner. Las dos salidas que David nombró son que la haga Nicolás o
que ayude Olivier. Está fuera del alcance de esta fase, pero comparte
fecha límite con ella.

**P4. Cómo se llama cada uno de los cinco layouts en el campo `type` del
payload.** El documento de requerimientos usa cinco nombres en prosa
(Overlay, LBox Video, LBox Image, Side by Side pullback, Quad) y la
herramienta de SVTA emite seis identificadores distintos
(`cornerOverlay`, `lowerThirdOverlay`, `squeezebackFrame`,
`squeezebackDoubleBox`, `squeezebackLShape`, `multiView`). El mapeo
parece obvio en cuatro casos y deja `squeezebackFrame` sin correlato,
pero "parece obvio" no es una fuente. Para David, y es barata de
contestar.

**P5. El modelo de coordenadas de HLS y el de DASH no coinciden.** La
herramienta de SVTA para HLS usa porcentajes de inset sobre el área del
player. La especificación de SGAI para DASH que Nicolás está diseñando
en `projects/sgai-for-mpeg-dash/` decidió un viewport de referencia con
posiciones en píxeles (ADR `0002-custom-layout-viewport-pixel-model`).
Son dos modelos distintos para el mismo problema, en dos
especificaciones que Nicolás está empujando en paralelo. No bloquea esta
fase, pero es exactamente el tipo de divergencia que después cuesta cara
en una armonización.

**P6. Qué significa `version: 2` en el bloque `X-AD-CREATIVE-SIGNALING`.**
La herramienta emite 2, y el marco del trabajo es llevar la guía
SVTA2053 a su v3. No está claro si ese campo versiona la guía, el
esquema del bloque, o la herramienta.

**P7. Qué pasa con el audio cuando la experiencia concurrente tiene
sonido.** El modelo de datos tiene un `volume` por asset y otro para el
contenido primario, lo que sugiere que se espera mezclar o atenuar. El
documento de requerimientos no dice nada al respecto y la demo lo va a
tener que resolver de alguna manera visible.

**P8. Qué dijo Rob exactamente.** El `PROJECT.md` ya la registra y David
mandó el mail para recuperarlo. Lo que este diseño agrega es qué tiene
que contestar esa respuesta para ser útil: si hls.js tiene o planea una
forma soportada de registrar una clase de DATERANGE que no sea la de
Apple, y si tiene o planea alguna forma de reproducir un asset
concurrentemente con el contenido primario. Para las dos, la respuesta
medida sobre la versión 1.7.2 es que hoy no.

**P9. August.** La persona con la que David trabaja el deck sigue sin
apellido en el `PROJECT.md`. No afecta a esta fase.
