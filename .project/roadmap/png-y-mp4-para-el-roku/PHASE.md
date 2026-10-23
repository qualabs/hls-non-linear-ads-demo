---
title: "El PNG y el MP4 de cada creativo, para el Roku"
description: "stage-pair y hydration-break publican, al lado de lo que la web dibuja, un PNG por cada SVG quieto y un MP4 VP9 sin audio por cada caja de video HLS, declarados como opciones gemelas del asset-list, para que el canal Roku funcione sólo con la URL de la playlist; la web elige y dibuja lo mismo que hoy"
started: 2026-10-22
origin: "Nicolás, 2026-10-22, despacho de agent-nicolas-laptop-865daf a hls-demo-17 (fase 17)"
depends_on: []
category: feature
---

# Fase 17: el PNG y el MP4 de cada creativo, para el Roku

El diseño está en `DESIGN.md`; esto es el contrato. El formato del asset-list es el del canal:
`hls-non-linear-ads-roku/.project/roadmap/todo-de-lo-publicado/DESIGN.md` §1 (commit `bab9afe`).

## Objetivo

Que el canal Roku encuentre en lo publicado de stage-pair y hydration-break una forma que dibuja para
cada aviso, y que la web, con cualquier capacidad declarada, elija y dibuje exactamente lo mismo que
hoy.

## Decisiones

- ADR 0096: lo publicado ofrece además PNG y MP4 VP9, como opciones gemelas de la HLS y la SVG.
- ADR 0097: la web dibuja lo mismo porque cada gemela pide lo mismo que la opción que tiene adelante.
- ADR 0098: el MP4 se transcodifica del HLS publicado.
- ADR 0099: `progressive.mp4` al lado de su HLS, y `.mp4` servido con `no-cache`.
- ADR 0100: `codecs` se lee del `vpcC` del archivo.
- ADR 0101: el PNG es el `-fijo.svg` rasterizado, en git, con un chequeo de que está al día.
- ADR 0102: los ítems de hydration-break pasan a `options`, y sus lectores leen la primera.
- ADR 0103: primero el contenido, después el push.

## Alcance

1. `scripts/progresivo.sh`: HLS a MP4 VP9 sin audio, y el `codecs` leído del archivo.
2. stage-pair: los MP4 de `zumbra-16x9`, `ketrava-backplate` y `kovrin-banner`; los PNG de los tres
   `-fijo.svg`; `stage.json` con sus rutas; los asset-lists A, B y C con cuatro opciones; los tests
   que cuentan opciones.
3. hydration-break: los MP4 de `adL` y `adOverlay`; su asset-list con `options`; los lectores de
   `payload[0].layout` (scripts, tests y `js/senalizacion.js`).
4. `scripts/publicar.py`: `.mp4` en `MUTABLE`.
5. La verificación de que la web no cambia, y un árbol local para el Roku.
6. La publicación, con el OK de Nicolás.

## Fuera de alcance

- `lib/` y cualquier cambio de lo que la web dibuja.
- El eje de capacidad "MP4 estático".
- El canal Roku.
- race-multiview, multiview-offer, compatibility-pair y los avisos de la carrera de stage-pair.

## Riesgos

- **La web elige otra cosa.** Mitigación: la propiedad del ADR 0097 medida contra los asset-lists de
  `main` en las cinco capacidades, la red sin pedidos de `.png`/`.mp4` de creativos, y las suites
  existentes enteras antes y después (T-05).
- **Un lector de hydration-break que no se enteró de `options` falla en silencio.** Mitigación: grep
  de los accesos a `layout` en toda la demo (T-03) y capturas de la página antes y después (T-05).
- **`--con-contenido` borra del bucket lo que no está en el `content/` local.** Mitigación: la corrida
  en seco lista lo que copiaría y borraría, y se lee antes de pedir el OK (T-04).
- **El MP4 largo desde `tmp:/` en AnimatedImage.** Es del Roku; acá se le entrega el árbol local para
  que lo pruebe antes de publicar (T-06).
- Aceptado: `adL` dura 15,958 s contra su slot de 16, lo mismo que su HLS.

## Stakeholders

Nicolás (OK de publicación); la sesión `roku-ads-02` del canal Roku (consume el formato y el árbol).
