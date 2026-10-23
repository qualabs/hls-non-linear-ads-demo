#!/usr/bin/env python3
"""publicar.py -- the analysis half of scripts/publicar.sh, which does the gcloud half.

It never talks to GCS with credentials: it reads the listings that publicar.sh
writes (`gcloud storage ls --json`), and its HTTP check goes through urllib with
no token at all, which is the only way to prove that ANYBODY can read a demo.

Subcommands (all paths are what publicar.sh passes):

  regex noncontent | content <demo>   the exclusion patterns, printed for gcloud -x
  selftest                            the patterns against planted paths
  check <stage> <state> <derived-out> [<control-ref>...]
  fixes <stage> <listing> <ts-out> <nocache-out>
  verify <stage> <listing> <derived> [<content>]
  http <stage> <host> <derived>

<stage> is the demo as it is in HEAD, with dist/ and vendor/ copied in and the
playlists of content/ hydrated next to it, after its senalizar-contenido.sh ran.
<state> is where content/ really is: a bucket listing (.json), or a local
content/ folder when the content is being published too.
"""
import base64
import concurrent.futures
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request

# gcloud evaluates -x with re.match against the path relative to the source,
# so every pattern is anchored at the start (see the CLAUDE.md of the project).
# NONCONTENT is the sync of the demo tree: content/ is left out of it in BOTH
# directions, which is what keeps --delete-unmatched-destination-objects from
# touching the video that is not in git.
NONCONTENT = r'.*__pycache__/|^content/'
# CONTENT is relative to content/ itself. stage-pair keeps two old signalled
# playlists on disk that are not published (phase 15).
CONTENT = {
    'stage-pair': r'.*__pycache__/|^\.fuentes/|^\.work/|^primary/con-daterange-(rica|magra)\.m3u8$',
}
CONTENT_DEFAULT = r'.*__pycache__/|^\.fuentes/|^\.work/'
# What has a fixed name and can change is served with no-cache: every object
# outside content/, and these extensions inside it. `.mp4` since phase 17 (ADR 0099):
# the progressive twin of a creative is `progressive.mp4` next to its HLS, and the hash
# of a stage-pair directory covers the HLS segments, not the parameters of the MP4.
MUTABLE = ('.html', '.js', '.css', '.json', '.m3u8', '.svg', '.mp4')


def no_cache(name):
    """Whether an object of the bucket is served with Cache-Control: no-cache."""
    return not name.startswith('content/') or name.endswith(MUTABLE)
# What a page, a script or an asset-list asks for: absolute from the root of the
# host (/content/..., /dist/...) or relative to it (content/... in stage.json).
REF = re.compile(r'["\'(`]\s*(/?(?:content|dist|vendor|signalling|graphics|brand|audio|css|js)/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+)')
SCANNED = ('.html', '.js', '.json', '.css', '.m3u8')
# A playlist with EXT-X-DEFINE:QUERYPARAM is one file for both break classes, and
# each client asks for it with its class in the query (ADR 0113).
QUERYPARAM = re.compile(r'^#EXT-X-DEFINE:QUERYPARAM="([^"]+)"', re.M)
CLASSES = ('com.apple.hls.interstitial', 'com.qualabs.hls.concurrentInterstitial')


def md5_file(p):
    return hashlib.md5(open(p, 'rb').read()).hexdigest()


def tree(root, skip_content=True):
    """{relative path: absolute path} of the files under root."""
    out = {}
    for d, dirs, names in os.walk(root):
        rel_d = os.path.relpath(d, root)
        if skip_content and (rel_d == 'content' or rel_d.startswith('content' + os.sep)):
            dirs[:] = []
            continue
        for n in names:
            p = os.path.join(d, n)
            out[os.path.relpath(p, root)] = p
    return out


def listing(path):
    """{object name: metadata} of a `gcloud storage ls --json` dump."""
    return {o['metadata']['name']: o['metadata'] for o in json.load(open(path))}


def remote_md5(meta):
    return base64.b64decode(meta['md5Hash']).hex()


def content_state(state, demo):
    """{content/<path>: md5} of what content/ holds where it really is."""
    rx = re.compile(CONTENT.get(demo, CONTENT_DEFAULT))
    if state.endswith('.json'):
        return {n: remote_md5(m) for n, m in listing(state).items() if n.startswith('content/')}
    return {'content/' + r: md5_file(p) for r, p in tree(state, skip_content=False).items()
            if not rx.match(r)}


def derived(stage, state, demo):
    """The files of content/ the stage produced (its signalled playlists) that differ
    from what content/ holds: the only part of content/ a push can change."""
    rx = re.compile(CONTENT.get(demo, CONTENT_DEFAULT))
    have = content_state(state, demo)
    out = []
    for r, p in tree(os.path.join(stage, 'content'), skip_content=False).items():
        if rx.match(r):
            continue
        if have.get('content/' + r) != md5_file(p):
            out.append('content/' + r)
    return sorted(out)


def playlist_uris(text):
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith('#'):
            yield from re.findall(r'URI="([^"]+)"', line)
        else:
            yield line


def cmd_regex(kind, demo=None):
    print(NONCONTENT if kind == 'noncontent' else CONTENT.get(demo, CONTENT_DEFAULT))


def cmd_selftest():
    nc, ct = re.compile(NONCONTENT), re.compile(CONTENT['stage-pair'])
    cases = [  # (pattern, path, must be excluded)
        (nc, 'scripts/__pycache__/x.pyc', True), (nc, 'test/__pycache__/y.pyc', True),
        (nc, 'content/primary/seg000.ts', True), (nc, 'index.html', False),
        (nc, 'signalling/asset-list-offer.json', False), (nc, 'js/content/x.js', False),
        (ct, '.fuentes/Sparks.mp4', True), (ct, 'primary/con-daterange-rica.m3u8', True),
        (ct, 'primary/seg000.ts', False), (ct, 'primary/con-daterange.m3u8', False),
    ]
    bad = 0
    for rx, p, want in cases:
        got = bool(rx.match(p))
        bad += got != want
        print('   %-44s %s%s' % (p, 'excluded' if got else 'published', '' if got == want else '   <-- WRONG'))
    caching = [  # (object, must be served with no-cache)
        ('index.html', True), ('graphics/campaigns/zumbra-backplate-fijo.png', True),
        ('content/creatives/zumbra-16x9/d8eabbdae4/progressive.mp4', True),
        ('content/adL/progressive.mp4', True), ('content/primary/index.m3u8', True),
        ('content/primary/seg000.ts', False), ('content/adBanner/creative.png', False),
    ]
    for p, want in caching:
        got = no_cache(p)
        bad += got != want
        print('   %-44s %s%s' % (p, 'no-cache' if got else 'cached an hour', '' if got == want else '   <-- WRONG'))
    return 1 if bad else 0


def cmd_check(stage, state, derived_out, *control):
    demo = os.path.basename(os.path.normpath(stage))
    files = tree(stage)
    have = content_state(state, demo)
    new = derived(stage, state, demo)
    open(derived_out, 'w').write(''.join(n + '\n' for n in new))
    exists = lambda r: r in files or r in have or r in new
    refs = {}
    for r, p in files.items():
        if r.endswith(SCANNED) and not r.startswith(('scripts/', 'test/', 'dist/', 'vendor/')):
            for m in REF.finditer(open(p, encoding='utf-8', errors='ignore').read()):
                refs.setdefault(m.group(1).lstrip('/'), r)
    for c in control:
        refs[c.lstrip('/')] = '--control'
    missing = [(u, src) for u, src in sorted(refs.items()) if not exists(u)]
    # Every playlist a page reaches, followed down to its segments.
    seen, todo, segs = set(), [u for u in refs if u.endswith('.m3u8') and exists(u)], 0
    while todo:
        pl = todo.pop()
        if pl in seen:
            continue
        seen.add(pl)
        local = os.path.join(stage, pl)
        if not os.path.isfile(local):
            missing.append((pl, 'playlist not hydrated'))
            continue
        for u in playlist_uris(open(local, encoding='utf-8', errors='ignore').read()):
            if re.match(r'^[a-z]+://', u):
                continue
            u = u.split('?')[0]
            t = u.lstrip('/') if u.startswith('/') else os.path.normpath(os.path.join(os.path.dirname(pl), u))
            if not exists(t):
                missing.append((t, pl))
            elif t.endswith('.m3u8'):
                todo.append(t)
            else:
                segs += 1
    print(f'   {len(files)} files to publish outside content/, {len(new)} signalled files of content/ that change')
    print(f'   {len(refs)} references, {len(seen)} playlists followed, {segs} segments; {len(missing)} missing')
    for u, src in missing[:40]:
        print(f'     MISSING {u}   (from {src})')
    return 1 if missing or not files or not refs else 0


def cmd_fixes(stage, path, ts_out, nocache_out):
    remote = listing(path)
    bucket = json.load(open(path))[0]['url'].split('/')[2]
    ts = [n for n, m in remote.items() if n.endswith('.ts') and m.get('contentType') != 'video/mp2t']
    nc = [n for n, m in remote.items() if no_cache(n) and m.get('cacheControl') != 'no-cache']
    open(ts_out, 'w').write(''.join(f'gs://{bucket}/{n}\n' for n in ts))
    open(nocache_out, 'w').write(''.join(f'gs://{bucket}/{n}\n' for n in nc))
    print(f'   metadata to fix: {len(ts)} .ts without video/mp2t, {len(nc)} objects without no-cache')
    return 0


def cmd_verify(stage, path, derived_list, content=None):
    """With <content> (--con-contenido), content/ is compared too, and what the bucket
    has in content/ that the local one does not is extra."""
    remote = listing(path)
    local = tree(stage)
    demo = os.path.basename(os.path.normpath(stage))
    if content:
        rx = re.compile(CONTENT.get(demo, CONTENT_DEFAULT))
        local.update({'content/' + r: p for r, p in tree(content, skip_content=False).items() if not rx.match(r)})
    for r in open(derived_list).read().split():
        local[r] = os.path.join(stage, r)
    differ = [r for r in local if r in remote and remote_md5(remote[r]) != md5_file(local[r])]
    absent = [r for r in local if r not in remote]
    extra = sorted(n for n in remote if (content or not n.startswith('content/')) and n not in local)
    cached = [n for n, m in remote.items() if no_cache(n) and m.get('cacheControl') != 'no-cache']
    ts = [n for n, m in remote.items() if n.endswith('.ts') and m.get('contentType') != 'video/mp2t']
    print(f'   {len(local)} files, {len(remote)} objects: {len(differ)} differ, {len(absent)} absent, '
          f'{len(extra)} extra, {len(cached)} cacheable, {len(ts)} .ts without video/mp2t')
    for r in (differ + absent + extra + cached + ts)[:40]:
        print('     ', r)
    # The instrument: two files that differ have to compare as different.
    control = remote_md5(remote['index.html']) != md5_file(local['dist/qualabs-concurrent-hls.js'])
    print(f"   control: remote index.html against local dist js -> {'DIFFERENT' if control else 'EQUAL (broken instrument)'}")
    return 0 if local and control and not (differ or absent or extra or cached or ts) else 1


def cmd_http(stage, host, derived_list):
    """Without credentials and without cache-busting: what anybody gets."""
    local = tree(stage)
    pick = [r for r in local if ('/' not in r and r.endswith('.html')) or r.startswith('signalling/')
            or r in ('dist/qualabs-concurrent-hls.js', 'vendor/hls.min.js')]
    pick += open(derived_list).read().split()

    def get(path):
        try:
            with urllib.request.urlopen(urllib.request.Request(f'{host}/{path}'), timeout=30) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, b''

    def one(r):
        code, body = get(r)
        ok = code == 200 and hashlib.sha256(body).digest() == hashlib.sha256(open(os.path.join(stage, r), 'rb').read()).digest()
        return r, code, ok

    bad = 0
    with concurrent.futures.ThreadPoolExecutor(16) as ex:
        for r, code, ok in sorted(ex.map(one, sorted(set(pick)))):
            bad += not ok
            if not ok:
                print(f'     {code} DIFFERENT {r}')
    print(f'   {len(set(pick))} URLs against the repo, {bad} different')
    # A playlist that declares EXT-X-DEFINE:QUERYPARAM is asked for with the break
    # class in its query (ADR 0113): the bucket has to serve the same bytes with it.
    ask = []
    for r, p in tree(os.path.join(stage, 'content'), skip_content=False).items():
        if r.endswith('.m3u8'):
            m = QUERYPARAM.search(open(p, encoding='utf-8', errors='ignore').read())
            if m:
                ask += [('content/' + r, f'{m.group(1)}={c}') for c in CLASSES]
    qbad = 0
    for r, q in sorted(ask):
        code, body = get(f'{r}?{q}')
        if code != 200 or body != open(os.path.join(stage, r), 'rb').read():
            qbad += 1
            print(f'     {code} DIFFERENT {r}?{q}')
    print(f'   {len(ask)} playlist URLs with the class in the query, {qbad} different')
    bad += qbad
    root, missing = get('')[0], get('no-existe.json')[0]
    print(f'   /                -> {root}  (403: listing is denied on purpose)')
    print(f'   /no-existe.json  -> {missing}  (control: a 404 has to be seen as one)')
    return 0 if bad == 0 and root == 403 and missing == 404 and pick else 1


if __name__ == '__main__':
    cmd, args = sys.argv[1], sys.argv[2:]
    sys.exit(globals()['cmd_' + cmd](*args) or 0)
