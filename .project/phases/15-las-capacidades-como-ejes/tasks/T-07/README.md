# T-07 — la publicación, 2026-09-28

Autorizada por Nicolás a través del coordinador. URL: https://qualabs-hls-demo-stage-pair.storage.googleapis.com/index.html
(e `inspect.html`, `race.html`).

Qué se hizo: `dist/` reconstruido; `gcloud storage rsync -r -x '.*__pycache__/|^content/\.fuentes/|^content/primary/con-daterange-(rica|magra)\.m3u8$'`
de `demo/stage-pair`; `dist/` subido; borrados los asset-lists `break-{a,b,c}-{rica,magra}` y `linear-a`.
Además se borraron tres objetos que ya no existen en el repo y dejaban el bucket distinto de lo
probado: `content/primary/con-daterange-{rica,magra}.m3u8` (apuntaban a los asset-lists borrados) y
`test/medir-escalera.py` (renombrado). Los 405 `.ts` ya tenían `video/mp2t`.

| archivo | qué prueba | resultado |
| --- | --- | --- |
| `md5-bucket-vs-repo.txt` | cada objeto del bucket contra el árbol probado, por md5, con conteo que no puede ser cero y el control de un par distinto | 494 = 494, 0 distintos, 0 faltan, 0 sobran |
| `publico-curl-anonimo.txt` | curl sin credenciales: 200 y content type de lo nuevo, 404 de los viejos, el bucket no se lista | raíz 403, JSON API 401; los 7 viejos 404; control 404/200 |
| `publico-*-verificar-capacidades.txt` y las capturas | las cuatro combinaciones en la URL pública, con un navegador sin credenciales | VERDE en `index.html` e `inspect.html` |

**Caché:** los objetos salen con `cache-control: public, max-age=3600`, así que un navegador que
abrió la demo antes de la publicación puede tener hasta una hora de `js/` viejo. Con recargar sin
caché alcanza.

Primer intento del comparador de md5: dio 0 comparados, porque el `url` del listado trae el sufijo
`#<generación>`. El conteo obligatorio lo marcó en rojo, y se corrigió leyendo `metadata.name`.
