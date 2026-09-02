# Log

## 2026-09-02 — Proyecto creado

Proyecto creado a partir de la minuta de la reunión del 2026-09-02 entre
David Hassoun y Nicolás Levy (`tactiq-2026-09-02-001`, Doc
`1ZSrYPeRoNzypDRCLoenWpISu17M9PJ3erWQFkfaPL7U`), que fijó alcance,
fechas y reparto de la demo de publicidad no lineal en HLS para el
evento de Apple del 7 de octubre de 2026.

Tipo `desarrollo` con fecha dura. Owner: Nicolás Levy, que tomó la demo
para sí y no la delegó. Canal del proyecto: `#wg-hls-presentation`.

`projects/` está en el `.gitignore` del repo padre `cto-assistant`, así
que el proyecto es su propio work tree: se corrió `git init` dentro de
`projects/hls-non-linear-ads-demo/` y los commits de este proyecto no
llegan nunca al repo padre.

## 2026-09-02 — Repo qualabs/hls-non-linear-ads-demo creado

Creado en GitHub bajo la organización `qualabs`, **privado** y
verificado como tal (`"private": true`, `"visibility": "private"`),
vacío (`size: 0`). Agregado como remoto `origin` del work tree local.
**Nada pusheado.**

## 2026-09-02 — Fase 01 abierta y generada en el mismo pase

`01-plataforma-y-primer-draft`, en estado `in-progress`. La fase existe
por el riesgo de plataforma: el camino crítico se eligió sobre
información que nadie tiene, y el 21 de septiembre es el día en que se
sabe si aguanta. Cierra en ese hito, con el primer draft andando y el
sync de una hora con David.

El diseño de la fase no necesitó un `DESIGN.md`: la minuta ya trae el
alcance, los layouts, los assets, el timeline y el reparto, así que
`PHASE.md` y `TASKS.md` se escribieron directo. Nueve tasks, T-01 a
T-09, ninguna de fases posteriores.

## 2026-09-02 — ADR 0001: hls.js como camino crítico

Registrada la decisión de plataforma con la reserva explícita de
revisarla cuando lleguen los detalles técnicos que David fue a buscar.
Es la decisión que la T-01 puede llegar a superseder.

## 2026-09-02 — Hueco declarado: los requerimientos de alto nivel no están accesibles

El documento de requerimientos de alto nivel está en una tab de un
Google Doc que Nicolás mencionó y que devuelve 404 desde el CLI y desde
el connector, con todas las cuentas disponibles. El `PROJECT.md` tiene
la sección declarada y **vacía a propósito**: no se dedujo nada ni se
completó con supuestos. Resolver el acceso es parte de la T-07.

Quedan además como a confirmar, tal como la minuta los marca: el nombre
exacto de Roger [?] (la persona del lado de Apple), la forma exacta del
namespace `com.qualabs.hls-concurrent-interstitial` [?], el nombre del
quinto layout ("pullback" [?]), y August [?], la persona con la que
David trabaja el deck.
