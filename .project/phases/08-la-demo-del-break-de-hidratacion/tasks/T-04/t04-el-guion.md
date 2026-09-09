# T-04 — El guion: anclas, placa, botón, y el freno

La demo guiada corre. Al entrar, el player está en pausa con la primera placa; cuando se
va, el partido arranca; y en cada beat la experiencia se frena sola, una línea de
tipografía dice lo que está por pasar, se va, y el player sigue para que se vea pasar.
Cuando el último beat termina, el player queda libre.

## Ningún beat nombra un segundo del programa

Los cinco beats del `story/story.json` se anclan a la señalización y nada más:

| beat | ancla | segundo que resuelve |
| --- | --- | --- |
| `apertura` | `{"at": "start"}` | 0, con el player quieto |
| `el-banner` | `{"before": {"break": 1}, "lead": 2.5}` | 11,5 — el break arranca en 14 |
| `la-l` | `{"at": {"break": 1, "ad": 2}, "lead": 1.5}` | 28,5 — el aviso 2 arranca en 30 |
| `el-caso-de-negocio` | `{"at": {"break": 1, "ad": 3}, "lead": 1.5}` | 44,5 — el lineal arranca en 46 |
| `la-vuelta` | `{"at": {"break": 1, "ad": 4}, "lead": 1.5}` | 54,5 — el aviso 4 arranca en 56 |

**Ni el guion ni el código contienen un segundo del programa.** `resolveAnchor` es el único
lugar de la demo que convierte señalización en segundos, y lo hace con
`provider.programRanges()` y `provider.experiences`: `break: n` es el n-ésimo rango
concurrente ordenado por tiempo, y `ad: k` el k-ésimo aviso de ese rango. **La página no
construye identificadores**: `HYDRATION-BREAK` es una convención del script de
señalización y el guion no sabe que existe.

Un ancla que no resuelve devuelve `null`, se dice por consola y **el beat se saltea en
lugar de inventarse en otro segundo**. El chequeo que convierte eso en un rojo es de la
T-07.

## La corrida, medida

Los cinco beats, con el segundo en que efectivamente frenaron:

```
beat 1   t=0       pausado   "A football match. Play is ..."
beat 2   t=11,75   pausado   "Play stops. The first ad i..."
beat 3   t=28,71   pausado   "More of the screen, and th..."
beat 4   t=45,36   pausado   "This is how it is done tod..."
beat 5   t=54,66   pausado   "And back. Fifty-eight seco..."
```

Cada uno frena **antes** de la cosa que anuncia, que es lo único que se le pide.

**Y hay un número que conviene tener a la vista: el loop llega hasta ~1 s tarde cuando la
pestaña no tiene el foco.** `requestAnimationFrame` se estrangula a ~1 Hz en una pestaña
en segundo plano, y eso se ve en las lecturas: el beat 2 debía disparar en 11,5 y disparó
en 11,75, el 3 en 28,5 y disparó en 28,71, el 4 en 44,5 y disparó en 45,36. **El margen
real es el `lead` menos ese segundo**, así que un `lead` por debajo de 1,5 s deja de ser
seguro. En la grabación la pestaña tiene el foco y el atraso baja a milisegundos; el
número está acá para que nadie baje el `lead` a 0,5 pensando que es más preciso.

## Las tres invariantes, en `t04-invariantes.txt`

**A. Un gesto sobre los controles no corta la guiada** (ADR 0042). Con la placa arriba, un
`pointerdown` y un click despachados directo al botón de play del cromo y a la barra:
`story` sigue en `running`, la placa sigue arriba y **el programa sigue en pausa**.

**B. Un click real ni llega al cromo.** `elementFromPoint` en el centro del player y sobre
la barra devuelve `card` en los dos casos: la placa se come el gesto.

**C. El botón sí la corta**, en cualquier momento: `story` pasa a `done`, la placa se
oculta, el botón desaparece —un botón que termina algo ya terminado es un control que
miente— y el programa sigue.

## Tres defectos encontrados y arreglados, y los tres se vieron y no se razonaron

**1. La placa no tapaba el cromo, y el ADR 0041 ya decía por qué.** La escribí como hija
de `#player` y el ADR dice que va **afuera** del contenedor que el renderer gobierna.
`isolation: isolate` impide que el `z-index: 2147483000` del cromo escape del contenedor,
pero una placa adentro del contenedor compite en el mismo contexto de apilado y pierde: en
la primera captura la barra de progreso, el botón de mute y el de play estaban dibujados
**encima** de la placa. La placa pasó a ser hermana de `#player` adentro de un `.frame`
del tamaño exacto de la imagen.

**2. El programa arrancaba detrás de una placa que decía que estaba por arrancar.** La
placa se come los gestos de una persona, pero eso es un hecho de la hoja de estilos.
Ahora hay un hecho del estado: mientras una placa está arriba, cualquier `play` que llegue
vuelve a pausar. Es la versión que sobrevive a que alguien mueva un `z-index`.

**3. Y esa guarda, escrita en el orden natural, trabó el guion entero.** El `play()` que el
propio beat hace al terminar es un `play`, así que con `speaking` todavía en `true` se
cancelaba a sí mismo y la demo guiada no pasaba de su primera placa. El orden de dos
líneas es la diferencia, y está escrito al lado de ellas.

## Lo que el guion NO hizo

**No tocó la librería.** El freno es `video.pause()` sobre el primario y nada más, que es
lo que la T-01 midió: la composición entera se congela, las tres cajas de video incluidas,
y el `play()` reanuda cada una en el cuadro donde había quedado, así que este archivo no
guarda ni restaura posiciones. La superficie pública de la sdk no cambió y el contrato
entre las dos capas tampoco. **El hallazgo del ADR 0040 no se disparó.**
