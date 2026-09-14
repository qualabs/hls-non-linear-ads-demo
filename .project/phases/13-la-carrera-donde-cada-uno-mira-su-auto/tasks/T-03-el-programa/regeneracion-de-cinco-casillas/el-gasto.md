# El gasto de la regeneración

**US$4,00.** Cinco generaciones de `veo-3.1-fast-generate-001`, 8 s, 720p, **con audio**, a
US$0,10/s = US$0,80 cada una. **Ninguna se descartó: las cinco salieron a la primera.**

El registro lo escribe el generador, una línea por generación **lanzada**, que es lo que se
paga, en el mismo archivo que la T-03:
[`../salidas/registro-de-generaciones.tsv`](../salidas/registro-de-generaciones.tsv), con
el `operationName` de Vertex de cada una.

| fecha | casilla | operación | US$ |
| --- | ---: | --- | ---: |
| 2026-09-14T12:36:22 | 1 | `41bd48b2-3793-4bce-a0ee-b1d667484d36` | 0,80 |
| 2026-09-14T12:36:24 | 5 | `c48b9d47-80e1-41fa-9ddb-2336c53113e5` | 0,80 |
| 2026-09-14T12:36:25 | 6 | `23f68a7c-cbff-422c-b50e-d1721bb6c006` | 0,80 |
| 2026-09-14T12:36:26 | 10 | `54c817ab-714b-4e40-80a5-dd703e7dad4a` | 0,80 |
| 2026-09-14T12:36:28 | 12 | `870045b3-ac9e-4cb8-a973-6099fcf79cae` | 0,80 |
| | | **total** | **4,00** |

## Contra el techo de la etapa

| | generaciones | US$ |
| --- | ---: | ---: |
| techo de la etapa 1 (`PHASE.md`) | 28 | 22,40 |
| el sondeo de la T-02 | 4 | 3,20 |
| los catorce clips de la T-03 | 17 | 13,60 |
| esta regeneración | 5 | 4,00 |
| **sin gastar** | **2** | **1,60** |

**El techo no se hizo cumplir por memoria.** El generador cuenta las líneas del registro y
se niega a lanzar si la próxima pasaría de 24, que es lo que le quedaba a la etapa después
del sondeo. Con 17 anotadas y 5 pedidas el conteo daba 22, y el corte quedó a dos
generaciones: **las mismas dos que quedan contra el techo de la etapa.** Los dos números
coinciden porque salen del mismo lugar, y no porque alguien los haya vuelto a sumar.

**No se gastó una sexta ni una séptima, y es una decisión.** Lo que quedaba por comprar con
ellas era regenerar la casilla 10 para que el mar volviera a estar en cuadro. Está
argumentado en [`los-cinco-regenerados.md`](los-cinco-regenerados.md) §5: es una línea del
relato y cuesta centavos resolverla por ahí, contra US$0,80 y el riesgo de volver a traer
el defecto que se acaba de arreglar.

**Los carteles con el logo de Qualabs costaron US$0.** Estaban en el encargo, Nicolás los
sacó dos minutos después, y para ese momento no se había lanzado ninguna generación.

El precio es el que la T-01 releyó de la página de Vertex el 2026-09-12: US$0,10 por
segundo para este modelo a 720p con audio. Igual que allá, **esto es un cálculo contra la
tabla publicada y no la lectura de una factura.**

## Lo que no fue una generación de Veo

- **El portón de transcripción**: `whisper.cpp` local y `gemini-2.5-flash` escuchando los
  catorce clips más los controles. Menos de un centavo.
- **Las mediciones de color, las láminas y la extracción de cuadros**: `ffmpeg` y Python
  local. US$0.
