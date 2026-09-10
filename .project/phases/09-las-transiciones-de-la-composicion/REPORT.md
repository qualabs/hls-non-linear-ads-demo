# Informe de cierre — fase 09: las transiciones de la composición

Cerrada el 2026-09-10, el mismo día que se abrió.

## 1. Resumen

La composición dejó de cambiar de golpe. El contenido primario se mueve con
tiempo entre las cajas que los layouts le dan, los elementos de un aviso entran y
salen con opacidad, y el aviso a cuadro entero no lleva ninguna de las dos cosas.
Va fijo en la sdk: no hay opción, ni custom property, ni campo en el asset list
que lo prenda o lo apague.

**Lo más valioso de la fase no está en el diff, y es que una corrección de Nicolás
hizo el mecanismo más chico.** El diseño de la etapa 1 resolvía la salida cambiando
el ciclo de vida de los nodos: `clear()` dejaba de destruir y pasaba a retirar, con
el `detach` postergado, un temporizador de limpieza, los punteros apagados sobre un
nodo invisible y una guarda para el caso de que empezara otro break en el medio.
Eso ponía la transición **después** del cierre de la ventana. Nicolás lo corrigió
antes de que se escribiera una línea:

> *"la entrada y salida de las cosas debe ocupar el tiempo definido para que estas
> publicidades se muestren en pantalla, entonces debería verse sí."*

Con la salida **terminando** en el borde en vez de arrancar ahí, mientras la
transición corre la ventana todavía no cerró: el nodo del aviso está vivo por
derecho propio y el backplate también. El problema que el mecanismo anterior
resolvía **desapareció en lugar de resolverse**. `clear()` no cambió en una línea,
y tres de los siete riesgos de la fase se fueron con el mecanismo que los traía.
Lo que quedó es una agenda —cuánto falta para que la ventana cierre— y un tercer
disparador de `place()`.

**La pregunta que decidía la fase se contestó sin tocar la superficie pública.**
Cómo distingue la librería una L de un aviso a cuadro entero: la geometría no
necesita ni una rama, porque el aviso a cuadro entero declara el primario a
`viewport: '0 0 0 0'` y `movePrimary` sobre esa caja calcula la identidad, así que
la transición interpola entre dos geometrías idénticas y no se ve nada. El
difuminado sí necesita un bit y es `type === 'linear'`, que es una etiqueta **de
este contrato** y no un valor que alguien escriba. Ni un campo nuevo, ni una opción
en `attach`, ni una línea del contrato entre las dos capas.

Es la segunda vez en el proyecto que el contrato expresó una forma sin que hubiera
que pedirle un campo, después del ADR 0047. No es casualidad: las dos veces pagó la
misma regla, la 3 —el contenido primario es un elemento del layout como cualquier
otro, con su caja.

## 2. Decisiones tomadas

Siete ADR, todos `scope: phase-09`. Ninguno supersede ni generaliza a uno anterior:
la fase agrega comportamiento sobre un contrato que quedó intacto.

| id | decisión |
| --- | --- |
| **0050** | El discriminante de las transiciones sale de lo que el contrato ya declara |
| **0051** | Se animan `transform` y `opacity`, y ninguna propiedad de layout |
| **0052** | La salida termina en el borde de la ventana y no arranca ahí |
| **0053** | Un cambio de tamaño re-coloca sin animar |
| **0054** | Los tiempos son constantes de la librería y no configuración de la demo |
| **0055** | La ventana no se toca y al creativo no se le recorta nada |
| **0056** | La cama negra es del video, y una imagen conserva su alfa |

Dos de ellos existen por razones que conviene no perder.

**El 0055 es una barrera y no una capacidad.** Que la transición se pague con el
tiempo del aviso habilita una lectura equivocada: recortarle o demorarle contenido
al creativo para hacerle lugar al efecto. Arrancar el aviso 200 ms más tarde para
que entre difuminado sobre negro es la forma natural de equivocarse acá, y rompería
lo que el proyecto entero sostiene, que los avisos son elementos de video
reproduciendo de verdad. El ADR lo declara y el control es de código: la fase no
toca `build`, `attachAsset`, `applyPlayback`, `applyAudio` ni el `startAt` de
ningún nodo.

**El 0056 no lo encontró la fase: lo encontró Nicolás en el inspector.**
`createNode` le escribía un fondo negro a **todo** nodo de aviso, con una razón al
lado que es legítima y es de video —un elemento de video es transparente hasta que
decodifica su primer cuadro— pero la línea corría antes de distinguir de qué nodo
se trata, así que una imagen con canal alfa se componía contra negro para siempre.
Medido sobre el creativo del banner: **el 46,7 % de sus píxeles lleva alfa
parcial**, o sea que casi medio creativo se estaba pintando sobre negro. Y no lo
podía arreglar la página, porque es un estilo inline que la librería escribe sobre
el nodo que ella crea.

## 3. Tasks

Seis, todas `done`. La T-06 no existía cuando la fase se generó y se ejecutó
**antes** de la T-03, aunque su número sea posterior.

| id | qué dejó |
| --- | --- |
| T-01 | Tres duraciones y dos curvas como constantes exportadas, y tres funciones puras: `fadesInAndOut`, `remainingIn`, `isLeaving`. 14 tests nuevos |
| T-02 | El primario se mueve con tiempo, y R1 medido en el navegador |
| T-03 | El difuminado, 200 ms entrando y 120 saliendo |
| T-04 | La subsección 5.1 de `docs/integrating-the-library.md` |
| T-05 | La corrida mirada en las dos demos, y R3, R4 y R5 cerrados |
| T-06 | La cama negra pasó a ser del video, y una imagen conserva su alfa |

**Por qué la T-06 entró en esta fase, que es la parte que no se deduce del diff.**
"Es una línea en el archivo que ya estaba abierto" es exactamente el razonamiento
con el que se estira el alcance de una fase, y si hubiera sido el único argumento,
el objetivo escrito de la fase habría ganado. El que decidió es otro: **un nodo con
cama difumina la cama.** A opacidad 0,5 lo que aparece sobre la imagen es un
rectángulo medio negro y no medio banner, así que el difuminado del banner que la
T-03 entrega **no se podía entregar bien** con la línea puesta. Era una precondición
de esa task y no una capacidad vecina, y por eso corrió antes.

La captura de la T-03 lo prueba: la entrada del banner congelada en opacidad 0.295,
con la tipografía fantasma sobre la cancha y los jugadores viéndose enteros a
través. Ese mismo cuadro, antes de la T-06, habría sido un rectángulo negro
translúcido.

**Y no hubo una task de tests aparte, y no fue un olvido.** El renderer con DOM no
está testeado en este proyecto y la fase no cambió esa línea. Lo que se pudo volver
puro —el discriminante y la aritmética de la agenda— se testeó en la T-01, y lo que
queda es pintura, que se miró. Es lo que hizo posible que una fase cuyo entregable
es cómo se ve algo tuviera una campaña de mutación.

## 4. Hilos abiertos

**La línea del `zDepth`, preparada y no escrita.** El ADR 0052 deja dicho que si en
los últimos 120 ms se llegara a ver una banda de fondo —el backplate difuminándose
mientras el primario todavía lo tapa—, la vuelta es una línea que sale del contrato
sin agregarle nada: un elemento con `zDepth` por debajo del primario no necesita
difuminar a la salida, porque su salida es que el primario lo tape. **Hoy no hace
falta**: cuando el backplate empieza a irse, el primario ya cubre el 99,9 % del
cuadro, así que la banda sin tapar es de ~1 píxel al 20 % de opacidad. Queda
anotado por si un creativo futuro cambia esa geometría.

**Los cuatro tiempos siguen sin medir.** 380 ms la geometría, 200 y 120 el
difuminado, más las dos curvas. Sobrevivieron una mirada de Nicolás sin que pidiera
cambiarlos, y son constantes exportadas en un solo lugar: corregir cualquiera es
una línea.

**El repliegue del ADR 0019 no está en el recorrido de ninguna demo**, así que no se
miró en pantalla. Está cubierto por el test de la T-01 sobre el fixture real, que
comprueba que cae del lado del aviso a cuadro entero. Si una demo futura lo pone en
su recorrido, hay un caso más para mirar y ninguno para escribir.

**El renderer con DOM sigue sin tests.** La fase lo mantuvo y el reparto que usó
—volver puro lo que decide, mirar lo que pinta— es lo que le permitió tener una
campaña de mutación. Quien agregue comportamiento de DOM a `lib/` se encuentra con
la misma elección.

## 5. Riesgos que se materializaron

**Ninguno de los cinco riesgos técnicos se materializó, y los cinco se cerraron con
números y no con impresiones.**

- **R1**, que la transición no arrancara porque `clear()` le borra al primario el
  atributo `style` entero en la misma pasada, era el que decidía el tamaño de la
  fase. Salió a favor: lo que decide es el estilo **posterior** al cambio. La escala
  del primario va 1.0000 → 0.9421 → 0.7912 → 0.6965 → 0.6442 → 0.6067 → 0.6004 y
  llega en 45.38 sobre una ventana que abre en 45.00, con 28 muestras estrictamente
  entre los dos extremos. No hizo falta la hoja de estilos inyectada.
- **R2**, una ventana más corta que la transición, no apareció: la más corta de las
  dos demos es de 8 s. Queda cubierto como caso de borde en los tests.
- **R3** quedó en ~1 píxel al 20 % de opacidad, calculado con dos mediciones sobre
  el mismo instante y confirmado por una corrida limpia sin nada que la aritmética
  no predijera.
- **R4** se verificó en sus dos mitades: una corrida de 0 a 84.18 a través de tres
  breaks dejó **cero mensajes** de consola, así que ningún creativo se sacó antes de
  terminar y ninguna ventana se movió; y encoger el contenedor entre dos breaks
  llevó el video de 715 a 535 px siguiéndolo, sin píxeles viejos.
- **R5**: los deltas de cuadro dentro de las transiciones (medias de 20,75 y
  19,84 ms) son indistinguibles del régimen (19,94, 20,00 y 20,14) y el máximo
  dentro de una transición es más bajo que el del régimen. Con el límite dicho: la
  línea de base del entorno es de ~20 ms por cuadro, así que prueba que animar **no
  agrega** costo, no que la página corra a 60 fps.
- **R6**, que los números quedaran mal a la vista, tampoco: Nicolás los miró y no
  pidió cambiar ninguno.

**R7 se materializó, y en su forma invertida.** El riesgo era un chequeo escrito de
buena fe que no pueda fallar; pasó cuatro veces en el proyecto. Acá apareció al
revés: el test del umbral exacto **no podía pasar**, y no por lógica. Con la ventana
en segundos y el lead en milisegundos, `12 - 0.38` deja un resto de
0,3800000000000008, así que el instante exacto del borde no es representable y
ningún cuadro de un bucle a 60 Hz cae ahí. El test se cambió para afirmar los dos
lados y dejar de afirmar el borde: fijarlo habría sido fijar un artefacto de la
aritmética. **Un test que afirma algo que no importa es tan malo como uno que no
puede fallar**, y es la misma familia de defecto.

Y una segunda vez, más chica: en la campaña de mutación, la rotura que saca el
`startAt` de la cuenta de la ventana cayó en **uno de sus dos tests**, porque el
fixture cuya ventana arranca en 0 no puede detectarla. Es exactamente la razón por
la que existía el segundo test, el del aviso que arranca en 24 — pero la campaña es
lo que lo dijo.

**R8 se materializó como estaba previsto, y trajo una mitad que no lo estaba.** El
índice de git compartido tenía un borrado staged de la sesión de la fase 08, así que
todos los commits fueron scopeados por path y nunca `git add .`. No hizo falta el
worktree. Lo que no estaba en la lista es que **`dist/` también es compartido**: se
reconstruye desde `lib/` en cada arranque y la página de cualquier demo lo carga, así
que el cambio de esta fase estuvo vivo en la demo de la otra sesión desde el primer
commit, sin que ellos lo pidieran. No hizo daño y de hecho sirvió —fue donde se
verificó la forma del ADR 0047— pero es una vía de acoplamiento entre dos sesiones
que el riesgo escrito no nombraba.

**Y un falso positivo de método que conviene no perder.** Levanté un servidor en el
puerto 8081, `curl` devolvió 200 y lo di por arrancado. No era mío: era el de la otra
sesión, y el mío había muerto con `EADDRINUSE` en un log que no había leído. **El 200
no probaba lo que yo creía que probaba.** Lo que lo destapó fue leer el log de una
cosa que parecía haber funcionado.

## 6. Recomendaciones para la fase siguiente

**Cuando una regla nueva parece agrandar el trabajo, chequear si lo achica.** La
corrección de Nicolás llegó como una restricción —nada sobrevive a su ventana— y
sonaba a que había que resolver más. Resolvió menos: el mecanismo entero que la
primera forma necesitaba desapareció. Vale antes de rediseñar sobre una
restricción, y en esta fase se verificó en el código antes de generar nada.

**Volver puro lo que decide y mirar lo que pinta.** Es el reparto que le permitió a
una fase cuyo entregable es cómo se ve algo tener tests y campaña de mutación sobre
la única parte donde equivocarse era invisible. La pregunta que lo guía no es "¿qué
puedo testear?" sino "¿dónde equivocarse no se ve en pantalla?".

**Para fotografiar un efecto de menos de un segundo, congelar la animación real en
lugar de hacerla más lenta.** `getAnimations()`, `pause()` y fijar el `currentTime`
de la animación da el cuadro que de verdad se ve, en el instante que se elija.
Hacerla más lenta para la foto fotografía otra cosa.

**Para quien toque `lib/renderer.js` después**: `place()` es ahora el único que
escribe geometría y opacidad, y `tick()` tiene tres razones para llamarlo —componer,
re-colocar, y que un elemento cruce el umbral de su salida—. Agregar una cuarta es
agregar un disparador en `tick()`, no un segundo escritor: dos funciones escribiendo
el `transform` del mismo elemento se pisan y averiguar cuál ganó es el tipo de
defecto que no se ve en un cuadro.

**Y la exclusión del aviso a cuadro entero es una decisión de diseño y no un
gusto.** Sin ella, un nodo que no difumina podría estar "saliendo", y su opacidad se
iría a 0 **120 ms antes** de que cierre su ventana, destapando el contenido primario
durante esos 120 ms antes de que entre el aviso siguiente. En cámara eso se lee como
un defecto de codificación. Por eso `leavingNow` contesta `false` para él: su salida
es que `clear()` lo destruya en el borde. La muestra que lo prueba es la de t=53.999,
la última antes del borde, donde sigue en opacidad 1.

## 7. Correcciones post-ejecución

**Ninguna.** `grep -n "post-ejecuci"` sobre el `TASKS.md` de la fase no devuelve
nada.

Leído como medición y no como log, dice menos de lo que parece, y conviene decir por
qué. Las dos cosas que sí volvieron durante la fase no llegaron después de un `done`:

- **La corrección de la salida** llegó sobre el diseño, después de la generación y
  antes de que la T-02 corriera, así que enmendó el `DESIGN.md` y un ADR, no una
  task terminada.
- **El defecto de la cama negra** llegó como hallazgo de otra sesión sobre un
  archivo de esta fase, y se convirtió en una task nueva.

O sea que el cero no prueba que las definiciones de done fueran buenas: prueba que
lo que hubo que corregir se corrigió **antes** de que una task se declarara
terminada. La otra mitad —que Nicolás mirara y no pidiera nada— es un dato de una
sola mirada al final, no de seis.

## 8. Revisión de documentación

Superficie por superficie, con lo que se actualizó o por qué no necesitaba nada.

**El índice de fases de `PROJECT.md`** — escrito en este cierre. Su línea dice que la
fase cerró con las transiciones adentro de la ventana del propio aviso, que la
corrección de Nicolás hizo el mecanismo más chico, y que el discriminante salió del
contrato sin agregarle un campo.

**`docs/arc42/`** — no existe, y esta fase no lo crea. La razón es la misma que la
fase 08 dejó escrita: los dos documentos de `docs/` cumplen ese papel para el único
lector que tienen, quien construye con la sdk. La pregunta de si el documento
todavía describe el sistema se contesta sobre esos dos, abajo.

**`docs/integrating-the-library.md`** — **corregido**, y era la corrección que la
fase debía. Gana la subsección 5.1 debajo de la tabla de qué es de la librería, que
es donde ya vivía la fila de la geometría del contenido primario; esa fila se amplió
y se agregó una para la opacidad y la cama. Dice las tres cosas del comportamiento y
además lo que un integrador no puede deducir de la superficie pública: que el tiempo
sale de la ventana del propio aviso, que no hay opción que lo apague, que la
librería escribe `transition-*` **inline** sobre el elemento de media —así que una
transición de su hoja de estilos no sobrevive a un break— y que una imagen conserva
su alfa mientras un video lleva cama negra. **No copia ninguno de los valores**:
nombra las cinco constantes y manda a leerlas en `lib/renderer.js`.

**`docs/contrato-senalizacion-renderizado.md`** — re-leído y **no cambió, y era la
prueba de la fase**. La superficie entre las dos capas quedó igual: el discriminante
de la geometría sale de la caja que el layout ya declara y el del difuminado de una
etiqueta que este contrato ya define. Su regla 5 —`activeAt` es la única fuente de la
ventana de activación— quedó intacta, y la agenda sólo lee dónde está parada la
composición adentro de una ventana ya abierta. Si hubiera hecho falta cambiarlo, era
el hallazgo del ADR 0040 y había que parar.

**El `README.md` de la raíz** — **no necesitaba nada**, y no es que no se haya
mirado. Enruta, y su tabla de `What is where` ya manda a
`docs/integrating-the-library.md` como "how to integrate the library into a page
that is not a demo", que es exactamente donde el comportamiento nuevo quedó escrito.
Nada de lo que el README afirma se volvió falso: no habla de transiciones. Agregarle
un párrafo habría sido mejorarlo y no corregirlo, y la fase declaró que no se pule.

**El `CLAUDE.md` del proyecto** — el proyecto no tiene uno.

**`.project/knowledge/`** — no existe, y la fase no produjo nada que califique: lo
que aprendió sobre cómo trabajar está en la sección 6 de este informe, y lo que
decidió está en sus siete ADR. Nada de eso lo necesita una fase posterior como
insumo.

**El `CLAUDE.md` y el `knowledge/` del repo padre** — **no necesitaban nada**. La
fase no cambió ninguna regla de cómo se trabaja en el repositorio. El candidato era
el hallazgo de R7 invertido —un test que afirma un artefacto de la aritmética— pero
es una instancia de un riesgo que el proyecto ya nombra y persigue en cada fase, no
una regla nueva.

**El doc de instalación o runbook** — el proyecto no tiene uno separado: `./run.sh`
con el nombre de la demo es el punto de entrada y lo dice el `README.md`. La fase no
agregó ni rompió ningún paso de setup, así que no había deuda que vencer.

**Las carpetas `tasks/` de esta fase** — marcadas como **registro** y no como
instrucción vigente. Los cuatro `README.md` de evidencia arrancan diciendo "Registro
de lo que se midió el 2026-09-10. No es instrucción vigente", escrito en la misma
pasada que los produjo. Sus mediciones y sus capturas prueban qué se corrió; no se
reescriben.
