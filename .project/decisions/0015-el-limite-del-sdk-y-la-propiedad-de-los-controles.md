---
id: 0015
title: Cortar la librería de la aplicación de demo, con los controles del lado de la librería
status: accepted
scope: phase-02
date: 2026-09-04
supersedes: null
superseded_by: null
---

## Contexto

El documento de requerimientos pide una librería implementable adentro de la
aplicación cliente. David lo dijo en la reunión del 2026-09-04 con la forma
que importa acá: "we have a library, and then we have an implementation of
that Library. We should be like, kind of like two separate projects of
sorts, right?" (22:26), y antes, sobre por qué: "then it's actually like
clean on how this could be distributed and shared" (15:35). Nicolás la
describió ya con forma de API: "this is like an SDK you add to hls.js as a
plugin SDK. Whatever you configure in this way, you have to initialize this,
you have to create your player, then you have to turn on concurrent, and
there is an optional configuration of decoders" (36:22).

Hoy el repositorio tiene una sola costura, la del ADR 0003, que separa
señalización de renderizado. La que falta es la otra: qué es librería y qué
es la página que la usa. `js/app.js` es el archivo que une las dos capas y
además es la página, y adentro suyo está `attachAsset`, que es el que sabe
convertir un `uri` en píxeles y por lo tanto el que sabe de hls.js.

Y hay un hecho del código que decide quién es dueño de los controles.
**El renderizado ya es hoy dueño del elemento que va a fullscreen y de cómo
se presenta el contenido primario**: dibuja adentro de `#player` y mueve el
`<video>` primario con `transform: translate(...) scale(sx, sy)`
(`js/renderer.js:191`). Los controles nativos son parte del elemento de
video, así que escalan con esa transformación; y con más de un `<video>` en
pantalla no controlan la experiencia sino uno de sus pedazos. Un tercero que
integre esto no puede quedarse con sus controles nativos sobre ese elemento.

## Decisión

El repositorio pasa a tener dos cosas con una línea en el medio: **la
librería** y **la aplicación de demo**.

La librería se lleva la capa de señalización (`js/signalling.js`), la de
renderizado (`js/renderer.js`), el `attachAsset` que hoy vive en `js/app.js`
—que es funcionalidad y no plomería del integrador, porque es el que sabe de
hls.js— y **los controles del reproductor**.

La aplicación de demo se queda con `index.html`, el player de fábrica del par
de compatibilidad (`js/stock-player.js`) y `js/contract-trace.js`.

**La librería es dueña del contenedor**: dibuja adentro, mueve el primario,
maneja los controles y el fullscreen de la composición, y los controles
nativos sobre el contenido primario no van.

**La superficie pública es lo que el integrador escribe en su página y nada
más.** Un `<script src>`, una instancia de hls.js, un contenedor, encender lo
concurrente, y una configuración opcional. Se fija con los controles
construidos y no antes, porque los controles son la mayor parte de esa
superficie.

**Distribución: un `<script src>` clásico que define un global, sin bundler y
sin una dependencia de npm.**

**El corte se verifica, no se afirma**, con el mismo método que el ADR 0003:
un grep desde el lado de la librería que no encuentre una sola referencia a
la demo, la demo corriendo contra la librería construida, y la página del
integrador medida en líneas.

## Consecuencias

**El corte va primero adentro de la fase.** Todo lo que se construya antes se
construye del lado equivocado de la línea y hay que mudarlo después. Vale
para los controles de esta fase y vale para el `decoderCount` y el repliegue
de la fase 03, que son por diseño configuración y comportamiento del SDK.

Los controles dejan de ser decoración de la página del integrador y pasan a
ser parte de lo que el SDK entrega. Un SDK cerrado antes de que existieran
habría publicado "dame una instancia de hls.js y un div, yo dibujo cajas", y
la fase siguiente lo republicaría como "dame un contenedor, yo manejo el
chrome del player y traigo mi CSS".

**El `<script src>` sin bundler tiene un costo y conviene decirlo.** El
código de hoy son módulos ES nativos con `import`/`export` entre cuatro
archivos, e `index.html` los carga con `type="module"`; un script clásico que
define un global no puede tener esos `import`. O la librería termina siendo
un archivo, o hay un paso que la concatena, como `run.sh` ya genera la
playlist señalizada en cada arranque. Lo que esta decisión conserva es la
ausencia de bundler y de dependencias, que es una propiedad deliberada de la
fase 01; lo que no conserva es que el browser resuelva los módulos por su
cuenta. La alternativa —entregar la librería como módulo ES y pedirle al
integrador un `<script type="module">`— queda descartada porque "alguien que
no somos nosotros agrega esto a su página" se parece a un `<script src>` y no
a una migración del modo en que esa página carga su código.

**El pane de fábrica conserva sus controles nativos, y eso no es una
inconsistencia.** Es un cliente de mercado y así se ve un cliente de mercado
(ADR 0007). La asimetría visual entre los dos panes refuerza el argumento de
compatibilidad en lugar de debilitarlo.

> **Nota del 2026-09-04.** Este párrafo afirma un hecho que no era cierto
> cuando se escribió: el pane del player sin modificar entró en la T-09 de la
> fase 01 con `playsinline muted` y **nunca tuvo controles nativos**. El único
> que los tenía era el nuestro, o sea la asimetría al revés de como está
> descrita. Al preguntárselo, Nicolás decidió que **no se muestran controles
> nativos en ninguno de los dos panes, sólo los nuestros**, así que la
> asimetría deja de existir y el argumento de compatibilidad se apoya en lo
> que ya lo sostenía: que uno reemplaza el contenido y el otro no, y que al
> final del recorrido el player sin modificar va 49,5 s de programa atrás.

La fase de iOS hereda el límite y no el código. Lo que se comparte entre las
dos plataformas es dónde está la línea y qué queda de cada lado, igual que el
ADR 0003 comparte el contrato y no la implementación.

Y queda un riesgo que se acepta explícito: **ser dueño del contenedor es una
promesa más grande que la que la demo necesita**, y es la que un tercero nos
va a hacer valer. Se acepta porque la alternativa —dejarle los controles al
integrador— no funciona sobre un elemento que el renderizador escala.

> **Nota del 2026-09-07.** La fase 04 le agrega dos cosas a este ADR y no le
> contradice ninguna.
>
> 1. **Los controles funcionan con o sin experiencias concurrentes.** Este ADR
>    dice que la librería es dueña de los controles y que la superficie pública
>    es lo que el integrador escribe en su página; lo que no decía, porque nada
>    lo necesitaba, es si el cromo se puede usar solo. Se puede y tiene que
>    poder: un integrador puede querer uno y no el otro, y la demo lo necesita
>    para ponerle nuestro skin al pane del cliente de mercado sin convertirlo en
>    un cliente modificado, que es lo que rompería el ADR 0007. En el código la
>    separación ya estaba casi hecha —`createControls` acepta `provider = null` y
>    su archivo no nombra ni a la señalización ni al renderizado—, así que lo que
>    la fase agrega es una entrada pública más, escrita en
>    `docs/integrating-the-library.md`. Ser dueño del contenedor sigue siendo la
>    promesa de este ADR; lo que se amplía es que esa propiedad no viene atada a
>    encender lo concurrente.
> 2. **La pata del argumento de compatibilidad que la nota del 2026-09-04 apoya
>    en el atraso se retira.** Esa nota dejó el argumento apoyado en dos cosas:
>    que uno reemplaza el contenido y el otro no, y que al final del recorrido el
>    player sin modificar va 49,5 s de programa atrás. El ADR 0017 hace que el
>    pane sin modificar reemplace en lugar de insertar, así que el atraso deja de
>    existir y esa segunda pata se cae. La primera es la que queda, y es la que
>    ahora se ve en un cuadro solo: al mismo segundo del programa, uno muestra el
>    aviso encima del programa y el otro en lugar del programa.
