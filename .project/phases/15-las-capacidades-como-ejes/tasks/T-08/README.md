# T-08 — la opción de imagen, quieta y en otro layout (2026-09-28)

| archivo | qué prueba | resultado |
| --- | --- | --- |
| `inspect-/index-verificar-capacidades.txt` | local (8093): pedido, cuerpo idéntico, 12 composiciones con su layout, y la quietud de la imagen | VERDE |
| `publico/*-verificar-capacidades.txt` | lo mismo contra la URL pública, con un navegador sin credenciales | VERDE en las dos páginas |
| `*-quietud-{1,2}.png` | las dos capturas de la caja de la imagen, 2 s aparte, con el programa oculto | iguales byte a byte; el SVG animado en la misma caja da distintas (control) |
| `*-break-{a,b,c}-1907.png` | cada combinación en cada break | mirar |
| `md5-bucket-vs-repo.txt` | el bucket contra el árbol probado | 498 = 498, 0 distintos, 0 sobran |
| `publico-curl-anonimo.txt` | curl sin credenciales: lo nuevo servido byte a byte, las imágenes sin animaciones, los viejos en 404, el bucket sin listar | VERDE |

Layout por combinación: con video, el del break (A side by side, B L, C banner); con imagen, el de
`formaImagen` (A L, B side by side, C L).
