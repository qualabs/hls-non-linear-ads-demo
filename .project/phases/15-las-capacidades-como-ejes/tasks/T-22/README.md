# T-22 — evidencia

`demo/stage-pair/test/verificar-marca-a-nativo.py`, ahora en index y en `inspect.html?modo=nativo`:

- `publico/`: contra la URL pública (`publico-verificar-marca-a-nativo.txt`). En inspect:
  `inspect-1-apenas-carga`, `inspect-2-cargada`, `inspect-3-salto-*`, `inspect-4-*` (seek con la
  barra antes de A y el paso por A) e `inspect-5-*` (a nuestra librería, de vuelta al nativo, otro
  seek con la barra y otro paso por A). Las `index-*` repiten T-21.
- `local/`: inspect en local.
- `control/`: inspect publicado antes del cambio, con nueve filas en rojo
  (`control-verificar-marca-a-nativo.txt`).
