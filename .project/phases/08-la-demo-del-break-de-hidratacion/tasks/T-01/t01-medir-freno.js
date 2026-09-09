(async () => {
  const d = window.demo;
  const video = document.getElementById('video');
  const scope = document.getElementById('player');
  const adNodes = () => [...scope.querySelectorAll('video')].filter(v => v !== video);
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const read = (tag, label) => ({
    break: label,
    lectura: tag,
    t: +video.currentTime.toFixed(3),
    primarioPausado: video.paused,
    activo: d.provider.activeAt(video.currentTime).map(e => e.itemId + ' / ' + e.type),
    cajas: adNodes().map(v => ({ currentTime: +v.currentTime.toFixed(3), paused: v.paused, readyState: v.readyState }))
  });
  const out = [];
  async function medir(target, label) {
    video.pause();
    video.currentTime = target;
    await wait(1200);
    await video.play().catch(() => {});
    await wait(3000);
    out.push(read('antes-del-pause', label));
    video.pause();
    await wait(400);
    out.push(read('pausa-t0', label));
    await wait(1600);
    out.push(read('pausa-t0-mas-1600ms', label));
    await video.play().catch(() => {});
    await wait(1200);
    out.push(read('despues-del-play', label));
  }
  await medir(98, 'quad (multiView, t=95..107)');
  await medir(147, 'mezclado aviso 3 lineal a cuadro entero (t=144..156)');
  await medir(123, 'mezclado aviso 1 cornerOverlay (t=120..132)');
  return JSON.stringify(out, null, 1);
})()
