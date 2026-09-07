# Diseño de la fase 03: breaks con varios avisos, el asset sin bloque y el `decoderCount`

Este documento es el diseño de la fase. Explora de dónde sale cada cosa, qué
decide, qué descarta y por qué, y qué queda sin respuesta. El `PHASE.md`, el
`TASKS.md` y los ADR de la fase se generan desde acá.

Fechado el 2026-09-07. La fase corre contra tres hitos: el sync con David del 21
de septiembre, la ventana de grabación del 28 al 30, y el evento de Apple del 7
de octubre.

---

## 1. De dónde salió el diseño

Todo el input de producto que existe es una frase de David en la reunión del
2026-09-04: *"the big thing right now... we need to show doing an ad break with
multiple ads within there... in the asset list JSON it says an array... you just
add them in there. And it'd be really cool if we can show concurrent, concurrent,
linear, concurrent, mixing that up."*

La mitad de la frase que se suele pasar por alto: David dice que los avisos van
en el array `ASSETS[]`, no en el `payload[]` de un mismo asset. Son dos
anidamientos distintos, hoy el código los aplana igual, y la diferencia importa
porque el `URI` y la `DURATION` son campos **por `ASSET`**.

El segundo input es la corrección de Nicolás del 2026-09-07, que es la decisión de
arquitectura de la fase y está en la sección 4.

El tercero es la norma, que hasta ahora nadie había leído contra este diseño. Está
en la sección 3.

## 2. Qué está construido y qué está sólo diseñado

**Construido y corriendo:** la señalización lee Date Ranges de las dos clases y
resuelve el bloque de SVTA a `Experience[]`; los dos loops que iteran `ASSETS[]` y
`payload[]` ya existen (`lib/signalling.js:130` y `:132`); el renderizador dibuja
N elementos por experiencia; el contrato como documento en
`docs/contrato-senalizacion-renderizado.md`; el SDK con `playedRanges` y
`KINDS_PLAYED` (`lib/concurrent-hls.js:149`); el par de compatibilidad; y el
recorrido de cinco breaks con **un aviso por break**.

**Sólo diseñado:** la secuencia adentro del break, el asset sin bloque —que es a
la vez el aviso lineal y el repliegue— y el `decoderCount`.

**Y un dato que ya existe y que cambia la lectura de todo lo demás:**
`signalling/asset-list-linear.json` es, entero,
`{ "ASSETS": [ { "URI": "/content/adA/index.m3u8", "DURATION": 12.0 } ] }`. El
aviso lineal de la demo **ya está declarado sin bloque**, desde la fase 01, y es
el que el cliente de mercado reproduce en cada break. Lo que la fase 03 agrega no
es una forma nueva de declararlo: es que nuestro player también sepa reproducirlo.

## 3. Lo que dice la norma

Se leyó **`draft-pantos-hls-rfc8216bis-22`** (1 de mayo de 2026, obsoleta la RFC
8216, versión 13 del protocolo), que es la última. Cuatro cosas que este diseño
tenía mal o suponía, y tres obligaciones que tiene que respetar.

### 3.1. La secuencia ya está en la norma, y es un `SHOULD`

Apéndice D.2, bajo `X-ASSET-LIST`: *"The client SHOULD play the interstitial
assets back-to-back in the order that they appear in the ASSETS array."*

Es **`SHOULD` y no `MUST`**, y la norma **no define un offset de inicio por
asset**. Que las duraciones acumulen aparece sólo implícito en el ejemplo del
Apéndice D.7, donde un botón de skip que sale a los 5 s del interstitial y dura 20
s se describe también como *"10 seconds into the second asset"*: la cuenta sólo
cierra si el segundo asset empieza a los 15 s, o sea si las duraciones acumulan.

Consecuencia para esta fase: **el orden es herencia y no hay que decidirlo**, y
**la ubicación precisa en el tiempo sigue siendo decisión nuestra**, porque no hay
campo que la exprese.

### 3.2. "Reproducí el `URI` por su `DURATION`" está mal

Apéndice D.2, bajo `X-PLAYOUT-LIMIT`: *"Otherwise the interstitial MUST end upon
reaching the end of the interstitial asset(s)."*

El `DURATION` del Asset-Description es **metadato declarativo**: dice cuánto dura
el asset, no cuánto reproducirlo. El corte por tiempo existe, pero es
`X-PLAYOUT-LIMIT`, y es del **break entero** y no por asset. Las dos cosas
coinciden sólo si el `DURATION` declarado es igual a la duración real, y un asset
list armado por un servidor de decisioning es justo donde eso puede mentir.

**La regla se escribe "reproducí el `URI` hasta su fin"**, en todos lados donde
aparezca.

### 3.3. La norma no tiene modelo de superposición

Todo el Apéndice D asume que el primario **se detiene**. `X-RESUME-OFFSET`
*"specifies where primary playback is to resume following the playback of the
interstitial"*; `X-SNAP` habla de *"transition to the interstitial at that
boundary"*; el ejemplo D.6 dice *"The client will play the interstitial and then
resume playback of the primary asset where it left off"*. No hay atributo ni
párrafo sobre render simultáneo. `X-RESUME-OFFSET=0` es lo más cerca que llega y
**no es lo mismo**: significa que el primario retoma donde quedó, no que nunca se
detuvo.

Esto es exactamente lo que hace que la clase concurrente sea una clase hermana y
no una extensión (ADR 0009 y 0016), y es lo que fija la consecuencia de la
sección 4.3.

### 3.4. La garantía del prefijo `X-` es más floja de lo que suponíamos

El *"clients MUST ignore any other attribute/value pair with an unrecognized
AttributeName"* de la sección 6.3.1 (General Client Responsibilities) está en la
lista de compatibilidad hacia adelante del **parseo de Playlists**, y cubre los
**atributos de los tags**, incluido el `EXT-X-DATERANGE`.

El bloque `X-AD-CREATIVE-SIGNALING` no vive ahí: vive en el **JSON del asset
list**. Y para ese JSON la norma **no define ninguna regla de claves
desconocidas**. El Apéndice D.2 dice qué claves tiene que tener —*"Each
Asset-Description JSON object MUST have a 'URI' member... and a 'DURATION'
member"*— y no dice nada sobre claves adicionales: ni las prohíbe ni obliga a
ignorarlas.

La extensión es legítima, y esa mitad se apoya en **convención y no en
obligación**. Es material para SVTA: si el bloque va a vivir en ese JSON, la regla
de claves desconocidas del asset list es algo que la especificación tiene que
decir.

### 3.5. Tres obligaciones que el diseño tiene que respetar

- **El `URI` del Asset-Description debe ser absoluto** (D.2: *"a quoted-string
  absolute URI for a single interstitial asset"*). Los asset-list de la demo usan
  referencias absolutas de path —`/content/adA/index.m3u8`—, que no son URIs
  absolutas. Queda escrito como no conformidad del dato de la demo; no se corrige
  en esta fase y no impide nada, porque el player que lo lee es el nuestro.
- **Cada asset es un Playlist** (D.1: *"Each interstitial asset is a Playlist,
  usually a Multivariant Playlist"*) **y tiene que ser VOD** (D.1: *"While
  interstitials MUST be VOD assets"*). O sea que el asset del repliegue **no puede
  ser un creativo suelto**: es una playlist, como ya lo son los tres creativos de
  la demo.
- **Los interstitials anidados** *"MUST be ignored by clients"* (D.1). Un asset de
  un asset list no puede traer su propia agenda de interstitials.

### 3.6. Y una confirmación, más el repliegue que la norma ya contesta

**`X-RESUME-OFFSET`.** D.2: *"If the X-RESUME-OFFSET is not present, its value is
considered to be the duration of the interstitial"* —o sea reemplazo— y el valor
`0` significa que el primario retoma donde quedó —o sea inserción—. **La T-05 de
la fase 04 llegó a la ausencia midiendo en el navegador, sin haber leído la norma,
y coincide** (ADR 0017 y su nota fechada). Es la segunda fuente de una decisión
que se había tomado con una sola.

**El repliegue tiene una parte que la norma ya contesta**, y contradice el
"salteá el break entero" que la fase tenía escrito. D.5, Client Behavior:

- *"If a request for the URI of a single asset within an asset list returns an
  error, the client SHOULD skip playback of that asset."* Falla **un** asset: se
  saltea **ese asset**, no el break.
- *"If a request for either an interstitial asset URI or an asset list URI returns
  an error, the client SHOULD cancel playback of the interstitial with a resume
  offset of 0."* Falla el **asset list**: ahí sí se cancela el interstitial
  entero.
- *"If the JSON object returned by the asset list URI has an empty array as the
  value of the 'ASSETS' key, the client SHOULD apply the resume offset without
  playing any interstitial content."*

Los tres escalones son de la norma y no hay que inventarlos.

## 4. La decisión de arquitectura de la fase

### 4.1. El bloque es una extensión POR ENCIMA del interstitial estándar

**`X-AD-CREATIVE-SIGNALING` es una extensión por encima del interstitial
estándar, y no un formato paralelo.** De ahí salen tres reglas:

- Un asset **con** el bloque lo dibuja nuestro plugin: es la experiencia
  concurrente, con su layout, su overlay o su squeezeback.
- Un asset **sin** el bloque nuestro plugin **no lo saltea**: reproduce su `URI`
  hasta el fin del asset, que es exactamente un aviso lineal. **El aviso lineal se
  sigue declarando como se declaraba siempre**: sin tipo nuevo, sin bloque, con el
  `URI` y el `DURATION` que la norma ya pide.
- Un bloque que **falla** —ausente, ilegible, o que pide algo que este cliente no
  puede reproducir— cae al mismo lugar: se reproduce el `URI` del asset hasta su
  fin.

Nicolás, 2026-09-07: *"lo que yo esperaría de nuestro plugin es que utilice la
mecánica que ya existe de interstitial para ese segmento... que nuestro plugin sea
retrocompatible... de esa forma nuestro módulo extiende el comportamiento por
defecto que HLS ya define y no tenemos que tener otro mecanismo de cómo poner
lineal"*.

### 4.2. Por qué

**Retrocompatibilidad.** Un asset-list que nuestro plugin entiende lo entiende
también cualquier cliente conforme, porque lo que ese cliente lee —`URI` y
`DURATION`— está donde siempre estuvo y significa lo que siempre significó.

**Un solo mecanismo para el lineal y el repliegue.** Las dos cosas son el mismo
camino de código: reproducir el `URI` de un asset hasta su fin. Un aviso lineal es
un asset cuyo bloque no está, y un repliegue es un asset cuyo bloque no sirve. **El
`TASKS.md` de esta fase los tenía como dos tasks separadas y se fusionan.**

**No hay que inventar un tipo nuevo.** La alternativa era declarar el lineal *con*
bloque y un `"type": "linear"` que la herramienta de SVTA no emite. Eso agrega
superficie de especificación para expresar algo que la norma ya expresa, y el
ejemplo que lo destapó es que el bloque del asset lineal terminaba apuntando **al
mismo `URI` que el nivel superior ya declaraba**: redundante por construcción.

### 4.3. La consecuencia, sin suavizar: el degradado no es transparente

La norma no tiene modelo de superposición (sección 3.3). Un player conforme sin
nuestro plugin **pausa el contenido primario** para reproducir el asset, porque es
lo único que la norma describe. Así que cuando un aviso concurrente se degrada a
su `URI` de nivel superior, **ese aviso concurrente se convierte en uno lineal que
interrumpe**.

Es un buen repliegue: el break se llena, el creativo se ve, y el inventario no se
pierde. **No es una equivalencia**, y describirlo como "extendemos el estándar"
invita a suponer que sí lo es. Lo que se degrada no es la calidad del render: es
la forma del aviso.

### 4.4. Qué le cuesta esto al código, hoy

`resolveAssetList` itera `block?.payload || []` (`lib/signalling.js:132`), así que
hoy **un `ASSET` sin bloque contribuye cero experiencias**. La capa de
señalización tiene que producir algo para un asset sin bloque, y lo puede producir
con los campos que el contrato ya tiene: una experiencia de un solo elemento con
el `uri` del asset, `viewport "0 0 0 0"`, `zDepth` arriba del primario,
`volume: 100`, y el primario en `zDepth 0` con `volume: 0`.

**No hace falta un campo nuevo del contrato.** Lo que hace falta es que la capa de
señalización sintetice la experiencia, y eso es lectura C1 de la sección 6.

## 5. Confirmación de que encender hls.js no es la salida

Sobre `vendor/hls.min.js`, el bundle que la demo sirve: la cadena
`com.apple.hls.interstitial` aparece **exactamente una vez**, dentro del getter
`isInterstitial`, como igualdad exacta —
`{key:"isInterstitial",get:function(){return"com.apple.hls.interstitial"===this.class}}`
— y `com.qualabs` aparece **cero** veces. Encender el controlador no reproduciría
un `ASSET` de nuestro asset-list, porque arma su agenda desde Date Ranges de clase
Apple y pide sus asset-list por su cuenta. Y volvería a nuestro player un cliente
de fábrica, que es exactamente lo que el par de compatibilidad del ADR 0007
muestra que no es.

El ADR 0002 se queda como está y esta fase no lo reabre. La decisión de la sección
4 es lo que lo garantiza: el asset sin bloque lo reproduce nuestro plugin, con el
mismo `attachAsset` que ya usa para todo lo demás, y la maquinaria de hls.js sigue
apagada.

## 6. El bug de la secuencia: cierto sobre el código, pero depende del dato

La fase dice que hoy los avisos saldrían todos a la vez. Es correcto sobre el
código y la línea es `lib/signalling.js:115` —
`startTime: slotStart + Number(item.start ?? 0)` — con `resolveAssetList`
(`:128-137`) pasándole el **mismo** `slotStart` a cada item y sin acumulador en
ningún lado del archivo.

**Pero el que posiciona cada aviso es el `start` del item.** Con
`start: 0, 12, 24, 36` el código de hoy **ya los secuencia bien sin tocar una
línea**. Salen los tres juntos sólo con `start: 0` en todos, que es lo que emite la
herramienta de SVTA y lo que traen los seis asset-list de la demo. O sea que la
secuencia puede ser un problema de **datos** y no de código, y eso puede achicar
bastante la task que la construye.

Lo que la norma agrega acá (sección 3.1) es que **el orden no se decide**: viene
del orden del array. Lo que sigue siendo decisión nuestra es de qué dato sale el
desplazamiento, porque la norma no tiene campo para eso.

## 7. Las cuatro lecturas de "mezclar concurrente y lineal", y cuál queda

**Lectura A, los concurrentes se ven encima del lineal.** Expresable en el
contrato, pero rota en el renderizador: cada experiencia trae su propio primario
(`lib/signalling.js:107`) y con dos activas `drawn` termina con dos entradas
apuntando al mismo nodo `<video>` (`lib/renderer.js:185-187`); `place()` las
aplica a las dos y gana la última (`:232-239`). Y aun arreglada, en pantalla es un
aviso encima de otro aviso. **Descartada.**

**Lectura B, el lineal pausa todo.** No expresable en el contrato y rota por tres
mecanismos. El de fondo: `lib/renderer.js:149` lee
`provider.activeAt(video.currentTime)`, así que **todo el contrato está
parametrizado por el tiempo del primario**; si el primario se pausa, `currentTime`
se congela, la ventana de activación nunca avanza y **el lineal no termina
nunca**. Además el `pause` del primario pausa todos los nodos de aviso
(`:374-379`, `:423-424`), incluido el del lineal. Requeriría una noción de "esta
experiencia suspende el reloj del programa" y un reloj propio del renderizador.

**Y la norma tampoco la contempla, que es el argumento que faltaba.** En el
Apéndice D la suspensión del primario es una propiedad del **interstitial entero**
—desde el primer asset hasta el último—, no de un asset adentro de la lista. No
hay forma de decir "el tercer asset de este asset list suspende el primario y los
otros tres no". Así que B no es sólo una invención del contrato: es también una
invención del formato. **Descartada.**

**Lectura C, el lineal va en secuencia y nunca al mismo tiempo.** Es la lectura
natural de la frase de David: "concurrent, concurrent, linear, concurrent" enumera
cuatro entradas de un array en orden, y "concurrent" nombra el tipo de cada aviso
—concurrente con el programa— y no concurrencia entre avisos. La norma la
respalda: los assets se reproducen back-to-back en el orden del array (sección
3.1). Adentro de C queda la bifurcación real.

**C1: el lineal es un elemento a cuadro entero y el programa sigue corriendo
detrás, tapado y en silencio.** Expresable hoy **sin agregar un solo campo al
contrato**: `viewport "0 0 0 0"`, `zDepth` arriba del primario, `volume: 100` en el
aviso y `volume: 0` en el primario. Lo que la fase agrega no es un campo: es que la
capa de señalización **sintetice** esa experiencia cuando el asset no trae bloque
(sección 4.4). **Adoptada.**

**C2: el lineal detiene el programa de verdad.** Requiere todo lo de la lectura B.
**Descartada.**

**Por qué C1 y no C2**, en tres razones. Es **indistinguible de C2 en pantalla**,
que es la vara de la demo. **No abre el ADR 0002 ni amplía la forma del
contrato**, que es el único riesgo de calendario de la fase a tres semanas de la
ventana de grabación. Y **mantiene el ADR 0016 intacto y la barra honesta**: el
largo de la línea de tiempo no cambia porque el primario nunca se detuvo.

**Lo que C1 no da, dicho de frente: no ahorra un decodificador.** El primario
sigue decodificando detrás del aviso opaco. Si el `decoderCount` va a significar
algo real, C2 es la que libera el decodificador del primario. Hoy es passthrough
por diseño de la propia fase, así que no muerde todavía.

**Y hay una asimetría que C1 introduce y conviene tener a la vista**: nuestro
player hace C1 y un cliente de mercado hace C2, porque C2 es lo único que la norma
describe. Es la misma asimetría de la sección 4.3, vista desde el otro lado: no es
un defecto de C1, es lo que la clase hermana significa.

## 8. El problema que esto le hace al par de compatibilidad

El tag de clase Apple y el concurrente comparten `START-DATE`
(`scripts/senalizar-contenido.sh:82-83`), y el ADR 0018 dice que eso es lo que hace
que el par sea un par. Con un break mezclado de 48 s y el lineal tercero:

- Del segundo 20 al 32, el pane de fábrica muestra **su** aviso a cuadro entero y
  el nuestro muestra el programa con un overlay encima. **Ese es el cuadro que la
  demo quiere.**
- Del 44 al 56 está **invertido**: el nuestro muestra un aviso a cuadro entero y
  el de fábrica muestra el programa.

Los dos panes siguen en el mismo segundo del programa —el ADR 0017 se cumple—,
pero durante un tramo del break **la comparación dice lo contrario de lo que
quiere decir**. Para que los dos avisos a cuadro entero coincidan, el tag de clase
Apple tendría que arrancar en el 44 y no en el 20, y ahí se rompe el `START-DATE`
compartido del ADR 0018.

**La fase acepta la inversión y la explica**, que es la única de las tres salidas
que no rompe algo que ya está decidido. Poner el lineal primero en la mezcla salva
el par, pero contradice el "mixing that up" que David pidió, que es justamente lo
que esta fase existe para mostrar. Desalinear los `START-DATE` rompe el ADR 0018,
que es lo que hace que el par sea un par. Aceptarla cuesta un tramo de doce
segundos donde la comparación dice lo contrario de lo que quiere decir, y ese
tramo se cuenta en vez de esconderse: el cuadro que la demo quiere —del 20 al 32—
sigue estando y llega primero.

## 9. El ejemplo de asset-list

Break en el segundo 20, 48 s, cuatro avisos de 12 s, con los creativos que la demo
ya tiene (`content/adA`, `adB`, `adC`, los tres de 12,000 s exactos). Guardarlo
como `signalling/asset-list-mixedBreak.json`.

**El tercer asset es el lineal, y tiene `URI` y `DURATION` y nada más.** Es la
decisión de la sección 4 en su forma más chica: un aviso lineal se declara como se
declaró siempre.

```json
{
  "ASSETS": [
    {
      "URI": "/content/adB/index.m3u8",
      "DURATION": 12.0,
      "X-AD-CREATIVE-SIGNALING": {
        "version": 2, "type": "slot",
        "payload": [{
          "type": "cornerOverlay", "start": 0, "duration": 12.0,
          "layout": { "assets": [
            { "id": "ad1-overlay", "type": "application/vnd.apple.mpegurl",
              "uri": "/content/adB/index.m3u8", "viewport": "0 75 75 0", "zDepth": 1 }
          ]}
        }]
      }
    },
    {
      "URI": "/content/adC/index.m3u8",
      "DURATION": 12.0,
      "X-AD-CREATIVE-SIGNALING": {
        "version": 2, "type": "slot",
        "payload": [{
          "type": "squeezebackLShape", "start": 12.0, "duration": 12.0,
          "layout": {
            "primaryContent": { "zDepth": 0, "viewport": "0 40 40 0" },
            "assets": [
              { "id": "ad2-vertical", "type": "application/vnd.apple.mpegurl",
                "uri": "/content/adC/index.m3u8", "viewport": "0 0 0 60", "zDepth": 1 },
              { "id": "ad2-horizontal", "type": "application/vnd.apple.mpegurl",
                "uri": "/content/adA/index.m3u8", "viewport": "60 0 0 0", "zDepth": 2 }
            ]
          }
        }]
      }
    },
    {
      "URI": "/content/adA/index.m3u8",
      "DURATION": 12.0
    },
    {
      "URI": "/content/adB/index.m3u8",
      "DURATION": 12.0,
      "X-AD-CREATIVE-SIGNALING": {
        "version": 2, "type": "slot",
        "payload": [{
          "type": "squeezebackDoubleBox", "start": 36.0, "duration": 12.0,
          "layout": {
            "primaryContent": { "zDepth": 0, "viewport": "25 50 25 0" },
            "assets": [
              { "id": "ad4-box", "type": "application/vnd.apple.mpegurl",
                "uri": "/content/adB/index.m3u8", "viewport": "25 0 25 50", "zDepth": 1 }
            ]
          }
        }]
      }
    }
  ]
}
```

Y el par de tags que lo señaliza, con la forma de reemplazo que el ADR 0017 le
puso al tag de clase Apple —o sea sin `X-RESUME-OFFSET`—:

```
#EXT-X-DATERANGE:ID="AD-1-LINEAR",CLASS="com.apple.hls.interstitial",START-DATE="<PDT+20s>",X-ASSET-LIST="/signalling/asset-list-linear.json",X-RESTRICT="SKIP",PLANNED-DURATION=12
#EXT-X-DATERANGE:ID="AD-1-CONCURRENT",CLASS="com.qualabs.hls.concurrentInterstitial",START-DATE="<PDT+20s>",X-ASSET-LIST="/signalling/asset-list-mixedBreak.json",X-RESUME-OFFSET=0,X-SNAP="OUT,IN",X-RESTRICT="SKIP",PLANNED-DURATION=48
```

**Todo el JSON usa campos que ya existen: no hay un solo campo nuevo, y no hay
ningún valor inventado.** Los bloques de layout de ad1, ad2 y ad4 están copiados
casi literal de `asset-list-cornerOverlay.json`, `asset-list-squeezebackLShape.json`
y `asset-list-squeezebackDoubleBox.json`, cambiando sólo los `id` y el `start`. El
ad3 es el asset lineal, y es la misma forma que
`signalling/asset-list-linear.json` ya tiene desde la fase 01.

**Lo nuevo es una sola cosa y no es un campo:** los `start` acumulados —0, 12, 24,
36— en vez de 0 en todos, que es dato y no código. El del ad3 no está escrito
porque el asset sin bloque no tiene dónde escribirlo, y de ahí sale la pregunta
abierta de la sección 13.

## 10. La línea de tiempo, segundo a segundo

Programa de 180 s, break del 20 al 68.

| Segundo del programa | Qué se ve en nuestro pane | Qué hace el primario | Qué muestra el pane de fábrica |
|---|---|---|---|
| 0 a 20 | Programa a cuadro entero | Corriendo, cuadro entero, audio 100 | Programa, igual cuadro |
| 20 a 32 | **ad1, cornerOverlay**: programa a cuadro entero con `adB` en un recuadro arriba a la izquierda, mudo | Corriendo sin mover: `cornerOverlay` no trae `primaryContent` y la capa le asume el cuadro entero | **Su aviso a cuadro entero** (`adA`, 12 s) |
| 32 a 44 | **ad2, squeezebackLShape**: programa al 60 % arriba a la izquierda, barra vertical a la derecha (`adC`) y horizontal abajo (`adA`), las dos mudas | Corriendo, escalado al 60 % | Vuelve al programa. Mismo cuadro que nosotros, sin las barras |
| 44 a 56 | **ad3, el asset sin bloque**: `adA` a cuadro entero con audio a 100. El programa corre detrás, invisible y en silencio | Corriendo, tapado, volumen 0 | **Programa a cuadro entero.** Acá se invierte la comparación (sección 8) |
| 56 a 68 | **ad4, squeezebackDoubleBox**: programa en la mitad izquierda con 25 % de recorte arriba y abajo, `adB` en la mitad derecha, mudo | Corriendo, escalado a la mitad izquierda | Programa, igual cuadro, sin la caja |
| 68 a 180 | Programa a cuadro entero, volumen restaurado | `clear()` le saca el `style` y le devuelve `volume = 1` | Programa, mismo segundo |

**Nuestra barra durante todo el break** marca **una sola** marca del 20 al 68,
porque un Date Range es un rango del programa aunque su payload declare varias
experiencias (`rangeOfExperiences`, `lib/signalling.js:146-151`). La del pane de
fábrica marca su propio rango, del 20 al 32 (ADR 0018). Si eso es lo correcto para
el ad3, que es a cuadro entero, está en la sección 13.

**Y las tres transiciones —segundos 32, 44 y 56— son lo que hay que mirar en la
grabación:** el renderizador destruye la experiencia anterior entera y construye
la siguiente (`clear()` y `build()`, `lib/renderer.js:162-172`); `clear()` hace
`adHls.destroy()` (`lib/media.js:37`) y `build()` crea una instancia nueva de
hls.js (`lib/media.js:34`). O sea **tres arranques en frío adentro del break**,
cada uno con su fetch de playlist y de segmento antes del primer cuadro, y cada
nodo se crea con fondo negro (`lib/renderer.js:194`). Hoy no se nota porque hay un
aviso por break. **Es lo primero que hay que medir.**

## 11. Lo que no cierra entre la fase 03 escrita y el código

Siete cosas. Las cuatro primeras son de los artefactos de la fase, las tres
últimas son huecos del código que la fase no nombra.

1. **Los cinco punteros de arranque de task apuntan a archivos que no existen.**
   `js/signalling.js` en cuatro tasks y `js/renderer.js` en una. La fase 02 mudó la
   librería a `lib/` (ADR 0015).
2. **El párrafo sobre el atraso del pane de fábrica quedó viejo, invalidado por el
   ADR 0017.** Dice que el pane va 49,47 s atrás y que el quinto aviso no se ve
   nunca. El ADR 0017 pasó ese tag a forma de reemplazo: el atraso ya no existe
   —la T-05 de la fase 04 lo midió en 0,72 s—, el quinto aviso ya se ve, y el
   argumento que ese párrafo pide preservar **se retiró a propósito**. Lo que lo
   reemplaza es la inversión del par de compatibilidad de la sección 8.
3. **La fase no lista los ADR 0017 ni 0018** entre las decisiones que la gobiernan,
   y los dos son de scope `project`, se aceptaron el 2026-09-07 y los dos hablan
   explícitamente de la fase 03.
4. **La conclusión sobre los tres avisos simultáneos vale para el dato de hoy, no
   para el código** (sección 6).
5. **Hueco: dos experiencias consecutivas con el mismo `type` son indistinguibles
   para el renderizador.** La clave es `${e.type}#${e.id}` (`lib/renderer.js:150`)
   y el `id` es el del Date Range, el mismo para todos los items
   (`lib/signalling.js:104-118`). Dos avisos consecutivos del mismo `type` producen
   la misma clave, `nextKey !== key` da falso, **el renderizador no reconstruye y
   el segundo creativo no se ve nunca**. Es exactamente el escenario de un break
   con varios avisos, y lo natural es que dos compartan layout. **Y el asset sin
   bloque lo empeora**: no trae `type` propio, así que dos assets sin bloque
   seguidos comparten clave por construcción. Se arregla dándole identidad propia a
   cada item.
6. **Hueco: el `kind` está hardcodeado y es por break, no por aviso.**
   `lib/signalling.js:150` devuelve `kind: 'concurrent'` fijo, así que un break
   mezclado se reporta como **un** rango entero de clase concurrente. No hay forma
   de expresar "este aviso de adentro del break es a cuadro entero", porque el
   contrato tiene `kind` en `Range` y `Range` es uno por Date Range. Si eso hay que
   arreglarlo o no depende de una decisión que este diseño no toma (sección 13).
7. **Hueco de fondo: el contrato no tiene noción de orden ni de secuencia.**
   `Experience` tiene `startTime` y `duration` y nada más. La secuencia existe sólo
   como aritmética que quien escribe el asset-list hace a mano. **Y la corrección de
   la sección 3.2 lo agranda**: si la regla es reproducir hasta el fin del asset, un
   creativo que dure otra cosa que su `DURATION` declarada corre los `start`
   posteriores, y nadie avisa. Antes era una hipótesis sobre datos mal armados;
   ahora es el comportamiento que la norma pide.

## 12. Lo que todavía no se midió, y por qué importa

Todo lo anterior sale de leer código, la norma y los asset-list. Tres cosas quedan
sin medir porque requieren levantar el servidor y correr el recorrido, y las tres
son la primera task de la fase.

1. **Cuánto dura el arranque en frío de cada instancia de hls.js en las tres
   transiciones de adentro del break** (sección 10). Es la que puede arruinar la
   grabación: cada nodo nace con fondo negro y hoy no se nota porque hay un aviso
   por break.
2. **Qué hace el renderizador con dos experiencias solapadas que declaran cajas
   distintas para el primario** (lectura A). Dejó de ser una hipótesis sobre un
   asset-list mal armado: con la regla de "hasta el fin del asset", un creativo que
   dure más que su `DURATION` declarada solapa al siguiente en operación normal.
3. **Si el primario decodificando detrás de un aviso opaco cuesta lo mismo que
   decodificando visible.** Es lo que dice si el `decoderCount` significa algo real
   bajo C1, y es el dato que le falta a la discusión C1 contra C2 de la sección 7.

## 13. Preguntas abiertas que este diseño no cierra

**Quién avisa que el asset terminó, y qué le pasa a la secuencia cuando el fin real
no coincide con el `DURATION` declarado.** La regla de la norma es "hasta el fin del
asset" (sección 3.2), y la regla 5 del contrato dice que `activeAt` es la única
fuente de la ventana de activación, calculada desde `startTime` y `duration`. Las
dos no pueden ser ciertas a la vez cuando el creativo dura otra cosa. Es una
decisión de la task que construye el mecanismo, y tiene que quedar escrita: de
dónde sale el fin, y qué pasa con los assets que vienen después.

**Si el asset sin bloque tiene que ser un `Range` propio, y de qué `kind`.** El ADR
0018 anticipa que "desde la fase 03 nuestro player reproduce un aviso lineal
tradicional adentro del break, así que va a haber un rango de clase `interstitial`
que es nuestro y que va sobre nuestro riel", y la T-06 de la fase 04 dejó
`KINDS_PLAYED` preparado para recibir esa clase. Pero bajo C1 ese aviso **no cambia
el largo de la línea de tiempo**, y el contrato define `kind` exactamente por eso:
"un rango es concurrente o es de reemplazo, y esa distinción es de semántica —la
primera nunca cambia el largo de la línea de tiempo y la segunda sí (ADR 0016)".
O sea que la anticipación del ADR 0018 no se sigue sola del modelo que este diseño
adopta. Las dos salidas: la barra marca el break entero con una sola marca, como
hoy, y el hueco 6 no hace falta arreglarlo; o el aviso a cuadro entero se marca
aparte, y entonces hay que decidir qué significa su `kind` sin contradecir el
contrato. Es decisión de la task, y hay que escribirla.

**Cómo se declara el desplazamiento de un asset sin bloque.** Un asset con bloque
lleva su `start` adentro del payload; uno sin bloque no tiene dónde. O el
desplazamiento sale de acumular las `DURATION` de los assets anteriores —que es lo
que el ejemplo del Apéndice D.7 hace implícitamente—, o el `start` deja de ser la
fuente. Es la misma decisión que la primera pregunta desde el otro lado.

**Qué cuenta como "no lo puedo reproducir".** Un `mediaType` que el cliente no
soporta, un bloque ausente, un bloque ilegible, o un layout que pide más elementos
que los que el `decoderCount` declara. Los cuatro caen al mismo lugar por la
decisión de la sección 4, pero no tienen por qué **detectarse** igual, y la lista
de los que se detectan es decisión de la task.

**Y dos que la fase le devuelve a SVTA, que son de especificación antes que de
código:** qué regla de claves desconocidas tiene el JSON del asset list, que la
norma no define (sección 3.4); y qué significa un `X-RESUME-OFFSET` en un Date
Range de clase concurrente, que ya venía abierta del ADR 0016.
