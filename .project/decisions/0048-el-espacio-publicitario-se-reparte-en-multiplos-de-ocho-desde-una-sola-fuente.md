---
id: "0048"
title: El espacio publicitario se reparte en múltiplos de ocho segundos, y el reparto sale de una sola fuente
status: accepted
scope: phase-08
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La parada del juego pasó a ser video generado, y una generación de Veo dura **4, 6 u 8
segundos** — no un número libre. La parada se arma concatenando eslabones de 8, así que su
duración es múltiplo de 8 por construcción: 64 segundos, ocho eslabones.

El reparto de los cuatro avisos adentro de ese minuto no heredaba esa restricción. Venía de
la etapa en que la parada era metraje: 10 segundos el lineal, y los otros tres repartiendo
el resto. Nicolás lo cerró:

> *"Adaptemos las publicidades y los tiempos de publicidad a que tenemos que generar de 8
> segundos. Va a quedar múltiplo de 8 todo el espacio publicitario."*

Y con la restricción vino el aviso sobre dónde vive el número:

> *"ojo con lo que ya sabés: **estos números viven en un solo lugar**. Si `plate.json` dice
> 64 y el asset list suma otra cosa, la demo miente sin fallar."*

## Decisión

**Cada aviso del break dura un múltiplo de 8 segundos, y los cuatro largos los declara
`plate.json` en `avisos`.** El reparto es `[16, 16, 8, 24]`: banner, L, lineal, overlay de
cierre. Suma 64, que es lo que dura la parada.

De ese único lugar salen tres cosas que antes se escribían por separado:

- los `DURATION` del asset list,
- el `-t` de cada creativo en `creativos.sh`, y
- el largo con el que se empaqueta cada uno.

Y un chequeo lo sostiene: `elRepartoSaleDeUnSoloLugar` verifica que los cuatro sumen
`paradaDura`, que cada uno sea múltiplo de 8, y que el asset list coincida con
`plate.json`. Tiene tres roturas propias en la campaña de mutación.

Es el ADR 0044 aplicado al reparto: el mismo criterio que ya gobernaba el corrimiento de la
parada.

## Por qué múltiplos de 8, y no "lo que dé"

Porque **el resto corto es el eslabón que peor sale**. Un reparto de 10 segundos sobre una
cadena de 8 obliga a generar un eslabón de 2, o a recortar uno de 8 y perder su final —que
es el cuadro del que se siembra el siguiente—. La restricción no es de diseño: es la unidad
de la herramienta, y el reparto se escribe en esa unidad en lugar de pelearla.

## Consecuencias

- El lineal bajó de 10 a **8 segundos**. Su placa de cierre son los 2 últimos, así que el
  clip generado se recorta a 6. Sin ese recorte el spot sale más largo que su ventana y **el
  aviso no termina**, que en cámara se lee como que se cortó.
- Un cambio del reparto ya no puede dejar un creativo corto en silencio: es exactamente el
  defecto que nada en pantalla reporta —la librería lo avisa por consola y el espectador ve
  un aviso que terminó antes—, y ahora falla en el chequeo.
- Cambiar `paradaDura` obliga a que sea múltiplo de 8, porque `armar-plate.sh` divide para
  saber cuántos eslabones pedir.

## Lo que se descartó

**Dejar el reparto escrito en el asset list y que `plate.json` sólo declare el corrimiento.**
Es lo que había, y es la forma exacta del defecto que este proyecto ya se cruzó tres veces:
dos lugares que dicen lo mismo se despegan, y la demo sigue corriendo mintiendo.
