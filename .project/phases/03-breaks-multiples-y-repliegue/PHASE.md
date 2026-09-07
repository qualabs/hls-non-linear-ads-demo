---
phase: 03-breaks-multiples-y-repliegue
title: "Breaks con varios avisos, el asset sin bloque y el decoderCount"
status: closed
started: 2026-09-04
closed: 2026-09-07
---

# Fase 03: breaks con varios avisos, el asset sin bloque y el `decoderCount`

Las fases 02 y 04 están cerradas, así que esta es la que corre. La 04 tiene el
número más alto y se ejecutó primero porque el orden no salía del número: la 04
era lo que se graba —los defectos que hacían la demo incómoda de mostrar y las
diferencias entre los dos panes que no son el mecanismo— y **esta fase son
capacidades nuevas**, con la ventana de grabación del 28 al 30 de septiembre en el
medio.

El diseño de la fase está en `DESIGN.md`, y este documento se generó desde ahí.

## Objetivo

Que un break pueda traer varios avisos mezclando concurrente y lineal, que el
cliente sepa qué hacer cuando lo que le devuelven no lo puede reproducir, y que el
`decoderCount` que configura el integrador viaje hasta el pedido del asset-list.

Lo primero es lo más importante que pidió David en la reunión del 2026-09-04:
"the big thing right now... we need to show doing an ad break with multiple ads
within there... and it'd be really cool if we can show concurrent, concurrent,
linear, concurrent, mixing that up".

## Alcance

- **Un break con varios avisos, uno detrás del otro.** El orden es herencia de la
  norma —los assets se reproducen en el orden del array— y lo que sigue siendo
  decisión nuestra es de qué dato sale el desplazamiento de cada uno. La capa de
  señalización ya itera la lista de assets y hoy resuelve todos los items al mismo
  `slotStart`, así que tres avisos con `start: 0` saldrían los tres a la vez; con
  `start` acumulados el código de hoy ya los secuencia. Y adentro del break el
  renderizador tiene un bug que este alcance destapa: dos experiencias
  consecutivas del mismo `type` comparten clave y la segunda no se dibuja. Y la
  transición entre un aviso y el siguiente se precarga —el asset que entra se trae
  mientras corre el actual—, que es lo que evita que el break pase por un cuadro en
  negro en cada una de sus transiciones.
- **El asset sin bloque: el aviso lineal y el repliegue, un solo mecanismo.** El
  ADR 0019 fija el modelo: un asset sin bloque `X-AD-CREATIVE-SIGNALING` no se
  saltea, se reproduce su `URI` **hasta el fin del asset**, y un bloque que falla
  cae al mismo lugar. Las dos cosas que la fase tenía como tasks separadas son el
  mismo camino de código.
- **El `decoderCount`, y exactamente esto.** Que se pueda configurar; que si no se
  pone no cambie nada de lo que hay hoy, como si fuera infinito; y que si está, el
  GET al asset-list lo lleve como parámetro. Es passthrough: lo demás viene
  después.

## Fuera de alcance

- **El modelo de detección de capacidades.** Sigue fuera del proyecto, y David
  coincide: "it's not the SDK's responsibility to determine the decoders, that's
  the application developer's". Lo que entra acá es el passthrough del número, no
  averiguarlo.
- **Que el asset-list cambie según el parámetro.** David lo pidió —con un decoder,
  un video y una imagen; con tres, más (37:14)— y eso es trabajo del APS, que está
  fuera de alcance del proyecto desde el ADR 0005: la demo sirve archivos. Lo que
  esta fase muestra es el parámetro viajando en el pedido, no la respuesta
  cambiando.
- **Que el aviso a cuadro entero detenga de verdad el contenido primario.** El
  `DESIGN.md` lo evaluó y lo descartó: requiere un reloj propio del renderizador y
  una noción de "esta experiencia suspende el reloj del programa" que ni el
  contrato ni la norma tienen. Lo que se construye es el aviso a cuadro entero con
  el primario corriendo detrás, tapado y en silencio.
- **La no conformidad del `URI` absoluto.** Los asset-list de la demo usan
  referencias absolutas de path y la norma pide URIs absolutas. Está anotado en el
  `DESIGN.md` y no se corrige acá: el player que los lee es el nuestro y no impide
  nada.
- **La pantalla inicial de la demo que pregunta cuántos decoders hay**, y el botón
  de enable/disable de avisos concurrentes en la página. David pidió las dos (39:45
  y 27:41) y Nicolás las dejó afuera de esta fase.
- **iOS**, y **los ADR 0011 y 0012**, que siguen en pausa esperando a David.

## Decisiones que gobiernan la fase

- **0019** — el bloque de layout es una extensión por encima del interstitial
  estándar, y un asset sin bloque es un aviso lineal. Es la decisión de
  arquitectura de la fase y todo lo demás la cita.
- **0002** — hls.js entra sin modificar y con el controlador de interstitials
  apagado. La fase **no lo reabre**, y el ADR 0019 dice por qué.
- **0003** — las dos capas y su contrato.
- **0007** — el par de compatibilidad, que es lo que se rompería si nuestro player
  empezara a comportarse como el de fábrica.
- **0015** — el límite del SDK, que dice de qué lado nace el `decoderCount`.
- **0016** — la clase concurrente nunca cambia el largo de la línea de tiempo, y
  por qué el largo se relee.
- **0017** — el pane de fábrica reemplaza en lugar de insertar. Invalida el
  argumento del atraso de 49,47 s, que la fase tenía escrito como algo a
  preservar.
- **0018** — cada barra marca sólo lo que ese player reproduce, sobre su propio
  riel. Anticipa un rango de clase `interstitial` del lado nuestro, y bajo el
  modelo del ADR 0019 esa anticipación no se sigue sola: es una decisión de la
  T-02.

Si algo obliga a cambiar una de estas, se escribe el ADR que la supersede y no se
edita la vieja.

## Arquitectura del producto

El documento de arquitectura del producto es el contrato entre las dos capas, en
`docs/contrato-senalizacion-renderizado.md`. El delta que esta fase le introduce
son tres cosas, y ninguna cambia la forma de `Experience` ni de `Element`:

1. **La capa de señalización sintetiza una experiencia para un asset sin bloque.**
   Hoy `resolveAssetList` itera `block?.payload || []`, así que un asset sin bloque
   contribuye cero experiencias. Lo que sintetiza usa los campos que ya existen:
   un elemento a cuadro entero con el `uri` del asset, arriba del primario y con
   volumen, y el primario abajo y en silencio.
2. **Cada item necesita identidad propia.** Hoy la clave del renderizador es
   `${e.type}#${e.id}` y el `id` es el del Date Range, el mismo para todos los
   items del break.
3. **La regla 5 del contrato queda en tensión con la norma, y hay que resolverla
   por escrito.** La regla dice que `activeAt` es la única fuente de la ventana de
   activación, calculada desde `startTime` y `duration`; la norma dice que el
   asset se reproduce hasta su fin. Las dos no pueden ser ciertas a la vez cuando
   el creativo dura otra cosa que su `DURATION` declarada. La salida la elige la
   T-02 y sale como versión del documento.

## Riesgos y mitigaciones

**R1. La transición entre dos avisos del break sale en negro.** El renderizador
destruye la experiencia que sale y recién ahí construye la que entra, así que cada
transición de adentro del break paga una instancia nueva de hls.js con su fetch de
playlist y de segmento, y el nodo nace con fondo negro. Con un aviso por break no
se nota; con cuatro pasa tres veces en el medio, y es lo único de esta fase que se
ve en cámara sin que nadie lo busque.

Mitigación: **no se mide, se construye.** La causa se conoce y el arreglo también:
el asset siguiente se trae mientras corre el actual, y eso es parte de lo que la
T-01 construye. Medir cuánto dura el negro para después precargar igual no lo
necesita ninguna decisión de la fase. Lo que queda de riesgo después de la
precarga es que traerlo antes no alcance para que el primer cuadro esté listo a
tiempo, y el done de la T-01 lo afirma leyendo el estado del nodo que entra en el
instante anterior a la transición: si no alcanzó se sabe ahí y no en la grabación.

**R2. La inversión del par de compatibilidad.** Con el lineal tercero en la
mezcla, hay un tramo del break donde nuestro pane muestra un aviso a cuadro entero
y el de fábrica muestra el programa, o sea al revés de lo que la demo quiere
mostrar. El `DESIGN.md` lo tiene con sus tres salidas.

Mitigación: la fase acepta la inversión y la explica. La sección 8 del `DESIGN.md`
tiene por qué es la única salida que no contradice el "mixing that up" ni rompe el
ADR 0018, y la T-05 la deja escrita en la tabla del recorrido y en el `README.md`.
El cuadro que la demo quiere sigue llegando primero.

**R3. El degradado no es transparente y alguien lo va a contar como si lo fuera.**
La norma no tiene modelo de superposición, así que un cliente conforme que lea el
asset-list y no entienda el bloque pausa el primario: el aviso concurrente se
convierte en uno lineal que interrumpe.

Mitigación: está escrito sin suavizar en el ADR 0019, que es de scope `project` y
es material para SVTA. Nadie tiene que deducirlo del código.

**R4. El contrato se amplía a mano alzada.** La tensión entre la regla 5 y "hasta
el fin del asset" es la clase de cosa que, resuelta de apuro adentro de una task,
después no se puede sacar.

Mitigación: la T-02 tiene la decisión enumerada en su bloque, con las dos salidas
escritas, y el resultado es una versión del documento en `docs/` y no un párrafo
adentro de la evidencia de una task.

**R5. El calendario.** La ventana de grabación es del 28 al 30 de septiembre y lo
que se graba tiene que estar operativo antes.

Mitigación: las fases 01, 02 y 04 dejaron parado el escalón que se graba, así que
esta fase agrega y no sostiene. Si algo no llega, lo que se graba es el recorrido
que ya existe.

## Timeline

- **21 de septiembre**: sync de una hora con David.
- **28 al 30 de septiembre**: ventana de grabación.
- **7 de octubre**: presentación en el evento de Apple.

## Stakeholders

- **Nicolás Levy**: owner.
- **David Hassoun**: pidió las tres cosas de esta fase, y es quien cuenta en
  escenario la inversión del par de compatibilidad (R2) y el degradado (R3). Las
  dos llegan al sync del 21 de septiembre resueltas y explicadas, no como
  preguntas abiertas.
- **SVTA**: dueña del formato. Las dos preguntas que esta fase le devuelve son de
  especificación antes que de código, y las dos están en el `DESIGN.md`: qué regla
  de claves desconocidas tiene el JSON del asset list, que la norma no define; y
  qué atributos del Date Range de interstitial conservan su significado en la clase
  hermana, que ya venía abierta del ADR 0016.

## Preguntas abiertas que esta fase no resuelve

- **Qué hacer cuando el break no se puede llenar con un aviso no lineal**, que es
  uno de los dos problemas abiertos que David piensa marcar en escenario. El
  repliegue de esta fase es una respuesta de cliente; la de negocio no la contesta
  acá.
- **Si el `decoderCount` significa algo real bajo el render que esta fase
  construye.** El primario sigue decodificando detrás del aviso a cuadro entero, o
  sea que no se libera un decodificador. **Esta fase no lo mide**: es passthrough
  por diseño y ninguna decisión de acá consume ese número. Lo mide la fase que le
  dé semántica al `decoderCount`, que es la misma que decide qué hacer con la
  respuesta.
