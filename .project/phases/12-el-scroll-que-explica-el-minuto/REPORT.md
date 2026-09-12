# Informe de cierre — fase 12: el scroll que explica el minuto

Cerrada el 2026-09-11, el mismo día que se abrió, se diseñó y se generó.

## 1. Resumen

La página de `demo/hydration-break/`, de la cintura para abajo, dejó de recapitular el
minuto y pasó a explicar el mecanismo. Contesta cuatro preguntas en orden: qué es un
aviso lineal y qué es uno no lineal, qué puede hacer la clase concurrente y cómo
convive con el interstitial de siempre, qué dice la señalización de este ejemplo, y de
quién es cada cosa en pantalla.

**Lo que hace que la fase valga es de dónde sale cada afirmación.** La galería de
formas de aviso no son capturas: son **las cajas que el proveedor ya resolvió**, con una
guarda que se pone roja si alguien escribe un identificador de layout a mano. Los
pliegues del asset-list **se suman** a la lectura en vivo en lugar de reemplazarla, así
que la sección sigue mostrando lo que el player está reproduciendo y no una ilustración.
Y la figura de la convivencia dibuja clases y nunca un tag, porque un `EXT-X-DATERANGE`
pegado en el HTML sería una playlist inventada.

**Lo más valioso que la fase dejó y que no se deduce del diff son tres cosas.**

La primera: **la vara que la página se puso encontró dos números que la propia página
afirmaba y no eran ciertos**, y los dos se encontraron cruzando lo que la página dice
contra lo que la página sirve, no leyéndola.

La segunda: **una verificación central de la fase resultó no poder fallar, y la
encontró quien la había escrito**, leyendo la salida de su propio instrumento y viendo
que el caso que tenía que dar "no arrancó" decía "corriendo".

La tercera: **la fase creció de cinco tasks a ocho**. Las tres últimas son el feedback
de Nicolás sobre la página ya construida, y entraron como tasks de la misma fase porque
no cambian su objetivo ni su alcance: corrigen y completan lo que las cinco primeras
dejaron.

**La línea de base y el cierre, con los mismos comandos:**

| chequeo | base (la toma la T-01, antes de tocar nada) | al cerrar |
| --- | --- | --- |
| `npm test` | **124 pruebas, 124 pasan, 0 fallan** | **170 pruebas, 170 pasan, 0 fallan** |
| `npm run check` | verde, las dos costuras | verde, 3 ocurrencias aceptadas + cero hits |
| `npm run mutaciones` | 4 chequeos verdes, 10 roturas rojas | **9 chequeos verdes, 20 roturas rojas** |
| `demo/hydration-break/test/signalled-run.test.js` | 5 pruebas | **10 pruebas** |

**La pregunta que una no-regresión tiene que contestar está contestada por su nombre y
no por su total.** La T-05 comparó los nombres de las pruebas, no los conteos:

```
base: 124  ahora: 165
=== PRUEBAS QUE DESAPARECIERON (estaban en la base y no están ahora) ===
(total: 0)
```

Y la mayoría de las pruebas nuevas no son de esta fase: de las 41 que separan 124 de
165, **tres son de acá** y 38 vienen de la fase 11, que corría en paralelo sobre `lib/`.
Las cinco que faltan hasta 170 son de las tres tasks de feedback y de la fase 11.

## 2. Decisiones tomadas

**Cinco ADR**, los cinco del evento de generación. Ninguno supersede ni generaliza a uno
anterior.

| id | scope | decisión |
| --- | --- | --- |
| **0073** | phase-12 | Los tipos de aviso se dibujan del contrato y no se fotografían |
| **0074** | phase-12 | La galería muestra los avisos de este minuto, y el catálogo se nombra |
| **0075** | phase-12 | Navegable es un pliegue por aviso, y el resumen pasa a ser el rótulo |
| **0076** | project | La página argumenta convivencia y no reemplazo |
| **0077** | phase-12 | El tope de secciones es de ideas por pantalla, y los créditos son el pie |

**El 0076 es el único de proyecto, y la razón es que es un encuadre y no una decisión de
esta página.** Lo fijó Nicolás con una frase que gobierna toda la copia de la sección 2:
*"es una forma más polite, no es reemplazar una cosa con otra, es dar más opciones"*. Es
lo que el repositorio ya sostenía técnicamente en los ADR 0007, 0009 y 0019, lo que
`compatibility-pair` demuestra con dos players, y lo que David dice en escenario — y no
se veía en pantalla en ningún lado.

**Y el encuadre tuvo una consecuencia de diseño que no estaba escrita en el ADR y se
tomó construyendo: las dos columnas de la figura pesan exactamente lo mismo.** Una
figura que ilumina una columna y apaga la otra argumenta reemplazo en el diseño mientras
el párrafo argumenta convivencia, y el lector le cree al diseño. Medido: a 1907 las dos
columnas miden `424` px cada una, y a 400 las dos se apilan en `x: 20, w: 360`.

**Ninguna de las tres tasks de feedback abrió un ADR**, y eso fue una elección. La guarda
de los medios que escribió la T-06 se colgó del **ADR 0073 existente** —*"es el CHEQUEO 4
aplicado a la otra mitad derivada de la misma sección"*— en lugar de fundar uno nuevo:
la regla que fija es la misma, aplicada a otro campo.

## 3. Tasks, y las líneas del plan que no se obedecieron

Las ocho en `done`. Las tres últimas corrieron juntas y se verificaron una sola vez, así
que sus tres corridas viven en `tasks/T-06/`.

| id | qué dejó |
| --- | --- |
| T-01 | Las cuatro secciones en su orden nuevo, la copia en inglés, el comentario de cabecera, los dos puntos de montaje vacíos, y la línea de base de la fase |
| T-02 | `js/tipos.js`: la galería dibujada del contrato, con su guarda y el control plantado |
| T-03 | `js/senalizacion.js`: un pliegue por aviso con el JSON crudo adentro, la glosa por atributo y la marca en vivo. 4 roturas, una por cláusula |
| T-04 | La figura de la convivencia, dos columnas del mismo peso sobre una playlist |
| T-05 | La no-regresión: cinco instrumentos, cinco JSON, y los dos controles puestos a dar rojo |
| T-06 | La afirmación falsa afuera, y qué puede ir adentro de una caja. Guarda nueva de los medios |
| T-07 | La glosa del bloque, dieciocho campos en cinco grupos, con su chequeo en las dos direcciones |
| T-08 | La marca centrada, en blanco y sin plancha, arriba y en el pie |

### Las líneas del plan que no se siguieron

**1. La sección 3 no conservó sus dos `<pre>` (T-03).** El plan decía: *"La sección 3
conserva sus dos `<pre>` funcionando. … se mueven intactos con sus `id` intactos."* **El
`<pre id="list">` se eliminó.** La razón es la decisión misma del ADR 0075: el resumen
del asset-list *"deja de ser el contenido y pasa a ser el rótulo"*, así que nadie lo
escribe más, y un `<pre>` que dice `loading…` y que ningún código vuelve a tocar es
exactamente la mentira que el comentario de cabecera de `index.html` prohíbe. El
`<pre id="tag">` no se tocó, y la lectura en vivo tampoco.

**2. Ninguna de las ocho tasks levantó la demo con `./run.sh` (T-01 a T-08).** La
definición de done de la T-01 lo pedía. Las ocho la sirvieron con
`PORT=809x node server.mjs demo/hydration-break`, y la razón es la misma en todas:
`run.sh` reconstruye `dist/` desde `lib/` en cada arranque, y `lib/` lo estaban editando
tres tasks de la fase 11 al mismo tiempo; una reconstrucción a mitad de edición se le
mete en el `dist/` a **todas** las demos servidas, incluidas las de esas tasks. Es la
decisión correcta y tiene un costo medible que la T-05 reportó: **la playlist que se
verificó es la del empaquetado del 2026-09-10 y no la del día**.

**3. La comprobación del `START-DATE` no se hizo como el plan pedía (T-05).** El plan
decía comprobar *"que el `START-DATE` del tag en pantalla coincida con el de
`content/primary/con-daterange.m3u8` recién escrito, que cambia en cada empaquetado"*.
No hubo empaquetado nuevo, por el punto anterior. El sustituto mide la misma propiedad y
es más fuerte: **se reescribe el `START-DATE` en la red** —`page.route` sobre la
playlist, con un valor plantado— y se comprueba que la pantalla lo sigue.

```
control_1: start_date plantado "2001-01-02T03:04:05.678-0300" → en pantalla el mismo, siguio_a_la_red true, rojo true
```

**4. La glosa explica los dieciocho campos y no "los más importantes" (T-07).** El pedido
de Nicolás decía *"No todos los parámetros: sí los más importantes y obligatorios"*. Se
explicaron todos, con el argumento de que la selección ya la había hecho el archivo:
*"en este asset-list aparecen los dieciocho, así que la selección la hizo el archivo y no
yo"*. Y la task agregó una clase de marca que el pedido no nombraba y que es la más útil
para la audiencia: además de `required` y `optional`, **`ignored`** — *"es lo que nadie
puede averiguar sin leer el cliente, y dos de los tres campos del bloque son eso"*.

**5. Trabajo asignado a una task, entregado por otra (T-02).** El plan le pedía a la T-02
*"una línea de prosa al pie de la sección, diciendo que las formas no se agotan en
éstas"* (ADR 0074). Cuando la T-02 llegó, la línea ya estaba: la había dejado la T-01
junto con la caja de montaje. No es un incumplimiento, pero es una línea del plan que
nadie ejecutó donde estaba escrita.

**Y una que el plan pedía y quedó distinta sin que ninguna task lo registre.** El
`DESIGN.md` pedía que la ficha del aviso lineal fuera *"un solo rectángulo a cuadro
entero"* rotulado *"no layout block: played full frame"*. La ficha dibuja **dos** cajas
—el `primaryContent` sintetizado más el elemento, que es lo que el ADR 0019 produce— y
el rótulo dice `linear`. Es coherente con el contrato y probablemente sea lo correcto,
pero deja las dos superficies de la página nombrando al mismo aviso de dos maneras
distintas: la galería lo rotula con `experience.type` (`js/tipos.js:226`) y el pliegue
con la constante `NO_BLOCK`, *"no layout block, played full frame"* (`js/senalizacion.js:92`).
Las dos leen del contrato, a profundidades distintas. **Queda como hilo abierto y no se
tocó**, porque elegir cuál de los dos nombres vale es una decisión de copia.

## 4. Hilos abiertos

**La fase no produjo ninguna medición de red, ni la buscaba.** Todo se midió sobre
contenido servido localmente por `server.mjs`, igual que en la fase 11. No hay dato
sobre cuánto pesa la página en una conexión real ni sobre qué tarda en llegar el
asset-list que los pliegues muestran.

**No se sabe si el scroll de abajo entra en la grabación del 28 al 30 o si se graba sólo
el player.** Nicolás aprobó el diseño sin contestarlo, y sigue sin contestar. Es lo que
decide si la T-04 sobra, y está aislada como task propia exactamente por eso: si la
respuesta es "sólo el player", se saca sin tocar nada más.

**Los dos nombres del aviso 3** (sección 3, última entrada).

**A 320 px el documento scrollea de costado, y no es la figura.** Lo midió la T-04 con la
figura puesta y con la figura escondida, y da lo mismo:

```
"figure in place": {"doc":334,"client":320,"overflowing":[{"el":"code.","right":334}]}
"figure hidden":   {"doc":334,"client":320,"overflowing":[{"el":"code.","right":334}]}
```

El que se pasa es el `<code>com.qualabs.hls.concurrentInterstitial</code>` inline del
lede de la sección 2, que es copia de la T-01. No es regresión: los dos anchos declarados
de la página son 400 y 1907 y en los dos el documento no se mueve. Queda anotado y no
arreglado, *"porque arreglar copia de otra task mezcla dos cambios en uno"*.

**La guarda de ancho de la T-04 no hace nada a los anchos declarados, y eso se supo
apagándola.** A 320 el bloque de tags pasa de `278` a `308` sin guardas; a 360 y a 400 da
`318/318` y `358/358` con y sin. La línea se queda por el argumento de su comentario, no
porque la medición la respalde donde la página se mira.

**El `brand/README.md` de `compatibility-pair` quedó contradiciendo la decisión de la
T-08.** Sigue diciendo que recolorear el logo *"is not an option that was rejected for
taste: it is how a brand gets broken"*, que es exactamente lo que la instrucción de
Nicolás eligió; el de `hydration-break` ya está corregido y el de la otra demo dice
explícitamente que su plancha clara *"predates that decision and is a pending call, not
an endorsement"*. Es una llamada pendiente sobre la otra demo y no una deuda de ésta.

**La rama `else` de `lib/media.js` —un MP4 o un WebM que el browser reproduce solo— no
la ejercita ningún asset-list del repositorio.** La T-06 la nombra en la página como
soportada leyendo el código, y la página lo dice como `nothing in this minute`. Está
leída, no comprobada en navegador.

## 5. Riesgos que se materializaron, y los defectos que aparecieron midiendo

**R2 se materializó exactamente como estaba escrito.** El riesgo era que el `<details>`
con el JSON crudo rompiera el ancho de la página en un teléfono, *"ya pasó en esta misma
página con los `<pre>`"*. Pasó de nuevo, y lo encontró la primera corrida del instrumento
de la T-03 antes de que existiera el arreglo. La medición va con su referencia adentro:

```
"pliegues cerrados":                      {"scrollWidth":400,"clientWidth":400}
"pliegue 2 abierto, con min-width: 0":    {"scrollWidth":400,"clientWidth":400}
"el mismo pliegue abierto, sin la linea": {"scrollWidth":471,"clientWidth":400}
```

El diagnóstico es el que importa y no el número: `.assets` es un grid, **un ítem de grid
no se achica por debajo de su contenido**, y el `white-space: pre` del JSON abierto son
449 px; el `overflow-x: auto` del bloque de código no alcanza solo. El arreglo es
`min-width: 0` en `.asset`. Es la tercera vez que este proyecto paga el mismo defecto.

**Y la T-05 lo volvió a provocar al cerrar**, para que el chequeo de cierre pudiera dar
distinto: con la guarda, `scrollWidth 400`; sin ella, `471`. El mismo número.

### Los dos números que la página afirmaba y no eran ciertos

Los dos se encontraron **cruzando lo que la página dice contra lo que la página sirve**,
no leyendo la copia.

**La última placa decía cincuenta y ocho segundos de publicidad y son sesenta y cuatro.**
Lo encontró la T-05 contra el reparto de `plate.json` —16+16+8+24— y contra el
`PLANNED-DURATION=64` que la propia página muestra dos pantallas más abajo. Y la glosa de
ese atributo, escrita por la T-03 en esta misma fase, dice que el número *"is the sum of
the DURATION of every asset in the list"*: **la página se contradecía a sí misma a dos
pantallas de distancia**. No era una regresión de la fase —el texto estaba en
`story/story.json` desde el 2026-09-09—, y el costo de dejarlo era que se dice mal en
escenario, porque es la frase con la que cierra el recorrido guiado que se graba. La
T-05 lo reportó y no lo arregló, que es lo que su constraint le pedía —*"un arreglo dentro
de la task de verificación es un arreglo que nadie revisó"*—, y el arreglo entró después:
hoy la placa dice *"Sixty-four seconds of advertising in one stoppage"*.

**`0 seconds of programme replaced` era falso, y lo pidió sacar Nicolás.** La frase es
cierta sobre la línea de tiempo —el primario nunca se detiene y el largo no cambia, ADR
0016— y al revés sobre la pantalla, que es el único lugar donde alguien está mirando,
porque el tercer aviso es lineal y tapa el partido. Lo que más vale acá es que **el
repositorio ya lo sabía y nadie lo había cruzado con la página**: los comentarios de
`js/tipos.js` y de `js/app.js` decían, cada uno por su lado, que *"nothing was replaced"
reads backwards* justo ahí.

No se reemplazó por nada escrito a mano: el número que ocupa su lugar es
**`8 seconds of the 64 without the match on screen`**, calculado con `coversThePicture`
—la misma función que decide la línea de la ficha del lineal— y con el 64 leído como la
suma de los rangos de `kind === 'concurrent'`. La frase no está en `index.html`: la
agrega `js/tipos.js`.

Y en el camino apareció un tercero, más chico y de la misma familia: el `README.md` de la
demo decía que el guion genera *"the ten-second linear spot"* y el lineal es de ocho, con
el `durationSeconds: 8` del script, el `DURATION: 8` del asset-list y los `EXTINF` de
acuerdo. Hoy dice *"the eight-second linear spot"*.

### El defecto que encontró la captura y ninguna suite podía encontrar

**La primera versión del SVG del logo no se dibujaba (T-08).** El browser mostraba el
`alt` con el ícono de imagen rota, arriba y en el pie. La causa es del formato y no del
dibujo: un SVG es XML, y **un comentario XML no puede contener dos guiones seguidos**; el
comentario usaba `--` como raya, igual que el resto de los comentarios de esta demo, que
son HTML y sí lo admiten.

Lo que hay que llevarse es el argumento: *"Lo encontró la captura y no la suite, y no hay
test que lo hubiera encontrado: un `<img>` roto es HTML válido, CSS válido y JavaScript
válido."* El arreglo de fondo no fue mirar mejor: el archivo pasa por un parser.

```
$ python3 -c "import xml.dom.minidom; xml.dom.minidom.parse('logo-qualabs-on-dark.svg'); print('well-formed XML')"
well-formed XML
```

### Un riesgo que no estaba en la tabla y se materializó

**La fase 11 rompió la suite en vuelo.** A las 13:49, durante la T-03, `npm test` dio
cuatro archivos en rojo por un `SyntaxError` en `lib/controls.js` (línea 618,
`Unexpected identifier 'on'`), con el archivo escrito a las 13:48; un minuto después
`node --check lib/controls.js` pasaba y volvía el verde. Era una edición a mitad de
camino de la otra fase. No se tocó nada y quedó anotado *"porque cualquiera que corra la
suite en esa ventana ve cuatro rojos que no son suyos"*.

La lista de archivos que la fase 12 se comprometió a tocar cumplió su función —las dos
fases no compartieron un solo archivo— pero **compartieron la suite y el `dist/`**, y eso
el plan no lo nombraba.

## 6. Recomendaciones para la fase siguiente

**La verificación que no podía fallar, y que la encontró quien la escribió.** Es el caso
central de la fase y vale más que su arreglo. La T-05 midió el recorrido guiado en una
sola corrida larga, y adentro de esa corrida tenía la referencia que la hace medir algo:
*"con el player abajo del pliegue el recorrido NO arranca"*. Salió así:

```
con_player_abajo_del_pliegue = {"visible_del_player": 0, "placa_visible": true, "data_story": "running", "currentTime": 0}
```

El caso que tenía que decir "no arrancó" decía **corriendo**. La causa no era la página
sino el orden del instrumento: *"en la corrida larga el instrumento recorrió la apertura
antes para leer `--t`, el player cruzó el umbral en ese scroll y la primera placa ya
llevaba tres segundos arriba cuando empezó el muestreo"*. De paso, la placa 1 quedó
medida en 1,78 s contra un `hold` declarado de 5.

**Lo encontró el propio ejecutor leyendo la salida de su instrumento**, y no lo parcheó:
escribió un segundo instrumento que mide al revés y sobre una carga limpia. Con él, 0 % y
30 % dan `data_story: null`, 100 % arranca con la placa a los 0,06 s, y la placa 1 dura
**5,44 s** contra su `hold` de 5.

La lección operativa: **una corrida larga que mide varias cosas contamina sus propios
casos de control**, porque para llegar al caso N ya pasó por el estado que el caso N
suponía ausente. El caso que tiene que dar lo contrario se mide en su propia carga.

**Y el mismo patrón apareció tres veces más, siempre atajado por quien escribía el
chequeo:**

- **El chequeo de los pliegues no podía fallar rompiendo el asset-list (T-03)**, porque
  los rótulos lo siguen: *"cambiar el asset list no sirve como rotura, porque los rótulos
  lo siguen y el chequeo quedaría verde — lo que hay que romper es la correspondencia
  entre lo que el pliegue dice y el aviso que tiene adentro"*. Se rehizo con los rótulos
  entrando por parámetro, producidos por el mismo código que corre en vivo, y las cuatro
  roturas se ven en rojo.
- **La glosa no se compara contra el recorrido de la página (T-07)**, que es lo que la
  hace un chequeo: *"si el recorrido de la página dejara de bajar a las cajas del layout,
  sus filas no tendrían `viewport` y el del chequeo sí"*. Comparar la página contra sí
  misma no puede fallar.
- **Las dos guardas se autodenuncian (T-02, T-06)**: si el asset-list no declarara ningún
  identificador de layout, o ningún MIME, el chequeo no tendría qué buscar y se reporta
  roto él mismo, en lugar de dar verde por vacío.

**Una sola cosa se verificó sin control en toda la fase, y conviene decirlo:** las
mediciones de ancho y de consola de la T-06, la T-07 y la T-08 están **afirmadas en los
READMEs y no pegadas**. No hay script, ni JSON, ni línea de `EXIT=0`, a diferencia de la
T-05, que dejó cinco instrumentos y cinco JSON. Las capturas están; los números de
`scrollWidth` que los acompañan hay que creerlos.

**Para quien escriba la próxima pieza derivada del contrato:** el reparto que funcionó es
*"lo que se dibuja se deriva, y lo derivado lleva una guarda que se pone roja si alguien
lo escribe a mano"*. La guarda es barata —es un grep sobre una lista de archivos— y es lo
único que impide que la pieza se degrade a una lista escrita a mano en el primer apuro,
que es el riesgo R1 que esta fase existía para atajar. Y la lista de archivos de la
guarda tiene que alcanzar lo que se escriba: la T-06 la armó una vez en `FUENTES()` y las
dos guardas leen la misma lista.

## 7. Correcciones post-ejecución

**Ninguna anotada.** `grep -n "post-ejecuci"` sobre el `TASKS.md` de la fase no devuelve
nada.

Y leído como medición, acá el cero dice algo bastante preciso, porque **el feedback de
Nicolás sobre la página ya construida sí existió**: son las tasks T-06, T-07 y T-08. Se
eligió meterlas como tasks nuevas y no como líneas `post-ejecución:` en el bloque de las
que corrigen, y la razón está escrita en el propio `TASKS.md`: *"no cambian el objetivo ni
el alcance de la 12, corrigen y completan lo que las cinco primeras dejaron"*. Las tres
traían trabajo real —una guarda nueva, dieciocho filas de glosa, un SVG derivado— y
ninguna entra en una línea.

Eso es correcto por la regla que distingue los dos caminos: la definición de done de la
T-01 dejó de valer cuando se sacó la afirmación falsa, así que el trabajo tenía que
volver a pasar la vara y no alcanzaba con una anotación.

Lo que sí quedó como anotación y no como task, y es el único caso de la fase, es la
**línea de nivel de verificación de la T-08**, que hoy dice *"bajo, y el error está en la
pantalla — que es literalmente donde estuvo: la primera versión del SVG no se dibujaba"*.
Está escrita después de ejecutar y en el campo del plan, no en el registro de lo que pasó.

## 8. Revisión de documentación

Superficie por superficie, con lo que se actualizó o por qué no necesitaba nada.

**El índice de fases de `PROJECT.md`** — escrito en este cierre. Su línea dice qué quedó
construido, de dónde sale lo que la página afirma, cuáles fueron las dos afirmaciones
falsas que encontró, y que la verificación del arranque no podía fallar.

**`docs/arc42/`** — no existe, y esta fase no lo crea, por la misma razón que las
anteriores: los dos documentos de `docs/` cumplen ese papel para el único lector que
tienen.

**`docs/contrato-senalizacion-renderizado.md`** — **re-leído y no cambió por esta fase**,
y era la prueba. La página **consume** el contrato: la galería lee `activeAt` y
`programRanges` tal como el documento ya los describe, y los pliegues leen el asset-list
que la sección ya leía. Si esta fase hubiera necesitado un método nuevo del proveedor,
eso era un hallazgo y había que parar; no apareció. (El documento sí cambió en el mismo
período, por la fase 11.)

**`docs/integrating-the-library.md`** — **no necesitaba nada de esta fase.** Es la
superficie pública de la librería y la fase no toca la librería. Lo dice el `PHASE.md` y
al cerrar sigue siendo cierto: `demo/hydration-break/` no importa nada de `lib/` que no
importara antes.

**El `README.md` de la raíz** — **no necesitaba nada de esta fase.** Enruta, y su fila de
`hydration-break` describe qué argumenta la demo, no qué secciones tiene el scroll.

**El `README.md` de `demo/hydration-break/`** — **corregido**, y no por la fase sino por
lo que la fase encontró: decía *"the ten-second linear spot"* y el lineal es de ocho.

**`demo/hydration-break/brand/README.md`** — **corregido**, y es la mitad interesante de
la T-08. Gana la fila del archivo nuevo con su procedencia —derivado acá y no copiado del
kit— y el párrafo que decía *"The logo needs a light surface"* pasó a decir *"and what
changes to get one is the logo"*, con la decisión de Nicolás escrita: la variante con el
logotipo en blanco, y no una plancha debajo. El kit de marca no se editó.

**El comentario de cabecera de `demo/hydration-break/index.html`** — **corregido**, y es
la única documentación que la fase se comprometió a arreglar porque es la única que
volvía falsa. En esta demo ese comentario es la documentación real del archivo.

**El `CLAUDE.md` del proyecto** — existe y es nuevo, sin commitear. Ninguna task de esta
fase lo nombra. Se leyó al cerrar y nada de lo que afirma lo tocó esta fase: enruta a los
cuatro lugares donde viven las reglas y describe cómo se publican las demos en GCS.

**`.project/knowledge/`** — no existe, y la fase no produjo nada que califique.

**El `CLAUDE.md` y el `knowledge/` del repo padre** — **no necesitaban nada.** La fase no
cambió ninguna regla de cómo se trabaja. El candidato era la lección de la corrida larga
que contamina su propio control, pero es una instancia de un riesgo que el proyecto ya
nombra y persigue, y una regla se acuerda antes de escribirse.

**El doc de instalación o runbook** — el proyecto no tiene uno separado: `./run.sh <demo>`
es el punto de entrada y lo dice el `README.md` de la raíz. La fase no agregó ni rompió un
paso de setup. Lo que sí conviene que quede dicho acá, porque ninguna de las ocho tasks lo
pudo usar, es que **`run.sh` reconstruye `dist/` en cada arranque y eso lo vuelve
inutilizable mientras otra sesión edita `lib/`**; el rodeo que las ocho usaron es
`PORT=<n> node server.mjs demo/<nombre>`.

**Las carpetas `tasks/` de esta fase** — marcadas como **registro** y no como instrucción
vigente. Los `README.md` de la T-01, la T-02 y la T-03 arrancan diciendo que son el
registro de lo que se corrió y se miró el 2026-09-11. Sus mediciones y sus capturas
prueban qué se corrió; no se reescriben.
