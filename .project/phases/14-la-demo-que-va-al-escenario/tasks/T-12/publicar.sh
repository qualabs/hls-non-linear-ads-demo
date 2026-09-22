#!/usr/bin/env bash
# La publicación de demo/stage-pair en gs://qualabs-hls-demo-stage-pair, y su verificación.
#
# POR QUÉ ESTE ARCHIVO EXISTE Y NO ES UN PÁRRAFO EN UN INFORME: la T-12 se corrió el
# 2026-09-22 sin autorización para publicar, así que dejó el camino escrito, probado hasta
# donde se puede probar sin tocar GCS, y detrás de una bandera. Cuando llegue el OK de
# Nicolás es `./publicar.sh --publicar` desde la raíz del repositorio y nada más.
#
# SIN BANDERA CORRE EN SECO: no crea el bucket, no sube nada, no toca ningún objeto. Sólo
# comprueba lo que se puede comprobar de antemano, que es casi todo menos el propio PUT.
#
# LAS CUATRO COSAS QUE NO SE DEDUCEN MIRANDO, y que el CLAUDE.md de la raíz documenta:
#   1. EL BUCKET VA EN EL HOST Y NO EN EL PATH. Las páginas y la señalización piden todo
#      desde la raíz (/dist/, /vendor/, "URI": "/content/..."). Con la URL path-style el
#      nombre del bucket se come el primer segmento y la página carga pero el video no.
#   2. LA RAÍZ DEL HOST DEVUELVE 403 A PROPÓSITO: es un pedido de listar el bucket, y
#      listar está denegado. La URL termina en /index.html.
#   3. UN .ts NECESITA SU CONTENT-TYPE A MANO. Google adivina text/vnd.trolltech.linguist
#      --el formato de traducción de Qt-- por la extensión. Tiene que ser video/mp2t.
#      Los .svg NO: salen image/svg+xml solos, medido el 2026-09-22 contra los .svg ya
#      publicados en los otros tres buckets. Igual se verifican, que es distinto de asumir.
#   4. `gcloud storage rsync -x` ANCLA SU REGEX AL PRINCIPIO DEL PATH RELATIVO. Está en su
#      propio código: googlecloudsdk/command_lib/storage/regex_util.py usa re.match. Por eso
#      el patrón de __pycache__ es `.*__pycache__/` y no `(^|/)__pycache__/`, que en la
#      fase 13 no excluyó nada y dejó un .pyc publicado que hubo que borrar a mano.
set -euo pipefail
cd "$(dirname "$0")/../../../../.."   # la raíz del repositorio

BUCKET=qualabs-hls-demo-stage-pair
PROYECTO=cto-assistant-501315
EXCLUIR='.*__pycache__/|^content/\.fuentes/'
HOST="https://$BUCKET.storage.googleapis.com"
PUBLICAR=0
[ "${1:-}" = "--publicar" ] && PUBLICAR=1
# --control planta dos referencias que NO existen para ver el chequeo del paso 1 ponerse rojo.
# Un chequeo que no se vio fallar no es un chequeo, y éste afirma un cero.
CONTROL=""
[ "${1:-}" = "--control" ] && CONTROL="/content/no-existe.m3u8 /dist/no-existe.js"

echo "== 0. en seco: el patrón de exclusión, contra rutas plantadas y contra el árbol real =="
python3 - "$EXCLUIR" <<'PY'
import os,re,sys
rx=re.compile(sys.argv[1]); root='demo/stage-pair'
for c in ['scripts/__pycache__/x.pyc','content/.fuentes/Sparks.mp4','content/primary/seg000.ts']:
    print("   %-40s -> %s" % (c,"EXCLUIDO" if rx.match(c) else "sube"))
f=[os.path.relpath(os.path.join(d,n),root) for d,_,ns in os.walk(root) for n in ns]
sube=[p for p in f if not rx.match(p)]
b=sum(os.path.getsize(os.path.join(root,p)) for p in sube)
print("   sube %d de %d archivos, %.1f MB;  .ts=%d  .svg=%d"
      % (len(sube),len(f),b/1e6,sum(p.endswith('.ts') for p in sube),sum(p.endswith('.svg') for p in sube)))
PY

echo "== 1. en seco: toda referencia absoluta de las páginas y los asset-lists existe en disco =="
python3 - $CONTROL <<'PY'
import os,re,sys
root='demo/stage-pair'; rx=re.compile(r'["\'(]\s*(/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+)'); refs=set(sys.argv[1:])
for d,_,ns in os.walk(root):
    if '/.fuentes' in d: continue
    for n in ns:
        if n.endswith(('.html','.js','.json','.m3u8','.css')):
            for m in rx.finditer(open(os.path.join(d,n),encoding='utf-8',errors='ignore').read()):
                refs.add(m.group(1))
falta=[u for u in refs if not os.path.exists(('.' if u.startswith(('/dist/','/vendor/')) else root)+u)]
print("   %d referencias, %d sin archivo" % (len(refs),len(falta)))
for u in falta: print("   FALTA",u)
raise SystemExit(1 if falta else 0)
PY

if [ "$PUBLICAR" = 0 ]; then
  echo
  echo "== EN SECO: hasta acá llega sin tocar GCS. Lo que falta, con el OK de Nicolás: =="
  cat <<EOF
   gcloud storage buckets create gs://$BUCKET --project=$PROYECTO --location=US-CENTRAL1 --default-storage-class=STANDARD --uniform-bucket-level-access
   gcloud storage buckets add-iam-policy-binding gs://$BUCKET --member=allUsers --role=roles/storage.legacyObjectReader
   ./scripts/construir-libreria.sh
   gcloud storage rsync -r -x '$EXCLUIR' demo/stage-pair gs://$BUCKET
   gcloud storage cp -r dist vendor gs://$BUCKET/
   gcloud storage objects update "gs://$BUCKET/content/**/*.ts" --content-type=video/mp2t
   $0 --publicar   # los corre todos y después verifica
EOF
  exit 0
fi

echo "== 2. el bucket, con la misma forma que los otros cuatro =="
gcloud storage buckets create "gs://$BUCKET" --project="$PROYECTO" --location=US-CENTRAL1 \
  --default-storage-class=STANDARD --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member=allUsers \
  --role=roles/storage.legacyObjectReader >/dev/null
gcloud storage buckets describe "gs://$BUCKET" \
  --format="yaml(name,location,location_type,default_storage_class,uniform_bucket_level_access,public_access_prevention)"

echo "== 3. dist/ se reconstruye antes de subir =="
./scripts/construir-libreria.sh

echo "== 4. la carpeta de la demo en la raíz del bucket, más los dos mounts del sdk =="
gcloud storage rsync -r -x "$EXCLUIR" demo/stage-pair "gs://$BUCKET"
gcloud storage cp -r dist vendor "gs://$BUCKET/"

echo "== 5. el content-type de cada .ts, a mano =="
gcloud storage objects update "gs://$BUCKET/content/**/*.ts" --content-type=video/mp2t

echo "== 6. verificación SIN CREDENCIALES: curl no manda ningún token =="
for p in /index.html /inspect.html /race.html /dist/qualabs-concurrent-hls.js /vendor/hls.min.js \
         /content/primary/con-daterange-rica.m3u8 /content/primary/seg000.ts \
         /graphics/campaigns/zumbra-16x9.svg; do
  printf '   %-45s -> %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code} %{content_type}' "$HOST$p")"
done
printf '   %-45s -> %s  (403 es lo correcto: listar está denegado)\n' "/" "$(curl -s -o /dev/null -w '%{http_code}' "$HOST/")"
printf '   %-45s -> %s  (control negativo del instrumento)\n' "/no-existe" "$(curl -s -o /dev/null -w '%{http_code}' "$HOST/no-existe")"

echo "== 7. los objetos, por md5 contra el archivo local =="
python3 - "$BUCKET" <<'PY'
import base64,hashlib,os,subprocess,sys
b=sys.argv[1]; root='demo/stage-pair'
malos=0; n=0
out=subprocess.run(['gcloud','storage','ls','-r','--json',f'gs://{b}/**'],capture_output=True,text=True).stdout
import json
for o in json.loads(out):
    url=o['url']; md=o.get('metadata',{}).get('md5Hash')
    rel=url.split(f'gs://{b}/',1)[1]
    loc=os.path.join(root,rel) if not rel.startswith(('dist/','vendor/')) else rel
    if not md or not os.path.isfile(loc): continue
    n+=1
    if base64.b64decode(md).hex()!=hashlib.md5(open(loc,'rb').read()).hexdigest():
        malos+=1; print("   MD5 DISTINTO:",rel)
print(f"   {n} objetos comparados por md5, {malos} distintos")
raise SystemExit(1 if malos else 0)
PY
echo "LISTO: $HOST/index.html"
