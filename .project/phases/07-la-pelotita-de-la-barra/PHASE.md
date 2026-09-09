---
phase: 07-la-pelotita-de-la-barra
title: "La pelotita de la barra se agarra y se arrastra"
status: in-progress
started: 2026-09-09
closed: null
---

# Fase 07: la pelotita de la barra

Nicolás probó la demo y pidió poder agarrar la pelotita de la barra de progreso y
moverla, con mouse y con el dedo, con el seek al soltar. *"Es como un drag and
drop en una dimensión."*

Es una fase de refinamiento y es reactiva, como la 04: nace de lo que él encontró
usando la demo. Si aparecen dos o tres detalles más de usabilidad, caen acá.

Es un POC y la vara es la de siempre: quick and dirty, y nada se mide ni se pule
más allá de lo que hace falta para que el gesto funcione en pantalla.

## Objetivo

Que la posición del programa se pueda cambiar arrastrando, con el mismo gesto que
tiene cualquier player: se agarra la pelotita o se toca la barra, se lleva, y al
soltar es el seek.

## La pelotita ya existe, y esto es lo que la fase no hace

Medido contra el player corriendo antes de diseñar: `.qa-track__knob` está en el
código desde la fase 02 y `paint()` la mueve todos los frames con el
`currentTime`. En pantalla es un punto de 14 px en el `--qa-accent` de la demo,
con anillo blanco, sobre la cabeza del fill. **Esta fase no agrega la pelotita: le
agrega el gesto**, que es lo que el pedido dice en su segunda oración.

## Alcance

1. **El scrub es un solo camino** (ADR 0032): `pointerdown` en cualquier parte de
   la barra y la pelotita salta ahí, `pointermove` y sigue al puntero,
   `pointerup` y ahí es el seek. Un toque suelto es un arrastre de longitud cero.
2. **El seek pasa del `pointerdown` al `pointerup`** (ADR 0032), que es el único
   cambio sobre lo que hoy funciona.
3. **Mientras se arrastra, la posición la manda el puntero y no el video**
   (ADR 0033): un estado de scrub que el frame loop respeta, leído por el fill, la
   pelotita y el reloj de la izquierda.
4. **El arrastre es de la barra hasta que se suelta** (ADR 0034):
   `setPointerCapture` y `touch-action: none`.
5. **El cromo no se baja en medio de un arrastre** (ADR 0035).
6. **La pelotita crece mientras se arrastra** (ADR 0036).
7. **La verificación**: `npm test` y `npm run check` en verde, y la corrida mirada
   con los dos punteros.

## Fuera de alcance

- **La pelotita en reposo**: su tamaño, su color, su forma. Se midió que se ve, y
  agrandarla en reposo cambia cómo se ve la barra en cámara, que es lo que la
  fase 04 dejó cerrado.
- **Un preview del cuadro al que se va a saltar.** Pide thumbnails que este
  repositorio no genera, y no lo pidió.
- **Teclado y accesibilidad sobre la barra.** Misma razón que la fase 06: no está
  en el pedido y la vara es la de un POC.
- **La barra del pane de fábrica por separado.** Es el mismo cromo, así que se
  lleva el gesto de rebote, y eso está bien: los dos panes siguen idénticos en
  todo menos en qué muestran durante el break (fase 04). No se le agrega ni se le
  saca nada aparte.
- **Seekear durante el arrastre.** Descartado en el ADR 0033.
- **La regla de la fase 04 y el gesto del foco de la fase 06.** No se tocan. La
  barra ya es furniture para las dos: un toque sobre un control es de ese control
  y no alterna el cromo.
- **Tests nuevos.** La fase no agrega lógica no visual, y eso está argumentado en
  el preámbulo del `TASKS.md`.

## Riesgos

**R1. El toque suelto deja de seekear donde seekeaba.** Es el único camino que hoy
funciona y que este cambio mueve, del press al release. Mitigación: la definición
de done de la T-01 lo pide como comparación y no como impresión —el mismo punto de
la barra tiene que dar el mismo segundo—, y es lo primero que mira la T-02.

**R2. El press sobre la barra deja de llegar, o llega y además alterna el cromo.**
El `pointerdown` del contenedor corre para todo lo que está adentro y hoy trata a
la barra como furniture. Mitigación: ese handler no se toca, y el gesto se agrega
en la barra, que es donde ya estaba el listener que reemplaza. Lo mira la T-02 en
el caso táctil: un arrastre no tiene que esconder el cromo al soltar.

**R3. Un arrastre en mobile scrollea la página en lugar de mover la pelotita.** Es
el defecto que el ADR 0034 evita, y es el que no se ve probando con mouse.
Mitigación: la T-02 lo prueba con toque emulado, y el chequeo es que el scroll de
la página no se mueva durante el arrastre.

## Arquitectura del producto

El proyecto no tiene `docs/arc42/` y esta fase no lo crea: sus dos documentos de
`docs/` cumplen ese papel para el único lector que tienen, quien construye con la
sdk. **La superficie pública no cambia** —ni `attach` ni `attachControls` reciben
nada nuevo—, y el contrato entre señalización y renderizado tampoco: la barra es
cromo, y el cromo no está en ese contrato. El delta de la fase es de
comportamiento de los controles y está escrito en los ADR 0032 a 0036.

Lo que sí hay que mirar al cerrar, porque la fase 06 lo dejó como hallazgo: los
dos documentos de `docs/` describen los controles, así que la revisión de
documentación del cierre los lee a los dos y no sólo el README de la demo.

## Calendario y quién mira

El primer draft para David es el 21 de septiembre y la ventana de grabación es del
28 al 30. Esta fase no está en el camino crítico de ninguna de las dos: el guion
de la corrida no arrastra la barra, así que el gesto es un beat opcional igual que
el foco de la fase 06. Lo que Nicolás mira es el arrastre en el player, que es lo
que igual iba a mirar.
