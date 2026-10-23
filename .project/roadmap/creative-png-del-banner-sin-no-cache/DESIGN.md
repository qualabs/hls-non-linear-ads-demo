---
description: content/adBanner/creative.png de hydration-break tiene nombre fijo y se sirve con la hora de caché pública, contra la regla de que lo de nombre fijo va con no-cache
status: idea
category: fix
impact: low
origin: "hls-demo-17, 2026-10-22, hallazgo de la fase 17 (selftest de publicar.py)"
---

`MUTABLE` de `scripts/publicar.py` decide qué se sirve con `no-cache` dentro de `content/` por
extensión, y `.png` no está: el `selftest` que agregó la fase 17 lo muestra
(`content/adBanner/creative.png  cached an hour`). Es el único PNG de nombre fijo bajo `content/` de
las cinco demos que se publica, y el `CLAUDE.md` del proyecto dice que todo lo de nombre fijo va sin
caché. Si se rehace el banner, el borde de Google lo sirve viejo hasta una hora. Arreglo probable:
`.png` en `MUTABLE` y su caso en el `selftest`, como se hizo con `.mp4` (ADR 0099).
