---
id: 0002
title: Apagar la maquinaria de interstitials de hls.js y manejar los Date Ranges por cuenta propia
status: accepted
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

Se leyó el código del paquete publicado `hls.js@1.7.2`, la versión
`latest` del registro de npm al 2026-09-03. Las referencias son
`archivo:línea` dentro de `package/src/` de ese paquete.

hls.js tiene soporte de HLS Interstitials y está cerrado sobre la clase
de Apple. El único lugar donde se decide si un DATERANGE es un
interstitial es `controller/interstitials-schedule.ts:350`, que pregunta
`if (dateRange.isInterstitial)`. Ese getter está en
`loader/date-range.ts:189` y es literalmente
`return this.class === CLASS_INTERSTITIAL`, con
`const CLASS_INTERSTITIAL = 'com.apple.hls.interstitial'` declarado como
constante de módulo en la línea 26, sin configuración y sin exportar. Un
DATERANGE con `CLASS="com.qualabs.hls.concurrentInterstitial"` nunca se
convierte en un evento de interstitial.

Esa maquinaria es además de reemplazo y no de concurrencia: cuando
reproduce un interstitial transfiere el MediaSource entre el player
primario y el del asset (`controller/interstitials-controller.ts:766`
`transferMediaFromPlayer` y `:795` `transferMediaTo`). Hay un solo
elemento de media y se lo pasan entre ellos, así que nada ahí dibuja dos
fuentes al mismo tiempo, que es lo que esta demo tiene que mostrar.

El mecanismo entero se puede apagar por configuración: en `hls.ts:223`
el controlador se instancia solamente si `config.interstitialsController`
es truthy. Y el tag no se pierde, porque el parser guarda todos los
DATERANGE sin filtrar por clase (`loader/m3u8-parser.ts:578`) y el
resultado queda en `LevelDetails.dateRanges`
(`loader/level-details.ts:22`), que llega a la aplicación en el evento
`LEVEL_UPDATED` (`types/events.ts:237`, campo `details`).

## Decisión

El cliente de la demo apaga la maquinaria de interstitials de hls.js por
configuración y maneja los Date Ranges por su cuenta. hls.js entra sin
modificar, en su rol de player del contenido primario. La aplicación se
suscribe a `LEVEL_UPDATED`, lee `details.dateRanges`, se queda con los
que tienen la clase concurrente, y sigue el flujo por su cuenta.

## Consecuencias

No hay fork ni compilación desde el fuente, y el trabajo queda del lado
de la aplicación, que es donde está la parte que importa.

Rob Walch, que mantiene hls.js, sugiere el mismo camino para una demo:
"You could just put all of your Date Ranges in an HLS Media Playlist,
HLS.js and AVPlayer will both 'see' them just the same as if they had
been loaded in a Schedule". La salvedad que él mismo marca es que así se
saltea el decisioning del ad server, y no aplica acá porque el ad server
está fuera de alcance.

Hay una consecuencia incómoda que conviene decir: así el POC no
demuestra la forma óptima que pide el documento de requerimientos de
David, que es una librería que reemplaza la clase por defecto adentro
del player. Demuestra la experiencia y el modelo de datos. La forma
óptima se aborda después, y la separación en dos capas del ADR 0003 es
lo que hace que abordarla no sea reescribir.

Quedan descartadas dos alternativas. **Parchear hls.js ahora**, cambiando
el gate de clase y construyendo un controlador propio, es una línea para
el gate, pero después hay que construir la concurrencia adentro de una
maquinaria hecha para reemplazar, y se paga un fork y una compilación
desde el fuente antes de tener nada en pantalla. **Inyectar un
controlador propio por `config.interstitialsController`** tampoco sirve:
la configuración acepta
`interstitialsController?: typeof InterstitialsController`
(`config.ts:387`), pero esa clase no está en los exports de runtime del
paquete, sino solamente en los tipos (`dist/hls.d.mts:4094`), así que no
se puede importar para heredar de ella y el hook obliga igual al fork,
sin la ventaja de ser el camino soportado.
