// Coteja las cajas dibujadas en la galería contra los `viewport` del asset-list.
// Correr desde la raíz del repositorio: node <esta carpeta>/cotejo.mjs
import { readFileSync } from 'node:fs';
const lista = JSON.parse(readFileSync('demo/hydration-break/signalling/asset-list-hydration-break.json', 'utf8'));
const medido = JSON.parse(readFileSync(new URL('./medicion-galeria.json', import.meta.url), 'utf8'));

// Lo declarado: por asset, las cajas que el asset-list escribe. El bloque ausente
// (el lineal) y el primaryContent ausente (los dos overlays) son los dos defaults
// del ADR 0004 / 0014, que la librería aplica y la página no re-implementa.
const declarado = lista.ASSETS.map((a) => {
  const item = a['X-AD-CREATIVE-SIGNALING']?.payload?.[0];
  if (!item) return { fuente: 'sin bloque: lineal sintetizado (ADR 0019)', cajas: ['0 0 0 0', '0 0 0 0'] };
  const cajas = item.layout.assets.map((e) => e.viewport);
  const primario = item.layout.primaryContent?.viewport ?? '0 0 0 0 (default de la capa, ADR 0004)';
  return { fuente: `asset-list: ${item.type}`, cajas: [primario, ...cajas] };
});

let mal = 0;
for (const [ancho, m] of Object.entries(medido)) {
  console.log(`== ${ancho} ==`);
  m.cards.forEach((card, i) => {
    const dibujadas = card.boxes.map((b) => b.inset).sort();
    const esperadas = declarado[i].cajas.map((v) => v.replace(/ \(.*\)$/, '')).sort();
    const ok = JSON.stringify(dibujadas) === JSON.stringify(esperadas);
    if (!ok) mal += 1;
    console.log(`  ${ok ? 'IGUAL' : 'DISTINTO'}  ${card.caption.split('\n')[0]}`);
    console.log(`         declarado en ${declarado[i].fuente}: ${declarado[i].cajas.join(' | ')}`);
    console.log(`         dibujado en la ficha:                ${card.boxes.map((b) => `${b.id} ${b.inset}${b.primary ? ' (primario)' : ''}`).join(' | ')}`);
  });
}
console.log(mal === 0 ? '\nlas cajas dibujadas son las declaradas, en los dos anchos' : `\n${mal} ficha(s) no coinciden`);
process.exit(mal === 0 ? 0 : 1);
