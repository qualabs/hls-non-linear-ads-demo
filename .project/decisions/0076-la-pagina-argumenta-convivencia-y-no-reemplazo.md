---
id: "0076"
title: La página argumenta convivencia y no reemplazo, y la figura lo dibuja
status: accepted
scope: project
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La demo puede contarse de dos maneras y las dos son técnicamente ciertas. Una es
*"esto reemplaza al interstitial tradicional"*. La otra es *"esto se sirve al lado
del interstitial tradicional, y cada cliente se queda con el que entiende"*.

Nicolás fijó la segunda el 2026-09-11, con estas palabras: *"es una forma más polite,
no es reemplazar una cosa con otra, es dar más opciones"*.

No es una preferencia de tono. Es lo que el repositorio ya sostiene técnicamente, en
tres lugares:

- **El ADR 0007**: la playlist lleva los dos Date Range y cada cliente reproduce el
  que conoce. Es de ahí que sale la compatibilidad hacia atrás, y no de una relación
  entre las dos clases.
- **El ADR 0009**: la clase concurrente es **hermana** y no una extensión, porque en
  HLS la clase se compara por igualdad exacta de string y no hay herencia. Un cliente
  que nunca la oyó nombrar la ignora.
- **El ADR 0019**: adentro del break pasa lo mismo. Un `ASSET` sin bloque de layout es
  un aviso a cuadro entero, reproducido por el mismo camino de código.

Y ya está dicho en la propia demo: el beat `el-caso-de-negocio` de `story/story.json`
dice *"Full-screen Ads can live here too, the interstitials we are used to today."*

## Decisión

**Todo el material que la demo pone en pantalla argumenta convivencia y no
reemplazo.** El interstitial tradicional no se presenta como el problema: se presenta
como una de las opciones, y la que sigue funcionando exactamente como funciona hoy.

En la página del break de hidratación eso toma dos formas concretas: la copia de la
sección de la clase concurrente, y **una figura de dos columnas sobre una sola
playlist** —un cliente de mercado a la izquierda, el mismo cliente con la librería
encima a la derecha— que dibuja lo que el texto dice.

## Consecuencias

- **El alcance es de proyecto y no de la fase**, porque gobierna todo el material que
  se muestra y porque es también lo que David dice en escenario. Una fase que después
  escriba copia nueva se mide contra esto.
- **Le da una consecuencia visible a tres ADR que hasta ahora sólo vivían en el
  código.** El 0007, el 0009 y el 0019 dicen los tres lo mismo desde ángulos
  distintos, y ninguno se veía en pantalla.
- **La figura tiene que ser verdad como cualquier otra cosa de esta página**: lo que
  cada columna afirma sale de esos tres ADR y no de una simplificación cómoda.
- **La otra demo se menciona y no se enlaza.** `run.sh` sirve una demo por vez
  (ADR 0022), así que un link a `compatibility-pair` estaría roto en escenario.
- Descartado dejarlo sólo en prosa: es el punto más importante de su sección y en
  prosa sola tiene el mismo peso visual que el resto.
