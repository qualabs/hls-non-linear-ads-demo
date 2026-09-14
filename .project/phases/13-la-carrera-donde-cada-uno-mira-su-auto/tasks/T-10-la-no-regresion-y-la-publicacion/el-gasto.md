# El gasto de la fase, sumado etapa por etapa

**Esta task gastó US$0,00**: cero generaciones de Veo, cero llamadas a un modelo. Lo que
suma acá es el gasto de las otras, y se suma de los registros y no de los informes.

**La fase gastó US$74,40 en 93 generaciones** de `veo-3.1-fast-generate-001`, 8 s, 720p, con
audio, a US$0,10/s = US$0,80 cada una.

## De dónde sale cada número

**No de la prosa de los informes: de los registros de generaciones**, que son una línea por
generación **lanzada**, que es lo que se paga. Es la diferencia que importa acá, porque dos
informes de esta misma fase sumaron mal y los dos se ven perfectamente razonables (§"Los dos
totales que no cierran").

```
$ for f in T-03-el-programa T-05-la-camara-de-a-bordo T-08-las-cinco-camaras; do
    n=$(grep -vc '^#' "$f/salidas/registro-de-generaciones.tsv")
    s=$(grep -v '^#' "$f/salidas/registro-de-generaciones.tsv" | awk -F'\t' '{t+=$(NF-1)} END{printf "%.2f", t}')
    echo "$f: $n generaciones lanzadas, columna US\$ suma $s"
  done
T-03-el-programa: 29 generaciones lanzadas, columna US$ suma 23.20
T-05-la-camara-de-a-bordo: 14 generaciones lanzadas, columna US$ suma 11.20
T-08-las-cinco-camaras: 46 generaciones lanzadas, columna US$ suma 36.80

$ ls T-02-el-sondeo-de-dos-clips/salidas/registro-generacion-*.txt | wc -l
4
```

La T-02 es la única que no lleva TSV: son cuatro archivos, uno por generación, con su
`operationName`. Las tres regeneraciones de la T-03 **escriben en el mismo TSV que la T-03**,
que es por qué sus 29 líneas son más que las 17 de su informe principal.

## Etapa por etapa, contra el techo que `PHASE.md` declaró

| etapa | quién gastó | generaciones | US$ | techo de la etapa | sin gastar |
| --- | --- | ---: | ---: | ---: | ---: |
| **1. el programa** | T-02 el sondeo | 4 | 3,20 | | |
| | T-03 las catorce casillas | 17 | 13,60 | | |
| | T-03 regeneración de cinco | 5 | 4,00 | | |
| | T-03 regeneración de cuatro | 6 | 4,80 | | |
| | T-03 la casilla 10 sola | 1 | 0,80 | | |
| | **etapa 1** | **33** | **26,40** | 28 / **22,40** | **−4,00** |
| **2. una cámara** | T-05 CALDRIX | 14 | 11,20 | 16 / **12,80** | 1,60 |
| **3. las cinco restantes** | T-08 | 46 | 36,80 | 72 / **57,60** | 20,80 |
| | **la fase** | **93** | **74,40** | 116 / **92,80** | **18,40** |

**La etapa 1 se pasó de su techo, y no fue por deriva: el techo lo subió Nicolás dos veces.**
Primero a US$26,00 y después a US$30,00, y las dos veces la task siguiente lo escribió antes
de gastar, con el corte del generador recalculado al número nuevo. Contra el techo vigente al
cerrar la etapa —US$30,00— quedaron **US$3,60 sin gastar**.

| el techo de la etapa 1 | US$ | dónde está escrito |
| --- | ---: | --- |
| como lo declaró `PHASE.md` | 22,40 | la tabla de las tres compuertas |
| con la primera excepción | 26,00 | `T-03/regeneracion-de-cuatro-casillas/el-gasto.md` |
| con la segunda, que es la vigente | **30,00** | `T-03/la-casilla-diez-sin-la-marca/el-gasto.md` |

**`PHASE.md` sigue diciendo 22,40**, así que quien lea sólo esa tabla va a leer que la etapa 1
se pasó US$4,00 sin permiso. Va en el informe como hallazgo.

**Contra el techo de la fase entera, en cambio, no hay ninguna discusión**: los US$74,40 están
US$18,40 por debajo de los US$92,80 que `PHASE.md` declaró, y US$26,00 por debajo de los
US$100,40 que serían con la excepción de la etapa 1 puesta adentro.

## Lo que el proyecto lleva gastado

El único gasto anterior registrado son **US$5,44** por 7 generaciones, del 2026-09-10. Con esta
fase, **el proyecto lleva US$79,84**.

Y sigue sin ser una factura: el precio es el que la T-01 releyó de la página de Vertex el
2026-09-12, y **ninguna de las tasks pudo verificar si Vertex cobra una operación que termina
en `code 14`**. Las cinco que terminaron así se cuentan como gastadas, que es el supuesto
conservador.

## Los dos totales que no cierran, y por qué los dos fallan igual

Dos documentos ya escritos suman la fase y **a los dos les faltan las mismas doce
generaciones**: las tres regeneraciones de la T-03, que son US$9,60.

| dónde | qué dice | lo que dicen los registros |
| --- | --- | --- |
| `T-08/el-gasto.md`, tabla *El total de la fase* | etapa 1: **28 generaciones, US$22,40**; la fase: **88, US$70,40** | etapa 1: **33, US$26,40**; la fase: **93, US$74,40** |
| `demo/race-multiview/README.md`, tabla *How the content is regenerated* | *the probe and the programme* **16.80**; *the whole of this demo* **64.80**; *81 generations were launched* | **26,40**; **74,40**; **93 lanzadas** |

Los dos son el mismo error con dos caras. La T-08 tomó para la etapa 1 **el techo** en lugar
del gasto, que da el número redondo de `PHASE.md` y por eso no llama la atención. El README
tomó el gasto de los dos informes principales de la etapa —T-02 y T-03— sin las tres
regeneraciones, que viven en subcarpetas de la T-03 y no en su informe.

**Lo que las dos tienen en común es de dónde sacaron el número: de la prosa de otro informe.**
El registro de generaciones existe justamente para que la suma no dependa de eso, y ninguna de
las dos lo leyó.

El del README importa más que el otro, porque **es un documento que se publica** y su tabla es
lo que alguien va a usar para presupuestar una regeneración: sale 15 % más cara de lo que dice.

Los dos se corrigen y no se tocan acá, que es lo que manda no mezclar el trabajo de dos tasks
en un mismo árbol. El texto exacto va en el informe.
