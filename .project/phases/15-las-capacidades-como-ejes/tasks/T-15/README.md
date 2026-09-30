# T-15 — layout para la grabación a 1920×1080 (2026-09-30)

Viewport útil medido: 1920×960.

| archivo | qué muestra |
| --- | --- |
| `antes-inspect-1920x960.png`, `antes-index-1920x960.png` | cómo estaban (inspect: la tarjeta 3 empezaba en 865 px y el documento medía 1394) |
| `publico-inspect-1920x960.png` | inspect en la URL pública, en el break B: el player y las tarjetas 1 a 3 enteros, sin scroll |
| `publico-index-1920x960.png` | index en la URL pública, con los saltos al lado de "With our library" |
| `publico-*-break{A,B,C}-1920x960.png` | cada salto, en las dos páginas |
| `medir-layout-publico.txt` | bordes inferiores (player 774, tarjetas 516/662/946 ≤ 960, scrollY 0), los saltos moviendo el player, 0 errores de consola |
| `medir-layout.py` | el instrumento |
