# T-14 — un asset-list, dos clientes (2026-09-30)

| archivo | qué prueba | resultado |
| --- | --- | --- |
| `verificar-pares.txt` (local), `publico/verificar-pares.txt` | index: 4 combinaciones × A, B, C × dos lados; qué asset reproduce el hls.js de fábrica (`playingAsset`: el 16:9 de la campaña, 12,067 s medidos para 12 declarados, en B y C; nada en A) y qué pide cada lado (los dos, el mismo asset-list) | VERDE |
| `verificar-inspect-modos.txt`, `publico/verificar-inspect-modos.txt` | inspect: 5 modos × A, B, C | VERDE |
| `verificar-capacidades-{index,inspect}.txt` | las cuatro capacidades, el cuerpo idéntico y la quietud de la imagen | VERDE |
| `medir-tramo-invertido.txt`, `medir-tramo-en-el-par.txt` | los dos panes entran y salen juntos (< 0,08 s); el control (24 s declarados) los separa 12 s | VERDE |
| `verificar-inspect.txt`, `medir-enlace-de-barras.txt` | la lectura de inspect y el enlace de barras | VERDE |
| `publico/consola.txt` | index, inspect, inspect nativo y race en la URL pública: estado en A, B y C, errores de consola y HTTP | VERDE, 0 errores (las advertencias de race son las del recorte de sus creativos, de la fase 14) |
| `publicar.txt` | 503 = 503 por md5, lo servido igual al repo sin `?v=`; se borraron del bucket `con-daterange.m3u8` y los `asset-list-linear-*` | VERDE |
