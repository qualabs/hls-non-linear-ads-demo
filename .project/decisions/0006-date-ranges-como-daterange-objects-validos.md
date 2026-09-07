---
id: "0006"
title: Escribir los Date Ranges como DateRange Objects válidos
status: accepted
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

El Apéndice H de `draft-pantos-hls-rfc8216bis-wwdc2026` define una forma
JSON del `EXT-X-DATERANGE`, el DateRange Object, donde cada clave es un
atributo del tag y cada valor es su valor legal, con `CLASS` obligatorio
y con `START-DATE` o `X-SCHEDULE-OFFSET`.

El ADR 0005 decide que este POC escribe los tags en la media playlist y
no usa agendas, porque hls.js no las soporta. Eso resuelve el transporte
de hoy y deja abierta la pregunta de qué pasa el día que el transporte
cambie, sea porque hls.js incorpore las agendas o porque la
especificación de SVTA decida entregarlas así.

## Decisión

Cada tag que la demo pone en la playlist se escribe de manera que sea
traducible sin pérdida al DateRange Object del Apéndice H: `CLASS`
presente, `START-DATE` presente, identificadores únicos, y los atributos
`X-` con valores que son legales en las dos formas.

## Consecuencias

El día que el transporte cambie, cambia el transporte y no el contenido:
la migración es mover texto de un lado al otro.

Le da a David algo concreto que decir en escenario sobre cómo este
trabajo se conecta con lo que Apple presenta el mismo día, que es
exactamente lo que Rob Walch ofrece al final de su mail.

La restricción que impone es real y hay que tenerla presente al escribir
los tags: en la forma JSON un atributo `X-` puede valer cualquier JSON
legal, incluidos objetos y arrays, mientras que en la forma de tag tiene
que ser un AttributeValue de los que el tag admite. La intersección de
las dos formas es la que manda, así que la demo se limita a valores
escalares en sus atributos `X-`.
