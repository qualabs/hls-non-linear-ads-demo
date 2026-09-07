---
id: "0019"
title: El bloque de layout es una extensión por encima del interstitial estándar, y un asset sin bloque es un aviso lineal
status: accepted
scope: project
date: 2026-09-07
supersedes: null
superseded_by: null
---

## Contexto

La fase 03 tiene que meter un aviso lineal adentro de un break que también trae
avisos concurrentes, y tiene que saber qué hacer cuando el asset-list devuelve
algo que este cliente no puede reproducir. Estaban escritas como dos cosas
distintas, y la pregunta de cómo se declara un aviso lineal adentro de un break
concurrente estaba abierta.

La primera respuesta que se ensayó fue declararlo **con** bloque
`X-AD-CREATIVE-SIGNALING` y un valor `"type": "linear"`. El ejemplo la desmintió
sola: el bloque de ese asset terminaba apuntando **al mismo `URI` que el nivel
superior ya declaraba**, o sea que era redundante por construcción, y el valor
`linear` era una etiqueta que la herramienta de SVTA no emite y que hay que
inventar.

La norma sostiene la otra respuesta. En `draft-pantos-hls-rfc8216bis-22`, Apéndice
D.2, cada Asset-Description **ya obliga** a tener `URI` y `DURATION`: *"Each
Asset-Description JSON object MUST have a 'URI' member whose value is a
quoted-string absolute URI for a single interstitial asset, and a 'DURATION'
member"*. Un aviso lineal ya tiene forma en el formato, y esa forma no necesita
nada nuestro.

Y la norma también fija cuándo termina, que es lo que este proyecto venía
escribiendo mal. El `DURATION` es metadato declarativo: el corte por tiempo existe
pero es `X-PLAYOUT-LIMIT`, del break entero, y en su ausencia *"the interstitial
MUST end upon reaching the end of the interstitial asset(s)"*.

## Decisión

**`X-AD-CREATIVE-SIGNALING` es una extensión por encima del interstitial estándar,
no un formato paralelo.** De ahí salen tres reglas, y las tres son de la librería:

- Un asset **con** el bloque lo dibuja nuestro plugin: es la experiencia
  concurrente, con su layout.
- Un asset **sin** el bloque **no se saltea**: se reproduce su `URI` **hasta el
  fin del asset**, que es exactamente un aviso lineal. El aviso lineal se declara
  como se declaró siempre, sin tipo nuevo y sin bloque.
- Un bloque que **falla** —ausente, ilegible, o que pide algo que este cliente no
  puede reproducir— cae al mismo lugar: se reproduce el `URI` del asset hasta su
  fin.

**El aviso lineal y el repliegue son el mismo mecanismo**, y por eso no hay dos
caminos de código ni dos tasks.

Nunca "reproducí el `URI` por su `DURATION`": el `DURATION` declarado y la
duración real pueden no coincidir, y un asset-list armado por un servidor de
decisioning es justo donde eso puede pasar.

## Consecuencias

**La retrocompatibilidad deja de ser una promesa y pasa a ser una propiedad del
dato.** Lo que un cliente conforme lee de un asset-list nuestro —`URI` y
`DURATION`— está donde siempre estuvo y significa lo que siempre significó. No hay
que pedirle nada al cliente para que el break se llene.

**Y el degradado no es transparente, que es la parte que no hay que suavizar.** La
norma **no tiene modelo de superposición**: todo el Apéndice D asume que el
primario se detiene, y lo dice en cada pieza —`X-RESUME-OFFSET` *"specifies where
primary playback is to resume following the playback of the interstitial"*, `X-SNAP`
habla de *"transition to the interstitial"*, el ejemplo D.6 de *"resume playback of
the primary asset where it left off"*—. `X-RESUME-OFFSET=0` es lo más cerca que
llega y no es lo mismo: significa que el primario retoma donde quedó, no que nunca
se detuvo.

Así que un cliente conforme que lea el asset-list y no entienda el bloque **pausa
el contenido primario** para reproducir el `URI`. **El aviso concurrente se
convierte en uno lineal que interrumpe.** Es un buen repliegue —el break se llena,
el creativo se ve, el inventario no se pierde— y **no** es una equivalencia.
Describirlo como "extendemos el estándar" invita a suponer que sí lo es, y lo que
se degrada no es la calidad del render sino la forma del aviso.

**Ese degradado ocurre en el nivel del asset list, y hoy la demo no lo ejercita.**
Un cliente de mercado ignora por completo el Date Range de clase concurrente
(ADR 0009 y ADR 0007), así que nunca pide ese asset-list y nunca llega a la
situación. Lo que esta decisión garantiza es que el día que ese JSON sí llegue a un
cliente conforme —que es el escenario que SVTA persigue— lo que ese cliente hace
está definido y es esto.

**No contradice el ADR 0009 y conviene decir por qué, porque usa la palabra que ese
ADR rechazó.** El 0009 habla de la **clase del Date Range**: la clase concurrente
es hermana de `com.apple.hls.interstitial` y no una extensión, porque en HLS la
clase se compara por igualdad exacta de string y no hay herencia que implemente la
promesa. Este ADR habla del **JSON del asset list**, que es otro nivel y donde la
relación sí tiene algo detrás: las claves obligatorias siguen ahí y un cliente que
ignora el bloque igual reproduce. Una promesa vacía en un nivel y una propiedad
verificable en el otro.

**La garantía que sostiene la extensión es más floja de lo que suponíamos, y es
material para SVTA.** El *"clients MUST ignore any other attribute/value pair with
an unrecognized AttributeName"* de la sección 6.3.1 cubre los atributos de los tags
de la Playlist. Para el JSON del asset list la norma **no define ninguna regla de
claves desconocidas**: el Apéndice D.2 dice qué claves tienen que estar y no dice
nada de las demás, ni las prohíbe ni obliga a ignorarlas. La extensión es legítima
porque nada la prohíbe, y esa mitad se apoya en convención y no en obligación. Si
el bloque va a vivir ahí, la especificación tiene que decir esa regla.

**Tres obligaciones de la norma que el repliegue hereda.** El `URI` del
Asset-Description debe ser absoluto; cada asset **es un Playlist** y **debe ser
VOD**, así que el asset del repliegue no puede ser un creativo suelto; y los
interstitials anidados deben ignorarse.

**Y el segundo escalón del repliegue lo contesta la norma, no nosotros.** El
Apéndice D.5 dice que si falla el pedido del `URI` de **un** asset se saltea **ese
asset** y no el break; que si falla el pedido del **asset list** se cancela el
interstitial entero con offset 0; y que un `ASSETS` vacío se resuelve aplicando el
offset sin reproducir nada. El "si no están, salteá el break entero" que la fase
tenía escrito era más grueso que lo que la norma pide.

**Lo que esta decisión le deja abierto a la task que la construye**, porque no lo
decide y no hay que deducirlo: de dónde sale el fin del asset, dado que la regla es
"hasta su fin" y la regla 5 del contrato dice que `activeAt` es la única fuente de
la ventana de activación; qué le pasa a los assets siguientes cuando el fin real no
coincide con el `DURATION` declarado; y si el asset a cuadro entero tiene que ser
un `Range` propio de la barra, sabiendo que bajo el render que esta fase adopta ese
aviso **no cambia el largo de la línea de tiempo** y que el contrato define `kind`
exactamente por eso (ADR 0016), así que la anticipación del ADR 0018 no se sigue
sola.

**No reabre el ADR 0002.** El asset sin bloque lo reproduce nuestro plugin con el
mismo `attachAsset` que ya usa para todo lo demás, y la maquinaria de interstitials
de hls.js sigue apagada. Encenderla no habría servido igual: arma su agenda desde
Date Ranges de clase Apple y pide sus asset-list por su cuenta, así que no
reproduciría un `ASSET` del nuestro, y sí volvería a nuestro player un cliente de
fábrica, que es lo que el par de compatibilidad del ADR 0007 muestra que no es.
