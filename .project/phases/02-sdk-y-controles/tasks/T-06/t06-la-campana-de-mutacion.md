# Los tests de lo que falla en silencio, y la campaña que los puso en rojo

2026-09-05. Doce tests nuevos en `test/program-ranges-and-volume.test.js`, y
once roturas de la lógica de producción corridas una por una para ver que cada
uno agarra algo.

## 1. Qué se cubrió

Las funciones puras que la fase agregó, por las dos cosas que pueden estar mal
sin que nada se vea mal: **dónde están los breaks y de qué clase es cada uno**,
y **en qué volumen arranca cada elemento**. Lo demás que la fase agregó está en
la pantalla, y un control mal dibujado es un control mal dibujado.

Los datos son los reales y no inventados: los cinco breaks salen de la tabla
`RECORRIDO` de `scripts/senalizar-contenido.sh`, que es lo que escribe la
playlist señalizada; los layouts salen de `signalling/`, que es lo que sirve el
server; y los valores esperados son la lectura que la T-02 hizo del contrato en
vuelo, la medición que la T-04 hizo de las marcas sobre la barra y la que la
T-05 hizo nodo por nodo. Los tres casos inventados lo dicen donde están.

| # | test | qué afirma |
| --- | --- | --- |
| 1 | the run of the script is the five breaks of the recording | los cinco offsets y el `PLANNED-DURATION` salen del script y no de una copia |
| 2 | the two classes the playlist signals become the two kinds the contract carries | un rango de cada clase, y las dos cadenas que el script escribe son las que la capa lee |
| 3 | the five breaks are the ten ranges T-02 read off the contract | el recorrido entero: dos rangos por break, con su `kind`, su `startTime` y su `duration` |
| 4 | a break of no experiences is no range, and a tag that declares no length is no range either | lo que no se puede ubicar no se reporta; `DURATION` le gana a `PLANNED-DURATION` |
| 5 | the window of a concurrent break spans every experience its asset-list declares | un Date Range es UN rango: del primero en empezar al último en terminar |
| 6 | the ten ranges land where T-04 measured them on the bar | la posición sobre el largo total, contra los porcentajes medidos |
| 7 | the same ten ranges on a programme of another length land somewhere else | **los mismos rangos sobre un programa de otro largo** |
| 8 | a range that cannot be placed is not a mark | sin largo todavía, un rango de ancho cero, uno pasado el final, uno que se recorta |
| 9 | with no volume in the asset-list the ad comes out silent and the programme does not | el campo ausente, en sus dos sabores: sin bloque `primaryContent` y con bloque mudo |
| 10 | the mix of the Quad is the one the asset-list declares, element by element | la mezcla de David sobrevive la capa y llega al nodo como fracción |
| 11 | an explicit volume of 0 on the primary content survives, and it is what tells `??` from `||` | el `0` declarado, del lado donde todavía se nota |
| 12 | a volume that is not a number falls back to the element own default, and there are two | el default del renderizado, que es el segundo y no el mismo |

El test 7 existe por la trampa en la que cayó la T-08 de la fase 01 con el 960
del área del reproductor: todos sus casos corrían sobre una sola resolución y
una mutación que la cableaba pasaba desapercibida. Acá el número es el largo del
programa, y las dos lecturas —180 s y 360 s— se toman **adentro del mismo test**,
una después de la otra, para que un largo cacheado en la primera llamada falle
sin importar desde dónde se corra el archivo.

El test 11 es el detector que la T-05 dejó mudado de lado: con el default del
aviso ya en 0, un `volume: 0` explícito en un elemento del aviso da 0 con `??` y
con `||`. Lo que separa los dos operadores es el `0` explícito **en el
primario**, cuyo default es 100.

## 2. La campaña, mutación por mutación

Una rotura por regla, restaurada después de cada corrida, y corriendo **sólo los
tests que cubren esa regla** (`node --test --test-name-pattern=… <archivo>`).
Las tres primeras son las que el bloque de la task nombra.

| id | regla rota | dónde | corrió | murieron |
| --- | --- | --- | --- | --- |
| **M1** | el volumen declarado se obedece: `??` y no `\|\|` | `signalling.js` `resolveElement` | 4 | 11 |
| **M2a** | el default del campo ausente es asimétrico | `signalling.js` `resolveElement` | 4 | 9 |
| **M2b** | …y también lo es del lado del renderizado | `renderer.js` `volumeOf` | 4 | 12 |
| **M3** | el largo total se relee, no se guarda (ADR 0016) | `controls.js` `rangeSpan` | 3 | 7, 8 |
| M4 | el recorrido de la grabación es la tabla del script | `senalizar-contenido.sh` | 4 | 1, 3, 6, 7 |
| M5 | una clase de HLS se traduce a un `kind` del contrato | `signalling.js` `KIND_OF_CLASS` | 1 | 2 |
| M6 | la ventana de un break abre en la primera experiencia en empezar | `signalling.js` `rangeOfExperiences` | 1 | 5 |
| M7 | un tag que no declara largo no es un rango | `signalling.js` `rangeOfDateRange` | 1 | 4 |
| M8 | una marca que cae fuera de la barra no se dibuja | `controls.js` `clamp01` | 3 | 8 |
| M9 | el ancho de una marca es un ancho y no su borde derecho | `controls.js` `rangeSpan` | 3 | 6, 7, 8 |
| M10 | el porcentaje declarado es la fracción que toma el nodo | `renderer.js` `volumeOf` | 4 | 10 |

**Ninguna mutación quedó verde.** Cada uno de los doce tests nuevos se vio en
rojo al menos una vez:

| test | lo puso en rojo |
| --- | --- |
| 1 | M4 |
| 2 | M5 |
| 3 | M4 |
| 4 | M7 |
| 5 | M6 |
| 6 | M4, M9 |
| 7 | **M3**, M4, M9 |
| 8 | **M3**, M8, M9 |
| 9 | **M2a** |
| 10 | M10 |
| 11 | **M1** |
| 12 | **M2b** |

Las cuatro corridas rojas de las tres roturas que importan están verbatim en
`t06-los-invariantes.txt`, sección C, con la aserción que falló en cada una.
Nada de la lógica de producción cambió: cada mutación se restauró con
`git checkout --` antes de la siguiente, y `npm test` cierra en 27/27.

## 3. Dónde quedó el hueco, y cómo se tapó

`volumeOf` tiene su propio default —1 en el primario, 0 en el aviso— y **sólo se
alcanza cuando el `volume` no es un número**. Después de `resolveElement`
siempre lo es, así que ningún test manejado por datos reales llega ahí: la M2b
sobrevivía a los tests 9 y 10 sin despeinarse. El que la mata es el test 12, que
llama a `volumeOf` directo con un campo ausente y con un string. Es el borde que
la T-05 dejó anotado —el contrato declara `volume: number // 0..100` y nadie
valida el extremo, y un `NaN` puesto en un nodo tira— y era el único punto de la
superficie de esta task que no tenía quién lo mirara.

---

## Cuatro cosas que no coincidían, y quedan anotadas

**1. Las funciones puras que la fase agrega no son dos, son seis, y están de los
dos lados de la costura.** El bloque dice "son dos: la que produce los rangos
del programa… con su clase y su posición sobre el largo total, y la que decide
el volumen inicial de un elemento". Los rangos los producen cuatro:
`kindOfClass`, `rangeOfExperiences` y `rangeOfDateRange` en `lib/signalling.js`,
y `rangeSpan` en `lib/controls.js`. Y no es una casualidad de implementación: es
el ADR 0003 puesto en práctica. La **clase** cruza el contrato como dato —es lo
que deja pintar dos colores— y la **posición sobre el largo total** es una
división que hace quien pinta, con un largo que el contrato deliberadamente no
lleva (ADR 0016). Ponerlas en la misma función sería juntar los dos lados.

El volumen también son dos: `resolveElement` decide el valor declarado en
porcentaje y `volumeOf` lo convierte en la fracción que toma el nodo, **cada una
con su propio default**. Los tests cubren las seis.

**2. El recorrido de los cinco breaks no se puede leer desde git.** La playlist
señalizada es `content/primary/con-daterange.m3u8`, `content/` está en
`.gitignore` y el `START-DATE` de cada tag es la hora de pared del empaquetado
(ADR 0005). Un test que la leyera pasaría en la máquina donde se empaquetó y en
ninguna otra. Lo que sí está en git es la tabla `RECORRIDO` del script que la
escribe, los asset lists que el server sirve, y las lecturas de la T-02 y la
T-04. El test parsea el script con un regex y afirma primero que encontró cinco
filas, porque un parse que deja de matchear haría pasar todo sobre una lista
vacía.

**3. `KIND_OF_CLASS` no es "el único lugar" donde una clase se vuelve un `kind`,
y su comentario dice que sí.** El `kind` que llega al objeto `Range` viene de dos
literales: `kind: 'concurrent'` adentro de `rangeOfExperiences` y
`kind: 'interstitial'` adentro de `rangeOfDateRange`. Lo que `kindOfClass`
decide es **por cuál de los dos caminos** entra el Date Range, no la etiqueta que
sale. Por eso la M5 —dar vuelta las dos entradas del mapa— no da vuelta los
colores de la barra: cambia qué asset-list se pide. No es un defecto, porque el
ruteo y la etiqueta coinciden por construcción; es que el comentario promete una
propiedad más fuerte de la que hay, y un test sobre el mapa solo no protege la
etiqueta. Lo que la protege es el test 3, que compara los diez rangos enteros
contra la lectura de la T-02.

**4. La regla del default asimétrico necesitó dos roturas y no una.** El bloque
pide "una rotura por regla" y nombra tres mutaciones. La segunda —el default de
0 aplicado también al primario— vive en dos lugares, `resolveElement` y
`volumeOf`, y hay que romper los dos: la de la señalización la mata el test 9 y
la del renderizado no la toca. Son la misma decisión (ADR 0014) escrita dos
veces porque es la misma falla en dos capas, así que la campaña la corre dos
veces, M2a y M2b.
