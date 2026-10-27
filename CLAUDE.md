# hls-non-linear-ads-demo

The library that draws non-linear advertising over a programme that never stops, and
the demos that show it. David Hassoun presents it at Apple's event on 2026-10-07.

## Where this project's rules live

**Not here.** This file is the orientation; what governs the work lives in four places,
and knowing which is which is worth more than reading any of them first:

| | |
| --- | --- |
| `README.md` | what the library is and how it is integrated |
| `.project/PROJECT.md` | the scope, the dates and who does what |
| `.project/decisions/` | **the decisions, numbered**. When something in the code looks arbitrary, the reason is here |
| the header comments of `lib/*.js`, `hls/*.js`, `dash/*.js` and of the pages | **the real documentation**. They are long on purpose and they explain why, not what |

The order for understanding why something is the way it is: the file's own comment,
then the ADR it names, then the phase that opened it.

Note on language: code, comments, READMEs and this file are in English. Everything
under `.project/` is deliberately in Spanish, because it is the work log written with
Nicolás and rewriting it would break its traceability.

## Where the demos are published

All five are **public on the internet**, on Google Cloud Storage, project
`cto-assistant-501315`, served as static files with no server:

| demo | URL |
| --- | --- |
| `demo/hydration-break/` | https://qualabs-hls-demo-hydration-break.storage.googleapis.com/index.html |
| `demo/multiview-offer/` | https://qualabs-hls-demo-multiview-offer.storage.googleapis.com/index.html |
| `demo/compatibility-pair/` | https://qualabs-hls-demo-compatibility-pair.storage.googleapis.com/index.html |
| `demo/race-multiview/` | https://qualabs-hls-demo-race-multiview.storage.googleapis.com/index.html |
| `demo/stage-pair/` | https://qualabs-hls-demo-stage-pair.storage.googleapis.com/index.html |

One bucket per demo, `US-CENTRAL1`, uniform access, `allUsers` holding
`roles/storage.legacyObjectReader`: **objects are readable and the bucket is not
listable**.

### What you need to know to publish again, and cannot work out by looking

**Every push to `main` publishes the demos it changed** (`.github/workflows/publicar.yml`),
with `scripts/publicar.sh <demo>... | --all`, which also runs by hand: a dry run without
`--publicar`, and the checks it runs are described in its header. It publishes HEAD, never the
working tree, and it does every step below and verifies the result without credentials. The
workflow authenticates through Workload Identity Federation, set up by
`scripts/configurar-wif.sh`; there is no key anywhere.

**`content/` is not in git, so CI never uploads it.** The bucket's `content/` stays as it is,
except for the signalled playlists that `senalizar-contenido.sh` writes there. After
re-packaging a demo, its content goes up by hand: `scripts/publicar.sh --publicar
--con-contenido <demo>`, from a checkout that has it.

**The DASH side of `stage-pair` (phase 19) goes up by hand too**: its segments, its MPDs and
the signalled MPD are all in `content/`, so after `demo/stage-pair/scripts/empaquetar-dash.sh`
it is `scripts/publicar.sh --publicar --con-contenido stage-pair`. Until then a dry run of
`stage-pair` checks the references of the DASH envelopes against the bucket, where they are not,
and goes red, which is the right answer. The DASH build and dash.js go only to the demos in the
`DASH` list of `publicar.sh`.

**Anything with a fixed name is served with `Cache-Control: no-cache`**, because the default
is a public hour and the Google edge keeps serving the old file for that hour; and in
`stage-pair` **the creative videos carry a hash of their content in the path**
(`content/creatives/<piece>/<hash>/`, written by `scripts/versionar-creativo.sh` and recorded in
`stage.json`), so a new video is a URL no cache has seen. The bucket is the tree: what is no
longer in the published tree is deleted from it.

**One bucket per demo, and the bucket goes in the HOST.** The pages and the signalling
ask for everything from the root: `/dist/`, `/vendor/`, `"URI": "/content/…"`,
`X-ASSET-LIST="/signalling/…"`. With the path-style URL
(`storage.googleapis.com/<bucket>/…`) the bucket name takes the first path segment and
**every one of those breaks**: the page loads and the video does not. With the
virtual-hosted style (`https://<bucket>.storage.googleapis.com/…`) the root is the root
again. That is also why a bucket name here cannot contain dots, which break the
certificate.

**The root of the host returns 403, and that is correct.** It is a request to list the
bucket, and listing is denied on purpose. The URL ends in `/index.html`. Serving the
index at `/` would take a custom domain and a load balancer.

**Nothing is rewritten to make it work.** What is published is byte for byte what was
tested: a deployed demo that differs from the tested one stops proving the thing it
claims to prove, and that claim is what these demos are for. If a deploy path requires
editing the demo, the path is wrong.

**Each bucket holds the demo folder at its root, plus `dist/` and `vendor/`**, which are
the two `server.mjs` mounts from the root. Rebuild `dist/` with
`./scripts/construir-libreria.sh` before uploading.

**A `.ts` needs its content type set by hand.** Google guesses
`text/vnd.trolltech.linguist`, which is Qt's translation format, from the extension. It
has to be `video/mp2t`. Every other type comes out right on its own.

**`gcloud storage rsync -x` anchors its regex at the start of the path**, and it is the
same trap as the content type: it fails silently, because nothing warns you that a pattern
matched nothing. `gcloud` evaluates the pattern against the relative path with `re.match`,
so `^content/\.fuentes/` works and `scripts/__pycache__/` never matches anything in the
middle of a path. The one that works is `.*__pycache__/`. A `.pyc` was published this way
once and had to be deleted by hand.

**`content/.fuentes/` is NOT published**, for two independent reasons: no page ever asks
for it, and the Pexels License advises against redistributing the original file. It is
the difference between 1.3 GB and 229 MB. The packaged derivatives do not carry that
problem.

**Public access is verified without credentials.** A `curl` carrying the environment's
token proves that you can see it, not that anybody else can.

## What is not touched without saying so

**The demos served on 8080, 8081 and 8082** belong to Nicolás's own runs and he uses
them to watch. A worker starts its own on another port and stops it by the PID it kept.

**`./run.sh` rebuilds `dist/` on every start**, so running it while someone is editing
`lib/` puts half-written code into every demo being served.
