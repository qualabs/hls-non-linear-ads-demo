# T-05 — el break mezclado adentro del recorrido grabable

El break que David pidió —"concurrent, concurrent, linear, concurrent"— está en
la corrida que se graba, y es el quinto y último. Todas las lecturas salen de
`t05recorrido.py`, que carga la página una vez y la deja reproducir hasta el
segundo 174 sin un solo seek. La corrida entera, con la consola incluida, está
en `t05-el-recorrido-con-el-break-mezclado.json`; la tabla que el script imprime
está verbatim en `t05-la-tabla-del-script.txt` y los diez tags que escribe en
`t05-los-diez-tags.txt`.

## Las tres decisiones

### 1. Dónde entra el break mezclado: es el quinto, y el Quad se corre al cuarto

El recorrido sigue teniendo **cinco breaks en los mismos cinco segundos** —20,
45, 70, 95 y 120—, y lo que cambia es el último: donde había un break de un
aviso de 12 s hay uno de cuatro avisos de 48 s. El Quad, que estaba en el 120,
pasa al 95, y el Side by side pullback, que estaba en el 95, **no desaparece de
la corrida: es el segundo aviso de adentro del break mezclado**.

No es un break nuevo porque no entra: el programa dura 180 s, un sexto break
querría 48 s más los 13 que separan a los otros, y el recorrido terminaría en el
segundo 193. Achicar los espacios entre breaks para que entre es pagar con lo
único que la grabación pide de la tabla —que se vea el contenido volver— para
mostrar dos veces un layout que ya se muestra.

Y es el último, y no el cuarto, por lo que cuenta mejor en escenario: es lo
nuevo de la fase y lo que hay que explicar, así que va al final, donde el
presentador ya mostró los cuatro layouts sueltos y puede hablar encima del
tramo invertido en vez de tener que volver sobre él. Cierra en el 168 y quedan
12 s de programa después, que es lo mismo que separa a los otros breaks.

**Los cinco nombres del documento de requerimientos siguen estando**: Overlay
(break 1), LBox video (2), LBox image (3), Quad (4) y Side by side pullback
(adentro del 5, doce segundos enteros como cualquier otro).

### 2. El aviso a cuadro entero va tercero, y la inversión del par se acepta

Va como David lo pidió: concurrent, concurrent, linear, concurrent. Las otras
dos salidas que la sección 8 del `DESIGN.md` deja abiertas —poner el lineal
primero, o desalinear los `START-DATE`— quedan descartadas.

Los dos tags del break arrancan en el mismo segundo, que es lo que hace que el
par sea un par (ADR 0018), y lo que no comparten es el largo: el de clase Apple
declara 12 s y el nuestro 48. Así que del 132 en adelante el pane de fábrica ya
volvió al programa y el nuestro sigue adentro del break, y **del 144 al 156 —el
aviso a cuadro entero— la comparación queda al revés**: el de fábrica muestra el
programa y el nuestro la pantalla tapada.

Son 12 segundos de 48 y no cambian el argumento: **los dos players están
haciendo lo mismo en momentos distintos**, porque les tocaron breaks de largos
distintos. El argumento vive en los otros 36 segundos. Está escrito en la tabla
que el script imprime y en la sección `Before you record` del `README.md`, que
es donde el presentador lo lee antes de grabar.

Lo que sí se leyó, aunque no sea lo que se juzga, es la línea de estado del pane
de fábrica en el mismo instante de cada aviso del break mezclado, que está en la
tabla de más abajo. **Si el tramo invertido se cuenta bien en escenario no se
afirma acá**: se juzga mirando los dos panes en el mismo cuadro y lo mira
Nicolás corriendo la demo.

### 3. El `PLANNED-DURATION` deja de estar escrito a mano

La T-01 anotó que el script escribía `PLANNED-DURATION=12` fijo en los dos tags,
así que el tag concurrente de un break de varios avisos declaraba doce segundos
de un break que dura otra cosa. Es inerte para este player —el rango concurrente
lo arma `rangeOfExperiences` con las experiencias y no con el tag— pero es un
dato que le miente a cualquier otro cliente que lea la playlist, y el script del
recorrido es de esta task.

Ahora **cada tag declara el largo de su propio asset-list**, leído del archivo:
la suma de las `DURATION` del Apéndice D.2. En los cuatro primeros breaks los
dos números coinciden en 12; en el mezclado son 12 en el de clase Apple y 48 en
el nuestro, y esa diferencia es exactamente lo que produce la inversión de la
decisión 2. En el modo de un solo break vale lo mismo: `20 multiAd` declara 36 y
`20 mezclado` declara 48, que era el caso que la T-01 encontró.

Los diez tags de la corrida, con el `START-DATE` recortado, están en
`t05-los-diez-tags.txt`.

### 4. Lo que la línea de la demo dice durante el aviso a cuadro entero

La T-02 anotó que la línea de estado del pane de la demo decía `nothing was
replaced` también durante el aviso a cuadro entero. Es literalmente cierto —el
primario nunca se detuvo, que es el ADR 0016 y lo que la propia T-02 lee en
`paused`— pero **en escenario se lee al revés**, justo mientras se ve un aviso
ocupando toda la pantalla, y está en cámara mientras lo hace.

La línea dice ahora lo mismo del otro lado cuando un elemento del aviso **tapa**
al primario: `the programme is still playing underneath, covered and silent`. Es
la frase que una pantalla tapada no contradice, y afirma más que la anterior:
no que no se reemplazó nada, sino que el programa está atrás.

Se decide leyendo el contrato y no el `type` de la experiencia —un elemento no
primario con caja `0 0 0 0` y `zDepth` por encima del primario—, así que un
layout que algún día declare un aviso a cuadro entero **con** bloque recibe la
misma línea sin que la página aprenda nada nuevo. Y la mitad del audio sale del
`volume` del propio primario, así que la frase no puede decir `silent` de un
programa que no lo está.

## 1. La monotonía del `currentTime`, que es lo que dice que no hubo seek

Un muestreador adentro de la página anota cada 50 ms el reloj del primario junto
al reloj de pared. Un salto no se juzga contra un umbral inventado sino contra el
tiempo que pasó: a `playbackRate` 1 los dos avanzan lo mismo, y un seek —hacia
atrás o hacia adelante— es exactamente la lectura donde dejan de hacerlo.

| | |
| --- | --- |
| muestras | **3484**, de la primera a la última en una sola carga |
| primera muestra | reloj de pared 0,059 s, `currentTime` 0,000 s |
| última muestra | reloj de pared 174,200 s, `currentTime` 174,037 s |
| peor salto hacia atrás | **0,000 s** |
| peor adelanto sobre el reloj de pared | **0,009 s** |
| eventos `seeking` del elemento del primario | **0** |
| `playbackRate` en las nueve lecturas | 1 |

Cero saltos hacia atrás y un adelanto máximo de nueve milésimas sobre el reloj
de pared en 174 segundos: el `currentTime` avanzó monótono del arranque al fin y
no hubo un solo seek. La lista de `seeking` está vacía, que es la misma
afirmación por el otro lado.

## 2. Los rangos contra la tabla que el script imprime

`provider.programRanges()` al final de la corrida, `settled` en `true`, contra
la tabla de `t05-la-tabla-del-script.txt`:

| tag | `kind` | `startTime` | `duration` | la tabla dice |
| --- | --- | --- | --- | --- |
| `AD-1-CONCURRENT` | concurrent | 20 | 12 | break 1, t= 20s a 32s |
| `AD-2-CONCURRENT` | concurrent | 45 | 12 | break 2, t= 45s a 57s |
| `AD-3-CONCURRENT` | concurrent | 70 | 12 | break 3, t= 70s a 82s |
| `AD-4-CONCURRENT` | concurrent | 95 | 12 | break 4, t= 95s a 107s |
| `AD-5-CONCURRENT` | concurrent | 120 | **48** | break 5, t=120s a 168s |

Los mismos segundos, los cinco. Los otros cinco rangos de la lista son los
`AD-n-LINEAR`, de clase `interstitial`, 12 s cada uno en los mismos cinco
segundos: son los tags de clase Apple del par de compatibilidad, y nuestra barra
no los marca (ADR 0018).

## 3. `activeAt` en un instante de adentro de cada aviso

Nueve instantes, uno por aviso de la corrida más uno después del break mezclado.
En los nueve `activeAt` devuelve **exactamente una** experiencia —o ninguna, en
el último— y ninguna con dos adentro.

| instante | `itemId` | `type` | `startTime` | `duration` | la mezcla predice |
| --- | --- | --- | --- | --- | --- |
| 26,027 s | `AD-1-CONCURRENT.0` | `cornerOverlay` | 20 | 12 | 20 |
| 51,046 s | `AD-2-CONCURRENT.0` | `squeezebackLShape` | 45 | 12 | 45 |
| 76,028 s | `AD-3-CONCURRENT.0` | `squeezebackLShape` | 70 | 12 | 70 |
| 101,005 s | `AD-4-CONCURRENT.0` | `multiView` | 95 | 12 | 95 |
| 126,059 s | `AD-5-CONCURRENT.0` | `cornerOverlay` | 120 | 12 | 120 |
| 138,043 s | `AD-5-CONCURRENT.1` | `squeezebackDoubleBox` | 132 | 12 | 132 |
| 150,002 s | `AD-5-CONCURRENT.2` | **`linear`** | 144 | 12 | 144 |
| 162,022 s | `AD-5-CONCURRENT.3` | `cornerOverlay` | 156 | 12 | 156 |
| 172,036 s | — | — | — | — | nada |

**Los cuatro avisos del break mezclado salen en el orden que la mezcla declara**
—concurrent, concurrent, linear, concurrent—, cada uno donde el desplazamiento
acumulado de la T-01 lo pone, y el `itemId` los distingue aunque el primero y el
cuarto compartan `type`.

Y la experiencia que cada uno entrega, elemento por elemento:

| aviso | elementos | caja del primario | caja del aviso | `volume` primario / aviso |
| --- | --- | --- | --- | --- |
| 1, `cornerOverlay` | 2 | `0 0 0 0`, z 0 | `0 75 75 0`, z 1 | 100 / 0 |
| 2, `squeezebackDoubleBox` | 2 | `25 50 25 0`, z 0 | `25 0 25 50`, z 1 | 100 / 0 |
| 3, `linear` | 2 | `0 0 0 0`, z 0 | `0 0 0 0`, **z 1** | **0 / 100** |
| 4, `cornerOverlay` | 2 | `0 0 0 0`, z 0 | `75 0 0 75`, z 1 | 100 / 0 |

En el instante del tercero, con el nodo del aviso en `readyState` 4: el `<video>`
del primario tiene `volume` 0 y **`paused` en falso**, que es la lectura que dice
que el programa no se detuvo detrás del aviso a cuadro entero. Un instante
después del fin del break, a los 172,036 s: capa vacía, `style` en `null`,
`volume` de vuelta en 1.

## 4. La línea de la demo y la del pane de fábrica, en los mismos instantes

| instante | pane de la demo | pane de fábrica |
| --- | --- | --- |
| 126,059 s, aviso 1 | `… CONCURRENT AD (cornerOverlay) · nothing was replaced` | `LINEAR AD "AD-5-LINEAR" · 5.1s of 12.0s · the content is off the screen` |
| 138,043 s, aviso 2 | `… CONCURRENT AD (squeezebackDoubleBox) · nothing was replaced` | `primary content · 136.8s` |
| 150,002 s, aviso 3 | `… CONCURRENT AD (linear) · the programme is still playing underneath, covered and silent` | `primary content · 148.7s` |
| 162,022 s, aviso 4 | `… CONCURRENT AD (cornerOverlay) · nothing was replaced` | `primary content · 160.7s` |

La primera fila es el cuadro que la demo quiere y la tercera es el tramo
invertido, los dos leídos en el mismo instante. **La tercera no se afirma como
resultado**: está acá porque es el mismo dato que las otras y porque muestra que
la línea de la demo ya no dice lo contrario de lo que se ve.

## 5. Lo que la corrida NO dejó

Cero eventos `seeking`, cero advertencias y cero errores de consola en los 174
segundos. Los únicos mensajes de la capa de señalización son los cinco que
anuncian cada asset-list y **un `log`** —no un `warn`— por el tercer asset del
break mezclado:

```
[signalling] AD-5-CONCURRENT: an ASSET carries no layout block, so it is a linear ad
and plays its own URI full frame (ADR 0019).
```

Es un aviso lineal declarado y no un repliegue, que es la distinción que la T-02
dejó escrita.

## Los chequeos del proyecto

- `npm test`: **43 pasan, 0 fallan**. La task edita
  `scripts/senalizar-contenido.sh`, que es de donde
  `test/program-ranges-and-volume.test.js` parsea el recorrido y el
  `PLANNED-DURATION`, así que ese archivo se movió con él: el largo de cada tag
  se calcula del asset-list en vez de leerse de un literal, los diez rangos se
  comparan contra la lectura de esta task, y los nueve que no se movieron se
  siguen comparando contra la de la T-02 de la fase 02. Hay una afirmación nueva
  y es sobre el script y no sobre esta corrida: que el `PLANNED-DURATION` no
  está escrito a mano.
- `node scripts/verificar-cortes.mjs`: las dos costuras se sostienen. ADR 0003
  con tres ocurrencias, todas en la lista de aceptadas; ADR 0015 con cero cruces.
- La comparación de la caja pedida contra la dibujada **no corresponde**: esta
  task es datos y guion de recorrido, no renderizado. Las cajas de los cuatro
  avisos del break mezclado son las que la T-02 midió con la misma fixture, a
  0,0 px.

## Los archivos

| archivo | qué es |
| --- | --- |
| `t05recorrido.py` | la corrida entera en una sola carga: el muestreador de la monotonía, las nueve lecturas y los rangos |
| `t05-el-recorrido-con-el-break-mezclado.json` | la corrida, con las 3484 muestras y la consola |
| `t05-la-tabla-del-script.txt` | lo que `./scripts/senalizar-contenido.sh` imprime en cada arranque, verbatim |
| `t05-los-diez-tags.txt` | los diez `EXT-X-DATERANGE` que escribe, con el `START-DATE` recortado |
