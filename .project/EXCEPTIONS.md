# Accepted findings

Findings of `scripts/validar-proyecto.py` that were looked at once and judged
legitimate, each with the reason it is. The reason is the point of the file: an
accepted finding is not a rule switched off, it is a judgement somebody made and
wrote down, and it lives here — in the project it is about — so that it travels
with this repo and whoever audits the project reads it. The validator prints
every one of them with its reason on every run.

One `##` section per finding: the three fields the report prints, and the reason
in prose under them. An entry that stops matching anything is reported RED, so a
fixed finding does not leave its excuse behind.

## phases/02-sdk-y-controles/PHASE.md — phase-without-design

- file: `phases/02-sdk-y-controles/PHASE.md`
- rule: `phase-without-design`
- detail: `started 2026-09-04 and the phase folder has no DESIGN.md`

The exploration happened and was written -- into the PHASE.md instead of a
separate DESIGN.md. Its 190 lines carry `Fuera de alcance`, `Riesgos y
mitigaciones` and `Preguntas abiertas que esta fase no resuelve`, and its
objective argues the one decision the phase turns on (the SDK boundary and the
ownership of the controls are the same decision, so splitting them means taking
it twice) citing the line of renderer.js that forces it. What this finding
protects -- that the trade-offs and the discards are not nowhere -- is met by
that file. Back-filling a DESIGN.md out of it would move prose between files and
manufacture provenance for a conversation that is already on the record.

## phases/04-refinamiento/PHASE.md — phase-without-design

- file: `phases/04-refinamiento/PHASE.md`
- rule: `phase-without-design`
- detail: `started 2026-09-07 and the phase folder has no DESIGN.md`

A reactive phase whose design space was a list, not a trade-off. It appeared
after phase 03 was already written and executes before it, driven by the
recording window and by the defects Nicolas found while testing, and its own
PHASE.md says so in its first paragraph. Its 323 lines include `Fuera de
alcance`, `La verificacion de la fase, y por que es liviana` and a section that
states what the phase does to the argument of phase 01. The exploration a
DESIGN.md would hold -- which defects matter before the window closes -- is the
contract itself; a design document in front of it would restate it.
