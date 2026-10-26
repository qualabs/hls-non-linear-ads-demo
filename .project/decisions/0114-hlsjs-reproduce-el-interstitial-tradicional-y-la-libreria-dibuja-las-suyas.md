---
id: "0114"
title: Las dos clases en un player; hls.js reproduce el interstitial tradicional con su maquinaria encendida y la librería dibuja las suyas
status: accepted
scope: project
date: 2026-10-22
supersedes: "0002"
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0002 apagó la maquinaria de interstitials de hls.js (`hlsConfig = {
interstitialsController: undefined }`) y la librería avisaba con `console.error` si estaba
encendida, porque la misma playlist llevaba un tag de Apple por break (ADR 0007) y con la
maquinaria encendida nuestro pane reemplazaba el contenido. El ADR 0113 deja un juego de tags por
stream y la clase la elige el cliente, así que ese motivo desaparece. Y el 2026-10-22 David
Hassoun decidió **(c)**: nuestro player tiene que soportar las dos clases en una sola
implementación, con un break lineal tradicional `CLASS="com.apple.hls.interstitial"` escrito en
la playlist (no sustituido) en un momento que no se solape con ningún otro.

## Decisión

- **La maquinaria de hls.js queda encendida, que es su default.** Se va `hlsConfig` del global y
  de todas las páginas (`new Hls()`). hls.js reproduce los Date Ranges de clase Apple; la
  librería dibuja las suyas, que esa maquinaria nunca agenda (`dateRange.isInterstitial` compara
  con la clase de Apple). No se pelean por un break.
- **`checkConfig` se invierte:** con la maquinaria APAGADA escribe un `console.warn` (un
  interstitial tradicional del stream no se reproduciría) y deja el mensaje en
  `handle.diagnostics`. No es error: puede ser lo que el integrador quiere.
- **Mientras hls.js reproduce uno de sus interstitials no se dibuja nada nuestro.** Se detecta con
  `interstitialsManager.playingItem.event` (`linearOnScreen`). Durante ese tiempo el renderer
  recibe `activeAt` vacío, y el tracking (que lee lo presentado) tampoco ve nada. No es una
  resolución de solapamiento —el ADR 0113 dice que no se solapan y que si se solapan "se
  resuelven como siempre"—: sólo evita dibujar cajas sobre el aviso de hls.js, que puede estar
  usando el mismo `<video>` con su propio MediaSource.
- **El reloj del programa** (`createProgramme`, en `lib/signalling.js`): el elemento, salvo
  mientras hls.js reproduce un interstitial, que es `interstitialsManager.primary` (largo y
  posición del programa). Es la fachada que el pane de fábrica de `stage-pair` ya se armaba. Los
  controles reciben esa fachada en lugar del elemento; el handle la expone como `programme` y
  agrega `linearOnScreen()`. Un seek escrito durante el aviso va por hls.js, que aplica su
  `X-RESTRICT`.
- **La señalización ignora lo que el elemento dice durante el aviso:** `due` y `spend` (pedido a
  demanda, ADR 0108; ONCE, ADR 0112) no corren mientras hay un interstitial de hls.js en
  pantalla, y el `ended` del elemento cuenta como fin del programa sólo si el reloj del programa
  está en el fin (`programmeAtEnd`): el `ended` también llega al terminar el asset del aviso.
  `lib/postroll.js` recibe la misma condición (`programmeEnded`).
- **La barra marca las dos clases:** las nuestras desde el contrato (`KINDS_PLAYED` sigue siendo
  `concurrent` y `multiview`: lo que esta librería dibuja) y las de Apple desde el schedule de
  hls.js (`scheduledRanges`: `resumeTime - startTime`, sin postroll, sin los breaks que hls.js
  saltea por no tener asset). Es la lectura que el pane de fábrica ya hacía para su barra. El
  rango que la señalización reporta del tag de Apple no se usa para la barra: es la palabra de la
  playlist, no la del player (ADR 0018).

## Si un break nuestro y uno de Apple se solapan: gana el lineal

Decidido por David el 2026-10-23, con la regla de arriba tal como está. Ante un solapamiento (que
el ADR 0113 prohíbe, pero que un stream puede traer por error) el lineal de hls.js tiene
prioridad: mientras está en pantalla no se dibuja ni se cuenta nada nuestro, y si al volver el
programa la ventana nuestra sigue abierta, se retoma.

Es el mismo criterio que hls.js 1.7.2 aplica entre sus propios interstitials: nunca dos avisos a la
vez. `parseSchedule` (`interstitials-schedule.ts`) los ordena por inicio y no chequea el
solapamiento: si B empieza antes de que termine A, el hueco de programa entre los dos da negativo
y B se pone entero a continuación (A 100–112 y B 105–117 se ven como A, B, y el programa vuelve en
117). hls.js puede encolarlos porque un lineal detiene el programa; un no lineal está atado al
tiempo del programa y no se puede correr, así que el equivalente nuestro es ceder. La spec
(rfc8216bis) sólo define el caso de mismo `START-DATE` (orden de tags, `X-RESUME-OFFSET`
acumulativo); el solapamiento parcial no está definido.

## El postroll (ADR 0111) y su Abierto

- Un tag de Apple con `CUE="POST"` en el stream lo reproduce hls.js, después del programa, como
  cualquier player de mercado. Nuestra regla para nuestras clases no cambia: un postroll
  concurrente o de multi view nunca es no lineal; cae a su default lineal o se saltea.
- **El Abierto del ADR 0111 se cierra en la opción 1, y la opción 2 queda sin objeto.** La opción
  2 era usar la lista del tag de Apple "apareado" cuando un postroll concurrente no tiene lineal.
  Con un juego de tags por stream (ADR 0113) ya no hay tag apareado: un break es de una clase o de
  la otra según el cliente, y si un stream quiere un postroll lineal real lo escribe como Apple y
  lo reproduce hls.js.

## Consecuencias

- Supersede al ADR 0002. El argumento del ADR 0007 de que el pane nuestro corre "con su maquinaria
  apagada" ya no vale: los dos panes de los pares son `new Hls()` y difieren en la librería y en el
  parámetro de la URL.
- En las playlists de hoy (después del ADR 0113) nuestro pane no recibe ningún tag de Apple hasta
  que el ADR 0115 agrega el break lineal escrito; el comportamiento visible no cambia con este
  ADR solo.
- Tests: `test/both-classes.test.js` (las funciones puras, la fachada, la señalización y el
  postroll con un `ended` que no es del programa).
