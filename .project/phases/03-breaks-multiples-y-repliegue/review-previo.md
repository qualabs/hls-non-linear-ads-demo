# Review previo a la fase 03: varios avisos en un break

Lectura que pidió Nicolás antes de arrancar la fase, fechada 2026-09-07. No modifica nada del proyecto: es insumo de la T-01 y la T-02.

### 1. De dónde salió el diseño

Todo el input de diseño que existe es una frase de David en la reunión del 2026-09-04: *"the big thing right now... we need to show doing an ad break with multiple ads within there... in the asset list JSON it says an array... you just add them in there. And it'd be really cool if we can show concurrent, concurrent, linear, concurrent, mixing that up."* No hay ADR sobre varios avisos, no hay sección del contrato sobre secuencia, y no hay código escrito.

La mitad de la frase que se suele pasar por alto: David dice que los avisos van en el array `ASSETS[]`, no en el `payload[]` de un mismo asset. Son dos anidamientos distintos, hoy el código los aplana igual, y para el repliegue la diferencia importa porque el `URI` y la `DURATION` de repliegue son campos **por `ASSET`**.

### 2. Qué está construido y qué está sólo diseñado

**Construido y corriendo:** la señalización lee Date Ranges de las dos clases y resuelve el bloque de SVTA a `Experience[]`; los dos loops que iteran `ASSETS[]` y `payload[]` ya existen (`lib/signalling.js:130` y `:132`); el renderizador dibuja N elementos por experiencia; el contrato como documento; el SDK con `playedRanges` y `KINDS_PLAYED`; el par de compatibilidad; y el recorrido de cinco breaks con **un aviso por break**.

**Sólo diseñado** (fase 03 en `planning`, 8 tasks en `planned`, cero líneas): la secuencia adentro del break, el lineal en el medio, el repliegue y el `decoderCount`.

**Sin decidir en ningún lado:** qué significa un lineal adentro de un break concurrente; de qué dato sale el desplazamiento de cada aviso; qué cuenta como "no lo puedo reproducir"; y el nombre del parámetro del `decoderCount`.

### 3. Confirmación de que encender hls.js no es la salida

Sobre `vendor/hls.min.js`, el bundle que la demo sirve: la cadena `com.apple.hls.interstitial` aparece **exactamente una vez**, dentro del getter `isInterstitial`, como igualdad exacta — `{key:"isInterstitial",get:function(){return"com.apple.hls.interstitial"===this.class}}` — y `com.qualabs` aparece **cero** veces. Encender el controlador no reproduciría un `ASSET` de nuestro asset-list, porque arma su agenda desde Date Ranges de clase Apple.

### 4. El bug de la secuencia: cierto sobre el código, pero depende del dato

La fase dice que hoy los avisos saldrían todos a la vez. Es correcto sobre el código y la línea es `lib/signalling.js:115` — `startTime: slotStart + Number(item.start ?? 0)` — con `resolveAssetList` (`:128-137`) pasándole el **mismo** `slotStart` a cada item y sin acumulador en ningún lado del archivo.

**Pero el que posiciona cada aviso es el `start` del item.** Con `start: 0, 12, 24, 36` el código de hoy **ya los secuencia bien sin tocar una línea**. Salen los tres juntos sólo con `start: 0` en todos, que es lo que emite la herramienta de SVTA y lo que traen los seis asset-list de la demo. O sea que la secuencia puede ser un problema de **datos** y no de código, y eso puede achicar bastante la T-03.

### 5. Qué significa mezclar concurrente y lineal: las tres lecturas

**Lectura A, los concurrentes se ven encima del lineal.** Expresable en el contrato, pero rota en el renderizador: cada experiencia trae su propio primario (`lib/signalling.js:107`) y con dos activas `drawn` termina con dos entradas apuntando al mismo nodo `<video>` (`lib/renderer.js:185-187`); `place()` las aplica a las dos y gana la última (`:232-239`). Y aun arreglada, en pantalla es un aviso encima de otro aviso.

**Lectura B, el lineal pausa todo.** No expresable en el contrato y rota por tres mecanismos. El de fondo: `lib/renderer.js:149` lee `provider.activeAt(video.currentTime)`, así que **todo el contrato está parametrizado por el tiempo del primario**; si el primario se pausa, `currentTime` se congela, la ventana de activación nunca avanza y **el lineal no termina nunca**. Además el `pause` del primario pausa todos los nodos de aviso (`:374-379`, `:423-424`), incluido el del lineal. Requeriría una noción de "esta experiencia suspende el reloj del programa" y un reloj propio del renderizador.

**Lectura C, el lineal va en secuencia y nunca al mismo tiempo.** Es la que la fase ya asume y la lectura natural de la frase de David: "concurrent, concurrent, linear, concurrent" enumera cuatro entradas de un array en orden, y "concurrent" nombra el tipo de cada aviso (concurrente con el programa), no concurrencia entre avisos.

Adentro de C queda la bifurcación real:

- **C1:** el lineal es un elemento a cuadro entero y el programa sigue corriendo detrás, tapado y en silencio. Expresable hoy **sin agregar un solo campo al contrato**: `viewport "0 0 0 0"`, `zDepth` arriba del primario, `volume: 100` en el aviso y `volume: 0` en el primario.
- **C2:** el lineal detiene el programa de verdad. Requiere todo lo de la lectura B.

**Recomendación: C1**, por tres razones. Es **indistinguible de C2 en pantalla**, que es la vara de la demo. No abre el ADR 0002 ni amplía el contrato, que es el único riesgo de calendario de la fase a tres semanas de la ventana de grabación. Y mantiene el ADR 0016 intacto y la barra honesta.

**Lo que C1 no da, dicho de frente:** no ahorra un decodificador. El primario sigue decodificando detrás del aviso opaco. Si el `decoderCount` va a significar algo real, C2 es la que libera el decodificador del primario. Hoy es passthrough por diseño de la propia fase, así que no muerde todavía.

### 6. El problema que C1 le hace al par de compatibilidad

El tag de clase Apple y el concurrente comparten `START-DATE` (`scripts/senalizar-contenido.sh:82-83`), y el ADR 0018 dice que eso es lo que hace que el par sea un par. Con un break mezclado de 48 s y el lineal tercero:

- Del segundo 20 al 32, el pane de fábrica muestra **su** aviso a cuadro entero y el nuestro muestra el programa con un overlay encima. **Ese es el cuadro que la demo quiere.**
- Del 44 al 56 está **invertido**: el nuestro muestra un aviso a cuadro entero y el de fábrica muestra el programa.

Los dos panes siguen en el mismo segundo del programa (el ADR 0017 se cumple), pero durante un tramo del break **la comparación dice lo contrario de lo que quiere decir**. Para que los dos avisos a cuadro entero coincidan, el tag de clase Apple tendría que arrancar en el 44 y no en el 20, y ahí se rompe el `START-DATE` compartido del ADR 0018.

No tiene solución obvia y es decisión de producto. Las opciones: poner el lineal primero en la mezcla (contradice el "in the middle" pero salva el par), aceptar la inversión y explicarla, o desalinear los `START-DATE`. **Es lo que hay que llevarle a David**, porque es lo que él va a contar en escenario.

### 7. El ejemplo de asset-list

Break en el segundo 20, 48 s, cuatro avisos de 12 s, con los creativos que la demo ya tiene (`content/adA`, `adB`, `adC`, los tres de 12,000 s exactos). Guardarlo como `signalling/asset-list-mixedBreak.json`.

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
      "DURATION": 12.0,
      "X-AD-CREATIVE-SIGNALING": {
        "version": 2, "type": "slot",
        "payload": [{
          "type": "linear", "start": 24.0, "duration": 12.0,
          "layout": {
            "primaryContent": { "zDepth": 0, "viewport": "0 0 0 0", "volume": 0 },
            "assets": [
              { "id": "ad3-linear", "type": "application/vnd.apple.mpegurl",
                "uri": "/content/adA/index.m3u8", "viewport": "0 0 0 0", "zDepth": 1, "volume": 100 }
            ]
          }
        }]
      }
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

Y el par de tags que lo señaliza:

```
#EXT-X-DATERANGE:ID="AD-1-LINEAR",CLASS="com.apple.hls.interstitial",START-DATE="<PDT+20s>",X-ASSET-LIST="/signalling/asset-list-linear.json",X-RESTRICT="SKIP",PLANNED-DURATION=12
#EXT-X-DATERANGE:ID="AD-1-CONCURRENT",CLASS="com.qualabs.hls.concurrentInterstitial",START-DATE="<PDT+20s>",X-ASSET-LIST="/signalling/asset-list-mixedBreak.json",X-RESUME-OFFSET=0,X-SNAP="OUT,IN",X-RESTRICT="SKIP",PLANNED-DURATION=48
```

**Todo el JSON usa campos que ya existen: no hay un solo campo nuevo.** Los bloques de layout de ad1, ad2 y ad4 están copiados casi literal de `asset-list-cornerOverlay.json`, `asset-list-squeezebackLShape.json` y `asset-list-squeezebackDoubleBox.json`, cambiando sólo los `id` y el `start`.

**Lo nuevo son dos cosas y ninguna es un campo:** los `start` acumulados (0, 12, 24, 36) en vez de 0 en todos, que es dato y no código; y `"type": "linear"`, que es un valor que la herramienta de SVTA no emite y que **es una etiqueta inventada y hay que decidirla** — el contrato define `type` como etiqueta opaca del layout y el renderizador no la interpreta, así que es legal.

**Y una decisión que la fase deja abierta para SVTA:** el `PHASE.md` pregunta si el lineal se declara **sin** bloque `X-AD-CREATIVE-SIGNALING`. Acá se declaró **con** bloque, por tres razones: así el `URI` de nivel superior queda libre para su único rol de repliegue; es la única forma que el resolvedor de hoy puede ver, porque un `ASSET` sin bloque contribuye cero experiencias (`lib/signalling.js:132` itera `block?.payload || []`); y con bloque el lineal tiene `duration` propia y la secuencia cierra. **Es una propuesta, no una decisión tomada.**

### 8. La línea de tiempo, segundo a segundo

Programa de 180 s, break del 20 al 68. Tabla con estas columnas: segundo del programa, qué se ve en nuestro pane, qué hace el primario, y qué muestra el pane de fábrica.

| Segundo del programa | Qué se ve en nuestro pane | Qué hace el primario | Qué muestra el pane de fábrica |
|---|---|---|---|
| 0 a 20 | Programa a cuadro entero | Corriendo, cuadro entero, audio 100 | Programa, igual cuadro |
| 20 a 32 | **ad1, cornerOverlay**: programa a cuadro entero con `adB` en un recuadro arriba a la izquierda, mudo | Corriendo sin mover: `cornerOverlay` no trae `primaryContent` y la capa le asume el cuadro entero | **Su aviso a cuadro entero** (`adA`, 12 s) |
| 32 a 44 | **ad2, squeezebackLShape**: programa al 60 % arriba a la izquierda, barra vertical a la derecha (`adC`) y horizontal abajo (`adA`), las dos mudas | Corriendo, escalado al 60 % | Vuelve al programa. Mismo cuadro que nosotros, sin las barras |
| 44 a 56 | **ad3, lineal**: `adA` a cuadro entero con audio a 100. El programa corre detrás, invisible y en silencio | Corriendo, tapado, volumen 0 | **Programa a cuadro entero.** Acá se invierte la comparación (sección 6) |
| 56 a 68 | **ad4, squeezebackDoubleBox**: programa en la mitad izquierda con 25 % de recorte arriba y abajo, `adB` en la mitad derecha, mudo | Corriendo, escalado a la mitad izquierda | Programa, igual cuadro, sin la caja |
| 68 a 180 | Programa a cuadro entero, volumen restaurado | `clear()` le saca el `style` y le devuelve `volume = 1` | Programa, mismo segundo |

Abajo de la tabla: **nuestra barra durante todo el break** marca **una sola** marca del 20 al 68, porque un Date Range es un rango del programa aunque su payload declare varias experiencias (`rangeOfExperiences`, `lib/signalling.js:146-151`). La del pane de fábrica marca su propio rango, del 20 al 32 (ADR 0018).

**Y las tres transiciones (segundos 32, 44 y 56) son lo que hay que mirar en la grabación:** el renderizador destruye la experiencia anterior entera y construye la siguiente (`clear()` y `build()`, `lib/renderer.js:162-172`); `clear()` hace `adHls.destroy()` (`lib/media.js:37`) y `build()` crea una instancia nueva de hls.js (`lib/media.js:34-36`). O sea **tres arranques en frío adentro del break**, cada uno con su fetch de playlist y de segmento antes del primer cuadro, y cada nodo se crea con fondo negro (`lib/renderer.js:197`). Hoy no se nota porque hay un aviso por break. **Esto es lo que la T-01 tiene que medir y la fase no lo nombra.**

### 9. Lo que no cierra entre la fase 03 y el código

Siete cosas. Las cuatro primeras son de la fase, las tres últimas son huecos del código que la fase no nombra.

1. **Todos los paths del `TASKS.md` apuntan a archivos que no existen.** Dice `js/signalling.js` en las T-01, T-03, T-05 y T-06, y `js/renderer.js` en la T-04. La fase 02 mudó la librería a `lib/` (ADR 0015). Son cinco punteros de arranque de task que mandan al lugar equivocado.
2. **El párrafo de la T-08 sobre el pane de fábrica quedó viejo, invalidado por un ADR de ayer.** Dice que el pane va 49,47 s atrás y que el quinto aviso no se ve nunca. El ADR 0017 pasó ese tag a forma de reemplazo: el atraso ya no existe, el quinto aviso ya se ve, y el argumento que la T-08 pide preservar **se retiró a propósito**. Hay que reescribirlo entero, y lo que lo reemplaza es el problema de la inversión de la sección 6.
3. **La fase no lista los ADR 0017 ni 0018** entre las decisiones que la gobiernan, y los dos son de scope `project`, se aceptaron el 2026-09-07 y los dos hablan explícitamente de la fase 03.
4. **La conclusión sobre los tres avisos simultáneos vale para el dato de hoy, no para el código** (sección 4).
5. **Hueco: dos experiencias consecutivas con el mismo `type` son indistinguibles para el renderizador.** La clave es `${e.type}#${e.id}` (`lib/renderer.js:150`) y el `id` es el del Date Range, el mismo para todos los items (`lib/signalling.js:104-118`). Dos avisos consecutivos del mismo `type` producen la misma clave, `nextKey !== key` da falso, **el renderizador no reconstruye y el segundo creativo no se ve nunca**. Es exactamente el escenario de la T-03, que pide tres avisos concurrentes, y lo natural es que dos compartan layout. Se arregla dándole identidad propia a cada item, que es un campo que el contrato hoy no tiene.
6. **Hueco: el `kind` está hardcodeado y es por break, no por aviso.** `lib/signalling.js:150` devuelve `kind: 'concurrent'` fijo, así que un break mezclado se reporta como **un** rango entero de clase concurrente. El ADR 0018 promete que nuestro lineal va a ser un rango de clase `interstitial` sobre nuestro riel y `KINDS_PLAYED` es el filtro que lo dejaría pasar, pero **no hay forma de producirlo**: el contrato tiene `kind` en `Range` y `Range` es uno por Date Range.
7. **Hueco de fondo: el contrato no tiene noción de orden ni de secuencia.** `Experience` tiene `startTime` y `duration` y nada más. La secuencia existe sólo como aritmética que quien escribe el asset-list hace a mano, y si un creativo dura otra cosa que su `duration` declarada, los `start` posteriores quedan corridos y **nadie avisa**.

### 10. Lo que no se midió, y por qué

Todo lo anterior sale de leer. Tres cosas quedan sin medir porque requieren levantar el servidor y correr el recorrido: cuánto dura el arranque en frío de cada instancia en las tres transiciones (sección 8), qué hace el renderizador con dos experiencias solapadas que declaran cajas distintas para el primario (lectura A), y si el primario decodificando detrás de un aviso opaco cuesta lo mismo que decodificando visible (importa para que el `decoderCount` signifique algo).
