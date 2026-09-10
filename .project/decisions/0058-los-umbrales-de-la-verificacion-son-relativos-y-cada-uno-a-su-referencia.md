---
id: "0058"
title: Los umbrales de la verificación son relativos, y cada uno contra su propia referencia
status: accepted
scope: phase-10
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Los dos chequeos del ADR 0057 arrancaron con umbrales absolutos y los dos
fallaron por la misma razón de fondo: **el número que separa lo sano de lo roto no es
una constante del fenómeno**, y un umbral fijo lo trata como si lo fuera.

**En el plate**, el paso normal entre dos cuadros depende de cuánto se mueve la
escena: la mediana anda por **3,3 en la parada del juego**, con gente caminando, y
llega a **7 en el juego**, con la pelota corriendo. Un número que pasa en un lado
falla en el otro sin que nada esté mal.

Y hay una segunda razón, que es la que costó entender: **una costura y un paso
interno no son la misma magnitud.**

- **Paso interno**, adentro de un eslabón: YAVG **3,5 a 7,4** según el movimiento.
  Es un cuadro de diferencia y nada más.
- **Costura** entre dos eslabones: el mismo paso **más** el ruido de que el modelo
  vuelve a dibujar el cuadro semilla. Ese ruido se midió solo, comparando el último
  cuadro de un eslabón contra el cuadro 0 del siguiente —el mismo instante, dibujado
  dos veces— y da **3,6 a 6,9**.

O sea que una costura arrastra un ruido del tamaño de un paso, y **su número crudo es
casi el doble del de un paso interno sin que haya ningún defecto**.

**En la cadena**, la distancia contra el acto 1 **crece sola** a medida que la cadena
se aleja del cuadro filmado, porque cada eslabón es una generación más de distancia.
Sobre una cadena sana, eslabón por eslabón: **22,7 / 23,4 / 23,8 / 25,8 / 27,9 /
30,8**. Un umbral fijo en 28 habría marcado el sexto estando bien.

## Decisión

**Cada chequeo compara contra su propia referencia, y ninguno contra un número
absoluto.**

- **En el plate, la razón contra la mediana de los 24 cuadros vecinos.** Es lo que
  **vuelve las dos calibraciones una sola regla**, y el veredicto tiene **dos
  escalones y no uno**: una costura sana da alrededor de **1x**, de **2x** el script
  avisa (`<-- alta`) y de **3x** manda a mirarla con el ojo (`<== MIRALA`). En el
  plate final las siete costuras internas cayeron entre **1,00x y 1,84x**, y ninguno
  de los ocho saltos más grandes del plate es una costura.
- **En la cadena, el salto contra el eslabón anterior** y no el valor absoluto. Los
  saltos de una cadena sana nunca pasan de **+3,3**; el eslabón del fundido saltó
  **+29,3** y el que se fue caminando a otra parte de la cancha, **+51**. El umbral
  es un salto de **10**: queda muy arriba de lo que la acumulación normal produce y
  muy abajo de los dos defectos.

Descartado: **calibrar mejor el umbral absoluto.** No es un problema de calibración
fina. Las dos calibraciones miden cosas distintas y ninguna es la magnitud de la
otra, así que un solo número no puede servir para las dos sin estar mal en una.

## Consecuencias

- **Un número absoluto vuelve a aparecer sólo como referencia, nunca como criterio**,
  y las dos calibraciones quedan escritas adentro del script con la razón de por qué
  son dos. Escribir un umbral absoluto sin esa nota es lo que hace que después se use
  en el lugar equivocado.
- **La razón es transportable y el valor absoluto no.** La cadena de la L, que es de
  otro material —un producto girando despacio—, tiene un paso interno de **0,6** y su
  costura mide **3,0**: una razón alta sobre un absoluto chiquísimo. Con un umbral
  fijo del plate ese caso no se puede leer; con la razón se lee, y lo que dice es que
  hay que mirarlo con el ojo, que fue lo que se hizo.
- Es la misma clase de defecto que la fase 09 encontró en su propio umbral de
  transición: **un número correcto para lo que se midió y equivocado para aquello a
  lo que se aplicó.** Ahí el borde no era representable en punto flotante; acá el
  paso normal no era una constante. En los dos casos lo destapó comparar el número
  contra el fenómeno en lugar de contra su propia calibración.
