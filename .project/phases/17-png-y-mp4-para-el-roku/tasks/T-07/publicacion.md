# T-07 — la publicación (2026-10-23)

OK de Nicolás ("Si" a "Publicar la fase 17 de la demo. Primero se sube content/ con los MP4 y después
se hace el push. ¿Va?"), por agent-nicolas-laptop-865daf. Orden del ADR 0103.

1. Merge de `fase-17` a `main` local: b790757. Los cinco `progressive.mp4` copiados al `content/` del
   checkout principal (`cmp` igual al del worktree). Corrida en seco desde ahí: igual a la de T-04, 0
   borrados.
2. `scripts/publicar.sh --publicar --con-contenido stage-pair hydration-break`, exit 0:

```
== 3. stage-pair: publish ==
   metadata to fix: 0 .ts without video/mp2t, 6 objects without no-cache
== 4. stage-pair: the bucket against the stage, by md5 ==
   512 files, 512 objects: 0 differ, 0 absent, 0 extra, 0 cacheable, 0 .ts without video/mp2t
   control: remote index.html against local dist js -> DIFFERENT
== 5. stage-pair: WITHOUT credentials and without cache-busting ==
   13 URLs against the repo, 0 different
   /no-existe.json  -> 404  (control: a 404 has to be seen as one)
== 3. hydration-break: publish ==
   metadata to fix: 0 .ts without video/mp2t, 3 objects without no-cache
== 4. hydration-break: the bucket against the stage, by md5 ==
   139 files, 139 objects: 0 differ, 0 absent, 0 extra, 0 cacheable, 0 .ts without video/mp2t
   control: remote index.html against local dist js -> DIFFERENT
== 5. hydration-break: WITHOUT credentials and without cache-busting ==
   4 URLs against the repo, 0 different
   /no-existe.json  -> 404  (control: a 404 has to be seen as one)
```

3. Sin credenciales (`curl`, estado, tipo, `Cache-Control`, bytes):

```
200 video/mp4 no-cache 676726 stage-pair.storage.googleapis.com/content/creatives/zumbra-16x9/d8eabbdae4/progressive.mp4
200 video/mp4 no-cache 627799 stage-pair.storage.googleapis.com/content/creatives/ketrava-backplate/8d140e0f2b/progressive.mp4
200 video/mp4 no-cache 424107 stage-pair.storage.googleapis.com/content/creatives/kovrin-banner/8e5914d854/progressive.mp4
200 image/png no-cache 460673 stage-pair.storage.googleapis.com/graphics/campaigns/zumbra-backplate-fijo.png
200 image/png no-cache 591148 stage-pair.storage.googleapis.com/graphics/campaigns/ketrava-16x9-fijo.png
200 image/png no-cache 326433 stage-pair.storage.googleapis.com/graphics/campaigns/kovrin-backplate-fijo.png
200 video/mp4 no-cache 942331 hydration-break.storage.googleapis.com/content/adL/progressive.mp4
200 video/mp4 no-cache 955540 hydration-break.storage.googleapis.com/content/adOverlay/progressive.mp4
200 application/json no-cache 2939 stage-pair.storage.googleapis.com/signalling/asset-list-break-a.json
200 application/json no-cache 4169 hydration-break.storage.googleapis.com/signalling/asset-list-hydration-break.json
control, un .mp4 que no existe: 404
```

4. Push a `main` (568f727..b790757). Run de Actions 39892946733: `completed success`. Como tocó
   `scripts/`, republicó las cinco: en cada una "0 differ, 0 absent, 0 extra, 0 cacheable" contra el
   escenario, y las URLs sin credenciales "0 different" con el control de 404.
