# Bitácora de ejecución — fase 14

Registro append-only de la ejecución. Cada entrada con su hora local y su
evidencia. Nació porque el canal de mensajes entre el coordinador y la sesión
que ejecuta falló dos veces, y un archivo sobrevive a que la sesión se caiga.

---

## 2026-09-22 04:05 — la sesión de ejecución se detuvo sin producir, y lo escribe el coordinador

La sesión `hls-fase14` quedó cinco horas sin escribir un archivo y se la bajó.
Esta entrada la escribo yo, el coordinador, porque la sesión nunca llegó a
escribir la suya.

**Lo que sí quedó hecho, y está en disco:**

- **T-01 cerrada.** `tasks/T-01/RECORRIDO.md` y `demo/stage-pair/stage.json`.
- **T-02 cerrada.** `tasks/T-02/VERDICTO.md` y sus cuatro PNG. Verdicto: la
  hipótesis del SVG se confirma y **la premisa del ADR 0084 también** — la
  variante magra deja 1 `<video>` vivo contra 2 de la rica.
- **T-03 a medias.** El insumo bajó y está verificado:
  `demo/stage-pair/content/.fuentes/Sparks_4096x2160_5994fps_SDR.mp4`,
  419.744.507 bytes —el tamaño exacto que el relevamiento midió—, `ffprobe` da
  h264 4096×2160, aac, 229,888 s. **El transcode no se hizo.**

**La cronología, medida y no supuesta:**

```
22:38  la sesión cierra T-02 y escribe su VERDICTO.md
22:42  termina de bajar Sparks (último archivo escrito en toda la corrida)
23:18  CPU 00:03:13 · cero archivos en 25 min · sin ffmpeg corriendo
04:02  CPU 00:11:55 · cero archivos en 5 h 20 · el log de sesión renderea
       el spinner de trabajo de forma continua
04:05  se la baja por el PID que se guardó al lanzarla (1890190)
```

**Qué falló, hasta donde se pudo determinar.** La sesión respondió una vez al
arrancar y después dejó de responder, mientras seguía consumiendo CPU y
renderando el indicador de trabajo. Se descartó por medición: que estuviera
muerta (el proceso vivía), que le faltara el canal (su servidor MCP corría como
hijo del proceso, igual que el de la sesión hermana que sí funcionaba), que
NATS estuviera caído (activo, con seis conexiones abiertas), y que un `ffmpeg`
estuviera corriendo largo (ninguno). **No se determinó la causa.**

**Lo que no pasó, y conviene que esté dicho:** no se tocó `lib/`, ni `dist/`,
ni `scripts/`, ni las cuatro demos existentes. `npm test` daba 193/193 y
`npm run check` `EXIT=0` en el último chequeo. Lo único nuevo fuera de
`.project/` es `demo/stage-pair/`, que es lo que la fase construye.

**Qué sigue:** la T-03 se retoma desde el transcode, con el archivo ya bajado y
verificado. No hay que volver a bajarlo. Y antes de relanzar una sesión de
ejecución conviene decidir el mecanismo, porque éste falló dos veces en una
noche y la segunda sin causa identificada.
