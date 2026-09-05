# Informe de cierre — fase 02: el SDK y sus controles

Fase `02-sdk-y-controles`. Abierta el 2026-09-04, cerrada el 2026-09-05.
Nueve tasks, las nueve en `done`, ninguna abandonada ni bloqueada.

## 1. Resumen

**Lo que la fase deja no es una demo con el código ordenado: es una
librería.** La diferencia es que las tres cosas que lo sostienen se
verifican y ninguna se afirma.

- **El corte del ADR 0015 lo chequea un script.**
  `scripts/verificar-cortes.mjs` corre los dos greps de la fase —que el
  renderizado no nombre el transporte, que la librería no nombre la demo— y
  compara lo que encuentran contra una lista de ocurrencias aceptadas, cada
  una con su razón escrita, al punto de que el script se niega a correr con
  una que no la tenga. Se lo hizo fallar de tres maneras antes de creerle.
- **La página del integrador son 12 líneas**: 8 de JavaScript entre las dos
  vallas de `js/app.js` y 4 de marcado, con el mínimo en 10. El número no es
  una estimación: la T-08 comparó la página mínima que describe el documento
  contra la de la demo línea por línea, y las diferencias son tres, las tres
  opcionales y las tres declaradas opcionales.
- **Hay un documento para alguien que no somos nosotros.**
  `docs/integrating-the-library.md`, al lado del contrato, en inglés como el
  resto de lo que se lee de afuera.

Eso es exactamente la forma que David le puso al pedido: *"then it's
actually like clean on how this could be distributed and shared"*.

**Y la librería se quedó con los controles**, que es la otra mitad de la
fase y la razón por la que las dos cosas eran una sola decisión: una barra
de progreso de todo el programa con los breaks marcados en dos carriles, la
pausa centrada, un solo control de audio y el fullscreen de la composición,
que **antes de esta fase no existía en el repositorio** —no había una sola
llamada a `requestFullscreen`—. Los controles nativos sobre el contenido
primario dejaron de estar, y el botón de audio del aviso, que en fullscreen
desaparecía porque vivía fuera del contenedor, dejó de existir.

El proyecto tiene además, por fin, un documento de arquitectura propio: el
contrato del ADR 0003 salió de la evidencia de una fase cerrada y vive en
`docs/contrato-senalizacion-renderizado.md`, ampliado con la consulta que la
barra necesitaba.

La fase cerró **dieciséis días antes del sync del 21 de septiembre** con
David y veintitrés antes de la ventana de grabación.

## 2. Decisiones tomadas

| ADR | scope | qué fija |
| --- | --- | --- |
| **0015** | `phase-02` | El límite del SDK y la propiedad de los controles. Es el ADR que gobierna la fase: se decidió al principio y se verificó en cada task. |
| **0014** | `project` | El estado inicial del audio de cada elemento sale del asset list, con el default del campo ausente en silencio. Supersede al 0010, que queda en `superseded` con el cuerpo sin tocar. |
| **0016** | `project` | La clase concurrente nunca cambia el largo de la línea de tiempo. Es lo que sostiene que una sola barra alcance y que el largo se relea en lugar de guardarse. |

Los tres se escribieron en el pase que generó las fases 02 y 03, o sea antes
de construir. **La fase no agregó ningún ADR nuevo durante la ejecución**, y
eso es una propiedad y no un descuido: las decisiones llegaron tomadas y lo
que la construcción produjo fueron correcciones al texto de las que ya
estaban.

### Qué le hizo la construcción a las decisiones

Tres ADR recibieron una **nota fechada**, y cada una marca un lugar donde el
código encontró que el texto decía algo que no era cierto o no había
decidido nada.

- **ADR 0015, nota del 2026-09-04.** El ADR cerraba diciendo que el pane de
  fábrica conserva sus controles nativos y que esa asimetría refuerza el
  argumento de compatibilidad. **Nunca los tuvo**: `#stock-video` entró en la
  T-09 de la fase 01 con `playsinline muted` y nada más, así que la asimetría
  existía al revés, con controles nativos sólo en nuestro pane. Nicolás
  decidió que no se muestran controles nativos en ninguno de los dos, y el
  argumento de compatibilidad se apoya en lo que ya lo sostenía: que uno
  reemplaza el contenido y el otro no, y que al final del recorrido el player
  sin modificar va 49,5 s de programa atrás.
- **ADR 0014, nota del 2026-09-05.** La frase "el contenido primario conserva
  su audio" se leía como que el primario queda siempre en 100. La T-05
  implementó otra cosa, y es la que quedó: **el volumen declarado se obedece
  en todos los elementos, el primario incluido, y la asimetría es únicamente
  del default** —0 en los elementos del aviso, 100 en el primario—. Lo que el
  ADR no decía en ningún lado, y que la task tuvo que decidir, es qué hacer
  con un `volume` declarado dentro del bloque `primaryContent`: se obedece.
- **ADR 0013, nota del 2026-09-04.** Su párrafo de cierre —que el recorte
  nunca le toca al contenido primario— valía en ventana y no en fullscreen.
  Después de la T-09 vale en las dos, y la decisión del ADR no cambió.

**Dos decisiones de producto las tomó una task y viven en su documento y no
en un ADR.** La primera es que la barra marca las dos clases y las dibuja en
dos carriles (T-04). La segunda es que la marca de Qualabs va en la barra y
no en una esquina de la imagen (T-07). Las dos están escritas y medidas
donde se tomaron; ninguna de las dos está en `decisions/`, y la primera es
la que más se parece a algo que un tercero va a querer discutir.

## 3. Tasks

| id | qué dejó |
| --- | --- |
| T-01 | El corte. `lib/` es la librería y `index.html`, `css/` y `js/` son la demo. El empaquetado es un paso que arma la librería en cada arranque y no un archivo escrito a mano, protegido por un `node --check` y no por una expresión regular. La página del integrador queda en 13 líneas. |
| T-02 | `docs/contrato-senalizacion-renderizado.md`, el documento de arquitectura del producto, con la consulta nueva `provider.programRanges()`: dónde están todos los rangos, de qué clase es cada uno, y sin el largo total, que se relee. La completitud se promete con `settled` en lugar de heredarse de una coincidencia. |
| T-03 | Los controles de la composición en `lib/controls.js`: una barra con `3:00`, la pausa, un control de audio y el fullscreen, que no existía. El apilado verificado contra el caso que el recorrido no tiene. Las cuatro capturas, y las de fullscreen tomadas en fullscreen de verdad. |
| T-09 | El área contra la que se resuelven los insets pasa a ser la de la imagen y no la del contenedor. En ventana no se movió un píxel; en fullscreen el encuadre del primario dejó de saltar al entrar y salir de cada break. |
| T-04 | Los cinco breaks marcados en la barra, en dos carriles y dos colores: violeta sobre el riel para lo que este player reproduce, amarillo debajo para lo que hace un cliente de mercado. |
| T-05 | El ADR 0014 implementado, con el default partido en dos y el operador `??`. La mezcla que propuso David sobre el Quad, que es un asset list y no código. Cuatro textos vigentes que decían lo contrario, corregidos. |
| T-06 | Doce tests sobre las funciones puras que la fase agregó, con datos reales y no inventados. Once mutaciones corridas una por una, ninguna verde. `npm test` cierra en 27/27. |
| T-07 | El skin y la marca. El logo en la barra —porque adentro de la imagen no hay esquina libre— y en el encabezado de la página. La librería no lleva marca: el logo y el color entran por la superficie pública. |
| T-08 | `docs/integrating-the-library.md`, y la comparación línea por línea que prueba que no miente. Dos requisitos que la librería tiene y nadie había escrito. |

### Lo que se aprendió midiendo, que es lo que sobrevive a la fase

**El cero de la geometría encontró su piso, y el piso es el instrumento.**
La fase 01 midió cinco veces **0,00 px** entre la caja que el contrato pide y
la que el navegador dibuja. Esta fase lo volvió a medir dos veces más —la
T-03 en los elementos del break, la T-09 en los catorce elementos de los
cinco breaks, primarios incluidos— y las dos dieron **0,000000 px**, con la
cuenta de los porcentajes hecha en la sonda y no preguntada a la librería,
que es lo que impide que el cero sea el renderizador comparándose consigo
mismo. Lo nuevo es qué pasa cuando el cero deja de ser cero: en fullscreen,
sobre un viewport de 1920 × 901 que a propósito no es 16:9, la T-09 midió
**delta ≤ 0,0122 px**, y la T-04 midió el mismo número en la geometría de
cada marca de la barra. No es un error de la conversión: es la cuantización
del navegador a 1/64 de píxel, en la que los números de la ventana caen
justo y los de fullscreen no. O sea que el cero de la ventana y el 0,0122 de
fullscreen son la misma medición leída con la resolución que el instrumento
tiene en cada caso.

**Los dos rangos de cada break están en el mismo lugar, y de eso salió el
diseño de la barra.** La T-04 fue a medir dónde caen los diez rangos del
recorrido y encontró que caen de a dos: `AD-n-LINEAR` y `AD-n-CONCURRENT`
comparten `START-DATE` y duración, que es exactamente lo que hace al par de
compatibilidad ser un par. Marcarlos uno encima del otro agrega un color y
no información. **Lo que los separa no es dónde están sino de quién es cada
uno**, así que lo que los separa en la pantalla es el carril: sobre el riel
lo que este player reproduce, debajo del riel y en un carril propio lo que
hace el otro cliente, que ningún playhead toca porque no es esta línea de
tiempo. Esa separación es la que hace que el amarillo se lea como "acá un
cliente de mercado reemplaza" y no como "acá pasa algo en este player".

**Un binario falso se disolvió midiendo, y la decisión de Nicolás lo
reemplazó por otra cosa.** El diseño de la fase planteó que si la barra iba
debajo del área de la composición, el elemento que va a fullscreen dejaba de
ser la caja 16:9 de la imagen, y el renderizador se llevaba la barra adentro
del área. Las imágenes de referencia contestaron que la barra va abajo de
todo pero **adentro del marco**, así que no hay contenedor nuevo y la trampa
no existe (T-03). Lo que sí existía era el problema de al lado, que nadie
había planteado porque en ventana no se ve: el renderizador medía el
contenedor y no la imagen. Nicolás lo resolvió con una frase —*"el viewport
lo define el video (con su relación de aspecto), no el tamaño de la
pantalla"*— y la T-09 la implementó. La prueba está en los píxeles de las
capturas y no en un estilo computado: antes del cambio, el mismo player en
fullscreen dibujaba la imagen en `x 159..1760` sin aviso y en `x 0..1919`
con aviso; después, las tres capturas dan `x 159..1760`, y las barras negras
tienen canal máximo 0, o sea que ningún elemento las pisa.

**No hay esquina libre, y eso está medido y no supuesto.** Un bug de canal
va en una esquina, pero en este player la imagen es del layout: `multiView`
ocupa las cuatro, el aviso de `cornerOverlay` **es** la esquina superior
izquierda, y en `squeezebackLShape` la columna derecha y la franja de abajo
son avisos. Se probó arriba a la izquierda y la captura de la opción
descartada quedó como evidencia: la placa le tapaba la mitad al aviso que la
demo existe para mostrar. La marca terminó en la barra, que es la franja que
la composición ya le cedió al mobiliario, y en una fila propia arriba del
riel para que tampoco le saque ancho a la barra de progreso.

**Once mutaciones y ninguna sobrevivió, y la campaña encontró un hueco que
los tests no encontraban.** La T-06 rompió una regla por vez y corrió sólo
los tests que cubren esa regla. Las tres que el plan nombraba murieron con
la aserción a la vista: el `??` cambiado por `||`, el default de 0 aplicado
también al primario, y el largo total cacheado. **La regla del default
asimétrico necesitó dos roturas y no una**, porque está escrita en dos capas
y hay que romper las dos; y romper la del renderizado destapó lo único que
la task no cubría: ese default sólo se alcanza cuando el `volume` no es un
número, y después de la capa de señalización siempre lo es, así que ningún
test manejado por datos reales llega ahí. Lo tapa un test que llama a la
función directo con el campo ausente y con un string, que es el borde que el
contrato declara (`volume: number // 0..100`) y nadie valida.

### Los errores de método que la fase encontró, porque valen para la próxima

- **Un chequeo que corre sobre una lista escrita a mano chequea la lista y
  no el árbol.** El grep del ADR 0003 recorría una enumeración de archivos,
  así que un archivo nuevo en `lib/` que nadie agregara a ninguna lista
  pasaba por no ser mirado y no por estar limpio. El script lo cerró
  exigiendo que cada `lib/*.js` esté declarado de un lado o del otro de la
  costura, y falla nombrando al que no lo esté. La forma general es que una
  alarma con una lista de entrada tiene dos maneras de callarse, y la que no
  se ve es que la entrada esté incompleta.
- **La prueba de reducir la captura a un cuarto encontró dos defectos que de
  cerca no se ven, en dos tasks distintas.** En la T-04, un riel de 6 px
  reducido al 25 % queda en 1,5 filas de imagen, así que ninguna fila cae
  entera adentro y las dos que lo tocan salen mitad color y mitad fondo: el
  riel pasó a 8 px, que es el tamaño mínimo que sobrevive a la reducción. En
  la T-07, el logo del player a 22 px queda en 5,5 px reducido y el wordmark
  se disuelve, y no se arregla agrandándolo, porque un "qualabs" legible
  necesita 48 de los 179 px que esa imagen mide a un cuarto. De ahí salió que
  en la página de dos panes la marca que se lee de lejos es la del
  encabezado, y que en fullscreen, donde no hay encabezado, la del player
  tiene que subir a 40 px.
- **Leer un píxel en el centro redondeado de una franja mide el
  redondeo.** Con la fila mal elegida, el violeta del fullscreen daba
  `60, 45, 67`; leído en la fila que cae entera adentro del carril, da
  `173, 122, 255`. La primera lectura no era un color más apagado: era mitad
  carril y mitad fondo.
- **Un diff de píxeles necesita que las dos corridas estén alineadas a
  píxel entero, o mide antialiasing.** La T-07 probó que el pane sin
  modificar quedó igual con 0 píxeles distintos de 429.177, y para que ese
  número significara algo hubo que parar el video en el mismo segundo en las
  dos corridas y empujar el pane a una fila entera, porque el encabezado
  nuevo lo bajaba 13,x px y la rasterización de un texto depende de la
  fracción de píxel en la que cae. Sin esa alineación el diff daba 2,7 % de
  píxeles distintos que eran antialiasing y no skin, o sea un falso positivo
  del mismo tamaño que el cambio que se buscaba.
- **Un `trap` que existe puede no poder dispararse nunca.** Bash posterga la
  señal hasta que el hijo vuelve a primer plano, así que un `trap` de
  limpieza escrito alrededor de un proceso que se queda esperando no corre
  cuando hace falta. No salió de esta fase, y queda escrito acá porque es del
  mismo tipo que los de arriba: un mecanismo de seguridad que nunca se vio
  disparar no se sabe si dispara, y la manera de saberlo es hacerlo fallar a
  propósito, que es lo que se hizo con el script de los cortes y no se había
  hecho con el `trap`.

## 4. Lo que queda abierto

### Dos requisitos de la librería que hoy no están en su superficie pública

Los dos salieron de la T-08, de comparar la página mínima contra la de la
demo, y **no de ningún bloque de la fase**. Los dos están escritos en
`docs/integrating-the-library.md` y ninguno se tocó en código, porque la T-08
era una task de documentación.

1. **La librería necesita el global `Hls` y la superficie pública no lo
   pide.** El ADR 0015 entrega la instancia, no el constructor, y la librería
   busca el global tres veces —`lib/concurrent-hls.js:167`,
   `lib/signalling.js:204` y `lib/media.js:34`, que hace `new Hls(...)` por
   cada asset—. O sea que el orden de los dos `<script src>` importa, y un
   integrador que haga `import Hls from 'hls.js'` ve el contenido primario
   reproducir bien y se come un `ReferenceError` en el primer break. **Es la
   misma forma de falla del ADR 0002: anda hasta que importa**, y es la forma
   de falla que la fase entera trató como la peligrosa.
2. **La librería le borra el atributo `style` al elemento de video** al
   terminar cada break (`lib/renderer.js:346`). Ese borrado es justamente el
   mecanismo del que depende la garantía de la T-09 —que el rectángulo del
   primario sea el mismo con aviso y sin aviso—, y de paso se lleva puesto
   cualquier estilo en línea que el integrador le haya puesto.

Hay una tercera de la misma familia, y es una dependencia y no un requisito
que la librería pueda cumplir sola: **que el encuadre no salte depende de una
regla de la hoja de estilos del integrador**, `object-fit: contain` sobre el
elemento de video. Sin layout activo la librería le devuelve el elemento a la
página, y de ahí el rectángulo lo decide su CSS: con `cover`, el salto vuelve
al revés, sin error y sin log.

### La mezcla del Quad

El ADR 0014 quedó con una nota fechada que dice lo que la T-05 implementó y
Nicolás confirmó: en el Quad, con la mezcla que David propuso, **el contenido
primario suena a 10 mientras un cuadrante del aviso suena a 100**, porque en
un multiview el primario es uno de los cuatro cuadrantes y la mezcla habla de
los cuatro. Está decidido puertas adentro y escrito en el ADR, en el contrato
y en el `README.md`. Lo que no está es la confirmación de David, que es quien
propuso la mezcla —*"the bottom left be 100, and then the other ones are all
10"*— y puede no haber contado al programa entre "the other ones". Es una
línea de asset list si hay que cambiarla, y se ve y se escucha en cámara.

### La dirección del skin no está escrita en ningún lado

El bloque de la T-07 da la dirección estética por elegida, y en la fase sólo
están las dos imágenes de referencia de la T-03 —que fijaron dónde va cada
control, no cómo se ve— y el *"make it look a little more Pro"* que David
dijo sobre el marcador de los breaks. El skin se decidió con eso y con las
dos reglas del `brand/README.md`. No es un problema del resultado: es que
nadie que no sea Nicolás puede auditar contra qué se decidió, y David todavía
no lo vio.

### Lo que la fase 03 hereda

- **El piso que necesitaba para arrancar, hecho.** El `decoderCount` y el
  repliegue nacen del lado de la librería porque el corte ya existe, y el
  contrato es un documento de producto en `docs/`, así que ampliarlo es una
  versión del documento y no un parche adentro de la evidencia de una task.
- **El invariante que va a poner a prueba.** El ADR 0016 —la clase
  concurrente nunca cambia el largo de la línea de tiempo— está medido en la
  barra: 559,313 px de riel y 180,000 s releídos antes, durante y después de
  un break. La fase 03 mete un interstitial tradicional adentro del break,
  que es exactamente el caso que ese invariante no cubre.
- **`squeezebackFrame` sigue sin estar en el recorrido.** Es el layout que
  pone el aviso de fondo y el primario encima, es el sexto payload de la
  herramienta, y vive en los fixtures de los tests. Por eso el apilado de los
  controles se verificó con una sonda sintética y no con un break real, y por
  eso sigue en pie la recomendación 5 de la fase 01: si ese layout entra
  alguna vez, entra con un test.
- **La barra quedó seekeable y no lo pidió ningún bloque.** Se agregó porque
  una barra que no lleva a ningún lado se lee como rota. Son cinco líneas si
  se quiere sacar, y conviene decidirlo antes de la grabación y no durante.

### Lo que sigue abierto de antes y esta fase no tocó

- **iOS**, que David reabrió en la reunión del 2026-09-04 y quedó sin
  contestar. La fase de iOS hereda el límite del ADR 0015 y el contrato, no
  el código.
- **Los ADR 0011 y 0012**, en `proposed` esperando a David.
- **Los assets que faltan**, medidos en la evidencia de la T-12 de la fase
  01. Es lo único del proyecto que depende de alguien de afuera, y esa
  persona estuvo de viaje toda la fase.
- **La fecha del primer draft**, que la minuta fija el 21 de septiembre y el
  documento de requerimientos el 1.

## 5. Riesgos que se materializaron

Uno por uno, los cinco del `PHASE.md`.

**R1, un corte que se afirma en lugar de verificarse. No se materializó, y la
alarma sonó tres veces.** El corte no se cruzó sin que nadie lo notara,
porque el chequeo encontró cosas reales antes de que se volvieran costumbre:
en la T-04 el grep del ADR 0015 encontró un comentario que explicaba el
descarte del naranja con una razón de esta página metida adentro de un
archivo que se distribuye, y se corrigió en el momento; en la misma task el
grep del ADR 0003 dejó de dar cero, y Nicolás decidió que el término se queda
en la búsqueda y que los cinco lugares aceptados se registran, en lugar de
sacar el término y debilitar la única alarma que impide que las dos capas se
vuelvan a mezclar. Lo más cerca que el riesgo estuvo de materializarse fue en
la forma que el `PHASE.md` no nombró: **el chequeo corría sobre una lista de
archivos escrita a mano**, así que un archivo nuevo pasaba por no ser mirado.
Se cerró antes de que dejara pasar nada.

**R2, los controles pelean con el apilado de los layouts. No se
materializó.** Los controles quedaron en una capa hermana con
`z-index: 2147483000` —arriba del rango que el `zDepth` de un payload ajeno
puede tomar, no arriba del máximo visto— y sin tocarle el `z-index` a la capa
de avisos, que sigue en `auto` y por lo tanto sigue sin ser un contexto de
apilado. Verificado con la sonda sintética de la T-10 de la fase 01, que pone
el aviso de fondo y el primario encima: el aviso atrás, el primario adelante
y los cuatro controles arriba de los dos. **Con la salvedad de que el caso
real no existe en la demo**: ningún layout del recorrido pone el aviso de
fondo, así que la verificación es contra una sonda y no contra un break.

**R3, el fullscreen no existe y el que hay es del elemento equivocado. Se
materializó, en una forma adyacente a la que estaba escrita, y costó una task
que no estaba en el plan.** La consecuencia que el riesgo nombraba —que el
elemento que va a fullscreen dejara de ser la caja 16:9— no ocurrió, porque
las imágenes de referencia pusieron la barra adentro del marco. La que sí
ocurrió es del mismo hueco: como nunca había habido un camino a fullscreen,
nadie había medido nada ahí, y la primera medición encontró que el
renderizador tomaba el área del contenedor y no de la imagen. El síntoma era
el encuadre del primario saltando al entrar y salir de cada break, con la
imagen ocupando dos rectángulos distintos en el mismo player. La T-09 entró
al plan por eso, con número más alto que la T-04 y ejecutándose antes,
porque cambia la medición sobre la que se apoya todo el renderizado.

**R4, la barra se queda con un largo cacheado. No se materializó, y se lo
fue a buscar.** El largo se relee del contenido primario en cada pintada
(ADR 0016), y la T-06 escribió el test que lo destapa: los mismos diez rangos
sobre un programa de otro largo, con las dos lecturas —180 s y 360 s— tomadas
adentro del mismo test, una después de la otra, para que un largo cacheado en
la primera llamada falle sin importar desde dónde se corra el archivo. La
mutación que lo cablea murió con la aserción a la vista.

**R5, el skin es alcance propio y no salió de la reunión. Se materializó en
la mitad que no era la del calendario.** El riesgo estaba aceptado con la
condición de que, si el calendario apretaba, el skin era lo primero que se
recortaba; el calendario no apretó y el skin se hizo. Lo que sí pasó es lo
otro que el riesgo implicaba: la dirección estética no tiene fuente escrita,
la task la dio por elegida, y quien la audite no tiene contra qué. Está en la
sección 4.

**De los riesgos que cruzan fases del `PROJECT.md`, ninguno se materializó en
esta fase.** El de los assets ya se había materializado en la fase 01 y sigue
abierto sin que esta fase lo tocara, porque no era su trabajo.

## 6. Recomendaciones para la fase siguiente

1. **Decidir qué se hace con el global `Hls` antes de que un tercero
   integre.** Hoy la superficie pública recibe una instancia y la librería
   necesita el constructor, y la falla es de la clase que este proyecto ya
   decidió tratar como la peligrosa: silenciosa hasta el primer break. Las
   salidas son dos y ninguna es cara: aceptar el global como parte del
   contrato y verificarlo al `attach` como ya se hace con la configuración de
   interstitials, o pedir el constructor en las opciones. La segunda cambia
   la superficie que el ADR 0015 fijó, así que si se elige, se escribe.
2. **Acotar el borrado del atributo `style`.** Es el mecanismo del que
   depende la garantía de la T-09, así que no se saca: se acota a las
   propiedades que la librería puso, para que un estilo en línea del
   integrador sobreviva al break.
3. **Corregir el número del `README.md`.** La sección "The library, and the
   page that uses it" dice "and five lines:" arriba de un bloque de seis, y
   `docs/integrating-the-library.md` dice seis en dos lugares. Es una palabra,
   y este cierre no la aplicó porque su alcance era `.project/`. Ver la
   sección 8.
4. **Confirmar la mezcla del Quad con David antes de la grabación**, junto
   con la dirección del skin. Las dos son de las que se ven en cámara y las
   dos son baratas de cambiar antes y caras después.
5. **Considerar un ADR para los dos carriles de la barra.** Es la decisión de
   producto más discutible que la fase tomó, está bien argumentada y medida,
   y hoy vive en el documento de una task. Si la superficie del SDK se
   entrega, alguien la va a preguntar.
6. **La vara de la fase 03 no es la de esta.** Esta fase construyó una
   librería para entregar, con una campaña de mutación sobre lo que falla en
   silencio y capturas a tamaño real sobre lo que falla en la pantalla. La
   T-01 de la fase 03 es una medición para decidir, con vara de medición, y
   su primera pregunta es si el aviso lineal adentro del break obliga a
   reabrir un ADR de la fase 01.

## 7. Correcciones post-ejecución

`grep -n "post-ejecuci"` sobre el `TASKS.md` de la fase no devuelve ninguna
línea. **Ninguna de las nueve tasks necesitó una corrección después de
haberse declarado `done`**, igual que en la fase 01.

Leído como medición, dice dos cosas. La primera es que las definiciones de
done fueron observables: las cinco tasks de nivel `bajo` tienen su captura al
tamaño real de uso —y las de fullscreen tomadas en fullscreen de verdad, con
un click real, que es lo único que el navegador acepta como gesto de
usuario—, la de nivel `alto` tiene la lectura de `muted` y `volume` nodo por
nodo, y las de nivel `mínimo` tienen la corrida que la decisión necesitaba.
La segunda es más específica de esta fase: **cada task cerró con un bloque de
"lo que quedó anotado y no arreglado"**, y ahí es donde está lo que en otro
proyecto habría vuelto como corrección. Son veinticuatro observaciones en
siete de las nueve tasks, más los dos hallazgos de la T-08. Las que tocaban
una decisión terminaron como nota fechada en un ADR (sección 2), las que
tocaban el trabajo de otra task viajaron a esa task, y las que quedaban
vivas están en la sección 4.

Vale la pena separar dos casos que la convención trata igual y que acá no lo
son. **Una corrección al trabajo no hubo ninguna. Correcciones al registro
hubo cuatro**, y las cuatro se aplicaron donde correspondía sin reescribir lo
que la task había afirmado: las tres notas fechadas de los ADR y la nota que
la T-08 le agregó a la evidencia de la T-07 por el número corrido en uno.

## 8. Revisión de documentación

Superficie por superficie, con el resultado por superficie.

- **El índice de fases del `PROJECT.md`.** Actualizado en este pase. La línea
  de la fase 02 se reescribió para decir en qué terminó y no en qué consistía
  su plan: la librería cortada y verificada por un script, los controles
  adentro, el contrato en `docs/` y el documento del integrador. Se actualizó
  `last_update` a 2026-09-05. El `status` del proyecto queda en `ongoing`,
  porque quedan la fase 03, la grabación, la parte de iOS y la especificación
  de SVTA.
- **La sección "A confirmar" del `PROJECT.md`.** Actualizada en este pase con
  las dos preguntas que esta fase le devuelve a David y que le importan a
  alguien hoy: la mezcla del Quad, donde el contenido primario queda a 10, y
  la dirección del skin, que él no vio. Van en el documento vivo con un
  puntero acá, y no sólo acá.
- **El `PHASE.md` de la fase.** `status: closed` y `closed: 2026-09-05`. El
  cuerpo no se toca: es el contrato de la fase y describe correctamente lo
  que se propuso, incluido el R3 que se materializó en una forma adyacente a
  la que está escrita, que es información y no un error a corregir.
- **El `TASKS.md` de la fase.** Sin cambios: las nueve tasks ya estaban en
  `done` con su evidencia apuntada, y no hay líneas `post-ejecución:` que
  agregar.
- **El `LOG.md` del proyecto.** Entrada de cierre agregada.
- **`docs/` del proyecto.** Es la superficie que esta fase creó, y tiene los
  dos documentos que le corresponden: el contrato entre las dos capas, que es
  la arquitectura del producto, y cómo integrar la librería en una página que
  no es ésta. Los dos están al día con lo que la fase construyó, incluidos
  los dos requisitos que la T-08 encontró. No hacía falta nada más acá.
- **El `README.md` del repo.** Es el documento vivo del proyecto y las tasks
  lo fueron corrigiendo: la tabla de qué hay dónde con `lib/` y `dist/`, la
  sección de la grabación reescrita por el ADR 0014, el párrafo de los dos
  defaults, y la sección de las dos costuras. **Le queda un número mal**: la
  sección "The library, and the page that uses it" dice "and five lines:"
  arriba de un bloque de seis, mientras `docs/integrating-the-library.md`
  dice seis en dos lugares. El error viene de la T-01 y ninguna task
  posterior lo miró, porque el conteo de la página vivió siempre en la
  evidencia y no en el `README.md`. Este cierre no lo aplicó porque su
  alcance era `.project/`: es la recomendación 3.
- **`CLAUDE.md` del proyecto.** No existe y no hizo falta. Las convenciones
  del proyecto están en los ADR, en el `PHASE.md` de cada fase y en el
  `README.md`, y la fase no agregó ninguna que no tenga dueño.
- **`.project/knowledge/`.** No existe, y esta fase tampoco la crea. Es lazy
  y nada califica: las decisiones se las llevaron los ADR, el material que
  una fase posterior necesita leer es el contrato, y el contrato está en
  `docs/` porque es arquitectura del producto y no del trabajo.
- **El `CLAUDE.md` y el `knowledge/` del repo padre `cto-assistant`.** Sin
  cambios. Lo único de la fase con forma de regla general son los cinco
  errores de método de la sección 3 —el chequeo sobre una lista escrita a
  mano, la prueba del cuarto, la fila entera contra el centro redondeado, la
  alineación a píxel entero antes de un diff, y el `trap` que no puede
  dispararse—, y ninguno se promueve acá: proponer una regla y aplicarla son
  dos cosas distintas, y ésta es la propuesta.
- **Documento de install o runbook propio.** El proyecto no tiene
  `INSTALL.md` y no lo necesita: el setup es un comando y vive en el
  `README.md`, que sigue siendo el único punto de entrada. El documento del
  integrador no lo cambia, y por eso el `README.md` no lo referencia.
- **Los `tasks/` de la fase que cierra, marcados como registro.** Las nueve
  carpetas son evidencia de qué se corrió y qué dio, con sus sondas al lado
  para poder repetirlo, y no se reescriben. Ninguna tiene un `README.md` que
  se pueda leer como instrucción vigente, y **ninguna contiene el único
  documento vivo que produjo**, porque los dos documentos vivos de la fase
  nacieron directamente en `docs/`, que es la corrección de lo que la fase 01
  había dejado mal. Los `.md` de adentro son registro puro: la comparación
  línea por línea de la T-08, la campaña de mutación de la T-06, el skin de
  la T-07 —al que la T-08 le agregó una nota fechada sin reescribir lo que
  afirmó— y las mediciones de las demás.
