chequeo de links de demo/compatibility-pair/README.md
base para los relativos: /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair

  OK       ../../README.md                                            -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/README.md
  OK       ../../docs/contrato-senalizacion-renderizado.md            -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/docs/contrato-senalizacion-renderizado.md
  OK       brand/README.md                                            -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/brand/README.md
  OK       CREDITS.md                                                 -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/CREDITS.md
  OK       ../../README.md                                            -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/README.md
  OK       ../../docs/integrating-the-library.md                      -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/docs/integrating-the-library.md
  URL      http://localhost:8080/                                     [<autolink>]  (no se resuelve en disco)

links relativos rotos: 0
VERDICTO: todos los links relativos resuelven

segunda pasada: las rutas que el README nombra en backticks (no son links, pero envejecen igual)
  OK       ./run.sh                                                 -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/run.sh
  NO EXISTE /dist/                                                   -> /dist
  NO EXISTE /vendor/                                                 -> /vendor
  OK       CREDITS.md                                               -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/CREDITS.md
  OK       brand/                                                   -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/brand
  OK       brand/README.md                                          -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/brand/README.md
  OK       content/                                                 -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/content
  OK       css/player.css                                           -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/css/player.css
  OK       dist/                                                    -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/dist
  OK       docs/contrato-senalizacion-renderizado.md                -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/docs/contrato-senalizacion-renderizado.md
  OK       docs/integrating-the-library.md                          -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/docs/integrating-the-library.md
  OK       index.html                                               -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/index.html
  OK       js/app.js                                                -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/js/app.js
  OK       js/contract-trace.js                                     -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/js/contract-trace.js
  OK       js/stock-player.js                                       -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/js/stock-player.js
  OK       lib/                                                     -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/lib
  OK       run.sh                                                   -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/run.sh
  OK       scripts/                                                 -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/scripts
  OK       scripts/empaquetar-contenido.sh                          -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/scripts/empaquetar-contenido.sh
  OK       scripts/senalizar-contenido.sh                           -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/scripts/senalizar-contenido.sh
  OK       signalling/                                              -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/signalling
  OK       test/                                                    -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/test
  OK       test/signalled-run.test.js                               -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/demo/compatibility-pair/test/signalled-run.test.js
  OK       vendor/                                                  -> /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo/vendor

rutas en backticks que no existen: 2
  Los dos "NO EXISTE" son `/dist/` y `/vendor/`, y estan bien escritos: son las
  dos rutas de URL que el servidor monta desde la raiz del repositorio
  (README linea 42), no rutas de disco. El chequeador las tomo como absolutas.

VERDICTO FINAL: los seis links relativos del README resuelven, y las 22 rutas
que el documento nombra en backticks existen en disco menos las dos que son
puntos de montaje de URL y no archivos.
