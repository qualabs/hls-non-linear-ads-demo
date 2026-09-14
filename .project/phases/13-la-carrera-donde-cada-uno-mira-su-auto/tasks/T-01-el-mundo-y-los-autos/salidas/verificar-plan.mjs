// Chequea que el plan de catorce tomas y race.json digan lo mismo, y en particular
// que la casilla que cubre `ofertaEn` admita el anuncio entero.
// Se le pasa el path de un race.json: con el bueno tiene que dar verde, y con uno
// mutado tiene que dar rojo. Eso ultimo es el control.
import fs from "node:fs";
const r = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
// Las casillas que admiten el anuncio salen del plan de tomas, no de este archivo:
// son las que no tienen choque, entrada a boxes ni bandera. Hoy son las catorce, y
// se listan las dos que importan para que el chequeo pueda dar rojo si alguna cambia.
const ADMITEN = new Set([3, 4]);
const fallas = [];
const n = r.largo / r.clipDura;
if (!Number.isInteger(n)) fallas.push(`largo ${r.largo} no es multiplo de clipDura ${r.clipDura}`);
if (n !== 14) fallas.push(`el plan tiene 14 casillas y race.json pide ${n}`);
const casilla = Math.floor(r.ofertaEn / r.clipDura) + 1;          // 1-based
const desde = (casilla - 1) * r.clipDura;
if (!ADMITEN.has(casilla)) fallas.push(`ofertaEn=${r.ofertaEn} cae en la casilla ${casilla}, que el plan no marca como que admite el anuncio`);
const arranque = r.ofertaEn - r.anuncioLargoMax;
if (arranque < desde) fallas.push(`una linea de ${r.anuncioLargoMax}s arranca en ${arranque}s y la casilla ${casilla} arranca en ${desde}s: el anuncio se derrama`);
if (r.ofertaEn + r.ofertaDura > r.largo) fallas.push(`la ventana cierra en ${r.ofertaEn + r.ofertaDura}s y el programa dura ${r.largo}s`);
const porFeed = r.ofertaDura / r.clipDura;
if (!Number.isInteger(porFeed)) fallas.push(`ofertaDura ${r.ofertaDura} no es multiplo de clipDura`);
if (r.feeds.length !== 6) fallas.push(`el catalogo declara ${r.feeds.length} feeds y la fase pide 6`);
const ids = new Set(r.feeds.map(f => f.id));
if (ids.size !== r.feeds.length) fallas.push("hay ids repetidos en feeds");
console.log(`programa ${r.largo}s = ${n} casillas de ${r.clipDura}s a ${r.fps} fps`);
console.log(`ventana ${r.ofertaEn}..${r.ofertaEn + r.ofertaDura}s = ${porFeed} clips por feed, ${r.feeds.length} feeds`);
console.log(`el segundo ${r.ofertaEn} cae en la casilla ${casilla} (${desde}..${desde + r.clipDura}s); una linea de ${r.anuncioLargoMax}s arranca en ${arranque}s`);
if (fallas.length) { console.log("\nROJO:"); for (const f of fallas) console.log("  - " + f); process.exit(1); }
console.log("\nVERDE: el plan y race.json dicen lo mismo, y el anuncio entra entero en su casilla.");
