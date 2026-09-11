# Evidencia de la T-07 — el payload explicado: la glosa del bloque, campo por campo

Registro de lo que se corrió y se miró el 2026-09-11. Las tres corridas están en
[`../T-06/`](../T-06/README.md): son una sola medición de un solo árbol.

## El pedido

*"Estaría bueno explicar qué se espera en el payload de un `X-AD-CREATIVE-SIGNALING`.
No todos los parámetros: sí los más importantes y obligatorios, y por lo menos
mencionar los opcionales que son importantes. Creo que hay que explicar el layout del
`primaryContent` y los `assets`."*

## Qué se construyó, y por qué es la glosa del tag un nivel más abajo

La sección ya tenía una glosa: una línea por **atributo que la línea del tag realmente
trae**, dibujada del tag y no de una lista. Lo nuevo es exactamente eso mismo un nivel
más abajo: **una fila por campo que este asset-list realmente trae**, dibujada del
archivo que la sección muestra abierto dos pantallas más abajo.

Eso decide dos cosas que no hubo que discutir. La explicación no puede describir una
señalización que la página no está mostrando, porque las filas salen del archivo. Y no
hace falta elegir "los más importantes": **en este asset-list aparecen los dieciocho**,
así que la selección la hizo el archivo y no yo.

Las filas se agrupan por **dónde vive el campo**, y no es prolijidad: el mismo nombre
significa tres cosas a tres profundidades —`type` es la clase de bloque de la
herramienta, el nombre de un layout, y el MIME de una caja—, y una lista plana lo
imprimiría tres veces y se leería como una repetición.

## Lo que cada fila afirma, y contra qué se puede auditar

Todo lo de abajo sale de `lib/signalling.js`, leído y no recordado:

| lo que la glosa dice | dónde se verifica |
| --- | --- |
| `payload` es lo **único** que este cliente lee del bloque | `usablePayload()`: `block.payload` es el único acceso a `block` en toda la librería |
| `version` y `type` del bloque están **ignorados** | el mismo: no hay un solo `block.version` ni `block.type` en `lib/` |
| un `duration` que no es un número positivo tira **el asset entero** al camino lineal | `usablePayload()`, y `resolveAssetList` con `linearItem` |
| un `layout` sin `assets` hace lo mismo | `usablePayload()`, tercera condición |
| `primaryContent` ausente vale cuadro entero, `zDepth` 0 y volumen 100 | `DEFAULT_PRIMARY`, y el ADR 0004 |
| `volume` ausente es 0 en el aviso y 100 en el primario | `resolveElement`, con `??` y no `||`, y el ADR 0014 |
| `viewport` que no son cuatro números cae al cuadro entero y lo dice por consola | `parseViewport()` |
| `zDepth` ausente es 0, y empates conservan el orden del payload | `resolveElement` y el `sort` estable |
| un `uri` vacío **no** es un error | `usablePayload()`, la excepción explícita del ADR 0004 |

**La marca de la tercera clase es la que vale.** `required` y `optional` es lo primero
que busca quien escribe una lista; **`ignored`** es lo que nadie puede averiguar sin
leer el cliente, y dos de los tres campos del bloque son eso.

## El chequeo nuevo, y los dos controles que lo vieron ponerse rojo

**CHEQUEO 8 — `laGlosaDelBloqueExplicaSusCampos`.** La sección muestra el JSON crudo de
cada aviso y arriba explica qué es cada campo; si las dos mitades se despegan, la
sección **miente sin fallar** de las dos formas: un campo que el lector tiene delante y
nadie explicó se lee como que no importa, y una explicación de un campo que el archivo
no trae se lee como que el archivo lo trae.

El chequeo **recorre el asset-list por su cuenta** —no usa el recorrido de la página—
y coteja contra las filas que la página produce. Eso es lo que lo hace un chequeo: si
el recorrido de la página dejara de bajar a las cajas del layout, sus filas no
tendrían `viewport` y el del chequeo sí.

```
  ROJO   laGlosaDelBloqueExplicaSusCampos
         regla:  todo campo que el asset list trae está explicado en la glosa del bloque
         rotura: el asset list gana un campo que la herramienta todavía no emitía y la glosa
                 se queda como estaba
         dijo:   el asset list trae `X-FIT` en el nivel `element` y la glosa no lo explica

  ROJO   laGlosaDelBloqueExplicaSusCampos
         regla:  la glosa del bloque no explica un campo que el asset list no trae
         rotura: la glosa se escribe a mano y le queda una fila de un campo que este archivo
                 no declara
         dijo:   la glosa explica `opacity` en el nivel `element`, que este asset list no trae
```

Y la página tiene la misma salida honesta que ya tenía para un atributo desconocido del
tag: un campo sin frase escrita **dibuja su fila diciendo que no hay glosa**, en vez de
desaparecer. El chequeo exige que no haya ninguna.

## Las capturas

| archivo | qué es |
| --- | --- |
| `glosa-del-bloque-1907.png` | la glosa entera: dieciocho filas en cinco grupos |
| `seccion-3-1907.png` / `seccion-3-400x780.png` | la sección entera, con los pliegues cerrados |
| `seccion-3-pliegue-abierto-1907.png` / `-400x780.png` | con el pliegue del aviso 2 abierto, que es el estado donde el riesgo R2 aparece |

**El documento no scrollea de costado con un pliegue abierto**, que es lo que había que
mirar: `scrollWidth` 400 sobre un viewport de 400, y 1907 sobre 1907. Cero errores de
consola.

**Una alineación y no cinco.** Con `max-content` cada grupo dimensionaba su propia
columna y las frases de uno arrancaban a la izquierda de las del otro: se leía como
cinco tablitas donde la página tiene una glosa. La columna quedó topada en catorce
caracteres, que es el nombre más largo que no es el del bloque (`primaryContent`), y el
nombre del bloque corta en un guión, que es donde lo cortaría quien lo lee. Sólo arriba
de 640 px: abajo la glosa se apila y una medida escrita sin la query se lo llevaba
puesto.
