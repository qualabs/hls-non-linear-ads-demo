---
phase: 03-breaks-multiples-y-repliegue
title: Breaks con varios avisos, repliegue y decoderCount
status: planning
started: 2026-09-04
closed: null
---

# Fase 03: breaks con varios avisos, repliegue y decoderCount

**Esta fase no arranca antes de que cierre la 02.** Está escrita ahora porque
su contenido salió de la misma reunión y porque la 02 tiene que dejar el corte
hecho para que el `decoderCount` y el repliegue —que son configuración y
comportamiento del SDK— no nazcan en la aplicación de demo y haya que
mudarlos.

## Objetivo

Que un break pueda traer varios avisos mezclando concurrente y lineal, que el
cliente sepa replegarse cuando lo que le devuelven no lo puede reproducir, y
que el `decoderCount` que configura el integrador viaje hasta el pedido del
asset-list.

Lo primero es lo más importante que pidió David en la reunión del 2026-09-04:
"the big thing right now... we need to show doing an ad break with multiple
ads within there... and it'd be really cool if we can show concurrent,
concurrent, linear, concurrent, mixing that up".

## Alcance

- **Un break con varios avisos, mezclando concurrente y lineal.** La capa de
  señalización ya itera la lista de assets, pero eso es menos de lo que
  parece: hoy resuelve todos los items al mismo instante, sin acumular la
  duración de cada asset, así que tres avisos en un break saldrían los tres a
  la vez. Y un aviso **lineal** en el medio del break es un reemplazo —pausar
  el primario, ocupar el cuadro entero, volver—: el contrato no tiene noción
  de primario pausado, y el ADR 0002 apagó justamente la maquinaria que hace
  reemplazos. **Es el único item que queda en el proyecto capaz de reabrir un
  ADR de la fase 01.**
- **El repliegue del lado del cliente.** Si lo que vuelve no se puede
  reproducir, se cae al `URI` y la `duration` de nivel superior del asset, que
  ya son el lineal tradicional y que los asset-list de la demo ya traen. Si no
  están, se saltea el break entero. David: "then we've now had a production
  level failover situation".
- **El `decoderCount`, y exactamente esto.** Que se pueda configurar; que si
  no se pone no cambie nada de lo que hay hoy, como si fuera infinito; y que
  si está, el GET al asset-list lo lleve como parámetro. Es passthrough: lo
  demás viene después.

## Fuera de alcance

- **El modelo de detección de capacidades.** Sigue fuera del proyecto, y David
  coincide: "it's not the SDK's responsibility to determine the decoders,
  that's the application developer's". Lo que entra acá es el passthrough del
  número, no averiguarlo.
- **Que el asset-list cambie según el parámetro.** David lo pidió —con un
  decoder, un video y una imagen; con tres, más (37:14)— y eso es trabajo del
  APS, que está fuera de alcance del proyecto desde el ADR 0005: la demo sirve
  archivos. Lo que esta fase muestra es el parámetro viajando en el pedido, no
  la respuesta cambiando.
- **La pantalla inicial de la demo que pregunta cuántos decoders hay**, y el
  botón de enable/disable de avisos concurrentes en la página. David pidió las
  dos (39:45 y 27:41) y Nicolás las dejó afuera de esta fase.
- **iOS**, y **los ADR 0011 y 0012**, que siguen en pausa esperando a David.

## Decisiones que gobiernan la fase

Las de la fase 01 que esto puede tocar, y por eso están nombradas: el **0002**
(hls.js sin modificar y con el controlador de interstitials apagado), el
**0003** (las dos capas y su contrato) y el **0007** (el par de
compatibilidad, que es lo que se rompería si nuestro player empezara a
comportarse como el de fábrica).

De la fase 02: el **0015**, que es el límite del SDK y dice de qué lado nace
el `decoderCount`, y el **0016**, que es por qué el largo del programa se
relee.

Si la medición de la T-01 obliga a cambiar alguna, se escribe el ADR que la
supersede y no se edita la vieja.

## Arquitectura del producto

El documento de arquitectura del producto es el contrato, que la fase 02 pone
en `docs/`. El delta que esta fase le puede introducir es el más grande que el
contrato haya tenido: **una noción de contenido primario pausado**, que hoy no
existe porque nada la necesitaba. La T-01 mide si hace falta antes de que se
escriba una línea.

## Riesgos y mitigaciones

**R1. El aviso lineal en el medio del break puede reabrir el ADR 0002.** Es el
único riesgo de calendario que está adentro de las fases y el único item que
puede tocar una decisión de la fase 01.

Mitigación: **la primera task es la medición**, como la T-01 fue de la fase
01, y antes de comprometer plan de construcción. Vale la pena saberlo antes
del sync del 21 de septiembre y no después.

**R2. Volver a encender la maquinaria de hls.js no es la salida, y conviene
tenerlo a la vista antes de medir.** El aviso lineal de este caso no es un
Date Range: es un `ASSET` adentro de nuestro asset-list, y el controlador de
interstitials de hls.js arma su agenda desde los Date Ranges de clase Apple y
pide sus asset-list por su cuenta. O sea que encenderlo no reproduciría este
aviso, y sí volvería a nuestro player un cliente de fábrica, que es
exactamente lo que el par de compatibilidad del ADR 0007 muestra que no es.

Mitigación: es lectura del código, y la T-01 la confirma o la desmiente antes
de que nadie planifique sobre ella.

**R3. El contrato se amplía a mano alzada.** Una noción de primario pausado
metida de apuro es la clase de cosa que después no se puede sacar.

Mitigación: la T-02 cierra el plan con el resultado de la medición en la mano,
y el contrato ya vive en `docs/` como documento del producto, así que cambiarlo
es una versión del documento y no un parche adentro de la evidencia de una
task.

**R4. El calendario.** La ventana de grabación es del 28 al 30 de septiembre y
lo que se graba tiene que estar operativo antes.

Mitigación: la fase 01 dejó parado el escalón que se graba, así que esta fase
agrega y no sostiene. Si algo no llega, lo que se graba es el recorrido que ya
existe.

## Timeline

- **21 de septiembre**: sync de una hora con David.
- **28 al 30 de septiembre**: ventana de grabación.
- **7 de octubre**: presentación en el evento de Apple.

## Stakeholders

- **Nicolás Levy**: owner.
- **David Hassoun**: pidió las tres cosas de esta fase y es quien confirma qué
  se muestra.
- **SVTA**: dueña del formato. Las dos preguntas que esta fase le devuelve —qué
  significan varios `ASSETS` en un break y cómo se declara un aviso lineal
  adentro de una experiencia concurrente— son de especificación antes que de
  código.

## Preguntas abiertas que esta fase no resuelve

- **Cómo se declara un aviso lineal adentro de un break concurrente.** El
  bloque `X-AD-CREATIVE-SIGNALING` describe una experiencia con layout; un
  aviso lineal no tiene layout, tiene el cuadro entero. Si la respuesta es que
  se declara sin bloque, entonces el `URI` de nivel superior del asset cumple
  dos roles a la vez —el aviso lineal del break y el repliegue del
  concurrente— y eso es una pregunta para SVTA.
- **El `start` de cada item, contado desde dónde.** El contrato lo lee como un
  desplazamiento desde el `START-DATE` de la señalización y no desde el
  comienzo de cada `ASSET`, y anota que un asset-list con varios `ASSETS`
  separaría las dos lecturas. Esta fase es la que las separa.
- **Qué hacer cuando el break no se puede llenar con un aviso no lineal**, que
  es uno de los dos problemas abiertos que David piensa marcar en escenario.
  El repliegue de esta fase es una respuesta de cliente; la de negocio no la
  contesta acá.
