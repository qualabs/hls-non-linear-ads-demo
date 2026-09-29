# T-11 — un control por player en index.html (2026-09-29)

URL: https://qualabs-hls-demo-stage-pair.storage.googleapis.com/index.html?izq=nativo&der=ours-2dec-img

| archivo | qué prueba | resultado |
| --- | --- | --- |
| `verificar-pares.txt` (local) y `publico/verificar-pares.txt` (bucket, sin credenciales) | 4 combinaciones × breaks A y B × dos lados: lo que dibuja cada lado y lo que pide | VERDE en los dos; controles: 1 dec con/sin imágenes distintos, nativo/nativo iguales |
| `par-<izq>__<der>-break-{a,b}.png` | las capturas de cada combinación | mirar |
| `pedidos-<izq>__<der>-{izq,der}.png` | la lista de pedidos de cada player, en la página | cada lado con los suyos |
| `verificar-capacidades-index.txt`, `medir-tramo-en-el-par.log`, `medir-enlace-de-barras.log` | las mediciones de la página del par que ya existían | VERDE |
| `index-default-400.png` | el default a 400 de ancho | mirar |
| `publicar.txt` | la publicación: 502 = 502 por md5, lo servido igual al repo sin `?v=` | VERDE |

La primera verificación pública dio ROJO: los saltos no andaban servidos desde el bucket (ver el
LOG del 2026-09-29). Se arregló y se republicó; la segunda dio verde.
