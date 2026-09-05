# El volumen del asset list: lo que se decidió, lo que se midió y lo que no cerraba

2026-09-04. El ADR 0014 implementado, la mezcla de David sobre el Quad, y la
lectura por elemento de los dos casos que este nivel de verificación pide.

## 1. Los dos defaults, y por qué son dos

`resolveElement` resuelve todos los elementos con la misma función, el primario
incluido, así que el default del `volume` ausente tiene que preguntar de qué
elemento se trata:

```js
volume: Number(source.volume ?? (isPrimary ? DEFAULT_PRIMARY_VOLUME : DEFAULT_AD_VOLUME))
```

`DEFAULT_AD_VOLUME` es 0 y `DEFAULT_PRIMARY_VOLUME` es 100. La constante única
que había —`DEFAULT_VOLUME = 100`— se fue, y con ella la posibilidad de bajarla
a 0 de un saque: la herramienta de SVTA tampoco emite `volume` en el bloque
`primaryContent`, así que un solo 0 para todos deja el programa mudo en los
cinco layouts y una captura del recorrido se ve idéntica.

El operador es `??` y no `||`. Con `||`, un `volume: 0` declarado a propósito
—un aviso deliberadamente en silencio— cae al default y sale a todo volumen.

## 2. El renderizado dejó de ignorar el campo

`applyAudio()` en `lib/renderer.js`, y son dos reglas porque son dos clases de
elemento:

- **Un elemento del aviso** toma el volumen declarado y queda **muteado** cuando
  ese volumen es 0. Muteado y no simplemente en cero, porque un nodo audible es
  uno que la política de autoplay no deja arrancar, y el default de un layout
  que no declara nada es exactamente 0: sin esa línea, el caso ordinario serían
  recuadros negros. Medido: en los cuatro breaks sin `volume`, los nodos del
  aviso están en `paused: false` con el asset corriendo.
- **El contenido primario** toma el volumen declarado también —una mezcla que
  deja el programa al mismo nivel que el aviso contra el que se mezcla no es una
  mezcla— pero su `muted` no se toca acá: ese interruptor es el audio de la
  composición y es de quien mira.

**El mute de la composición tapa los elementos del aviso**, y por eso
`applyAudio` corre también en cada `volumechange` del primario. La página
arranca muteada por la política de autoplay; sin ese gateo, el aviso sería lo
único que suena antes de que alguien lo pida.

**Y al cerrar el break el primario recupera su audio entero.** `clear()` le
devuelve `volume = 1` además de sacarle el estilo, porque `volume` es una
propiedad y no un estilo. Un primario que se queda en el 10 % de la mezcla sigue
así el resto del programa sin que nada en pantalla lo diga: es la misma falla
que el default, un break más tarde. Está medido abajo.

## 3. La mezcla de David, en `signalling/asset-list-multiView.json`

100 en el cuadrante de abajo a la izquierda y 10 en los otros tres, que son los
cuatro elementos del layout Quad. Es lo que David propuso en la reunión del
2026-09-04 —"the bottom left be 100, and then the other ones are all 10"— y es
un asset list y no código.

Va sobre el archivo del recorrido y no en uno nuevo al lado, para que el break
del Quad la muestre sin tocar la tabla de la grabación ni el modo de un solo
break, y para que los otros cuatro breaks sigan sin declarar `volume`, que es el
otro caso que hay que poder mostrar.

## 4. La lectura, por elemento

Con `muted` y `volume` de cada nodo, que es la restricción de la task.
`t05run.py` la toma y `t05-la-medicion.json` la guarda. **No** se grabó el
monitor del sink de PulseAudio: la fase 01 dejó escrito con dos corridas que el
instrumento no anda en esta máquina —devuelve cero bytes también cuando no hay
sonido, comprobado con un tono puro sin browser— y que, aunque anduviera, graba
la mezcla y no dice cuál de los elementos suena.

### El Quad con la mezcla, t = 124,8 s, audio de la composición encendido

| elemento | cuadrante | declarado | `volume` del nodo | `muted` | corriendo |
| --- | --- | --- | --- | --- | --- |
| `primaryContent` | arriba a la izquierda | 10 | 0,1 | false | sí |
| `view2` | arriba a la derecha | 10 | 0,1 | false | sí |
| `view3` | **abajo a la izquierda** | **100** | **1** | false | sí |
| `view4` | abajo a la derecha | 10 | 0,1 | false | sí |

El audio se encendió **clickeando el control**, no por JS: es el gesto que la
política de autoplay pide para dejar sonar algo que empezó muteado, y es lo que
va a hacer quien grabe. `t05-1-quad-con-la-mezcla.png` es ese cuadro.

### Después del break, t = 137,7 s

Ningún elemento en pantalla y el primario en `volume: 1`, `muted: false`. La
mezcla no le quedó puesta.

### El mismo Quad con la composición muteada, t = 125,3 s

Los cuatro nodos en `muted: true` con sus volúmenes intactos —0,1 / 0,1 / 1 /
0,1—. El interruptor tapa la mezcla sin borrarla, así que encenderlo devuelve
exactamente lo de arriba.

### Un break que no declara `volume`

Los dos sabores, porque son dos caminos distintos por el código:

| break | bloque `primaryContent` | elemento del aviso | primario |
| --- | --- | --- | --- |
| `cornerOverlay`, t = 22,7 s | no lo trae | `adOverlay1`: `volume` 0, `muted` true | `volume` 1, `muted` false |
| `squeezebackDoubleBox`, t = 99,7 s | lo trae, sin `volume` | `adOverlay`: `volume` 0, `muted` true | `volume` 1, `muted` false |

El segundo es la asimetría exacta: el bloque del primario está en el payload y
no dice nada de audio, y ahí es donde un `DEFAULT_VOLUME = 0` a secas apagaba el
programa.

### El break de stills, t = 74,7 s

Los dos assets son `<img>`: no hay audio que poner y `applyAudio` los saltea.
Consola sin warnings ni errores en los seis estados.

## 5. El test que se puso rojo, corregido

`test/layout-resolution.test.js` afirmaba *"no payload of the tool carries
volume, and every element comes out at 100"*, que con el ADR 0014 dejó de ser
cierto. Ahora afirma **"no payload of the tool carries volume: the ad comes out
silent and the show does not"**: sobre los seis payloads de la herramienta, cada
elemento del aviso sale en 0 y cada primario en 100, y el comentario dice por
qué esa mitad es la que importa —un default único de 0 pasa todos los demás
tests de este archivo, porque las cajas, el orden y las ventanas siguen bien—.

Cambió también el cierre del test del `volume: 0` explícito: el contraste que
tenía —el mismo elemento sin el campo vale 100— ahora vale 0, así que lo que
prueba es que el 0 declarado sobrevivió y no que lo puso el default, y se le
agregó el primario sin campo en 100.

Las dos roturas de un caracter, corridas una por una y vistas en rojo, están en
`t05-los-invariantes.txt` sección G, con lo que salió de ahí para la T-06.

---

## Cuatro cosas que no coincidían, y quedan anotadas

**1. El bloque manda a `lib/renderer.js:77-82` y ahí no hay nada de audio.** Esas
líneas son hoy el comentario de `imageBox`, que la T-09 dejó donde está. Lo que
el bloque describe —el campo ignorado a propósito y el comentario que lo
explica— estaba en dos lugares: el `node.muted = true` de `build()` y el
docstring de `playable()` que decía "every one of them is created muted and
stays muted". Los dos se movieron. La referencia por número de línea quedó vieja
en el ADR y en el bloque, que es el mismo problema que `verificar-cortes.mjs`
resuelve indexando por contenido.

**2. El ADR 0014 y el done de la T-05 no dicen lo mismo sobre el primario.** El
ADR dice "el contenido primario conserva su audio" y "el primario mantiene su
100"; el done dice que en el Quad "el de abajo a la izquierda [va] en 100 y los
otros tres en 10", y el Quad tiene cuatro elementos contando el primario, así
que los otros tres son el primario y dos avisos.

Se implementó lo segundo, o sea que **el volumen declarado se respeta en todos
los elementos y la asimetría es únicamente del default**. Tres razones:

- El objetivo de la propia T-05 dice "el estado inicial del audio de **cada
  elemento** sale del asset list", no "de cada elemento del aviso".
- El contrato de la T-02, escrito después del ADR, dice lo mismo: "el `volume`
  es el estado inicial declarado de cada elemento… se respeta lo que el asset
  list diga, y cuando el campo no viene el default de la capa es 0 en los
  elementos del aviso y 100 en el contenido primario".
- La mezcla de David no se lee de otra manera. En el Quad el primario es el
  cuadrante de arriba a la izquierda, o sea uno de los cuatro; dejarlo en 100
  mientras el aviso de abajo a la izquierda también está en 100 no muestra una
  mezcla, muestra dos fuentes iguales y dos bajas.

Las frases del ADR se leen igual con esto: "conserva su audio" y "mantiene su
100" son sobre el **campo ausente**, que es de lo que trata la decisión. Lo que
el ADR no dice en ningún lado es qué hacer con un `volume` declarado en el
bloque `primaryContent`, y eso es lo que esta task tuvo que decidir.

**3. Los documentos vigentes que quedaron viejos eran tres y no uno.** El bloque
nombra la sección `Before you record` del `README.md`. En el mismo README había
otros dos párrafos que decían lo contrario de lo que la demo hace ahora: el de
la arquitectura, que decía que el aviso arranca en silencio por el ADR 0010 y
que "una mezcla por cuadrante sería inventada y no señalizada", y el de los dos
defaults que la herramienta omite, que decía "volume 100 wherever it is absent".
Los tres están corregidos. Y una cuarta mención, de una línea, en
`js/stock-player.js`: un comentario que citaba el ADR 0010 por el audio.

**4. El campo `volume` del contrato no tiene rango declarado.** El contrato dice
`volume: number // 0..100` y nadie valida el borde. `volumeOf()` en el
renderizado recorta a 0..1 y, si el valor no es un número, cae al default del
elemento —1 en el primario, 0 en el aviso—, que es la misma asimetría por la
misma razón. No es una decisión que el bloque pida: es que un `NaN` puesto en un
nodo tira, y el que tiraba era el primario.
