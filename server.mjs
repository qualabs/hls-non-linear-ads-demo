// A static file server, and nothing else. There is no ad server and no APS in
// this demo (ADR 0005): the media playlists, the segments and the asset-lists
// are files on disk.
//
// It is 40 lines of node:http rather than `python3 -m http.server` for one
// reason: the Content-Type of a media playlist. Python answers
// application/octet-stream for .m3u8, which hls.js tolerates but a browser's
// network tab reports as a download, and this demo is going to be recorded
// with that tab open.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = import.meta.dirname;
const PORT = Number(process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.mp4': 'video/mp4',
  '.m4s': 'video/iso.segment'
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith('/')) path += 'index.html';
  // normalize() collapses the ../ of a path traversal before it is joined.
  const file = join(ROOT, normalize(path));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
  try {
    const s = await stat(file);
    if (!s.isFile()) throw new Error('not a file');
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] || 'application/octet-stream',
      'content-length': s.size,
      // The demo is reloaded dozens of times while it is being built and the
      // playlists are rewritten between reloads.
      'cache-control': 'no-store'
    });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + path);
  }
}).listen(PORT, () => {
  console.log(`hls-non-linear-ads-demo: http://localhost:${PORT}/`);
});
