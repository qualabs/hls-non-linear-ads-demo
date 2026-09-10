# Tasks — fase 10-la-demo-medida-contra-si-misma

Las tasks de esta fase no son trabajo sobre el producto: el producto ya estaba hecho
y commiteado. Son los artefactos de gobierno que el registro produce.

| id | brief | status | plan | evidence |
| --- | --- | --- | --- | --- |
| T-01 | La lectura del día y la traza de cada cifra a su fuente | done | — | tasks/T-01/ |
| T-02 | Los seis ADR y la generalización del 0045 | done | — | — |
| T-03 | El informe de cierre y la línea del índice | done | — | — |

---

## T-01 — La lectura del día y la traza de cada cifra a su fuente

- **Objective:** existe una respuesta escrita a *qué fue este día*, sacada de los once
  commits enteros y no de un resumen, y **cada número que va a entrar en un ADR está
  trazado al mensaje de commit o al archivo que lo contiene**. Importa porque un ADR es
  el artefacto que alguien va a creer sin verificar, así que una cifra equivocada acá
  sobrevive meses.

- **What it must cover:** los once mensajes de commit completos —son largos y
  detallados, y son la fuente—; los encabezados de `verificar-plate.sh` y
  `verificar-cadena.sh`, que es donde viven las calibraciones y la razón de por qué son
  dos; y los ADR 0044 y 0045, para no duplicar lo que ya está decidido. Lo que no esté
  en ninguna de esas fuentes se pregunta directo por el canal a `hls-demo`, que es quien
  lo midió. Constraint: **no se abre ni se escribe nada fuera de `.project/`**, y leer
  `demo/` es lectura y nada más. Sin dependencias.

- **Definition of done:** una lectura del día en una línea que explique los once
  commits y no sólo la mitad visible, y ninguna cifra en un ADR que no se pueda señalar
  en su fuente.

- **nivel de verificación:** **alto**. No por los tests, que acá no aplican, sino por lo
  único que este nivel pide y que sí aplica: **al menos un caso contrastado contra una
  fuente independiente, con sus números en la evidencia.** Es el punto exacto donde
  equivocarse es invisible: nadie va a volver a medir un número que un ADR afirma. El
  contraste se hizo sobre todas las cifras y encontró una diferencia real entre el
  relato recibido y lo que quedó en el código.

## T-02 — Los seis ADR y la generalización del 0045

- **Objective:** las seis decisiones del día están escritas donde el proyecto guarda
  sus decisiones, cada una con su alternativa descartada, y la única relación entre ADR
  que el día produjo está declarada en sus dos lados.

- **What it must cover:** un ADR por decisión que alguien rompería por no saber por qué
  es así, y **nada más que eso**: lo que ya está decidido se referencia (el ADR 0044) y
  lo que no es una decisión va al `PHASE.md` o al informe. La generalización del 0045
  necesita `generalizes` en el nuevo, `generalized_by` en el viejo, el viejo quedando
  `accepted` con su `superseded_by` en `null`, y una nota fechada que diga qué se
  ensanchó — nunca un cambio en su prosa. Entry points: el `DESIGN.md` de esta fase, que
  trae el inventario y el argumento de granularidad. Depende de la T-01.

- **Definition of done:** `validar-proyecto.py` en verde, que es lo que afirma que la
  relación está completa en los dos lados y que ningún id apunta a algo que no existe.

- **nivel de verificación:** **bajo**. La prosa la lee una persona antes de que algo
  dependa de ella, y el error se ve leyendo. Lo que no es prosa —las relaciones del
  frontmatter— tiene su chequeo automático y es el criterio de done.

## T-03 — El informe de cierre y la línea del índice

- **Objective:** la fase queda cerrada con su informe de ocho secciones, y el índice de
  `PROJECT.md` tiene una línea que dice qué fue esta fase, que es lo único que el
  sistema de archivos no puede contestar.

- **What it must cover:** las ocho secciones de `knowledge/phase-closure-report.md`,
  incluida la revisión de documentación superficie por superficie con el "no necesitaba
  nada" escrito y argumentado donde corresponda. Depende de la T-01 y la T-02.

- **Definition of done:** `REPORT.md` con sus ocho secciones, la línea en el índice, el
  `PHASE.md` en `closed`, y el validador en verde.

- **nivel de verificación:** **mínimo**. Todo el output es prosa que se lee antes de que
  algo dependa de ella.
