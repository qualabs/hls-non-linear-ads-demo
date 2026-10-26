---
description: Que la librería y los asset-lists publicados anden en una página que no se sirve desde el bucket, y que una plataforma pueda cambiar la capa de medios sin componer la librería a mano
status: idea
category: feature
origin: "tizen-ads-01, 2026-10-26, hallazgos del proyecto hls-non-linear-ads-tizen (fase 01); Nicolás vía agent-nicolas-laptop-865daf"
---

La app de Tizen (`projects/hls-non-linear-ads-tizen`) corre la librería de esta demo sin cambios
(copiada de 9c4ef51), y para hacerlo tuvo que rodear dos cosas que en la web no se notan porque la
página está en el mismo bucket que el contenido:

- **Los URIs de los asset-lists publicados son relativos a la raíz** (`/content/creatives/…`,
  `/graphics/…`, y el `URI` de los lineales). La librería se los pasa tal cual al `<img>` y al
  reproductor, y hls.js 1.7.2 hace lo mismo con los assets de un interstitial de Apple: resuelven contra
  la página. En una página de otro origen (una app de TV, un integrador con su propio sitio) no cargan:
  en la TV las imágenes no aparecían y los interstitials daban `network error (status 0)`. La app los
  resuelve contra la URL del asset-list de donde salió cada uno, que es como HLS resuelve los URIs de un
  asset list; para Apple, un loader de hls.js que resuelve contra la playlist.
- **`attach()` fija su `attachAsset`.** Una plataforma con un solo decodificador (Tizen) necesita otra
  capa de medios (ahí, video por software dentro del mismo nodo del renderer), y como `attach()` no la
  deja pasar, la app compone ella misma `createSignalling`, `createMultiview`, `createRenderer` y
  `createTracking`, y no puede usar el `dist/` publicado.

Lo que esta idea podría ser, sin decidir: que `resolveElement` (o el renderer) resuelva cada `uri`
contra la URL del asset-list, y que `attach()` acepte un `attachAsset` opcional. Evidencia y
mediciones en `projects/hls-non-linear-ads-tizen/.project/phases/01-la-demo-en-tizen/` (T-02, T-05) y
sus ADR 0001 y 0002.

Un dato más de la misma fase, para quien toque el renderer: al terminar cada break, `clear()` devuelve
el programa a la hoja de estilos borrando todo su atributo `style`; una página que dimensione el
`<video>` del programa con un `style` inline lo ve quedar en su tamaño intrínseco. Hoy está dicho
sólo en los comentarios de `clear()` y `movePrimary` en `lib/renderer.js`; quizá valga decirlo en el README de integración.
