# T-12 — el primario por encima en las transiciones (2026-09-29)

| archivo | qué prueba |
| --- | --- |
| `antes-hoja.png` / `despues-hoja.png` | cuadros de la entrada (arriba) y la salida (abajo) del break A, antes y después, con las transiciones CSS a un décimo de velocidad |
| `antes.txt` / `despues.txt` / `despues-publico.txt` | el `z-index` del primario y del aviso en cada cuadro: antes 0/1 (aviso arriba), después 3/2 (primario arriba), también en la URL pública |
| `test/stacking-order.test.js` (en el repo) | la regla sobre side by side, L, lower third, overlay sobre un side by side y multi view agrandado; controles en el LOG |
| `recorrer-demos.py`, `recorrer-demos.txt`, `otras-demos/` | las otras cuatro demos, break por break: sin errores de página, y cómo queda cada layout |
| `publicar.txt` | publicado: 503 = 503 por md5, lo servido igual al repo sin `?v=` |

Lo de "antes" se capturó de la demo publicada, que todavía tenía la librería anterior.
