---
id: "0090"
title: Un asset-list, dos clientes; un manifest por clase
status: accepted
scope: project
date: 2026-09-30
supersedes: "0007"
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0007 mostraba la compatibilidad hacia atrás con dos players sobre el MISMO manifest, que
llevaba dos tags por break en el mismo `START-DATE`: uno `com.apple.hls.interstitial` y otro de la
clase concurrente. David Hassoun, al preparar la grabación, dijo que no sabía que había tags
duplicados y que, para uso normal, no recomendaría tener los dos: *"optimally the side by side
would have 2 content manifests one w just concurrent and one with just normal interstitial"*, y
en inspect, un manifest sólo con los concurrentes. Preguntó si un tag concurrente solo degrada a
interstitial normal.

No degrada, y está medido: el break A de esta demo es exactamente ese caso (un solo tag
concurrente, sin tag de Apple) y el hls.js de fábrica no reproduce nada ahí. El Apéndice D.2 del
draft de HLS exige `CLASS="com.apple.hls.interstitial"` para que haya interstitial (ADR 0009, y el
gap §5.4 de sgai-for-hls).

## Decisión

**Un asset-list por break, que leen los dos clientes, y un manifest por clase.**

- `con-daterange-interstitial.m3u8` lleva sólo los tags de Apple y lo carga el player de fábrica;
  `con-daterange-concurrente.m3u8` lleva sólo los concurrentes y lo carga el nuestro (y
  `inspect.html` con nuestra librería; en modo nativo, el de interstitials). Mismos segmentos,
  mismos `START-DATE`.
- Los dos tags de un break nombran el MISMO `asset-list-break-X.json`. Su parte estándar —`URI` y
  `DURATION` de cada asset, el Apéndice D.2— es lo que reproduce hls.js; el bloque
  `X-AD-CREATIVE-SIGNALING` de encima es lo que lee nuestra librería, que cae a esa parte estándar
  cuando no puede dibujar (ADR 0019). Se van los `asset-list-linear-*.json`.
- El break sin default (ADR 0087) no aparece en el manifest de interstitials.

> **Nota del 2026-09-30.** El último punto ya no vale: el ADR 0091 le pone también su tag de Apple
> al break sin default, apuntando al mismo asset-list, y el player de fábrica lo saltea.

## Consecuencias

- La tesis del par pasa de "un manifest, dos clientes" a **"un asset-list, dos clientes"**: el
  aviso vive en un solo lugar y cada player lee la parte que entiende.
- Que hls.js ignore el bloque enriquecido y reproduzca la parte estándar se midió en el navegador:
  su `interstitialsManager.playingAsset` es el `URI` del asset-list (el 16:9 de la campaña) con
  la duración del creativo, en B y en C.
- El tramo invertido del ADR 0082 no puede aparecer por construcción: los dos clientes leen la
  misma `DURATION`. Su control se mantiene: declarar una duración distinta de la del creativo los
  desempareja.
- La compatibilidad hacia atrás sobre un solo manifest ya no se muestra en esta demo. Sigue siendo
  lo que hace `demo/compatibility-pair/`.
