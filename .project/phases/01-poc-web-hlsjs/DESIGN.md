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

**Pieza 2: el asset-list JSON** al que apunta `X-ASSET-LIST`. Es el
mismo flujo de interstitials de siempre: el player pide ese JSON y ahí
están los assets a reproducir. La especificación de HLS pide que cada
entrada del array `ASSETS` tenga `URI` y `DURATION`, y no prohíbe claves
adicionales (`draft-pantos-hls-rfc8216bis-wwdc2026`, Apéndice D.2). La
extensión de este trabajo consiste exactamente en eso: agregarle, por
asset, un bloque `X-AD-CREATIVE-SIGNALING` con los datos de layout, que
un cliente que no lo conoce ignora.

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

### Cómo llegan los Date Ranges al player: la playlist o una agenda

Hay dos formas de entregarle al player los Date Ranges de una tanda, y
la diferencia importa porque una de las dos es material nuevo del
estándar que Apple presenta en este mismo evento.

La primera es la de siempre: los tags van escritos en la media playlist.

La segunda son los **Scheduled Date Ranges**, definidos en el Apéndice H
de `draft-pantos-hls-rfc8216bis-wwdc2026` (Pantos, Apple, 1 de junio de
2026, páginas 126 a 129; obsoleta la RFC 8216 y describe la versión 13
del protocolo). Funciona así: un único tag con
`CLASS="com.apple.hls.daterange-schedule"` y un atributo `X-URI` apunta
a un JSON con una clave `DATERANGES`, cuyo valor es un array de
DateRange Objects. Cada DateRange Object es un JSON donde cada clave es
un atributo de un `EXT-X-DATERANGE` y cada valor es su valor legal, con
`CLASS` obligatorio y con `START-DATE` o `X-SCHEDULE-OFFSET`, que
expresa el comienzo relativo al de la agenda que lo contiene. Es decir,
una tanda entera resuelta en una sola ida al servidor, pensada como
agenda al estilo VMAP.

Tres cosas del Apéndice H que este proyecto debería tener presentes:

- **Un array de DateRange Objects puede mezclar clases.** El texto dice
  que "which classes a client supports is implementation-specific" y
  que, como mínimo, los clientes deberían soportar
  `com.apple.hls.interstitial` y `com.apple.hls.daterange-schedule`.
  Nada impide que la misma agenda traiga además una clase que sólo
  nuestro cliente entiende.
- **En la forma JSON, un atributo `X-` puede valer cualquier JSON
  legal, incluidos objetos y arrays**, mientras que en la forma de tag
  tiene que ser un AttributeValue de los que el tag admite. O sea que
  en una agenda el layout podría viajar dentro del propio DateRange
  Object, sin la segunda ida al asset-list. No es lo que este POC hace,
  pero es una opción real para la especificación de SVTA.
- **Nació para poder definir skip-ability distinta por ítem**, que es
  algo que el asset-list de un interstitial no permite porque su objeto
  `SKIP-CONTROL` es uno solo para toda la lista (Apéndice D.4).

---

## 2. Lo que hls.js hace hoy, medido, y lo que viene

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

**Hallazgo 5: la misma configuración permite apagar el mecanismo
entero.** En `hls.ts:223` el controlador se instancia solamente si
`config.interstitialsController` es truthy. Pasando ahí un valor vacío,
la instancia de hls.js reproduce el contenido primario y no toca ningún
DATERANGE. Esto es lo que permite tener, en la misma página y con la
misma librería, un cliente que se comporta como cualquier cliente de
mercado y otro que hace lo nuestro.

**Hallazgo 6: no hay ningún soporte de Scheduled Date Ranges.** Buscando
`com.apple.hls.daterange-schedule`, `X-SCHEDULE-OFFSET` y `DATERANGES`
en todo el fuente, lo único que aparece es
`RECENTLY-REMOVED-DATERANGES`, que es de las delta playlists y no tiene
relación. El mecanismo del Apéndice H no existe en 1.7.2.

**Lo que viene, con fuente.** El issue
`video-dev/hls.js#7571`, "Client-side Interstitials API", está **abierto
y con milestone 1.8.0**, o sea el próximo minor (verificado contra la
API de GitHub el 2026-09-03; autor `ghouet`, abierto el 2025-10-09,
etiquetas "Feature proposal" e "Interstitials"). Pide una API para que
la aplicación agende interstitials desde el cliente, al estilo de
`AVPlayerInterstitialEventController` de AVFoundation. Rob Walch, que
mantiene hls.js, agrega por mail que el plan es aterrizar esa API y los
Scheduled Date Ranges **juntos**, porque dependen de mecanismos
parecidos de inserción de programa.

Dos comentarios de Rob en ese issue son directamente pertinentes a este
diseño. El primero, sobre el alcance de los interstitials: *"side by
side, pip, and overlay would not be considered interstitials and deserve
a class of their own"*. Es el mantenedor de hls.js diciendo que las
experiencias concurrentes merecen una clase propia, que es exactamente
lo que `com.qualabs.hls.concurrentInterstitial` es. El segundo, sobre
los elementos de media: *"The same media element is transferred between
instances by the interstitial-controller, but the application
controlling hls.js can intervene to attach other media elements"*, con
`INTERSTITIAL_ASSET_PLAYER_CREATED` como el punto de enganche más
temprano. No contradice el hallazgo 3, que sigue en pie: el camino
incorporado mueve un único MediaSource. Lo que agrega es que la
aplicación puede meter mano, lo que vuelve más prometedora la medición
del elemento de media secundario.

**Lo que NO se midió y sigue sin saberse:**

- Si dos elementos `<video>` con instancias independientes de hls.js
  reproducen simultáneamente sin pelearse por decodificadores en la
  máquina donde se va a grabar. Es barato de medir y decide el mecanismo
  C.
- Si un hls.js parcheado puede engancharle el player de un asset a un
  segundo elemento de media mientras el primario sigue andando. El
  código muestra que el camino incorporado no lo hace, y Rob dice que la
  aplicación puede intervenir; entre esas dos cosas hay una medición que
  nadie hizo.
- Nada de AVFoundation. Esta fase es web, y sobre la comparación Rob
  contesta *"Either would be fine for a demo"*.

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

### D2. El cliente de la demo apaga la maquinaria de interstitials de hls.js y maneja los Date Ranges por su cuenta

Por los hallazgos 1 y 3: esa maquinaria no ve nuestra clase, y aunque la
viera, lo que sabe hacer es reemplazar el contenido primario, que es lo
contrario de lo que la demo muestra. Adaptarla costaría un fork y
entregaría, en el mejor caso, la parte fácil del problema (agendar y
pedir un JSON) y nada de la parte que importa.

Consecuencia: hls.js entra a la demo **sin modificar**, con el
controlador de interstitials apagado por configuración (hallazgo 5), en
su rol de player del contenido primario. La aplicación se suscribe a
`LEVEL_UPDATED`, lee `details.dateRanges`, se queda con los que tienen
nuestra clase, y sigue el flujo por su cuenta. Es también lo que Rob
sugiere para una demo: *"You could just put all of your Date Ranges in
an HLS Media Playlist, HLS.js and AVPlayer will both 'see' them just the
same as if they had been loaded in a Schedule"*, con la salvedad, que él
mismo marca, de que así se saltea el decisioning del ad server. Como el
ad server está fuera de alcance, la salvedad no aplica acá.

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
DATERANGE de hls.js sin modificar) y puede tener otras sin tocar el
renderizado, que es donde está la mayor parte del trabajo y todo el
riesgo visual. Las otras dos que ya se ven venir son un hls.js parcheado
y la API client-side del milestone 1.8.0, que permitiría insertarle a
hls.js los eventos que hoy no reconoce en lugar de parchear su
comparación de clases. Es también lo que permite que la parte de iOS de
Emil comparta el modelo aunque no comparta una línea de código.

### D4. El asset-list se consume tal como lo emite el Layout Controller de SVTA, sin formato propio

La herramienta de SVTA es la que genera el JSON y es la que muestra cómo
se debería ver. El POC toma su salida sin transformarla, y eso encaja
con la especificación: el Asset-Description obliga a `URI` y `DURATION`
y deja lugar para claves de extensión que un cliente que no las conoce
ignora.

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

### D5. El POC es VOD, y los Date Ranges van escritos en la media playlist

El contenido primario es un VOD empaquetado en HLS, y tanto la playlist
como los asset-list son archivos servidos por un servidor de archivos
estáticos. No hay ad server, no hay APS, no hay live, y no se usa el
mecanismo de agenda del Apéndice H, que hls.js no soporta (hallazgo 6).

Consecuencia: la demo es reproducible y grabable, que es lo que la
ventana del 28 al 30 necesita. Nota técnica a verificar al empaquetar:
la especificación pide que una media playlist con `EXT-X-DATERANGE`
tenga también al menos un `EXT-X-PROGRAM-DATE-TIME`, porque `START-DATE`
se resuelve contra ese reloj. Y detalle práctico del parser de hls.js:
dos tags con el mismo `ID` se fusionan, así que cada Date Range de la
demo lleva su propio identificador.

### D6. Los Date Ranges se escriben como DateRange Objects válidos, para que migrar a una agenda sea mover texto

Cada tag que la demo pone en la playlist se escribe de manera que sea
traducible sin pérdida al DateRange Object del Apéndice H: `CLASS`
presente, `START-DATE` presente, identificadores únicos, y los atributos
`X-` con valores que son legales en las dos formas.

Consecuencia: el día que hls.js soporte agendas, o que la especificación
de SVTA decida entregarlas así, cambia el transporte y no el contenido.
Y le da a David algo concreto que decir en escenario sobre cómo este
trabajo se conecta con lo que Apple presenta el mismo día, que es
exactamente lo que Rob ofrece al final de su mail.

### D7. La demo muestra la compatibilidad hacia atrás en la misma página, con dos players sobre el mismo manifiesto

Este es el argumento más fuerte que la demo puede hacer, y es barato. La
misma media playlist lleva dos tags en el mismo `START-DATE`: uno de
clase `com.apple.hls.interstitial` con el aviso lineal, y otro de clase
`com.qualabs.hls.concurrentInterstitial` con la experiencia concurrente.
Al lado del cliente de la demo corre una instancia de hls.js sin
modificar y con su configuración de fábrica, que reproduce el aviso
lineal e ignora lo que no entiende, mientras el cliente de la demo elige
la experiencia concurrente.

Hay una razón técnica por la que esto tiene que hacerse así, y conviene
decirla porque es contraintuitiva. El documento de requerimientos
describe la clase concurrente como una extensión de la clase
interstitial, para mantener compatibilidad hacia atrás. Esa herencia es
conceptual y ningún cliente puede actuar sobre ella: en HLS la clase se
compara por igualdad exacta de string, y el hallazgo 1 lo muestra en una
sola línea de hls.js. **La compatibilidad hacia atrás no puede venir de
que una clase extienda a la otra; tiene que venir de servir las dos
cosas y dejar que cada cliente se quede con la que entiende.**

Consecuencia: la demo deja de decir "nuestro cliente hace algo nuevo" y
pasa a decir "esto se despliega sin romperle a nadie", que es un
argumento mucho más fuerte frente a esa audiencia. El costo es un tag
más, un asset-list más y una segunda instancia de player en la página.

### D8. El mínimo es un layout del mecanismo A, y el orden de trabajo va del riesgo conocido al desconocido

El mínimo que demuestra el punto es un `cornerOverlay` sobre un VOD, con
el DATERANGE de clase propia en la playlist y el asset-list servido al
lado, y con la pestaña de red del browser mostrando la playlist, el tag
y el JSON. Si eso anda, la cadena entera anda y lo que falta es más de
lo mismo.

El orden después del mínimo es: el par de compatibilidad de D7, que no
agrega riesgo técnico y sí agrega el argumento más fuerte de la demo;
después un layout del mecanismo B (squeezeback); y al final el mecanismo
C (multiview), que es el único que depende de una capacidad no medida.

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
| Entregar los Date Ranges con una agenda del Apéndice H en vez de tags en la playlist | hls.js no soporta la clase de agenda (hallazgo 6), así que habría que implementarla antes de mostrar nada, y el propio Rob ofrece la salida de poner los tags en la playlist para una demo. Se adopta igual su forma de datos por D6, que da el beneficio sin el costo. |
| Esperar al milestone 1.8.0 de hls.js | El issue está abierto sin fecha, y la fase tiene 18 días hasta el primer draft. Planificar contra una versión no publicada es exactamente el error que este proyecto ya cometió una vez. |
| Confiar la compatibilidad hacia atrás a que la clase concurrente extienda a la de interstitial | La comparación de clases es por igualdad exacta de string, así que ningún cliente existente reconocería la clase derivada. La compatibilidad sale de servir las dos cosas (D7). |
| Componer el layout en el video, del lado del servidor o del cliente | David lo descartó explícitamente ("I don't want it smoke in mirrors"), y además es innecesario: el modelo de datos es de porcentajes sobre el área del player, que es DOM. |
| Usar Media Source Extensions para meter las dos fuentes en un solo elemento de video | Muchísimo más caro y no muestra nada que dos elementos no muestren. El costo solo se justificaría si la limitación de decodificadores lo obligara, y esa es una pregunta de dispositivos que está fuera de alcance. |
| Empezar por el layout Quad, que es el más vistoso | Es el mecanismo C, el único que depende de una capacidad no medida. Empezar por ahí pone el riesgo desconocido antes que la cadena completa. |
| Hacer live en lugar de VOD | Agrega trabajo de empaquetado y una fuente de fallas durante la grabación, sin agregar nada a lo que se quiere demostrar. |
| Arrancar por iOS y AVFoundation | Está fuera del objetivo que fijó Nicolás para esta fase, es el trabajo que entra por Emil, y Rob confirma que para una demo cualquiera de las dos plataformas sirve. |

---

## 5. Lo que hay que medir antes de comprometerse

Tres mediciones cortas, cada una con lo que decide. Ninguna es una
investigación: son pruebas de que algo prende.

1. **Dos elementos `<video>` reproduciendo al mismo tiempo** en el
   browser y la máquina de la grabación, uno con el contenido primario y
   otro con un asset. Decide el mecanismo C y, en menor medida, el A
   cuando el asset es video en lugar de imagen. Si falla, el Quad sale
   de la demo o se resuelve con menos fuentes de video.
2. **La cadena mínima de señalización y el par de compatibilidad**: una
   playlist con los dos DATERANGE, el cliente de la demo logueando el
   tag y su asset-list, y una instancia de fábrica al lado reproduciendo
   el interstitial lineal. Confirma en ejecución los hallazgos 1, 2 y 5,
   que hasta ahora son lectura de código, y valida D7 completo.
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
| Player de contenido primario | hls.js sin modificar, en dos configuraciones distintas (D2 y D7). Nada que construir. |
| Capa de señalización | No existe. Es trabajo nuevo, chico. |
| Capa de renderizado de layouts | No existe. Es el grueso del trabajo de la fase. |
| VOD empaquetado en HLS con nuestros DATERANGE | No existe. Hay que empaquetar un asset y editar la media playlist. |
| Asset-list JSON | No existe como archivo, pero sí existe quién lo genera: la herramienta de SVTA. El del aviso lineal del par de compatibilidad se escribe a mano y es de tres líneas. |
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

1. Los tres mecanismos andando, con los cinco layouts, más el par de
   compatibilidad.
2. Los tres mecanismos andando con un layout de cada uno, más el par de
   compatibilidad.
3. Los mecanismos A y B, más el par de compatibilidad.
4. El mecanismo A andando, con la cadena de señalización completa y
   visible en la pestaña de red.

El escalón 4 es el piso: por debajo de eso no hay demo, y si el 21 de
septiembre no está el escalón 4, la conversación con David no es sobre
layouts sino sobre plataforma.

**R2. La concurrencia de decodificadores.** Es el riesgo que puede
sacar el mecanismo C de la demo. Mitigación: la medición 1 de la
sección 5, hecha temprano, cuando todavía hay tiempo de reemplazar el
Quad por otra cosa.

**R3. La plataforma, que dejó de ser el riesgo número uno.** El
`PROJECT.md` lo registra como el riesgo que decide esta fase, sobre la
base de que Rob le había dicho a David que había implementaciones
públicas en Swift que no existen en hls.js. La respuesta de Rob cierra
esa incógnita: *"Either would be fine for a demo"*. Lo que sí confirma
es que el control client-side es una capacidad de AVPlayer que hls.js
todavía no adoptó, y que está en camino para 1.8.0. Como este diseño
decidió no apoyarse en esa maquinaria (D2), la diferencia no bloquea
nada. Riesgo residual aceptado: si más adelante la demo se mudara
entera a iOS, el trabajo de renderizado web no se recupera; el objetivo
de la fase, fijado por Nicolás, es justamente el POC web.

**R4. Divergencia con el trabajo de DASH.** Ver pregunta abierta P4.
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
diseño propone contestarla por mecanismos (D8), pero la decisión de qué
se muestra es de David.

**P3. Quién hace el primer pase de la especificación de SVTA.** Sigue
sin owner. Las dos salidas que David nombró son que la haga Nicolás o
que ayude Olivier. Está fuera del alcance de esta fase, pero comparte
fecha límite con ella.

**P4. El modelo de coordenadas de HLS y el de DASH no coinciden.** La
herramienta de SVTA para HLS usa porcentajes de inset sobre el área del
player. La especificación de SGAI para DASH que Nicolás está diseñando
en `projects/sgai-for-mpeg-dash/` decidió un viewport de referencia con
posiciones en píxeles (ADR `0002-custom-layout-viewport-pixel-model`).
Son dos modelos distintos para el mismo problema, en dos
especificaciones que Nicolás está empujando en paralelo. No bloquea esta
fase, pero es exactamente el tipo de divergencia que después cuesta cara
en una armonización.

**P5. Cómo se llama cada uno de los cinco layouts en el campo `type` del
payload.** El documento de requerimientos usa cinco nombres en prosa
(Overlay, LBox Video, LBox Image, Side by Side pullback, Quad) y la
herramienta de SVTA emite seis identificadores distintos
(`cornerOverlay`, `lowerThirdOverlay`, `squeezebackFrame`,
`squeezebackDoubleBox`, `squeezebackLShape`, `multiView`). El mapeo
parece obvio en cuatro casos y deja `squeezebackFrame` sin correlato,
pero "parece obvio" no es una fuente. Para David, y es barata de
contestar.

**P6. Qué significa `version: 2` en el bloque `X-AD-CREATIVE-SIGNALING`.**
La herramienta emite 2, y el marco del trabajo es llevar la guía
SVTA2053 a su v3. No está claro si ese campo versiona la guía, el
esquema del bloque, o la herramienta.

**P7. Qué pasa con el audio cuando la experiencia concurrente tiene
sonido.** El modelo de datos tiene un `volume` por asset y otro para el
contenido primario, lo que sugiere que se espera mezclar o atenuar. El
documento de requerimientos no dice nada al respecto y la demo lo va a
tener que resolver de alguna manera visible.

**P8. Si la clase concurrente es una extensión de la de interstitial o
una clase hermana.** El documento de requerimientos la plantea como
extensión, para preservar compatibilidad. Rob, en el issue 7571, sostiene
que side by side, pip y overlay no son interstitials y merecen una clase
propia. La diferencia no es de nombre: si es hermana, la coexistencia con
el aviso lineal es la de D7 y hay que servir las dos cosas; si se la
sigue llamando extensión, se corre el riesgo de que alguien espere una
compatibilidad que la comparación exacta de strings no puede dar. Es
material para la especificación de SVTA. Para David.

**P9. Si el layout debería viajar en el DateRange Object en vez de en el
asset-list.** En la forma JSON del Apéndice H, un atributo `X-` puede
valer cualquier JSON legal, así que la señalización de creativo podría ir
en el propio Date Range y ahorrarse una ida al servidor. El POC no lo
hace porque sigue el flujo que fija el documento de requerimientos, pero
es una opción real que la especificación debería evaluar antes de
cerrarse.

**P10. August.** La persona con la que David trabaja el deck sigue sin
apellido en el `PROJECT.md`. No afecta a esta fase.
