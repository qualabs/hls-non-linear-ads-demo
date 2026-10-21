# Diseño: la publicación continua

Pedido de Nicolás, aprobado el 2026-10-20 en el hilo del agente que despachó a `hls-demo-ci`:
cada push a `main` republica las demos en sus buckets públicos, sin claves.

## Lo que se decidió en el despacho

1. Un solo `scripts/publicar.sh <demo>|--all`, versionado, en seco por defecto y `--publicar` para
   actuar, con `--control` que tiene que dar rojo; el mismo a mano y en CI.
2. `.github/workflows/publicar.yml` en push a `main`: build, `npm run check`, `npm test`, y después
   sólo las demos cuyos archivos cambiaron; un cambio en lo compartido republica las cinco.
   `concurrency` para que dos pushes no se pisen. Si algo falla, no se publica nada.
3. Workload Identity Federation: pool y proveedor OIDC con condición sobre el repositorio y
   `refs/heads/main`; una cuenta `hls-demo-publisher` con `roles/storage.objectAdmin` sólo en los
   cinco buckets; `google-github-actions/auth` pineado. Nunca una clave JSON.

## Lo que apareció al mirar, y cómo cambió el diseño

**`content/` no está en git** (`.gitignore`): un checkout de CI no lo tiene y un push no lo puede
cambiar. Publicar el árbol de la demo con borrado, como hacía el script de stage-pair, desde un
checkout de CI borraría el video de los cinco buckets. Por eso: el CI publica lo que está en git y
deja `content/` del bucket como está, fuera del sync en las dos direcciones (ADR 0094). Lo único de
`content/` que un push cambia son las playlists señalizadas, que `senalizar-contenido.sh` escribe ahí
leyendo el empaquetado: el escenario baja del bucket sólo las playlists, corre el script, y sube las
que cambiaron. El contenido se sigue subiendo a mano con `--con-contenido`.

**El publicador vigente no era el de la T-12** sino `demo/stage-pair/scripts/publicar.sh` de la
fase 15 (no-cache, borrado, md5). El nuevo parte de ése y lo reemplaza.

**Los otros cuatro buckets estaban atrasados respecto de `main`**: `multiview-offer` sirve una
versión vieja sin `js/` ni `css/`, y los cuatro tienen un `dist/` viejo y asset-lists distintos. La
primera corrida del CI los pone al día, y eso es un cambio visible en demos públicas.

**Qué demos cambiaron se mide contra la última corrida verde**, no contra el push anterior: con
`concurrency` sin cancelar, GitHub deja una sola corrida pendiente y descarta las del medio, y sus
demos se perderían.

**El lado GCP no lo pude crear**: el clasificador de permisos de esta sesión deniega los comandos de
IAM. Queda `scripts/configurar-wif.sh`, idempotente y con su verificación, para correr con permiso.
Hace falta además habilitar `sts.googleapis.com`, que no estaba.
