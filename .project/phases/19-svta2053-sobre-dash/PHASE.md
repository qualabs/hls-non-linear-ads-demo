---
title: "SVTA2053 sobre DASH"
description: "dash/ sobre dash.js 5.2.1 sin modificar lee la carriage DASH de la presentación concurrente (un EventStream de SVTA con un sobre v2 pod, leído del texto del MPD porque dash.js pierde el CDATA), stage-pair muestra el mismo stream en HLS y en DASH con la misma opción, ventana y pedido en cada break (medido), y docs/svta2053-dash-concurrent-presentation.md escribe la 6.7 para David"
started: 2026-10-26
origin: "Nicolás vía agent-nicolas-laptop-865daf, 2026-10-26, despacho del diseño de la fase 19; diseño aprobado (bb0d78b) y ejecución despachada a hls-demo-19"
depends_on: []
category: feature
---

# Fase 19: SVTA2053 sobre DASH

El diseño está en `DESIGN.md`; esto es el contrato.

## Objetivo

Que la presentación concurrente de SVTA2053 tenga su carriage en DASH escrita como la próxima
edición la llevaría, y que esté probada: el mismo stream, con los mismos slots y las mismas
capacidades, se ve igual en HLS y en DASH. Sin que cambie lo que hace ninguna demo HLS.

## Decisiones

Las preguntas abiertas 1 a 7 del diseño se toman con su recomendación, que es lo que se aprobó. La 5
y la 7 son además de la spec y van en el texto para David.

- ADR 0120: el cuerpo del Event es el sobre v2 de SVTA, un `pod` por corte, con los slots adentro o
  en `$remote.slots`.
- ADR 0121: lo concurrente se marca con `features.concurrentPresentation`, sin versión nueva ni
  `@value`.
- ADR 0122: el default lineal es `Slot.media`.
- ADR 0123: PRE, POST y ONCE van en una clave `cue` del sobre, con el vocabulario de HLS.
- ADR 0124: `$remote.slots` se pide 60 s antes del inicio, o al entrar en la ventana por un seek.
- ADR 0125: el lineal tradicional (`ReplacePresentation`) lo ejecuta la librería sobre dash.js sin
  modificar.
- ADR 0126: sin `?adclass=` en DASH; el publicador sirve un MPD por clase.
- ADR 0127: la demo es `stage-pair`, con "DASH, nuestra librería" como tercer modo de cada pane.

## Alcance

1. Los dos riesgos medidos antes de construir: cuándo entrega dash.js un evento del MPD y cómo se
   detecta que un creativo DASH no cargó.
2. Lo común de `hls/signalling.js` y `hls/media.js` sube a `lib/`, cada grupo en su commit.
3. `dash/signalling.js`, `dash/media.js`, `dash/concurrent-dash.js`, `vendor/dash.all.min.js`
   5.2.1 y `dist/qualabs-concurrent-dash.js`, con sus tests y sus costuras.
4. El contenido DASH de `stage-pair` (primario fMP4, creativos MPD, MPD señalizado, sobres `slot`)
   y el tercer modo de cada pane.
5. `verificar-pares.py` comparando HLS contra DASH.
6. El texto para SVTA2053 como archivo del repo: la 6.7, los ajustes de Abstract, §1, §4.1 y §5, y
   la tabla de 7.2.
7. La documentación y la verificación final, y el merge a main local.

## Fuera de alcance

- Live (MPD `dynamic`, updates, `emsg`), `InsertPresentation`, List MPD, multi view en DASH,
  `X-PLAYOUT-LIMIT` / `skipTiming`, `?adclass=` en DASH.
- Las otras cuatro demos, salvo los cambios inertes del ADR 0118 que traiga la subida a `lib/`.
- El camino de `sgai-for-mpeg-dash`, y cualquier archivo de ese proyecto.
- El `.docx` de SVTA2053 en Drive.
- Publicar, pushear y renombrar el repo.

## Criterio de cierre

`npm test` y `npm run check` verdes. `comparar-publicacion.mjs <base> HEAD`, con `<base>` = `bb0d78b`:
las cuatro demos HLS que no son `stage-pair` sólo cambian de la forma inerte del ADR 0118, y en
`stage-pair` lo que cambia es lo que suma el modo DASH. `publicar.sh --all` en seco con 0 referencias
faltantes. `verificar-pares.py` con los panes HLS y DASH dando la misma opción en el mismo segundo de
programa en cada break, y sus dos controles en rojo.

## Riesgos

- **dash.js no entrega el evento del MPD al cargar.** Si `onReceive` llega tarde, la barra y el
  pre-roll esperan. Mitigación: se mide primero (T-01); si no es al cargar, el camino es leer el
  EventStream del MPD en un `addResponseInterceptor`, y si eso tampoco sirve la fase se frena.
- **No se puede detectar que un creativo MPD no cargó.** Sin eso no hay failover por primera carga
  (ADR 0107). Mitigación: se mide en T-01 con un 404 en el MPD y en un segmento.
- **Leer `ReplacePresentation` sin API** (ADR 0125). Mitigación: se mide en T-01; el camino de
  repuesto es el interceptor de respuesta.
- **La subida a `lib/` cambia lo que hacen las demos HLS.** Mitigación: commit por grupo, con
  `npm run check`, `npm test` y `comparar-publicacion.mjs` en cada uno (T-02).
- **El primario fMP4 no arranca en el mismo origen que el TS** (el HLS arranca en 0,067 s, ADR
  0109). Mitigación: el origen se mide al empaquetar (T-06) y la comparación de T-08 lo descuenta.
- **Slots no contiguos.** Aceptado: los cortes de la demo son contiguos; la conversión lo rechaza
  con un error en lugar de encadenarlos mal (T-03).
- **Un lector de 6.1 que no respeta los flags** cuenta impresiones de lo que no dibujó. Aceptado: el
  flag cubre al lector conforme a 5.2.2.1, y el texto de 6.7.8 lo dice.
- **Varios `MediaPlayer` a la vez en CPU.** Aceptado para el prototipo; se anota lo que se vea.
- **Los servers de Nicolás en 8080-8082.** Mitigación: trabajo en `.worktrees/fase-19`, servers
  propios en otro puerto apagados por su PID, y nadie reconstruye el `dist/` de main.

## Stakeholders

Nicolás (aprobó el diseño); David Hassoun (lee el texto de 6.7; las preguntas 5 y 7 son de él).
