# El reemplazo: la forma la fijó una medición

2026-09-07. El Date Range de clase Apple de cada break pasa a la forma de
reemplazo, con las dos candidatas corridas contra la inserción que corría hasta
hoy, y el recorrido entero corrido de punta a punta con el cambio puesto.

## 1. Las dos candidatas, y qué hizo hls.js 1.7.2 con cada una

Tres corridas de `t05medir.py`, una por forma del tag, sobre el mismo contenido
y la misma versión: la inserción como control, y las dos candidatas. De cada una
se leyó la agenda que el `interstitialsManager` del pane de fábrica resolvió
—antes y después de que lleguen los asset list— y el barrido de los relojes de
los dos panes hasta pasado el segundo break, sin un solo seek.

| forma del tag | `resumeOffset` | `resumptionOffset` | `resumeTime` de los cinco | `appendInPlace` | atraso a los 60 s |
| --- | --- | --- | --- | --- | --- |
| `X-RESUME-OFFSET=0` (control) | 0 | 0 | 20,02 · 45,02 · 70,02 · 95,02 · 120,02 | no en los cinco | 12,4 s por break |
| `X-RESUME-OFFSET=12` | 12 | 12 | 32,02 · 57,02 · 82,02 · 107,02 · 132,02 | sí en 1, 3 y 5 | 0,35 s |
| sin el atributo | `NaN` | el largo del aviso | 32,02 · 57,02 · 82,06 · 107,02 · 132,02 | sí en 1, 3 y 5 | 0,31 s |

**El control reproduce la inserción y con el número de la fase 01.** Con
`X-RESUME-OFFSET=0` el punto de retorno es el segundo en que el aviso empezó
—`resumeTime` igual a `startTime`—, así que cada break le agrega tiempo de reloj
y no le adelanta programa: 12,5 s de atraso después del primero y 12,36 s
después del segundo, que es la misma medición que la T-12 hizo a 12,37 s por
break.

**Las dos candidatas reemplazan, y no se separan por el modo.** Las dos ponen el
punto de retorno doce segundos más adelante del START-DATE, las dos dejan el
atraso en la fracción de segundo que dos elementos que reproducen por separado
acumulan solos, y las dos producen exactamente el mismo patrón de estrategia de
append. El bloque de la task esperaba que la medición eligiera entre ellas por
lo que hls.js hace con cada una, y lo que hace es casi lo mismo.

**Lo que las separa es de dónde sale el punto de retorno**, y eso se ve en la
lectura de la agenda con el asset list ya cargado. Con el atributo ausente,
`resumeOffset` queda en `NaN` y hls.js resuelve el retorno contra el largo que
**midió** del aviso: `AD-3-LINEAR`, con su lista cargada, salió con `duration`
12,037 s, `resumptionOffset` 12,037 y `resumeTime` 82,059. Con el offset escrito
a mano vale el número escrito: el mismo evento, con el mismo aviso de 12,037 s,
salió con `resumptionOffset` 12 y `resumeTime` 82,021. Son 38 ms en este
contenido, y son la diferencia entre un punto de retorno que es una propiedad
del aviso y uno que es una constante que hay que mantener igual al aviso.

**Y el largo que la forma ausente usa es el medido y no el declarado.** Una
cuarta corrida con el asset list lineal declarando `DURATION: 8.0` en lugar de
12,0 —el único cambio, revertido después— dejó el `duration` del evento en
12,027 s una vez cargada la lista, o sea el largo real del media y no el que el
JSON declara. La forma ausente sigue al aviso incluso cuando la declaración
miente.

**Por eso el tag va sin `X-RESUME-OFFSET`.** Es la única de las dos formas cuyo
punto de retorno no hay que mantener sincronizado a mano con el largo del aviso,
y las dos son una línea de `scripts/senalizar-contenido.sh`, así que la decisión
es reversible con un `printf`.

El `X-RESUME-OFFSET=0` del tag concurrente no se tocó: no significa nada en esa
clase, porque no hay nada interrumpido que reanudar (ADR 0016).

## 2. El recorrido entero, y el número que dice que el atraso se fue

Una sola corrida de `t05run.py`, la página cargada una vez y dejada reproducir
hasta los 160 s. Cero seeks del elemento del pane de la demo.

Los cinco breaks, los dos panes leídos en el mismo instante:

| break | layout | pane de la demo | programa del de fábrica | aviso en el de fábrica |
| --- | --- | --- | --- | --- |
| 1 | `cornerOverlay` | 26,008 s | 25,963 s | AD-1-LINEAR |
| 2 | `squeezebackLShape` | 51,242 s | 45,021 s | AD-2-LINEAR |
| 3 | `squeezebackLShape-image` | 76,198 s | 75,876 s | AD-3-LINEAR |
| 4 | `squeezebackDoubleBox` | 101,253 s | 95,021 s | AD-4-LINEAR |
| 5 | `multiView` | 126,056 s | 125,067 s | AD-5-LINEAR |

**Al final del recorrido: 160,106 s en el pane de la demo y 159,381 s en el de
fábrica, o sea 0,72 s, contra los 49,47 s que la T-12 de la fase 01 midió en el
mismo instante de la misma corrida.** La captura de los dos panes en ese segundo
está en `t05-el-atraso-que-se-fue.png`, y es el mismo cuadro de la misma película
en los dos: el archivo equivalente de la T-12 —`t12-el-programa-que-el-de-fabrica-se-perdio.png`—
muestra dos escenas distintas.

**Los 0,72 s son de dos de los cinco breaks y de ninguno de los otros tres.** El
barrido lo muestra como una escalera y no como una deriva: 0,016 s desde el
arranque hasta pasado el break 1, 0,258 s después del break 2, 0,259 s después
del break 3, 0,725 s después del break 4 y 0,725 s después del break 5. Los tres
breaks que hls.js appendea en el lugar no cuestan nada; los dos que pasan el
MediaSource al asset y de vuelta cuestan 0,24 s y 0,47 s, que es el precio del
reattach. Los dos únicos seeks de la corrida son de ese reattach —el elemento del
pane de fábrica seekeó a 57,06 y a 107,06, y hls.js los hizo solo— y el elemento
del pane de la demo no seekeó nunca.

**El quinto break llega completo**, que con la inserción no pasaba adentro del
recorrido. Los eventos del manager del pane de fábrica, con el identificador
adentro: `AD-5-LINEAR` arrancó en el segundo 120,021 del programa y cerró con
`INTERSTITIAL_ASSET_ENDED`, `INTERSTITIAL_ENDED` e `INTERSTITIALS_PRIMARY_RESUMED`
en 132,059, o sea los doce segundos enteros, con el VOD de 180 s todavía lejos.
Los cinco cerraron igual: 20,021 → 32,059, 45,021 → 57,059, 70,021 → 82,059,
95,021 → 107,059 y 120,021 → 132,059. El recorrido pasa a mostrar cinco avisos
lineales en lugar de cuatro.

## 3. Lo que la medición encontró y no estaba escrito

**El reloj del pane de fábrica durante el break no reporta una cosa: reporta
dos, y depende del break.** El ADR 0017 y el comentario de `js/stock-player.js`
dicen que el tiempo que un cliente de mercado reporta durante un aviso de
reemplazo es el del aviso y no el del programa. Medido, es el del aviso en los
breaks 2 y 4 —donde hls.js pasa el MediaSource— y el del **programa** en los
breaks 1, 3 y 5, donde appendea el aviso adentro de la línea de tiempo del
primario y el `currentTime` del elemento nunca sale de ella. La estrategia la
elige hls.js por break, según si el punto de retorno cae en un borde de segmento:
sobre una grilla de 2 s, 32, 82 y 132 caen y 57 y 107 no.

Eso ya está en pantalla y se ve en las capturas: adentro del quinto break la
línea de estado de ese pane dice `LINEAR AD "AD-5-LINEAR" · 125.3s of the ad`, de
un aviso que dura 12 s, porque lee el `currentTime` del elemento como si fuera
siempre el del aviso. **Esta task no lo toca**: es el pane del otro, y qué muestra
ese pane durante un interstitial lo decide la T-07. Lo que la medición le deja es
que la respuesta que su riesgo R3 pedía medir no es una sino dos, y que una de
las dos ya está mintiendo en un rótulo que entra en cámara.

## 4. Lo que se corrió

- `npm test`: 27 de 27. La task edita `scripts/senalizar-contenido.sh`, que es de
  donde `test/program-ranges-and-volume.test.js` parsea la tabla del recorrido y
  el `PLANNED-DURATION`, así que un cambio que le rompiera la forma a esas líneas
  saldría en rojo. Ninguna de las dos formas se movió: la tabla no se tocó y el
  `PLANNED-DURATION=12` sigue en los dos tags.
- `scripts/verificar-cortes.mjs` no corre: ninguna de sus dos costuras mira ese
  script.
- Cero errores de consola en las cuatro corridas.

## 5. Los archivos

| archivo | qué es |
| --- | --- |
| `t05medir.py` | la medición de las formas del tag: la agenda del pane de fábrica antes y después de los asset list, y el barrido de los dos relojes |
| `t05-insercion.json` | el control, con `X-RESUME-OFFSET=0` |
| `t05-offset-igual-a-la-duracion.json` | la candidata con el offset escrito a mano |
| `t05-atributo-ausente.json` | la candidata sin el atributo, que es la que quedó |
| `t05-ausente-con-un-aviso-de-8s.json` | de dónde sale el largo del aviso: el asset list declarando 8,0 s y hls.js midiendo 12,027 |
| `t05run.py` | el recorrido entero en una corrida, sin seeks |
| `t05-el-recorrido.json` | los cinco breaks, los eventos con identificador, el atraso final y los contadores de seeks |
| `t05-N-<layout>-los-dos-panes.png` | los dos panes en el mismo instante adentro de cada break |
| `t05-el-atraso-que-se-fue.png` | los dos panes a los 160 s, que es el cuadro contra el de la T-12 |
| `t05-la-pagina-entera.png` | la página completa al final del recorrido |
