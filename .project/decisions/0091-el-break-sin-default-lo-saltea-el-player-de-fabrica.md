---
id: "0091"
title: El break sin default también tiene su tag de Apple, y el player de fábrica lo saltea
status: accepted
scope: project
date: 2026-09-30
supersedes: "0087"
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0087 dejó el break A sin default lineal y, por eso, fuera del manifest de interstitials:
el pane de fábrica no tenía nada que hacer ahí. Con el ADR 0090 los dos tags de un break nombran
el mismo asset-list, y David pidió que el manifest de interstitials nombre también A, con
`CLASS="com.apple.hls.interstitial"` y `X-ASSET-LIST="/signalling/asset-list-break-a.json"`, con
el asset-list sin cambios. El resultado que buscaba era "the ad is skipped and content continues".

## Decisión

- **Los tres breaks tienen su tag de Apple** en `con-daterange-interstitial.m3u8`, y los tres
  nombran el mismo asset-list que su tag concurrente.
- **A sigue sin default**: su asset-list no tiene `URI`, o sea que no tiene parte estándar. B y C
  sí la tienen. Es A por la misma razón que antes: su lineal sería ZUMBRA 16:9, que ya es su aviso
  concurrente.
- **El player de fábrica saltea A por diseño.** Pide la lista, no encuentra nada que reproducir y
  el programa sigue. El nuestro dibuja el aviso si alguna opción entra en la capacidad declarada,
  y si no, lo saltea (D.5).
- **El tag de A lleva `X-RESUME-OFFSET=0`**, y el de B y C sigue sin el atributo (ADR 0017).

## Consecuencias

- `X-RESUME-OFFSET=0` no es cosmético y lo decidió una medición. Sin el atributo, hls.js 1.7.2
  retoma el programa en el fin del break (el inicio más el `DURATION` declarado en la lista). Ese
  punto no está bajado, porque hls.js deja de bufferear en el borde del break. Dejando correr la
  página desde cero, el reloj del programa saltó de 19,7 s a 32,0 s y el video quedó congelado en
  el último cuadro más de 40 s, con un `bufferStalledError` no fatal y la línea de estado diciendo
  "primary content · 32.0s". Con el atributo el programa retoma donde empezó el break, que está
  bajado. El hueco más largo del reloj pasa a ser de 0,21 s, que es el intervalo de muestreo, sin
  eventos `waiting`, igual que lo publicado antes, que no tenía el tag.
- Retomar en el inicio no deja al pane de fábrica atrás del nuestro, porque no hubo aviso que
  ocupara tiempo: el programa recorre esos doce segundos como programa.
- En la consola quedan avisos no fatales de hls.js al saltearlo: `otherError internalException`,
  porque el asset no tiene `URI`, y `networkError aborted`. No se ven en la página: la línea de
  estado muestra sólo "primary content · …" durante todo el break.
- `test/medir-a-nativo.py` es la medición, y su control es B, donde el reloj del programa sí
  queda congelado doce segundos mientras suena el aviso.
