---
id: "0037"
title: El guion se ancla a la señalización y los segundos se resuelven en vivo
status: accepted
scope: phase-08
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La demo guiada frena el player en momentos determinados y explica lo que está por
pasar. Esos momentos son beats de un guion, y la señalización ya declara cuándo entra
cada break y cuánto dura cada aviso. **Si el guion escribe sus propios segundos, hay
dos fuentes para el mismo número y se desincronizan en la primera edición**: la placa
aparece sobre otra cosa, que es la única forma en que esta demo puede quedar mal sin
que nada falle.

Y no son dos fuentes, son cuatro. El plate declara dónde está la parada del juego, la
tabla del script de señalización declara en qué segundo entra el break, el asset list
declara cuántos avisos hay y cuánto dura cada uno, y el guion dice cuándo hablar.

El contrato entre las dos capas ya expone las dos consultas que hacen falta y las dos
son sincrónicas: `provider.programRanges()` devuelve los rangos del programa ordenados
por `startTime`, cada uno con su `id` y su `kind`, y `provider.experiences` lleva un
`itemId`, un `startTime` y una `duration` por aviso.

## Decisión

**Un beat no nombra un segundo del programa: nombra un rango o un aviso, y con cuánta
anticipación.** Tres formas de ancla y no más:

- `{"at": "start"}` — el arranque, antes de que el programa empiece a correr.
- `{"before": {"break": n}, "lead": s}` — `s` segundos antes de que arranque el
  n-ésimo rango concurrente.
- `{"at": {"break": n, "ad": k}, "lead": s}` — `s` segundos antes de que arranque el
  k-ésimo aviso de ese break.

La resolución sale del contrato y de nada más. `break: n` es el n-ésimo elemento de
`programRanges().ranges` filtrado por `kind === 'concurrent'`, que ya viene ordenado, y
`ad: k` es el k-ésimo de `experiences` cuyo `id` coincide con el de ese rango, ordenado
por `startTime`. **La página no construye identificadores**: `AD-1-CONCURRENT` es una
convención del script de señalización y el guion no la conoce.

El `lead` y el `hold` sí son números absolutos, y está bien que lo sean: son una
anticipación y el largo de una pausa, no posiciones sobre la línea de tiempo, así que
no pueden desincronizarse de nada.

## Consecuencias

- La cadena queda en una sola dirección y sin ciclos: mover la parada en el plate mueve
  el break, agregar un aviso al asset list corre los que siguen, y el guion los sigue
  sin que nadie lo edite.
- Los segundos que el guion usa son los que el player **efectivamente bajó y resolvió**,
  no los que un archivo declaró: un asset list que no llega deja de tener beats en lugar
  de tener beats sobre nada.
- La propiedad es asertable, y por eso el suite de la demo la asierta: toda ancla tiene
  que caer en un rango y en un aviso que existen. Un guion que referencia el aviso 4 de
  un break que tiene tres es un rojo y no una placa sobre otra cosa.
- Descartado que `senalizar-contenido.sh` emita un `recorrido.json` que la página lea.
  Es la forma que primero parece obvia, porque el script ya imprime esa tabla para quien
  graba, pero es una copia de números que el proveedor ya tiene resueltos, más un paso de
  build, a cambio de cero verdad nueva. Y tiene un defecto propio: un archivo emitido no
  sabe qué asset list falló al bajar.
- Descartado escribir los beats en segundos absolutos con un comentario que pida
  mantenerlos al día. Es el defecto que este ADR existe para evitar.
