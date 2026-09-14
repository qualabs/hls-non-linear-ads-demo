# El gasto de sacarle la marca a la casilla 10

**US$0,80.** Una sola generación de `veo-3.1-fast-generate-001`, 8 s, 720p, **con audio**, a
US$0,10/s. **Volvió el clip a la primera y sirve**, así que no hubo una segunda.

El registro lo escribe el generador, una línea por generación **lanzada**, en el mismo
archivo que las corridas anteriores:
[`../salidas/registro-de-generaciones.tsv`](../salidas/registro-de-generaciones.tsv).

| fecha | casilla | operación | US$ | qué devolvió |
| --- | ---: | --- | ---: | --- |
| 2026-09-14T14:04:30 | 10 | `c1f4278f-db32-41e8-bc56-6b1834866e2a` | 0,80 | el clip |
| | | **total** | **0,80** | |

**Ningún lanzamiento se perdió por infraestructura.** El intento anterior tuvo dos
operaciones que terminaron con `code 14, Service is currently unavailable` —`done: true` y
sin video—, y por eso había que mirarlo. Acá la única operación lanzada devolvió el video en
la primera consulta. No hubo relanzamientos y no hay líneas que separar.

## Contra el techo de la etapa

| | generaciones | US$ |
| --- | ---: | ---: |
| techo de la etapa 1, con la excepción que Nicolás aprobó | | **30,00** |
| el sondeo de la T-02 | 4 | 3,20 |
| los catorce clips de la T-03 | 17 | 13,60 |
| la primera regeneración, de cinco casillas | 5 | 4,00 |
| la segunda regeneración, de cuatro casillas | 6 | 4,80 |
| esta regeneración, la casilla 10 sola | 1 | 0,80 |
| **gastado** | **33** | **26,40** |
| **sin gastar** | | **3,60** |

**El techo no se hace cumplir por memoria.** El generador cuenta las líneas del registro y
se niega a lanzar si la próxima pasaría de `TOPE_GENERACIONES`, que subió de 28 a 33 con el
techo nuevo: US$30,00 menos los US$3,20 del sondeo, que no pasan por este archivo, son
US$26,80, o sea 33 generaciones a US$0,80. Con 29 anotadas quedan **cuatro** antes de que el
próximo lanzamiento muera solo.

El precio es el que la T-01 releyó de la página de Vertex el 2026-09-12: US$0,10 por segundo
para este modelo a 720p con audio. **Es un cálculo contra la tabla publicada y no la lectura
de una factura.**

## Lo que no fue una generación de Veo

- **Los recortes, los zooms y la lámina de comparación**: `ffmpeg` local. US$0.
- **La medición del verde**: Pillow local. US$0.
