# T-13 — inspect.html con el mismo control que el par (2026-09-29)

URL: https://qualabs-hls-demo-stage-pair.storage.googleapis.com/inspect.html?modo=ours-2dec-img
(y `?modo=nativo`, `ours-2dec-noimg`, `ours-1dec-img`, `ours-1dec-noimg`)

| archivo | qué prueba | resultado |
| --- | --- | --- |
| `verificar-inspect-modos.txt` (local) y `publico/verificar-inspect-modos.txt` | 5 modos × A y B: lo dibujado, la tarjeta 2 contra la red, la tarjeta 4 | VERDE en los dos |
| `inspect-<modo>-break-{a,b}.png` | las capturas | mirar |
| `verificar-pares-index.txt`, `publico/verificar-pares-index.txt` | que index siga igual | VERDE |
| `verificar-capacidades-inspect.txt`, `verificar-inspect.txt` | las mediciones previas de inspect | VERDE |
| `publicar.txt` | 504 = 504 por md5, lo servido igual al repo sin `?v=` | VERDE |
