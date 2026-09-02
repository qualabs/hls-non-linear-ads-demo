---
id: 0001
title: hls.js como camino crítico de la demo
status: accepted
scope: project
date: 2026-09-02
supersedes: null
superseded_by: null
---

# hls.js como camino crítico de la demo

Fuente: minuta de la reunión del 2026-09-02 entre David Hassoun y
Nicolás Levy, Doc `1ZSrYPeRoNzypDRCLoenWpISu17M9PJ3erWQFkfaPL7U`.

## Contexto

La gente del evento dijo que no le importa si la demo se hace en web o
en iOS, que web tiene más potencial de impacto, y que idealmente se
hagan las dos.

Contra eso, Roger [?] (del lado de Apple; el transcript lo devuelve
también como "Rob" y "Ron", y por contexto es la misma persona) le
mencionó a David que hay implementaciones a nivel público disponibles
en Swift que no están en hls.js, algo alrededor de reemplazar una clase
y de cómo eso funciona con el DATERANGE, que harían esto bastante más
fácil en AVFoundation. También mencionó que hay trabajo ya planificado
en hls.js que va a mejorar esto, pero que todavía no está hecho.

David no tiene los detalles de esa conversación porque creía tenerla
grabada y no la tenía. Durante la reunión mandó un email a Roger [?] con
Nicolás en copia para recuperarlos.

La posición de Nicolás es la opuesta y viene de experiencia previa.
Puso hls.js como camino crítico con el argumento de que si eso no sale,
que es lo que debería ser más fácil, el proyecto está en problemas, y
dejó explícito que si de la información de Roger [?] surge algo nuevo,
se cambia. David dijo que él también preferiría hls.js porque permite
mostrar la pestaña de red del browser durante la demo, y agregó que una
implementación limpia en iOS más un parche sobre hls.js sería el mejor
de los mundos: sirve para el evento y deja base para hacerlo bien más
adelante.

La decisión se toma entonces sobre un hueco de información que los dos
reconocieron: una intuición fundada contra un rumor sin detalles.

## Decisión

hls.js es el camino crítico de la demo, con la reserva explícita de
revisar la elección cuando lleguen los detalles técnicos que David fue
a buscar. iOS queda como stretch goal.

## Consecuencias

- Se puede mostrar la pestaña de red del browser durante la demo, con
  el DATERANGE y el asset list cargado a la vista. Es un argumento de
  presentación que David quiere aprovechar.
- Hoy la vía posible es parchear o modificar hls.js en lugar de hacer
  una implementación limpia, porque el trabajo planificado upstream no
  está hecho. El parche conviene mantenerlo aislado y explicable,
  porque va a estar en pantalla.
- El riesgo que esta decisión crea es que dos semanas de trabajo vayan a
  la plataforma equivocada y eso se descubra en el sync del 21 de
  septiembre, cuando ya no queda margen antes de la grabación del 28 al
  30. La mitigación está en la fase 01 (`R1` de su `PHASE.md`) y su
  task es la T-01.
- Si la información que David recupera contradice la elección, esta
  decisión no se edita: se escribe un ADR nuevo con
  `supersedes: 0001`, y el cambio de plataforma se acuerda con David en
  lugar de tomarse en solitario.
- El mejor de los mundos que David describió, que es la implementación
  limpia en iOS más el parche sobre hls.js, queda como objetivo
  deseable y no como alcance comprometido de este proyecto.
