---
phase: 11-el-multi-view-que-elige-quien-mira
title: "El multi view que elige quien mira: el que publica ofrece un catálogo y quien mira arma la composición"
status: closed
started: 2026-09-11
closed: 2026-09-11
---

# Fase 11: el multi view que elige quien mira

El proyecto tiene un tag que anuncia una experiencia concurrente y un reproductor
que la dibuja: el que publica declara el layout y el cliente obedece. Esta fase
agrega un segundo tag donde el que publica **ofrece un catálogo** y quien mira
**arma su propia composición**, subiendo y bajando cámaras mientras la ventana
está abierta.

El diseño y sus descartes están en `DESIGN.md`; las decisiones, en los ADR 0063 a
0072. Este documento es el contrato de la fase.

## Objetivo

Que la SDK funcione con los dos tags, y que el comportamiento del nuevo sea el que
Nicolás describió: un catálogo anunciado, un selector en los controles, tres
formas de grilla, agrandar con foco completo, y una salida que devuelve el
contenido principal como venía.

## Alcance

1. **El tag y el bloque.** La clase `com.qualabs.hls.multiViewInterstitial`, el
   `kind` `'multiview'` en sus tres tablas, y la lectura de un `payload` de tipo
   `multiViewOffer` con `views[]` —`id`, `name`, `type`, `uri`— y `primaryName`
   (ADR 0063, 0064).
2. **La geometría**, como función pura de N a `viewport`, con las tres formas y
   con N=1 devolviendo la lista vacía (ADR 0065).
3. **El estado de quien mira**, en `lib/multiview.js`, decorando al proveedor
   (ADR 0072).
4. **La composición que cambia sin reconstruirse**: `build()` y `clear()` por
   diferencia, y una cuarta razón para `place()` (ADR 0070).
5. **El selector**, como lista de casilleros en la fila de arriba de los
   controles, con el mecanismo de *holds* que lo mantiene abierto (ADR 0066,
   0067).
6. **El anuncio**: el popup transitorio y el punto persistente (ADR 0068).
7. **Agrandar y desagrandar**, con foco completo de ida y sin tocar el audio a la
   vuelta (ADR 0069).
8. **La salida**, por sus dos entradas y con una sola implementación (ADR 0071).
9. **La demo `demo/multiview-offer/`**, con los dos tags en una playlist.
10. **La documentación**: los dos documentos de `docs/` y el README de la demo.

## El criterio de la fase

**Nada de lo que ya funciona de publicidad se rompe, y eso se prueba y no se
promete.** Es un requisito de Nicolás y no una buena costumbre: *"en el proceso
también verificar que no se rompa nada de lo que hicimos de ads, si hay tests o
cosas correrlas obviamente"*.

La línea de base está medida hoy, antes de tocar nada:

| chequeo | comando | línea de base 2026-09-11 |
| --- | --- | --- |
| la suite | `npm test` | **72 pruebas, 72 pasan, 0 fallan** |
| las dos costuras | `npm run check` | verde |
| la campaña de la demo grabada | `npm run mutaciones` | corre |

De ahí salen tres reglas de ejecución.

**La suite entera en verde es condición de cierre de cada task que toque `lib/`,
no un paso al final.** Al final es donde se descubre tarde cuál de seis cambios lo
rompió. El número de la tabla es el del día en que se abrió la fase y sube cada vez
que una task agrega pruebas: lo que se compara es contra el conteo con el que esa
task arrancó, nunca contra un número escrito acá.

> **Nota del 2026-09-11.** La celda de las costuras decía "cero hits en las dos" y
> nunca fue cierto: la primera tiene tres ocurrencias, las tres en la lista aceptada
> del propio chequeo, así que está verde. Se corrige la celda y se deja dicho, porque
> la frase sobrevivió a toda la fase repetida en los despachos.

**Y la suite sola no alcanza, y hay que decir exactamente por qué.** El cambio
grande de la fase es `build()` y `clear()` pasando a trabajar por diferencia, y
ése es justo el código que dibuja los avisos que ya andan. Las 72 pruebas fueron
escritas contra el comportamiento **total**, así que **pueden pasar enteras
mientras la composición de un aviso quedó distinta en pantalla**. La propiedad que
hay que fijar, y que no existía porque no hacía falta, es una equivalencia: **para
una experiencia que no cambia, la ruta incremental y la total dejan la misma
composición.** La escribe la T-01.

**La demo del break de hidratación entra en la verificación**, porque es la que
está grabada y la que se muestra. Se comprueba con lo que el repositorio ya tiene:
`demo/hydration-break/test/signalled-run.test.js`, que lee los archivos declarados
de esa demo —`plate.json`, su asset list, su guion y su script de señalización— y
ejecuta el `resolveAnchor` de su propia página; más `npm run mutaciones`, que
corre sus tres comprobaciones sobre copias rotas a propósito. Las dos corren en la
T-11.

## La verificación de la fase, y qué mide cada cosa

**Un chequeo que no puede fallar no es un chequeo.** Es la lección que este
proyecto pagó seis veces en dos días, así que cada task declara qué propiedad mide
y cuál es su forma de fallar. Tres de los chequeos de esta fase necesitan un
control explícito para poder fallar, y los tres lo llevan escrito en su task:

- **El grep del CC** (T-09) se corre además sobre un `lib/` con una ocurrencia
  plantada a propósito, para ver que la encuentra.
- **El auto-ocultado del selector** (T-05) se mide con la misma espera **sin**
  hold, que tiene que ocultar el cromo.
- **El diff de la composición** (T-01) lleva campaña de mutación scopeada: una
  rotura deliberada por regla, corriendo sólo los tests que cubren esa regla.

## Lo que la fase NO va a producir

Va escrito acá para que al cerrar no quede como un supuesto de quien lea.

- **Ningún dato sobre viabilidad en red.** La T-01 de la fase 01 midió
  **decodificación** de cinco elementos simultáneos con contenido local, y esta
  demo también sirve contenido local desde `server.mjs`. Al cerrar la fase **no se
  va a poder afirmar nada sobre cuánto ancho de banda pide una grilla de cuatro
  sobre una conexión real**, ni sobre qué hace el ABR con cuatro instancias
  compitiendo. Es el riesgo R5 y se acepta.
- **Ninguna medición de la demo de la carrera de autos.** Es otra fase.
- **Ningún test de DOM del renderizado.** Sigue sin estar testeado con navegador,
  y esta fase no cambia esa línea: lo que se vuelve puro se testea, y lo que queda
  es pintura, que se mira.
- **Ninguna conclusión sobre iOS.**

## Fuera de alcance

- La demo de la carrera de autos.
- Más de cuatro cajas, paginación, y cualquier forma que no sea una de las tres.
- Elegir la forma del mosaico: acá la forma es una función de N.
- El canje de dos vistas en un gesto (ADR 0066).
- Bajar el contenido principal de la grilla (ADR 0067).
- iOS.
- La sincronización temporal entre las vistas.
- Llevar la oferta a la especificación de SVTA.

## Riesgos y mitigaciones

| | riesgo | mitigación |
| --- | --- | --- |
| **R1** | **El refactor de `build`/`clear` cambia en silencio cómo se dibujan los avisos que ya andan.** Es el riesgo número uno de la fase y la suite actual no lo ataja. | La equivalencia entre la ruta incremental y la total, escrita como test puro en la T-01, más la campaña de mutación scopeada sobre el diff, más la corrida del recorrido de `compatibility-pair` comparada contra su propia referencia (T-11). |
| **R2** | **El selector no se descubre.** `aws-multiview` pagó este riesgo con cuatro tasks sobre el mismo elemento. | Las dos piezas del ADR 0068 —popup transitorio y punto persistente—, construidas en la T-07 y miradas en capturas. |
| **R3** | **La lista se cierra sola en medio de la elección**, porque el cromo no tiene hoy forma de quedarse quieto. | El mecanismo de *holds* de la T-05, con su control: la misma espera sin hold tiene que ocultar. |
| **R4** | **La composición queda a medias** cuando `build` y `clear` dejan de ser totales. | Está escrito como propiedad en la T-01 y no descubierto después: aplicado el plan, lo dibujado es exactamente el objetivo. Se asserta. |
| **R5** | **Cuatro instancias de hls.js sobre una conexión doméstica no llegan.** | No se mitiga: se acepta y queda escrito arriba, en lo que la fase no va a producir. |
| **R6** | **Solapar un aviso con un multi view produce una pantalla ilegible.** | No se ejercita en el recorrido de esta demo. El modelo lo soporta (ADR 0072). Aceptado sin mitigar. |
| **R7** | **El `kind` nuevo se agrega a dos de las tres tablas** y la barra deja de marcar el rango sin error de ningún tipo. | Un test que asserta que las tres tablas tienen el mismo conjunto de claves (T-02). |

## La arquitectura, y dónde está

El proyecto no usa `docs/arc42/`: su documento de arquitectura son los dos de
`docs/`, y así quedó desde la fase 02.

- **`docs/contrato-senalizacion-renderizado.md`** es la superficie entre las dos
  capas. Esta fase le agrega el `kind` `'multiview'` y **no le cambia una sola
  forma de dato**: lo que cruza sigue siendo `Experience[]` con los mismos
  `Element` (ADR 0072). Lo que sí hay que escribirle es que el reparto de los
  nodos pasó a ser incremental, porque es una promesa del lado del renderizado.
- **`docs/integrating-the-library.md`** es la superficie pública. Le cambia el
  bloque de configuración de `attach` y la descripción de los controles.

Los dos se tocan en la T-12, y los dos y no uno: es la recomendación 2 del informe
de la fase 06, en forma operativa.

## Stakeholders

- **Nicolás Levy** define el comportamiento, aprueba el diseño y prueba el
  resultado. Ya cerró las cuatro decisiones de alcance y el campo `name`.
- **David Hassoun** no participó de esta fase. El multi view editorial es uno de
  los cinco layouts del documento de requerimientos, y lo que esta fase agrega es
  material para la conversación de la especificación, no una respuesta a un pedido
  suyo.

## Timeline

Es una fase de SDK y su demo, anterior a la ventana de grabación del 28 al 30 de
septiembre y posterior al sync del 21. No compite con el recorrido que se graba:
la demo nueva es una carpeta aparte y no toca `demo/compatibility-pair/` ni
`demo/hydration-break/`.
