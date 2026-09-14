# El gasto de la T-08

**US$36,80**, de un techo de **US$57,60**, que es el techo entero de la etapa 3. Cuarenta y
seis generaciones de `veo-3.1-fast-generate-001`, 8 s, 720p, **con audio**, a US$0,10/s =
US$0,80 cada una.

El registro lo escribe el generador, una línea por generación **lanzada**, que es lo que se
paga: [`salidas/registro-de-generaciones.tsv`](salidas/registro-de-generaciones.tsv), con el
`operationName` de Vertex de cada una.

| | clips | generaciones | US$ |
| --- | --- | ---: | ---: |
| los cuarenta del catálogo, que son los que quedaron | 8 × 5 cámaras | 40 | 32,00 |
| rechazados: la pantalla de televisión y los gráficos de transmisión | marvok 4, pentav 6 | 2 | 1,60 |
| rechazados: el auto de ruedas cubiertas | noctev 2 (dos veces), noctev 6 | 3 | 2,40 |
| rechazado: el nombre del color pintado y legible en la carrocería | noctev 4 | 1 | 0,80 |
| **perdidas por `code 14` de Vertex** | ninguna | **0** | **0,00** |
| | **total** | **46** | **36,80** |

**Treinta y cuatro de los cuarenta salieron a la primera, el 85 %.** Los seis rechazos
caen en tres modos de falla distintos y cinco de los seis son de dos cámaras: NOCTEV se
llevó cuatro y las otras cuatro cámaras, dos entre todas. RUNTAK y QUENTRA volvieron 8 de 8.

## Las que Vertex no devolvió: ninguna

Es el número que más se aparta de lo que la T-05 dejó presupuestado. Allá fueron 3 de 13
lanzamientos y en la T-03 fueron 2 de 6 — cinco eventos en dos días, con los que se estimó
un 20 % de pérdidas sobre las 40 generaciones de esta etapa, o sea **US$6,40 que el techo
tenía que contener**. Acá fueron **0 de 46**.

**Eso no invalida la estimación y no hay que reescribirla en sentido contrario.** Cero de
46 dice que la tasa no es del 20 % siempre; con las cinco pérdidas anteriores en la misma
cuenta son 5 de 59 lanzamientos en tres días, **el 8 %**. Lo que la estimación compró fue
espacio en el techo, y el espacio sobró: la task cerró US$20,80 por debajo. Un `code 14` es
un estado del servicio y no una propiedad del prompt, así que la próxima corrida puede
volver a tener tres.

## Contra el techo de la etapa

| | generaciones | US$ |
| --- | ---: | ---: |
| techo de la etapa 3 (`PHASE.md` y `TASKS.md`) | 72 | 57,60 |
| gastado por esta task | 46 | 36,80 |
| **sin gastar al cerrar la etapa 3** | **26** | **20,80** |

**El techo no se hace cumplir por memoria.** El generador cuenta las líneas del registro y
se niega a lanzar si la próxima pasaría de 72. Se lo vio frenar con 72 anotadas y una
pedida, **y se lo vio no frenar** con 60 anotadas y ocho pedidas, las dos cosas sin tocar
Vertex: [`salidas/los-guardas-se-ven-fallar.txt`](salidas/los-guardas-se-ven-fallar.txt),
casos 1 y 2.

**El caso que no frena es el que la T-05 no pudo construir sin pagarlo**, y ahí está el
arreglo que esta task heredó: `--contar` corre el chequeo del tope, arma los cuarenta
prompts con todos sus guardas, imprime lo que haría, y **sale antes del primer POST**. Allá
verlo no frenar costó una generación de US$0,80 lanzada sin querer; acá cuesta cero y se
puede correr cuantas veces se quiera.

## El total de la fase

**Corrección del 2026-09-14, hecha al cerrar la fase.** Esta sección decía 28 generaciones /
US$22,40 en la etapa 1 y **88 / US$70,40** en el total. Faltaban las **doce generaciones
(US$9,60) de las tres regeneraciones de la T-03**: sus registros viven en subcarpetas de esa
task y no en su informe principal, así que no entraron en la suma cuando se escribió esto. Los
números propios de la T-08 —46 generaciones, US$36,80— no cambian. La tabla de abajo es la
corregida.

| etapa | generaciones | US$ |
| --- | ---: | ---: |
| 1 — el programa (T-02 y T-03, con sus tres regeneraciones) | 33 | 26,40 |
| 2 — la cámara de CALDRIX (T-05) | 14 | 11,20 |
| 3 — las cinco restantes (T-08) | 46 | 36,80 |
| | **93** | **74,40** |

Contra el techo de la fase entera —116 generaciones, US$92,80— **quedaron sin gastar 23
generaciones, US$18,40**.

El precio es el que la T-01 releyó de la página de Vertex el 2026-09-12: US$0,10 por segundo
para este modelo a 720p con audio. Igual que en las tasks anteriores, **esto es un cálculo
contra la tabla publicada y no la lectura de una factura**.

## Lo que no fue una generación de Veo

- **El portón de transcripción**: `whisper.cpp` local sobre los cuarenta clips más sus
  controles, y `gemini-2.5-flash` escuchando diez archivos por cámara más los cinco feeds
  armados. Unos pocos centavos.
- **Todo lo demás** —extracción de cuadros, medición del cielo, del color y de sonoridad, los
  cinco concat, las láminas— es `ffmpeg` y Python local. US$0.
