# T-20 — evidencia

- `diagnostico-red.py`: el registro de red del navegador y los eventos de hls.js en el break A.
  Contra lo publicado antes: el XHR `asset-list-break-a.json?_HLS_primary_id=…` termina en 200,
  `ASSET_LIST_LOADING` sí y `ASSET_LIST_LOADED` no, con un `internalException` no fatal en el medio
  ("Cannot read properties of undefined (reading 'length')").
- `publicado-antes-panel-tras-a.png`: el control, el panel publicado antes, vacío después de A.
- `local-panel-tras-*.png` y `publico-panel-tras-*.png`: el panel después de A y de B.
- `publico-medir-a-nativo.txt`: `test/medir-a-nativo.py` contra la URL pública.
