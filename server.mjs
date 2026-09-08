// A static file server, and nothing else. There is no ad server and no APS in
// this demo (ADR 0005): the media playlists, the segments and the asset-lists
// are files on disk.
//
// It is a few dozen lines of node:http rather than `python3 -m http.server` for
// one reason: the Content-Type of a media playlist. Python answers
// application/octet-stream for .m3u8, which hls.js tolerates but a browser's
// network tab reports as a download, and this demo is going to be recorded
// with that tab open.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';

// The root of the repository, which is the root of the sdk: the built library
// and the pinned hls.js live here, and this is the only thing they are ever
// resolved against.
const SDK = import.meta.dirname;

// The document root, taken as the first argument
// (`node server.mjs demo/compatibility-pair`). WITHOUT AN ARGUMENT IT IS THE
// ROOT OF THE REPOSITORY, which is exactly what this server served before any
// demo had a folder of its own, so naming a folder is a sum and not a change.
const DOCS = resolve(SDK, process.argv[2] ?? '.');

// THE TWO MOUNTS OF THE SDK, AND THEY ARE NOT UNDER THE FOLDER THAT IS SERVED,
// so a request to the demo answers files that are not below the directory it
// was given. That is the cost of this arrangement and it is written here, which
// is where whoever edits this file will read it. What it buys: the URIs of the
// thirteen asset-lists are absolute from the root of the server
// (`/content/adB/index.m3u8`), so serving the folder of the demo as the root
// leaves those URIs, the signalling script and every relative path of the page
// byte for byte the same (ADR 0022).
const MOUNTS = [
  ['/dist/', join(SDK, 'dist')],
  ['/vendor/', join(SDK, 'vendor')]
];

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

/** The file, or null when it landed outside the root it was resolved against. */
const under = (root, file) => (file === root || file.startsWith(root + sep) ? file : null);

/**
 * The file a request path resolves to, or null when it escapes every root.
 *
 * The traversal guard is the same one as before -- compare the prefix of the
 * resolved path -- over three legitimate roots instead of one. Under a mount it
 * does work it was not doing before: what gets joined there is the REMAINDER of
 * the path, which is RELATIVE, so a `../` that arrived percent-encoded survives
 * normalize() and only this comparison stops it. So
 * `/dist/%2e%2e%2f%2e%2e%2fetc/passwd` is a 403, while the same path written
 * with plain `../` never reaches this function: the URL parser above collapses
 * it into `/etc/passwd` first, and that is a 404 under the document root.
 */
function resolveFile(path) {
  for (const [prefix, root] of MOUNTS) {
    if (path.startsWith(prefix)) {
      return under(root, join(root, normalize(path.slice(prefix.length))));
    }
  }
  // normalize() collapses the ../ of an absolute path before it is joined.
  return under(DOCS, join(DOCS, normalize(path)));
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = resolveFile(path);
  if (file === null) { res.writeHead(403).end('forbidden'); return; }
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
  // Which folder is being served is the first thing to check when the page does
  // not load, so it is printed next to the URL.
  console.log(
    `hls-non-linear-ads-demo: http://localhost:${PORT}/ -- serving ${relative(SDK, DOCS) || '.'}`
  );
});
