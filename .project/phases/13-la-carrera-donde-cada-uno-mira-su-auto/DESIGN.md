# Diseño — fase 13: la carrera donde cada uno mira su auto

La fase 11 construyó el mecanismo: el que publica ofrece un catálogo y quien mira arma
su composición. Lo probó con cinco tramos de tres películas de Blender, que es material
que ya estaba en disco. Esta fase le pone el caso de uso que el mecanismo estaba
esperando, y ese caso de uso **no existe como material**: hay que producirlo.

El propio repositorio ya lo tenía nombrado. `demo/multiview-offer/scripts/preparar-contenido.sh`
dice, en su cabecera, que su propiedad de armarse en una tarde *"es la diferencia con la
demo de la carrera, que sí lleva ir a buscar material"*, y el `DESIGN.md` de la fase 11
anota que Nicolás la dejó para después porque *"eso lleva ir a buscar videos"*. El campo
`name` por vista del asset-list existe por este caso: *"donde el nombre de la cámara es el
nombre del competidor"*.

Así que el diseño de esta fase es, casi entero, **el diseño de una producción de video**.
Lo demás es copiar un molde que ya está probado.

---

## 1. Qué pidió Nicolás, y qué de eso ya estaba decidido

El pedido, resumido de su audio: una carrera de autos, cámara principal que va cambiando
entre los autos que pasan, dos relatores contando lo que ocurre, y en un momento los
relatores anuncian que se habilitaron las cámaras. Ahí se abre el multi view con **seis
opciones** de cámaras de autos distintos, y quien mira elige cuáles ver además del
programa. Primero la versión web, porque hay que generar todos los videos; después se
publica; y con los videos ya publicados se hace la de iOS.

Tres cosas del pedido chocan con decisiones ya escritas, y ganan las escritas:

**"Hasta cuatro cámaras" son cuatro cajas contando el programa.** El ADR 0066 fija que el
tope de cuatro es de pantalla y no de oferta, y el ADR 0065 fija la grilla. `MAX_BOXES`
sale de la tabla `VIEWPORTS_BY_COUNT` de `lib/signalling.js` y no hay campo de
señalización ni opción de `attach()` que lo mueva. Así que la demo es **programa + tres
cámaras**, y el catálogo declara seis.

**Y que el catálogo sea más largo que la grilla no es un problema: es la mitad del
argumento.** Con seis filas y cuatro cajas, las que no están en pantalla quedan
deshabilitadas con la línea que explica por qué, y el movimiento de quien mira es bajar
una y subir otra. La demo de la fase 11 necesitó dos ventanas para mostrar ese caso; acá
sale solo, en la única ventana que hay.

**La copia va en inglés**, como las otras tres, porque David presenta.

---

## 2. La decisión que gobierna todo: el formato del contenido es un corte, no un plano

Es la decisión de la que cuelgan el costo, el riesgo y el cronograma, y conviene leerla
antes que los números.

**Lo que Veo no sabe hacer es continuidad entre generaciones.** No es una impresión: es lo
que este proyecto midió y pagó en la fase 08. La cadena de la parada del juego se armó
sembrando cada eslabón con el último cuadro del anterior, y aun así falló de tres maneras
distintas —deriva de escena, fundido con un corte adentro, el mundo equivocado heredado
por los eslabones siguientes—, y la regla que quedó escrita es *"Veo honra los extremos
que se le dan e inventa todo lo que queda en el medio"* y *"un puente sólo puede disolver
un corte entre cosas que ya son casi la misma"*. Del total de generaciones de esa fase
sobrevivió el **27 %**.

**Y el contenido de esta demo no necesita continuidad en ningún lado.** Los tres videos
que hay que producir son, los tres, feeds de cámara que cortan por construcción:

- **El programa** es literalmente un montaje que va cambiando entre autos. Lo pidió así
  Nicolás. Un corte cada ocho segundos no es un artefacto: es lo que hace un director de
  carrera.
- **Las cámaras de seguimiento** son el corte del realizador siguiendo a un auto:
  trackside, helicóptero, grúa. También cortan.
- **Las cámaras a bordo** cambian de ángulo —casco, T-cam, trasera— exactamente como
  cambian en una transmisión real.

De ahí sale la conclusión que decide la producción entera: **el átomo es un clip de ocho
segundos de Veo, y entre dos átomos no hay que resolver nada.** Sin siembra por cuadro,
sin `lastFrame`, sin `verificar-cadena.sh`, sin descartar el cuadro 0 al concatenar.

Es al revés de lo que uno esperaría: la carrera, que parece el contenido más difícil de
generar, es **el único de este proyecto donde el límite duro de la herramienta no cuesta
nada**. Esa es la razón de fondo por la que la respuesta a "¿Veo o stock?" es Veo, y no el
precio.

---

## 3. Veo, stock, o mezcla

### El stock se evaluó y se descarta, y no por la licencia

Se miró el catálogo real de Pexels, que es el banco que este proyecto ya usa y cuya
licencia ya está aceptada en `demo/hydration-break/CREDITS.md`. Lo que devuelve la
búsqueda de video por `race car`, `formula 1` y `race car cockpit` son tres clases de
material, y ninguna sirve:

1. **Metraje real de Fórmula 1 de verdad**: *"Verstappen Overtake at Spa"*, *"Montreal
   Grand Prix"*, *"Exciting Night Race at Yas Marina Circuit"*, *"Crew Members Pushing a
   F1 Car During a Pit Stop"*. Escuderías reales, libreas reales, patrocinadores reales.
   La restricción de esta demo no es sobre la licencia del banco sino sobre qué aparece en
   pantalla, y un auto real no *imita* a uno real: **es** uno real, que es peor. Queda
   afuera por nombre propio.
2. **Carreras reales de otras categorías** —GT, resistencia, karting, drifting—, con el
   mismo problema atenuado: siguen siendo eventos reales con libreas y patrocinadores
   reales, y encima de categorías distintas entre sí.
3. **Planos genéricos** de pista vacía, vista aérea, conos. No son cámaras de un auto.

**Y el problema que mata al stock no es ninguno de esos tres, es la coherencia.** Esta
demo necesita **seis cámaras de la misma carrera**, más un programa que corta entre los
autos de esas seis cámaras. Seis clips de stock son seis eventos distintos, en seis
circuitos, con seis climas y seis categorías. No se arregla eligiendo mejor: no existe en
ningún banco gratuito un paquete de seis cámaras simultáneas de una misma carrera, porque
eso es material de un titular de derechos de transmisión y no de un banco de stock.

El research de sourcing de este proyecto ya había llegado al mismo lugar por otro camino:
*"Pagar stock NO compra indemnidad para esta demo"*, y Pexels *"no warrants that any
consents or licenses have been obtained"*.

### La mezcla se descarta porque no hay dónde partirla

Una mezcla tiene sentido cuando hay dos clases de material con necesidades distintas. Acá
las siete piezas —el programa y las seis cámaras— tienen exactamente la misma necesidad:
misma pista, mismo clima, misma hora, mismos seis autos. Meter stock en una de las siete
la despega de las otras seis, que es el defecto que más se ve en una grilla: las cuatro
cajas están al lado en la misma pantalla y se comparan solas.

Lo único que sí se toma prestado es el molde de empaquetado y la práctica de créditos, que
no son material.

### Veo, y con qué modelo

**`veo-3.1-fast-generate-001`, `us-central1`, 720p, 16:9, `sampleCount: 1`,
`durationSeconds: 8`**, por `:predictLongRunning` más el polling de
`:fetchPredictOperation`. Es exactamente la llamada que `generar-parada.sh` y
`generar-la-l.sh` ya hacen, con `gcloud auth print-access-token` y `curl`. Sale 1280×720 a
**24 fps**, 192 cuadros, con pista de audio AAC 48 kHz.

**720p no es una concesión de presupuesto: es el tamaño exacto que la demo necesita.** El
molde de la fase 11 empaqueta cada vista a 1280×720 y deja que el renderizado la escale a
la caja que le toque, porque la caja cambia de tamaño en vivo cuando sube o baja otra
cámara. Pedirle a Veo 1080p sería pagar por píxeles que el empaquetador tira.

**`veo-3.1-lite-generate-001` se evaluó y se descarta.** A US$0,05/s contra US$0,10/s,
poner las seis cámaras en lite ahorraría unos US$19 sobre un presupuesto que ya está
pre-autorizado. Lo que se paga a cambio es descubrir después de 48 clips que las cajas
chicas se ven peor que el programa que tienen al lado, y en esta demo las cuatro se miran
a la vez. El proyecto ya tiene escrita la forma de esta decisión: *"el costo es
irrelevante y lo que decide es el resultado y el riesgo, no la plata"*. Un solo modelo
para las siete piezas.

**Las imágenes de referencia se generan con `agy` y su `generate_image`**, que va contra
la suscripción de Antigravity y no contra la tarjeta, así que las seis fichas de auto
cuestan **US$0**. Es lo que este proyecto ya hizo con `kalto-shoe`, `meridia-coast` y
`neonectar-panel`, y esas imágenes **sí están versionadas** porque son livianas.

---

## 4. Cuántos clips, y de qué

### La línea de tiempo

Los números salen de tres restricciones y no de un gusto: la ventana tiene que dar tiempo
a recorrer las tres formas de grilla más el caso de la grilla llena; cada cámara tiene que
cubrir su ventana entera porque quien mira puede subirla en el primer segundo; y todo es
múltiplo de ocho, que es el átomo.

| t | qué pasa |
| ---: | --- |
| 0 – 28 s | La carrera corre. El programa corta entre autos. Los relatores arman la situación: quién va adelante, quién viene, la diferencia. |
| ~27,7 s | La línea del anuncio. La voz entra **antes** que la ventana, no después. |
| **28 s** | **Se abre la oferta.** Seis feeds, `PLANNED-DURATION=64`. |
| 28 – 92 s | La ventana. El programa sigue cortando entre autos adentro de su caja. Los relatores siguen relatando. |
| 92 s | Cierra la ventana y vuelve el programa solo. |
| 92 – 112 s | La carrera sigue y los relatores cierran. |

**Programa: 112 s. Ventana: 64 s.** La ventana de la fase 11 es de 60 y 55 s y alcanzó
para las tres formas; 64 agrega lugar para el caso de la grilla llena, que allá necesitaba
una segunda ventana y acá entra en ésta.

### El recuento

| pieza | segundos | clips de 8 s |
| --- | ---: | ---: |
| el programa | 112 | 14 |
| cámara 1 | 64 | 8 |
| cámara 2 | 64 | 8 |
| cámara 3 | 64 | 8 |
| cámara 4 | 64 | 8 |
| cámara 5 | 64 | 8 |
| cámara 6 | 64 | 8 |
| **total en el corte final** | **496** | **62** |

Los 112 s del programa son 14 × 192 cuadros = 2688 cuadros a 24 fps = **112,000 s
exactos**, y cada cámara son 8 × 192 = 1536 cuadros = **64,000 s exactos**. No hay que
recortar nada para que cierre, porque no se descarta ningún cuadro: eso lo hacía la cadena
sembrada y acá no hay cadena.

**Por qué las seis cámaras miden lo mismo que la ventana y no menos.** Una vista se sube
desde el segundo en que la ventana abre, y arranca en su propio cero. Una vista más corta
que la ventana deja la caja vacía antes del final, que es exactamente lo que le pasa a
Sintel en la demo de la fase 11 —52,2 s contra una ventana de 55— y que allá se declaró en
vez de arreglarse. Acá el material se produce, así que se produce del largo correcto.

### Los seis feeds

Seis autos, seis cámaras, cada una de un auto distinto, que es lo que pidió Nicolás. Dos
clases de toma, y las dos cortan:

| # | feed | clase de toma |
| --- | --- | --- |
| 1 | el auto que va adelante | a bordo |
| 2 | el que lo persigue | a bordo |
| 3 | el tercero | seguimiento del realizador |
| 4 | uno de la pelea del medio | seguimiento del realizador |
| 5 | otro de esa pelea | a bordo |
| 6 | el que viene remontando desde atrás | seguimiento del realizador |

Una cámara de boxes sería el séptimo feed obvio y **no está**: el pedido dice seis autos.

---

## 5. Cómo se evita que los autos se parezcan a los de verdad

Es una restricción del encargo y también el modo de falla mejor documentado de esta
herramienta. La fase 08 midió que el modelo **dibuja vestido comercial real aunque se le
prohíba**, y que el modelo no-fast salió **peor** que el fast: *"swooshes en el pecho, más
grandes y más legibles"*. La regla que quedó escrita, y que acá se aplica entera:

> **Prohibir deja el hueco y el modelo lo llena con lo que conoce; describir la
> alternativa le da con qué llenarlo.** Y su otra mitad: describir de más le da permiso.

Aplicado a un auto de carrera, eso se traduce en tres decisiones:

**Cada auto se identifica por un color plano y un nombre inventado, y por nada más.** El
prompt describe la librea —un color dominante y un acento— en lugar de prohibir libreas
reales. Los seis colores se eligen para leerse en una caja de media pantalla y para no
caer sobre la identidad de un equipo real: quedan afuera el rojo, el naranja papaya, el
verde oscuro, el plateado y el azul con cian.

**Al auto no se le piden números ni patrocinadores.** No es una restricción de marca, es
una restricción de la herramienta: el ADR 0045 y el 0062 ya midieron que **la tipografía
adentro del cuadro generado vuelve deformada**, al punto de que un QR generado deja de
escanear. Un número de auto es tipografía. Pedirlo es pedir un número ilegible, y un
número ilegible en seis cámaras es peor que ningún número. El auto se reconoce por el
color, y el nombre vive en la fila del selector, que es texto real del navegador.

**Los nombres se eligen contra dos listas.** Contra la parrilla real, para que no evoquen
un equipo ni un piloto que existe; y contra cómo los pronuncia la voz que los va a decir.
Esto último no es cuidado de más: en la demo del partido, al sintetizador hay que mandarle
**"Norvick"** aunque el equipo se llame **Norvik**, porque con la `v` sola la voz lo
convierte en *Norwich*, que es un club inglés de verdad — justo lo que un nombre inventado
existe para evitar.

**Y un párrafo del mundo, idéntico en los 62 prompts.** Circuito, clima, hora del día,
qué se ve más allá de la pista. Es lo mismo que el párrafo de restricción compartido de
los prompts de imagen de la fase 08, y es lo único que hace que seis cámaras generadas por
separado se lean como seis cámaras de la misma carrera.

---

## 6. El audio

### Los dos relatores: el molde ya existe y se copia

`demo/hydration-break/audio/` es la respuesta a esta mitad del pedido, construida y
medida, y lo que sigue es aplicarla.

**`gemini-2.5-flash-tts`, `en-GB`, dos voces, repartidas por función y no por turnos**:
**Charon** relata lo que pasa y **Kore** comenta por qué. La razón del reparto está escrita
y vale igual en una carrera: *"dos voces diciendo lo mismo suenan peor que una sola"*. Se
reusan las mismas dos voces a propósito: la función es la misma, el prompt de estilo ya
está calibrado, y dos demos del mismo proyecto que suenan al mismo canal es coherencia y
no pereza. Cambiarlas cuesta editar dos cadenas.

**Una línea, un archivo, un nivel.** Cada línea se sintetiza sola y se normaliza sola a
−20 LUFS, porque Kore sale unos 3 dB más fuerte que Charon y *"en una conversación eso no
se lee como énfasis sino como que una está más cerca del micrófono"*.

**Ninguna línea entra a la mezcla sin una transcripción que diga qué dijo.** El
sintetizador tiene dos fallas intermitentes y las dos son invisibles en el archivo: **lee
el prompt de estilo en voz alta** y **repite una frase**. Con el prompt largo original,
cinco de quince líneas salieron cuatro veces más largas de lo pedido. La duración sola no
alcanza como chequeo: *"dice raro, no dice qué se dijo"*.

El costo es despreciable y conviene decirlo para que nadie lo optimice: unos 70 s de habla
son ~1.750 audio tokens a US$10 el millón, o sea **menos de US$0,02 el guion entero**.

### El ambiente sale gratis, y es la diferencia con la demo del partido

La demo del partido pagó un research entero para descubrir que Google no tiene generador
de ambiente ni de efectos, y terminó armando la cama de cancha con una grabación propia y
dos capas de período distinto para esconder el bucle.

Acá eso no hace falta, por una razón estructural: **el video es generado, así que su audio
viene generado, sincronizado y sin costo extra.** Un auto que pasa de izquierda a derecha
trae su doppler en el cuadro en que pasa. Ninguna cama pegada encima compra eso.

Lo que hay que hacer es **dirigirlo**, que es justo lo que la demo del partido no hizo: su
prompt no mencionaba el sonido, y Veo lo llenó con diálogo en inglés entre los jugadores,
repetido entre clips y con cinco de ocho clips clipeando. La regla es la misma que la de
la imagen: se describe qué se oye —motores, gomas, aire, el público lejos— en lugar de
prohibir que haya voces.

Y como la falla es intermitente, **se mide**: cada clip del programa pasa por una
transcripción antes de entrar a la mezcla, igual que cada línea de relator. Un clip con
habla se regenera.

**El audio de las seis cámaras es el beat de audio de la demo.** Por el ADR 0014 una
oferta abre con el programa sonando y cada feed en silencio, y el foco de audio del ADR
0026 le da 1 al enfocado y 0 a todos los demás. O sea que agrandar una cámara a bordo
**calla la transmisión y te deja adentro de ese auto**. Eso es exactamente lo que un
espectador de una carrera quiere, existe porque el video es generado, y no cuesta una sola
generación extra.

### El anuncio cae donde abre la ventana, y eso se asserta

Es el punto que Nicolás marcó: *"ese momento tiene que caer donde la señalización abre la
ventana, no cerca"*.

**El mecanismo es el ADR 0044 aplicado de nuevo: el segundo se declara una vez.** Un
archivo `race.json` al lado de la demo declara `ofertaEn` y `ofertaDura`, y lo leen los
dos lados: el script que escribe el `EXT-X-DATERANGE` y el que arma la pista de audio.
Dos números tipeados en dos archivos se despegan el día que alguien mueve uno.

**Y la voz entra antes que el tag, no encima.** Es lo que la demo del partido midió y dejó
escrito: el silbato cae 0,2 s antes de que el gráfico cambie, *"que es como pasa en una
transmisión: primero se oye, después se ve"*.

**El chequeo, con su forma de fallar.** Se asserta que el fin hablado de la línea del
anuncio cae en `[ofertaEn − 0,5 ; ofertaEn]`. El control, sin el cual el chequeo no es un
chequeo: correrlo sobre una copia con la línea corrida 3 s tiene que ponerse rojo.

---

## 7. Cuánto cuesta y cuánto tarda

### La plata

El precio que se usa es **US$0,10/s para `veo-3.1-fast` a 720p**, o sea **US$0,80 por
generación de 8 s**. Dos advertencias sobre ese número, las dos escritas en el
repositorio:

- Las cabeceras de `generar-parada.sh` y `generar-la-l.sh` dicen **US$0,08/s** y **el
  comentario quedó viejo**: la página de pricing dice 0,10 y no se encontró ninguna
  distinción vigente entre con y sin audio, lo que es coherente con que no exista un
  parámetro para apagarlo.
- El único gasto registrado del proyecto —**US$5,44 por 7 generaciones, 2026-09-10**— es
  un cálculo contra la tabla publicada y **no una lectura de factura**. No hay ninguna
  factura en el repositorio.

Por eso la primera task vuelve a leer la página viva antes de gastar: un número que decide
un gasto de dos dígitos altos se mira el día que se gasta.

**La tasa de descarte.** La medición que hay es del 27 % de aprovechamiento de la fase 08
(40 clips únicos generados, 11 en el contenido final). **Ese número no se hereda**, y la
razón es la misma de la sección 2: casi todo lo que se descartó allá falló por continuidad
—deriva de escena entre eslabones, un fundido con un corte adentro, el mundo heredado—, y
acá no hay eslabones. El contrapunto de la misma fase: el spot lineal, que era un clip
suelto sin cadena, salió **de una**. Lo que sí sobrevive sin cadena es el costo de afinar
el prompt: el fondo de la L necesitó cuatro intentos bajando la oclusión de 87 % a 8 %,
sin ninguna cadena de por medio.

De ahí el reparto: **el prompt se paga una vez, y después los clips salen caros de a poco.**

### El gasto va por etapas, y es un requisito y no una prolijidad

Es la instrucción de Nicolás y gobierna la forma entera de la fase: *"comencemos por
partes y voy validando los videos, comencemos con la carrera principal, luego una cámara y
ahí evaluamos cómo seguir… si no me gusta cómo va quedando el resultado al menos no
gastamos tanto antes de desechar el trabajo"*.

**Lo que eso cambia no es el orden de las tasks sino qué se sabe antes de gastar cada
dólar.** La fase tiene tres compuertas, cada una con un techo escrito, y el número que
importa no es el total: es **cuánto se puede haber gastado cuando se toma cada
decisión**.

| etapa | qué produce | generaciones (esperadas / techo) | US$ (esperado / techo) |
| --- | --- | ---: | ---: |
| **1. El programa** | `programa.mp4`, 112 s, con los dos relatores | 23 / **28** | 18,40 / **22,40** |
| **2. Una cámara** | la demo corriendo con un catálogo de una vista | 12 / **16** | 9,60 / **12,80** |
| **3. Las cinco restantes** | la demo completa, publicada | 60 / **72** | 48,00 / **57,60** |
| | **la fase entera** | **95 / 116** | **76,00 / 92,80** |

- **Lo máximo que se puede gastar antes de que Nicolás vea algo son US$22,40.**
- **Lo máximo antes de que apruebe cómo se ve una cámara son US$35,20.**

La etapa 1 se abre con un **sondeo de dos clips, US$1,60**, mirado por quien coordina y no
por Nicolás: el párrafo del mundo llega a ese punto escrito pero nunca probado, y probarlo
antes de los catorce del programa vale dos clips.

**El techo no es una esperanza, es un corte por task.** Pasado el techo de su etapa, la
task cierra con lo que tenga en lugar de seguir generando. Una estimación sin un corte
escrito es una estimación que nadie va a poder invocar el día que se pase. Los tres techos
están en `PHASE.md` y repetidos en la tabla de arriba de `TASKS.md`, que es donde los mira
quien ejecuta.

**Y el techo está en dólares, no en generaciones.** Las generaciones son la consecuencia de
dividir por el precio del día, y el precio lo relee la T-01 antes de la primera llamada.

### Lo que la forma por etapas cuesta, dicho para que no aparezca después

**Dos esperas que no están en manos de la fase**, y el calendario tiene la ventana de
grabación del 28 al 30. Se mitiga haciendo la etapa 1 corta —una jornada y media— para que
la primera decisión llegue temprano.

**Y un descarte que se paga acá:** la cadena, la señalización y la página podrían
construirse **en paralelo** con la generación, contra un contenido de reemplazo sacado de
`demo/multiview-offer/content/`, y eso acortaría el camino crítico en medio día. Se
descarta, porque un descarte en la compuerta 1 se llevaría puesto todo ese trabajo sin que
nadie lo hubiera mirado, y no hacer trabajo que puede tirarse es exactamente para lo que
existen las compuertas. Se construyen en la etapa 2, contra el contenido real, que además
es mejor material de prueba que cualquier reemplazo.

### Qué queda si se aborta

Un aborto que deja el árbol a medias convierte un descarte barato en una limpieza cara, así
que la regla se escribe una vez: **`demo/race-multiview/` existe en el árbol sólo cuando
corre de punta a punta.** Hasta que cierra la etapa 3 la carpeta se construye pero no es
entregable, y un aborto —en cualquiera de las dos compuertas— la saca. Con eso `main` nunca
carga una cuarta demo que no anda.

Lo que **no** se pierde, porque es lo que hace barato un segundo intento: el párrafo del
mundo, la ficha y el prompt de los seis autos, las seis imágenes, el plan de tomas, el
guion de los relatores, el registro de corrida con los dólares exactos y la razón del
rechazo, todo versionado en la carpeta de la fase. Y los clips crudos en
`content/.fuentes/`, que **no se borran**: son hasta US$22 de material y el reflejo de
limpiar es lo único que los pone en riesgo. El detalle por compuerta está en `PHASE.md`.

---

Las seis fichas de auto con `agy` son **US$0**. El guion entero de los dos relatores es
**menos de US$0,02**. No hay camas musicales, porque no hay avisos en esta demo. **El
total del que se habla es el de Veo y nada más: US$76 esperados, con un techo duro de
US$92,80.**

Para dimensionarlo: es unas **catorce veces** el gasto más grande que este proyecto hizo
hasta hoy en una sola pieza.
### El tiempo

Una generación de 8 s tardó **118 s** medidos, y los mtimes de los eslabones de la fase 08
dan entre 2 y 5 minutos por eslabón contando el mirado humano. 95 generaciones son
**~3,1 h de modelo**.

**Y acá el tiempo se comprime donde la fase 08 no podía.** Aquella escalera se miraba de a
una porque cada eslabón era la semilla del siguiente. Sin cadena, las generaciones son
independientes: se disparan en lotes por `:predictLongRunning`, se pollean juntas, y se
revisan en lámina de contacto, que es una práctica que este proyecto ya tiene.

El trabajo humano real no está en generar sino en mirar noventa y pico de clips y
reescribir los prompts que fallaron. El reparto: **la etapa 1 es una jornada y media, la
etapa 2 dos, y la etapa 3 dos**, o sea cinco y media de trabajo.

**Y a eso hay que sumarle las dos esperas de las compuertas, que no están en manos de la
fase.** Por eso la etapa 1 es la más corta de las tres: una compuerta temprana sólo sirve
si el material para decidirla llega temprano.

---

## 8. Qué se copia del molde, y las dos cosas que no

De `demo/multiview-offer/` se copia la forma entera: los tres scripts, la página con su
`#player` y sus contenedores vacíos, `brand/` byte por byte, `CREDITS.md`, y el test que
corre el script de señalización sobre una playlist mínima con `SRC`/`OUT` para contar los
tags que salieron de verdad.

**El empaquetador se copia del de `hydration-break` y no del de `multiview-offer`.** El de
multiview tiene 1280×720, 30 fps y `-g 60` fijos y no toma audio; el de hydration-break
toma ancho, alto, fps y un archivo de audio por argumento, que es lo que esta demo
necesita: **24 fps**, porque el ADR 0059 manda empaquetar el video generado a la cadencia
de su fuente y Veo entrega 24. Los dos scripts dejaron de ser la misma copia y el
comentario de multiview todavía dice *"copia byte por byte"*: es un hallazgo previo, se
reporta y no se toca.

**No hay `story.json`.** La demo del partido lleva un guion de placas ancladas a los
breaks, y ahí hace falta porque nadie está contando lo que pasa. Acá **los relatores son
el guion**: el anuncio de que las cámaras están disponibles lo dice una voz adentro de la
transmisión, que es como pasa de verdad y es más fuerte que una placa encima del cuadro.
Es la única de las cuatro demos que puede hacerlo, porque es la única cuyo programa tiene
voz. Lo que sí se necesita es la hoja de señales para quien maneja la grabación, y eso lo
imprime `senalizar-contenido.sh` como ya lo hace la demo de la fase 11.

**El scroll de abajo son dos secciones y no tres.** Se reusan `js/recorrido.js` —que lee
`programRanges()` y marca la ventana abierta— y `js/senalizacion.js` —los pliegues con el
JSON crudo—, con su prosa reescrita. Se descarta la sección de `js/contrato.js`, que
explica qué es una oferta campo por campo: eso ya lo cuenta `multiview-offer`, y el
argumento de esta página es el caso de uso y no el formato. Son 298 líneas de mecanismo
que no se copian y una sección menos que mantener.

---

## 9. Lo que se consideró y se descartó

**Un aviso adentro de la carrera.** La demo de la fase 11 lleva un `cornerOverlay` antes de
las ofertas para mostrar las dos clases sobre una playlist. Acá se descarta: el pedido de
Nicolás no tiene avisos, y esta demo es la única puramente editorial de las cuatro, que es
justamente el Quad del documento de requerimientos. Agregar uno después cuesta un
asset-list y una fila en la tabla del recorrido, así que la decisión es barata de
revisitar.

**Loopear las cámaras para generar menos.** Ocho clips por cámara podrían ser dos looleados
cuatro veces, y ahorraría unos US$28. Se descarta por lo que este proyecto ya midió con
menos material en juego: *"un loop de 8 s se nota como un loop justo porque el aviso dura
exactamente el doble"*. Una cámara a bordo es lo más periódico que hay —la misma curva
vuelve— y son cuatro cajas mirándose a la vez.

**Bajar la ventana a 32 s para generar la mitad.** Ahorraría unos US$19 y se lleva puesto
lo que la ventana existe para mostrar: las tres formas de grilla, la grilla llena con las
filas deshabilitadas, el agrandar con foco de audio, y la salida. La fase 11 necesitó 60 s
para eso con una segunda ventana al lado.

**Mezclar `lite` para las cajas chicas.** Sección 3.

**Un feed de boxes como séptima opción.** El pedido dice seis autos.

---

## 10. Las decisiones que esta fase toma, para el que las busque

Ninguna cambia el formato ni la librería, así que ninguna pide un ADR de alcance de
proyecto: son decisiones de esta demo y viven en este documento y en las cabeceras de sus
scripts, que es donde el ADR 0061 manda que viva una receta de generación —*"porque es qué
mirar la próxima vez y no un registro de qué pasó"*.

1. El átomo es un clip de 8 s y no hay cadena, porque todo lo que se produce es un feed que
   corta (§2).
2. Todo el video es Veo `3.1-fast` a 720p; el stock se descarta por coherencia antes que
   por licencia (§3).
3. El programa dura 112 s, la ventana 64 s y abre en el 28 (§4).
4. Un auto es un color y un nombre; ni números ni patrocinadores, porque la tipografía
   generada vuelve deformada (§5).
5. El ambiente es el audio que Veo ya trae, dirigido por prompt y con portón de
   transcripción (§6).
6. El segundo en que abre la oferta se declara una vez en `race.json` y lo leen los dos
   lados (§6).
7. El gasto va en tres etapas con un techo en dólares cada una, y la cadena no se adelanta
   contra un contenido de reemplazo (§7).
8. **La etapa 1 se entrega con el relato puesto**, aunque dependa del montaje y se rehaga
   si el montaje se descarta: un montaje mudo no es el artefacto que hay que juzgar, y el
   clip del segundo 28 tiene que admitir el anuncio o el montaje no sirve igual. El
   argumento entero está en `PHASE.md`.
9. **La cámara de la etapa 2 es la de a bordo del auto que va adelante**, elegida por ser
   la más difícil y no la más segura: es donde el auto casi no está en cuadro, que es el
   peor caso para identificarlo por color; es la única que se puede cruzar contra el
   programa; y es donde vive el beat de audio. Si aguanta, una de seguimiento es el caso
   fácil; al revés no vale. El argumento entero está en `PHASE.md`.
10. No hay `story.json`: los relatores son el guion (§8).
11. Dos secciones de scroll y no tres (§8).

Si al ejecutar aparece una decisión que toque el formato o la librería, **ésa sí es un ADR
y es también una dependencia**, y se reporta antes de escribirla.
