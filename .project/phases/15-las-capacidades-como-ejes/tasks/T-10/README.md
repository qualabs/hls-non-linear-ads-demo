# T-10 — la caché, resuelta de forma sistemática (2026-09-29)

| archivo | qué prueba | resultado |
| --- | --- | --- |
| `control-senal-sin-commitear.txt` | `publicar.sh` se niega a publicar si la señalización reescrita difiere de la commiteada | sale 1 antes de tocar el bucket |
| `publicar.txt` | la publicación entera: bucket = árbol por md5 (501 = 501, 0 sobran), lo mutable con `no-cache`, y lo servido contra el repo con curl anónimo SIN `?v=` | VERDE |
| `publico-nombres-viejos-y-movimiento.txt` | las rutas sin versión de los tres videos dan 404; el movimiento medido sobre lo publicado | 404 las seis; A 41,14 %, B 13,07 %, C 34,96 % |
| `publico/*-verificar-capacidades.txt` | las cuatro combinaciones, los layouts y la quietud de la imagen, en la URL pública | VERDE en index e inspect |

La primera corrida de `publicar.sh` dio ROJO y fue útil: `stage.json` todavía estaba en la caché
del borde con una hora (lo había pedido alguien antes de poner `no-cache`) y los asset-lists de la
carrera seguían apuntando a la ruta sin versión de `zumbra-16x9`. Lo segundo era un defecto real:
el aviso de repliegue de dos avisos de la carrera habría dado 404.
