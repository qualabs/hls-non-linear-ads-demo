#!/usr/bin/env bash
# publicar.sh -- publica demo/stage-pair en gs://qualabs-hls-demo-stage-pair y lo
# verifica SIN credenciales. Se corre desde cualquier lado; publicar es una
# decisión de Nicolás, así que este script no se corre sin su OK.
#
# Lo que no se deduce mirando está en el CLAUDE.md del proyecto (el bucket en el
# host, la raíz que da 403, el content type de los .ts, el -x anclado, la
# exclusión de content/.fuentes/). Lo que agrega este script (fase 15):
#
#   LA CACHÉ. El bucket sirve con `cache-control: public, max-age=3600` salvo que
#   se diga otra cosa, y el borde de Google guarda una hora lo que alguien pidió.
#   Se vio: un video rehecho con el mismo nombre se siguió sirviendo viejo. Dos
#   reglas lo cierran:
#     - lo que tiene NOMBRE FIJO y puede cambiar -- páginas, JS, CSS, stage.json,
#       asset-lists, playlists, SVG -- se publica con `no-cache`, así que apunta a
#       lo nuevo apenas se sube;
#     - lo que es PESADO, los videos de los creativos, lleva el contenido en el
#       nombre (scripts/versionar-creativo.sh), así que un video nuevo es una URL
#       que ninguna caché vio nunca.
#
#   EL BUCKET ES EL ÁRBOL. `rsync --delete-unmatched-destination-objects` borra
#   del bucket lo que ya no está en el árbol publicado (versiones viejas de un
#   video, asset-lists que se fueron), y la verificación compara por md5 objeto
#   por objeto, con un conteo que no puede ser cero.
set -euo pipefail
cd "$(dirname "$0")/../../.."   # la raíz del repositorio

BUCKET=gs://qualabs-hls-demo-stage-pair
HOST=https://qualabs-hls-demo-stage-pair.storage.googleapis.com
# Anclado al principio del path relativo: gcloud usa re.match (ver CLAUDE.md).
EXCLUIR='.*__pycache__/|^content/\.fuentes/|^content/\.work/|^content/primary/con-daterange-(rica|magra)\.m3u8$|^dist/|^vendor/'
MUTABLES=("**.html" "**.js" "**.css" "**.json" "**.m3u8" "**.svg")

echo "== 1. dist/ se reconstruye =="
./scripts/construir-libreria.sh

echo "== 2. el árbol de la demo, sin caché, y lo que sobra en el bucket se borra =="
gcloud storage rsync -r -x "$EXCLUIR" --delete-unmatched-destination-objects \
  --cache-control=no-cache demo/stage-pair "$BUCKET"
gcloud storage rsync -r --delete-unmatched-destination-objects --cache-control=no-cache dist "$BUCKET/dist"
gcloud storage rsync -r --delete-unmatched-destination-objects --cache-control=no-cache vendor "$BUCKET/vendor"

echo "== 3. metadatos: los .ts como video/mp2t, y lo mutable sin caché aunque no se haya resubido =="
gcloud storage objects update "$BUCKET/content/**/*.ts" --content-type=video/mp2t >/dev/null
for m in "${MUTABLES[@]}"; do gcloud storage objects update "$BUCKET/$m" --cache-control=no-cache >/dev/null; done

echo "== 4. el bucket contra el árbol, por md5 =="
gcloud storage ls --json "$BUCKET/**" > "${XDG_RUNTIME_DIR:-/tmp}/publicar-objs.json"
python3 - "$EXCLUIR" "${XDG_RUNTIME_DIR:-/tmp}/publicar-objs.json" <<'PY'
import base64, hashlib, json, os, re, sys
rx = re.compile(sys.argv[1]); objs = json.load(open(sys.argv[2])); os.remove(sys.argv[2])
remoto = {o['metadata']['name']: o['metadata'] for o in objs}
local = {}
for d, _, ns in os.walk('demo/stage-pair'):
    for n in ns:
        rel = os.path.relpath(os.path.join(d, n), 'demo/stage-pair')
        if not rx.match(rel): local[rel] = os.path.join(d, n)
for base in ('dist', 'vendor'):
    for d, _, ns in os.walk(base):
        for n in ns: local[os.path.join(d, n)] = os.path.join(d, n)
md = lambda p: hashlib.md5(open(p, 'rb').read()).hexdigest()
faltan = [r for r in local if r not in remoto]
distintos = [r for r in local if r in remoto and base64.b64decode(remoto[r]['md5Hash']).hex() != md(local[r])]
sobran = sorted(r for r in remoto if r not in local)
mutables_con_cache = [r for r in remoto if re.search(r'\.(html|js|css|json|m3u8|svg)$', r)
                      and remoto[r].get('cacheControl') != 'no-cache']
ts_mal = [r for r in remoto if r.endswith('.ts') and remoto[r].get('contentType') != 'video/mp2t']
print(f"   {len(local)} archivos del árbol, {len(remoto)} objetos; comparados {len(local) - len(faltan)}, "
      f"distintos {len(distintos)}, faltan {len(faltan)}, sobran {len(sobran)}")
print(f"   mutables con caché: {len(mutables_con_cache)}; .ts sin video/mp2t: {len(ts_mal)}")
for r in distintos + faltan + sobran + mutables_con_cache + ts_mal: print('     ', r)
control = base64.b64decode(remoto['index.html']['md5Hash']).hex() != md(local['stage.json'])
print(f"   control: index.html remoto contra stage.json local -> {'DISTINTO' if control else 'IGUAL (instrumento roto)'}")
raise SystemExit(0 if local and control and not (faltan or distintos or sobran or mutables_con_cache or ts_mal) else 1)
PY

echo "== 5. SIN credenciales y SIN cache-busting: lo servido contra el repo =="
rojo=0
for p in index.html inspect.html race.html stage.json js/app.js js/inspect.js js/capabilities.js \
         dist/qualabs-concurrent-hls.js content/primary/con-daterange.m3u8 signalling/*.json; do
  f=demo/stage-pair/$p; [ -f "$f" ] || f=$p
  if [ "$(curl -s "$HOST/$p" | sha256sum)" = "$(sha256sum < "$f")" ]; then r=IGUAL; else r=DISTINTO; rojo=1; fi
  printf '   %-46s %s\n' "$p" "$r"
done
# Cada video que un asset-list apunta, con su playlist y todos sus segmentos.
for v in $(grep -ho '"/content/creatives/[^"]*index.m3u8"' demo/stage-pair/signalling/*.json | tr -d '"' | sort -u); do
  d=$(dirname "$v")
  for f in index.m3u8 $(grep -v '^#' "demo/stage-pair$v"); do
    if [ "$(curl -s "$HOST$d/$f" | sha256sum)" = "$(sha256sum < "demo/stage-pair$d/$f")" ]; then :; else
      printf '   %-46s DISTINTO\n' "$d/$f"; rojo=1; fi
  done
  printf '   %-46s IGUAL (playlist y segmentos)\n' "$d/"
done
printf '   %-46s %s  (403: listar está denegado)\n' "/" "$(curl -s -o /dev/null -w '%{http_code}' "$HOST/")"
printf '   %-46s %s  (control del 404)\n' "/no-existe.json" "$(curl -s -o /dev/null -w '%{http_code}' "$HOST/no-existe.json")"
[ "$rojo" = 0 ] || { echo "ROJO: lo servido no coincide con el repo"; exit 1; }
echo "PUBLICADO: $HOST/index.html"
