# El gasto de la T-03

**US$13,60**, de un techo de **US$19,20**. Diecisiete generaciones de
`veo-3.1-fast-generate-001`, 8 s, 720p, **con audio**, a US$0,10/s = US$0,80 cada una.

El registro lo escribe el generador, una línea por generación **lanzada**, que es lo que se
paga: [`salidas/registro-de-generaciones.tsv`](salidas/registro-de-generaciones.tsv), con el
`operationName` de Vertex de cada una.

| | casillas | generaciones | US$ |
| --- | --- | ---: | ---: |
| la generación que quedó, de cada una de las catorce | 1 a 14 | 14 | 11,20 |
| descartadas de la casilla 8 — las dos volvieron con la cámara montada en el auto | 8 | 2 | 1,60 |
| descartada de la casilla 4 — volvió a nivel de pista pidiendo un aéreo | 4 | 1 | 0,80 |
| | **total** | **17** | **13,60** |

**Doce de las catorce salieron a la primera.** Las tres descartadas son las dos de la casilla
8 y una de la 4, y las tres son el hallazgo de encuadre: no se tiraron, se aprendió con
ellas.

Las tres generaciones descartadas están en
`demo/race-multiview/content/.fuentes/programa/descartes/` con su prompt, porque son la
evidencia del hallazgo de encuadre y no basura.

**El techo no se alcanzó: quedan 7 generaciones / US$5,60.** No se gastaron y es una decisión,
no un olvido. Lo que quedaba por comprar con ellas era regenerar la casilla 7 para bajar la
dispersión de QUENTRA, y regenerar un clip para que un número quede más lindo es esconder el
hallazgo que la task existe para traer.

## Contra el techo de la etapa

| | generaciones | US$ |
| --- | ---: | ---: |
| techo de la etapa 1 (`PHASE.md`) | 28 | 22,40 |
| gastado por el sondeo de la T-02 | 4 | 3,20 |
| gastado por esta task | 17 | 13,60 |
| **sin gastar al cerrar la etapa 1** | **7** | **5,60** |

El precio es el que la T-01 releyó de la página de Vertex el 2026-09-12: US$0,10 por segundo
para este modelo a 720p con audio. Igual que allá, **esto es un cálculo contra la tabla
publicada y no la lectura de una factura.**

## Lo que no fue una generación de Veo

- **Las seis fichas regeneradas**: `generate_image` de `agy`, contra la suscripción de
  Antigravity. **US$0**, y no tocan el techo, que es de Veo.
- **El segundo oyente del portón de audio**: `gemini-2.5-flash` escuchando dieciséis archivos
  de 8 s. Unos 4.000 tokens de audio, menos de un centavo.
- **Todo lo demás** —extracción de cuadros, medición de color, sonoridad, transcripción con
  whisper.cpp, láminas— es `ffmpeg` y Python local. US$0.
