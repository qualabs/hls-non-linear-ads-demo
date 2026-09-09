chequeo de links de demo/compatibility-pair/README.md
base para los relativos: ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair

  OK       ../../README.md                                            -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/README.md
  OK       ../../docs/contrato-senalizacion-renderizado.md            -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/docs/contrato-senalizacion-renderizado.md
  OK       brand/README.md                                            -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/brand/README.md
  OK       CREDITS.md                                                 -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/CREDITS.md
  OK       ../../README.md                                            -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/README.md
  OK       ../../docs/integrating-the-library.md                      -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/docs/integrating-the-library.md
  URL      http://localhost:8080/                                     [<autolink>]  (no se resuelve en disco)

links relativos rotos: 0
VERDICTO: todos los links relativos resuelven

segunda pasada: las rutas que el README nombra en backticks (no son links, pero envejecen igual)
  OK       ./run.sh                                                 -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/run.sh
  NO EXISTE /dist/                                                   -> /dist
  NO EXISTE /vendor/                                                 -> /vendor
  OK       CREDITS.md                                               -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/CREDITS.md
  OK       brand/                                                   -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/brand
  OK       brand/README.md                                          -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/brand/README.md
  OK       content/                                                 -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/content
  OK       css/player.css                                           -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/css/player.css
  OK       dist/                                                    -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/dist
  OK       docs/contrato-senalizacion-renderizado.md                -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/docs/contrato-senalizacion-renderizado.md
  OK       docs/integrating-the-library.md                          -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/docs/integrating-the-library.md
  OK       index.html                                               -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/index.html
  OK       js/app.js                                                -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/js/app.js
  OK       js/contract-trace.js                                     -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/js/contract-trace.js
  OK       js/stock-player.js                                       -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/js/stock-player.js
  OK       lib/                                                     -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/lib
  OK       run.sh                                                   -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/run.sh
  OK       scripts/                                                 -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/scripts
  OK       scripts/empaquetar-contenido.sh                          -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/scripts/empaquetar-contenido.sh
  OK       scripts/senalizar-contenido.sh                           -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/scripts/senalizar-contenido.sh
  OK       signalling/                                              -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/signalling
  OK       test/                                                    -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/test
  OK       test/signalled-run.test.js                               -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/test/signalled-run.test.js
  OK       vendor/                                                  -> ~/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/vendor

rutas en backticks que no existen: 2
  Los dos "NO EXISTE" son `/dist/` y `/vendor/`, y estan bien escritos: son las
  dos rutas de URL que el servidor monta desde la raiz del repositorio
  (README linea 42), no rutas de disco. El chequeador las tomo como absolutas.

VERDICTO FINAL: los seis links relativos del README resuelven, y las 22 rutas
que el documento nombra en backticks existen en disco menos las dos que son
puntos de montaje de URL y no archivos.
