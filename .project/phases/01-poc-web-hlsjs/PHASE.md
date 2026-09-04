---
phase: 01-poc-web-hlsjs
title: POC funcional en web con hls.js
status: in-progress
started: 2026-09-03
closed: null
---

# Fase 01: POC funcional en web con hls.js

## Objetivo

Tener un POC funcional en web, usando hls.js, que reproduzca publicidad
no lineal señalizada con la clase `com.qualabs.hls.concurrentInterstitial`
y resuelva el layout de la experiencia concurrente a partir del
asset-list que emite el Layout Controller de SVTA.

El objetivo lo fijó Nicolás y no está a discusión en esta fase. La fase
corre contra el **21 de septiembre**, que es el hito del primer draft
andando y del sync de una hora con David.

## Alcance

- La cadena de señalización completa y visible en la pestaña de red del
  browser: media playlist con `EXT-X-DATERANGE` de clase propia,
  asset-list JSON, y el bloque `X-AD-CREATIVE-SIGNALING` con el layout.
- El renderizado de las experiencias concurrentes en el DOM sobre el
  elemento de video, con los tres mecanismos que cubren los cinco
  layouts: overlay, squeezeback y multiview.
- El par de compatibilidad: la misma playlist con un aviso lineal de
  clase Apple y una experiencia concurrente de clase propia, y dos
  instancias de hls.js en la misma página, una de fábrica y otra de la
  demo.
- El contenido primario empaquetado como VOD en HLS y servido por un
  servidor de archivos estáticos, junto con los assets de aviso.

## Fuera de alcance

- Ad server, APS y decisioning. La demo sirve archivos.
- Detección de capacidad de decodificación concurrente. Nicolás la deja
  expresamente fuera, con la posición registrada en el `PROJECT.md`.
- Live. El POC es VOD (ADR 0005).
- iOS y AVFoundation. Es el trabajo que entra por Emil.
- Modificar o forkear hls.js. Entra sin tocar (ADR 0002).
- El primer pase de la especificación de SVTA, que comparte fecha límite
  con esta fase pero no tiene owner todavía.

## Decisiones que gobiernan la fase

Las doce decisiones están en `decisions/`, una por archivo. Las que más
condicionan el trabajo diario son la 0002 (hls.js sin modificar y con el
controlador de interstitials apagado), la 0003 (dos capas, señalización y
renderizado, con un contrato entre ellas) y la 0008 (el mínimo es un
overlay y el orden va del riesgo conocido al desconocido).

El ADR 0009 es de alcance proyecto: la clase concurrente es hermana de la
de interstitial y no una extensión.

Los ADR 0011 y 0012 están en `proposed` porque son propuestas a David que
esperan su confirmación.

## Arquitectura del producto

El proyecto todavía no tiene un documento de arquitectura propio fuera de
`.project/`. La arquitectura que esta fase fija es el corte en dos capas
del ADR 0003, y el documento que la describe se escribe cuando el
contrato entre las dos capas exista de verdad, no antes: es salida del
trabajo y entra por evidencia de la task que lo produzca.

## Riesgos y mitigaciones

**R1. El calendario, que es más corto de lo que parece.** El software
tiene que estar operativo para la ventana de grabación del 28 al 30 de
septiembre, no para la presentación del 7 de octubre. La fecha del primer
draft además está en disputa entre el documento de requerimientos (1 de
septiembre) y la minuta (21 de septiembre).

Mitigación: la fase se planifica contra el 21, y el orden de trabajo es
la cadena mínima completa primero y los layouts después, para que a
partir de la primera semana exista siempre algo grabable. La escalera de
repliegue, de más a menos, si algo no llega:

1. Los tres mecanismos andando, con los cinco layouts, más el par de
   compatibilidad.
2. Los tres mecanismos andando con un layout de cada uno, más el par de
   compatibilidad.
3. Los mecanismos de overlay y squeezeback, más el par de compatibilidad.
4. El mecanismo de overlay andando, con la cadena de señalización
   completa y visible en la pestaña de red.

El escalón 4 es el piso. Si el 21 de septiembre no está, la conversación
con David no es sobre layouts sino sobre plataforma.

**R2. La concurrencia de decodificadores.** Es el riesgo que podía sacar
el multiview de la demo.

Mitigación: la medición de la T-01, hecha antes de comprometer el plan de
construcción. Corrió el 2026-09-03 y su evidencia está en
`tasks/T-01/`.

**R3. La plataforma.** El `PROJECT.md` lo registra como el riesgo que
decide esta fase, sobre la base de que había implementaciones públicas en
Swift que no existen en hls.js. La respuesta de Rob Walch cierra la
incógnita: cualquiera de las dos plataformas sirve para una demo. Como el
diseño decidió no apoyarse en la maquinaria de interstitials (ADR 0002),
la diferencia no bloquea nada.

Riesgo residual aceptado: si más adelante la demo se mudara entera a iOS,
el trabajo de renderizado web no se recupera.

**R4. Divergencia con el trabajo de DASH.** El modelo de coordenadas de
la herramienta de SVTA para HLS es de porcentajes de inset sobre el área
del player, y la especificación de SGAI para DASH que Nicolás diseña en
`projects/sgai-for-mpeg-dash/` decidió un viewport de referencia en
píxeles. Son dos modelos para el mismo problema.

Mitigación: es una pregunta de especificación y no de código, así que no
bloquea nada de esta fase. Se resuelve con David y con SVTA.

## Timeline

- **21 de septiembre**: primer draft andando y sync de una hora con
  David. Es el hito que cierra la fase.
- **28 al 30 de septiembre**: ventana de grabación. El software tiene que
  estar operativo antes.
- **7 de octubre**: presentación en el evento de Apple.

## Stakeholders

- **Nicolás Levy**: owner. Construye la demo y no la delega.
- **David Hassoun**: presenta en escenario, fija el alcance y contesta
  las preguntas abiertas.
- **Emil**: la parte de iOS, fuera de esta fase.
- **Rob Walch**: mantiene hls.js. Es la fuente de lo que hls.js hace y de
  lo que viene en 1.8.0.
- **SVTA**: dueña del Layout Controller y de la guía que este trabajo
  lleva a su v3.

## Preguntas abiertas que esta fase no resuelve

Para David: la fecha del primer draft, el reparto de layouts (propuesto
en el ADR 0011), el mapeo de nombres al campo `type` (propuesto en el ADR
0012), quién hace el primer pase de la especificación de SVTA, y qué
significa `version: 2` en el bloque `X-AD-CREATIVE-SIGNALING`.

Para la especificación de SVTA, y no para esta fase: si el layout debería
viajar en el propio DateRange Object en vez de en el asset-list, y la
divergencia de modelos de coordenadas entre HLS y DASH del R4.

Aparecida al medir, y ya resuelta para la demo: el modelo de porcentajes
no dice cómo llena un asset una caja cuya relación de aspecto no es la
suya. El ADR 0013 fija el recorte centrado sin deformar como política de
la demo, y el hueco del modelo se le reporta a SVTA como pregunta.
