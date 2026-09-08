# `test/fixtures` — the data this suite owns

Everything in here was copied once from somewhere else, and from that copy on it
belongs to `test/`. The rule is one line and has no exceptions: **`test/` only
reads `test/` and `lib/`** (ADR 0023). This folder is what makes that possible.

**There is no check comparing a fixture against the file it was copied from, and
that is a decision and not an omission** (ADR 0023). The owner of a fixture is
the test. A check like that would hand the coupling back with another shape —
the suite of the library would break again the day the development record is
reorganised — so if you came here to add one: it is missing on purpose.

The cost is accepted with its eyes open. The day the run the demo serves changes,
these files keep describing the old one and nothing here will say so. What
watches the live run is the suite of the demo, which asserts over the files the
demo has inside it.

**The paths below are written without the prefix of the development-management
folder and without the name of the folder the demo serves its asset-lists from,
and that is deliberate**: the self-sufficiency of `test/` is verified with a grep
for those two strings over this whole folder, this README included. A path
written in full here would put the check in red for a documentation reason, and
the next person would "fix" it by deleting the provenance.

## `mediciones/` — five readings, under their original names

The name is the provenance, so the name is kept: each file is called after the
task that took the reading. They are readings of one run taken on one date,
which is why freezing them alongside the run they describe is the right thing to
do and not merely the cheap one — a measurement separated from its run does not
mean anything.

| file | copied from | what it is |
| --- | --- | --- |
| `m3-resultados.json` | `phases/01-poc-web-hlsjs/tasks/T-03/` | the six payloads the SVTA tool emits, verbatim, under `herramienta`, and the same six layouts as T-03 measured them in pixels, under `nuestro` |
| `t02-los-rangos-del-programa.json` | `phases/02-sdk-y-controles/tasks/T-02/` | what `programRanges()` returned with the player running, plus the length of the primary content re-read in flight |
| `t04-la-medicion.json` | `phases/02-sdk-y-controles/tasks/T-04/` | where the ten marks landed on the bar, over a 180 s programme |
| `t05-la-medicion.json` | `phases/02-sdk-y-controles/tasks/T-05/` | the volume every media node started at, element by element, over three breaks |
| `t05-el-recorrido-con-el-break-mezclado.json` | `phases/03-breaks-multiples-y-repliegue/tasks/T-05/` | the ten ranges read off the contract with the mixed break in the run |

## `asset-lists/` — the thirteen, whole

Copied from the folder the demo serves its asset-lists from: the five of the
recording, the three phase 03 added, the linear ad of phase 01 and the four
fixtures broken on purpose.

All thirteen and not a subset, because the set the tests read **is computed** —
one helper takes the name as a parameter and another one takes it off the table
of the run — so any subset is a guess. They are some 15 KB: filtering costs more
than copying.

Four of them, the ones for the fallback rungs, therefore exist twice: here and in
the demo, with no check between the two copies. Accepted residual, by the same
decision that governs the rest of this folder.

## `run.json` — the run of the recording, declared

The five breaks of the recording, each one with the second of playback it is
signalled at and the asset-list its concurrent tag points to. It replaces the
parse of `scripts/senalizar-contenido.sh` that used to build this table inside
`program-ranges-and-volume.test.js`: half of the tests of that file are a
reading of a browser, and a reading is about a run, so the run is declared here
instead of being scraped out of a shell script the library does not own.

What stays over the script, because it is about the script and not about this
table: that its run table has five rows, that the `PLANNED-DURATION` of a tag is
computed and not typed, and that it writes the two `CLASS` strings the library
translates. Those assertions are the reason a hard-wired `PLANNED-DURATION`
declaring twelve seconds of a forty-eight second break was ever found.

Its integrity is asserted and not assumed, in the first test of
`program-ranges-and-volume.test.js`: five breaks, each with its second and its
asset-list, and every asset-list it names present in `asset-lists/`. Without
that, a truncated table is not a red test — it is a smaller run that every test
after it passes over without looking at anything.
