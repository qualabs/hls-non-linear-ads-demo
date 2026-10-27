# T-08 — `verificar-pares.py`: HLS contra DASH, con sus dos controles

Rama `fase-19`, `6212c5e`. `verificar-pares.py --solo-dash` (`verificar-dash.log`): **VERDE**, 64
chequeos.

En cada uno de los 4 pares (`ours-<n>dec-<img|noimg>` contra `dash-<igual>`), por break, dentro del
mismo armado (cada salto rearma los dos panes):

- la opción **presentada** (después del failover del renderer): mismo layout y mismo medio, una
  playlist y un MPD cuentan como el mismo video — pre, A, B y C;
- la **ventana** de ese break en el contrato de cada pane, al milisegundo (tolerancia 0,05 s);
- la **query** con que cada pane pidió su lista (ASSET-LIST / `$remote.slots`): los mismos `sgai-*`;
- **B (ONCE)**: después de salir y volver a buscar adentro, ninguno lo dibuja y su ventana sale de
  las dos barras;
- el **lineal tradicional** en pantalla en los dos (HLS: hls.js; DASH: la librería), y los dos
  vuelven al programa pasado el corte;
- el **post-roll**: los dos presentan su default lineal después del programa.

Extracto, 1 decodificador sin imágenes:

```
ok   break a: the same presented in both (nothing)
ok   break b: the same presented in both ([{'type': 'linear', 'media': ['linear']}])
ok   window of b: HLS ('concurrent', 65, 12)  DASH ('concurrent', 65, 12)
ok   request of b: HLS ?sgai-image-over-video=0&sgai-video-decoders=1  DASH ?sgai-image-over-video=0&sgai-video-decoders=1
ok   B (ONCE) after leaving it and seeking back: HLS []  DASH [], its window gone from both bars
ok   the linear break on screen in both: HLS True (programme 150.0)  DASH True (programme 150.3)
```

**Controles**, los dos dan la diferencia que tienen que dar:

```
control: with the MPD of B answered 404, DASH falls to its next option and HLS does not -> HLS [{'type': 'squeezebackLShape', 'media': ['video']}]  DASH [{'type': 'squeezebackLShape', 'media': ['video/mp4']}]  ok
control: in B, DASH 1 dec with images against without -> different
```

El 404 se planta con una ruta de Playwright; no se toca ningún archivo.

## Lo que la primera corrida enseñó del instrumento

`primera-corrida-completa.log` dio 34 rojos en la parte DASH, y eran del instrumento: leía pedidos,
ventanas y el ONCE después de saltos posteriores, y cada salto rearma los panes (estado nuevo). Se
reescribió para medir cada break dentro de su armado. Y el chequeo del post-roll comparaba un campo
que el reporte no tiene (`type`, `None == None`): ahora compara `presented` y exige `linear: true`;
los valores de la corrida verde ya muestran `{'type': 'linear', 'linear': True}` en los dos.

## Hallazgo previo a la fase: la parte vieja (nativo contra ours) no es confiable

En la misma corrida completa, los pares viejos dieron rojo en A y C del pane nativo (hls.js de
fábrica reproduce el lineal KETRAVA donde se espera nada o KOVRIN). El verificador de `bb0d78b`
corrido contra `bb0d78b` (`base-bb0d78b-corrida-1.log`) también da rojo, con otros síntomas (el
pane nuestro sin layout en A) y termina en un timeout. El código de esa parte no cambió en la fase
(sólo `leer_config`, que la parte vieja usa igual). Es anterior: probablemente el pre-roll y el
post-roll, que llegaron después de la fase 15, rompen supuestos del verificador. Queda para el
REPORT.
