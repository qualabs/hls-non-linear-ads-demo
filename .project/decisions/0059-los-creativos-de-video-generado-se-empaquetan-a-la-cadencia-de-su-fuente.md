---
id: "0059"
title: Los creativos que nacen de video generado se empaquetan a la cadencia de su fuente
status: accepted
scope: phase-10
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

`empaquetar-contenido.sh` forzaba `fps=30` a los cuatro creativos. Dos de ellos
nacen de video generado y salen a **24** —medido con ffprobe, **192 cuadros en
8,00 s** cada uno—: la L, cuyo fondo son los eslabones de `generar-la-l.sh`, y el
spot lineal, cuyo cuerpo es `neonectar-8s.mp4`.

Empaquetarlos a 30 **duplica un cuadro de cada cuatro**. Es exactamente el tironeo
que se le acababa de sacar al plate del partido, comprado de vuelta adentro del
aviso.

**El 30 no era decorativo, y por eso se explica en lugar de cambiarse y listo.** Sale
de la medición de la T-01 de la fase 01, que midió con 1280x720 a 30 que cinco
elementos de video reproducen a la vez, que es lo que el multiview necesita.

Y cuando se fijó, **todos los creativos eran imágenes fijas**. Una imagen fija no
tiene cadencia que romper, así que ahí el fps no significaba nada. El caso que lo
vuelve significativo —un creativo cuyo cuerpo es video generado— es posterior a la
decisión.

## Decisión

**Un creativo cuyo cuerpo es video generado se empaqueta a la cadencia de ese
video**, hoy 24, y no a la del perfil.

**La excepción es de los que tienen movimiento generado y no de todos.** El banner y
el overlay siguen a 30 y no ganan nada bajando: los dos nacen de una imagen fija, y
el `zoompan` del overlay ya dice en su propio script que reetiqueta cuadros en lugar
de remuestrearlos. Por eso la variable se llama **`FPS_GEN` y no `FPS_L`**: el nombre
no tiene que volver a sugerir que esto es de un solo creativo.

**Y el GOP acompaña al fps** —dos segundos de cuadros— porque fijo en 60 con una
entrada de 24 daría un keyframe cada 2,5 s y los cortes de `-hls_time 2` no caerían
sobre uno.

## Consecuencias

- **Bajar un creativo a 24 no toca la medición de la T-01.** Menos cuadros por
  segundo no es más carga, así que el argumento que fijó el 30 sigue en pie para lo
  que lo necesitaba.
- **Los dos casos quedaron verificados, y hoy son dos.** El creativo del lineal ya
  existía y ya se estaba remuestreando, así que su arreglo fue completo desde el
  primer día. El de la L quedaba atado a que su fondo animado entrara, y entró: los
  dos eslabones están en `content/.fuentes/l/`, `creativos.sh` toma la rama animada y
  lo dice en su salida, y el creativo se empaqueta en **8 segmentos a 24 fps**.
  **Verificado en pantalla y no sólo medido** por la sesión que lo hizo: en los
  segundos 33 y 45 de la composición real el estado del player dice
  `squeezebackLShape · video · the match is still playing` y **el zapato está en una
  rotación distinta entre uno y otro**, o sea que se mueve adentro de la composición y
  no sólo en el mp4 suelto, mientras la tipografía, el precio y el QR quedan clavados
  y legibles en los dos.
- **Y el arreglo de la semilla dejó un número declarado que no cuadra, aceptado a
  propósito.** Con el duplicado sacado en las siete costuras, el primario reempaquetado
  mide **91,70 s** contra los 92 de antes: esos **0,29 s son los siete cuadros** que ya
  no se repiten. No hay de dónde sacarlos —el clip filmado tiene 341 cuadros y el acto 1
  usa 336— así que la parada queda esos siete cuadros más corta que lo que `paradaDura`
  declara. Se acepta en lugar de estirar material.
- **Los creativos no tienen que coincidir con el primario.** Son streams separados,
  así que el plate a 24 y un creativo a 30 no se pelean.
- Un creativo con dos fps según cómo se armó sería una cosa de más para recordar, así
  que la L va a 24 también mientras su fondo sea fijo, donde el número es inocuo.
