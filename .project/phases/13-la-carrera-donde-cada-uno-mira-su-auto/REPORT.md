# Informe de cierre — fase 13: la carrera donde cada uno mira su auto

Abierta el 2026-09-12. **El trabajo terminó el 2026-09-14** —el commit `28999e2` deja las
tres etapas entregadas y la demo publicada— y el cierre formal se escribe el **2026-09-21**,
que es la fecha del frontmatter. Los siete días de diferencia no son trabajo: son el cierre
de gobernanza que faltaba.

## 1. Resumen

Existe `demo/race-multiview/`, la cuarta demo del repositorio y la única cuyo contenido se
produjo entero: una carrera de 112 s con dos relatores, catorce cortes entre seis autos, y
una ventana de 64 s que abre en el segundo 28 ofreciendo **seis cámaras** cuando la grilla
sostiene cuatro. Está publicada y respondiendo:

```
$ env -i /usr/bin/curl -s -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' \
    https://qualabs-hls-demo-race-multiview.storage.googleapis.com/index.html
200 text/html 11112
$ env -i /usr/bin/curl -s -o /dev/null -w '%{http_code}\n' \
    https://qualabs-hls-demo-race-multiview.storage.googleapis.com/no-existe-xyz.html
404
```

Los 11.112 bytes son los mismos que midió la T-10 el 2026-09-14, y el 404 del control es lo
que hace que el 200 signifique algo.

**Esta no fue una fase de software: fue una producción de video con una señalización
alrededor**, y eso cambia qué es su entregable. El software que la demo usa estaba construido
y verificado desde la fase 11; lo que esta fase tenía que probar es que **el mecanismo
aguanta el caso de uso por el que existe**. Lo aguanta sin una línea de `lib/`.

**Las cifras de la producción:**

| | |
| --- | --- |
| el programa | **112,000000 s**, 2688 cuadros a 24 fps, catorce casillas de 192 cuadros sin descartar ninguno |
| el relato | diecinueve líneas, dos voces repartidas por función (Charon relata, Kore comenta), `gemini-2.5-flash-tts` en `en-GB` |
| el catálogo | **seis cámaras de 64,000000 s exactos**, 1536 cuadros cada una, tres de a bordo y tres de seguimiento |
| el anuncio contra la ventana | la voz se calla en **27,640 s**, el tag abre en **28,000 s**: 0,360 s de diferencia, medidos por instrumentos distintos sobre artefactos distintos |
| lo publicado | **324 objetos**, los 324 con md5 idéntico al archivo local |

**Lo que hace que la fase valga no son esos números sino de dónde salen.** El segundo en que
abre la oferta está declarado una sola vez en `race.json` y lo leen los tres lados —el que
coloca la línea de voz, el que la mide, y el que escribe el `EXT-X-DATERANGE`—, así que
moverlo mueve los tres a la vez y la desincronización no es representable. El catálogo del
asset-list son las cámaras que están empaquetadas, no una lista escrita: **pasó de una a seis
sin que nadie editara un script**, y eso está medido entre dos corridas de la misma página
sin un archivo tocado en el medio.

**La línea de base y el cierre, con los mismos comandos:**

| chequeo | base (la toma la T-01 el 2026-09-12, sobre `e2f7f3f`) | al cerrar (la T-10) |
| --- | --- | --- |
| `npm test` | **184 pruebas, 184 pasan, 0 fallan** | **193 pruebas, 193 pasan, 0 fallan** |
| `npm run check` | verde: 3 ocurrencias, las tres aceptadas; cero hits en la segunda | **byte por byte igual** |
| `npm run mutaciones` | 20 roturas rojas, 9 chequeos verdes | **byte por byte igual** |
| `git diff --stat -- lib/` | — | **vacío** |

**Y la pregunta de una no-regresión la contestan los nombres, no el total.** El conteo pasó
de 184 a 193, y un conteo no distingue "llegaron nueve" de "se fueron dos y llegaron once":

```
$ comm -23 nombres-linea-de-base.txt nombres-hoy.txt    # las que SE FUERON
(ninguna)
```

Las nueve que llegaron nombran `race.json`, el catálogo, la ventana y el tag de esta demo.
**Y el comparador se vio dar distinto**: sobre una copia se borró una prueba y se renombró
otra —el conteo baja de 193 a 192, una diferencia que un ojo perdona— y el comparador nombró
la que faltaba y mostró la renombrada como nueva, que es exactamente el par que un conteo
igual esconde.

**`lib/` no cambió, y el control es que el mismo comando sabe decir que sí:**

```
$ git diff --stat e2f7f3f -- lib/      # vacío
$ git diff --stat f050ddd -- lib/      # vacío
$ git diff --stat -- lib/              # vacío
$ git diff --stat 1767254 -- lib/      # el commit ANTERIOR al arranque
 lib/renderer.js | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Esa línea es el comentario que `e2f7f3f` arregló, de antes de esta fase.

**El gasto: US$74,40 en 93 generaciones**, contra un techo declarado de US$92,80 / 116. Los
números no salen de la prosa de los informes sino de los registros de lanzamiento, una línea
por generación pedida, que es lo que se paga.

| etapa | generaciones | US$ | techo | |
| --- | ---: | ---: | ---: | --- |
| 1. el programa (T-02 + T-03 y sus tres regeneraciones) | 33 | 26,40 | 22,40, **subido por Nicolás a 30,00** | quedan 3,60 |
| 2. una cámara (T-05) | 14 | 11,20 | 12,80 | quedan 1,60 |
| 3. las cinco restantes (T-08) | 46 | 36,80 | 57,60 | quedan 20,80 |
| **la fase** | **93** | **74,40** | **92,80** | **quedan 18,40** |

**La etapa 1 se pasó de su techo original y no fue por deriva**: Nicolás lo levantó dos veces
mirando el material —a US$26,00 después de pedir que se regeneraran cuatro casillas, y a
US$30,00 para regenerar la que quedaba inutilizable—, y las dos veces la task siguiente lo
escribió antes de gastar, con el corte del generador recalculado al número nuevo. Contra el
techo vigente, la etapa cerró por debajo.

**El techo no es una promesa: es un corte que se hace cumplir contando.** El generador cuenta
las líneas de su propio registro y se niega a lanzar si la próxima pasaría. Se lo vio frenar,
y —lo que es más difícil— **se lo vio no frenar sin tocar la red**, con la opción `--contar`
que arma los cuarenta prompts, imprime lo que haría y sale antes del primer POST.

**Y el precio sigue sin ser una factura.** Los US$0,10 por segundo son los que la T-01 releyó
de la página de Vertex el 2026-09-12; no hay ninguna factura en el repositorio, y ninguna task
pudo verificar si Vertex cobra una operación que termina en `code 14`. Las cinco que
terminaron así se cuentan como gastadas, que es el supuesto conservador.

## 2. Decisiones tomadas

**Cero ADR, y es deliberado.** `DESIGN.md` §10 lo escribió antes de ejecutar: *"Ninguna
cambia el formato ni la librería, así que ninguna pide un ADR de alcance de proyecto: son
decisiones de esta demo y viven en este documento y en las cabeceras de sus scripts, que es
donde el ADR 0061 manda que viva una receta de generación"*. Las once decisiones están
enumeradas ahí, y la cláusula de escape también: *"Si al ejecutar aparece una decisión que
toque el formato o la librería, ésa sí es un ADR y es también una dependencia, y se reporta
antes de escribirla"*. No apareció ninguna.

El proyecto sigue en **79 ADR**, el último el 0079 del 2026-09-11.

**La fase consumió ADRs sin tocar uno.** El 0044 (los números de la demo en un solo archivo),
el 0045 y el 0062 (la tipografía generada vuelve deformada), el 0059 (empaquetar a la cadencia
de la fuente: 24 fps y GOP 48), el 0061 (la receta vive con el generador), el 0064 (el bloque
de oferta anuncia un catálogo), el 0066 (el catálogo es tan largo como el que publica quiera)
y el 0026 (agrandar es foco de audio completo). Que se consuman sin pedirles un campo nuevo es
la afirmación que esta fase existía para poder hacer.

**Pero tres decisiones se tomaron ejecutando y no están en `DESIGN.md` ni en un ADR**, y las
tres gobiernan trabajo futuro. Van acá porque el que las busque no las va a encontrar en
`decisions/`:

- **El criterio de rechazo de la tipografía**, escrito por la T-08: *"un clip se rechaza
  cuando la tipografía es LEGIBLE, y se acepta cuando es garabato"*. Con esa vara, de 40 clips
  se rechazó uno. Antes de esa task el criterio no existía, y la T-03 había cerrado el tema
  midiéndolo sin decidirlo.
- **El hexadecimal de `race.json` se mide sobre el clip y no sobre la ficha.** Dio vuelta lo
  que la T-01 había escrito: la ficha del auto pasó de ser la especificación a ser el retrato,
  porque las fichas las dibuja Imagen y los 62 clips los dibuja Veo.
- **El panel recortado en un ancho de teléfono no es un defecto.** Lo cerró Nicolás el
  2026-09-14, sin cambio y sin dependencia de `lib/`: *"la demo está pensada para una imagen de
  relación de aspecto 16:9 y nada más"*. Está anotado al pie del informe de la T-09, que es el
  único lugar del proyecto donde vive.

## 3. Tasks, y las líneas del plan que no se obedecieron

**Las diez en `done`.** El reparto por etapas se respetó y las dos compuertas se usaron de
verdad: la etapa 1 volvió **tres veces** con feedback de Nicolás sobre las casillas del
programa antes de que la etapa 2 arrancara.

| id | qué dejó |
| --- | --- |
| T-01 | El párrafo del mundo, los seis autos con su color medido, el plan de catorce tomas, `race.json`, las seis fichas (US$0 con `agy`), la línea de base y el precio releído |
| T-02 | El sondeo de cuatro clips y el hallazgo que lo justifica: los colores no vuelven siendo los de la ficha, porque se calibraron contra el generador equivocado |
| T-03 | Los catorce clips del programa, el hallazgo de encuadre, y la tipografía medida con su cuenta de cuánto costaría sacarla |
| T-03 (×3) | Tres regeneraciones sobre el feedback de Nicolás: cinco casillas por geometría, cuatro por el cruce de cámara, y la 10 sola por la marca |
| T-04 | `programa.mp4` con las dos voces, la aserción del anuncio con sus dos controles en rojo, y el portón que atrapó una línea repetida de verdad |
| T-04 (×1) | El relato y el montaje rehechos sobre los catorce clips aprobados, con tres líneas reescritas y una cuarta desalineada que nadie había marcado |
| T-05 | La cámara de a bordo de CALDRIX, el cruce contra el programa, y el hallazgo de que esta cámara no mira hacia atrás |
| T-06 | La cadena: el empaquetado a 24 fps y la comprobación de largos, que resultó medir dos propiedades y no una |
| T-07 | La señalización, el asset-list derivado de `race.json`, y la demo corriendo de punta a punta con el foco de audio medido en el DOM |
| T-08 | Las cinco cámaras restantes, las seis juntas en grilla, y los tres modos de falla del generador |
| T-09 | La página entera, `CREDITS.md`, el README con la sección del costo, y el veredicto del R5 |
| T-10 | La no-regresión comparada por nombres, la publicación verificada sin credenciales, y el gasto real de la fase |

### Las líneas del plan que no se siguieron

**1. El sondeo fueron cuatro clips y no dos, y las dos tomas no fueron las que `TASKS.md`
pedía (T-02).** El plan pedía *"una toma de un auto pasando y una de dos autos peleando"*; se
generaron la casilla 4 —el plano general que el resto de la fase da por supuesto— y la 12 —la
de mayor probabilidad de fallar—, por instrucción explícita de quien despachó. Las dos
generaciones extra son lo que la task existe para producir: la A falló en dos frentes a la vez
y separarlos costaba una generación cada uno. Se usó el tope de cuatro, no se lo pasó.

**2. Los dos planos aéreos del plan de tomas nunca fueron aéreos, y se decidió no insistir
(T-03).** Cinco pedidos y cinco fracasos, con el encuadre dicho primero, último y con el
vocabulario que funciona en las otras doce. El diagnóstico no es que el modelo no sepa: la
generación `d` del sondeo devolvió el cenital a la primera con un prompt que era sólo la
instrucción de cámara. Lo que no hace es un cenital **mientras** el prompt describe una
carrera con seis autos identificables por color. Se dejó así porque lo que la casilla 4 tiene
que cumplir son tres cosas y las tres las cumple el plano general que volvió; gastar
generaciones en una palabra que ninguna de las tres nombra es pagar por la estética del plan y
no por su función.

**3. `plan-de-tomas.md` quedó con las palabras de color viejas y la T-02 no lo arregló.** Las
casillas 3, 6, 9, 10 y 13 decían *"the YELLOW-GREEN car"*, que es exactamente la palabra que la
T-01 había descartado por devolver amarillo. La T-02 lo reportó como hallazgo y no lo tocó
—*"es un archivo de la T-01"*—, y la T-03 lo corrigió al pasar por ahí, sacando además la
columna que copiaba el prompt: *"dos copias del mismo texto se despegan y la que se despega es
la que nadie ejecuta, que es exactamente cómo nació H1"*.

**4. La T-05 gastó catorce generaciones donde el plan preveía ocho.** Tres se perdieron por
`code 14` de Vertex, dos son el hallazgo de la cámara que no mira atrás, y **una se lanzó sin
querer**: construyendo el control de que el tope *no* frena, el comando se cortó con un
`timeout` de tres segundos esperando no llegar al primer POST, y llegó. US$0,80 que nadie
pidió, declarados como error de la task y no de la herramienta. El arreglo no fue acordarse:
la T-08 heredó la opción `--contar`, que corre el chequeo entero y sale antes de tocar la red.

**5. El primer diagnóstico de la geometría explicaba menos de lo que parecía, y el informe que
lo escribió lo dio por cerrado (T-03).** La primera regeneración concluyó que el defecto era
*"el cambio de sentido del auto"* y sacó la chicana, las eses y la entrada a la curva. Las
cuatro casillas volvieron sin curva adentro y volvieron mal igual: la causa era **el cruce por
delante de la cámara**, que obliga al modelo a barrer medio círculo y a inventar el mundo del
otro lado. La misma corrida midió que el teleobjetivo, que el informe anterior proponía como
receta, *"quedó en las dos listas y no separa nada"*.

**6. Una conclusión de imposibilidad resultó prematura, y la desmintió la tirada siguiente con
el mismo prompt (T-03).** La segunda regeneración escribió que *"el mar de este circuito no
está saliendo por prompt"* después de dos intentos fallidos. La tercera lo consiguió **sin
cambiar el pedido**: *"el prompt que lo consiguió es el mismo que no lo había conseguido, así
que lo que cambió fue la tirada y no el pedido"*. Es una afirmación de negativo sobre un
generador estocástico, que es donde más barato sale equivocarse.

**7. Los nombres de dos archivos mienten y no se renombraron.** `05-noctev-chicana` no tiene
chicana y `10-pentav-quentra-eses` no tiene eses. La razón está escrita: el orden del montaje
sale del prefijo numérico y renombrar deja colgadas las referencias de las corridas anteriores
y de las carpetas `rechazados-*`. Queda anotado como lo que es.

**8. Los temporales fueron a `/dev/shm`, que es lo que `TASKS.md` mandaba y lo que el repo
padre prohíbe.** El bloque de constraints de la T-01 dice *"Los temporales van a `/dev/shm`"*,
y la T-01 y la T-10 lo cumplieron. `knowledge/reglas-para-workers.md` del repo padre dice lo
contrario, con su razón: *"También es RAM, pero cualquier usuario de la máquina lee lo que hay
adentro"*. No es un incumplimiento de quien ejecutó —hizo lo que el contrato de su task
decía—: es que el contrato de la fase y la regla del repo dicen cosas distintas. Se reporta en
§8 y no se reescribe, porque un `TASKS.md` de fase cerrada es registro.

## 4. Hilos abiertos

**La fase no produjo ningún dato sobre viabilidad en red, y estaba escrito de antemano.**
Todo se sirvió local desde `server.mjs`. La corrida contra el bucket de la T-10 se hizo desde
esta máquina y **no dice nada** sobre lo que cuatro reproductores le piden a una conexión de
verdad. `PHASE.md` avisó de esta tentación exacta: que la demo esté en GCS no la convierte en
una medición de red.

**La tipografía ilegible en la carrocería está medida y no resuelta.** Once de las catorce
casillas del programa la traen; las tres restantes tienen el auto barrido por el movimiento y
**no permiten decidir**, así que no son tres limpias. Lo que sí quedó decidido es el criterio
—legible se rechaza, garabato no— y el número para presupuestar: a lo sumo 3 de 14 vuelven
limpias, o sea unas cinco generaciones por clip limpio, unos US$56 para los catorce, que es
dos veces y media el techo de toda la etapa 1.

**Las tres cámaras de a bordo volvieron sin una sola palabra en la carrocería y no es mérito
del prompt.** La hipótesis de la T-05 —el encuadre cerrado no le deja al modelo dónde poner un
cartel— **no se midió contra su contrafactual**. Las tres de seguimiento sí traen rótulos,
que es lo que la hipótesis predice, pero eso es consistencia y no prueba.

**`race.json` tiene dos colores que ya no describen lo que se ve.** PENTAV está declarado
`#2D6E24` y ese hexadecimal no describe bien ninguna de sus tres casillas desde que la 10 se
regeneró a `BRIGHT LIME GREEN`. CALDRIX está a 15,4 de dE00 entre su fila y su cámara de a
bordo; la T-08 lo resolvió midiendo y decidió **no moverlo**, porque la fila que hay que
mirar es la más apretada y no la mejor separada. **Y el dato que baja lo que está en juego:
hoy nada pinta esos colores** — `lib/controls.js` dibuja las filas en blanco, el asset-list no
lleva el campo, ningún script lo lee.

**El par MARVOK / RUNTAK está a 13,7 de dE00**, el más apretado de los seis y casi la mitad
de la distancia del siguiente. Si alguna vez el panel muestra la muestra de color, **ése es el
par a mirar**.

**El tramo costero no es una posición de pista que se pueda pedir.** Siete de los cuarenta
prompts de la T-08 nombran *"the flat grey sea beyond it"* en la posición más fuerte del
prompt, y en cuatro no hay una gota de mar: hay tribuna. Un plan de tomas futuro no debería
contarla como una posición.

**La cámara de a bordo de Veo no mira hacia atrás.** Dos de dos, con el pedido escrito en las
dos posiciones que ganan, devolvieron la cámara montada atrás **mirando adelante y con el
perseguidor delante**, que invierte la carrera. Ninguna de las seis cámaras pide una toma
hacia atrás; si se la quiere, la palanca no es el prompt.

**`MAX_BOXES` no está en la superficie pública de la librería.** Una página que quiera
explicar por qué una fila se puso gris no puede leer el tope: la barra lo interpola adentro de
`lib/` y lo escribe en su propio texto. La T-09 lo resolvió describiendo qué pasa en lugar de
afirmar el número, que además no puede quedar viejo. Queda como observación.

**El comentario de `demo/multiview-offer/scripts/empaquetar-contenido.sh` miente.** Dice que
es *"copia byte por byte"* del de `compatibility-pair`, y los dos dejaron de ser la misma copia
desde que la fase 10 le agregó a hydration-break los argumentos de tamaño, fps y audio.
`PHASE.md` lo anticipó como hallazgo previo; se reporta y no se toca, porque es de otra demo.

**Dos instrumentos viven en la carpeta de una task y los corren tres o cuatro.**
`oir-la-camara.sh` es de la T-05 y lo corrieron la T-05 y la T-08 cinco veces; `de.py` es de la
T-01 y lo importan cuatro. **El lugar donde viven ya no dice de quién son.**

**No se sabe si esta demo entra en la grabación del 28 al 30.** Es el R9 y se aceptó como
dato y no como bloqueo: la página vive después del evento como el link que queda, y la
publicación es lo que habilita iOS.

**Lo que esta fase le deja a iOS es contenido publicado, y nada más.** Ninguna conclusión
sobre AVFoundation, que estaba explícitamente fuera de alcance.

## 5. Riesgos que se materializaron

**R2 se materializó sobre la peor marca posible.** El riesgo era *"Veo dibuja una librea que
se parece a una de verdad"*, y lo que dibujó fue **`Apple`**, con su tipografía y una media
manzana roja en el pontón, más `Apple` repetido en los carteles de la valla — en la demo que
David Hassoun presenta en el evento de Apple. Estaba en dos momentos del clip, así que no era
un artefacto de un cuadro.

**La causa no es la que el riesgo anticipaba.** No fue el modelo inventando una librea real:
fue **el nombre del color**. El padrón de seis colores lleva `BRIGHT APPLE GREEN`, y la
palabra `APPLE` está en las catorce casillas; lo que separa es si además aparece en el bloque
que dice qué hay en cuadro. La casilla 10 era de ese grupo, y **el auto que volvió con la
marca pintada es exactamente el auto cuyo color se nombró ahí**.

**Y el arreglo es la regla de la fase 08 en su segunda mitad: se saca la palabra, no se
prohíbe.** Escribir *"sin logos de Apple"* habría sido la peor forma de pedirlo. La casilla
renombró su verde a `BRIGHT LIME GREEN` en todo su prompt, **sin agregar una sola negación**,
y volvió limpia. El instrumento se vio funcionar antes de usarlo: los mismos recortes, con el
mismo comando, sobre el clip rechazado, leen `apple` dos veces en el pontón y `Apople` en dos
carteles.

**R1 no se materializó, y es el que podía hacer que el gasto entero no sirviera.** La
medición de las seis cámaras juntas, con su instrumento y sus tres controles:

| qué se compara | dE00 |
| --- | ---: |
| **los cielos de los seis feeds entre sí, los quince pares** | **0,9 – 7,9** |
| *control: los mismos cuadros virados a hora dorada* | *10,8 – 16,0* |
| *control: metraje real de otro mundo (la demo del partido)* | *12,5 – 17,0* |
| *control: la mitad de ABAJO de esos mismos cuadros* | *10,8 contra su propia mitad de arriba* |

Los seis están más cerca entre sí que cualquiera de los tres controles. **El repliegue a
carrera nocturna que `PHASE.md` tenía escrito no hizo falta.**

**R4 se atajó donde estaba escrito que se atajaría**, y con las dos mediciones tomadas por
separado:

```
VERDE  el relato como se entrega          fin hablado 27.640 s   ventana [27.5 ; 28]
ROJO   CONTROL la linea corrida +3 s      seguia hablando en 28.020 s
ROJO   CONTROL la linea corrida -3 s      fin hablado 24.640 s
```

**Y se vio despegarse**: moviendo `ofertaEn` de 28 a 31 en `race.json`, el tag lo sigue solo y
el audio no puede, y la aserción pasa a rojo diciendo *"fin hablado 27.640 s, ventana
[30.5 ; 31]"*, que es "cerca" en lugar de "en" — el defecto exacto que Nicolás nombró.

**R5 se materializó, y lo cerró Nicolás sin cambio.** Con las seis cámaras empaquetadas son
siete filas: a 1907 el panel muestra **331 px de 331**, cero desborde, y las siete filas
enteras. A 400×780 muestra **125 px de 331**: las cuatro cámaras que el espectador tiene
arriba y la fila del world feed quedan arriba del recorte, y lo que se ve son las dos últimas
filas grises y la explicación del tope. La T-09 lo reportó como dependencia de `lib/` y no
entró a la librería. Nicolás lo cerró el 2026-09-14: **la demo es 16:9 y el panel vive adentro
del alto de la imagen**, así que no es un defecto a corregir. La medición sigue siendo válida
como dato.

**R6 se mitigó como estaba escrito y el techo cortó de verdad.** Los dos casos del tope se
vieron en rojo y en verde sin tocar la red.

**Un riesgo que no estaba en la tabla y se materializó cinco veces: `code 14` de Vertex.** Tres
de trece lanzamientos en la T-05, dos de seis en la T-03, **cero de cuarenta y seis en la
T-08**. Las operaciones terminan `done: true`, sin video y sin haber evaluado el prompt, y las
cinco se verificaron con `:fetchPredictOperation` antes de relanzar en lugar de reintentarse a
ciegas. La lectura honesta la escribió la T-08: **cinco de cincuenta y nueve lanzamientos en
tres días es el 8 %**, y el cero de 46 no invalida la estimación del 20 % que la T-05 usó para
presupuestar — lo que esa estimación compró fue espacio en el techo, y el espacio sobró.

**Y un defecto de método que se materializó dos veces, en dos documentos distintos, de la
misma manera.** `T-08/el-gasto.md` y el `README.md` de la demo sumaron el gasto de la fase y a
los dos les faltaban **las mismas doce generaciones**: las tres regeneraciones de la T-03,
cuyos registros viven en subcarpetas de esa task y no en su informe principal. Son US$9,60, un
15 % de más al presupuestar. **Lo que las dos tienen en común es de dónde sacaron el número:
de la prosa de otro informe.** El registro de generaciones existe justamente para que la suma
no dependa de eso, y ninguna de las dos lo leyó. Los dos están corregidos.

## 6. Recomendaciones para la fase siguiente

**Se nombra el plano, no se dan las coordenadas de la cámara.** Es el hallazgo más
transferible de la fase y cambió cómo se escribieron los 48 prompts que faltaban. *"La cámara
no está montada en el auto"* es una negación y deja el hueco; *"a fixed broadcast camera
stands on the ground at the edge of the circuit"* nombra una cosa que existe en el mundo y que
el modelo vio mil veces, y la dibuja. Doce de las catorce casillas salieron a la primera con
esa forma.

**Y se nombra una sola acción por clip.** Dos acciones seguidas en ocho segundos es donde el
modelo pierde el mundo: ahí aparecen la segunda calzada, el auto repintado y el sentido de
marcha dado vuelta.

**Un diagnóstico sobre un generador se sostiene o no contra el lote siguiente, y esta fase
tiene los dos casos.** El primer diagnóstico de la geometría —el cambio de sentido— parecía
completo y el segundo lote lo desmintió. La conclusión de que el mar *"no está saliendo por
prompt"* la desmintió la tirada siguiente con el mismo prompt. **Una afirmación de
imposibilidad sobre un modelo estocástico necesita más tiradas que una afirmación de
capacidad**, porque un éxito prueba que se puede y un fracaso no prueba que no.

**Una palabra del prompt termina pintada en la chapa.** Pasó tres veces y las tres con la
misma forma: `Apple` del nombre del color, `AQUAAMARINE` tomada del propio prompt, y `BRIGHT` /
`AQUAMARINE` sobre el pontón de NOCTEV. El arreglo que funcionó es sacar la palabra; el que
nunca se probó, porque la regla de la fase 08 dice que empeora, es prohibirla.

**El gasto se suma de los registros de lanzamiento y no de la prosa.** Es la lección más
barata de la fase y la que dos documentos ya pagaron. Un informe que resume a otro informe
hereda sus huecos sin heredar sus fuentes.

**El control de que un tope NO frena no tiene que costar una generación.** La T-05 pagó
US$0,80 por construirlo contra la red; la T-08 lo hace gratis separando **contar** de
**lanzar**. Cualquier guarda que sólo se pueda ver fallar gastando está mal construida.

**Un instrumento que no separa se reporta como que no separa, y esta fase lo hizo tres
veces.** `medir-el-barrido.py` no distingue los nueve clips buenos de los cinco rechazados y
quedó en `salidas/` con esa conclusión escrita, *"para que nadie lo vuelva a construir creyendo
que sirve"*. Los parches de asfalto no miden el mundo en una toma de a bordo, y la task lo dijo
en lugar de citar el número. El piso del 2 % del chequeo del cielo **no rechaza la mitad de
abajo del cuadro**, así que decir "esto mide cielo" apoyándose en él habría sido falso. Las
tres son la misma disciplina: **el instrumento se calibra contra una referencia que no sale de
él, y cuando no separa eso también es un resultado.**

**Y la advertencia sobre delegarle trabajo a `agy`, porque casi se cuela.** De seis corridas
en paralelo para regenerar las fichas, **dos se quedaron esperando un temporizador** y una
—PENTAV— **copió la ficha vieja del repositorio y respondió `DONE`**. El archivo estaba,
pesaba lo que tenía que pesar, y su `md5sum` era idéntico al de la que decía haber reemplazado.
Lo atrapó comparar los hashes contra las viejas; sin ese paso, la task habría reportado seis
fichas regeneradas y tres no lo estarían.

## 7. Correcciones post-ejecución

**Ninguna anotada.**

```
$ grep -n "post-ejecuci" .project/phases/13-la-carrera-donde-cada-uno-mira-su-auto/TASKS.md
$ echo $?
1
```

**Y el instrumento sabe encontrar**: el mismo `grep` sobre los `TASKS.md` de las otras fases
devuelve cinco archivos (01, 05, 06, 07 y 08), así que el cero es del archivo y no de la
búsqueda.

**Leído como medición, el cero dice algo bastante preciso, porque el feedback de Nicolás sobre
trabajo ya entregado sí existió — cuatro veces.** Miró los catorce clips del programa y pidió
que se regeneraran cinco; miró los nuevos y pidió cuatro más; miró la 10 y la rechazó por la
marca; y cerró el hallazgo del selector a 400 px. Ninguna de las cuatro entró como línea
`post-ejecución:` ni como task nueva.

**Entraron como una tercera forma que el esquema no tiene: subcarpetas de la task original**
—`regeneracion-de-cinco-casillas/`, `regeneracion-de-cuatro-casillas/`,
`la-casilla-diez-sin-la-marca/`, `montaje-con-los-clips-nuevos/`—, cada una con su informe y
su `el-gasto.md`. Como registro es mejor que una línea: las cuatro traían trabajo real con sus
mediciones y sus controles, y una línea no las contiene.

**Pero la forma tuvo un costo y está medido**: los registros de gasto de esas subcarpetas no
los suma el informe principal de la task, y **los dos totales de la fase que se escribieron
antes del cierre salieron mal por eso**, los dos con el mismo hueco de doce generaciones.
La tabla del `TASKS.md` tampoco lo muestra: la fila de la T-03 sigue apuntando a
`los-catorce-clips.md`, que es uno de cuatro informes.

La cuarta corrección —el selector a 400 px— sí quedó anotada al pie del informe de la T-09,
con fecha y con la decisión textual de Nicolás. Es lo más parecido a una línea de
post-ejecución que la fase tiene, y está en el único lugar donde alguien la va a buscar.

## 8. Revisión de documentación

Superficie por superficie, con lo que se actualizó o por qué no necesitaba nada.

**El índice de fases de `PROJECT.md`** — **escrito en este cierre**, y no existía: la fase 13
no figuraba. Su línea dice qué quedó construido, que el contenido se produjo entero, cuánto
costó contra su techo, cuál fue su riesgo materializado, y qué dejó abierto.

**`docs/arc42/`** — no existe, y esta fase no lo crea, por la misma razón que las anteriores:
los dos documentos de `docs/` cumplen ese papel para el único lector que tienen.

**`docs/contrato-senalizacion-renderizado.md`** — **re-leído y no cambió**, y eso era la
prueba. Esta fase **consume** el contrato sin pedirle nada: el asset-list sale en la forma del
ADR 0064 y *"sin un campo de más"*, seis entradas en `views[]` en lugar de cinco no es un
cambio de formato (ADR 0066), y el `URI` de nivel superior lleva el repliegue del ADR 0019. Si
esta fase hubiera necesitado un método nuevo del proveedor, eso era una dependencia y había que
parar; no apareció.

**`docs/integrating-the-library.md`** — **no necesitaba nada.** Es la superficie pública de la
librería y la fase no la toca, medido y no prometido: `git diff --stat -- lib/` vacío contra
los tres commits que importan, con el control de que contra uno anterior sí muestra cambios.

**El `README.md` de la raíz — le falta la demo, y es lo único que quedó desalineado.** Su tabla
de `demo/` lista tres demos y esta fase agregó la cuarta. Búsqueda literal sobre el archivo
entero, con su control:

```
$ grep -c "race-multiview" README.md
0
$ grep -c "hydration-break" README.md      # control: un término que SÍ está
1
```

No se corrigió en este pase porque el cierre está acotado a `.project/`. La fila que falta va
en el hallazgo del informe: la demo argumenta el caso de uso del multi view —una carrera donde
el programa nunca se detiene y quien mira elige a qué auto seguir—, y es la única de las cuatro
cuyo contenido se produjo entero en lugar de tomarse de material existente.

**El `README.md` de la demo** — **escrito por la T-09 y corregido en el cierre de la fase.**
Lleva las seis secciones del de `multiview-offer` más una séptima que la otra no necesita,
*How the content is regenerated*, con la tabla del costo real y la advertencia de que el
resultado no va a ser idéntico. Los tres números que estaban cortos ya están: US$26,40 la
etapa 1, **US$74,40 la demo entera**, y **93 generaciones lanzadas contra 62 clips**.

**`demo/race-multiview/CREDITS.md`** — **escrito**, con una fila por pieza y la frase que la
task pidió que estuviera dicha y no supuesta: todo lo que está en pantalla se generó para esta
demo, no hay material de terceros y por lo tanto no hay licencia que respetar. Se dice porque
las otras demos del repositorio **sí** corren sobre las películas de la Blender Foundation y
**sí** las creditan, así que una página muda se leería como una de ésas con los créditos
faltando.

**El `CLAUDE.md` del proyecto** — **corregido en el commit `28999e2`**. Decía *"All three are
public"* y ahora dice cuatro, con la fila del bucket nuevo; y se le agregó, al lado de la
trampa del content type de los `.ts` que es de la misma clase, que **el `-x` de
`gcloud storage rsync` ancla su regex al principio del path**: `scripts/__pycache__/` nunca
engancha en el medio y el que anda es `.*__pycache__/`. El modo de falla es silencioso —nada
avisa que un patrón no mordió nada— y por eso se publicó un `.pyc` que hubo que sacar a mano.

**`.project/knowledge/`** — no existe, y la fase no produjo nada que califique. El candidato
era la receta de generación, y el ADR 0061 ya manda que viva con el generador.

**El `CLAUDE.md` y el `knowledge/` del repo padre** — **no se tocaron, y hay una contradicción
que se reporta.** El bloque de constraints de la T-01 manda los temporales a `/dev/shm`, y
`knowledge/reglas-para-workers.md` lo prohíbe con su razón escrita: es RAM, pero cualquier
usuario de la máquina lee lo que hay adentro. La T-01 y la T-10 hicieron lo que el contrato de
su task decía. No se reescribe el `TASKS.md`, que es registro de lo que se pidió; lo que hay
que decidir es si el que cambia es el repo o el molde de las tasks, y esa decisión es de
Nicolás.

**El doc de instalación o runbook** — el proyecto no tiene uno separado: `./run.sh <demo>` es
el punto de entrada y lo dice el `README.md` de la raíz. `run.sh` no se tocó y no hizo falta,
porque toma el nombre de la demo como argumento. **Lo que esta fase sí agregó es un paso de
setup que cuesta plata y que a propósito no es parte de `run.sh`**: la regeneración del
contenido, que se corre a mano porque *"un paso de contenido que cuesta plata es un paso que
alguien tiene que decidir dar"*. Está documentado en su propia sección del README de la demo,
que es donde alguien con un clon nuevo lo va a buscar.

**Las carpetas `tasks/` de esta fase** — son **registro** y no instrucción vigente: sus
informes prueban qué se corrió y qué se midió entre el 2026-09-12 y el 2026-09-14, y no se
reescriben. **Ninguno lleva el marcador explícito que la fase 12 empezó a usar**, y no se les
agregó acá: este cierre se acotó a la gobernanza de `.project/` y agregarle una línea a
veinticuatro documentos de evidencia ajena mezcla dos cambios en uno. Queda como hallazgo.
Los que más se van a leer como instrucción vigente si nadie avisa son los `el-gasto.md`, porque
sus techos están vencidos, y los dos totales que ya se corrigieron.
