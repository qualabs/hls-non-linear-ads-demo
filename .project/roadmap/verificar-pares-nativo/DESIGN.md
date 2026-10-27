---
description: La parte vieja de stage-pair/test/verificar-pares.py (nativo contra nuestra librería) da rojo ya en bb0d78b
status: idea
category: fix
impact: medium
origin: "Cierre de la fase 19 (2026-10-26), hallazgo de T-08"
---

En `bb0d78b` contra `bb0d78b`, dos corridas: el pane nativo reproduce el lineal KETRAVA en A (donde
no hay default) y en C (donde va KOVRIN), con `t=0`, y otra corrida termina en un timeout. Los logs
están en `phases/19-svta2053-sobre-dash/tasks/T-08/base-bb0d78b-corrida-*.log`. Probable causa: el
pre-roll y el post-roll llegaron después de la fase 15, que escribió el verificador, y cada salto
rearma el pane nativo, que arranca de nuevo con su pre-roll. La parte HLS|DASH de la fase 19 no
tiene el problema.
