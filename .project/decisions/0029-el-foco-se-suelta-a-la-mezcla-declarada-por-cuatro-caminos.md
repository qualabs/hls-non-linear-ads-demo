---
id: "0029"
title: El foco se suelta a la mezcla declarada, y tiene cuatro salidas
status: accepted
scope: project
date: 2026-09-08
supersedes: null
superseded_by: null
generalizes: null
generalized_by: "0078"
---

## Contexto

El ADR 0026 pone el foco; falta decir cómo se sale, y a qué. Hay dos candidatos
para el destino de la vuelta —el primario, o la mezcla que declara el asset
list— y en el Quad no dan lo mismo: ahí ningún elemento declara 100 para el
primario, declara 10.

Y hay cuatro momentos en que el foco deja de tener sentido, tres de ellos sin que
nadie toque nada: el nodo enfocado se destruye porque la composición se rearma,
el asset se termina antes que su ventana, o cierra el break.

## Decisión

Cuando el foco se suelta, la composición vuelve a **la mezcla que declara el
asset list**, no al primario. Es lo que manda el ADR 0014, y volver "al primario"
inventaría una mezcla que la campaña no escribió y dejaría el programa más fuerte
de lo que su autor pidió.

Cuatro caminos, y **ninguno pregunta nada**:

1. **Se toca de nuevo el elemento enfocado.** El gesto es un toggle.
2. **Se rearma la composición.** Cuando cambia el `nextKey`, el renderer hace
   `clear()` y reconstruye (`lib/renderer.js:188-215`): el nodo enfocado ya no
   existe y el foco muere con él.
3. **El asset del elemento enfocado se termina antes que su ventana.** El
   renderer ya lo detecta y lo dice por consola (`lib/renderer.js:243-253`). Ahí
   se suelta el foco y vuelve la mezcla declarada. El último cuadro se queda en la
   caja hasta que la ventana cierre, porque la composición sigue la ventana y eso
   es del contrato, pero la composición no queda muda.
4. **Cierra el break.** Ya funciona: `clear()` devuelve el primario a
   `volume = 1` y no toca su `muted` (`lib/renderer.js:540-560`). No se agrega
   nada.

## Consecuencias

En el borde entre dos avisos de un mismo break —el break 5 son cuatro en fila— el
foco se cae solo, y eso está bien: la pantalla cambia entera en ese borde, así que
el cambio de sonido tiene causa visible. La marca del ADR 0030 desaparece con el
nodo, que es lo que lo hace legible sin agregar una pieza de interfaz.

Descartado el **foco idempotente**, que es lo que hace el multiview: acá deja a
quien mira sin salida salvo buscar otra caja, y en `cornerOverlay` hay una sola.

Descartado **conservar el foco al rearmar la composición**, por posición de caja o
por `id` de elemento. El truco del multiview no aplica: ahí el foco se conserva
por identidad de contenido, y acá el aviso que lo tenía simplemente no está.
Conservarlo le daría a un anunciante nuevo el audio que quien mira eligió para
otro, en silencio y por una coincidencia de layout.

Descartado **mantener el foco cuando el asset se termina** y hasta que la ventana
cierre: es la falla que el ADR 0014 existe para evitar, audio faltante que no se
ve en cámara, reintroducida por la puerta de al lado. Y descartado **sacar el nodo
cuando su asset termina**: cambia la regla del contrato de que la composición
sigue la ventana declarada.

Descartado **volver al primario** en vez de a la mezcla declarada, por la
aritmética del Quad del contexto.

---

## 2026-09-11 — nota: generalizado por el ADR 0078

**El segundo y el cuarto camino de arriba están escritos nombrando el mecanismo
que los producía, y ese mecanismo dejó de ser el único.** Cuando se escribió
esto, cualquier cambio de composición destruía todos los nodos, así que "se
rearma la composición" y "el nodo enfocado ya no existe" eran la misma frase. El
ADR 0070 hizo que los nodos que sobreviven se queden, y el **ADR 0078** enuncia
esas dos salidas al nivel al que siempre se referían: el foco se suelta cuando el
nodo que lo tenía deja de existir.

Nada de lo que este ADR decide se vuelve falso, y por eso queda `accepted` con su
`superseded_by` en `null`: el destino sigue siendo la mezcla declarada, las
salidas siguen siendo las mismas, y sus cuatro descartes —incluido conservar el
foco por posición de caja o por `id` de elemento— siguen en pie tal como están
escritos.
