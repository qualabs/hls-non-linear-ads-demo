# T-19 — evidencia

- `con-daterange-interstitial.diff`: el manifest de interstitials publicado antes contra el nuevo.
- `sin-resume-offset-medir-a-nativo.json`: la medición con el tag tal cual lo pidió David, sin
  `X-RESUME-OFFSET`: el reloj del programa se queda en 19,7 s y salta a 32,0 s, con un hueco de 41 s.
- `publicado-antes-medir-a-nativo.txt`: el control, lo publicado sin el tag de A.
- `local-medir-a-nativo.txt` y las capturas `local-*`: con `X-RESUME-OFFSET=0`, en local.
- `publico-medir-a-nativo.txt`: lo mismo contra la URL pública, después de publicar.

Instrumento: `demo/stage-pair/test/medir-a-nativo.py`.
