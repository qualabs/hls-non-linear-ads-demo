---
id: "0082"
title: Un asset-list lineal por break, con la duración de su break
status: accepted
scope: project
date: 2026-09-21
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

En el par de compatibilidad, la misma playlist lleva dos tags por break en el mismo
`START-DATE` (ADR 0007): uno de clase `com.apple.hls.interstitial`, que reproduce el cliente
de mercado, y uno de la clase concurrente, que reproduce el nuestro. El argumento de la demo
vive en que los dos panes estén mostrando el mismo segundo del programa.

`demo/compatibility-pair/` señaliza los cinco breaks contra **un único**
`asset-list-linear.json`: `adA`, `DURATION` 12,0 s, el mismo en los cinco. Cuatro de sus
cinco breaks concurrentes duran 12 s y el quinto declara `PLANNED-DURATION=48`.

De ahí sale **el tramo invertido**: durante 12 de esos 48 segundos el pane de fábrica ya
volvió al programa y el nuestro sigue con la pantalla tapada, así que la comparación queda al
revés. La fase 03 lo miró y lo aceptó explícitamente, porque arreglarlo desde ahí pedía tocar
el `START-DATE` compartido, y lo dejó escrito en la tabla que el script imprime y en `Before
you record`.

Aceptarlo fue correcto para una demo ya construida. Repetirlo en una demo que se escribe de
cero sería heredar un defecto que no cuesta nada evitar.

## Decisión

**Cada break trae su propio asset-list lineal, y su `DURATION` es la duración de ese break.**
No hay un asset-list lineal compartido.

## Consecuencias

**El tramo invertido no existe, y no hizo falta tocar el `START-DATE` compartido.** Los dos
tags siguen en el mismo instante, como manda el ADR 0007; lo que se empareja es cuánto dura
lo que cada uno reproduce. Es la salida que la fase 03 buscó y no encontró, y la encuentra
una demo nueva porque el costo de escribirla bien es cero y el de corregirla no lo era.

**Los dos panes entran y salen de cada break en el mismo segundo**, y eso pasa a ser una
propiedad medible de cualquier demo de par: se mide leyendo el estado del navegador, y su
control es la misma medición contra un lineal de duración distinta a la de su break, que
tiene que dar rojo. Existe un caso real contra el que correr ese control, que es
`compatibility-pair`.

**`demo/compatibility-pair/` no se corrige.** Queda como está, con su tramo invertido
aceptado y explicado: es una demo interna y reescribirle la señalización es rehacerla.

**El costo es un archivo por break en lugar de uno solo.** Son archivos de cinco líneas que
un script escribe, así que el costo real es que el que los lee tiene que mirar cuál
corresponde a cuál break; a cambio, la duración de cada uno se lee al lado del break que la
usa en lugar de deducirse.
