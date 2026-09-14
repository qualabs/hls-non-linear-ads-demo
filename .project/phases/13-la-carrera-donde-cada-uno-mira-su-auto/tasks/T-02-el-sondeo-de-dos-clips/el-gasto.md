# El gasto de la T-02

**US$3,20**, que es el tope de la task. Cuatro generaciones de `veo-3.1-fast-generate-001`,
8 s, 720p, **con audio**, a US$0,10/s = US$0,80 cada una.

| # | archivo en `demo/race-multiview/content/.fuentes/sondeo/` | operación de Vertex | US$ |
| ---: | --- | --- | ---: |
| 1 | `a-casilla-04-aereo-los-seis.mp4` | `01dad938-e4b4-42eb-a9f5-1f17acac93a5` | 0,80 |
| 2 | `b-casilla-12-rueda-runtak.mp4` | `3a34448b-c4b9-4a8b-9ffa-0eb301bfb042` | 0,80 |
| 3 | `c-casilla-04-correccion-aereo-y-lista.mp4` | `97ac7699-fa40-467e-aa77-a0f82d068a0d` | 0,80 |
| 4 | `d-diagnostico-solo-la-camara-aerea.mp4` | `18a66b62-c3c9-4fc4-b92d-f2a132a5b87e` | 0,80 |
| | **total** | | **3,20** |

El precio es el que la T-01 releyó de la página de Vertex el 2026-09-12 y dejó escrito:
US$0,10 por segundo para este modelo a 720p con audio. Igual que allá, **esto es un cálculo
contra la tabla publicada y no la lectura de una factura.**

## La tercera se cobró dos veces menos de lo que podría haberse cobrado, y conviene decir cómo

La generación 3 se pagó una sola vez pero casi se paga dos. El proceso que la esperaba murió a
mitad de camino —edité `generar-sondeo.sh` mientras ese proceso lo estaba leyendo, y `bash` lee
el script por tramos mientras corre—, así que el clip quedó generado en Vertex y sin bajar.

**No se regeneró: se bajó por el `operationName`**, que la salida del script imprime al lanzar
cada generación y que sigue sirviendo después. El `:fetchPredictOperation` devolvió el video ya
hecho.

Dos cosas quedan de ahí, y las dos son del método y no de esta task:

- **Un script que corre no se edita.** Es la causa, y no tiene vuelta.
- **El `operationName` impreso es lo que hizo que el error costara cero.** Ya estaba en el
  script copiado del molde de `hydration-break`; acá se comprobó para qué sirve.

## Lo que no fue una generación de Veo

- **El segundo oyente del portón de audio**, `gemini-2.5-flash` escuchando cuatro archivos de
  8 s, dos veces: unos 2.200 tokens de audio en total. Menos de un centavo, y no cuenta contra
  el tope de cuatro, que es de generaciones de video.
- **Las mediciones de color, de mundo y de nivel**: `ffmpeg`, `whisper.cpp` y Python, todo local.
  US$0.

## Contra el techo de la etapa

`PHASE.md` le da a la etapa 1 un techo de **28 generaciones / US$22,40**, de las cuales el
sondeo tenía **2 esperadas y 4 de tope**. Se usaron **las 4**, y la razón está en
[`el-sondeo.md`](el-sondeo.md) §"Las cuatro generaciones": la primera falló en dos frentes a la
vez y separarlos costaba una generación cada uno.

**Quedan 24 generaciones / US$19,20 para las catorce del programa**, que necesita 14 y tiene 10
de margen para regenerar.
