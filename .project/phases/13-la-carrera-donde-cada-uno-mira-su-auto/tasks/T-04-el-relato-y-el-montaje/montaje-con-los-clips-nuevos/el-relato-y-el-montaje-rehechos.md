# El relato y el montaje sobre los catorce clips aprobados

El programa está rehecho: **`demo/race-multiview/content/.fuentes/programa.mp4`**, 112,000 s
exactos, 2688 cuadros a 24 fps, con las catorce casillas que Nicolás aprobó —las seis nuevas
incluidas— y las diecinueve líneas encima. **Cero generaciones de Veo**; unos **US$0,01** de
texto a voz.

**Tres líneas cambiaron de texto y una se quedó porque volvió a ser cierta.** Las diecinueve
se miraron contra su casilla, no sólo las cuatro que el informe de la regeneración señalaba:
ahí apareció una cuarta línea desalineada que ningún clip nuevo causó, y apareció que dos de
las cosas que ese informe daba por ciertas sobre la casilla 12 no lo son.

Las dos propiedades medibles pasan con su control en rojo: el anuncio termina de decirse en
**27,640 s** con la ventana abriendo en **28,000**, y la línea de la casilla 12 termina en
**91,803 s** con el plano que nombra saliendo de cuadro en **92,375 s**.

Lo que hay para mirar está en [`cuadros/`](cuadros/) y lo que hay para auditar en
[`salidas/`](salidas/).

---

## 1. Las diecinueve contra su casilla

La lámina que permite auditar esto sin abrir un video es
[`cuadros/2-las-lineas-contra-su-casilla.jpg`](cuadros/2-las-lineas-contra-su-casilla.jpg):
las cuatro casillas donde hubo una decisión de texto, cuatro cuadros de cada una —a 0,5 /
2,5 / 4,5 / 6,5 s, porque lo que se juzga es si la frase vale durante los ocho segundos y no
en un instante— y la línea escrita encima.

| línea | casilla | qué pasó |
| ---: | ---: | --- |
| **06** | 5 | **reescrita.** La chicana y los pianos no están en el clip nuevo: NOCTEV va solo por un tramo abierto, con la cámara a su lado |
| **11** | 9 | **reescrita.** Decía *"nose to tail"* y los dos autos van **rueda a rueda los ocho segundos**. No lo causó ningún clip nuevo: la casilla 9 es la misma de siempre |
| **13** | 10 | **se queda como estaba.** El mar salió en el clip nuevo y está en cuadro desde el primer segundo, así que *"down to the sea section"* volvió a ser verdad |
| **15** | 12 | **reescrita, y no como el informe anterior proponía.** Ver abajo |
| 01 | 1 | se queda: las dunas y los seis autos están en cuadro |
| las otras catorce | | se quedan |

Los textos nuevos:

- **06** → *"Noctev third, and he has been quicker than the leader for two laps now."*
  Es el reemplazo que el informe de la regeneración proponía, y aguanta: no nombra nada de
  la geometría, que es lo que cambió.
- **11** → *"Marvok and Noctev now, wheel to wheel through this long corner."*
- **15** → *"Look at Runtak, running right along that kerb."*

**Dos líneas que dejé en pie y podrías querer cambiar, y por eso van acá.** La 03
(*"Marvok has been in that mirror…"*) y la 17 (*"Marvok is right on the back of Caldrix"*)
nombran a un auto que viene atrás, y en las dos casillas los dos autos van casi a la par con
el nombrado medio auto atrás. Las dejé porque las dos hablan de lo que viene pasando y
terminan en un ataque que sí está en cuadro; la 11 no tenía esa salida, porque *"nose to
tail"* es una afirmación sobre la imagen y la imagen dice otra cosa. Si preferís que
ninguna diga "atrás" cuando se ve "al lado", son dos síntesis de dos centavos.

### La casilla 12, donde el informe anterior no daba

Dos cosas que ese informe deja escritas no se sostienen contra los cuadros, y las dos
mueven la línea:

**El corte no está a los 5,3 s: está a los 4,375 s.** Medido sobre el clip, no leído
([`salidas/la-linea-15-contra-el-corte.txt`](salidas/la-linea-15-contra-el-corte.txt)). Con
5,3 la línea vieja habría entrado holgada —terminaba en 92,78— y el defecto no se habría
visto nunca.

**La rueda no va sobre el piano.** El piano ocupa todo el primer plano del cuadro los cuatro
segundos y medio, y el auto corre **del otro lado**, sobre el asfalto: entre la goma y el
piano hay pista. La primera reescritura de la 15 todavía decía *"the rear wheels right over
the kerb"* y la tiré después de mirar los cuadros al tamaño real, que es para lo que se
miran. La que quedó dice que corre **al lado** del piano, que es lo que se ve.

---

## 2. Las dos mediciones, con sus controles en rojo

### El anuncio contra la ventana

Verbatim en [`salidas/el-anuncio-contra-la-ventana.txt`](salidas/el-anuncio-contra-la-ventana.txt).

```
la linea: "The cameras on all six cars are open."   3.582 s   anuncioLargoMax 4 s
race.json: ofertaEn 28 s

VERDE  el relato como se entrega          fin hablado 27.640 s   ventana [27.5 ; 28]
ROJO   CONTROL la linea corrida +3 s      seguia hablando en 28.020 s, que es donde arranca la linea siguiente   ventana [27.5 ; 28]
ROJO   CONTROL la linea corrida -3 s      fin hablado 24.640 s   ventana [27.5 ; 28]

PASA, y se vieron los dos controles en rojo.
```

`ofertaEn` sale de `race.json` y no está tipeado en ningún lado: lo lee `armar-relato.mjs`
para colocar la línea y `verificar-anuncio.mjs` para medirla. Lo que se mide es el **fin
hablado sobre el audio rendido** y no el fin del archivo, porque cada línea lleva 60 ms de
aire atrás y comparar la aritmética contra la misma aritmética que la produjo no verifica
nada.

### La línea 15 contra el corte de su casilla

Verbatim en [`salidas/la-linea-15-contra-el-corte.txt`](salidas/la-linea-15-contra-el-corte.txt).

```
el clip de la casilla 12 salta 0.0643; el mas alto de los otros 13 es 0.0263  (2.4 veces)
corte del clip a los 4.375 s  ->  segundo 92.375 del programa

VERDE  el relato como se entrega      fin hablado 91.803 s   0.572 s antes del corte
ROJO   CONTROL la linea corrida +1 s  fin hablado 92.803 s   0.428 s DESPUES del corte

PASA, y se vio el control en rojo.
```

**El segundo del corte se mide y no se tipea**, que es lo que hace que este chequeo siga
sirviendo si mañana se regenera esa casilla: el script lee los scene scores cuadro a cuadro
y toma el salto más grande después del primero. Un número así, solo, no dice nada, así que
va **contra su referencia**: el mismo estadístico sobre los otros trece clips, que son de
una sola toma. El de la 12 mide 2,4 veces el más alto de ellos; si no se separara, el script
dice que no hay corte que medir y sale distinto de cero en vez de aprobar.

**Y hay un tercer rojo que nadie preparó**
([`salidas/la-linea-15-como-estaba.txt`](salidas/la-linea-15-como-estaba.txt)): la pista de
voces del montaje anterior, rendida antes de tocar el guion, medida contra el mismo corte da
**92,781 s**, o sea 0,406 s después de que ese plano salió de cuadro. El instrumento
detecta el defecto real, no sólo el que se le planta.

---

## 3. El portón, y una falla del oyente y no del sintetizador

Cuatro síntesis en total —06, 11, y la 15 dos veces—, todas al primer intento
([`salidas/las-lineas-nuevas.txt`](salidas/las-lineas-nuevas.txt)). El control se vio
rechazar la línea plantada con el prompt adentro
([`salidas/control-el-porton-en-rojo.txt`](salidas/control-el-porton-en-rojo.txt)):

```
veredicto:   MAL  leyo el prompt en voz alta (shouting, advertisement, unhurried) |
             repitio "the cameras on all" | dijo 25 palabras y se le pidieron 8
```

**Lo que hay que saber del portón, porque esta corrida lo mostró**: de la línea 11 el
transcriptor de `gemini-2.5-flash` devolvió *"Ma and now wheel to wheel through this long
corner"* —se comió los dos nombres— y el portón la dejó pasar, correctamente, porque no
había fuga ni repetición ni largo de más. El segundo oyente, whisper.cpp local, recupera
*"Marvok and Noctev now wheel to wheel through this long corner"*: lo que falló fue el
transcriptor. **El portón decide sobre lo que el oyente oyó, así que un oyente que se come
palabras lo vuelve más permisivo, no más estricto.** Acá se resolvió mirando con el segundo
oyente, que es lo mismo que hizo la T-03 con la discrepancia de la música.

---

## 4. El montaje

Verbatim en [`salidas/el-montaje.txt`](salidas/el-montaje.txt) y
[`salidas/los-trece-cortes.txt`](salidas/los-trece-cortes.txt).

| | |
| --- | --- |
| duración | **112,000000 s** |
| cuadros | **2688** a 24 fps, 14 × 192 sin descartar ninguno |
| tamaño | 1280×720 |
| sonoridad | **−23,0 LUFS**, pico **−6,7 dBFS** |

**Las catorce casillas salen del clip que el plan les asigna, y eso se comprobó contra los
clips y no contra el nombre del archivo**: cada casilla del montaje se comparó contra los
catorce originales y las catorce se parecen más al suyo, a una distancia de 0,95 a 1,62,
con el segundo más parecido entre 40,9 y 62,1. Es lo que prueba que el `programa.mp4`
entregado lleva la casilla 10 nueva y no una copia vieja: un concat con las entradas mal
ordenadas da 2688 cuadros igual.

**Y los trece cortes son cortes.** La distancia entre el último cuadro de una casilla y el
primero de la siguiente va de 37,1 a 78,5; entre dos cuadros consecutivos de adentro de una
casilla —la referencia, que no sale de este cálculo— va de 4,9 a 11,6. El corte más flojo
mide 3,2 veces el interior más movido y los dos rangos no se tocan. Lámina en
[`cuadros/1-los-trece-cortes.jpg`](cuadros/1-los-trece-cortes.jpg).

### El ambiente, emparejado clip por clip

Los catorce miden entre **−15,3 y −24,8 LUFS** al natural, 9,5 LU de dispersión, y cada uno
se atenúa con una ganancia propia —de −5,20 a −14,70 dB— hasta **−30,0 LUFS los catorce**,
diez decibeles por debajo de las líneas. La casilla 10 nueva pide −7,70 dB y su pico es
−10,6 dBFS: entra sin pelear con las demás.

El margen durante el habla ([`salidas/el-margen-del-relato.txt`](salidas/el-margen-del-relato.txt)):

| | n | mínimo | p10 | mediana | debajo de 6 dB |
| --- | ---: | ---: | ---: | ---: | ---: |
| **el ambiente emparejado** | 626 | −0,2 | 5,7 | **9,7** | 69 (11,0 %) |
| *referencia: el mismo montaje sin emparejar* | 626 | −11,1 | −5,0 | *0,6* | *581 (92,8 %)* |

La referencia son los catorce concatenados a su nivel original, o sea este mismo montaje sin
el trabajo de emparejar: ahí el relato está debajo del ambiente la mitad del tiempo. El peor
momento que queda es **−0,2 dB en el segundo 89,7**, un chirrido de la casilla 12 que llega
al nivel de la voz por una décima, y no se corrigió porque es lo que pasa en una transmisión
de carrera.

**Que se entienda no se dedujo del margen: se comprobó**
([`salidas/se-entiende-el-relato.txt`](salidas/se-entiende-el-relato.txt)). Un transcriptor
local que no vio el guion escuchó el `programa.mp4` mezclado y **recuperó las diecinueve
líneas, palabra por palabra**. Sobre el ambiente solo devuelve `(engine revving)` cuatro
veces y ninguna línea.

---

## 5. Los cuadros al tamaño real

[`cuadros/0-las-tres-casillas-a-470-y-190.jpg`](cuadros/0-las-tres-casillas-a-470-y-190.jpg),
**que se mira al 100 %** porque cualquier zoom la invalida. Los dos anchos son los reales:
470 px es una caja de la grilla de cuatro en una pantalla grande, 190 px es una caja en un
teléfono. Los archivos sueltos están al lado.

| cuadro | por qué ése |
| --- | --- |
| casilla 4, segundo 28 | el instante en que abre la ventana, y la única de las catorce con una palabra **legible** en la carrocería (`AQUAAMARINE`, tomada del propio prompt) |
| casilla 10, segundo 76 | el clip nuevo adentro del programa: los dos autos juntos, el mar detrás, y la tipografía inventada más grande de las catorce (`KUWRIS`, `753`, `CMS`). Ninguna marca real |
| casilla 12, segundo 91 | el instante en que se está diciendo la línea 15, que es donde el relato y la imagen tienen que coincidir o no coinciden en ninguna |

La tipografía ilegible en la carrocería sigue como la dejó la T-03: a 470 px son manchas, a
190 px desaparecen. Esta corrida no la tocó y no es una decisión suya.

---

## 6. Lo que decidí, porque no estaba escrito

**La línea 13 no se re-sintetizó.** El clip nuevo la volvió cierta y el archivo de audio que
ya existía dice exactamente ese texto. Regenerarla habría cambiado su duración y movido la
mezcla por nada.

**La línea 15 arranca en 88,20 y no en 88,05.** Con el texto corto entra igual antes del
corte, con 0,57 s de margen, y 88,20 deja que la voz entre dos décimas después del cambio de
plano en vez de encima.

**La línea 16 (*"And the car keeps taking it"*) se queda y cae después del corte**, sobre el
plano frontal. Es un comentario de Kore sobre lo que acaba de decir Charon, no una
descripción de la imagen, y un relator real sigue hablando medio segundo después de que el
realizador cortó.

**`--correr-anuncio` pasó a ser `--correr <id>:<segundos>` en `armar-relato.mjs`.** El
control de la línea 15 necesita correr una línea que no es la del anuncio, y dos banderas
que hacen lo mismo con distinto nombre es peor que una. `verificar-anuncio.mjs` le pasa el
id que leyó del guion, no uno tipeado.

**`audio/guion.md` quedó al día.** Duplicaba los textos y los tiempos, así que con las
líneas viejas adentro era un documento que mentía. La tabla, el porcentaje de habla y la
sección de la línea 15 están reescritos.

---

## 7. Lo que se tocó

| | |
| --- | --- |
| `scripts/relato/guion.json` | las tres líneas nuevas |
| `scripts/armar-relato.mjs` | `--correr` general, el arranque de la 15, y los comentarios del plan que nombraban lo que ya no está |
| `scripts/verificar-anuncio.mjs` | usa `--correr` con el id del anuncio |
| `scripts/verificar-linea-15.mjs` | **nuevo**: la línea contra el corte de su casilla, con el corte medido sobre el clip |
| `audio/lineas/linea-{06,11,15}.m4a`, `audio/tiempos.json`, `audio/transcripciones.tsv`, `audio/programa.m4a`, `audio/guion.md` | el relato |
| `content/.fuentes/programa.mp4` | **el programa** |

**`lib/` no se tocó, y se prueba**
([`salidas/no-se-rompio-nada.txt`](salidas/no-se-rompio-nada.txt)): `npm test` da **184
pruebas, 184 pasan, 0 fallan**, salida 0; `npm run check` da **verde** —3 ocurrencias, las
tres en la lista aceptada, cero hits en la segunda—, salida 0. Son los mismos números con
los que la T-01 abrió la fase. `git status` no muestra **un solo archivo trackeado
modificado**: todo vive adentro de `demo/race-multiview/` y de `.project/phases/13-…/`.

**Nada se commiteó y nada se pusheó.**

---

## 8. Lo que esta corrida NO hizo

- **Ninguna generación de video.** Los catorce clips son los que estaban.
- **La tipografía de la carrocería.** Mostrada al tamaño real, no resuelta.
- **La cama de público.** Sigue sin agregarse, por lo que la T-04 dejó argumentado.
- **Los nombres de archivo que mienten.** `05-noctev-chicana` no tiene chicana y
  `10-pentav-quentra-eses` no tiene eses. No se renombraron porque el orden del montaje sale
  del prefijo numérico y renombrar deja colgadas las referencias de las corridas anteriores.
- **Nada sobre la cadena, la señalización ni la página**, que son de la etapa 2.
