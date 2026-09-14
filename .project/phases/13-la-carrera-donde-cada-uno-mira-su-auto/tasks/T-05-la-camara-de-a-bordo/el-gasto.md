# El gasto de la T-05

**US$11,20**, de un techo de **US$12,80**, que es el techo entero de la etapa 2. Catorce
generaciones de `veo-3.1-fast-generate-001`, 8 s, 720p, **con audio**, a US$0,10/s =
US$0,80 cada una.

El registro lo escribe el generador, una línea por generación **lanzada**, que es lo que se
paga: [`salidas/registro-de-generaciones.tsv`](salidas/registro-de-generaciones.tsv), con el
`operationName` de Vertex de cada una.

| | clips | generaciones | US$ |
| --- | --- | ---: | ---: |
| los ocho del feed, que son los que quedaron | 1 a 8 | 8 | 6,40 |
| **perdidas por `code 14` de Vertex** — terminaron `done: true` y sin video | 2, 3, 7 | 3 | 2,40 |
| rechazadas: la cámara que mira hacia atrás devolvió el auto violeta adelante | 3, 7 | 2 | 1,60 |
| **lanzada sin querer** — ver abajo | 1 | 1 | 0,80 |
| | **total** | **14** | **11,20** |

**Seis de los ocho salieron a la primera.** Los otros dos —el 3 y el 7— costaron dos
generaciones cada uno, y ninguna de las dos se tiró: la primera es la evidencia de que la
cámara de a bordo de Veo no mira hacia atrás, que es el hallazgo de la task.

## Las tres que Vertex no devolvió

| lanzamiento | clip | operación | qué pasó |
| --- | ---: | --- | --- |
| 2026-09-14T15:06:05 | 2 | `700b7344-…` | `code 14, Service is currently unavailable` |
| 2026-09-14T15:12:05 | 3 | `9162d0af-…` | ídem |
| 2026-09-14T15:12:11 | 7 | `66209345-…` | ídem |

**Las tres se verificaron antes de relanzar y no se reintentaron a ciegas**: se volvió a
pedir cada operación con `:fetchPredictOperation` y las tres siguen devolviendo `done: true`
con el mismo error y sin video, o sea que el prompt nunca se llegó a evaluar y no hay clip
que mirar. Verbatim en [`salidas/el-error-14-del-clip-2.txt`](salidas/el-error-14-del-clip-2.txt).
Las tres relanzadas volvieron bien.

**La tasa de esta corrida es 3 de 13 lanzamientos, el 23 %**, contra 2 de 6 en la segunda
regeneración de la T-03. Son cinco eventos en dos días sobre dos tandas distintas, así que
**no es una casualidad de una corrida y hay que presupuestarlo**: si la etapa 3 lanza 40
generaciones, un 20 % de pérdidas son **8 generaciones, US$6,40**, y el techo de esa etapa
es US$57,60. Entra, pero sólo si está contado.

## La que se lanzó sin querer

Al construir el control del tope —hay que verlo frenar **y** verlo no frenar, porque un
tope que rechaza todo también "frena"— el segundo comando se cortó con un `timeout` de tres
segundos esperando que no llegara al primer POST, y llegó. **Se pagó una generación de
US$0,80 que nadie pidió, y es un error de esta task y no de la herramienta.**

Lo que se hizo con eso: la operación queda anotada en el registro como cualquier otra —lo
que se cuenta es lo que se pidió— y el clip se baja con su `operationName`, que no cuesta
una segunda vez, a `content/.fuentes/camaras/caldrix/descartes/`. El clip 1 del feed no se
toca: el que está es el bueno.

**Y el arreglo no es acordarse**: el control de "no frena" no necesita tocar la red. El
script ya imprime el gasto antes del primer POST, así que lo que hay que separar es
**contar** de **lanzar** — una opción tipo `--contar` que corra el chequeo del tope y salga.
No se agregó acá porque es una decisión sobre el generador que la etapa 3 va a heredar, y
va como propuesta y no como hecho.

## Contra el techo de la etapa

| | generaciones | US$ |
| --- | ---: | ---: |
| techo de la etapa 2 (`PHASE.md` y `TASKS.md`) | 16 | 12,80 |
| gastado por esta task | 14 | 11,20 |
| **sin gastar al cerrar la etapa 2** | **2** | **1,60** |

**El techo no se hace cumplir por memoria.** El generador cuenta las líneas del registro y
se niega a lanzar si la próxima pasaría de 16. Se lo vio frenar con catorce anotadas y
cuatro pedidas, sin llamar a Vertex:
[`salidas/el-tope-se-ve-frenar.txt`](salidas/el-tope-se-ve-frenar.txt).

El precio es el que la T-01 releyó de la página de Vertex el 2026-09-12: US$0,10 por segundo
para este modelo a 720p con audio. Igual que allá, **esto es un cálculo contra la tabla
publicada y no la lectura de una factura** — y sigue sin poder verificarse si Vertex cobra
una operación que termina en `code 14`. Las tres se cuentan como gastadas, que es el
supuesto conservador.

## Lo que no fue una generación de Veo

- **El portón de transcripción**: `whisper.cpp` local sobre los ocho clips más nueve
  controles, y `gemini-2.5-flash` escuchando diez archivos de 8 s más los 64 s del feed.
  Menos de dos centavos.
- **Todo lo demás** —extracción de cuadros, medición de color, del cielo y de sonoridad, el
  concat, las láminas— es `ffmpeg` y Python local. US$0.
