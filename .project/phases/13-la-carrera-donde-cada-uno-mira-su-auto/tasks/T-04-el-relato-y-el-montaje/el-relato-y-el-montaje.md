# El relato de los dos comentaristas, y el montaje del programa

El programa existe: **`demo/race-multiview/content/.fuentes/programa.mp4`**, 112,000 s
exactos, 2688 cuadros a 24 fps, 1280×720, con las dos voces encima y el ambiente de los
catorce clips debajo. **Cero generaciones de Veo**: la etapa 1 cierra con **US$16,80
gastados de US$22,40** y las siete generaciones que quedaban sin usar siguen sin usarse. Lo
único que costó esta task son unos **US$0,03** de texto a voz.

El anuncio de que las cámaras se habilitaron **termina de decirse en el segundo 27,640**,
con la ventana abriendo en 28,000. Está medido sobre el audio rendido y se lo vio dar rojo
dos veces.

Lo que hay para mirar está en [`cuadros/`](cuadros/), y lo que hay para auditar en
[`salidas/`](salidas/).

---

## 1. El anuncio contra la ventana

Verbatim en [`salidas/el-anuncio-contra-la-ventana.txt`](salidas/el-anuncio-contra-la-ventana.txt).

```
la linea: "The cameras on all six cars are open."   3.582 s   anuncioLargoMax 4 s
race.json: ofertaEn 28 s

VERDE  el relato como se entrega          fin hablado 27.640 s   ventana [27.5 ; 28]
ROJO   CONTROL la linea corrida +3 s      seguia hablando en 28.020 s, que es donde arranca la linea siguiente   ventana [27.5 ; 28]
ROJO   CONTROL la linea corrida -3 s      fin hablado 24.640 s   ventana [27.5 ; 28]

PASA, y se vieron los dos controles en rojo.
```

**Lo que se mide es el fin HABLADO y no el fin del archivo**, y la diferencia no es
cosmética: cada línea lleva 60 ms de aire adelante y 60 atrás, puestos por el recorte del
sintetizador, así que `tiempos.json` dice 27,700 y la voz se calla en 27,640. Verificar la
aritmética contra la misma aritmética que la produjo no verifica nada. Se busca el último
instante en que la pista de voces está por encima de −50 dB, adentro de la ventana que va
del arranque del anuncio al arranque de la línea siguiente.

**`ofertaEn` sale de `race.json` y no está tipeado en ningún lado**: lo lee
`armar-relato.mjs` para colocar la línea y lo lee `verificar-anuncio.mjs` para medirla, que
es el mismo archivo del que lo va a leer el `EXT-X-DATERANGE` en la T-07.

**Hay dos controles y no uno, y el segundo es el que devuelve un número legible.** El +3 s
que pide `TASKS.md` da rojo por un camino que es correcto pero mudo: la línea corrida hacia
adelante todavía está sonando cuando arranca la siguiente, así que no termina en ningún
lado. El −3 s da rojo diciendo **24,640**, que es exactamente el defecto que hay que poder
detectar: la línea termina limpia, tres segundos *cerca* de la ventana en lugar de *en*
ella. Los dos los rinde `armar-relato.mjs`, o sea el mismo renderizador que hace el bueno;
un control armado con otra herramienta mide la otra herramienta.

**Y el largo entró sin pelearlo.** La línea mide 3,582 s contra los 4,0 de
`anuncioLargoMax`, así que arranca en 24,118 y cae entera adentro de la casilla 4, que es
el plano general de los seis autos por la recta. Cuando la voz dice que hay seis cámaras,
en pantalla están las seis.

---

## 2. El relato: diecinueve líneas, y el portón atrapó una de verdad

Verbatim en [`salidas/el-porton-del-relato.txt`](salidas/el-porton-del-relato.txt) y
[`salidas/control-el-porton-en-rojo.txt`](salidas/control-el-porton-en-rojo.txt).

El molde de `demo/hydration-break/audio/` se copió entero: `gemini-2.5-flash-tts` en
`en-GB`, **Charon relata lo que pasa y Kore comenta por qué**, una línea un archivo, cada
una nivelada sola a −20,0 LUFS, y ninguna entra a la mezcla sin que una transcripción diga
qué dijo.

**El portón se vio rechazar la línea plantada**, que es el control que `TASKS.md` pide:

```
se le pide:  A calm British motor racing commentator on live television, calling a race
             from the commentary box. Warm, level, unhurried. Never shouting, never like
             an advertisement. The cameras on all six cars are open.
veredicto:   MAL  leyo el prompt en voz alta (shouting, advertisement, unhurried) |
             dijo 17 palabras y se le pidieron 8
```

**Y atrapó una falla real, que vale más que el control porque nadie la preparó.** De
diecinueve líneas, dieciocho salieron al primer intento y **la 17 volvió repetida**:

```
17 R  intento 1   7.36s  MAL  repitio "marvok is right on" | dijo 18 palabras y se le pidieron 9
     Marvok is right on the back of Caldrix again. Marvok is right on the back of Caldrix again.
17 R  intento 2   3.86s   -2.20 dB  bien Mavok is right on the back of Caldrix again.
```

El archivo repetido dura 7,36 s contra los 3,86 del bueno. **La duración habría dicho
"raro"; la transcripción dice qué se dijo**, que es la razón por la que el portón existe.

**Los niveles.** La ganancia que hubo que aplicarle a cada línea para llevarla a −20,0 LUFS
va de −0,90 a −6,10 dB, y está en `demo/race-multiview/audio/transcripciones.tsv` junto con
lo que el portón oyó. Las siete líneas de Kore piden en promedio **−4,30 dB** y las doce
de Charon **−2,89 dB**: Kore sale más fuerte, que es lo que el molde había medido, pero acá
la diferencia es de **1,4 dB** y no de los 3 de allá. La dirección se confirma, el número
no se hereda.

**Los seis nombres viajan como se escriben.** La demo del partido necesita mandarle
*"Norvick"* al sintetizador aunque el equipo se llame *"Norvik"*; acá no hizo falta ninguna
sustitución, porque los seis se eligieron en la T-01 midiendo cómo los dice esta misma voz.

---

## 3. El montaje

Verbatim en [`salidas/el-montaje.txt`](salidas/el-montaje.txt) y
[`salidas/los-trece-cortes.txt`](salidas/los-trece-cortes.txt).

| | |
| --- | --- |
| duración | **112,000000 s** |
| cuadros | **2688** a 24 fps, o sea 14 × 192 sin descartar ninguno |
| tamaño | 1280×720 |
| sonoridad | **−23,0 LUFS**, pico **−6,8 dBFS** |

**Entran los 192 cuadros de cada casilla.** El `select=gte(n\,1)` de la fase 08 existe
porque allá la cadena está sembrada y el cuadro 0 de un eslabón es el último del anterior;
acá las catorce casillas son independientes y el corte es el contenido.

**El orden se verificó contra los clips y no contra el nombre del archivo.** Cada casilla
del montaje se comparó contra los catorce clips de origen: las catorce se parecen más al
clip que el plan les asigna, a una distancia de 1,1 a 1,8 niveles, y el segundo más parecido
queda entre 40 y 60. Un concat con las entradas mal ordenadas da 2688 cuadros igual.

**Y los trece cortes son cortes.** La distancia entre el último cuadro de una casilla y el
primero de la siguiente va de 32,1 a 78,5; la misma distancia entre dos cuadros consecutivos
de adentro de una casilla —la referencia, que no sale de este cálculo— va de 4,9 a 12,6.
**El corte más flojo mide 2,9 veces el interior más movido y los dos rangos no se tocan.**
La lámina está en [`cuadros/1-los-trece-cortes.jpg`](cuadros/1-los-trece-cortes.jpg).

### El ambiente: los catorce emparejados, y cuánto margen quedó

La T-03 los midió entre **−15,3 y −24,8 LUFS**, con 9,5 LU de dispersión y un pico de −0,9
dBFS en la casilla 12. Cada clip se atenuó con una **ganancia por clip** —de −5,20 a −14,70
dB— hasta **−30,0 LUFS los catorce**, que es 10 dB por debajo de las líneas de relator.

Se usa una ganancia y no un normalizador dinámico por la misma razón por la que el molde
nivela así las voces: la ganancia mueve el clip entero y le deja la dinámica de adentro
intacta. Un auto que pasa tiene que seguir sonando como un auto que pasa; lo que se empareja
es el escalón entre una casilla y la siguiente.

**El margen, medido momento a momento** ([`salidas/el-margen-del-relato.txt`](salidas/el-margen-del-relato.txt)):

| | n | mínimo | p10 | mediana | debajo de 6 dB |
| --- | ---: | ---: | ---: | ---: | ---: |
| **el ambiente emparejado** | 642 | −0,4 | 5,3 | **9,7** | 89 (13,9 %) |
| *referencia: el mismo montaje sin emparejar* | 642 | −11,3 | −5,6 | *0,1* | *587 (91,4 %)* |

La referencia son los catorce clips concatenados a su nivel original, o sea **este mismo
montaje sin el trabajo de esta task**. Sin emparejar, el relato está por debajo del ambiente
la mitad del tiempo y la mediana del margen es cero: el programa sería catorce escalones de
volumen con dos voces abajo.

**El peor momento que queda es −0,4 dB, en el segundo 45,0**, que es la frenada rueda a
rueda de la casilla 6: un chirrido de gomas de 100 ms que llega al nivel de la voz. Es lo
que pasa en una transmisión de carrera de verdad y no se corrigió.

### Que se entienda no se dedujo del margen: se comprobó

Verbatim en [`salidas/se-entiende-el-relato.txt`](salidas/se-entiende-el-relato.txt). Un
transcriptor local que no vio el guion escuchó el `programa.mp4` mezclado y **recuperó las
diecinueve líneas, palabra por palabra, idénticas a lo que devuelve el relato sin ambiente
encima**. Los dos controles: sobre el ambiente solo devuelve `(engine revving)` y ninguna
línea; sobre el relato solo devuelve el techo contra el que se compara.

Un margen de 10 dB es un número que hay que creerle a una tabla. Que las diecinueve líneas
se recuperen de abajo del ambiente es la propiedad misma.

---

## 4. La tipografía, que es la decisión que está esperando

**No se arregló y no se escondió.** Los tres cuadros de
[`cuadros/`](cuadros/) salen del `programa.mp4` entregado y están a los dos anchos en los
que se van a ver de verdad: **470 px**, que es una caja de la grilla de cuatro en una
pantalla grande, y **190 px**, que es una caja de cuatro en un teléfono.

| archivo | qué se mira |
| --- | --- |
| [`cuadros/0-las-tres-casillas-a-470-y-190.jpg`](cuadros/0-las-tres-casillas-a-470-y-190.jpg) | las tres casillas, los dos anchos, 1:1 — **se mira al 100 %** |
| `cuadros/casilla-03-t20s-470px.png` y `-190px.png` | CALDRIX y MARVOK de cerca: renglones en el morro, un rótulo en el alerón |
| `cuadros/casilla-04-t28s-470px.png` y `-190px.png` | **el segundo en que abre la ventana**, con `AQUAAMARINE` escrito en el alerón del verde |
| `cuadros/casilla-10-t76s-470px.png` y `-190px.png` | PENTAV y QUENTRA: renglones en el pontón, los dos autos en cuadro |

**Las tres son de las peores y no de las mejores**, que es lo único que hace que mirarlas
sirva. La casilla 4 está adentro a propósito por dos razones que se suman: es la única de
las catorce donde el modelo escribió una palabra **legible** —`AQUAAMARINE`, tomada del
propio prompt— y es además la que está en pantalla en el segundo del anuncio.

Lo que la T-03 midió y esta task no cambió: **once de los catorce clips traen tipografía
ilegible en la carrocería**, limpiarlos por regeneración cuesta unas cinco generaciones por
clip limpio, o sea **unos US$56 para los catorce**, que es dos veces y media el techo de
toda la etapa 1. A 470 px quedan manchas; a 190 px desaparecen.

---

## 5. Lo que decidí, porque no estaba escrito

**El ambiente va 10 dB debajo del relato y no los 12 del molde.** `DESIGN.md` dice que el
número se remide porque el ambiente es otro, y no dice cuál es. Allá el ambiente es una
tribuna, que es fondo por naturaleza; acá **el ambiente es la acción** —el doppler del auto
que cruza el cuadro es la mitad de lo que se está mostrando, y viene sincronizado gratis
porque el video es generado—. Diez decibeles dejan la mediana del margen en 9,7 dB, adentro
de la banda que la práctica de transmisión acepta, con el ambiente dos decibeles más
presente que una cama de fondo. Bajarlo a 12 es cambiar un número en `armar-programa.sh`.

**El programa sale a −23,0 LUFS, con una ganancia única al final.** No estaba pedido y lo
decidí porque las cuatro demos se van a mirar seguidas: `primario.m4a` de la demo del
partido mide −23,0 LUFS y pico −6,8 dBFS, y el programa de la carrera salió al mismo número.
La ganancia es una sola sobre la suma, así que no toca la relación entre relato y ambiente.

**Y en el camino apareció un defecto que hay que dejar escrito porque no se ve.** El relato
es mono y la mezcla es estéreo, y duplicar el canal a los dos lados **sube la sonoridad 3 LU
medidos**, porque la R128 suma L y R con peso 1. Sin compensar, las líneas niveladas a −20
entran a la mezcla a −17, los 10 dB de separación serían 13 sin que nadie lo hubiera
decidido, y el programa entero saldría 3 dB más caliente que la otra demo. Se compensa con
el −3,01 dB de la conversión mono→estéreo. Medido: duplicado −17,2 LUFS, compensado −20,2.

**No se agregó la cama de público.** La T-03 dejó anotado que el párrafo del mundo pide *"a
distant crowd"* y que ninguno de los catorce clips lo trae, y que es barato agregarlo en la
mezcla. No lo agregué: la única grabación de tribuna del repositorio es la de la demo del
partido, que es una tribuna de fútbol —canto y palmas, no motor—, y meterla acá sería
importar el ambiente de otra demo debajo de un programa que ya tiene catorce fuentes de
sonido sincronizadas compitiendo por los mismos 10 dB. Si al mirarlo suena vacío, es una
capa más en `armar-programa.sh` y no una regeneración.

**El guion habla el 73 % del tiempo y el molde el 57 %.** Es del contenido y no de un
criterio nuevo: la demo del partido relata una parada de hidratación, que es una pausa; acá
los relatores se callan cuando corta el realizador y no mucho más. Los catorce huecos caen
en los cortes.

**El instrumento del margen descarta las pausas de adentro de una línea.** Entre dos frases
de una misma línea la voz se calla dos o tres décimas, y ahí el margen se derrumba: el
mínimo daba −23,2 dB en el segundo 75,5, que es una coma del relator y no un momento en que
el ambiente lo tapó. "Mientras habla" quiere decir mientras suena una voz. El mismo filtro
corre sobre la referencia, así que la comparación no se mueve.

**`audio/` guarda `.m4a` y los `.wav` se fueron a `content/.fuentes/audio/`.** `TASKS.md`
dice que el audio va al repositorio porque *"son cientos de kilobytes, no video"*, y las
diecinueve líneas en PCM más las pistas de trabajo eran **63 MB**. Las líneas quedan en
`.m4a` a 96 kb/s —las diecinueve siguen midiendo −20,0 o −20,1 LUFS después de la conversión—,
la mezcla en `programa.m4a` a 128 kb/s, y los intermedios en `content/`, que está
gitignoreado igual que los clips crudos. **`audio/` pesa 2,9 MB**, contra los 2,2 MB del
molde.

**No se regeneró ningún clip.** El presupuesto daba para uno y ninguno lo pedía: los catorce
miden lo que tienen que medir, los seis colores se separan, y lo único que un clip nuevo
compraría es tapar la tipografía en una casilla de once, que no es una decisión de esta task.

---

## 6. El gasto

**Cero generaciones de Veo, y menos de cinco centavos de todo lo demás.** Veintiuna
llamadas a `gemini-2.5-flash-tts` —diecinueve líneas, un reintento de la 17 y la línea
plantada del control—, unos **100 s de habla sintetizada**, a US$10 el millón de tokens de
audio: **unos US$0,03**. Las transcripciones del portón son otros ~3.000 tokens de audio de
entrada a `gemini-2.5-flash`, menos de un centavo. Todo lo demás —`ffmpeg`, el transcriptor
local, las láminas— corre en la máquina y cuesta US$0.

**El techo de la etapa es de generaciones de video y esta task no gastó ninguna**, igual que
en la T-02 y la T-03 el segundo oyente del portón no contaba contra él:

| | generaciones de Veo | US$ de Veo |
| --- | ---: | ---: |
| techo de la etapa 1 (`PHASE.md`) | 28 | 22,40 |
| T-02, el sondeo | 4 | 3,20 |
| T-03, los catorce clips | 17 | 13,60 |
| **T-04, esta task** | **0** | **0,00** |
| **sin gastar al cerrar la etapa 1** | **7** | **5,60** |

---

## 7. Lo que se tocó, y lo que no

Todo lo nuevo vive adentro de `demo/race-multiview/`:

| | |
| --- | --- |
| `scripts/generar-relato.sh` | las diecinueve líneas, con el portón y el nivelado |
| `scripts/relato/` | `guion.json`, los dos prompts de estilo, y `porton.mjs` |
| `scripts/armar-relato.mjs` | la línea de tiempo, el ancla del anuncio, y el render de las voces |
| `scripts/verificar-anuncio.mjs` | la aserción y sus dos controles |
| `scripts/armar-programa.sh` | el concat, el emparejado del ambiente y la mezcla |
| `scripts/medir-mezcla.py` | el margen del relato sobre el ambiente, con su referencia |
| `audio/` | las diecinueve líneas, `programa.m4a`, `guion.md`, `tiempos.json`, `transcripciones.tsv` |
| `content/.fuentes/programa.mp4` | **el programa** |

**`lib/` no se tocó, y se prueba** ([`salidas/no-se-rompio-nada.txt`](salidas/no-se-rompio-nada.txt)):
`npm test` da **184 pruebas, 184 pasan, 0 fallan**, salida 0; `npm run check` da **verde**
—3 ocurrencias, las tres en la lista aceptada, y cero hits en la segunda—, salida 0. Son los
mismos números con los que la T-01 abrió la fase. `git status` muestra **dos directorios
nuevos y ni un archivo existente modificado**.

---

## 8. Lo que esta task NO hizo

- **La cadena, la señalización y la página.** Son de la etapa 2 y la etapa 2 no arrancó.
- **Las seis cámaras.** Cero clips.
- **La tipografía.** Está mostrada al tamaño real, no resuelta.
- **La cama de público.** Argumentado arriba.
- **Ninguna medición sobre cómo se ve esto adentro de una caja de la grilla real**, porque
  la grilla no existe todavía. Los 470 y 190 px son el ancho de la caja, no la caja.
