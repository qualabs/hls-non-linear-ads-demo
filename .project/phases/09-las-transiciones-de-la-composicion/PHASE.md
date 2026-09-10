---
phase: 09-las-transiciones-de-la-composicion
title: "Las transiciones de la composición"
status: in-progress
started: 2026-09-10
closed: null
---

# Fase 09: las transiciones de la composición

Cuando un aviso entra o sale, la composición cambia de golpe. Esta fase le pone
tiempo a ese cambio, y lo pone en la librería.

## Objetivo

Que la entrada y la salida de un aviso concurrente **se lean como un movimiento y
no como un corte**, y que eso sea comportamiento fijo de la sdk y no algo que cada
demo prenda.

En concreto son dos efectos y una exclusión:

- **La L**: el primario se achica **sobre** un aviso que ya está puesto, así que se
  lee como que el contenido ya estaba abajo y se destapa; a la salida se agranda de
  vuelta y lo tapa.
- **El banner y las imágenes**: entran con un difuminado corto y salen con uno más
  rápido.
- **El aviso a cuadro entero**: ningún efecto. Ahí el cambio brusco es lo correcto.

Y una regla que gobierna a los tres: **el tiempo de la transición lo paga el
aviso.** Nada sobrevive a su ventana.

## Alcance

1. **`lib/` y nada más.** Los cambios viven en `lib/renderer.js`, con una línea en
   `lib/signalling.js` sólo si la medición de la fase la pide, y un párrafo en
   `docs/integrating-the-library.md`.
2. **La geometría del contenido primario se anima siempre**, por `transform`, sin
   preguntar de qué layout se trata (ADR 0050).
3. **Los nodos de aviso entran y salen con opacidad**, salvo cuando su experiencia
   es un aviso a cuadro entero (ADR 0050).
4. **La salida termina en el borde de la ventana** y no arranca ahí, así que
   mientras la transición corre el aviso está vivo por derecho propio y `clear()`
   no cambia (ADR 0052).
5. **Los tiempos son constantes exportadas de `lib/renderer.js`**: 380 ms para la
   geometría, 200 ms para el difuminado de entrada, 120 ms para el de salida, más
   las curvas (ADR 0054). Son valores para corregir mirando.
6. **La verificación mirada corre en `demo/compatibility-pair`**, donde los seis
   casos ya están autorados desde la fase 05, más una corrida de
   `demo/hydration-break` para mirar la forma del ADR 0047. **Ninguna de las dos se
   toca.**
7. **Las dos suites de siempre en verde**: `npm test` y `npm run check`.

## Fuera de alcance

Es la mitad del valor de la fase. En una fase de animación el alcance no se escapa
por el costado: se escapa porque animar una cosa más siempre parece una línea más.

- **No se toca `demo/`, ni una línea, en ninguna de las dos demos.** Si el diseño
  necesita que una demo cambie, eso es un hallazgo para reportar y no un cambio
  para hacer (ADR 0040, aplicado en el otro sentido). `demo/hydration-break/`
  además tiene trabajo sin commitear de otra sesión.
- **No cambia la superficie pública**: ni un campo en el asset list, ni una opción
  en `attach`, ni una línea del contrato. Si al ejecutar resulta que algo de esto
  tenía que cambiar, se para y se reporta.
- **No se le recorta ni se le demora un cuadro a ningún creativo**, ni se estira
  ninguna ventana (ADR 0055).
- **No hay efecto en el aviso a cuadro entero**, ni a la entrada ni a la salida.
- **No se anima la caja de ningún nodo de aviso.** La banda de la L no crece: la
  destapa el primario (ADR 0051).
- **No se animan los controles.** Ya tienen sus dos transiciones y no se tocan.
- **No se anima nada más de la librería**: ni el anillo del foco de audio, ni la
  barra de tiempo, ni la pelotita, ni el logo, ni la marca del rango.
- **No hay fade de audio.** Ni rampa de volumen al entrar o salir de un aviso, ni
  cross-fade de la mezcla.
- **No hay `prefers-reduced-motion`.** Es accesibilidad sobre una demo que se graba
  en una máquina nuestra, y las fases 06, 07 y 08 ya la dejaron afuera por la
  misma razón.
- **No hay animación al redimensionar** ni al entrar a pantalla completa (ADR
  0053).
- **No hay animación de arranque.** La primera aparición del player no difumina.
- **No se compone video**: nada de cross-fade entre el programa y un creativo.
  David lo descartó para el proyecto entero.
- **No se testea el renderer con DOM.** Los cuatro suites de `test/` cubren
  funciones puras y esta fase mantiene esa línea: lo que se puede volver puro se
  testea, y lo que es pintura se mira.
- **No se pule.** Un POC no se pule: la vara es que se vea mejor que el corte seco,
  mirado una vez.

## Riesgos

**R1. La transición no arranca, porque la misma pasada que la escribe borra el
estilo.** `clear()` y `place()` corren en el mismo `tick()`, y `clear()` le borra
al primario el atributo `style` entero. Que la transición dispare depende de que la
`transition-property` esté en el estilo **posterior** al cambio. Es la propiedad
sobre la que se apoya la fase entera: si no se cumple, no hay animación en ningún
camino y el diseño cambia.

*Mitigación:* se mide en la **T-02**, en el navegador, antes de construir nada
encima; si sale al revés se para y se reporta. La alternativa es una hoja de
estilos inyectada por la librería —`controls.js:459-461` ya inyecta una— y la fase
paga una pieza más.

**R2. Una ventana más corta que la transición.** Con una ventana de 300 ms el
primario está adentro de sus últimos 380 ms desde el primer cuadro.

*Aceptado, y degrada bien:* el objetivo sale del tiempo que queda, así que el
primario apunta al cuadro entero desde el arranque y no se achica. Es lo que la
regla dice —la transición está acotada por la ventana— y el resultado es que no hay
efecto, no un cuadro roto. Cubierto como caso de borde en la **T-01**; la ventana
más corta de la demo es de 8 s.

**R3. Los últimos 120 ms, donde las dos cosas pasan juntas.** El nodo del aviso se
difumina mientras el primario todavía crece encima, lo que sobre la L del break de
hidratación deja una banda fina de backplate difuminándose hacia el fondo en lugar
de quedar tapada.

*Mitigación:* se mira en la **T-05**. Si se ve, la vuelta es una línea y sale del
contrato sin agregarle nada: un elemento con `zDepth` por debajo del primario no
necesita difuminar a la salida, porque su salida es que el primario lo tape. No se
escribe antes de mirar.

**R4. La lectura equivocada de "ocupar el tiempo del aviso":** recortarle o
demorarle contenido al creativo.

*Mitigación:* el ADR 0055 lo declara, y el control es de código y no de intención —
la fase no toca `build`, `attachAsset`, `applyPlayback`, `applyAudio` ni el
`startAt`. El chequeo mirado de la **T-05** es que el creativo del aviso lineal se
vea y se oiga entero y que `warnIfCut` no cambie lo que dice.

**R5. Animar sale caro en el cuadro y esto se graba.**

*Mitigación:* el ADR 0051 limita lo animado a `transform` y `opacity`, las dos que
el compositor resuelve sin layout, y el ADR 0052 evita reescribir por cuadro. Se
mira en la **T-05**.

**R6. El efecto queda mal a la vista, con números que no están medidos.**

*Aceptado.* Están en un solo lugar y son constantes exportadas, así que corregirlos
es una línea, y la **T-05** es la corrida mirada. No se pule.

**R7. Un chequeo escrito de buena fe puede no poder fallar.** Pasó cuatro veces en
este proyecto. Acá el candidato es el test del discriminante, que puede pasar
porque las dos ramas devuelven lo mismo.

*Mitigación:* en la **T-01** el test se corre con el predicado invertido a propósito
antes de darlo por bueno, y ese control va en la evidencia.

**R8. La otra sesión y el índice de git compartido.** `demo/hydration-break/` tiene
trabajo sin commitear de la sesión de la fase 08, y el índice del repo tiene un
borrado staged que es de ella.

*Mitigación:* los commits de esta fase van **scopeados por path** a `.project/`,
`lib/` y `docs/`, nunca `git add .`. Si el índice compartido bloquea de verdad, la
salida autorizada es un `git worktree` con branch, y se pide antes de armarlo.

## Cronograma

No hay fecha propia y sí un borde: la ventana de grabación del proyecto es del **28
al 30 de septiembre**, y lo que se grabe muestra este comportamiento, así que la
fase tiene que estar cerrada antes. Es un día de trabajo contra dieciocho de
margen, o sea que la fecha no es el riesgo de esta fase.

## Quién

- **Nicolás** decide y mira. Los cuatro tiempos del ADR 0054 son suyos para
  corregir mirando.
- **La sesión de la fase 08** es dueña de `demo/hydration-break/`. Esta fase lee esa
  carpeta y la corre; no la escribe.

## Arquitectura del producto

El proyecto no tiene `docs/arc42/` y esta fase no lo crea: los dos documentos de
`docs/` cumplen ese papel para el único lector que tienen, quien construye con la
sdk. **`docs/contrato-senalizacion-renderizado.md` no cambia**, porque la
superficie entre las dos capas queda igual y el discriminante de las transiciones
sale de lo que el contrato ya declara (ADR 0050).

Lo que sí cambia es **`docs/integrating-the-library.md`**, con un párrafo: la imagen
del contenido primario se mueve sola y quien integra tiene que saber que es la
librería y no su página, que no es configurable, y dónde están las constantes por
si quiere discutir los números.
