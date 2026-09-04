# Informe de cierre — fase 01: POC funcional en web con hls.js

Fase abierta el 2026-09-03 y cerrada el 2026-09-04. Doce tasks, las doce
en `done`. Dieciséis commits en el work tree del proyecto, ninguno
pusheado.

## 1. Resumen

**El POC existe y anda.** Los cinco layouts del documento de
requerimientos aparecen en **una sola corrida de punta a punta, sin un
solo seek**: la página se carga una vez, llega sola a cada uno de los
cinco breaks y de cada uno sale una captura a tamaño real. No es una
promesa del script sino una lectura de la página, en
`tasks/T-12/t12-sin-seek.json`: el elemento de video primario lleva un
contador de eventos `seeking` y la corrida termina con la lista vacía,
con una sola carga y sin un error de consola. Y avanza al reloj de pared,
160,0 s de programa en 160,15 s de pared, o sea 0,999.

Al lado, en la misma página y sobre **la misma URL** —la misma constante
en el código, impresa debajo de cada player—, una instancia de hls.js de
fábrica que reproduce el aviso lineal de cada break. Es el argumento más
fuerte de la demo y no es visual: esto se despliega sin romperle nada a
los clientes que ya están en el mercado.

Eso es el **escalón 1 de la escalera de repliegue** del `PHASE.md`, que
es el que se graba. Los cuatro escalones se pararon en orden y cada uno
quedó atado a una task: el piso en la T-07, el 3 en la T-10, el 2 en la
T-11 y el 1 en la T-12.

La cadena entera es visible en la pestaña de red, que es lo que el
documento de requerimientos pide para la plataforma web: 207 respuestas
en la corrida del recorrido, las 207 con 200, entre la media playlist,
los cinco asset-list de clase concurrente que pide la aplicación, el de
clase Apple que pide el player de fábrica con su `?_HLS_primary_id`, los
contenidos de aviso con sus segmentos y los dos `.jpg` como `image/jpeg`.

hls.js entró **sin modificar**, en la versión 1.7.2, con su controlador de
interstitials apagado por configuración (`interstitialsManager` en
`null`). El repositorio no tiene bundler, ni framework, ni una sola
dependencia de npm.

La fase cerró **diecisiete días antes** del hito del primer draft del 21
de septiembre, que es el hito contra el que estaba planificada.

## 2. Decisiones tomadas

Trece ADR, todos escritos en esta fase. Doce salieron del `DESIGN.md` en
el evento de generación; el 0013 lo decidió la T-04 con los resultados de
las tres mediciones en la mano.

| id | título | status | scope |
| --- | --- | --- | --- |
| 0001 | Renderizar la experiencia concurrente en el DOM sobre el video | accepted | phase-01 |
| 0002 | Apagar la maquinaria de interstitials de hls.js y manejar los Date Ranges por cuenta propia | accepted | phase-01 |
| 0003 | Separar señalización y renderizado en dos capas con un contrato entre ellas | accepted | phase-01 |
| 0004 | Consumir el asset-list tal como lo emite el Layout Controller de SVTA | accepted | phase-01 |
| 0005 | Hacer el POC sobre VOD con los Date Ranges escritos en la media playlist | accepted | phase-01 |
| 0006 | Escribir los Date Ranges como DateRange Objects válidos | accepted | phase-01 |
| 0007 | Mostrar la compatibilidad hacia atrás con dos players sobre el mismo manifiesto | accepted | phase-01 |
| 0008 | Fijar el mínimo en un layout de overlay y ordenar el trabajo del riesgo conocido al desconocido | accepted | phase-01 |
| 0009 | Tratar la clase concurrente como hermana de la de interstitial, no como una extensión | accepted | **project** |
| 0010 | Arrancar el aviso concurrente en silencio y dejarle el audio al contenido primario | accepted | phase-01 |
| 0011 | Repartir los layouts entre el primer draft y la grabación por mecanismo | **proposed** | phase-01 |
| 0012 | Mapear los cinco layouts del documento de requerimientos al campo `type` del payload | **proposed** | phase-01 |
| 0013 | Llenar la caja del layout con recorte centrado y sin deformar el asset | accepted | phase-01 |

El **0009 es de alcance proyecto** y contradice al documento de
requerimientos de David en un punto explícito: en HLS la clase del
DATERANGE se compara por igualdad exacta de string y el formato no tiene
herencia, así que "extensión" promete una compatibilidad que el protocolo
no puede dar. Es material para la especificación de SVTA.

Los **0011 y 0012 siguen en `proposed`** porque son propuestas a David y
esperan su confirmación. La fase se construyó entera sin necesitar esa
respuesta, que es lo que el 0012 anticipa: el código lee el `type` que
viene en el JSON y no necesita saber cómo lo llama el documento de
requerimientos.

### Qué le hizo la construcción a las decisiones

- **La predicción central del ADR 0008 se puede dar por validada, y en
  líneas de código.** El ADR ordena el trabajo del riesgo conocido al
  desconocido y anticipa que, una vez que los mecanismos anden, agregar
  layouts es trabajo de datos. El tercer mecanismo, el multiview, entró
  **sin una sola línea de código**: `git diff --stat` entre la T-10 y la
  T-11 sobre `js/`, `css/`, `index.html` y `test/` no devuelve nada, y el
  diff son el asset-list de `multiView` y un comentario en el script que
  escribe la playlist. Y la task de los cinco layouts fueron **24 líneas
  de código en dos archivos**, todas del asset de imagen: el diff son 52
  inserciones y 12 borrados, y la diferencia entre 52 y 24 es comentario
  (el desglose está en `tasks/T-12/t12-corte-entre-capas.txt`). Los cinco
  breaks, los cinco Date Ranges, los dos asset-list nuevos y el recorrido
  entero no aparecen en el diff de código: son datos.
- **El corte en dos capas del ADR 0003 se verificó, no se afirmó.** El
  mismo grep corrió en **seis** tasks —T-06, T-07, T-09, T-10, T-11 y
  T-12, un archivo `*-corte-entre-capas.txt` por task— y del lado del
  renderizado dio siempre cero hits de hls.js, Date Range, asset-list,
  manifiesto o `EXT-X`. Los tres contadores del otro lado terminaron en
  19, 22 y 30, iguales en las últimas tres tasks: el asset de imagen no
  le enseñó al renderizado una palabra del transporte.
- **El ADR 0001 ganó un límite que no decía.** La transformación de CSS
  achica el contenido primario sin deformarlo sólo mientras su caja
  conserve la relación de aspecto del área del player; si no la conserva,
  la escala es distinta en cada eje y el modo de llenado no puede
  salvarla, porque la transformación escala lo que `object-fit` ya
  dibujó. En los seis payloads de la herramienta no se dispara, y el
  renderizador avisa por consola en vez de deformar en silencio.
- **El ADR 0010 encontró dos casos que no cubre**, y ninguno lo
  contradice. Uno es el aviso sin audio: los dos assets del LBox image
  son cuadros fijos y no hay nada que encender, así que el botón lo dice
  en lugar de quedar gris como si no hubiera aviso en pantalla. El otro
  es cuál de varias fuentes concurrentes se escucha, que es pregunta para
  SVTA y está en la sección 4.
- **El ADR 0013 se midió en sus dos extremos.** Las dos barras del
  `squeezebackLShape` son las cajas más lejanas de la relación de aspecto
  de un asset entre las quince que midió la T-03 —0,7111 y 4,4444 contra
  1,7778— y con recorte centrado cada una deja afuera el 60 % del asset
  con cero estiramiento; los cuatro cuadrantes del `multiView` conservan
  el aspecto y el recorte es 0 %. Entre el mismo cuadro dibujado con
  recorte y dibujado estirado cambia el 55,27 % de los píxeles, así que
  la constante no es decorativa. Y la política trata igual a una imagen
  que a un video: los dos breaks del LBox dejan afuera el mismo 60 %.

## 3. Tasks

| id | qué dejó | escalón |
| --- | --- | --- |
| T-01 | Hasta cinco elementos de video de 1280x720 a 30 fps, cada uno con su instancia de hls.js, reproducen a la vez al 99,6 % del reloj de pared. Cierra el riesgo R2. | — |
| T-02 | Confirmado en ejecución lo que era lectura de código: la instancia de fábrica agenda sólo el aviso lineal, las dos reciben los dos Date Ranges completos, y el controlador de interstitials se apaga por configuración. | — |
| T-03 | Cero píxeles de diferencia entre la caja del modelo y la que dibuja el navegador en los quince elementos de los seis tipos. Y lo que el modelo no dice: cómo llena un asset una caja cuya relación de aspecto no es la suya. | — |
| T-04 | El plan de construcción, ocho tasks, y el ADR 0013. | — |
| T-05 | El banco: repo, página, servidor de archivos estáticos, contenido empaquetado, un comando. | — |
| T-06 | La capa de señalización, `js/signalling.js`, y el contrato escrito. | — |
| T-07 | El primer aviso en pantalla, `cornerOverlay`, con la cadena completa en la red y el control de audio del ADR 0010. | **4, el piso** |
| T-08 | Quince tests sobre las funciones puras de la resolución del layout, los quince vistos en rojo antes de darlos por buenos. | — |
| T-09 | El par de compatibilidad en la página, los dos etiquetados, el instante atrapado en una sola captura. | — |
| T-10 | El squeezeback, con el contenido primario movido por una transformación. | **3** |
| T-11 | El multiview, cuatro cuadrantes a la vez, sin una línea de código. | **2** |
| T-12 | Los cinco layouts en una sola corrida grabable. | **1, el que se graba** |

Ninguna task quedó abandonada ni bloqueada.

### Lo que se aprendió midiendo, que es lo que sobrevive a la fase

**El cero de la geometría se sostuvo por todo el camino.** La T-03 midió
cero píxeles de diferencia entre la caja que describe el modelo de
porcentajes de SVTA y la que dibuja el navegador, en los quince elementos
de los seis tipos. Después, ya con el contrato del ADR 0003 en el medio,
cuatro tasks seguidas volvieron a medir **0,00 px** entre la caja que el
contrato pide y la que el DOM reporta: 2 elementos en la T-07, 3 en la
T-10, 4 en la T-11 y 14 en la T-12, veintitrés en total, y las cuatro
repitieron el cero **después de un resize**, que es lo que prueba que la
conversión se recalcula y no está cableada. Dos de esas veintitrés cajas
no son un elemento de video sino un `<img>`. La cuenta de los porcentajes
se hizo siempre aparte del renderizador, para que el cero no sea el
renderizador comparándose consigo mismo.

**La concurrencia mejoró respecto de la medición original.** La T-01
midió en un banco de pruebas cinco elementos al 0,996 del reloj de pared
con cuatro cuadros descartados por elemento en doce segundos. La T-11
midió lo mismo donde importa, que es la página que se va a grabar: cinco
elementos de video y **cinco instancias de hls.js** en la misma pestaña
—los cuatro del layout más el player de fábrica del par—, 0,999 del
reloj de pared, 30,0 fps, **cero cuadros descartados**, cero corruptos y
ningún error. En el medio, la T-09 había medido tres elementos al 100,0 %
con cero descartados y con un controlador de interstitials encendido en
una de las instancias, que es justamente lo que la T-01 no tenía.

**El invariante de apilado muerde, y lo que lo evita es una palabra.**
Una transformación de CSS crea un contexto de apilado propio pero **no**
posiciona el elemento, y `z-index` en un elemento estático se ignora, así
que un contenido primario achicado solamente con la transformación pierde
su `zDepth`. Está medido con el caso que ningún layout de la herramienta
ejercita: con el primario posicionado, el elemento de atrás ocupa el
63,85 % del cuadro, que es exactamente el 64 % que queda afuera de la
caja del primario; sacándole el `position` pasa al 99,73 % y el contenido
primario desaparece detrás del aviso.

**Los tres mecanismos del ADR 0008 son dos caminos de código.** El ADR los
separa por lo que hacen en pantalla, y para ordenar el trabajo por riesgo
eso fue lo correcto. En el renderizador, un multiview es un squeezeback
con cuatro cajas: mover el primario a su caja lo aprendió la T-10 y
dibujar N assets posicionados lo sabía desde la T-07.

**El cliente de mercado paga el programa que reemplaza, y se ve en un
cuadro.** Nadie fue a buscar este argumento. Cuando el aviso lineal
termina, la instancia de fábrica vuelve al primario donde lo había dejado
—es lo que pide su `X-RESUME-OFFSET=0`— mientras la de la demo no se
perdió nada. Al final de la corrida de 160 s, con cuatro breaks
reemplazados, el player de fábrica va **49,47 s de programa atrás**: los
dos en el contenido primario y en escenas distintas del mismo film.

### Los errores de método que la fase encontró, porque valen para la próxima

- **Un instrumento se declaró confiable antes de correr el control que
  faltaba.** La T-07 leyó el cero de `parec` sobre el monitor del sink
  como "cero bytes cuando algo suena" y lo escribió como una propiedad
  del entorno. La T-11 corrió el estado que faltaba, el de nada sonando,
  y el cero apareció igual: el instrumento anda a veces y no otras en
  esta sesión, así que no se apoya nada en él. Hay además una razón de
  fondo para no volver por ese camino, y es anterior al instrumento: el
  monitor del sink graba la **mezcla**, así que incluso funcionando diría
  que algo suena y no cuál de los cuatro elementos.
- **Una afirmación deja de ser cierta cuando cambia el escenario, y está
  bien que así sea.** La T-06 y la T-07 anotaron que el asset-list del
  Date Range de clase Apple no lo pedía nadie. Dejó de ser cierto en la
  T-09, cuando existió el segundo player: ahora lo pide la instancia de
  fábrica, y de quién es cada pedido se distingue a simple vista porque
  el de la de fábrica lleva el `?_HLS_primary_id=<uuid>` que hls.js le
  agrega y el del concurrente, que lo pide la aplicación con `fetch`, no
  lleva nada.
- **Una suite puede tener un punto ciego que sólo la mutación destapa.**
  La T-08 rompió a mano una cosa por vez, dieciocho veces, y encontró que
  una mutación que cablea el 960 pasa los quince elementos: todas las
  cajas medidas eran de una sola resolución. El test que faltaba corre
  las mismas cajas reales al doble del área.
- **La luminancia como criterio único elige mal.** El instante más claro
  de *Caminandes* en toda la película es su placa de agradecimientos:
  mide 180 sobre 255, es perfectamente estable, y en pantalla se lee como
  que el reproductor está mostrando los créditos de algo. El criterio
  quedó como filtro y no como decisión, y los cuadros fijos se eligieron
  mirándolos.
- **Un dato de un banco de pruebas no es un dato de la página.** El
  script de empaquetado de la T-01 tenía como entrada cinco fuentes
  sintéticas de `testsrc2`, que era lo correcto para contar
  decodificadores y es lo contrario de lo que una demo grabada necesita.
  Se reusó su invocación de ffmpeg verbatim y se le cambió la entrada.
- **Y una trampa de entorno que va a encontrar cualquiera que repita la
  T-01:** con la pestaña en segundo plano, un solo video de 720p avanza
  al 2,7 % del reloj de pared y `document.visibilityState` sigue
  diciendo `visible`. La corrida de control con un solo elemento es lo
  que lo destapó.

## 4. Lo que queda abierto: las preguntas para David y para SVTA

Esta sección es lo más accionable del informe. Nada de lo que sigue
bloquea la construcción; todo lo que sigue cambia lo que se muestra, lo
que se escribe para SVTA o lo que David dice en escenario.

### Para David, y esperan su confirmación

1. **La fecha del primer draft.** El documento de requerimientos dice
   "First draft of demos Sept 1" y la minuta del 2026-09-02 fija el lunes
   21 de septiembre. Están a veinte días una de otra sobre un proyecto de
   cinco semanas y la del documento ya pasó. La fase se planificó contra
   el 21 y cerró el 4 de septiembre, así que la pregunta dejó de ser
   urgente para esta fase, pero sigue sin contestar para el resto.
2. **El ADR 0011, el reparto de layouts entre el draft y la grabación.**
   Sigue en `proposed`. La propuesta era un layout de cada mecanismo en el
   draft y los cinco en la grabación; el POC pasó de largo esa línea y
   hoy están los cinco. Lo que queda por confirmar es si esos cinco son
   los cinco que él quiere mostrar.
3. **El ADR 0012, el mapeo de los cinco nombres al campo `type`.** Sigue
   en `proposed`, y la T-12 volvió la pregunta más filosa en dos puntos:
   - **Los dos LBox son el mismo layout hasta el MIME del asset.** Los
     dos breaks declaran el mismo `type` (`squeezebackLShape`), los
     mismos tres elementos, los mismos `viewport` y los mismos `zDepth`.
     El único campo que difiere en todo el payload es el `type` de cada
     asset: `application/vnd.apple.mpegurl` contra `image/jpeg`. La línea
     del contrato que la página imprime debajo del player es **idéntica**
     en los dos, así que quien audite la consola no puede distinguir LBox
     video de LBox image más que por la URI. Si el documento de
     requerimientos quiere que sean dos layouts con nombre propio, hoy no
     hay en el payload nada que los nombre.
   - **`squeezebackFrame`** es el único de los seis identificadores de la
     herramienta que el recorrido no ejercita, porque no tiene correlato
     en ninguno de los cinco nombres del documento. Su `primaryContent`
     vale `"20 20 20 20"`: el contenido se achica por los cuatro lados y
     el aviso ocupa el fondo. Sigue exactamente donde el ADR 0012 lo
     dejó.
4. **Assets, con números.** El recorrido corre completo con material de
   la Blender Foundation, y cuatro de los cinco layouts quedan bien.
   Falta material para dos cosas distintas, y el pedido detallado está en
   `tasks/T-12/t12-los-assets-que-faltan.md`:
   - **El Quad se queda sin material y no hay con qué arreglarlo desde
     acá.** Consume los tres assets de aviso de una sola vez, porque el
     cuarto cuadrante es el contenido primario, así que la salida que usó
     la T-10 —cambiar el asset oscuro por otro— en este layout no existe.
     Y no es la ventana elegida sino la fuente: en los 75 segundos del
     teaser de *Elephants Dream* no hay un solo instante que llegue a 46
     de luminancia sobre 255, la película entera promedia 15,0 y su mejor
     ventana de doce segundos promedia 24,9. **El pedido es un creativo
     de video de doce segundos, 1280x720 o más, con luminancia media
     arriba de 100.** Con dos, el recorrido además deja de repetir el
     mismo clip en breaks distintos. El piso por instante que ese archivo
     pide hay que pedirlo como criterio deseado y no como el estándar que
     el material actual cumple: la razón está en la sección 7.
   - **El LBox con video, que David marcó como el más difícil de
     conseguir, hoy está cubierto recortando el 60 % de un clip de
     16:9.** Lo que está en pantalla es un fragmento de una película y no
     un creativo pensado para una caja de 0,71 a 1, y que se vea bien es
     una elección de encuadre hecha a mano. Lo que falta ahí no es luz:
     es un creativo hecho para la forma de la barra.
5. **Quién hace el primer pase de la especificación de SVTA.** Sin owner.
   Es el frente que David puso al final y que tiene la misma fecha límite
   que el más alto.
6. **Qué significa `version: 2`** en el bloque `X-AD-CREATIVE-SIGNALING`.

### Para SVTA, sobre el formato

7. **Cuál de las fuentes concurrentes se escucha.** El control de audio
   del ADR 0010 es uno para todo el aviso, y en el `multiView` enciende
   tres fuentes a la vez. El modelo de la herramienta tiene un `volume`
   **por elemento** y la T-03 midió que no lo emite en ninguno de los
   seis layouts, así que una mezcla por cuadrante la decidiría el
   reproductor y no la señalización. La pregunta es de quién es esa
   decisión y cómo se expresa. El multiview es el layout que la vuelve
   concreta.
8. **El `volume` que el modelo tiene y la herramienta no emite nunca.**
   Es la otra mitad de lo anterior y vale por separado: el default que la
   capa asume es 100, y con ese default el ADR 0010 leído literalmente
   daría un aviso a todo volumen. La demo manda la otra mitad del mismo
   ADR y arranca en silencio, pero el formato no dice cuál de las dos
   lecturas es la correcta.
9. **Cómo llena un asset una caja cuya relación de aspecto no es la
   suya.** Es el hueco que encontró la T-03 y que el ADR 0013 decidió
   **para la demo** sin tomar posición sobre el formato. Mientras el
   modelo no diga por asset el modo de llenado o la relación de aspecto
   para la que el creativo está pensado, dos clientes que cumplen la
   especificación dibujan el mismo layout distinto. El LBox es el layout
   donde deja de ser teórico.
10. **Dónde va un asset que es una imagen.** El LBox image inserta un
    `image/jpeg` y el bloque `X-AD-CREATIVE-SIGNALING` lo expresa sin
    problema, pero el `URI` del `ASSET` que lo contiene es un campo de HLS
    y espera algo reproducible: un cliente que ignore el bloque de layout
    reproduciría ese URI. Hoy el asset-list del LBox image declara ahí un
    video, que es lo que un despliegue real pondría de repliegue, y el
    formato no dice si eso es correcto o si un aviso de imagen tiene otra
    forma de declararse.
11. **La divergencia de modelos de coordenadas entre HLS y DASH.** La
    herramienta de SVTA para HLS usa porcentajes de inset sobre el área
    del player, y la especificación de SGAI para DASH que Nicolás diseña
    en `projects/sgai-for-mpeg-dash/` decidió un viewport de referencia en
    píxeles. Son dos modelos para el mismo problema. Es el R4 de la fase
    y no bloquea nada de código.
12. **Si el layout debería viajar en el propio DateRange Object** en vez
    de en el asset-list.

### Para quien grabe

13. **Un artefacto de decodificación sin causa establecida.** En uno de
    los seis cuadros del par, el de los 160 s, el panel de fábrica
    muestra bloques verdes y magenta sobre el cuadro entero mientras el
    panel de la demo dibuja el mismo contenido sin un defecto. Los
    segmentos son los mismos archivos para los dos clientes y el nuestro
    los reproduce limpios, así que el artefacto es de esa instancia y no
    del contenido. Qué lo produce, esta medición no lo dice, y no se le
    inventa una causa. Si aparece en la grabación, el cuadro que se usa
    es otro.

## 5. Riesgos que se materializaron

**Ninguno de los cuatro riesgos del `PHASE.md` se materializó.** Uno por
uno, y con el número donde lo hay:

- **R1, el calendario.** No se materializó: la fase cerró el 2026-09-04,
  diecisiete días antes del hito del 21 de septiembre contra el que
  estaba planificada, y con el escalón más alto de la escalera parado en
  lugar del piso. Lo que sigue en pie del R1 no es el calendario de esta
  fase sino la discrepancia de fechas del primer draft, que es la
  pregunta 1 de la sección 4.
- **R2, la concurrencia de decodificadores.** **No se materializó, y el
  número es 0,999.** Era el riesgo que podía sacar el multiview de la
  demo. La T-01 lo midió antes de comprometer el plan: cinco elementos al
  0,996 del reloj de pared con cuatro cuadros descartados por elemento en
  doce segundos, sin errores. La T-11 lo volvió a medir en la página que
  se va a grabar, con cinco elementos de video y cinco instancias de
  hls.js en la misma pestaña: **0,999 del reloj de pared, 30,0 fps, cero
  cuadros descartados, cero corruptos, ningún error**. La corrida entera
  del recorrido de la T-12 dio el mismo 0,999 sobre 160 s. El riesgo se
  cerró midiendo, y la segunda medición salió mejor que la primera.
- **R3, la plataforma.** No se materializó. La respuesta de Rob Walch
  cerró la incógnita antes de que la fase empezara a construir
  —cualquiera de las dos plataformas sirve para una demo— y el diseño
  decidió no apoyarse en la maquinaria de interstitials (ADR 0002), así
  que la diferencia entre hls.js y AVFoundation no bloqueó nada. El
  riesgo residual sigue aceptado: si la demo se mudara entera a iOS, el
  trabajo de renderizado web no se recupera.
- **R4, la divergencia con el trabajo de DASH.** No se materializó porque
  no podía: es una pregunta de especificación y no de código, y el POC
  consumió el modelo de la herramienta tal como lo emite (ADR 0004). Está
  en la sección 4 como pregunta 11.

**Y un riesgo de los que cruzan fases que sí se materializó, en parte:**
el del `PROJECT.md` sobre los assets del L-box con video, que David marcó
como el más difícil de conseguir. Se materializó en dos formas y ninguna
paró la fase: el LBox con video quedó cubierto recortando el 60 % de un
clip de 16:9 en lugar de con un creativo hecho para la barra, y el Quad
se quedó directamente sin material utilizable. La mitigación funcionó
como estaba escrita —el relevamiento entró temprano y la falta se
descubrió con tiempo de buscar alternativas—: lo que falta está medido,
con números, en `tasks/T-12/t12-los-assets-que-faltan.md`.

## 6. Recomendaciones para la fase siguiente

1. **Promover el contrato del ADR 0003 a los documentos propios del
   proyecto.** Hoy vive en `tasks/T-06/t06-contrato.md`, dentro de la
   evidencia de una fase que acaba de cerrar, y es el único documento
   vivo de la fase que está en un lugar de registro. La fase de iOS lo va
   a necesitar: es la superficie que define qué consume el renderizado y
   qué le toca a la capa de transporte, y es exactamente la pieza que
   cambia al pasar de hls.js a AVFoundation. El `PHASE.md` había dicho
   que el documento de arquitectura del producto se escribe cuando el
   contrato exista de verdad; ahora existe.
2. **Corregir el `README.md`, que es documento vivo y quedó con un número
   mal.** Su sección `Before you record` dice que el cliente de fábrica
   reemplaza cinco veces en el recorrido, y son cuatro (ver sección 7).
   Es una línea, y la lee quien graba.
3. **Cerrar las preguntas 2, 3 y 4 de la sección 4 con David antes de la
   ventana de grabación**, en ese orden de urgencia. La 4, la de los
   assets, es la única que necesita que alguien de afuera consiga algo, y
   por eso es la que hay que soltar primero.
4. **No volver por el camino de medir el audio con el monitor del sink.**
   No es sólo que el instrumento no anda en esta máquina: graba la
   mezcla, así que incluso funcionando no dice cuál de los elementos
   suena. Si hay que sostener la afirmación de qué se escucha, el camino
   es medir por elemento.
5. **El invariante de apilado no lo cubre ningún test**, y es lo único
   del renderizado que puede romperse sin que nadie lo vea hasta que un
   layout con el aviso de fondo aparezca en pantalla. Hoy lo sostienen un
   comentario en cada una de las dos puntas y la medición de la T-10. Si
   `squeezebackFrame` entra alguna vez, entra con un test.
6. **La vara de POC vale para esta fase y no se hereda sola.** Lo que
   quedó afuera a propósito —performance, manejo de errores más allá de
   que no se rompa en cámara, abstracciones para casos que la demo no
   muestra— quedó afuera porque ninguna decisión de hoy lo necesitaba. La
   fase que convierta esto en librería lo vuelve a decidir.

## 7. Correcciones post-ejecución

El grep de la fase (`grep -n "post-ejecuci"` sobre el `TASKS.md`) no
devolvía ninguna línea antes de este cierre: **ninguna de las doce tasks
necesitó una corrección después de haberse declarado `done`**. Leído como
medición y no como registro, dice que las definiciones de done fueron
observables y que la verificación se hizo antes de flipear el estado y no
después. Las cuatro tasks de renderizado, todas de nivel `bajo`, tienen
su captura al tamaño real de uso, y las de nivel `mínimo` tienen la
corrida que la decisión necesitaba.

Este cierre agregó dos líneas, las dos sobre la T-12, y las dos son
correcciones al **registro** y no al trabajo:

- **El cliente de fábrica reemplaza cuatro veces en la corrida, no
  cinco.** El resultado de la T-12 dice cinco y después cita los 49,47 s
  de atraso, y los dos números no pueden ser ciertos a la vez. La
  evidencia decide: en `tasks/T-12/t12-sin-seek.json`, al final de la
  corrida el player de fábrica está en 110,54 s de programa, o sea antes
  del `START-DATE` del quinto break, que está a los 120 s. Cruzó los
  breaks de 20, 45, 70 y 95, y los 49,47 s de atraso son 12,37 s por
  break sobre cuatro breaks, que es el mismo 12,4 s que el propio párrafo
  cita. Tiene una consecuencia para la grabación y por eso importa: con
  ese atraso acumulado, el panel de fábrica llegaría al quinto break
  alrededor del segundo 170 del reloj del nuestro y no lo terminaría
  antes de que el VOD de 180 s se acabe, así que **el quinto aviso lineal
  no se ve nunca en el panel de la izquierda dentro del recorrido**. El
  `README.md` arrastra el mismo cinco y hay que corregirlo ahí, que es
  donde lo lee quien graba.
- **El piso de luminancia que el pedido de assets le pide a David es más
  exigente que lo que mide el material que la demo ya usa.**
  `tasks/T-12/t12-los-assets-que-faltan.md` pide un creativo "sin ningún
  instante por debajo de 40" y lo justifica diciendo que es lo que miden
  los otros dos, y su propia tabla le da a adA (*Sintel*) un mínimo de
  10,8. El barrido fuera del navegador da 11,2 para esa ventana, y el
  barrido adentro del navegador lo baja a 21,3 en la barra horizontal del
  break del LBox video y a 5,4 en su cuadrante del Quad. Del material
  actual, el único que cumple ese piso es adB (*Caminandes*, mínimo
  107,7); el criterio de media arriba de 100 sí lo cumplen los dos. El
  pedido queda en pie —el piso por instante es la propiedad que
  distingue un creativo grabable de uno que se apaga en cámara— pero se
  le pide a David como criterio deseado y no como el estándar que el
  material actual ya cumple. Y hay una consecuencia para la grabación,
  que es la razón por la que el número no se puede dejar pasar: las
  capturas de la fase se toman en el instante más claro de cada ventana,
  lo cual es legítimo para una captura y no lo es para una grabación, que
  muestra los doce segundos enteros. Queda anotado con fecha al pie del
  propio archivo del pedido, sin tocar su tabla, porque la tabla es la
  medición.

## 8. Revisión de documentación

Superficie por superficie, y con el resultado por superficie.

- **El índice de fases del `PROJECT.md`.** Actualizado en este pase. La
  línea de la fase 01 se reescribió para decir en qué terminó la fase y
  no en qué consistía su plan: los cinco layouts en una sola corrida, el
  par de compatibilidad al lado, y hls.js sin modificar. Se actualizó
  también `last_update` a 2026-09-04. El `status` del proyecto queda en
  `ongoing`, porque quedan la grabación, la parte de iOS y la
  especificación de SVTA.
- **La sección "A confirmar" y la de assets del `PROJECT.md`.**
  Actualizadas en este pase, y por una razón de forma: las preguntas de
  la sección 4 de este informe le importan a alguien **hoy**, y un
  informe de fase cerrada no es donde nadie las va a buscar. Quedan en el
  documento vivo con un puntero acá, en lugar de sólo acá.
- **El `PHASE.md` de la fase.** `status: closed` y `closed: 2026-09-04`.
  Nada más: su cuerpo es el contrato de la fase y describe correctamente
  lo que la fase se propuso, incluida la escalera de repliegue contra la
  que se midió el resultado.
- **El `LOG.md` del proyecto.** Entrada de cierre agregada.
- **El `README.md` del repo.** Es el documento vivo del proyecto y ya
  lleva el runbook de la grabación que escribió la T-12: cómo se levanta,
  la tabla de los cinco breaks, y las tres cosas que hay que saber antes
  de que la cámara arranque. **Le falta una corrección de un número** —el
  cliente de fábrica reemplaza cuatro veces y no cinco, ver sección 7— y
  este cierre no la aplicó porque su alcance era `.project/`. Es la
  recomendación 2.
- **`docs/` del proyecto.** No existe, y no se creó acá. Lo que iría ahí
  es el documento de arquitectura del producto, y su contenido existe hoy
  como el contrato del ADR 0003 en la evidencia de la T-06. Moverlo es la
  recomendación 1 y le toca a la fase que lo necesite.
- **`CLAUDE.md` del proyecto.** No existe y no hizo falta. El proyecto no
  tiene convenciones propias de agente que no estén ya en el `PHASE.md`,
  en los ADR o en el `README.md`.
- **`.project/knowledge/`.** No existe. Es lazy y nada de esta fase
  califica: los ADR se llevaron las decisiones, el `DESIGN.md` se llevó
  la exploración, y el único material que va a leer una fase posterior es
  el contrato, que va a `docs/` y no acá porque es arquitectura del
  producto y no del trabajo.
- **El `CLAUDE.md` y el `knowledge/` del repo padre `cto-assistant`.**
  Sin cambios, y sin nada que cambiar: la fase no descubrió ninguna
  regla, política ni convención que aplique fuera de este proyecto. Lo
  que aprendió es de HLS, de hls.js y del formato de SVTA.
- **Documento de install o runbook propio.** El proyecto no tiene un
  `INSTALL.md` separado y no lo necesita: el setup es un comando y vive
  en el `README.md`, que es el único punto de entrada. Escribir un
  segundo documento con el mismo comando adentro es la forma en que un
  punto de entrada se despega.
- **Los `tasks/` de la fase que cierra, marcados como registro.** Las
  doce carpetas son evidencia de qué se corrió y qué dio, con sus scripts
  al lado para poder repetirlo, y no se reescriben. Ninguna tiene un
  `README.md` que se pueda leer como instrucción vigente. De los tres
  `.md` que hay adentro, dos son registro puro —`t08-vistos-en-rojo.md`,
  que es la tabla de las dieciocho mutaciones, y
  `t12-los-assets-que-faltan.md`, que es una medición fechada y al que
  este cierre le agregó una nota fechada al pie sin tocar su tabla— y el
  tercero, `t06-contrato.md`, es el que **no** es registro: es la única
  instrucción viva de la fase, y por eso está en la recomendación 1 en
  lugar de quedar marcado acá.
