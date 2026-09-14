# El gasto de la segunda regeneración

**US$4,80.** Seis generaciones de `veo-3.1-fast-generate-001`, 8 s, 720p, **con audio**, a
US$0,10/s = US$0,80 cada una, para cuatro casillas. **Dos de las seis no devolvieron
nada**: Vertex las terminó con `code 14, Service is currently unavailable`.

El registro lo escribe el generador, una línea por generación **lanzada**, que es lo que se
paga, en el mismo archivo que la T-03:
[`../salidas/registro-de-generaciones.tsv`](../salidas/registro-de-generaciones.tsv), con el
`operationName` de Vertex de cada una.

| fecha | casilla | operación | US$ | qué devolvió |
| --- | ---: | --- | ---: | --- |
| 2026-09-14T13:16:33 | 1 | `a7c811e2-2472-4c6b-9222-55f30980f763` | 0,80 | **error 14, sin video** |
| 2026-09-14T13:16:34 | 5 | `33acbe75-14db-441c-b98a-7f495b6d71e8` | 0,80 | el clip |
| 2026-09-14T13:16:35 | 10 | `9ad4157a-2db9-4ae6-a6da-44982abe3c78` | 0,80 | **error 14, sin video** |
| 2026-09-14T13:16:37 | 12 | `3cbe9b92-10f3-42ec-bded-734d4dfc669a` | 0,80 | el clip |
| 2026-09-14T13:25:29 | 1 | `e6bd13ae-5ec3-4255-ba33-fa216474409b` | 0,80 | el clip |
| 2026-09-14T13:25:31 | 10 | `fb03ac28-96bc-426c-9b67-d5409698f5ae` | 0,80 | el clip |
| | | **total** | **4,80** | |

**Las dos que fallaron se relanzaron y es una decisión de ejecución, no un reintento a
ciegas.** Las dos terminaron con `done: true` y un error del servicio, o sea que el prompt
nunca se llegó a evaluar: no hay clip que mirar ni diagnóstico que hacer. Se comprobó
volviendo a pedir las dos operaciones, que siguen devolviendo el mismo error, y recién ahí
se relanzaron. Las dos líneas se anotan igual, porque lo que el registro cuenta es lo que se
pidió.

## Contra el techo de la etapa

| | generaciones | US$ |
| --- | ---: | ---: |
| techo de la etapa 1, con la excepción que Nicolás aprobó | | **26,00** |
| el sondeo de la T-02 | 4 | 3,20 |
| los catorce clips de la T-03 | 17 | 13,60 |
| la primera regeneración, de cinco casillas | 5 | 4,00 |
| esta regeneración, de cuatro casillas | 6 | 4,80 |
| **gastado** | **32** | **25,60** |
| **sin gastar** | | **0,40** |

**Quedan US$0,40 y una generación cuesta US$0,80: el techo está alcanzado.** Por eso la
casilla 10 queda sin regenerar aunque no se pueda usar, y por eso la task cierra acá y lo
reporta, que es lo que el encargo pedía.

**El techo no se hizo cumplir por memoria.** El generador cuenta las líneas del registro y
se niega a lanzar si la próxima pasaría de 28, que es lo que el techo de US$26,00 deja para
este archivo una vez descontado el sondeo. Con 28 anotadas, el próximo lanzamiento muere
solo.

El precio es el que la T-01 releyó de la página de Vertex el 2026-09-12: US$0,10 por segundo
para este modelo a 720p con audio. Igual que allá, **esto es un cálculo contra la tabla
publicada y no la lectura de una factura** — y en particular **no se pudo verificar si
Vertex cobra una operación que termina en `code 14`**. Las dos se cuentan como gastadas, que
es el supuesto conservador.

## Lo que no fue una generación de Veo

- **El portón de transcripción**: `whisper.cpp` local y `gemini-2.5-flash` escuchando los
  catorce clips más los controles. Menos de un centavo.
- **Las láminas, los recortes y la extracción de cuadros**: `ffmpeg` local. US$0.
