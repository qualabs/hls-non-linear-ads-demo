# T-08: cada test visto en rojo antes de darlo por bueno

Se rompió a mano una cosa por vez en `js/signalling.js` o `js/renderer.js`, se
corrió `npm test`, se anotó qué test se puso rojo y se devolvió el código con
`git checkout -- js/`. El script es `t08-mutar.py` y su salida cruda,
`t08-resultado.json`.

Las 18 mutaciones dieron exit 1, ninguna sobrevivió, y los 15 tests aparecieron
en rojo por lo menos una vez.

## Por mutación

- M01 parseViewport swaps right with left  (exit 1)
    rojo: viewport is four inset percentages in the order top right bottom left
    rojo: the insets become the fifteen boxes in pixels T-03 measured
- M02 parseViewport stops checking the four numbers  (exit 1)
    rojo: a viewport that is not four numbers falls back to the full frame, and warns
- M03 startTime forgets the slotStart  (exit 1)
    rojo: each of the six asset-lists resolves to one experience with its type and window
    rojo: activeAt returns every experience active at that instant
- M04 duration off by one second  (exit 1)
    rojo: each of the six asset-lists resolves to one experience with its type and window
    rojo: activeAt returns every experience active at that instant
- M05 an empty uri is taken as a uri  (exit 1)
    rojo: the fifteen elements come out with the ids, the uri and the mediaType of the payload
- M06 mediaType is dropped  (exit 1)
    rojo: the fifteen elements come out with the ids, the uri and the mediaType of the payload
- M07 the sort by zDepth is removed  (exit 1)
    rojo: elements come out ordered by ascending zDepth in the six layouts
    rojo: in squeezebackFrame the ad is the background and the primary content is on top
- M08 the sort by zDepth is reversed  (exit 1)
    rojo: elements come out ordered by ascending zDepth in the six layouts
    rojo: in squeezebackFrame the ad is the background and the primary content is on top
- M09 the assets go into the array before the primary  (exit 1)
    rojo: on an equal zDepth the order of the payload holds
- M10 the assumed primaryContent changes  (exit 1)
    rojo: viewport is four inset percentages in the order top right bottom left
    rojo: the two overlays carry no primaryContent, and the layer assumes the full frame at zDepth 0
    rojo: the insets become the fifteen boxes in pixels T-03 measured
- M11 the payload's primaryContent is ignored  (exit 1)
    rojo: viewport is four inset percentages in the order top right bottom left
    rojo: in squeezebackFrame the ad is the background and the primary content is on top
    rojo: the four layouts that do carry primaryContent keep its zDepth and its viewport
    rojo: an explicit volume of 0 survives, because a silent ad is silent on purpose
    rojo: the insets become the fifteen boxes in pixels T-03 measured
    rojo: the conversion follows the player area, which is what a resize depends on
- M12 the assumed volume changes  (exit 1)
    rojo: no payload of the tool carries volume, and every element comes out at 100
    rojo: an explicit volume of 0 survives, because a silent ad is silent on purpose
- M13 volume falls back with || instead of ??  (exit 1)
    rojo: an explicit volume of 0 survives, because a silent ad is silent on purpose
- M14 the window opens one instant late  (exit 1)
    rojo: the activation window is half open: in at startTime, out at the end
- M15 the window closes one instant late  (exit 1)
    rojo: the activation window is half open: in at startTime, out at the end
- M16 only the first active experience comes back  (exit 1)
    rojo: activeAt returns every experience active at that instant
- M17 the width forgets to subtract the left inset  (exit 1)
    rojo: the insets become the fifteen boxes in pixels T-03 measured
    rojo: the conversion follows the player area, which is what a resize depends on
- M18 the left inset is computed on a hard-coded 960  (exit 1)
    rojo: the conversion follows the player area, which is what a resize depends on

## Por test: la mutación que lo puso rojo

- viewport is four inset percentages in the order top right bottom left
    M01, M10, M11
- the insets become the fifteen boxes in pixels T-03 measured
    M01, M10, M11, M17
- a viewport that is not four numbers falls back to the full frame, and warns
    M02
- each of the six asset-lists resolves to one experience with its type and window
    M03, M04
- activeAt returns every experience active at that instant
    M03, M04, M16
- the fifteen elements come out with the ids, the uri and the mediaType of the payload
    M05, M06
- elements come out ordered by ascending zDepth in the six layouts
    M07, M08
- in squeezebackFrame the ad is the background and the primary content is on top
    M07, M08, M11
- on an equal zDepth the order of the payload holds
    M09
- the two overlays carry no primaryContent, and the layer assumes the full frame at zDepth 0
    M10
- the four layouts that do carry primaryContent keep its zDepth and its viewport
    M11
- an explicit volume of 0 survives, because a silent ad is silent on purpose
    M11, M12, M13
- the conversion follows the player area, which is what a resize depends on
    M11, M17, M18
- no payload of the tool carries volume, and every element comes out at 100
    M12
- the activation window is half open: in at startTime, out at the end
    M14, M15

Tests cubiertos por al menos una mutación: 15 de 15.
